import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import T from '../../data/i18n';
import L from 'leaflet';
import { hn } from '../../data/i18n-utils';

/* ═══ Marker clustering via simple grid-based approach ═══ */
/* (No external dependency - manual cluster for 7,904 points) */

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

const CENTER = [30, 45]; // Islamic world center
const ZOOM = 4;

/* Color by century */
function centuryColor(c) {
  if (!c) return '#c9a84c';
  if (c <= 7) return '#aed581';
  if (c <= 9) return '#4fc3f7';
  if (c <= 11) return '#ce93d8';
  if (c <= 13) return '#ff8a65';
  if (c <= 15) return '#ffd54f';
  if (c <= 17) return '#4dd0e1';
  if (c <= 19) return '#ef9a9a';
  return '#90a4ae';
}

/* Century histogram data */
function buildHistogram(filtered) {
  const counts = {};
  filtered.forEach(b => {
    if (b.c) counts[b.c] = (counts[b.c] || 0) + 1;
  });
  return Array.from({ length: 15 }, (_, i) => ({
    century: i + 6,
    count: counts[i + 6] || 0,
  })).filter(d => d.count > 0);
}

export default function AlamMap({ lang, ta, data, selectedId, selectedBio, detailData, onSelect, filtered }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const linesRef = useRef(null);
  const heatRef = useRef(null);
  const [showHeat, setShowHeat] = useState(false);

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

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* ═══ Update markers when data changes ═══ */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    if (markersRef.current) {
      map.removeLayer(markersRef.current);
    }

    // Create marker cluster group (manual approach)
    const group = L.layerGroup();
    
    // For performance with ~8000 points, use circle markers
    data.forEach(b => {
      if (b.lat == null || b.lon == null) return;
      const color = centuryColor(b.c);
      const marker = L.circleMarker([b.lat, b.lon], {
        radius: 4,
        color: color,
        fillColor: color,
        fillOpacity: 0.7,
        weight: 1,
        opacity: 0.9,
      });
      marker._alamId = b.id;
      marker.on('click', () => onSelect(b.id));
      
      // Tooltip
      const label = hn(b, lang);
      const yr = b.md ? `ö. ${b.md}` : b.mb ? `d. ${b.mb}` : '';
      marker.bindTooltip(
        `<b style="font-family:'Amiri',serif;font-size:14px" dir="rtl">${b.h}</b><br/>` +
        `<span>${label}</span>` +
        (yr ? `<br/><span style="opacity:.7">${yr}</span>` : ''),
        { className: 'alam-tooltip', direction: 'top', offset: [0, -6] }
      );
      group.addLayer(marker);
    });

    group.addTo(map);
    markersRef.current = group;
  }, [data, lang, onSelect]);

  /* ═══ Highlight selected marker ═══ */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old highlight
    if (selectedMarkerRef.current) {
      map.removeLayer(selectedMarkerRef.current);
      selectedMarkerRef.current = null;
    }
    if (linesRef.current) {
      map.removeLayer(linesRef.current);
      linesRef.current = null;
    }

    if (!selectedBio || selectedBio.lat == null) return;

    // Add highlight ring
    const ring = L.circleMarker([selectedBio.lat, selectedBio.lon], {
      radius: 12,
      color: '#c9a84c',
      fillColor: '#c9a84c',
      fillOpacity: 0.3,
      weight: 2,
    });
    ring.addTo(map);
    selectedMarkerRef.current = ring;

    // Fly to
    map.flyTo([selectedBio.lat, selectedBio.lon], Math.max(map.getZoom(), 6), { duration: 0.8 });

    // Multi-location lines
    if (detailData && detailData.mc) {
      const coords = detailData.mc.map(c => [c.lat, c.lon]);
      if (coords.length > 0) {
        const allCoords = [[selectedBio.lat, selectedBio.lon], ...coords];
        const line = L.polyline(allCoords, {
          color: '#c9a84c',
          weight: 2,
          dashArray: '6, 4',
          opacity: 0.7,
        });
        line.addTo(map);
        linesRef.current = line;

        // Add small markers at each multi-location
        coords.forEach(c => {
          L.circleMarker(c, {
            radius: 5, color: '#c9a84c', fillColor: '#c9a84c44',
            fillOpacity: 0.5, weight: 1.5,
          }).addTo(map);
        });
      }
    }
  }, [selectedBio, detailData]);

  /* ═══ Heatmap layer ═══ */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null; }
    if (!showHeat) return;

    // Simple heatmap via many small transparent circles
    const heatGroup = L.layerGroup();
    const GRID = {};
    const RESOLUTION = 1; // 1 degree grid
    data.forEach(b => {
      if (b.lat == null) return;
      const key = `${Math.round(b.lat / RESOLUTION) * RESOLUTION},${Math.round(b.lon / RESOLUTION) * RESOLUTION}`;
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
        fillColor: `hsl(${40 - intensity * 40}, 90%, ${50 + intensity * 20}%)`,
        fillOpacity: 0.15 + intensity * 0.35,
        weight: 0,
      }).addTo(heatGroup);
    });
    heatGroup.addTo(map);
    heatRef.current = heatGroup;
  }, [data, showHeat]);

  /* ═══ Century histogram overlay ═══ */
  const histogram = useMemo(() => buildHistogram(filtered), [filtered]);
  const maxCount = useMemo(() => Math.max(...histogram.map(h => h.count), 1), [histogram]);

  return (
    <div className="alam-map-wrapper">
      <div ref={mapContainer} className="alam-map-container" />

      {/* Century histogram overlay */}
      <div className="alam-histogram">
        <div className="alam-histogram-label">{ta.centuryHistogram}</div>
        <div className="alam-histogram-bars">
          {histogram.map(h => (
            <div key={h.century} className="alam-histo-col"
              title={`${h.century}. ${ta.century}: ${h.count}`}>
              <div className="alam-histo-bar"
                style={{
                  height: `${Math.max(2, (h.count / maxCount) * 60)}px`,
                  background: centuryColor(h.century),
                }} />
              <span className="alam-histo-lbl">{h.century}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map stats overlay */}
      <div className="alam-map-stats">
        {data.length.toLocaleString()} {ta.withCoords}
        <button className={`alam-heat-toggle${showHeat ? ' active' : ''}`}
          onClick={() => setShowHeat(p => !p)}
          title={T[lang].yaqut.tabHeatmap}>
          🔥
        </button>
      </div>
    </div>
  );
}
