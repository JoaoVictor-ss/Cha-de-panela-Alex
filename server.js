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
try {
  claims = JSON.parse(fs.readFileSync(FILE, "utf8"));
} catch {}

const sseClients = new Set();

function broadcast() {
  for (const res of sseClients) {
    try { res.write("data: update\n\n"); } catch {}
  }
}

function save() {
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(claims, null, 2));
  fs.renameSync(tmp, FILE);
  broadcast();
}

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
app.listen(PORT, () => console.log("Rodando na porta " + PORT));
