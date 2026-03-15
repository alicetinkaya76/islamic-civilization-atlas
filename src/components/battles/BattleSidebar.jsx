import { useCallback, useState, useRef, useEffect } from 'react';
import { n, lf } from '../../hooks/useEntityLookup';
import BattleCard from './BattleCard';

const TYPE_ICONS = {
  'Land': '⚔', 'Naval': '⚓', 'Siege': '🏰',
  'Civil War': '⚡', 'Land & Naval': '⚔',
};
const TYPE_COLORS = {
  'Land': '#ef4444', 'Naval': '#3b82f6', 'Siege': '#f59e0b',
  'Civil War': '#8b5cf6',
};

const TYPES_LIST = [
  { key: 'Land', icon: '⚔' },
  { key: 'Naval', icon: '⚓' },
  { key: 'Siege', icon: '🏰' },
  { key: 'Civil War', icon: '⚡' },
];

const TYPE_I18N = { 'Land': 'typeLand', 'Naval': 'typeNaval', 'Siege': 'typeSiege', 'Civil War': 'typeCivil' };

function getOutcomeType(b) {
  const out = (b.out_en || '').toLowerCase();
  if (out.includes('inconclusive') || out.includes('arbitration')) return 'draw';
  if (out.includes('frankish victory') || out.includes('crusader victory') ||
      out.includes('holy league victory') || out.includes('mongol victory') ||
      out.includes('spanish victory') || out.includes('british victory') ||
      out.includes('qara khitai victory') || out.includes('timurid victory') ||
      out.includes('partial defeat') || out.includes('umayyad victory')) return 'loss';
  return 'win';
}

export default function BattleSidebar({
  filteredBattles, selectedId, onSelectBattle, filters, setFilters, selectedBattle, lang, t
}) {
  const ts = t.battles || {};
  const [playing, setPlaying] = useState(false);
  const playRef = useRef(null);

  /* Auto-play: advance year by ~25 per interval */
  useEffect(() => {
    if (!playing) {
      if (playRef.current) clearInterval(playRef.current);
      return;
    }
    playRef.current = setInterval(() => {
      setFilters(f => {
        const next = f.year + 25;
        if (next >= 1924) {
          setPlaying(false);
          return { ...f, year: 1924 };
        }
        return { ...f, year: next };
      });
    }, 400);
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [playing, setFilters]);

  const toggleType = useCallback((type) => {
    setFilters(f => {
      const types = f.types.includes(type)
        ? f.types.filter(t => t !== type)
        : [...f.types, type];
      return { ...f, types };
    });
  }, [setFilters]);

  const toggleOutcome = useCallback((oc) => {
    setFilters(f => {
      const outcomes = f.outcomes.includes(oc)
        ? f.outcomes.filter(o => o !== oc)
        : [...f.outcomes, oc];
      return { ...f, outcomes };
    });
  }, [setFilters]);

  return (
    <div className="battle-sidebar">
      {/* Filters */}
      <div className="battle-filters">
        <input
          className="battle-search"
          type="text"
          placeholder={ts.search || 'Search battles...'}
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        />
        {/* Type pills */}
        <div className="battle-filter-row">
          {TYPES_LIST.map(({ key, icon }) => (
            <button
              key={key}
              className={`type-pill${filters.types.includes(key) ? ' active' : ''}`}
              style={{ color: TYPE_COLORS[key] }}
              onClick={() => toggleType(key)}
              title={key}
            >
              {icon} {ts[TYPE_I18N[key]] || key}
            </button>
          ))}
        </div>
        {/* Outcome pills */}
        <div className="battle-filter-row">
          <button
            className={`outcome-pill${filters.outcomes.includes('win') ? ' active' : ''}`}
            style={{ color: '#16a34a' }}
            onClick={() => toggleOutcome('win')}
          >
            ✓ {ts.victory || 'Victory'}
          </button>
          <button
            className={`outcome-pill${filters.outcomes.includes('loss') ? ' active' : ''}`}
            style={{ color: '#dc2626' }}
            onClick={() => toggleOutcome('loss')}
          >
            ✗ {ts.defeat || 'Defeat'}
          </button>
          <button
            className={`outcome-pill${filters.outcomes.includes('draw') ? ' active' : ''}`}
            style={{ color: '#ca8a04' }}
            onClick={() => toggleOutcome('draw')}
          >
            ~ {ts.inconclusive || 'Inconclusive'}
          </button>
        </div>
        {/* Year slider with play button */}
        <div className="battle-year-filter">
          <label>{ts.period || 'Period'}</label>
          <button
            className={`battle-play-btn${playing ? ' playing' : ''}`}
            onClick={() => {
              if (!playing && filters.year >= 1920) {
                setFilters(f => ({ ...f, year: 622 }));
              }
              setPlaying(p => !p);
            }}
            title={playing ? ({ tr: 'Durdur', en: 'Pause', ar: '' }[lang]) : ({ tr: 'Oynat', en: 'Play', ar: '' }[lang])}
          >
            {playing ? '⏸' : '▶'}
          </button>
          <input
            type="range" min={622} max={1924} step={1}
            value={filters.year}
            onChange={e => { setPlaying(false); setFilters(f => ({ ...f, year: +e.target.value })); }}
          />
          <span className="battle-year-val">622–{filters.year}</span>
        </div>
      </div>

      {/* Count */}
      <div className="battle-count">
        {filteredBattles.length} {ts.count || 'battles'}
      </div>

      {/* List */}
      <div className="battle-list">
        {filteredBattles.map(b => {
          const typeEn = b.type_en || 'Land';
          const icon = TYPE_ICONS[typeEn] || '⚔';
          const ot = getOutcomeType(b);
          const isActive = b.id === selectedId;
          return (
            <div
              key={b.id}
              className={`battle-item${isActive ? ' active' : ''}`}
              onClick={() => onSelectBattle(b.id)}
            >
              <span className="battle-yr">{b.yr}</span>
              <span className="battle-icon">{icon}</span>
              <div className="battle-info">
                <div className="battle-name">{n(b, lang)}</div>
                <div className="battle-sub">
                  {lf(b, 'cmd_m', lang)} vs {lf(b, 'cmd_o', lang)}
                </div>
              </div>
              <span className={`battle-outcome ${ot}`}>
                {ot === 'win' ? '✓' : ot === 'loss' ? '✗' : '~'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detail card */}
      <BattleCard battle={selectedBattle} lang={lang} t={t} />
    </div>
  );
}
