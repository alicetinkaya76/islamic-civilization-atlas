import { useMemo, useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import DB from '../../data/db.json';
import SCHOLAR_LINKS from '../../data/scholar_links';
import { ERA_BANDS } from '../../config/eras';
import { ZONE_C } from '../../config/colors';
import '../../styles/dashboard.css';
import { f, n } from '../../data/i18n-utils';
import T from '../../data/i18n';

/* ── CountUp animation ── */
function CountUp({ target, duration = 1800 }) {
  const ref = useRef(null);
  useEffect(() => {
    let start = null;
    const el = ref.current;
    if (!el) return;
    const ease = t => 1 - Math.pow(1 - t, 3);
    function frame(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      el.textContent = Math.round(ease(p) * target).toLocaleString();
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }, [target, duration]);
  return <span ref={ref}>0</span>;
}

/* ── D3 Horizontal Bar Chart ── */
function HBarChart({ data, width = 320, barHeight = 26, colorFn }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !data.length) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    const margin = { top: 4, right: 40, bottom: 4, left: 110 };
    const w = width - margin.left - margin.right;
    const h = data.length * barHeight;
    svg.attr('width', width).attr('height', h + margin.top + margin.bottom);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, d3.max(data, d => d.value)]).range([0, w]);
    const y = d3.scaleBand().domain(data.map(d => d.label)).range([0, h]).padding(0.25);

    g.selectAll('.bar').data(data).enter().append('rect')
      .attr('class', 'bar')
      .attr('y', d => y(d.label)).attr('height', y.bandwidth())
      .attr('x', 0).attr('width', 0)
      .attr('rx', 3).attr('fill', (d, i) => colorFn ? colorFn(d, i) : '#22d3ee')
      .transition().duration(800).delay((_, i) => i * 60)
      .attr('width', d => x(d.value));

    g.selectAll('.label').data(data).enter().append('text')
      .attr('class', 'dash-chart-label')
      .attr('x', -6).attr('y', d => y(d.label) + y.bandwidth() / 2)
      .attr('dy', '0.35em').attr('text-anchor', 'end')
      .attr('fill', '#94a3b8').attr('font-size', 11)
      .text(d => d.label.length > 16 ? d.label.slice(0, 15) + '…' : d.label);

    g.selectAll('.val').data(data).enter().append('text')
      .attr('class', 'dash-chart-val')
      .attr('x', d => x(d.value) + 4).attr('y', d => y(d.label) + y.bandwidth() / 2)
      .attr('dy', '0.35em').attr('fill', '#e2e8f0').attr('font-size', 11)
      .text(d => d.value);
  }, [data, width, barHeight, colorFn]);
  return <svg ref={ref} />;
}

/* ── D3 Donut Chart ── */
function DonutChart({ data, size = 200, colors }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !data.length) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    svg.attr('width', size).attr('height', size);
    const g = svg.append('g').attr('transform', `translate(${size / 2},${size / 2})`);
    const radius = size / 2 - 10;
    const arc = d3.arc().innerRadius(radius * 0.55).outerRadius(radius);
    const pie = d3.pie().value(d => d.value).sort(null);

    const arcs = g.selectAll('.arc').data(pie(data)).enter().append('g');
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => colors[i % colors.length])
      .attr('stroke', '#0f172a').attr('stroke-width', 1.5)
      .style('opacity', 0)
      .transition().duration(600).delay((_, i) => i * 80)
      .style('opacity', 1);

    // Legend below
    const total = d3.sum(data, d => d.value);
    const legend = svg.append('g').attr('transform', `translate(10, ${size - 4})`);
    data.forEach((d, i) => {
      const pct = total ? Math.round(d.value / total * 100) : 0;
      const lg = legend.append('g').attr('transform', `translate(0, ${i * 16})`);
      lg.append('rect').attr('width', 10).attr('height', 10).attr('rx', 2).attr('fill', colors[i % colors.length]);
      lg.append('text').attr('x', 14).attr('y', 9).attr('fill', '#94a3b8').attr('font-size', 10)
        .text(`${d.label} (${pct}%)`);
    });
    svg.attr('height', size + data.length * 16 + 4);
  }, [data, size, colors]);
  return <svg ref={ref} />;
}

/* ── D3 Area Chart ── */
function AreaChart({ data, width = 320, height = 180 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !data.length) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    const margin = { top: 10, right: 10, bottom: 28, left: 36 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    svg.attr('width', width).attr('height', height);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain(d3.extent(data, d => d.x)).range([0, w]);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.y) * 1.1]).range([h, 0]);

    const area = d3.area().x(d => x(d.x)).y0(h).y1(d => y(d.y)).curve(d3.curveMonotoneX);
    const line = d3.line().x(d => x(d.x)).y(d => y(d.y)).curve(d3.curveMonotoneX);

    g.append('path').datum(data).attr('fill', '#22d3ee').attr('fill-opacity', 0.15).attr('d', area);
    g.append('path').datum(data).attr('fill', 'none').attr('stroke', '#22d3ee').attr('stroke-width', 2).attr('d', line);

    g.append('g').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d => d + '.')).selectAll('text').attr('fill', '#64748b').attr('font-size', 9);
    g.append('g').call(d3.axisLeft(y).ticks(4)).selectAll('text').attr('fill', '#64748b').attr('font-size', 9);
    g.selectAll('.domain, .tick line').attr('stroke', '#334155');
  }, [data, width, height]);
  return <svg ref={ref} />;
}

/* ── DASHBOARD MAIN ── */
export default function Dashboard({ lang, t: tProp, onTabChange }) {
  const t = tProp || T[lang];
  const td = t.dashboard || {};

  /* Computed data */
  const overviewStats = useMemo(() => [
    { key: 'dynasties', icon: '🏛', count: DB.dynasties?.length || 0, label: t.layers.dynasties, tab: 'map' },
    { key: 'scholars', icon: '📚', count: DB.scholars?.length || 0, label: t.layers.scholars, tab: 'scholars' },
    { key: 'battles', icon: '⚔', count: DB.battles?.length || 0, label: t.layers.battles, tab: 'battles' },
    { key: 'rulers', icon: '👑', count: DB.rulers?.length || 0, label: t.layers.rulers, tab: 'map' },
    { key: 'monuments', icon: '🕌', count: DB.monuments?.length || 0, label: t.layers.monuments, tab: 'map' },
    { key: 'cities', icon: '🏙', count: DB.cities?.length || 0, label: t.layers.cities, tab: 'map' },
    { key: 'routes', icon: '🛤', count: DB.routes?.length || 0, label: t.layers.routes, tab: 'map' },
    { key: 'madrasas', icon: '🎓', count: DB.madrasas?.length || 0, label: t.layers.madrasas, tab: 'map' },
    { key: 'alam', icon: '📖', count: 13940, label: t.landing.alamBio, tab: 'alam' },
  ], [lang]);

  /* Era distribution */
  const eraData = useMemo(() => {
    const counts = {};
    ERA_BANDS.forEach(([s, e, , names]) => {
      const name = n(names, lang);
      counts[name] = 0;
    });
    DB.dynasties.forEach(d => {
      ERA_BANDS.forEach(([s, e, , names]) => {
        const name = n(names, lang);
        if (d.start < e && (d.end || 9999) > s) counts[name]++;
      });
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value })).filter(d => d.value > 0);
  }, [lang]);

  const eraColors = useMemo(() => {
    const c = ['#1a6b1a', '#8b6914', '#2a4a8b', '#8b2a2a', '#8b4a0a', '#4a4a4a'];
    return (d, i) => c[i % c.length];
  }, []);

  /* Regional distribution */
  const regionData = useMemo(() => {
    const counts = {};
    DB.dynasties.forEach(d => {
      const z = d.zone || t.dashboard.unknown;
      counts[z] = (counts[z] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
  }, [lang]);

  const regionColors = useMemo(() =>
    regionData.map(d => ZONE_C[d.label] || '#64748b')
  , [regionData]);

  /* Discipline distribution */
  const discData = useMemo(() => {
    const counts = {};
    DB.scholars.forEach(s => {
      const disc = s.disc_tr || '';
      disc.split(',').forEach(dd => {
        dd = dd.trim();
        if (dd) counts[dd] = (counts[dd] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, value]) => ({ label, value }));
  }, []);

  const DISC_COLORS = ['#34d399','#22d3ee','#a78bfa','#fbbf24','#f87171','#60a5fa','#fb923c','#4ade80','#f472b6','#c9a84c'];

  /* Scholars over time */
  const scholarsOverTime = useMemo(() => {
    const buckets = {};
    for (let c = 650; c <= 1950; c += 50) buckets[c] = 0;
    DB.scholars.forEach(s => {
      if (!s.b || !s.d) return;
      for (let c = 650; c <= 1950; c += 50) {
        if (s.b <= c + 50 && s.d >= c) buckets[c]++;
      }
    });
    return Object.entries(buckets).map(([x, y]) => ({ x: +x, y }));
  }, []);

  /* Most connected scholars */
  const topScholars = useMemo(() => {
    const counts = {};
    SCHOLAR_LINKS.forEach(l => {
      counts[l.source] = (counts[l.source] || 0) + 1;
      counts[l.target] = (counts[l.target] || 0) + 1;
    });
    const scholarMap = {};
    DB.scholars.forEach(s => { scholarMap[s.id] = s; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, cnt]) => {
        const s = scholarMap[+id];
        return s ? { name: n(s, lang), count: cnt, disc: s.disc_tr || '', id: s.id } : null;
      })
      .filter(Boolean);
  }, [lang]);

  /* Battle outcomes */
  const battleOutcomes = useMemo(() => {
    let victory = 0, defeat = 0, inconclusive = 0;
    DB.battles.forEach(b => {
      const r = (b.result_tr || b.res || '').toLowerCase();
      if (r.includes('zafer') || r.includes('fetih') || r.includes('müslüman') || r.includes('yıktı') || r.includes('kesin')) victory++;
      else if (r.includes('yenilgi') || r.includes('karşı') || r.includes('kaybetti')) defeat++;
      else inconclusive++;
    });
    return [
      { label: td.victory || 'Victory', value: victory },
      { label: td.defeat || 'Defeat', value: defeat },
      { label: td.inconclusive || 'Inconclusive', value: inconclusive },
    ];
  }, [td]);

  /* Top madrasas */
  const topMadrasas = useMemo(() =>
    (DB.madrasas || [])
      .filter(m => m.founded)
      .sort((a, b) => a.founded - b.founded)
      .slice(0, 6)
      .map(m => ({
        name: n(m, lang),
        city: f(m, 'city', lang),
        year: m.founded,
        type: f(m, 'type', lang),
      }))
  , [lang]);

  const goTab = useCallback((tab) => {
    if (onTabChange) onTabChange(tab);
  }, [onTabChange]);

  return (
    <div className="dashboard">
      <div className="dash-grid">

        {/* CARD 1: Overview */}
        <div className="dash-card dash-card-wide">
          <h3 className="dash-card-title">{td.overview || 'Overview'}</h3>
          <div className="dash-overview-grid">
            {overviewStats.map(s => (
              <div key={s.key} className="dash-stat" onClick={() => goTab(s.tab)} role="button" tabIndex={0}>
                <span className="dash-stat-icon">{s.icon}</span>
                <span className="dash-stat-num"><CountUp target={s.count} /></span>
                <span className="dash-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 2: Era Distribution */}
        <div className="dash-card">
          <h3 className="dash-card-title">{td.eraDistribution || 'Era Distribution'}</h3>
          <HBarChart data={eraData} colorFn={eraColors} />
        </div>

        {/* CARD 3: Regional Distribution */}
        <div className="dash-card">
          <h3 className="dash-card-title">{td.regionalDistribution || 'Regional Distribution'}</h3>
          <DonutChart data={regionData} colors={regionColors} />
        </div>

        {/* CARD 4: Discipline Distribution */}
        <div className="dash-card">
          <h3 className="dash-card-title">{td.disciplineDistribution || 'Discipline Distribution'}</h3>
          <HBarChart data={discData} colorFn={(d, i) => DISC_COLORS[i % DISC_COLORS.length]} />
        </div>

        {/* CARD 5: Scholars Over Time */}
        <div className="dash-card">
          <h3 className="dash-card-title">{td.scholarsOverTime || 'Scholars Over Time'}</h3>
          <AreaChart data={scholarsOverTime} />
        </div>

        {/* CARD 6: Most Connected Scholars */}
        <div className="dash-card">
          <h3 className="dash-card-title">{td.mostConnected || 'Most Connected Scholars'}</h3>
          <div className="dash-connected-list">
            {topScholars.map((s, i) => (
              <div key={s.id} className="dash-connected-row" onClick={() => goTab('scholars')}>
                <span className="dash-connected-rank">{i + 1}</span>
                <span className="dash-connected-name">{s.name}</span>
                <span className="dash-connected-badge">{s.disc.split(',')[0]?.trim()}</span>
                <span className="dash-connected-count">{s.count} {td.connections || 'connections'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 7: Battle Outcomes */}
        <div className="dash-card">
          <h3 className="dash-card-title">{td.battleOutcomes || 'Battle Outcomes'}</h3>
          <DonutChart data={battleOutcomes} colors={['#4ade80', '#f87171', '#fbbf24']} size={180} />
        </div>

        {/* CARD 8: Madrasas & Libraries */}
        <div className="dash-card">
          <h3 className="dash-card-title">{td.madrasasCard || 'Madrasas & Libraries'}</h3>
          <div className="dash-madrasa-list">
            {topMadrasas.map((m, i) => (
              <div key={i} className="dash-madrasa-row">
                <span className="dash-madrasa-icon">🎓</span>
                <div className="dash-madrasa-info">
                  <span className="dash-madrasa-name">{m.name}</span>
                  <span className="dash-madrasa-meta">{m.city} · {m.year}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="dash-viewmap-btn" onClick={() => goTab('map')}>
            🗺 {td.viewOnMap || 'View on Map'}
          </button>
        </div>

      </div>
    </div>
  );
}
