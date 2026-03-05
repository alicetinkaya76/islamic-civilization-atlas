import { useState, useMemo, useCallback } from 'react';
import DB from '../../data/db.json';
import BATTLE_META from '../../data/battle_meta';
import BattleMapView from './BattleMapView';
import BattleSidebar from './BattleSidebar';
import '../../styles/battles.css';

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

export default function BattleView({ lang, t }) {
  const [selectedId, setSelectedId] = useState(null);
  const [filters, setFilters] = useState({
    types: [], outcomes: [], year: 1924, search: '',
  });

  /* Merge battles with meta */
  const mergedBattles = useMemo(() =>
    DB.battles.map(b => ({ ...b, ...(BATTLE_META[b.id] || {}) })),
  []);

  /* Filter */
  const filtered = useMemo(() => {
    return mergedBattles.filter(b => {
      if (!b.lat || !b.lon) return false;
      // Type filter (inclusive: show if type matches any selected, or none selected = show all)
      if (filters.types.length) {
        const bType = b.type_en || 'Land';
        if (!filters.types.includes(bType)) return false;
      }
      // Year filter
      if (b.yr > filters.year) return false;
      // Outcome filter
      if (filters.outcomes.length) {
        const ot = getOutcomeType(b);
        if (!filters.outcomes.includes(ot)) return false;
      }
      // Search
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return (b.tr || '').toLowerCase().includes(q) ||
               (b.en || '').toLowerCase().includes(q) ||
               (b.cmd_m_tr || '').toLowerCase().includes(q) ||
               (b.cmd_m_en || '').toLowerCase().includes(q) ||
               (b.cmd_o_tr || '').toLowerCase().includes(q) ||
               (b.cmd_o_en || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [mergedBattles, filters]);

  /* Select handler */
  const handleSelect = useCallback((id) => {
    setSelectedId(prev => prev === id ? null : id);
    // flyTo
    const b = mergedBattles.find(x => x.id === id);
    if (b && b.lat && b.lon && window.__battleMapFlyTo) {
      window.__battleMapFlyTo(b.lat, b.lon);
    }
  }, [mergedBattles]);

  /* Selected battle object */
  const selectedBattle = useMemo(() =>
    selectedId ? mergedBattles.find(b => b.id === selectedId) : null,
  [selectedId, mergedBattles]);

  return (
    <div className="battle-view">
      <BattleMapView
        filteredBattles={filtered}
        selectedId={selectedId}
        onSelectBattle={handleSelect}
      />
      <BattleSidebar
        filteredBattles={filtered}
        selectedId={selectedId}
        onSelectBattle={handleSelect}
        filters={filters}
        setFilters={setFilters}
        selectedBattle={selectedBattle}
        lang={lang}
        t={t}
      />
    </div>
  );
}
