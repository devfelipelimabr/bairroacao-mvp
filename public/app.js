// BairroAção — front-end (View) consumindo a API MVC
const $ = s => document.querySelector(s);
const state = { tab: 'feed', filter: 'Todos', sort: 'relev', mode: 'prin', cty: 'issue', posts: [], proposals: [], ranking: [], myConf: new Set(), myVotes: {} };

function cid() {
  let c = localStorage.getItem('ba_cid');
  if (!c) { c = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())); localStorage.setItem('ba_cid', c); }
  return c;
}
async function api(path, opts = {}) {
  const r = await fetch(path, { headers: { 'Content-Type': 'application/json', 'x-cid': cid() }, ...opts });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Erro');
  return d;
}
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._x); t._x = setTimeout(() => t.classList.remove('show'), 2200); }

const STC = { 'Aberto': 'st-Aberto', 'Confirmado': 'st-Confirmado', 'Em andamento': 'st-Em', 'Resolvido': 'st-Resolvido' };
const CATC = { 'Asfalto/Buraco': '#b91c1c', 'Iluminação': '#b45309', 'Lixo/Entulho': '#0f7b5f', 'Poda/Árvores': '#7c3aed', 'Segurança': '#be123c', 'Água/Esgoto': '#1d4ed8' };
const catCol = c => CATC[c] || '#6b7280';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function typeTag(p) {
  if (p.type === 'alert') return `<span class="tag">⚠️ ${esc(p.category)} · ${esc(p.valid || '')}</span>`;
  if (p.type === 'service') return `<span class="tag">🤝 ${esc(p.rating || 'novo')}</span>`;
  if (p.type === 'proposal') return `<span class="tag">💡 Proposta · ${esc(p.deadline || '')}</span>`;
  return `<span class="tag" style="color:${catCol(p.category)}">● ${esc(p.category)}</span>`;
}
function confBtn(p) {
  const mine = state.myConf.has(p.id), obs = state.mode === 'viz';
  if (p.type === 'proposal') return `<button class="btn" data-act="go-dec" ${obs ? 'disabled' : ''}>Votar na proposta</button>`;
  const icon = p.type === 'alert' ? '🔊' : p.type === 'service' ? '👍' : '✔';
  const label = p.type === 'alert' ? 'Divulgar' : p.type === 'service' ? 'Indicar' : (mine ? 'Confirmado por você' : 'Confirmar problema');
  return `<button class="btn" data-act="confirm" data-id="${p.id}" ${mine || obs ? 'disabled' : ''}>${icon} ${label} · ${p.confirms}</button>`;
}
function cardHTML(p) {
  return `<article class="card">
    <div class="photo">
      ${p.photo ? `<img src="${p.photo}" alt="">` : `<span class="pin">${p.type === 'alert' ? '⚠️' : p.type === 'service' ? '🤝' : p.type === 'proposal' ? '💡' : '📍'}</span>`}
      ${p.blur ? `<span class="tag" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,.6);color:#fff;border:none">ofuscado em 200m</span>` : ''}
      <div class="tags">${typeTag(p)}<span class="tag ${STC[p.status] || ''}">${p.status}</span></div>
    </div>
    <div class="body">
      <div class="row between"><div class="row"><b class="b1">${esc(p.author)}</b><span class="sm">· ${esc(p.created_at)}</span></div></div>
      <div style="font-weight:600;font-size:15px">${esc(p.title)}</div>
      <div class="b1 sm" style="color:var(--mut)">${esc(p.description)}</div>
      <div class="meta">📍 a ${p.dist}m de você · <span class="mono">${esc(p.coords)}</span> · 💬 ${p.comments}</div>
      <div class="actions">${confBtn(p)}</div>
    </div>
  </article>`;
}

function mapHTML(posts) {
  const pins = posts.map(p => `<g class="pinm" data-act="pin" data-id="${p.id}">
    <circle cx="${p.x}" cy="${p.y}" r="12" fill="${catCol(p.category)}" stroke="#fff" stroke-width="2"/>
    <text x="${p.x}" y="${p.y + 4}" text-anchor="middle" font-size="11" fill="#fff" font-weight="600">${p.confirms}</text></g>`).join('');
  return `<div class="card mapbox"><svg viewBox="0 0 360 300">
    <rect width="360" height="300" fill="#fafafa"/>
    <polygon points="16,22 344,16 352,286 20,292" fill="none" stroke="#9ca3af" stroke-dasharray="6 5"/>
    <rect x="34" y="36" width="120" height="88" rx="4" fill="#e8f5ef"/>
    <text x="44" y="52" font-size="10" fill="#6b7280">Praça do Coreto</text>
    <g stroke="#e5e7eb" stroke-width="6">
      <line x1="30" y1="140" x2="330" y2="132"/><line x1="40" y1="210" x2="320" y2="222"/>
      <line x1="120" y1="30" x2="112" y2="290"/><line x1="250" y1="24" x2="242" y2="288"/><line x1="180" y1="150" x2="300" y2="146"/>
    </g>
    <circle cx="168" cy="176" r="7" fill="#14181b"/><text x="180" y="180" font-size="10" fill="#14181b">Você</text>
    ${pins}</svg>
    <div class="sm" style="padding:8px 12px;border-top:1px solid var(--line)">Toque em um pino para ver o resumo e confirmar.</div></div>`;
}

async function render() {
  const v = $('#view');
  if (state.tab === 'feed') {
    const d = await api(`/api/posts?filter=${encodeURIComponent(state.filter)}&sort=${state.sort}`);
    state.posts = d.posts;
    let h = '';
    if (state.mode === 'viz') h += `<div class="banner">👀 <b>Modo observador — Vila Matilde.</b> Acompanhe e comente; votos e novas demandas só no bairro principal.</div>`;
    h += `<div class="chips">${['Todos', ...d.categories].map(c => `<button class="chip ${state.filter === c ? 'on' : ''}" data-act="filter" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div>`;
    h += `<div class="row between"><div class="seg"><button class="${state.sort === 'relev' ? 'on' : ''}" data-act="sort" data-s="relev">Relevância</button><button class="${state.sort === 'recentes' ? 'on' : ''}" data-act="sort" data-s="recentes">Recentes</button></div><span class="sm">${d.posts.length} publicações</span></div>`;
    h += d.posts.map(cardHTML).join('');
    v.innerHTML = h;
  } else if (state.tab === 'map') {
    const d = await api('/api/posts');
    state.posts = d.posts;
    v.innerHTML = `<div class="t0" style="font-size:17px">Mapa do bairro</div>` + mapHTML(d.posts);
  } else if (state.tab === 'dec') {
    const d = await api('/api/proposals');
    state.proposals = d.proposals; state.ranking = d.ranking;
    const obs = state.mode === 'viz';
    let h = `<div class="t0" style="font-size:17px">Decisões do bairro</div>
      <div class="card"><div class="body"><div class="row between"><b class="b1">Enquetes ativas</b><span class="sm">quórum de 30 apoios</span></div>`;
    d.proposals.forEach(p => {
      const mine = state.myVotes[p.id];
      h += `<div style="border-top:1px solid var(--line);padding-top:10px;display:flex;flex-direction:column;gap:8px">
        <div style="font-weight:600;font-size:15px">${esc(p.title)}</div>
        <div class="sm">${esc(p.description)}</div>
        <div class="bar"><i style="width:${Math.min(100, p.apoio / p.quorum * 100)}%;background:#1d4ed8"></i></div>
        <div class="row between sm"><span class="meta">${p.apoio}/${p.quorum} apoios · ${p.contra} contras</span><span>${esc(p.deadline)}</span></div>
        <div class="row">
          <button class="btn" data-act="vote" data-id="${p.id}" data-side="apoio" ${mine === 'apoio' || obs ? 'disabled' : ''}>👍 ${mine === 'apoio' ? 'Apoiado' : 'Apoio'}</button>
          <button class="btn" data-act="vote" data-id="${p.id}" data-side="contra" ${mine === 'contra' || obs ? 'disabled' : ''}>👎 ${mine === 'contra' ? 'Não apoiado' : 'Não apoio'}</button>
        </div></div>`;
    });
    h += `</div></div>
      <div class="card"><div class="body"><b class="b1">Ranking de prioridades do mês</b>
      ${d.ranking.map((p, i) => `<div class="rank"><div class="row between"><span class="b1">${i + 1}. ${esc(p.title)}</span><span class="sm meta">${p.confirms} apoios</span></div><div class="bar"><i style="width:${Math.min(100, p.confirms * 3)}%;background:${catCol(p.category)}"></i></div></div>`).join('')}
      </div></div>
      <a class="btn primary" style="text-decoration:none;text-align:center" href="/dossie" target="_blank">📄 Gerar dossiê cívico do mês</a>`;
    v.innerHTML = h;
  } else {
    v.innerHTML = `<div class="t0" style="font-size:17px">Vila Aurora</div>
      <div class="card"><div class="body">
        <div class="row between sm"><span>Moradores verificados</span><b class="meta">47</b></div>
        <div class="row between sm"><span>Problemas abertos</span><b class="meta">${state.posts.filter(p => p.type === 'issue' && p.status !== 'Resolvido').length || 4}</b></div>
        <div class="row between sm"><span>Resolvidos este mês</span><b class="meta">1</b></div>
        <div class="row between sm"><span>Confirmações coletivas (30 dias)</span><b class="meta">120</b></div>
      </div></div>
      <div class="banner">🚀 <b>Ative seu quarteirão:</b> 14/30 moradores — faltam 16 para destravar votações oficiais. Convide pelo WhatsApp!</div>
      <div class="card"><div class="body"><b class="b1">Privacidade por design</b>
      <div class="sm">Suas coordenadas exatas nunca são públicas — apenas o ID do bairro. Alertas residenciais são ofuscados em 200m.</div></div></div>`;
  }
}

// ---- eventos (delegação) ----
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  try {
    if (act === 'filter') { state.filter = el.dataset.cat; render(); }
    if (act === 'sort') { state.sort = el.dataset.s; render(); }
    if (act === 'confirm') {
      const r = await api(`/api/posts/${el.dataset.id}/confirm`, { method: 'POST', body: '{}' });
      state.myConf = new Set([...state.myConf, r.post.id]);
      toast(r.duplicate ? 'Você já confirmou este problema' : 'Confirmação registrada — prioridade elevada');
      render();
    }
    if (act === 'vote') {
      const r = await api(`/api/proposals/${el.dataset.id}/vote`, { method: 'POST', body: JSON.stringify({ side: el.dataset.side }) });
      state.myVotes[r.post.id] = r.my;
      toast(r.my === 'apoio' ? 'Apoio registrado — quórum atualizado' : 'Voto registrado');
      render();
    }
    if (act === 'go-dec') { switchTab('dec'); }
    if (act === 'pin') {
      const p = state.posts.find(x => x.id === Number(el.dataset.id));
      const sh = $('#sheet');
      sh.innerHTML = `<div class="row between">${typeTag(p)}<button class="btn" id="shX">✕</button></div>
        <div class="t0">${esc(p.title)}</div>
        <div class="sm" style="color:var(--mut)">${esc(p.description)}</div>
        <div class="meta">📍 a ${p.dist}m · ${esc(p.author)} · ${esc(p.created_at)}</div>
        <div class="actions">${confBtn(p)}</div>`;
      sh.classList.add('open');
      $('#shX').onclick = () => sh.classList.remove('open');
    }
  } catch (err) { toast(err.message); }
});

$('#tabs').addEventListener('click', e => {
  const t = e.target.closest('.tab'); if (!t) return;
  switchTab(t.dataset.tab);
});
function switchTab(tab) {
  state.tab = tab;
  document.querySelectorAll('#tabs .tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  render();
}
$('#modeSeg').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  state.mode = b.dataset.mode;
  document.querySelectorAll('#modeSeg button').forEach(x => x.classList.toggle('on', x === b));
  render();
});
$('#hoodBtn').onclick = () => toast('Bairro definido por GPS: Vila Aurora');

// ---- criar ----
const FORMS = {
  issue: () => `<label class="fld">Categoria<select id="fCat">${['Asfalto/Buraco','Iluminação','Lixo/Entulho','Poda/Árvores','Segurança','Água/Esgoto'].map(c => `<option>${c}</option>`).join('')}</select></label>
    <label class="fld">Título<input id="fTi" placeholder="Ex.: Buraco na Rua das Amoras, 120"></label>
    <label class="fld">Descrição<textarea id="fDs" rows="3"></textarea></label>
    <label class="fld">Foto (obrigatória)<input type="file" id="fFoto" accept="image/*"></label>`,
  proposal: () => `<label class="fld">Título<input id="fTi" placeholder="Ex.: Academia ao ar livre na praça"></label>
    <label class="fld">Justificativa<textarea id="fDs" rows="3"></textarea></label>
    <label class="fld">Prazo da votação<select id="fPrazo"><option>3 dias</option><option>5 dias</option><option>7 dias</option></select></label>`,
  alert: () => `<label class="fld">Tipo<select id="fCat"><option>Rua interditada</option><option>Queda de energia</option><option>Alagamento</option><option>Pet perdido</option></select></label>
    <label class="fld">Título<input id="fTi"></label>
    <label class="fld">Descrição<textarea id="fDs" rows="3"></textarea></label>
    <label class="fld">Validade<select id="fVal"><option>expira em 24h</option><option>expira em 48h</option><option>expira em 72h</option></select></label>`,
  service: () => `<label class="fld">Profissional<input id="fTi" placeholder="Ex.: Marco, eletricista"></label>
    <label class="fld">Descrição<textarea id="fDs" rows="2"></textarea></label>`
};
function openCreate() { state.cty = 'issue'; $('#formFields').innerHTML = FORMS.issue(); $('#createM').classList.add('open'); }
$('#fab').onclick = openCreate;
$('#closeCreate').onclick = () => $('#createM').classList.remove('open');
$('#typeG').addEventListener('click', e => {
  const b = e.target.closest('.typeC'); if (!b) return;
  state.cty = b.dataset.ty;
  document.querySelectorAll('#typeG .typeC').forEach(x => x.classList.toggle('on', x === b));
  $('#formFields').innerHTML = FORMS[state.cty]();
});
function fileData(input) {
  return new Promise(res => {
    const f = input && input.files[0];
    if (!f) return res(null);
    const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f);
  });
}
$('#publishBtn').onclick = async () => {
  const g = id => { const el = $(id); return el ? el.value : ''; };
  try {
    const body = {
      type: state.cty, category: g('#fCat'), title: g('#fTi'), description: g('#fDs'),
      photo: await fileData($('#fFoto')), deadline: g('#fPrazo'), valid: g('#fVal')
    };
    await api('/api/posts', { method: 'POST', body: JSON.stringify(body) });
    $('#createM').classList.remove('open');
    toast('Publicado no feed do Vila Aurora');
    switchTab('feed');
  } catch (err) { toast(err.message); }
};

render();
