import { useMemo, useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

export default function DarpAnalytics({ mints, filteredMints, metadata, lang }) {
  const t = (tr, en) => lang === 'tr' ? tr : en;
  const [activeChart, setActiveChart] = useState('timeline');

  const data = filteredMints || mints;

  // Compute analytics
  const analytics = useMemo(() => {
    // Timeline: emissions per century (Hijri)
    const centuryCounts = {};
    data.forEach(m => {
      if (m.year_min && m.year_max) {
        const startC = Math.floor(m.year_min / 100) + 1;
        const endC = Math.floor(m.year_max / 100) + 1;
        for (let c = startC; c <= endC; c++) {
          centuryCounts[c] = (centuryCounts[c] || 0) + 1;
        }
      }
    });
    const timeline = Object.entries(centuryCounts)
      .map(([c, v]) => ({ century: +c, count: v }))
      .sort((a, b) => a.century - b.century);

    // Region distribution
    const regionCounts = {};
    data.forEach(m => {
      const r = lang === 'tr' ? m.region_tr : m.region_en;
      if (r) regionCounts[r] = (regionCounts[r] || 0) + 1;
    });
    const regions = Object.entries(regionCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Metal distribution
    const metalCounts = { AU: 0, AR: 0, AE: 0, EL: 0, Pb: 0, GL: 0, other: 0 };
    data.forEach(m => {
      (m.metals || []).forEach(mt => {
        if (metalCounts[mt] !== undefined) metalCounts[mt]++;
        else metalCounts.other++;
      });
    });

    // Dynasty top 20
    const dynastyCounts = {};
    data.forEach(m => {
      (m.dynasties || []).forEach(d => {
        dynastyCounts[d] = (dynastyCounts[d] || 0) + 1;
      });
    });
    const topDynasties = Object.entries(dynastyCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Source distribution
    const sourceCounts = {};
    data.forEach(m => {
      (m.sources || []).forEach(s => {
        sourceCounts[s] = (sourceCounts[s] || 0) + 1;
      });
    });

    // Emission count distribution
    const emissionBuckets = [0, 1, 5, 10, 20, 50, 100, 200];
    const emissionDist = emissionBuckets.map((min, i) => {
      const max = emissionBuckets[i + 1] || Infinity;
      const count = data.filter(m => (m.emission_count || 0) >= min && (m.emission_count || 0) < max).length;
      return { label: max === Infinity ? `${min}+` : `${min}-${max - 1}`, count };
    });

    return { timeline, regions, metalCounts, topDynasties, sourceCounts, emissionDist };
  }, [data, lang]);

  const charts = [
    { id: 'timeline', label: t('Zaman Çizelgesi', 'Timeline'), icon: '📅' },
    { id: 'regions', label: t('Bölgeler', 'Regions'), icon: '🌍' },
    { id: 'metals', label: t('Metaller', 'Metals'), icon: '🪙' },
    { id: 'dynasties', label: t('Hanedanlar', 'Dynasties'), icon: '👑' },
    { id: 'emissions', label: t('Darbiyat Dağılımı', 'Emission Dist.'), icon: '📊' },
  ];

  return (
    <div className="darp-analytics">
      <div className="darp-analytics-nav">
        {charts.map(c => (
          <button
            key={c.id}
            className={`darp-analytics-btn ${activeChart === c.id ? 'active' : ''}`}
            onClick={() => setActiveChart(c.id)}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      <div className="darp-analytics-body">
        {activeChart === 'timeline' && (
          <BarChart
            data={analytics.timeline.map(d => ({ label: `${d.century}. ${t('yy', 'c.')}`, value: d.count }))}
            title={t('Hicri Yüzyıllara Göre Aktif Darphaneler', 'Active Mints by Hijri Century')}
            color="#d4a574"
          />
        )}
        {activeChart === 'regions' && (
          <HorizontalBarChart
            data={analytics.regions.slice(0, 15)}
            title={t('Bölgelere Göre Darphane Sayısı', 'Mints by Region')}
            color="#6b8f71"
          />
        )}
        {activeChart === 'metals' && (
          <MetalPieChart
            data={analytics.metalCounts}
            title={t('Metal Türü Dağılımı', 'Metal Type Distribution')}
            lang={lang}
          />
        )}
        {activeChart === 'dynasties' && (
          <HorizontalBarChart
            data={analytics.topDynasties}
            title={t('En Çok Darphaneye Sahip Hanedanlar (İlk 20)', 'Top 20 Dynasties by Mint Count')}
            color="#8b6914"
          />
        )}
        {activeChart === 'emissions' && (
          <BarChart
            data={analytics.emissionDist.map(d => ({ label: d.label, value: d.count }))}
            title={t('Darbiyat Sayısı Dağılımı', 'Emission Count Distribution')}
            color="#c17767"
          />
        )}
      </div>
    </div>
  );
}

// Simple D3 bar chart
function BarChart({ data, title, color }) {
  const svgRef = useRef(null);
  useEffect(() => {
    if (!svgRef.current || !data.length) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 30, right: 20, bottom: 50, left: 50 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(data.map(d => d.label)).range([0, width]).padding(0.3);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value)]).nice().range([height, 0]);

    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x))
      .selectAll('text').attr('transform', 'rotate(-35)').style('text-anchor', 'end').style('font-size', '11px');
    g.append('g').call(d3.axisLeft(y).ticks(5)).style('font-size', '11px');

    g.selectAll('rect').data(data).join('rect')
      .attr('x', d => x(d.label)).attr('y', d => y(d.value))
      .attr('width', x.bandwidth()).attr('height', d => height - y(d.value))
      .attr('fill', color).attr('rx', 3).attr('opacity', 0.85);

    g.selectAll('.label').data(data).join('text')
      .attr('x', d => x(d.label) + x.bandwidth() / 2).attr('y', d => y(d.value) - 5)
      .attr('text-anchor', 'middle').style('font-size', '10px').style('fill', '#555')
      .text(d => d.value);

    svg.append('text').attr('x', svgRef.current.clientWidth / 2).attr('y', 18)
      .attr('text-anchor', 'middle').style('font-size', '14px').style('font-weight', '600')
      .text(title);
  }, [data, title, color]);

  return <svg ref={svgRef} className="darp-chart-svg" />;
}

// Horizontal bar chart
function HorizontalBarChart({ data, title, color }) {
  const svgRef = useRef(null);
  useEffect(() => {
    if (!svgRef.current || !data.length) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 30, right: 60, bottom: 10, left: 150 };
    const barH = 22;
    const height = data.length * barH + margin.top + margin.bottom;
    const width = svgRef.current.clientWidth - margin.left - margin.right;

    svg.attr('height', height);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, d3.max(data, d => d.count)]).nice().range([0, width]);
    const y = d3.scaleBand().domain(data.map(d => d.name)).range([0, data.length * barH]).padding(0.2);

    g.selectAll('rect').data(data).join('rect')
      .attr('x', 0).attr('y', d => y(d.name))
      .attr('width', d => x(d.count)).attr('height', y.bandwidth())
      .attr('fill', color).attr('rx', 3).attr('opacity', 0.8);

    g.selectAll('.name').data(data).join('text')
      .attr('x', -5).attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('text-anchor', 'end').attr('dominant-baseline', 'middle')
      .style('font-size', '11px').text(d => d.name.length > 22 ? d.name.slice(0, 20) + '…' : d.name);

    g.selectAll('.val').data(data).join('text')
      .attr('x', d => x(d.count) + 5).attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('dominant-baseline', 'middle').style('font-size', '11px').style('font-weight', '600')
      .text(d => d.count);

    svg.append('text').attr('x', svgRef.current.clientWidth / 2).attr('y', 18)
      .attr('text-anchor', 'middle').style('font-size', '14px').style('font-weight', '600')
      .text(title);
  }, [data, title, color]);

  return <svg ref={svgRef} className="darp-chart-svg darp-chart-hbar" />;
}

// Metal pie chart
function MetalPieChart({ data, title, lang }) {
  const svgRef = useRef(null);
  const METAL_COLORS = { AU: '#FFD700', AR: '#C0C0C0', AE: '#B87333', EL: '#CFB53B', Pb: '#7F7F7F', GL: '#87CEEB', other: '#999' };
  const METAL_NAMES = {
    AU: { tr: 'Altın', en: 'Gold' }, AR: { tr: 'Gümüş', en: 'Silver' },
    AE: { tr: 'Bakır', en: 'Copper' }, EL: { tr: 'Elektron', en: 'Electrum' },
    Pb: { tr: 'Kurşun', en: 'Lead' }, GL: { tr: 'Cam', en: 'Glass' }, other: { tr: 'Diğer', en: 'Other' },
  };

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const pieData = Object.entries(data).filter(([, v]) => v > 0).map(([k, v]) => ({ key: k, value: v }));
    if (!pieData.length) return;

    const w = svgRef.current.clientWidth;
    const h = 300;
    const radius = Math.min(w, h) / 2 - 40;
    const g = svg.append('g').attr('transform', `translate(${w / 2},${h / 2 + 15})`);

    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(radius * 0.4).outerRadius(radius);
    const labelArc = d3.arc().innerRadius(radius * 0.75).outerRadius(radius * 0.75);

    g.selectAll('path').data(pie(pieData)).join('path')
      .attr('d', arc).attr('fill', d => METAL_COLORS[d.data.key] || '#999')
      .attr('stroke', '#fff').attr('stroke-width', 2);

    g.selectAll('.pie-label').data(pie(pieData)).join('text')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle').style('font-size', '11px').style('font-weight', '600')
      .text(d => d.data.value > 50 ? `${METAL_NAMES[d.data.key]?.[lang] || d.data.key}\n${d.data.value}` : '');

    svg.append('text').attr('x', w / 2).attr('y', 18)
      .attr('text-anchor', 'middle').style('font-size', '14px').style('font-weight', '600')
      .text(title);

    // Legend
    const legend = svg.append('g').attr('transform', `translate(${w - 120}, 40)`);
    pieData.forEach((d, i) => {
      const row = legend.append('g').attr('transform', `translate(0, ${i * 20})`);
      row.append('rect').attr('width', 12).attr('height', 12).attr('fill', METAL_COLORS[d.key]).attr('rx', 2);
      row.append('text').attr('x', 18).attr('y', 10).style('font-size', '11px')
        .text(`${METAL_NAMES[d.key]?.[lang] || d.key}: ${d.value}`);
    });
  }, [data, title, lang]);

  return <svg ref={svgRef} className="darp-chart-svg" />;
}
