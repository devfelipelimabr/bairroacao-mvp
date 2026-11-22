// Controller — view server-side do dossiê cívico (HTML pronto para imprimir/PDF)
const store = require('../models/store');
exports.show = (req, res) => {
  const d = store.dossieData();
  const rows = d.top.map((p, i) => `
    <tr><td class="n">${i + 1}</td><td><b>${esc(p.title)}</b><br><span class="mut">${esc(p.category)} · ${esc(p.status)}</span></td>
    <td class="mono">${p.coords}</td><td class="n">${p.confirms}</td></tr>`).join('');
  res(200, `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Dossiê cívico — ${esc(d.neighborhood.name)}</title><style>
    body{font-family:-apple-system,'Segoe UI',sans-serif;max-width:760px;margin:32px auto;padding:0 20px;color:#111}
    h1{font-size:22px} .sub{color:#666;font-size:13px;margin-bottom:20px}
    table{width:100%;border-collapse:collapse;font-size:14px} td,th{border-top:1px solid #ddd;padding:10px 8px;text-align:left;vertical-align:top}
    .n{text-align:center;font-variant-numeric:tabular-nums} .mono{font-family:ui-monospace,monospace;font-size:12px;color:#444}
    .mut{color:#666;font-size:12px} .foot{margin-top:20px;font-size:12px;color:#666;border-top:1px solid #ddd;padding-top:12px}
    button{padding:10px 18px;border:1px solid #111;background:#111;color:#fff;border-radius:8px;cursor:pointer;font-size:14px}
    @media print{button{display:none}}
  </style></head><body>
    <h1>Dossiê cívico — ${esc(d.neighborhood.name)}</h1>
    <div class="sub">${esc(d.month)} · ${esc(d.neighborhood.city)}/${esc(d.neighborhood.state)} · gerado por ${d.neighborhood.users_count} moradores verificados · pronto para protocolar na prefeitura ou enviar à imprensa local</div>
    <table><thead><tr><th>#</th><th>Demanda</th><th>Coordenadas GPS</th><th>Apoios</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="foot">Total de ${d.total} confirmações coletivas em 30 dias. Documento gerado pela comunidade via BairroAção.</div>
    <p><button onclick="window.print()">Imprimir / salvar em PDF</button></p>
  </body></html>`);
  function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
};
