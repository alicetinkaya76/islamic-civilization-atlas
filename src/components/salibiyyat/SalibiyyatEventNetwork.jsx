import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

/**
 * SalibiyyatEventNetwork — D3 force-directed graph
 * Ported from standalone EventNetwork.jsx
 *
 * Props:
 *   events      — filtered events for one source
 *   sourceColor — hex color string
 *   sourceName  — display name
 *   tr          — i18n object (SAL_T)
 */
export default function SalibiyyatEventNetwork({ events = [], sourceColor = '#d4a848', sourceName = '', tr = {} }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [showLegend, setShowLegend] = useState(false);

  // Normalize field access
  const getLoc = (e) => e.location || e.l;
  const getTitle = (e) => e.title || e.n;
  const getYear = (e) => e.year !== undefined ? e.year : e.y;
  const getType = (e) => e.type || e.t;

  useEffect(() => {
    if (!svgRef.current || !events.length) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 420;

    // Build nodes & links
    const locMap = {};
    events.forEach(ev => {
      const loc = getLoc(ev);
      if (!loc) return;
      if (!locMap[loc]) locMap[loc] = { id: loc, type: 'location', count: 0, events: [] };
      locMap[loc].count++;
      locMap[loc].events.push(ev);
    });

    const locations = Object.values(locMap).filter(l => l.count >= 2);
    const topLocs = locations.sort((a, b) => b.count - a.count).slice(0, 25);
    const topLocIds = new Set(topLocs.map(l => l.id));

    const nodes = [];
    const links = [];

    topLocs.forEach(loc => {
      nodes.push({ id: `loc_${loc.id}`, label: loc.id, type: 'location', count: loc.count, r: Math.max(8, Math.min(22, loc.count * 1.8)) });
      loc.events.slice(0, 8).forEach((ev, i) => {
        const evId = `ev_${loc.id}_${i}`;
        nodes.push({ id: evId, label: getTitle(ev), type: 'event', year: getYear(ev), eventType: getType(ev), r: 4 });
        links.push({ source: `loc_${loc.id}`, target: evId });
      });
    });

    // Cross-location links (same year)
    const yearBuckets = {};
    events.forEach(ev => {
      const loc = getLoc(ev);
      if (!topLocIds.has(loc)) return;
      const yr = getYear(ev);
      if (!yearBuckets[yr]) yearBuckets[yr] = new Set();
      yearBuckets[yr].add(loc);
    });
    Object.values(yearBuckets).forEach(locs => {
      const arr = [...locs];
      if (arr.length >= 2 && arr.length <= 4) {
        for (let i = 0; i < arr.length - 1; i++) {
          links.push({ source: `loc_${arr[i]}`, target: `loc_${arr[i + 1]}`, type: 'temporal' });
        }
      }
    });

    // Clear & setup SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'sal-glow-net');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g');

    const zoom = d3.zoom().scaleExtent([0.3, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(d => d.type === 'temporal' ? 120 : 40))
      .force('charge', d3.forceManyBody().strength(d => d.type === 'location' ? -200 : -30))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.r + 4));

    const link = g.append('g').selectAll('line').data(links).join('line')
      .attr('stroke', d => d.type === 'temporal' ? 'rgba(212,168,72,0.15)' : 'rgba(212,168,72,0.08)')
      .attr('stroke-width', d => d.type === 'temporal' ? 1.5 : 0.8)
      .attr('stroke-dasharray', d => d.type === 'temporal' ? '4,4' : null);

    const node = g.append('g').selectAll('circle').data(nodes).join('circle')
      .attr('r', d => d.r)
      .attr('fill', d => d.type === 'location' ? sourceColor : `${sourceColor}88`)
      .attr('stroke', d => d.type === 'location' ? '#d4a848' : 'transparent')
      .attr('stroke-width', d => d.type === 'location' ? 1.5 : 0)
      .attr('opacity', d => d.type === 'location' ? 0.85 : 0.6)
      .attr('cursor', 'pointer')
      .attr('filter', d => d.type === 'location' ? 'url(#sal-glow-net)' : null);

    const labels = g.append('g').selectAll('text')
      .data(nodes.filter(n => n.type === 'location')).join('text')
      .text(d => d.label)
      .attr('font-size', '10px')
      .attr('fill', '#c4b8a4')
      .attr('text-anchor', 'middle')
      .attr('dy', d => -d.r - 6)
      .attr('font-family', '"Crimson Pro", serif')
      .attr('pointer-events', 'none');

    node.call(d3.drag()
      .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
    );

    node.on('mouseenter', (event, d) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (d.type === 'event') {
        setTooltip({ x, y, label: d.label, year: d.year, type: d.eventType });
      } else {
        setTooltip({ x, y, label: d.label, count: d.count });
      }
      d3.select(event.target).attr('opacity', 1).attr('stroke', '#d4a848').attr('stroke-width', 2);
      link.attr('stroke', l => (l.source.id === d.id || l.target.id === d.id) ? 'rgba(212,168,72,0.5)' : 'rgba(212,168,72,0.04)');
    })
    .on('mouseleave', (event, d) => {
      setTooltip(null);
      d3.select(event.target)
        .attr('opacity', d.type === 'location' ? 0.85 : 0.6)
        .attr('stroke', d.type === 'location' ? '#d4a848' : 'transparent')
        .attr('stroke-width', d.type === 'location' ? 1.5 : 0);
      link.attr('stroke', l => l.type === 'temporal' ? 'rgba(212,168,72,0.15)' : 'rgba(212,168,72,0.08)');
    })
    .on('click', (event, d) => {
      event.stopPropagation();
      const scale = 2.5;
      const transform = d3.zoomIdentity
        .translate(width / 2 - d.x * scale, height / 2 - d.y * scale)
        .scale(scale);
      svg.transition().duration(600).call(zoom.transform, transform);
      node.attr('opacity', n => {
        if (n.id === d.id) return 1;
        return links.some(l => (l.source.id === d.id && l.target.id === n.id) || (l.target.id === d.id && l.source.id === n.id)) ? 0.85 : 0.15;
      });
      link.attr('stroke', l => (l.source.id === d.id || l.target.id === d.id) ? 'rgba(212,168,72,0.6)' : 'rgba(212,168,72,0.02)')
        .attr('stroke-width', l => (l.source.id === d.id || l.target.id === d.id) ? 2 : 0.5);
    });

    svg.on('click', () => {
      node.attr('opacity', d => d.type === 'location' ? 0.85 : 0.6);
      link.attr('stroke', l => l.type === 'temporal' ? 'rgba(212,168,72,0.15)' : 'rgba(212,168,72,0.08)')
        .attr('stroke-width', l => l.type === 'temporal' ? 1.5 : 0.8);
      svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity);
    });

    simulation.on('tick', () => {
      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('cx', d => d.x).attr('cy', d => d.y);
      labels.attr('x', d => d.x).attr('y', d => d.y);
    });

    return () => simulation.stop();
  }, [events, sourceColor]);

  if (!events.length) return null;

  const sd = tr.source_detail || {};

  return (
    <div ref={containerRef} className="sal-glass-card sal-network-wrap" style={{ cursor: 'grab' }}>
      <svg ref={svgRef} style={{ width: '100%', height: 420 }} />

      <button onClick={() => setShowLegend(!showLegend)} className="sal-network-legend-btn" title={sd.network_legend || 'Legend'}>
        ?
      </button>

      {showLegend && (
        <div className="sal-network-legend">
          <h5 className="sal-network-legend__title">{sd.network_legend || 'Ağ Açıklaması'}</h5>
          <div className="sal-network-legend__items">
            <div className="sal-network-legend__item">
              <div className="sal-network-legend__hub" style={{ background: sourceColor }} />
              <span>{sd.network_hub || 'Konum düğümü (büyük)'}</span>
            </div>
            <div className="sal-network-legend__item">
              <div className="sal-network-legend__leaf" style={{ background: `${sourceColor}88` }} />
              <span>{sd.network_leaf || 'Olay düğümü (küçük)'}</span>
            </div>
            <div className="sal-network-legend__item">
              <div className="sal-network-legend__line" />
              <span>{sd.network_temporal || 'Zamansal bağlantı'}</span>
            </div>
          </div>
          <p className="sal-network-legend__hint">Click node to zoom · Click bg to reset</p>
        </div>
      )}

      {tooltip && (
        <div className="sal-canvas-tooltip"
          style={{ left: Math.min(tooltip.x + 12, (containerRef.current?.clientWidth || 800) - 200), top: tooltip.y - 8 }}>
          <div className="sal-canvas-tooltip__title">{tooltip.label}</div>
          {tooltip.year && <div className="sal-canvas-tooltip__meta">{tooltip.year} · {tooltip.type}</div>}
          {tooltip.count && <div className="sal-canvas-tooltip__meta">{tooltip.count} olay</div>}
        </div>
      )}
    </div>
  );
}
