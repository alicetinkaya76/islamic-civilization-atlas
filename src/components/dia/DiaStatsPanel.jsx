import { useMemo } from 'react';
import { FIELD_COLORS } from './DiaSidebar';

function getCentury(y) { return y ? Math.ceil(y / 100) : null; }

export default function DiaStatsPanel({ lang, td, data, filtered, stats, relMeta }) {
  const fStats = useMemo(() => {
    if (!filtered) return null;
    const fc = {}, mc = {}, cc = {};
    let maxIs = 0, topS = null;
    filtered.forEach(b => {
      if (b.fl) b.fl.forEach(f => fc[f] = (fc[f] || 0) + 1);
      if (b.mz) mc[b.mz] = (mc[b.mz] || 0) + 1;
      const c = getCentury(b.dc); if (c) cc[c] = (cc[c] || 0) + 1;
      if ((b.is || 0) > maxIs) { maxIs = b.is; topS = b; }
    });
    return {
      topFields: Object.entries(fc).sort((a, b) => b[1] - a[1]).slice(0, 5),
      topMadhabs: Object.entries(mc).sort((a, b) => b[1] - a[1]).slice(0, 4),
      peakCentury: Object.entries(cc).sort((a, b) => b[1] - a[1])[0],
      topScholar: topS,
    };
  }, [filtered]);

  return (
    <div className="dia-stats-panel">
      <h3 className="dia-stats-title">{td.statsTitle || 'İstatistikler'}</h3>
      <div className="dia-stat-grid">
        {[
          [stats?.total, td.totalBio || 'Biyografi'],
          [stats?.withDate, td.withDate || 'Tarihli'],
          [stats?.withMadhab, td.withMadhab || 'Mezhepli'],
          [stats?.totalWorks, td.totalWorks || 'Eser'],
          [relMeta?.ts_count, td.tsEdges || 'Hoca-Talebe'],
          [relMeta?.co_count, td.coEdges || 'Muâsır'],
        ].map(([val, label], i) => (
          <div key={i} className="dia-stat-box">
            <div className="dia-stat-num">{val?.toLocaleString() || '—'}</div>
            <div className="dia-stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="dia-stats-section">
        <div className="dia-stats-filtered"><strong>{filtered?.length?.toLocaleString() || '—'}</strong> {td.filteredCount || 'filtrelenen kayıt'}</div>
      </div>

      {fStats?.topFields?.length > 0 && (
        <div className="dia-stats-section">
          <h4 className="dia-stats-subtitle">{td.topFields || 'En Yaygın İlimler'}</h4>
          {fStats.topFields.map(([f, c]) => (
            <div key={f} className="dia-stats-bar-row">
              <span className="dia-stats-bar-label">{f}</span>
              <div className="dia-stats-bar">
                <div className="dia-stats-bar-fill" style={{ width: `${(c / (fStats.topFields[0]?.[1] || 1)) * 100}%`, background: FIELD_COLORS[f] || '#546e7a' }} />
              </div>
              <span className="dia-stats-bar-val">{c}</span>
            </div>
          ))}
        </div>
      )}

      {fStats?.topMadhabs?.length > 0 && (
        <div className="dia-stats-section">
          <h4 className="dia-stats-subtitle">{td.topMadhabs || 'Mezhep Dağılımı'}</h4>
          {fStats.topMadhabs.map(([m, c]) => (
            <div key={m} className="dia-stats-bar-row">
              <span className="dia-stats-bar-label">{m}</span>
              <span className="dia-stats-bar-val">{c}</span>
            </div>
          ))}
        </div>
      )}

      {fStats?.peakCentury && (
        <div className="dia-stats-section">
          <h4 className="dia-stats-subtitle">{td.peakCentury || 'En Yoğun Yüzyıl'}</h4>
          <div className="dia-stats-highlight">{fStats.peakCentury[0]}. yy — {fStats.peakCentury[1]} âlim</div>
        </div>
      )}

      {fStats?.topScholar && (
        <div className="dia-stats-section">
          <h4 className="dia-stats-subtitle">{td.topScholar || 'En Önemli'}</h4>
          <div className="dia-stats-highlight">{fStats.topScholar.t} ({fStats.topScholar.is})</div>
        </div>
      )}
    </div>
  );
}
