import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { FIELD_COLORS } from './DiaSidebar';

const MADHAB_COLORS = {
  'Hanefî':'#4fc3f7','Şâfiî':'#66bb6a','Mâlikî':'#ffd54f',
  'Hanbelî':'#ef5350','Zâhirî':'#ce93d8',"Ca'ferî":'#ff8a65',
};

function getCentury(year) { return year ? Math.ceil(year / 100) : null; }

export default function DiaNetwork({ lang, td, data, relations, lookup, filtered, onSelect, selectedId }) {
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const tooltipRef = useRef(null);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const transformRef = useRef(d3.zoomIdentity);

  const [threshold, setThreshold] = useState(50);
  const [colorBy, setColorBy] = useState('field');
  const [showContemporary, setShowContemporary] = useState(false);
  const [viewMode, setViewMode] = useState('force');
  const [filterField, setFilterField] = useState('');
  const [filterMadhab, setFilterMadhab] = useState('');
  const [hoveredNode, setHoveredNode] = useState(null);

  const graphData = useMemo(() => {
    if (!relations || !data) return { nodes: [], links: [] };
    const qualifiedIds = new Set();
    data.forEach(b => { if ((b.is || 0) >= threshold) qualifiedIds.add(b.id); });

    const links = [];
    const nodeIds = new Set();

    relations.ts.forEach(([teacher, student, count]) => {
      if (!qualifiedIds.has(teacher) || !qualifiedIds.has(student)) return;
      if (filterField) {
        const tBio = lookup[teacher], sBio = lookup[student];
        if (!tBio?.fl?.includes(filterField) && !sBio?.fl?.includes(filterField)) return;
      }
      if (filterMadhab) {
        if (lookup[teacher]?.mz !== filterMadhab && lookup[student]?.mz !== filterMadhab) return;
      }
      links.push({ source: teacher, target: student, type: 'ts', count });
      nodeIds.add(teacher); nodeIds.add(student);
    });

    if (showContemporary) {
      relations.co.forEach(([a, b, count]) => {
        if (qualifiedIds.has(a) && qualifiedIds.has(b) && nodeIds.has(a) && nodeIds.has(b))
          links.push({ source: a, target: b, type: 'co', count });
      });
    }

    const nodes = [...nodeIds].map(id => {
      const bio = lookup[id];
      return { id, title: bio?.t || id, importance: bio?.is || 30,
        field: bio?.fl?.[0] || '', madhab: bio?.mz || '',
        dc: bio?.dc || null, century: getCentury(bio?.dc) };
    });
    return { nodes, links };
  }, [relations, data, lookup, threshold, showContemporary, filterField, filterMadhab]);

  const getNodeColor = useCallback((d) => {
    if (d.id === selectedId) return '#fff';
    if (colorBy === 'madhab') return MADHAB_COLORS[d.madhab] || '#546e7a';
    if (colorBy === 'century') {
      if (!d.century) return '#546e7a';
      return d3.interpolateViridis((d.century - 7) / 14);
    }
    return FIELD_COLORS[d.field] || '#c9a84c';
  }, [colorBy, selectedId]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const dpr = window.devicePixelRatio || 1;
    const transform = transformRef.current;
    const nodes = nodesRef.current, links = linksRef.current;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(transform.x * dpr, transform.y * dpr);
    ctx.scale(transform.k * dpr, transform.k * dpr);

    links.forEach(l => {
      if (!l.source.x || !l.target.x) return;
      ctx.beginPath();
      ctx.moveTo(l.source.x, l.source.y);
      ctx.lineTo(l.target.x, l.target.y);
      if (l.type === 'co') {
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(150,150,150,0.15)';
        ctx.lineWidth = 0.5;
      } else {
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(180,170,140,0.25)';
        ctx.lineWidth = 0.8;
      }
      ctx.stroke();
      ctx.setLineDash([]);

      if (l.type === 'ts') {
        const dx = l.target.x - l.source.x, dy = l.target.y - l.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          const r = Math.max(3, Math.sqrt(l.target.importance || 30) * 0.7) + 2;
          const ax = l.target.x - (dx / dist) * r, ay = l.target.y - (dy / dist) * r;
          const angle = Math.atan2(dy, dx), al = 4;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax - al * Math.cos(angle - 0.4), ay - al * Math.sin(angle - 0.4));
          ctx.lineTo(ax - al * Math.cos(angle + 0.4), ay - al * Math.sin(angle + 0.4));
          ctx.closePath();
          ctx.fillStyle = 'rgba(180,170,140,0.4)';
          ctx.fill();
        }
      }
    });

    nodes.forEach(d => {
      if (d.x == null) return;
      const r = Math.max(3, Math.sqrt(d.importance || 30) * 0.7);
      ctx.beginPath();
      ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      ctx.fillStyle = getNodeColor(d);
      ctx.fill();
      if (d.id === selectedId || d.id === hoveredNode) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      }
      if (d.importance > 70 || d.id === selectedId || d.id === hoveredNode) {
        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#e0d8c8';
        ctx.textAlign = 'center';
        ctx.fillText(d.title, d.x, d.y - r - 3);
      }
    });
    ctx.restore();
  }, [getNodeColor, selectedId, hoveredNode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !graphData.nodes.length) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const w = rect.width || 800, h = rect.height || 600;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';

    const nodes = graphData.nodes.map(d => ({ ...d }));
    const links = graphData.links.map(d => ({ ...d }));
    nodesRef.current = nodes; linksRef.current = links;

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(40).strength(0.3))
      .force('charge', d3.forceManyBody().strength(-30).distanceMax(200))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collision', d3.forceCollide().radius(d => Math.max(4, Math.sqrt(d.importance || 30) * 0.7) + 1))
      .alphaDecay(0.02)
      .on('tick', render);

    if (viewMode === 'timeline') {
      const centuryScale = d3.scaleLinear().domain([7, 21]).range([80, w - 80]);
      sim.force('x', d3.forceX(d => centuryScale(d.century || 12)).strength(0.5)).force('center', null);
    }
    simRef.current = sim;

    d3.select(canvas).call(d3.zoom().scaleExtent([0.3, 5]).on('zoom', (event) => {
      transformRef.current = event.transform; render();
    }));

    let dragNode = null;
    const findNode = (x, y) => {
      const t = transformRef.current;
      const mx = (x - t.x) / t.k, my = (y - t.y) / t.k;
      let closest = null, minDist = Infinity;
      nodes.forEach(n => {
        const dx = n.x - mx, dy = n.y - my;
        const r = Math.max(5, Math.sqrt(n.importance || 30) * 0.7) + 4;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < r && dist < minDist) { closest = n; minDist = dist; }
      });
      return closest;
    };

    const onMouseDown = (e) => {
      const node = findNode(e.offsetX, e.offsetY);
      if (node) { dragNode = node; sim.alphaTarget(0.3).restart(); node.fx = node.x; node.fy = node.y; }
    };
    const onMouseMove = (e) => {
      if (dragNode) {
        const t = transformRef.current;
        dragNode.fx = (e.offsetX - t.x) / t.k; dragNode.fy = (e.offsetY - t.y) / t.k;
      } else {
        const node = findNode(e.offsetX, e.offsetY);
        setHoveredNode(node?.id || null);
        canvas.style.cursor = node ? 'pointer' : 'grab';
        if (tooltipRef.current) {
          if (node) {
            tooltipRef.current.style.display = 'block';
            tooltipRef.current.style.left = e.offsetX + 12 + 'px';
            tooltipRef.current.style.top = e.offsetY - 10 + 'px';
            tooltipRef.current.innerHTML = `<strong>${node.title}</strong>${node.dc ? `<br>ö. ${node.dc}` : ''}${node.field ? `<br>${node.field}` : ''}`;
          } else tooltipRef.current.style.display = 'none';
        }
      }
    };
    const onMouseUp = () => {
      if (dragNode) { sim.alphaTarget(0); dragNode.fx = null; dragNode.fy = null; dragNode = null; }
    };
    const onClick = (e) => { const node = findNode(e.offsetX, e.offsetY); if (node) onSelect(node.id); };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('click', onClick);

    return () => {
      sim.stop();
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('click', onClick);
    };
  }, [graphData, viewMode, render, onSelect]);

  useEffect(() => { render(); }, [render, colorBy, selectedId, hoveredNode]);

  return (
    <div className="dia-network">
      <div className="dia-network-controls">
        <div className="dia-network-control-group">
          <label>{td.thresholdLabel || 'Önem Eşiği'}: <strong>{threshold}</strong></label>
          <input type="range" min={30} max={80} value={threshold} onChange={e => setThreshold(+e.target.value)} />
          <span className="dia-network-count">{graphData.nodes.length} {td.nodes || 'düğüm'} · {graphData.links.length} {td.edges || 'kenar'}</span>
        </div>
        <div className="dia-network-control-group">
          <label>{td.colorByLabel || 'Renk'}:</label>
          <select className="dia-select-sm" value={colorBy} onChange={e => setColorBy(e.target.value)}>
            <option value="field">{td.byField || 'İlim Dalı'}</option>
            <option value="madhab">{td.byMadhab || 'Mezhep'}</option>
            <option value="century">{td.byCentury || 'Yüzyıl'}</option>
          </select>
        </div>
        <div className="dia-network-control-group">
          <label>{td.viewModeLabel || 'Görünüm'}:</label>
          <select className="dia-select-sm" value={viewMode} onChange={e => setViewMode(e.target.value)}>
            <option value="force">Force</option>
            <option value="timeline">{td.timelineLayout || 'Zaman Çizelgesi'}</option>
          </select>
        </div>
        <div className="dia-network-control-group">
          <label>{td.filterFieldLabel || 'Alan'}:</label>
          <select className="dia-select-sm" value={filterField} onChange={e => setFilterField(e.target.value)}>
            <option value="">{td.all || 'Tümü'}</option>
            {Object.keys(FIELD_COLORS).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="dia-network-control-group">
          <label>{td.filterMadhabLabel || 'Mezhep'}:</label>
          <select className="dia-select-sm" value={filterMadhab} onChange={e => setFilterMadhab(e.target.value)}>
            <option value="">{td.all || 'Tümü'}</option>
            {Object.keys(MADHAB_COLORS).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <label className="dia-network-check">
          <input type="checkbox" checked={showContemporary} onChange={e => setShowContemporary(e.target.checked)} />
          {td.showContemporary || 'Muâsır'}
        </label>
      </div>

      <div className="dia-network-canvas-wrap">
        {graphData.nodes.length === 0 ? (
          <div className="dia-network-empty">{td.noNodes || 'Bu filtrelerde düğüm bulunamadı. Eşiği düşürün.'}</div>
        ) : (
          <>
            <canvas ref={canvasRef} className="dia-network-canvas" />
            <div ref={tooltipRef} className="dia-network-tooltip" style={{ display: 'none' }} />
          </>
        )}
        {viewMode === 'timeline' && graphData.nodes.length > 0 && (
          <div className="dia-network-timeline-axis">
            {Array.from({ length: 15 }, (_, i) => i + 7).map(c => <span key={c} className="dia-timeline-label">{c}.</span>)}
          </div>
        )}
      </div>

      <div className="dia-network-legend">
        {colorBy === 'field' && Object.entries(FIELD_COLORS).slice(0, 8).map(([f, c]) => (
          <span key={f} className="dia-legend-item"><span className="dia-legend-dot" style={{ background: c }} />{f}</span>
        ))}
        {colorBy === 'madhab' && Object.entries(MADHAB_COLORS).map(([m, c]) => (
          <span key={m} className="dia-legend-item"><span className="dia-legend-dot" style={{ background: c }} />{m}</span>
        ))}
        {colorBy === 'century' && <span className="dia-legend-item" style={{ fontSize: 10 }}>7.yy ← Viridis → 21.yy</span>}
        <span className="dia-legend-item"><span className="dia-legend-line solid" /> {td.tsEdge || 'Hoca→Talebe'}</span>
        {showContemporary && <span className="dia-legend-item"><span className="dia-legend-line dashed" /> {td.coEdge || 'Muâsır'}</span>}
      </div>
    </div>
  );
}
