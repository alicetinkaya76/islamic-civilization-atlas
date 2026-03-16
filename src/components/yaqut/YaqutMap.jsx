import { useEffect, useRef, useCallback, useMemo, useState, lazy, Suspense } from 'react';
import L from 'leaflet';
import { hn } from '../../data/i18n-utils';
import T from '../../data/i18n';

/* ═══ Lazy-load Globe (Three.js only when needed) ═══ */
const YaqutGlobe = lazy(() => import('./YaqutGlobe'));

/* ═══ Map config ═══ */
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

const CENTER = [30, 45]; // Islamic world center
const ZOOM = 4;

/* ═══ Color by geo_type ═══ */
const GEO_COLORS = {
  city: '#d4a84b', village: '#66bb6a', mountain: '#a1887f', river: '#4fc3f7',
  fortress: '#ef5350', region: '#ce93d8', town: '#ff8a65', district: '#ffb74d',
  valley: '#81c784', water: '#29b6f6', well: '#4dd0e1', monastery: '#9575cd',
  spring: '#26c6da', pass: '#8d6e63', island: '#4db6ac', desert: '#ffd54f',
  place: '#90a4ae', market: '#f06292', quarter: '#78909c', wadi: '#aed581', sea: '#1565c0',
};

function geoColor(gt) {
  return GEO_COLORS[gt] || '#90a4ae';
}

/* ═══ Geo type histogram data ═══ */
function buildGeoHistogram(filtered) {
  const counts = {};
  filtered.forEach(e => {
    if (e.gt) counts[e.gt] = (counts[e.gt] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([type, count]) => ({ type, count }));
}

/* ═══ Flat Map (Leaflet) ═══ */
function FlatMap({ lang, ty, data, selectedId, selectedEntry, detailData, onSelect, filtered }) {
  const t = T[lang];
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const linesRef = useRef(null);
  const heatRef = useRef(null);
  const [showHeat, setShowHeat] = useState(false);

  /* Initialize map */
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

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* Update markers when data changes */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (markersRef.current) {
      map.removeLayer(markersRef.current);
    }

    const group = L.layerGroup();

    data.forEach(e => {
      if (e.lat == null || e.lon == null) return;
      const color = geoColor(e.gt);
      const marker = L.circleMarker([e.lat, e.lon], {
        radius: 4,
        color: color,
        fillColor: color,
        fillOpacity: 0.7,
        weight: 1,
        opacity: 0.9,
      });
      marker._yaqutId = e.id;
      marker.on('click', () => onSelect(e.id));

      const label = hn(e, lang);
      const gType = lang === 'tr' ? e.gtt : e.gte;
      marker.bindTooltip(
        `<b style="font-family:'Amiri',serif;font-size:14px" dir="rtl">${e.h}</b><br/>` +
        `<span>${label}</span>` +
        (gType ? `<br/><span style="opacity:.7">${gType}</span>` : '') +
        (e.ct ? `<br/><span style="opacity:.5">${e.ct}</span>` : ''),
        { className: 'yaqut-tooltip', direction: 'top', offset: [0, -6] }
      );
      group.addLayer(marker);
    });

    group.addTo(map);
    markersRef.current = group;
  }, [data, lang, onSelect]);

  /* Highlight selected marker */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedMarkerRef.current) {
      map.removeLayer(selectedMarkerRef.current);
      selectedMarkerRef.current = null;
    }
    if (linesRef.current) {
      map.removeLayer(linesRef.current);
      linesRef.current = null;
    }

    if (!selectedEntry || selectedEntry.lat == null) return;

    const ring = L.circleMarker([selectedEntry.lat, selectedEntry.lon], {
      radius: 14,
      color: '#1a6b5a',
      fillColor: '#1a6b5a',
      fillOpacity: 0.3,
      weight: 3,
    });
    ring.addTo(map);
    selectedMarkerRef.current = ring;

    map.flyTo([selectedEntry.lat, selectedEntry.lon], Math.max(map.getZoom(), 6), { duration: 0.8 });
  }, [selectedEntry, detailData]);

  /* Heatmap layer */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null; }
    if (!showHeat) return;

    const heatGroup = L.layerGroup();
    const GRID = {};
    const RESOLUTION = 1;
    data.forEach(e => {
      if (e.lat == null) return;
      const key = `${Math.round(e.lat / RESOLUTION) * RESOLUTION},${Math.round(e.lon / RESOLUTION) * RESOLUTION}`;
      GRID[key] = (GRID[key] || 0) + 1;
    });
    const maxDensity = Math.max(...Object.values(GRID), 1);
    Object.entries(GRID).forEach(([key, count]) => {
      const [lat, lon] = key.split(',').map(Number);
      const intensity = count / maxDensity;
      const radius = 15 + intensity * 35;
      L.circleMarker([lat, lon], {
        radius,
        color: 'transparent',
        fillColor: `hsl(${160 - intensity * 40}, 70%, ${40 + intensity * 25}%)`,
        fillOpacity: 0.15 + intensity * 0.35,
        weight: 0,
      }).addTo(heatGroup);
    });
    heatGroup.addTo(map);
    heatRef.current = heatGroup;
  }, [data, showHeat]);

  /* Geo type histogram overlay */
  const histogram = useMemo(() => buildGeoHistogram(filtered), [filtered]);
  const maxCount = useMemo(() => Math.max(...histogram.map(h => h.count), 1), [histogram]);

  return (
    <>
      <div ref={mapContainer} className="yaqut-map-container" />

      {/* Geo type histogram overlay */}
      <div className="yaqut-histogram">
        <div className="yaqut-histogram-label">{ty.geoDistribution || 'Coğrafi Tip'}</div>
        <div className="yaqut-histogram-bars">
          {histogram.map(h => (
            <div key={h.type} className="yaqut-histo-col"
              title={`${h.type}: ${h.count}`}>
              <div className="yaqut-histo-bar"
                style={{
                  height: `${Math.max(2, (h.count / maxCount) * 60)}px`,
                  background: geoColor(h.type),
                }} />
              <span className="yaqut-histo-lbl">{h.type.slice(0, 4)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map stats overlay */}
      <div className="yaqut-map-stats">
        {data.length.toLocaleString()} {ty.geocoded || 'koordinatlı'}
        <button className={`yaqut-heat-toggle${showHeat ? ' active' : ''}`}
          onClick={() => setShowHeat(p => !p)}
          title={t.yaqut.tabHeatmap}>
          🔥
        </button>
      </div>
    </>
  );
}

/* ═══ Main Map Component with Flat/Globe Toggle ═══ */
export default function YaqutMap({ lang, ty, data, selectedId, selectedEntry, detailData, onSelect, filtered }) {
  const t = T[lang];
  const [viewMode, setViewMode] = useState('flat'); // 'flat' | 'globe'

  return (
    <div className="yaqut-map-wrapper">
      {/* ─── View Mode Toggle ─── */}
      <div className="yaqut-map-mode-toggle">
        <button
          className={`yaqut-mode-btn${viewMode === 'flat' ? ' active' : ''}`}
          onClick={() => setViewMode('flat')}
          title={t.yaqut.tabFlatMap}>
          🗺️ {ty.flatMap || t.yaqut.mapLabel}
        </button>
        <button
          className={`yaqut-mode-btn${viewMode === 'globe' ? ' active' : ''}`}
          onClick={() => setViewMode('globe')}
          title={t.yaqut.tab3DGlobe}>
          🌍 {ty.globe3D || t.yaqut.globeLabel}
        </button>
      </div>

      {/* ─── Flat Map (Leaflet) ─── */}
      {viewMode === 'flat' && (
        <FlatMap
          lang={lang} ty={ty}
          data={data}
          selectedId={selectedId}
          selectedEntry={selectedEntry}
          detailData={detailData}
          onSelect={onSelect}
          filtered={filtered}
        />
      )}

      {/* ─── 3D Globe (Three.js, lazy loaded) ─── */}
      {viewMode === 'globe' && (
        <Suspense fallback={
          <div className="yaqut-globe-loading">
            <div className="yaqut-globe-loading-spinner" />
            <span>{ty.globeLoading || t.yaqut.globeLoadingLabel}</span>
          </div>
        }>
          <YaqutGlobe
            lang={lang} ty={ty}
            data={data}
            selectedId={selectedId}
            selectedEntry={selectedEntry}
            onSelect={onSelect}
          />
        </Suspense>
      )}
    </div>
  );
}
