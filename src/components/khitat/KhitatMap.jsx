import { useEffect, useRef, useMemo, useState } from 'react';
import L from 'leaflet';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

const CENTER = [29.5, 31.5]; // Cairo-centered
const ZOOM = 6;

/* Confidence → opacity */
function confOpacity(cf) {
  if (cf === 'high') return 0.95;
  if (cf === 'approximate') return 0.65;
  return 0.4;
}

/* Category histogram */
function buildCatHistogram(filtered, catMeta) {
  const counts = {};
  filtered.forEach(s => { counts[s.cat] = (counts[s.cat] || 0) + 1; });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([cat, count]) => ({
      cat,
      count,
      color: catMeta[cat]?.color || '#999',
      label: catMeta[cat]?.tr || cat,
      icon: catMeta[cat]?.icon || '📍',
    }));
}

export default function KhitatMap({ lang, tk, data, catMeta, selectedId, selectedStruct, onSelect, filtered }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const [showLegend, setShowLegend] = useState(true);

  /* ═══ Initialize map ═══ */
  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map(mapContainer.current, {
      center: CENTER,
      zoom: ZOOM,
      zoomControl: false,
      attributionControl: true,
    });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 18 }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  /* ═══ Update markers ═══ */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (markersRef.current) map.removeLayer(markersRef.current);

    const group = L.layerGroup();
    data.forEach(s => {
      if (s.lat == null || s.lon == null) return;
      const meta = catMeta[s.cat] || {};
      const color = meta.color || '#999';
      const opacity = confOpacity(s.cf);

      const marker = L.circleMarker([s.lat, s.lon], {
        radius: s.cf === 'high' ? 6 : 4,
        color: color,
        fillColor: color,
        fillOpacity: opacity,
        weight: s.cf === 'high' ? 1.5 : 1,
        opacity: opacity,
      });
      marker._khitatId = s.id;
      marker.on('click', () => onSelect(s.id));

      const icon = meta.icon || '📍';
      const catLabel = lang === 'en' ? (meta.en || s.cat) : (meta.tr || s.cat);
      const dateStr = s.ah ? `${s.ah} H / ${s.ce} M` : '';

      marker.bindTooltip(
        `<div style="max-width:220px">` +
        `<b style="font-family:'Amiri',serif;font-size:15px" dir="rtl">${s.ar}</b><br/>` +
        `<span style="font-size:11px">${icon} ${catLabel}</span>` +
        (dateStr ? `<br/><span style="opacity:.7;font-size:10px">${dateStr}</span>` : '') +
        (s.f_ar ? `<br/><span style="opacity:.6;font-size:10px" dir="rtl">⚒ ${s.f_ar}</span>` : '') +
        `</div>`,
        { className: 'khitat-tooltip', direction: 'top', offset: [0, -6] }
      );
      group.addLayer(marker);
    });

    group.addTo(map);
    markersRef.current = group;
  }, [data, lang, onSelect, catMeta]);

  /* ═══ Highlight selected ═══ */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (selectedMarkerRef.current) {
      map.removeLayer(selectedMarkerRef.current);
      selectedMarkerRef.current = null;
    }
    if (!selectedStruct || selectedStruct.lat == null) return;

    const ring = L.circleMarker([selectedStruct.lat, selectedStruct.lon], {
      radius: 14,
      color: '#D4A574',
      fillColor: '#D4A574',
      fillOpacity: 0.25,
      weight: 2.5,
    });
    ring.addTo(map);
    selectedMarkerRef.current = ring;
    map.flyTo([selectedStruct.lat, selectedStruct.lon], Math.max(map.getZoom(), 10), { duration: 0.8 });
  }, [selectedStruct]);

  /* ═══ Category histogram ═══ */
  const histogram = useMemo(() => buildCatHistogram(filtered, catMeta), [filtered, catMeta]);
  const maxCount = useMemo(() => Math.max(...histogram.map(h => h.count), 1), [histogram]);

  return (
    <div className="khitat-map-wrapper">
      <div ref={mapContainer} className="khitat-map-container" />

      {/* Category histogram overlay */}
      <div className="khitat-histogram">
        <div className="khitat-histogram-label">{tk.categoryDist || 'Kategori Dağılımı'}</div>
        <div className="khitat-histogram-bars">
          {histogram.map(h => (
            <div key={h.cat} className="khitat-histo-col"
              title={`${h.icon} ${h.label}: ${h.count}`}>
              <div className="khitat-histo-bar"
                style={{
                  height: `${Math.max(2, (h.count / maxCount) * 55)}px`,
                  background: h.color,
                }} />
              <span className="khitat-histo-lbl">{h.icon}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map stats */}
      <div className="khitat-map-stats">
        {data.length} / {filtered.length} {tk.structures || 'yapı'}
        <button className={`khitat-legend-toggle${showLegend ? ' active' : ''}`}
          onClick={() => setShowLegend(p => !p)} title="Lejant">
          🏷
        </button>
      </div>

      {/* Mini legend */}
      {showLegend && (
        <div className="khitat-legend">
          <div className="khitat-legend-title">{tk.confidence || 'Güven Seviyesi'}</div>
          <div className="khitat-legend-items">
            <span className="khitat-legend-item">
              <span className="khitat-legend-dot" style={{ background: '#D4A574', opacity: 0.95 }} /> {tk.high || 'Yüksek'}
            </span>
            <span className="khitat-legend-item">
              <span className="khitat-legend-dot" style={{ background: '#D4A574', opacity: 0.55 }} /> {tk.approximate || 'Yaklaşık'}
            </span>
            <span className="khitat-legend-item">
              <span className="khitat-legend-dot" style={{ background: '#D4A574', opacity: 0.3 }} /> {tk.low || 'Düşük'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
