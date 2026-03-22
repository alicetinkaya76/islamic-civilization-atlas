import { useMemo } from 'react';
import { getCentury, EI1_FIELD_COLORS } from './ei1Constants';

export default function Ei1StatsPanel({ lang, te, data, filtered, stats }) {
  /* Century distribution for mini-chart */
  const centuryDist = useMemo(() => {
    const counts = {};
    filtered.forEach(b => {
      const c = getCentury(parseInt(b.dc) || 0);
      if (c && c >= 1 && c <= 21) counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).map(([c, n]) => ({ century: +c, count: n })).sort((a, b) => a.century - b.century);
  }, [filtered]);

  const maxCount = Math.max(...centuryDist.map(d => d.count), 1);

  /* Top fields */
  const topFields = useMemo(() => {
    const counts = {};
    filtered.forEach(b => { (b.fl || []).forEach(f => { counts[f] = (counts[f] || 0) + 1; }); });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [filtered]);

  /* Article types breakdown */
  const typeBreakdown = useMemo(() => {
    const counts = {};
    filtered.forEach(b => { const t = b.at || 'unknown'; counts[t] = (counts[t] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  /* Top EI-1 authors */
  const topAuthors = useMemo(() => {
    const counts = {};
    filtered.forEach(b => { if (b.au) counts[b.au] = (counts[b.au] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [filtered]);

  const TYPE_ICONS = {
    biography: '👤', geography: '🌍', concept: '💡',
    dynasty: '👑', cross_reference: '🔗', unknown: '📄',
  };

  return (
    <div className="ei1-stats-panel">
      {/* Summary cards row */}
      <div className="ei1-stats-cards">
        <div className="ei1-stat-card">
          <div className="ei1-stat-number">{stats.total.toLocaleString()}</div>
          <div className="ei1-stat-label">{te.totalEntries || 'Total Entries'}</div>
        </div>
        <div className="ei1-stat-card">
          <div className="ei1-stat-number">{stats.totalBio.toLocaleString()}</div>
          <div className="ei1-stat-label">{te.totalBio || 'Biographies'}</div>
        </div>
        <div className="ei1-stat-card">
          <div className="ei1-stat-number">{stats.withDate.toLocaleString()}</div>
          <div className="ei1-stat-label">{te.withDate || 'With Dates'}</div>
        </div>
        <div className="ei1-stat-card">
          <div className="ei1-stat-number">{stats.totalWorks.toLocaleString()}</div>
          <div className="ei1-stat-label">{te.totalWorks || 'Works'}</div>
        </div>
      </div>

      {/* Century mini-chart */}
      {centuryDist.length > 0 && (
        <div className="ei1-stats-section">
          <h4 className="ei1-stats-heading">{te.centuryDist || 'Century Distribution'}</h4>
          <div className="ei1-century-chart">
            {centuryDist.map(d => (
              <div key={d.century} className="ei1-century-bar-wrap" title={`${d.century}. century: ${d.count}`}>
                <div className="ei1-century-bar" style={{ height: `${(d.count / maxCount) * 100}%` }} />
                <span className="ei1-century-label">{d.century}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-column grid */}
      <div className="ei1-stats-grid">
        {/* Article types */}
        <div className="ei1-stats-section">
          <h4 className="ei1-stats-heading">{te.articleTypes || 'Article Types'}</h4>
          <div className="ei1-type-list">
            {typeBreakdown.map(([t, c]) => (
              <div key={t} className="ei1-type-row">
                <span className="ei1-type-icon">{TYPE_ICONS[t] || '📄'}</span>
                <span className="ei1-type-name">{t}</span>
                <span className="ei1-type-count">{c.toLocaleString()}</span>
                <div className="ei1-type-bar">
                  <div className="ei1-type-bar-fill" style={{ width: `${(c / filtered.length) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top fields */}
        <div className="ei1-stats-section">
          <h4 className="ei1-stats-heading">{te.topFields || 'Top Fields'}</h4>
          <div className="ei1-field-bars">
            {topFields.map(([f, c]) => (
              <div key={f} className="ei1-field-bar-row">
                <span className="ei1-field-dot" style={{ background: EI1_FIELD_COLORS[f] || '#546e7a' }} />
                <span className="ei1-field-name">{f}</span>
                <span className="ei1-field-count">{c}</span>
                <div className="ei1-field-bar">
                  <div className="ei1-field-bar-fill" style={{ width: `${(c / (topFields[0]?.[1] || 1)) * 100}%`, background: EI1_FIELD_COLORS[f] || '#546e7a' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top EI-1 article authors */}
        {topAuthors.length > 0 && (
          <div className="ei1-stats-section">
            <h4 className="ei1-stats-heading">{te.topAuthors || 'Top EI¹ Authors'}</h4>
            <div className="ei1-author-list">
              {topAuthors.map(([a, c]) => (
                <div key={a} className="ei1-author-row">
                  <span className="ei1-author-name">{a}</span>
                  <span className="ei1-author-count">{c} {te.articles || 'articles'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
