import { useState, useCallback, useRef, useEffect } from 'react';
import T from '../../data/i18n';

/* ═══ Virtual list ═══ */
const ITEM_HEIGHT = 58;
const OVERSCAN = 5;

function VirtualList({ items, selectedId, onSelect, lang, catMeta }) {
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

  const handleScroll = useCallback((e) => setScrollTop(e.target.scrollTop), []);

  const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const endIdx = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN);
  const totalHeight = items.length * ITEM_HEIGHT;
  const offsetY = startIdx * ITEM_HEIGHT;
  const visible = items.slice(startIdx, endIdx);

  return (
    <div ref={containerRef} className="khitat-list-container" onScroll={handleScroll}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
          {visible.map(s => {
            const meta = catMeta[s.cat] || {};
            return (
              <div key={s.id}
                className={`khitat-list-item${s.id === selectedId ? ' selected' : ''}`}
                style={{ height: ITEM_HEIGHT }}
                onClick={() => onSelect(s.id)}>
                <span className="khitat-list-icon" style={{ color: meta.color || '#999' }}>{meta.icon || '📍'}</span>
                <div className="khitat-list-text">
                  <div className="khitat-list-name" dir="rtl">{s.ar}</div>
                  <div className="khitat-list-meta">
                    <span className="khitat-list-cat" style={{ color: meta.color || '#999' }}>
                      {lang === 'en' ? (meta.en || s.cat) : (meta.tr || s.cat)}
                    </span>
                    {s.ah && <span className="khitat-list-date"> · {s.ah} H</span>}
                    {s.st === 'extant' && <span className="khitat-list-status extant"> ✓</span>}
                    {s.st === 'demolished' && <span className="khitat-list-status demolished"> ✗</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══ Session labels ═══ */
const SESSION_LABELS = {
  tr: ['Tümü', 'S1: Câmiʿler', 'S2: Medrese/Hankâh', 'S3: Dûr/Hammâm/Sûk', 'S4: Altyapı/Kale', 'S5: Dini/Mezarlık'],
  en: ['All', 'S1: Mosques', 'S2: Madrasa/Sufi', 'S3: Palaces/Baths/Markets', 'S4: Infrastructure', 'S5: Religious/Cemeteries'],
  ar: ['الكل', 'ج١: الجوامع', 'ج٢: المدارس/الخوانق', 'ج٣: الدور/الحمامات/الأسواق', 'ج٤: البنية التحتية', 'ج٥: الدينية/المقابر'],
};

export default function KhitatSidebar({
  lang, tk, filtered, search, setSearch,
  selectedCats, setSelectedCats,
  selectedSession, setSelectedSession,
  selectedStatus, setSelectedStatus,
  dateRange, setDateRange,
  selectedId, onSelect,
  allCats, catMeta,
  sortBy, setSortBy,
}) {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const debounceRef = useRef(null);

  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 200);
  }, [setSearch]);

  const toggleCat = useCallback((cat) => {
    setSelectedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, [setSelectedCats]);

  const sessLabels = SESSION_LABELS[lang] || SESSION_LABELS.tr;

  return (
    <div className="khitat-sidebar-inner">
      {/* Search */}
      <div className="khitat-search-row">
        <span className="khitat-search-icon">🔍</span>
        <input type="text" className="khitat-search-input"
          placeholder={tk.search || 'Yapı ara…'}
          defaultValue={search}
          onChange={handleSearchChange}
          aria-label={tk.search} />
      </div>

      {/* Filters toggle */}
      <button className="khitat-filters-toggle" onClick={() => setFiltersOpen(p => !p)}>
        {filtersOpen ? '▾' : '▸'} {tk.filters || 'Filtreler'}
        <span className="khitat-filter-count">{filtered.length} {tk.structures || 'yapı'}</span>
      </button>

      {filtersOpen && (
        <div className="khitat-filters">
          {/* Session filter */}
          <div className="khitat-filter-group">
            <label className="khitat-filter-label">{tk.session || 'Oturum'}</label>
            <select className="khitat-select" value={selectedSession}
              onChange={e => setSelectedSession(+e.target.value)}>
              {sessLabels.map((l, i) => <option key={i} value={i}>{l}</option>)}
            </select>
          </div>

          {/* Date range (Hijri) */}
          <div className="khitat-filter-group">
            <label className="khitat-filter-label">
              {tk.dateRange || 'Tarih'}: {dateRange[0]}–{dateRange[1]} H
            </label>
            <div className="khitat-range-row">
              <input type="range" min={0} max={900} step={25}
                value={dateRange[0]}
                onChange={e => setDateRange([+e.target.value, dateRange[1]])}
                className="khitat-range" />
              <input type="range" min={0} max={900} step={25}
                value={dateRange[1]}
                onChange={e => setDateRange([dateRange[0], +e.target.value])}
                className="khitat-range" />
            </div>
          </div>

          {/* Status */}
          <div className="khitat-filter-group">
            <label className="khitat-filter-label">{tk.status || 'Durum'}</label>
            <div className="khitat-status-row">
              <button className={`khitat-status-btn${selectedStatus === '' ? ' active' : ''}`}
                onClick={() => setSelectedStatus('')}>{tk.all || 'Tümü'}</button>
              <button className={`khitat-status-btn extant${selectedStatus === 'extant' ? ' active' : ''}`}
                onClick={() => setSelectedStatus('extant')}>{tk.extant || 'Mevcut'}</button>
              <button className={`khitat-status-btn demolished${selectedStatus === 'demolished' ? ' active' : ''}`}
                onClick={() => setSelectedStatus('demolished')}>{tk.demolished || 'Yıkılmış'}</button>
            </div>
          </div>

          {/* Category chips */}
          <div className="khitat-filter-group">
            <label className="khitat-filter-label">{tk.categories || 'Kategoriler'}</label>
            <div className="khitat-cat-chips">
              {allCats.map(c => (
                <button key={c.cat}
                  className={`khitat-cat-chip${selectedCats.has(c.cat) ? ' active' : ''}`}
                  style={{
                    color: c.color,
                    borderColor: selectedCats.has(c.cat) ? c.color : 'transparent',
                  }}
                  onClick={() => toggleCat(c.cat)}>
                  {c.icon} {lang === 'en' ? c.en : c.tr} <small>({c.count})</small>
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="khitat-filter-group">
            <label className="khitat-filter-label">{tk.sortBy || 'Sıralama'}</label>
            <select className="khitat-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="id">ID</option>
              <option value="date">{tk.byDate || 'Tarih'}</option>
              <option value="cat">{tk.byCat || 'Kategori'}</option>
              <option value="name">{tk.byName || 'İsim'}</option>
            </select>
          </div>
        </div>
      )}

      {/* List header */}
      <div className="khitat-list-header">
        {filtered.length} {tk.structures || 'yapı'}
        {filtered.length === 0 && <div className="khitat-no-results">{tk.noResults || 'Sonuç bulunamadı'}</div>}
      </div>

      <VirtualList
        items={filtered}
        selectedId={selectedId}
        onSelect={onSelect}
        lang={lang}
        catMeta={catMeta}
      />
    </div>
  );
}
