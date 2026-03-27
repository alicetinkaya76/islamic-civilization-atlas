import { useState, useMemo, useRef, useEffect } from 'react';

const METAL_LABELS = {
  AU: { tr: 'Altın/Dinar', en: 'Gold/Dinar', color: '#FFD700' },
  AR: { tr: 'Gümüş/Dirhem', en: 'Silver/Dirham', color: '#C0C0C0' },
  AE: { tr: 'Bakır/Fels', en: 'Copper/Fals', color: '#B87333' },
  EL: { tr: 'Elektron', en: 'Electrum', color: '#CFB53B' },
  Pb: { tr: 'Kurşun', en: 'Lead', color: '#7F7F7F' },
  GL: { tr: 'Cam', en: 'Glass', color: '#87CEEB' },
};

const SOURCE_LABELS = {
  hamburg: { tr: 'Hamburg/Diler', en: 'Hamburg/Diler' },
  nomisma: { tr: 'Nomisma.org', en: 'Nomisma.org' },
  thurayya: { tr: 'al-Ṯurayyā', en: 'al-Ṯurayyā' },
  yakut: { tr: 'Yâkût', en: 'Yāqūt' },
};

export default function DarpSidebar({
  mints, filters, setFilters, filterOptions,
  selectedMint, onSelect, lang, isMobile, onClose
}) {
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const listRef = useRef(null);
  const t = (tr, en) => lang === 'tr' ? tr : en;

  // Sort mints
  const sortedMints = useMemo(() => {
    const arr = [...mints];
    switch (sortBy) {
      case 'name': return arr.sort((a, b) => (a.name_en || '').localeCompare(b.name_en || ''));
      case 'emissions': return arr.sort((a, b) => (b.emission_count || 0) - (a.emission_count || 0));
      case 'year': return arr.sort((a, b) => (a.year_min || 999) - (b.year_min || 999));
      case 'quality': return arr.sort((a, b) => (b.quality || 0) - (a.quality || 0));
      default: return arr;
    }
  }, [mints, sortBy]);

  // Scroll to selected
  useEffect(() => {
    if (selectedMint && listRef.current) {
      const el = listRef.current.querySelector(`[data-mint-id="${selectedMint.id}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedMint]);

  const activeFilterCount = [
    filters.region, filters.metal, filters.dynasty, filters.source,
    filters.minEmissions > 0, filters.yearRange[0], filters.yearRange[1]
  ].filter(Boolean).length;

  return (
    <div className={`darp-sidebar ${isMobile ? 'darp-sidebar-mobile' : ''}`}>
      {/* Search */}
      <div className="darp-search-box">
        <input
          type="text"
          placeholder={t('Darphane ara… (ör: Bağdat, بغداد)', 'Search mints… (e.g. Baghdad, بغداد)')}
          value={filters.search}
          onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
          className="darp-search-input"
        />
        {filters.search && (
          <button className="darp-search-clear" onClick={() => setFilters(prev => ({ ...prev, search: '' }))}>
            ✕
          </button>
        )}
      </div>

      {/* Filter toggle */}
      <div className="darp-filter-header">
        <button
          className="darp-filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          🔍 {t('Filtreler', 'Filters')}
          {activeFilterCount > 0 && <span className="darp-filter-badge">{activeFilterCount}</span>}
        </button>
        <select
          className="darp-sort-select"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="name">{t('Ada Göre', 'By Name')}</option>
          <option value="emissions">{t('Darbiyata Göre', 'By Emissions')}</option>
          <option value="year">{t('Yıla Göre', 'By Year')}</option>
          <option value="quality">{t('Kaliteye Göre', 'By Quality')}</option>
        </select>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="darp-filters">
          <select value={filters.region} onChange={e => setFilters(p => ({ ...p, region: e.target.value }))}>
            <option value="">{t('Tüm Bölgeler', 'All Regions')}</option>
            {filterOptions.regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filters.metal} onChange={e => setFilters(p => ({ ...p, metal: e.target.value }))}>
            <option value="">{t('Tüm Metaller', 'All Metals')}</option>
            {filterOptions.metals.map(m => (
              <option key={m} value={m}>{METAL_LABELS[m]?.[lang] || m}</option>
            ))}
          </select>
          <select value={filters.dynasty} onChange={e => setFilters(p => ({ ...p, dynasty: e.target.value }))}>
            <option value="">{t('Tüm Hanedanlar', 'All Dynasties')}</option>
            {filterOptions.dynasties.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filters.source} onChange={e => setFilters(p => ({ ...p, source: e.target.value }))}>
            <option value="">{t('Tüm Kaynaklar', 'All Sources')}</option>
            {filterOptions.sources.map(s => (
              <option key={s} value={s}>{SOURCE_LABELS[s]?.[lang] || s}</option>
            ))}
          </select>
          <div className="darp-filter-row">
            <label>{t('Min. Darbiyat', 'Min. Emissions')}</label>
            <input
              type="number" min="0" step="1"
              value={filters.minEmissions || ''}
              onChange={e => setFilters(p => ({ ...p, minEmissions: parseInt(e.target.value) || 0 }))}
              placeholder="0"
              className="darp-filter-num"
            />
          </div>
          <div className="darp-filter-row">
            <label>{t('Hicri Yıl Aralığı', 'Hijri Year Range')}</label>
            <div className="darp-year-range">
              <input
                type="number" placeholder={t('Min', 'Min')}
                value={filters.yearRange[0] ?? ''}
                onChange={e => setFilters(p => ({ ...p, yearRange: [parseInt(e.target.value) || null, p.yearRange[1]] }))}
                className="darp-filter-num"
              />
              <span>–</span>
              <input
                type="number" placeholder={t('Max', 'Max')}
                value={filters.yearRange[1] ?? ''}
                onChange={e => setFilters(p => ({ ...p, yearRange: [p.yearRange[0], parseInt(e.target.value) || null] }))}
                className="darp-filter-num"
              />
            </div>
          </div>
          <button
            className="darp-filter-clear"
            onClick={() => setFilters({ search: '', region: '', metal: '', dynasty: '', yearRange: [null, null], source: '', minEmissions: 0 })}
          >
            {t('Filtreleri Temizle', 'Clear Filters')}
          </button>
        </div>
      )}

      {/* Mint list */}
      <div className="darp-list" ref={listRef}>
        {sortedMints.length === 0 ? (
          <div className="darp-empty">{t('Darphane bulunamadı', 'No mints found')}</div>
        ) : (
          sortedMints.map(mint => (
            <div
              key={mint.id}
              data-mint-id={mint.id}
              className={`darp-list-item ${selectedMint?.id === mint.id ? 'selected' : ''}`}
              onClick={() => onSelect(mint)}
            >
              <div className="darp-item-header">
                <span className="darp-item-name">
                  {lang === 'tr' ? mint.name_tr : mint.name_en}
                </span>
                {mint.name_ar && <span className="darp-item-arabic">{mint.name_ar}</span>}
              </div>
              <div className="darp-item-meta">
                <span className="darp-item-region">
                  {lang === 'tr' ? mint.region_tr : mint.region_en}
                </span>
                {mint.emission_count > 0 && (
                  <span className="darp-item-emissions">
                    🪙 {mint.emission_count}
                  </span>
                )}
                {mint.metals?.length > 0 && (
                  <span className="darp-item-metals">
                    {mint.metals.map(m => (
                      <span
                        key={m}
                        className="darp-metal-dot"
                        style={{ background: METAL_LABELS[m]?.color || '#999' }}
                        title={METAL_LABELS[m]?.[lang] || m}
                      />
                    ))}
                  </span>
                )}
              </div>
              {(mint.year_min || mint.year_max) && (
                <div className="darp-item-years">
                  H. {mint.year_min || '?'} – {mint.year_max || '?'}
                  {mint.year_min_ce && (
                    <span className="darp-item-ce">
                      ({mint.year_min_ce}–{mint.year_max_ce} CE)
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {isMobile && (
        <button className="darp-sidebar-close" onClick={onClose}>✕</button>
      )}
    </div>
  );
}
