import { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

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
          onClick={() => setActiveCentury(0)}>{lang === 'tr' ? 'Tümü' : 'All'}</button>
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

/* ═══ Main Analytics Component ═══ */
export default function AlamAnalytics({ lang, ta, data, filtered }) {
  return (
    <div className="alam-analytics">
      <div className="alam-analytics-grid">
        <KnowledgeCapital data={data} lang={lang} ta={ta} />
        <MadhabTimeline data={data} lang={lang} ta={ta} />
        <CenturyRegionHeatmap data={data} lang={lang} ta={ta} />
        <ProfessionEvolution data={data} lang={lang} ta={ta} />
        <WorksProduction data={data} lang={lang} ta={ta} />
        <MigrationArcs data={filtered} lang={lang} ta={ta} />
      </div>
    </div>
  );
}
