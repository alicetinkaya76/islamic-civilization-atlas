/**
 * EvliyaDashboard.jsx — İstatistik ve kapsam görselleştirmesi
 * Voyage bazlı stats, kategori dağılımı, çapraz ref kapsam haritası
 * v8.0.0.0 — improved: shared constants, full i18n, RTL
 */
import React, { useMemo } from 'react';
import {
  CAT_LABELS, XREF_LABELS, XREF_COLORS,
  getLabels, voyageNameKey,
} from './constants';

export default function EvliyaDashboard({ data, lang, onClose }) {
  const l = getLabels(lang);
  const nameKey = voyageNameKey(lang);
  const cl = CAT_LABELS[lang] || CAT_LABELS.tr;
  const isRtl = lang === 'ar';

  // ── Computed Stats ──
  const stats = useMemo(() => {
    const stops = data.travel_stops;
    const voyages = data.travel_voyages;

    const voyageStats = voyages.map(v => {
      const vStops = stops.filter(s => s.voyage_id === v.id);
      const xrefCount = vStops.reduce((sum, s) => sum + Object.keys(s.xref || {}).length, 0);
      return {
        ...v,
        stopCount: vStops.length,
        xrefCount,
        uniqueCategories: new Set(vStops.map(s => s.category)).size,
      };
    });

    const catCounts = {};
    stops.forEach(s => {
      const c = s.category || 'bilinmeyen';
      catCounts[c] = (catCounts[c] || 0) + 1;
    });
    const categoryStats = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, pct: ((count / stops.length) * 100).toFixed(1) }));

    const xrefLayerCounts = {};
    let totalXrefs = 0;
    stops.forEach(s => {
      if (s.xref) {
        Object.keys(s.xref).forEach(k => {
          xrefLayerCounts[k] = (xrefLayerCounts[k] || 0) + 1;
          totalXrefs++;
        });
      }
    });
    const xrefStats = Object.entries(xrefLayerCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, pct: ((count / stops.length) * 100).toFixed(1) }));

    const withXref = stops.filter(s => s.xref && Object.keys(s.xref).length > 0).length;
    const coveragePct = ((withXref / stops.length) * 100).toFixed(1);

    const topXref = [...stops]
      .map(s => ({ ...s, xrefCount: Object.keys(s.xref || {}).length }))
      .filter(s => s.xrefCount > 0)
      .sort((a, b) => b.xrefCount - a.xrefCount)
      .slice(0, 20);

    return {
      totalStops: stops.length,
      totalVoyages: voyages.length,
      totalCategories: Object.keys(catCounts).length,
      totalXrefs,
      withXref,
      coveragePct,
      voyageStats,
      categoryStats,
      xrefStats,
      topXref,
    };
  }, [data]);

  const maxVoyageStops = Math.max(...stats.voyageStats.map(v => v.stopCount));
  const maxCatCount = stats.categoryStats[0]?.count || 1;
  const maxXrefCount = stats.xrefStats[0]?.count || 1;

  return (
    <div className="evliya-dashboard" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="evliya-dashboard-header">
        <button className="evliya-btn-action" onClick={onClose}>{l.back}</button>
        <h2>{l.title}</h2>
      </div>

      {/* KPI Cards */}
      <div className="evliya-dashboard-kpis">
        <div className="evliya-kpi">
          <span className="evliya-kpi-value">{stats.totalStops.toLocaleString()}</span>
          <span className="evliya-kpi-label">{l.totalStops}</span>
        </div>
        <div className="evliya-kpi">
          <span className="evliya-kpi-value">{stats.totalVoyages}</span>
          <span className="evliya-kpi-label">{l.totalVoyages}</span>
        </div>
        <div className="evliya-kpi">
          <span className="evliya-kpi-value">{stats.totalCategories}</span>
          <span className="evliya-kpi-label">{l.totalCategories}</span>
        </div>
        <div className="evliya-kpi">
          <span className="evliya-kpi-value">{stats.coveragePct}%</span>
          <span className="evliya-kpi-label">{l.xrefCoverage}</span>
          <span className="evliya-kpi-sub">{stats.withXref.toLocaleString()} / {stats.totalStops.toLocaleString()}</span>
        </div>
      </div>

      <div className="evliya-dashboard-grid">
        {/* Voyage Stats */}
        <div className="evliya-dashboard-card">
          <h3>{l.voyageStats}</h3>
          <div className="evliya-chart-bars">
            {stats.voyageStats.map(v => (
              <div key={v.id} className="evliya-bar-row">
                <span className="evliya-bar-label">
                  <span className="evliya-bar-dot" style={{ background: v.color }} />
                  {v.id} — {v[nameKey] || v.title_tr}
                </span>
                <div className="evliya-bar-track">
                  <div
                    className="evliya-bar-fill"
                    style={{
                      width: `${(v.stopCount / maxVoyageStops) * 100}%`,
                      background: v.color,
                    }}
                  />
                </div>
                <span className="evliya-bar-value">{v.stopCount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="evliya-dashboard-card">
          <h3>{l.categoryBreakdown}</h3>
          <div className="evliya-chart-bars">
            {stats.categoryStats.slice(0, 15).map(c => (
              <div key={c.name} className="evliya-bar-row">
                <span className="evliya-bar-label">{cl[c.name] || c.name}</span>
                <div className="evliya-bar-track">
                  <div
                    className="evliya-bar-fill"
                    style={{
                      width: `${(c.count / maxCatCount) * 100}%`,
                      background: '#2A9D8F',
                    }}
                  />
                </div>
                <span className="evliya-bar-value">{c.count} ({c.pct}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Xref Breakdown */}
        <div className="evliya-dashboard-card">
          <h3>{l.xrefBreakdown}</h3>
          <div className="evliya-chart-bars">
            {stats.xrefStats.map(x => (
              <div key={x.name} className="evliya-bar-row">
                <span className="evliya-bar-label">{XREF_LABELS[x.name] || x.name}</span>
                <div className="evliya-bar-track">
                  <div
                    className="evliya-bar-fill"
                    style={{
                      width: `${(x.count / maxXrefCount) * 100}%`,
                      background: XREF_COLORS[x.name] || '#666',
                    }}
                  />
                </div>
                <span className="evliya-bar-value">{x.count} ({x.pct}%)</span>
              </div>
            ))}
          </div>
          <div className="evliya-xref-total">
            {l.total}: {stats.totalXrefs.toLocaleString()} {l.xrefs}
          </div>
        </div>

        {/* Top Xref Places */}
        <div className="evliya-dashboard-card evliya-dashboard-card-wide">
          <h3>{l.topXrefPlaces}</h3>
          <div className="evliya-top-list">
            {stats.topXref.map((p, i) => (
              <div key={p.id} className="evliya-top-item">
                <span className="evliya-top-rank">#{i + 1}</span>
                <span className="evliya-top-name">{p[lang] || p.tr}</span>
                <span className="evliya-top-voyage" style={{ color: data.travel_voyages.find(v => v.id === p.voyage_id)?.color }}>
                  {p.voyage_id}
                </span>
                <div className="evliya-top-xref-dots">
                  {Object.keys(p.xref).map(k => (
                    <span
                      key={k}
                      className="evliya-top-xref-dot"
                      style={{ background: XREF_COLORS[k] || '#666' }}
                      title={XREF_LABELS[k] || k}
                    />
                  ))}
                </div>
                <span className="evliya-top-count">{p.xrefCount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
