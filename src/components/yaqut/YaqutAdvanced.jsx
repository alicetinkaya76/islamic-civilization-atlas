import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { hn } from '../../data/i18n-utils';
import T from '../../data/i18n';

/* ═══════════════════════════════════════════════════
   1) PLACE-PLACE GRAPH — D3 Force Graph
   ═══════════════════════════════════════════════════ */
export function PlaceGraph({ lang }) {
  const t = T[lang];
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);

  // Load graph data on demand
  useEffect(() => {
    const base = import.meta.env?.BASE_URL || '/';
    fetch(`${base}yaqut_graph.json`)
      .then(r => r.json())
      .then(data => { setGraphData(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Build & render D3 force graph
  useEffect(() => {
    if (!svgRef.current || !graphData || !graphData.nodes.length) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = containerRef.current;
    const w = container?.clientWidth || 700;
    const h = 520;
    svg.attr('width', w).attr('height', h);

    const g = svg.append('g');

    svg.call(d3.zoom().scaleExtent([0.2, 6]).on('zoom', (e) => {
      g.attr('transform', e.transform);
    }));

    // Compute degree
    const degree = {};
    graphData.edges.forEach(e => {
      degree[e.s] = (degree[e.s] || 0) + 1;
      degree[e.t] = (degree[e.t] || 0) + 1;
    });

    const nodes = graphData.nodes.map(n => ({
      ...n,
      degree: degree[n.id] || 0,
    }));

    // Only show nodes with edges (skip isolated)
    const nodeIds = new Set(nodes.filter(n => n.degree > 0).map(n => n.id));
    const filteredNodes = nodes.filter(n => nodeIds.has(n.id));
    const filteredEdges = graphData.edges.filter(e => nodeIds.has(e.s) && nodeIds.has(e.t));

    // Limit to top 300 nodes by degree for performance
    const topNodes = filteredNodes.sort((a, b) => b.degree - a.degree).slice(0, 300);
    const topIds = new Set(topNodes.map(n => n.id));
    const finalEdges = filteredEdges.filter(e => topIds.has(e.s) && topIds.has(e.t))
      .map(e => ({ source: e.s, target: e.t }));

    const sim = d3.forceSimulation(topNodes)
      .force('link', d3.forceLink(finalEdges).id(d => d.id).distance(40).strength(0.2))
      .force('charge', d3.forceManyBody().strength(-50))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collision', d3.forceCollide().radius(d => Math.max(3, d.degree) + 3));

    const link = g.selectAll('line').data(finalEdges).join('line')
      .attr('stroke', '#1a6b5a55').attr('stroke-width', 0.5);

    const node = g.selectAll('circle').data(topNodes).join('circle')
      .attr('r', d => Math.max(2, Math.min(12, d.degree * 0.8)))
      .attr('fill', d => d.degree > 10 ? '#1a6b5a' : d.degree > 5 ? '#2e8b7a' : '#4db6ac')
      .attr('stroke', '#080c18').attr('stroke-width', 0.5)
      .attr('cursor', 'pointer')
      .on('click', (e, d) => setSelectedNode(d))
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    node.append('title').text(d => `${d.n} (${d.degree} ${t.yaqut.advConnections})`);

    sim.on('tick', () => {
      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('cx', d => d.x).attr('cy', d => d.y);
    });

    return () => sim.stop();
  }, [graphData, lang === "tr"]);

  return (
    <div className="yaqut-adv-panel" ref={containerRef}>
      <div className="yaqut-adv-header">
        <h3>🕸 {t.yaqut.advPlaceGraph}</h3>
        {graphData && (
          <span className="yaqut-adv-stat">
            {graphData.nodes.length} {t.yaqut.advNodes} · {graphData.edges.length} {t.yaqut.advConnections}
          </span>
        )}
      </div>
      <p className="yaqut-adv-desc">
        {t.yaqut.advPlaceGraphLongDesc}
      </p>
      {loading ? (
        <div className="yaqut-loading">{t.yaqut.advLoading}</div>
      ) : (
        <svg ref={svgRef} style={{ width: '100%', height: 520 }} />
      )}
      {selectedNode && (
        <div className="yaqut-adv-info">
          <strong dir="rtl">{selectedNode.n}</strong>
          <span> — {selectedNode.degree} {t.yaqut.advConnections}</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   2) PERSON-PLACE BIPARTITE NETWORK
   ═══════════════════════════════════════════════════ */
export function PersonPlaceNetwork({ data, lang }) {
  const t = T[lang];
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // Top places by cross-ref count
  const topPlaces = useMemo(() => {
    return data.filter(e => (e.pc || 0) > 50)
      .sort((a, b) => (b.pc || 0) - (a.pc || 0))
      .slice(0, 15)
      .map(e => ({
        id: `p_${e.id}`,
        name: hn(e, lang),
        type: 'place',
        count: e.pc || 0,
      }));
  }, [data, lang === "tr"]);

  useEffect(() => {
    if (!svgRef.current || !topPlaces.length) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const container = containerRef.current;
    const w = container?.clientWidth || 700;
    const h = 400;
    svg.attr('width', w).attr('height', h);

    // Simple radial layout
    const cx = w / 2, cy = h / 2;

    const nodes = topPlaces.map((p, i) => {
      const angle = (i / topPlaces.length) * 2 * Math.PI - Math.PI / 2;
      const radius = 150;
      return {
        ...p,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      };
    });

    // Draw center node
    svg.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', 30)
      .attr('fill', '#1a6b5a').attr('opacity', 0.3);
    svg.append('text')
      .attr('x', cx).attr('y', cy + 4)
      .attr('text-anchor', 'middle').attr('fill', '#c4b89a').attr('font-size', 10)
      .textt.yaqut.advPlaces;

    // Draw connections
    nodes.forEach(n => {
      svg.append('line')
        .attr('x1', cx).attr('y1', cy)
        .attr('x2', n.x).attr('y2', n.y)
        .attr('stroke', '#1a6b5a55').attr('stroke-width', Math.max(1, n.count / 100));
    });

    // Draw place nodes
    const g = svg.selectAll('.node').data(nodes).join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`);

    g.append('circle')
      .attr('r', d => Math.max(8, Math.min(25, d.count / 30)))
      .attr('fill', '#1a6b5a')
      .attr('opacity', 0.8);

    g.append('text')
      .attr('y', d => -Math.max(8, Math.min(25, d.count / 30)) - 4)
      .attr('text-anchor', 'middle')
      .attr('fill', '#c4b89a').attr('font-size', 10)
      .text(d => d.name.length > 15 ? d.name.slice(0, 14) + '…' : d.name);

    g.append('text')
      .attr('y', 4).attr('text-anchor', 'middle')
      .attr('fill', '#e8dcc8').attr('font-size', 9).attr('font-weight', 600)
      .text(d => d.count);
  }, [topPlaces, lang === "tr"]);

  return (
    <div className="yaqut-adv-panel" ref={containerRef}>
      <div className="yaqut-adv-header">
        <h3>👤 {t.yaqut.advPersonPlace}</h3>
      </div>
      <p className="yaqut-adv-desc">
        {t.yaqut.advPlaceGraphDesc}
      </p>
      <svg ref={svgRef} style={{ width: '100%', height: 400 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   3) GEO HEATMAP — Region clustering
   ═══════════════════════════════════════════════════ */
export function GeoHeatmap({ data, lang }) {
  const t = T[lang];
  const svgRef = useRef(null);

  const regionData = useMemo(() => {
    const counts = {};
    data.forEach(e => {
      if (e.ct) counts[e.ct] = (counts[e.ct] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, count]) => ({ name, count }));
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || !regionData.length) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 700;
    const h = 400;
    svg.attr('width', w).attr('height', h);

    // Treemap layout
    const root = d3.hierarchy({ children: regionData })
      .sum(d => d.count);

    d3.treemap()
      .size([w, h])
      .padding(2)
      .round(true)(root);

    const color = d3.scaleSequential(d3.interpolateViridis)
      .domain([0, d3.max(regionData, d => d.count)]);

    const cell = svg.selectAll('g').data(root.leaves()).join('g')
      .attr('transform', d => `translate(${d.x0},${d.y0})`);

    cell.append('rect')
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', d => color(d.data.count))
      .attr('rx', 3)
      .attr('opacity', 0.85);

    cell.append('text')
      .attr('x', d => (d.x1 - d.x0) / 2)
      .attr('y', d => (d.y1 - d.y0) / 2 - 4)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff').attr('font-size', d => Math.min(13, (d.x1 - d.x0) / 6))
      .text(d => d.data.name);

    cell.append('text')
      .attr('x', d => (d.x1 - d.x0) / 2)
      .attr('y', d => (d.y1 - d.y0) / 2 + 12)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffffcc').attr('font-size', 11).attr('font-weight', 600)
      .text(d => d.data.count.toLocaleString());
  }, [regionData]);

  return (
    <div className="yaqut-adv-panel">
      <div className="yaqut-adv-header">
        <h3>🔥 {t.yaqut.advGeoCluster}</h3>
      </div>
      <p className="yaqut-adv-desc">
        {t.yaqut.advGeoClusterDesc}
      </p>
      <svg ref={svgRef} style={{ width: '100%', height: 400 }} />
    </div>
  );
}
