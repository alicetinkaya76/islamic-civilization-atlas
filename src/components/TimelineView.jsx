import { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import DB from '../data/db.json';
import { REL_C, ZONE_C, eraName, n } from '../data/constants';

export default function TimelineView({ lang, t }) {
  const svgRef = useRef(null);
  const [colorMode, setColorMode] = useState('rel');
  const [showBattles, setShowBattles] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showScholars, setShowScholars] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [tooltip, setTooltip] = useState(null);

  const impDyns = useMemo(() =>
    DB.dynasties
      .filter(d => d.imp !== 'Düşük' && d.start && d.end && d.end > d.start)
      .sort((a, b) => a.start - b.start || b.end - a.end),
    []
  );

  const analyticsMap = useMemo(() => {
    const m = {}; DB.analytics.forEach(a => { m[a.id] = a; }); return m;
  }, []);

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

    const x = d3.scaleLinear().domain([600, 1930]).range([ml, W - mr]);

    // Era bands
    const eras = [
      [622, 661, '#1a2a1a', lang === 'tr' ? 'Râşidîn' : 'Rashidun'],
      [661, 750, '#2a2a1a', lang === 'tr' ? 'Emevî' : 'Umayyad'],
      [750, 1055, '#1a1a2a', lang === 'tr' ? 'Abbâsî' : 'Abbasid'],
      [1055, 1258, '#2a1a1a', lang === 'tr' ? 'Selçuklu' : 'Seljuq'],
      [1258, 1500, '#1a2a2a', lang === 'tr' ? 'Moğol/Timurlu' : 'Mongol/Timurid'],
      [1500, 1800, '#2a1a2a', lang === 'tr' ? 'Erken Modern' : 'Early Modern'],
      [1800, 1924, '#1a1a1a', lang === 'tr' ? 'Modern' : 'Modern'],
    ];
    eras.forEach(([s, e, fill, label]) => {
      svg.append('rect').attr('x', x(s)).attr('y', mt - 10)
        .attr('width', x(e) - x(s)).attr('height', H - mt - mb + 20)
        .attr('fill', fill).attr('opacity', 0.3);
      svg.append('text').attr('x', x((s + e) / 2)).attr('y', mt - 16)
        .attr('text-anchor', 'middle').attr('fill', '#6b6040').attr('font-size', '10px')
        .attr('font-family', 'Outfit').text(label);
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
      const xStart = x(Math.max(d.start, 600));
      const xEnd = x(Math.min(d.end, 1930));
      const bw = Math.max(2, xEnd - xStart);

      svg.append('rect')
        .attr('x', xStart).attr('y', y0)
        .attr('width', bw).attr('height', barH)
        .attr('rx', 3).attr('fill', col).attr('opacity', 0.75)
        .attr('cursor', 'pointer')
        .on('mouseenter', (ev) => {
          const an = analyticsMap[d.id];
          setTooltip({
            x: ev.pageX, y: ev.pageY,
            html: `<b>${n(d, lang)}</b><br/>${d.start}–${d.end} · ${d.zone}<br/>${d.rel || '—'} · ${d.gov || '—'}${an ? '<br/>Power: ' + an.pi : ''}`
          });
        })
        .on('mouseleave', () => setTooltip(null));

      // Label
      const label = n(d, lang).length > 26 ? n(d, lang).slice(0, 24) + '…' : n(d, lang);
      svg.append('text')
        .attr('x', ml - 6).attr('y', y0 + barH / 2 + 4)
        .attr('text-anchor', 'end').attr('fill', '#c4b89a')
        .attr('font-size', '10px').attr('font-family', 'Outfit')
        .text(label);

      // Date labels for wide bars
      if (bw > 60) {
        svg.append('text')
          .attr('x', xStart + 4).attr('y', y0 + barH / 2 + 3.5)
          .attr('fill', '#080c18').attr('font-size', '9px').attr('font-family', 'Outfit')
          .attr('font-weight', '600')
          .text(`${d.start}–${d.end}`);
      }
    });

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
          .on('mouseenter', ev => setTooltip({
            x: ev.pageX, y: ev.pageY,
            html: `<b>⚔ ${n(b, lang)}</b><br/>${b.yr} · ${t.imp[b.sig] || b.sig}${b.res ? '<br/>' + b.res : ''}`
          }))
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
          .on('mouseenter', ev => setTooltip({
            x: ev.pageX, y: ev.pageY,
            html: `<b>📜 ${n(e, lang)}</b><br/>${e.yr} · ${t.imp[e.sig] || e.sig}${e.desc ? '<br/>' + e.desc : ''}`
          }))
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
          .on('mouseenter', ev => setTooltip({
            x: ev.pageX, y: ev.pageY,
            html: `<b>📚 ${n(s, lang)}</b><br/>${s.b}–${s.d} · ${s.field}<br/>${lang === 'tr' ? s.work_tr : s.work_en}`
          }))
          .on('mouseleave', () => setTooltip(null));
      });
    }
  }, [impDyns, colorMode, showBattles, showEvents, showScholars, zoom, lang, t, analyticsMap]);

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
    </div>
  );
}
