/**
 * ScienceLayerMap.jsx — islamicatlas.org Science Layer (v7.4.0.0 / O8)
 *
 * B1: Category-based route styles (internal/science_transfer/cultural_transfer)
 *     - Colour-coded polylines with animated dash patterns
 *     - Direction arrows on transfer routes
 *     - Pulsing waypoint markers for transfer routes
 * Route highlight support for cross-ref navigation (B4/B5)
 */

import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { FIELD_COLORS } from './ScienceLayerView';

/* ── Map config ── */
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>';
const CENTER = [30, 45];
const ZOOM = 4;

/* ── Route category styles ── */
const ROUTE_STYLES = {
  internal: {
    color: '#3B82F6',
    weight: 2,
    dashArray: null,
    opacity: 0.65,
    glowWeight: 5,
    glowOpacity: 0.10,
    animated: false,
    arrows: false,
  },
  science_transfer: {
    color: '#F59E0B',
    weight: 4,
    dashArray: '12 6',
    opacity: 0.75,
    glowWeight: 8,
    glowOpacity: 0.15,
    animated: true,
    arrows: true,
  },
  cultural_transfer: {
    color: '#10B981',
    weight: 4,
    dashArray: '4 8',
    opacity: 0.75,
    glowWeight: 8,
    glowOpacity: 0.15,
    animated: true,
    arrows: true,
  },
};

/* ── Fallback colours for routes without category ── */
const ROUTE_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];

/* ── Curved polyline (quadratic bezier approximation) ── */
function curvedLatLngs(from, to, n = 25) {
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;
  const dx = lng2 - lng1, dy = lat2 - lat1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = Math.min(dist * 0.2, 5);
  const cpLat = midLat + (-dx / dist) * offset;
  const cpLng = midLng + (dy / dist) * offset;

  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([
      (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * cpLat + t * t * lat2,
      (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * cpLng + t * t * lng2,
    ]);
  }
  return pts;
}

/* ── Arrow marker at midpoint ── */
function createArrowMarker(from, to, color) {
  const midLat = (from[0] + to[0]) / 2;
  const midLng = (from[1] + to[1]) / 2;
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]) * (180 / Math.PI);

  return L.marker([midLat, midLng], {
    icon: L.divIcon({
      className: 'sci-route-arrow',
      html: `<svg width="16" height="16" viewBox="0 0 16 16" style="transform:rotate(${-angle + 45}deg)">
        <path d="M2 14L8 2L14 14L8 10Z" fill="${color}" opacity="0.85"/>
      </svg>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    }),
    interactive: false,
  });
}

/* ── Pulsing waypoint marker ── */
function createPulsingMarker(coords, color, isEndpoint) {
  const r = isEndpoint ? 6 : 4;
  return L.divIcon({
    className: 'sci-pulse-wp',
    html: `<span class="sci-wp-core" style="width:${r * 2}px;height:${r * 2}px;background:${color};box-shadow:0 0 8px ${color}60"></span>
           <span class="sci-wp-ring" style="width:${r * 3}px;height:${r * 3}px;border-color:${color}"></span>`,
    iconSize: [r * 3, r * 3],
    iconAnchor: [r * 1.5, r * 1.5],
  });
}

/* ── Institution icon (rotated square = diamond) ── */
function createDiamondIcon(color) {
  return L.divIcon({
    className: 'sci-inst-marker',
    html: `<div style="width:14px;height:14px;background:${color};transform:rotate(45deg);border:2px solid rgba(255,255,255,0.7);border-radius:2px;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export default function ScienceLayerMap({
  lang, scholars, institutions, knowledgeRoutes,
  highlightedId, highlightedRouteId,
  onScholarClick, onInstitutionClick, onRouteClick,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const scholarsLayer = useRef(null);
  const instLayer = useRef(null);
  const routeLayer = useRef(null);
  const highlightLayer = useRef(null);

  /* ── Init map ── */
  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: CENTER, zoom: ZOOM,
      zoomControl: false, attributionControl: true,
    });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 18, subdomains: 'abcd' }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);

    scholarsLayer.current = L.layerGroup().addTo(map);
    instLayer.current = L.layerGroup().addTo(map);
    routeLayer.current = L.layerGroup().addTo(map);
    highlightLayer.current = L.layerGroup().addTo(map);

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  /* ── Scholar markers ── */
  useEffect(() => {
    const layer = scholarsLayer.current;
    if (!layer) return;
    layer.clearLayers();

    scholars.forEach(s => {
      const coords = s.birth_place?.coordinates;
      if (!coords || coords.length < 2) return;

      const color = FIELD_COLORS[s.primary_field] || '#888';
      const name = s.name?.[lang] || s.name?.en || '';

      // Birth place marker
      const marker = L.circleMarker([coords[0], coords[1]], {
        radius: 7,
        fillColor: color,
        color: 'rgba(255,255,255,0.6)',
        weight: 1.5,
        fillOpacity: 0.85,
      });
      marker.bindTooltip(`<strong>${name}</strong>`, {
        direction: 'top', offset: [0, -8],
      });
      marker.on('click', () => onScholarClick?.(s));
      layer.addLayer(marker);

      // Active places (smaller dots)
      (s.active_places || []).forEach(ap => {
        if (!ap.coordinates || ap.coordinates.length < 2) return;
        const apMarker = L.circleMarker([ap.coordinates[0], ap.coordinates[1]], {
          radius: 4,
          fillColor: color,
          color: 'rgba(255,255,255,0.3)',
          weight: 1,
          fillOpacity: 0.5,
        });
        apMarker.bindTooltip(`${name} — ${ap.role || ''}`, {
          direction: 'top', offset: [0, -5],
        });
        apMarker.on('click', () => onScholarClick?.(s));
        layer.addLayer(apMarker);
      });
    });
  }, [scholars, lang, onScholarClick]);

  /* ── Institution markers ── */
  useEffect(() => {
    const layer = instLayer.current;
    if (!layer) return;
    layer.clearLayers();

    institutions.forEach(inst => {
      const coords = inst.coordinates;
      if (!coords || coords.length < 2) return;

      const color = inst.marker_color || '#a855f7';
      const name = inst.name?.[lang] || inst.name?.en || '';
      const icon = createDiamondIcon(color);

      const marker = L.marker([coords[0], coords[1]], { icon });
      marker.bindTooltip(`<strong>${name}</strong><br/><em>${inst.city?.[lang] || inst.city?.en || ''}</em>`, {
        direction: 'top', offset: [0, -10],
      });
      marker.on('click', () => onInstitutionClick?.(inst));
      layer.addLayer(marker);
    });
  }, [institutions, lang, onInstitutionClick]);

  /* ── Knowledge route polylines (B1: category-based styles) ── */
  useEffect(() => {
    const layer = routeLayer.current;
    if (!layer) return;
    layer.clearLayers();

    knowledgeRoutes.forEach((route, idx) => {
      const wps = [];
      if (route.from?.coordinates) wps.push(route.from.coordinates);
      (route.via || []).forEach(v => { if (v.coordinates) wps.push(v.coordinates); });
      if (route.to?.coordinates) wps.push(route.to.coordinates);
      if (wps.length < 2) return;

      const cat = route.category || 'internal';
      const style = ROUTE_STYLES[cat] || ROUTE_STYLES.internal;
      const color = style.color || ROUTE_COLORS[idx % ROUTE_COLORS.length];
      const isHighlighted = highlightedRouteId === route.id;
      const dimFactor = highlightedRouteId
        ? (isHighlighted ? 1 : 0.08)   // selected: full, others: nearly invisible
        : 0.35;                          // no selection: all routes subtle

      for (let i = 0; i < wps.length - 1; i++) {
        const curved = curvedLatLngs(wps[i], wps[i + 1]);

        // glow
        L.polyline(curved, {
          color,
          weight: isHighlighted ? style.glowWeight * 1.5 : style.glowWeight,
          opacity: style.glowOpacity * dimFactor * (isHighlighted ? 2.5 : 1),
          smoothFactor: 1,
        }).addTo(layer);

        // main line
        const lineOpts = {
          color,
          weight: isHighlighted ? style.weight + 1.5 : style.weight,
          opacity: style.opacity * dimFactor,
          smoothFactor: 1,
          className: style.animated ? `sci-animated-dash sci-dash-${cat}` : '',
        };
        if (style.dashArray) lineOpts.dashArray = style.dashArray;

        const polyline = L.polyline(curved, lineOpts);
        polyline.bindTooltip(route.name?.[lang] || route.name?.en || '', { direction: 'top', sticky: true });
        polyline.on('click', () => onRouteClick?.(route));
        polyline.addTo(layer);

        // arrows for transfer routes
        if (style.arrows && (i === Math.floor((wps.length - 2) / 2) || wps.length <= 3)) {
          const arrow = createArrowMarker(wps[i], wps[i + 1], color);
          arrow.setOpacity(dimFactor);
          layer.addLayer(arrow);
        }
      }

      // waypoint markers
      wps.forEach((wp, wi) => {
        const isEnd = wi === 0 || wi === wps.length - 1;
        const isTransfer = cat !== 'internal';

        if (isTransfer) {
          // pulsing markers for transfer routes
          const pulseIcon = createPulsingMarker(wp, color, isEnd);
          const m = L.marker([wp[0], wp[1]], { icon: pulseIcon, interactive: true });
          // Tooltip with waypoint name
          const wpName = wi === 0 ? route.from?.name :
                         wi === wps.length - 1 ? route.to?.name :
                         route.via?.[wi - 1]?.name;
          const wpLabel = (typeof wpName === 'object') ? (wpName?.[lang] || wpName?.en || '') : (wpName || '');
          const wpEvent = wi === 0 ? route.from?.event :
                          wi === wps.length - 1 ? route.to?.event :
                          route.via?.[wi - 1]?.event;
          const eventText = wpEvent ? (wpEvent[lang] || wpEvent.en || '') : '';
          const tipHtml = `<strong>${wpLabel}</strong>${eventText ? `<br/><em style="font-size:10px;opacity:0.8">${eventText.slice(0, 80)}${eventText.length > 80 ? '…' : ''}</em>` : ''}`;
          m.bindTooltip(tipHtml, { direction: 'top', offset: [0, -8] });
          m.on('click', () => onRouteClick?.(route));
          layer.addLayer(m);
        } else {
          // circle markers for internal routes
          L.circleMarker([wp[0], wp[1]], {
            radius: isEnd ? 5 : 3,
            fillColor: color,
            color: '#fff',
            weight: 1.5,
            fillOpacity: 0.9 * dimFactor,
          })
            .bindTooltip(route.name?.[lang] || route.name?.en || '', { direction: 'top' })
            .on('click', () => onRouteClick?.(route))
            .addTo(layer);
        }
      });
    });
  }, [knowledgeRoutes, lang, highlightedRouteId, onRouteClick]);

  /* ── Highlight (pulse fly-to) for scholars/institutions ── */
  useEffect(() => {
    const layer = highlightLayer.current;
    if (!layer) return;
    layer.clearLayers();
    if (!highlightedId) return;

    const s = scholars.find(x => x.id === highlightedId);
    const inst = institutions.find(x => x.id === highlightedId);
    const coords = s ? s.birth_place?.coordinates : inst?.coordinates;
    if (!coords || coords.length < 2) return;

    const color = s ? (FIELD_COLORS[s.primary_field] || '#fff') : (inst?.marker_color || '#fff');

    // pulse circle
    const pulse = L.circleMarker([coords[0], coords[1]], {
      radius: 18, fillColor: color, color, weight: 2, fillOpacity: 0.25, opacity: 0.6,
    });
    layer.addLayer(pulse);

    // fly to
    if (mapRef.current) {
      mapRef.current.flyTo([coords[0], coords[1]], Math.max(mapRef.current.getZoom(), 6), { duration: 0.8 });
    }

    const timer = setTimeout(() => layer.clearLayers(), 3000);
    return () => clearTimeout(timer);
  }, [highlightedId, scholars, institutions]);

  /* ── Fit bounds to highlighted route ── */
  useEffect(() => {
    if (!highlightedRouteId || !mapRef.current) return;
    const route = knowledgeRoutes.find(r => r.id === highlightedRouteId);
    if (!route) return;

    const wps = [];
    if (route.from?.coordinates) wps.push(route.from.coordinates);
    (route.via || []).forEach(v => { if (v.coordinates) wps.push(v.coordinates); });
    if (route.to?.coordinates) wps.push(route.to.coordinates);
    if (wps.length < 2) return;

    const bounds = L.latLngBounds(wps);
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 7, duration: 0.6 });
    }
  }, [highlightedRouteId, knowledgeRoutes]);

  /* ── Fit bounds on data change ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (scholars.length === 0 && institutions.length === 0) return;

    const bounds = L.latLngBounds([]);
    scholars.forEach(s => {
      if (s.birth_place?.coordinates) bounds.extend(s.birth_place.coordinates);
    });
    institutions.forEach(i => {
      if (i.coordinates) bounds.extend(i.coordinates);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
    }
  }, [scholars, institutions]);

  return <div ref={containerRef} className="sci-map" />;
}
