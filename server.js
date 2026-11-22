// BairroAção MVP — MVC sem login
// Servidor HTTP zero-dependência (Node >= 18). Uso: node server.js  ->  http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');
const routes = require('./app/routes');

const PORT = process.env.PORT || 3000;
const PUB = path.join(__dirname, 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8'
};

function serveStatic(req, res, pathname) {
  let file = path.normalize(path.join(PUB, pathname === '/' ? 'index.html' : pathname));
  if (!file.startsWith(PUB)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/') || url.pathname === '/dossie') {
    return routes.handle(req, res, url);
  }
  serveStatic(req, res, url.pathname);
});

server.listen(PORT, () => console.log(`BairroAção MVC rodando em http://localhost:${PORT}`));
