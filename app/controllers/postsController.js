// Controller — publicações (problemas, alertas, indicações)
const store = require('../models/store');

exports.index = (req, res, query) => {
  res(200, {
    posts: store.listPosts({ filter: query.get('filter') || 'Todos', sort: query.get('sort') || 'relev' }),
    categories: store.CATEGORIES
  });
};
exports.create = (req, res, _q, body, cid) => {
  try { res(201, store.createPost(body)); }
  catch (e) { res(e.code || 400, { error: e.message }); }
};
exports.confirm = (req, res, _q, _body, cid, params) => {
  const r = store.confirm(params.id, cid);
  if (!r) return res(404, { error: 'Publicação não encontrada' });
  res(r.duplicate ? 409 : 200, r);
};
