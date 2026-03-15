import { useState, useRef, useCallback, useEffect } from 'react';
import T from './data/i18n';
import LandingPage from './components/landing/LandingPage';
import MapView from './components/map/MapView';
import Dashboard from './components/dashboard/Dashboard';
import TimelineView from './components/timeline/TimelineView';
import CausalView from './components/causal/CausalView';
import ScholarView from './components/scholars/ScholarView';
import BattleView from './components/battles/BattleView';
import AlamView from './components/alam/AlamView';
import YaqutView from './components/yaqut/YaqutView';
import Footer from './components/shared/Footer';
import AboutModal from './components/shared/AboutModal';
import QuizMode from './components/QuizMode';
import GlossaryModal from './components/shared/GlossaryModal';
import SearchBar from './components/shared/SearchBar';
import ProgressTracker, { BadgeToast, useProgress } from './components/shared/ProgressTracker';
import Onboarding from './components/shared/Onboarding';
import ExportButton from './components/shared/ExportButton';

const VALID_TABS = ['map', 'dashboard', 'timeline', 'links', 'scholars', 'battles', 'alam', 'yaqut'];

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

/* Check if landing should show */
function shouldShowLanding() {
  try { return !localStorage.getItem('atlas-visited'); } catch { return true; }
}

export default function App() {
  const [lang, setLang] = useState('tr');
  const [showLanding, setShowLanding] = useState(shouldShowLanding);
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

  /* Landing page */
  if (showLanding) {
    return <LandingPage lang={lang} setLang={setLang} onEnter={handleLandingEnter} />;
  }

  return (
    <div className="app" dir={lang === 'ar' ? 'rtl' : 'ltr'} lang={lang}>
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
            <button role="tab" aria-selected={tab === 'alam'} className={`tab${tab === 'alam' ? ' active' : ''}`} onClick={() => selectTab('alam')}>{t.tabs.alam}</button>
            <button role="tab" aria-selected={tab === 'yaqut'} className={`tab${tab === 'yaqut' ? ' active' : ''}`} onClick={() => selectTab('yaqut')}>{t.tabs.yaqut}</button>
          </div>
          <button className="quiz-trigger" onClick={() => setQuizOpen(true)}
            aria-label={{ tr: 'Bilgi yarışması', en: 'Knowledge quiz', ar: 'اختبار المعرفة' }[lang]}>🎓 Quiz</button>
          <GlossaryModal lang={lang} />
          <ProgressTracker lang={lang} progress={progress} onReset={resetProgress} />
          <ExportButton lang={lang} />
          <AboutModal lang={lang} onResetOnboarding={resetOnboarding} onResetLanding={resetLanding} />
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
        {tab === 'map' ? <MapView lang={lang} t={t} sidebarOpen={sidebarOpen} mapRef={mapRef} onPopupOpen={recordDiscovery} onTourComplete={handleTourComplete} onCloseSidebar={() => setSidebarOpen(false)} /> :
         tab === 'dashboard' ? <Dashboard lang={lang} t={t} onTabChange={selectTab} /> :
         tab === 'timeline' ? <TimelineView lang={lang} t={t} /> :
         tab === 'scholars' ? <ScholarView lang={lang} t={t} /> :
         tab === 'battles' ? <BattleView lang={lang} t={t} /> :
         tab === 'alam' ? <AlamView lang={lang} t={t} /> :
         tab === 'yaqut' ? <YaqutView lang={lang} t={t} /> :
         <CausalView lang={lang} t={t} />}
      </main>
      <Footer lang={lang} />
      {quizOpen && <QuizMode lang={lang} onFlyTo={handleFlyTo} onClose={() => setQuizOpen(false)} />}
      <BadgeToast badge={newBadge} lang={lang} onDismiss={() => setNewBadge(null)} />
      {showOnboarding && <Onboarding lang={lang} onDone={handleOnboardingDone} />}
    </div>
  );
}
