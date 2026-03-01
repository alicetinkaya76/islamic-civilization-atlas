import { useState } from 'react';
import T from './data/i18n';
import MapView from './components/map/MapView';
import TimelineView from './components/timeline/TimelineView';
import CausalView from './components/causal/CausalView';
import Footer from './components/shared/Footer';
import AboutModal from './components/shared/AboutModal';

export default function App() {
  const [lang, setLang] = useState('tr');
  const [tab, setTab] = useState('map');
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = T[lang];

  const selectTab = (v) => { setTab(v); setMenuOpen(false); };

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
          <div className="tabs" role="tablist" aria-label={lang === 'tr' ? 'Görünüm seçimi' : 'View selection'}>
            <button role="tab" aria-selected={tab === 'map'} className={`tab${tab === 'map' ? ' active' : ''}`} onClick={() => selectTab('map')}>{t.tabs.map}</button>
            <button role="tab" aria-selected={tab === 'timeline'} className={`tab${tab === 'timeline' ? ' active' : ''}`} onClick={() => selectTab('timeline')}>{t.tabs.timeline}</button>
            <button role="tab" aria-selected={tab === 'links'} className={`tab${tab === 'links' ? ' active' : ''}`} onClick={() => selectTab('links')}>{t.tabs.links}</button>
          </div>
          <AboutModal lang={lang} />
          <button className="lang-btn" onClick={() => setLang(l => l === 'tr' ? 'en' : 'tr')} aria-label={lang === 'tr' ? 'Switch to English' : 'Türkçeye geç'}>
            {lang === 'tr' ? '🇬🇧 EN' : '🇹🇷 TR'}
          </button>
        </nav>
      </header>
      {/* Mobile menu backdrop */}
      {menuOpen && <div className="mobile-backdrop" onClick={() => setMenuOpen(false)} />}
      <main id="main-content" className={`main${sidebarOpen ? ' sidebar-visible' : ''}`} role="main">
        {tab === 'map' ? <MapView lang={lang} t={t} sidebarOpen={sidebarOpen} /> :
         tab === 'timeline' ? <TimelineView lang={lang} t={t} /> :
         <CausalView lang={lang} t={t} />}
      </main>
      <Footer lang={lang} />
    </div>
  );
}
