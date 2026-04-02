/**
 * EvliyaMap.jsx — Leaflet harita + MarkerCluster
 * 5,444 marker clustering ile performans optimizasyonu
 * v8.0.0.0 — improved: separated selection layer, no full rebuild on select
 */
import React, { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { CAT_ICONS } from './constants';

// Cluster icon factory — voyage-colored clusters
function createClusterIcon(cluster) {
  const markers = cluster.getAllChildMarkers();
  const count = markers.length;

  const colorCounts = {};
  markers.forEach(m => {
    const c = m.options._voyageColor || '#888';
    colorCounts[c] = (colorCounts[c] || 0) + 1;
  });

  const dominant = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0][0];
  const size = count < 50 ? 36 : count < 200 ? 44 : count < 500 ? 52 : 60;
  const fontSize = count < 50 ? 12 : count < 200 ? 13 : 14;

  return L.divIcon({
    html: `<div class="evliya-cluster" style="
      width:${size}px;height:${size}px;
      background:${dominant}22;
      border:2px solid ${dominant};
      color:${dominant};
      font-size:${fontSize}px;
    ">${count.toLocaleString()}</div>`,
    className: 'evliya-cluster-wrapper',
    iconSize: L.point(size, size),
  });
}

export default function EvliyaMap({
  places, voyageMap, selectedPlace, onSelectPlace, lang,
  sidebarOpen, onToggleSidebar, totalPlaces,
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const clusterRef = useRef(null);
  const selectionLayerRef = useRef(null);
  const placesRef = useRef(places);

  // Keep latest places in ref for selection highlight
  placesRef.current = places;

  // ── Map init ──
  useEffect(() => {
    if (mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current, {
      center: [39, 32],
      zoom: 5,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19,
    }).addTo(mapInstance.current);

    L.control.zoom({ position: 'topright' }).addTo(mapInstance.current);

    clusterRef.current = L.markerClusterGroup({
      maxClusterRadius: 50,
      disableClusteringAtZoom: 14,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: createClusterIcon,
      animate: true,
      animateAddingMarkers: false,
    });

    selectionLayerRef.current = L.layerGroup();
    mapInstance.current.addLayer(clusterRef.current);
    mapInstance.current.addLayer(selectionLayerRef.current);

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
      clusterRef.current = null;
      selectionLayerRef.current = null;
    };
  }, []);

  // ── Update markers when filtered places change (NOT on selectedPlace change) ──
  useEffect(() => {
    if (!mapInstance.current || !clusterRef.current) return;

    clusterRef.current.clearLayers();

    const markers = places.map(p => {
      const voyage = voyageMap[p.voyage_id] || {};
      const color = voyage.color || '#888';
      const name = p[lang] || p.tr || '';
      const icon = CAT_ICONS[p.category] || '📍';

      const marker = L.circleMarker([p.lat, p.lon], {
        radius: 5,
        fillColor: color,
        color: color,
        weight: 1,
        fillOpacity: 0.85,
        opacity: 1,
        _voyageColor: color,
      });

      marker.bindTooltip(`${icon} ${name}`, {
        direction: 'top',
        className: 'evliya-tooltip',
      });

      marker.on('click', () => onSelectPlace(p));
      return marker;
    });

    clusterRef.current.addLayers(markers);
  }, [places, voyageMap, onSelectPlace, lang]);

  // ── Update selection highlight separately (lightweight) ──
  useEffect(() => {
    if (!selectionLayerRef.current) return;
    selectionLayerRef.current.clearLayers();

    if (selectedPlace) {
      const voyage = voyageMap[selectedPlace.voyage_id] || {};
      const highlight = L.circleMarker([selectedPlace.lat, selectedPlace.lon], {
        radius: 12,
        fillColor: voyage.color || '#fff',
        color: '#fff',
        weight: 3,
        fillOpacity: 0.4,
        opacity: 1,
      });
      selectionLayerRef.current.addLayer(highlight);
    }
  }, [selectedPlace, voyageMap]);

  // ── Fly to selected ──
  useEffect(() => {
    if (selectedPlace && mapInstance.current) {
      mapInstance.current.flyTo([selectedPlace.lat, selectedPlace.lon], 14, { duration: 0.8 });
    }
  }, [selectedPlace]);

  // ── Resize on sidebar toggle ──
  useEffect(() => {
    const timer = setTimeout(() => mapInstance.current?.invalidateSize(), 300);
    return () => clearTimeout(timer);
  }, [sidebarOpen]);

  // ── Legend data ──
  const legend = useMemo(() => {
    const voyageCounts = {};
    places.forEach(p => {
      voyageCounts[p.voyage_id] = (voyageCounts[p.voyage_id] || 0) + 1;
    });
    return Object.entries(voyageCounts)
      .map(([vid, count]) => ({ ...voyageMap[vid], count }))
      .filter(v => v.id)
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [places, voyageMap]);

  return (
    <div className="evliya-map-container">
      <div ref={mapRef} className="evliya-map" />

      {!sidebarOpen && (
        <button
          className="evliya-sidebar-toggle"
          onClick={onToggleSidebar}
          title="Filtreleri aç"
          aria-label="Open filters"
        >
          ☰
        </button>
      )}

      <div className="evliya-map-legend">
        <div className="evliya-map-legend-title">
          {places.length.toLocaleString()} / {(totalPlaces || places.length).toLocaleString()}
        </div>
        {legend.map(v => (
          <div key={v.id} className="evliya-map-legend-item">
            <span className="evliya-map-legend-dot" style={{ background: v.color }} />
            <span className="evliya-map-legend-label">{v.id}</span>
            <span className="evliya-map-legend-count">{v.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
