import { useState, useCallback, useRef } from 'react';

/* ═══ Stop type icons ═══ */
const TYPE_ICONS = {
  capital: '👑', major_city: '🏙', city: '🏛', town: '🏘', village: '🏠',
  port: '⚓', fortress: '🏰', oasis: '🌴', shrine: '🕌', pilgrimage: '🕋',
  palace: '🏰', court: '👑', camp: '⛺', island: '🏝', departure: '🚶',
  destination: '📍', transit: '🔄', crossroads: '🔀', caravan_station: '🐫',
  rest_stop: '☕', ruins: '🏚', mine: '⛏', sea_event: '🌊', disaster: '⚡',
  military: '⚔', retreat: '🏕', residence: '🏠', customs: '🛂',
  ihram: '🕋', waypoint: '📌', territory: '🗺', historical_site: '🏛',
  caravan_camp: '🐪', island_city: '🏝',
};

/* ═══ Significance badge colors ═══ */
const SIG_COLORS = {
  high: '#e63946',
  medium: '#d4a84b',
  low: '#90a4ae',
};

/* ═══ Virtual list ═══ */
const ITEM_HEIGHT = 72;
const OVERSCAN = 5;

function VirtualList({ items, selectedId, onSelect, lang, voyageMap }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);

  const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const endIdx = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN);
  const visible = items.slice(startIdx, endIdx);

  return (
    <div ref={el => {
      containerRef.current = el;
      if (el) {
        const obs = new ResizeObserver(entries => {
          for (const e of entries) setContainerHeight(e.contentRect.height);
        });
        obs.observe(el);
      }
    }}
      className="rihla-list-container"
      onScroll={e => setScrollTop(e.target.scrollTop)}>
      <div style={{ height: items.length * ITEM_HEIGHT, position: 'relative' }}>
        <div style={{ position: 'absolute', top: startIdx * ITEM_HEIGHT, left: 0, right: 0 }}>
          {visible.map(s => {
            const v = voyageMap[s.voyage_id];
            const name = lang === 'ar' ? s.ar : lang === 'en' ? s.en : s.tr;
            const icon = TYPE_ICONS[s.type] || '📍';
            return (
              <div key={s.id}
                className={`rihla-list-item${s.id === selectedId ? ' selected' : ''}`}
                style={{ height: ITEM_HEIGHT }}
                onClick={() => onSelect(s.id)}>
                <div className="rihla-list-top">
                  <span className="rihla-list-voyage-dot" style={{ background: v?.color || '#999' }} />
                  <span className="rihla-list-icon">{icon}</span>
                  <div className="rihla-list-name">{name}</div>
                  <span className="rihla-list-sig" style={{ color: SIG_COLORS[s.sig] || '#999' }}>●</span>
                </div>
                {s.ar && <div className="rihla-list-arabic" dir="rtl">{s.ar}</div>}
                <div className="rihla-list-meta">
                  <span className="rihla-list-date">{s.arr || ''}</span>
                  {s.country && <span className="rihla-list-country"> · {s.country}</span>}
                  {s.people?.length > 0 && <span className="rihla-list-people"> · 👤{s.people.length}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══ Topic labels TR/EN ═══ */
const TOPIC_LABELS = {
  trade: { tr: 'Ticaret', en: 'Trade' },
  architecture: { tr: 'Mimari', en: 'Architecture' },
  politics: { tr: 'Siyaset', en: 'Politics' },
  pilgrimage: { tr: 'Hac', en: 'Pilgrimage' },
  sufism: { tr: 'Tasavvuf', en: 'Sufism' },
  port: { tr: 'Liman', en: 'Port' },
  transit: { tr: 'Geçiş', en: 'Transit' },
  return: { tr: 'Dönüş', en: 'Return' },
  hospitality: { tr: 'Misafirperverlik', en: 'Hospitality' },
  court: { tr: 'Saray', en: 'Court' },
  agriculture: { tr: 'Tarım', en: 'Agriculture' },
  interfaith: { tr: 'Dinlerarası', en: 'Interfaith' },
  history: { tr: 'Tarih', en: 'History' },
  geography: { tr: 'Coğrafya', en: 'Geography' },
  military: { tr: 'Askeri', en: 'Military' },
  hajj: { tr: 'Hac', en: 'Hajj' },
  death: { tr: 'Ölüm', en: 'Death' },
  illness: { tr: 'Hastalık', en: 'Illness' },
  departure: { tr: 'Ayrılış', en: 'Departure' },
  personal: { tr: 'Kişisel', en: 'Personal' },
  slavery: { tr: 'Kölelik', en: 'Slavery' },
  diplomacy: { tr: 'Diplomasi', en: 'Diplomacy' },
};

export default function RihlaSidebar({
  lang, tr, filtered, stops,
  search, setSearch,
  voyages, selectedVoyage, setSelectedVoyage,
  selectedCountry, setSelectedCountry,
  selectedSig, setSelectedSig,
  selectedTopics, setSelectedTopics,
  allCountries, allTopics,
  selectedId, onSelect, voyageMap,
}) {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const debounceRef = useRef(null);

  const handleSearch = useCallback((e) => {
    const val = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 200);
  }, [setSearch]);

  const toggleTopic = useCallback((topic) => {
    setSelectedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic); else next.add(topic);
      return next;
    });
  }, [setSelectedTopics]);

  return (
    <div className="rihla-sidebar-inner">
      {/* Search */}
      <div className="rihla-search-row">
        <span className="rihla-search-icon">🔍</span>
        <input type="text" className="rihla-search-input"
          placeholder={tr.search}
          defaultValue={search}
          onChange={handleSearch}
          aria-label={tr.search} />
      </div>

      {/* Filters toggle */}
      <button className="rihla-filters-toggle" onClick={() => setFiltersOpen(p => !p)}>
        {filtersOpen ? '▾' : '▸'} {tr.filtersTitle}
        <span className="rihla-filter-count">{filtered.length} {tr.entries}</span>
      </button>

      {filtersOpen && (
        <div className="rihla-filters">
          {/* Voyage chips */}
          <div className="rihla-filter-group">
            <label className="rihla-filter-label">{tr.voyageLabel}</label>
            <div className="rihla-voyage-chips">
              <button className={`rihla-voyage-chip${selectedVoyage === 0 ? ' active' : ''}`}
                onClick={() => setSelectedVoyage(0)}
                style={{ borderColor: selectedVoyage === 0 ? '#d4a84b' : 'transparent' }}>
                {tr.allVoyages}
              </button>
              {voyages.map(v => (
                <button key={v.id}
                  className={`rihla-voyage-chip${selectedVoyage === v.id ? ' active' : ''}`}
                  style={{
                    borderColor: selectedVoyage === v.id ? v.color : 'transparent',
                    color: v.color,
                  }}
                  onClick={() => setSelectedVoyage(selectedVoyage === v.id ? 0 : v.id)}>
                  <span className="rihla-vc-dot" style={{ background: v.color }} />
                  V{v.id} ({v.start_year}–{v.end_year})
                </button>
              ))}
            </div>
          </div>

          {/* Significance */}
          <div className="rihla-filter-group">
            <label className="rihla-filter-label">{tr.significance}</label>
            <div className="rihla-sig-row">
              <button className={`rihla-sig-btn${selectedSig === '' ? ' active' : ''}`}
                onClick={() => setSelectedSig('')}>{tr.allSig}</button>
              {['high', 'medium', 'low'].map(s => (
                <button key={s}
                  className={`rihla-sig-btn${selectedSig === s ? ' active' : ''}`}
                  style={{ color: SIG_COLORS[s] }}
                  onClick={() => setSelectedSig(selectedSig === s ? '' : s)}>
                  ● {tr[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Country */}
          <div className="rihla-filter-group">
            <label className="rihla-filter-label">{tr.country}</label>
            <select className="rihla-select" value={selectedCountry}
              onChange={e => setSelectedCountry(e.target.value)}>
              <option value="">{tr.allCountries}</option>
              {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Topics */}
          <div className="rihla-filter-group">
            <label className="rihla-filter-label">{tr.topics}</label>
            <div className="rihla-topic-chips">
              {allTopics.slice(0, 15).map(topic => (
                <button key={topic}
                  className={`rihla-topic-chip${selectedTopics.has(topic) ? ' active' : ''}`}
                  onClick={() => toggleTopic(topic)}>
                  {TOPIC_LABELS[topic]?.[lang] || topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* List header */}
      <div className="rihla-list-header">
        {filtered.length} {tr.entries}
        {filtered.length === 0 && <div className="rihla-no-results">{tr.noEntries}</div>}
      </div>

      <VirtualList
        items={filtered}
        selectedId={selectedId}
        onSelect={onSelect}
        lang={lang}
        voyageMap={voyageMap}
      />
    </div>
  );
}
