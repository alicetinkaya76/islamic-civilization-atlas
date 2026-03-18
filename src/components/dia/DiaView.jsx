import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import useAsyncData from '../../hooks/useAsyncData.jsx';
import LazyLoader from '../shared/LazyLoader';
import DiaSidebar from './DiaSidebar';
import DiaIdCard from './DiaIdCard';
import DiaStatsPanel from './DiaStatsPanel';
import '../../styles/dia.css';
import T from '../../data/i18n';

const DiaNetwork = lazy(() => import('./DiaNetwork'));
const DiaAnalytics = lazy(() => import('./DiaAnalytics'));
const DiaMap = lazy(() => import('./DiaMap'));

const FIELDS_LIST = [
  'fıkıh','hadis','tefsir','kelâm','tasavvuf','edebiyat','tarih',
  'felsefe','tıp','astronomi','matematik','mûsiki','siyaset'
];
const MADHABS = ['Hanefî','Şâfiî','Mâlikî','Hanbelî','Zâhirî',"Ca'ferî"];

const normalize = (s) =>
  (s || '').toLowerCase()
    .replace(/ı/g,'i').replace(/ğ/g,'g').replace(/ü/g,'u')
    .replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/â/g,'a').replace(/î/g,'i').replace(/û/g,'u')
    .replace(/[āáà]/g,'a').replace(/[ūú]/g,'u').replace(/[īíì]/g,'i')
    .replace(/[ḥḫ]/g,'h').replace(/ṣ/g,'s').replace(/ṭ/g,'t')
    .replace(/ḍ/g,'d').replace(/ẓ/g,'z').replace(/ʿ|ʾ|'/g,'')
    .replace(/[\u0610-\u065f\u0670]/g,'')
    .replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/أ|إ|آ/g,'ا');

function buildLookup(data) { const m = {}; data.forEach(b => { m[b.id] = b; }); return m; }
function getCentury(year) { return year ? Math.ceil(year / 100) : null; }
function buildStats(data) {
  return {
    total: data.length,
    withDate: data.filter(b => b.dc != null).length,
    withMadhab: data.filter(b => b.mz).length,
    withFields: data.filter(b => b.fl && b.fl.length > 0).length,
    totalWorks: data.reduce((s, b) => s + (b.wc || 0), 0),
  };
}

export default function DiaView({ lang, t: tProp }) {
  const t = tProp || T[lang];
  const td = t.dia || {};

  const { data: DIA_LITE, loading: dataLoading, error: dataError } = useAsyncData('/data/dia_lite.json');
  const { data: DIA_REL } = useAsyncData('/data/dia_relations.json');
  const { data: DIA_WORKS } = useAsyncData('/data/dia_works.json');
  const { data: DIA_TRAVEL } = useAsyncData('/data/dia_travel.json');
  const { data: DIA_XREF } = useAsyncData('/data/dia_alam_xref.json');
  const { data: DIA_GEO } = useAsyncData('/data/dia_geo.json');

  const DIA_BY_ID = useMemo(() => DIA_LITE ? buildLookup(DIA_LITE) : {}, [DIA_LITE]);
  const STATS = useMemo(() => DIA_LITE ? buildStats(DIA_LITE) : { total:0, withDate:0, withMadhab:0, withFields:0, totalWorks:0 }, [DIA_LITE]);

  const [search, setSearch] = useState('');
  const [selectedFields, setSelectedFields] = useState(new Set());
  const [selectedMadhab, setSelectedMadhab] = useState('');
  const [centuryRange, setCenturyRange] = useState([7, 21]);
  const [importanceTier, setImportanceTier] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [subView, setSubView] = useState('list');
  const [showMobile, setShowMobile] = useState('list');
  const [mapColorBy, setMapColorBy] = useState('field');

  if (dataLoading || !DIA_LITE) return <LazyLoader message={td.loading || 'DİA verileri yükleniyor'} />;
  if (dataError) return <LazyLoader error={dataError} onRetry={() => window.location.reload()} />;

  const filtered = useMemo(() => {
    let arr = DIA_LITE;
    const [cMin, cMax] = centuryRange;
    arr = arr.filter(b => { const c = getCentury(b.dc); return !c || (c >= cMin && c <= cMax); });
    if (selectedFields.size > 0) arr = arr.filter(b => b.fl && b.fl.some(f => selectedFields.has(f)));
    if (selectedMadhab) arr = arr.filter(b => b.mz === selectedMadhab);
    if (importanceTier === 'important') arr = arr.filter(b => (b.is || 0) > 50);
    else if (importanceTier === 'top') arr = arr.filter(b => (b.is || 0) > 70);
    if (search && search.length >= 2) {
      const q = normalize(search);
      arr = arr.filter(b =>
        normalize(b.t).includes(q) || normalize(b.ar).includes(q) ||
        normalize(b.fn).includes(q) || normalize(b.ds).includes(q));
    }
    return arr;
  }, [DIA_LITE, search, selectedFields, selectedMadhab, centuryRange, importanceTier]);

  const handleSelect = useCallback((id) => { setSelectedId(id); setShowMobile('card'); }, []);

  /* Deep link: #dia/slug */
  const handleDeepLink = useCallback(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#dia/')) {
      const slug = hash.replace('#dia/', '').split('?')[0];
      if (DIA_BY_ID[slug]) setSelectedId(slug);
    }
  }, [DIA_BY_ID]);
  useMemo(() => { handleDeepLink(); }, [handleDeepLink]);

  const selectedBio = selectedId ? DIA_BY_ID[selectedId] : null;

  const degreeMap = useMemo(() => {
    if (!DIA_REL) return {};
    const deg = {};
    DIA_REL.ts.forEach(([s, t]) => { deg[s] = (deg[s] || 0) + 1; deg[t] = (deg[t] || 0) + 1; });
    return deg;
  }, [DIA_REL]);

  /* Navigate to el-A'lâm tab */
  const navigateToAlam = useCallback((alamId) => {
    window.location.hash = `alam?id=${alamId}`;
  }, []);

  return (
    <div className="dia-view">
      <div className="dia-header">
        <div className="dia-header-info">
          <h2 className="dia-title">{td.title || 'DİA Biyografi Veritabanı'}</h2>
          <span className="dia-subtitle">{td.sub || 'TDV İslam Ansiklopedisi • 8.528 Biyografi'}</span>
        </div>
        <div className="dia-header-stats">
          <span className="dia-stat"><strong>{STATS.total.toLocaleString()}</strong> {td.totalBio || 'biyografi'}</span>
          <span className="dia-stat-sep">·</span>
          <span className="dia-stat"><strong>{DIA_REL?.meta?.ts_count?.toLocaleString() || '—'}</strong> {td.tsEdges || 'hoca-talebe'}</span>
          <span className="dia-stat-sep">·</span>
          <span className="dia-stat"><strong>{STATS.totalWorks.toLocaleString()}</strong> {td.totalWorks || 'eser'}</span>
        </div>
        <div className="dia-view-toggle">
          <button className={`dia-view-btn${subView === 'list' ? ' active' : ''}`} onClick={() => setSubView('list')}>📋 {td.listView || 'Liste'}</button>
          <button className={`dia-view-btn${subView === 'map' ? ' active' : ''}`} onClick={() => setSubView('map')}>🗺 {td.mapView || 'Harita'}</button>
          <button className={`dia-view-btn${subView === 'network' ? ' active' : ''}`} onClick={() => setSubView('network')}>🕸 {td.networkView || 'Ağ'}</button>
          <button className={`dia-view-btn${subView === 'analytics' ? ' active' : ''}`} onClick={() => setSubView('analytics')}>📊 {td.analyticsView || 'Analitik'}</button>
        </div>
      </div>

      <div className="dia-mobile-toggle">
        <button className={showMobile === 'list' ? 'active' : ''} onClick={() => setShowMobile('list')}>☰ {td.tabList || 'Liste'}</button>
        <button className={showMobile === 'main' ? 'active' : ''} onClick={() => setShowMobile('main')}>
          {subView === 'network' ? '🕸' : subView === 'analytics' ? '📊' : '📋'}
        </button>
        {selectedBio && <button className={showMobile === 'card' ? 'active' : ''} onClick={() => setShowMobile('card')}>📋 {td.tabDetail || 'Detay'}</button>}
      </div>

      <div className="dia-body">
        <div className={`dia-sidebar${showMobile === 'list' ? ' mobile-visible' : ''}`}>
          <DiaSidebar lang={lang} td={td} filtered={filtered}
            search={search} setSearch={setSearch}
            selectedFields={selectedFields} setSelectedFields={setSelectedFields}
            selectedMadhab={selectedMadhab} setSelectedMadhab={setSelectedMadhab}
            centuryRange={centuryRange} setCenturyRange={setCenturyRange}
            importanceTier={importanceTier} setImportanceTier={setImportanceTier}
            selectedId={selectedId} onSelect={handleSelect}
            fieldsList={FIELDS_LIST} madhabs={MADHABS} degreeMap={degreeMap} />
        </div>

        <div className={`dia-main-area${showMobile === 'main' ? ' mobile-visible' : ''}`}>
          {subView === 'list' ? (
            <div className="dia-list-main">
              <DiaStatsPanel lang={lang} td={td} data={DIA_LITE} filtered={filtered} stats={STATS} relMeta={DIA_REL?.meta} />
            </div>
          ) : subView === 'map' ? (
            <Suspense fallback={<LazyLoader message={td.loadingMap || 'Harita yükleniyor'} />}>
              <DiaMap lang={lang} td={td} data={DIA_LITE} geoData={DIA_GEO} lookup={DIA_BY_ID} filtered={filtered} onSelect={handleSelect} selectedId={selectedId} colorBy={mapColorBy} />
            </Suspense>
          ) : subView === 'network' ? (
            <Suspense fallback={<LazyLoader message={td.loadingNetwork || 'Ağ yükleniyor'} />}>
              <DiaNetwork lang={lang} td={td} data={DIA_LITE} relations={DIA_REL} lookup={DIA_BY_ID} filtered={filtered} onSelect={handleSelect} selectedId={selectedId} />
            </Suspense>
          ) : (
            <Suspense fallback={<LazyLoader message={td.loadingAnalytics || 'Analitik yükleniyor'} />}>
              <DiaAnalytics lang={lang} td={td} data={DIA_LITE} filtered={filtered} relations={DIA_REL} lookup={DIA_BY_ID} />
            </Suspense>
          )}
        </div>

        <div className={`dia-card-area${showMobile === 'card' ? ' mobile-visible' : ''}${selectedBio ? ' has-selection' : ''}`}>
          <DiaIdCard lang={lang} td={td} bio={selectedBio}
            works={DIA_WORKS} relations={DIA_REL} lookup={DIA_BY_ID}
            travel={DIA_TRAVEL} xref={DIA_XREF}
            onClose={() => setSelectedId(null)} onNavigate={handleSelect}
            onNavigateAlam={navigateToAlam} />
        </div>
      </div>

      <div className="dia-source">{td.source || 'Kaynak: TDV İslam Ansiklopedisi (islamansiklopedisi.org.tr)'}</div>
    </div>
  );
}

export { normalize as diaNormalize, getCentury, FIELDS_LIST, MADHABS };
