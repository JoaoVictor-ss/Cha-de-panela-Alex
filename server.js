const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const items = require("./items");

const app = express();
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

// No Render, aponte DATA_DIR para o disco persistente (ex.: /var/data)
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const FILE = path.join(DATA_DIR, "selecoes.json");
fs.mkdirSync(DATA_DIR, { recursive: true });

let claims = {}; // { itemId: { name, token, at } }
let updatedAt = 0;
try {
  const raw = JSON.parse(fs.readFileSync(FILE, "utf8"));
  claims = raw.claims || raw;
  updatedAt = raw.updatedAt || 0;
} catch {}

// Backup automático em nuvem (para nunca perder as escolhas no plano Free do Render se hibernar/reiniciar)
const CLOUD_OBJ_URL = "https://api.restful-api.dev/objects/ff808181a09d98f701a1e2ba565e35c4";
const CLOUD_NTFY_URL = "https://ntfy.sh/cha_alex_8f92a1c4e7b3d605";

const sseClients = new Set();

function broadcast() {
  for (const res of sseClients) {
    try { res.write("data: update\n\n"); } catch {}
  }
}

function writeLocal() {
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify({ updatedAt, claims }, null, 2));
  fs.renameSync(tmp, FILE);
}

async function syncToCloud() {
  const payload = { updatedAt, claims };
  try {
    await fetch(CLOUD_OBJ_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "cha-alex-selecoes", data: payload }),
    });
  } catch {}
  try {
    await fetch(CLOUD_NTFY_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch {}
}

async function restoreFromCloudIfNeeded() {
  let best = { updatedAt, claims };
  try {
    const r1 = await fetch(CLOUD_OBJ_URL);
    if (r1.ok) {
      const j = await r1.json();
      const d = j && j.data;
      if (d && d.claims && (d.updatedAt || 0) >= best.updatedAt && Object.keys(d.claims).length >= Object.keys(best.claims).length) {
        best = { updatedAt: d.updatedAt || Date.now(), claims: d.claims };
      }
    }
  } catch {}
  try {
    const r2 = await fetch(CLOUD_NTFY_URL + "/json?poll=1&since=all");
    if (r2.ok) {
      const lines = (await r2.text()).trim().split("\n").filter(Boolean);
      if (lines.length) {
        const last = JSON.parse(lines[lines.length - 1]);
        const d = JSON.parse(last.message);
        if (d && d.claims && (d.updatedAt || 0) > best.updatedAt) {
          best = { updatedAt: d.updatedAt, claims: d.claims };
        }
      }
    }
  } catch {}
  if (best.updatedAt > updatedAt || Object.keys(best.claims).length > Object.keys(claims).length) {
    claims = best.claims;
    updatedAt = best.updatedAt;
    writeLocal();
    broadcast();
    console.log("Escolhas restauradas da nuvem:", Object.keys(claims).length, "itens.");
  }
}

function save() {
  updatedAt = Date.now();
  writeLocal();
  broadcast();
  syncToCloud();
}

app.get("/api/ping", (req, res) => res.json({ ok: true, ts: Date.now() }));

app.get("/api/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(": connected\n\n");
  sseClients.add(res);
  const ping = setInterval(() => {
    try { res.write(": ping\n\n"); } catch {}
  }, 25000);
  req.on("close", () => {
    clearInterval(ping);
    sseClients.delete(res);
  });
});

// Senha do painel /admin (pode ser alterada via variável de ambiente ADMIN_PASSWORD no Render)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "alex123";

const validItem = (id) => items.some((i) => i.id === id);

function getCookie(req, key) {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === key) return decodeURIComponent(v.join("="));
  }
  return "";
}

function isAdminReq(req) {
  const key = req.headers["x-admin-password"] || req.query.adminPassword || "";
  return key && key === ADMIN_PASSWORD;
}

app.post("/api/admin/auth", (req, res) => {
  const pwd = String(req.body.password || "");
  if (pwd === ADMIN_PASSWORD) return res.json({ ok: true });
  return res.status(401).json({ error: "Senha incorreta." });
});

app.get("/api/items", (req, res) => {
  const token = req.query.token || getCookie(req, "cha_token");
  const isAdmin = isAdminReq(req);
  res.json(
    items.map((i) => {
      const c = claims[i.id];
      const mine = !!(c && token && c.token === token);
      return {
        ...i,
        image: i.image || (fs.existsSync(path.join(__dirname, "public", "img", i.id + ".jpg")) ? "/img/" + i.id + ".jpg?v=4" : null),
        taken: !!c,
        takenBy: c && (isAdmin || mine) ? c.name : null,
        takenAt: c && isAdmin ? c.at : null,
        mine,
      };
    })
  );
});

app.post("/api/claim", (req, res) => {
  const id = Number(req.body.id);
  const name = String(req.body.name || "").trim().slice(0, 60);
  const token = String(req.body.token || "") || getCookie(req, "cha_token") || crypto.randomUUID();
  if (!validItem(id)) return res.status(400).json({ error: "Item inválido." });
  if (!name) return res.status(400).json({ error: "Informe seu nome." });
  if (claims[id]) return res.status(409).json({ error: "Alguém já escolheu este item." });
  claims[id] = { name, token, at: new Date().toISOString() };
  save();
  res.setHeader("Set-Cookie", `cha_token=${encodeURIComponent(token)}; Max-Age=31536000; Path=/; SameSite=Lax`);
  res.json({ ok: true, token });
});

app.post("/api/release", (req, res) => {
  const id = Number(req.body.id);
  const token = req.body.token || getCookie(req, "cha_token");
  const isAdmin = isAdminReq(req);
  const c = claims[id];
  if (!c) return res.json({ ok: true });
  if (!isAdmin && (!token || c.token !== token))
    return res.status(403).json({ error: "Só quem escolheu pode desmarcar." });
  delete claims[id];
  save();
  res.json({ ok: true });
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
const SELF_URL = process.env.RENDER_EXTERNAL_URL || "https://cha-de-panela-alex.onrender.com";

app.listen(PORT, () => {
  console.log("Rodando na porta " + PORT);
  restoreFromCloudIfNeeded();
  // Auto-ping a cada 10 minutos para evitar hibernação no Render
  setInterval(() => {
    fetch(SELF_URL + "/api/ping").catch(() => {});
  }, 10 * 60 * 1000);
});
