import { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import DB from '../data/db.json';
import { REL_C, ZONE_C, IMP_OP, LYR_COL, eraName, n } from '../data/constants';

/* Build causal links index keyed by "type:id" */
function buildCausalIndex() {
  const idx = {};
  (DB.causal || []).forEach(c => {
    const sk = `${c.st}:${c.si}`, tk = `${c.tt}:${c.ti}`;
    if (!idx[sk]) idx[sk] = [];
    if (!idx[tk]) idx[tk] = [];
    idx[sk].push({ dir: 'out', ...c });
    idx[tk].push({ dir: 'in', ...c });
  });
  return idx;
}

/* narrative block */
const narrBlock = (obj, lang) => {
  const txt = lang === 'tr' ? obj.narr_tr : obj.narr_en;
  return txt ? `<div class="p-narr">${txt}</div>` : '';
};

/* causal links section */
const causalBlock = (type, id, lang, idx) => {
  const links = idx[`${type}:${id}`];
  if (!links || !links.length) return '';
  const rows = links.slice(0, 5).map(l => {
    const arrow = l.dir === 'out' ? '→' : '←';
    const desc = lang === 'tr' ? l.dtr : l.den;
    return `<div class="p-lnk"><span class="p-lnk-a">${arrow}</span><span class="p-lnk-t">${l.lt}</span>${desc}</div>`;
  }).join('');
  return `<div class="p-lnks"><div class="p-lnks-h">🔗 ${lang === 'tr' ? 'Bağlantılar' : 'Connections'}</div>${rows}</div>`;
};

export default function MapView({ lang, t }) {
  const mapEl = useRef(null);
  const mapObj = useRef(null);
  const lgRef = useRef({});
  const [year, setYear] = useState(900);
  const [playing, setPlaying] = useState(false);
  const playRef = useRef(false);
  const [layers, setLayers] = useState({
    dynasties: true, battles: true, events: true,
    scholars: true, monuments: true, cities: true, routes: true
  });
  const [filters, setFilters] = useState({
    religion: '', ethnic: '', government: '', period: '', zone: ''
  });
  const [activeCount, setActiveCount] = useState(0);

  const analyticsMap = useMemo(() => {
    const m = {}; DB.analytics.forEach(a => { m[a.id] = a; }); return m;
  }, []);
  const causalIdx = useMemo(buildCausalIndex, []);
  const uniques = useMemo(() => ({
    religion: [...new Set(DB.dynasties.map(d => d.rel).filter(Boolean))],
    ethnic: [...new Set(DB.dynasties.map(d => d.eth).filter(Boolean))].sort(),
    government: [...new Set(DB.dynasties.map(d => d.gov).filter(Boolean))].sort(),
    period: [...new Set(DB.dynasties.map(d => d.period).filter(Boolean))].sort(),
    zone: [...new Set(DB.dynasties.map(d => d.zone).filter(Boolean))].sort(),
  }), []);

  /* ── Init Leaflet ── */
  useEffect(() => {
    if (mapObj.current) return;
    const map = L.map(mapEl.current, {
      center: [30, 42], zoom: 4, minZoom: 3, maxZoom: 10,
      zoomControl: false, attributionControl: false
    });
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 13, attribution: 'Esri' }).addTo(map);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
      { maxZoom: 19, opacity: 0.6 }).addTo(map);
    mapObj.current = map;
    ['dynasties','battles','events','scholars','monuments','cities','routes'].forEach(k => {
      lgRef.current[k] = L.layerGroup().addTo(map);
    });
    return () => { map.remove(); mapObj.current = null; };
  }, []);

  /* ── Play ── */
  useEffect(() => {
    playRef.current = playing;
    if (!playing) return;
    const iv = setInterval(() => {
      if (!playRef.current) { clearInterval(iv); return; }
      setYear(p => { if (p >= 1920) { setPlaying(false); return 1920; } return p + 2; });
    }, 80);
    return () => clearInterval(iv);
  }, [playing]);

  /* ── Render ── */
  useEffect(() => {
    if (!mapObj.current) return;
    const lg = lgRef.current;
    const mk = t.m;
    const dynOk = d => {
      if (filters.religion && d.rel !== filters.religion) return false;
      if (filters.ethnic && d.eth !== filters.ethnic) return false;
      if (filters.government && d.gov !== filters.government) return false;
      if (filters.period && d.period !== filters.period) return false;
      if (filters.zone && d.zone !== filters.zone) return false;
      return true;
    };
    const relBadge = rel => {
      if (!rel) return '';
      const cls = rel === 'Sünnî' ? 'p-sunni' : rel === 'Şiî' ? 'p-shia' : 'p-khariji';
      return `<span class="p-badge ${cls}">${t.rel[rel] || rel}</span>`;
    };
    const popOpt = (mw = 380) => ({ maxWidth: mw, maxHeight: 460, className: 'p-rich' });

    // ── Dynasties ──
    lg.dynasties.clearLayers();
    let cnt = 0;
    if (layers.dynasties) {
      DB.dynasties.forEach(d => {
        if (!d.bn || d.start > year || d.end < year || !dynOk(d)) return;
        cnt++;
        const an = analyticsMap[d.id];
        const col = REL_C[d.rel] || ZONE_C[d.zone] || '#c9a84c';
        const op = (IMP_OP[d.imp] || 0.18) * 1.2;
        const w = d.imp === 'Kritik' ? 3 : d.imp === 'Yüksek' ? 2.2 : 1.2;
        const keyC = lang === 'tr' ? d.key_tr : d.key_en;

        let h = `<div class="p-title">${n(d,lang)}</div>` +
          `<div class="p-row"><span class="p-k">${mk.period}</span><span class="p-v">${d.start} – ${d.end}</span></div>` +
          (d.rel ? `<div class="p-row"><span class="p-k">${mk.religion}</span>${relBadge(d.rel)}</div>` : '') +
          (d.gov ? `<div class="p-row"><span class="p-k">${mk.govType}</span><span class="p-v">${t.gov[d.gov]||d.gov}</span></div>` : '') +
          (d.cap ? `<div class="p-row"><span class="p-k">${mk.capital}</span><span class="p-v">${d.cap}</span></div>` : '') +
          (d.zone ? `<div class="p-row"><span class="p-k">${mk.zone}</span><span class="p-v">${d.zone}</span></div>` : '') +
          (an ? `<div class="p-row p-pi"><span class="p-k">Power</span><span class="p-v">${an.pi}</span></div>` : '') +
          narrBlock(d, lang) +
          (keyC ? `<div class="p-key"><span class="p-key-l">⭐ ${mk.keyContrib}</span>${keyC}</div>` : '') +
          (d.rise_tr ? `<div class="p-ctx"><span class="p-ctx-i">📈</span><b>${mk.rise}:</b> ${d.rise_tr}</div>` : '') +
          (d.fall_tr ? `<div class="p-ctx"><span class="p-ctx-i">📉</span><b>${mk.fall}:</b> ${d.fall_tr}</div>` : '') +
          (d.ctx_b_tr ? `<div class="p-ctx"><span class="p-ctx-i">⏪</span><b>${mk.before}:</b> ${d.ctx_b_tr}</div>` : '') +
          (d.ctx_a_tr ? `<div class="p-ctx"><span class="p-ctx-i">⏩</span><b>${mk.after}:</b> ${d.ctx_a_tr}</div>` : '') +
          causalBlock('dynasty', d.id, lang, causalIdx);

        L.rectangle([[d.bs,d.bw],[d.bn,d.be]], {
          color:col, weight:w, fillColor:col, fillOpacity:op,
          dashArray: d.imp==='Düşük' ? '4,4' : ''
        }).bindPopup(h, popOpt()).addTo(lg.dynasties);

        if (d.lat && d.lon) {
          const r = d.imp==='Kritik' ? 6 : d.imp==='Yüksek' ? 5 : 3.5;
          L.circleMarker([d.lat,d.lon], {
            radius:r, fillColor:col, fillOpacity:0.9, color:'#080c18', weight:1.5
          }).bindTooltip(n(d,lang), { direction:'top', offset:[0,-8] }).addTo(lg.dynasties);
        }
      });
    }
    setActiveCount(cnt);

    // ── Battles ──
    lg.battles.clearLayers();
    if (layers.battles) {
      DB.battles.forEach(b => {
        if (!b.lat || !b.yr) return;
        const past = b.yr <= year, near = Math.abs(b.yr-year) < 50;
        if (!past && !near) return;
        const op = past ? (near ? 0.95 : 0.5) : 0.25;
        const sz = b.sig==='Kritik' ? 10 : 8;
        const icon = L.divIcon({ className:'', iconSize:[sz,sz], iconAnchor:[sz/2,sz/2],
          html:`<svg width="${sz}" height="${sz}"><polygon points="${sz/2},1 ${sz-1},${sz-1} 1,${sz-1}" fill="${past?'#dc2626':'#7f1d1d'}" stroke="#fff" stroke-width=".7" opacity="${op}"/></svg>` });

        const imp = lang==='tr' ? b.impact_tr : b.impact_en;
        let h = `<div class="p-title">⚔ ${n(b,lang)}</div>` +
          `<div class="p-row"><span class="p-k">${mk.year}</span><span class="p-v">${b.yr}</span></div>` +
          `<div class="p-row"><span class="p-k">${mk.significance}</span><span class="p-v">${t.imp[b.sig]||b.sig}</span></div>` +
          (b.res ? `<div class="p-row"><span class="p-k">${mk.result}</span><span class="p-v">${b.res}</span></div>` : '') +
          narrBlock(b, lang) +
          (imp ? `<div class="p-ctx"><span class="p-ctx-i">🎯</span><b>${mk.impact}:</b> ${imp}</div>` : '') +
          (b.tactic_tr ? `<div class="p-ctx"><span class="p-ctx-i">🗡</span><b>${mk.tactic}:</b> ${b.tactic_tr}</div>` : '') +
          causalBlock('battle', b.id, lang, causalIdx);

        L.marker([b.lat,b.lon], { icon }).bindPopup(h, popOpt(360)).addTo(lg.battles);
      });
    }

    // ── Events ──
    lg.events.clearLayers();
    if (layers.events) {
      DB.events.forEach(e => {
        if (!e.lat || !e.yr) return;
        const past = e.yr <= year;
        if (!past && e.yr > year+80) return;
        const op = past ? 0.8 : 0.2;
        const icon = L.divIcon({ className:'', iconSize:[12,12], iconAnchor:[6,6],
          html:`<svg width="12" height="12"><rect x="1" y="1" width="10" height="10" rx="2" fill="${past?'#60a5fa':'#1e3a5f'}" stroke="#fff" stroke-width=".5" opacity="${op}"/></svg>` });

        let h = `<div class="p-title">📜 ${n(e,lang)}</div>` +
          `<div class="p-row"><span class="p-k">${mk.year}</span><span class="p-v">${e.yr}</span></div>` +
          `<div class="p-row"><span class="p-k">${mk.significance}</span><span class="p-v">${t.imp[e.sig]||e.sig}</span></div>` +
          narrBlock(e, lang) +
          (e.sig_tr ? `<div class="p-ctx"><span class="p-ctx-i">📌</span><b>${mk.significance}:</b> ${e.sig_tr}</div>` : '') +
          causalBlock('event', e.id, lang, causalIdx);

        L.marker([e.lat,e.lon], { icon }).bindPopup(h, popOpt(360)).addTo(lg.events);
      });
    }

    // ── Scholars ──
    lg.scholars.clearLayers();
    if (layers.scholars) {
      DB.scholars.forEach(s => {
        if (!s.lat) return;
        const alive = s.b && s.d && s.b<=year && s.d>=year;
        const past = s.d && s.d<year;
        if (!alive && !past && s.b && s.b>year) return;
        const leg = lang==='tr' ? s.legacy_tr : s.legacy_en;

        let h = `<div class="p-title">📚 ${n(s,lang)}</div>` +
          `<div class="p-row"><span class="p-k">${mk.born}</span><span class="p-v">${s.b||'?'} – ${s.d||'?'}</span></div>` +
          `<div class="p-row"><span class="p-k">${mk.field}</span><span class="p-v">${s.field} — ${s.sub}</span></div>` +
          `<div class="p-row"><span class="p-k">${mk.work}</span><span class="p-v">${lang==='tr'?s.work_tr:s.work_en}</span></div>` +
          narrBlock(s, lang) +
          (leg ? `<div class="p-ctx"><span class="p-ctx-i">🏆</span><b>${mk.legacy}:</b> ${leg}</div>` : '') +
          (s.chain_tr ? `<div class="p-ctx"><span class="p-ctx-i">🔗</span><b>${mk.chain}:</b> ${s.chain_tr}</div>` : '') +
          (s.patron_tr ? `<div class="p-ctx"><span class="p-ctx-i">👑</span><b>${mk.patron}:</b> ${s.patron_tr}</div>` : '') +
          causalBlock('scholar', s.id, lang, causalIdx);

        L.circleMarker([s.lat,s.lon], {
          radius: alive?7:4, fillColor:'#34d399',
          fillOpacity: alive?0.9:0.35, color: alive?'#fff':'#0f1629',
          weight: alive?2:0.8
        }).bindPopup(h, popOpt(360)).addTo(lg.scholars);
      });
    }

    // ── Monuments ──
    lg.monuments.clearLayers();
    if (layers.monuments) {
      DB.monuments.forEach(m => {
        if (!m.lat || !m.yr || m.yr>year+50) return;
        const built = m.yr<=year;
        const icon = L.divIcon({ className:'', iconSize:[14,14], iconAnchor:[7,13],
          html:`<svg width="14" height="14"><polygon points="7,1 13,13 1,13" fill="${built?'#fbbf24':'#6b5a24'}" stroke="#fff" stroke-width=".5" opacity="${built?0.85:0.3}"/>${m.unesco?'<circle cx="7" cy="9" r="2" fill="#fff"/>':''}</svg>` });
        const vis = lang==='tr' ? m.visitor_tr : m.visitor_en;

        let h = `<div class="p-title">🕌 ${n(m,lang)}</div>` +
          `<div class="p-row"><span class="p-k">${mk.type}</span><span class="p-v">${lang==='tr'?m.type_tr:m.type_en}</span></div>` +
          `<div class="p-row"><span class="p-k">${mk.year}</span><span class="p-v">${m.yr}</span></div>` +
          `<div class="p-row"><span class="p-k">${mk.city}</span><span class="p-v">${lang==='tr'?m.city_tr:m.city_en}</span></div>` +
          (m.unesco ? '<div class="p-unesco-tag">★ UNESCO</div>' : '') +
          narrBlock(m, lang) +
          (m.arch_tr ? `<div class="p-ctx"><span class="p-ctx-i">🏛</span><b>${mk.arch}:</b> ${m.arch_tr}</div>` : '') +
          (vis ? `<div class="p-vis"><span class="p-vis-i">💡</span>${vis}</div>` : '') +
          causalBlock('monument', m.id, lang, causalIdx);

        L.marker([m.lat,m.lon], { icon }).bindPopup(h, popOpt(360)).addTo(lg.monuments);
      });
    }

    // ── Cities ──
    lg.cities.clearLayers();
    if (layers.cities) {
      const best = {};
      DB.cities.forEach(c => {
        if (!c.lat) return;
        if (!best[c.id] || Math.abs(c.yr-year)<Math.abs(best[c.id].yr-year)) best[c.id]=c;
      });
      Object.values(best).forEach(c => {
        const r = c.pop ? Math.max(4,Math.min(16,Math.sqrt(c.pop/15000))) : 4;
        const fun = lang==='tr' ? c.fun_tr : c.fun_en;

        let h = `<div class="p-title">🏙 ${n(c,lang)}</div>` +
          `<div class="p-row"><span class="p-k">${mk.pop}</span><span class="p-v">${c.pop?c.pop.toLocaleString():'—'} (${c.yr})</span></div>` +
          `<div class="p-row"><span class="p-k">${mk.role}</span><span class="p-v">${lang==='tr'?c.role_tr:c.role_en}</span></div>` +
          narrBlock(c, lang) +
          (c.layers_tr ? `<div class="p-ctx"><span class="p-ctx-i">🏗</span><b>${lang==='tr'?'Katmanlar':'Layers'}:</b> ${c.layers_tr}</div>` : '') +
          (fun ? `<div class="p-vis"><span class="p-vis-i">🎲</span>${fun}</div>` : '');

        L.circleMarker([c.lat,c.lon], {
          radius:r, fillColor:'#f97316', fillOpacity:0.55, color:'#fff', weight:0.8
        }).bindPopup(h, popOpt(340)).addTo(lg.cities);
      });
    }

    // ── Trade Routes ──
    lg.routes.clearLayers();
    if (layers.routes) {
      DB.routes.forEach(r => {
        if (!r.wp || r.wp.length<2) return;
        const active = (!r.ps||r.ps<=year) && (!r.pe||r.pe>=year);
        const isSea = r.type_tr==='Deniz';
        const anec = lang==='tr' ? r.anec_tr : r.anec_en;

        let h = `<div class="p-title">🛤 ${n(r,lang)}</div>` +
          `<div class="p-row"><span class="p-k">${mk.type}</span><span class="p-v">${lang==='tr'?r.type_tr:r.type_en}</span></div>` +
          `<div class="p-row"><span class="p-k">${mk.period}</span><span class="p-v">${r.ps||'?'} – ${r.pe||'?'}</span></div>` +
          `<div class="p-row"><span class="p-k">${mk.goods}</span><span class="p-v">${(lang==='tr'?r.goods_tr:r.goods_en).replace(/;/g,', ')}</span></div>` +
          narrBlock(r, lang) +
          (r.econ_tr ? `<div class="p-ctx"><span class="p-ctx-i">💰</span><b>${lang==='tr'?'Ekonomik Etki':'Economic Impact'}:</b> ${r.econ_tr}</div>` : '') +
          (anec ? `<div class="p-vis"><span class="p-vis-i">📖</span>${anec}</div>` : '');

        L.polyline(r.wp, {
          color: active?'#c9a84c':'#3d3520', weight: active?(isSea?2.5:3):1.5,
          opacity: active?0.75:0.25,
          dashArray: isSea?'6,4':(active?'12,6':'4,4'),
          className: active?'trade-anim':'',
        }).bindPopup(h, popOpt(340)).addTo(lg.routes);
      });
    }
  }, [year, layers, filters, lang, t, analyticsMap, causalIdx]);

  const toggleLyr = k => setLayers(p => ({...p,[k]:!p[k]}));
  const setFlt = (k,v) => setFilters(p => ({...p,[k]:v}));

  const META = {
    dynasties:{c:LYR_COL.dynasties,n:DB.dynasties.length},
    battles:{c:LYR_COL.battles,n:DB.battles.length},
    events:{c:LYR_COL.events,n:DB.events.length},
    scholars:{c:LYR_COL.scholars,n:DB.scholars.length},
    monuments:{c:LYR_COL.monuments,n:DB.monuments.length},
    cities:{c:LYR_COL.cities,n:DB.cities.length},
    routes:{c:LYR_COL.routes,n:DB.routes.length},
  };

  return (
    <div className="map-layout">
      <div className="map-panel">
        <div className="ps">
          <div className="ps-h">{lang==='tr'?'Katmanlar':'Layers'}</div>
          {Object.keys(layers).map(k=>(
            <div key={k} className="lyr" onClick={()=>toggleLyr(k)}>
              <div className={`lyr-cb${layers[k]?' on':''}`}>{layers[k]?'✓':''}</div>
              <div className="lyr-dot" style={{background:META[k].c}}/>
              <span>{t.layers[k]}</span>
              <span className="lyr-n">{META[k].n}</span>
            </div>
          ))}
        </div>
        <div className="ps">
          <div className="ps-h">{lang==='tr'?'Filtreler':'Filters'}</div>
          {['religion','ethnic','government','period','zone'].map(fk=>(
            <div key={fk} className="flt">
              <div className="flt-l">{t.filters[fk]}</div>
              <select className="flt-s" value={filters[fk]} onChange={e=>setFlt(fk,e.target.value)}>
                <option value="">{t.filters.all}</option>
                {uniques[fk].map(v=>(
                  <option key={v} value={v}>{fk==='religion'?(t.rel[v]||v):fk==='government'?(t.gov[v]||v):v}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="ps">
          <div className="ps-h">{lang==='tr'?'Durum':'Status'}</div>
          <div className="st"><span className="st-l">{t.m.year}</span><span className="st-v">{year}</span></div>
          <div className="st"><span className="st-l">{t.m.active}</span><span className="st-v">{activeCount}</span></div>
          <div className="st"><span className="st-l">{lang==='tr'?'Dönem':'Era'}</span><span className="st-v">{eraName(year,lang)}</span></div>
          <div className="st"><span className="st-l">🔗</span><span className="st-v">{DB.causal?.length||0}</span></div>
        </div>
      </div>
      <div className="map-area">
        <div ref={mapEl} className="map-canvas"/>
        <div className="tbar">
          <div className="tbar-yr">{year}</div>
          <div className="tbar-era">{eraName(year,lang)}</div>
          <input type="range" className="tbar-range" min={622} max={1924} value={year} step={1}
            onChange={e=>setYear(+e.target.value)}/>
          <div className="tbar-ticks">
            {['622','750','900','1055','1258','1453','1600','1800','1924'].map(y=><span key={y}>{y}</span>)}
          </div>
          <button className="tbar-play" onClick={()=>setPlaying(p=>!p)}>
            {playing?'⏸':'▶'}
          </button>
        </div>
      </div>
    </div>
  );
}
