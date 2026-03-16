import { useState, useEffect, useRef, useCallback } from 'react';
import DB from '../../data/db.json';
import T from '../../data/i18n';
import '../../styles/landing.css';

/* ── CountUp with easeOutQuad ── */
function useCountUp(target, duration = 2000, delay = 0) {
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    const timer = setTimeout(() => {
      started.current = true;
      let start = null;
      const ease = t => 1 - (1 - t) * (1 - t);
      function frame(ts) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        setVal(Math.round(ease(p) * target));
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, duration, delay]);

  return val;
}

function StatItem({ target, label, delay }) {
  const count = useCountUp(target, 2000, delay);
  return (
    <div className="landing-stat" style={{ animationDelay: `${delay}ms` }}>
      <span className="landing-stat-num">{count.toLocaleString()}</span>
      <span className="landing-stat-label">{label}</span>
    </div>
  );
}

export default function LandingPage({ lang, setLang, onEnter }) {
  const [exiting, setExiting] = useState(false);
  const t = T[lang];

  const handleExplore = useCallback(() => {
    setExiting(true);
    try { localStorage.setItem('atlas-visited', '1'); } catch {}
    setTimeout(() => {
      if (onEnter) onEnter();
    }, 650);
  }, [onEnter]);

  const toggleLang = useCallback(() => {
    setLang(l => l === 'tr' ? 'en' : 'tr');
  }, [setLang]);

  const stats = [
    { key: 'dynasties', count: DB.dynasties?.length || 186, label: t.landing.dynasties },
    { key: 'scholars', count: DB.scholars?.length || 313, label: t.landing.scholars },
    { key: 'battles', count: DB.battles?.length || 65, label: t.landing.battles },
    { key: 'rulers', count: DB.rulers?.length || 830, label: t.landing.rulers },
    { key: 'monuments', count: DB.monuments?.length || 60, label: t.landing.monuments },
    { key: 'cities', count: DB.cities?.length || 82, label: t.landing.cities },
    { key: 'madrasas', count: DB.madrasas?.length || 35, label: t.landing.madrasas },
    { key: 'alam', count: 13940, label: t.landing.alamBio },
  ];

  return (
    <div className={`landing${exiting ? ' landing-exit' : ''}`}>
      {/* Background pattern */}
      <div className="landing-bg">
        <div className="landing-pattern" />
        <div className="landing-gradient" />
      </div>

      {/* Language toggle */}
      <button className="landing-lang" onClick={toggleLang} aria-label="Toggle language">
        {t.landing.langToggle}
      </button>

      {/* Hero */}
      <div className="landing-hero">
        <div className="landing-logo">☪</div>
        <h1 className="landing-title">
          {t.title}
        </h1>
        <p className="landing-subtitle">
          {t.landing.subtitle}
        </p>
        <button className="landing-explore" onClick={handleExplore}>
          <span className="landing-explore-icon">🗺</span>
          {t.landing.explore}
        </button>
      </div>

      {/* Stats strip */}
      <div className="landing-stats">
        {stats.map((s, i) => (
          <StatItem
            key={s.key}
            target={s.count}
            label={s.label}
            delay={1200 + i * 200}
          />
        ))}
      </div>
    </div>
  );
}
