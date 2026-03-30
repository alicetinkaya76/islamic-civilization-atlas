import { useRef, useEffect, useCallback, memo } from 'react';

/* ═══ Geo type icons ═══ */
const GEO_ICONS = {
  province: '🏛️', city: '🏙️', town: '🏘️', village: '🏠',
  river: '🌊', canal: '🚿', lake: '💧', sea: '🌊',
  mountain: '⛰️', desert: '🏜️', pass: '🏔️',
  fortress: '🏰', castle: '🏰', island: '🏝️', port: '⚓', oasis: '🌴',
  district: '📍', region: '🗺️', bridge: '🌉', monastery: '⛪',
  mine: '⛏️', swamp: '🌿',
};

/* ═══ Province color dots ═══ */
const PROVINCE_COLORS = {
  "ʿIrāq": '#e6194b', "Khurāsān": '#3cb44b', "al-Jazīra": '#ffe119',
  "Rūm": '#4363d8', "Khūzistān": '#f58231', "Sughd": '#911eb4',
  "Fārs": '#42d4f4', "Upper Euphrates": '#f032e6', "Sijistān": '#bfef45',
  "Ādharbāyjān": '#fabed4', "al-Jibāl": '#469990', "Kirmān": '#dcbeff',
  "Makrān": '#9A6324', "Kūhistān": '#fffac8', "Khwārizm": '#800000',
};

function getName(r, lang) {
  if (lang === 'ar') return r.name_ar || r.name_en;
  if (lang === 'en') return r.name_en || r.name_tr;
  return r.name_tr || r.name_en;
}

/* ═══ List item ═══ */
const ListItem = memo(function ListItem({ r, lang, selected, onSelect, xref }) {
  const name = getName(r, lang);
  const icon = GEO_ICONS[r.geo_type] || '📍';
  const color = PROVINCE_COLORS[r.province] || '#808080';
  const recXref = xref[String(r.id)];
  const hasXref = recXref && Object.keys(recXref).length > 0;

  return (
    <button
      className={`ls-list-item${selected ? ' selected' : ''}`}
      onClick={() => onSelect(r.id)}
      title={r.le_strange_form || name}
    >
      <span className="ls-item-icon">{icon}</span>
      <div className="ls-item-body">
        <span className="ls-item-name">{name}</span>
        {r.le_strange_form && r.le_strange_form !== name && (
          <span className="ls-item-ls-form">{r.le_strange_form}</span>
        )}
      </div>
      <div className="ls-item-meta">
        <span className="ls-item-province-dot" style={{ background: color }} title={r.province} />
        {hasXref && <span className="ls-item-xref-badge" title="Cross-references">🔗</span>}
      </div>
    </button>
  );
});

export default function LeStrangeSidebar({
  lang, tr, filtered, records,
  search, setSearch,
  allProvinces, allGeoTypes, allChapters, allPeriods,
  selectedProvince, setSelectedProvince,
  selectedGeoType, setSelectedGeoType,
  selectedPeriod, setSelectedPeriod,
  selectedChapter, setSelectedChapter,
  sortBy, setSortBy,
  selectedId, onSelect, xref,
}) {
  const listRef = useRef(null);

  /* Auto-scroll to selected */
  useEffect(() => {
    if (!selectedId || !listRef.current) return;
    const el = listRef.current.querySelector('.ls-list-item.selected');
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedProvince('');
    setSelectedGeoType('');
    setSelectedPeriod('');
    setSelectedChapter(0);
  }, [setSearch, setSelectedProvince, setSelectedGeoType, setSelectedPeriod, setSelectedChapter]);

  const hasFilters = search || selectedProvince || selectedGeoType || selectedPeriod || selectedChapter;

  return (
    <div className="ls-sidebar-inner">
      {/* Search */}
      <div className="ls-search-row">
        <input
          type="text"
          className="ls-search-input"
          placeholder={tr.search}
          value={search}
          onChange={e => setSearch(e.target.value)}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        />
        {hasFilters && (
          <button className="ls-clear-btn" onClick={clearFilters} title="Clear filters">✕</button>
        )}
      </div>

      {/* Filters */}
      <div className="ls-filters">
        <select value={selectedProvince} onChange={e => setSelectedProvince(e.target.value)}
          className="ls-filter-select">
          <option value="">{tr.allProvinces} ({allProvinces.length})</option>
          {allProvinces.map(p => (
            <option key={p.name} value={p.name}>{p.name} ({p.count})</option>
          ))}
        </select>

        <select value={selectedGeoType} onChange={e => setSelectedGeoType(e.target.value)}
          className="ls-filter-select">
          <option value="">{tr.allTypes} ({allGeoTypes.length})</option>
          {allGeoTypes.map(g => (
            <option key={g.name} value={g.name}>{GEO_ICONS[g.name] || '📍'} {g.name} ({g.count})</option>
          ))}
        </select>

        <select value={selectedChapter} onChange={e => setSelectedChapter(Number(e.target.value))}
          className="ls-filter-select">
          <option value={0}>{tr.allChapters} ({allChapters.length})</option>
          {allChapters.map(c => (
            <option key={c.num} value={c.num}>Ch. {c.num}: {c.title} ({c.count})</option>
          ))}
        </select>

        <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}
          className="ls-filter-select">
          <option value="">{tr.allPeriods} ({allPeriods.length})</option>
          {allPeriods.map(p => (
            <option key={p.name} value={p.name}>{p.name} ({p.count})</option>
          ))}
        </select>
      </div>

      {/* Sort + count */}
      <div className="ls-sort-row">
        <span className="ls-count">
          <strong>{filtered.length}</strong>/{records.length} {tr.entries}
        </span>
        <div className="ls-sort-btns">
          <button className={sortBy === 'chapter' ? 'active' : ''} onClick={() => setSortBy('chapter')} title={tr.sortChapter}>📖</button>
          <button className={sortBy === 'name' ? 'active' : ''} onClick={() => setSortBy('name')} title={tr.sortName}>🔤</button>
          <button className={sortBy === 'province' ? 'active' : ''} onClick={() => setSortBy('province')} title={tr.sortProvince}>🏛️</button>
        </div>
      </div>

      {/* List */}
      <div className="ls-list" ref={listRef}>
        {filtered.length === 0 ? (
          <div className="ls-empty">{tr.noEntries}</div>
        ) : (
          filtered.map(r => (
            <ListItem
              key={r.id}
              r={r}
              lang={lang}
              selected={r.id === selectedId}
              onSelect={onSelect}
              xref={xref}
            />
          ))
        )}
      </div>
    </div>
  );
}
