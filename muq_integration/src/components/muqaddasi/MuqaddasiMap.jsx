import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import L from 'leaflet';
import { IQLIM_COLORS, CERT_OPACITY, CERT_RADIUS, DEFAULT_COLOR, IQLIM_LABELS } from './constants';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';
const CENTER = [32, 48];
const ZOOM = 4;

/* ═══ Route dash by certainty ═══ */
function routeDash(fromCert, toCert) {
  if (fromCert === 'estimated' || toCert === 'estimated') return '2 6';
  if (fromCert === 'uncertain' || toCert === 'uncertain') return '4 4';
  return null; // solid
}

export default function MuqaddasiMap({ places, routes, filtered, selectedId, onSelect, showRoutes, lang }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef(null);
  const routeLayerRef = useRef(null);
  const selectedRef = useRef(null);

  /* ── init map ── */
  useEffect(() => {
    if (mapInstance.current) return;
    const map = L.map(mapRef.current, {
      center: CENTER, zoom: ZOOM,
      zoomControl: true, attributionControl: true,
      maxZoom: 14, minZoom: 3,
    });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR }).addTo(map);
    mapInstance.current = map;
    markersRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  /* ── place id → object ── */
  const placeMap = useMemo(() => {
    const m = {};
    places.forEach(p => { m[p.id] = p; });
    return m;
  }, [places]);

  /* ── route lines ── */
  useEffect(() => {
    const layer = routeLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!showRoutes) return;

    const filteredIds = new Set(filtered.map(p => p.id));
    routes.forEach(r => {
      if (r.from_lat == null || r.to_lat == null) return;
      // Only show routes where at least one endpoint is in filtered set
      if (!filteredIds.has(r.from_id) && !filteredIds.has(r.to_id)) return;

      const color = IQLIM_COLORS[r.iqlim_ar] || '#555';
      const fromP = placeMap[r.from_id];
      const toP = placeMap[r.to_id];
      const dash = routeDash(fromP?.certainty, toP?.certainty);

      const line = L.polyline(
        [[r.from_lat, r.from_lon], [r.to_lat, r.to_lon]],
        { color, weight: 1.5, opacity: 0.35, dashArray: dash }
      );

      const tooltipContent = `${r.from_ar} → ${r.to_ar}` +
        (r.km_est ? ` (${r.km_est} km)` : '') +
        (r.marhala_type && r.marhala_type !== 'standard' ? ` [${r.marhala_type}]` : '');
      line.bindTooltip(tooltipContent, { sticky: true, className: 'muq-tooltip' });
      line.addTo(layer);
    });
  }, [routes, filtered, showRoutes, placeMap]);

  /* ── markers ── */
  useEffect(() => {
    const layer = markersRef.current;
    if (!layer) return;
    layer.clearLayers();

    filtered.forEach(p => {
      if (p.lat == null || p.lon == null) return;
      const color = IQLIM_COLORS[p.iqlim_ar] || DEFAULT_COLOR;
      const opacity = CERT_OPACITY[p.certainty] ?? 0.5;
      const radius = CERT_RADIUS[p.certainty] ?? 4;
      const isSelected = p.id === selectedId;

      const marker = L.circleMarker([p.lat, p.lon], {
        radius: isSelected ? radius + 3 : radius,
        fillColor: color,
        fillOpacity: isSelected ? 1 : opacity,
        color: isSelected ? '#fff' : '#333',
        weight: isSelected ? 2 : 0.5,
        opacity: isSelected ? 1 : opacity,
      });

      const iqLabel = lang === 'ar' ? p.iqlim_ar :
        (IQLIM_LABELS[p.iqlim_ar]?.[lang] || p.iqlim_ar || '');
      marker.bindTooltip(
        `<div style="direction:rtl;font-family:Amiri,serif">
          <strong>${p.name_ar}</strong>
          ${iqLabel ? `<br/><span style="color:${color}">${iqLabel}</span>` : ''}
        </div>`,
        { direction: 'top', offset: [0, -6] }
      );

      marker.on('click', () => onSelect(p.id));
      marker.addTo(layer);
    });
  }, [filtered, selectedId, onSelect, lang]);

  /* ── fly to selected ── */
  useEffect(() => {
    if (!selectedId || !mapInstance.current) return;
    const p = placeMap[selectedId];
    if (p?.lat != null) {
      mapInstance.current.flyTo([p.lat, p.lon], Math.max(mapInstance.current.getZoom(), 7), { duration: 0.6 });
    }
  }, [selectedId, placeMap]);

  return <div ref={mapRef} className="muq-map" />;
}
