import { useState, useEffect, useRef, useMemo } from 'react';
import DB from '../../data/db.json';
import { n, lf } from '../../hooks/useEntityLookup';

/**
 * YearInfoPanel — Pedagogical info box above the time slider.
 * Shows: active dynasty count + top 3, last battle, living scholars, last monument.
 * Each row is clickable → triggers flyTo on map.
 */
export default function YearInfoPanel({ year, lang, onFlyTo }) {
  const [info, setInfo] = useState(null);
  const [collapsed, setCollapsed] = useState(true);
  const debounceRef = useRef(null);

  /* Pre-index data for fast lookup */
  const sortedBattles = useMemo(() =>
    [...DB.battles].filter(b => b.yr && b.lat).sort((a, b) => a.yr - b.yr), []);

  const sortedMonuments = useMemo(() =>
    [...DB.monuments].filter(m => m.yr && m.lat).sort((a, b) => a.yr - b.yr), []);

  const dynastyAnalytics = useMemo(() => {
    const m = {};
    DB.analytics.forEach(a => { m[a.id] = a; });
    return m;
  }, []);

  /* Debounced computation */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      /* 1) Active dynasties */
      const active = DB.dynasties.filter(d => d.start <= year && d.end >= year && d.lat);
      const sorted = active.sort((a, b) => {
        const pa = dynastyAnalytics[a.id]?.pi || 0;
        const pb = dynastyAnalytics[b.id]?.pi || 0;
        return pb - pa;
      });
      const top3 = sorted.slice(0, 3);

      /* 2) Last battle (closest before or at year) */
      let lastBattle = null;
      for (let i = sortedBattles.length - 1; i >= 0; i--) {
        if (sortedBattles[i].yr <= year) { lastBattle = sortedBattles[i]; break; }
      }

      /* 3) Living scholars */
      const living = DB.scholars.filter(s => s.b && s.d && s.b <= year && s.d >= year);

      /* 4) Last monument */
      let lastMonument = null;
      for (let i = sortedMonuments.length - 1; i >= 0; i--) {
        if (sortedMonuments[i].yr <= year) { lastMonument = sortedMonuments[i]; break; }
      }

      setInfo({ activeCount: active.length, top3, lastBattle, living, lastMonument });
    }, 200);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [year, sortedBattles, sortedMonuments, dynastyAnalytics]);

  if (!info) return null;

  const handleFly = (lat, lon, zoom) => {
    if (onFlyTo && lat && lon) onFlyTo({ lat, lon, zoom: zoom || 6 });
  };

  /* Find a flyable coordinate for a scholar — use patron dynasty's capital */
  const scholarCoord = (s) => {
    if (s.lat && s.lon) return { lat: s.lat, lon: s.lon };
    if (s.patron_d) {
      const d = DB.dynasties.find(dy => dy.id === s.patron_d);
      if (d && d.lat && d.lon) return { lat: d.lat, lon: d.lon };
    }
    return null;
  };

  const topNames = info.top3.map(d => n(d, lang)).join(', ');
  const livingCount = info.living.length;
  const livingTop = info.living.slice(0, 3).map(s => n(s, lang)).join(', ');

  return (
    <div className={`yip${collapsed ? ' yip-collapsed' : ''}`}>
      {/* Collapse/expand toggle */}
      <button
        className="yip-toggle"
        onClick={() => setCollapsed(p => !p)}
        aria-label={collapsed ? 'Expand info' : 'Collapse info'}
        style={{
          position: 'absolute', top: 2, right: 4, background: 'none',
          border: 'none', color: '#a89b8c', cursor: 'pointer', fontSize: 12,
          padding: '2px 6px', borderRadius: 4, zIndex: 2, lineHeight: 1,
        }}
      >
        {collapsed ? '▼' : '▲'}
      </button>

      {collapsed ? (
        /* Collapsed: single summary line */
        <div
          className="yip-row yip-row--dyn"
          onClick={() => setCollapsed(false)}
          role="button" tabIndex={0}
          style={{ cursor: 'pointer' }}
        >
          <span className="yip-icon">🏛</span>
          <span className="yip-count">{info.activeCount}</span>
          <span className="yip-label" style={{ opacity: 0.7 }}>
            {{ tr: 'aktif hanedan', en: 'dynasties', ar: 'أسرة' }[lang]}
          </span>
          <span className="yip-detail" style={{ fontSize: 9, opacity: 0.5 }}>
            {{ tr: '▼ detay', en: '▼ details', ar: '▼ تفاصيل' }[lang]}
          </span>
        </div>
      ) : (
        <>
      {/* Row 1: Active dynasties */}
      <div
        className="yip-row yip-row--dyn"
        onClick={() => info.top3[0] && handleFly(info.top3[0].lat, info.top3[0].lon, 5)}
        role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && info.top3[0] && handleFly(info.top3[0].lat, info.top3[0].lon, 5)}
        aria-label={{ tr: `Aktif hanedanlar: ${info.activeCount}`, en: `Active dynasties: ${info.activeCount}`, ar: `` }[lang]}
      >
        <span className="yip-icon">🏛</span>
        <span className="yip-count">{info.activeCount}</span>
        <span className="yip-label">
          {{ tr: 'aktif hanedan', en: 'active dynasties', ar: '' }[lang]}
        </span>
        {topNames && <span className="yip-detail">{topNames}</span>}
      </div>

      {/* Row 2: Last battle */}
      {info.lastBattle && (
        <div
          className="yip-row yip-row--battle"
          onClick={() => handleFly(info.lastBattle.lat, info.lastBattle.lon, 7)}
          role="button" tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && handleFly(info.lastBattle.lat, info.lastBattle.lon, 7)}
          aria-label={n(info.lastBattle, lang)}
        >
          <span className="yip-icon">⚔</span>
          <span className="yip-count">{info.lastBattle.yr}</span>
          <span className="yip-detail yip-detail--name">{n(info.lastBattle, lang)}</span>
        </div>
      )}

      {/* Row 3: Living scholars */}
      {livingCount > 0 && (
        <div
          className="yip-row yip-row--scholar"
          onClick={() => {
            const first = info.living[0];
            const coord = scholarCoord(first);
            if (coord) handleFly(coord.lat, coord.lon, 6);
          }}
          role="button" tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              const first = info.living[0];
              const coord = scholarCoord(first);
              if (coord) handleFly(coord.lat, coord.lon, 6);
            }
          }}
          aria-label={{ tr: `Yaşayan âlimler: ${livingCount}`, en: `Living scholars: ${livingCount}`, ar: `` }[lang]}
        >
          <span className="yip-icon">📚</span>
          <span className="yip-count">{livingCount}</span>
          <span className="yip-label">
            {{ tr: 'âlim', en: livingCount === 1 ? 'scholar' : 'scholars', ar: 'عالِم' }[lang]}
          </span>
          {livingTop && <span className="yip-detail">{livingTop}</span>}
        </div>
      )}

      {/* Row 4: Last monument */}
      {info.lastMonument && (
        <div
          className="yip-row yip-row--monument"
          onClick={() => handleFly(info.lastMonument.lat, info.lastMonument.lon, 8)}
          role="button" tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && handleFly(info.lastMonument.lat, info.lastMonument.lon, 8)}
          aria-label={n(info.lastMonument, lang)}
        >
          <span className="yip-icon">🕌</span>
          <span className="yip-count">{info.lastMonument.yr}</span>
          <span className="yip-detail yip-detail--name">{n(info.lastMonument, lang)}</span>
        </div>
      )}
        </>
      )}
    </div>
  );
}
