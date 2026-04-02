/**
 * EvliyaView.jsx — Ana container (state, routing, lazy-loading)
 * islamicatlas.org — Evliyâ Çelebi Seyahatnâme Katmanı
 * v8.0.0.0 — improved
 */
import React, { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import EvliyaMap from './EvliyaMap';
import EvliyaSidebar from './EvliyaSidebar';
import EvliyaDetail from './EvliyaDetail';
import VoyageTimeline from './VoyageTimeline';
import { normalizeTurkish, getLabels } from './constants';
import './evliya.css';

const EvliyaDashboard = lazy(() => import('./EvliyaDashboard'));

const EVLIYA_DATA_URL = '/data/evliya_atlas_layer.json';
const SEARCH_DEBOUNCE_MS = 250;

/**
 * Normalize raw JSON to the shape components expect.
 * Raw:  { voyages[], places[] }  with name_tr, year_start, lng, description_tr, cross_refs
 * Norm: { travel_voyages[], travel_stops[] } with title_tr, start_year, lon, narr_tr, xref, tr/en/ar
 */
function normalizeData(raw) {
  const travel_voyages = (raw.voyages || raw.travel_voyages || []).map(v => ({
    ...v,
    // Ensure canonical field names
    title_tr: v.title_tr || v.name_tr || '',
    title_en: v.title_en || v.name_en || '',
    title_ar: v.title_ar || v.name_ar || '',
    start_year: v.start_year ?? v.year_start,
    end_year: v.end_year ?? v.year_end,
  }));

  const travel_stops = (raw.places || raw.travel_stops || []).map(p => ({
    ...p,
    // Short name aliases (tr/en/ar)
    tr: p.tr || p.name_tr || '',
    en: p.en || p.name_en || '',
    ar: p.ar || p.name_ar || '',
    // Coordinate normalization (lng → lon)
    lat: p.lat,
    lon: p.lon ?? p.lng,
    // Narrative aliases
    narr_tr: p.narr_tr || p.description_tr || '',
    narr_en: p.narr_en || p.description_en || '',
    narr_ar: p.narr_ar || p.description_ar || '',
    // Cross-ref alias
    xref: p.xref || p.cross_refs || {},
  }));

  return {
    metadata: raw.metadata || {},
    travelers: raw.travelers || [],
    travel_voyages,
    travel_stops,
  };
}

/**
 * @param {string} lang - Active language ('tr'|'en'|'ar')
 * @param {Object} ibnBattutaData - İbn Battûta layer data for cross-linking (optional)
 * @param {Function} onNavigateToIbnBattuta - Callback to navigate to İbn Battûta view (optional)
 */
export default function EvliyaView({
  lang = 'tr',
  ibnBattutaData = null,
  onNavigateToIbnBattuta = null,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedVoyages, setSelectedVoyages] = useState(new Set());
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [selectedXrefLayers, setSelectedXrefLayers] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // UI state
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDashboard, setShowDashboard] = useState(false);

  const l = getLabels(lang);

  // ── Search debounce ──
  const debounceTimer = useRef(null);
  const handleSearchChange = useCallback((q) => {
    setSearchQuery(q);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(q), SEARCH_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => clearTimeout(debounceTimer.current);
  }, []);

  // ── Data Loading ──
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(EVLIYA_DATA_URL, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(raw => {
        const d = normalizeData(raw);
        setData(d);
        setSelectedVoyages(new Set(d.travel_voyages.map(v => v.id)));
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Evliya data load error:', err);
          setError(err.message);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  // ── Pre-computed search index (normalized text per stop) ──
  const searchIndex = useMemo(() => {
    if (!data) return null;
    return data.travel_stops.map(s => {
      const parts = [s.tr, s.en, s.ar, s.narr_tr].filter(Boolean);
      return normalizeTurkish(parts.join(' '));
    });
  }, [data]);

  // ── Derived Data ──
  const voyageMap = useMemo(() => {
    if (!data) return {};
    return Object.fromEntries(data.travel_voyages.map(v => [v.id, v]));
  }, [data]);

  const categories = useMemo(() => {
    if (!data) return [];
    const counts = {};
    data.travel_stops.forEach(s => {
      const c = s.category || 'bilinmeyen';
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [data]);

  const xrefLayers = useMemo(() => {
    if (!data) return [];
    const layerCounts = {};
    data.travel_stops.forEach(s => {
      if (s.xref) {
        Object.keys(s.xref).forEach(k => {
          layerCounts[k] = (layerCounts[k] || 0) + 1;
        });
      }
    });
    return Object.entries(layerCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [data]);

  // ── Filtering (uses debounced query + pre-computed index) ──
  const filteredPlaces = useMemo(() => {
    if (!data) return [];
    return data.travel_stops.filter((p, i) => {
      if (selectedVoyages.size > 0 && !selectedVoyages.has(p.voyage_id)) return false;
      if (selectedCategories.size > 0 && !selectedCategories.has(p.category)) return false;

      if (selectedXrefLayers.size > 0) {
        const pXrefs = p.xref ? Object.keys(p.xref) : [];
        if (!pXrefs.some(k => selectedXrefLayers.has(k))) return false;
      }

      if (debouncedQuery && searchIndex) {
        const q = normalizeTurkish(debouncedQuery);
        if (!searchIndex[i].includes(q)) return false;
      }

      return true;
    });
  }, [data, selectedVoyages, selectedCategories, selectedXrefLayers, debouncedQuery, searchIndex]);

  // ── İbn Battûta Cross-link Index ──
  const ibnBattutaIndex = useMemo(() => {
    if (!ibnBattutaData?.travel_stops) return {};
    const idx = {};
    ibnBattutaData.travel_stops.forEach(s => {
      const key = (s.tr || s.name_tr || s.en || '').toLowerCase().trim();
      if (key) idx[key] = s;
    });
    return idx;
  }, [ibnBattutaData]);

  // ── Handlers ──
  const handleVoyageToggle = useCallback((voyageId) => {
    setSelectedVoyages(prev => {
      const next = new Set(prev);
      if (next.has(voyageId)) next.delete(voyageId);
      else next.add(voyageId);
      return next;
    });
  }, []);

  const handleCategoryToggle = useCallback((cat) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const handleXrefLayerToggle = useCallback((layer) => {
    setSelectedXrefLayers(prev => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!data) return;
    setSelectedVoyages(new Set(data.travel_voyages.map(v => v.id)));
    setSelectedCategories(new Set());
    setSelectedXrefLayers(new Set());
    setSearchQuery('');
    setDebouncedQuery('');
  }, [data]);

  const handleNavigateToIbnBattuta = useCallback((stopName) => {
    if (onNavigateToIbnBattuta) {
      const match = ibnBattutaIndex[stopName.toLowerCase().trim()];
      if (match) onNavigateToIbnBattuta(match);
    }
  }, [onNavigateToIbnBattuta, ibnBattutaIndex]);

  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);
  const handleToggleSidebar = useCallback(() => setSidebarOpen(o => !o), []);
  const handleShowDashboard = useCallback(() => setShowDashboard(true), []);
  const handleCloseDashboard = useCallback(() => setShowDashboard(false), []);
  const handleCloseDetail = useCallback(() => setSelectedPlace(null), []);

  // ── Render ──
  const isRtl = lang === 'ar';

  if (loading) {
    return (
      <div className="evliya-loading" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="evliya-loading-spinner" />
        <span>{l.loading}</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="evliya-error" dir={isRtl ? 'rtl' : 'ltr'}>
        <span>⚠️ {l.loadError}{error ? `: ${error}` : ''}</span>
        <button onClick={() => window.location.reload()}>{l.retry}</button>
      </div>
    );
  }

  if (showDashboard) {
    return (
      <Suspense fallback={<div className="evliya-loading"><div className="evliya-loading-spinner" /></div>}>
        <EvliyaDashboard
          data={data}
          lang={lang}
          onClose={handleCloseDashboard}
        />
      </Suspense>
    );
  }

  return (
    <div className="evliya-container" dir={isRtl ? 'rtl' : 'ltr'}>
      <VoyageTimeline
        voyages={data.travel_voyages}
        selectedVoyages={selectedVoyages}
        onToggle={handleVoyageToggle}
        lang={lang}
      />

      <div className="evliya-main">
        {sidebarOpen && (
          <>
            <div className="evliya-sidebar-backdrop" onClick={handleCloseSidebar} />
            <EvliyaSidebar
              voyages={data.travel_voyages}
              categories={categories}
              xrefLayers={xrefLayers}
              selectedVoyages={selectedVoyages}
              selectedCategories={selectedCategories}
              selectedXrefLayers={selectedXrefLayers}
              onVoyageToggle={handleVoyageToggle}
              onCategoryToggle={handleCategoryToggle}
              onXrefLayerToggle={handleXrefLayerToggle}
              onSelectAll={handleSelectAll}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              totalPlaces={data.travel_stops.length}
              filteredCount={filteredPlaces.length}
              lang={lang}
              onClose={handleCloseSidebar}
              onShowDashboard={handleShowDashboard}
            />
          </>
        )}

        <EvliyaMap
          places={filteredPlaces}
          voyageMap={voyageMap}
          selectedPlace={selectedPlace}
          onSelectPlace={setSelectedPlace}
          lang={lang}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          totalPlaces={data.travel_stops.length}
        />

        {selectedPlace && (
          <EvliyaDetail
            place={selectedPlace}
            voyage={voyageMap[selectedPlace.voyage_id]}
            lang={lang}
            onClose={handleCloseDetail}
            ibnBattutaMatch={ibnBattutaIndex[(selectedPlace.tr || '').toLowerCase().trim()] || null}
            onNavigateToIbnBattuta={handleNavigateToIbnBattuta}
          />
        )}
      </div>
    </div>
  );
}
