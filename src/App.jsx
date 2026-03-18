import { useState, useRef, useCallback, useEffect, Suspense, lazy } from 'react';
import T from './data/i18n';
import LandingPage from './components/landing/LandingPage';
import LazyLoader from './components/shared/LazyLoader';
import MetaTags from './components/shared/MetaTags';
import BottomTabBar from './components/shared/BottomTabBar';
import { preloadData } from './hooks/useAsyncData.jsx';

/* ═══ Lazy-loaded panels — only fetched when their tab is active ═══ */
const AdminPanel    = lazy(() => import('./components/admin/AdminPanel'));
const AlamView      = lazy(() => import('./components/alam/AlamView'));
const YaqutView     = lazy(() => import('./components/yaqut/YaqutView'));
const ScholarView   = lazy(() => import('./components/scholars/ScholarView'));
const QuizMode      = lazy(() => import('./components/QuizMode'));
const BattleView    = lazy(() => import('./components/battles/BattleView'));
const CausalView    = lazy(() => import('./components/causal/CausalView'));
const DiaView       = lazy(() => import('./components/dia/DiaView'));

/* ═══ Eagerly loaded — needed on every page ═══ */
import MapView from './components/map/MapView';
import Dashboard from './components/dashboard/Dashboard';
import TimelineView from './components/timeline/TimelineView';
import Footer from './components/shared/Footer';
import AboutModal from './components/shared/AboutModal';
import GlossaryModal from './components/shared/GlossaryModal';
import SearchBar from './components/shared/SearchBar';
import ProgressTracker, { BadgeToast, useProgress } from './components/shared/ProgressTracker';
import Onboarding from './components/shared/Onboarding';
import ExportButton from './components/shared/ExportButton';

const VALID_TABS = ['map', 'dashboard', 'timeline', 'links', 'scholars', 'battles', 'alam', 'yaqut', 'dia', 'admin'];

/* ═══ Entity types that can be deep-linked ═══ */
const ENTITY_TYPES = ['dynasty', 'battle', 'scholar', 'monument', 'city', 'waqf', 'event', 'ruler', 'madrasa'];

/* Parse hash → { tab, params, entityRoute? }
   Supports:
     #map, #scholars, #alam?search=xyz          — tab routes
     #dynasty/42, #scholar/10, #year/1258       — entity deep links
*/
function parseHash() {
  const h = window.location.hash.replace('#', '');
  if (!h) return null;
  const [path, qs] = h.split('?');
  const segments = path.split('/');
  const first = segments[0];
  const params = {};
  if (qs) qs.split('&').forEach(p => { const [k, v] = p.split('='); if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || ''); });

  // Tab route
  if (VALID_TABS.includes(first)) {
    return { tab: first, params, entityRoute: null };
  }

  // Year deep link: #year/1258
  if (first === 'year' && segments[1]) {
    return { tab: 'map', params, entityRoute: { type: 'year', id: parseInt(segments[1], 10) } };
  }

  // Entity deep link: #dynasty/42, #scholar/10 etc.
  if (ENTITY_TYPES.includes(first) && segments[1]) {
    const id = parseInt(segments[1], 10);
    if (!isNaN(id)) {
      return { tab: 'map', params, entityRoute: { type: first, id } };
    }
  }

  return null;
}

/* Check if landing should show */
function shouldShowLanding() {
  try { return !localStorage.getItem('atlas-visited'); } catch { return true; }
}

export default function App() {
  const [lang, setLang] = useState('tr');
  const [showLanding, setShowLanding] = useState(shouldShowLanding);
  const [tab, setTab] = useState(() => { const h = parseHash(); return h ? h.tab : 'map'; });
  const [entityRoute, setEntityRoute] = useState(() => { const h = parseHash(); return h?.entityRoute || null; });
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const mapRef = useRef(null);
  const t = T[lang];

  /* ═══ Mobile detection (≤768px) ═══ */
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const { progress, recordDiscovery, resetProgress, newBadge, setNewBadge } = useProgress();

  /* ═══ Deeplink: hash → tab + entity sync ═══ */
  useEffect(() => {
    const handler = () => {
      const h = parseHash();
      if (!h) return;
      if (h.tab !== tab) setTab(h.tab);
      setEntityRoute(h.entityRoute || null);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, [tab]);

  /* ═══ On initial load, skip landing if deep link present ═══ */
  useEffect(() => {
    if (entityRoute && showLanding) {
      setShowLanding(false);
      try { localStorage.setItem('atlas-visited', '1'); } catch {}
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectTab = (v) => {
    setTab(v);
    setMenuOpen(false);
    setEntityRoute(null);
    try { window.history.replaceState(null, '', '#' + v); } catch {}
  };

  /* FlyTo handler */
  const handleFlyTo = useCallback(({ lat, lon, zoom }) => {
    if (tab !== 'map') setTab('map');
    setTimeout(() => {
      if (mapRef.current) mapRef.current.flyTo([lat, lon], zoom || 6, { duration: 1.5 });
    }, tab !== 'map' ? 300 : 50);
  }, [tab]);

  /* Search select → flyTo + discovery */
  const handleSearchSelect = useCallback((item) => {
    if (item && item.type) recordDiscovery(item.type, item.obj?.id || item.name_tr);
  }, [recordDiscovery]);

  /* Tour complete → badge */
  const handleTourComplete = useCallback((tourId) => {
    recordDiscovery('tour', tourId);
  }, [recordDiscovery]);

  /* Onboarding check */
  useEffect(() => {
    if (showLanding) return;
    try {
      if (!localStorage.getItem('atlas-onboarded')) setShowOnboarding(true);
    } catch {}
  }, [showLanding]);

  const handleOnboardingDone = useCallback((dontShowAgain) => {
    setShowOnboarding(false);
    if (dontShowAgain) {
      try { localStorage.setItem('atlas-onboarded', '1'); } catch {}
    }
  }, []);

  const resetOnboarding = useCallback(() => {
    try { localStorage.removeItem('atlas-onboarded'); } catch {}
    setShowOnboarding(true);
  }, []);

  const resetLanding = useCallback(() => {
    try { localStorage.removeItem('atlas-visited'); } catch {}
    setShowLanding(true);
  }, []);

  const handleLandingEnter = useCallback(() => {
    setShowLanding(false);
  }, []);

  /* Clear entity route after consumption */
  const clearEntityRoute = useCallback(() => {
    setEntityRoute(null);
  }, []);

  /* Admin Panel — full screen overlay */
  if (tab === 'admin') {
    return (
      <Suspense fallback={<div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0f1419',color:'#c9a84c',fontSize:18 }}>Yükleniyor...</div>}>
        <MetaTags tab="admin" entityRoute={null} lang={lang} />
        <AdminPanel lang={lang} onBack={() => selectTab('map')} />
      </Suspense>
    );
  }

  /* Landing page */
  if (showLanding) {
    return <LandingPage lang={lang} setLang={setLang} onEnter={handleLandingEnter} />;
  }

  return (
    <div className="app" dir={lang === 'ar' ? 'rtl' : 'ltr'} lang={lang}>
      <MetaTags tab={tab} entityRoute={entityRoute} lang={lang} />
      <a href="#main-content" className="skip-link">
        {{ tr: 'İçeriğe geç', en: 'Skip to content', ar: 'انتقل إلى المحتوى' }[lang]}
      </a>
      <header className="header" role="banner">
        <div className="header-left">
          <button className="hamburger" onClick={() => setMenuOpen(p => !p)}
            aria-label={{ tr: 'Menü', en: 'Menu', ar: 'القائمة' }[lang]} aria-expanded={menuOpen}>
            <span className={`hb-line${menuOpen ? ' open' : ''}`} />
            <span className={`hb-line${menuOpen ? ' open' : ''}`} />
            <span className={`hb-line${menuOpen ? ' open' : ''}`} />
          </button>
          {tab === 'map' && (
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(p => !p)}
              aria-label={{ tr: 'Filtreler', en: 'Filters', ar: 'المرشحات' }[lang]}>☰</button>
          )}
          <div className="logo" aria-hidden="true">☪</div>
          <div>
            <h1 className="h-title">{t.title}</h1>
            <p className="h-sub">{t.sub}</p>
          </div>
        </div>
        {/* Mobile search bar */}
        <div className="header-search-mobile">
          <SearchBar lang={lang} onFlyTo={handleFlyTo} onSelectEntity={handleSearchSelect} />
        </div>
        <nav className={`header-right${menuOpen ? ' mobile-open' : ''}`} role="navigation"
          aria-label={{ tr: 'Ana navigasyon', en: 'Main navigation', ar: 'التنقل الرئيسي' }[lang]}>
          <div className="header-search-desktop">
            <SearchBar lang={lang} onFlyTo={handleFlyTo} onSelectEntity={handleSearchSelect} />
          </div>
          <div className="tabs" role="tablist" aria-label={{ tr: 'Görünüm seçimi', en: 'View selection', ar: 'اختيار العرض' }[lang]}>
            <button role="tab" aria-selected={tab === 'map'} className={`tab${tab === 'map' ? ' active' : ''}`} onClick={() => selectTab('map')}>{t.tabs.map}</button>
            <button role="tab" aria-selected={tab === 'dashboard'} className={`tab${tab === 'dashboard' ? ' active' : ''}`} onClick={() => selectTab('dashboard')}>{t.tabs.dashboard}</button>
            <button role="tab" aria-selected={tab === 'timeline'} className={`tab${tab === 'timeline' ? ' active' : ''}`} onClick={() => selectTab('timeline')}>{t.tabs.timeline}</button>
            <button role="tab" aria-selected={tab === 'links'} className={`tab${tab === 'links' ? ' active' : ''}`} onClick={() => selectTab('links')}>{t.tabs.links}</button>
            <button role="tab" aria-selected={tab === 'scholars'} className={`tab${tab === 'scholars' ? ' active' : ''}`} onClick={() => selectTab('scholars')}>{t.tabs.scholars}</button>
            <button role="tab" aria-selected={tab === 'battles'} className={`tab${tab === 'battles' ? ' active' : ''}`} onClick={() => selectTab('battles')}>{t.tabs.battles}</button>
            <button role="tab" aria-selected={tab === 'alam'} className={`tab${tab === 'alam' ? ' active' : ''}`} onClick={() => selectTab('alam')}
              onMouseEnter={() => preloadData('/data/alam_lite.json')}>{t.tabs.alam}</button>
            <button role="tab" aria-selected={tab === 'yaqut'} className={`tab${tab === 'yaqut' ? ' active' : ''}`} onClick={() => selectTab('yaqut')}
              onMouseEnter={() => preloadData('/data/yaqut_lite.json')}>{t.tabs.yaqut}</button>
            <button role="tab" aria-selected={tab === 'dia'} className={`tab${tab === 'dia' ? ' active' : ''}`} onClick={() => selectTab('dia')}
              onMouseEnter={() => preloadData('/data/dia_lite.json')}>{t.tabs.dia}</button>
          </div>
          <button className="quiz-trigger" onClick={() => setQuizOpen(true)}
            aria-label={{ tr: 'Bilgi yarışması', en: 'Knowledge quiz', ar: 'اختبار المعرفة' }[lang]}>🎓 Quiz</button>
          <GlossaryModal lang={lang} />
          <ProgressTracker lang={lang} progress={progress} onReset={resetProgress} />
          <ExportButton lang={lang} />
          <AboutModal lang={lang} onResetOnboarding={resetOnboarding} onResetLanding={resetLanding}
          externalOpen={aboutOpen} onExternalClose={() => setAboutOpen(false)} />
          <button className="admin-trigger" onClick={() => selectTab('admin')}
            title="Admin Panel" style={{ background:'none',border:'none',cursor:'pointer',fontSize:14,color:'#a89b8c',padding:'4px 8px',borderRadius:4 }}>⚙</button>
          <div className="lang-switcher">
            {['tr', 'en', 'ar'].map(l => (
              <button key={l}
                className={`lang-btn${lang === l ? ' active' : ''}`}
                onClick={() => setLang(l)}
                aria-label={l === 'ar' ? 'العربية' : l === 'en' ? 'English' : 'Türkçe'}>
                {{ tr: '🇹🇷 TR', en: '🇬🇧 EN', ar: '🇸🇦 AR' }[l]}
              </button>
            ))}
          </div>
        </nav>
      </header>
      {menuOpen && <div className="mobile-backdrop" onClick={() => setMenuOpen(false)} />}
      <main id="main-content" className={`main${sidebarOpen ? ' sidebar-visible' : ''}`} role="main">
        <Suspense fallback={<LazyLoader />}>
        {tab === 'map' ? <MapView lang={lang} t={t} sidebarOpen={sidebarOpen} mapRef={mapRef} onPopupOpen={recordDiscovery} onTourComplete={handleTourComplete} onCloseSidebar={() => setSidebarOpen(false)} entityRoute={entityRoute} onEntityRouteConsumed={clearEntityRoute} /> :
         tab === 'dashboard' ? <Dashboard lang={lang} t={t} onTabChange={selectTab} /> :
         tab === 'timeline' ? <TimelineView lang={lang} t={t} /> :
         tab === 'scholars' ? <ScholarView lang={lang} t={t} /> :
         tab === 'battles' ? <BattleView lang={lang} t={t} /> :
         tab === 'alam' ? <AlamView lang={lang} t={t} /> :
         tab === 'yaqut' ? <YaqutView lang={lang} t={t} /> :
         tab === 'dia' ? <DiaView lang={lang} t={t} /> :
         <CausalView lang={lang} t={t} />}
        </Suspense>
      </main>
      <Footer lang={lang} />
      {isMobile && (
        <BottomTabBar
          tab={tab}
          onSelect={selectTab}
          lang={lang}
          onQuiz={() => setQuizOpen(true)}
          onAbout={() => setAboutOpen(true)}
          onLang={setLang}
        />
      )}
      {quizOpen && <Suspense fallback={<LazyLoader />}><QuizMode lang={lang} onFlyTo={handleFlyTo} onClose={() => setQuizOpen(false)} /></Suspense>}
      <BadgeToast badge={newBadge} lang={lang} onDismiss={() => setNewBadge(null)} />
      {showOnboarding && <Onboarding lang={lang} onDone={handleOnboardingDone} />}
    </div>
  );
}
