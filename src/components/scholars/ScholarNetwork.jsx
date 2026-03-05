import { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import SCHOLAR_LINKS from '../../data/scholar_links';

const DISC_COLORS = {
  'Fıkıh':                   '#16a34a',
  'Hadis':                   '#2563eb',
  'Tefsir':                  '#ca8a04',
  'Kelam':                   '#7c3aed',
  'Tasavvuf':                '#db2777',
  'Matematik & Astronomi':   '#0891b2',
  'Tıp':                     '#dc2626',
  'Coğrafya & Seyahat':      '#059669',
  'Tarih':                   '#475569',
  'Dil & Edebiyat':          '#ea580c',
  'Kıraat':                  '#65a30d',
  'Mimari & Sanat':          '#d97706',
  'Çağdaş İslam Düşüncesi':  '#1d4ed8',
};
const discColor = d => DISC_COLORS[d] || '#c9a84c';

const LINK_STYLES = {
  teacher:   { color:'#9ca3af', width:2.5, dash:'',    arrow:true  },
  influence: { color:'#a16207', width:1.5, dash:'5,3',  arrow:true  },
  debate:    { color:'#ef4444', width:2,   dash:'3,3',  arrow:false },
  patronage: { color:'#7c3aed', width:1,   dash:'2,4',  arrow:false },
};

const CRITICAL_IDS = new Set([7, 10, 18, 5, 2, 3, 23]);

const GROUP_X = {
  'Fıkıh': 0.3, 'Hadis': 0.3, 'Tefsir': 0.3, 'Kelam': 0.3,
  'Tasavvuf': 0.5, 'Dil & Edebiyat': 0.5,
  'Tıp': 0.7, 'Matematik & Astronomi': 0.7, 'Coğrafya & Seyahat': 0.7,
  'Tarih': 0.6, 'Kıraat': 0.6, 'Mimari & Sanat': 0.6,
  'Çağdaş İslam Düşüncesi': 0.5,
};

// Pre-compute link counts
const linkCount = {};
SCHOLAR_LINKS.forEach(l => {
  linkCount[l.source] = (linkCount[l.source] || 0) + 1;
  linkCount[l.target] = (linkCount[l.target] || 0) + 1;
});
const maxLinks = Math.max(1, ...Object.values(linkCount));

export { DISC_COLORS };

export default function ScholarNetwork({ scholars, links, lang, selected, onSelect, searchId, t }) {
  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const simRef = useRef(null);
  const nodeGRef = useRef(null);
  const linkGRef = useRef(null);

  const [hovered, setHovered] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  // Radius scale based on link count
  const rScale = useMemo(() =>
    d3.scaleSqrt().domain([0, maxLinks]).range([12, 28]),
  []);
  const getRadius = (s) => rScale(linkCount[s.id] || 0);

  // Neighbor set for selected node
  const neighborIds = useMemo(() => {
    if (!selected) return null;
    const s = new Set([selected]);
    SCHOLAR_LINKS.forEach(l => {
      if (l.source === selected || (typeof l.source === 'object' && l.source.id === selected)) {
        s.add(typeof l.target === 'object' ? l.target.id : l.target);
      }
      if (l.target === selected || (typeof l.target === 'object' && l.target.id === selected)) {
        s.add(typeof l.source === 'object' ? l.source.id : l.source);
      }
    });
    return s;
  }, [selected]);

  useEffect(() => {
    if (!svgRef.current || !wrapRef.current) return;
    const wrap = wrapRef.current;
    const W = wrap.clientWidth || 800;
    const H = wrap.clientHeight || 600;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', W).attr('height', H);

    if (scholars.length === 0) {
      svg.append('text').attr('x', W/2).attr('y', H/2)
        .attr('text-anchor','middle').attr('fill','#6b6b7b')
        .attr('font-size','14px').attr('font-family','Outfit')
        .text((t?.scholars?.noResults) || (lang === 'tr' ? 'Sonuç bulunamadı' : 'No results found'));
      return;
    }

    const g = svg.append('g');
    const zoom = d3.zoom().scaleExtent([0.15, 4]).on('zoom', e => g.attr('transform', e.transform));
    svg.call(zoom);

    // Arrow markers per link type
    const defs = svg.append('defs');
    Object.entries(LINK_STYLES).forEach(([type, st]) => {
      if (!st.arrow) return;
      defs.append('marker')
        .attr('id', `sch-arrow-${type}`)
        .attr('viewBox', '0 0 10 10').attr('refX', 28).attr('refY', 5)
        .attr('markerWidth', 5).attr('markerHeight', 5).attr('orient', 'auto')
        .append('path').attr('d', 'M0,0 L10,5 L0,10 Z')
        .attr('fill', st.color);
    });

    const idSet = new Set(scholars.map(s => s.id));
    const validLinks = links
      .filter(l => idSet.has(l.source) && idSet.has(l.target))
      .map(l => ({ ...l }));

    const nodes = scholars.map(s => ({ ...s }));

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(validLinks).id(d => d.id).distance(130))
      .force('charge', d3.forceManyBody().strength(-450))
      .force('center', d3.forceCenter(W/2, H/2).strength(0.08))
      .force('collision', d3.forceCollide(d => getRadius(d) + 6))
      .force('groupX', d3.forceX(d => (GROUP_X[d.disc_tr] || 0.5) * W).strength(0.04))
      .force('groupY', d3.forceY(H/2).strength(0.02));
    simRef.current = sim;

    // Edges
    const linkSel = g.selectAll('.sch-edge')
      .data(validLinks).enter().append('line')
      .attr('class', 'sch-edge')
      .attr('stroke', d => (LINK_STYLES[d.type] || LINK_STYLES.influence).color)
      .attr('stroke-width', d => (LINK_STYLES[d.type] || LINK_STYLES.influence).width)
      .attr('stroke-dasharray', d => (LINK_STYLES[d.type] || LINK_STYLES.influence).dash)
      .attr('stroke-opacity', 0.5)
      .attr('marker-end', d => {
        const st = LINK_STYLES[d.type];
        return st && st.arrow ? `url(#sch-arrow-${d.type})` : null;
      });
    linkGRef.current = linkSel;

    // Node groups
    const nodeG = g.selectAll('.sch-node')
      .data(nodes).enter().append('g')
      .attr('class', 'sch-node')
      .attr('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      );
    nodeGRef.current = nodeG;

    // Circle — radius based on link count
    nodeG.append('circle')
      .attr('class', 'sch-circle')
      .attr('r', d => getRadius(d))
      .attr('fill', d => discColor(d.disc_tr))
      .attr('stroke', '#080c18')
      .attr('stroke-width', 2)
      .attr('opacity', 0.9);

    // Selection ring (hidden by default)
    nodeG.append('circle')
      .attr('class', 'sel-ring')
      .attr('r', d => getRadius(d) + 3)
      .attr('fill', 'none')
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .attr('opacity', 0);

    // Name text
    nodeG.append('text')
      .attr('class', 'sch-name')
      .attr('text-anchor', 'middle')
      .attr('dy', -2)
      .attr('fill', '#fff')
      .attr('font-size', '8px')
      .attr('font-family', 'Outfit')
      .attr('font-weight', '600')
      .attr('pointer-events', 'none')
      .text(d => {
        const name = lang === 'tr' ? d.tr : d.en;
        return name.length > 10 ? name.slice(0, 9) + '…' : name;
      });

    // Dates text
    nodeG.append('text')
      .attr('class', 'sch-dates')
      .attr('text-anchor', 'middle')
      .attr('dy', 8)
      .attr('fill', '#ffffffaa')
      .attr('font-size', '7px')
      .attr('font-family', 'Outfit')
      .attr('pointer-events', 'none')
      .text(d => `${d.b}–${d.d > 2024 ? '?' : d.d}`);

    // Click handler
    nodeG.on('click', (ev, d) => {
      ev.stopPropagation();
      onSelect(d.id);
    });

    // Hover → set React state for mini card
    nodeG.on('mouseover', (event, d) => {
      setHovered(d);
      setHoverPos({ x: event.offsetX + 14, y: event.offsetY - 14 });
    })
    .on('mousemove', (event) => {
      setHoverPos({ x: event.offsetX + 14, y: event.offsetY - 14 });
    })
    .on('mouseout', () => setHovered(null));

    // Highlight searched node
    if (searchId) {
      const searchNode = nodes.find(n => n.id === searchId);
      if (searchNode) {
        const tx = W/2 - searchNode.x;
        const ty = H/2 - searchNode.y;
        svg.transition().duration(750)
          .call(zoom.transform, d3.zoomIdentity.translate(tx, ty));
      }
    }

    sim.on('tick', () => {
      linkSel
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      nodeG.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    svg.on('click', () => onSelect(null));

    return () => sim.stop();
  }, [scholars, links, lang, searchId, onSelect, t, rScale, getRadius]);

  // ═══ SELECTION HIGHLIGHT EFFECT ═══
  useEffect(() => {
    const nodeG = nodeGRef.current;
    const linkSel = linkGRef.current;
    if (!nodeG || !linkSel) return;

    // Selection ring
    nodeG.select('.sel-ring')
      .attr('opacity', d => d.id === selected ? 1 : 0);

    // Node opacity based on neighbor status
    nodeG.select('.sch-circle')
      .transition().duration(200)
      .attr('opacity', d => {
        if (!selected) return 0.9;
        if (neighborIds && neighborIds.has(d.id)) return 1.0;
        return 0.15;
      })
      .attr('stroke', d => {
        if (selected && neighborIds && neighborIds.has(d.id) && d.id !== selected) {
          return discColor(d.disc_tr);
        }
        return '#080c18';
      })
      .attr('stroke-width', d => {
        if (selected && neighborIds && neighborIds.has(d.id) && d.id !== selected) return 2.5;
        return 2;
      });

    nodeG.select('.sch-name')
      .transition().duration(200)
      .attr('opacity', d => {
        if (!selected) return 1;
        return (neighborIds && neighborIds.has(d.id)) ? 1 : 0.1;
      });

    nodeG.select('.sch-dates')
      .transition().duration(200)
      .attr('opacity', d => {
        if (!selected) return 1;
        return (neighborIds && neighborIds.has(d.id)) ? 1 : 0.1;
      });

    // Link opacity
    linkSel.transition().duration(200)
      .attr('stroke-opacity', l => {
        if (!selected) return 0.5;
        const src = typeof l.source === 'object' ? l.source.id : l.source;
        const tgt = typeof l.target === 'object' ? l.target.id : l.target;
        return (src === selected || tgt === selected) ? 0.9 : 0.05;
      })
      .attr('stroke-width', l => {
        if (!selected) return (LINK_STYLES[l.type] || LINK_STYLES.influence).width;
        const src = typeof l.source === 'object' ? l.source.id : l.source;
        const tgt = typeof l.target === 'object' ? l.target.id : l.target;
        return (src === selected || tgt === selected) ? 3 : (LINK_STYLES[l.type] || LINK_STYLES.influence).width;
      });

  }, [selected, neighborIds]);

  return (
    <div className="scholar-graph" ref={wrapRef} style={{ position: 'relative' }}>
      <svg ref={svgRef} />

      {/* ═══ HOVER MINI CARD ═══ */}
      {hovered && (
        <div className="scholar-hover-card" style={{
          position: 'absolute',
          left: hoverPos.x, top: hoverPos.y,
          background: '#1f2937',
          border: `1px solid ${DISC_COLORS[hovered.disc_tr] || '#c9a84c'}`,
          borderRadius: 8,
          padding: '10px 14px',
          minWidth: 200, maxWidth: 280,
          pointerEvents: 'none',
          zIndex: 100,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          {/* Discipline badge */}
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
            <span style={{
              background: DISC_COLORS[hovered.disc_tr] || '#c9a84c',
              color:'#fff', fontSize:10, fontWeight:700,
              padding:'2px 7px', borderRadius:10
            }}>{hovered.disc_tr || hovered.disc_en}</span>
          </div>
          {/* Name */}
          <div style={{ fontSize:15, fontWeight:700, color:'#f3f4f6', marginBottom:2 }}>
            {hovered.tr}
          </div>
          <div style={{ fontSize:12, color:'#9ca3af', marginBottom:6 }}>
            {hovered.en}
          </div>
          {/* Dates & City */}
          <div style={{ fontSize:12, color:'#6b7280', marginBottom:6 }}>
            {hovered.b && hovered.d ? `${hovered.b} – ${hovered.d > 2024 ? '?' : hovered.d}` : ''}
            {hovered.city_tr ? `  ·  ${hovered.city_tr}` : ''}
          </div>
          {/* Link count */}
          <div style={{ fontSize:11, color:'#9ca3af', marginBottom:4 }}>
            🔗 {linkCount[hovered.id] || 0} {lang === 'tr' ? 'bağlantı' : 'connections'}
          </div>
          {/* Works */}
          {hovered.works_tr && (
            <div style={{ fontSize:11, color:'#d1d5db', borderTop:'1px solid #374151', paddingTop:6, marginTop:4 }}>
              <span style={{ color:'#9ca3af', fontSize:10 }}>{lang === 'tr' ? 'Başlıca Eserler: ' : 'Major Works: '}</span>
              {hovered.works_tr.split(',')[0].trim()}
              {hovered.works_tr.split(',').length > 1 ? ', ...' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
