import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { MAP_CONFIG, LAYER_KEYS } from '../../config/layers';
import { eraName } from '../../config/eras';
import { useAnalyticsMap, useFilterUniques } from '../../hooks/useEntityLookup';
import { useCausalIndex } from '../../hooks/useCausalLinks';
import { useLayers, useMapFilters } from '../../hooks/useFilters';
import FilterPanel from './FilterPanel';
import { renderLayers } from './LayerManager';
import TourMode from '../shared/TourMode';
import MapLegend from '../shared/MapLegend';
import YearInfoPanel from './YearInfoPanel';

export default function MapView({ lang, t, sidebarOpen, mapRef, onPopupOpen, onTourComplete, onCloseSidebar }) {
  const mapEl = useRef(null);
  const mapObj = useRef(null);
  const lgRef = useRef({});
  const [year, setYear] = useState(750);
  const [playing, setPlaying] = useState(false);
  const playRef = useRef(false);
  const [activeCount, setActiveCount] = useState(0);
  const [tourActive, setTourActive] = useState(false);

  const { layers, toggleLayer } = useLayers();
  const { filters, setFilter } = useMapFilters();
  const analyticsMap = useAnalyticsMap();
  const causalIdx = useCausalIndex();
  const uniques = useFilterUniques();

  /* Tour navigation callback — ref-based for guaranteed fresh mapObj */
  const handleTourNavigate = useCallback(({ lat, lon, zoom, year: yr }) => {
    const map = mapObj.current;
    if (map) {
      try {
        map.flyTo([lat, lon], zoom || 6, { duration: 1.5 });
      } catch (e) {
        // fallback if flyTo fails
        try { map.setView([lat, lon], zoom || 6); } catch (_) {}
      }
    }
    if (yr) setYear(yr);
  }, []);

  /* ── Init Leaflet ── */
  useEffect(() => {
    if (mapObj.current) return;
    const map = L.map(mapEl.current, {
      center: MAP_CONFIG.center, zoom: MAP_CONFIG.zoom,
      minZoom: MAP_CONFIG.minZoom, maxZoom: MAP_CONFIG.maxZoom,
      zoomControl: false, attributionControl: false
    });
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer(MAP_CONFIG.tileUrl, { maxZoom: 19, attribution: '&copy; CartoDB' }).addTo(map);
    mapObj.current = map;
    if (mapRef) mapRef.current = map;
    LAYER_KEYS.forEach(k => { lgRef.current[k] = L.layerGroup().addTo(map); });
    return () => { map.remove(); mapObj.current = null; };
  }, []);

  /* ── Play ── */
  useEffect(() => {
    playRef.current = playing;
    if (!playing) return;
    const iv = setInterval(() => {
      if (!playRef.current) { clearInterval(iv); return; }
      setYear(p => { if (p >= 1920) { setPlaying(false); return 1920; } return p + 2; });
    }, 80);
    return () => clearInterval(iv);
  }, [playing]);

  /* ── Render layers ── */
  useEffect(() => {
    if (!mapObj.current) return;
    const cnt = renderLayers({
      lg: lgRef.current, layers, filters, year, lang, t, analyticsMap, causalIdx, onPopupOpen
    });
    setActiveCount(cnt);
  }, [year, layers, filters, lang, t, analyticsMap, causalIdx, onPopupOpen]);

  return (
    <div className="map-layout">
      <FilterPanel
        lang={lang} t={t}
        layers={layers} toggleLayer={toggleLayer}
        filters={filters} setFilter={setFilter}
        uniques={uniques}
        activeCount={activeCount} year={year}
        sidebarOpen={sidebarOpen}
        onCloseMobile={onCloseSidebar}
      />
      <div className="map-area">
        <div ref={mapEl} className="map-canvas" />
        {/* Tour button */}
        <button className="tour-trigger" onClick={() => setTourActive(true)}
          aria-label={lang === 'tr' ? 'Rehberli turlar' : 'Guided tours'}>
          🗺 {lang === 'tr' ? 'Turlar' : 'Tours'}
        </button>
        {/* Tour overlay */}
        {tourActive && (
          <TourMode lang={lang} onNavigate={handleTourNavigate} onClose={() => setTourActive(false)} onTourComplete={onTourComplete} />
        )}
        {/* Legend */}
        <MapLegend lang={lang} />
        {/* Year Info Panel — hide when tour is active */}
        {!tourActive && (
          <YearInfoPanel year={year} lang={lang} onFlyTo={({ lat, lon, zoom }) => {
            if (mapObj.current) mapObj.current.flyTo([lat, lon], zoom || 6, { duration: 1.2 });
          }} />
        )}
        <div className="tbar">
          <div className="tbar-controls">
            <button className="tbar-step" onClick={() => setYear(y => Math.max(622, y - 10))} aria-label="-10 yıl">◀</button>
            <input
              type="number"
              className="tbar-year-input"
              min={622} max={1924}
              value={year}
              onChange={e => { const v = +e.target.value; if (v >= 622 && v <= 1924) setYear(v); }}
              aria-label={lang === 'tr' ? 'Yıl gir' : 'Enter year'}
            />
            <button className="tbar-step" onClick={() => setYear(y => Math.min(1924, y + 10))} aria-label="+10 yıl">▶</button>
          </div>
          <div className="tbar-era">{eraName(year, lang)}</div>
          <input type="range" className="tbar-range" min={622} max={1924} value={year} step={1}
            onChange={e => setYear(+e.target.value)}
            aria-label={lang === 'tr' ? 'Zaman kaydırıcısı' : 'Time slider'}
            aria-valuemin={622} aria-valuemax={1924} aria-valuenow={year} />
          <div className="tbar-ticks">
            {['622', '750', '900', '1055', '1258', '1453', '1600', '1800', '1924'].map(y => <span key={y}>{y}</span>)}
          </div>
          <button className="tbar-play" onClick={() => setPlaying(p => !p)}>
            {playing ? '⏸' : '▶'}
          </button>
        </div>
      </div>
    </div>
  );
}
