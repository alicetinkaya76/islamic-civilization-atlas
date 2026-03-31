import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import DarpSidebar from './DarpSidebar';
import DarpMap from './DarpMap';
import DarpIdCard from './DarpIdCard';
import DarpStatsPanel from './DarpStatsPanel';
import SkeletonLoader from '../shared/SkeletonLoader';
import '../../styles/darpislam.css';

const DarpAnalytics = lazy(() => import('./DarpAnalytics'));

/* ═══ Quality tier definitions ═══ */
const QUALITY_TIERS = {
  tier1: { min: 2, minSources: 2 }, // darbiyatlı + çoklu kaynak
  tier2: { min: 1, minSources: 1 }, // darbiyatlı + tek kaynak
  tier3: { min: 0, minSources: 0 }, // gazetteer (sadece konum)
};

function getMintTier(m) {
  const em = m.emission_count || 0;
  const src = (m.sources || []).length;
  if (em > 0 && src >= 2) return 1;
  if (em > 0) return 2;
  return 3;
}

export default function DarpView({ lang = 'tr', t: parentT, isMobile = false, initialSearch }) {
  const [mints, setMints] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMint, setSelectedMint] = useState(null);
  const [mintDetail, setMintDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [qualityFilter, setQualityFilter] = useState('verified'); // 'verified' | 'all'
  const [filters, setFilters] = useState({
    search: initialSearch || '',
    region: '',
    metal: '',
    dynasty: '',
    yearRange: [null, null],
    source: '',
    minEmissions: 0,
  });
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [mapCenter, setMapCenter] = useState([33, 45]);
  const [mapZoom, setMapZoom] = useState(4);

  /* Sync search from URL hash param */
  useEffect(() => {
    if (initialSearch) setFilters(f => ({ ...f, search: initialSearch }));
  }, [initialSearch]);

  const t = (tr, en) => lang === 'tr' ? tr : en;

  // Load lite data
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/darpislam_lite.json`)
      .then(r => r.json())
      .then(data => {
        // Attach tier to each mint
        const mintsWithTier = (data.mints || []).map(m => ({
          ...m,
          tier: getMintTier(m)
        }));
        setMints(mintsWithTier);
        setMetadata(data.metadata || null);
        setLoading(false);
      })
      .catch(err => {
        console.error('DarpIslam data load error:', err);
        setLoading(false);
      });
  }, []);

  // Load detail on mint selection
  useEffect(() => {
    if (!selectedMint) { setMintDetail(null); return; }
    const chunkId = Math.floor((selectedMint.id - 1) / 500);
    setDetailLoading(true);
    fetch(`${import.meta.env.BASE_URL}data/darpislam_detail_${chunkId}.json`)
      .then(r => r.json())
      .then(chunk => {
        setMintDetail(chunk[String(selectedMint.id)] || null);
        setDetailLoading(false);
      })
      .catch(() => {
        setMintDetail(null);
        setDetailLoading(false);
      });
  }, [selectedMint]);

  // Quality-filtered base mints
  const qualityMints = useMemo(() => {
    if (qualityFilter === 'all') return mints;
    return mints.filter(m => m.tier <= 2); // Only mints with emissions
  }, [mints, qualityFilter]);

  // Unique values for filters (from quality-filtered set)
  const filterOptions = useMemo(() => {
    const regions = new Set();
    const metals = new Set();
    const dynasties = new Set();
    const sources = new Set();
    qualityMints.forEach(m => {
      if (m.region_tr) regions.add(lang === 'tr' ? m.region_tr : m.region_en);
      (m.metals || []).forEach(mt => metals.add(mt));
      (m.dynasties || []).forEach(d => dynasties.add(d));
      (m.sources || []).forEach(s => sources.add(s));
    });
    return {
      regions: [...regions].sort(),
      metals: [...metals].sort(),
      dynasties: [...dynasties].sort(),
      sources: [...sources].sort(),
    };
  }, [qualityMints, lang]);

  // Filtered mints
  const filteredMints = useMemo(() => {
    return qualityMints.filter(m => {
      const { search, region, metal, dynasty, yearRange, source, minEmissions } = filters;
      if (search) {
        const q = search.toLowerCase();
        const nameMatch = (m.name_tr || '').toLowerCase().includes(q)
          || (m.name_en || '').toLowerCase().includes(q)
          || (m.name_ar || '').includes(q);
        if (!nameMatch) return false;
      }
      if (region) {
        const r = lang === 'tr' ? m.region_tr : m.region_en;
        if (r !== region) return false;
      }
      if (metal && !(m.metals || []).includes(metal)) return false;
      if (dynasty && !(m.dynasties || []).some(d => d.includes(dynasty))) return false;
      if (source && !(m.sources || []).includes(source)) return false;
      if (minEmissions > 0 && (m.emission_count || 0) < minEmissions) return false;
      if (yearRange[0] != null && (m.year_min == null || m.year_max < yearRange[0])) return false;
      if (yearRange[1] != null && (m.year_max == null || m.year_min > yearRange[1])) return false;
      return true;
    });
  }, [qualityMints, filters, lang]);

  // Stats for quality toggle
  const tierCounts = useMemo(() => ({
    verified: mints.filter(m => m.tier <= 2).length,
    all: mints.length,
    tier1: mints.filter(m => m.tier === 1).length,
    tier2: mints.filter(m => m.tier === 2).length,
    tier3: mints.filter(m => m.tier === 3).length,
  }), [mints]);

  const handleMintSelect = (mint) => {
    setSelectedMint(mint);
    if (mint?.lat && mint?.lng) {
      setMapCenter([mint.lat, mint.lng]);
      setMapZoom(8);
    }
    if (isMobile) setSidebarOpen(false);
  };

  if (loading) return <SkeletonLoader type="map" />;

  return (
    <div className="darp-view">
      {/* Header */}
      <div className="darp-header">
        <div className="darp-header-left">
          {isMobile && (
            <button className="darp-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              ☰
            </button>
          )}
          <h2 className="darp-title">
            🪙 {t('İslam Darphaneleri', 'Islamic Mints')}
          </h2>
          <span className="darp-count">
            {filteredMints.length.toLocaleString()} / {qualityMints.length.toLocaleString()} {t('darphane', 'mints')}
          </span>
        </div>
        <div className="darp-header-right">
          {/* Quality toggle */}
          <div className="darp-quality-toggle">
            <button
              className={`darp-quality-btn ${qualityFilter === 'verified' ? 'active' : ''}`}
              onClick={() => setQualityFilter('verified')}
              title={t(
                `Darbiyat kayıtlı darphaneler (${tierCounts.verified})`,
                `Mints with emission records (${tierCounts.verified})`
              )}
            >
              ⭐ {t('Doğrulanmış', 'Verified')} ({tierCounts.verified})
            </button>
            <button
              className={`darp-quality-btn ${qualityFilter === 'all' ? 'active' : ''}`}
              onClick={() => setQualityFilter('all')}
              title={t(
                `Gazetteer kayıtları dahil tümü (${tierCounts.all})`,
                `All including gazetteer entries (${tierCounts.all})`
              )}
            >
              🌐 {t('Tümü', 'All')} ({tierCounts.all})
            </button>
          </div>
          <button
            className={`darp-analytics-btn ${showAnalytics ? 'active' : ''}`}
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            📊 {t('İstatistikler', 'Analytics')}
          </button>
        </div>
      </div>

      <div className="darp-content">
        {/* Sidebar */}
        {sidebarOpen && (
          <DarpSidebar
            mints={filteredMints}
            filters={filters}
            setFilters={setFilters}
            filterOptions={filterOptions}
            selectedMint={selectedMint}
            onSelect={handleMintSelect}
            lang={lang}
            isMobile={isMobile}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        {/* Main area */}
        <div className="darp-main">
          {showAnalytics ? (
            <Suspense fallback={<SkeletonLoader type="chart" />}>
              <DarpAnalytics
                mints={qualityMints}
                filteredMints={filteredMints}
                metadata={metadata}
                lang={lang}
              />
            </Suspense>
          ) : (
            <>
              <DarpMap
                mints={filteredMints}
                selectedMint={selectedMint}
                onSelect={handleMintSelect}
                center={mapCenter}
                zoom={mapZoom}
                lang={lang}
              />
              {!selectedMint && (
                <DarpStatsPanel
                  mints={filteredMints}
                  metadata={metadata}
                  lang={lang}
                />
              )}
            </>
          )}

          {/* Detail Card */}
          {selectedMint && (
            <DarpIdCard
              mint={selectedMint}
              detail={mintDetail}
              loading={detailLoading}
              lang={lang}
              onClose={() => setSelectedMint(null)}
              isMobile={isMobile}
            />
          )}
        </div>
      </div>
    </div>
  );
}
