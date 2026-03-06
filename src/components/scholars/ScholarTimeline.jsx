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

/* ═══════════════════════════════════════════════════════════
   ÖNEM SKORU (0–3)
   ═══════════════════════════════════════════════════════════ */

const IMPORTANCE_3 = new Set([
  1, 2, 3, 4, 5, 6,
  7, 8, 9, 10,
  18, 19, 20, 21,
  25, 34, 44,
  47, 48,
  109, 110,
  140, 141,
  209, 212,
  214, 226, 228,
  253, 254, 256,
  273,
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

/* ═══════════════════════════════════════════════════════════
   GÖRSEL STİL PARAMETRELERİ
   ═══════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════
   ÇAKIŞAN ETİKETLERİ GİZLE
   ═══════════════════════════════════════════════════════════ */

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

      if (overlaps) {
        hidden.add(s.id);
      } else {
        occupied.push({ x1, x2 });
      }
    });
  });

  return hidden;
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT — RADİKAL YENİDEN YAZIM (v4.8.4)

   SONSUZ DÖNGÜ KÖK NEDENLERİ VE ÇÖZÜMLER:

   1. D3 tooltip wrapper'ın içine DOM ekliyordu →
      Layout shift → mousemove tekrar tetikleniyor →
      ÇÖZÜM: Tooltip 100% React state, position:fixed

   2. D3 .on('mousemove') + d3.pointer() her karede
      getBoundingClientRect + getScreenCTM çağırıyordu →
      Forced reflow → layout shift → yeni mouse event →
      ÇÖZÜM: Native addEventListener + RAF throttle

   3. Hover'da D3 selection .attr() çağrısı SVG reflow →
      ÇÖZÜM: Native DOM setAttribute (D3 selection yok)

   4. selected useEffect dep → her click'te full SVG rebuild →
      svg.call(zoom.transform) → zoom event → renderScholars →
      ÇÖZÜM: selected/onSelect → useRef, ayrı lightweight effect

   5. svg.call(zoom.transform) her useEffect'te event fire ediyor →
      ÇÖZÜM: __zoom property'yi doğrudan set et, event tetikleme
   ═══════════════════════════════════════════════════════════ */

export default function ScholarTimeline({ scholars, links, lang, selected, onSelect, showLinks }) {
  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const zoomRef = useRef(null);
  const counterRef = useRef(null);

  // Tooltip: 100% React state, position:fixed
  const [tip, setTip] = useState(null);

  const [showHint, setShowHint] = useState(true);

  // Stable refs — D3 closures bunları kullanacak
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  // Internal mutable D3 state — React state DEĞİL
  const d3State = useRef({
    hitZones: [],
    currentHoverId: null,
    rafId: 0,
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

  /* ═══════════════════════════════════════════════════════════
     MAIN D3 EFFECT
     Deps: scholars, links, lang, showLinks ONLY.
     ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!svgRef.current || !wrapRef.current) return;
    const wrap = wrapRef.current;
    const W = wrap.clientWidth || 1000;
    const st = d3State.current;

    const ml = 180, mr = 30, mt = 52, mb = 30;
    const bandH = 42;
    const usedDiscs = DISC_ORDER.filter(d => scholars.some(s => s.disc_tr === d));
    const H = mt + usedDiscs.length * bandH + mb;

    const svgEl = svgRef.current;
    const svg = d3.select(svgEl);

    // CLEANUP
    svg.on('.hover', null).on('.scholar', null);
    svg.selectAll('*').remove();
    svg.attr('width', W).attr('height', H);

    if (st.rafId) { cancelAnimationFrame(st.rafId); st.rafId = 0; }
    st.hitZones = [];
    st.currentHoverId = null;
    setTip(null);

    const g = svg.append('g');
    st.gNode = g.node();

    /* ── Zoom & Pan ── */
    let currentK = 0.85;

    const getMinScore = (k) =>
      k < 1.5 ? 3 : k < 2.5 ? 2 : k < 4.0 ? 1 : 0;

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
        if (oldMin !== newMin) {
          renderScholars(newMin);
        }
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    const x = d3.scaleLinear().domain([622, 2030]).range([ml, W - mr]);

    /* ── DEFS ── */
    const defs = svg.append('defs');

    defs.append('marker')
      .attr('id', 'teacher-arrow')
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('refX', 5).attr('refY', 3)
      .attr('orient', 'auto')
      .append('path').attr('d', 'M0,0 L6,3 L0,6 Z')
      .attr('fill', '#9ca3af').attr('opacity', 0.7);

    const glowFilter = defs.append('filter').attr('id', 'glow')
      .attr('x', '-20%').attr('y', '-20%')
      .attr('width', '140%').attr('height', '140%');
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
        .attr('font-weight', '600')
        .text(eraLabel);
    });

    /* ── GRID LINES ── */
    for (let yr = 700; yr <= 2000; yr += 100) {
      g.append('line').attr('x1', x(yr)).attr('x2', x(yr))
        .attr('y1', mt - 5).attr('y2', H - mb + 5)
        .attr('stroke', '#1a2030').attr('stroke-width', 0.5);
      g.append('text').attr('x', x(yr)).attr('y', H - mb + 18)
        .attr('text-anchor', 'middle').attr('fill', '#6b6b7b')
        .attr('font-size', '10px').attr('font-family', 'Outfit').text(yr);
    }

    /* ── DISCIPLINE ROWS ── */
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

    /* ── Scholar render layers ── */
    const scholarLayer = g.append('g').attr('class', 'scholar-layer');
    const linkLayer = g.append('g').attr('class', 'link-layer');

    const scholarById = {};
    scholars.forEach(s => { scholarById[s.id] = { ...s }; });

    /* ═══ renderScholars ═══ */
    function renderScholars(minScore) {
      scholarLayer.selectAll('*').remove();
      linkLayer.selectAll('*').remove();
      st.hitZones = [];
      st.currentHoverId = null;

      const visibleScholars = scholars.filter(s => getImportance(s) >= minScore);
      const hiddenLabels = hideOverlappingLabels(visibleScholars, x);

      const laneSlots = {};
      usedDiscs.forEach(d => { laneSlots[d] = []; });

      const sorted = [...visibleScholars].sort((a, b) => a.b - b.b);

      sorted.forEach(s => {
        if (!s.b || !s.d || discRow[s.disc_tr] === undefined) return;
        const row = discRow[s.disc_tr];
        const y0 = mt + row * bandH;
        const xStart = x(Math.max(s.b, 622));
        const xEnd = x(Math.min(s.d, 2030));

        const slots = laneSlots[s.disc_tr];
        let subLane = 0;
        for (let i = 0; i < slots.length; i++) {
          if (slots[i] <= s.b) { subLane = i; slots[i] = s.d + 5; break; }
          subLane = i + 1;
        }
        if (subLane >= slots.length) slots.push(s.d + 5);
        const yOff = y0 + 10 + (subLane % 4) * 8;

        const col = discColor(s.disc_tr);
        const isSelected = s.id === selectedRef.current;
        const score = getImportance(s);
        const style = VIS_STYLE[score];
        const stillAlive = s.d > 2024;
        const sw = style.lineWidth;
        const dotR = style.r;

        const scholarG = scholarLayer.append('g')
          .attr('class', 'scholar-group')
          .attr('data-id', s.id);

        // Visible lifeline — ALL pointer-events:none
        const line = scholarG.append('line')
          .attr('x1', xStart).attr('x2', xEnd)
          .attr('y1', yOff).attr('y2', yOff)
          .attr('stroke', col)
          .attr('stroke-width', isSelected ? sw + 1 : sw)
          .attr('stroke-opacity', isSelected ? 1 : style.lineOpacity)
          .attr('stroke-linecap', 'round')
          .style('pointer-events', 'none');

        if (style.glow) line.attr('filter', 'url(#glow)');

        scholarG.append('circle').attr('cx', xStart).attr('cy', yOff)
          .attr('r', dotR).attr('fill', col)
          .attr('stroke', '#080c18').attr('stroke-width', 1.5)
          .style('pointer-events', 'none');

        if (stillAlive) {
          scholarG.append('text')
            .attr('x', xEnd + 2).attr('y', yOff + 4)
            .attr('fill', col).attr('font-size', score >= 3 ? '14px' : '11px')
            .attr('font-family', 'Outfit').text('→')
            .style('pointer-events', 'none');
        } else {
          scholarG.append('circle').attr('cx', xEnd).attr('cy', yOff)
            .attr('r', dotR).attr('fill', '#080c18')
            .attr('stroke', col).attr('stroke-width', 2)
            .style('pointer-events', 'none');
        }

        if (!hiddenLabels.has(s.id) && (xEnd - xStart > 20 || score >= 3)) {
          const name = lang === 'tr' ? s.tr : s.en;
          const label = name.length > 14 ? name.slice(0, 13) + '…' : name;
          const textW = label.length * (score >= 3 ? 6.5 : score >= 2 ? 5.5 : 5);
          const tx = xStart + 2;
          const ty = yOff - 6;

          scholarG.append('rect')
            .attr('x', tx - 2).attr('y', ty - 10)
            .attr('width', textW + 4).attr('height', 12)
            .attr('fill', '#080c18').attr('opacity', 0.65).attr('rx', 2)
            .style('pointer-events', 'none');

          scholarG.append('text').attr('x', tx).attr('y', ty)
            .attr('fill', style.labelColor)
            .attr('font-size', style.fontSize + 'px')
            .attr('font-family', 'Outfit')
            .attr('font-weight', style.fontWeight)
            .style('pointer-events', 'none')
            .text(label);
        }

        // Hit zone data — lineNode = raw DOM element (D3 selection yok!)
        st.hitZones.push({
          id: s.id, xStart, xEnd, yOff, s, sw, style, isSelected,
          lineNode: line.node(), col,
        });

        scholarById[s.id] = { ...s, _x: (xStart + xEnd) / 2, _y: yOff };
      });

      if (showLinks) {
        const teacherLinks = links.filter(l => l.type === 'teacher');
        teacherLinks.forEach(link => {
          const src = scholarById[link.source];
          const tgt = scholarById[link.target];
          if (!src?._x || !tgt?._x) return;

          const cx = (src._x + tgt._x) / 2;
          const cy = Math.min(src._y, tgt._y) - 30;

          linkLayer.append('path')
            .attr('d', `M${src._x},${src._y} Q${cx},${cy} ${tgt._x},${tgt._y}`)
            .attr('fill', 'none')
            .attr('stroke', '#9ca3af')
            .attr('stroke-width', 1.5)
            .attr('stroke-opacity', 0.5)
            .attr('stroke-dasharray', '4,3')
            .attr('marker-end', 'url(#teacher-arrow)');
        });
      }
    }

    renderScholars(3);

    /* ═══════════════════════════════════════════════════════════
       EVENT HANDLING — NATIVE addEventListener
       D3 .on() kullanMIYORUZ → zoom ile çakışma yok.
       RAF throttle → her karede max 1 hover hesaplaması.
       Native setAttribute → D3 selection overhead yok.
       getScreenCTM() → getBoundingClientRect() yerine
       (daha güvenilir, layout shift tetiklemez).
       ═══════════════════════════════════════════════════════════ */

    const HIT_HALF = 7;

    function clearHoverHighlight() {
      if (st.currentHoverId === null) return;
      const prev = st.hitZones.find(h => h.id === st.currentHoverId);
      if (prev && prev.lineNode) {
        prev.lineNode.setAttribute('stroke-width',
          String(prev.isSelected ? prev.sw + 1 : prev.sw));
        prev.lineNode.setAttribute('stroke-opacity',
          String(prev.isSelected ? 1 : prev.style.lineOpacity));
      }
      st.currentHoverId = null;
    }

    function processHover(clientX, clientY) {
      const gNode = st.gNode;
      if (!gNode) return;

      // Client coords → SVG group coords (zoom/pan-aware)
      const ctm = gNode.getScreenCTM();
      if (!ctm) return;
      const inv = ctm.inverse();
      const mx = inv.a * clientX + inv.c * clientY + inv.e;
      const my = inv.b * clientX + inv.d * clientY + inv.f;

      let found = null;
      for (let i = 0; i < st.hitZones.length; i++) {
        const hz = st.hitZones[i];
        if (mx >= hz.xStart && mx <= hz.xEnd && Math.abs(my - hz.yOff) <= HIT_HALF) {
          found = hz;
          break;
        }
      }

      if (found) {
        if (st.currentHoverId !== found.id) {
          clearHoverHighlight();
          found.lineNode.setAttribute('stroke-width', String(found.sw + 3));
          found.lineNode.setAttribute('stroke-opacity', '1');
          st.currentHoverId = found.id;
        }

        const s = found.s;
        const name = lang === 'tr' ? s.tr : s.en;
        const city = lang === 'tr' ? (s.city_tr || '') : (s.city_en || '');
        const works = (s.works_tr || '').split(',')[0] || '';
        const badge = IMPORTANCE_3.has(s.id) ? '⭐ ' : '';
        setTip({
          name: badge + name,
          dates: s.b + '–' + (s.d > 2024 ? '?' : s.d),
          city, work: works,
          x: clientX + 14,
          y: clientY - 12,
        });
        svgEl.style.cursor = 'pointer';
      } else {
        if (st.currentHoverId !== null) {
          clearHoverHighlight();
          setTip(null);
        }
        svgEl.style.cursor = '';
      }
    }

    // RAF-throttled mousemove
    function onMouseMove(ev) {
      // Eğer zaten bekleyen bir RAF varsa, koordinatları güncelle ama yeni RAF kuyruklama
      if (st.rafId) return;
      const cx = ev.clientX, cy = ev.clientY;
      st.rafId = requestAnimationFrame(() => {
        st.rafId = 0;
        processHover(cx, cy);
      });
    }

    function onMouseLeave() {
      if (st.rafId) { cancelAnimationFrame(st.rafId); st.rafId = 0; }
      clearHoverHighlight();
      setTip(null);
      svgEl.style.cursor = '';
    }

    function onClick(ev) {
      const gNode = st.gNode;
      if (!gNode) return;
      const ctm = gNode.getScreenCTM();
      if (!ctm) return;
      const inv = ctm.inverse();
      const mx = inv.a * ev.clientX + inv.c * ev.clientY + inv.e;
      const my = inv.b * ev.clientX + inv.d * ev.clientY + inv.f;

      for (let i = 0; i < st.hitZones.length; i++) {
        const hz = st.hitZones[i];
        if (mx >= hz.xStart && mx <= hz.xEnd && Math.abs(my - hz.yOff) <= HIT_HALF) {
          onSelectRef.current(hz.id);
          return;
        }
      }
    }

    svgEl.addEventListener('mousemove', onMouseMove);
    svgEl.addEventListener('mouseleave', onMouseLeave);
    svgEl.addEventListener('click', onClick);

    // Initial zoom — __zoom property'yi doğrudan set et
    // svg.call(zoom.transform, ...) event fire ediyor → BUNU KULLANMIYORUZ
    const initTransform = d3.zoomIdentity.scale(0.85).translate(20, 0);
    svgEl.__zoom = initTransform;
    g.attr('transform', initTransform);

    return () => {
      svgEl.removeEventListener('mousemove', onMouseMove);
      svgEl.removeEventListener('mouseleave', onMouseLeave);
      svgEl.removeEventListener('click', onClick);
      if (st.rafId) { cancelAnimationFrame(st.rafId); st.rafId = 0; }
    };
  }, [scholars, links, lang, showLinks]);

  /* ═══ Lightweight selection highlight ═══ */
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
      <svg ref={svgRef} />

      {/* Zoom counter + Reset */}
      <div style={{ position: 'absolute', top: 6, right: 8, display: 'flex', alignItems: 'center', gap: 6, zIndex: 5 }}>
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
          fontSize: 12, color: '#9ca3af',
          fontFamily: 'Outfit',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 5,
        }}>
          🔍 {lang === 'tr' ? 'Yakınlaştır: daha fazla âlim görünür' : 'Zoom in to reveal more scholars'}
        </div>
      )}

      {/* TOOLTIP — position:fixed, wrapper DOM'una HİÇBİR ŞEY eklenmedi
          Fixed position = normal flow'u ETKİLEMEZ = layout shift OLMAZ
          pointer-events:none = fare event'i tetiklemez */}
      {tip && (
        <div className="scholar-tt" style={{
          position: 'fixed',
          left: tip.x,
          top: tip.y,
          pointerEvents: 'none',
          zIndex: 9999,
        }}>
          <b>{tip.name}</b><br/>
          {tip.dates}{tip.city ? ' · ' + tip.city : ''}
          {tip.work ? <><br/>{tip.work}</> : null}
        </div>
      )}
    </div>
  );
}
