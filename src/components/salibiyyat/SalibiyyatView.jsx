import { useState, useMemo, useCallback, useEffect, Component } from 'react';
import useAsyncData from '../../hooks/useAsyncData.jsx';
import SkeletonLoader from '../shared/SkeletonLoader';
import SalibiyyatSidebar from './SalibiyyatSidebar';
import SalibiyyatMap from './SalibiyyatMap';
import SalibiyyatIdCard from './SalibiyyatIdCard';
import SalibiyyatCompare from './SalibiyyatCompare';
import '../../styles/salibiyyat.css';

/* ═══ Error Boundary ═══ */
class SalibiyyatErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('SalibiyyatView error:', error, info); }
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

/* ═══ Normalize for Turkish/Arabic search ═══ */
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

/* ═══ Source color map (MUST match source IDs in JSON) ═══ */
const SOURCE_COLORS = {
  ibn_athir:     '#e74c3c', // IA
  maqrizi:       '#f39c12', // MQ
  usama:         '#2ecc71', // US
  abu_shama:     '#3498db', // AS
  ibn_shaddad:   '#9b59b6', // IS
  imad_din:      '#e67e22', // ID — FIX: was imad_isfahani
};

/* ═══ i18n ═══ */
const SAL_T = {
  tr: {
    title: 'Salibiyyât',
    sub: '6 kaynak · 790 olay · 24 kale · 1096–1438',
    loading: 'Salibiyyât verileri yükleniyor…',
    tabMap: 'Harita',
    tabTimeline: 'Zaman Çizelgesi',
    tabSources: 'Kaynaklar',
    tabCompare: 'Karşılaştırma',
    totalEvents: 'olay',
    sourceCount: 'kaynak',
    castleCount: 'kale',
    clusterCount: 'çoklu kaynak noktası',
    search: 'Olay, kale veya yer ara…',
    filtersTitle: 'Filtreler',
    entries: 'olay',
    noEntries: 'Bu filtre ile eşleşen olay bulunamadı.',
    noSelection: 'Detay için bir olaya tıklayın',
    allSources: 'Tüm Kaynaklar',
    allTypes: 'Tüm Olay Tipleri',
    allOutcomes: 'Tüm Sonuçlar',
    yearRange: 'Yıl Aralığı',
    source: 'Kaynak',
    eventType: 'Olay Tipi',
    outcome: 'Sonuç',
    year: 'Yıl',
    location: 'Konum',
    coordinates: 'Koordinat',
    arabicText: 'Orijinal Metin',
    clusterLink: 'kaynak bu olayı anlatıyor',
    compareBtn: 'Karşılaştır',
    castleName: 'Kale',
    castleType: 'Tip',
    crusaderState: 'Haçlı Devleti',
    ownership: 'Sahiplik Geçmişi',
    boundaries: 'Devlet Sınırları',
    routes: 'Sefer Güzergâhları',
    clusterSources: 'Kaynaklar',
    prevCluster: '← Önceki',
    nextCluster: 'Sonraki →',
    sourceInfo: 'Kaynak: İbn el-Esîr, Makrîzî, Üsâme b. Münkız, Ebû Şâme, İbn Şeddâd, İmâdüddîn el-İsfahânî',
    tabList: 'Liste',
    tabDetail: 'Detay',
    crossRefBattle: 'Atlas\'ta görüntüle',
    crossRefKhitat: 'Hıtât katmanında görüntüle',
  },
  en: {
    title: 'Salibiyyāt',
    sub: '6 sources · 790 events · 24 castles · 1096–1438',
    loading: 'Loading Salibiyyāt data…',
    tabMap: 'Map',
    tabTimeline: 'Timeline',
    tabSources: 'Sources',
    tabCompare: 'Compare',
    totalEvents: 'events',
    sourceCount: 'sources',
    castleCount: 'castles',
    clusterCount: 'multi-source points',
    search: 'Search events, castles, or places…',
    filtersTitle: 'Filters',
    entries: 'events',
    noEntries: 'No events match this filter.',
    noSelection: 'Click an event for details',
    allSources: 'All Sources',
    allTypes: 'All Event Types',
    allOutcomes: 'All Outcomes',
    yearRange: 'Year Range',
    source: 'Source',
    eventType: 'Event Type',
    outcome: 'Outcome',
    year: 'Year',
    location: 'Location',
    coordinates: 'Coordinates',
    arabicText: 'Original Text',
    clusterLink: 'source(s) narrate this event',
    compareBtn: 'Compare',
    castleName: 'Castle',
    castleType: 'Type',
    crusaderState: 'Crusader State',
    ownership: 'Ownership History',
    boundaries: 'State Boundaries',
    routes: 'Crusade Routes',
    clusterSources: 'Sources',
    prevCluster: '← Previous',
    nextCluster: 'Next →',
    sourceInfo: 'Sources: Ibn al-Athīr, al-Maqrīzī, Usāma ibn Munqidh, Abū Shāma, Ibn Shaddād, ʿImād al-Dīn al-Iṣfahānī',
    tabList: 'List',
    tabDetail: 'Detail',
    crossRefBattle: 'View in Atlas',
    crossRefKhitat: 'View in Ḫiṭaṭ layer',
  },
  ar: {
    title: 'صليبيات',
    sub: '٦ مصادر · ٧٩٠ حدثاً · ٢٤ قلعة · ١٠٩٦–١٤٣٨',
    loading: 'جاري تحميل بيانات الصليبيات…',
    tabMap: 'خريطة',
    tabCompare: 'مقارنة',
    totalEvents: 'حدث',
    search: 'ابحث عن الأحداث…',
    entries: 'حدث',
    noSelection: 'اضغط على حدث لعرض التفاصيل',
    sourceInfo: 'المصادر: ابن الأثير، المقريزي، أسامة بن منقذ، أبو شامة، ابن شداد، عماد الدين الأصفهاني',
    tabList: 'قائمة',
    tabDetail: 'تفاصيل',
    crossRefBattle: 'عرض في الأطلس',
    crossRefKhitat: 'عرض في طبقة الخطط',
  },
};

/* ═══ Helpers ═══ */
function buildStats(data) {
  return {
    events: data.events?.length || 0,
    sources: data.sources?.length || 0,
    castles: data.castles?.length || 0,
    clusters: data.clusters?.length || 0,
  };
}

function SalibiyyatViewInner({ lang, initialSearch, onNavigate }) {
  const tr = { ...SAL_T.tr, ...(SAL_T[lang] || {}) };
  const { data: rawData, loading, error } = useAsyncData('/data/salibiyyat_atlas_layer.json');

  /* ── Parsed data ── */
  const events = useMemo(() => rawData?.events || [], [rawData]);
  const castles = useMemo(() => rawData?.castles || [], [rawData]);
  const sources = useMemo(() => rawData?.sources || [], [rawData]);
  const clusters = useMemo(() => rawData?.clusters || [], [rawData]);
  const boundaries = useMemo(() => rawData?.boundaries || [], [rawData]);
  const boundaryYears = useMemo(() => rawData?.boundary_years || [], [rawData]);
  const routes = useMemo(() => rawData?.routes || [], [rawData]);
  const enums = useMemo(() => rawData?.enums || {}, [rawData]);
  const crossRefs = useMemo(() => rawData?.cross_refs || {}, [rawData]);
  const stats = useMemo(() => buildStats(rawData || {}), [rawData]);

  /* ── Source map ── */
  const sourceMap = useMemo(() => {
    const m = {};
    sources.forEach(s => { m[s.id] = s; });
    return m;
  }, [sources]);

  /* ── Cluster map ── */
  const clusterMap = useMemo(() => {
    const m = {};
    clusters.forEach(c => { m[c.id] = c; });
    return m;
  }, [clusters]);

  /* ── Event → cluster reverse map ── */
  const eventClusterMap = useMemo(() => {
    const m = {};
    events.forEach(e => { if (e.cluster_id) m[e.id] = e.cluster_id; });
    return m;
  }, [events]);

  /* ── Filters ── */
  const [search, setSearch] = useState(initialSearch || '');
  const [selectedSources, setSelectedSources] = useState(new Set());
  const [selectedType, setSelectedType] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState('');
  const [yearRange, setYearRange] = useState([1096, 1438]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCastleId, setSelectedCastleId] = useState(null);
  const [activeTab, setActiveTab] = useState('map'); // map | compare
  const [showMobile, setShowMobile] = useState('list');

  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);

  /* ── Filtered events ── */
  const filtered = useMemo(() => {
    let arr = events;
    if (selectedSources.size > 0) arr = arr.filter(e => selectedSources.has(e.source_id));
    if (selectedType) arr = arr.filter(e => e.type === selectedType);
    if (selectedOutcome) arr = arr.filter(e => e.outcome === selectedOutcome);
    if (yearRange[0] > 1096 || yearRange[1] < 1438) {
      arr = arr.filter(e => e.year >= yearRange[0] && e.year <= yearRange[1]);
    }
    if (search && search.length >= 2) {
      const q = normalize(search);
      arr = arr.filter(e =>
        normalize(e.title).includes(q) ||
        normalize(e.arabic_text).includes(q) ||
        normalize(e.location).includes(q) ||
        normalize(sourceMap[e.source_id]?.name_tr).includes(q) ||
        normalize(sourceMap[e.source_id]?.name_en).includes(q)
      );
    }
    return arr;
  }, [events, search, selectedSources, selectedType, selectedOutcome, yearRange, sourceMap]);

  /* ── Selection handlers ── */
  const handleSelectEvent = useCallback((id) => {
    setSelectedId(id);
    setSelectedCastleId(null);
    if (window.innerWidth <= 900) setShowMobile('card');
  }, []);

  const handleSelectCastle = useCallback((id) => {
    setSelectedCastleId(id);
    setSelectedId(null);
    if (window.innerWidth <= 900) setShowMobile('card');
  }, []);

  const handleGoToCompare = useCallback((clusterId) => {
    setActiveTab('compare');
    setSelectedId(clusterId);
  }, []);

  /* ── Cross-ref navigation ── */
  const handleCrossRef = useCallback((type, atlasId) => {
    if (onNavigate) {
      if (type === 'atlas_battle') {
        onNavigate('battles', { highlight: atlasId });
      } else if (type === 'atlas_khitat') {
        onNavigate('khitat', { highlight: atlasId });
      }
    } else {
      /* Fallback: hash-based navigation */
      if (type === 'atlas_battle') {
        window.location.hash = `#tab=battles&highlight=${atlasId}`;
      } else if (type === 'atlas_khitat') {
        window.location.hash = `#tab=khitat&highlight=${atlasId}`;
      }
    }
  }, [onNavigate]);

  const selectedEvent = selectedId ? events.find(e => e.id === selectedId) : null;
  const selectedCastle = selectedCastleId ? castles.find(c => c.id === selectedCastleId) : null;

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
    <div className="sal-view">
      {/* ── Header ── */}
      <div className="sal-header">
        <div className="sal-header-info">
          <h2 className="sal-title">⚔️ {tr.title}</h2>
          <span className="sal-subtitle">{tr.sub}</span>
        </div>
        <div className="sal-header-stats">
          <span className="sal-stat"><strong>{stats.events}</strong> {tr.totalEvents}</span>
          <span className="sal-stat-sep">·</span>
          <span className="sal-stat"><strong>{stats.sources}</strong> {tr.sourceCount}</span>
          <span className="sal-stat-sep">·</span>
          <span className="sal-stat"><strong>{stats.castles}</strong> {tr.castleCount}</span>
          <span className="sal-stat-sep">·</span>
          <span className="sal-stat"><strong>{stats.clusters}</strong> {tr.clusterCount}</span>
        </div>
      </div>

      {/* ── Tab bar: Map / Compare ── */}
      <div className="sal-tab-bar">
        <button className={`sal-tab-btn${activeTab === 'map' ? ' active' : ''}`}
          onClick={() => setActiveTab('map')}>🗺 {tr.tabMap}</button>
        <button className={`sal-tab-btn${activeTab === 'compare' ? ' active' : ''}`}
          onClick={() => setActiveTab('compare')}>⚖️ {tr.tabCompare}</button>
      </div>

      {/* ── Mobile toggle ── */}
      <div className="sal-mobile-toggle">
        <button className={showMobile === 'list' ? 'active' : ''} onClick={() => setShowMobile('list')}>☰ {tr.tabList}</button>
        <button className={showMobile === 'map' ? 'active' : ''} onClick={() => setShowMobile('map')}>🗺 {tr.tabMap}</button>
        {(selectedEvent || selectedCastle) && <button className={showMobile === 'card' ? 'active' : ''} onClick={() => setShowMobile('card')}>📋 {tr.tabDetail}</button>}
      </div>

      {activeTab === 'map' ? (
        /* ── Map view: 3 column ── */
        <div className="sal-body">
          <div className={`sal-sidebar${showMobile === 'list' ? ' mobile-visible' : ''}`}>
            <SalibiyyatSidebar
              lang={lang} tr={tr}
              filtered={filtered} events={events} castles={castles}
              sources={sources} sourceMap={sourceMap} enums={enums}
              search={search} setSearch={setSearch}
              selectedSources={selectedSources} setSelectedSources={setSelectedSources}
              selectedType={selectedType} setSelectedType={setSelectedType}
              selectedOutcome={selectedOutcome} setSelectedOutcome={setSelectedOutcome}
              yearRange={yearRange} setYearRange={setYearRange}
              selectedId={selectedId} onSelectEvent={handleSelectEvent}
              selectedCastleId={selectedCastleId} onSelectCastle={handleSelectCastle}
              clusterMap={clusterMap} eventClusterMap={eventClusterMap}
            />
          </div>
          <div className={`sal-map-area${showMobile === 'map' ? ' mobile-visible' : ''}`}>
            <SalibiyyatMap
              lang={lang} tr={tr}
              events={filtered} allEvents={events}
              castles={castles} sources={sources} sourceMap={sourceMap}
              boundaries={boundaries} boundaryYears={boundaryYears}
              routes={routes} clusters={clusters}
              selectedId={selectedId} selectedEvent={selectedEvent}
              selectedCastleId={selectedCastleId} selectedCastle={selectedCastle}
              onSelectEvent={handleSelectEvent}
              onSelectCastle={handleSelectCastle}
              eventClusterMap={eventClusterMap}
            />
          </div>
          <div className={`sal-card-area${showMobile === 'card' ? ' mobile-visible' : ''}${(selectedEvent || selectedCastle) ? ' has-selection' : ''}`}>
            <SalibiyyatIdCard
              lang={lang} tr={tr}
              event={selectedEvent} castle={selectedCastle}
              sourceMap={sourceMap} enums={enums}
              clusterMap={clusterMap} eventClusterMap={eventClusterMap}
              crossRefs={crossRefs}
              onClose={() => { setSelectedId(null); setSelectedCastleId(null); }}
              onGoToCompare={handleGoToCompare}
              onCrossRef={handleCrossRef}
            />
          </div>
        </div>
      ) : (
        /* ── Compare view ── */
        <SalibiyyatCompare
          lang={lang} tr={tr}
          clusters={clusters} sourceMap={sourceMap} enums={enums}
          initialClusterId={selectedId}
          onCrossRef={handleCrossRef}
        />
      )}

      <div className="sal-source">{tr.sourceInfo}</div>
    </div>
  );
}

export default function SalibiyyatViewWrapper(props) {
  return (
    <SalibiyyatErrorBoundary lang={props.lang}>
      <SalibiyyatViewInner {...props} />
    </SalibiyyatErrorBoundary>
  );
}
