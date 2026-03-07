import { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { ERA_BANDS } from '../../config/eras';
import { DISC_COLORS } from './ScholarNetwork';

const discColor = d => DISC_COLORS[d] || '#c9a84c';

const DISC_ORDER = [
  'Fıkıh', 'Hadis', 'Tefsir', 'Kelam', 'Tasavvuf',
  'Tıp', 'Matematik & Astronomi', 'Coğrafya & Seyahat',
  'Tarih', 'Dil & Edebiyat', 'Kıraat', 'Mimari & Sanat',
  'Çağdaş İslam Düşüncesi',
];

const DISC_EN = {
  'Fıkıh':'Islamic Law', 'Hadis':'Hadith', 'Tefsir':'Exegesis',
  'Kelam':'Theology', 'Tasavvuf':'Sufism', 'Tıp':'Medicine',
  'Matematik & Astronomi':'Math & Astronomy', 'Coğrafya & Seyahat':'Geography',
  'Tarih':'History', 'Dil & Edebiyat':'Literature', 'Kıraat':'Quranic Recitation',
  'Mimari & Sanat':'Architecture', 'Çağdaş İslam Düşüncesi':'Modern Thought',
};

const ERA_COLORS = {
  'Râşidîn': '#22c55e', 'Rashidun': '#22c55e',
  'Emevî': '#f59e0b', 'Umayyad': '#f59e0b',
  'Abbâsî': '#3b82f6', 'Abbasid': '#3b82f6',
  'Selçuklu': '#8b5cf6', 'Seljuq': '#8b5cf6',
  'Osmanlı': '#ef4444', 'Ottoman': '#ef4444',
  'Modern': '#6b7280',
};

const IMPORTANCE_3 = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 18, 19, 20, 21,
  25, 34, 44, 47, 48, 109, 110, 140, 141, 209, 212,
  214, 226, 228, 253, 254, 256, 273,
]);

const IMPORTANCE_2 = new Set([
  11, 12, 13, 15, 16, 17, 22, 24, 26, 27, 29, 30,
  32, 35, 36, 37, 38, 39, 40, 41, 42, 43, 45, 46,
  50, 51, 52, 58, 111, 112, 113, 119, 123, 129, 130, 131, 132,
  49, 64, 67, 75, 76, 79, 81, 82, 83, 84, 87, 90, 94,
  97, 98, 99, 100, 102, 103, 104, 136, 142, 145, 157, 158,
  164, 175, 192, 198, 199, 201, 205, 206, 219, 220, 225,
  227, 229, 233, 234, 241, 242, 244,
  255, 257, 258, 259, 260, 261, 262,
  263, 264, 265, 266, 267, 268,
  269, 270, 271, 272, 274, 275,
  276, 277, 278, 279, 280,
]);

const getImportance = (scholar) => {
  if (IMPORTANCE_3.has(scholar.id)) return 3;
  if (IMPORTANCE_2.has(scholar.id)) return 2;
  return 1;
};

const VIS_STYLE = {
  3: { lineWidth: 5, r: 7, fontSize: 12, fontWeight: 700,
       labelColor: '#f3f4f6', lineOpacity: 1.0, glow: true },
  2: { lineWidth: 3, r: 5, fontSize: 10, fontWeight: 600,
       labelColor: '#d1d5db', lineOpacity: 0.85, glow: false },
  1: { lineWidth: 2, r: 4, fontSize: 9,  fontWeight: 400,
       labelColor: '#9ca3af', lineOpacity: 0.7, glow: false },
  0: { lineWidth: 1.5, r: 3, fontSize: 8, fontWeight: 400,
       labelColor: '#6b7280', lineOpacity: 0.5, glow: false },
};

function hideOverlappingLabels(scholars, xScale) {
  const byDisc = {};
  scholars.forEach(s => {
    const disc = s.disc_tr || 'Diğer';
    if (!byDisc[disc]) byDisc[disc] = [];
    byDisc[disc].push(s);
  });
  const hidden = new Set();
  Object.values(byDisc).forEach(group => {
    const sorted = [...group].sort((a, b) => getImportance(b) - getImportance(a));
    const occupied = [];
    sorted.forEach(s => {
      const midX = xScale((s.b + s.d) / 2);
      const name = (s.tr || s.en || '').slice(0, 14);
      const labelWidth = name.length * 5.5 + 4;
      const x1 = midX - 2;
      const x2 = midX + labelWidth;
      const overlaps = occupied.some(o => x1 < o.x2 + 4 && x2 > o.x1 - 4);
      if (overlaps) { hidden.add(s.id); }
      else { occupied.push({ x1, x2 }); }
    });
  });
  return hidden;
}

/* ═══════════════════════════════════════════════════════════
   v4.8.5.1 — TOOLTIP TİTREME KESİN ÇÖZÜM

   Kök neden: setTooltip() → React re-render → DOM güncellenir →
   tarayıcı mouse event chain'i keser → mouseleave tetiklenir →
   tooltip kapanır → mouseenter tekrar tetiklenir → DÖNGÜ.

   Çözüm:
   1. Tooltip = useRef DOM node, HER ZAMAN DOM'da
      (conditional render YOK → DOM insert/remove YOK)
   2. display:none/block ile toggle (React re-render YOK)
   3. Invisible hit rect: fill=#000, fill-opacity=0, pointer-events=all
   4. D3 mouseenter/mouseleave doğrudan <g>'ye bağlı
   ═══════════════════════════════════════════════════════════ */

export default function ScholarTimeline({ scholars, links, lang, selected, onSelect, showLinks }) {
  const svgRef     = useRef(null);
  const wrapRef    = useRef(null);
  const zoomRef    = useRef(null);
  const counterRef = useRef(null);
  const tipRef     = useRef(null); // tooltip div — JSX'te HER ZAMAN render

  const [showHint, setShowHint] = useState(true);

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const d3State = useRef({
    hitZones: [],
    currentHoverId: null,
    gNode: null,
  });

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const resetZoom = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(400)
      .call(zoomRef.current.transform, d3.zoomIdentity.scale(0.85).translate(20, 0));
  }, []);

  /* ═══ MAIN D3 EFFECT ═══ */
  useEffect(() => {
    if (!svgRef.current || !wrapRef.current) return;
    const wrap  = wrapRef.current;
    const svgEl = svgRef.current;
    const tipEl = tipRef.current;
    const W     = wrap.clientWidth || 1000;
    const st    = d3State.current;
    const svg   = d3.select(svgEl);

    const ml = 180, mr = 30, mt = 52, mb = 30;
    const bandH = 42;
    const usedDiscs = DISC_ORDER.filter(d => scholars.some(s => s.disc_tr === d));
    const H = mt + usedDiscs.length * bandH + mb;

    // ── FULL CLEANUP ──
    svg.on('.zoom', null);
    svg.selectAll('*').remove();
    svg.attr('width', W).attr('height', H);
    st.hitZones = [];
    st.currentHoverId = null;
    if (tipEl) tipEl.style.display = 'none';

    const g = svg.append('g');
    st.gNode = g.node();

    /* ── Zoom ── */
    let currentK = 0.85;
    const getMinScore = (k) => k < 1.5 ? 3 : k < 2.5 ? 2 : k < 4.0 ? 1 : 0;

    const zoom = d3.zoom()
      .scaleExtent([0.5, 6])
      .on('zoom', (e) => {
        g.attr('transform', e.transform);
        const newK = e.transform.k;
        const oldMin = getMinScore(currentK);
        const newMin = getMinScore(newK);
        currentK = newK;
        if (counterRef.current) {
          const cnt = scholars.filter(s => getImportance(s) >= newMin).length;
          counterRef.current.textContent = cnt + '/' + scholars.length +
            ' ' + (lang === 'tr' ? 'âlim' : 'scholars');
        }
        if (oldMin !== newMin) renderScholars(newMin);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    const x = d3.scaleLinear().domain([622, 2030]).range([ml, W - mr]);

    /* ── DEFS ── */
    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'teacher-arrow')
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('refX', 5).attr('refY', 3).attr('orient', 'auto')
      .append('path').attr('d', 'M0,0 L6,3 L0,6 Z')
      .attr('fill', '#9ca3af').attr('opacity', 0.7);

    const glowFilter = defs.append('filter').attr('id', 'glow')
      .attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    const glowMerge = glowFilter.append('feMerge');
    glowMerge.append('feMergeNode').attr('in', 'blur');
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    /* ── ERA BANDS ── */
    ERA_BANDS.forEach(([s, e, , labels]) => {
      const eraLabel = labels[lang] || labels.en;
      const eraCol = ERA_COLORS[eraLabel] || ERA_COLORS[labels.en] || '#6b7280';
      g.append('rect').attr('x', x(s)).attr('y', mt - 5)
        .attr('width', x(e) - x(s)).attr('height', H - mt - mb + 10)
        .attr('fill', eraCol).attr('opacity', 0.08);
      g.append('line')
        .attr('x1', x(s)).attr('x2', x(s))
        .attr('y1', mt - 5).attr('y2', H - mb + 5)
        .attr('stroke', eraCol).attr('stroke-width', 1).attr('opacity', 0.3);
      g.append('text').attr('x', x((s + e) / 2)).attr('y', mt - 14)
        .attr('text-anchor', 'middle').attr('fill', eraCol)
        .attr('font-size', '11px').attr('font-family', 'Outfit')
        .attr('font-weight', '600').text(eraLabel);
    });

    /* ── GRID ── */
    for (let yr = 700; yr <= 2000; yr += 100) {
      g.append('line').attr('x1', x(yr)).attr('x2', x(yr))
        .attr('y1', mt - 5).attr('y2', H - mb + 5)
        .attr('stroke', '#1a2030').attr('stroke-width', 0.5);
      g.append('text').attr('x', x(yr)).attr('y', H - mb + 18)
        .attr('text-anchor', 'middle').attr('fill', '#6b6b7b')
        .attr('font-size', '10px').attr('font-family', 'Outfit').text(yr);
    }

    /* ── DISC ROWS ── */
    const discRow = {};
    usedDiscs.forEach((d, i) => { discRow[d] = i; });
    usedDiscs.forEach((disc, i) => {
      const y0 = mt + i * bandH;
      if (i % 2 === 0) {
        g.append('rect').attr('x', ml).attr('y', y0)
          .attr('width', W - ml - mr).attr('height', bandH)
          .attr('fill', '#ffffff').attr('opacity', 0.02);
      }
      g.append('line')
        .attr('x1', ml).attr('x2', W - mr)
        .attr('y1', y0 + bandH).attr('y2', y0 + bandH)
        .attr('stroke', '#1f2937').attr('stroke-width', 1).attr('opacity', 0.5);
      g.append('circle').attr('cx', 14).attr('cy', y0 + bandH / 2)
        .attr('r', 5).attr('fill', discColor(disc));
      g.append('text').attr('x', 26).attr('y', y0 + bandH / 2 + 4)
        .attr('fill', '#c4b89a').attr('font-size', '10.5px').attr('font-family', 'Outfit')
        .attr('font-weight', '500')
        .text(lang === 'tr' ? disc : (DISC_EN[disc] || disc));
    });

    /* ── Layers ── */
    const scholarLayer = g.append('g').attr('class', 'scholar-layer');
    const linkLayer    = g.append('g').attr('class', 'link-layer');

    const scholarById = {};
    scholars.forEach(s => { scholarById[s.id] = { ...s }; });

    /* ── Tooltip helpers — pure DOM, SIFIR React re-render ── */
    function showTip(pageX, pageY, s) {
      if (!tipEl) return;
      const nm   = lang === 'tr' ? s.tr : s.en;
      const city = lang === 'tr' ? (s.city_tr || '') : (s.city_en || '');
      const work = (s.works_tr || '').split(',')[0] || '';
      const badge = IMPORTANCE_3.has(s.id) ? '⭐ ' : '';
      tipEl.innerHTML = `<b>${badge}${nm}</b><br/>${s.b}–${s.d > 2024 ? '?' : s.d}${city ? ' · ' + city : ''}${work ? '<br/>' + work : ''}`;
      tipEl.style.left = (pageX + 12) + 'px';
      tipEl.style.top  = (pageY - 10) + 'px';
      tipEl.style.display = 'block';
    }
    function moveTip(pageX, pageY) {
      if (!tipEl) return;
      tipEl.style.left = (pageX + 12) + 'px';
      tipEl.style.top  = (pageY - 10) + 'px';
    }
    function hideTip() {
      if (tipEl) tipEl.style.display = 'none';
    }
    function clearHighlight() {
      if (st.currentHoverId === null) return;
      const prev = st.hitZones.find(h => h.id === st.currentHoverId);
      if (prev?.lineNode) {
        prev.lineNode.setAttribute('stroke-width', String(prev.isSelected ? prev.sw + 1 : prev.sw));
        prev.lineNode.setAttribute('stroke-opacity', String(prev.isSelected ? 1 : prev.style.lineOpacity));
      }
      st.currentHoverId = null;
    }

    /* ═══ renderScholars ═══ */
    function renderScholars(minScore) {
      scholarLayer.selectAll('*').remove();
      linkLayer.selectAll('*').remove();
      st.hitZones = [];
      st.currentHoverId = null;
      hideTip();

      const vis = scholars.filter(s => getImportance(s) >= minScore);
      const hiddenLabels = hideOverlappingLabels(vis, x);
      const laneSlots = {};
      usedDiscs.forEach(d => { laneSlots[d] = []; });
      const sorted = [...vis].sort((a, b) => a.b - b.b);

      sorted.forEach(s => {
        if (!s.b || !s.d || discRow[s.disc_tr] === undefined) return;
        const row = discRow[s.disc_tr];
        const y0 = mt + row * bandH;
        const xStart = x(Math.max(s.b, 622));
        const xEnd   = x(Math.min(s.d, 2030));

        const slots = laneSlots[s.disc_tr];
        let subLane = 0;
        for (let i = 0; i < slots.length; i++) {
          if (slots[i] <= s.b) { subLane = i; slots[i] = s.d + 5; break; }
          subLane = i + 1;
        }
        if (subLane >= slots.length) slots.push(s.d + 5);
        const yOff = y0 + 10 + (subLane % 4) * 8;

        const col = discColor(s.disc_tr);
        const isSel = s.id === selectedRef.current;
        const score = getImportance(s);
        const style = VIS_STYLE[score];
        const alive = s.d > 2024;
        const sw = style.lineWidth;
        const dotR = style.r;

        const sg = scholarLayer.append('g')
          .attr('class', 'scholar-group').attr('data-id', s.id);

        /* ── HIT RECT İLK ELEMAN — en altta ama pointer-events:all ── */
        const HIT_PAD = 14;
        sg.append('rect')
          .attr('x', xStart - 6)
          .attr('y', yOff - HIT_PAD)
          .attr('width', Math.max(xEnd - xStart + 12, 24))
          .attr('height', HIT_PAD * 2)
          .attr('fill', '#000')
          .attr('fill-opacity', 0)
          .attr('cursor', 'pointer')
          .style('pointer-events', 'all');

        /* ── Visible elements — hepsi pointer-events:none ── */
        const line = sg.append('line')
          .attr('x1', xStart).attr('x2', xEnd)
          .attr('y1', yOff).attr('y2', yOff)
          .attr('stroke', col)
          .attr('stroke-width', isSel ? sw + 1 : sw)
          .attr('stroke-opacity', isSel ? 1 : style.lineOpacity)
          .attr('stroke-linecap', 'round')
          .style('pointer-events', 'none');
        if (style.glow) line.attr('filter', 'url(#glow)');

        sg.append('circle').attr('cx', xStart).attr('cy', yOff)
          .attr('r', dotR).attr('fill', col)
          .attr('stroke', '#080c18').attr('stroke-width', 1.5)
          .style('pointer-events', 'none');

        if (alive) {
          sg.append('text').attr('x', xEnd + 2).attr('y', yOff + 4)
            .attr('fill', col).attr('font-size', score >= 3 ? '14px' : '11px')
            .attr('font-family', 'Outfit').text('→')
            .style('pointer-events', 'none');
        } else {
          sg.append('circle').attr('cx', xEnd).attr('cy', yOff)
            .attr('r', dotR).attr('fill', '#080c18')
            .attr('stroke', col).attr('stroke-width', 2)
            .style('pointer-events', 'none');
        }

        if (!hiddenLabels.has(s.id) && (xEnd - xStart > 20 || score >= 3)) {
          const nm = lang === 'tr' ? s.tr : s.en;
          const label = nm.length > 14 ? nm.slice(0, 13) + '…' : nm;
          const textW = label.length * (score >= 3 ? 6.5 : score >= 2 ? 5.5 : 5);
          const tx = xStart + 2, ty = yOff - 6;
          sg.append('rect').attr('x', tx - 2).attr('y', ty - 10)
            .attr('width', textW + 4).attr('height', 12)
            .attr('fill', '#080c18').attr('opacity', 0.65).attr('rx', 2)
            .style('pointer-events', 'none');
          sg.append('text').attr('x', tx).attr('y', ty)
            .attr('fill', style.labelColor)
            .attr('font-size', style.fontSize + 'px')
            .attr('font-family', 'Outfit')
            .attr('font-weight', style.fontWeight)
            .style('pointer-events', 'none').text(label);
        }

        st.hitZones.push({
          id: s.id, xStart, xEnd, yOff, s, sw, style,
          isSelected: isSel, lineNode: line.node(),
        });
        scholarById[s.id] = { ...s, _x: (xStart + xEnd) / 2, _y: yOff };
      });

      /* ── Teacher links ── */
      if (showLinks) {
        links.filter(l => l.type === 'teacher').forEach(link => {
          const src = scholarById[link.source];
          const tgt = scholarById[link.target];
          if (!src?._x || !tgt?._x) return;
          const cx2 = (src._x + tgt._x) / 2;
          const cy2 = Math.min(src._y, tgt._y) - 30;
          linkLayer.append('path')
            .attr('d', `M${src._x},${src._y} Q${cx2},${cy2} ${tgt._x},${tgt._y}`)
            .attr('fill', 'none').attr('stroke', '#9ca3af')
            .attr('stroke-width', 1.5).attr('stroke-opacity', 0.5)
            .attr('stroke-dasharray', '4,3')
            .attr('marker-end', 'url(#teacher-arrow)');
        });
      }

      /* ═══ HOVER — D3 mouseenter/mouseleave + pure DOM tooltip ═══
         SIFIR React re-render. SIFIR setState.
         Tooltip = useRef div, her zaman DOM'da, display toggle.       */

      scholarLayer.selectAll('.scholar-group')
        .on('mouseenter', function (ev) {
          const id = +this.getAttribute('data-id');
          const hz = st.hitZones.find(h => h.id === id);
          if (!hz) return;
          if (st.currentHoverId !== id) {
            clearHighlight();
            hz.lineNode.setAttribute('stroke-width', String(hz.sw + 3));
            hz.lineNode.setAttribute('stroke-opacity', '1');
            st.currentHoverId = id;
          }
          showTip(ev.pageX, ev.pageY, hz.s);
        })
        .on('mousemove', function (ev) {
          moveTip(ev.pageX, ev.pageY);
        })
        .on('mouseleave', function () {
          clearHighlight();
          hideTip();
        })
        .on('click', function () {
          const id = +this.getAttribute('data-id');
          onSelectRef.current(id);
        });
    }

    renderScholars(3);

    // Initial zoom — event fire etmeden
    const t0 = d3.zoomIdentity.scale(0.85).translate(20, 0);
    svgEl.__zoom = t0;
    g.attr('transform', t0);

  }, [scholars, links, lang, showLinks]);

  /* ═══ Selection highlight ═══ */
  useEffect(() => {
    const zones = d3State.current.hitZones;
    if (!zones.length) return;
    zones.forEach(hz => {
      const isSel = hz.id === selected;
      hz.isSelected = isSel;
      if (hz.lineNode) {
        hz.lineNode.setAttribute('stroke-width',
          String(isSel ? hz.sw + 1 : hz.sw));
        hz.lineNode.setAttribute('stroke-opacity',
          String(isSel ? 1 : hz.style.lineOpacity));
      }
    });
  }, [selected]);

  return (
    <div className="scholar-graph" ref={wrapRef} style={{ position: 'relative' }}>
      <svg ref={svgRef} style={{ display: 'block' }} />

      {/* Tooltip — HER ZAMAN DOM'da, display:none ile gizli.
          Conditional render YOK → DOM insert/remove YOK → re-render döngüsü YOK.
          pointer-events:none → fare olaylarını ALMAZ. */}
      <div ref={tipRef} className="tt"
        style={{ display: 'none', pointerEvents: 'none' }} />

      {/* Zoom counter + Reset */}
      <div style={{
        position: 'absolute', top: 6, right: 8,
        display: 'flex', alignItems: 'center', gap: 6, zIndex: 5,
        pointerEvents: 'auto',
      }}>
        <span ref={counterRef} style={{ fontSize: 11, color: '#6b7280', fontFamily: 'Outfit' }}>
          {scholars.filter(s => getImportance(s) >= 3).length}/{scholars.length} {lang === 'tr' ? 'âlim' : 'scholars'}
        </span>
        <button className="scholar-zoom-reset" onClick={resetZoom} style={{ position: 'static' }}>
          ⟳ {lang === 'tr' ? 'Sıfırla' : 'Reset'}
        </button>
      </div>

      {/* Zoom hint */}
      {showHint && (
        <div style={{
          position: 'absolute', bottom: 40, left: '50%',
          transform: 'translateX(-50%)',
          background: '#1f2937', border: '1px solid #374151',
          borderRadius: 8, padding: '8px 16px',
          fontSize: 12, color: '#9ca3af', fontFamily: 'Outfit',
          pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 5,
        }}>
          🔍 {lang === 'tr' ? 'Yakınlaştır: daha fazla âlim görünür' : 'Zoom in to reveal more scholars'}
        </div>
      )}
    </div>
  );
}
