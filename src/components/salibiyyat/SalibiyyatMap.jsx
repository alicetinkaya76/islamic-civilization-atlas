import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';

const eTitle = (e, lang) => lang === 'ar' ? (e.title_ar || e.title) : lang === 'en' ? (e.title_en || e.title) : e.title;


/* ═══ Map config ═══ */
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';
const CENTER = [33, 36];
const ZOOM = 5;

/* ═══ Outcome → marker style ═══ */
const OUTCOME_SHAPE = {
  muslim_victory:   { weight: 2.5 },
  crusader_victory:  { weight: 1.5, dashArray: '3 3' },
  treaty:           { weight: 2 },
  inconclusive:     { weight: 1 },
  not_applicable:   { weight: 1, opacity: 0.5 },
};

/* ═══ Castle SVG icon ═══ */
function castleIcon(color = '#fbbf24') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M4 21V10l4-4 4 4 4-4 4 4v11"/><path d="M9 21v-4h6v4"/><path d="M3 10h18"/></svg>`;
  return L.divIcon({
    className: 'sal-castle-icon',
    html: `<div style="width:24px;height:24px">${svg}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
}

/* ═══ Event type icons ═══ */
const TYPE_ICONS = {
  battle: '⚔', siege: '🏰', conquest: '🚩', diplomacy: '🤝', treaty: '📜',
  death: '💀', raid: '🏇', military: '⚔', event: '📌', naval: '⛵',
  anecdote: '📖', assassination: '🗡', captivity: '⛓', encounter: '🤺',
  muslim_conquest: '☪️', muslim_capture: '☪️', crusader_capture: '✝️',
  muslim_victory: '🏆', muslim_defeat: '💔', crusader_defeat: '💔',
};

export default function SalibiyyatMap({
  lang, tr, events, allEvents, castles, sources, sourceMap,
  boundaries, boundaryYears, routes, clusters,
  selectedId, selectedEvent, selectedCastleId, selectedCastle,
  onSelectEvent, onSelectCastle, eventClusterMap,
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const eventLayerRef = useRef(null);
  const castleLayerRef = useRef(null);
  const boundaryLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const clusterLineRef = useRef(null);
  const selectedMarkerRef = useRef(null);

  const [showRoutes, setShowRoutes] = useState(false);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [showCastles, setShowCastles] = useState(true);
  const [boundaryYear, setBoundaryYear] = useState(1187);

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

  /* ── Draw event markers ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (eventLayerRef.current) { map.removeLayer(eventLayerRef.current); }

    const group = L.layerGroup();
    events.forEach(e => {
      if (e.lat == null || e.lon == null) return;
      const src = sourceMap[e.source_id];
      const color = src?.color || '#999';
      const style = OUTCOME_SHAPE[e.outcome] || OUTCOME_SHAPE.not_applicable;
      const icon = TYPE_ICONS[e.type] || '📌';
      const hasCluster = !!eventClusterMap[e.id];

      const marker = L.circleMarker([e.lat, e.lon], {
        radius: hasCluster ? 7 : 5,
        color: '#fff',
        fillColor: color,
        fillOpacity: 0.85,
        weight: style.weight || 1.5,
        opacity: style.opacity || 0.9,
        dashArray: style.dashArray || null,
      });
      marker._salId = e.id;
      marker.on('click', () => onSelectEvent(e.id));

      marker.bindTooltip(
        `<div style="text-align:center;max-width:220px">` +
        `<b>${icon} ${eTitle(e, lang)}</b>` +
        `<br/><span style="color:${color};font-weight:600">${src?.short || ''}</span> · ${e.year}` +
        (e.arabic_text ? `<br/><span dir="rtl" style="font-family:'Amiri',serif;font-size:12px;opacity:.85">${e.arabic_text.slice(0, 60)}${e.arabic_text.length > 60 ? '…' : ''}</span>` : '') +
        (hasCluster ? `<br/><span style="opacity:.6;font-size:10px">🔗 Çoklu kaynak</span>` : '') +
        `</div>`,
        { className: 'sal-tooltip', direction: 'top', offset: [0, -6] }
      );
      group.addLayer(marker);
    });
    group.addTo(map);
    eventLayerRef.current = group;
  }, [events, sourceMap, onSelectEvent, eventClusterMap]);

  /* ── Draw castle markers ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (castleLayerRef.current) { map.removeLayer(castleLayerRef.current); }
    if (!showCastles) return;

    const group = L.layerGroup();
    castles.forEach(c => {
      if (c.lat == null || c.lon == null) return;
      const marker = L.marker([c.lat, c.lon], { icon: castleIcon('#fbbf24') });
      marker._salCastleId = c.id;
      marker.on('click', () => onSelectCastle(c.id));

      const name = lang === 'ar' ? c.name_ar : lang === 'en' ? c.name_en : c.name_tr;
      marker.bindTooltip(
        `<div style="text-align:center">` +
        `<b>🏰 ${name}</b>` +
        (c.name_ar ? `<br/><span dir="rtl" style="font-family:'Amiri',serif">${c.name_ar}</span>` : '') +
        `<br/><span style="opacity:.7">${c.crusader_state || ''}</span>` +
        (c.unesco ? '<br/><span style="color:#22d3ee">🏛 UNESCO</span>' : '') +
        `</div>`,
        { className: 'sal-tooltip', direction: 'top', offset: [0, -24] }
      );
      group.addLayer(marker);
    });
    group.addTo(map);
    castleLayerRef.current = group;
  }, [castles, showCastles, lang, onSelectCastle]);

  /* ── Draw boundary polygons ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (boundaryLayerRef.current) { map.removeLayer(boundaryLayerRef.current); }
    if (!showBoundaries) return;

    const group = L.layerGroup();
    boundaries.forEach(b => {
      const snap = b.snapshots?.find(s => s.year === boundaryYear);
      if (!snap || !snap.polygon) return;

      try {
        const polygon = L.geoJSON(snap.polygon, {
          style: {
            color: b.color,
            fillColor: b.color,
            fillOpacity: 0.12,
            weight: 2,
            dashArray: '5 5',
          },
        });
        polygon.bindTooltip(
          `<b>${lang === 'ar' ? b.name_ar : lang === 'en' ? b.name_en : b.name_tr}</b><br/>${boundaryYear}`,
          { sticky: true, className: 'sal-tooltip' }
        );
        group.addLayer(polygon);
      } catch (err) {
        console.warn('Boundary parse error:', b.id, err);
      }
    });
    group.addTo(map);
    boundaryLayerRef.current = group;
  }, [boundaries, boundaryYear, showBoundaries, lang]);

  /* ── Draw routes ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (routeLayerRef.current) { map.removeLayer(routeLayerRef.current); }
    if (!showRoutes) return;

    const group = L.layerGroup();
    routes.forEach(r => {
      if (!r.waypoints || r.waypoints.length < 2) return;
      const latlngs = r.waypoints.map(w => [w.lat, w.lon]);
      const line = L.polyline(latlngs, {
        color: r.color,
        weight: 3,
        opacity: 0.7,
        dashArray: r.type === 'sea' ? '8 6' : null,
        smoothFactor: 1.5,
      });

      const label = lang === 'en' ? r.name_en : r.name_tr;
      line.bindTooltip(
        `<b>${label}</b><br/>${r.period} · ${r.leaders?.split(',')[0] || ''}`,
        { sticky: true, className: 'sal-route-tooltip' }
      );
      group.addLayer(line);
    });
    group.addTo(map);
    routeLayerRef.current = group;
  }, [routes, showRoutes, lang]);

  /* ── Highlight selected event ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (selectedMarkerRef.current) { map.removeLayer(selectedMarkerRef.current); selectedMarkerRef.current = null; }
    if (clusterLineRef.current) { map.removeLayer(clusterLineRef.current); clusterLineRef.current = null; }

    const target = selectedEvent || selectedCastle;
    if (!target || target.lat == null) return;

    const color = selectedEvent ? (sourceMap[selectedEvent.source_id]?.color || '#d4a84b') : '#fbbf24';
    const ring = L.circleMarker([target.lat, target.lon], {
      radius: 18,
      color: color,
      fillColor: color,
      fillOpacity: 0.2,
      weight: 3,
    });
    ring.addTo(map);
    selectedMarkerRef.current = ring;
    map.flyTo([target.lat, target.lon], Math.max(map.getZoom(), 7), { duration: 0.8 });

    /* Draw cluster lines if event has cluster */
    if (selectedEvent && eventClusterMap[selectedEvent.id]) {
      const clusterId = eventClusterMap[selectedEvent.id];
      const cluster = clusters.find(c => c.id === clusterId);
      if (cluster) {
        const clGroup = L.layerGroup();
        const centerEvent = allEvents.find(e => e.id === selectedEvent.id);
        if (centerEvent) {
          cluster.events.forEach(ce => {
            if (ce.id === selectedEvent.id) return;
            const other = allEvents.find(e => e.id === ce.id);
            if (!other || other.lat == null) return;
            const line = L.polyline([[centerEvent.lat, centerEvent.lon], [other.lat, other.lon]], {
              color: '#d4a84b', weight: 1.5, opacity: 0.5, dashArray: '4 4',
            });
            clGroup.addLayer(line);
          });
        }
        clGroup.addTo(map);
        clusterLineRef.current = clGroup;
      }
    }
  }, [selectedEvent, selectedCastle, sourceMap, eventClusterMap, clusters, allEvents]);

  /* ── Source legend ── */
  const visibleSources = useMemo(() => {
    const ids = new Set(events.map(e => e.source_id));
    return sources.filter(s => ids.has(s.id));
  }, [events, sources]);

  return (
    <div className="sal-map-wrapper">
      <div ref={mapContainer} className="sal-map-container" />

      {/* Map controls */}
      <div className="sal-map-controls">
        <button className={`sal-map-ctrl${showBoundaries ? ' active' : ''}`}
          onClick={() => setShowBoundaries(p => !p)} title={tr.boundaries}>
          🗺
        </button>
        <button className={`sal-map-ctrl${showRoutes ? ' active' : ''}`}
          onClick={() => setShowRoutes(p => !p)} title={tr.routes}>
          📏
        </button>
        <button className={`sal-map-ctrl${showCastles ? ' active' : ''}`}
          onClick={() => setShowCastles(p => !p)} title={tr.castleName}>
          🏰
        </button>
      </div>

      {/* Boundary year slider */}
      {showBoundaries && (
        <div className="sal-boundary-slider">
          <label className="sal-slider-label">{tr.boundaries}: <strong>{boundaryYear}</strong></label>
          <input type="range"
            min={boundaryYears.length > 0 ? Math.min(...boundaryYears) : 1099}
            max={boundaryYears.length > 0 ? Math.max(...boundaryYears) : 1268}
            step={1}
            value={boundaryYear}
            onChange={e => setBoundaryYear(Number(e.target.value))}
            list="sal-boundary-years"
            className="sal-slider-input" />
          <datalist id="sal-boundary-years">
            {boundaryYears.map(y => <option key={y} value={y} />)}
          </datalist>
          <div className="sal-slider-ticks">
            {boundaryYears.map(y => (
              <button key={y}
                className={`sal-tick${boundaryYear === y ? ' active' : ''}`}
                onClick={() => setBoundaryYear(y)}>
                {y}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Source legend */}
      <div className="sal-legend">
        {visibleSources.map(s => (
          <div key={s.id} className="sal-legend-item">
            <span className="sal-legend-dot" style={{ background: s.color }} />
            <span className="sal-legend-label">{s.short} ({lang === 'en' ? s.name_en : s.name_tr})</span>
          </div>
        ))}
      </div>

      {/* Map stats */}
      <div className="sal-map-stats">
        {events.length} {tr.entries}
      </div>
    </div>
  );
}
