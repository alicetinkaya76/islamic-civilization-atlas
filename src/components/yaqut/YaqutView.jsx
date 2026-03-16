import { useState, useMemo, useCallback, useEffect, Component } from 'react';
import YAQUT_LITE from '../../data/yaqut_lite.json';
import YaqutSidebar from './YaqutSidebar';
import YaqutMap from './YaqutMap';
import YaqutIdCard from './YaqutIdCard';
import YaqutAnalytics from './YaqutAnalytics';
import YaqutStatsPanel from './YaqutStatsPanel';
import { PlaceGraph, PersonPlaceNetwork, GeoHeatmap } from './YaqutAdvanced';
import '../../styles/yaqut.css';
import T from '../../data/i18n';

/* ═══ Error Boundary ═══ */
class YaqutErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('YaqutView error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#c4b89a' }}>
          <h3>⚠️ {T[this.props.lang].yaqut.errorOccurred}</h3>
          <p style={{ color: '#ef5350', fontSize: 12, fontFamily: 'monospace' }}>{String(this.state.error)}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 16, padding: '8px 16px', background: '#1a6b5a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            {T[this.props.lang].yaqut.retry}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ═══ Precompute lookup maps ═══ */
const YAQUT_BY_ID = {};
YAQUT_LITE.forEach(e => { YAQUT_BY_ID[e.id] = e; });

/* ═══ Extract unique geo types (top 20) ═══ */
function extractTopGeoTypes() {
  const counts = {};
  YAQUT_LITE.forEach(e => {
    if (e.gt) counts[e.gt] = (counts[e.gt] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([k]) => k);
}

/* ═══ Extract unique countries ═══ */
function extractCountries() {
  const counts = {};
  YAQUT_LITE.forEach(e => {
    if (e.ct) counts[e.ct] = (counts[e.ct] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([k]) => k);
}

/* ═══ Extract unique letters (Arabic alphabet order) ═══ */
const ARABIC_ALPHA_ORDER = 'أبتثجحخدذرزسشصضطظعغفقكلمنوهي'.split('');
function extractLetters() {
  const present = new Set();
  YAQUT_LITE.forEach(e => { if (e.lt) present.add(e.lt); });
  // Return in Arabic alphabet order, only letters that exist in data
  return ARABIC_ALPHA_ORDER.filter(l => present.has(l));
}

/* ═══ Extract unique tags (top 20) ═══ */
function extractTopTags() {
  const counts = {};
  YAQUT_LITE.forEach(e => {
    if (e.tg) e.tg.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([k]) => k);
}

const TOP_GEO_TYPES = extractTopGeoTypes();
const ALL_COUNTRIES = extractCountries();
const ALL_LETTERS = extractLetters();
const TOP_TAGS = extractTopTags();
const PERIODS = ['active', 'ruined', 'legendary'];

/* ═══ Turkish + Arabic tolerant normalize ═══ */
const normalize = (s) =>
  (s || '').toLowerCase()
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
    .replace(/[āáà]/g, 'a').replace(/[ūú]/g, 'u').replace(/[īíì]/g, 'i')
    .replace(/[ḥḫ]/g, 'h').replace(/ṣ/g, 's').replace(/ṭ/g, 't')
    .replace(/ḍ/g, 'd').replace(/ẓ/g, 'z').replace(/ʿ|ʾ|'/g, '')
    .replace(/[\u0610-\u065f\u0670]/g, '') // Arabic diacritics
    .replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/أ|إ|آ/g, 'ا');

/* ═══ Stats ═══ */
const STATS = {
  total: YAQUT_LITE.length,
  geocoded: YAQUT_LITE.filter(e => e.lat != null).length,
  withDia: YAQUT_LITE.filter(e => e.ds).length,
  withPersons: YAQUT_LITE.filter(e => e.np > 0 || e.pc > 0).length,
  withEvents: YAQUT_LITE.filter(e => e.ec > 0).length,
};

function YaqutViewInner({ lang, t }) {
  const ty = t.yaqut || {};

  /* ═══ State ═══ */
  const [search, setSearch] = useState('');
  const [selectedGeoTypes, setSelectedGeoTypes] = useState(new Set());
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [crossRefRange, setCrossRefRange] = useState(''); // '', '0', '1-10', '10-50', '50+'
  const [selectedId, setSelectedId] = useState(null);
  const [subView, setSubView] = useState('map'); // 'map' | 'analytics'
  const [analyticsTab, setAnalyticsTab] = useState('charts'); // 'charts' | 'graph' | 'network' | 'heatmap'
  const [detailData, setDetailData] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [showMobile, setShowMobile] = useState('list'); // 'list' | 'map' | 'card'

  /* ═══ Filter entries ═══ */
  const filtered = useMemo(() => {
    let arr = YAQUT_LITE;

    // Geo type
    if (selectedGeoTypes.size > 0) {
      arr = arr.filter(e => selectedGeoTypes.has(e.gt));
    }

    // Country
    if (selectedCountry) {
      arr = arr.filter(e => e.ct === selectedCountry);
    }

    // Letter
    if (selectedLetter) {
      arr = arr.filter(e => e.lt === selectedLetter);
    }

    // Period
    if (selectedPeriod) {
      arr = arr.filter(e => e.hp === selectedPeriod);
    }

    // Tags
    if (selectedTags.size > 0) {
      arr = arr.filter(e => {
        if (!e.tg) return false;
        return e.tg.some(t => selectedTags.has(t));
      });
    }

    // Cross-ref range
    if (crossRefRange) {
      arr = arr.filter(e => {
        const pc = e.pc || 0;
        if (crossRefRange === '0') return pc === 0;
        if (crossRefRange === '1-10') return pc >= 1 && pc <= 10;
        if (crossRefRange === '10-50') return pc > 10 && pc <= 50;
        if (crossRefRange === '50+') return pc > 50;
        return true;
      });
    }

    // Search
    if (search && search.length >= 2) {
      const q = normalize(search);
      arr = arr.filter(e =>
        normalize(e.h).includes(q) ||
        normalize(e.ht).includes(q) ||
        normalize(e.he).includes(q) ||
        normalize(e.st).includes(q) ||
        normalize(e.se).includes(q) ||
        (e.an && e.an.some(a => normalize(a).includes(q)))
      );
    }

    return arr;
  }, [search, selectedGeoTypes, selectedCountry, selectedLetter, selectedPeriod, selectedTags, crossRefRange]);

  /* ═══ Geocoded subset for map ═══ */
  const geocoded = useMemo(() => filtered.filter(e => e.lat != null), [filtered]);

  /* ═══ Load detail data on selection ═══ */
  const loadDetail = useCallback(async (id) => {
    const sid = String(id);
    if (detailCache[sid]) {
      setDetailData(detailCache[sid]);
      return;
    }
    try {
      const base = import.meta.env.BASE_URL || '/';
      const resp = await fetch(`${base}yaqut_detail.json`);
      if (resp.ok) {
        const all = await resp.json();
        setDetailCache(all);
        setDetailData(all[sid] || null);
      }
    } catch (e) {
      console.warn('Failed to load yaqut detail:', e);
      setDetailData(null);
    }
  }, [detailCache]);

  /* ═══ Select entry ═══ */
  const handleSelect = useCallback((id) => {
    setSelectedId(id);
    loadDetail(id);
    // Only switch to card view on mobile (< 900px)
    if (window.innerWidth <= 900) {
      setShowMobile('card');
    }
  }, [loadDetail]);

  /* Selected entry object */
  const selectedEntry = selectedId ? YAQUT_BY_ID[selectedId] : null;

  return (
    <div className="yaqut-view">
      {/* Header bar */}
      <div className="yaqut-header">
        <div className="yaqut-header-info">
          <h2 className="yaqut-title">{ty.title}</h2>
          <span className="yaqut-subtitle">{ty.sub}</span>
        </div>
        <div className="yaqut-header-stats">
          <span className="yaqut-stat"><strong>{STATS.total.toLocaleString()}</strong> {ty.totalEntries}</span>
          <span className="yaqut-stat-sep">·</span>
          <span className="yaqut-stat"><strong>{STATS.geocoded.toLocaleString()}</strong> {ty.geocoded}</span>
          <span className="yaqut-stat-sep">·</span>
          <span className="yaqut-stat"><strong>{STATS.withDia.toLocaleString()}</strong> {ty.withDia}</span>
        </div>
        <div className="yaqut-view-toggle">
          <button className={`scholar-view-btn${subView === 'map' ? ' active' : ''}`}
            onClick={() => setSubView('map')}>🗺 {ty.mapView}</button>
          <button className={`scholar-view-btn${subView === 'analytics' ? ' active' : ''}`}
            onClick={() => setSubView('analytics')}>📊 {ty.analyticsView}</button>
        </div>
      </div>

      {/* Mobile toggle */}
      <div className="yaqut-mobile-toggle">
        <button className={showMobile === 'list' ? 'active' : ''} onClick={() => setShowMobile('list')}>
          ☰ {t.yaqut.tabList}
        </button>
        <button className={showMobile === 'map' ? 'active' : ''} onClick={() => setShowMobile('map')}>
          🗺 {ty.mapView}
        </button>
        {selectedEntry && (
          <button className={showMobile === 'card' ? 'active' : ''} onClick={() => setShowMobile('card')}>
            📋 {t.yaqut.tabDetail}
          </button>
        )}
      </div>

      {subView === 'map' ? (
        <div className="yaqut-body">
          {/* Left sidebar */}
          <div className={`yaqut-sidebar${showMobile === 'list' ? ' mobile-visible' : ''}`}>
            <YaqutSidebar
              lang={lang} ty={ty}
              filtered={filtered}
              search={search} setSearch={setSearch}
              selectedGeoTypes={selectedGeoTypes} setSelectedGeoTypes={setSelectedGeoTypes}
              selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry}
              selectedLetter={selectedLetter} setSelectedLetter={setSelectedLetter}
              selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod}
              selectedTags={selectedTags} setSelectedTags={setSelectedTags}
              crossRefRange={crossRefRange} setCrossRefRange={setCrossRefRange}
              selectedId={selectedId} onSelect={handleSelect}
              topGeoTypes={TOP_GEO_TYPES}
              allCountries={ALL_COUNTRIES}
              allLetters={ALL_LETTERS}
              topTags={TOP_TAGS}
              periods={PERIODS}
            />
          </div>

          {/* Center map */}
          <div className={`yaqut-map-area${showMobile === 'map' ? ' mobile-visible' : ''}`}>
            <YaqutMap
              lang={lang} ty={ty}
              data={geocoded}
              selectedId={selectedId}
              selectedEntry={selectedEntry}
              detailData={detailData}
              onSelect={handleSelect}
              filtered={filtered}
            />
          </div>

          {/* Right detail card */}
          <div className={`yaqut-card-area${showMobile === 'card' ? ' mobile-visible' : ''}${selectedEntry ? ' has-selection' : ''}`}>
            <YaqutIdCard
              lang={lang} ty={ty}
              entry={selectedEntry}
              detail={detailData}
              onClose={() => { setSelectedId(null); setDetailData(null); }}
            />
          </div>
        </div>
      ) : (
        <div className="yaqut-body yaqut-body-col">
          {/* Analytics sub-tabs */}
          <div className="yaqut-analytics-tabs">
            <button className={analyticsTab === 'charts' ? 'active' : ''} onClick={() => setAnalyticsTab('charts')}>
              📊 {ty.tabCharts || (${t.yaqut.tabCharts})}
            </button>
            <button className={analyticsTab === 'graph' ? 'active' : ''} onClick={() => setAnalyticsTab('graph')}>
              🕸 {ty.tabGraph || (${t.yaqut.tabPlaceGraph})}
            </button>
            <button className={analyticsTab === 'network' ? 'active' : ''} onClick={() => setAnalyticsTab('network')}>
              👤 {ty.tabNetwork || (${t.yaqut.advPersonPlace})}
            </button>
            <button className={analyticsTab === 'heatmap' ? 'active' : ''} onClick={() => setAnalyticsTab('heatmap')}>
              🔥 {ty.tabHeatmap || (${t.yaqut.tabGeoCluster})}
            </button>
          </div>

          <div className="yaqut-analytics-row">
            <div className="yaqut-analytics-main">
              {analyticsTab === 'charts' && <YaqutAnalytics lang={lang} ty={ty} data={YAQUT_LITE} filtered={filtered} />}
              {analyticsTab === 'graph' && <PlaceGraph lang={lang} />}
              {analyticsTab === 'network' && <PersonPlaceNetwork lang={lang} data={YAQUT_LITE} />}
              {analyticsTab === 'heatmap' && <GeoHeatmap data={YAQUT_LITE} lang={lang} />}
            </div>

            <div className="yaqut-analytics-sidebar">
              <YaqutStatsPanel lang={lang} ty={ty} data={YAQUT_LITE} />
            </div>
          </div>
        </div>
      )}

      {/* Footer source */}
      <div className="yaqut-source">{ty.source}</div>
    </div>
  );
}

export { YAQUT_LITE, YAQUT_BY_ID, STATS, normalize as yaqutNormalize };

/* ═══ Wrapped export with Error Boundary ═══ */
export default function YaqutViewWrapper(props) {
  return (
    <YaqutErrorBoundary lang={props.lang}>
      <YaqutViewInner {...props} />
    </YaqutErrorBoundary>
  );
}
