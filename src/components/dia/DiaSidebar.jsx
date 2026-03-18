import { useState, useCallback, useRef, useEffect } from 'react';

const FIELD_COLORS = {
  'fıkıh':'#4fc3f7','hadis':'#81c784','tefsir':'#4db6ac',
  'kelâm':'#7986cb','tasavvuf':'#9575cd','edebiyat':'#ce93d8',
  'tarih':'#90a4ae','felsefe':'#ffb74d','tıp':'#66bb6a',
  'astronomi':'#64b5f6','matematik':'#f06292','mûsiki':'#a1887f',
  'siyaset':'#ff8a65',
};

const ITEM_HEIGHT = 62;
const OVERSCAN = 6;

function VirtualList({ items, selectedId, onSelect, degreeMap }) {
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

  const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const endIdx = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN);

  return (
    <div ref={containerRef} className="dia-list-container" onScroll={e => setScrollTop(e.target.scrollTop)}>
      <div style={{ height: items.length * ITEM_HEIGHT, position: 'relative' }}>
        <div style={{ position: 'absolute', top: startIdx * ITEM_HEIGHT, left: 0, right: 0 }}>
          {items.slice(startIdx, endIdx).map(b => {
            const deg = degreeMap[b.id] || 0;
            return (
              <div key={b.id} className={`dia-list-item${b.id === selectedId ? ' selected' : ''}`}
                style={{ height: ITEM_HEIGHT }} onClick={() => onSelect(b.id)}>
                <div className="dia-list-heading">{b.t}</div>
                <div className="dia-list-meta">
                  {b.dc ? `ö. ${b.dc}` : b.bc ? `d. ${b.bc}` : ''}
                  {b.mz && <span className="dia-list-madhab"> · {b.mz}</span>}
                  {deg > 0 && <span className="dia-list-degree"> · 🔗{deg}</span>}
                </div>
                <div className="dia-list-fields">
                  {b.fl && b.fl.slice(0, 3).map(f => (
                    <span key={f} className="dia-field-badge" style={{ background: FIELD_COLORS[f] || '#546e7a' }}>{f}</span>
                  ))}
                  {b.is && <span className="dia-importance-bar" style={{ width: `${Math.min(b.is, 100)}%` }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DiaSidebar({
  lang, td, filtered, search, setSearch,
  selectedFields, setSelectedFields, selectedMadhab, setSelectedMadhab,
  centuryRange, setCenturyRange, importanceTier, setImportanceTier,
  selectedId, onSelect, fieldsList, madhabs, degreeMap,
}) {
  const [filtersOpen, setFiltersOpen] = useState(true);

  const toggleField = useCallback((f) => {
    setSelectedFields(prev => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  }, [setSelectedFields]);

  const clearAll = useCallback(() => {
    setSearch(''); setSelectedFields(new Set()); setSelectedMadhab('');
    setCenturyRange([7, 21]); setImportanceTier('all');
  }, [setSearch, setSelectedFields, setSelectedMadhab, setCenturyRange, setImportanceTier]);

  const hasFilters = search || selectedFields.size > 0 || selectedMadhab ||
    centuryRange[0] !== 7 || centuryRange[1] !== 21 || importanceTier !== 'all';

  return (
    <div className="dia-sidebar-inner">
      <div className="dia-search-box">
        <input type="text" className="dia-search-input"
          placeholder={td.searchPlaceholder || 'Âlim ara...'} value={search}
          onChange={e => setSearch(e.target.value)} />
        {search && <button className="dia-search-clear" onClick={() => setSearch('')}>✕</button>}
      </div>

      <button className="dia-filters-toggle" onClick={() => setFiltersOpen(p => !p)}>
        {filtersOpen ? '▾' : '▸'} {td.filters || 'Filtreler'}
        {hasFilters && <span className="dia-filter-active-dot" />}
      </button>

      {filtersOpen && (
        <div className="dia-filters">
          <div className="dia-filter-group">
            <label className="dia-filter-label">{td.fieldLabel || 'İlim Dalı'}</label>
            <div className="dia-field-chips">
              {fieldsList.map(f => (
                <button key={f} className={`dia-chip${selectedFields.has(f) ? ' active' : ''}`}
                  style={selectedFields.has(f) ? { background: FIELD_COLORS[f] || '#546e7a', color: '#fff' } : {}}
                  onClick={() => toggleField(f)}>{f}</button>
              ))}
            </div>
          </div>

          <div className="dia-filter-group">
            <label className="dia-filter-label">{td.madhabLabel || 'Mezhep'}</label>
            <select className="dia-select" value={selectedMadhab} onChange={e => setSelectedMadhab(e.target.value)}>
              <option value="">{td.allMadhabs || 'Tümü'}</option>
              {madhabs.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="dia-filter-group">
            <label className="dia-filter-label">{td.centuryLabel || 'Yüzyıl'}: {centuryRange[0]}. — {centuryRange[1]}.</label>
            <div className="dia-range-row">
              <input type="range" min={7} max={21} value={centuryRange[0]}
                onChange={e => setCenturyRange([Math.min(+e.target.value, centuryRange[1]), centuryRange[1]])} />
              <input type="range" min={7} max={21} value={centuryRange[1]}
                onChange={e => setCenturyRange([centuryRange[0], Math.max(+e.target.value, centuryRange[0])])} />
            </div>
          </div>

          <div className="dia-filter-group">
            <label className="dia-filter-label">{td.importanceLabel || 'Önem'}</label>
            <div className="dia-radio-row">
              {[['all', td.tierAll || 'Tümü'], ['important', td.tierImportant || 'Önemli (>50)'], ['top', td.tierTop || 'Çok Önemli (>70)']].map(([v, label]) => (
                <label key={v} className={`dia-radio${importanceTier === v ? ' active' : ''}`}>
                  <input type="radio" name="importance" value={v} checked={importanceTier === v}
                    onChange={() => setImportanceTier(v)} />{label}
                </label>
              ))}
            </div>
          </div>

          {hasFilters && <button className="dia-clear-btn" onClick={clearAll}>✕ {td.clearFilters || 'Filtreleri Temizle'}</button>}
        </div>
      )}

      <div className="dia-list-count"><strong>{filtered.length.toLocaleString()}</strong> {td.results || 'sonuç'}</div>
      <VirtualList items={filtered} selectedId={selectedId} onSelect={onSelect} degreeMap={degreeMap} />
    </div>
  );
}

export { FIELD_COLORS };
