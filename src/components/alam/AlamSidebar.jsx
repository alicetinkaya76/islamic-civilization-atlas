import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

/* ═══ Profession color map (consistent with scholar disc colors) ═══ */
const PROF_COLORS = {
  'Fıkıh Âlimi': '#4fc3f7', 'Şair': '#ce93d8', 'Emîr': '#ff8a65',
  'Muhaddis': '#81c784', 'Edib': '#a1887f', 'Tarihçi': '#90a4ae',
  'Kadı': '#4dd0e1', 'Kumandan': '#ef5350', 'Dilci': '#7986cb',
  'Mutasavvıf': '#9575cd', 'Âlim': '#c9a84c', 'Tabip': '#66bb6a',
  'Sultan': '#ffd54f', 'Müfessir': '#4db6ac', 'Vezir': '#ffb74d',
  'Kâtip': '#8d6e63', 'Müsteşrik': '#78909c', 'Vali': '#f06292',
  'Sahâbî': '#aed581', 'Gazeteci': '#64b5f6',
};

/* ═══ Virtual list: render only visible items ═══ */
const ITEM_HEIGHT = 64;
const OVERSCAN = 5;

function VirtualList({ items, selectedId, onSelect, lang }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries) setContainerHeight(e.contentRect.height);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const endIdx = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN);
  const totalHeight = items.length * ITEM_HEIGHT;
  const offsetY = startIdx * ITEM_HEIGHT;
  const visible = items.slice(startIdx, endIdx);

  return (
    <div ref={containerRef} className="alam-list-container" onScroll={handleScroll}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
          {visible.map(b => (
            <div key={b.id}
              className={`alam-list-item${b.id === selectedId ? ' selected' : ''}`}
              style={{ height: ITEM_HEIGHT }}
              onClick={() => onSelect(b.id)}>
              <div className="alam-list-heading" dir="rtl">{b.h}</div>
              <div className="alam-list-name">{lang === 'tr' ? b.ht : b.he}</div>
              <div className="alam-list-meta">
                {b.md ? `ö. ${b.md}` : b.mb ? `d. ${b.mb}` : ''}
                {(b.pt || b.pe) && <span className="alam-list-prof"> · {lang === 'tr' ? b.pt : b.pe}</span>}
                {b.wc && <span className="alam-list-works"> · 📚{b.wc}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AlamSidebar({
  lang, ta, filtered, search, setSearch,
  periodRange, setPeriodRange,
  selectedRegion, setSelectedRegion,
  selectedProfessions, setSelectedProfessions,
  selectedMadhab, setSelectedMadhab,
  selectedGender, setSelectedGender,
  selectedId, onSelect,
  topProfessions, allRegions, madhabs,
}) {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const debounceRef = useRef(null);

  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 200);
  }, [setSearch]);

  const toggleProfession = useCallback((prof) => {
    setSelectedProfessions(prev => {
      const next = new Set(prev);
      if (next.has(prof)) next.delete(prof);
      else next.add(prof);
      return next;
    });
  }, [setSelectedProfessions]);

  /* Profession mapping for EN */
  const PROF_EN = {
    'Fıkıh Âlimi': 'Jurist', 'Şair': 'Poet', 'Emîr': 'Ruler/Emir',
    'Muhaddis': 'Hadith Scholar', 'Edib': 'Litterateur', 'Tarihçi': 'Historian',
    'Kadı': 'Judge', 'Kumandan': 'Commander', 'Dilci': 'Linguist',
    'Mutasavvıf': 'Sufi', 'Âlim': 'Scholar', 'Tabip': 'Physician',
    'Sultan': 'Sultan', 'Müfessir': 'Exegete', 'Vezir': 'Vizier',
    'Kâtip': 'Scribe', 'Müsteşrik': 'Orientalist', 'Vali': 'Governor',
    'Sahâbî': 'Companion', 'Gazeteci': 'Journalist',
  };

  return (
    <div className="alam-sidebar-inner">
      {/* Search */}
      <div className="alam-search-row">
        <span className="alam-search-icon">🔍</span>
        <input type="text" className="alam-search-input"
          placeholder={ta.search || 'Search…'}
          defaultValue={search}
          onChange={handleSearchChange}
          aria-label={ta.search} />
      </div>

      {/* Filters toggle */}
      <button className="alam-filters-toggle" onClick={() => setFiltersOpen(p => !p)}>
        {filtersOpen ? '▾' : '▸'} {lang === 'tr' ? 'Filtreler' : 'Filters'}
        <span className="alam-filter-count">{filtered.length.toLocaleString()} {ta.biographies}</span>
      </button>

      {filtersOpen && (
        <div className="alam-filters">
          {/* Period slider */}
          <div className="alam-filter-group">
            <label className="alam-filter-label">{ta.period}: {periodRange[0]}–{periodRange[1]} {ta.miladi}</label>
            <div className="alam-range-row">
              <input type="range" min={600} max={2000} step={50}
                value={periodRange[0]}
                onChange={e => setPeriodRange([+e.target.value, periodRange[1]])}
                className="alam-range" />
              <input type="range" min={600} max={2000} step={50}
                value={periodRange[1]}
                onChange={e => setPeriodRange([periodRange[0], +e.target.value])}
                className="alam-range" />
            </div>
          </div>

          {/* Region */}
          <div className="alam-filter-group">
            <label className="alam-filter-label">{ta.region}</label>
            <select className="alam-select" value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value)}>
              <option value="">{ta.allRegions}</option>
              {allRegions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Profession chips */}
          <div className="alam-filter-group">
            <label className="alam-filter-label">{ta.profession}</label>
            <div className="alam-prof-chips">
              {topProfessions.map(p => (
                <button key={p}
                  className={`disc-pill${selectedProfessions.has(p) ? ' active' : ''}`}
                  style={{ color: PROF_COLORS[p] || '#c9a84c', borderColor: selectedProfessions.has(p) ? (PROF_COLORS[p] || '#c9a84c') : 'transparent' }}
                  onClick={() => toggleProfession(p)}>
                  {lang === 'tr' ? p : (PROF_EN[p] || p)}
                </button>
              ))}
            </div>
          </div>

          {/* Madhab */}
          <div className="alam-filter-group">
            <label className="alam-filter-label">{ta.fiqhMadhab}</label>
            <select className="alam-select" value={selectedMadhab}
              onChange={e => setSelectedMadhab(e.target.value)}>
              <option value="">{ta.allMadhabs}</option>
              {madhabs.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Gender */}
          <div className="alam-filter-group">
            <label className="alam-filter-label">{ta.gender}</label>
            <div className="alam-gender-row">
              <button className={`alam-gender-btn${selectedGender === '' ? ' active' : ''}`}
                onClick={() => setSelectedGender('')}>{ta.allGenders}</button>
              <button className={`alam-gender-btn${selectedGender === 'M' ? ' active' : ''}`}
                onClick={() => setSelectedGender('M')}>{ta.male}</button>
              <button className={`alam-gender-btn${selectedGender === 'F' ? ' active' : ''}`}
                onClick={() => setSelectedGender('F')}>{ta.female}</button>
            </div>
          </div>

          {/* DIA random */}
          <button className="alam-random-dia" onClick={() => {
            const diaBios = filtered.filter(b => b.ds);
            if (diaBios.length) {
              const pick = diaBios[Math.floor(Math.random() * diaBios.length)];
              window.open(`https://islamansiklopedisi.org.tr/${pick.ds}`, '_blank');
            }
          }}>
            🎲 {ta.randomDia}
          </button>
        </div>
      )}

      {/* Biography list */}
      <div className="alam-list-header">
        {filtered.length.toLocaleString()} {ta.biographies}
        {filtered.length === 0 && <div className="alam-no-results">{ta.noBio}</div>}
      </div>

      <VirtualList
        items={filtered}
        selectedId={selectedId}
        onSelect={onSelect}
        lang={lang}
      />
    </div>
  );
}

export { PROF_COLORS };
