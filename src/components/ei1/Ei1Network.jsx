import { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { EI1_FIELD_COLORS, getCentury } from './ei1Constants';

/* ═══ Edge type visual config ═══ */
const EDGE_STYLES = {
  SAME_AUTHOR:     { dash: [],    lightColor: 'rgba(140,90,40,0.25)', darkColor: 'rgba(201,168,76,0.2)',  width: 0.6 },
  SAME_PLACE:      { dash: [3,3], lightColor: 'rgba(77,182,172,0.3)', darkColor: 'rgba(77,182,172,0.2)', width: 0.5 },
  CROSS_REFERENCE: { dash: [],    lightColor: 'rgba(80,60,30,0.4)',   darkColor: 'rgba(220,200,160,0.3)', width: 1.0 },
  STUDIED_UNDER:   { dash: [],    lightColor: 'rgba(80,60,30,0.5)',   darkColor: 'rgba(220,200,160,0.4)', width: 1.2 },
  TAUGHT:          { dash: [],    lightColor: 'rgba(80,60,30,0.5)',   darkColor: 'rgba(220,200,160,0.4)', width: 1.2 },
};

const ARTICLE_TYPE_COLORS = {
  'biography':  '#c9a84c',
  'geography':  '#4db6ac',
  'concept':    '#7986cb',
  'dynasty':    '#e57373',
};

export default function Ei1Network({ lang, te, data, relations, lookup, filtered, onSelect, selectedId }) {
  const canvasRef = useRef(null);
  const tooltipRef = useRef(null);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const transformRef = useRef(d3.zoomIdentity);
  const hoveredRef = useRef(null);
  const selectedRef = useRef(selectedId);
  const colorByRef = useRef('field');
  const renderRef = useRef(null);

  const [threshold, setThreshold] = useState(20);
  const [colorBy, setColorBy] = useState('field');
  const [showAuthor, setShowAuthor] = useState(true);
  const [showPlace, setShowPlace] = useState(false);
  const [showXref, setShowXref] = useState(true);
  const [viewMode, setViewMode] = useState('force');
  const [filterField, setFilterField] = useState('');
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);

  useEffect(() => { selectedRef.current = selectedId; renderRef.current?.(); }, [selectedId]);
  useEffect(() => { colorByRef.current = colorBy; renderRef.current?.(); }, [colorBy]);

  const graphData = useMemo(() => {
    if (!relations?.edges || !data) return { nodes: [], links: [] };
    const qualifiedIds = new Set();
    data.forEach(b => { if ((b.is || 0) >= threshold) qualifiedIds.add(b.id); });

    const links = [];
    const nodeIds = new Set();

    relations.edges.forEach(([src, tgt, type]) => {
      if (!qualifiedIds.has(src) || !qualifiedIds.has(tgt)) return;
      if (!showAuthor && type === 'SAME_AUTHOR') return;
      if (!showPlace && type === 'SAME_PLACE') return;
      if (!showXref && (type === 'CROSS_REFERENCE' || type === 'STUDIED_UNDER' || type === 'TAUGHT')) return;

      if (filterField) {
        const sB = lookup[src], tB = lookup[tgt];
        if (!sB?.fl?.includes(filterField) && !tB?.fl?.includes(filterField)) return;
      }

      links.push({ source: src, target: tgt, type });
      nodeIds.add(src); nodeIds.add(tgt);
    });

    return {
      nodes: [...nodeIds].map(id => {
        const bio = lookup[id];
        return {
          id, title: bio?.t || `#${id}`,
          importance: bio?.is || 20,
          field: bio?.fl?.[0] || '',
          at: bio?.at || 'unknown',
          dc: bio?.dc || null,
          au: bio?.au || '',
          century: getCentury(parseInt(bio?.dc) || 0),
        };
      }),
      links,
    };
  }, [relations, data, lookup, threshold, showAuthor, showPlace, showXref, filterField]);

  /* ═══ Simulation ═══ */
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

    function render() {
      const ctx = canvas.getContext('2d');
      const transform = transformRef.current;
      const hovered = hoveredRef.current;
      const selected = selectedRef.current;
      const cby = colorByRef.current;
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';

      const getColor = (d) => {
        if (d.id === selected) return isLight ? '#1a1a1a' : '#fff';
        if (cby === 'type') return ARTICLE_TYPE_COLORS[d.at] || '#90a4ae';
        if (cby === 'century') return d.century ? d3.interpolateWarm((d.century - 1) / 20) : '#546e7a';
        return EI1_FIELD_COLORS[d.field] || '#c9a84c';
      };

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(transform.x * dpr, transform.y * dpr);
      ctx.scale(transform.k * dpr, transform.k * dpr);

      /* Draw edges */
      linksRef.current.forEach(l => {
        if (!l.source.x || !l.target.x) return;
        const style = EDGE_STYLES[l.type] || EDGE_STYLES.SAME_AUTHOR;
        ctx.beginPath();
        ctx.moveTo(l.source.x, l.source.y);
        ctx.lineTo(l.target.x, l.target.y);
        ctx.setLineDash(style.dash);
        ctx.strokeStyle = isLight ? style.lightColor : style.darkColor;
        ctx.lineWidth = style.width;
        ctx.stroke(); ctx.setLineDash([]);

        /* Arrow for directed edges */
        if (l.type === 'STUDIED_UNDER' || l.type === 'TAUGHT' || l.type === 'CROSS_REFERENCE') {
          const dx = l.target.x - l.source.x, dy = l.target.y - l.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            const r = Math.max(3, Math.sqrt(l.target.importance || 20) * 0.7) + 2;
            const ax = l.target.x - (dx / dist) * r, ay = l.target.y - (dy / dist) * r;
            const angle = Math.atan2(dy, dx), al = 4;
            ctx.beginPath(); ctx.moveTo(ax, ay);
            ctx.lineTo(ax - al * Math.cos(angle - 0.4), ay - al * Math.sin(angle - 0.4));
            ctx.lineTo(ax - al * Math.cos(angle + 0.4), ay - al * Math.sin(angle + 0.4));
            ctx.closePath();
            ctx.fillStyle = isLight ? 'rgba(80,60,30,0.5)' : 'rgba(201,168,76,0.4)';
            ctx.fill();
          }
        }
      });

      /* Draw nodes */
      nodesRef.current.forEach(d => {
        if (d.x == null) return;
        const r = Math.max(3, Math.sqrt(d.importance || 20) * 0.7);
        ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fillStyle = getColor(d); ctx.fill();
        if (d.id === selected || d.id === hovered) {
          ctx.strokeStyle = isLight ? '#1a1a1a' : '#fff';
          ctx.lineWidth = 2; ctx.stroke();
        }
        if (d.importance > 50 || d.id === selected || d.id === hovered) {
          ctx.font = '9px sans-serif';
          ctx.fillStyle = isLight ? '#32281a' : '#e0d8c8';
          ctx.textAlign = 'center';
          ctx.fillText(d.title, d.x, d.y - r - 3);
        }
      });
      ctx.restore();
    }
    renderRef.current = render;

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(50).strength(0.25))
      .force('charge', d3.forceManyBody().strength(-25).distanceMax(200))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collision', d3.forceCollide().radius(d => Math.max(4, Math.sqrt(d.importance || 20) * 0.7) + 1))
      .alphaDecay(0.02)
      .on('tick', render);

    if (viewMode === 'timeline') {
      const cs = d3.scaleLinear().domain([1, 21]).range([80, w - 80]);
      sim.force('x', d3.forceX(d => cs(d.century || 10)).strength(0.5)).force('center', null);
    }

    /* Zoom */
    d3.select(canvas).call(
      d3.zoom().scaleExtent([0.3, 5]).on('zoom', (event) => {
        transformRef.current = event.transform; render();
      })
    );

    /* Hit test */
    const findNode = (x, y) => {
      const t = transformRef.current;
      const mx = (x - t.x) / t.k, my = (y - t.y) / t.k;
      let closest = null, minDist = Infinity;
      nodes.forEach(n => {
        const dx = n.x - mx, dy = n.y - my;
        const r = Math.max(5, Math.sqrt(n.importance || 20) * 0.7) + 4;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < r && dist < minDist) { closest = n; minDist = dist; }
      });
      return closest;
    };

    let dragNode = null;
    const onDown = (e) => {
      const node = findNode(e.offsetX, e.offsetY);
      if (node) { dragNode = node; sim.alphaTarget(0.3).restart(); node.fx = node.x; node.fy = node.y; }
    };
    const onMove = (e) => {
      if (dragNode) {
        const t = transformRef.current;
        dragNode.fx = (e.offsetX - t.x) / t.k;
        dragNode.fy = (e.offsetY - t.y) / t.k;
      } else {
        const node = findNode(e.offsetX, e.offsetY);
        const prev = hoveredRef.current;
        hoveredRef.current = node?.id || null;
        canvas.style.cursor = node ? 'pointer' : 'grab';
        if (tooltipRef.current) {
          if (node) {
            tooltipRef.current.style.display = 'block';
            tooltipRef.current.style.left = e.offsetX + 12 + 'px';
            tooltipRef.current.style.top = e.offsetY - 10 + 'px';
            tooltipRef.current.innerHTML = `<strong>${node.title}</strong>${node.dc ? `<br>d. ${node.dc}` : ''}${node.field ? `<br>${node.field}` : ''}${node.au ? `<br>✍ ${node.au}` : ''}`;
          } else {
            tooltipRef.current.style.display = 'none';
          }
        }
        if (prev !== hoveredRef.current) render();
      }
    };
    const onUp = () => {
      if (dragNode) { sim.alphaTarget(0); dragNode.fx = null; dragNode.fy = null; dragNode = null; }
    };
    const onClick = (e) => {
      if (dragNode) return;
      const node = findNode(e.offsetX, e.offsetY);
      if (node) onSelect(node.id);
    };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('click', onClick);

    const onTheme = () => renderRef.current?.();
    window.addEventListener('themechange', onTheme);

    return () => {
      sim.stop(); renderRef.current = null;
      window.removeEventListener('themechange', onTheme);
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('click', onClick);
    };
  }, [graphData, viewMode, onSelect]);

  return (
    <div className="ei1-network">
      <button className="ei1-network-controls-toggle" onClick={() => setMobileControlsOpen(p => !p)}
        aria-expanded={mobileControlsOpen} aria-label={te.settings || 'Settings'}>
        ⚙ {te.settings || 'Settings'} ({graphData.nodes.length} {te.nodes || 'nodes'})
        <span className={`toggle-arrow${mobileControlsOpen ? ' open' : ''}`}>▾</span>
      </button>
      <div className={`ei1-network-controls${mobileControlsOpen ? '' : ' mobile-collapsed'}`}>
        <div className="ei1-network-control-group">
          <label>{te.thresholdLabel || 'Importance'}: <strong>{threshold}</strong></label>
          <input type="range" min={10} max={70} value={threshold} onChange={e => setThreshold(+e.target.value)} />
          <span className="ei1-network-count">{graphData.nodes.length} {te.nodes || 'nodes'} · {graphData.links.length} {te.edges || 'edges'}</span>
        </div>
        <div className="ei1-network-control-group">
          <label>{te.colorByLabel || 'Color'}:</label>
          <select className="ei1-select-sm" value={colorBy} onChange={e => setColorBy(e.target.value)}>
            <option value="field">{te.byField || 'Field'}</option>
            <option value="type">{te.byType || 'Article Type'}</option>
            <option value="century">{te.byCentury || 'Century'}</option>
          </select>
        </div>
        <div className="ei1-network-control-group">
          <label>{te.viewModeLabel || 'Layout'}:</label>
          <select className="ei1-select-sm" value={viewMode} onChange={e => setViewMode(e.target.value)}>
            <option value="force">Force</option>
            <option value="timeline">{te.timelineLayout || 'Timeline'}</option>
          </select>
        </div>
        <div className="ei1-network-control-group">
          <label>{te.filterFieldLabel || 'Field'}:</label>
          <select className="ei1-select-sm" value={filterField} onChange={e => setFilterField(e.target.value)}>
            <option value="">{te.all || 'All'}</option>
            {Object.keys(EI1_FIELD_COLORS).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="ei1-network-checks">
          <label className="ei1-network-check">
            <input type="checkbox" checked={showAuthor} onChange={e => setShowAuthor(e.target.checked)} />
            {te.sameAuthor || 'Same Author'}
          </label>
          <label className="ei1-network-check">
            <input type="checkbox" checked={showPlace} onChange={e => setShowPlace(e.target.checked)} />
            {te.samePlace || 'Same Place'}
          </label>
          <label className="ei1-network-check">
            <input type="checkbox" checked={showXref} onChange={e => setShowXref(e.target.checked)} />
            {te.crossRef || 'Cross-Ref'}
          </label>
        </div>
      </div>

      <div className="ei1-network-canvas-wrap">
        {graphData.nodes.length === 0 ? (
          <div className="ei1-network-empty">{te.noNodes || 'No nodes found. Lower the threshold or enable more edge types.'}</div>
        ) : (
          <>
            <canvas ref={canvasRef} className="ei1-network-canvas" />
            <div ref={tooltipRef} className="ei1-network-tooltip" style={{ display: 'none' }} />
          </>
        )}
        {viewMode === 'timeline' && graphData.nodes.length > 0 && (
          <div className="ei1-network-timeline-axis">
            {Array.from({ length: 21 }, (_, i) => i + 1).filter(c => c % 2 === 1).map(c => (
              <span key={c} className="ei1-timeline-label">{c}.</span>
            ))}
          </div>
        )}
      </div>

      <div className="ei1-network-legend">
        {colorBy === 'field' && Object.entries(EI1_FIELD_COLORS).slice(0, 8).map(([f, c]) => (
          <span key={f} className="ei1-legend-item"><span className="ei1-legend-dot" style={{ background: c }} />{f}</span>
        ))}
        {colorBy === 'type' && Object.entries(ARTICLE_TYPE_COLORS).map(([t, c]) => (
          <span key={t} className="ei1-legend-item"><span className="ei1-legend-dot" style={{ background: c }} />{t}</span>
        ))}
        {colorBy === 'century' && <span className="ei1-legend-item" style={{ fontSize: 10 }}>1C ← Warm → 21C</span>}
        <span className="ei1-legend-item"><span className="ei1-legend-line solid" /> {te.authorEdge || 'Same Author'}</span>
        <span className="ei1-legend-item"><span className="ei1-legend-line dashed" /> {te.placeEdge || 'Same Place'}</span>
        <span className="ei1-legend-item"><span className="ei1-legend-line arrow" /> {te.xrefEdge || 'Cross-Ref'}</span>
      </div>
    </div>
  );
}
