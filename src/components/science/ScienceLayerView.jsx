/**
 * ScienceLayerView.jsx — islamicatlas.org Science Layer (v7.4.0.0 / O8)
 *
 * Orchestrator: wires B1–B7 together
 *   • Route popup (RoutePopup.jsx)
 *   • Route highlight state (highlightedRouteId)
 *   • Scholar↔Route cross-ref navigation
 *   • Renaissance Story mode (B6)
 *   • Updated i18n with 200 scholars, 24 routes
 *
 * Props:  lang, t (from App.jsx — same as all views)
 */

import { useState, useMemo, useCallback, useEffect, Component } from 'react';
import useAsyncData from '../../hooks/useAsyncData.jsx';
import SkeletonLoader from '../shared/SkeletonLoader';
import ScienceLayerMap from './ScienceLayerMap';
import ScienceLayerSidebar from './ScienceLayerSidebar';
import DiscoveryTimeline from './DiscoveryTimeline';
import ScholarPopup from './ScholarPopup';
import InstitutionPopup from './InstitutionPopup';
import RoutePopup from './RoutePopup';
import ScienceLayerAbout from './ScienceLayerAbout';
import RenaissanceStory from './RenaissanceStory';
import '../../styles/science.css';

/* ═══ Error Boundary ═══ */
class ScienceErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('ScienceLayerView error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--cream2)' }}>
          <h3>⚠️ Bir hata oluştu</h3>
          <p style={{ color: 'var(--danger)', fontSize: 12, fontFamily: 'monospace' }}>{String(this.state.error)}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 16, padding: '8px 16px', background: 'var(--gold)', color: 'var(--bg)', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            Tekrar Dene / Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ═══ i18n labels ═══ */
const SCI_T = {
  tr: {
    title: 'İslam Bilim Atlası',
    sub: '182 alim · 37 kurum · 129 keşif · 24 güzergâh',
    loading: 'Bilim Katmanı yükleniyor…',
    scholars: 'alim', institutions: 'kurum', discoveries: 'keşif', routes: 'güzergâh',
    timeline: 'Keşif Zaman Çizelgesi',
    toggleTimeline: 'Zaman Çizelgesi',
    toggleSidebar: 'Kenar Çubuğu',
    toggleAbout: 'Hakkında',
    source: 'Kaynaklar: DİA (%100), el-A\'lâm (%88), EI-1 (Brill)',
    female: 'Kadın Alimler',
    male: 'Erkek Alimler',
    all: 'Tümü',
  },
  en: {
    title: 'Islamic Science Atlas',
    sub: '182 scholars · 37 institutions · 129 discoveries · 24 routes',
    loading: 'Loading Science Layer…',
    scholars: 'scholars', institutions: 'institutions', discoveries: 'discoveries', routes: 'routes',
    timeline: 'Discovery Timeline',
    toggleTimeline: 'Timeline',
    toggleSidebar: 'Sidebar',
    toggleAbout: 'About',
    source: 'Sources: DİA (100%), al-Aʿlām (88%), EI-1 (Brill)',
    female: 'Women Scholars',
    male: 'Male Scholars',
    all: 'All',
  },
  ar: {
    title: 'أطلس العلوم الإسلامية',
    sub: '١٨٢ عالم · ٣٧ مؤسسة · ١٢٩ اكتشاف · ٢٤ مسار',
    loading: 'جاري التحميل…',
    scholars: 'عالم', institutions: 'مؤسسة', discoveries: 'اكتشاف', routes: 'مسار',
    timeline: 'الخط الزمني للاكتشافات',
    toggleTimeline: 'الخط الزمني',
    toggleSidebar: 'الشريط الجانبي',
    toggleAbout: 'حول',
    source: 'المصادر: موسوعة الإسلام التركية (١٠٠٪)، الأعلام (٨٨٪)، دائرة المعارف الإسلامية',
    female: 'العالمات',
    male: 'العلماء',
    all: 'الكل',
  },
};

/* ═══ Field → colour map (matches SVG icon set) ═══ */
export const FIELD_COLORS = {
  mathematics: '#3b82f6', astronomy: '#6366f1', medicine: '#10b981',
  optics: '#06b6d4', chemistry: '#f59e0b', geography: '#84cc16',
  philosophy: '#8b5cf6', engineering: '#f97316', natural_sciences: '#14b8a6',
  religious_sciences: '#c8a45e', social_sciences: '#ec4899', translation: '#a855f7',
  literature: '#a855f7', history: '#c8a45e', theology: '#c8a45e',
  education: '#c8a45e', physics: '#06b6d4', navigation: '#84cc16',
  architecture: '#f97316', music: '#ec4899', culture: '#ec4899',
  political_science: '#ec4899', bibliography: '#a855f7', printing: '#f97316',
  linguistics: '#60a5fa',
};

/* ═══ Field display names ═══ */
export const FIELD_NAMES = {
  mathematics:       { en: 'Mathematics',       tr: 'Matematik',       ar: 'الرياضيات' },
  astronomy:         { en: 'Astronomy',         tr: 'Astronomi',       ar: 'الفلك' },
  medicine:          { en: 'Medicine',          tr: 'Tıp',            ar: 'الطب' },
  optics:            { en: 'Optics',            tr: 'Optik',          ar: 'البصريات' },
  chemistry:         { en: 'Chemistry',         tr: 'Kimya',          ar: 'الكيمياء' },
  geography:         { en: 'Geography',         tr: 'Coğrafya',       ar: 'الجغرافيا' },
  philosophy:        { en: 'Philosophy',        tr: 'Felsefe',        ar: 'الفلسفة' },
  engineering:       { en: 'Engineering',       tr: 'Mühendislik',    ar: 'الهندسة' },
  natural_sciences:  { en: 'Natural Sciences',  tr: 'Doğa Bilimleri', ar: 'العلوم الطبيعية' },
  religious_sciences:{ en: 'Religious Sciences', tr: 'Dini İlimler',  ar: 'العلوم الشرعية' },
  social_sciences:   { en: 'Social Sciences',   tr: 'Sosyal Bilimler',ar: 'العلوم الاجتماعية' },
  translation:       { en: 'Translation',       tr: 'Çeviri',         ar: 'الترجمة' },
  literature:        { en: 'Literature',        tr: 'Edebiyat',       ar: 'الأدب' },
  history:           { en: 'History',           tr: 'Tarih',          ar: 'التاريخ' },
  physics:           { en: 'Physics',           tr: 'Fizik',          ar: 'الفيزياء' },
  navigation:        { en: 'Navigation',        tr: 'Denizcilik',     ar: 'الملاحة' },
  architecture:      { en: 'Architecture',      tr: 'Mimari',         ar: 'العمارة' },
  culture:           { en: 'Culture',           tr: 'Kültür',         ar: 'الثقافة' },
  political_science: { en: 'Political Science', tr: 'Siyaset Bilimi', ar: 'العلوم السياسية' },
  bibliography:      { en: 'Bibliography',      tr: 'Bibliyografya',  ar: 'الببليوغرافيا' },
  printing:          { en: 'Printing',          tr: 'Matbaa',         ar: 'الطباعة' },
  linguistics:       { en: 'Linguistics',       tr: 'Dilbilim',       ar: 'اللسانيات' },
  music:             { en: 'Music',             tr: 'Müzik',          ar: 'الموسيقى' },
};

/* ═══ Period definitions ═══ */
export const PERIODS = [
  { id: 'umayyads',  label: { en: 'Umayyads',  tr: 'Emevîler',    ar: 'الأمويون' },    range: '661–750',  color: '#22c55e' },
  { id: 'goldenage', label: { en: 'Abbasids', tr: 'Abbâsîler',   ar: 'العباسيون' }, range: '750–1258', color: '#f59e0b' },
  { id: 'seljuks',   label: { en: 'Seljuks',    tr: 'Selçuklular', ar: 'السلاجقة' },     range: '1037–1194',color: '#3b82f6' },
  { id: 'andalusia', label: { en: 'Andalusia',  tr: 'Endülüs',     ar: 'الأندلس' },      range: '711–1492', color: '#ef4444' },
  { id: 'ayyubids',  label: { en: 'Ayyubids',   tr: 'Eyyûbîler',   ar: 'الأيوبيون' },    range: '1171–1260',color: '#6366f1' },
  { id: 'mamluks',   label: { en: 'Mamluks',    tr: 'Memlükler',   ar: 'المماليك' },     range: '1250–1517',color: '#ec4899' },
  { id: 'ottomans',  label: { en: 'Ottomans',   tr: 'Osmanlılar',  ar: 'العثمانيون' },   range: '1299–1922',color: '#14b8a6' },
];

/* ═══ helpers ═══ */
const collectPrimaryFields = (scholars) => {
  const freq = {};
  scholars.forEach(s => { freq[s.primary_field] = (freq[s.primary_field] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([f]) => f);
};

/* ═══ Inner view (after data loaded) ═══ */
function ScienceViewInner({ lang, rawData }) {
  const tr = SCI_T[lang] || SCI_T.tr;
  const isRTL = lang === 'ar';

  const scholars         = useMemo(() => rawData?.scholars || [], [rawData]);
  const institutions     = useMemo(() => rawData?.institutions || [], [rawData]);
  const discoveries      = useMemo(() => rawData?.discoveries || [], [rawData]);
  const knowledgeRoutes  = useMemo(() => rawData?.knowledge_routes || [], [rawData]);
  const primaryFields    = useMemo(() => collectPrimaryFields(scholars), [scholars]);

  /* ── State ── */
  const [selectedFields, setSelectedFields]   = useState(new Set());
  const [selectedPeriods, setSelectedPeriods] = useState(new Set());
  const [searchQuery, setSearchQuery]         = useState('');
  const [showMobile, setShowMobile]           = useState('map');
  const [timelineOpen, setTimelineOpen]       = useState(true);
  const [activePopup, setActivePopup]         = useState(null);     // { type, data }
  const [showRoutes, setShowRoutes]           = useState(true);
  const [highlightedId, setHighlightedId]     = useState(null);     // scholar/inst id
  const [highlightedRouteId, setHighlightedRouteId] = useState(null); // route id for map highlight
  const [genderFilter, setGenderFilter]       = useState('all');
  const [aboutOpen, setAboutOpen]             = useState(false);
  const [storyOpen, setStoryOpen]             = useState(false);    // B6

  /* ── Filtered scholars ── */
  const filteredScholars = useMemo(() => {
    return scholars.filter(s => {
      if (genderFilter !== 'all' && s.gender !== genderFilter) return false;
      if (selectedFields.size > 0 && !s.fields.some(f => selectedFields.has(f))) return false;
      if (selectedPeriods.size > 0 && !selectedPeriods.has(s.period)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = Object.values(s.name).some(n => n.toLowerCase().includes(q));
        const fieldMatch = s.fields.some(f => (FIELD_NAMES[f]?.[lang] || f).toLowerCase().includes(q));
        if (!nameMatch && !fieldMatch) return false;
      }
      return true;
    });
  }, [scholars, selectedFields, selectedPeriods, searchQuery, lang, genderFilter]);

  /* ── Filtered institutions ── */
  const filteredInstitutions = useMemo(() => {
    return institutions.filter(inst => {
      if (selectedFields.size > 0 && !inst.fields.some(f => selectedFields.has(f))) return false;
      if (selectedPeriods.size > 0) {
        const matchesPeriod = scholars.some(s =>
          selectedPeriods.has(s.period) && inst.key_scholars?.includes(s.id)
        );
        if (!matchesPeriod) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = Object.values(inst.name).some(n => n.toLowerCase().includes(q));
        const cityMatch = inst.city && Object.values(inst.city).some(c => c.toLowerCase().includes(q));
        if (!nameMatch && !cityMatch) return false;
      }
      return true;
    });
  }, [institutions, scholars, selectedFields, selectedPeriods, searchQuery]);

  /* ── Filtered discoveries ── */
  const filteredDiscoveries = useMemo(() => {
    const visibleIds = new Set(filteredScholars.map(s => s.id));
    return discoveries.filter(d => {
      if (selectedFields.size > 0 && !selectedFields.has(d.field)) return false;
      if (visibleIds.size > 0 && !visibleIds.has(d.scholar_id)) return false;
      return true;
    });
  }, [discoveries, filteredScholars, selectedFields]);

  /* ── Callbacks ── */
  const handleScholarClick = useCallback((scholar) => {
    setActivePopup({ type: 'scholar', data: scholar });
    setHighlightedId(scholar.id);
    setHighlightedRouteId(null);
  }, []);

  const handleInstitutionClick = useCallback((institution) => {
    setActivePopup({ type: 'institution', data: institution });
    setHighlightedId(institution.id);
    setHighlightedRouteId(null);
  }, []);

  /* ── Close popup also clears route highlight ── */
  const closePopup = useCallback(() => {
    setActivePopup(null);
    setHighlightedRouteId(null);
  }, []);

  const handleRouteClick = useCallback((route) => {
    setActivePopup({ type: 'route', data: route });
    setHighlightedRouteId(route.id);
    setHighlightedId(null);
    // Ensure routes are visible
    setShowRoutes(true);
  }, []);

  const handleDiscoveryClick = useCallback((discovery) => {
    const scholar = scholars.find(s => s.id === discovery.scholar_id);
    if (scholar) {
      setActivePopup({ type: 'scholar', data: scholar });
      setHighlightedId(scholar.id);
    }
  }, [scholars]);

  /* ── Cross-ref: scholar → route (B4) ── */
  const handleRouteFromScholar = useCallback((routeId) => {
    const route = knowledgeRoutes.find(r => r.id === routeId);
    if (route) {
      setActivePopup({ type: 'route', data: route });
      setHighlightedRouteId(route.id);
      setHighlightedId(null);
      setShowRoutes(true);
    }
  }, [knowledgeRoutes]);

  /* ── Cross-ref: route → scholar (B5) ── */
  const handleScholarFromRoute = useCallback((scholarId) => {
    const scholar = scholars.find(s => s.id === scholarId);
    if (scholar) {
      setActivePopup({ type: 'scholar', data: scholar });
      setHighlightedId(scholar.id);
      setHighlightedRouteId(null);
    }
  }, [scholars]);

  const handleCrossRef = useCallback((scholarId) => {
    const scholar = scholars.find(s => s.id === scholarId);
    if (scholar) {
      setActivePopup({ type: 'scholar', data: scholar });
      setHighlightedId(scholar.id);
    }
  }, [scholars]);

  /* ── Story mode (B6) ── */
  const handleStoryMode = useCallback(() => {
    setStoryOpen(true);
    setActivePopup(null);
  }, []);

  const handleStoryRouteClick = useCallback((routeId) => {
    setStoryOpen(false);
    const route = knowledgeRoutes.find(r => r.id === routeId);
    if (route) {
      setActivePopup({ type: 'route', data: route });
      setHighlightedRouteId(route.id);
      setShowRoutes(true);
    }
  }, [knowledgeRoutes]);

  /* ── Cross-view navigation: el-A'lâm + Yâkût (O8) ── */
  const handleNavigateAlam = useCallback((alamId) => {
    // Close science popup, switch to alam view with highlighted entry
    closePopup();
    // Dispatch custom event for App.jsx to handle view switch
    window.dispatchEvent(new CustomEvent('navigateToView', {
      detail: { view: 'alam', entityId: alamId }
    }));
  }, [closePopup]);

  const handleNavigateYaqut = useCallback((yaqutId) => {
    closePopup();
    window.dispatchEvent(new CustomEvent('navigateToView', {
      detail: { view: 'yaqut', entityId: yaqutId }
    }));
  }, [closePopup]);

  const toggleField = useCallback((field) => {
    setSelectedFields(prev => {
      const next = new Set(prev);
      next.has(field) ? next.delete(field) : next.add(field);
      return next;
    });
  }, []);

  const togglePeriod = useCallback((periodId) => {
    setSelectedPeriods(prev => {
      const next = new Set(prev);
      next.has(periodId) ? next.delete(periodId) : next.add(periodId);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedFields(new Set());
    setSelectedPeriods(new Set());
    setSearchQuery('');
    setGenderFilter('all');
  }, []);



  /* ── Esc closes popup ── */
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') closePopup(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [closePopup]);

  /* ── Mobile: hide timeline by default ── */
  useEffect(() => {
    if (window.innerWidth <= 768) setTimelineOpen(false);
  }, []);

  const hasActiveFilters = selectedFields.size > 0 || selectedPeriods.size > 0 || searchQuery.trim() || genderFilter !== 'all';

  /* ── Story mode view (B6) ── */
  if (storyOpen) {
    return (
      <div className="sci-view" dir={isRTL ? 'rtl' : 'ltr'}>
        <RenaissanceStory
          lang={lang}
          onClose={() => setStoryOpen(false)}
          onRouteClick={handleStoryRouteClick}
        />
      </div>
    );
  }

  /* ── About/Dashboard view ── */
  if (aboutOpen) {
    return (
      <div className="sci-view" dir={isRTL ? 'rtl' : 'ltr'}>
        <ScienceLayerAbout
          lang={lang}
          rawData={rawData}
          onClose={() => setAboutOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="sci-view" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Header ── */}
      <div className="sci-header">
        <div className="sci-header-info">
          <h2 className="sci-title">{tr.title}</h2>
          <span className="sci-subtitle">{tr.sub}</span>
        </div>
        <div className="sci-header-stats">
          <span className="sci-stat"><strong>{filteredScholars.length}</strong> {tr.scholars}</span>
          <span className="sci-stat-sep">·</span>
          <span className="sci-stat"><strong>{filteredInstitutions.length}</strong> {tr.institutions}</span>
          <span className="sci-stat-sep">·</span>
          <span className="sci-stat"><strong>{filteredDiscoveries.length}</strong> {tr.discoveries}</span>
        </div>
        <div className="sci-header-actions">
          {/* Gender filter */}
          <div className="sci-gender-filter">
            {['all', 'female', 'male'].map(g => (
              <button
                key={g}
                className={`sci-gender-btn${genderFilter === g ? ' active' : ''}`}
                onClick={() => setGenderFilter(g)}
                title={g === 'all' ? {tr:'Tümü',en:'All',ar:'الكل'}[lang] : g === 'female' ? {tr:'Kadın',en:'Women',ar:'نساء'}[lang] : {tr:'Erkek',en:'Men',ar:'رجال'}[lang]}
              >
                {g === 'all' ? {tr:'Tümü',en:'All',ar:'الكل'}[lang] : g === 'female' ? {tr:'Kadın',en:'Women',ar:'نساء'}[lang] : {tr:'Erkek',en:'Men',ar:'رجال'}[lang]}
              </button>
            ))}
          </div>
          <button
            className={`sci-toggle-btn${timelineOpen ? ' active' : ''}`}
            onClick={() => setTimelineOpen(v => !v)}
            title={tr.toggleTimeline}
          >⏱</button>
          <button
            className="sci-toggle-btn"
            onClick={() => setAboutOpen(true)}
            title={tr.toggleAbout}
          >ℹ️</button>
        </div>
      </div>

      {/* ── Mobile toggle ── */}
      <div className="sci-mobile-toggle">
        <button className={showMobile === 'list' ? 'active' : ''} onClick={() => setShowMobile('list')}>☰ Liste</button>
        <button className={showMobile === 'map' ? 'active' : ''} onClick={() => setShowMobile('map')}>🗺 Harita</button>
      </div>

      {/* ── Body: sidebar + map ── */}
      <div className="sci-body">
        <div className={`sci-sidebar${showMobile === 'list' ? ' mobile-visible' : ''}`}>
          <ScienceLayerSidebar
            lang={lang}
            primaryFields={primaryFields}
            selectedFields={selectedFields}
            selectedPeriods={selectedPeriods}
            searchQuery={searchQuery}
            filteredScholars={filteredScholars}
            filteredInstitutions={filteredInstitutions}
            knowledgeRoutes={knowledgeRoutes}
            showRoutes={showRoutes}
            hasActiveFilters={hasActiveFilters}
            highlightedRouteId={highlightedRouteId}
            onToggleField={toggleField}
            onTogglePeriod={togglePeriod}
            onSearchChange={setSearchQuery}
            onClearFilters={clearFilters}
            onScholarClick={handleScholarClick}
            onInstitutionClick={handleInstitutionClick}
            onToggleRoutes={() => setShowRoutes(v => !v)}
            onRouteClick={handleRouteClick}
          />
        </div>

        <div className={`sci-map-area${showMobile === 'map' ? ' mobile-visible' : ''}`}>
          <ScienceLayerMap
            lang={lang}
            scholars={filteredScholars}
            institutions={filteredInstitutions}
            knowledgeRoutes={showRoutes ? knowledgeRoutes : []}
            highlightedId={highlightedId}
            highlightedRouteId={highlightedRouteId}
            onScholarClick={handleScholarClick}
            onInstitutionClick={handleInstitutionClick}
            onRouteClick={handleRouteClick}
          />
        </div>
      </div>

      {/* ── Timeline ── */}
      {timelineOpen && filteredDiscoveries.length > 0 && (
        <DiscoveryTimeline
          lang={lang}
          discoveries={filteredDiscoveries}
          scholars={scholars}
          onDiscoveryClick={handleDiscoveryClick}
          onClose={() => setTimelineOpen(false)}
        />
      )}

      {/* ── Popup overlay ── */}
      {activePopup && (
        <div className="sci-popup-overlay" onClick={closePopup}>
          <div className="sci-popup-anchor" onClick={e => e.stopPropagation()}>
            {activePopup.type === 'scholar' ? (
              <ScholarPopup
                scholar={activePopup.data}
                lang={lang}
                onClose={closePopup}
                onScholarClick={handleCrossRef}
                onRouteClick={handleRouteFromScholar}
                onNavigateAlam={handleNavigateAlam}
                onNavigateYaqut={handleNavigateYaqut}
                allScholars={scholars}
                allInstitutions={institutions}
                allDiscoveries={discoveries}
                allRoutes={knowledgeRoutes}
              />
            ) : activePopup.type === 'route' ? (
              <RoutePopup
                route={activePopup.data}
                lang={lang}
                onClose={closePopup}
                onScholarClick={handleScholarFromRoute}
                allScholars={scholars}
                onStoryMode={handleStoryMode}
              />
            ) : (
              <InstitutionPopup
                institution={activePopup.data}
                lang={lang}
                onClose={closePopup}
                onScholarClick={handleCrossRef}
                allScholars={scholars}
              />
            )}
          </div>
        </div>
      )}

      <div className="sci-source">{tr.source}</div>
    </div>
  );
}

/* ═══ Wrapper with data loading + error boundary ═══ */
export default function ScienceLayerView({ lang }) {
  const tr = SCI_T[lang] || SCI_T.tr;
  const { data: rawData, loading, error } = useAsyncData('/data/science_layer.json');

  if (loading || !rawData) return <SkeletonLoader variant="list" rows={10} message={tr.loading} />;
  if (error) return (
    <div className="skeleton-loader" style={{ textAlign: 'center', padding: 40 }}>
      <p style={{ color: 'var(--danger)', fontSize: 13 }}>{String(error.message || error)}</p>
      <button onClick={() => window.location.reload()}
        style={{ marginTop: 12, padding: '8px 20px', background: 'var(--gold)', color: 'var(--bg)', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
        Tekrar dene / Retry
      </button>
    </div>
  );

  return (
    <ScienceErrorBoundary lang={lang}>
      <ScienceViewInner lang={lang} rawData={rawData} />
    </ScienceErrorBoundary>
  );
}
