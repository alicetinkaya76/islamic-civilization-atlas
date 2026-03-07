import { useEffect, useRef, useMemo } from 'react';
import { select, scaleSqrt, zoom, zoomIdentity, forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY, drag } from 'd3';
import SCHOLAR_LINKS from '../../data/scholar_links';
import ISNAD_CHAINS from '../../data/isnad_chains';

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
  isnad:     { color:'#FFD700', width:3,   dash:'',     arrow:true  },
};

const RAWI_COLORS = {
  sahabi:     '#FFD700',
  tabii:      '#16A34A',
  tebe_tabii: '#2563EB',
  atba:       '#7C3AED',
  muellif:    '#DC2626',
};

const CRITICAL_IDS = new Set([7, 10, 18, 5, 2, 3, 23]);

const GROUP_X = {
  'Fıkıh': 0.3, 'Hadis': 0.3, 'Tefsir': 0.3, 'Kelam': 0.3,
  'Tasavvuf': 0.5, 'Dil & Edebiyat': 0.5,
  'Tıp': 0.7, 'Matematik & Astronomi': 0.7, 'Coğrafya & Seyahat': 0.7,
  'Tarih': 0.6, 'Kıraat': 0.6, 'Mimari & Sanat': 0.6,
  'Çağdaş İslam Düşüncesi': 0.5,
};

/* School-based x positioning for isnad mode */
const SCHOOL_X = {
  'Medine': 0.2, 'Medina': 0.2,
  'Mekke': 0.8, 'Mecca': 0.8,
  'Kûfe': 0.45, 'Kufa': 0.45,
  'Basra': 0.65,
};
function getSchoolX(city) {
  if (!city) return 0.5;
  for (const [k, v] of Object.entries(SCHOOL_X)) {
    if (city.includes(k)) return v;
  }
  return 0.5;
}

// Pre-compute link counts
const linkCount = {};
SCHOLAR_LINKS.forEach(l => {
  linkCount[l.source] = (linkCount[l.source] || 0) + 1;
  linkCount[l.target] = (linkCount[l.target] || 0) + 1;
});
const maxLinks = Math.max(1, ...Object.values(linkCount));

// Pre-compute chain membership
const chainMembershipMap = {};
ISNAD_CHAINS.forEach(ch => {
  ch.links.forEach(l => {
    if (!chainMembershipMap[l.from]) chainMembershipMap[l.from] = new Set();
    if (!chainMembershipMap[l.to]) chainMembershipMap[l.to] = new Set();
    chainMembershipMap[l.from].add(ch.id);
    chainMembershipMap[l.to].add(ch.id);
  });
});

// Pre-compute chain link set for fast lookup
const chainLinkSet = new Set();
ISNAD_CHAINS.forEach(ch => {
  ch.links.forEach(l => chainLinkSet.add(`${l.from}-${l.to}`));
});

export { DISC_COLORS };

export default function ScholarNetwork({ scholars, links, lang, selected, onSelect, searchId, t, isnadMode, activeChains }) {
  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const simRef = useRef(null);
  const nodeGRef = useRef(null);
  const linkGRef = useRef(null);
  const tipRef = useRef(null);

  const rScale = useMemo(() =>
    scaleSqrt().domain([0, maxLinks]).range([12, 28]),
  []);
  const getRadius = (s) => rScale(linkCount[s.id] || 0);

  // Full chain computation for silsile highlight
  const { upChain, downChain, allChainIds } = useMemo(() => {
    if (!selected) return { upChain: [], downChain: [], allChainIds: null };
    function getChain(id, direction, depth = 0, maxDepth = 5, visited = new Set()) {
      if (depth >= maxDepth || visited.has(id)) return [];
      visited.add(id);
      const result = [];
      SCHOLAR_LINKS.forEach(l => {
        const src = typeof l.source === 'object' ? l.source.id : l.source;
        const tgt = typeof l.target === 'object' ? l.target.id : l.target;
        if (direction === 'up' && tgt === id && (l.type === 'teacher' || l.type === 'isnad')) {
          result.push({ id: src, depth: depth + 1 });
          result.push(...getChain(src, 'up', depth + 1, maxDepth, visited));
        }
        if (direction === 'down' && src === id && (l.type === 'teacher' || l.type === 'isnad')) {
          result.push({ id: tgt, depth: depth + 1 });
          result.push(...getChain(tgt, 'down', depth + 1, maxDepth, visited));
        }
      });
      return result;
    }
    const up = getChain(selected, 'up');
    const down = getChain(selected, 'down');
    const ids = new Set([selected]);
    up.forEach(n => ids.add(n.id));
    down.forEach(n => ids.add(n.id));
    return { upChain: up, downChain: down, allChainIds: ids };
  }, [selected]);

  // Active chain IDs for highlighting
  const highlightChainNodeIds = useMemo(() => {
    if (!activeChains || activeChains.size === 0) return null;
    const ids = new Set();
    ISNAD_CHAINS.forEach(ch => {
      if (activeChains.has(ch.id)) {
        ch.links.forEach(l => { ids.add(l.from); ids.add(l.to); });
      }
    });
    return ids;
  }, [activeChains]);

  const highlightChainLinkKeys = useMemo(() => {
    if (!activeChains || activeChains.size === 0) return null;
    const keys = new Set();
    ISNAD_CHAINS.forEach(ch => {
      if (activeChains.has(ch.id)) {
        ch.links.forEach(l => keys.add(`${l.from}-${l.to}`));
      }
    });
    return keys;
  }, [activeChains]);

  useEffect(() => {
    if (!svgRef.current || !wrapRef.current) return;
    const wrap = wrapRef.current;
    const W = wrap.clientWidth || 800;
    const H = Math.max(wrap.clientHeight || 500, 400);
    const svg = select(svgRef.current);
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
    const zoomBehavior = zoom().scaleExtent([0.15, 4]).on('zoom', e => g.attr('transform', e.transform));
    svg.call(zoomBehavior);

    // Arrow markers
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

    // Glow filter for golden chain links
    const glowF = defs.append('filter').attr('id', 'isnad-glow')
      .attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    glowF.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    const glowM = glowF.append('feMerge');
    glowM.append('feMergeNode').attr('in', 'blur');
    glowM.append('feMergeNode').attr('in', 'SourceGraphic');

    const idSet = new Set(scholars.map(s => s.id));
    const validLinks = links
      .filter(l => idSet.has(l.source) && idSet.has(l.target))
      .map(l => ({ ...l }));

    const nodes = scholars.map(s => ({ ...s }));

    // ═══ FORCE SIMULATION — different for isnad mode ═══
    const sim = forceSimulation(nodes);

    if (isnadMode) {
      // Tabaka-based Y, School-based X
      const tabakaY = (tab) => {
        if (!tab) return H * 0.5;
        // Map tabaka 1-12 to Y positions
        return 60 + ((tab - 1) / 11) * (H - 120);
      };
      sim
        .force('link', forceLink(validLinks).id(d => d.id).distance(80).strength(0.3))
        .force('charge', forceManyBody().strength(-200))
        .force('y', forceY(d => tabakaY(d.tabaqa || 6)).strength(0.6))
        .force('x', forceX(d => getSchoolX(d.city_tr) * W).strength(0.15))
        .force('collision', forceCollide(d => (d.rawi_tag ? getRadius(d) + 4 : 10)));

      // Tabaka labels on left side
      const tabakaLabels = [
        { t: 1, tr: 'Sahâbe', en: 'Companions' },
        { t: 3, tr: 'Tâbiîn', en: 'Successors' },
        { t: 6, tr: "Tebe-i Tâbiîn", en: 'Successors of Successors' },
        { t: 9, tr: 'Atbâ', en: 'Followers' },
        { t: 11, tr: 'Müellifler', en: 'Authors' },
      ];
      tabakaLabels.forEach(tl => {
        const ly = tabakaY(tl.t);
        g.append('line').attr('x1', 0).attr('x2', W).attr('y1', ly - 20).attr('y2', ly - 20)
          .attr('stroke', '#1f2937').attr('stroke-width', 1).attr('stroke-dasharray', '4,4');
        g.append('text').attr('x', 8).attr('y', ly - 6)
          .attr('fill', '#4b5563').attr('font-size', '10px').attr('font-family', 'Outfit')
          .attr('font-weight', '600').text(lang === 'tr' ? tl.tr : tl.en);
      });

      // School labels on top
      const schools = [
        { x: 0.2, tr: 'Medine', en: 'Medina' },
        { x: 0.45, tr: 'Kûfe', en: 'Kufa' },
        { x: 0.65, tr: 'Basra', en: 'Basra' },
        { x: 0.8, tr: 'Mekke', en: 'Mecca' },
      ];
      schools.forEach(sc => {
        g.append('text').attr('x', sc.x * W).attr('y', 20)
          .attr('text-anchor', 'middle').attr('fill', '#6b7280')
          .attr('font-size', '11px').attr('font-family', 'Outfit')
          .attr('font-weight', '600').text(lang === 'tr' ? sc.tr : sc.en);
      });
    } else {
      sim
        .force('link', forceLink(validLinks).id(d => d.id).distance(130))
        .force('charge', forceManyBody().strength(-450))
        .force('center', forceCenter(W/2, H/2).strength(0.08))
        .force('collision', forceCollide(d => getRadius(d) + 6))
        .force('groupX', forceX(d => (GROUP_X[d.disc_tr] || 0.5) * W).strength(0.04))
        .force('groupY', forceY(H/2).strength(0.02));
    }
    simRef.current = sim;

    // ═══ EDGES ═══
    const linkSel = g.selectAll('.sch-edge')
      .data(validLinks).enter().append('line')
      .attr('class', 'sch-edge')
      .attr('stroke', d => {
        if (isnadMode && d.type === 'isnad') {
          // Check if this link is part of an active chain
          const key = `${typeof d.source === 'object' ? d.source.id : d.source}-${typeof d.target === 'object' ? d.target.id : d.target}`;
          if (highlightChainLinkKeys && highlightChainLinkKeys.has(key)) {
            // Find which chain and use its color
            for (const ch of ISNAD_CHAINS) {
              if (activeChains && activeChains.has(ch.id) && ch.links.some(l => `${l.from}-${l.to}` === key)) {
                return ch.color;
              }
            }
          }
          return '#FFD700';
        }
        return (LINK_STYLES[d.type] || LINK_STYLES.influence).color;
      })
      .attr('stroke-width', d => {
        if (isnadMode && d.type === 'isnad') return highlightChainLinkKeys ? 4 : 3;
        if (isnadMode) return 0.5; // dim non-isnad links
        return (LINK_STYLES[d.type] || LINK_STYLES.influence).width;
      })
      .attr('stroke-dasharray', d => (LINK_STYLES[d.type] || LINK_STYLES.influence).dash)
      .attr('stroke-opacity', d => {
        if (isnadMode) return d.type === 'isnad' ? 0.8 : 0.08;
        return 0.5;
      })
      .attr('marker-end', d => {
        const st = LINK_STYLES[d.type];
        return st && st.arrow ? `url(#sch-arrow-${d.type})` : null;
      });

    // Apply glow to golden chain links in isnad mode
    if (isnadMode) {
      linkSel.filter(d => d.type === 'isnad' && chainLinkSet.has(
        `${typeof d.source === 'object' ? d.source.id : d.source}-${typeof d.target === 'object' ? d.target.id : d.target}`
      )).attr('filter', 'url(#isnad-glow)');
    }

    linkGRef.current = linkSel;

    // ═══ NODES ═══
    const nodeG = g.selectAll('.sch-node')
      .data(nodes).enter().append('g')
      .attr('class', 'sch-node')
      .attr('cursor', 'pointer')
      .call(drag()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      );
    nodeGRef.current = nodeG;

    // Circle
    nodeG.append('circle')
      .attr('class', 'sch-circle')
      .attr('r', d => {
        if (isnadMode && d.rawi_tag === 'sahabi') return getRadius(d) * 1.3;
        return getRadius(d);
      })
      .attr('fill', d => {
        if (isnadMode && d.rawi_tag) return RAWI_COLORS[d.rawi_tag] || discColor(d.disc_tr);
        return discColor(d.disc_tr);
      })
      .attr('stroke', d => {
        if (isnadMode && d.rawi_tag === 'sahabi') return '#FFD700';
        return '#080c18';
      })
      .attr('stroke-width', d => isnadMode && d.rawi_tag === 'sahabi' ? 3 : 2)
      .attr('opacity', d => {
        if (isnadMode && !d.rawi_tag) return 0.08;
        return 0.9;
      });

    // Selection ring
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
      .attr('font-size', d => isnadMode && d.rawi_tag ? '9px' : '8px')
      .attr('font-family', 'Outfit')
      .attr('font-weight', '600')
      .attr('pointer-events', 'none')
      .attr('opacity', d => isnadMode && !d.rawi_tag ? 0.05 : 1)
      .text(d => {
        const name = lang === 'tr' ? d.tr : d.en;
        const max = isnadMode ? 14 : 10;
        return name.length > max ? name.slice(0, max - 1) + '…' : name;
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
      .attr('opacity', d => isnadMode && !d.rawi_tag ? 0.05 : 1)
      .text(d => `${d.b}–${d.d > 2024 ? '?' : d.d}`);

    // Click
    nodeG.on('click', (ev, d) => { ev.stopPropagation(); onSelect(d.id); });

    // Hover tooltip — pure DOM
    nodeG.on('mouseover', function(event, d) {
      const tipEl = tipRef.current;
      if (!tipEl) return;
      const disc = d.disc_tr || d.disc_en || '';
      const dColor = isnadMode && d.rawi_tag ? (RAWI_COLORS[d.rawi_tag] || '#c9a84c') : (DISC_COLORS[disc] || '#c9a84c');
      const nm_tr = d.tr || '';
      const nm_en = d.en || '';
      const dates = d.b && d.d ? `${d.b} – ${d.d > 2024 ? '?' : d.d}` : '';
      const city = d.city_tr ? ` · ${d.city_tr}` : '';
      const lc = linkCount[d.id] || 0;
      const lcLabel = lang === 'tr' ? 'bağlantı' : 'connections';

      let html =
        `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">` +
          `<span style="background:${dColor};color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px">${disc}</span>` +
        `</div>` +
        `<div style="font-size:15px;font-weight:700;color:#f3f4f6;margin-bottom:2px">${nm_tr}</div>` +
        `<div style="font-size:12px;color:#9ca3af;margin-bottom:6px">${nm_en}</div>` +
        `<div style="font-size:12px;color:#6b7280;margin-bottom:6px">${dates}${city}</div>` +
        `<div style="font-size:11px;color:#9ca3af;margin-bottom:4px">🔗 ${lc} ${lcLabel}</div>`;

      // İsnâd-specific tooltip info
      if (d.rawi_tag) {
        const tabLabel = lang === 'tr' ? (d.tabaqa_tr || '') : (d.tabaqa_en || '');
        const rankLabel = lang === 'tr' ? (d.rawi_rank_tr || '') : (d.rawi_rank_en || '');
        html += `<div style="border-top:1px solid #374151;padding-top:6px;margin-top:4px">`;
        html += `<div style="font-size:10px;color:#9ca3af;margin-bottom:2px">📿 ${lang === 'tr' ? 'Tabaka' : 'Layer'}: <span style="color:${dColor};font-weight:600">${tabLabel}${d.tabaqa ? ' ('+d.tabaqa+')' : ''}</span></div>`;
        html += `<div style="font-size:10px;color:#9ca3af;margin-bottom:2px">⚖ ${lang === 'tr' ? 'Derece' : 'Grade'}: <span style="color:#d1d5db">${rankLabel}</span></div>`;
        if (d.hadith_count > 0) {
          html += `<div style="font-size:10px;color:#9ca3af">📜 ~${d.hadith_count.toLocaleString()} ${lang === 'tr' ? 'rivâyet' : 'narrations'}</div>`;
        }
        // Chains
        const myCh = chainMembershipMap[d.id];
        if (myCh && myCh.size > 0) {
          html += `<div style="font-size:10px;color:#9ca3af;margin-top:4px">📿 ${lang === 'tr' ? 'Zincirler' : 'Chains'}: `;
          const names = [];
          ISNAD_CHAINS.forEach(ch => { if (myCh.has(ch.id)) names.push(`<span style="color:${ch.color}">${lang === 'tr' ? ch.name_tr.split('(')[0].trim() : ch.name_en.split('(')[0].trim()}</span>`); });
          html += names.join(', ') + `</div>`;
        }
        html += `</div>`;
      }

      tipEl.innerHTML = html;
      tipEl.style.borderColor = dColor;
      tipEl.style.left = (event.pageX + 14) + 'px';
      tipEl.style.top = (event.pageY - 14) + 'px';
      tipEl.style.display = 'block';
    })
    .on('mousemove', function(event) {
      const tipEl = tipRef.current;
      if (tipEl) { tipEl.style.left = (event.pageX + 14) + 'px'; tipEl.style.top = (event.pageY - 14) + 'px'; }
    })
    .on('mouseout', function() {
      const tipEl = tipRef.current;
      if (tipEl) tipEl.style.display = 'none';
    });

    // Center on search
    if (searchId) {
      const searchNode = nodes.find(n => n.id === searchId);
      if (searchNode) {
        svg.transition().duration(750)
          .call(zoomBehavior.transform, zoomIdentity.translate(W/2 - (searchNode.x||0), H/2 - (searchNode.y||0)));
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
  }, [scholars, links, lang, searchId, onSelect, t, rScale, getRadius, isnadMode, activeChains, highlightChainLinkKeys]);

  // ═══ SELECTION + CHAIN HIGHLIGHT EFFECT ═══
  useEffect(() => {
    const nodeG = nodeGRef.current;
    const linkSel = linkGRef.current;
    if (!nodeG || !linkSel) return;

    const upMap = new Map();
    const downMap = new Map();
    if (upChain) upChain.forEach(n => { if (!upMap.has(n.id)) upMap.set(n.id, n.depth); });
    if (downChain) downChain.forEach(n => { if (!downMap.has(n.id)) downMap.set(n.id, n.depth); });

    const hasChainHighlight = highlightChainNodeIds && highlightChainNodeIds.size > 0;
    const hasSelection = selected != null;

    // Selection ring
    nodeG.select('.sel-ring').attr('opacity', d => d.id === selected ? 1 : 0);

    // Node opacity
    nodeG.select('.sch-circle')
      .transition().duration(200)
      .attr('opacity', d => {
        if (isnadMode && !d.rawi_tag) return 0.05;
        if (hasSelection && allChainIds) return allChainIds.has(d.id) ? 1.0 : 0.1;
        if (hasChainHighlight) return highlightChainNodeIds.has(d.id) ? 1.0 : 0.12;
        return 0.9;
      })
      .attr('stroke', d => {
        if (!hasSelection) return isnadMode && d.rawi_tag === 'sahabi' ? '#FFD700' : '#080c18';
        if (d.id === selected) return '#fff';
        if (upMap.has(d.id)) return '#ef4444';
        if (downMap.has(d.id)) return '#3b82f6';
        return '#080c18';
      })
      .attr('stroke-width', d => {
        if (!hasSelection) return isnadMode && d.rawi_tag === 'sahabi' ? 3 : 2;
        if (d.id === selected) return 3;
        const upD = upMap.get(d.id);
        const downD = downMap.get(d.id);
        if (upD !== undefined) return Math.max(1.5, 3.5 - upD * 0.5);
        if (downD !== undefined) return Math.max(1.5, 3.5 - downD * 0.5);
        return 2;
      });

    nodeG.select('.sch-name')
      .transition().duration(200)
      .attr('opacity', d => {
        if (isnadMode && !d.rawi_tag) return 0.05;
        if (hasSelection && allChainIds) return allChainIds.has(d.id) ? 1 : 0.1;
        if (hasChainHighlight) return highlightChainNodeIds.has(d.id) ? 1 : 0.1;
        return 1;
      });

    nodeG.select('.sch-dates')
      .transition().duration(200)
      .attr('opacity', d => {
        if (isnadMode && !d.rawi_tag) return 0.05;
        if (hasSelection && allChainIds) return allChainIds.has(d.id) ? 1 : 0.1;
        if (hasChainHighlight) return highlightChainNodeIds.has(d.id) ? 1 : 0.1;
        return 1;
      });

    // Link highlight
    linkSel.transition().duration(200)
      .attr('stroke-opacity', l => {
        const src = typeof l.source === 'object' ? l.source.id : l.source;
        const tgt = typeof l.target === 'object' ? l.target.id : l.target;
        if (hasSelection && allChainIds) {
          return (allChainIds.has(src) && allChainIds.has(tgt)) ? 0.9 : 0.03;
        }
        if (hasChainHighlight) {
          const key = `${src}-${tgt}`;
          return highlightChainLinkKeys && highlightChainLinkKeys.has(key) ? 0.9 : 0.06;
        }
        if (isnadMode) return l.type === 'isnad' ? 0.8 : 0.08;
        return 0.5;
      })
      .attr('stroke-width', l => {
        const src = typeof l.source === 'object' ? l.source.id : l.source;
        const tgt = typeof l.target === 'object' ? l.target.id : l.target;
        if (hasSelection && allChainIds && allChainIds.has(src) && allChainIds.has(tgt)) return 3.5;
        if (hasChainHighlight && highlightChainLinkKeys) {
          const key = `${src}-${tgt}`;
          if (highlightChainLinkKeys.has(key)) return 5;
        }
        if (isnadMode && l.type === 'isnad') return 3;
        if (isnadMode) return 0.5;
        return (LINK_STYLES[l.type] || LINK_STYLES.influence).width;
      })
      .attr('stroke', l => {
        const src = typeof l.source === 'object' ? l.source.id : l.source;
        const tgt = typeof l.target === 'object' ? l.target.id : l.target;
        if (hasSelection && allChainIds && allChainIds.has(src) && allChainIds.has(tgt)) {
          if (l.type === 'teacher' || l.type === 'isnad') {
            if (upMap.has(src) || src === selected) return '#ef4444';
            if (downMap.has(tgt) || tgt === selected) return '#3b82f6';
          }
        }
        if (hasChainHighlight && highlightChainLinkKeys) {
          const key = `${src}-${tgt}`;
          if (highlightChainLinkKeys.has(key)) {
            for (const ch of ISNAD_CHAINS) {
              if (activeChains && activeChains.has(ch.id) && ch.links.some(cl => `${cl.from}-${cl.to}` === key)) return ch.color;
            }
            return '#FFD700';
          }
        }
        return (LINK_STYLES[l.type] || LINK_STYLES.influence).color;
      });

  }, [selected, upChain, downChain, allChainIds, isnadMode, highlightChainNodeIds, highlightChainLinkKeys, activeChains]);

  return (
    <div className="scholar-graph" ref={wrapRef} style={{ position: 'relative' }}>
      <svg ref={svgRef} />
      <div ref={tipRef} style={{
        display: 'none',
        position: 'fixed',
        background: '#1f2937',
        border: '1px solid #c9a84c',
        borderRadius: 8,
        padding: '10px 14px',
        minWidth: 200, maxWidth: 300,
        pointerEvents: 'none',
        zIndex: 9999,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }} />
    </div>
  );
}
