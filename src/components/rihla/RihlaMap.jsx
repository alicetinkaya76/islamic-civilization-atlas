import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import L from 'leaflet';

/* ═══ Map config ═══ */
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';
const CENTER = [28, 50];
const ZOOM = 3;

/* ═══ Significance → radius ═══ */
const SIG_RADIUS = { high: 7, medium: 5, low: 3 };

/* ═══ Stop type icons (for tooltips) ═══ */
const TYPE_ICONS = {
  capital: '👑', major_city: '🏙', city: '🏛', town: '🏘', village: '🏠',
  port: '⚓', fortress: '🏰', oasis: '🌴', shrine: '🕌', pilgrimage: '🕋',
  palace: '🏰', court: '👑', camp: '⛺', island: '🏝', departure: '🚶',
  destination: '📍', transit: '🔄', crossroads: '🔀', caravan_station: '🐫',
  rest_stop: '☕', ruins: '🏚', mine: '⛏', sea_event: '🌊', disaster: '⚡',
};

export default function RihlaMap({
  lang, tr, stops, allStops, voyages, voyageMap,
  selectedVoyage, selectedId, selectedStop, onSelect,
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const routesRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showLabels, setShowLabels] = useState(false);

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

  /* ── Draw route lines ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (routesRef.current) { map.removeLayer(routesRef.current); routesRef.current = null; }
    if (!showRoutes) return;

    const group = L.layerGroup();
    const targetVoyages = selectedVoyage
      ? voyages.filter(v => v.id === selectedVoyage)
      : voyages;

    targetVoyages.forEach(v => {
      const vStops = allStops
        .filter(s => s.voyage_id === v.id)
        .sort((a, b) => a.seq - b.seq);
      if (vStops.length < 2) return;

      const latlngs = vStops.map(s => [s.lat, s.lon]);
      const line = L.polyline(latlngs, {
        color: v.color,
        weight: 3,
        opacity: selectedVoyage ? 0.9 : 0.6,
        dashArray: null,
        smoothFactor: 1.5,
      });
      line.bindTooltip(
        `<b>${lang === 'tr' ? v.title_tr : v.title_en}</b><br/>` +
        `${v.start_year}–${v.end_year} · ${v.stop_count} ${tr.totalStops}`,
        { sticky: true, className: 'rihla-route-tooltip' }
      );
      group.addLayer(line);
    });
    group.addTo(map);
    routesRef.current = group;
  }, [allStops, voyages, selectedVoyage, showRoutes, lang, tr]);

  /* ── Draw stop markers ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (markersRef.current) { map.removeLayer(markersRef.current); }

    const group = L.layerGroup();
    stops.forEach(s => {
      if (s.lat == null || s.lon == null) return;
      const v = voyageMap[s.voyage_id];
      const color = v?.color || '#999';
      const radius = SIG_RADIUS[s.sig] || 4;

      const marker = L.circleMarker([s.lat, s.lon], {
        radius,
        color: '#fff',
        fillColor: color,
        fillOpacity: 0.85,
        weight: 1.5,
        opacity: 0.9,
      });
      marker._rihlaId = s.id;
      marker.on('click', () => onSelect(s.id));

      const name = lang === 'ar' ? s.ar : lang === 'en' ? s.en : s.tr;
      const icon = TYPE_ICONS[s.type] || '📍';
      marker.bindTooltip(
        `<div style="text-align:center">` +
        `<b>${icon} ${name}</b>` +
        (s.ar ? `<br/><span dir="rtl" style="font-family:'Amiri',serif">${s.ar}</span>` : '') +
        `<br/><span style="opacity:.7">${s.country || ''}</span>` +
        (s.arr ? `<br/><span style="opacity:.5">${s.arr}</span>` : '') +
        `</div>`,
        { className: 'rihla-tooltip', direction: 'top', offset: [0, -6] }
      );

      if (showLabels && s.sig === 'high') {
        const label = L.marker([s.lat, s.lon], {
          icon: L.divIcon({
            className: 'rihla-label',
            html: `<span style="color:${color}">${name}</span>`,
            iconSize: [0, 0],
            iconAnchor: [-10, 4],
          }),
          interactive: false,
        });
        group.addLayer(label);
      }

      group.addLayer(marker);
    });

    group.addTo(map);
    markersRef.current = group;
  }, [stops, lang, onSelect, voyageMap, showLabels]);

  /* ── Highlight selected ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (selectedMarkerRef.current) { map.removeLayer(selectedMarkerRef.current); selectedMarkerRef.current = null; }
    if (!selectedStop || selectedStop.lat == null) return;

    const v = voyageMap[selectedStop.voyage_id];
    const ring = L.circleMarker([selectedStop.lat, selectedStop.lon], {
      radius: 16,
      color: v?.color || '#d4a84b',
      fillColor: v?.color || '#d4a84b',
      fillOpacity: 0.2,
      weight: 3,
    });
    ring.addTo(map);
    selectedMarkerRef.current = ring;
    map.flyTo([selectedStop.lat, selectedStop.lon], Math.max(map.getZoom(), 6), { duration: 0.8 });
  }, [selectedStop, voyageMap]);

  /* ── Voyage legend ── */
  const visibleVoyages = useMemo(() => {
    if (selectedVoyage) return voyages.filter(v => v.id === selectedVoyage);
    return voyages;
  }, [voyages, selectedVoyage]);

  return (
    <div className="rihla-map-wrapper">
      <div ref={mapContainer} className="rihla-map-container" />

      {/* Map controls */}
      <div className="rihla-map-controls">
        <button className={`rihla-map-ctrl${showRoutes ? ' active' : ''}`}
          onClick={() => setShowRoutes(p => !p)} title={lang === 'tr' ? 'Rotaları göster/gizle' : 'Toggle routes'}>
          📏
        </button>
        <button className={`rihla-map-ctrl${showLabels ? ' active' : ''}`}
          onClick={() => setShowLabels(p => !p)} title={lang === 'tr' ? 'Etiketleri göster/gizle' : 'Toggle labels'}>
          🏷
        </button>
      </div>

      {/* Voyage legend */}
      <div className="rihla-legend">
        {visibleVoyages.map(v => (
          <div key={v.id} className="rihla-legend-item">
            <span className="rihla-legend-dot" style={{ background: v.color }} />
            <span className="rihla-legend-label">
              V{v.id} {v.start_year}–{v.end_year}
            </span>
          </div>
        ))}
      </div>

      {/* Map stats */}
      <div className="rihla-map-stats">
        {stops.length} {tr.entries}
        {selectedVoyage > 0 && (
          <span className="rihla-map-voyage-badge"
            style={{ borderColor: voyageMap[selectedVoyage]?.color }}>
            V{selectedVoyage}
          </span>
        )}
      </div>
    </div>
  );
}
