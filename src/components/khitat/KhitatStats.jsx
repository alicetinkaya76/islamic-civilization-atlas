import { useMemo } from 'react';

/* ═══ Simple SVG bar chart ═══ */
function BarChart({ data, maxVal, labelKey, countKey, colorKey, height = 180, title }) {
  const barW = Math.min(28, Math.floor(300 / Math.max(data.length, 1)));
  const gap = 2;
  const w = data.length * (barW + gap) + 20;

  return (
    <div className="khitat-chart-block">
      {title && <h4 className="khitat-chart-title">{title}</h4>}
      <svg viewBox={`0 0 ${w} ${height + 30}`} width="100%" style={{ maxHeight: height + 40 }}>
        {data.map((d, i) => {
          const barH = maxVal > 0 ? (d[countKey] / maxVal) * height : 0;
          const x = 10 + i * (barW + gap);
          const y = height - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={Math.max(1, barH)}
                fill={d[colorKey] || '#D4A574'} rx={2} opacity={0.85} />
              <text x={x + barW / 2} y={height + 12} textAnchor="middle"
                fontSize={8} fill="var(--cream2)" fontFamily="var(--font-body)">
                {d[labelKey]?.slice(0, 6)}
              </text>
              <text x={x + barW / 2} y={y - 3} textAnchor="middle"
                fontSize={8} fill="var(--cream2)">
                {d[countKey]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ═══ Session summary table ═══ */
const SESS_NAMES = {
  tr: ['—', 'Câmiʿler', 'Medrese/Hankâh/Zaviye', 'Dûr/Hammâm/Sûk', 'Altyapı/Kale/Ahkâr', 'Dini/Mezarlık/Kilise'],
  en: ['—', 'Mosques', 'Madrasa/Sufi Lodges', 'Palaces/Baths/Markets', 'Infrastructure', 'Religious/Non-Muslim'],
};

const SESS_CATS = [
  [],
  ['mosque'],
  ['madrasa', 'maristan', 'masjid', 'khanqah', 'zawiya', 'ribat', 'shrine'],
  ['dar', 'hammam', 'qaysariyya', 'khan', 'suq'],
  ['qantara', 'birka', 'jisr', 'jazira', 'sijn', "sina'a", 'maydan', "qal'a", 'hikr'],
  ['mashhad', 'maqbara', 'masjid_qarafa', 'jawsaq', 'ribat_qarafa', 'musalla', 'masjid_jabal', "bi'r", 'kanisa_yahud', 'dayr', 'kanisa'],
];

export default function KhitatStats({ lang, tk, data, filtered, catMeta, stats }) {
  /* Category chart data */
  const catChart = useMemo(() => {
    const counts = {};
    filtered.forEach(s => { counts[s.cat] = (counts[s.cat] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([cat, count]) => ({
        label: catMeta[cat]?.icon + ' ' + (lang === 'en' ? catMeta[cat]?.en : catMeta[cat]?.tr) || cat,
        count,
        color: catMeta[cat]?.color || '#999',
      }));
  }, [filtered, catMeta, lang]);

  /* Dynasty chart data */
  const dynChart = useMemo(() => {
    const counts = {};
    filtered.forEach(s => {
      const dyn = lang === 'en' ? s.dy_en : s.dy_tr;
      if (dyn) counts[dyn] = (counts[dyn] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([label, count]) => ({ label, count, color: '#D4A574' }));
  }, [filtered, lang]);

  /* Century histogram */
  const centuryChart = useMemo(() => {
    const counts = {};
    filtered.forEach(s => {
      if (s.ce) {
        const century = Math.ceil(s.ce / 100);
        counts[century] = (counts[century] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => +a[0] - +b[0])
      .map(([century, count]) => ({
        label: `${century}.`,
        count,
        color: +century <= 9 ? '#4fc3f7' : +century <= 12 ? '#ce93d8' : +century <= 14 ? '#ff8a65' : '#ffd54f',
      }));
  }, [filtered]);

  /* Session counts */
  const sessionCounts = useMemo(() => {
    return [1, 2, 3, 4, 5].map(sid => {
      const cats = SESS_CATS[sid];
      return data.filter(s => cats.includes(s.cat)).length;
    });
  }, [data]);

  const sessNames = SESS_NAMES[lang] || SESS_NAMES.tr;
  const catMax = catChart.length > 0 ? Math.max(...catChart.map(c => c.count)) : 1;
  const dynMax = dynChart.length > 0 ? Math.max(...dynChart.map(c => c.count)) : 1;
  const centMax = centuryChart.length > 0 ? Math.max(...centuryChart.map(c => c.count)) : 1;

  return (
    <div className="khitat-stats-panel">
      {/* Summary cards */}
      <div className="khitat-stats-cards">
        <div className="khitat-stat-card">
          <span className="khitat-stat-num">{stats.total}</span>
          <span className="khitat-stat-label">{tk.totalStructures || 'Toplam Yapı'}</span>
        </div>
        <div className="khitat-stat-card">
          <span className="khitat-stat-num">{Object.keys(stats.cats).length}</span>
          <span className="khitat-stat-label">{tk.categories || 'Kategori'}</span>
        </div>
        <div className="khitat-stat-card">
          <span className="khitat-stat-num">{stats.geocoded}</span>
          <span className="khitat-stat-label">{tk.geocoded || 'Konumlu'}</span>
        </div>
        <div className="khitat-stat-card">
          <span className="khitat-stat-num">{stats.dated}</span>
          <span className="khitat-stat-label">{tk.dated || 'Tarihli'}</span>
        </div>
        <div className="khitat-stat-card">
          <span className="khitat-stat-num">{((stats.geocoded / stats.total) * 100).toFixed(1)}%</span>
          <span className="khitat-stat-label">{tk.geocodingRate || 'Geocoding'}</span>
        </div>
      </div>

      {/* Session table */}
      <div className="khitat-chart-block">
        <h4 className="khitat-chart-title">{tk.sessionSummary || 'Oturum Özeti'}</h4>
        <table className="khitat-session-table">
          <tbody>
            {[1, 2, 3, 4, 5].map(sid => (
              <tr key={sid}>
                <td className="khitat-sess-num">S{sid}</td>
                <td className="khitat-sess-name">{sessNames[sid]}</td>
                <td className="khitat-sess-count">{sessionCounts[sid - 1]}</td>
                <td className="khitat-sess-bar">
                  <div className="khitat-sess-bar-fill"
                    style={{ width: `${(sessionCounts[sid - 1] / Math.max(...sessionCounts, 1)) * 100}%` }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts row */}
      <div className="khitat-charts-row">
        <BarChart data={catChart} maxVal={catMax} labelKey="label" countKey="count" colorKey="color"
          title={tk.categoryDist || 'Kategori Dağılımı'} />
        <BarChart data={dynChart} maxVal={dynMax} labelKey="label" countKey="count" colorKey="color"
          title={tk.dynastyDist || 'Hanedan Dağılımı'} />
        <BarChart data={centuryChart} maxVal={centMax} labelKey="label" countKey="count" colorKey="color"
          title={tk.centuryDist || 'Yüzyıl Dağılımı'} />
      </div>
    </div>
  );
}
