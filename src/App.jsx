import { useState } from 'react';
import T from './data/i18n';
import MapView from './components/MapView';
import TimelineView from './components/TimelineView';
import CausalView from './components/CausalView';

export default function App() {
  const [lang, setLang] = useState('tr');
  const [tab, setTab] = useState('map');
  const t = T[lang];

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo">☪</div>
          <div>
            <h1 className="h-title">{t.title}</h1>
            <p className="h-sub">{t.sub}</p>
          </div>
        </div>
        <div className="header-right">
          <div className="tabs">
            <button className={`tab${tab === 'map' ? ' active' : ''}`} onClick={() => setTab('map')}>{t.tabs.map}</button>
            <button className={`tab${tab === 'timeline' ? ' active' : ''}`} onClick={() => setTab('timeline')}>{t.tabs.timeline}</button>
            <button className={`tab${tab === 'links' ? ' active' : ''}`} onClick={() => setTab('links')}>{t.tabs.links}</button>
          </div>
          <button className="lang-btn" onClick={() => setLang(l => l === 'tr' ? 'en' : 'tr')}>
            {lang === 'tr' ? '🇬🇧 EN' : '🇹🇷 TR'}
          </button>
        </div>
      </header>
      <main className="main">
        {tab === 'map' ? <MapView lang={lang} t={t} /> :
         tab === 'timeline' ? <TimelineView lang={lang} t={t} /> :
         <CausalView lang={lang} t={t} />}
      </main>
    </div>
  );
}
