import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import useAsyncData from '../../hooks/useAsyncData.jsx';
import LazyLoader from '../shared/LazyLoader';
import Ei1Sidebar from './Ei1Sidebar';
import Ei1IdCard from './Ei1IdCard';
import Ei1StatsPanel from './Ei1StatsPanel';
import { ei1Normalize, getCentury, EI1_FIELDS_LIST, EI1_ARTICLE_TYPES } from './ei1Constants';
import '../../styles/ei1.css';
import T from '../../data/i18n';

const Ei1Analytics = lazy(() => import('./Ei1Analytics'));
const Ei1Map = lazy(() => import('./Ei1Map'));
const Ei1Network = lazy(() => import('./Ei1Network'));

function buildLookup(data) { const m = {}; data.forEach(b => { m[b.id] = b; }); return m; }
function buildStats(data) {
  const bios = data.filter(b => b.bio);
  return {
    total: data.length,
    totalBio: bios.length,
    withDate: bios.filter(b => b.dc != null).length,
    withFields: data.filter(b => b.fl && b.fl.length > 0).length,
    totalWorks: data.reduce((s, b) => s + (b.wc || 0), 0),
    volumes: [...new Set(data.map(b => b.vol).filter(Boolean))].length,
  };
}

export default function Ei1View({ lang, t: tProp }) {
  const t = tProp || T[lang];
  const te = t.ei1 || {};

  const { data: EI1_LITE, loading, error } = useAsyncData('/data/ei1_lite.json');
  const { data: EI1_WORKS } = useAsyncData('/data/ei1_works.json');
  const { data: EI1_REL } = useAsyncData('/data/ei1_relations.json');
  const { data: EI1_GEO } = useAsyncData('/data/ei1_geo.json');

  const EI1_BY_ID = useMemo(() => EI1_LITE ? buildLookup(EI1_LITE) : {}, [EI1_LITE]);
  const STATS = useMemo(() => EI1_LITE ? buildStats(EI1_LITE) : {
    total: 0, totalBio: 0, withDate: 0, withFields: 0, totalWorks: 0, volumes: 0
  }, [EI1_LITE]);

  const [search, setSearch] = useState('');
  const [selectedFields, setSelectedFields] = useState(new Set());
  const [articleType, setArticleType] = useState('');
  const [centuryRange, setCenturyRange] = useState([1, 21]);
  const [importanceTier, setImportanceTier] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [subView, setSubView] = useState('list');
  const [showMobile, setShowMobile] = useState('list');
  const [onlyBio, setOnlyBio] = useState(false);
  const [mapColorBy, setMapColorBy] = useState('field');

  const filtered = useMemo(() => {
    if (!EI1_LITE) return [];
    let arr = EI1_LITE;
    if (onlyBio) arr = arr.filter(b => b.bio);
    const [cMin, cMax] = centuryRange;
    if (cMin > 1 || cMax < 21) {
      arr = arr.filter(b => {
        const c = getCentury(parseInt(b.dc) || 0);
        return !c || (c >= cMin && c <= cMax);
      });
    }
    if (selectedFields.size > 0) arr = arr.filter(b => b.fl && b.fl.some(f => selectedFields.has(f)));
    if (articleType) arr = arr.filter(b => b.at === articleType);
    if (importanceTier === 'important') arr = arr.filter(b => (b.is || 0) > 40);
    else if (importanceTier === 'top') arr = arr.filter(b => (b.is || 0) > 60);
    if (search && search.length >= 2) {
      const q = ei1Normalize(search);
      arr = arr.filter(b =>
        ei1Normalize(b.t).includes(q) ||
        ei1Normalize(b.tn || '').includes(q) ||
        ei1Normalize(b.ds || '').includes(q) ||
        ei1Normalize(b.fn || '').includes(q) ||
        ei1Normalize(b.au || '').includes(q));
    }
    return arr;
  }, [EI1_LITE, search, selectedFields, articleType, centuryRange, importanceTier, onlyBio]);

  const handleSelect = useCallback((id) => { setSelectedId(id); setShowMobile('card'); }, []);
  const selectedBio = selectedId != null ? EI1_BY_ID[selectedId] : null;

  /* Loading / error guard — after all hooks */
  if (loading || !EI1_LITE) return <LazyLoader message={te.loading || 'Brill EI-1 verileri yükleniyor'} />;
  if (error) return <LazyLoader error={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="ei1-view">
      <div className="ei1-header">
        <div className="ei1-header-info">
          <h2 className="ei1-title">
            <span className="ei1-title-icon">📕</span>
            {te.title || 'Encyclopaedia of Islam, First Edition'}
          </h2>
          <span className="ei1-subtitle">{te.sub || 'Brill (1913–1936) • 7,568 Entries • 4 Volumes + Supplement'}</span>
        </div>
        <div className="ei1-header-stats">
          <span className="ei1-stat"><strong>{STATS.total.toLocaleString()}</strong> {te.totalEntries || 'madde'}</span>
          <span className="ei1-stat-sep">·</span>
          <span className="ei1-stat"><strong>{STATS.totalBio.toLocaleString()}</strong> {te.totalBio || 'biyografi'}</span>
          <span className="ei1-stat-sep">·</span>
          <span className="ei1-stat"><strong>{STATS.totalWorks.toLocaleString()}</strong> {te.totalWorks || 'eser'}</span>
        </div>
        <div className="ei1-view-toggle">
          <button className={`ei1-view-btn${subView === 'list' ? ' active' : ''}`} onClick={() => setSubView('list')}>
            📋 {te.listView || 'Liste'}
          </button>
          <button className={`ei1-view-btn${subView === 'map' ? ' active' : ''}`} onClick={() => setSubView('map')}>
            🗺 {te.mapView || 'Map'}
          </button>
          <button className={`ei1-view-btn${subView === 'network' ? ' active' : ''}`} onClick={() => setSubView('network')}>
            🕸 {te.networkView || 'Network'}
          </button>
          <button className={`ei1-view-btn${subView === 'analytics' ? ' active' : ''}`} onClick={() => setSubView('analytics')}>
            📊 {te.analyticsView || 'Analitik'}
          </button>
        </div>
      </div>

      {/* Mobile sub-tabs */}
      <div className="ei1-mobile-toggle">
        <button className={showMobile === 'list' ? 'active' : ''} onClick={() => setShowMobile('list')}>
          ☰ {te.tabList || 'Liste'}
        </button>
        <button className={showMobile === 'main' ? 'active' : ''} onClick={() => setShowMobile('main')}>
          {subView === 'analytics' ? '📊' : subView === 'map' ? '🗺' : subView === 'network' ? '🕸' : '📋'}
        </button>
        {selectedBio && (
          <button className={showMobile === 'card' ? 'active' : ''} onClick={() => setShowMobile('card')}>
            📋 {te.tabDetail || 'Detay'}
          </button>
        )}
      </div>

      <div className="ei1-body">
        <div className={`ei1-sidebar${showMobile === 'list' ? ' mobile-visible' : ''}`}>
          <Ei1Sidebar lang={lang} te={te} filtered={filtered}
            search={search} setSearch={setSearch}
            selectedFields={selectedFields} setSelectedFields={setSelectedFields}
            articleType={articleType} setArticleType={setArticleType}
            centuryRange={centuryRange} setCenturyRange={setCenturyRange}
            importanceTier={importanceTier} setImportanceTier={setImportanceTier}
            onlyBio={onlyBio} setOnlyBio={setOnlyBio}
            selectedId={selectedId} onSelect={handleSelect}
            fieldsList={EI1_FIELDS_LIST} articleTypes={EI1_ARTICLE_TYPES} />
        </div>

        <div className={`ei1-main-area${showMobile === 'main' ? ' mobile-visible' : ''}`}>
          {subView === 'list' ? (
            <Ei1StatsPanel lang={lang} te={te} data={EI1_LITE} filtered={filtered} stats={STATS} />
          ) : subView === 'map' ? (
            <Suspense fallback={<LazyLoader message={te.loadingMap || 'Loading map'} />}>
              <Ei1Map lang={lang} te={te} data={EI1_LITE} geoData={EI1_GEO} lookup={EI1_BY_ID} filtered={filtered} onSelect={handleSelect} selectedId={selectedId} colorBy={mapColorBy} />
            </Suspense>
          ) : subView === 'network' ? (
            <Suspense fallback={<LazyLoader message={te.loadingNetwork || 'Loading network'} />}>
              <Ei1Network lang={lang} te={te} data={EI1_LITE} relations={EI1_REL} lookup={EI1_BY_ID} filtered={filtered} onSelect={handleSelect} selectedId={selectedId} />
            </Suspense>
          ) : (
            <Suspense fallback={<LazyLoader message={te.loadingAnalytics || 'Analitik yükleniyor'} />}>
              <Ei1Analytics lang={lang} te={te} data={EI1_LITE} filtered={filtered} />
            </Suspense>
          )}
        </div>

        <div className={`ei1-card-area${showMobile === 'card' ? ' mobile-visible' : ''}${selectedBio ? ' has-selection' : ''}`}>
          <Ei1IdCard lang={lang} te={te} bio={selectedBio}
            works={EI1_WORKS} relations={EI1_REL} lookup={EI1_BY_ID}
            onClose={() => setSelectedId(null)} onNavigate={handleSelect} />
        </div>
      </div>

      <div className="ei1-source">
        {te.source || 'Source: Encyclopaedia of Islam, First Edition (1913–1936), E.J. Brill'}
      </div>
    </div>
  );
}
