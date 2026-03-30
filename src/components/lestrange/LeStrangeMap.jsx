import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import L from 'leaflet';

/* ═══ Map config ═══ */
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';
const CENTER = [35, 55];
const ZOOM = 4;

/* ═══ Province colors ═══ */
const PROVINCE_COLORS = {
  "ʿIrāq": '#e6194b', "Khurāsān": '#3cb44b', "al-Jazīra": '#ffe119',
  "Rūm": '#4363d8', "Khūzistān": '#f58231', "Sughd": '#911eb4',
  "Fārs": '#42d4f4', "Upper Euphrates": '#f032e6', "Sijistān": '#bfef45',
  "Ādharbāyjān": '#fabed4', "al-Jibāl": '#469990', "Kirmān": '#dcbeff',
  "Makrān": '#9A6324', "Kūhistān": '#fffac8', "Khwārizm": '#800000',
  "Ṣaghāniyān": '#aaffc3', "Isbījāb": '#808000', "Kūmis": '#ffd8b1',
  "Ushrūsanah": '#000075', "Farghānah": '#a9a9a9',
  "Arminiyya": '#e6beff', "Arrān": '#aa6e28', "Gurjistān": '#ffffd8',
  "Jaxartes": '#1e8449', "Badakhshān": '#c39bd3', "Ilāk": '#f5b041',
  "Great Desert": '#d35400', "Ṭabaristān": '#2e86c1', "Shāsh": '#28b463',
  "Gīlān": '#e74c3c', "Quhistān": '#8e44ad', "Jūzjān": '#2c3e50',
  "Tūs": '#16a085', "Hamadhān": '#f39c12',
};
const DEFAULT_COLOR = '#808080';

/* ═══ Geo type → marker radius ═══ */
const GEO_SIZE = {
  province: 8, city: 6, town: 5, fortress: 5, castle: 5,
  river: 4, mountain: 4, lake: 4, canal: 3, port: 4,
  village: 3, district: 3, island: 3, sea: 5, region: 6,
  desert: 5, oasis: 3, pass: 3, bridge: 3, monastery: 3,
  mine: 3, swamp: 3,
};
const DEFAULT_SIZE = 4;

/* ═══ Geo type icons (for tooltips) ═══ */
const GEO_ICONS = {
  province: '🏛️', city: '🏙️', town: '🏘️', village: '🏠',
  river: '🌊', canal: '🚿', lake: '💧', sea: '🌊',
  mountain: '⛰️', desert: '🏜️', valley: '🏞️', pass: '🏔️',
  fortress: '🏰', castle: '🏰', island: '🏝️', port: '⚓', oasis: '🌴',
  district: '📍', region: '🗺️', bridge: '🌉', monastery: '⛪',
  spring: '♨️', well: '🪣', swamp: '🌿', mine: '⛏️',
};

/* ═══ Coord source → dash style ═══ */
const COORD_DASH = {
  modern_known: null,
  approximate: null,
  estimated: '4 4',
  uncertain: '2 4',
};

export default function LeStrangeMap({
  lang, tr, records, allRecords,
  selectedId, selectedRecord, onSelect,
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const [legendOpen, setLegendOpen] = useState(false);

  /* ── Initialize map ── */
  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map(mapContainer.current, {
      center: CENTER, zoom: ZOOM,
      zoomControl: false, attributionControl: true,
    });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 18 }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  /* ── Render markers ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (markersRef.current) { map.removeLayer(markersRef.current); markersRef.current = null; }

    const group = L.layerGroup();
    const nameKey = lang === 'ar' ? 'name_ar' : lang === 'en' ? 'name_en' : 'name_tr';

    records.forEach(r => {
      if (!r.latitude || !r.longitude || r.coord_source === 'unlocated') return;

      const color = PROVINCE_COLORS[r.province] || DEFAULT_COLOR;
      const radius = GEO_SIZE[r.geo_type] || DEFAULT_SIZE;
      const dashArray = COORD_DASH[r.coord_source] || null;
      const isSelected = r.id === selectedId;
      const icon = GEO_ICONS[r.geo_type] || '📍';

      const marker = L.circleMarker([r.latitude, r.longitude], {
        radius: isSelected ? radius + 3 : radius,
        fillColor: color,
        fillOpacity: isSelected ? 1 : 0.7,
        color: isSelected ? '#ffd700' : color,
        weight: isSelected ? 3 : 1.5,
        opacity: isSelected ? 1 : 0.85,
        dashArray: isSelected ? null : dashArray,
      });

      const label = r[nameKey] || r.name_en;
      const tip = `${icon} <strong>${label}</strong>${r.le_strange_form ? ` <em>(${r.le_strange_form})</em>` : ''}<br/><span style="opacity:0.7">${r.province || ''} · ${r.geo_type_en || r.geo_type}</span>`;
      marker.bindTooltip(tip, { direction: 'top', offset: [0, -6], className: 'lestrange-tooltip' });
      marker.on('click', () => onSelect(r.id));
      marker.addTo(group);
    });

    group.addTo(map);
    markersRef.current = group;
  }, [records, selectedId, lang, onSelect]);

  /* ── Golden highlight for selected ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (selectedMarkerRef.current) { map.removeLayer(selectedMarkerRef.current); selectedMarkerRef.current = null; }
    if (!selectedRecord || !selectedRecord.latitude || selectedRecord.coord_source === 'unlocated') return;

    const ring = L.circleMarker([selectedRecord.latitude, selectedRecord.longitude], {
      radius: (GEO_SIZE[selectedRecord.geo_type] || DEFAULT_SIZE) + 6,
      fillColor: 'transparent',
      fillOpacity: 0,
      color: '#ffd700',
      weight: 2.5,
      opacity: 0.8,
      dashArray: '6 3',
    });
    ring.addTo(map);
    selectedMarkerRef.current = ring;

    map.flyTo([selectedRecord.latitude, selectedRecord.longitude], Math.max(map.getZoom(), 7), { duration: 0.6 });
  }, [selectedRecord]);

  /* ── Top provinces for legend ── */
  const topProvinces = useMemo(() => {
    const c = {};
    (allRecords || []).forEach(r => { if (r.province) c[r.province] = (c[r.province] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 15);
  }, [allRecords]);

  return (
    <div className="lestrange-map-container">
      <div ref={mapContainer} className="lestrange-map-inner" />

      {/* Legend toggle */}
      <button className="lestrange-legend-toggle" onClick={() => setLegendOpen(p => !p)}
        title="Province Legend">
        {legendOpen ? '✕' : '🎨'}
      </button>

      {legendOpen && (
        <div className="lestrange-legend">
          <div className="lestrange-legend-title">{tr.province}</div>
          {topProvinces.map(([name, count]) => (
            <div key={name} className="lestrange-legend-item">
              <span className="lestrange-legend-dot" style={{ background: PROVINCE_COLORS[name] || DEFAULT_COLOR }} />
              <span className="lestrange-legend-label">{name}</span>
              <span className="lestrange-legend-count">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Counter overlay */}
      <div className="lestrange-map-counter">
        {records.filter(r => r.coord_source !== 'unlocated').length} / {records.length} {tr.entries}
      </div>
    </div>
  );
}
