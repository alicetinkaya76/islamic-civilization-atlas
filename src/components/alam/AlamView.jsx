import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ALAM_LITE from '../../data/alam_lite.json';
import AlamSidebar from './AlamSidebar';
import AlamMap from './AlamMap';
import AlamIdCard from './AlamIdCard';
import AlamAnalytics from './AlamAnalytics';
import AlamStatsPanel from './AlamStatsPanel';
import { CrossRefNetwork, TimeMachine, WorkProfessionScatter, CenturyComparison } from './AlamAdvanced';
import '../../styles/alam.css';

/* ═══ Precompute lookup maps ═══ */
const ALAM_BY_ID = {};
ALAM_LITE.forEach(b => { ALAM_BY_ID[b.id] = b; });

/* ═══ Extract unique professions (top 20) ═══ */
function extractTopProfessions() {
  const counts = {};
  ALAM_LITE.forEach(b => {
    if (b.pt) {
      b.pt.split(', ').forEach(p => { counts[p] = (counts[p] || 0) + 1; });
    }
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([k]) => k);
}

/* ═══ Extract unique regions ═══ */
function extractRegions() {
  const counts = {};
  ALAM_LITE.forEach(b => {
    if (b.rg) counts[b.rg] = (counts[b.rg] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([k]) => k);
}

const TOP_PROFESSIONS = extractTopProfessions();
const ALL_REGIONS = extractRegions();
const MADHABS = ['Hanefî', 'Şâfiî', 'Mâlikî', 'Hanbelî', 'İmâmî', 'Zeydî', 'İbâzî'];

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
  total: ALAM_LITE.length,
  geocoded: ALAM_LITE.filter(b => b.lat != null).length,
  withDia: ALAM_LITE.filter(b => b.ds).length,
  withWorks: ALAM_LITE.reduce((s, b) => s + (b.wc || 0), 0),
  female: ALAM_LITE.filter(b => b.g === 'F').length,
};

export default function AlamView({ lang, t }) {
  const ta = t.alam || {};

  /* ═══ State ═══ */
  const [search, setSearch] = useState('');
  const [periodRange, setPeriodRange] = useState([600, 2000]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedProfessions, setSelectedProfessions] = useState(new Set());
  const [selectedMadhab, setSelectedMadhab] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [subView, setSubView] = useState('map'); // 'map' | 'analytics'
  const [analyticsTab, setAnalyticsTab] = useState('charts'); // 'charts' | 'network' | 'timemachine' | 'scatter' | 'compare'
  const [detailData, setDetailData] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [showMobile, setShowMobile] = useState('list'); // 'list' | 'map' | 'card'

  /* ═══ Filter biographies ═══ */
  const filtered = useMemo(() => {
    let arr = ALAM_LITE;

    // Period filter (based on miladi death or birth year)
    const [pMin, pMax] = periodRange;
    arr = arr.filter(b => {
      const yr = b.md || b.mb;
      if (!yr) return true; // include undated
      return yr >= pMin && yr <= pMax;
    });

    // Region
    if (selectedRegion) {
      arr = arr.filter(b => b.rg === selectedRegion);
    }

    // Profession
    if (selectedProfessions.size > 0) {
      arr = arr.filter(b => {
        if (!b.pt) return false;
        return b.pt.split(', ').some(p => selectedProfessions.has(p));
      });
    }

    // Madhab
    if (selectedMadhab) {
      arr = arr.filter(b => b.mz === selectedMadhab);
    }

    // Gender
    if (selectedGender) {
      arr = arr.filter(b => {
        const g = b.g || 'M';
        return g === selectedGender;
      });
    }

    // Search
    if (search && search.length >= 2) {
      const q = normalize(search);
      arr = arr.filter(b =>
        normalize(b.h).includes(q) ||
        normalize(b.ht).includes(q) ||
        normalize(b.he).includes(q) ||
        normalize(b.dt).includes(q) ||
        normalize(b.de).includes(q) ||
        normalize(b.pt).includes(q) ||
        normalize(b.pe).includes(q)
      );
    }

    return arr;
  }, [search, periodRange, selectedRegion, selectedProfessions, selectedMadhab, selectedGender]);

  /* ═══ Geocoded subset for map ═══ */
  const geocoded = useMemo(() => filtered.filter(b => b.lat != null), [filtered]);

  /* ═══ Load detail data on selection ═══ */
  const loadDetail = useCallback(async (id) => {
    if (detailCache[id]) {
      setDetailData(detailCache[id]);
      return;
    }
    try {
      const base = import.meta.env.BASE_URL || '/';
      const resp = await fetch(`${base}alam_detail.json`);
      if (resp.ok) {
        const all = await resp.json();
        setDetailCache(all);
        setDetailData(all[id] || null);
      }
    } catch (e) {
      console.warn('Failed to load alam detail:', e);
    }
  }, [detailCache]);

  /* ═══ Select biography ═══ */
  const handleSelect = useCallback((id) => {
    setSelectedId(id);
    loadDetail(id);
    setShowMobile('card');
  }, [loadDetail]);

  /* Selected bio object */
  const selectedBio = selectedId ? ALAM_BY_ID[selectedId] : null;

  return (
    <div className="alam-view">
      {/* Header bar */}
      <div className="alam-header">
        <div className="alam-header-info">
          <h2 className="alam-title">{ta.title}</h2>
          <span className="alam-subtitle">{ta.sub}</span>
        </div>
        <div className="alam-header-stats">
          <span className="alam-stat"><strong>{STATS.total.toLocaleString()}</strong> {ta.totalBio}</span>
          <span className="alam-stat-sep">·</span>
          <span className="alam-stat"><strong>{STATS.geocoded.toLocaleString()}</strong> {ta.withCoords}</span>
          <span className="alam-stat-sep">·</span>
          <span className="alam-stat"><strong>{STATS.withDia.toLocaleString()}</strong> {ta.withDia}</span>
          <span className="alam-stat-sep">·</span>
          <span className="alam-stat"><strong>{STATS.withWorks.toLocaleString()}</strong> {ta.totalWorks}</span>
        </div>
        <div className="alam-view-toggle">
          <button className={`scholar-view-btn${subView === 'map' ? ' active' : ''}`}
            onClick={() => setSubView('map')}>🗺 {ta.mapView}</button>
          <button className={`scholar-view-btn${subView === 'analytics' ? ' active' : ''}`}
            onClick={() => setSubView('analytics')}>📊 {ta.analyticsView}</button>
        </div>
      </div>

      {/* Mobile toggle */}
      <div className="alam-mobile-toggle">
        <button className={showMobile === 'list' ? 'active' : ''} onClick={() => setShowMobile('list')}>
          ☰ {lang === 'tr' ? 'Liste' : 'List'}
        </button>
        <button className={showMobile === 'map' ? 'active' : ''} onClick={() => setShowMobile('map')}>
          🗺 {ta.mapView}
        </button>
        {selectedBio && (
          <button className={showMobile === 'card' ? 'active' : ''} onClick={() => setShowMobile('card')}>
            📋 {lang === 'tr' ? 'Detay' : 'Detail'}
          </button>
        )}
      </div>

      {subView === 'map' ? (
        <div className="alam-body">
          {/* Left sidebar */}
          <div className={`alam-sidebar${showMobile === 'list' ? ' mobile-visible' : ''}`}>
            <AlamSidebar
              lang={lang} ta={ta}
              filtered={filtered}
              search={search} setSearch={setSearch}
              periodRange={periodRange} setPeriodRange={setPeriodRange}
              selectedRegion={selectedRegion} setSelectedRegion={setSelectedRegion}
              selectedProfessions={selectedProfessions} setSelectedProfessions={setSelectedProfessions}
              selectedMadhab={selectedMadhab} setSelectedMadhab={setSelectedMadhab}
              selectedGender={selectedGender} setSelectedGender={setSelectedGender}
              selectedId={selectedId} onSelect={handleSelect}
              topProfessions={TOP_PROFESSIONS}
              allRegions={ALL_REGIONS}
              madhabs={MADHABS}
            />
          </div>

          {/* Center map */}
          <div className={`alam-map-area${showMobile === 'map' ? ' mobile-visible' : ''}`}>
            <AlamMap
              lang={lang} ta={ta}
              data={geocoded}
              selectedId={selectedId}
              selectedBio={selectedBio}
              detailData={detailData}
              onSelect={handleSelect}
              filtered={filtered}
            />
          </div>

          {/* Right identity card */}
          <div className={`alam-card-area${showMobile === 'card' ? ' mobile-visible' : ''}${selectedBio ? ' has-selection' : ''}`}>
            <AlamIdCard
              lang={lang} ta={ta}
              bio={selectedBio}
              detail={detailData}
              onClose={() => { setSelectedId(null); setDetailData(null); }}
            />
          </div>
        </div>
      ) : (
        <div className="alam-body alam-body-col">
          {/* Analytics sub-tabs */}
          <div className="alam-analytics-tabs">
            <button className={analyticsTab === 'charts' ? 'active' : ''} onClick={() => setAnalyticsTab('charts')}>
              📊 {lang === 'tr' ? 'Grafikler' : 'Charts'}
            </button>
            <button className={analyticsTab === 'network' ? 'active' : ''} onClick={() => setAnalyticsTab('network')}>
              🕸 {lang === 'tr' ? 'Referans Ağı' : 'Ref Network'}
            </button>
            <button className={analyticsTab === 'timemachine' ? 'active' : ''} onClick={() => setAnalyticsTab('timemachine')}>
              ⏳ {lang === 'tr' ? 'Zaman Makinesi' : 'Time Machine'}
            </button>
            <button className={analyticsTab === 'scatter' ? 'active' : ''} onClick={() => setAnalyticsTab('scatter')}>
              🔬 {lang === 'tr' ? 'Korelasyon' : 'Correlation'}
            </button>
            <button className={analyticsTab === 'compare' ? 'active' : ''} onClick={() => setAnalyticsTab('compare')}>
              ⚖ {lang === 'tr' ? 'Karşılaştır' : 'Compare'}
            </button>
          </div>

          <div className="alam-analytics-row">
            <div className="alam-analytics-main">
              {analyticsTab === 'charts' && <AlamAnalytics lang={lang} ta={ta} data={ALAM_LITE} filtered={filtered} />}
              {analyticsTab === 'network' && <CrossRefNetwork data={ALAM_LITE} lang={lang} />}
              {analyticsTab === 'timemachine' && <TimeMachine data={ALAM_LITE} lang={lang} />}
              {analyticsTab === 'scatter' && <WorkProfessionScatter data={ALAM_LITE} lang={lang} />}
              {analyticsTab === 'compare' && <CenturyComparison data={ALAM_LITE} lang={lang} />}
            </div>

            <div className="alam-analytics-sidebar">
              <AlamStatsPanel lang={lang} ta={ta} data={ALAM_LITE} />
            </div>
          </div>
        </div>
      )}

      {/* Footer source */}
      <div className="alam-source">{ta.source}</div>
    </div>
  );
}

export { ALAM_LITE, ALAM_BY_ID, STATS, normalize as alamNormalize };
