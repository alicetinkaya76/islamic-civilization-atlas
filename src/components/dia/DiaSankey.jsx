import { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { FIELD_COLORS } from './DiaSidebar';

/* ═══ Simple Sankey layout (no d3-sankey dependency) ═══ */
function computeSankey(flows, fields, w, h, pad) {
  /* flows: [{source, target, value}], fields: string[] */
  const srcTotals = {}, tgtTotals = {};
  fields.forEach(f => { srcTotals[f] = 0; tgtTotals[f] = 0; });
  flows.forEach(fl => { srcTotals[fl.source] = (srcTotals[fl.source] || 0) + fl.value; tgtTotals[fl.target] = (tgtTotals[fl.target] || 0) + fl.value; });

  const srcFields = fields.filter(f => srcTotals[f] > 0).sort((a, b) => srcTotals[b] - srcTotals[a]);
  const tgtFields = fields.filter(f => tgtTotals[f] > 0).sort((a, b) => tgtTotals[b] - tgtTotals[a]);

  const maxTotal = Math.max(...srcFields.map(f => srcTotals[f]), ...tgtFields.map(f => tgtTotals[f]), 1);
  const usableH = h - pad * 2;
  const nodeW = 18;
  const gap = 6;

  /* Compute node positions */
  const srcNodes = {};
  let sy = pad;
  const srcScale = usableH / (srcFields.reduce((s, f) => s + srcTotals[f], 0) + gap * (srcFields.length - 1));
  srcFields.forEach(f => {
    const nh = Math.max(4, srcTotals[f] * srcScale);
    srcNodes[f] = { x: pad, y: sy, w: nodeW, h: nh, total: srcTotals[f], field: f, side: 'src' };
    sy += nh + gap;
  });

  const tgtNodes = {};
  let ty = pad;
  const tgtScale = usableH / (tgtFields.reduce((s, f) => s + tgtTotals[f], 0) + gap * (tgtFields.length - 1));
  tgtFields.forEach(f => {
    const nh = Math.max(4, tgtTotals[f] * tgtScale);
    tgtNodes[f] = { x: w - pad - nodeW, y: ty, w: nodeW, h: nh, total: tgtTotals[f], field: f, side: 'tgt' };
    ty += nh + gap;
  });

  /* Compute link paths */
  const srcOffsets = {}; srcFields.forEach(f => { srcOffsets[f] = 0; });
  const tgtOffsets = {}; tgtFields.forEach(f => { tgtOffsets[f] = 0; });

  const sortedFlows = [...flows].sort((a, b) => b.value - a.value);
  const linkPaths = sortedFlows.map(fl => {
    const sn = srcNodes[fl.source];
    const tn = tgtNodes[fl.target];
    if (!sn || !tn) return null;

    const sh = (fl.value / sn.total) * sn.h;
    const th = (fl.value / tn.total) * tn.h;
    const sy0 = sn.y + srcOffsets[fl.source];
    const ty0 = tn.y + tgtOffsets[fl.target];
    srcOffsets[fl.source] += sh;
    tgtOffsets[fl.target] += th;

    return { source: fl.source, target: fl.target, value: fl.value, sy0, sy1: sy0 + sh, ty0, ty1: ty0 + th, sx: sn.x + sn.w, tx: tn.x };
  }).filter(Boolean);

  return { srcNodes, tgtNodes, linkPaths, srcFields, tgtFields };
}

export default function DiaSankey({ lang, td, data, relations, lookup }) {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [minFlow, setMinFlow] = useState(10);
  const [hoveredLink, setHoveredLink] = useState(null);

  const flows = useMemo(() => {
    if (!relations?.ts || !data) return [];
    const byId = {};
    data.forEach(d => { byId[d.id] = d; });
    const counts = {};
    relations.ts.forEach(([teacher, student]) => {
      const tf = (byId[teacher]?.fl || [])[0] || null;
      const sf = (byId[student]?.fl || [])[0] || null;
      if (!tf || !sf) return;
      const key = `${tf}→${sf}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([key, value]) => {
        const [source, target] = key.split('→');
        return { source, target, value };
      })
      .filter(f => f.value >= minFlow);
  }, [relations, data, minFlow]);

  const fields = useMemo(() => Object.keys(FIELD_COLORS), []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || flows.length === 0) return;
    const rect = svg.parentElement.getBoundingClientRect();
    const w = rect.width || 700, h = rect.height || 500;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const { srcNodes, tgtNodes, linkPaths, srcFields, tgtFields } = computeSankey(flows, fields, w, h, 30);

    const d3svg = d3.select(svg);
    d3svg.selectAll('*').remove();

    /* Links */
    const linkGroup = d3svg.append('g').attr('class', 'sankey-links');
    linkPaths.forEach((lp, i) => {
      const midX = (lp.sx + lp.tx) / 2;
      const path = d3.path();
      path.moveTo(lp.sx, lp.sy0);
      path.bezierCurveTo(midX, lp.sy0, midX, lp.ty0, lp.tx, lp.ty0);
      path.lineTo(lp.tx, lp.ty1);
      path.bezierCurveTo(midX, lp.ty1, midX, lp.sy1, lp.sx, lp.sy1);
      path.closePath();

      const color = FIELD_COLORS[lp.source] || '#c9a84c';
      linkGroup.append('path')
        .attr('d', path.toString())
        .attr('fill', color)
        .attr('fill-opacity', hoveredLink === i ? 0.6 : 0.2)
        .attr('stroke', color)
        .attr('stroke-opacity', 0.3)
        .attr('stroke-width', 0.5)
        .style('cursor', 'pointer')
        .on('mouseenter', (e) => {
          setHoveredLink(i);
          if (tooltipRef.current) {
            tooltipRef.current.style.display = 'block';
            tooltipRef.current.style.left = e.offsetX + 10 + 'px';
            tooltipRef.current.style.top = e.offsetY - 10 + 'px';
            tooltipRef.current.innerHTML = `<strong>${lp.source} → ${lp.target}</strong><br>${lp.value} hoca→talebe bağı`;
          }
        })
        .on('mouseleave', () => {
          setHoveredLink(null);
          if (tooltipRef.current) tooltipRef.current.style.display = 'none';
        });
    });

    /* Source nodes (left) */
    const textColor = isLight ? '#32281a' : '#e0d8c8';
    srcFields.forEach(f => {
      const n = srcNodes[f];
      if (!n) return;
      d3svg.append('rect').attr('x', n.x).attr('y', n.y).attr('width', n.w).attr('height', n.h)
        .attr('fill', FIELD_COLORS[f] || '#c9a84c').attr('rx', 3);
      d3svg.append('text').attr('x', n.x + n.w + 6).attr('y', n.y + n.h / 2)
        .attr('dy', '0.35em').attr('font-size', 11).attr('fill', textColor)
        .text(`${f} (${n.total})`);
    });

    /* Target nodes (right) */
    tgtFields.forEach(f => {
      const n = tgtNodes[f];
      if (!n) return;
      d3svg.append('rect').attr('x', n.x).attr('y', n.y).attr('width', n.w).attr('height', n.h)
        .attr('fill', FIELD_COLORS[f] || '#c9a84c').attr('rx', 3);
      d3svg.append('text').attr('x', n.x - 6).attr('y', n.y + n.h / 2)
        .attr('dy', '0.35em').attr('font-size', 11).attr('fill', textColor)
        .attr('text-anchor', 'end')
        .text(`${f} (${n.total})`);
    });

    /* Labels */
    d3svg.append('text').attr('x', 30).attr('y', 18).attr('font-size', 12).attr('font-weight', 700)
      .attr('fill', textColor).text(td.teacherField || 'Hocanın Alanı');
    d3svg.append('text').attr('x', w - 30).attr('y', 18).attr('font-size', 12).attr('font-weight', 700)
      .attr('fill', textColor).attr('text-anchor', 'end').text(td.studentField || 'Talebenin Alanı');

  }, [flows, fields, hoveredLink, td]);

  /* Theme listener */
  useEffect(() => {
    const re = () => { setHoveredLink(h => h); }; /* force re-render */
    window.addEventListener('themechange', re);
    return () => window.removeEventListener('themechange', re);
  }, []);

  return (
    <div className="dia-sankey">
      <div className="dia-sankey-controls">
        <div className="dia-network-control-group">
          <label>{td.minFlow || 'Min. Akış'}: <strong>{minFlow}</strong></label>
          <input type="range" min={1} max={50} value={minFlow} onChange={e => setMinFlow(+e.target.value)} />
          <span className="dia-network-count">{flows.length} {td.flows || 'akış'}</span>
        </div>
      </div>
      <div className="dia-sankey-canvas-wrap">
        {flows.length === 0 ? (
          <div className="dia-network-empty">{td.noFlows || 'Akış bulunamadı. Min. akış değerini düşürün.'}</div>
        ) : (
          <>
            <svg ref={svgRef} className="dia-sankey-svg" />
            <div ref={tooltipRef} className="dia-network-tooltip" style={{ display: 'none' }} />
          </>
        )}
      </div>
    </div>
  );
}
