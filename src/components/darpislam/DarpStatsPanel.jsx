import { useMemo } from 'react';

export default function DarpStatsPanel({ mints, metadata, lang }) {
  const t = (tr, en) => lang === 'tr' ? tr : en;

  const stats = useMemo(() => {
    const totalEmissions = mints.reduce((s, m) => s + (m.emission_count || 0), 0);
    const regions = new Set(mints.map(m => lang === 'tr' ? m.region_tr : m.region_en).filter(Boolean));
    const allMetals = new Set();
    const allDynasties = new Set();
    mints.forEach(m => {
      (m.metals || []).forEach(mt => allMetals.add(mt));
      (m.dynasties || []).forEach(d => allDynasties.add(d));
    });
    const withGold = mints.filter(m => m.metals?.includes('AU')).length;
    const withSilver = mints.filter(m => m.metals?.includes('AR')).length;
    const withCopper = mints.filter(m => m.metals?.includes('AE')).length;

    // Top regions by mint count
    const regionCounts = {};
    mints.forEach(m => {
      const r = lang === 'tr' ? m.region_tr : m.region_en;
      if (r) regionCounts[r] = (regionCounts[r] || 0) + 1;
    });
    const topRegions = Object.entries(regionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalMints: mints.length,
      totalEmissions,
      regionCount: regions.size,
      dynastyCount: allDynasties.size,
      metalCount: allMetals.size,
      withGold, withSilver, withCopper,
      topRegions,
    };
  }, [mints, lang]);

  return (
    <div className="darp-stats-panel">
      <div className="darp-stats-grid">
        <div className="darp-stat-card darp-stat-primary">
          <div className="darp-stat-value">{stats.totalMints.toLocaleString()}</div>
          <div className="darp-stat-label">{t('Darphane', 'Mints')}</div>
        </div>
        <div className="darp-stat-card">
          <div className="darp-stat-value">{stats.totalEmissions.toLocaleString()}</div>
          <div className="darp-stat-label">{t('Darbiyat', 'Emissions')}</div>
        </div>
        <div className="darp-stat-card">
          <div className="darp-stat-value">{stats.dynastyCount}</div>
          <div className="darp-stat-label">{t('Hanedan', 'Dynasties')}</div>
        </div>
        <div className="darp-stat-card">
          <div className="darp-stat-value">{stats.regionCount}</div>
          <div className="darp-stat-label">{t('Bölge', 'Regions')}</div>
        </div>
      </div>

      <div className="darp-stats-metals">
        <div className="darp-metal-stat" title={t('Altın darphaneleri', 'Gold mints')}>
          <span className="darp-metal-circle" style={{ background: '#FFD700' }}>🥇</span>
          <span>{stats.withGold}</span>
        </div>
        <div className="darp-metal-stat" title={t('Gümüş darphaneleri', 'Silver mints')}>
          <span className="darp-metal-circle" style={{ background: '#C0C0C0' }}>🥈</span>
          <span>{stats.withSilver}</span>
        </div>
        <div className="darp-metal-stat" title={t('Bakır darphaneleri', 'Copper mints')}>
          <span className="darp-metal-circle" style={{ background: '#B87333' }}>🥉</span>
          <span>{stats.withCopper}</span>
        </div>
      </div>

      {stats.topRegions.length > 0 && (
        <div className="darp-stats-regions">
          <div className="darp-stats-region-title">{t('En Çok Darphane', 'Top Regions')}</div>
          {stats.topRegions.map(([name, count]) => (
            <div key={name} className="darp-region-bar">
              <span className="darp-region-name">{name}</span>
              <div className="darp-region-fill" style={{ width: `${(count / stats.topRegions[0][1]) * 100}%` }} />
              <span className="darp-region-count">{count}</span>
            </div>
          ))}
        </div>
      )}

      {metadata && (
        <div className="darp-stats-sources">
          {Object.entries(metadata.data_sources || {}).map(([key, src]) => (
            <div key={key} className="darp-source-badge">
              <span className="darp-source-count">{src.count}</span>
              <span className="darp-source-name">
                {key === 'hamburg_diler' ? 'Diler' : key === 'nomisma' ? 'Nomisma' : 'al-Ṯurayyā'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
