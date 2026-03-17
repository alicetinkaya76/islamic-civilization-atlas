/**
 * HeatmapLayer.jsx — SESSION 13, Bileşen 1
 * Canvas-based heatmap / cluster / marker rendering for el-A'lâm + Yâkût data.
 *
 * Zoom behaviour:
 *   zoom < 6  → heatmap (canvas density)
 *   6–10      → cluster circles
 *   zoom > 10 → individual markers
 *
 * Props:
 *   map       : Leaflet map instance
 *   lang      : 'tr' | 'en' | 'ar'
 *   visible   : boolean
 */
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import useAsyncData from '../../hooks/useAsyncData';

/* ─── i18n ─── */
const LABELS = {
  tr: {
    title: 'Yoğunluk Haritası', alam: 'el-A\'lâm', yaqut: 'Yâkût', both: 'Her İkisi',
    century: 'Yüzyıl', all: 'Tümü', source: 'Kaynak', count: 'Kayıt',
    confidence: 'Güvenilirlik', exact: 'Kesin', approx: 'Yaklaşık', region: 'Bölge',
  },
  en: {
    title: 'Density Map', alam: 'al-Aʿlām', yaqut: 'Yāqūt', both: 'Both',
    century: 'Century', all: 'All', source: 'Source', count: 'Records',
    confidence: 'Confidence', exact: 'Exact', approx: 'Approx.', region: 'Region',
  },
  ar: {
    title: 'خريطة الكثافة', alam: 'الأعلام', yaqut: 'ياقوت', both: 'كلاهما',
    century: 'القرن', all: 'الكل', source: 'المصدر', count: 'السجلات',
    confidence: 'الدقة', exact: 'دقيق', approx: 'تقريبي', region: 'منطقة',
  },
};

/* ─── Color ramps ─── */
const HEAT_COLORS = [
  'rgba(0, 0, 255, 0)',
  'rgba(0, 0, 255, 0.15)',
  'rgba(0, 128, 255, 0.35)',
  'rgba(0, 255, 128, 0.5)',
  'rgba(255, 255, 0, 0.65)',
  'rgba(255, 128, 0, 0.8)',
  'rgba(255, 0, 0, 0.95)',
];

function getHeatColor(value) {
  const idx = Math.min(Math.floor(value * (HEAT_COLORS.length - 1)), HEAT_COLORS.length - 1);
  return HEAT_COLORS[idx];
}

/* ─── Grid cell helper ─── */
function buildGrid(points, mapBounds, cellSize) {
  const grid = {};
  const sw = mapBounds.getSouthWest();
  const ne = mapBounds.getNorthEast();

  for (const p of points) {
    if (p.lat < sw.lat || p.lat > ne.lat || p.lon < sw.lng || p.lon > ne.lng) continue;
    const gx = Math.floor((p.lon - sw.lng) / cellSize);
    const gy = Math.floor((p.lat - sw.lat) / cellSize);
    const key = `${gx},${gy}`;
    if (!grid[key]) grid[key] = { count: 0, lat: 0, lon: 0 };
    grid[key].count += 1;
    grid[key].lat += p.lat;
    grid[key].lon += p.lon;
  }

  // Average positions
  for (const k in grid) {
    grid[k].lat /= grid[k].count;
    grid[k].lon /= grid[k].count;
  }
  return Object.values(grid);
}

/* ─── Main Component ─── */
export default function HeatmapLayer({ map, lang = 'tr', visible = true }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [source, setSource] = useState('both');       // 'alam' | 'yaqut' | 'both'
  const [centuryFilter, setCenturyFilter] = useState(0); // 0 = all
  const [confFilter, setConfFilter] = useState('all');    // 'all' | 'exact' | 'approximate'
  const [zoom, setZoom] = useState(map ? map.getZoom() : 4);

  const t = LABELS[lang] || LABELS.en;

  const { data: alamData } = useAsyncData('/data/alam_lite.json');
  const { data: yaqutData } = useAsyncData('/data/yaqut_lite.json');

  /* ─── Filtered points ─── */
  const points = useMemo(() => {
    const pts = [];

    // el-A'lâm
    if ((source === 'alam' || source === 'both') && alamData) {
      for (const r of alamData) {
        if (!r.lat || !r.lon) continue;
        if (centuryFilter > 0 && r.c !== centuryFilter) continue;
        pts.push({ lat: r.lat, lon: r.lon, src: 'alam', name: r.ht || r.he || '', c: r.c });
      }
    }

    // Yâkût
    if ((source === 'yaqut' || source === 'both') && yaqutData) {
      for (const r of yaqutData) {
        if (!r.lat || !r.lon) continue;
        if (confFilter !== 'all') {
          const gc = r.geo_confidence || 'exact';
          if (confFilter === 'exact' && gc !== 'exact') continue;
          if (confFilter === 'approximate' && !['exact', 'approximate'].includes(gc)) continue;
        }
        pts.push({ lat: r.lat, lon: r.lon, src: 'yaqut', name: r.ht || r.he || '', gt: r.gt });
      }
    }

    return pts;
  }, [alamData, yaqutData, source, centuryFilter, confFilter]);

  /* ─── Track zoom ─── */
  useEffect(() => {
    if (!map) return;
    const onZoom = () => setZoom(map.getZoom());
    map.on('zoomend', onZoom);
    map.on('moveend', onZoom); // also re-render on pan
    return () => { map.off('zoomend', onZoom); map.off('moveend', onZoom); };
  }, [map]);

  /* ─── Canvas overlay setup ─── */
  useEffect(() => {
    if (!map || !visible) {
      if (overlayRef.current) {
        map?.removeLayer(overlayRef.current);
        overlayRef.current = null;
      }
      return;
    }

    // L.canvas overlay approach: we'll use a custom pane with a canvas
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '450';
      canvasRef.current = canvas;
    }

    const panes = map.getPanes();
    if (panes.overlayPane && !panes.overlayPane.contains(canvasRef.current)) {
      panes.overlayPane.appendChild(canvasRef.current);
    }

    return () => {
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
      }
    };
  }, [map, visible]);

  /* ─── Render canvas ─── */
  const renderCanvas = useCallback(() => {
    if (!map || !canvasRef.current || !visible || points.length === 0) {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    const size = map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;
    canvas.style.width = size.x + 'px';
    canvas.style.height = size.y + 'px';

    // Align canvas with map origin
    const origin = map.getPixelOrigin();
    const offset = map.containerPointToLayerPoint([0, 0]);
    canvas.style.transform = `translate(${offset.x}px, ${offset.y}px)`;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const currentZoom = map.getZoom();
    const bounds = map.getBounds();

    if (currentZoom < 6) {
      // ── HEATMAP MODE ──
      const cellDeg = 2.0;
      const grid = buildGrid(points, bounds, cellDeg);
      const maxCount = Math.max(1, ...grid.map(g => g.count));

      for (const cell of grid) {
        const pt = map.latLngToContainerPoint([cell.lat, cell.lon]);
        const intensity = Math.min(cell.count / maxCount, 1);
        const radius = 15 + intensity * 35;

        const gradient = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius);
        gradient.addColorStop(0, getHeatColor(intensity));
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    } else if (currentZoom <= 10) {
      // ── CLUSTER MODE ──
      const cellDeg = currentZoom < 8 ? 0.5 : 0.15;
      const grid = buildGrid(points, bounds, cellDeg);
      const maxCount = Math.max(1, ...grid.map(g => g.count));

      for (const cell of grid) {
        const pt = map.latLngToContainerPoint([cell.lat, cell.lon]);
        const radius = 8 + Math.sqrt(cell.count / maxCount) * 18;

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = cell.count > maxCount * 0.7 ? 'rgba(255,80,50,0.7)' :
                         cell.count > maxCount * 0.3 ? 'rgba(255,200,0,0.65)' :
                         'rgba(80,200,255,0.55)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Count label
        if (cell.count > 1 && radius > 10) {
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${Math.max(9, Math.min(13, radius * 0.6))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cell.count > 999 ? Math.round(cell.count / 1000) + 'k' : cell.count, pt.x, pt.y);
        }
      }
    } else {
      // ── MARKER MODE ──
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      for (const p of points) {
        if (p.lat < sw.lat || p.lat > ne.lat || p.lon < sw.lng || p.lon > ne.lng) continue;
        const pt = map.latLngToContainerPoint([p.lat, p.lon]);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = p.src === 'alam' ? 'rgba(52,211,153,0.8)' : 'rgba(96,165,250,0.8)';
        ctx.fill();
      }
    }
  }, [map, points, visible, zoom]);

  // Re-render on every zoom/pan/data change
  useEffect(() => { renderCanvas(); }, [renderCanvas, zoom]);

  // Also listen for map move
  useEffect(() => {
    if (!map) return;
    map.on('moveend', renderCanvas);
    map.on('zoomend', renderCanvas);
    return () => {
      map.off('moveend', renderCanvas);
      map.off('zoomend', renderCanvas);
    };
  }, [map, renderCanvas]);

  if (!visible) return null;

  const centuries = Array.from({ length: 15 }, (_, i) => i + 1);

  return (
    <div className="heatmap-controls">
      <div className="hm-title">{t.title}</div>

      {/* Source toggle */}
      <div className="hm-row">
        <label className="hm-label">{t.source}</label>
        <div className="hm-btns">
          {['both', 'alam', 'yaqut'].map(s => (
            <button key={s} className={`hm-btn${source === s ? ' active' : ''}`}
              onClick={() => setSource(s)}>
              {t[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Century filter (alam only) */}
      {source !== 'yaqut' && (
        <div className="hm-row">
          <label className="hm-label">{t.century}</label>
          <select className="hm-select" value={centuryFilter}
            onChange={e => setCenturyFilter(+e.target.value)}>
            <option value={0}>{t.all}</option>
            {centuries.map(c => (
              <option key={c} value={c}>{c}. {lang === 'ar' ? 'ق' : lang === 'en' ? 'c.' : 'yy.'}</option>
            ))}
          </select>
        </div>
      )}

      {/* Confidence filter (yaqut only) */}
      {source !== 'alam' && (
        <div className="hm-row">
          <label className="hm-label">{t.confidence}</label>
          <select className="hm-select" value={confFilter}
            onChange={e => setConfFilter(e.target.value)}>
            <option value="all">{t.all}</option>
            <option value="exact">{t.exact}</option>
            <option value="approximate">{t.approx}</option>
          </select>
        </div>
      )}

      <div className="hm-count">{t.count}: {points.length.toLocaleString()}</div>
    </div>
  );
}
