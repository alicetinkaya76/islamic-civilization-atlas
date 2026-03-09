import { useMemo, useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

/* ═══ Mini donut chart ═══ */
function MiniDonut({ data, colors, size = 100 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !data.length) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    const r = size / 2;
    const g = svg.attr('width', size).attr('height', size)
      .append('g').attr('transform', `translate(${r},${r})`);
    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(r * 0.55).outerRadius(r - 2);
    g.selectAll('path').data(pie(data)).join('path')
      .attr('d', arc)
      .attr('fill', (d, i) => colors[i % colors.length])
      .attr('stroke', '#080c18')
      .attr('stroke-width', 1.5);
  }, [data, colors, size]);
  return <svg ref={ref} />;
}

/* ═══ Sparkline ═══ */
function Sparkline({ values, color = '#c9a84c', width = 160, height = 36 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !values.length) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);
    const x = d3.scaleLinear().domain([0, values.length - 1]).range([2, width - 2]);
    const y = d3.scaleLinear().domain([0, d3.max(values)]).range([height - 2, 2]);
    const line = d3.line().x((_, i) => x(i)).y(d => y(d)).curve(d3.curveMonotoneX);
    const area = d3.area().x((_, i) => x(i)).y0(height).y1(d => y(d)).curve(d3.curveMonotoneX);
    svg.append('path').datum(values).attr('d', area).attr('fill', color + '15');
    svg.append('path').datum(values).attr('d', line)
      .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 1.5);
  }, [values, color, width, height]);
  return <svg ref={ref} />;
}

/* ═══ Animated counter ═══ */
function AnimNum({ target }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start = null;
    const ease = t => 1 - Math.pow(1 - t, 3);
    function frame(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1200, 1);
      el.textContent = Math.round(ease(p) * target).toLocaleString();
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }, [target]);
  return <span ref={ref}>0</span>;
}

export default function AlamStatsPanel({ lang, ta, data }) {
  const isTr = lang === 'tr';

  /* ── Core stats ── */
  const stats = useMemo(() => {
    const total = data.length;
    const geocoded = data.filter(b => b.lat != null).length;
    const withDia = data.filter(b => b.ds).length;
    const female = data.filter(b => b.g === 'F').length;
    const withWorks = data.filter(b => b.wc).length;
    const totalWorks = data.reduce((s, b) => s + (b.wc || 0), 0);
    const withMadhab = data.filter(b => b.mz).length;

    // Earliest and latest
    const dated = data.filter(b => b.md);
    const earliest = dated.length ? Math.min(...dated.map(b => b.md)) : 0;
    const latest = dated.length ? Math.max(...dated.map(b => b.md)) : 0;

    // Peak century
    const centuryCounts = {};
    data.forEach(b => { if (b.c) centuryCounts[b.c] = (centuryCounts[b.c] || 0) + 1; });
    const peakCentury = Object.entries(centuryCounts).sort((a, b) => b[1] - a[1])[0];

    return { total, geocoded, withDia, female, withWorks, totalWorks, withMadhab, earliest, latest, peakCentury };
  }, [data]);

  /* ── Madhab donut ── */
  const madhabData = useMemo(() => {
    const counts = {};
    data.forEach(b => { if (b.mz) counts[b.mz] = (counts[b.mz] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
  }, [data]);
  const madhabColors = ['#4fc3f7', '#66bb6a', '#ffd54f', '#ef5350', '#ce93d8', '#ff8a65', '#4dd0e1'];

  /* ── Gender donut ── */
  const genderData = useMemo(() => {
    const m = data.filter(b => !b.g || b.g === 'M').length;
    const f = data.filter(b => b.g === 'F').length;
    return [
      { label: isTr ? 'Erkek' : 'Male', value: m },
      { label: isTr ? 'Kadın' : 'Female', value: f },
    ];
  }, [data, isTr]);

  /* ── Top 5 professions ── */
  const topProfs = useMemo(() => {
    const counts = {};
    data.forEach(b => {
      if (b.pt) b.pt.split(', ').forEach(p => { counts[p] = (counts[p] || 0) + 1; });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [data]);

  /* ── Century sparkline ── */
  const centurySpark = useMemo(() => {
    const arr = Array.from({ length: 15 }, (_, i) => {
      const c = i + 6;
      return data.filter(b => b.c === c).length;
    });
    return arr;
  }, [data]);

  /* ── Top 5 regions ── */
  const topRegions = useMemo(() => {
    const counts = {};
    data.forEach(b => { if (b.rg) counts[b.rg] = (counts[b.rg] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [data]);

  /* ── Random fact ── */
  const [fact, setFact] = useState('');
  const facts = useMemo(() => {
    const f = [];
    if (isTr) {
      f.push(`En kalabalık yüzyıl: ${stats.peakCentury?.[0]}. yüzyıl (${stats.peakCentury?.[1]} biyografi)`);
      f.push(`Kadın biyografi oranı: %${((stats.female / stats.total) * 100).toFixed(1)}`);
      f.push(`Biyografilerin %${((stats.geocoded / stats.total) * 100).toFixed(1)}'i haritada konumlandırılmış`);
      f.push(`Toplam ${stats.totalWorks.toLocaleString()} eser kayıtlı — ortalama ${(stats.totalWorks / stats.withWorks).toFixed(1)} eser/âlim`);
      f.push(`DİA bağlantı oranı: %${((stats.withDia / stats.total) * 100).toFixed(1)}`);
      f.push(`Zaman aralığı: ${stats.earliest}–${stats.latest} Milâdî (${stats.latest - stats.earliest} yıl)`);
    } else {
      f.push(`Peak century: ${stats.peakCentury?.[0]}th (${stats.peakCentury?.[1]} biographies)`);
      f.push(`Female biography ratio: ${((stats.female / stats.total) * 100).toFixed(1)}%`);
      f.push(`${((stats.geocoded / stats.total) * 100).toFixed(1)}% of biographies are geocoded`);
      f.push(`${stats.totalWorks.toLocaleString()} total works — avg ${(stats.totalWorks / stats.withWorks).toFixed(1)} per scholar`);
      f.push(`DIA link coverage: ${((stats.withDia / stats.total) * 100).toFixed(1)}%`);
      f.push(`Time span: ${stats.earliest}–${stats.latest} CE (${stats.latest - stats.earliest} years)`);
    }
    return f;
  }, [stats, isTr]);

  useEffect(() => {
    setFact(facts[0]);
    const iv = setInterval(() => {
      setFact(f => {
        const idx = facts.indexOf(f);
        return facts[(idx + 1) % facts.length];
      });
    }, 5000);
    return () => clearInterval(iv);
  }, [facts]);

  const maxProf = topProfs[0]?.[1] || 1;
  const maxRegion = topRegions[0]?.[1] || 1;

  return (
    <div className="alam-stats-panel">
      {/* Title */}
      <div className="alam-sp-header">
        <h3>{isTr ? 'Veri Profili' : 'Data Profile'}</h3>
        <span className="alam-sp-badge">{isTr ? 'Canlı İstatistik' : 'Live Stats'}</span>
      </div>

      {/* Key metrics */}
      <div className="alam-sp-metrics">
        <div className="alam-sp-metric">
          <span className="alam-sp-metric-num"><AnimNum target={stats.total} /></span>
          <span className="alam-sp-metric-label">{isTr ? 'Biyografi' : 'Biographies'}</span>
        </div>
        <div className="alam-sp-metric">
          <span className="alam-sp-metric-num"><AnimNum target={stats.geocoded} /></span>
          <span className="alam-sp-metric-label">{isTr ? 'Konumlu' : 'Geocoded'}</span>
        </div>
        <div className="alam-sp-metric">
          <span className="alam-sp-metric-num"><AnimNum target={stats.totalWorks} /></span>
          <span className="alam-sp-metric-label">{isTr ? 'Eser' : 'Works'}</span>
        </div>
        <div className="alam-sp-metric">
          <span className="alam-sp-metric-num"><AnimNum target={stats.withDia} /></span>
          <span className="alam-sp-metric-label">{isTr ? 'DİA Bağlantılı' : 'DIA Linked'}</span>
        </div>
        <div className="alam-sp-metric">
          <span className="alam-sp-metric-num"><AnimNum target={stats.withWorks} /></span>
          <span className="alam-sp-metric-label">{isTr ? 'Müellif' : 'Authors'}</span>
        </div>
        <div className="alam-sp-metric">
          <span className="alam-sp-metric-num"><AnimNum target={stats.female} /></span>
          <span className="alam-sp-metric-label">{isTr ? 'Kadın' : 'Female'}</span>
        </div>
      </div>

      {/* Works highlight */}
      <div className="alam-sp-section alam-sp-works-highlight">
        <div className="alam-sp-section-head">
          <span>📚 {isTr ? 'Eser İstatistikleri' : 'Works Statistics'}</span>
        </div>
        <div className="alam-sp-works-row">
          <span className="alam-sp-works-item">
            <strong>{stats.withWorks > 0 ? (stats.totalWorks / stats.withWorks).toFixed(1) : 0}</strong>
            <small>{isTr ? 'ort. eser/müellif' : 'avg works/author'}</small>
          </span>
          <span className="alam-sp-works-item">
            <strong>6,200</strong>
            <small>{isTr ? 'basılı (ط)' : 'printed (ط)'}</small>
          </span>
          <span className="alam-sp-works-item">
            <strong>5,212</strong>
            <small>{isTr ? 'yazma (خ)' : 'manuscript (خ)'}</small>
          </span>
        </div>
      </div>

      {/* Century sparkline */}
      <div className="alam-sp-section">
        <div className="alam-sp-section-head">
          <span>{isTr ? 'Yüzyıl Eğrisi' : 'Century Curve'}</span>
          <span className="alam-sp-range">6.–20. {isTr ? 'yy' : 'c.'}</span>
        </div>
        <Sparkline values={centurySpark} color="#c9a84c" width={240} height={44} />
      </div>

      {/* Madhab donut */}
      <div className="alam-sp-section">
        <div className="alam-sp-section-head">
          <span>{isTr ? 'Mezhep Dağılımı' : 'Legal Schools'}</span>
          <span className="alam-sp-range">{stats.withMadhab.toLocaleString()} {isTr ? 'kayıt' : 'entries'}</span>
        </div>
        <div className="alam-sp-donut-row">
          <MiniDonut data={madhabData} colors={madhabColors} size={90} />
          <div className="alam-sp-donut-legend">
            {madhabData.slice(0, 6).map((d, i) => (
              <div key={d.label} className="alam-sp-legend-row">
                <span className="alam-sp-legend-dot" style={{ background: madhabColors[i] }} />
                <span className="alam-sp-legend-label">{d.label}</span>
                <span className="alam-sp-legend-val">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gender donut */}
      <div className="alam-sp-section">
        <div className="alam-sp-section-head">
          <span>{isTr ? 'Cinsiyet' : 'Gender'}</span>
        </div>
        <div className="alam-sp-donut-row">
          <MiniDonut data={genderData} colors={['#4fc3f7', '#f06292']} size={70} />
          <div className="alam-sp-donut-legend">
            {genderData.map((d, i) => (
              <div key={d.label} className="alam-sp-legend-row">
                <span className="alam-sp-legend-dot" style={{ background: ['#4fc3f7', '#f06292'][i] }} />
                <span className="alam-sp-legend-label">{d.label}</span>
                <span className="alam-sp-legend-val">{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top professions */}
      <div className="alam-sp-section">
        <div className="alam-sp-section-head">
          <span>{isTr ? 'Baskın Meslekler' : 'Top Professions'}</span>
        </div>
        <div className="alam-sp-bars">
          {topProfs.map(([name, count]) => (
            <div key={name} className="alam-sp-bar-row">
              <span className="alam-sp-bar-label">{isTr ? name : name}</span>
              <div className="alam-sp-bar-track">
                <div className="alam-sp-bar-fill" style={{ width: `${(count / maxProf) * 100}%` }} />
              </div>
              <span className="alam-sp-bar-val">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top regions */}
      <div className="alam-sp-section">
        <div className="alam-sp-section-head">
          <span>{isTr ? 'En Yoğun Bölgeler' : 'Top Regions'}</span>
        </div>
        <div className="alam-sp-bars">
          {topRegions.map(([name, count]) => (
            <div key={name} className="alam-sp-bar-row">
              <span className="alam-sp-bar-label">{name}</span>
              <div className="alam-sp-bar-track">
                <div className="alam-sp-bar-fill alam-sp-bar-teal" style={{ width: `${(count / maxRegion) * 100}%` }} />
              </div>
              <span className="alam-sp-bar-val">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rotating fact */}
      <div className="alam-sp-fact">
        <span className="alam-sp-fact-icon">💡</span>
        <span className="alam-sp-fact-text">{fact}</span>
      </div>
    </div>
  );
}
