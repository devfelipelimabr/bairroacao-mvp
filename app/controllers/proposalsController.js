// Controller — propostas e votação
const store = require('../models/store');
exports.index = (req, res) => res(200, { proposals: store.listProposals(), ranking: store.ranking() });
exports.vote = (req, res, _q, body, cid, params) => {
  try {
    const r = store.vote(params.id, cid, body.side);
    if (!r) return res(404, { error: 'Proposta não encontrada' });
    res(200, r);
  } catch (e) { res(e.code || 400, { error: e.message }); }
};
