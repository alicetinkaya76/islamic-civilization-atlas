import { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { hn } from '../../data/i18n-utils';
import T from '../../data/i18n';

/* ═══ Shared chart constants ═══ */
const MARGIN = { top: 30, right: 20, bottom: 40, left: 50 };
const CENTURY_RANGE = Array.from({ length: 15 }, (_, i) => i + 6); // 6-20

const MADHAB_COLORS = {
  'Hanefî': '#4fc3f7', 'Şâfiî': '#66bb6a', 'Mâlikî': '#ffd54f',
  'Hanbelî': '#ef5350', 'İmâmî': '#ce93d8', 'Zeydî': '#ff8a65', 'İbâzî': '#4dd0e1',
};

const REGION_COLORS = {
  'Irak': '#4fc3f7', 'Mısır': '#ffd54f', 'Suriye': '#66bb6a',
  'İran': '#ce93d8', 'S.Arabistan': '#ff8a65', 'İspanya': '#ef5350',
  'Fas': '#4dd0e1', 'Yemen': '#a1887f', 'Lübnan': '#aed581',
  'Türkiye': '#90a4ae', 'Tunus': '#9575cd', 'Filistin': '#64b5f6',
  'Özbekistan': '#ffb74d', 'Cezayir': '#78909c', 'Hindistan': '#f06292',
};

/* ═══ A) Knowledge Capital Bar Chart Race ═══ */
function KnowledgeCapital({ data, lang, ta }) {
  const svgRef = useRef(null);
  const [activeCentury, setActiveCentury] = useState(9);

  const cityByCentury = useMemo(() => {
    const result = {};
    CENTURY_RANGE.forEach(c => { result[c] = {}; });
    data.forEach(b => {
      if (!b.c || !b.rg) return;
      const city = b.rg;
      if (!result[b.c]) return;
      result[b.c][city] = (result[b.c][city] || 0) + 1;
    });
    return result;
  }, [data]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 600;
    const h = 300;
    svg.attr('width', w).attr('height', h);

    const cityData = cityByCentury[activeCentury] || {};
    const sorted = Object.entries(cityData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (!sorted.length) return;

    const x = d3.scaleLinear()
      .domain([0, sorted[0][1]])
      .range([0, w - MARGIN.left - MARGIN.right]);

    const y = d3.scaleBand()
      .domain(sorted.map(d => d[0]))
      .range([MARGIN.top, h - MARGIN.bottom])
      .padding(0.15);

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},0)`);

    g.selectAll('rect')
      .data(sorted)
      .join('rect')
      .attr('x', 0)
      .attr('y', d => y(d[0]))
      .attr('height', y.bandwidth())
      .attr('fill', d => REGION_COLORS[d[0]] || '#c9a84c')
      .attr('rx', 3)
      .attr('width', 0)
      .transition().duration(600)
      .attr('width', d => x(d[1]));

    g.selectAll('.label')
      .data(sorted)
      .join('text')
      .attr('class', 'label')
      .attr('x', -5)
      .attr('y', d => y(d[0]) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('fill', '#c4b89a')
      .attr('font-size', 11)
      .text(d => d[0]);

    g.selectAll('.count')
      .data(sorted)
      .join('text')
      .attr('class', 'count')
      .attr('x', d => x(d[1]) + 5)
      .attr('y', d => y(d[0]) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', '#e8dcc8')
      .attr('font-size', 11)
      .attr('font-weight', 600)
      .text(d => d[1]);

  }, [cityByCentury, activeCentury]);

  return (
    <div className="alam-chart-card">
      <h3 className="alam-chart-title">🏙 {ta.knowledgeCapital}</h3>
      <div className="alam-century-selector">
        {CENTURY_RANGE.map(c => (
          <button key={c}
            className={`alam-century-btn${activeCentury === c ? ' active' : ''}`}
            onClick={() => setActiveCentury(c)}>
            {c}
          </button>
        ))}
      </div>
      <svg ref={svgRef} style={{ width: '100%', height: 300 }} />
    </div>
  );
}

/* ═══ B) Madhab Timeline — Stacked Area ═══ */
function MadhabTimeline({ data, lang, ta }) {
  const svgRef = useRef(null);
  const madhabs = ['Hanefî', 'Şâfiî', 'Mâlikî', 'Hanbelî', 'İmâmî', 'Zeydî'];

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 600;
    const h = 280;
    svg.attr('width', w).attr('height', h);

    // Build stacked data
    const stackData = CENTURY_RANGE.map(c => {
      const row = { century: c };
      madhabs.forEach(m => { row[m] = 0; });
      data.forEach(b => {
        if (b.c === c && b.mz && madhabs.includes(b.mz)) {
          row[b.mz]++;
        }
      });
      return row;
    });

    const stack = d3.stack().keys(madhabs);
    const series = stack(stackData);

    const x = d3.scaleLinear()
      .domain([6, 20])
      .range([MARGIN.left, w - MARGIN.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(series, s => d3.max(s, d => d[1]))])
      .nice()
      .range([h - MARGIN.bottom, MARGIN.top]);

    const area = d3.area()
      .x(d => x(d.data.century))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveBasis);

    svg.selectAll('path')
      .data(series)
      .join('path')
      .attr('d', area)
      .attr('fill', (d, i) => MADHAB_COLORS[madhabs[i]] || '#888')
      .attr('opacity', 0.75);

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${h - MARGIN.bottom})`)
      .call(d3.axisBottom(x).ticks(15).tickFormat(d => `${d}.`))
      .attr('color', '#c4b89a')
      .selectAll('text').attr('font-size', 10);

    svg.append('g')
      .attr('transform', `translate(${MARGIN.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', '#c4b89a')
      .selectAll('text').attr('font-size', 10);

    // Legend
    const legend = svg.append('g').attr('transform', `translate(${w - 140}, 10)`);
    madhabs.forEach((m, i) => {
      const g = legend.append('g').attr('transform', `translate(0, ${i * 16})`);
      g.append('rect').attr('width', 10).attr('height', 10).attr('fill', MADHAB_COLORS[m]).attr('rx', 2);
      g.append('text').attr('x', 14).attr('y', 9).attr('fill', '#c4b89a').attr('font-size', 10).text(m);
    });

  }, [data]);

  return (
    <div className="alam-chart-card">
      <h3 className="alam-chart-title">📐 {ta.madhabTimeline}</h3>
      <svg ref={svgRef} style={{ width: '100%', height: 280 }} />
    </div>
  );
}

/* ═══ C) Century × Region Heatmap ═══ */
function CenturyRegionHeatmap({ data, lang, ta }) {
  const svgRef = useRef(null);

  const TOP_REGIONS = ['Irak', 'Mısır', 'Suriye', 'İran', 'S.Arabistan', 'İspanya', 'Fas', 'Yemen', 'Lübnan', 'Türkiye'];

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 600;
    const h = 320;
    svg.attr('width', w).attr('height', h);

    // Build matrix
    const matrix = {};
    let maxVal = 0;
    TOP_REGIONS.forEach(r => {
      matrix[r] = {};
      CENTURY_RANGE.forEach(c => { matrix[r][c] = 0; });
    });
    data.forEach(b => {
      if (b.c && b.rg && TOP_REGIONS.includes(b.rg)) {
        matrix[b.rg][b.c]++;
        maxVal = Math.max(maxVal, matrix[b.rg][b.c]);
      }
    });

    const x = d3.scaleBand()
      .domain(CENTURY_RANGE)
      .range([MARGIN.left + 60, w - MARGIN.right])
      .padding(0.05);

    const y = d3.scaleBand()
      .domain(TOP_REGIONS)
      .range([MARGIN.top, h - MARGIN.bottom])
      .padding(0.05);

    const color = d3.scaleSequential(d3.interpolateYlOrRd)
      .domain([0, maxVal]);

    const g = svg.append('g');

    TOP_REGIONS.forEach(r => {
      CENTURY_RANGE.forEach(c => {
        const val = matrix[r][c];
        g.append('rect')
          .attr('x', x(c))
          .attr('y', y(r))
          .attr('width', x.bandwidth())
          .attr('height', y.bandwidth())
          .attr('fill', val > 0 ? color(val) : '#0f162920')
          .attr('rx', 2)
          .append('title')
          .text(`${r} — ${c}. yy: ${val}`);
      });
    });

    // Y axis labels
    svg.selectAll('.region-label')
      .data(TOP_REGIONS)
      .join('text')
      .attr('x', MARGIN.left + 55)
      .attr('y', d => y(d) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('fill', '#c4b89a')
      .attr('font-size', 10)
      .text(d => d);

    // X axis labels
    svg.selectAll('.century-label')
      .data(CENTURY_RANGE)
      .join('text')
      .attr('x', d => x(d) + x.bandwidth() / 2)
      .attr('y', h - MARGIN.bottom + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#c4b89a')
      .attr('font-size', 9)
      .text(d => `${d}.`);

  }, [data]);

  return (
    <div className="alam-chart-card">
      <h3 className="alam-chart-title">🔥 {ta.heatmap}</h3>
      <svg ref={svgRef} style={{ width: '100%', height: 320 }} />
    </div>
  );
}

/* ═══ D) Profession Evolution — Stacked Bar ═══ */
function ProfessionEvolution({ data, lang, ta }) {
  const svgRef = useRef(null);
  const TOP_PROFS = ['Fıkıh Âlimi', 'Şair', 'Emîr', 'Muhaddis', 'Edib', 'Tarihçi', 'Kadı', 'Kumandan'];
  const PROF_COLORS_D = {
    'Fıkıh Âlimi': '#4fc3f7', 'Şair': '#ce93d8', 'Emîr': '#ff8a65',
    'Muhaddis': '#81c784', 'Edib': '#a1887f', 'Tarihçi': '#90a4ae',
    'Kadı': '#4dd0e1', 'Kumandan': '#ef5350',
  };

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 600;
    const h = 280;
    svg.attr('width', w).attr('height', h);

    const stackData = CENTURY_RANGE.map(c => {
      const row = { century: c };
      TOP_PROFS.forEach(p => { row[p] = 0; });
      data.forEach(b => {
        if (b.c === c && b.pt) {
          b.pt.split(', ').forEach(pr => {
            if (TOP_PROFS.includes(pr)) row[pr]++;
          });
        }
      });
      return row;
    });

    const stack = d3.stack().keys(TOP_PROFS);
    const series = stack(stackData);

    const x = d3.scaleBand()
      .domain(CENTURY_RANGE)
      .range([MARGIN.left, w - MARGIN.right])
      .padding(0.15);

    const y = d3.scaleLinear()
      .domain([0, d3.max(series, s => d3.max(s, d => d[1]))])
      .nice()
      .range([h - MARGIN.bottom, MARGIN.top]);

    svg.selectAll('g.layer')
      .data(series)
      .join('g')
      .attr('class', 'layer')
      .attr('fill', (d, i) => PROF_COLORS_D[TOP_PROFS[i]])
      .attr('opacity', 0.8)
      .selectAll('rect')
      .data(d => d)
      .join('rect')
      .attr('x', d => x(d.data.century))
      .attr('y', d => y(d[1]))
      .attr('height', d => y(d[0]) - y(d[1]))
      .attr('width', x.bandwidth())
      .attr('rx', 1);

    svg.append('g')
      .attr('transform', `translate(0,${h - MARGIN.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d => `${d}.`))
      .attr('color', '#c4b89a')
      .selectAll('text').attr('font-size', 9);

    svg.append('g')
      .attr('transform', `translate(${MARGIN.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', '#c4b89a');

    // Compact legend
    const legend = svg.append('g').attr('transform', `translate(${w - 120}, 8)`);
    TOP_PROFS.forEach((p, i) => {
      const g = legend.append('g').attr('transform', `translate(0, ${i * 13})`);
      g.append('rect').attr('width', 8).attr('height', 8).attr('fill', PROF_COLORS_D[p]).attr('rx', 1);
      g.append('text').attr('x', 11).attr('y', 7).attr('fill', '#c4b89a').attr('font-size', 9).text(p);
    });

  }, [data]);

  return (
    <div className="alam-chart-card">
      <h3 className="alam-chart-title">👨‍🏫 {ta.professionEvolution}</h3>
      <svg ref={svgRef} style={{ width: '100%', height: 280 }} />
    </div>
  );
}

/* ═══ E) Works Production Area Chart ═══ */
function WorksProduction({ data, lang, ta }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 600;
    const h = 200;
    svg.attr('width', w).attr('height', h);

    const byC = CENTURY_RANGE.map(c => {
      let total = 0;
      data.forEach(b => { if (b.c === c && b.wc) total += b.wc; });
      return { century: c, count: total };
    });

    const x = d3.scaleLinear().domain([6, 20]).range([MARGIN.left, w - MARGIN.right]);
    const y = d3.scaleLinear().domain([0, d3.max(byC, d => d.count)]).nice().range([h - MARGIN.bottom, MARGIN.top]);

    const area = d3.area()
      .x(d => x(d.century))
      .y0(y(0))
      .y1(d => y(d.count))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(byC)
      .attr('d', area)
      .attr('fill', '#c9a84c33')
      .attr('stroke', '#c9a84c')
      .attr('stroke-width', 2);

    // Dots
    svg.selectAll('circle')
      .data(byC)
      .join('circle')
      .attr('cx', d => x(d.century))
      .attr('cy', d => y(d.count))
      .attr('r', 3)
      .attr('fill', '#c9a84c');

    svg.append('g')
      .attr('transform', `translate(0,${h - MARGIN.bottom})`)
      .call(d3.axisBottom(x).ticks(15).tickFormat(d => `${d}.`))
      .attr('color', '#c4b89a');

    svg.append('g')
      .attr('transform', `translate(${MARGIN.left},0)`)
      .call(d3.axisLeft(y).ticks(4))
      .attr('color', '#c4b89a');

  }, [data]);

  return (
    <div className="alam-chart-card">
      <h3 className="alam-chart-title">📚 {ta.worksProduction}</h3>
      <svg ref={svgRef} style={{ width: '100%', height: 200 }} />
    </div>
  );
}

/* ═══ F) Migration Map (static arcs view) ═══ */
function MigrationArcs({ data, lang, ta }) {
  const t = T[lang];
  const svgRef = useRef(null);
  const [activeCentury, setActiveCentury] = useState(0); // 0 = all

  // Pre-compute migration routes
  const routes = useMemo(() => {
    const routeMap = {};
    data.forEach(b => {
      if (!b.lat || !b.rg) return;
      if (activeCentury && b.c !== activeCentury) return;
      // Simple heuristic: birth_place != region → migration
      // We use multi-coord if available (we'd need detail data for this)
      // For now, show region-to-region flows
    });
    // Alternative: aggregate by region pairs using coordinates
    const regionFlows = {};
    data.forEach(b => {
      if (!b.lat || !b.rg || !b.c) return;
      if (activeCentury && b.c !== activeCentury) return;
      const key = b.rg;
      regionFlows[key] = (regionFlows[key] || 0) + 1;
    });
    return Object.entries(regionFlows)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
  }, [data, activeCentury]);

  // This is a placeholder — actual migration arcs need multi-coord detail data
  return (
    <div className="alam-chart-card">
      <h3 className="alam-chart-title">🌍 {ta.migrationMap}</h3>
      <div className="alam-century-selector">
        <button className={`alam-century-btn${activeCentury === 0 ? ' active' : ''}`}
          onClick={() => setActiveCentury(0)}>{t.filters.all}</button>
        {CENTURY_RANGE.filter(c => c >= 7).map(c => (
          <button key={c} className={`alam-century-btn${activeCentury === c ? ' active' : ''}`}
            onClick={() => setActiveCentury(c)}>{c}</button>
        ))}
      </div>
      <div className="alam-migration-summary">
        {routes.map(([region, count]) => (
          <div key={region} className="alam-migration-row">
            <span className="alam-migration-region" style={{ color: REGION_COLORS[region] || '#c9a84c' }}>{region}</span>
            <div className="alam-migration-bar" style={{
              width: `${Math.min(100, (count / (routes[0]?.[1] || 1)) * 100)}%`,
              background: REGION_COLORS[region] || '#c9a84c',
            }} />
            <span className="alam-migration-count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ G) Top Authors by Work Count ═══ */
function TopAuthors({ data, lang, ta }) {
  const t = T[lang];
  const svgRef = useRef(null);

  const topAuthors = useMemo(() => {
    return data.filter(b => b.wc)
      .sort((a, b) => b.wc - a.wc)
      .slice(0, 12)
      .map(b => ({
        name: hn(b, lang),
        count: b.wc,
        death: b.md,
      }));
  }, [data, lang]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 600;
    const h = 320;
    svg.attr('width', w).attr('height', h);

    if (!topAuthors.length) return;

    const x = d3.scaleLinear()
      .domain([0, topAuthors[0].count])
      .range([0, w - MARGIN.left - MARGIN.right - 40]);

    const y = d3.scaleBand()
      .domain(topAuthors.map(d => d.name))
      .range([MARGIN.top, h - MARGIN.bottom])
      .padding(0.15);

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left + 100},0)`);

    g.selectAll('rect')
      .data(topAuthors)
      .join('rect')
      .attr('x', 0)
      .attr('y', d => y(d.name))
      .attr('height', y.bandwidth())
      .attr('rx', 3)
      .attr('fill', (d, i) => d3.interpolateWarm(i / 12))
      .attr('opacity', 0.8)
      .attr('width', 0)
      .transition().duration(600).delay((_, i) => i * 40)
      .attr('width', d => x(d.count));

    g.selectAll('.label')
      .data(topAuthors)
      .join('text')
      .attr('x', -5)
      .attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('fill', '#c4b89a')
      .attr('font-size', 10)
      .text(d => d.name.length > 18 ? d.name.slice(0, 17) + '…' : d.name);

    g.selectAll('.count')
      .data(topAuthors)
      .join('text')
      .attr('x', d => x(d.count) + 5)
      .attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', '#e8dcc8')
      .attr('font-size', 11)
      .attr('font-weight', 600)
      .text(d => `${d.count} — ö.${d.death || '?'}`);

  }, [topAuthors]);

  return (
    <div className="alam-chart-card">
      <h3 className="alam-chart-title">✍️ {t.alam.analyticsMostProlific}</h3>
      <svg ref={svgRef} style={{ width: '100%', height: 320 }} />
    </div>
  );
}

/* ═══ H) Printed vs Manuscript Dual Area ═══ */
function PrintedVsManuscript({ data, lang, ta }) {
  const t = T[lang];
  const svgRef = useRef(null);

  /* We need detail data for type info — use wc from lite as total, estimate from global ratio */
  /* Global ratio: 6200 printed / 5212 manuscript = ~54.3% / 45.7% */
  /* Better: count per century from lite entries that have works */
  const chartData = useMemo(() => {
    // We can only show total works per century since lite doesn't have per-work type
    // But we can show works-per-author distribution
    const CENTURIES = Array.from({ length: 15 }, (_, i) => i + 6);
    return CENTURIES.map(c => {
      const inCentury = data.filter(b => b.c === c && b.wc);
      const totalWorks = inCentury.reduce((s, b) => s + b.wc, 0);
      const authorCount = inCentury.length;
      return {
        century: c,
        totalWorks,
        authorCount,
        avgWorks: authorCount > 0 ? +(totalWorks / authorCount).toFixed(1) : 0,
      };
    });
  }, [data]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 600;
    const h = 250;
    svg.attr('width', w).attr('height', h);

    const x = d3.scaleLinear().domain([6, 20]).range([MARGIN.left, w - MARGIN.right]);
    const yWorks = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.totalWorks)])
      .nice().range([h - MARGIN.bottom, MARGIN.top]);
    const yAvg = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.avgWorks)])
      .nice().range([h - MARGIN.bottom, MARGIN.top]);

    // Total works bars
    const barW = (w - MARGIN.left - MARGIN.right) / 16;
    svg.selectAll('.bar')
      .data(chartData)
      .join('rect')
      .attr('x', d => x(d.century) - barW / 2)
      .attr('y', d => yWorks(d.totalWorks))
      .attr('width', barW * 0.7)
      .attr('height', d => yWorks(0) - yWorks(d.totalWorks))
      .attr('fill', '#c9a84c')
      .attr('opacity', 0.3)
      .attr('rx', 2);

    // Avg works line
    const line = d3.line()
      .x(d => x(d.century))
      .y(d => yAvg(d.avgWorks))
      .curve(d3.curveMonotoneX);

    svg.append('path').datum(chartData)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#4fc3f7')
      .attr('stroke-width', 2.5);

    svg.selectAll('.dot')
      .data(chartData)
      .join('circle')
      .attr('cx', d => x(d.century))
      .attr('cy', d => yAvg(d.avgWorks))
      .attr('r', 3)
      .attr('fill', '#4fc3f7');

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${h - MARGIN.bottom})`)
      .call(d3.axisBottom(x).ticks(15).tickFormat(d => `${d}.`))
      .attr('color', '#c4b89a');

    svg.append('g')
      .attr('transform', `translate(${MARGIN.left},0)`)
      .call(d3.axisLeft(yWorks).ticks(5))
      .attr('color', '#c9a84c55');

    svg.append('g')
      .attr('transform', `translate(${w - MARGIN.right},0)`)
      .call(d3.axisRight(yAvg).ticks(5))
      .attr('color', '#4fc3f7');

    // Legend
    const lg = svg.append('g').attr('transform', `translate(${MARGIN.left + 10}, 10)`);
    lg.append('rect').attr('width', 10).attr('height', 10).attr('fill', '#c9a84c').attr('opacity', 0.3).attr('rx', 1);
    lg.append('text').attr('x', 14).attr('y', 9).attr('fill', '#c4b89a').attr('font-size', 10)
      .text(t.alam?.analyticsTotalWorks || 'Total Works');
    const lg2 = svg.append('g').attr('transform', `translate(${MARGIN.left + 10}, 24)`);
    lg2.append('line').attr('x1', 0).attr('x2', 10).attr('y1', 5).attr('y2', 5).attr('stroke', '#4fc3f7').attr('stroke-width', 2);
    lg2.append('text').attr('x', 14).attr('y', 9).attr('fill', '#4fc3f7').attr('font-size', 10)
      .text(t.alam.analyticsAvgWorks);

  }, [chartData, lang]);

  return (
    <div className="alam-chart-card">
      <h3 className="alam-chart-title">📖 {t.alam.analyticsWorksTitle}</h3>
      <svg ref={svgRef} style={{ width: '100%', height: 250 }} />
    </div>
  );
}

/* ═══ Chart descriptions (TR/EN) ═══ */
const CHART_DESC = {
  knowledgeCapital: {
    tr: 'Seçilen yüzyılda en çok biyografi çıkaran bölgeleri gösterir. Yüzyıl butonlarına tıklayarak ilim merkezlerinin tarihsel kaymasını izleyebilirsiniz.',
    en: 'Shows regions with the most biographies in the selected century. Click century buttons to track the historical shift of knowledge centers.',
  },
  madhabTimeline: {
    tr: 'Altı ana fıkhî mezhebin yüzyıllara göre dağılımını gösterir. 13. yüzyıldaki Hanbelî patlaması ve 19-20. yüzyıldaki İmâmî yükselişi dikkat çekicidir.',
    en: 'Displays the distribution of six major legal schools across centuries. Note the Hanbali surge in the 13th century and the Imami rise in the 19th–20th centuries.',
  },
  heatmap: {
    tr: 'Her hücre, ilgili yüzyıl ve bölgedeki biyografi sayısını temsil eder. Koyu renkler yoğunluğu gösterir. Irak\'ın erken parlaması, İspanya\'nın 11-12. yüzyıl zirvesi ve Mısır\'ın geç yükselişi izlenebilir.',
    en: 'Each cell represents the number of biographies for a given century and region. Darker colors indicate higher density. Track Iraq\'s early peak, Spain\'s 11th–12th century zenith, and Egypt\'s late rise.',
  },
  professionEvolution: {
    tr: 'Yüzyıllara göre baskın meslek değişimini gösterir. 7-8. yüzyılda Şair baskınlığı, 9-10. yüzyılda Muhaddis yoğunluğu ve 12. yüzyıldan itibaren Fıkıh Âlimi\'nin kurumsal hâkimiyeti görülür.',
    en: 'Shows the changing dominance of professions across centuries. Note Poet dominance in 7th–8th centuries, Hadith scholar concentration in 9th–10th, and Jurist institutional dominance from the 12th century onward.',
  },
  worksProduction: {
    tr: 'Yüzyıllara göre toplam eser sayısını gösterir. 20. yüzyıldaki patlama, matbaa ve modern yayıncılığın etkisini yansıtır.',
    en: 'Shows total work count by century. The 20th-century surge reflects the impact of the printing press and modern publishing.',
  },
  migrationMap: {
    tr: 'Seçilen döneme göre biyografilerin bölgesel dağılımını gösterir. Yüzyıl butonlarıyla filtreleyerek ilim göç akışlarını karşılaştırabilirsiniz.',
    en: 'Shows the regional distribution of biographies for the selected period. Filter by century buttons to compare knowledge migration flows.',
  },
  topAuthors: {
    tr: 'el-A\'lâm\'da en çok eseri kayıtlı 12 müellifi gösterir. İbn Arabî (54 eser), İbn Cevzî (35) ve Gazzâlî (34) ilk üçtedir.',
    en: 'Shows the 12 most prolific authors in al-Aʿlām. Ibn Arabi (54 works), Ibn al-Jawzi (35) and al-Ghazali (34) lead the ranking.',
  },
  worksProductivity: {
    tr: 'Altın çubuklar yüzyıldaki toplam eser sayısını, mavi çizgi müellif başına ortalama eser sayısını gösterir. Verimlilik ile hacim arasındaki fark dikkat çekicidir.',
    en: 'Gold bars show total works per century, blue line shows average works per author. Note the divergence between productivity and volume.',
  },
};

/* ═══ Main Analytics Component ═══ */
export default function AlamAnalytics({ lang, ta, data, filtered }) {
  const t = T[lang];
  const desc = (key) => CHART_DESC[key]?.[lang] || CHART_DESC[key]?.en || CHART_DESC[key]?.tr || '';

  return (
    <div className="alam-analytics">
      <div className="alam-analytics-grid">
        <div className="alam-chart-wrap">
          <KnowledgeCapital data={data} lang={lang} ta={ta} />
          <p className="alam-chart-desc">{desc('knowledgeCapital')}</p>
        </div>
        <div className="alam-chart-wrap">
          <TopAuthors data={data} lang={lang} ta={ta} />
          <p className="alam-chart-desc">{desc('topAuthors')}</p>
        </div>
        <div className="alam-chart-wrap">
          <MadhabTimeline data={data} lang={lang} ta={ta} />
          <p className="alam-chart-desc">{desc('madhabTimeline')}</p>
        </div>
        <div className="alam-chart-wrap">
          <PrintedVsManuscript data={data} lang={lang} ta={ta} />
          <p className="alam-chart-desc">{desc('worksProductivity')}</p>
        </div>
        <div className="alam-chart-wrap">
          <CenturyRegionHeatmap data={data} lang={lang} ta={ta} />
          <p className="alam-chart-desc">{desc('heatmap')}</p>
        </div>
        <div className="alam-chart-wrap">
          <ProfessionEvolution data={data} lang={lang} ta={ta} />
          <p className="alam-chart-desc">{desc('professionEvolution')}</p>
        </div>
        <div className="alam-chart-wrap">
          <WorksProduction data={data} lang={lang} ta={ta} />
          <p className="alam-chart-desc">{desc('worksProduction')}</p>
        </div>
        <div className="alam-chart-wrap">
          <MigrationArcs data={filtered} lang={lang} ta={ta} />
          <p className="alam-chart-desc">{desc('migrationMap')}</p>
        </div>
      </div>
    </div>
  );
}
