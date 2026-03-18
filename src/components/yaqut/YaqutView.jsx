import { useState, useMemo, useCallback, useEffect, Component } from 'react';
import useAsyncData from '../../hooks/useAsyncData.jsx';
import LazyLoader from '../shared/LazyLoader';
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
      const tl = T[this.props.lang] || T.tr;
      const ty = tl.yaqut || {};
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#c4b89a' }}>
          <h3>⚠️ {ty.errorOccurred || 'Bir hata oluştu'}</h3>
          <p style={{ color: '#ef5350', fontSize: 12, fontFamily: 'monospace' }}>{String(this.state.error)}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 16, padding: '8px 16px', background: '#1a6b5a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            {ty.retry || 'Tekrar Dene'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ARABIC_ALPHA_ORDER = 'أبتثجحخدذرزسشصضطظعغفقكلمنوهي'.split('');
const PERIODS = ['active', 'ruined', 'legendary'];

const normalize = (s) =>
  (s || '').toLowerCase()
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
    .replace(/[āáà]/g, 'a').replace(/[ūú]/g, 'u').replace(/[īíì]/g, 'i')
    .replace(/[ḥḫ]/g, 'h').replace(/ṣ/g, 's').replace(/ṭ/g, 't')
    .replace(/ḍ/g, 'd').replace(/ẓ/g, 'z').replace(/ʿ|ʾ|'/g, '')
    .replace(/[\u0610-\u065f\u0670]/g, '')
    .replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/أ|إ|آ/g, 'ا');

function extractTopGeoTypes(data) {
  const c = {}; data.forEach(e => { if (e.gt) c[e.gt] = (c[e.gt] || 0) + 1; });
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([k]) => k);
}
function extractCountries(data) {
  const c = {}; data.forEach(e => { if (e.ct) c[e.ct] = (c[e.ct] || 0) + 1; });
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k]) => k);
}
function extractLetters(data) {
  const s = new Set(); data.forEach(e => { if (e.lt) s.add(e.lt); });
  return ARABIC_ALPHA_ORDER.filter(l => s.has(l));
}
function extractTopTags(data) {
  const c = {}; data.forEach(e => { if (e.tg) e.tg.forEach(t => { c[t] = (c[t] || 0) + 1; }); });
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k]) => k);
}
function buildLookup(data) { const m = {}; data.forEach(e => { m[e.id] = e; }); return m; }
function buildStats(data) {
  return {
    total: data.length,
    geocoded: data.filter(e => e.lat != null).length,
    withDia: data.filter(e => e.ds).length,
    withPersons: data.filter(e => e.np > 0 || e.pc > 0).length,
    withEvents: data.filter(e => e.ec > 0).length,
  };
}

function YaqutViewInner({ lang, t }) {
  const ty = t.yaqut || {};
  const { data: YAQUT_LITE, loading: dataLoading, error: dataError } = useAsyncData('/data/yaqut_lite.json');

  const YAQUT_BY_ID = useMemo(() => YAQUT_LITE ? buildLookup(YAQUT_LITE) : {}, [YAQUT_LITE]);
  const TOP_GEO_TYPES = useMemo(() => YAQUT_LITE ? extractTopGeoTypes(YAQUT_LITE) : [], [YAQUT_LITE]);
  const ALL_COUNTRIES = useMemo(() => YAQUT_LITE ? extractCountries(YAQUT_LITE) : [], [YAQUT_LITE]);
  const ALL_LETTERS = useMemo(() => YAQUT_LITE ? extractLetters(YAQUT_LITE) : [], [YAQUT_LITE]);
  const TOP_TAGS = useMemo(() => YAQUT_LITE ? extractTopTags(YAQUT_LITE) : [], [YAQUT_LITE]);
  const STATS = useMemo(() => YAQUT_LITE ? buildStats(YAQUT_LITE) : { total:0, geocoded:0, withDia:0, withPersons:0, withEvents:0 }, [YAQUT_LITE]);

  const [search, setSearch] = useState('');
  const [selectedGeoTypes, setSelectedGeoTypes] = useState(new Set());
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [crossRefRange, setCrossRefRange] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [subView, setSubView] = useState('map');
  const [analyticsTab, setAnalyticsTab] = useState('charts');
  const [detailData, setDetailData] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [showMobile, setShowMobile] = useState('list');

  const filtered = useMemo(() => {
    if (!YAQUT_LITE) return [];
    let arr = YAQUT_LITE;
    if (selectedGeoTypes.size > 0) arr = arr.filter(e => selectedGeoTypes.has(e.gt));
    if (selectedCountry) arr = arr.filter(e => e.ct === selectedCountry);
    if (selectedLetter) arr = arr.filter(e => e.lt === selectedLetter);
    if (selectedPeriod) arr = arr.filter(e => e.hp === selectedPeriod);
    if (selectedTags.size > 0) arr = arr.filter(e => e.tg && e.tg.some(t => selectedTags.has(t)));
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
    if (search && search.length >= 2) {
      const q = normalize(search);
      arr = arr.filter(e =>
        normalize(e.h).includes(q) || normalize(e.ht).includes(q) ||
        normalize(e.he).includes(q) || normalize(e.st).includes(q) ||
        normalize(e.se).includes(q) || (e.an && e.an.some(a => normalize(a).includes(q)))
      );
    }
    return arr;
  }, [YAQUT_LITE, search, selectedGeoTypes, selectedCountry, selectedLetter, selectedPeriod, selectedTags, crossRefRange]);

  const geocoded = useMemo(() => filtered.filter(e => e.lat != null), [filtered]);

  const loadDetail = useCallback(async (id) => {
    const sid = String(id);
    if (detailCache[sid]) { setDetailData(detailCache[sid]); return; }
    try {
      const base = import.meta.env.BASE_URL || '/';
      const resp = await fetch(`${base}yaqut_detail.json`);
      if (resp.ok) { const all = await resp.json(); setDetailCache(all); setDetailData(all[sid] || null); }
    } catch (e) { console.warn('Failed to load yaqut detail:', e); setDetailData(null); }
  }, [detailCache]);

  const handleSelect = useCallback((id) => {
    setSelectedId(id); loadDetail(id);
    if (window.innerWidth <= 900) setShowMobile('card');
  }, [loadDetail]);

  const selectedEntry = selectedId ? YAQUT_BY_ID[selectedId] : null;

  if (dataLoading || !YAQUT_LITE) return <LazyLoader message={ty.loading || "Muʿcem el-Büldân verileri yükleniyor"} />;
  if (dataError) return <LazyLoader error={dataError} onRetry={() => window.location.reload()} />;

  return (
    <div className="yaqut-view">
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
          <button className={`scholar-view-btn${subView === 'map' ? ' active' : ''}`} onClick={() => setSubView('map')}>🗺 {ty.mapView}</button>
          <button className={`scholar-view-btn${subView === 'analytics' ? ' active' : ''}`} onClick={() => setSubView('analytics')}>📊 {ty.analyticsView}</button>
        </div>
      </div>

      <div className="yaqut-mobile-toggle">
        <button className={showMobile === 'list' ? 'active' : ''} onClick={() => setShowMobile('list')}>☰ {t.yaqut.tabList}</button>
        <button className={showMobile === 'map' ? 'active' : ''} onClick={() => setShowMobile('map')}>🗺 {ty.mapView}</button>
        {selectedEntry && <button className={showMobile === 'card' ? 'active' : ''} onClick={() => setShowMobile('card')}>📋 {t.yaqut.tabDetail}</button>}
      </div>

      {subView === 'map' ? (
        <div className="yaqut-body">
          <div className={`yaqut-sidebar${showMobile === 'list' ? ' mobile-visible' : ''}`}>
            <YaqutSidebar lang={lang} ty={ty} filtered={filtered}
              search={search} setSearch={setSearch}
              selectedGeoTypes={selectedGeoTypes} setSelectedGeoTypes={setSelectedGeoTypes}
              selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry}
              selectedLetter={selectedLetter} setSelectedLetter={setSelectedLetter}
              selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod}
              selectedTags={selectedTags} setSelectedTags={setSelectedTags}
              crossRefRange={crossRefRange} setCrossRefRange={setCrossRefRange}
              selectedId={selectedId} onSelect={handleSelect}
              topGeoTypes={TOP_GEO_TYPES} allCountries={ALL_COUNTRIES}
              allLetters={ALL_LETTERS} topTags={TOP_TAGS} periods={PERIODS} />
          </div>
          <div className={`yaqut-map-area${showMobile === 'map' ? ' mobile-visible' : ''}`}>
            <YaqutMap lang={lang} ty={ty} data={geocoded} selectedId={selectedId}
              selectedEntry={selectedEntry} detailData={detailData} onSelect={handleSelect} filtered={filtered} />
          </div>
          <div className={`yaqut-card-area${showMobile === 'card' ? ' mobile-visible' : ''}${selectedEntry ? ' has-selection' : ''}`}>
            <YaqutIdCard lang={lang} ty={ty} entry={selectedEntry} detail={detailData}
              onClose={() => { setSelectedId(null); setDetailData(null); }} />
          </div>
        </div>
      ) : (
        <div className="yaqut-body yaqut-body-col">
          <div className="yaqut-analytics-tabs">
            <button className={analyticsTab === 'charts' ? 'active' : ''} onClick={() => setAnalyticsTab('charts')}>📊 {ty.tabCharts || t.yaqut.tabCharts}</button>
            <button className={analyticsTab === 'graph' ? 'active' : ''} onClick={() => setAnalyticsTab('graph')}>🕸 {ty.tabGraph || t.yaqut.tabPlaceGraph}</button>
            <button className={analyticsTab === 'network' ? 'active' : ''} onClick={() => setAnalyticsTab('network')}>👤 {ty.tabNetwork || t.yaqut.advPersonPlace}</button>
            <button className={analyticsTab === 'heatmap' ? 'active' : ''} onClick={() => setAnalyticsTab('heatmap')}>🔥 {ty.tabHeatmap || t.yaqut.tabGeoCluster}</button>
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
      <div className="yaqut-source">{ty.source}</div>
    </div>
  );
}

export { normalize as yaqutNormalize };

export default function YaqutViewWrapper(props) {
  return (
    <YaqutErrorBoundary lang={props.lang}>
      <YaqutViewInner {...props} />
    </YaqutErrorBoundary>
  );
}
