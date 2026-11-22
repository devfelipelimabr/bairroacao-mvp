// Rotas — API REST + view do dossiê
const posts = require('./controllers/postsController');
const proposals = require('./controllers/proposalsController');
const dossie = require('./controllers/dossieController');
const store = require('./models/store');

const TABLE = [
  ['GET',  /^\/api\/neighborhoods$/,        (q, r) => r(200, store.neighborhoods)],
  ['GET',  /^\/api\/posts$/,                posts.index],
  ['POST', /^\/api\/posts$/,                posts.create],
  ['POST', /^\/api\/posts\/(\d+)\/confirm$/, posts.confirm],
  ['GET',  /^\/api\/proposals$/,            proposals.index],
  ['POST', /^\/api\/proposals\/(\d+)\/vote$/, proposals.vote],
  ['GET',  /^\/dossie$/,                    dossie.show]
];

function readBody(req) {
  return new Promise(resolve => {
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > 2e6) req.destroy(); });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); } });
  });
}

exports.handle = async (req, res, url) => {
  const send = (code, data) => {
    const isHtml = typeof data === 'string' && data.startsWith('<!doctype');
    res.writeHead(code, { 'Content-Type': isHtml ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8' });
    res.end(isHtml ? data : JSON.stringify(data));
  };
  const cid = req.headers['x-cid'] || 'anon';
  const body = req.method === 'POST' ? await readBody(req) : {};
  for (const [method, re, handler] of TABLE) {
    const m = url.pathname.match(re);
    if (m && method === req.method) return handler(req, send, url.searchParams, body, cid, { id: m[1] });
  }
  send(404, { error: 'Rota não encontrada' });
};
