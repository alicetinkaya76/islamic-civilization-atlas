/**
 * VoyageTimeline.jsx — Yatay zaman çizelgesi (1630–1682)
 * Scroll arrows + keyboard accessibility
 * v8.0.0.0 — improved: correct ARIA role, shared voyageNameKey
 */
import React, { useRef, useCallback } from 'react';
import { voyageNameKey } from './constants';

export default function VoyageTimeline({ voyages, selectedVoyages, onToggle, lang }) {
  const scrollRef = useRef(null);
  const nameKey = voyageNameKey(lang);

  const minYear = 1625;
  const maxYear = 1685;
  const totalYears = maxYear - minYear;
  const pxPerYear = 18;

  const scroll = useCallback((dir) => {
    scrollRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
  }, []);

  return (
    <div className="evliya-timeline-container" role="group" aria-label="Voyage timeline filter">
      <button
        className="evliya-timeline-arrow left"
        onClick={() => scroll(-1)}
        aria-label="Scroll left"
      >
        ‹
      </button>

      <div className="evliya-timeline-scroll" ref={scrollRef}>
        <div className="evliya-timeline" style={{ width: totalYears * pxPerYear + 40 }}>
          {/* Year axis */}
          <div className="evliya-timeline-axis">
            {Array.from({ length: Math.ceil(totalYears / 5) + 1 }, (_, i) => {
              const year = minYear + i * 5;
              return (
                <span
                  key={year}
                  className="evliya-timeline-tick"
                  style={{ left: (year - minYear) * pxPerYear }}
                >
                  {year}
                </span>
              );
            })}
          </div>

          {/* Voyage bars */}
          <div className="evliya-timeline-bars">
            {voyages.map(v => {
              const left = (v.start_year - minYear) * pxPerYear;
              const width = Math.max((v.end_year - v.start_year) * pxPerYear, 30);
              const active = selectedVoyages.has(v.id);

              return (
                <div
                  key={v.id}
                  className={`evliya-timeline-bar ${active ? 'active' : 'inactive'}`}
                  style={{
                    left,
                    width,
                    background: active ? v.color : 'rgba(128,128,128,0.3)',
                    borderColor: v.color,
                  }}
                  onClick={() => onToggle(v.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(v.id); } }}
                  role="checkbox"
                  aria-checked={active}
                  tabIndex={0}
                  title={`${v.id}: ${v[nameKey] || v.title_tr} (${v.start_year}–${v.end_year})`}
                >
                  <span className="evliya-timeline-bar-label">{v.id}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <button
        className="evliya-timeline-arrow right"
        onClick={() => scroll(1)}
        aria-label="Scroll right"
      >
        ›
      </button>
    </div>
  );
}
