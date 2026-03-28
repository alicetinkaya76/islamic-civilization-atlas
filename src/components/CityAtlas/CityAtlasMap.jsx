import { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function CityAtlasMap({ records, city, lang, getName, getCat, selected, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(null);

  // ── Initialize map ──
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: city.center,
      zoom: city.defaultZoom,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('© <a href="https://carto.com">CartoDB</a> · © <a href="https://osm.org">OSM</a>')
      .addTo(map);

    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Render markers ──
  useEffect(() => {
    const markers = markersRef.current;
    if (!markers) return;
    markers.clearLayers();

    records.forEach((r) => {
      const lat = r.location?.lat;
      const lng = r.location?.lng;
      if (!lat || !lng) return;

      const catCfg = city.categories[r.category] || {};
      const color = catCfg.color || '#888';
      const isSelected = selected?.id === r.id;

      const marker = L.circleMarker([lat, lng], {
        radius: isSelected ? 11 : 6,
        fillColor: color,
        color: isSelected ? '#FFD700' : 'rgba(255,255,255,0.6)',
        weight: isSelected ? 3 : 1,
        fillOpacity: isSelected ? 1 : 0.8,
      });

      const name = getName(r);
      const cat = getCat(r);
      const date = r.dates?.founding_miladi ? `<br/><span style="opacity:0.6">${r.dates.founding_miladi}</span>` : '';

      marker.bindTooltip(
        `<strong>${name}</strong><br/><em>${cat}</em>${date}`,
        { direction: 'top', offset: [0, -8], className: '' }
      );

      marker.on('click', () => onSelect(r));
      markers.addLayer(marker);
    });
  }, [records, selected, lang]);

  // ── Fly to selected ──
  useEffect(() => {
    if (!selected || !mapRef.current) return;
    const lat = selected.location?.lat;
    const lng = selected.location?.lng;
    if (lat && lng) {
      mapRef.current.flyTo([lat, lng], Math.max(mapRef.current.getZoom(), 17), {
        duration: 0.6,
      });
    }
  }, [selected]);

  // ── Fit bounds when records change significantly ──
  useEffect(() => {
    if (!mapRef.current || records.length === 0) return;
    const points = records
      .filter((r) => r.location?.lat && r.location?.lng)
      .map((r) => [r.location.lat, r.location.lng]);
    if (points.length > 2 && !selected) {
      const bounds = L.latLngBounds(points);
      mapRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
    }
  }, [records.length]);

  return <div ref={containerRef} className="ca-map" />;
}
