// [categoria, nome, descrição, termo de busca na Shopee, emoji]
const raw = [
  ["Kits de utensílios de cozinha", "Kit de utensílios de silicone", "Concha, escumadeira, espátulas, colher e pegador.", "kit utensilios silicone", "🥄"],
  ["Kits de utensílios de cozinha", "Kit de facas de cozinha", "Facas de diferentes tamanhos e suporte.", "kit facas cozinha", "🔪"],
  ["Kits de utensílios de cozinha", "Kit de preparação de alimentos", "Tábua de corte, descascador, ralador e peneira.", "kit preparacao alimentos cozinha", "🥗"],
  ["Kits de utensílios de cozinha", "Kit de medidores", "Xícaras e colheres medidoras.", "kit medidores cozinha", "🥛"],
  ["Kits de utensílios de cozinha", "Kit de abridores", "Abridor de latas, abridor de garrafas e saca-rolhas.", "kit abridores cozinha", "🍾"],

  ["Panelas e formas", "Jogo de panelas", "Conjunto pequeno, de preferência com 3 a 5 peças.", "jogo panelas", "🍲"],
  ["Panelas e formas", "Panela de pressão", "", "panela pressao", "🥘"],
  ["Panelas e formas", "Kit de formas e assadeiras", "", "kit formas assadeiras", "🧁"],
  ["Panelas e formas", "Forma para bolo", "", "forma bolo", "🎂"],
  ["Panelas e formas", "Travessa de vidro", "", "travessa vidro", "🍽️"],
  ["Panelas e formas", "Escorredor de macarrão", "", "escorredor macarrao", "🍝"],
  ["Panelas e formas", "Escorredor de arroz", "", "escorredor arroz", "🍚"],

  ["Louças e itens para servir", "Kit de pratos", "Conjunto pequeno de pratos, de vidro ou porcelana.", "kit pratos", "🍽️"],
  ["Louças e itens para servir", "Kit de tigelas e bowls", "", "kit tigelas bowls", "🥣"],
  ["Louças e itens para servir", "Kit de taças", "", "kit tacas", "🍷"],
  ["Louças e itens para servir", "Kit de canecas", "", "kit canecas", "☕"],
  ["Louças e itens para servir", "Jarra para água ou suco", "", "jarra vidro", "🫗"],
  ["Louças e itens para servir", "Petisqueira", "", "petisqueira", "🧀"],

  ["Organização da cozinha", "Kit de potes herméticos", "Para guardar alimentos e mantimentos.", "kit potes hermeticos", "🫙"],
  ["Organização da cozinha", "Kit de potes para mantimentos", "", "kit potes mantimentos", "🫙"],
  ["Organização da cozinha", "Porta-ovos", "", "porta ovos", "🥚"],
  ["Organização da cozinha", "Kit porta-temperos", "", "kit porta temperos", "🧂"],
  ["Organização da cozinha", "Organizador de talheres para gaveta", "", "organizador talheres", "🍴"],
  ["Organização da cozinha", "Porta-papel-toalha", "", "porta papel toalha", "🧻"],
  ["Organização da cozinha", "Lixeira para cozinha", "", "lixeira cozinha", "🗑️"],
  ["Organização da cozinha", "Forma de gelo", "", "forma gelo", "🧊"],
  ["Organização da cozinha", "Descanso de panela", "", "descanso panela", "♨️"],
  ["Organização da cozinha", "Funil de cozinha", "", "funil cozinha", "🧪"],

  ["Acessórios de cozinha", "Kit de panos de prato", "", "kit panos prato", "🧽"],
  ["Acessórios de cozinha", "Garrafa térmica", "", "garrafa termica", "🧴"],
  ["Acessórios de cozinha", "Tesoura de cozinha", "", "tesoura cozinha", "✂️"],
  ["Acessórios de cozinha", "Espremedor de alho", "", "espremedor alho", "🧄"],

  ["Produtos de limpeza", "Kit de limpeza", "Vassoura, rodo e pá.", "kit vassoura rodo pa", "🧹"],
  ["Produtos de limpeza", "Balde", "", "balde limpeza", "🪣"],
  ["Produtos de limpeza", "Mop", "", "mop limpeza", "🪠"],
  ["Produtos de limpeza", "Kit de escovas de limpeza", "", "kit escovas limpeza", "🪥"],
  ["Produtos de limpeza", "Kit de panos de chão", "", "kit panos chao", "🧺"],

  ["Lavanderia", "Cesto para roupas sujas", "", "cesto roupa suja", "🧺"],
  ["Lavanderia", "Varal de chão", "", "varal de chao", "👕"],
  ["Lavanderia", "Kit de pregadores de roupa", "", "kit pregadores roupa", "📎"],
  ["Lavanderia", "Escova para roupas", "", "escova roupa", "🧥"],

  ["Banheiro", "Kit de acessórios para banheiro", "Porta-sabonete, dispenser e porta-escovas.", "kit acessorios banheiro", "🧼"],
  ["Banheiro", "Jogo de toalhas de banho", "", "jogo toalhas banho", "🛁"],
  ["Banheiro", "Jogo de toalhas de rosto", "", "jogo toalhas rosto", "🧖"],
  ["Banheiro", "Tapete para banheiro", "", "tapete banheiro", "🧦"],
  ["Banheiro", "Lixeira para banheiro", "", "lixeira banheiro", "🗑️"],
  ["Banheiro", "Escova sanitária", "", "escova sanitaria", "🪠"],
  ["Banheiro", "Suporte para papel higiênico", "", "suporte papel higienico", "🧻"],

  ["Quarto", "Jogo de cama box solteiro", "Lençol com elástico, lençol de cima e fronhas.", "jogo cama", "🛏️"],
  ["Quarto", "Lençóis avulsos", "", "lencol avulso", "🛌"],
  ["Quarto", "Travesseiros", "", "travesseiro", "😴"],
  ["Quarto", "Kit de cabides", "", "kit cabides", "👔"],

  ["Sala", "Manta para sofá", "", "manta sofa", "🧣"],
  ["Sala", "Kit de almofadas", "", "kit almofadas", "🛋️"],
  ["Sala", "Cortina blackout", "Para janela de 1 metro.", "cortina blackout janela", "🪟"],
  ["Sala", "Capacho para entrada", "", "capacho entrada", "🚪"],

  ["Eletrodomésticos", "Liquidificador", "", "liquidificador", "🥤"],
  ["Eletrodomésticos", "Sanduicheira", "", "sanduicheira", "🥪"],
  ["Eletrodomésticos", "Micro-ondas", "", "micro ondas", "🍲"],
  ["Eletrodomésticos", "Mixer", "", "mixer", "🥣"],
  ["Eletrodomésticos", "Airfryer", "", "airfryer fritadeira eletrica", "🍟"],
  ["Eletrodomésticos", "Panela de arroz elétrica", "", "panela de arroz eletrica", "🍚"],
];

module.exports = raw.map(([category, name, desc, q, emoji], i) => ({
  id: i + 1,
  category,
  name,
  desc,
  emoji: emoji || "🎁",
  link: "https://shopee.com.br/search?keyword=" + encodeURIComponent(q),
}));
