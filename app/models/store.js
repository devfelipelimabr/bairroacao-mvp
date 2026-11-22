// Model — camada de dados em memória (troque por PostGIS/Supabase em produção)
const neighborhoods = [
  { id: 1, name: 'Vila Aurora', city: 'São Paulo', state: 'SP', active: true, min_users: 30, users_count: 47 },
  { id: 2, name: 'Vila Matilde', city: 'São Paulo', state: 'SP', active: false, min_users: 30, users_count: 14, observer_only: true }
];

let seq = 100;
const posts = [
  { id: 1, type: 'issue', category: 'Asfalto/Buraco', title: 'Buraco profundo na Rua das Amoras, 120', description: 'Afundamento com mais de 40cm próximo ao meio-fio. Dois carros já bateram na semana passada.', status: 'Aberto', confirms: 12, comments: 5, dist: 350, x: 128, y: 150, author: 'Marina S.', created_at: 'há 2h', coords: '-23.5512, -46.6890' },
  { id: 2, type: 'issue', category: 'Iluminação', title: 'Poste apagado há 3 semanas na Praça do Coreto', description: 'Trecho entre a praça e a Rua Cláudia ficou completamente às escuras. Moradores evitam passar à noite.', status: 'Confirmado', confirms: 27, comments: 9, dist: 600, x: 210, y: 96, author: 'Dete A.', created_at: 'há 1 dia', coords: '-23.5498, -46.6862' },
  { id: 3, type: 'issue', category: 'Lixo/Entulho', title: 'Entulho acumulado no terreno baldio da Rua Ipê', description: 'Caminhão descarrega entulho todo fim de semana. Risco de foco de dengue no terreno.', status: 'Em andamento', confirms: 31, comments: 12, dist: 900, x: 262, y: 238, author: 'Líder Comunitário', created_at: 'há 3 dias', coords: '-23.5531, -46.6915' },
  { id: 4, type: 'issue', category: 'Água/Esgoto', title: 'Vazamento na calçada da Rua Cláudia, 45', description: 'Água limpa jorra há 5 dias. Calçada afundando, pedestres desviando para a rua.', status: 'Aberto', confirms: 8, comments: 3, dist: 500, x: 176, y: 196, author: 'Paulo H.', created_at: 'há 5h', coords: '-23.5504, -46.6888' },
  { id: 5, type: 'issue', category: 'Poda/Árvores', title: 'Galhos obstruindo faixa de pedestres', description: 'Árvore na Rua das Hortênsias invadindo a calçada. Cadeirantes precisam descer para a rua.', status: 'Resolvido', confirms: 19, comments: 4, dist: 750, x: 88, y: 256, author: 'Paulo H.', created_at: 'há 1 semana', coords: '-23.5520, -46.6927', proof: true },
  { id: 6, type: 'alert', category: 'Rua interditada', title: 'Rua interditada para obras — desvio pela Rua B', description: 'Interdição total da Rua das Amoras até sexta. Desvio sinalizado.', status: 'Aberto', confirms: 34, comments: 6, dist: 400, x: 150, y: 172, author: 'Zelador Portaria 3', created_at: 'há 3h', valid: 'expira em 18h', blur: true },
  { id: 7, type: 'alert', category: 'Pet perdido', title: 'Cachorro perdido — golden, coleira azul', description: 'Responde pelo nome Thor. Localização exata ofuscada em 200m.', status: 'Aberto', confirms: 22, comments: 11, dist: 650, x: 226, y: 118, author: 'Ana C.', created_at: 'há 6h', valid: 'expira em 42h', blur: true },
  { id: 8, type: 'service', category: 'Eletricista', title: 'Marco — eletricista (indicação da vizinhança)', description: 'Resolveu o quadro do prédio em 1h, preço justo, atende no bairro há 12 anos.', status: 'Aberto', confirms: 41, comments: 7, dist: 200, x: 132, y: 206, author: 'Síndico Torre B', created_at: 'há 2 dias', rating: '4,9 (41 avaliações)' },
  { id: 9, type: 'proposal', category: 'Melhoria', title: 'Academia ao ar livre na Praça do Coreto', description: 'Instalar aparelhos de ginástica na área gramada leste, via emenda parlamentar.', status: 'Aberto', confirms: 0, comments: 14, dist: 600, x: 206, y: 84, author: 'Embaixador Local', created_at: 'há 8h', apoio: 23, contra: 4, quorum: 30, deadline: 'encerra em 2 dias' }
];

// Anti-duplicata sem login: conjuntos por token anônimo de navegador (header x-cid)
const confirmedBy = {};       // cid -> Set(postId)
const votesBy = {};           // cid -> { postId: 'apoio'|'contra' }

const CATEGORIES = ['Asfalto/Buraco', 'Iluminação', 'Lixo/Entulho', 'Poda/Árvores', 'Segurança', 'Água/Esgoto'];
const TYPES = ['issue', 'proposal', 'alert', 'service'];

function listPosts({ filter = 'Todos', sort = 'relev' } = {}) {
  let out = posts.filter(p => filter === 'Todos' || p.category === filter);
  out = out.slice().sort((a, b) => (sort === 'recentes' ? b.id - a.id : b.confirms - a.confirms));
  return out;
}
function getPost(id) { return posts.find(p => p.id === Number(id)); }

function createPost(body) {
  if (!TYPES.includes(body.type)) throw Object.assign(new Error('Tipo inválido'), { code: 400 });
  const post = {
    id: ++seq, type: body.type, category: body.category || 'Geral',
    title: (body.title || '').slice(0, 140), description: (body.description || '').slice(0, 500),
    photo: body.photo || null, status: 'Aberto', confirms: 0, comments: 0,
    dist: 120 + Math.floor(Math.random() * 600),
    x: 80 + Math.floor(Math.random() * 220), y: 60 + Math.floor(Math.random() * 200),
    author: 'Você', created_at: 'agora',
    coords: `-23.55${10 + Math.floor(Math.random() * 80)}, -46.68${10 + Math.floor(Math.random() * 80)}`
  };
  if (body.type === 'proposal') Object.assign(post, { apoio: 1, contra: 0, quorum: 30, deadline: body.deadline || '7 dias' });
  if (body.type === 'alert') Object.assign(post, { valid: body.valid || 'expira em 24h', blur: true });
  if (body.type === 'service') Object.assign(post, { rating: 'novo' });
  posts.unshift(post);
  return post;
}

function confirm(id, cid) {
  confirmedBy[cid] = confirmedBy[cid] || new Set();
  const p = getPost(id);
  if (!p) return null;
  if (confirmedBy[cid].has(p.id)) return { duplicate: true, post: p };
  confirmedBy[cid].add(p.id);
  p.confirms++;
  if (p.status === 'Aberto') p.status = 'Confirmado';
  return { duplicate: false, post: p };
}

function myConfirms(cid) { return confirmedBy[cid] || new Set(); }

function listProposals() { return posts.filter(p => p.type === 'proposal'); }

function vote(id, cid, side) {
  if (!['apoio', 'contra'].includes(side)) throw Object.assign(new Error('Lado inválido'), { code: 400 });
  const p = getPost(id);
  if (!p || p.type !== 'proposal') return null;
  votesBy[cid] = votesBy[cid] || {};
  const old = votesBy[cid][p.id];
  if (old === side) return { changed: false, post: p, my: side };
  if (old === 'apoio') p.apoio--; else if (old === 'contra') p.contra--;
  if (side === 'apoio') p.apoio++; else p.contra++;
  votesBy[cid][p.id] = side;
  return { changed: true, post: p, my: side };
}
function myVotes(cid) { return votesBy[cid] || {}; }

function ranking() {
  return posts.filter(p => p.type === 'issue').sort((a, b) => b.confirms - a.confirms).slice(0, 4);
}
function dossieData() {
  const top = posts.filter(p => p.type === 'issue').sort((a, b) => b.confirms - a.confirms).slice(0, 10);
  return { neighborhood: neighborhoods[0], month: 'Novembro/2026', top, total: top.reduce((a, p) => a + p.confirms, 0) };
}

module.exports = { neighborhoods, CATEGORIES, TYPES, listPosts, getPost, createPost, confirm, myConfirms, listProposals, vote, myVotes, ranking, dossieData };
