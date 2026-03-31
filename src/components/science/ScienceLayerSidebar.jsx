/**
 * ScienceLayerSidebar.jsx — islamicatlas.org Science Layer (v7.4.0.0 / O8)
 *
 * B3: New "Routes" tab with 3-category accordion
 *     - Each route: name + waypoint count + scholar count
 *     - Click → highlight on map + open popup
 *     - Category toggle show/hide
 */

import { useRef, useEffect, useState, useMemo } from 'react';
import { FIELD_COLORS, FIELD_NAMES, PERIODS } from './ScienceLayerView';

/* ── Route category config ── */
const ROUTE_CATS = [
  { key: 'internal',          icon: '🔵', color: '#3B82F6' },
  { key: 'science_transfer',  icon: '🟠', color: '#F59E0B' },
  { key: 'cultural_transfer', icon: '🟢', color: '#10B981' },
];

const ROUTE_CAT_NAMES = {
  internal:          { en: 'Internal Routes',           tr: 'İç Güzergâhlar',              ar: 'المسارات الداخلية' },
  science_transfer:  { en: 'Science Transfer',          tr: 'Bilim Transferi',              ar: 'نقل العلوم' },
  cultural_transfer: { en: 'Cultural Transfer',         tr: 'Kültür Transferi',             ar: 'النقل الثقافي' },
};

/* ── i18n ── */
const SB_T = {
  tr: {
    search: 'Alim, kurum ara…', fields: 'Alanlar', periods: 'Dönemler',
    results: 'Sonuçlar', clear: 'Temizle', routes: 'Güzergâhlar',
    noResults: 'Sonuç bulunamadı.', showAll: 'Tümünü göster',
    scholars: 'Alimler', institutions: 'Kurumlar', founded: 'kur.',
    tabScholars: 'Alimler', tabRoutes: 'Güzergâhlar',
    wp: 'durak', linkedScholars: 'alim',
  },
  en: {
    search: 'Search scholars, institutions…', fields: 'Fields', periods: 'Periods',
    results: 'Results', clear: 'Clear All', routes: 'Routes',
    noResults: 'No results found.', showAll: 'Show all',
    scholars: 'Scholars', institutions: 'Institutions', founded: 'est.',
    tabScholars: 'Scholars', tabRoutes: 'Routes',
    wp: 'stops', linkedScholars: 'scholars',
  },
  ar: {
    search: 'ابحث عن علماء، مؤسسات…', fields: 'المجالات', periods: 'الفترات',
    results: 'النتائج', clear: 'مسح', routes: 'المسارات',
    noResults: 'لا توجد نتائج.', showAll: 'عرض الكل',
    scholars: 'العلماء', institutions: 'المؤسسات', founded: 'تأ.',
    tabScholars: 'العلماء', tabRoutes: 'المسارات',
    wp: 'محطة', linkedScholars: 'عالم',
  },
};

/* ── Accordion component ── */
function RouteAccordion({ catKey, icon, color, catName, routes, lang, tr, highlightedRouteId, onRouteClick }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="sci-route-accordion">
      <button
        className={`sci-route-acc-header${open ? ' open' : ''}`}
        style={{ '--acc-c': color }}
        onClick={() => setOpen(v => !v)}
      >
        <span className="sci-route-acc-icon">{icon}</span>
        <span className="sci-route-acc-name">{catName}</span>
        <span className="sci-badge" style={{ background: `${color}25`, color }}>{routes.length}</span>
        <span className={`sci-route-acc-chevron${open ? ' open' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="sci-route-acc-body">
          {routes.map(route => {
            const name = route.name?.[lang] || route.name?.en || '';
            const wpCount = 1 + (route.via?.length || 0) + 1;
            const scholarCount = route.route_scholars?.length || 0;
            const isActive = highlightedRouteId === route.id;

            return (
              <button
                key={route.id}
                className={`sci-route-card${isActive ? ' active' : ''}`}
                style={{ '--rc-c': color }}
                onClick={() => onRouteClick(route)}
              >
                <span className="sci-route-card-line" style={{ background: color }} />
                <div className="sci-route-card-info">
                  <span className="sci-route-card-name">{name}</span>
                  <span className="sci-route-card-meta">
                    {wpCount} {tr.wp}
                    {scholarCount > 0 && ` · ${scholarCount} ${tr.linkedScholars}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ScienceLayerSidebar({
  lang, primaryFields, selectedFields, selectedPeriods, searchQuery,
  filteredScholars, filteredInstitutions, knowledgeRoutes,
  showRoutes, hasActiveFilters, highlightedRouteId,
  onToggleField, onTogglePeriod, onSearchChange, onClearFilters,
  onScholarClick, onInstitutionClick, onToggleRoutes, onRouteClick,
}) {
  const tr = SB_T[lang] || SB_T.en;
  const searchRef = useRef(null);
  const [showAll, setShowAll] = useState(false);
  const [activeTab, setActiveTab] = useState('scholars'); // 'scholars' | 'routes'

  useEffect(() => { if (searchRef.current) searchRef.current.focus(); }, []);

  /* ── Group routes by category ── */
  const routesByCategory = useMemo(() => {
    const groups = { internal: [], science_transfer: [], cultural_transfer: [] };
    (knowledgeRoutes || []).forEach(r => {
      const cat = r.category || 'internal';
      if (groups[cat]) groups[cat].push(r);
    });
    return groups;
  }, [knowledgeRoutes]);

  const total = filteredScholars.length + filteredInstitutions.length;
  const maxVisible = showAll ? 999 : 12;

  return (
    <div className="sci-sidebar-inner">
      {/* Tab switcher */}
      <div className="sci-sidebar-tabs">
        <button
          className={`sci-sidebar-tab${activeTab === 'scholars' ? ' active' : ''}`}
          onClick={() => setActiveTab('scholars')}
        >
          {tr.tabScholars}
        </button>
        <button
          className={`sci-sidebar-tab${activeTab === 'routes' ? ' active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          {tr.tabRoutes}
          <span className="sci-badge" style={{ marginLeft: 4 }}>{knowledgeRoutes?.length || 0}</span>
        </button>
      </div>

      {activeTab === 'scholars' ? (
        <>
          {/* Search */}
          <div className="sci-search-wrap">
            <input
              ref={searchRef}
              className="sci-search"
              type="text"
              placeholder={tr.search}
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            />
            {searchQuery && (
              <button className="sci-search-clear" onClick={() => onSearchChange('')}>✕</button>
            )}
          </div>

          {/* Field chips */}
          <div className="sci-filter-section">
            <h4 className="sci-filter-title">{tr.fields}</h4>
            <div className="sci-field-grid">
              {primaryFields.map(field => {
                const color = FIELD_COLORS[field] || '#888';
                const active = selectedFields.has(field);
                return (
                  <button
                    key={field}
                    className={`sci-chip${active ? ' active' : ''}`}
                    style={{ '--chip-c': color, borderColor: active ? color : 'transparent', background: active ? `${color}22` : undefined }}
                    onClick={() => onToggleField(field)}
                  >
                    <span className="sci-chip-dot" style={{ background: color }} />
                    <span>{FIELD_NAMES[field]?.[lang] || field}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Period buttons */}
          <div className="sci-filter-section">
            <h4 className="sci-filter-title">{tr.periods}</h4>
            <div className="sci-period-list">
              {PERIODS.map(p => {
                const active = selectedPeriods.has(p.id);
                return (
                  <button
                    key={p.id}
                    className={`sci-period${active ? ' active' : ''}`}
                    style={{ '--p-c': p.color, borderColor: active ? p.color : 'transparent', background: active ? `${p.color}22` : undefined }}
                    onClick={() => onTogglePeriod(p.id)}
                  >
                    <span className="sci-period-bar" style={{ background: p.color }} />
                    <span className="sci-period-name">{p.label[lang] || p.label.en}</span>
                    <span className="sci-period-range">{p.range}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Route toggle */}
          <div className="sci-filter-section sci-route-section">
            <label className="sci-route-toggle">
              <input type="checkbox" checked={showRoutes} onChange={onToggleRoutes} />
              <span className="sci-route-track"><span className="sci-route-thumb" /></span>
              <span>{tr.routes}</span>
            </label>
          </div>

          {/* Clear */}
          {hasActiveFilters && (
            <button className="sci-clear-btn" onClick={onClearFilters}>{tr.clear}</button>
          )}

          {/* Results */}
          <div className="sci-filter-section sci-results-section">
            <h4 className="sci-filter-title">{tr.results} <span className="sci-badge">{total}</span></h4>

            {total === 0 ? (
              <p className="sci-no-results">{tr.noResults}</p>
            ) : (
              <div className="sci-results-scroll">
                {filteredScholars.length > 0 && (
                  <div className="sci-result-group">
                    <h5 className="sci-result-group-title">{tr.scholars}</h5>
                    {filteredScholars.slice(0, maxVisible).map(s => (
                      <button key={s.id} className="sci-result-card" onClick={() => onScholarClick(s)}>
                        <span className="sci-result-dot" style={{ background: FIELD_COLORS[s.primary_field] || '#888' }} />
                        <div className="sci-result-info">
                          <span className="sci-result-name">{s.name?.[lang] || s.name?.en}</span>
                          <span className="sci-result-meta">{FIELD_NAMES[s.primary_field]?.[lang] || s.primary_field} · {s.birth_year}–{s.death_year}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {filteredInstitutions.length > 0 && (
                  <div className="sci-result-group">
                    <h5 className="sci-result-group-title">{tr.institutions}</h5>
                    {filteredInstitutions.slice(0, maxVisible).map(inst => (
                      <button key={inst.id} className="sci-result-card" onClick={() => onInstitutionClick(inst)}>
                        <span className="sci-result-dot sci-result-dot--diamond" style={{ background: inst.marker_color || '#a855f7' }} />
                        <div className="sci-result-info">
                          <span className="sci-result-name">{inst.name?.[lang] || inst.name?.en}</span>
                          <span className="sci-result-meta">{inst.city?.[lang] || inst.city?.en} · {tr.founded} {inst.founded}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {total > 12 && !showAll && (
                  <button className="sci-show-all" onClick={() => setShowAll(true)}>{tr.showAll} ({total})</button>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        /* ── ROUTES TAB (B3) ── */
        <div className="sci-routes-panel">
          {ROUTE_CATS.map(({ key, icon, color }) => {
            const routes = routesByCategory[key] || [];
            if (routes.length === 0) return null;
            return (
              <RouteAccordion
                key={key}
                catKey={key}
                icon={icon}
                color={color}
                catName={ROUTE_CAT_NAMES[key]?.[lang] || ROUTE_CAT_NAMES[key]?.en}
                routes={routes}
                lang={lang}
                tr={tr}
                highlightedRouteId={highlightedRouteId}
                onRouteClick={onRouteClick}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
