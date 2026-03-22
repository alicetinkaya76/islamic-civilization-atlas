import { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { FIELD_COLORS } from './DiaSidebar';

const MADHAB_COLORS = {
  'Hanefî':'#4fc3f7','Şâfiî':'#66bb6a','Mâlikî':'#ffd54f',
  'Hanbelî':'#ef5350','Zâhirî':'#ce93d8',"Ca'ferî":'#ff8a65',
};

const COMMUNITY_COLORS = [
  '#e57373','#4fc3f7','#81c784','#ffd54f','#ce93d8','#ffb74d',
  '#4db6ac','#f06292','#90a4ae','#a1887f','#64b5f6','#ff8a65',
];

function getCentury(year) { return year ? Math.ceil(year / 100) : null; }

/* ═══ Label propagation community detection ═══ */
function detectCommunities(nodes, links) {
  const adj = {};
  nodes.forEach(n => { adj[n.id] = []; });
  links.forEach(l => {
    const s = typeof l.source === 'object' ? l.source.id : l.source;
    const t = typeof l.target === 'object' ? l.target.id : l.target;
    if (adj[s]) adj[s].push(t);
    if (adj[t]) adj[t].push(s);
  });
  const label = {};
  nodes.forEach((n, i) => { label[n.id] = i; });
  const ids = nodes.map(n => n.id);
  for (let iter = 0; iter < 15; iter++) {
    let changed = false;
    const shuffled = [...ids].sort(() => Math.random() - 0.5);
    for (const id of shuffled) {
      const neighbors = adj[id];
      if (!neighbors || neighbors.length === 0) continue;
      const freq = {};
      neighbors.forEach(nid => { const l = label[nid]; freq[l] = (freq[l] || 0) + 1; });
      let best = label[id], bestC = 0;
      for (const [l, c] of Object.entries(freq)) { if (c > bestC) { bestC = c; best = +l; } }
      if (best !== label[id]) { label[id] = best; changed = true; }
    }
    if (!changed) break;
  }
  const unique = [...new Set(Object.values(label))];
  const remap = {};
  unique.forEach((l, i) => { remap[l] = i; });
  const result = {};
  for (const [id, l] of Object.entries(label)) result[id] = remap[l];
  return { communities: result, count: unique.length };
}

/* ═══ N-hop ego neighborhood ═══ */
function getEgoNeighbors(centerId, links, hops) {
  const adj = {};
  links.forEach(l => {
    const s = typeof l.source === 'object' ? l.source.id : l.source;
    const t = typeof l.target === 'object' ? l.target.id : l.target;
    if (!adj[s]) adj[s] = new Set(); if (!adj[t]) adj[t] = new Set();
    adj[s].add(t); adj[t].add(s);
  });
  const visited = new Set([centerId]);
  let frontier = [centerId];
  for (let h = 0; h < hops; h++) {
    const next = [];
    for (const id of frontier) {
      (adj[id] || new Set()).forEach(nid => { if (!visited.has(nid)) { visited.add(nid); next.push(nid); } });
    }
    frontier = next;
  }
  return visited;
}

export default function DiaNetwork({ lang, td, data, relations, lookup, filtered, onSelect, selectedId, geoData }) {
  const canvasRef = useRef(null);
  const tooltipRef = useRef(null);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const transformRef = useRef(d3.zoomIdentity);
  const hoveredRef = useRef(null);
  const selectedRef = useRef(selectedId);
  const colorByRef = useRef('field');
  const communityRef = useRef({});
  const renderRef = useRef(null);

  const [threshold, setThreshold] = useState(50);
  const [colorBy, setColorBy] = useState('field');
  const [showContemporary, setShowContemporary] = useState(false);
  const [viewMode, setViewMode] = useState('force');
  const [filterField, setFilterField] = useState('');
  const [filterMadhab, setFilterMadhab] = useState('');
  const [egoMode, setEgoMode] = useState(false);
  const [egoHops, setEgoHops] = useState(1);
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);

  useEffect(() => { selectedRef.current = selectedId; renderRef.current?.(); }, [selectedId]);
  useEffect(() => { colorByRef.current = colorBy; renderRef.current?.(); }, [colorBy]);

  const geoMap = useMemo(() => {
    if (!geoData) return {};
    const m = {}; geoData.forEach(g => { m[g.id] = g; }); return m;
  }, [geoData]);

  const graphData = useMemo(() => {
    if (!relations || !data) return { nodes: [], links: [] };
    const qualifiedIds = new Set();
    data.forEach(b => { if ((b.is || 0) >= threshold) qualifiedIds.add(b.id); });
    const links = [];
    const nodeIds = new Set();
    relations.ts.forEach(([teacher, student, count]) => {
      if (!qualifiedIds.has(teacher) || !qualifiedIds.has(student)) return;
      if (filterField) {
        const tB = lookup[teacher], sB = lookup[student];
        if (!tB?.fl?.includes(filterField) && !sB?.fl?.includes(filterField)) return;
      }
      if (filterMadhab && lookup[teacher]?.mz !== filterMadhab && lookup[student]?.mz !== filterMadhab) return;
      links.push({ source: teacher, target: student, type: 'ts', count });
      nodeIds.add(teacher); nodeIds.add(student);
    });
    if (showContemporary) {
      relations.co.forEach(([a, b, count]) => {
        if (qualifiedIds.has(a) && qualifiedIds.has(b) && nodeIds.has(a) && nodeIds.has(b))
          links.push({ source: a, target: b, type: 'co', count });
      });
    }

    let finalNodeIds = nodeIds;
    let finalLinks = links;
    if (egoMode && selectedId && nodeIds.has(selectedId)) {
      const egoSet = getEgoNeighbors(selectedId, links, egoHops);
      finalNodeIds = new Set([...nodeIds].filter(id => egoSet.has(id)));
      finalLinks = links.filter(l => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        return finalNodeIds.has(s) && finalNodeIds.has(t);
      });
    }

    return {
      nodes: [...finalNodeIds].map(id => {
        const bio = lookup[id]; const g = geoMap[id];
        return { id, title: bio?.t || id, importance: bio?.is || 30,
          field: bio?.fl?.[0] || '', madhab: bio?.mz || '',
          dc: bio?.dc || null, century: getCentury(bio?.dc),
          geoLat: g?.lat, geoLon: g?.lon };
      }),
      links: finalLinks,
    };
  }, [relations, data, lookup, threshold, showContemporary, filterField, filterMadhab, egoMode, egoHops, selectedId, geoMap]);

  const communityData = useMemo(() => {
    if (graphData.nodes.length === 0) return { communities: {}, count: 0 };
    return detectCommunities(graphData.nodes, graphData.links);
  }, [graphData]);
  useEffect(() => { communityRef.current = communityData.communities; renderRef.current?.(); }, [communityData]);

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

    const isGeo = viewMode === 'geo';

    function render() {
      const ctx = canvas.getContext('2d');
      const transform = transformRef.current;
      const hovered = hoveredRef.current;
      const selected = selectedRef.current;
      const cby = colorByRef.current;
      const comm = communityRef.current;
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';

      const getColor = (d) => {
        if (d.id === selected) return isLight ? '#1a1a1a' : '#fff';
        if (cby === 'madhab') return MADHAB_COLORS[d.madhab] || '#546e7a';
        if (cby === 'century') return d.century ? d3.interpolateViridis((d.century - 7) / 14) : '#546e7a';
        if (cby === 'community') return COMMUNITY_COLORS[(comm[d.id] || 0) % COMMUNITY_COLORS.length];
        return FIELD_COLORS[d.field] || '#c9a84c';
      };

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(transform.x * dpr, transform.y * dpr);
      ctx.scale(transform.k * dpr, transform.k * dpr);

      /* Geo grid */
      if (isGeo) {
        ctx.globalAlpha = 0.08;
        ctx.strokeStyle = isLight ? '#5a4a2a' : '#8a8060';
        ctx.lineWidth = 0.5;
        for (let lon = -20; lon <= 100; lon += 20) {
          const x = ((lon + 20) / 120) * w;
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let lat = 0; lat <= 60; lat += 10) {
          const y = ((60 - lat) / 60) * h;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      linksRef.current.forEach(l => {
        if (!l.source.x || !l.target.x) return;
        ctx.beginPath();
        ctx.moveTo(l.source.x, l.source.y);
        ctx.lineTo(l.target.x, l.target.y);
        if (l.type === 'co') {
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = isLight ? 'rgba(100,90,72,0.2)' : 'rgba(150,150,150,0.15)';
          ctx.lineWidth = 0.5;
        } else {
          ctx.setLineDash([]);
          ctx.strokeStyle = isLight ? 'rgba(80,72,58,0.3)' : 'rgba(180,170,140,0.25)';
          ctx.lineWidth = 0.8;
        }
        ctx.stroke(); ctx.setLineDash([]);
        if (l.type === 'ts') {
          const dx = l.target.x - l.source.x, dy = l.target.y - l.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            const r = Math.max(3, Math.sqrt(l.target.importance || 30) * 0.7) + 2;
            const ax = l.target.x - (dx / dist) * r, ay = l.target.y - (dy / dist) * r;
            const angle = Math.atan2(dy, dx), al = 4;
            ctx.beginPath(); ctx.moveTo(ax, ay);
            ctx.lineTo(ax - al * Math.cos(angle - 0.4), ay - al * Math.sin(angle - 0.4));
            ctx.lineTo(ax - al * Math.cos(angle + 0.4), ay - al * Math.sin(angle + 0.4));
            ctx.closePath();
            ctx.fillStyle = isLight ? 'rgba(80,72,58,0.45)' : 'rgba(180,170,140,0.4)';
            ctx.fill();
          }
        }
      });

      const showAllLabels = egoMode && nodesRef.current.length < 60;
      nodesRef.current.forEach(d => {
        if (d.x == null) return;
        const r = Math.max(3, Math.sqrt(d.importance || 30) * 0.7);
        ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fillStyle = getColor(d); ctx.fill();
        if (d.id === selected || d.id === hovered) {
          ctx.strokeStyle = isLight ? '#1a1a1a' : '#fff';
          ctx.lineWidth = 2; ctx.stroke();
        }
        if (d.importance > 70 || d.id === selected || d.id === hovered || showAllLabels) {
          ctx.font = '9px sans-serif';
          ctx.fillStyle = isLight ? '#32281a' : '#e0d8c8';
          ctx.textAlign = 'center';
          ctx.fillText(d.title, d.x, d.y - r - 3);
        }
      });
      ctx.restore();
    }
    renderRef.current = render;

    if (isGeo) {
      const lonScale = d3.scaleLinear().domain([-20, 100]).range([60, w - 60]);
      const latScale = d3.scaleLinear().domain([0, 60]).range([h - 60, 60]);
      nodes.forEach(n => {
        if (n.geoLat != null && n.geoLon != null) {
          n.x = lonScale(n.geoLon); n.y = latScale(n.geoLat);
          n.fx = n.x; n.fy = n.y;
        }
      });
    }

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(isGeo ? 20 : 40).strength(isGeo ? 0.05 : 0.3))
      .force('charge', d3.forceManyBody().strength(isGeo ? -5 : -30).distanceMax(isGeo ? 50 : 200))
      .force('collision', d3.forceCollide().radius(d => Math.max(4, Math.sqrt(d.importance || 30) * 0.7) + 1))
      .alphaDecay(isGeo ? 0.05 : 0.02)
      .on('tick', render);

    if (viewMode === 'force') {
      sim.force('center', d3.forceCenter(w / 2, h / 2));
    } else if (viewMode === 'timeline') {
      const cs = d3.scaleLinear().domain([7, 21]).range([80, w - 80]);
      sim.force('x', d3.forceX(d => cs(d.century || 12)).strength(0.5));
    } else if (isGeo) {
      sim.force('ungeoX', d3.forceX(w / 2).strength(n => n.fx == null ? 0.02 : 0));
      sim.force('ungeoY', d3.forceY(h / 2).strength(n => n.fy == null ? 0.02 : 0));
    }

    d3.select(canvas).call(
      d3.zoom().scaleExtent([0.3, 5]).on('zoom', (event) => {
        transformRef.current = event.transform; render();
      })
    );

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

    let dragNode = null;
    const onDown = (e) => {
      const node = findNode(e.offsetX, e.offsetY);
      if (node && !isGeo) { dragNode = node; sim.alphaTarget(0.3).restart(); node.fx = node.x; node.fy = node.y; }
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
            const comm = communityRef.current;
            tooltipRef.current.innerHTML = `<strong>${node.title}</strong>${node.dc ? `<br>ö. ${node.dc}` : ''}${node.field ? `<br>${node.field}` : ''}${colorByRef.current === 'community' ? `<br>Topluluk #${(comm[node.id] ?? '?')}` : ''}`;
          } else { tooltipRef.current.style.display = 'none'; }
        }
        if (prev !== hoveredRef.current) render();
      }
    };
    const onUp = () => {
      if (dragNode && !isGeo) { sim.alphaTarget(0); dragNode.fx = null; dragNode.fy = null; dragNode = null; }
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
  }, [graphData, viewMode, onSelect, egoMode]);

  return (
    <div className="dia-network">
      <button className="dia-network-controls-toggle" onClick={() => setMobileControlsOpen(p => !p)}
        aria-expanded={mobileControlsOpen} aria-label={td.settings || 'Ayarlar'}>
        ⚙ {td.settings || 'Ayarlar'} ({graphData.nodes.length} {td.nodes || 'düğüm'})
        <span className={`toggle-arrow${mobileControlsOpen ? ' open' : ''}`}>▾</span>
      </button>
      <div className={`dia-network-controls${mobileControlsOpen ? '' : ' mobile-collapsed'}`}>
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
            <option value="community">{td.byCommunity || 'Topluluk'}</option>
          </select>
        </div>
        <div className="dia-network-control-group">
          <label>{td.viewModeLabel || 'Görünüm'}:</label>
          <select className="dia-select-sm" value={viewMode} onChange={e => setViewMode(e.target.value)}>
            <option value="force">Force</option>
            <option value="timeline">{td.timelineLayout || 'Zaman Çizelgesi'}</option>
            <option value="geo">{td.geoLayout || 'Coğrafi'}</option>
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
        <div className="dia-network-checks-row">
          <label className="dia-network-check">
            <input type="checkbox" checked={showContemporary} onChange={e => setShowContemporary(e.target.checked)} />
            {td.showContemporary || 'Muâsır'}
          </label>
          <label className="dia-network-check">
            <input type="checkbox" checked={egoMode} onChange={e => setEgoMode(e.target.checked)} />
            {td.egoMode || 'Ego Ağı'}
          </label>
          {egoMode && (
            <select className="dia-select-sm" value={egoHops} onChange={e => setEgoHops(+e.target.value)}>
              <option value={1}>1 hop</option>
              <option value={2}>2 hop</option>
            </select>
          )}
        </div>
      </div>

      <div className="dia-network-canvas-wrap">
        {graphData.nodes.length === 0 ? (
          <div className="dia-network-empty">
            {egoMode && !selectedId
              ? (td.egoHint || 'Ego ağı için sol panelden bir âlim seçin.')
              : (td.noNodes || 'Bu filtrelerde düğüm bulunamadı. Eşiği düşürün.')}
          </div>
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
        {egoMode && selectedId && graphData.nodes.length > 0 && (
          <div className="dia-network-ego-badge">
            🎯 {lookup[selectedId]?.t || selectedId} — {egoHops} hop · {graphData.nodes.length} {td.nodes || 'düğüm'}
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
        {colorBy === 'community' && <span className="dia-legend-item" style={{ fontSize: 10 }}>{communityData.count} {td.communities || 'topluluk'}</span>}
        <span className="dia-legend-item"><span className="dia-legend-line solid" /> {td.tsEdge || 'Hoca→Talebe'}</span>
        {showContemporary && <span className="dia-legend-item"><span className="dia-legend-line dashed" /> {td.coEdge || 'Muâsır'}</span>}
        {viewMode === 'geo' && <span className="dia-legend-item" style={{ fontSize: 10 }}>📍 {td.geoNote || 'Konumlu düğümler sabitleştirildi'}</span>}
      </div>
    </div>
  );
}
