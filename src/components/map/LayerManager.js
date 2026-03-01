import L from 'leaflet';
import DB from '../../data/db.json';
import { REL_C, ZONE_C, IMP_OP } from '../../config/colors';
import { n } from '../../hooks/useEntityLookup';
import {
  buildDynastyPopup, buildBattlePopup, buildEventPopup,
  buildScholarPopup, buildMonumentPopup, buildCityPopup, buildRoutePopup,
  buildRulerPopup, buildRulerListHtml,
  popOpt
} from '../shared/PopupFactory';

/**
 * Renders all map layers based on current state.
 * Returns the active dynasty count.
 */
export function renderLayers({ lg, layers, filters, year, lang, t, analyticsMap, causalIdx }) {
  const dynOk = d => {
    if (filters.religion && d.rel !== filters.religion) return false;
    if (filters.ethnic && d.eth !== filters.ethnic) return false;
    if (filters.government && d.gov !== filters.government) return false;
    if (filters.period && d.period !== filters.period) return false;
    if (filters.zone && d.zone !== filters.zone) return false;
    return true;
  };

  // Build ruler-by-dynasty index
  const rulersByDyn = {};
  (DB.rulers || []).forEach(r => {
    if (!rulersByDyn[r.did]) rulersByDyn[r.did] = [];
    rulersByDyn[r.did].push(r);
  });
  // Sort by reign order
  Object.values(rulersByDyn).forEach(arr => arr.sort((a, b) => (a.ord || 0) - (b.ord || 0)));

  // Dynasty name map for ruler popups
  const dynNameMap = {};
  DB.dynasties.forEach(d => { dynNameMap[d.id] = n(d, lang); });

  let cnt = 0;

  // ── Dynasties ──
  lg.dynasties.clearLayers();
  if (layers.dynasties) {
    DB.dynasties.forEach(d => {
      if (!d.bn || d.start > year || d.end < year || !dynOk(d)) return;
      cnt++;
      const col = REL_C[d.rel] || ZONE_C[d.zone] || '#c9a84c';
      const op = (IMP_OP[d.imp] || 0.18) * 1.2;
      const w = d.imp === 'Kritik' ? 3 : d.imp === 'Yüksek' ? 2.2 : 1.2;

      L.rectangle([[d.bs, d.bw], [d.bn, d.be]], {
        color: col, weight: w, fillColor: col, fillOpacity: op,
        dashArray: d.imp === 'Düşük' ? '4,4' : ''
      }).bindPopup(
        buildDynastyPopup(d, lang, t, analyticsMap, causalIdx) +
        buildRulerListHtml(rulersByDyn[d.id] || [], lang, t),
        popOpt(400)
      ).addTo(lg.dynasties);

      if (d.lat && d.lon) {
        const r = d.imp === 'Kritik' ? 6 : d.imp === 'Yüksek' ? 5 : 3.5;
        L.circleMarker([d.lat, d.lon], {
          radius: r, fillColor: col, fillOpacity: 0.9, color: '#080c18', weight: 1.5
        }).bindTooltip(n(d, lang), { direction: 'top', offset: [0, -8] }).addTo(lg.dynasties);
      }
    });
  }

  // ── Battles ──
  lg.battles.clearLayers();
  if (layers.battles) {
    DB.battles.forEach(b => {
      if (!b.lat || !b.yr) return;
      const past = b.yr <= year, near = Math.abs(b.yr - year) < 50;
      if (!past && !near) return;
      const op = past ? (near ? 0.95 : 0.5) : 0.25;
      const sz = b.sig === 'Kritik' ? 10 : 8;
      const icon = L.divIcon({
        className: '', iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2],
        html: `<svg width="${sz}" height="${sz}"><polygon points="${sz / 2},1 ${sz - 1},${sz - 1} 1,${sz - 1}" fill="${past ? '#dc2626' : '#7f1d1d'}" stroke="#fff" stroke-width=".7" opacity="${op}"/></svg>`
      });
      L.marker([b.lat, b.lon], { icon }).bindPopup(buildBattlePopup(b, lang, t, causalIdx), popOpt(360)).addTo(lg.battles);
    });
  }

  // ── Events ──
  lg.events.clearLayers();
  if (layers.events) {
    DB.events.forEach(e => {
      if (!e.lat || !e.yr) return;
      const past = e.yr <= year;
      if (!past && e.yr > year + 80) return;
      const op = past ? 0.8 : 0.2;
      const icon = L.divIcon({
        className: '', iconSize: [12, 12], iconAnchor: [6, 6],
        html: `<svg width="12" height="12"><rect x="1" y="1" width="10" height="10" rx="2" fill="${past ? '#60a5fa' : '#1e3a5f'}" stroke="#fff" stroke-width=".5" opacity="${op}"/></svg>`
      });
      L.marker([e.lat, e.lon], { icon }).bindPopup(buildEventPopup(e, lang, t, causalIdx), popOpt(360)).addTo(lg.events);
    });
  }

  // ── Scholars ──
  lg.scholars.clearLayers();
  if (layers.scholars) {
    DB.scholars.forEach(s => {
      if (!s.lat) return;
      const alive = s.b && s.d && s.b <= year && s.d >= year;
      const past = s.d && s.d < year;
      if (!alive && !past && s.b && s.b > year) return;

      L.circleMarker([s.lat, s.lon], {
        radius: alive ? 7 : 4, fillColor: '#34d399',
        fillOpacity: alive ? 0.9 : 0.35, color: alive ? '#fff' : '#0f1629',
        weight: alive ? 2 : 0.8
      }).bindPopup(buildScholarPopup(s, lang, t, causalIdx), popOpt(360)).addTo(lg.scholars);
    });
  }

  // ── Monuments ──
  lg.monuments.clearLayers();
  if (layers.monuments) {
    DB.monuments.forEach(m => {
      if (!m.lat || !m.yr || m.yr > year + 50) return;
      const built = m.yr <= year;
      const icon = L.divIcon({
        className: '', iconSize: [14, 14], iconAnchor: [7, 13],
        html: `<svg width="14" height="14"><polygon points="7,1 13,13 1,13" fill="${built ? '#fbbf24' : '#6b5a24'}" stroke="#fff" stroke-width=".5" opacity="${built ? 0.85 : 0.3}"/>${m.unesco ? '<circle cx="7" cy="9" r="2" fill="#fff"/>' : ''}</svg>`
      });
      L.marker([m.lat, m.lon], { icon }).bindPopup(buildMonumentPopup(m, lang, t, causalIdx), popOpt(360)).addTo(lg.monuments);
    });
  }

  // ── Cities ──
  lg.cities.clearLayers();
  if (layers.cities) {
    const best = {};
    DB.cities.forEach(c => {
      if (!c.lat) return;
      if (!best[c.id] || Math.abs(c.yr - year) < Math.abs(best[c.id].yr - year)) best[c.id] = c;
    });
    Object.values(best).forEach(c => {
      const r = c.pop ? Math.max(4, Math.min(16, Math.sqrt(c.pop / 15000))) : 4;
      L.circleMarker([c.lat, c.lon], {
        radius: r, fillColor: '#f97316', fillOpacity: 0.55, color: '#fff', weight: 0.8
      }).bindPopup(buildCityPopup(c, lang, t), popOpt(340)).addTo(lg.cities);
    });
  }

  // ── Trade Routes ──
  lg.routes.clearLayers();
  if (layers.routes) {
    DB.routes.forEach(r => {
      if (!r.wp || r.wp.length < 2) return;
      const active = (!r.ps || r.ps <= year) && (!r.pe || r.pe >= year);
      const isSea = r.type_tr === 'Deniz';
      L.polyline(r.wp, {
        color: active ? '#c9a84c' : '#3d3520', weight: active ? (isSea ? 2.5 : 3) : 1.5,
        opacity: active ? 0.75 : 0.25,
        dashArray: isSea ? '6,4' : (active ? '12,6' : '4,4'),
        className: active ? 'trade-anim' : '',
      }).bindPopup(buildRoutePopup(r, lang, t), popOpt(340)).addTo(lg.routes);
    });
  }

  // ── Rulers ──
  lg.rulers.clearLayers();
  if (layers.rulers) {
    (DB.rulers || []).forEach(r => {
      if (!r.lat || !r.lon || !r.rs) return;
      const ruling = r.rs <= year && (r.re || 9999) >= year;
      const past = (r.re || 9999) < year;
      const future = r.rs > year;
      if (future && r.rs > year + 50) return;

      const col = ruling ? '#e879f9' : past ? '#9333ea' : '#581c87';
      const op = ruling ? 0.95 : past ? 0.4 : 0.2;
      const radius = ruling ? 5 : 3;
      const weight = ruling ? 1.5 : 0.8;

      const dynName = dynNameMap[r.did] || '';

      L.circleMarker([r.lat, r.lon], {
        radius, fillColor: col, fillOpacity: op,
        color: ruling ? '#fff' : '#0f1629', weight
      })
        .bindPopup(buildRulerPopup(r, lang, t, dynName), popOpt(340))
        .bindTooltip(`👑 ${r.n}`, { direction: 'top', offset: [0, -6] })
        .addTo(lg.rulers);
    });
  }

  return cnt;
}
