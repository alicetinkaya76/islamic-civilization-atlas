import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { EI1_FIELD_COLORS } from './ei1Constants';

/* ═══ Article type colors ═══ */
const TYPE_COLORS = {
  'biography':        '#c9a84c',
  'geography':        '#4db6ac',
  'concept':          '#7986cb',
  'dynasty':          '#e57373',
  'cross_reference':  '#90a4ae',
};

/* ═══ Simple marker clustering by grid ═══ */
function clusterPoints(points, zoom) {
  const gridSize = Math.max(0.5, 20 / Math.pow(2, zoom - 2));
  const clusters = {};
  points.forEach(p => {
    const gx = Math.floor(p.lat / gridSize);
    const gy = Math.floor(p.lon / gridSize);
    const key = `${gx}_${gy}`;
    if (!clusters[key]) clusters[key] = { lat: 0, lon: 0, items: [], key };
    clusters[key].items.push(p);
    clusters[key].lat += p.lat;
    clusters[key].lon += p.lon;
  });
  return Object.values(clusters).map(c => ({
    lat: c.lat / c.items.length,
    lon: c.lon / c.items.length,
    items: c.items,
    count: c.items.length,
  }));
}

export default function Ei1Map({ lang, te, data, geoData, lookup, filtered, onSelect, selectedId, colorBy }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef(null);
  const tileRef = useRef(null);
  const [zoom, setZoom] = useState(4);

  /* ═══ Join geo + entry data ═══ */
  const geoPoints = useMemo(() => {
    if (!geoData || !data) return [];
    const geoMap = {};
    geoData.forEach(g => {
      // Group by entry id — keep best (dp preferred for historical tradition)
      if (!geoMap[g.id] || g.ps === 'dp') geoMap[g.id] = g;
    });
    const filteredIds = new Set(filtered.map(b => b.id));

    return data
      .filter(b => geoMap[b.id] && filteredIds.has(b.id))
      .map(b => {
        const g = geoMap[b.id];
        return {
          id: b.id,
          lat: g.lat,
          lon: g.lon,
          pn: g.pn || '',
          title: b.t,
          field: b.fl?.[0] || '',
          at: b.at || 'unknown',
          dc: b.dc,
          is: b.is || 0,
        };
      });
  }, [geoData, data, filtered]);

  /* ═══ Init map ═══ */
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const darkUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const lightUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    const map = L.map(mapRef.current, {
      center: [30, 40],
      zoom: 4,
      minZoom: 2,
      maxZoom: 12,
      zoomControl: true,
      attributionControl: false,
    });

    const tile = L.tileLayer(theme === 'light' ? lightUrl : darkUrl, { maxZoom: 19 }).addTo(map);
    tileRef.current = tile;
    map.on('zoomend', () => setZoom(map.getZoom()));
    mapInstanceRef.current = map;

    /* Theme-aware tiles */
    const onThemeChange = (e) => {
      const t = e.detail?.theme || 'dark';
      tile.setUrl(t === 'light' ? lightUrl : darkUrl);
    };
    window.addEventListener('themechange', onThemeChange);

    return () => {
      window.removeEventListener('themechange', onThemeChange);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  /* ═══ Marker color ═══ */
  const getColor = useCallback((item) => {
    if (colorBy === 'type') return TYPE_COLORS[item.at] || '#546e7a';
    return EI1_FIELD_COLORS[item.field] || '#c9a84c';
  }, [colorBy]);

  /* ═══ Render markers with clustering ═══ */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (markersRef.current) {
      markersRef.current.forEach(m => map.removeLayer(m));
    }
    markersRef.current = [];

    if (geoPoints.length === 0) return;

    const clusters = clusterPoints(geoPoints, zoom);
    const markers = [];

    clusters.forEach(cluster => {
      if (cluster.count === 1) {
        const p = cluster.items[0];
        const color = getColor(p);
        const size = Math.max(6, Math.min(14, Math.sqrt(p.is || 20) * 1.4));
        const isSelected = p.id === selectedId;

        const icon = L.divIcon({
          className: 'ei1-map-marker',
          html: `<div style="
            width:${size}px; height:${size}px; border-radius:50%;
            background:${color}; border:${isSelected ? '2px solid #fff' : '1px solid rgba(0,0,0,0.3)'};
            box-shadow:0 0 4px ${color}80;
            cursor:pointer;
          "></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([p.lat, p.lon], { icon })
          .on('click', () => onSelect(p.id));

        marker.bindTooltip(
          `<strong>${p.title}</strong>${p.dc ? `<br>d. ${p.dc}` : ''}${p.pn ? `<br>📍 ${p.pn}` : ''}${p.field ? `<br>${p.field}` : ''}`,
          { className: 'ei1-map-tooltip', direction: 'top', offset: [0, -size / 2] }
        );

        marker.addTo(map);
        markers.push(marker);
      } else {
        const radius = Math.max(16, Math.min(40, Math.sqrt(cluster.count) * 4));
        const icon = L.divIcon({
          className: 'ei1-map-cluster',
          html: `<div style="
            width:${radius}px; height:${radius}px; border-radius:50%;
            background:rgba(140,90,40,0.75); border:2px solid #c9a84c;
            display:flex; align-items:center; justify-content:center;
            color:#fff; font-size:${Math.max(9, radius / 3)}px; font-weight:700;
            cursor:pointer; box-shadow:0 0 8px rgba(140,90,40,0.5);
          ">${cluster.count}</div>`,
          iconSize: [radius, radius],
          iconAnchor: [radius / 2, radius / 2],
        });

        const topItems = cluster.items
          .sort((a, b) => (b.is || 0) - (a.is || 0))
          .slice(0, 5);
        const tooltip = topItems.map(p => p.title).join(', ') +
          (cluster.count > 5 ? ` +${cluster.count - 5}` : '');

        const marker = L.marker([cluster.lat, cluster.lon], { icon })
          .on('click', () => {
            map.setView([cluster.lat, cluster.lon], Math.min(zoom + 2, 12));
          });

        marker.bindTooltip(tooltip, {
          className: 'ei1-map-tooltip',
          direction: 'top',
          offset: [0, -radius / 2],
        });

        marker.addTo(map);
        markers.push(marker);
      }
    });

    markersRef.current = markers;
  }, [geoPoints, zoom, selectedId, getColor, onSelect]);

  /* ═══ Fly to selected ═══ */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || selectedId == null || !geoData) return;
    const geo = geoData.find(g => g.id === selectedId);
    if (geo) {
      map.flyTo([geo.lat, geo.lon], Math.max(map.getZoom(), 6), { duration: 0.8 });
    }
  }, [selectedId, geoData]);

  return (
    <div className="ei1-map-container">
      <div ref={mapRef} className="ei1-map-leaflet" />
      <div className="ei1-map-info">
        <span>📕 {geoPoints.length.toLocaleString()} {te.geocoded || 'geocoded entries'}</span>
      </div>
    </div>
  );
}
