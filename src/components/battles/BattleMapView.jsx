import { useEffect, useRef } from 'react';
import L from 'leaflet';

const TYPE_ICONS = {
  'Land': '⚔', 'Naval': '⚓', 'Siege': '🏰',
  'Civil War': '⚡', 'Land & Naval': '⚔',
};
const TYPE_COLORS = {
  'Land': '#ef4444', 'Naval': '#3b82f6', 'Siege': '#f59e0b',
  'Civil War': '#8b5cf6', 'Land & Naval': '#ef4444',
};
const SIG_RADIUS = { 'Kritik': 14, 'Yüksek': 10 };

export default function BattleMapView({ filteredBattles, selectedId, onSelectBattle }) {
  const mapRef = useRef(null);
  const lgRef = useRef(null);

  /* Init Leaflet */
  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map('battle-map', {
      center: [28, 42], zoom: 3,
      zoomControl: true,
      attributionControl: true,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© CartoDB', maxZoom: 18,
    }).addTo(map);
    lgRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  /* Update markers */
  useEffect(() => {
    const lg = lgRef.current;
    if (!lg) return;
    lg.clearLayers();

    filteredBattles.forEach(b => {
      if (!b.lat || !b.lon) return;
      const typeEn = b.type_en || 'Land';
      const icon = TYPE_ICONS[typeEn] || '⚔';
      const color = TYPE_COLORS[typeEn] || '#ef4444';
      const r = SIG_RADIUS[b.sig] || 7;
      const isSelected = b.id === selectedId;
      const pulseClass = b.sig === 'Kritik' ? 'battle-pulse' : '';
      const borderColor = isSelected ? '#ffffff' : color;

      const divIcon = L.divIcon({
        className: '',
        iconSize: [r * 2, r * 2],
        iconAnchor: [r, r],
        html: `<div class="${pulseClass}" style="
          width:${r * 2}px; height:${r * 2}px;
          background:${color}22;
          border:2px solid ${borderColor};
          border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:${r}px;
          cursor:pointer;
          transition: border-color .2s;
        ">${icon}</div>`,
      });

      const marker = L.marker([b.lat, b.lon], { icon: divIcon });
      marker.on('click', () => onSelectBattle(b.id));
      marker.addTo(lg);
    });
  }, [filteredBattles, selectedId, onSelectBattle]);

  /* flyTo helper exposed via ref */
  useEffect(() => {
    // Attach flyTo to the component for external calls
    window.__battleMapFlyTo = (lat, lon) => {
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lon], 6, { duration: 1 });
      }
    };
    return () => { delete window.__battleMapFlyTo; };
  }, []);

  return <div id="battle-map" />;
}
