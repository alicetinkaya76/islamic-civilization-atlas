import { useState, useCallback, useRef, useMemo, useEffect } from 'react';

const eTitle = (e, lang) => lang === 'ar' ? (e.title_ar || e.title) : lang === 'en' ? (e.title_en || e.title) : e.title;


/* ═══ Event type icons ═══ */
const TYPE_ICONS = {
  battle: '⚔', siege: '🏰', conquest: '🚩', diplomacy: '🤝', treaty: '📜',
  death: '💀', raid: '🏇', military: '⚔', event: '📌', naval: '⛵',
  anecdote: '📖', assassination: '🗡', captivity: '⛓', encounter: '🤺',
  muslim_conquest: '☪️', muslim_capture: '☪️', crusader_capture: '✝️',
  muslim_victory: '🏆', muslim_defeat: '💔', crusader_defeat: '💔',
};

/* ═══ Outcome badges ═══ */
const OUTCOME_COLORS = {
  muslim_victory: '#4ade80',
  crusader_victory: '#ef4444',
  treaty: '#60a5fa',
  inconclusive: '#94a3b8',
  not_applicable: '#64748b',
};

/* ═══ Virtual list ═══ */
const ITEM_HEIGHT = 68;
const OVERSCAN = 5;

function VirtualList({ items, selectedId, onSelect, lang, sourceMap }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);

  /* FIX: proper ResizeObserver with cleanup */
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
  const visible = items.slice(startIdx, endIdx);

  return (
    <div ref={containerRef}
      className="sal-list-container"
      onScroll={e => setScrollTop(e.target.scrollTop)}>
      <div style={{ height: items.length * ITEM_HEIGHT, position: 'relative' }}>
        <div style={{ position: 'absolute', top: startIdx * ITEM_HEIGHT, left: 0, right: 0 }}>
          {visible.map(e => {
            const src = sourceMap[e.source_id];
            const icon = TYPE_ICONS[e.type] || '📌';
            return (
              <div key={e.id}
                className={`sal-list-item${e.id === selectedId ? ' selected' : ''}`}
                style={{ height: ITEM_HEIGHT }}
                onClick={() => onSelect(e.id)}>
                <div className="sal-list-top">
                  <span className="sal-list-source-dot" style={{ background: src?.color || '#999' }} />
                  <span className="sal-list-source-tag">{src?.short || '?'}</span>
                  <span className="sal-list-icon">{icon}</span>
                  <div className="sal-list-name">{eTitle(e, lang)}</div>
                  <span className="sal-list-year">{e.year}</span>
                </div>
                {e.arabic_text && (
                  <div className="sal-list-arabic" dir="rtl">
                    {e.arabic_text.slice(0, 55)}{e.arabic_text.length > 55 ? '…' : ''}
                  </div>
                )}
                <div className="sal-list-meta">
                  <span className="sal-list-location">{e.location || ''}</span>
                  {e.outcome && e.outcome !== 'not_applicable' && (
                    <span className="sal-list-outcome" style={{ color: OUTCOME_COLORS[e.outcome] }}>
                      ● {e.outcome.replace(/_/g, ' ')}
                    </span>
                  )}
                  {e.cluster_id && <span className="sal-list-cluster">🔗</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SalibiyyatSidebar({
  lang, tr, filtered, events, castles,
  sources, sourceMap, enums,
  search, setSearch,
  selectedSources, setSelectedSources,
  selectedType, setSelectedType,
  selectedOutcome, setSelectedOutcome,
  yearRange, setYearRange,
  selectedId, onSelectEvent,
  selectedCastleId, onSelectCastle,
  clusterMap, eventClusterMap,
}) {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [showCastles, setShowCastles] = useState(false);
  const debounceRef = useRef(null);

  const handleSearch = useCallback((e) => {
    const val = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 200);
  }, [setSearch]);

  /* FIX: cleanup debounce timer */
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const toggleSource = useCallback((sourceId) => {
    setSelectedSources(prev => {
      const next = new Set(prev);
      if (next.has(sourceId)) next.delete(sourceId); else next.add(sourceId);
      return next;
    });
  }, [setSelectedSources]);

  /* ── Event type list from enums ── */
  const eventTypes = useMemo(() => {
    if (!enums.event_types) return [];
    return Object.entries(enums.event_types).map(([k, v]) => ({
      key: k,
      label: lang === 'ar' ? v.ar : lang === 'en' ? v.en : v.tr,
    }));
  }, [enums, lang]);

  const outcomeTypes = useMemo(() => {
    if (!enums.outcome_types) return [];
    return Object.entries(enums.outcome_types)
      .filter(([k]) => k !== 'not_applicable')
      .map(([k, v]) => ({
        key: k,
        label: lang === 'ar' ? v.ar : lang === 'en' ? v.en : v.tr,
      }));
  }, [enums, lang]);

  /* ── Source stats ── */
  const sourceStats = useMemo(() => {
    const m = {};
    filtered.forEach(e => { m[e.source_id] = (m[e.source_id] || 0) + 1; });
    return m;
  }, [filtered]);

  return (
    <div className="sal-sidebar-inner">
      {/* Search */}
      <div className="sal-search-row">
        <span className="sal-search-icon">🔍</span>
        <input type="text" className="sal-search-input"
          placeholder={tr.search}
          defaultValue={search}
          onChange={handleSearch}
          aria-label={tr.search} />
      </div>

      {/* Filters toggle */}
      <button className="sal-filters-toggle" onClick={() => setFiltersOpen(p => !p)}>
        {filtersOpen ? '▾' : '▸'} {tr.filtersTitle}
        <span className="sal-filter-count">{filtered.length} {tr.entries}</span>
      </button>

      {filtersOpen && (
        <div className="sal-filters">
          {/* Source checkboxes */}
          <div className="sal-filter-group">
            <label className="sal-filter-label">📚 {tr.source}</label>
            <div className="sal-source-chips">
              {sources.map(s => (
                <button key={s.id}
                  className={`sal-source-chip${selectedSources.has(s.id) ? ' active' : ''}`}
                  style={{
                    borderColor: selectedSources.has(s.id) ? s.color : 'transparent',
                    color: s.color,
                  }}
                  onClick={() => toggleSource(s.id)}>
                  <span className="sal-sc-dot" style={{ background: s.color }} />
                  {s.short}
                  <span className="sal-sc-count">{sourceStats[s.id] || 0}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Event type */}
          <div className="sal-filter-group">
            <label className="sal-filter-label">📋 {tr.eventType}</label>
            <select className="sal-select" value={selectedType}
              onChange={e => setSelectedType(e.target.value)}>
              <option value="">{tr.allTypes}</option>
              {eventTypes.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>

          {/* Outcome */}
          <div className="sal-filter-group">
            <label className="sal-filter-label">🏁 {tr.outcome}</label>
            <div className="sal-outcome-row">
              <button className={`sal-outcome-btn${selectedOutcome === '' ? ' active' : ''}`}
                onClick={() => setSelectedOutcome('')}>{tr.allOutcomes}</button>
              {outcomeTypes.map(o => (
                <button key={o.key}
                  className={`sal-outcome-btn${selectedOutcome === o.key ? ' active' : ''}`}
                  style={{ color: OUTCOME_COLORS[o.key] }}
                  onClick={() => setSelectedOutcome(selectedOutcome === o.key ? '' : o.key)}>
                  ● {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Year range */}
          <div className="sal-filter-group">
            <label className="sal-filter-label">📅 {tr.yearRange}: {yearRange[0]}–{yearRange[1]}</label>
            <div className="sal-year-sliders">
              <input type="range" min={1096} max={1438} value={yearRange[0]}
                onChange={e => setYearRange([Math.min(Number(e.target.value), yearRange[1]), yearRange[1]])}
                className="sal-year-input" />
              <input type="range" min={1096} max={1438} value={yearRange[1]}
                onChange={e => setYearRange([yearRange[0], Math.max(Number(e.target.value), yearRange[0])])}
                className="sal-year-input" />
            </div>
          </div>
        </div>
      )}

      {/* ── Toggle: Events / Castles ── */}
      <div className="sal-list-toggle">
        <button className={!showCastles ? 'active' : ''} onClick={() => setShowCastles(false)}>
          ⚔ {tr.totalEvents} ({filtered.length})
        </button>
        <button className={showCastles ? 'active' : ''} onClick={() => setShowCastles(true)}>
          🏰 {tr.castleCount} ({castles.length})
        </button>
      </div>

      {/* Event list or Castle list */}
      {!showCastles ? (
        <>
          <div className="sal-list-header">
            {filtered.length} {tr.entries}
            {filtered.length === 0 && <div className="sal-no-results">{tr.noEntries}</div>}
          </div>
          <VirtualList
            items={filtered}
            selectedId={selectedId}
            onSelect={onSelectEvent}
            lang={lang}
            sourceMap={sourceMap}
          />
        </>
      ) : (
        <div className="sal-castle-list">
          {castles.map(c => {
            const name = lang === 'ar' ? c.name_ar : lang === 'en' ? c.name_en : c.name_tr;
            return (
              <div key={c.id}
                className={`sal-list-item sal-castle-item${c.id === selectedCastleId ? ' selected' : ''}`}
                onClick={() => onSelectCastle(c.id)}>
                <div className="sal-list-top">
                  <span className="sal-list-icon">🏰</span>
                  <div className="sal-list-name">{name}</div>
                  {c.unesco && <span className="sal-castle-unesco">UNESCO</span>}
                  {c.cross_ref && <span className="sal-list-crossref" title="Cross-reference">↗</span>}
                </div>
                {c.name_ar && <div className="sal-list-arabic" dir="rtl">{c.name_ar}</div>}
                <div className="sal-list-meta">
                  <span className="sal-list-location">{c.crusader_state || ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
