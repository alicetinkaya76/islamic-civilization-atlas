import { useState, useEffect, useMemo, useCallback } from 'react';
import useAsyncData from '../../hooks/useAsyncData.jsx';
import SkeletonLoader from '../shared/SkeletonLoader';
import KhitatSidebar from './KhitatSidebar';
import KhitatMap from './KhitatMap';
import KhitatIdCard from './KhitatIdCard';
import KhitatStats from './KhitatStats';
import '../../styles/khitat.css';
import T from '../../data/i18n';

/* ═══ Arabic + Turkish + Latin tolerant normalize ═══ */
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
function buildStats(data) {
  const cats = {}, dyns = {};
  let geocoded = 0, dated = 0;
  data.forEach(s => {
    cats[s.cat] = (cats[s.cat] || 0) + 1;
    if (s.lat != null) geocoded++;
    if (s.ah) dated++;
    if (s.dy_tr) dyns[s.dy_tr] = (dyns[s.dy_tr] || 0) + 1;
  });
  return { total: data.length, geocoded, dated, cats, dyns };
}

/* Session mapping */
const SESSIONS = [
  { id: 1, cats: ['mosque'] },
  { id: 2, cats: ['madrasa', 'maristan', 'masjid', 'khanqah', 'zawiya', 'ribat', 'shrine'] },
  { id: 3, cats: ['dar', 'hammam', 'qaysariyya', 'khan', 'suq'] },
  { id: 4, cats: ['qantara', 'birka', 'jisr', 'jazira', 'sijn', "sina'a", 'maydan', "qal'a", 'hikr'] },
  { id: 5, cats: ['mashhad', 'maqbara', 'masjid_qarafa', 'jawsaq', 'ribat_qarafa', 'musalla', 'masjid_jabal', "bi'r", 'kanisa_yahud', 'dayr', 'kanisa'] },
];

function getSession(cat) {
  for (const s of SESSIONS) {
    if (s.cats.includes(cat)) return s.id;
  }
  return 0;
}

export default function KhitatView({ lang, t: tProp, initialSearch }) {
  const t = tProp || T[lang];
  const tk = t.khitat || {};

  /* ═══ Async data ═══ */
  const { data: raw, loading, error } = useAsyncData('/data/maqrizi_khitat_atlas_layer.json');

  /* ═══ State ═══ */
  const [search, setSearch] = useState(initialSearch || '');
  const [selectedCats, setSelectedCats] = useState(new Set());
  const [selectedSession, setSelectedSession] = useState(0); // 0 = all
  const [selectedStatus, setSelectedStatus] = useState('');
  const [dateRange, setDateRange] = useState([0, 900]);
  const [selectedId, setSelectedId] = useState(null);
  const [subView, setSubView] = useState('map'); // 'map' | 'stats'
  const [showMobile, setShowMobile] = useState('list');
  const [sortBy, setSortBy] = useState('id'); // 'id' | 'date' | 'cat' | 'name'

  /* Sync search from URL hash param */
  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);


  const structures = raw?.structures || [];
  const catMeta = raw?.categories || {};

  /* ═══ All categories sorted by count ═══ */
  const allCats = useMemo(() => {
    const counts = {};
    structures.forEach(s => { counts[s.cat] = (counts[s.cat] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => ({ cat, count, ...(catMeta[cat] || { tr: cat, en: cat, icon: '📍', color: '#999' }) }));
  }, [structures, catMeta]);

  /* ═══ Filter ═══ */
  const filtered = useMemo(() => {
    let arr = structures;

    // Session filter
    if (selectedSession > 0) {
      const sessCats = SESSIONS.find(s => s.id === selectedSession)?.cats || [];
      arr = arr.filter(s => sessCats.includes(s.cat));
    }

    // Category filter
    if (selectedCats.size > 0) {
      arr = arr.filter(s => selectedCats.has(s.cat));
    }

    // Status filter
    if (selectedStatus) {
      arr = arr.filter(s => s.st === selectedStatus);
    }

    // Date range (hijri)
    const [dMin, dMax] = dateRange;
    if (dMin > 0 || dMax < 900) {
      arr = arr.filter(s => {
        if (!s.ah) return true;
        return s.ah >= dMin && s.ah <= dMax;
      });
    }

    // Search
    if (search && search.length >= 2) {
      const q = normalize(search);
      arr = arr.filter(s =>
        normalize(s.ar).includes(q) ||
        normalize(s.tr).includes(q) ||
        normalize(s.en).includes(q) ||
        normalize(s.f_ar).includes(q) ||
        normalize(s.gz).includes(q)
      );
    }

    return arr;
  }, [structures, search, selectedCats, selectedSession, selectedStatus, dateRange]);

  /* ═══ Sort ═══ */
  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === 'date') arr.sort((a, b) => (a.ah || 9999) - (b.ah || 9999));
    else if (sortBy === 'cat') arr.sort((a, b) => a.cat.localeCompare(b.cat));
    else if (sortBy === 'name') arr.sort((a, b) => a.ar.localeCompare(b.ar));
    else arr.sort((a, b) => a.id - b.id);
    return arr;
  }, [filtered, sortBy]);

  /* ═══ Geocoded subset ═══ */
  const geocoded = useMemo(() => sorted.filter(s => s.lat != null), [sorted]);

  /* ═══ Stats ═══ */
  const stats = useMemo(() => buildStats(structures), [structures]);

  /* ═══ Handlers ═══ */
  const handleSelect = useCallback((id) => {
    setSelectedId(id);
    setShowMobile('card');
  }, []);

  /* ═══ Guards ═══ */
  if (loading || !raw) return <SkeletonLoader variant="list" rows={10} message={tk.loading || 'el-Hıṭaṭ verileri yükleniyor…'} />;
  if (error) return (
    <div className="skeleton-loader" style={{ textAlign: 'center', padding: 40 }}>
      <p style={{ color: '#ef5350', fontSize: 13 }}>{String(error.message || error)}</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '8px 20px', background: '#1a6b5a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Tekrar dene / Retry</button>
    </div>
  );

  const selectedStruct = selectedId ? structures.find(s => s.id === selectedId) : null;

  return (
    <div className="khitat-view">
      {/* Header bar */}
      <div className="khitat-header">
        <div className="khitat-header-info">
          <h2 className="khitat-title">{tk.title || 'el-Hıṭaṭ'}</h2>
          <span className="khitat-subtitle">{tk.sub || 'Makrîzî — Kâhire Topografyası'}</span>
        </div>
        <div className="khitat-header-stats">
          <span className="khitat-stat"><strong>{stats.total}</strong> {tk.structures || 'yapı'}</span>
          <span className="khitat-stat-sep">·</span>
          <span className="khitat-stat"><strong>{Object.keys(stats.cats).length}</strong> {tk.categories || 'kategori'}</span>
          <span className="khitat-stat-sep">·</span>
          <span className="khitat-stat"><strong>{stats.geocoded}</strong> {tk.geocoded || 'konumlu'}</span>
        </div>
        <div className="khitat-view-toggle">
          <button className={`scholar-view-btn${subView === 'map' ? ' active' : ''}`}
            onClick={() => setSubView('map')}>🗺 {tk.mapView || 'Harita'}</button>
          <button className={`scholar-view-btn${subView === 'stats' ? ' active' : ''}`}
            onClick={() => setSubView('stats')}>📊 {tk.statsView || 'İstatistik'}</button>
        </div>
      </div>

      {/* Mobile toggle */}
      <div className="khitat-mobile-toggle">
        <button className={showMobile === 'list' ? 'active' : ''} onClick={() => setShowMobile('list')}>
          ☰ {tk.tabList || 'Liste'}
        </button>
        <button className={showMobile === 'map' ? 'active' : ''} onClick={() => setShowMobile('map')}>
          🗺 {tk.mapView || 'Harita'}
        </button>
        {selectedStruct && (
          <button className={showMobile === 'card' ? 'active' : ''} onClick={() => setShowMobile('card')}>
            📋 {tk.tabDetail || 'Detay'}
          </button>
        )}
      </div>

      {subView === 'map' ? (
        <div className="khitat-body">
          {/* Left sidebar */}
          <div className={`khitat-sidebar${showMobile === 'list' ? ' mobile-visible' : ''}`}>
            <KhitatSidebar
              lang={lang} tk={tk}
              filtered={sorted}
              search={search} setSearch={setSearch}
              selectedCats={selectedCats} setSelectedCats={setSelectedCats}
              selectedSession={selectedSession} setSelectedSession={setSelectedSession}
              selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus}
              dateRange={dateRange} setDateRange={setDateRange}
              selectedId={selectedId} onSelect={handleSelect}
              allCats={allCats}
              catMeta={catMeta}
              sortBy={sortBy} setSortBy={setSortBy}
            />
          </div>

          {/* Center map */}
          <div className={`khitat-map-area${showMobile === 'map' ? ' mobile-visible' : ''}`}>
            <KhitatMap
              lang={lang} tk={tk}
              data={geocoded}
              catMeta={catMeta}
              selectedId={selectedId}
              selectedStruct={selectedStruct}
              onSelect={handleSelect}
              filtered={sorted}
            />
          </div>

          {/* Right identity card */}
          <div className={`khitat-card-area${showMobile === 'card' ? ' mobile-visible' : ''}${selectedStruct ? ' has-selection' : ''}`}>
            <KhitatIdCard
              lang={lang} tk={tk}
              structure={selectedStruct}
              catMeta={catMeta}
              onClose={() => setSelectedId(null)}
            />
          </div>
        </div>
      ) : (
        <div className="khitat-body khitat-body-col">
          <KhitatStats
            lang={lang} tk={tk}
            data={structures}
            filtered={sorted}
            catMeta={catMeta}
            stats={stats}
          />
        </div>
      )}

      {/* Footer source */}
      <div className="khitat-source">
        {tk.source || 'Takiyyüddin el-Makrîzî, el-Mevâʿiẓ ve&#39;l-İʿtibâr (el-Hıṭaṭ), OpenITI #0845Maqrizi.Mawaciz'}
      </div>
    </div>
  );
}
