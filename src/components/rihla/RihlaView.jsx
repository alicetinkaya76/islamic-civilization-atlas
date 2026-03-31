import { useState, useMemo, useCallback, useEffect, Component } from 'react';
import useAsyncData from '../../hooks/useAsyncData.jsx';
import SkeletonLoader from '../shared/SkeletonLoader';
import RihlaSidebar from './RihlaSidebar';
import RihlaMap from './RihlaMap';
import RihlaIdCard from './RihlaIdCard';
import '../../styles/rihla.css';
import T from '../../data/i18n';

/* ═══ Error Boundary ═══ */
class RihlaErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('RihlaView error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#c4b89a' }}>
          <h3>⚠️ Bir hata oluştu</h3>
          <p style={{ color: '#ef5350', fontSize: 12, fontFamily: 'monospace' }}>{String(this.state.error)}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 16, padding: '8px 16px', background: '#8b5e3c', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Tekrar Dene / Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ═══ Normalize for search ═══ */
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

/* ═══ Helpers ═══ */
function extractCountries(stops) {
  const c = {};
  stops.forEach(s => { if (s.country) c[s.country] = (c[s.country] || 0) + 1; });
  return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k]) => k);
}

function extractTopics(stops) {
  const c = {};
  stops.forEach(s => { if (s.topics) s.topics.forEach(t => { c[t] = (c[t] || 0) + 1; }); });
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k]) => k);
}

function buildStats(stops, voyages) {
  return {
    total: stops.length,
    voyages: voyages.length,
    countries: new Set(stops.map(s => s.country).filter(Boolean)).size,
    highSig: stops.filter(s => s.sig === 'high').length,
  };
}

/* ═══ i18n labels ═══ */
const RIHLA_T = {
  tr: {
    title: 'İbn Battûta Rihla',
    sub: '29 yıl · 117.000 km · 45 ülke',
    loading: 'Rihla verileri yükleniyor…',
    totalStops: 'durak',
    voyageCount: 'yolculuk',
    countries: 'ülke',
    mapView: 'Harita',
    analyticsView: 'Analiz',
    tabList: 'Liste',
    tabDetail: 'Detay',
    search: 'Durak ara…',
    filtersTitle: 'Filtreler',
    allVoyages: 'Tüm Yolculuklar',
    allCountries: 'Tüm Ülkeler',
    allSig: 'Tümü',
    significance: 'Önem',
    high: 'Yüksek',
    medium: 'Orta',
    low: 'Düşük',
    topics: 'Konular',
    entries: 'durak',
    noEntries: 'Bu filtre ile eşleşen durak bulunamadı.',
    noSelection: 'Detay için bir durağa tıklayın',
    source: "Kaynak: Ibn Battuta, Tuhfetun-Nuzzar (Rihla), thk. Abdulhadi et-Tazi",
    arrivalDate: 'Varış',
    departureDate: 'Ayrılış',
    stayDays: 'Kalış',
    days: 'gün',
    region: 'Bölge',
    country: 'Ülke',
    coordinates: 'Koordinat',
    stopType: 'Durak Tipi',
    confidence: 'Güvenilirlik',
    rihlaQuote: 'Rihla Metni',
    notablePeople: 'Kayda Değer Kişiler',
    observations: 'Gözlemler',
    crossRefs: 'Çapraz Referanslar',
    yakutMatch: 'Yâkût eşleşmesi',
    dynastyLink: 'Hanedan bağlantısı',
    dateUncertain: 'Tarih belirsiz',
    disputed: 'Tartışmalı',
    voyageLabel: 'Yolculuk',
  },
  en: {
    title: 'Ibn Battuta Rihla',
    sub: '29 years · 117,000 km · 45 countries',
    loading: 'Loading Rihla data…',
    totalStops: 'stops',
    voyageCount: 'voyages',
    countries: 'countries',
    mapView: 'Map',
    analyticsView: 'Analytics',
    tabList: 'List',
    tabDetail: 'Detail',
    search: 'Search stops…',
    filtersTitle: 'Filters',
    allVoyages: 'All Voyages',
    allCountries: 'All Countries',
    allSig: 'All',
    significance: 'Significance',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    topics: 'Topics',
    entries: 'stops',
    noEntries: 'No stops match this filter.',
    noSelection: 'Click a stop for details',
    source: 'Source: Ibn Battuta, Tuḥfat al-Nuẓẓār (Rihla), ed. Abdelhadi Tazi',
    arrivalDate: 'Arrival',
    departureDate: 'Departure',
    stayDays: 'Stay',
    days: 'days',
    region: 'Region',
    country: 'Country',
    coordinates: 'Coordinates',
    stopType: 'Stop Type',
    confidence: 'Confidence',
    rihlaQuote: 'Rihla Text',
    notablePeople: 'Notable People',
    observations: 'Observations',
    crossRefs: 'Cross-references',
    yakutMatch: 'Yāqūt match',
    dynastyLink: 'Dynasty link',
    dateUncertain: 'Date uncertain',
    disputed: 'Disputed',
    voyageLabel: 'Voyage',
  },
  ar: {
    title: 'رحلة ابن بطوطة',
    sub: '٢٩ سنة · ١١٧٬٠٠٠ كم · ٤٥ دولة',
    loading: 'جاري تحميل بيانات الرحلة…',
    totalStops: 'محطة',
    voyageCount: 'رحلة',
    countries: 'دولة',
    mapView: 'خريطة',
    search: 'ابحث عن محطة…',
    entries: 'محطة',
    noSelection: 'اضغط على محطة لعرض التفاصيل',
    source: 'المصدر: ابن بطوطة، تحفة النظار في غرائب الأمصار وعجائب الأسفار',
    voyageLabel: 'الرحلة',
  },
};

function RihlaViewInner({ lang, initialSearch }) {
  const tr = RIHLA_T[lang] || RIHLA_T.tr;
  const { data: rawData, loading, error } = useAsyncData('/data/ibn_battuta_atlas_layer.json');

  const voyages = useMemo(() => rawData?.travel_voyages || [], [rawData]);
  const stops = useMemo(() => rawData?.travel_stops || [], [rawData]);
  const traveler = useMemo(() => rawData?.travelers?.[0] || null, [rawData]);
  const voyageMap = useMemo(() => {
    const m = {};
    voyages.forEach(v => { m[v.id] = v; });
    return m;
  }, [voyages]);
  const stopMap = useMemo(() => {
    const m = {};
    stops.forEach(s => { m[s.id] = s; });
    return m;
  }, [stops]);

  const allCountries = useMemo(() => extractCountries(stops), [stops]);
  const allTopics = useMemo(() => extractTopics(stops), [stops]);
  const stats = useMemo(() => buildStats(stops, voyages), [stops, voyages]);

  /* ── Filters ── */
  const [search, setSearch] = useState(initialSearch || '');
  const [selectedVoyage, setSelectedVoyage] = useState(0); // 0 = all
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedSig, setSelectedSig] = useState('');
  const [selectedTopics, setSelectedTopics] = useState(new Set());
  const [selectedId, setSelectedId] = useState(null);
  const [showMobile, setShowMobile] = useState('list');

  /* Sync search from URL hash param */
  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);

  const filtered = useMemo(() => {
    let arr = stops;
    if (selectedVoyage) arr = arr.filter(s => s.voyage_id === selectedVoyage);
    if (selectedCountry) arr = arr.filter(s => s.country === selectedCountry);
    if (selectedSig) arr = arr.filter(s => s.sig === selectedSig);
    if (selectedTopics.size > 0) arr = arr.filter(s => s.topics?.some(t => selectedTopics.has(t)));
    if (search && search.length >= 2) {
      const q = normalize(search);
      arr = arr.filter(s =>
        normalize(s.tr).includes(q) || normalize(s.en).includes(q) ||
        normalize(s.ar).includes(q) || normalize(s.narr_tr).includes(q) ||
        normalize(s.narr_en).includes(q) || normalize(s.country).includes(q)
      );
    }
    return arr;
  }, [stops, search, selectedVoyage, selectedCountry, selectedSig, selectedTopics]);

  const handleSelect = useCallback((id) => {
    setSelectedId(id);
    if (window.innerWidth <= 900) setShowMobile('card');
  }, []);

  const selectedStop = selectedId ? stopMap[selectedId] : null;

  if (loading || !rawData) return <SkeletonLoader variant="list" rows={10} message={tr.loading} />;
  if (error) return (
    <div className="skeleton-loader" style={{ textAlign: 'center', padding: 40 }}>
      <p style={{ color: '#ef5350', fontSize: 13 }}>{String(error.message || error)}</p>
      <button onClick={() => window.location.reload()}
        style={{ marginTop: 12, padding: '8px 20px', background: '#8b5e3c', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
        Tekrar dene / Retry
      </button>
    </div>
  );

  return (
    <div className="rihla-view">
      {/* ── Header ── */}
      <div className="rihla-header">
        <div className="rihla-header-info">
          <h2 className="rihla-title">{tr.title}</h2>
          <span className="rihla-subtitle">{tr.sub}</span>
        </div>
        <div className="rihla-header-stats">
          <span className="rihla-stat"><strong>{stats.total}</strong> {tr.totalStops}</span>
          <span className="rihla-stat-sep">·</span>
          <span className="rihla-stat"><strong>{stats.voyages}</strong> {tr.voyageCount}</span>
          <span className="rihla-stat-sep">·</span>
          <span className="rihla-stat"><strong>{stats.countries}</strong> {tr.countries}</span>
        </div>
      </div>

      {/* ── Mobile toggle ── */}
      <div className="rihla-mobile-toggle">
        <button className={showMobile === 'list' ? 'active' : ''} onClick={() => setShowMobile('list')}>☰ {tr.tabList}</button>
        <button className={showMobile === 'map' ? 'active' : ''} onClick={() => setShowMobile('map')}>🗺 {tr.mapView}</button>
        {selectedStop && <button className={showMobile === 'card' ? 'active' : ''} onClick={() => setShowMobile('card')}>📋 {tr.tabDetail}</button>}
      </div>

      {/* ── Body: 3 column ── */}
      <div className="rihla-body">
        <div className={`rihla-sidebar${showMobile === 'list' ? ' mobile-visible' : ''}`}>
          <RihlaSidebar
            lang={lang} tr={tr}
            filtered={filtered} stops={stops}
            search={search} setSearch={setSearch}
            voyages={voyages}
            selectedVoyage={selectedVoyage} setSelectedVoyage={setSelectedVoyage}
            selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry}
            selectedSig={selectedSig} setSelectedSig={setSelectedSig}
            selectedTopics={selectedTopics} setSelectedTopics={setSelectedTopics}
            allCountries={allCountries} allTopics={allTopics}
            selectedId={selectedId} onSelect={handleSelect}
            voyageMap={voyageMap}
          />
        </div>
        <div className={`rihla-map-area${showMobile === 'map' ? ' mobile-visible' : ''}`}>
          <RihlaMap
            lang={lang} tr={tr}
            stops={filtered} allStops={stops}
            voyages={voyages} voyageMap={voyageMap}
            selectedVoyage={selectedVoyage}
            selectedId={selectedId}
            selectedStop={selectedStop}
            onSelect={handleSelect}
          />
        </div>
        <div className={`rihla-card-area${showMobile === 'card' ? ' mobile-visible' : ''}${selectedStop ? ' has-selection' : ''}`}>
          <RihlaIdCard
            lang={lang} tr={tr}
            stop={selectedStop}
            voyageMap={voyageMap}
            onClose={() => setSelectedId(null)}
          />
        </div>
      </div>

      <div className="rihla-source">{tr.source}</div>
    </div>
  );
}

export default function RihlaViewWrapper(props) {
  return (
    <RihlaErrorBoundary lang={props.lang}>
      <RihlaViewInner {...props} />
    </RihlaErrorBoundary>
  );
}
