import { n, lf } from '../../hooks/useEntityLookup';

/* ═══ Popup HTML Builders ═══ */

/** Conditional row: only renders if val is non-empty */
const row = (label, val) => val ? `<div><b>${label}:</b> ${val}</div>` : '';

/** Narrative block */
const narrBlock = (obj, lang) => {
  const txt = lf(obj, 'narr', lang);
  if (!txt) return '';
  const ttsBtn = lang === 'en' ? `<button class="p-tts" onclick="(() => { const u=new SpeechSynthesisUtterance(this.parentElement.textContent.replace('🔊','').trim()); u.lang='en-US'; u.rate=0.85; const v=speechSynthesis.getVoices().find(v=>v.lang==='en-US'); if(v)u.voice=v; speechSynthesis.cancel(); speechSynthesis.speak(u); })()" title="Listen">🔊</button>` : '';
  return `<div class="p-narr">${txt}${ttsBtn}</div>`;
};

/** Causal links section in popup */
export const causalBlock = (type, id, lang, idx) => {
  const links = idx[`${type}:${id}`];
  if (!links || !links.length) return '';
  const rows = links.slice(0, 5).map(l => {
    const arrow = l.dir === 'out' ? '→' : '←';
    const desc = (l[`d${lang}`] || l.den || l.dtr);
    return `<div class="p-lnk"><span class="p-lnk-a">${arrow}</span><span class="p-lnk-t">${l.lt}</span>${desc}</div>`;
  }).join('');
  return `<div class="p-lnks"><div class="p-lnks-h">🔗 ${{ tr: 'Bağlantılar', en: 'Connections', ar: '' }[lang]}</div>${rows}</div>`;
};

/** Religion badge */
const relBadge = (rel, t) => {
  if (!rel) return '';
  const cls = rel === 'Sünnî' ? 'p-sunni' : rel === 'Şiî' ? 'p-shia' : 'p-khariji';
  return `<span class="p-badge ${cls}">${t.rel[rel] || rel}</span>`;
};

/** Context row helper */
const ctxRow = (icon, label, val) => val ? `<div class="p-ctx"><span class="p-ctx-i">${icon}</span><b>${label}:</b> ${val}</div>` : '';

/** Popup options — wider for better readability */
export const popOpt = (mw = 420) => ({ maxWidth: mw, maxHeight: 480, className: 'p-rich' });

/* ── Dynasty Popup ── */
export function buildDynastyPopup(d, lang, t, analyticsMap, causalIdx) {
  const mk = t.m;
  const an = analyticsMap[d.id];
  const keyC = lf(d, 'key', lang);

  return `<div class="p-title">${n(d, lang)}</div>` +
    `<div class="p-row"><span class="p-k">${mk.period}</span><span class="p-v">${d.start} – ${d.end}</span></div>` +
    (d.rel ? `<div class="p-row"><span class="p-k">${mk.religion}</span>${relBadge(d.rel, t)}</div>` : '') +
    (d.gov ? `<div class="p-row"><span class="p-k">${mk.govType}</span><span class="p-v">${t.gov[d.gov] || d.gov}</span></div>` : '') +
    (d.cap ? `<div class="p-row"><span class="p-k">${mk.capital}</span><span class="p-v">${d.cap}</span></div>` : '') +
    (d.zone ? `<div class="p-row"><span class="p-k">${mk.zone}</span><span class="p-v">${d.zone}</span></div>` : '') +
    (an ? `<div class="p-row p-pi"><span class="p-k">Power</span><span class="p-v">${an.pi}</span></div>` : '') +
    narrBlock(d, lang) +
    (keyC ? `<div class="p-key"><span class="p-key-l">⭐ ${mk.keyContrib}</span>${keyC}</div>` : '') +
    ctxRow('📈', mk.rise, lf(d, 'rise', lang)) +
    ctxRow('📉', mk.fall, lf(d, 'fall', lang)) +
    ctxRow('⏪', mk.before, lf(d, 'ctx_b', lang)) +
    ctxRow('⏩', mk.after, lf(d, 'ctx_a', lang)) +
    causalBlock('dynasty', d.id, lang, causalIdx);
}

/* ── Battle Popup ── */
export function buildBattlePopup(b, lang, t, causalIdx) {
  const mk = t.m;
  const imp = lf(b, 'impact', lang);

  return `<div class="p-title">⚔ ${n(b, lang)}</div>` +
    `<div class="p-row"><span class="p-k">${mk.year}</span><span class="p-v">${b.yr}</span></div>` +
    `<div class="p-row"><span class="p-k">${mk.significance}</span><span class="p-v">${t.imp[b.sig] || b.sig}</span></div>` +
    (b.res ? `<div class="p-row"><span class="p-k">${mk.result}</span><span class="p-v">${b.res}</span></div>` : '') +
    narrBlock(b, lang) +
    ctxRow('🎯', mk.impact, imp) +
    ctxRow('🗡', mk.tactic, lf(b, 'tactic', lang)) +
    causalBlock('battle', b.id, lang, causalIdx);
}

/* ── Event Popup ── */
export function buildEventPopup(e, lang, t, causalIdx) {
  const mk = t.m;

  return `<div class="p-title">📜 ${n(e, lang)}</div>` +
    `<div class="p-row"><span class="p-k">${mk.year}</span><span class="p-v">${e.yr}</span></div>` +
    `<div class="p-row"><span class="p-k">${mk.significance}</span><span class="p-v">${t.imp[e.sig] || e.sig}</span></div>` +
    narrBlock(e, lang) +
    ctxRow('📌', mk.significance, lf(e, 'sig', lang)) +
    causalBlock('event', e.id, lang, causalIdx);
}

/* ── Scholar Popup ── */
export function buildScholarPopup(s, lang, t, causalIdx) {
  const mk = t.m;
  const leg = lf(s, 'legacy', lang);

  return `<div class="p-title">📚 ${n(s, lang)}</div>` +
    `<div class="p-row"><span class="p-k">${mk.born}</span><span class="p-v">${s.b || '?'} – ${s.d || '?'}</span></div>` +
    `<div class="p-row"><span class="p-k">${mk.field}</span><span class="p-v">${s.field} — ${s.sub}</span></div>` +
    `<div class="p-row"><span class="p-k">${mk.work}</span><span class="p-v">${lf(s, 'work', lang)}</span></div>` +
    narrBlock(s, lang) +
    ctxRow('🏆', mk.legacy, leg) +
    ctxRow('🔗', mk.chain, lf(s, 'chain', lang)) +
    ctxRow('👑', mk.patron, lf(s, 'patron', lang)) +
    causalBlock('scholar', s.id, lang, causalIdx);
}

/* ── Monument Popup ── */
export function buildMonumentPopup(m, lang, t, causalIdx) {
  const mk = t.m;
  const vis = lf(m, 'visitor', lang);

  return `<div class="p-title">🕌 ${n(m, lang)}</div>` +
    `<div class="p-row"><span class="p-k">${mk.type}</span><span class="p-v">${lf(m, 'type', lang)}</span></div>` +
    `<div class="p-row"><span class="p-k">${mk.year}</span><span class="p-v">${m.yr}</span></div>` +
    `<div class="p-row"><span class="p-k">${mk.city}</span><span class="p-v">${lf(m, 'city', lang)}</span></div>` +
    (m.unesco ? '<div class="p-unesco-tag">★ UNESCO</div>' : '') +
    narrBlock(m, lang) +
    ctxRow('🏛', mk.arch, lf(m, 'arch', lang)) +
    (vis ? `<div class="p-vis"><span class="p-vis-i">💡</span>${vis}</div>` : '') +
    causalBlock('monument', m.id, lang, causalIdx);
}

/* ── City Popup ── */
export function buildCityPopup(c, lang, t) {
  const mk = t.m;
  const fun = lf(c, 'fun', lang);

  return `<div class="p-title">🏙 ${n(c, lang)}</div>` +
    `<div class="p-row"><span class="p-k">${mk.pop}</span><span class="p-v">${c.pop ? c.pop.toLocaleString() : '—'} (${c.yr})</span></div>` +
    `<div class="p-row"><span class="p-k">${mk.role}</span><span class="p-v">${lf(c, 'role', lang)}</span></div>` +
    narrBlock(c, lang) +
    ctxRow('🏗', { tr: 'Katmanlar', en: 'Layers', ar: '' }[lang], lf(c, 'layers', lang)) +
    (fun ? `<div class="p-vis"><span class="p-vis-i">🎲</span>${fun}</div>` : '');
}

/* ── Trade Route Popup ── */
export function buildRoutePopup(r, lang, t) {
  const mk = t.m;
  const anec = lf(r, 'anec', lang);

  return `<div class="p-title">🛤 ${n(r, lang)}</div>` +
    `<div class="p-row"><span class="p-k">${mk.type}</span><span class="p-v">${lf(r, 'type', lang)}</span></div>` +
    `<div class="p-row"><span class="p-k">${mk.period}</span><span class="p-v">${r.ps || '?'} – ${r.pe || '?'}</span></div>` +
    `<div class="p-row"><span class="p-k">${mk.goods}</span><span class="p-v">${(lf(r, 'goods', lang) || '').replace(/;/g, ', ')}</span></div>` +
    narrBlock(r, lang) +
    ctxRow('💰', { tr: 'Ekonomik Etki', en: 'Economic Impact', ar: '' }[lang], lf(r, 'econ', lang)) +
    (anec ? `<div class="p-vis"><span class="p-vis-i">📖</span>${anec}</div>` : '');
}

/* ── Ruler Popup ── */
export function buildRulerPopup(r, lang, t, dynastyName) {
  const mk = t.m;
  const deathLabel = r.dt === 'k.' ? mk.deathKilled : r.dt === 'd.' ? mk.deathNatural : (r.dt || '—');
  const badges = [];
  if (r.fnd) badges.push(`<span class="p-badge p-founder">★ ${mk.founder}</span>`);
  if (r.lst) badges.push(`<span class="p-badge p-last-ruler">◆ ${mk.lastRuler}</span>`);

  return `<div class="p-title">👑 ${r.n}</div>` +
    (r.fn !== r.n ? `<div class="p-row"><span class="p-k">${{ tr: 'Tam Ad', en: 'Full Name', ar: '' }[lang]}</span><span class="p-v p-fn">${r.fn}</span></div>` : '') +
    `<div class="p-row"><span class="p-k">${mk.dynasty}</span><span class="p-v">${dynastyName || ''}</span></div>` +
    `<div class="p-row"><span class="p-k">${mk.reign}</span><span class="p-v">${r.rs || '?'} – ${r.re || '?'}${r.dur ? ` (${r.dur} ${{ tr: 'yıl', en: 'yr', ar: '' }[lang]})` : ''}</span></div>` +
    (r.role ? `<div class="p-row"><span class="p-k">${mk.role}</span><span class="p-v">${r.role}</span></div>` : '') +
    (r.title ? `<div class="p-row"><span class="p-k">${{ tr: 'Unvan', en: 'Title', ar: '' }[lang]}</span><span class="p-v p-fn">${r.title}</span></div>` : '') +
    (badges.length ? `<div class="p-badges">${badges.join(' ')}</div>` : '') +
    (r.pred ? `<div class="p-row"><span class="p-k">${mk.predecessor}</span><span class="p-v">${r.pred}</span></div>` : '') +
    (r.succ ? `<div class="p-row"><span class="p-k">${mk.successor}</span><span class="p-v">${r.succ}</span></div>` : '') +
    (r.suc_t ? `<div class="p-row"><span class="p-k">${mk.successionType}</span><span class="p-v">${r.suc_t}</span></div>` : '') +
    `<div class="p-row"><span class="p-k">${{ tr: 'Ölüm', en: 'Death', ar: '' }[lang]}</span><span class="p-v">${deathLabel}</span></div>`;
}

/* ── Ruler List for Dynasty Popup ── */
export function buildRulerListHtml(rulers, lang, t) {
  if (!rulers || !rulers.length) return '';
  const mk = t.m;
  const header = `<div class="p-rulers-section">
    <div class="p-rulers-h" onclick="this.parentElement.classList.toggle('expanded')">
      👑 ${mk.rulers} (${rulers.length}) <span class="p-expand-arrow">▶</span>
    </div>
    <div class="p-rulers-list">`;
  
  const rows = rulers.map(r => {
    const badges = [];
    if (r.fnd) badges.push('★');
    if (r.lst) badges.push('◆');
    if (r.dt === 'k.') badges.push('†');
    const badgeStr = badges.length ? `<span class="p-ruler-badges">${badges.join('')}</span>` : '';
    return `<div class="p-ruler-row">
      <span class="p-ruler-name">${badgeStr}${r.n}</span>
      <span class="p-ruler-reign">${r.rs || '?'}–${r.re || '?'}</span>
    </div>`;
  }).join('');

  return header + rows + '</div></div>';
}

/* ═══ Madrasa Popup ═══ */
export function buildMadrasaPopup(m, lang, t, scholarsById) {
  const name = n(m, lang);
  const city = lf(m, 'city', lang);
  const type = lf(m, 'type', lang);
  const founder = lf(m, 'founder', lang);
  const dynasty = lf(m, 'dynasty', lang);
  const desc = lf(m, 'desc', lang);
  const fields = lf(m, 'fields', lang);
  const status = lf(m, 'status', lang);
  const closedStr = m.closed ? `${m.founded}–${m.closed}` : `${m.founded}–`;

  let scholarHtml = '';
  if (m.scholars && m.scholars.length && scholarsById) {
    const items = m.scholars.map(sid => {
      const s = scholarsById[sid];
      return s ? `<span class="p-madrasa-scholar">• ${n(s, lang)}</span>` : '';
    }).filter(Boolean).join(' ');
    if (items) {
      scholarHtml = `<div class="p-sect"><div class="p-sect-h">${{ tr: 'İlişkili Âlimler', en: 'Associated Scholars', ar: '' }[lang]}</div>${items}</div>`;
    }
  }

  return `<div class="popup-card p-madrasa">
    <div class="p-head"><span class="p-icon">🎓</span><span class="p-name">${name}</span></div>
    <div class="p-meta">${city} · ${closedStr}</div>
    <div class="p-type-badge" style="color:#22d3ee">${type}</div>
    ${row({ tr: 'Kurucu', en: 'Founder', ar: '' }[lang], `${founder} (${dynasty})`)}
    ${row({ tr: 'Alanlar', en: 'Fields', ar: '' }[lang], fields)}
    ${row({ tr: 'Durum', en: 'Status', ar: '' }[lang], status)}
    ${scholarHtml}
    ${desc ? `<div class="p-narr">${desc}</div>` : ''}
  </div>`;
}
