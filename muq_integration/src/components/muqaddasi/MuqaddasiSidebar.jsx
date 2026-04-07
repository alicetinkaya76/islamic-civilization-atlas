import { useMemo } from 'react';
import { IQLIM_COLORS, IQLIM_LABELS } from './constants';

const CERT_GROUPS = [
  { key: 'certain', keys: ['certain', 'exact', 'modern_known'] },
  { key: 'approximate', keys: ['approximate', 'country', 'region', 'inferred'] },
  { key: 'uncertain', keys: ['uncertain'] },
  { key: 'estimated', keys: ['estimated'] },
];

const CERT_DOTS = { certain: '🟢', approximate: '🟡', uncertain: '🟠', estimated: '🔴' };

export default function MuqaddasiSidebar({
  places, filtered, selectedId, onSelect,
  search, onSearch, selectedIqlim, onIqlim,
  selectedCert, onCert, showRoutes, onToggleRoutes,
  iqlimList, tr, lang
}) {
  const certCounts = useMemo(() => {
    const c = {};
    CERT_GROUPS.forEach(g => {
      c[g.key] = places.filter(p => g.keys.includes(p.certainty)).length;
    });
    return c;
  }, [places]);

  return (
    <div className="muq-sidebar">
      {/* ── Header ── */}
      <div className="muq-sidebar-header">
        <h3 className="muq-sidebar-title">{tr.title}</h3>
        <span className="muq-sidebar-sub">{tr.sub}</span>
      </div>

      {/* ── Search ── */}
      <div className="muq-search-box">
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder={tr.search}
          className="muq-search-input"
        />
        {search && (
          <button className="muq-search-clear" onClick={() => onSearch('')}>✕</button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="muq-filters">
        {/* Iqlim */}
        <select value={selectedIqlim} onChange={e => onIqlim(e.target.value)} className="muq-select">
          <option value="">{tr.allIqlim}</option>
          {iqlimList.map(iq => (
            <option key={iq} value={iq}>
              {lang === 'ar' ? iq : (IQLIM_LABELS[iq]?.[lang] || iq)}
            </option>
          ))}
        </select>

        {/* Certainty */}
        <select value={selectedCert} onChange={e => onCert(e.target.value)} className="muq-select">
          <option value="">{tr.allCert || 'Tüm Güven'}</option>
          {CERT_GROUPS.map(g => (
            <option key={g.key} value={g.key}>
              {tr[g.key] || g.key} ({certCounts[g.key] || 0})
            </option>
          ))}
        </select>

        {/* Routes toggle */}
        <label className="muq-toggle-label">
          <input type="checkbox" checked={showRoutes} onChange={onToggleRoutes} />
          {tr.showRoutes}
        </label>
      </div>

      {/* ── Results count ── */}
      <div className="muq-results-count">
        {filtered.length} / {places.length} {tr.entries}
      </div>

      {/* ── List ── */}
      <div className="muq-list">
        {filtered.length === 0 ? (
          <div className="muq-empty">{tr.noEntries}</div>
        ) : (
          filtered.map(p => {
            const color = IQLIM_COLORS[p.iqlim_ar] || '#808080';
            const isActive = p.id === selectedId;
            return (
              <div
                key={p.id}
                className={`muq-list-item${isActive ? ' active' : ''}`}
                onClick={() => onSelect(p.id)}
              >
                <span className="muq-list-dot" style={{ background: color }} />
                <span className="muq-list-name" style={{ direction: 'rtl' }}>{p.name_ar}</span>
                {p.iqlim_ar && (
                  <span className="muq-list-iqlim" style={{ color }}>
                    {lang === 'ar' ? p.iqlim_ar : (IQLIM_LABELS[p.iqlim_ar]?.[lang] || '')}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Source ── */}
      <div className="muq-source">{tr.source}</div>
    </div>
  );
}
