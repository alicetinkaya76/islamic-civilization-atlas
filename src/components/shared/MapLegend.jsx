import { useState } from 'react';
import { REL_C, IMP_OP } from '../../config/colors';
import '../../styles/legend.css';

const ENTITY_ITEMS = [
  {
    key: 'dynasty',
    svg: (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <rect x="1" y="1" width="16" height="16" rx="2" fill="#c9a84c" fillOpacity="0.35" stroke="#c9a84c" strokeWidth="1.5"/>
        <circle cx="9" cy="9" r="3" fill="#c9a84c" fillOpacity="0.9" stroke="#080c18" strokeWidth="0.8"/>
      </svg>
    )
  },
  {
    key: 'battle',
    svg: (
      <svg width="18" height="18" viewBox="0 0 22 22">
        <g stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round">
          <line x1="5" y1="5" x2="17" y2="17"/>
          <line x1="17" y1="5" x2="5" y2="17"/>
        </g>
        <circle cx="11" cy="11" r="2.5" fill="#dc2626" opacity="0.6"/>
      </svg>
    )
  },
  {
    key: 'event',
    svg: (
      <svg width="18" height="18" viewBox="0 0 20 20">
        <rect x="2" y="2" width="16" height="16" rx="4" fill="#60a5fa" stroke="#fff" strokeWidth="1"/>
        <circle cx="10" cy="10" r="2.5" fill="#fff" opacity="0.5"/>
      </svg>
    )
  },
  {
    key: 'scholar',
    svg: (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <circle cx="9" cy="9" r="8" fill="#fff" opacity="0.25"/>
        <circle cx="9" cy="9" r="5.5" fill="#34d399" stroke="#fff" strokeWidth="1.2"/>
      </svg>
    )
  },
  {
    key: 'monument',
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24">
        <polygon points="12,2 22,22 2,22" fill="#fbbf24" stroke="#fff" strokeWidth="1" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    key: 'city',
    svg: (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <circle cx="9" cy="9" r="6" fill="#f97316" fillOpacity="0.65" stroke="#fff" strokeWidth="1"/>
      </svg>
    )
  },
  {
    key: 'route',
    svg: (
      <svg width="18" height="18" viewBox="0 0 18 6">
        <line x1="0" y1="3" x2="18" y2="3" stroke="#c9a84c" strokeWidth="3" strokeDasharray="5,3" opacity="0.8"/>
      </svg>
    )
  },
  {
    key: 'ruler',
    svg: (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <circle cx="9" cy="9" r="4.5" fill="#e879f9" fillOpacity="0.9" stroke="#fff" strokeWidth="1"/>
      </svg>
    )
  }
];

const IMP_ITEMS = [
  { key: 'Kritik', op: IMP_OP['Kritik'], w: 4 },
  { key: 'Yüksek', op: IMP_OP['Yüksek'], w: 3 },
  { key: 'Normal', op: IMP_OP['Normal'], w: 1.4 },
  { key: 'Düşük', op: IMP_OP['Düşük'], w: 1.4, dash: true }
];

const LABELS = {
  tr: {
    legend: 'Lejant',
    sects: 'Mezhep Renkleri',
    entities: 'Varlık Tipleri',
    importance: 'Önem Dereceleri',
    dynasty: 'Hanedan', battle: 'Savaş', event: 'Olay',
    scholar: 'Âlim', monument: 'Eser', city: 'Şehir',
    route: 'Ticaret Yolu', ruler: 'Hükümdar',
    Kritik: 'Kritik', Yüksek: 'Yüksek', Normal: 'Normal', Düşük: 'Düşük',
    'Sünnî': 'Sünnî', 'Şiî': 'Şiî', 'Hâricî': 'Hâricî', '': 'Diğer'
  },
  en: {
    legend: 'Legend',
    sects: 'Sect Colors',
    entities: 'Entity Types',
    importance: 'Importance Levels',
    dynasty: 'Dynasty', battle: 'Battle', event: 'Event',
    scholar: 'Scholar', monument: 'Monument', city: 'City',
    route: 'Trade Route', ruler: 'Ruler',
    Kritik: 'Critical', Yüksek: 'High', Normal: 'Normal', Düşük: 'Low',
    'Sünnî': 'Sunni', 'Şiî': 'Shia', 'Hâricî': 'Kharijite', '': 'Other'
  }
};

export default function MapLegend({ lang }) {
  const [open, setOpen] = useState(false);
  const l = LABELS[lang] || LABELS.tr;

  return (
    <div className={`map-legend ${open ? 'legend-open' : 'legend-closed'}`}>
      <button className="legend-toggle" onClick={() => setOpen(p => !p)}
        aria-label={l.legend} aria-expanded={open}>
        {open ? '✕' : '☰'} <span className="legend-toggle-label">{l.legend}</span>
      </button>

      {open && (
        <div className="legend-body">
          {/* Sect Colors */}
          <div className="legend-section">
            <div className="legend-section-title">{l.sects}</div>
            {Object.entries(REL_C).map(([key, color]) => (
              <div className="legend-row" key={key || '_other'}>
                <span className="legend-swatch" style={{ background: color }} />
                <span className="legend-label">{l[key] || l['']}</span>
              </div>
            ))}
          </div>

          {/* Entity Types */}
          <div className="legend-section">
            <div className="legend-section-title">{l.entities}</div>
            {ENTITY_ITEMS.map(item => (
              <div className="legend-row" key={item.key}>
                <span className="legend-icon">{item.svg}</span>
                <span className="legend-label">{l[item.key]}</span>
              </div>
            ))}
          </div>

          {/* Importance Levels */}
          <div className="legend-section">
            <div className="legend-section-title">{l.importance}</div>
            {IMP_ITEMS.map(item => (
              <div className="legend-row" key={item.key}>
                <svg width="30" height="14" viewBox="0 0 30 14">
                  <rect x="1" y="1" width="28" height="12" rx="2"
                    fill="#c9a84c" fillOpacity={item.op * 1.2}
                    stroke="#c9a84c" strokeWidth={item.w}
                    strokeDasharray={item.dash ? '3,2' : 'none'} />
                </svg>
                <span className="legend-label">{l[item.key]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
