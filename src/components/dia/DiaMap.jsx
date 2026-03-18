import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';

/* ═══ Field colors for cluster styling ═══ */
const FIELD_COLORS = {
  'fıkıh':'#4fc3f7','hadis':'#81c784','tefsir':'#4db6ac',
  'kelâm':'#7986cb','tasavvuf':'#9575cd','edebiyat':'#ce93d8',
  'tarih':'#90a4ae','felsefe':'#ffb74d','tıp':'#66bb6a',
  'astronomi':'#64b5f6','matematik':'#f06292','mûsiki':'#a1887f',
  'siyaset':'#ff8a65',
};

const MADHAB_COLORS = {
  'Hanefî':'#4fc3f7','Şâfiî':'#66bb6a','Mâlikî':'#ffd54f',
  'Hanbelî':'#ef5350','Zâhirî':'#ce93d8',"Ca'ferî":'#ff8a65',
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

export default function DiaMap({ lang, td, data, geoData, lookup, filtered, onSelect, selectedId, colorBy }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef(null);
  const [zoom, setZoom] = useState(4);

  /* ═══ Join geo + bio data ═══ */
  const geoPoints = useMemo(() => {
    if (!geoData || !data) return [];
    const geoMap = {};
    geoData.forEach(g => { geoMap[g.id] = g; });
    const filteredIds = new Set(filtered.map(b => b.id));
    
    return data
      .filter(b => geoMap[b.id] && filteredIds.has(b.id))
      .map(b => {
        const g = geoMap[b.id];
        return {
          id: b.id,
          lat: g.lat,
          lon: g.lon,
          title: b.t,
          field: b.fl?.[0] || '',
          madhab: b.mz || '',
          dc: b.dc,
          is: b.is || 0,
        };
      });
  }, [geoData, data, filtered]);

  /* ═══ Init map ═══ */
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [30, 40],
      zoom: 4,
      minZoom: 2,
      maxZoom: 12,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    map.on('zoomend', () => setZoom(map.getZoom()));
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  /* ═══ Marker color ═══ */
  const getColor = useCallback((item) => {
    if (colorBy === 'madhab') return MADHAB_COLORS[item.madhab] || '#546e7a';
    return FIELD_COLORS[item.field] || '#c9a84c';
  }, [colorBy]);

  /* ═══ Render markers with clustering ═══ */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous
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
        const size = Math.max(6, Math.min(14, Math.sqrt(p.is || 30) * 1.2));
        const isSelected = p.id === selectedId;

        const icon = L.divIcon({
          className: 'dia-map-marker',
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
          `<strong>${p.title}</strong>${p.dc ? `<br>ö. ${p.dc}` : ''}${p.field ? `<br>${p.field}` : ''}`,
          { className: 'dia-map-tooltip', direction: 'top', offset: [0, -size / 2] }
        );

        marker.addTo(map);
        markers.push(marker);
      } else {
        // Cluster marker
        const radius = Math.max(16, Math.min(40, Math.sqrt(cluster.count) * 4));
        const icon = L.divIcon({
          className: 'dia-map-cluster',
          html: `<div style="
            width:${radius}px; height:${radius}px; border-radius:50%;
            background:rgba(26,107,90,0.7); border:2px solid #d4af37;
            display:flex; align-items:center; justify-content:center;
            color:#fff; font-size:${Math.max(9, radius / 3)}px; font-weight:700;
            cursor:pointer; box-shadow:0 0 8px rgba(26,107,90,0.5);
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
          className: 'dia-map-tooltip',
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
    if (!map || !selectedId || !geoData) return;
    const geo = geoData.find(g => g.id === selectedId);
    if (geo) {
      map.flyTo([geo.lat, geo.lon], Math.max(map.getZoom(), 6), { duration: 0.8 });
    }
  }, [selectedId, geoData]);

  return (
    <div className="dia-map-container">
      <div ref={mapRef} className="dia-map-leaflet" />
      <div className="dia-map-info">
        <span>{geoPoints.length.toLocaleString()} {td.geocoded || 'konumlu âlim'}</span>
      </div>
    </div>
  );
}
