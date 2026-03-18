import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { FIELD_COLORS } from './DiaSidebar';

const M = { top: 30, right: 20, bottom: 40, left: 60 };
const CENTURIES = Array.from({ length: 15 }, (_, i) => i + 7);
const MC = { 'Hanefî':'#4fc3f7','Şâfiî':'#66bb6a','Mâlikî':'#ffd54f','Hanbelî':'#ef5350','Zâhirî':'#ce93d8',"Ca'ferî":'#ff8a65' };
function getCentury(y) { return y ? Math.ceil(y / 100) : null; }

function CenturyChart({ data, td }) {
  const ref = useRef(null);
  useEffect(() => {
    const svg = d3.select(ref.current); svg.selectAll('*').remove();
    const w = ref.current.clientWidth || 600, h = 260;
    svg.attr('width', w).attr('height', h);
    const counts = {}; CENTURIES.forEach(c => counts[c] = 0);
    data.forEach(b => { const c = getCentury(b.dc); if (c && counts[c] !== undefined) counts[c]++; });
    const arr = CENTURIES.map(c => ({ c, n: counts[c] }));
    const x = d3.scaleBand().domain(CENTURIES).range([M.left, w - M.right]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(arr, d => d.n)]).nice().range([h - M.bottom, M.top]);
    svg.append('g').selectAll('rect').data(arr).join('rect')
      .attr('x', d => x(d.c)).attr('width', x.bandwidth()).attr('y', h - M.bottom).attr('height', 0)
      .attr('fill', '#1a6b5a').attr('rx', 2).transition().duration(600)
      .attr('y', d => y(d.n)).attr('height', d => h - M.bottom - y(d.n));
    svg.append('g').selectAll('.v').data(arr).join('text')
      .attr('x', d => x(d.c) + x.bandwidth() / 2).attr('y', d => y(d.n) - 4)
      .attr('text-anchor', 'middle').attr('fill', '#c4b89a').attr('font-size', 9).text(d => d.n > 0 ? d.n : '');
    svg.append('g').attr('transform', `translate(0,${h - M.bottom})`).call(d3.axisBottom(x).tickFormat(d => `${d}.`))
      .selectAll('text').attr('fill', '#a89b8c').attr('font-size', 9);
    svg.append('g').attr('transform', `translate(${M.left},0)`).call(d3.axisLeft(y).ticks(5))
      .selectAll('text').attr('fill', '#a89b8c').attr('font-size', 9);
    svg.selectAll('.domain, .tick line').attr('stroke', '#333');
  }, [data]);
  return <div className="dia-chart-card"><h4 className="dia-chart-title">{td.centuryChart || 'Yüzyıl Dağılımı'}</h4><svg ref={ref} style={{ width: '100%' }} /></div>;
}

function FieldChart({ data, td }) {
  const ref = useRef(null);
  useEffect(() => {
    const svg = d3.select(ref.current); svg.selectAll('*').remove();
    const w = ref.current.clientWidth || 600, h = 300;
    svg.attr('width', w).attr('height', h);
    const counts = {};
    data.forEach(b => { if (b.fl) b.fl.forEach(f => counts[f] = (counts[f] || 0) + 1); });
    const arr = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 13);
    const y = d3.scaleBand().domain(arr.map(d => d[0])).range([M.top, h - M.bottom]).padding(0.15);
    const x = d3.scaleLinear().domain([0, arr[0]?.[1] || 1]).nice().range([M.left + 60, w - M.right]);
    svg.append('g').selectAll('rect').data(arr).join('rect')
      .attr('x', M.left + 60).attr('y', d => y(d[0])).attr('height', y.bandwidth()).attr('rx', 2)
      .attr('fill', d => FIELD_COLORS[d[0]] || '#546e7a').attr('width', 0).transition().duration(600)
      .attr('width', d => x(d[1]) - (M.left + 60));
    svg.append('g').selectAll('.l').data(arr).join('text')
      .attr('x', M.left + 56).attr('y', d => y(d[0]) + y.bandwidth() / 2 + 4)
      .attr('text-anchor', 'end').attr('fill', '#c4b89a').attr('font-size', 10).text(d => d[0]);
    svg.append('g').selectAll('.v').data(arr).join('text')
      .attr('x', d => x(d[1]) + 4).attr('y', d => y(d[0]) + y.bandwidth() / 2 + 4)
      .attr('fill', '#a89b8c').attr('font-size', 9).text(d => d[1]);
  }, [data]);
  return <div className="dia-chart-card"><h4 className="dia-chart-title">{td.fieldChart || 'İlim Dalı Dağılımı'}</h4><svg ref={ref} style={{ width: '100%' }} /></div>;
}

function MadhabChart({ data, td }) {
  const ref = useRef(null);
  useEffect(() => {
    const svg = d3.select(ref.current); svg.selectAll('*').remove();
    const s = 260; svg.attr('width', s).attr('height', s);
    const radius = s / 2 - 20;
    const counts = {};
    data.forEach(b => { const m = b.mz || 'Bilinmeyen'; counts[m] = (counts[m] || 0) + 1; });
    const arr = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const pie = d3.pie().value(d => d[1]).sort(null);
    const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius);
    const la = d3.arc().innerRadius(radius * 0.75).outerRadius(radius * 0.75);
    const g = svg.append('g').attr('transform', `translate(${s / 2},${s / 2})`);
    g.selectAll('path').data(pie(arr)).join('path').attr('d', arc)
      .attr('fill', d => MC[d.data[0]] || '#546e7a').attr('stroke', '#1a1e24').attr('stroke-width', 1);
    g.selectAll('.l').data(pie(arr)).join('text')
      .attr('transform', d => `translate(${la.centroid(d)})`).attr('text-anchor', 'middle')
      .attr('fill', '#fff').attr('font-size', 8).text(d => d.data[1] > 100 ? d.data[0] : '');
  }, [data]);
  return <div className="dia-chart-card dia-chart-small"><h4 className="dia-chart-title">{td.madhabChart || 'Mezhep Dağılımı'}</h4><svg ref={ref} /></div>;
}

function ImportanceChart({ data, td }) {
  const ref = useRef(null);
  useEffect(() => {
    const svg = d3.select(ref.current); svg.selectAll('*').remove();
    const w = ref.current.clientWidth || 400, h = 220;
    svg.attr('width', w).attr('height', h);
    const bins = Array.from({ length: 10 }, (_, i) => ({ r: `${i * 10}-${(i + 1) * 10}`, n: 0 }));
    data.forEach(b => { const idx = Math.min(Math.floor((b.is || 0) / 10), 9); bins[idx].n++; });
    const x = d3.scaleBand().domain(bins.map(d => d.r)).range([M.left, w - M.right]).padding(0.15);
    const y = d3.scaleLinear().domain([0, d3.max(bins, d => d.n)]).nice().range([h - M.bottom, M.top]);
    svg.append('g').selectAll('rect').data(bins).join('rect')
      .attr('x', d => x(d.r)).attr('width', x.bandwidth()).attr('y', d => y(d.n))
      .attr('height', d => h - M.bottom - y(d.n)).attr('fill', '#c9a84c').attr('rx', 2);
    svg.append('g').attr('transform', `translate(0,${h - M.bottom})`).call(d3.axisBottom(x))
      .selectAll('text').attr('fill', '#a89b8c').attr('font-size', 8).attr('transform', 'rotate(-30)').attr('text-anchor', 'end');
    svg.append('g').attr('transform', `translate(${M.left},0)`).call(d3.axisLeft(y).ticks(5))
      .selectAll('text').attr('fill', '#a89b8c').attr('font-size', 9);
    svg.selectAll('.domain, .tick line').attr('stroke', '#333');
  }, [data]);
  return <div className="dia-chart-card dia-chart-small"><h4 className="dia-chart-title">{td.importanceChart || 'Önem Skoru Dağılımı'}</h4><svg ref={ref} style={{ width: '100%' }} /></div>;
}

function HeatmapChart({ data, td }) {
  const ref = useRef(null);
  const fields = useMemo(() => {
    const c = {};
    data.forEach(b => { if (b.fl) b.fl.forEach(f => c[f] = (c[f] || 0) + 1); });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 10).map(d => d[0]);
  }, [data]);
  useEffect(() => {
    const svg = d3.select(ref.current); svg.selectAll('*').remove();
    const w = ref.current.clientWidth || 600, h = 300;
    svg.attr('width', w).attr('height', h);
    const matrix = {};
    data.forEach(b => { const c = getCentury(b.dc); if (!c || !b.fl) return;
      b.fl.forEach(f => { if (fields.includes(f)) matrix[`${c}-${f}`] = (matrix[`${c}-${f}`] || 0) + 1; }); });
    const maxVal = d3.max(Object.values(matrix)) || 1;
    const color = d3.scaleSequential(d3.interpolateYlGn).domain([0, maxVal]);
    const cw = (w - M.left - 40) / CENTURIES.length, ch = (h - M.top - M.bottom) / fields.length;
    const g = svg.append('g').attr('transform', `translate(${M.left + 40},${M.top})`);
    CENTURIES.forEach((c, ci) => fields.forEach((f, fi) => {
      const val = matrix[`${c}-${f}`] || 0;
      g.append('rect').attr('x', ci * cw).attr('y', fi * ch).attr('width', cw - 1).attr('height', ch - 1)
        .attr('fill', val > 0 ? color(val) : '#1a1e24').attr('rx', 1);
      if (val > 10) g.append('text').attr('x', ci * cw + cw / 2).attr('y', fi * ch + ch / 2 + 3)
        .attr('text-anchor', 'middle').attr('fill', '#000').attr('font-size', 7).text(val);
    }));
    CENTURIES.forEach((c, i) => svg.append('text').attr('x', M.left + 40 + i * cw + cw / 2).attr('y', h - 5)
      .attr('text-anchor', 'middle').attr('fill', '#a89b8c').attr('font-size', 8).text(`${c}.`));
    fields.forEach((f, i) => svg.append('text').attr('x', M.left + 36).attr('y', M.top + i * ch + ch / 2 + 3)
      .attr('text-anchor', 'end').attr('fill', '#c4b89a').attr('font-size', 9).text(f));
  }, [data, fields]);
  return <div className="dia-chart-card"><h4 className="dia-chart-title">{td.heatmapChart || 'Yüzyıl × İlim Dalı Heatmap'}</h4><svg ref={ref} style={{ width: '100%' }} /></div>;
}

function TopConnectedChart({ relations, lookup, td }) {
  const ref = useRef(null);
  const top20 = useMemo(() => {
    if (!relations) return [];
    const deg = {};
    relations.ts.forEach(([s, t]) => { deg[s] = (deg[s] || 0) + 1; deg[t] = (deg[t] || 0) + 1; });
    return Object.entries(deg).sort((a, b) => b[1] - a[1]).slice(0, 20)
      .map(([id, count]) => ({ id, title: lookup[id]?.t || id, count }));
  }, [relations, lookup]);
  useEffect(() => {
    const svg = d3.select(ref.current); svg.selectAll('*').remove();
    if (!top20.length) return;
    const w = ref.current.clientWidth || 600, h = 360;
    svg.attr('width', w).attr('height', h);
    const y = d3.scaleBand().domain(top20.map(d => d.title)).range([M.top, h - 10]).padding(0.12);
    const x = d3.scaleLinear().domain([0, top20[0].count]).nice().range([M.left + 100, w - M.right]);
    svg.append('g').selectAll('rect').data(top20).join('rect')
      .attr('x', M.left + 100).attr('y', d => y(d.title)).attr('height', y.bandwidth()).attr('rx', 2)
      .attr('fill', '#c9a84c').attr('opacity', 0.8).attr('width', 0).transition().duration(600)
      .attr('width', d => x(d.count) - (M.left + 100));
    svg.append('g').selectAll('.l').data(top20).join('text')
      .attr('x', M.left + 96).attr('y', d => y(d.title) + y.bandwidth() / 2 + 4)
      .attr('text-anchor', 'end').attr('fill', '#c4b89a').attr('font-size', 9)
      .text(d => d.title.length > 18 ? d.title.slice(0, 18) + '…' : d.title);
    svg.append('g').selectAll('.v').data(top20).join('text')
      .attr('x', d => x(d.count) + 4).attr('y', d => y(d.title) + y.bandwidth() / 2 + 4)
      .attr('fill', '#a89b8c').attr('font-size', 9).text(d => d.count);
  }, [top20]);
  return <div className="dia-chart-card"><h4 className="dia-chart-title">{td.topConnectedChart || 'En Bağlantılı 20 Âlim'}</h4><svg ref={ref} style={{ width: '100%' }} /></div>;
}

export default function DiaAnalytics({ lang, td, data, filtered, relations, lookup }) {
  return (
    <div className="dia-analytics">
      <div className="dia-analytics-grid">
        <CenturyChart data={data} td={td} />
        <FieldChart data={data} td={td} />
        <div className="dia-analytics-row2">
          <MadhabChart data={data} td={td} />
          <ImportanceChart data={data} td={td} />
        </div>
        <HeatmapChart data={data} td={td} />
        <TopConnectedChart relations={relations} lookup={lookup} td={td} />
      </div>
    </div>
  );
}
