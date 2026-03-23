import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { MAP_CONFIG, LAYER_KEYS } from '../../config/layers';
import { eraName } from '../../config/eras';
import { useAnalyticsMap, useFilterUniques } from '../../hooks/useEntityLookup';
import { useCausalIndex } from '../../hooks/useCausalLinks';
import { useLayers, useMapFilters, useYearRange } from '../../hooks/useFilters';
import FilterPanel from './FilterPanel';
import { renderLayers } from './LayerManager';
import TourMode from '../shared/TourMode';
import MapLegend from '../shared/MapLegend';
import YearInfoPanel from './YearInfoPanel';
import HeatmapLayer from './HeatmapLayer';
import YearExplorer from './YearExplorer';
import ScholarMigrationMap from './ScholarMigrationMap';
import BottomSheet from '../shared/BottomSheet';
import DB from '../../data/db.json';

/* Map from singular entity type → db.json collection key */
const ENTITY_COLLECTION = {
  dynasty: 'dynasties', battle: 'battles', scholar: 'scholars',
  monument: 'monuments', city: 'cities', waqf: 'waqfs',
  event: 'events', ruler: 'rulers', madrasa: 'madrasas',
};

export default function MapView({ lang, t, sidebarOpen, mapRef, onPopupOpen, onTourComplete, onCloseSidebar, entityRoute, onEntityRouteConsumed }) {
  const mapEl = useRef(null);
  const mapObj = useRef(null);
  const lgRef = useRef({});
  const [year, setYear] = useState(750);
  const [playing, setPlaying] = useState(false);
  const playRef = useRef(false);
  const [activeCount, setActiveCount] = useState(0);
  const [tourActive, setTourActive] = useState(false);
  const [heatmapVisible, setHeatmapVisible] = useState(false);
  const [yearExplorerOpen, setYearExplorerOpen] = useState(false);
  const [migrationVisible, setMigrationVisible] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const { layers, toggleLayer, soloLayer, showAllLayers, isSolo } = useLayers();
  const { filters, setFilter, resetFilters } = useMapFilters();
  const { yearRange, setMin, setMax, resetRange } = useYearRange();
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

    /* ── Theme-aware tile layer (B3) ── */
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const tileUrl = currentTheme === 'light' ? MAP_CONFIG.tileUrlLight : MAP_CONFIG.tileUrl;
    const tileLayer = L.tileLayer(tileUrl, { maxZoom: 19, attribution: '&copy; CartoDB' }).addTo(map);

    /* Listen for theme changes and swap tile layer */
    const onThemeChange = (e) => {
      const newTheme = e.detail?.theme || 'dark';
      const newUrl = newTheme === 'light' ? MAP_CONFIG.tileUrlLight : MAP_CONFIG.tileUrl;
      tileLayer.setUrl(newUrl);
    };
    window.addEventListener('themechange', onThemeChange);

    mapObj.current = map;
    if (mapRef) mapRef.current = map;
    LAYER_KEYS.forEach(k => { lgRef.current[k] = L.layerGroup().addTo(map); });
    return () => { map.remove(); mapObj.current = null; window.removeEventListener('themechange', onThemeChange); };
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
      lg: lgRef.current, layers, filters, year, yearRange, lang, t, analyticsMap, causalIdx, onPopupOpen
    });
    setActiveCount(cnt);
  }, [year, layers, filters, yearRange, lang, t, analyticsMap, causalIdx, onPopupOpen]);

  /* ── Entity deep link handler ── */
  useEffect(() => {
    if (!entityRoute || !mapObj.current) return;
    const { type, id } = entityRoute;

    // Year deep link → open YearExplorer
    if (type === 'year') {
      const yr = typeof id === 'number' ? id : parseInt(id, 10);
      if (!isNaN(yr) && yr >= 622 && yr <= 1924) {
        setYear(yr);
        setYearExplorerOpen(true);
      }
      onEntityRouteConsumed?.();
      return;
    }

    // Entity deep link → fly to entity location
    const colKey = ENTITY_COLLECTION[type];
    if (!colKey || !DB[colKey]) { onEntityRouteConsumed?.(); return; }
    const numId = typeof id === 'number' ? id : parseInt(id, 10);
    const entity = DB[colKey].find(e => e.id === numId);
    if (entity && entity.lat != null && entity.lon != null) {
      const map = mapObj.current;
      try { map.flyTo([entity.lat, entity.lon], 8, { duration: 1.5 }); } catch {}
      // Open a popup with entity name
      const name = entity.tr || entity.n || entity.en || `#${entity.id}`;
      setTimeout(() => {
        try {
          L.popup({ closeOnClick: true, autoPan: true })
            .setLatLng([entity.lat, entity.lon])
            .setContent(`<div style="font-size:14px;font-weight:600">${name}</div><div style="font-size:11px;color:#a89b8c">${type} #${numId}</div>`)
            .openOn(map);
        } catch {}
      }, 1600);
    }
    onEntityRouteConsumed?.();
  }, [entityRoute, onEntityRouteConsumed]);

  /* ── Shared FilterPanel props ── */
  const filterProps = {
    lang, t,
    layers, toggleLayer, soloLayer, showAllLayers, isSolo,
    filters, setFilter, resetFilters,
    uniques, activeCount, year,
    yearRange, setMin, setMax, resetRange,
  };

  return (
    <div className="map-layout">
      {/* Desktop: sidebar filter panel */}
      {!isMobile && (
        <FilterPanel
          {...filterProps}
          sidebarOpen={sidebarOpen}
          onCloseMobile={onCloseSidebar}
        />
      )}

      {/* Mobile: FAB + BottomSheet filter */}
      {isMobile && (
        <>
          <button
            className="map-filter-fab"
            onClick={() => setFilterSheetOpen(true)}
            aria-label={{ tr: 'Filtreler', en: 'Filters', ar: 'المرشحات' }[lang]}
          >
            ☰
          </button>
          <BottomSheet
            open={filterSheetOpen}
            onClose={() => setFilterSheetOpen(false)}
            title={{ tr: 'Harita Kontrolleri', en: 'Map Controls', ar: 'أدوات التحكم' }[lang]}
            className="map-filter-sheet"
          >
            <FilterPanel
              {...filterProps}
              sidebarOpen={true}
              onCloseMobile={() => setFilterSheetOpen(false)}
              inBottomSheet
            />
          </BottomSheet>
        </>
      )}
      <div className="map-area">
        <div ref={mapEl} className="map-canvas" />

        {/* ── Heatmap toggle ── */}
        <button
          className="heatmap-toggle"
          onClick={() => setHeatmapVisible(p => !p)}
          style={{
            position: 'absolute', top: 12, right: 60, zIndex: 1000,
            background: heatmapVisible ? 'rgba(201,168,76,0.25)' : 'rgba(18,18,24,0.85)',
            border: `1px solid ${heatmapVisible ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.1)'}`,
            color: heatmapVisible ? '#c9a84c' : '#a89b8c',
            padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
            backdropFilter: 'blur(6px)', transition: 'all 0.2s',
          }}
        >
          🔥 {lang === 'ar' ? 'خريطة الكثافة' : lang === 'en' ? 'Heatmap' : 'Yoğunluk'}
        </button>

        {/* ── Year Explorer trigger ── */}
        <button
          className="year-explorer-trigger"
          onClick={() => setYearExplorerOpen(true)}
          style={{
            position: 'absolute', top: 12, right: 170, zIndex: 1000,
            background: 'rgba(18,18,24,0.85)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#a89b8c', padding: '6px 10px', borderRadius: 8,
            cursor: 'pointer', fontSize: 12,
            backdropFilter: 'blur(6px)', transition: 'all 0.2s',
          }}
        >
          📅 {lang === 'ar' ? 'ماذا حدث؟' : lang === 'en' ? 'This Year' : 'Bu Yıl'}
        </button>

        {/* ── Scholar Migration toggle ── */}
        <button
          className="migration-toggle"
          onClick={() => setMigrationVisible(p => !p)}
          style={{
            position: 'absolute', top: 12, right: 280, zIndex: 1000,
            background: migrationVisible ? 'rgba(74,222,128,0.2)' : 'rgba(18,18,24,0.85)',
            border: `1px solid ${migrationVisible ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: migrationVisible ? '#4ade80' : '#a89b8c',
            padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
            backdropFilter: 'blur(6px)', transition: 'all 0.2s',
          }}
        >
          🧭 {lang === 'ar' ? 'هجرة العلماء' : lang === 'en' ? 'Migration' : 'Göç'}
        </button>

        {/* ── Heatmap canvas layer ── */}
        {heatmapVisible && (
          <HeatmapLayer map={mapObj.current} lang={lang} visible={heatmapVisible} />
        )}

        {/* ── Scholar Migration layer ── */}
        {migrationVisible && (
          <ScholarMigrationMap map={mapObj.current} lang={lang} visible={migrationVisible} />
        )}

        {/* ── Year Explorer modal ── */}
        {yearExplorerOpen && (
          <YearExplorer
            lang={lang}
            onFlyTo={({ lat, lon, zoom }) => {
              setYearExplorerOpen(false);
              if (mapObj.current) mapObj.current.flyTo([lat, lon], zoom || 6, { duration: 1.2 });
            }}
            onClose={() => setYearExplorerOpen(false)}
          />
        )}

        {/* Tour button */}
        <button className="tour-trigger" onClick={() => setTourActive(true)}
          aria-label={t.map.tourLabel}>
          🗺 {t.map.tours}
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
            <button className="tbar-step" onClick={() => setYear(y => Math.max(622, y - 10))} aria-label={t.map.back10}>◀</button>
            <input
              type="number"
              className="tbar-year-input"
              min={622} max={1924}
              value={year}
              onChange={e => { const v = +e.target.value; if (v >= 622 && v <= 1924) setYear(v); }}
              aria-label={t.map.enterYear}
            />
            <button className="tbar-step" onClick={() => setYear(y => Math.min(1924, y + 10))} aria-label={t.map.fwd10}>▶</button>
          </div>
          <div className="tbar-era">{eraName(year, lang)}</div>
          <input type="range" className="tbar-range" min={622} max={1924} value={year} step={1}
            onChange={e => setYear(+e.target.value)}
            aria-label={t.map.slider}
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
