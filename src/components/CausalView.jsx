import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import DB from '../data/db.json';
import { REL_C, ZONE_C, n } from '../data/constants';

const LINK_COL = {
  succession:'#4ade80', conquest:'#dc2626', division:'#a78bfa',
  patronage:'#fbbf24', cultural:'#60a5fa', expansion:'#f97316',
  foundation:'#22d3ee', influence:'#34d399', rivalry:'#f87171',
  alliance:'#c9a84c', decline:'#94a3b8', crisis:'#ef4444',
  collapse:'#7f1d1d', trigger:'#fb923c', defeat:'#991b1b',
  reform:'#2dd4bf', creation:'#818cf8', economic:'#fde68a',
  diplomatic:'#c084fc', control:'#6b7280', context:'#475569',
  coup:'#be123c', delegation:'#78716c', flight:'#d97706',
};

const ENTITY_ICON = {
  dynasty:'👑', battle:'⚔', event:'📜', scholar:'📚',
  monument:'🕌', trade_route:'🛤', diplomacy:'🤝',
};

export default function CausalView({ lang, t }) {
  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const [filterEntity, setFilterEntity] = useState('');
  const [filterLink, setFilterLink] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  /* build name lookup */
  const nameMap = useMemo(() => {
    const m = {};
    DB.dynasties.forEach(d => { m[`dynasty:${d.id}`] = n(d,lang); });
    DB.battles.forEach(b => { m[`battle:${b.id}`] = n(b,lang); });
    DB.events.forEach(e => { m[`event:${e.id}`] = n(e,lang); });
    DB.scholars.forEach(s => { m[`scholar:${s.id}`] = n(s,lang); });
    DB.monuments.forEach(mon => { m[`monument:${mon.id}`] = n(mon,lang); });
    return m;
  }, [lang]);

  /* filtered links */
  const links = useMemo(() => {
    let arr = DB.causal || [];
    if (filterEntity) arr = arr.filter(c => c.st === filterEntity || c.tt === filterEntity);
    if (filterLink) arr = arr.filter(c => c.lt === filterLink);
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(c => {
        const sn = nameMap[`${c.st}:${c.si}`] || '';
        const tn = nameMap[`${c.tt}:${c.ti}`] || '';
        const desc = lang === 'tr' ? c.dtr : c.den;
        return sn.toLowerCase().includes(q) || tn.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
      });
    }
    return arr;
  }, [filterEntity, filterLink, search, nameMap, lang]);

  /* unique link types for filter */
  const linkTypes = useMemo(() => [...new Set((DB.causal||[]).map(c=>c.lt))].sort(), []);
  const entityTypes = useMemo(() => [...new Set((DB.causal||[]).flatMap(c=>[c.st,c.tt]))].sort(), []);

  /* build graph nodes/edges for d3 force */
  const graphData = useMemo(() => {
    const nodeSet = new Set();
    links.forEach(l => {
      nodeSet.add(`${l.st}:${l.si}`);
      nodeSet.add(`${l.tt}:${l.ti}`);
    });
    const nodes = [...nodeSet].map(key => {
      const [type, id] = key.split(':');
      return { id: key, type, label: nameMap[key] || `${type}#${id}` };
    });
    const edges = links.map((l,i) => ({
      source: `${l.st}:${l.si}`,
      target: `${l.tt}:${l.ti}`,
      lt: l.lt,
      dtr: l.dtr,
      den: l.den,
      idx: i
    }));
    return { nodes, edges };
  }, [links, nameMap]);

  /* D3 Force graph */
  useEffect(() => {
    if (!svgRef.current || !wrapRef.current) return;
    const wrap = wrapRef.current;
    const W = wrap.clientWidth, H = wrap.clientHeight || 600;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', W).attr('height', H);

    if (graphData.nodes.length === 0) {
      svg.append('text').attr('x', W/2).attr('y', H/2)
        .attr('text-anchor','middle').attr('fill','#6b6b7b')
        .attr('font-size','14px').text(lang==='tr'?'Sonuç bulunamadı':'No results found');
      return;
    }

    const g = svg.append('g');

    // Zoom
    const zoom = d3.zoom().scaleExtent([0.2,4]).on('zoom', e => g.attr('transform', e.transform));
    svg.call(zoom);

    // Arrow markers
    const markerTypes = [...new Set(graphData.edges.map(e=>e.lt))];
    markerTypes.forEach(lt => {
      svg.append('defs').append('marker')
        .attr('id', `arrow-${lt}`)
        .attr('viewBox','0 0 10 10').attr('refX',22).attr('refY',5)
        .attr('markerWidth',6).attr('markerHeight',6).attr('orient','auto')
        .append('path').attr('d','M0,0 L10,5 L0,10 Z')
        .attr('fill', LINK_COL[lt]||'#c9a84c');
    });

    const sim = d3.forceSimulation(graphData.nodes)
      .force('link', d3.forceLink(graphData.edges).id(d=>d.id).distance(90))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(W/2, H/2))
      .force('collision', d3.forceCollide(25));

    // Edges
    const link = g.selectAll('.cl-edge')
      .data(graphData.edges).enter().append('line')
      .attr('class','cl-edge')
      .attr('stroke', d => LINK_COL[d.lt]||'#c9a84c')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.5)
      .attr('marker-end', d => `url(#arrow-${d.lt})`);

    // Nodes
    const nodeG = g.selectAll('.cl-node')
      .data(graphData.nodes).enter().append('g')
      .attr('class','cl-node')
      .attr('cursor','pointer')
      .call(d3.drag()
        .on('start', (e,d) => { if(!e.active) sim.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y; })
        .on('drag', (e,d) => { d.fx=e.x; d.fy=e.y; })
        .on('end', (e,d) => { if(!e.active) sim.alphaTarget(0); d.fx=null; d.fy=null; })
      );

    const nodeColorMap = {
      dynasty:'#c9a84c', battle:'#dc2626', event:'#60a5fa',
      scholar:'#34d399', monument:'#fbbf24', trade_route:'#c9a84c', diplomacy:'#c084fc'
    };

    nodeG.append('circle')
      .attr('r', d => d.type==='dynasty' ? 10 : 7)
      .attr('fill', d => nodeColorMap[d.type]||'#64748b')
      .attr('stroke','#080c18').attr('stroke-width',1.5);

    nodeG.append('text')
      .attr('dx', 14).attr('dy', 4)
      .attr('fill','#c4b89a').attr('font-size','9px')
      .attr('font-family','Outfit')
      .text(d => d.label.length > 22 ? d.label.slice(0,20)+'…' : d.label);

    // Hover
    nodeG.on('mouseenter', (ev, d) => {
      const relLinks = graphData.edges.filter(e => e.source.id===d.id || e.target.id===d.id);
      const html = `<b>${ENTITY_ICON[d.type]||''} ${d.label}</b><br/>${lang==='tr'?'Bağlantı':'Links'}: ${relLinks.length}`;
      setTooltip({ x: ev.pageX, y: ev.pageY, html });
    }).on('mouseleave', () => setTooltip(null));

    // Edge hover
    link.on('mouseenter', (ev, d) => {
      const desc = lang==='tr' ? d.dtr : d.den;
      const html = `<b>${d.lt}</b><br/>${desc}`;
      setTooltip({ x: ev.pageX, y: ev.pageY, html });
    }).on('mouseleave', () => setTooltip(null));

    sim.on('tick', () => {
      link.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y)
        .attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);
      nodeG.attr('transform', d=>`translate(${d.x},${d.y})`);
    });

    return () => sim.stop();
  }, [graphData, lang]);

  const tl = t.lk || {};

  return (
    <div className="cl-wrap">
      <div className="cl-toolbar">
        <div className="cl-title">
          <span className="cl-h">{tl.title || 'Causality Network'}</span>
          <span className="cl-sub">{links.length} / {(DB.causal||[]).length} {lang==='tr'?'bağlantı':'links'}</span>
        </div>
        <div className="cl-filters">
          <select className="cl-sel" value={filterEntity} onChange={e=>setFilterEntity(e.target.value)}>
            <option value="">{tl.filterEntity||'Entity Type'}: {tl.all||'All'}</option>
            {entityTypes.map(et => (
              <option key={et} value={et}>{ENTITY_ICON[et]||''} {(tl.entities||{})[et]||et}</option>
            ))}
          </select>
          <select className="cl-sel" value={filterLink} onChange={e=>setFilterLink(e.target.value)}>
            <option value="">{tl.linkType||'Link Type'}: {tl.all||'All'}</option>
            {linkTypes.map(lt => (
              <option key={lt} value={lt}>{(tl.types||{})[lt]||lt}</option>
            ))}
          </select>
          <input className="cl-search" type="text" value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder={lang==='tr'?'Ara…':'Search…'} />
        </div>
      </div>
      <div className="cl-content">
        <div className="cl-graph" ref={wrapRef}>
          <svg ref={svgRef} />
        </div>
        <div className="cl-list">
          <div className="cl-list-h">{lang==='tr'?'Bağlantı Listesi':'Link List'}</div>
          <div className="cl-list-scroll">
            {links.slice(0,80).map((l,i) => {
              const sn = nameMap[`${l.st}:${l.si}`] || `${l.st}#${l.si}`;
              const tn = nameMap[`${l.tt}:${l.ti}`] || `${l.tt}#${l.ti}`;
              const desc = lang==='tr' ? l.dtr : l.den;
              return (
                <div key={i} className="cl-item">
                  <div className="cl-item-top">
                    <span className="cl-item-src">{ENTITY_ICON[l.st]||''} {sn}</span>
                    <span className="cl-item-arrow" style={{color:LINK_COL[l.lt]||'#c9a84c'}}>→</span>
                    <span className="cl-item-tgt">{ENTITY_ICON[l.tt]||''} {tn}</span>
                  </div>
                  <div className="cl-item-meta">
                    <span className="cl-item-type" style={{borderColor:LINK_COL[l.lt]||'#c9a84c'}}>
                      {(tl.types||{})[l.lt]||l.lt}
                    </span>
                    <span className="cl-item-desc">{desc}</span>
                  </div>
                </div>
              );
            })}
            {links.length > 80 && <div className="cl-more">{lang==='tr'?`+${links.length-80} daha…`:`+${links.length-80} more…`}</div>}
          </div>
        </div>
      </div>
      {tooltip && (
        <div className="tt" style={{left:tooltip.x+12,top:tooltip.y-10}}
          dangerouslySetInnerHTML={{__html:tooltip.html}} />
      )}
    </div>
  );
}
