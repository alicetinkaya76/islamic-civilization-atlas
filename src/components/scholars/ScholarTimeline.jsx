import { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { ERA_BANDS } from '../../config/eras';
import { DISC_COLORS } from './ScholarNetwork';
import SCHOLAR_LINKS from '../../data/scholar_links';

/* ═══════════════════════════════════════════════════════════
   ScholarTimeline v4.8.4.3 — SOFISTIKE ZAMAN ÇİZELGESİ

   Yenilikler:
   1. Zengin tooltip kartı (eserler, hocalar, öğrenciler)
   2. Gradient çizgiler (disipline göre → beyaza fade)
   3. Era geçişlerinde dekoratif ayraçlar
   4. Zoom seviyesine göre adaptif label boyutu
   5. Hover'da ilişki çizgilerini highlight
   6. Smooth geçişler (zoom, filter)
   7. Pure DOM tooltip — sıfır React re-render
   ═══════════════════════════════════════════════════════════ */

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
  3: { lineWidth: 5, r: 7, fontSize: 13, fontWeight: 700,
       labelColor: '#f3f4f6', lineOpacity: 1.0, glow: true },
  2: { lineWidth: 3, r: 5, fontSize: 11, fontWeight: 600,
       labelColor: '#d1d5db', lineOpacity: 0.85, glow: false },
  1: { lineWidth: 2, r: 4, fontSize: 9,  fontWeight: 400,
       labelColor: '#9ca3af', lineOpacity: 0.7, glow: false },
  0: { lineWidth: 1.5, r: 3, fontSize: 8, fontWeight: 400,
       labelColor: '#6b7280', lineOpacity: 0.5, glow: false },
};

/* Pre-compute teacher/student maps */
const teachersOf = {};
const studentsOf = {};
SCHOLAR_LINKS.forEach(l => {
  if (l.type === 'teacher') {
    if (!studentsOf[l.source]) studentsOf[l.source] = [];
    studentsOf[l.source].push(l.target);
    if (!teachersOf[l.target]) teachersOf[l.target] = [];
    teachersOf[l.target].push(l.source);
  }
});

function hideOverlappingLabels(scholars, xScale, zoomK) {
  const byDisc = {};
  scholars.forEach(s => {
    const disc = s.disc_tr || 'Diğer';
    if (!byDisc[disc]) byDisc[disc] = [];
    byDisc[disc].push(s);
  });
  const hidden = new Set();
  // At higher zoom, allow more labels
  const padFactor = zoomK > 2 ? 1 : zoomK > 1 ? 2 : 4;
  Object.values(byDisc).forEach(group => {
    const sorted = [...group].sort((a, b) => getImportance(b) - getImportance(a));
    const occupied = [];
    sorted.forEach(s => {
      const midX = xScale((s.b + s.d) / 2);
      const name = (s.tr || s.en || '').slice(0, 18);
      const labelWidth = name.length * 5.5 + 4;
      const x1 = midX - 2;
      const x2 = midX + labelWidth;
      const overlaps = occupied.some(o => x1 < o.x2 + padFactor && x2 > o.x1 - padFactor);
      if (overlaps) { hidden.add(s.id); }
      else { occupied.push({ x1, x2 }); }
    });
  });
  return hidden;
}

/* ═══ Build rich tooltip HTML ═══ */
function buildRichTooltip(s, lang, allScholars) {
  const nm   = lang === 'tr' ? s.tr : s.en;
  const city = lang === 'tr' ? (s.city_tr || '') : (s.city_en || '');
  const disc = lang === 'tr' ? (s.disc_tr || '') : (s.disc_en || s.disc_tr || '');
  const dColor = discColor(s.disc_tr);
  const badge = IMPORTANCE_3.has(s.id) ? '⭐' : '';
  const dates = `${s.b}–${s.d > 2024 ? '?' : s.d}`;
  const works = (s.works_tr || '').split(',').map(w => w.trim()).filter(Boolean);

  // Teachers & students
  const tIds = teachersOf[s.id] || [];
  const sIds = studentsOf[s.id] || [];
  const getName = id => {
    const sch = allScholars.find(x => x.id === id);
    return sch ? (lang === 'tr' ? sch.tr : sch.en) : '';
  };
  const teacherNames = tIds.map(getName).filter(Boolean);
  const studentNames = sIds.map(getName).filter(Boolean);

  let html = '';
  // Header with disc badge
  html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">`;
  html += `<span style="background:${dColor};color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;letter-spacing:0.03em">${disc}</span>`;
  if (badge) html += `<span style="font-size:12px">${badge}</span>`;
  html += `</div>`;
  // Name
  html += `<div style="font-size:14px;font-weight:700;color:#f3f4f6;margin-bottom:1px;font-family:Outfit">${nm}</div>`;
  if (lang === 'tr' && s.en) html += `<div style="font-size:11px;color:#9ca3af;font-style:italic;margin-bottom:4px">${s.en}</div>`;
  // Dates & city
  html += `<div style="font-size:11px;color:#6b7280;margin-bottom:6px">📅 ${dates}`;
  if (city) html += ` · 📍 ${city}`;
  html += `</div>`;
  // Works
  if (works.length > 0) {
    html += `<div style="font-size:10px;color:#9ca3af;margin-bottom:2px;font-weight:600">${lang === 'tr' ? 'Eserler' : 'Works'}:</div>`;
    html += `<div style="font-size:11px;color:#d1d5db;margin-bottom:6px;line-height:1.4">`;
    works.slice(0, 3).forEach(w => { html += `<span style="color:${dColor}">•</span> ${w}<br/>`; });
    if (works.length > 3) html += `<span style="color:#6b7280">+${works.length - 3} ${lang === 'tr' ? 'daha' : 'more'}…</span>`;
    html += `</div>`;
  }
  // Teachers
  if (teacherNames.length > 0) {
    html += `<div style="font-size:10px;color:#9ca3af;margin-bottom:2px;font-weight:600">👨‍🏫 ${lang === 'tr' ? 'Hocaları' : 'Teachers'}:</div>`;
    html += `<div style="font-size:11px;color:#a3e635;margin-bottom:4px">${teacherNames.join(', ')}</div>`;
  }
  // Students
  if (studentNames.length > 0) {
    html += `<div style="font-size:10px;color:#9ca3af;margin-bottom:2px;font-weight:600">🎓 ${lang === 'tr' ? 'Öğrencileri' : 'Students'}:</div>`;
    html += `<div style="font-size:11px;color:#60a5fa;margin-bottom:2px">${studentNames.join(', ')}</div>`;
  }
  return { html, dColor };
}

export default function ScholarTimeline({ scholars, links, lang, selected, onSelect, showLinks }) {
  const svgRef     = useRef(null);
  const wrapRef    = useRef(null);
  const tipRef     = useRef(null);
  const zoomRef    = useRef(null);
  const counterRef = useRef(null);
  const currentKRef = useRef(0.85);

  const [showHint, setShowHint] = useState(true);

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const scholarsRef = useRef(scholars);
  scholarsRef.current = scholars;

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
    if (!svgRef.current || !wrapRef.current || !tipRef.current) return;
    const wrap  = wrapRef.current;
    const svgEl = svgRef.current;
    const tipEl = tipRef.current;
    const W     = wrap.clientWidth || 1000;
    const svg   = d3.select(svgEl);

    const ml = 180, mr = 30, mt = 52, mb = 30;
    const bandH = 42;
    const usedDiscs = DISC_ORDER.filter(d => scholars.some(s => s.disc_tr === d));
    const H = mt + usedDiscs.length * bandH + mb;

    svg.on('.zoom', null);
    svg.selectAll('*').remove();
    svg.attr('width', W).attr('height', H);
    tipEl.style.display = 'none';

    const g = svg.append('g');
    const defs = svg.append('defs');

    /* ── Gradient defs per discipline ── */
    DISC_ORDER.forEach(disc => {
      const col = discColor(disc);
      const id = 'grad-' + disc.replace(/[^a-zA-Z]/g, '');
      const grad = defs.append('linearGradient').attr('id', id)
        .attr('x1', '0%').attr('x2', '100%');
      grad.append('stop').attr('offset', '0%').attr('stop-color', col).attr('stop-opacity', 1);
      grad.append('stop').attr('offset', '70%').attr('stop-color', col).attr('stop-opacity', 0.8);
      grad.append('stop').attr('offset', '100%').attr('stop-color', col).attr('stop-opacity', 0.3);
    });

    /* ── Arrow marker ── */
    defs.append('marker')
      .attr('id', 'teacher-arrow')
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('refX', 5).attr('refY', 3).attr('orient', 'auto')
      .append('path').attr('d', 'M0,0 L6,3 L0,6 Z')
      .attr('fill', '#9ca3af').attr('opacity', 0.7);

    /* ── Glow filter ── */
    const glowFilter = defs.append('filter').attr('id', 'glow')
      .attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    const glowMerge = glowFilter.append('feMerge');
    glowMerge.append('feMergeNode').attr('in', 'blur');
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    /* ── Zoom ── */
    let currentK = 0.85;
    let zoomRenderTimer = 0;
    const getMinScore = (k) => k < 1.5 ? 3 : k < 2.5 ? 2 : k < 4.0 ? 1 : 0;

    const zoom = d3.zoom()
      .scaleExtent([0.5, 6])
      .on('zoom', (e) => {
        g.attr('transform', e.transform);
        const newK = e.transform.k;
        currentK = newK;
        currentKRef.current = newK;
        if (counterRef.current) {
          const newMin = getMinScore(newK);
          const cnt = scholars.filter(s => getImportance(s) >= newMin).length;
          counterRef.current.textContent = cnt + '/' + scholars.length +
            ' ' + (lang === 'tr' ? 'âlim' : 'scholars');
        }
        // Debounced re-render for label recalculation at every zoom level
        clearTimeout(zoomRenderTimer);
        zoomRenderTimer = setTimeout(() => {
          renderScholars(getMinScore(currentK), currentK);
        }, 150);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    const x = d3.scaleLinear().domain([622, 2030]).range([ml, W - mr]);

    /* ── ERA BANDS with decorative dividers ── */
    ERA_BANDS.forEach(([s, e, , labels], idx) => {
      const eraLabel = labels[lang] || labels.en;
      const eraCol = ERA_COLORS[eraLabel] || ERA_COLORS[labels.en] || '#6b7280';
      // Background band
      g.append('rect').attr('x', x(s)).attr('y', mt - 5)
        .attr('width', x(e) - x(s)).attr('height', H - mt - mb + 10)
        .attr('fill', eraCol).attr('opacity', 0.06);

      // Decorative era divider line
      if (idx > 0) {
        // Main divider
        g.append('line')
          .attr('x1', x(s)).attr('x2', x(s))
          .attr('y1', mt - 20).attr('y2', H - mb + 5)
          .attr('stroke', eraCol).attr('stroke-width', 1.5).attr('opacity', 0.4);
        // Diamond decoration at top
        const dx = x(s), dy = mt - 12;
        g.append('path')
          .attr('d', `M${dx},${dy - 5} L${dx + 4},${dy} L${dx},${dy + 5} L${dx - 4},${dy} Z`)
          .attr('fill', eraCol).attr('opacity', 0.6);
      }

      // Era label with background pill
      const labelX = x((s + e) / 2);
      const labelText = eraLabel;
      const labelW = labelText.length * 7 + 16;
      g.append('rect')
        .attr('x', labelX - labelW / 2).attr('y', mt - 28)
        .attr('width', labelW).attr('height', 16)
        .attr('rx', 8).attr('fill', eraCol).attr('opacity', 0.15);
      g.append('text').attr('x', labelX).attr('y', mt - 17)
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
      // Disc color dot
      g.append('circle').attr('cx', 14).attr('cy', y0 + bandH / 2)
        .attr('r', 5).attr('fill', discColor(disc));
      g.append('text').attr('x', 26).attr('y', y0 + bandH / 2 + 4)
        .attr('fill', '#c4b89a').attr('font-size', '10.5px').attr('font-family', 'Outfit')
        .attr('font-weight', '500')
        .text(lang === 'tr' ? disc : (DISC_EN[disc] || disc));
    });

    /* ── Layers ── */
    const linkLayer    = g.append('g').attr('class', 'link-layer');
    const scholarLayer = g.append('g').attr('class', 'scholar-layer');

    const scholarById = {};
    scholars.forEach(s => { scholarById[s.id] = { ...s }; });

    /* ═══ renderScholars ═══ */
    function renderScholars(minScore, zoomK) {
      scholarLayer.selectAll('*').remove();
      linkLayer.selectAll('*').remove();
      tipEl.style.display = 'none';

      const vis = scholars.filter(s => getImportance(s) >= minScore);
      const hiddenLabels = hideOverlappingLabels(vis, x, zoomK || 0.85);
      const laneSlots = {};
      usedDiscs.forEach(d => { laneSlots[d] = []; });
      const sorted = [...vis].sort((a, b) => a.b - b.b);

      // Adaptive label max length based on zoom
      const maxLabelLen = zoomK > 3 ? 22 : zoomK > 2 ? 18 : zoomK > 1.2 ? 14 : 12;

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
        const gradId = 'grad-' + s.disc_tr.replace(/[^a-zA-Z]/g, '');
        const isSel = s.id === selectedRef.current;
        const score = getImportance(s);
        const style = VIS_STYLE[score];
        const alive = s.d > 2024;

        // Inverse-scale sizes so they stay constant on screen
        const invK = 1 / (zoomK || 0.85);
        const sw = style.lineWidth * invK;
        const dotR = style.r * invK;
        const baseFontSize = style.fontSize;
        const adaptiveFontSize = baseFontSize * invK;

        const sg = scholarLayer.append('g')
          .attr('class', 'scholar-group')
          .attr('data-id', s.id)
          .attr('cursor', 'pointer');

        /* Hit rect */
        const rectPad = 14 * invK;
        sg.append('rect')
          .attr('x', xStart - 4 * invK)
          .attr('y', yOff - rectPad)
          .attr('width', Math.max(xEnd - xStart + 8 * invK, 16 * invK))
          .attr('height', rectPad * 2)
          .attr('fill', '#000')
          .attr('fill-opacity', 0)
          .attr('pointer-events', 'all');

        /* Gradient line */
        const line = sg.append('line')
          .attr('x1', xStart).attr('x2', xEnd)
          .attr('y1', yOff).attr('y2', yOff)
          .attr('stroke', score >= 2 ? `url(#${gradId})` : col)
          .attr('stroke-width', isSel ? sw + 1 : sw)
          .attr('stroke-opacity', isSel ? 1 : style.lineOpacity)
          .attr('stroke-linecap', 'round')
          .attr('pointer-events', 'none');
        if (style.glow) line.attr('filter', 'url(#glow)');

        /* Birth dot */
        sg.append('circle').attr('cx', xStart).attr('cy', yOff)
          .attr('r', dotR).attr('fill', col)
          .attr('stroke', '#080c18').attr('stroke-width', 1.5 * invK)
          .attr('pointer-events', 'none');

        /* Death dot or arrow */
        if (alive) {
          sg.append('text').attr('x', xEnd + 2 * invK).attr('y', yOff + 4 * invK)
            .attr('fill', col).attr('font-size', (score >= 3 ? 14 : 11) * invK + 'px')
            .attr('font-family', 'Outfit').text('→')
            .attr('pointer-events', 'none');
        } else {
          sg.append('circle').attr('cx', xEnd).attr('cy', yOff)
            .attr('r', dotR).attr('fill', '#080c18')
            .attr('stroke', col).attr('stroke-width', 2 * invK)
            .attr('pointer-events', 'none');
        }

        /* Label — inverse-scaled so it stays same size on screen */
        if (!hiddenLabels.has(s.id) && (xEnd - xStart > 20 || score >= 3)) {
          const nm = lang === 'tr' ? s.tr : s.en;
          const label = nm.length > maxLabelLen ? nm.slice(0, maxLabelLen - 1) + '…' : nm;
          const charW = (score >= 3 ? 6.5 : score >= 2 ? 5.5 : 5) * invK;
          const textW = label.length * charW + 4 * invK;
          const tx = xStart + 2 * invK, ty = yOff - 6 * invK;
          sg.append('rect').attr('x', tx - 2 * invK).attr('y', ty - adaptiveFontSize + invK)
            .attr('width', textW + 4 * invK).attr('height', adaptiveFontSize + 2 * invK)
            .attr('fill', '#080c18').attr('opacity', 0.7).attr('rx', 3 * invK)
            .attr('pointer-events', 'none');
          sg.append('text').attr('x', tx).attr('y', ty)
            .attr('fill', style.labelColor)
            .attr('font-size', adaptiveFontSize + 'px')
            .attr('font-family', 'Outfit')
            .attr('font-weight', style.fontWeight)
            .attr('pointer-events', 'none').text(label);
        }

        scholarById[s.id] = { ...s, _x: (xStart + xEnd) / 2, _y: yOff };

        /* ── Events — pure DOM tooltip ── */
        sg.on('mouseenter', function(ev) {
          // Highlight line
          const curInvK = 1 / (currentK || 0.85);
          line.attr('stroke-width', (style.lineWidth + 3) * curInvK).attr('stroke-opacity', 1)
              .attr('stroke', col); // solid color on hover for clarity

          // Highlight related links
          linkLayer.selectAll('.tl-link').each(function() {
            const el = d3.select(this);
            const src = +el.attr('data-source');
            const tgt = +el.attr('data-target');
            if (src === s.id || tgt === s.id) {
              el.attr('stroke-opacity', 0.9).attr('stroke-width', 3 * curInvK);
            } else {
              el.attr('stroke-opacity', 0.08);
            }
          });

          // Rich tooltip
          const { html, dColor } = buildRichTooltip(s, lang, scholarsRef.current);
          tipEl.innerHTML = html;
          tipEl.style.borderColor = dColor;
          tipEl.style.left = (ev.pageX + 16) + 'px';
          tipEl.style.top  = (ev.pageY - 14) + 'px';
          tipEl.style.display = 'block';
        })
        .on('mouseleave', function() {
          const curSel = s.id === selectedRef.current;
          const curInvK = 1 / (currentK || 0.85);
          line.attr('stroke-width', (curSel ? style.lineWidth + 1 : style.lineWidth) * curInvK)
              .attr('stroke-opacity', curSel ? 1 : style.lineOpacity)
              .attr('stroke', score >= 2 ? `url(#${gradId})` : col);

          // Reset link highlights
          linkLayer.selectAll('.tl-link')
            .attr('stroke-opacity', 0.5).attr('stroke-width', 1.5 * curInvK);

          tipEl.style.display = 'none';
        })
        .on('click', function() {
          onSelectRef.current(s.id);
        });
      });

      /* ── Teacher links ── */
      if (showLinks) {
        links.filter(l => l.type === 'teacher').forEach(link => {
          const src = scholarById[link.source];
          const tgt = scholarById[link.target];
          if (!src?._x || !tgt?._x) return;
          const cx2 = (src._x + tgt._x) / 2;
          const cy2 = Math.min(src._y, tgt._y) - 30;
          const invKLink = 1 / (zoomK || 0.85);
          linkLayer.append('path')
            .attr('class', 'tl-link')
            .attr('data-source', link.source)
            .attr('data-target', link.target)
            .attr('d', `M${src._x},${src._y} Q${cx2},${cy2} ${tgt._x},${tgt._y}`)
            .attr('fill', 'none').attr('stroke', '#9ca3af')
            .attr('stroke-width', 1.5 * invKLink).attr('stroke-opacity', 0.5)
            .attr('stroke-dasharray', `${4 * invKLink},${3 * invKLink}`)
            .attr('marker-end', 'url(#teacher-arrow)')
            .attr('pointer-events', 'none');
        });
      }
    }

    renderScholars(3, 0.85);

    const t0 = d3.zoomIdentity.scale(0.85).translate(20, 0);
    svgEl.__zoom = t0;
    g.attr('transform', t0);

  }, [scholars, links, lang, showLinks]);

  /* ═══ Selection highlight ═══ */
  useEffect(() => {
    if (!svgRef.current) return;
    const invK = 1 / (currentKRef.current || 0.85);
    const svg = d3.select(svgRef.current);
    svg.selectAll('.scholar-group').each(function() {
      const sg = d3.select(this);
      const id = +sg.attr('data-id');
      const isSel = id === selected;
      const line = sg.select('line');
      if (line.empty()) return;
      const scholar = scholars.find(s => s.id === id);
      if (!scholar) return;
      const style = VIS_STYLE[getImportance(scholar)];
      line.attr('stroke-width', (isSel ? style.lineWidth + 1 : style.lineWidth) * invK)
          .attr('stroke-opacity', isSel ? 1 : style.lineOpacity);
    });
  }, [selected, scholars]);

  return (
    <div className="scholar-graph" ref={wrapRef} style={{ position: 'relative' }}>
      <svg ref={svgRef} style={{ display: 'block' }} />

      {/* Tooltip — pure DOM, always present */}
      <div ref={tipRef} style={{
        display: 'none',
        position: 'fixed',
        background: 'linear-gradient(135deg, #1a1f2e, #141820)',
        border: '1px solid #c9a84c',
        borderRadius: 10,
        padding: '12px 16px',
        minWidth: 220, maxWidth: 320,
        pointerEvents: 'none',
        zIndex: 9999,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        fontFamily: 'Outfit, sans-serif',
        lineHeight: 1.4,
      }} />

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
