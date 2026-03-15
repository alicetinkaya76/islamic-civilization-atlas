import { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import DB from '../../data/db.json';
import { REL_C, ZONE_C, LINK_COL } from '../../config/colors';
import { ERA_BANDS } from '../../config/eras';
import { n, lf } from '../../hooks/useEntityLookup';
import EraCard from './EraCard';
import ERA_INFO from '../../data/era_info';

export default function TimelineView({ lang, t }) {
  const svgRef = useRef(null);
  const [colorMode, setColorMode] = useState('rel');
  const [showBattles, setShowBattles] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showScholars, setShowScholars] = useState(true);
  const [showRulers, setShowRulers] = useState(false);
  const [showCausal, setShowCausal] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [tooltip, setTooltip] = useState(null);
  const [selectedEra, setSelectedEra] = useState(null);

  const impDyns = useMemo(() => {
    const getRegionGroup = (d) => {
      const nm = (d.tr || d.en || '').toLowerCase();
      // 0 — Caliphates first
      if (nm.includes('râşidûn') || nm.includes('rashidun') ||
          nm.includes('emevî halife') || nm.includes('umayyad calip') ||
          nm.includes('abbâsî halife') || nm.includes('abbasid calip')) return 0;
      // 1 — Osmanlılar
      if (nm.includes('osmanlı') || nm.includes('ottoman')) return 1;
      const z = (d.zone || '').toLowerCase();
      // 2 — Arap Yarımadası
      if (z.includes('arap yarımadası')) return 2;
      // 3 — Irak/Cezîre
      if (z.includes('irak') || z.includes('cezîre')) return 3;
      // 4 — Mısır/Şam (Levant & Egypt)
      if (z.includes('mısır') || z.includes('şam')) return 4;
      // 5 — Selçuklu Dünyası
      if (z.includes('selçuklu')) return 5;
      // 6 — Kafkasya/Batı İran
      if (z.includes('kafkasya') || z.includes('batı iran')) return 6;
      // 7 — Doğu İran/Mâverâünnehir (Central Asia)
      if (z.includes('doğu iran') || z.includes('mâverâünnehir')) return 7;
      // 8 — Anadolu
      if (z.includes('anadolu')) return 8;
      // 9 — Kuzey Afrika
      if (z.includes('kuzey afrika')) return 9;
      // 10 — Endülüs / Batı İslam
      if (z.includes('batı islam') || z.includes('ispanya') || z.includes('mağrib')) return 10;
      // 11 — Moğol/Tatar Dünyası
      if (z.includes('moğol') || z.includes('tatar')) return 11;
      // 12 — Güney Asya
      if (z.includes('güney asya')) return 12;
      // 13 — Güneydoğu Asya
      if (z.includes('güneydoğu')) return 13;
      // 14 — Afrika
      if (z.includes('afrika')) return 14;
      return 15;
    };
    return DB.dynasties
      .filter(d => d.imp !== 'Düşük' && d.start && d.end && d.end > d.start)
      .sort((a, b) => {
        const ga = getRegionGroup(a);
        const gb = getRegionGroup(b);
        if (ga !== gb) return ga - gb;
        return a.start - b.start || b.end - a.end;
      });
  }, []);

  const analyticsMap = useMemo(() => {
    const m = {}; DB.analytics.forEach(a => { m[a.id] = a; }); return m;
  }, []);

  const dynRowMap = useMemo(() => {
    const m = {};
    impDyns.forEach((d, i) => { m[d.id] = i; });
    return m;
  }, [impDyns]);

  const dynLinks = useMemo(() => {
    if (!DB.causal) return [];
    return DB.causal.filter(c =>
      c.st === 'dynasty' && c.tt === 'dynasty' &&
      dynRowMap[c.si] !== undefined && dynRowMap[c.ti] !== undefined
    ).slice(0, 80);
  }, [dynRowMap]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const ml = 210, mr = 30, mt = 50, mb = 60;
    const barH = 16, gap = 2;
    const dyns = impDyns;
    const W = Math.max(1200, 1200 * zoom);
    const H = mt + dyns.length * (barH + gap) + mb + 120;

    svg.attr('width', W).attr('height', H);

    // Arrowhead marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead').attr('viewBox', '0 0 10 10')
      .attr('refX', 8).attr('refY', 5)
      .attr('markerWidth', 5).attr('markerHeight', 5)
      .attr('orient', 'auto-start-reverse')
      .append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', '#c9a84c');

    const x = d3.scaleLinear().domain([622, 1930]).range([ml, W - mr]);

    // Era bands
    ERA_BANDS.forEach(([s, e, fill, labels]) => {
      const eraInfo = ERA_INFO.find(ei => ei.start <= s && ei.end >= e) ||
                      ERA_INFO.find(ei => Math.abs(ei.start - s) < 50 && Math.abs(ei.end - e) < 50);
      const eraId = eraInfo ? eraInfo.id : null;

      svg.append('rect').attr('x', x(s)).attr('y', mt - 10)
        .attr('width', x(e) - x(s)).attr('height', H - mt - mb + 20)
        .attr('fill', fill).attr('opacity', 0.3)
        .attr('cursor', eraId ? 'pointer' : 'default')
        .on('click', () => { if (eraId) setSelectedEra(eraId); });

      svg.append('text').attr('x', x((s + e) / 2)).attr('y', mt - 16)
        .attr('text-anchor', 'middle').attr('fill', '#6b6040').attr('font-size', '10px')
        .attr('font-family', 'Outfit').text(labels[lang])
        .attr('cursor', eraId ? 'pointer' : 'default')
        .on('click', () => { if (eraId) setSelectedEra(eraId); });
    });

    // Grid
    for (let yr = 700; yr <= 1900; yr += 100) {
      svg.append('line').attr('x1', x(yr)).attr('x2', x(yr))
        .attr('y1', mt - 10).attr('y2', H - mb + 10)
        .attr('stroke', '#1a2030').attr('stroke-width', 0.5);
      svg.append('text').attr('x', x(yr)).attr('y', H - mb + 28)
        .attr('text-anchor', 'middle').attr('fill', '#6b6b7b').attr('font-size', '11px')
        .attr('font-family', 'Outfit').text(yr);
    }

    // Dynasty bars
    dyns.forEach((d, i) => {
      const y0 = mt + i * (barH + gap);
      const col = colorMode === 'rel'
        ? (REL_C[d.rel] || '#64748b')
        : (ZONE_C[d.zone] || '#64748b');
      const xStart = x(Math.max(d.start, 622));
      const xEnd = x(Math.min(d.end, 1930));
      const bw = Math.max(2, xEnd - xStart);

      svg.append('rect')
        .attr('x', xStart).attr('y', y0)
        .attr('width', bw).attr('height', barH)
        .attr('rx', 3).attr('fill', col).attr('opacity', 0.75)
        .attr('cursor', 'pointer')
        .on('mouseenter', (ev) => {
          const an = analyticsMap[d.id];
          const narr = lf(d, 'narr', lang) || '';
          const narrSnip = narr.length > 120 ? narr.slice(0, 120) + '…' : narr;
          setTooltip({
            x: ev.pageX, y: ev.pageY,
            html: `<b>${n(d, lang)}</b><br/>${d.start}–${d.end} · ${d.zone}<br/>${d.rel || '—'} · ${d.gov || '—'}${an ? '<br/>Power: ' + an.pi : ''}${narrSnip ? '<br/><span style="color:#c4b89a;font-size:10px">' + narrSnip + '</span>' : ''}`
          });
        })
        .on('mouseleave', () => setTooltip(null));

      const label = n(d, lang).length > 26 ? n(d, lang).slice(0, 24) + '…' : n(d, lang);
      svg.append('text')
        .attr('x', ml - 6).attr('y', y0 + barH / 2 + 4)
        .attr('text-anchor', 'end').attr('fill', '#c4b89a')
        .attr('font-size', '10px').attr('font-family', 'Outfit')
        .text(label);

      if (bw > 60) {
        svg.append('text')
          .attr('x', xStart + 4).attr('y', y0 + barH / 2 + 3.5)
          .attr('fill', '#080c18').attr('font-size', '9px').attr('font-family', 'Outfit')
          .attr('font-weight', '600')
          .text(`${d.start}–${d.end}`);
      }
    });

    // ═══ CAUSAL LINK ARROWS ═══
    if (showCausal && dynLinks.length > 0) {
      const TL_LINK_COL = {
        succession: '#4ade80', conquest: '#f87171', division: '#fb923c',
        patronage: '#a78bfa', cultural: '#fbbf24', expansion: '#22d3ee',
        rivalry: '#f472b6', influence: '#60a5fa',
      };

      const linkGroup = svg.append('g').attr('class', 'causal-arrows');

      dynLinks.forEach(link => {
        const srcRow = dynRowMap[link.si];
        const tgtRow = dynRowMap[link.ti];
        if (srcRow === undefined || tgtRow === undefined) return;

        const srcDyn = impDyns[srcRow];
        const tgtDyn = impDyns[tgtRow];
        const connectYear = Math.max(srcDyn.start, tgtDyn.start);
        const cx = x(Math.min(Math.max(connectYear, 600), 1930));
        const sy = mt + srcRow * (barH + gap) + barH / 2;
        const ty = mt + tgtRow * (barH + gap) + barH / 2;

        const col = TL_LINK_COL[link.lt] || '#c9a84c55';
        const desc = (link[`d${lang}`] || link.den || link.dtr);

        const midX = cx + (ty > sy ? 15 : -15);
        const path = `M${cx},${sy} C${midX},${sy} ${midX},${ty} ${cx},${ty}`;

        linkGroup.append('path')
          .attr('d', path)
          .attr('fill', 'none')
          .attr('stroke', col)
          .attr('stroke-width', 1.2)
          .attr('stroke-opacity', 0.5)
          .attr('marker-end', 'url(#arrowhead)')
          .attr('cursor', 'pointer')
          .on('mouseenter', ev => setTooltip({
            x: ev.pageX, y: ev.pageY,
            html: `<b>🔗 ${(t.lk?.types?.[link.lt]) || link.lt}</b><br/>${desc}`
          }))
          .on('mouseleave', () => setTooltip(null));
      });
    }

    const evtY = mt + dyns.length * (barH + gap) + 20;

    // Battles
    if (showBattles) {
      DB.battles.forEach(b => {
        if (!b.yr) return;
        const bx = x(b.yr);
        const r = b.sig === 'Kritik' ? 5 : 3.5;
        svg.append('line').attr('x1', bx).attr('x2', bx)
          .attr('y1', mt).attr('y2', evtY)
          .attr('stroke', '#dc262640').attr('stroke-width', 0.5).attr('stroke-dasharray', '2,3');
        svg.append('circle').attr('cx', bx).attr('cy', evtY)
          .attr('r', r).attr('fill', '#dc2626').attr('opacity', 0.8)
          .attr('cursor', 'pointer')
          .on('mouseenter', ev => {
            const narr = lf(b, 'narr', lang) || '';
            const narrSnip = narr.length > 100 ? narr.slice(0, 100) + '…' : narr;
            setTooltip({
              x: ev.pageX, y: ev.pageY,
              html: `<b>⚔ ${n(b, lang)}</b><br/>${b.yr} · ${t.imp[b.sig] || b.sig}${b.res ? '<br/>' + b.res : ''}${narrSnip ? '<br/><span style="color:#c4b89a;font-size:10px">' + narrSnip + '</span>' : ''}`
            });
          })
          .on('mouseleave', () => setTooltip(null));
      });
    }

    // Events
    if (showEvents) {
      DB.events.forEach(e => {
        if (!e.yr) return;
        const ex = x(e.yr);
        svg.append('rect').attr('x', ex - 3).attr('y', evtY + 18)
          .attr('width', 6).attr('height', 6).attr('rx', 1)
          .attr('fill', '#60a5fa').attr('opacity', 0.7)
          .attr('cursor', 'pointer')
          .on('mouseenter', ev => {
            const narr = lf(e, 'narr', lang) || '';
            const narrSnip = narr.length > 100 ? narr.slice(0, 100) + '…' : narr;
            setTooltip({
              x: ev.pageX, y: ev.pageY,
              html: `<b>📜 ${n(e, lang)}</b><br/>${e.yr} · ${t.imp[e.sig] || e.sig}${narrSnip ? '<br/><span style="color:#c4b89a;font-size:10px">' + narrSnip + '</span>' : ''}`
            });
          })
          .on('mouseleave', () => setTooltip(null));
      });
    }

    // Scholars
    if (showScholars) {
      const lanes = 8;
      DB.scholars.forEach((s, i) => {
        if (!s.b || !s.d) return;
        const lane = i % lanes;
        const sy = evtY + 40 + lane * 10;
        svg.append('line')
          .attr('x1', x(s.b)).attr('x2', x(s.d))
          .attr('y1', sy).attr('y2', sy)
          .attr('stroke', '#34d399').attr('stroke-width', 3)
          .attr('stroke-linecap', 'round').attr('opacity', 0.6)
          .attr('cursor', 'pointer')
          .on('mouseenter', ev => {
            const narr = lf(s, 'narr', lang) || '';
            const narrSnip = narr.length > 100 ? narr.slice(0, 100) + '…' : narr;
            setTooltip({
              x: ev.pageX, y: ev.pageY,
              html: `<b>📚 ${n(s, lang)}</b><br/>${s.b}–${s.d} · ${s.field}<br/>${lf(s, 'work', lang)}${narrSnip ? '<br/><span style="color:#c4b89a;font-size:10px">' + narrSnip + '</span>' : ''}`
            });
          })
          .on('mouseleave', () => setTooltip(null));
      });
    }

    // Rulers - small ticks on dynasty bars
    if (showRulers) {
      const dynNameMap = {};
      DB.dynasties.forEach(d => { dynNameMap[d.id] = n(d, lang); });

      (DB.rulers || []).forEach(r => {
        if (!r.rs || !r.did) return;
        const row = dynRowMap[r.did];
        if (row === undefined) return;
        const rx = x(Math.min(Math.max(r.rs, 600), 1930));
        const ry = mt + row * (barH + gap);

        // Small tick mark at reign start
        svg.append('line')
          .attr('x1', rx).attr('x2', rx)
          .attr('y1', ry).attr('y2', ry + barH)
          .attr('stroke', '#e879f9').attr('stroke-width', 1)
          .attr('opacity', 0.7)
          .attr('cursor', 'pointer')
          .on('mouseenter', ev => {
            const badges = [];
            if (r.fnd) badges.push('★ Founder');
            if (r.lst) badges.push('◆ Last');
            setTooltip({
              x: ev.pageX, y: ev.pageY,
              html: `<b>👑 ${r.n}</b><br/>${r.rs}–${r.re || '?'} · ${r.role || ''}${r.dur ? '<br/>Duration: ' + r.dur + ' yr' : ''}${badges.length ? '<br/>' + badges.join(' · ') : ''}<br/><span style="color:#c4b89a;font-size:10px">${dynNameMap[r.did] || ''}</span>`
            });
          })
          .on('mouseleave', () => setTooltip(null));
      });
    }
  }, [impDyns, colorMode, showBattles, showEvents, showScholars, showRulers, showCausal, dynLinks, dynRowMap, zoom, lang, t, analyticsMap]);

  return (
    <div className="tl-wrap">
      <div className="tl-toolbar">
        <div className="tl-grp">
          <span className="tl-label">{t.tl.colorBy}:</span>
          <button className={`tl-btn${colorMode === 'rel' ? ' active' : ''}`} onClick={() => setColorMode('rel')}>{t.tl.byRel}</button>
          <button className={`tl-btn${colorMode === 'zone' ? ' active' : ''}`} onClick={() => setColorMode('zone')}>{t.tl.byZone}</button>
        </div>
        <div className="tl-grp">
          <button className={`tl-btn${showBattles ? ' active' : ''}`} onClick={() => setShowBattles(p => !p)}>⚔ {t.tl.battles}</button>
          <button className={`tl-btn${showEvents ? ' active' : ''}`} onClick={() => setShowEvents(p => !p)}>📜 {t.tl.events}</button>
          <button className={`tl-btn${showScholars ? ' active' : ''}`} onClick={() => setShowScholars(p => !p)}>📚 {t.tl.scholars}</button>
          <button className={`tl-btn${showRulers ? ' active' : ''}`} onClick={() => setShowRulers(p => !p)}>👑 {t.m.rulers}</button>
          <button className={`tl-btn${showCausal ? ' active' : ''}`} onClick={() => setShowCausal(p => !p)}>🔗 {{ tr: 'Nedensellik', en: 'Causality', ar: '' }[lang]}</button>
        </div>
        <div className="tl-grp">
          <button className="tl-btn" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>🔍−</button>
          <span className="tl-label">{Math.round(zoom * 100)}%</span>
          <button className="tl-btn" onClick={() => setZoom(z => Math.min(3, z + 0.25))}>🔍+</button>
        </div>
      </div>
      <div className="tl-scroll">
        <svg ref={svgRef} />
      </div>
      {tooltip && (
        <div className="tt" style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
          dangerouslySetInnerHTML={{ __html: tooltip.html }} />
      )}
      {selectedEra && (
        <EraCard
          eraId={selectedEra}
          lang={lang}
          onClose={() => setSelectedEra(null)}
          onFlyTo={() => {}}
        />
      )}
    </div>
  );
}
