import { useEffect, useRef, useMemo, useState } from 'react';
import L from 'leaflet';
import { IQLIM_COLORS, CERT_OPACITY, CERT_RADIUS, DEFAULT_COLOR, IQLIM_LABELS } from './constants';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';
const CENTER = [32, 48];
const ZOOM = 4;

/* Which certainty levels show at which zoom */
function shouldShowAtZoom(cert, z) {
  if (z >= 8) return true;
  if (z >= 6) return cert !== 'estimated';
  if (z >= 5) return ['certain','exact','modern_known','approximate','country','region'].includes(cert);
  return ['certain','exact','modern_known'].includes(cert);
}

function routeDash(fromCert, toCert) {
  if (fromCert === 'estimated' || toCert === 'estimated') return '2 6';
  if (fromCert === 'uncertain' || toCert === 'uncertain') return '4 4';
  return null;
}

export default function MuqaddasiMap({
  places, routes, filtered, selectedId, onSelect,
  showRoutes, connectedRoutes, selectedIqlim, lang
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef(null);
  const routeLayerRef = useRef(null);
  const [zoom, setZoom] = useState(ZOOM);

  useEffect(() => {
    if (mapInstance.current) return;
    const map = L.map(mapRef.current, {
      center: CENTER, zoom: ZOOM, zoomControl: true,
      attributionControl: true, maxZoom: 14, minZoom: 3,
    });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR }).addTo(map);
    mapInstance.current = map;
    markersRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    map.on('zoomend', () => setZoom(map.getZoom()));
    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  const placeMap = useMemo(() => {
    const m = {};
    places.forEach(p => { m[p.id] = p; });
    return m;
  }, [places]);

  /* Determine visible routes */
  const visibleRoutes = useMemo(() => {
    if (selectedId && connectedRoutes.length > 0) return connectedRoutes;
    if (showRoutes && selectedIqlim) {
      return routes.filter(r => r.iqlim_ar === selectedIqlim && r.from_lat != null && r.to_lat != null);
    }
    if (showRoutes && mapInstance.current) {
      const b = mapInstance.current.getBounds();
      const inView = routes.filter(r => {
        if (r.from_lat == null || r.to_lat == null) return false;
        return b.contains([r.from_lat, r.from_lon]) || b.contains([r.to_lat, r.to_lon]);
      });
      // At low zoom, cap route count to prevent clutter
      if (zoom < 6 && inView.length > 200) return inView.slice(0, 200);
      return inView;
    }
    return [];
  }, [selectedId, connectedRoutes, showRoutes, selectedIqlim, routes, zoom]);

  /* Route lines */
  useEffect(() => {
    const layer = routeLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    visibleRoutes.forEach(r => {
      if (r.from_lat == null || r.to_lat == null) return;
      const color = IQLIM_COLORS[r.iqlim_ar] || '#555';
      const isConn = selectedId && (r.from_id === selectedId || r.to_id === selectedId);
      const line = L.polyline(
        [[r.from_lat, r.from_lon], [r.to_lat, r.to_lon]],
        { color: isConn ? '#7ecba1' : color, weight: isConn ? 2.5 : 1.5,
          opacity: isConn ? 0.8 : 0.3,
          dashArray: routeDash(placeMap[r.from_id]?.certainty, placeMap[r.to_id]?.certainty) }
      );
      const tip = `${r.from_ar} → ${r.to_ar}` + (r.km_est ? ` (${r.km_est} km)` : '');
      line.bindTooltip(tip, { sticky: true, className: 'muq-tooltip' });
      line.addTo(layer);
    });
  }, [visibleRoutes, selectedId, placeMap]);

  /* Zoom-filtered places */
  const zoomFiltered = useMemo(() => {
    return filtered.filter(p => p.lat != null && p.lon != null && shouldShowAtZoom(p.certainty, zoom));
  }, [filtered, zoom]);

  /* Markers */
  useEffect(() => {
    const layer = markersRef.current;
    if (!layer) return;
    layer.clearLayers();
    zoomFiltered.forEach(p => {
      const color = IQLIM_COLORS[p.iqlim_ar] || DEFAULT_COLOR;
      const baseOp = CERT_OPACITY[p.certainty] ?? 0.5;
      const dimmed = selectedIqlim && p.iqlim_ar !== selectedIqlim;
      const opacity = dimmed ? baseOp * 0.25 : baseOp;
      const radius = CERT_RADIUS[p.certainty] ?? 4;
      const isSel = p.id === selectedId;
      const marker = L.circleMarker([p.lat, p.lon], {
        radius: isSel ? radius + 3 : radius,
        fillColor: color, fillOpacity: isSel ? 1 : opacity,
        color: isSel ? '#fff' : (dimmed ? 'transparent' : '#333'),
        weight: isSel ? 2 : 0.5, opacity: isSel ? 1 : opacity,
      });
      const iqLabel = lang === 'ar' ? p.iqlim_ar : (IQLIM_LABELS[p.iqlim_ar]?.[lang] || p.iqlim_ar || '');
      marker.bindTooltip(
        `<div style="direction:rtl;font-family:Amiri,serif"><strong>${p.name_ar}</strong>${iqLabel ? `<br/><span style="color:${color}">${iqLabel}</span>` : ''}</div>`,
        { direction: 'top', offset: [0, -6] }
      );
      marker.on('click', () => onSelect(p.id));
      marker.addTo(layer);
    });
  }, [zoomFiltered, selectedId, selectedIqlim, onSelect, lang]);

  /* Fly to selected */
  useEffect(() => {
    if (!selectedId || !mapInstance.current) return;
    const p = placeMap[selectedId];
    if (p?.lat != null) mapInstance.current.flyTo([p.lat, p.lon], Math.max(mapInstance.current.getZoom(), 7), { duration: 0.6 });
  }, [selectedId, placeMap]);

  const hiddenCount = filtered.length - zoomFiltered.length;
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} className="muq-map" />
      {hiddenCount > 0 && (
        <div className="muq-zoom-hint">Yakınlaştırarak {hiddenCount} gizli yeri görün</div>
      )}
    </div>
  );
}
