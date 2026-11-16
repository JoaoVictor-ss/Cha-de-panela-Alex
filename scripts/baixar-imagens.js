const fs = require("fs");
const path = require("path");
const items = require("../items");

// Custom unambiguous product queries for each item ID (1..74)
const customQueries = {
  1: "kit utensilios de cozinha silicone verde musgo ou preto concha espátula",
  2: "kit facas de cozinha com cepo suporte inox",
  3: "kit tabua de corte descascador ralador peneira cozinha",
  4: "kit xicaras e colheres medidoras cozinha",
  5: "kit abridor de latas garrafas saca rolhas inox cozinha",
  6: "jogo de panelas antiaderente 5 pecas cozinha",
  7: "frigideira antiaderente cozinha",
  8: "panela de pressao 4,5l antiaderente cozinha",
  9: "fervedor leiteira antiaderente cozinha",
  10: "kit formas e assadeiras aluminio retangular redonda forno",
  11: "forma para bolo redonda furo no meio antiaderente",
  12: "travessa refrataria de vidro marinex forno",
  13: "escorredor de macarrao massa inox ou silicone cozinha",
  14: "escorredor lavador de arroz cozinha",
  15: "aparelho de jantar pratos rasos fundos sobremesa",
  16: "kit tigelas bowls cozinha porcelana ou vidro",
  17: "jogo de tacas de vidro agua vinho 6 pecas",
  18: "kit canecas porcelana cafe cha",
  19: "jarra de vidro para suco e agua com tampa",
  20: "saladeira bowl grande vidro ou bambu mesa",
  21: "petisqueira divisoria bambu ou porcelana mesa",
  22: "molheira porcelana ou vidro para mesa molho",
  23: "manteigueira francesa ou com tampa vidro porcelana",
  24: "kit mesa posta jogo americano e porta guardanapo",
  25: "kit potes hermeticos cozinha acrilico vidro mantimentos",
  26: "kit potes para mantimentos cozinha arroz feijao",
  27: "porta frios presunto queijo com tampa geladeira",
  28: "porta ovos organizador de geladeira acrilico",
  29: "kit porta temperos condimentos giratorio cozinha",
  30: "organizador separador de talheres para gaveta cozinha",
  31: "suporte porta papel toalha bancada cozinha",
  32: "lixeira para cozinha com pedal 15l preta ou inox",
  33: "forma de gelo silicone com tampa geladeira",
  34: "descanso de panela silicone ou bambu mesa",
  35: "funil de cozinha inox ou silicone",
  36: "kit panos de prato copa algodao cozinha",
  37: "avental de cozinha tecido impermeavel",
  38: "luva termica cozinha forno silicone ou tecido",
  39: "garrafa termica cafe 1 litro mesa cozinha",
  40: "tesoura de cozinha multiuso inox",
  41: "espremedor amassador de alho inox cozinha",
  42: "kit vassoura rodo e pa de lixo limpeza",
  43: "balde plastico limpeza casa",
  44: "mop giratorio com balde limpeza chao",
  45: "kit escovas de limpeza multiuso casa",
  46: "kit panos de chao alvejado saco limpeza",
  47: "kit panos de microfibra limpeza multiuso",
  48: "lixeira pequena escritorio quarto com pedal",
  49: "cesto de roupa suja lavanderia bambu ou tecido",
  50: "varal de chao dobravel com abas roupas",
  51: "kit pregadores prendedores de roupa varal",
  52: "escova de lavar roupa cerdas macias lavanderia",
  53: "kit acessorios de banheiro porta sabonete liquido escova",
  54: "jogo de toalhas de banho algodao",
  55: "jogo de toalhas de rosto algodao banheiro",
  56: "toalha de piso banheiro tapete algodao",
  57: "tapete para banheiro antiderrapante macio",
  58: "lixeira para banheiro com pedal inox ou preta",
  59: "escova sanitaria banheiro com suporte",
  60: "suporte porta papel higienico banheiro",
  61: "jogo de cama solteiro lencol elastico e fronha",
  62: "lencol avulso com elastico cama solteiro",
  63: "travesseiro macio cama quarto branco",
  64: "protetor de colchao impermeavel solteiro",
  65: "kit cabides veludo ou plastico guarda roupa",
  66: "organizador colmeia de gavetas roupas intimas",
  67: "manta decorativa para sofa algodao sala",
  68: "kit capas de almofadas decorativas sofa sala",
  69: "cortina para sala tecido ilhos",
  70: "capacho tapete de entrada porta bem vindo fibra coco",
  71: "liquidificador cozinha jarra",
  72: "sanduicheira grill eletrica cozinha",
  73: "cafeteira eletrica cozinha cafe",
  74: "mixer vertical 3 em 1 cozinha Mao"
};

const H = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9"
};

const dec = s => s.replace(/&quot;/g, '"').replace(/&amp;/g, "&");

async function fetchOne(it) {
  const q = customQueries[it.id] || `${it.name} ${it.desc} produto`;
  const url = "https://www.bing.com/images/search?q=" + encodeURIComponent(q) + "&form=HDRSC2";
  const html = await (await fetch(url, { headers: H })).text();
  const matches = [...html.matchAll(/class="iusc"[^>]*m="([^"]+)"/g)];
  if (!matches.length) {
    console.log("SEM RESULTADO", it.id, it.name);
    return;
  }
  const dest = path.join(__dirname, "..", "public", "img", it.id + ".jpg");
  if (fs.existsSync(dest)) return;
  for (const m of matches.slice(0, 6)) {
    try {
      const meta = JSON.parse(dec(m[1]));
      if (!meta.turl) continue;
      // Request 500x500 high quality thumbnail from Bing CDN
      const imgUrl = meta.turl + "&w=500&h=500&c=7&rs=1&qlt=90";
      const r = await fetch(imgUrl, { headers: H });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 5000) continue; // skip tiny/broken images
      fs.writeFileSync(dest, buf);
      console.log(`OK [${it.id}] ${it.name} (${buf.length}b) -> ${meta.t}`);
      return;
    } catch (e) {}
  }
  console.log("FALHOU TODOS", it.id, it.name);
}

(async () => {
  const queue = [...items];
  const workers = Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const it = queue.shift();
      await fetchOne(it);
      await new Promise(r => setTimeout(r, 150));
    }
  });
  await Promise.all(workers);
})();
