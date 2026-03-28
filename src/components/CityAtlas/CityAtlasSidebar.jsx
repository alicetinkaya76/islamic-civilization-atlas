import CityAtlasSearch from './CityAtlasSearch';

export default function CityAtlasSidebar({
  data, filtered, filters, setFilters, city, lang, getName, getCat, onSelect, selectedId,
}) {
  const t = (tr, en, ar) => (lang === 'en' ? en : lang === 'ar' ? ar : tr);

  // ── Counts ──
  const catCounts = {};
  data.forEach((r) => { catCounts[r.category] = (catCounts[r.category] || 0) + 1; });

  const perCounts = {};
  data.forEach((r) => { perCounts[r.period] = (perCounts[r.period] || 0) + 1; });

  // ── Toggle helpers ──
  const toggleFilter = (type, value) => {
    setFilters((prev) => {
      const arr = [...prev[type]];
      const idx = arr.indexOf(value);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(value);
      return { ...prev, [type]: arr };
    });
  };

  const clearAll = () => {
    setFilters({ categories: [], periods: [], status: 'all', search: '' });
  };

  const hasFilters = filters.categories.length > 0 || filters.periods.length > 0 || filters.status !== 'all' || filters.search;

  // ── Status options ──
  const statusOpts = [
    { value: 'all',      label: t('Tümü', 'All', 'الكل') },
    { value: 'mevcut',   label: t('Mevcut', 'Extant', 'قائم') },
    { value: 'yikilmis', label: t('Yıkılmış', 'Demolished', 'مهدم') },
    { value: 'harap',    label: t('Harap', 'Ruined', 'خراب') },
    { value: 'belirsiz', label: t('Belirsiz', 'Unknown', 'غير محدد') },
  ];

  // ── Date display helper ──
  const getDateStr = (r) => {
    const miladi = r.dates?.founding_miladi;
    const hijri  = r.dates?.founding_hijri;
    if (miladi && hijri) return `${miladi} M. (H.${hijri})`;
    if (miladi) return `${miladi} M.`;
    if (hijri) return `H.${hijri}`;
    return '';
  };

  return (
    <aside className="ca-sidebar">
      {/* Search */}
      <CityAtlasSearch
        value={filters.search}
        onChange={(v) => setFilters((f) => ({ ...f, search: v }))}
        lang={lang}
      />

      {/* Categories */}
      <section className="ca-filter-section">
        <h3>{t('Kategoriler', 'Categories', 'الفئات')}</h3>
        <div className="ca-filter-chips">
          {Object.entries(city.categories)
            .filter(([key]) => catCounts[key])
            .sort((a, b) => (catCounts[b[0]] || 0) - (catCounts[a[0]] || 0))
            .map(([key, cfg]) => (
              <button
                key={key}
                className={`ca-chip ${filters.categories.includes(key) ? 'active' : ''}`}
                style={{ '--chip-color': cfg.color }}
                onClick={() => toggleFilter('categories', key)}
                title={cfg[`label_${lang}`] || cfg.label_en}
              >
                <span className="ca-chip-icon">{cfg.icon}</span>
                <span className="ca-chip-label">{cfg[`label_${lang}`] || cfg.label_en}</span>
                <span className="ca-chip-count">{catCounts[key]}</span>
              </button>
            ))}
        </div>
      </section>

      {/* Periods */}
      <section className="ca-filter-section">
        <h3>{t('Dönemler', 'Periods', 'العصور')}</h3>
        <div className="ca-filter-chips">
          {Object.entries(city.periods)
            .filter(([key]) => perCounts[key])
            .sort((a, b) => (perCounts[b[0]] || 0) - (perCounts[a[0]] || 0))
            .map(([key, cfg]) => (
              <button
                key={key}
                className={`ca-chip ${filters.periods.includes(key) ? 'active' : ''}`}
                style={{ '--chip-color': cfg.color }}
                onClick={() => toggleFilter('periods', key)}
              >
                <span className="ca-chip-label">{cfg[`label_${lang}`] || cfg.label_en}</span>
                <span className="ca-chip-count">{perCounts[key]}</span>
              </button>
            ))}
        </div>
      </section>

      {/* Status */}
      <section className="ca-filter-section">
        <h3>{t('Durum', 'Status', 'الحالة')}</h3>
        <div className="ca-status-row">
          {statusOpts.map((opt) => (
            <button
              key={opt.value}
              className={`ca-status-btn ${filters.status === opt.value ? 'active' : ''}`}
              onClick={() => setFilters((f) => ({ ...f, status: opt.value }))}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={clearAll}
          style={{
            background: 'none', border: 'none', color: '#FFD700',
            fontSize: '0.7rem', cursor: 'pointer', padding: '4px 0',
            textAlign: lang === 'ar' ? 'right' : 'left', marginBottom: 6,
          }}
        >
          ✕ {t('Filtreleri Temizle', 'Clear Filters', 'مسح الفلاتر')}
        </button>
      )}

      {/* Results */}
      <section className="ca-results">
        <h3>
          {filtered.length} {t('sonuç', 'results', 'نتيجة')}
          {filtered.length !== data.length && ` / ${data.length}`}
        </h3>
        <ul className="ca-list">
          {filtered.map((r) => {
            const catCfg = city.categories[r.category] || {};
            const dateStr = getDateStr(r);
            return (
              <li
                key={r.id}
                className={`ca-list-item ${selectedId === r.id ? 'selected' : ''}`}
                onClick={() => onSelect(r)}
              >
                <span className="ca-list-icon" style={{ color: catCfg.color }}>
                  {catCfg.icon || '•'}
                </span>
                <div className="ca-list-info">
                  <span className="ca-list-name">{getName(r)}</span>
                  <span className="ca-list-meta">
                    {getCat(r)}
                    {dateStr && ` · ${dateStr}`}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}
