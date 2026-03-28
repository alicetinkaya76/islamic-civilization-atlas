import { useState, useEffect, useMemo } from 'react';
import CITY_ATLAS_REGISTRY from '../../data/cityAtlasRegistry';
import CityAtlasMap from './CityAtlasMap';
import CityAtlasSidebar from './CityAtlasSidebar';
import CityAtlasDetail from './CityAtlasDetail';
import CityAtlasLegend from './CityAtlasLegend';
import './cityAtlas.css';

export default function CityAtlasView({ lang: propLang, onClose }) {
  // ── City selection ──
  const [selectedCityId, setSelectedCityId] = useState(CITY_ATLAS_REGISTRY[0].id);

  // ── Language: prop → localStorage → default 'tr' ──
  const [lang, setLang] = useState(
    propLang || localStorage.getItem('atlas-lang') || 'tr'
  );
  useEffect(() => { if (propLang) setLang(propLang); }, [propLang]);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filters, setFilters] = useState({
    categories: [],
    periods: [],
    status: 'all',
    search: '',
  });

  const city = CITY_ATLAS_REGISTRY.find((c) => c.id === selectedCityId);

  // ── Load data when city changes ──
  useEffect(() => {
    if (!city) {
      setError(`City "${selectedCityId}" not found in registry`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedRecord(null);
    setFilters({ categories: [], periods: [], status: 'all', search: '' });

    fetch(city.dataFile)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((d) => {
        // Handle both flat array and {records:[...]} formats
        const records = Array.isArray(d) ? d : (d.records || []);
        setData(records);
        setLoading(false);
      })
      .catch((e) => {
        console.error('CityAtlas load error:', e);
        setError(e.message);
        setLoading(false);
      });
  }, [selectedCityId]);

  // ── Filter logic ──
  const filtered = useMemo(() => {
    return data.filter((r) => {
      // Category
      if (filters.categories.length > 0 && !filters.categories.includes(r.category)) {
        return false;
      }
      // Period
      if (filters.periods.length > 0 && !filters.periods.includes(r.period)) {
        return false;
      }
      // Status
      if (filters.status !== 'all' && r.current_status !== filters.status) {
        return false;
      }
      // Search
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const searchable = [
          r.name_tr, r.name_en, r.name_ar, r.name_original,
          r.konyali_notes, r.source_excerpt_ar,
          r.location?.mahalle, r.location?.description_tr,
          r.patron?.name, ...(r.alternative_names || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [data, filters]);

  // ── Name helpers ──
  const getName = (r) =>
    lang === 'en' ? (r.name_en || r.name_tr) :
    lang === 'ar' ? (r.name_ar || r.name_tr) :
    r.name_tr;

  const getCat = (r) => {
    const cfg = city?.categories?.[r.category];
    if (cfg) return cfg[`label_${lang}`] || cfg.label_en || r.category;
    return lang === 'en' ? (r.category_en || r.category) :
           lang === 'ar' ? (r.category_ar || r.category) :
           (r.category_tr || r.category);
  };

  // ── Active categories (for legend) ──
  const activeCats = useMemo(() => {
    const s = new Set();
    filtered.forEach((r) => s.add(r.category));
    return s;
  }, [filtered]);

  // ── Language switcher ──
  const cycleLang = () => {
    const next = lang === 'tr' ? 'en' : lang === 'en' ? 'ar' : 'tr';
    setLang(next);
    localStorage.setItem('atlas-lang', next);
  };

  // ── City switcher ──
  const handleCityChange = (cityId) => {
    if (cityId !== selectedCityId) {
      setSelectedCityId(cityId);
    }
  };

  // ── Error state ──
  if (error) {
    return (
      <div className="ca-loading" style={{ flexDirection: 'column', gap: 12 }}>
        <span style={{ color: '#C62828' }}>⚠️ {error}</span>
        <button onClick={onClose} style={{ color: '#FFD700', background: 'none', border: '1px solid #FFD700', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
          ← {lang === 'en' ? 'Back' : 'Geri'}
        </button>
      </div>
    );
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="ca-loading">
        {city?.icon} {lang === 'en' ? city?.name_en : lang === 'ar' ? city?.name_ar : city?.name_tr}
      </div>
    );
  }

  return (
    <div className="city-atlas" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* ── Header ── */}
      <header className="ca-header">
        <div className="ca-header-left">
          {/* City Picker Tabs */}
          {CITY_ATLAS_REGISTRY.length > 1 && (
            <div className="ca-city-tabs">
              {CITY_ATLAS_REGISTRY.map((c) => (
                <button
                  key={c.id}
                  className={`ca-city-tab ${selectedCityId === c.id ? 'active' : ''}`}
                  style={{ '--city-color': c.color }}
                  onClick={() => handleCityChange(c.id)}
                >
                  <span className="ca-city-tab-icon">{c.icon}</span>
                  <span className="ca-city-tab-name">
                    {lang === 'en' ? c.name_en.replace(' City Atlas', '') :
                     lang === 'ar' ? c.name_ar.replace('أطلس مدينة ', '') :
                     c.name_tr.replace(' Şehir Atlası', '')}
                  </span>
                  <span className="ca-city-tab-badge">{c.recordCount}</span>
                </button>
              ))}
            </div>
          )}
          <span className="ca-subtitle">
            {lang === 'en' ? city.subtitle_en : lang === 'ar' ? city.subtitle_ar : city.subtitle_tr}
          </span>
        </div>
        <div className="ca-header-right">
          <span className="ca-count">
            {filtered.length} / {data.length}
          </span>
          <button
            className="ca-close"
            onClick={cycleLang}
            title="Switch language"
            style={{ fontSize: '0.75rem', fontWeight: 600 }}
          >
            {lang.toUpperCase()}
          </button>
          <button
            className="ca-close"
            onClick={onClose}
            title={lang === 'en' ? 'Back to atlas' : 'Atlasa dön'}
          >
            ✕
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="ca-body">
        <CityAtlasSidebar
          data={data}
          filtered={filtered}
          filters={filters}
          setFilters={setFilters}
          city={city}
          lang={lang}
          getName={getName}
          getCat={getCat}
          onSelect={setSelectedRecord}
          selectedId={selectedRecord?.id}
        />

        <CityAtlasMap
          records={filtered}
          city={city}
          lang={lang}
          getName={getName}
          getCat={getCat}
          selected={selectedRecord}
          onSelect={setSelectedRecord}
        />

        <CityAtlasLegend city={city} lang={lang} activeCats={activeCats} />

        {selectedRecord && (
          <CityAtlasDetail
            record={selectedRecord}
            city={city}
            lang={lang}
            getName={getName}
            getCat={getCat}
            onClose={() => setSelectedRecord(null)}
          />
        )}
      </div>
    </div>
  );
}
