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

/* ── SVG Icon Factories ── */

/** Crossed swords – 22px red */
function battleIcon(op, past) {
  const fill = past ? '#dc2626' : '#7f1d1d';
  return L.divIcon({
    className: '', iconSize: [22, 22], iconAnchor: [11, 11],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" opacity="${op}">
      <g stroke="${fill}" stroke-width="2.2" stroke-linecap="round">
        <line x1="4" y1="4" x2="18" y2="18"/>
        <line x1="18" y1="4" x2="4" y2="18"/>
        <line x1="4" y1="4" x2="7" y2="2" stroke-width="1.6"/>
        <line x1="4" y1="4" x2="2" y2="7" stroke-width="1.6"/>
        <line x1="18" y1="4" x2="15" y2="2" stroke-width="1.6"/>
        <line x1="18" y1="4" x2="20" y2="7" stroke-width="1.6"/>
      </g>
      <circle cx="11" cy="11" r="3" fill="${fill}" opacity="0.6"/>
    </svg>`
  });
}

/** Rounded square – 20px blue */
function eventIcon(op, past) {
  const fill = past ? '#60a5fa' : '#1e3a5f';
  return L.divIcon({
    className: '', iconSize: [20, 20], iconAnchor: [10, 10],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" opacity="${op}">
      <rect x="2" y="2" width="16" height="16" rx="4" ry="4" fill="${fill}" stroke="#fff" stroke-width="1.2"/>
      <circle cx="10" cy="10" r="3" fill="#fff" opacity="0.5"/>
    </svg>`
  });
}

/** Up arrow triangle – 24px gold for monuments */
function monumentIcon(op, built, unesco) {
  const fill = built ? '#fbbf24' : '#6b5a24';
  return L.divIcon({
    className: '', iconSize: [24, 24], iconAnchor: [12, 22],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" opacity="${op}">
      <polygon points="12,1 23,23 1,23" fill="${fill}" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/>
      ${unesco ? '<circle cx="12" cy="15" r="3.5" fill="#fff" opacity="0.85"/><text x="12" y="17.5" text-anchor="middle" font-size="6" font-weight="bold" fill="' + fill + '">U</text>' : '<line x1="12" y1="8" x2="12" y2="17" stroke="#fff" stroke-width="1.5" opacity="0.6"/><line x1="8" y1="17" x2="16" y2="17" stroke="#fff" stroke-width="1.5" opacity="0.6"/>'}
    </svg>`
  });
}

/**
 * Renders all map layers based on current state.
 * Returns the active dynasty count.
 */
export function renderLayers({ lg, layers, filters, year, lang, t, analyticsMap, causalIdx, onPopupOpen }) {
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
  Object.values(rulersByDyn).forEach(arr => arr.sort((a, b) => (a.ord || 0) - (b.ord || 0)));

  const dynNameMap = {};
  DB.dynasties.forEach(d => { dynNameMap[d.id] = n(d, lang); });

  /* Helper: track popup opens */
  const popupTrack = (marker, type, id) => {
    if (onPopupOpen) {
      marker.on('popupopen', () => onPopupOpen(type, id));
    }
    return marker;
  };

  let cnt = 0;

  // ── Dynasties ──
  lg.dynasties.clearLayers();
  if (layers.dynasties) {
    DB.dynasties.forEach(d => {
      if (!d.bn || d.start > year || d.end < year || !dynOk(d)) return;
      cnt++;
      const col = REL_C[d.rel] || ZONE_C[d.zone] || '#c9a84c';
      const op = (IMP_OP[d.imp] || 0.18) * 1.2;
      const w = d.imp === 'Kritik' ? 4 : d.imp === 'Yüksek' ? 3 : 1.4;

      const rect = L.rectangle([[d.bs, d.bw], [d.bn, d.be]], {
        color: col, weight: w, fillColor: col, fillOpacity: op,
        dashArray: d.imp === 'Düşük' ? '4,4' : ''
      }).bindPopup(
        buildDynastyPopup(d, lang, t, analyticsMap, causalIdx) +
        buildRulerListHtml(rulersByDyn[d.id] || [], lang, t),
        popOpt(400)
      ).addTo(lg.dynasties);
      popupTrack(rect, 'dynasty', d.id);

      // Capital dot with glow
      if (d.lat && d.lon) {
        const r = d.imp === 'Kritik' ? 10 : d.imp === 'Yüksek' ? 8 : 6;
        // Glow ring
        L.circleMarker([d.lat, d.lon], {
          radius: r + 4, fillColor: col, fillOpacity: 0.2, color: col, weight: 0, stroke: false,
          className: 'dynasty-glow'
        }).addTo(lg.dynasties);
        // Main dot
        L.circleMarker([d.lat, d.lon], {
          radius: r, fillColor: col, fillOpacity: 0.95, color: '#080c18', weight: 1.8
        }).bindTooltip(n(d, lang), { direction: 'top', offset: [0, -8] }).addTo(lg.dynasties);
      }
    });
  }

  // ── Battles ── (crossed swords SVG, 22px)
  lg.battles.clearLayers();
  if (layers.battles) {
    DB.battles.forEach(b => {
      if (!b.lat || !b.yr) return;
      const past = b.yr <= year, near = Math.abs(b.yr - year) < 50;
      if (!past && !near) return;
      const op = past ? (near ? 0.95 : 0.55) : 0.25;
      const icon = battleIcon(op, past);
      const m = L.marker([b.lat, b.lon], { icon }).bindPopup(buildBattlePopup(b, lang, t, causalIdx), popOpt(360)).addTo(lg.battles);
      popupTrack(m, 'battle', b.id);
    });
  }

  // ── Events ── (rounded square, 20px)
  lg.events.clearLayers();
  if (layers.events) {
    DB.events.forEach(e => {
      if (!e.lat || !e.yr) return;
      const past = e.yr <= year;
      if (!past && e.yr > year + 80) return;
      const op = past ? 0.85 : 0.2;
      const icon = eventIcon(op, past);
      const em = L.marker([e.lat, e.lon], { icon }).bindPopup(buildEventPopup(e, lang, t, causalIdx), popOpt(360)).addTo(lg.events);
      popupTrack(em, 'event', e.id);
    });
  }

  // ── Scholars ── (12px circle + white halo)
  lg.scholars.clearLayers();
  if (layers.scholars) {
    DB.scholars.forEach(s => {
      if (!s.lat) return;
      const alive = s.b && s.d && s.b <= year && s.d >= year;
      const past = s.d && s.d < year;
      if (!alive && !past && s.b && s.b > year) return;

      const r = alive ? 12 : 7;
      const fop = alive ? 0.95 : 0.4;
      // White halo
      L.circleMarker([s.lat, s.lon], {
        radius: r + 3, fillColor: '#fff', fillOpacity: alive ? 0.35 : 0.12,
        color: '#fff', weight: 0, stroke: false
      }).addTo(lg.scholars);
      // Main circle
      L.circleMarker([s.lat, s.lon], {
        radius: r, fillColor: '#34d399',
        fillOpacity: fop, color: alive ? '#fff' : '#0f1629',
        weight: alive ? 2.2 : 1
      }).bindPopup(buildScholarPopup(s, lang, t, causalIdx), popOpt(360)).addTo(lg.scholars);
      /* Track last added scholar marker */
      const sLayers = lg.scholars.getLayers();
      if (sLayers.length) popupTrack(sLayers[sLayers.length - 1], 'scholar', s.id);
    });
  }

  // ── Monuments ── (24px up-arrow triangle, gold)
  lg.monuments.clearLayers();
  if (layers.monuments) {
    DB.monuments.forEach(m => {
      if (!m.lat || !m.yr || m.yr > year + 50) return;
      const built = m.yr <= year;
      const op = built ? 0.9 : 0.3;
      const icon = monumentIcon(op, built, m.unesco);
      const mm = L.marker([m.lat, m.lon], { icon }).bindPopup(buildMonumentPopup(m, lang, t, causalIdx), popOpt(360)).addTo(lg.monuments);
      popupTrack(mm, 'monument', m.id);
    });
  }

  // ── Cities ── (14px filled circle, orange)
  lg.cities.clearLayers();
  if (layers.cities) {
    const best = {};
    DB.cities.forEach(c => {
      if (!c.lat) return;
      if (!best[c.id] || Math.abs(c.yr - year) < Math.abs(best[c.id].yr - year)) best[c.id] = c;
    });
    Object.values(best).forEach(c => {
      const r = c.pop ? Math.max(7, Math.min(20, Math.sqrt(c.pop / 12000))) : 7;
      L.circleMarker([c.lat, c.lon], {
        radius: r, fillColor: '#f97316', fillOpacity: 0.65, color: '#fff', weight: 1.2
      }).bindPopup(buildCityPopup(c, lang, t), popOpt(340)).addTo(lg.cities);
      const cLayers = lg.cities.getLayers();
      if (cLayers.length) popupTrack(cLayers[cLayers.length - 1], 'city', c.id);
    });
  }

  // ── Trade Routes ── (weight 5, prominent dash animation)
  lg.routes.clearLayers();
  if (layers.routes) {
    DB.routes.forEach(r => {
      if (!r.wp || r.wp.length < 2) return;
      const active = (!r.ps || r.ps <= year) && (!r.pe || r.pe >= year);
      const isSea = r.type_tr === 'Deniz';
      // Glow under-line for active routes
      if (active) {
        L.polyline(r.wp, {
          color: '#c9a84c', weight: 9, opacity: 0.15, lineCap: 'round', lineJoin: 'round',
          interactive: false
        }).addTo(lg.routes);
      }
      L.polyline(r.wp, {
        color: active ? '#c9a84c' : '#3d3520',
        weight: active ? (isSea ? 4.5 : 5) : 2,
        opacity: active ? 0.8 : 0.3,
        dashArray: isSea ? '8,6' : (active ? '16,8' : '4,4'),
        className: active ? 'trade-anim' : '',
        lineCap: 'round', lineJoin: 'round'
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
      const rLayers = lg.rulers.getLayers();
      if (rLayers.length) popupTrack(rLayers[rLayers.length - 1], 'ruler', r.id);
    });
  }

  return cnt;
}
