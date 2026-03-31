/**
 * DiscoveryTimeline.jsx — islamicatlas.org Science Layer
 *
 * Horizontal scrollable SVG timeline, same visual language as TimelineView.
 * Uses project CSS variables (--bg, --gold, --text, --border, --cream2).
 */

import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { FIELD_COLORS, FIELD_NAMES } from './ScienceLayerView';

const TL_T = {
  tr: { title: 'Keşif Zaman Çizelgesi', close: 'Kapat', ce: 'MS', by: '—' },
  en: { title: 'Discovery Timeline', close: 'Close', ce: 'CE', by: 'by' },
  ar: { title: 'الخط الزمني للاكتشافات', close: 'إغلاق', ce: 'م', by: '—' },
};

const PERIOD_BANDS = [
  { start: 661,  end: 750,  color: '#22c55e', opacity: 0.06 },
  { start: 750,  end: 1258, color: '#f59e0b', opacity: 0.06 },
  { start: 1037, end: 1194, color: '#3b82f6', opacity: 0.04 },
  { start: 711,  end: 1492, color: '#ef4444', opacity: 0.03 },
  { start: 1250, end: 1517, color: '#ec4899', opacity: 0.04 },
  { start: 1299, end: 1922, color: '#14b8a6', opacity: 0.06 },
];

const TH = 130, DOT_R = 6, TOP_PAD = 32, BOT_PAD = 28;
const YEAR_MIN = 650, YEAR_MAX = 1920, PX_PER_Y = 4.5;
const yearX = (y) => (y - YEAR_MIN) * PX_PER_Y;
const TOTAL_W = (YEAR_MAX - YEAR_MIN) * PX_PER_Y;

export default function DiscoveryTimeline({ lang, discoveries, scholars, onDiscoveryClick, onClose }) {
  const tr = TL_T[lang] || TL_T.en;
  const scrollRef = useRef(null);
  const [hovId, setHovId] = useState(null);
  const [tip, setTip] = useState(null);

  const nameMap = useMemo(() => {
    const m = {};
    scholars.forEach(s => { m[s.id] = s.name?.[lang] || s.name?.en || ''; });
    return m;
  }, [scholars, lang]);

  const sorted = useMemo(() => [...discoveries].sort((a, b) => a.year - b.year), [discoveries]);

  // lane assignment
  const positions = useMemo(() => {
    const lanes = [];
    return sorted.map(d => {
      const x = yearX(d.year);
      let lane = 0;
      for (let i = 0; i < lanes.length; i++) {
        if (yearX(lanes[i]) + 55 < x) { lane = i; break; }
        lane = i + 1;
      }
      lanes[lane] = d.year;
      return { ...d, x, y: TOP_PAD + (lane % 3) * 24 };
    });
  }, [sorted]);

  // century ticks
  const ticks = useMemo(() => {
    const t = [];
    for (let y = 700; y <= 1900; y += 100) t.push({ year: y, x: yearX(y) });
    return t;
  }, []);

  // scroll to ~900 CE on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = Math.max(0, yearX(900) - scrollRef.current.clientWidth / 2);
    }
  }, []);

  // wheel → horizontal scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const h = (e) => { e.preventDefault(); el.scrollLeft += e.deltaY * 1.5; };
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
  }, []);

  return (
    <div className="sci-timeline">
      <div className="sci-timeline-header">
        <h4 className="sci-timeline-title">{tr.title}</h4>
        <span className="sci-badge">{discoveries.length}</span>
        <button className="sci-timeline-close" onClick={onClose} title={tr.close}>✕</button>
      </div>

      <div className="sci-timeline-scroll" ref={scrollRef}>
        <svg width={TOTAL_W + 60} height={TH} viewBox={`0 0 ${TOTAL_W + 60} ${TH}`}>
          {/* period bands */}
          {PERIOD_BANDS.map((b, i) => (
            <rect key={i} x={yearX(b.start)} y={0} width={yearX(b.end) - yearX(b.start)} height={TH} fill={b.color} opacity={b.opacity} />
          ))}

          {/* axis */}
          <line x1={0} y1={TH - BOT_PAD} x2={TOTAL_W + 40} y2={TH - BOT_PAD} stroke="rgba(var(--border-rgb,30,42,68),0.4)" strokeWidth={1} />

          {/* ticks */}
          {ticks.map(t => (
            <g key={t.year}>
              <line x1={t.x} y1={TH - BOT_PAD - 4} x2={t.x} y2={TH - BOT_PAD + 4} stroke="rgba(var(--cream2-rgb,196,184,154),0.4)" strokeWidth={1} />
              <line x1={t.x} y1={0} x2={t.x} y2={TH - BOT_PAD - 4} stroke="rgba(var(--border-rgb,30,42,68),0.15)" strokeWidth={1} />
              <text x={t.x} y={TH - BOT_PAD + 15} textAnchor="middle" fill="rgba(var(--cream2-rgb,196,184,154),0.6)" fontSize="10" fontFamily="inherit">{t.year}</text>
            </g>
          ))}

          {/* stems */}
          {positions.map(d => (
            <line key={`s-${d.id}`} x1={d.x} y1={d.y + DOT_R} x2={d.x} y2={TH - BOT_PAD}
              stroke={FIELD_COLORS[d.field] || '#888'} strokeWidth={1} opacity={hovId === d.id ? 0.6 : 0.12} strokeDasharray="2,3" />
          ))}

          {/* dots */}
          {positions.map(d => {
            const c = FIELD_COLORS[d.field] || '#888';
            const hov = hovId === d.id;
            return (
              <g key={d.id}>
                {hov && <circle cx={d.x} cy={d.y} r={DOT_R + 4} fill={c} opacity={0.25} />}
                <circle cx={d.x} cy={d.y} r={hov ? DOT_R + 1 : DOT_R}
                  fill={c} stroke="rgba(0,0,0,0.3)" strokeWidth={1} opacity={hov ? 1 : 0.85}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => { setHovId(d.id); const r = scrollRef.current?.getBoundingClientRect(); if (r) setTip({ x: e.clientX - r.left + scrollRef.current.scrollLeft, y: e.clientY - r.top, d }); }}
                  onMouseLeave={() => { setHovId(null); setTip(null); }}
                  onClick={() => onDiscoveryClick?.(d)}
                />
                {!hov && <text x={d.x} y={d.y - DOT_R - 3} textAnchor="middle" fill="rgba(var(--cream2-rgb,196,184,154),0.5)" fontSize="8" fontFamily="inherit">{d.year}</text>}
              </g>
            );
          })}
        </svg>

        {/* tooltip */}
        {tip && (
          <div className="sci-timeline-tip" style={{ left: tip.x, top: tip.y - 55, transform: 'translateX(-50%)' }}>
            <strong>{tip.d.name?.[lang] || tip.d.name?.en}</strong>
            <span style={{ color: 'var(--gold)' }}>{tip.d.year} {tr.ce}</span>
            <span>{tr.by} {nameMap[tip.d.scholar_id] || ''}</span>
            <span style={{ color: FIELD_COLORS[tip.d.field] || '#888', fontWeight: 600 }}>{FIELD_NAMES[tip.d.field]?.[lang] || tip.d.field}</span>
          </div>
        )}
      </div>
    </div>
  );
}
