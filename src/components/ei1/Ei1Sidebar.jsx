import { useState, useCallback, useRef, useEffect } from 'react';
import { EI1_FIELD_COLORS } from './ei1Constants';

const ITEM_HEIGHT = 64;
const OVERSCAN = 6;

const TYPE_ICONS = {
  biography: '👤',
  geography: '🌍',
  concept: '💡',
  dynasty: '👑',
  cross_reference: '🔗',
  unknown: '📄',
};

const TYPE_LABELS = {
  biography: { tr: 'Biyografi', en: 'Biography', ar: 'سيرة' },
  geography: { tr: 'Coğrafya', en: 'Geography', ar: 'جغرافيا' },
  concept: { tr: 'Kavram', en: 'Concept', ar: 'مفهوم' },
  dynasty: { tr: 'Hanedan', en: 'Dynasty', ar: 'سلالة' },
  cross_reference: { tr: 'Çapraz Ref.', en: 'Cross Ref.', ar: 'مرجع' },
};

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

  const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const endIdx = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN);

  return (
    <div ref={containerRef} className="ei1-list-container" onScroll={e => setScrollTop(e.target.scrollTop)}>
      <div style={{ height: items.length * ITEM_HEIGHT, position: 'relative' }}>
        <div style={{ position: 'absolute', top: startIdx * ITEM_HEIGHT, left: 0, right: 0 }}>
          {items.slice(startIdx, endIdx).map(b => (
            <div key={b.id} className={`ei1-list-item${b.id === selectedId ? ' selected' : ''}`}
              style={{ height: ITEM_HEIGHT }} onClick={() => onSelect(b.id)}>
              <div className="ei1-list-type-icon">{TYPE_ICONS[b.at || 'unknown'] || '📄'}</div>
              <div className="ei1-list-content">
                <div className="ei1-list-heading">{b.t}</div>
                <div className="ei1-list-meta">
                  {b.dc ? `d. ${b.dc}` : b.bc ? `b. ${b.bc}` : ''}
                  {b.au && <span className="ei1-list-author"> · {b.au}</span>}
                  {b.vol && <span className="ei1-list-vol"> · Vol.{b.vol}</span>}
                </div>
                <div className="ei1-list-fields">
                  {b.fl && b.fl.slice(0, 3).map(f => (
                    <span key={f} className="ei1-field-badge" style={{ background: EI1_FIELD_COLORS[f] || '#546e7a' }}>{f}</span>
                  ))}
                  {b.is > 0 && <span className="ei1-importance-bar" style={{ width: `${Math.min(b.is, 100)}%` }} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Ei1Sidebar({
  lang, te, filtered, search, setSearch,
  selectedFields, setSelectedFields, articleType, setArticleType,
  centuryRange, setCenturyRange, importanceTier, setImportanceTier,
  onlyBio, setOnlyBio,
  selectedId, onSelect, fieldsList, articleTypes,
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
    setSearch(''); setSelectedFields(new Set()); setArticleType('');
    setCenturyRange([1, 21]); setImportanceTier('all'); setOnlyBio(false);
  }, [setSearch, setSelectedFields, setArticleType, setCenturyRange, setImportanceTier, setOnlyBio]);

  const hasFilters = search || selectedFields.size > 0 || articleType ||
    centuryRange[0] !== 1 || centuryRange[1] !== 21 || importanceTier !== 'all' || onlyBio;

  return (
    <div className="ei1-sidebar-inner">
      <div className="ei1-search-box">
        <input type="text" className="ei1-search-input"
          placeholder={te.searchPlaceholder || 'Search entries...'}
          value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button className="ei1-search-clear" onClick={() => setSearch('')}>✕</button>}
      </div>

      <button className="ei1-filters-toggle" onClick={() => setFiltersOpen(p => !p)}>
        {filtersOpen ? '▾' : '▸'} {te.filters || 'Filters'}
        {hasFilters && <span className="ei1-filter-active-dot" />}
      </button>

      {filtersOpen && (
        <div className="ei1-filters">
          {/* Bio-only toggle */}
          <label className="ei1-bio-toggle">
            <input type="checkbox" checked={onlyBio} onChange={e => setOnlyBio(e.target.checked)} />
            <span>{te.onlyBio || 'Only Biographies'}</span>
          </label>

          {/* Article type */}
          <div className="ei1-filter-group">
            <label className="ei1-filter-label">{te.articleTypeLabel || 'Article Type'}</label>
            <select className="ei1-select" value={articleType} onChange={e => setArticleType(e.target.value)}>
              <option value="">{te.allTypes || 'All'}</option>
              {articleTypes.map(t => (
                <option key={t} value={t}>
                  {TYPE_ICONS[t]} {TYPE_LABELS[t]?.[lang] || t}
                </option>
              ))}
            </select>
          </div>

          {/* Field chips */}
          <div className="ei1-filter-group">
            <label className="ei1-filter-label">{te.fieldLabel || 'Field'}</label>
            <div className="ei1-field-chips">
              {fieldsList.map(f => (
                <button key={f} className={`ei1-chip${selectedFields.has(f) ? ' active' : ''}`}
                  style={selectedFields.has(f) ? { background: EI1_FIELD_COLORS[f] || '#546e7a', color: '#fff' } : {}}
                  onClick={() => toggleField(f)}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Century range */}
          <div className="ei1-filter-group">
            <label className="ei1-filter-label">
              {te.centuryLabel || 'Century'}: {centuryRange[0]}. — {centuryRange[1]}.
            </label>
            <div className="ei1-range-row">
              <input type="range" min={1} max={21} value={centuryRange[0]}
                onChange={e => setCenturyRange([Math.min(+e.target.value, centuryRange[1]), centuryRange[1]])} />
              <input type="range" min={1} max={21} value={centuryRange[1]}
                onChange={e => setCenturyRange([centuryRange[0], Math.max(+e.target.value, centuryRange[0])])} />
            </div>
          </div>

          {/* Importance */}
          <div className="ei1-filter-group">
            <label className="ei1-filter-label">{te.importanceLabel || 'Confidence'}</label>
            <div className="ei1-radio-row">
              {[['all', te.tierAll || 'All'], ['important', te.tierImportant || 'Medium+ (>40)'], ['top', te.tierTop || 'High (>60)']].map(([v, label]) => (
                <label key={v} className={`ei1-radio${importanceTier === v ? ' active' : ''}`}>
                  <input type="radio" name="importance" value={v} checked={importanceTier === v}
                    onChange={() => setImportanceTier(v)} />{label}
                </label>
              ))}
            </div>
          </div>

          {hasFilters && <button className="ei1-clear-btn" onClick={clearAll}>✕ {te.clearFilters || 'Clear Filters'}</button>}
        </div>
      )}

      <div className="ei1-list-count"><strong>{filtered.length.toLocaleString()}</strong> {te.results || 'results'}</div>
      <VirtualList items={filtered} selectedId={selectedId} onSelect={onSelect} lang={lang} />
    </div>
  );
}
