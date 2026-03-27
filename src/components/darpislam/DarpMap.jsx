import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';

const METAL_COLORS = {
  AU: '#FFD700',
  AR: '#C0C0C0',
  AE: '#B87333',
  EL: '#CFB53B',
  Pb: '#7F7F7F',
  GL: '#87CEEB',
};

const TYPE_RADIUS = {
  confirmed_mint: 6,
  known_mint: 5,
  probable_mint: 4,
  possible_mint: 3,
};

function getMintColor(mint) {
  if (!mint.metals || mint.metals.length === 0) return '#888';
  if (mint.metals.includes('AU')) return METAL_COLORS.AU;
  if (mint.metals.includes('AR')) return METAL_COLORS.AR;
  if (mint.metals.includes('AE')) return METAL_COLORS.AE;
  return '#888';
}

function getMintRadius(mint) {
  const base = TYPE_RADIUS[mint.type] || 4;
  const emScale = Math.min(Math.log2((mint.emission_count || 1) + 1) * 0.8, 4);
  return base + emScale;
}

export default function DarpMap({ mints, selectedMint, onSelect, center, zoom, lang }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef(null);
  const t = (tr, en) => lang === 'tr' ? tr : en;

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = L.map(mapRef.current, {
      center,
      zoom,
      minZoom: 2,
      maxZoom: 14,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  // Update center/zoom
  useEffect(() => {
    if (!mapInstance.current) return;
    mapInstance.current.setView(center, zoom, { animate: true });
  }, [center, zoom]);

  // Render markers
  useEffect(() => {
    if (!mapInstance.current || !markersRef.current) return;
    markersRef.current.clearLayers();

    mints.forEach(mint => {
      if (!mint.lat || !mint.lng) return;
      const color = getMintColor(mint);
      const radius = getMintRadius(mint);
      const isSelected = selectedMint?.id === mint.id;
      const isTier3 = mint.tier === 3;

      const marker = L.circleMarker([mint.lat, mint.lng], {
        radius: isSelected ? radius + 3 : (isTier3 ? 3 : radius),
        fillColor: isTier3 ? '#666' : color,
        color: isSelected ? '#e63946' : (isTier3 ? '#555' : '#333'),
        weight: isSelected ? 3 : 1,
        opacity: isTier3 ? 0.4 : 0.9,
        fillOpacity: isSelected ? 0.95 : (isTier3 ? 0.25 : 0.7),
      });

      // Tooltip
      const name = lang === 'tr' ? mint.name_tr : mint.name_en;
      const region = lang === 'tr' ? mint.region_tr : mint.region_en;
      let tip = `<strong>${name}</strong>`;
      if (mint.name_ar) tip += ` <span style="font-family:'Amiri',serif">${mint.name_ar}</span>`;
      if (region) tip += `<br/>${region}`;
      if (mint.emission_count > 0) {
        tip += `<br/>🪙 ${mint.emission_count} ${t('darbiyat', 'emissions')}`;
        if (mint.metals_tr) tip += `<br/>${mint.metals_tr}`;
      } else {
        tip += `<br/><em style="opacity:0.6">${t('Gazetteer kaydı', 'Gazetteer entry')}</em>`;
      }
      if (mint.tier === 1) tip += `<br/>⭐ ${t('Çoklu kaynak doğrulamalı', 'Multi-source verified')}`;

      marker.bindTooltip(tip, {
        className: 'darp-tooltip',
        direction: 'top',
        offset: [0, -8],
      });

      marker.on('click', () => onSelect(mint));
      markersRef.current.addLayer(marker);
    });
  }, [mints, selectedMint, lang]);

  // Legend
  const legendItems = useMemo(() => [
    { color: METAL_COLORS.AU, label: t('Altın/Dinar', 'Gold/Dinar') },
    { color: METAL_COLORS.AR, label: t('Gümüş/Dirhem', 'Silver/Dirham') },
    { color: METAL_COLORS.AE, label: t('Bakır/Fels', 'Copper/Fals') },
    { color: '#888', label: t('Diğer/Bilinmiyor', 'Other/Unknown') },
  ], [lang]);

  return (
    <div className="darp-map-container">
      <div ref={mapRef} className="darp-map" />
      <div className="darp-map-legend">
        <div className="darp-legend-title">{t('Metal Türü', 'Metal Type')}</div>
        {legendItems.map(item => (
          <div key={item.color} className="darp-legend-item">
            <span className="darp-legend-dot" style={{ background: item.color }} />
            {item.label}
          </div>
        ))}
        <div className="darp-legend-note">
          {t('Boyut = darbiyat sayısı', 'Size = emission count')}
        </div>
      </div>
    </div>
  );
}
