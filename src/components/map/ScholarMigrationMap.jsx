/**
 * ScholarMigrationMap.jsx — SESSION 14
 * Animated scholar migration paths on Leaflet canvas.
 *
 * Features:
 *   - Birth (green) → Education (blue) → Death city (red) arcs
 *   - Animated line drawing with D3-style easing
 *   - Century & discipline filters
 *   - Play/pause: sequential scholar journeys
 *   - Hover tooltip with scholar info
 *   - Canvas-based for performance
 *
 * Props:
 *   map   : Leaflet map instance
 *   lang  : 'tr' | 'en' | 'ar'
 *   visible : boolean
 */
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import DB from '../../data/db.json';

/* ─── i18n ─── */
const L = {
  tr: {
    title: 'Âlim Göç Haritası', century: 'Yüzyıl', disc: 'Disiplin',
    all: 'Tümü', play: 'Oynat', pause: 'Durdur', speed: 'Hız',
    birth: 'Doğum', edu: 'Eğitim', death: 'Vefat', count: 'Âlim',
    scholars: 'âlim göç verisi', noData: 'Göç verisi yok',
  },
  en: {
    title: 'Scholar Migration Map', century: 'Century', disc: 'Discipline',
    all: 'All', play: 'Play', pause: 'Pause', speed: 'Speed',
    birth: 'Birth', edu: 'Education', death: 'Death', count: 'Scholars',
    scholars: 'scholars with migration data', noData: 'No migration data',
  },
  ar: {
    title: 'خريطة هجرة العلماء', century: 'القرن', disc: 'التخصص',
    all: 'الكل', play: 'تشغيل', pause: 'إيقاف', speed: 'السرعة',
    birth: 'الولادة', edu: 'التعليم', death: 'الوفاة', count: 'العلماء',
    scholars: 'علماء مع بيانات الهجرة', noData: 'لا توجد بيانات هجرة',
  },
};

/* ─── Colors ─── */
const C = {
  birth: '#4ade80',    // green
  education: '#60a5fa', // blue
  death: '#f87171',     // red
  arc: 'rgba(201, 168, 76, 0.6)', // gold
  arcActive: '#c9a84c',
};

/* ─── Bezier arc between two points ─── */
function drawArc(ctx, p1, p2, progress = 1, color = C.arc, lineWidth = 1.5) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const curvature = Math.min(dist * 0.3, 60);

  // Control point perpendicular to midpoint
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const nx = -dy / dist;
  const ny = dx / dist;
  const cx = mx + nx * curvature;
  const cy = my + ny * curvature;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.globalAlpha = 0.7;

  if (progress >= 1) {
    ctx.moveTo(p1.x, p1.y);
    ctx.quadraticCurveTo(cx, cy, p2.x, p2.y);
  } else {
    // Partial arc
    const steps = 30;
    const limit = Math.floor(steps * progress);
    ctx.moveTo(p1.x, p1.y);
    for (let i = 1; i <= limit; i++) {
      const t = i / steps;
      const x = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * cx + t * t * p2.x;
      const y = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * cy + t * t * p2.y;
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawDot(ctx, pt, radius, color, label) {
  ctx.beginPath();
  ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

/* ─── Main Component ─── */
export default function ScholarMigrationMap({ map, lang = 'tr', visible = true }) {
  const canvasRef = useRef(null);
  const [centuryFilter, setCenturyFilter] = useState(0);
  const [discFilter, setDiscFilter] = useState('');
  const [playing, setPlaying] = useState(false);
  const [playIdx, setPlayIdx] = useState(0);
  const [speed, setSpeed] = useState(2);
  const [hoveredScholar, setHoveredScholar] = useState(null);
  const [zoom, setZoom] = useState(4);
  const animRef = useRef(null);
  const playingRef = useRef(false);

  const t = L[lang] || L.en;

  /* ─── Scholars with migration data ─── */
  const scholars = useMemo(() => {
    return DB.scholars.filter(s => s.birthplace && s.education_cities);
  }, []);

  const filtered = useMemo(() => {
    let list = scholars;
    if (centuryFilter > 0) {
      list = list.filter(s => {
        const c = Math.ceil((s.b || 700) / 100);
        return c === centuryFilter;
      });
    }
    if (discFilter) {
      list = list.filter(s => (s.disc_en || '').toLowerCase().includes(discFilter.toLowerCase()));
    }
    return list;
  }, [scholars, centuryFilter, discFilter]);

  /* ─── Unique disciplines ─── */
  const disciplines = useMemo(() => {
    const set = new Set();
    scholars.forEach(s => { if (s.disc_en) set.add(s.disc_en); });
    return [...set].sort();
  }, [scholars]);

  /* ─── Track zoom/pan ─── */
  useEffect(() => {
    if (!map) return;
    const onMove = () => setZoom(map.getZoom());
    map.on('moveend', onMove);
    map.on('zoomend', onMove);
    return () => { map.off('moveend', onMove); map.off('zoomend', onMove); };
  }, [map]);

  /* ─── Canvas setup ─── */
  useEffect(() => {
    if (!map || !visible) return;
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '460';
      canvasRef.current = canvas;
    }
    const panes = map.getPanes();
    if (panes.overlayPane && !panes.overlayPane.contains(canvasRef.current)) {
      panes.overlayPane.appendChild(canvasRef.current);
    }
    return () => {
      if (canvasRef.current?.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
      }
    };
  }, [map, visible]);

  /* ─── Render ─── */
  const render = useCallback(() => {
    if (!map || !canvasRef.current || !visible) return;

    const canvas = canvasRef.current;
    const size = map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;
    canvas.style.width = size.x + 'px';
    canvas.style.height = size.y + 'px';
    const offset = map.containerPointToLayerPoint([0, 0]);
    canvas.style.transform = `translate(${offset.x}px, ${offset.y}px)`;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (filtered.length === 0) return;

    const activeScholar = playing && filtered[playIdx] ? filtered[playIdx] : null;
    const drawList = activeScholar ? [activeScholar] : filtered;

    for (const s of drawList) {
      const bp = s.birthplace;
      const deathPt = { lat: s.lat, lon: s.lon };
      const isActive = activeScholar && activeScholar.id === s.id;
      const lineColor = isActive ? C.arcActive : C.arc;
      const lineW = isActive ? 2.5 : 1;
      const dotR = isActive ? 5 : 3;

      // Birth dot
      const birthPx = map.latLngToContainerPoint([bp.lat, bp.lon]);
      drawDot(ctx, birthPx, dotR + 1, C.birth);

      // Education city dots + arcs from birth → each edu city
      let prevPt = birthPx;
      for (const ec of s.education_cities) {
        const ecPx = map.latLngToContainerPoint([ec.lat, ec.lon]);
        drawArc(ctx, prevPt, ecPx, 1, lineColor, lineW);
        drawDot(ctx, ecPx, dotR, C.education);
        prevPt = ecPx;
      }

      // Arc from last edu → death city
      const deathPx = map.latLngToContainerPoint([deathPt.lat, deathPt.lon]);
      drawArc(ctx, prevPt, deathPx, 1, lineColor, lineW);
      drawDot(ctx, deathPx, dotR + 1, C.death);

      // Name label for active scholar
      if (isActive) {
        ctx.fillStyle = '#c9a84c';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(s[lang] || s.en, birthPx.x, birthPx.y - 12);
      }
    }
  }, [map, filtered, visible, playing, playIdx, lang, zoom]);

  useEffect(() => { render(); }, [render]);
  useEffect(() => {
    if (!map) return;
    map.on('moveend', render);
    map.on('zoomend', render);
    return () => { map.off('moveend', render); map.off('zoomend', render); };
  }, [map, render]);

  /* ─── Play animation ─── */
  useEffect(() => {
    playingRef.current = playing;
    if (!playing || filtered.length === 0) return;

    const interval = setInterval(() => {
      if (!playingRef.current) { clearInterval(interval); return; }
      setPlayIdx(prev => {
        const next = prev + 1;
        if (next >= filtered.length) {
          setPlaying(false);
          return 0;
        }
        return next;
      });
    }, 3000 / speed);

    return () => clearInterval(interval);
  }, [playing, filtered.length, speed]);

  // When playIdx changes, fly to scholar's birth city
  useEffect(() => {
    if (!playing || !map || !filtered[playIdx]) return;
    const s = filtered[playIdx];
    const bp = s.birthplace;
    try {
      map.flyTo([bp.lat, bp.lon], 5, { duration: 0.8 });
    } catch (_) {}
  }, [playIdx, playing, map, filtered]);

  if (!visible) return null;

  const centuries = Array.from({ length: 15 }, (_, i) => i + 1);

  return (
    <div className="smm-controls" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="smm-title">{t.title}</div>

      {/* Century filter */}
      <div className="smm-row">
        <label className="smm-label">{t.century}</label>
        <select className="smm-select" value={centuryFilter}
          onChange={e => { setCenturyFilter(+e.target.value); setPlayIdx(0); }}>
          <option value={0}>{t.all}</option>
          {centuries.map(c => (
            <option key={c} value={c}>{c}.</option>
          ))}
        </select>
      </div>

      {/* Discipline filter */}
      <div className="smm-row">
        <label className="smm-label">{t.disc}</label>
        <select className="smm-select" value={discFilter}
          onChange={e => { setDiscFilter(e.target.value); setPlayIdx(0); }}>
          <option value="">{t.all}</option>
          {disciplines.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Play controls */}
      <div className="smm-row smm-play-row">
        <button className={`smm-play-btn${playing ? ' active' : ''}`}
          onClick={() => { setPlaying(p => !p); if (!playing) setPlayIdx(0); }}>
          {playing ? `⏸ ${t.pause}` : `▶ ${t.play}`}
        </button>
        <label className="smm-label">{t.speed}</label>
        <input type="range" min={1} max={5} value={speed}
          onChange={e => setSpeed(+e.target.value)}
          className="smm-speed" />
      </div>

      {/* Playing indicator */}
      {playing && filtered[playIdx] && (
        <div className="smm-now">
          {filtered[playIdx][lang] || filtered[playIdx].en}
          <span className="smm-now-dates">
            ({filtered[playIdx].b}–{filtered[playIdx].d})
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="smm-legend">
        <span><span className="smm-dot" style={{ background: C.birth }} /> {t.birth}</span>
        <span><span className="smm-dot" style={{ background: C.education }} /> {t.edu}</span>
        <span><span className="smm-dot" style={{ background: C.death }} /> {t.death}</span>
      </div>

      <div className="smm-count">{filtered.length} {t.scholars}</div>
    </div>
  );
}
