import { useState, useRef, useCallback } from 'react';
import T from './data/i18n';
import MapView from './components/map/MapView';
import TimelineView from './components/timeline/TimelineView';
import CausalView from './components/causal/CausalView';
import Footer from './components/shared/Footer';
import AboutModal from './components/shared/AboutModal';
import QuizMode from './components/QuizMode';
import GlossaryModal from './components/shared/GlossaryModal';
import SearchBar from './components/shared/SearchBar';
import ProgressTracker, { BadgeToast, useProgress } from './components/shared/ProgressTracker';

export default function App() {
  const [lang, setLang] = useState('tr');
  const [tab, setTab] = useState('map');
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const mapRef = useRef(null);
  const t = T[lang];

  /* Progress tracking */
  const { progress, recordDiscovery, resetProgress, newBadge, setNewBadge } = useProgress();

  const selectTab = (v) => { setTab(v); setMenuOpen(false); };

  /* FlyTo handler (shared by quiz, search, etc.) */
  const handleFlyTo = useCallback(({ lat, lon, zoom }) => {
    if (tab !== 'map') setTab('map');
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lon], zoom || 6, { duration: 1.5 });
      }
    }, tab !== 'map' ? 300 : 50);
  }, [tab]);

  /* Search select -> flyTo + record discovery */
  const handleSearchSelect = useCallback((item) => {
    if (item && item.type) {
      recordDiscovery(item.type, item.obj?.id || item.name_tr);
    }
  }, [recordDiscovery]);

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">
        {lang === 'tr' ? 'İçeriğe geç' : 'Skip to content'}
      </a>
      <header className="header" role="banner">
        <div className="header-left">
          {/* Hamburger for mobile */}
          <button className="hamburger" onClick={() => setMenuOpen(p => !p)}
            aria-label={lang === 'tr' ? 'Menü' : 'Menu'} aria-expanded={menuOpen}>
            <span className={`hb-line${menuOpen ? ' open' : ''}`} />
            <span className={`hb-line${menuOpen ? ' open' : ''}`} />
            <span className={`hb-line${menuOpen ? ' open' : ''}`} />
          </button>
          {/* Sidebar toggle for map on mobile */}
          {tab === 'map' && (
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(p => !p)}
              aria-label={lang === 'tr' ? 'Filtreler' : 'Filters'}>
              ☰
            </button>
          )}
          <div className="logo" aria-hidden="true">☪</div>
          <div>
            <h1 className="h-title">{t.title}</h1>
            <p className="h-sub">{t.sub}</p>
          </div>
        </div>
        <nav className={`header-right${menuOpen ? ' mobile-open' : ''}`} role="navigation"
          aria-label={lang === 'tr' ? 'Ana navigasyon' : 'Main navigation'}>
          {/* Search Bar */}
          <SearchBar lang={lang} onFlyTo={handleFlyTo} onSelectEntity={handleSearchSelect} />
          <div className="tabs" role="tablist" aria-label={lang === 'tr' ? 'Görünüm seçimi' : 'View selection'}>
            <button role="tab" aria-selected={tab === 'map'} className={`tab${tab === 'map' ? ' active' : ''}`} onClick={() => selectTab('map')}>{t.tabs.map}</button>
            <button role="tab" aria-selected={tab === 'timeline'} className={`tab${tab === 'timeline' ? ' active' : ''}`} onClick={() => selectTab('timeline')}>{t.tabs.timeline}</button>
            <button role="tab" aria-selected={tab === 'links'} className={`tab${tab === 'links' ? ' active' : ''}`} onClick={() => selectTab('links')}>{t.tabs.links}</button>
          </div>
          <button className="quiz-trigger" onClick={() => setQuizOpen(true)}
            aria-label={lang === 'tr' ? 'Bilgi yarışması' : 'Knowledge quiz'}>
            🎓 Quiz
          </button>
          {/* Glossary */}
          <GlossaryModal lang={lang} />
          {/* Progress */}
          <ProgressTracker lang={lang} progress={progress} onReset={resetProgress} />
          <AboutModal lang={lang} />
          <button className="lang-btn" onClick={() => setLang(l => l === 'tr' ? 'en' : 'tr')} aria-label={lang === 'tr' ? 'Switch to English' : 'Türkçeye geç'}>
            {lang === 'tr' ? '🇬🇧 EN' : '🇹🇷 TR'}
          </button>
        </nav>
      </header>
      {/* Mobile menu backdrop */}
      {menuOpen && <div className="mobile-backdrop" onClick={() => setMenuOpen(false)} />}
      <main id="main-content" className={`main${sidebarOpen ? ' sidebar-visible' : ''}`} role="main">
        {tab === 'map' ? <MapView lang={lang} t={t} sidebarOpen={sidebarOpen} mapRef={mapRef} onPopupOpen={recordDiscovery} /> :
         tab === 'timeline' ? <TimelineView lang={lang} t={t} /> :
         <CausalView lang={lang} t={t} />}
      </main>
      <Footer lang={lang} />
      {/* Quiz overlay */}
      {quizOpen && (
        <QuizMode
          lang={lang}
          onFlyTo={handleFlyTo}
          onClose={() => setQuizOpen(false)}
        />
      )}
      {/* Badge toast notification */}
      <BadgeToast badge={newBadge} lang={lang} onDismiss={() => setNewBadge(null)} />
    </div>
  );
}
