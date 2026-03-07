import { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import T from './data/i18n';
import MapView from './components/map/MapView';
const TimelineView = lazy(() => import('./components/timeline/TimelineView'));
const CausalView = lazy(() => import('./components/causal/CausalView'));
const ScholarView = lazy(() => import('./components/scholars/ScholarView'));
const BattleView = lazy(() => import('./components/battles/BattleView'));
import Footer from './components/shared/Footer';
import AboutModal from './components/shared/AboutModal';
import QuizMode from './components/QuizMode';
import GlossaryModal from './components/shared/GlossaryModal';
import SearchBar from './components/shared/SearchBar';
import ProgressTracker, { BadgeToast, useProgress } from './components/shared/ProgressTracker';
import Onboarding from './components/shared/Onboarding';
import ExportButton from './components/shared/ExportButton';

const VALID_TABS = ['map', 'timeline', 'links', 'scholars', 'battles'];

/* Parse hash → { tab, params } */
function parseHash() {
  const h = window.location.hash.replace('#', '');
  if (!h) return null;
  const [path, qs] = h.split('?');
  const tab = path.split('/')[0];
  const params = {};
  if (qs) qs.split('&').forEach(p => { const [k, v] = p.split('='); if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
  return VALID_TABS.includes(tab) ? { tab, params } : null;
}

export default function App() {
  const [lang, setLang] = useState('tr');
  const [tab, setTab] = useState(() => { const h = parseHash(); return h ? h.tab : 'map'; });
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const mapRef = useRef(null);
  const t = T[lang];

  const { progress, recordDiscovery, resetProgress, newBadge, setNewBadge } = useProgress();

  /* ═══ Deeplink: hash → tab sync ═══ */
  useEffect(() => {
    const handler = () => {
      const h = parseHash();
      if (h && h.tab !== tab) setTab(h.tab);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, [tab]);

  const selectTab = (v) => {
    setTab(v);
    setMenuOpen(false);
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
    try {
      if (!localStorage.getItem('atlas-onboarded')) setShowOnboarding(true);
    } catch {}
  }, []);

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

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">
        {lang === 'tr' ? 'İçeriğe geç' : 'Skip to content'}
      </a>
      <header className="header" role="banner">
        <div className="header-left">
          <button className="hamburger" onClick={() => setMenuOpen(p => !p)}
            aria-label={lang === 'tr' ? 'Menü' : 'Menu'} aria-expanded={menuOpen}>
            <span className={`hb-line${menuOpen ? ' open' : ''}`} />
            <span className={`hb-line${menuOpen ? ' open' : ''}`} />
            <span className={`hb-line${menuOpen ? ' open' : ''}`} />
          </button>
          {tab === 'map' && (
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(p => !p)}
              aria-label={lang === 'tr' ? 'Filtreler' : 'Filters'}>☰</button>
          )}
          <div className="logo" aria-hidden="true">☪</div>
          <div>
            <h1 className="h-title">{t.title}</h1>
            <p className="h-sub">{t.sub}</p>
          </div>
        </div>
        {/* Mobile search bar (always visible on phone) */}
        <div className="header-search-mobile">
          <SearchBar lang={lang} onFlyTo={handleFlyTo} onSelectEntity={handleSearchSelect} />
        </div>
        <nav className={`header-right${menuOpen ? ' mobile-open' : ''}`} role="navigation"
          aria-label={lang === 'tr' ? 'Ana navigasyon' : 'Main navigation'}>
          <div className="header-search-desktop">
            <SearchBar lang={lang} onFlyTo={handleFlyTo} onSelectEntity={handleSearchSelect} />
          </div>
          <div className="tabs" role="tablist" aria-label={lang === 'tr' ? 'Görünüm seçimi' : 'View selection'}>
            <button role="tab" aria-selected={tab === 'map'} className={`tab${tab === 'map' ? ' active' : ''}`} onClick={() => selectTab('map')}>🗺 {t.tabs.map}</button>
            <button role="tab" aria-selected={tab === 'timeline'} className={`tab${tab === 'timeline' ? ' active' : ''}`} onClick={() => selectTab('timeline')}>📊 {t.tabs.timeline}</button>
            <button role="tab" aria-selected={tab === 'links'} className={`tab${tab === 'links' ? ' active' : ''}`} onClick={() => selectTab('links')}>🔗 {t.tabs.links}</button>
            <button role="tab" aria-selected={tab === 'scholars'} className={`tab${tab === 'scholars' ? ' active' : ''}`} onClick={() => selectTab('scholars')}>📚 {t.tabs.scholars}</button>
            <button role="tab" aria-selected={tab === 'battles'} className={`tab${tab === 'battles' ? ' active' : ''}`} onClick={() => selectTab('battles')}>⚔ {t.tabs.battles}</button>
          </div>
          <button className="quiz-trigger" onClick={() => setQuizOpen(true)}
            aria-label={lang === 'tr' ? 'Bilgi yarışması' : 'Knowledge quiz'}>🎓 Quiz</button>
          <GlossaryModal lang={lang} />
          <ProgressTracker lang={lang} progress={progress} onReset={resetProgress} />
          <ExportButton lang={lang} />
          <AboutModal lang={lang} onResetOnboarding={resetOnboarding} />
          <button className="lang-btn" onClick={() => setLang(l => l === 'tr' ? 'en' : 'tr')} aria-label={lang === 'tr' ? 'Switch to English' : 'Türkçeye geç'}>
            {lang === 'tr' ? '🇬🇧 EN' : '🇹🇷 TR'}
          </button>
        </nav>
      </header>
      {menuOpen && <div className="mobile-backdrop" onClick={() => setMenuOpen(false)} />}
      <main id="main-content" className={`main${sidebarOpen ? ' sidebar-visible' : ''}`} role="main">
        {tab === 'map' ? <MapView lang={lang} t={t} sidebarOpen={sidebarOpen} mapRef={mapRef} onPopupOpen={recordDiscovery} onTourComplete={handleTourComplete} onCloseSidebar={() => setSidebarOpen(false)} /> :
         <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--cream2)'}}>Yükleniyor...</div>}>
           {tab === 'timeline' ? <TimelineView lang={lang} t={t} /> :
            tab === 'scholars' ? <ScholarView lang={lang} t={t} /> :
            tab === 'battles' ? <BattleView lang={lang} t={t} /> :
            <CausalView lang={lang} t={t} />}
         </Suspense>}
      </main>
      <Footer lang={lang} />
      {quizOpen && <QuizMode lang={lang} onFlyTo={handleFlyTo} onClose={() => setQuizOpen(false)} />}
      <BadgeToast badge={newBadge} lang={lang} onDismiss={() => setNewBadge(null)} />
      {showOnboarding && <Onboarding lang={lang} onDone={handleOnboardingDone} />}
    </div>
  );
}
