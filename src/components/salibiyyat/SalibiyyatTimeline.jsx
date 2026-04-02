import { useState, useMemo } from 'react';
import SalibiyyatCanvasTimeline from './SalibiyyatCanvasTimeline';

/**
 * SalibiyyatTimeline — Ported from standalone TimelinePage.jsx
 * Source/type filters + decade distribution bar + Canvas bee-swarm chart.
 *
 * Props:
 *   events         — events[] array
 *   sources        — sources[] array (full objects)
 *   srcColors      — { shortCode: '#hex' }
 *   srcNames       — { shortCode: 'name' }
 *   eventTypeLabels — { typeCode: 'label' }
 *   tr             — i18n object (SAL_T)
 */
export default function SalibiyyatTimeline({
  events = [], sources = [], srcColors = {}, srcNames = {},
  eventTypeLabels = {}, tr = {}
}) {
  const [srcFilter, setSrcFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Normalize field access
  const getYear = (e) => e.year !== undefined ? e.year : e.y;
  const getSrc = (e) => e.source_short || e.s;
  const getType = (e) => e.type || e.t;

  const allTypes = useMemo(() => {
    const tMap = {};
    events.forEach(e => { const t = getType(e); if (t) tMap[t] = (tMap[t] || 0) + 1; });
    return Object.entries(tMap).sort((a, b) => b[1] - a[1]);
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter(e => {
      if (getYear(e) === null || getYear(e) === undefined) return false;
      if (srcFilter !== 'all' && getSrc(e) !== srcFilter) return false;
      if (typeFilter !== 'all' && getType(e) !== typeFilter) return false;
      return true;
    });
  }, [events, srcFilter, typeFilter]);

  const decades = useMemo(() => {
    const d = {};
    filtered.forEach(e => {
      const dec = Math.floor(getYear(e) / 10) * 10;
      d[dec] = (d[dec] || 0) + 1;
    });
    return Object.entries(d).sort((a, b) => +a[0] - +b[0]);
  }, [filtered]);
  const maxDecCount = decades.length ? Math.max(...decades.map(([, c]) => c)) : 1;

  const tl = tr.timeline || {};

  return (
    <div className="sal-subtab-container">
      {/* Header */}
      <div className="sal-subtab-header sal-fade-in">
        <h2 className="sal-subtab-title">{tl.title || 'Zaman Çizelgesi'}</h2>
        <p className="sal-subtab-title-ar">{tl.title_ar || 'الجدول الزمني'}</p>
        <p className="sal-subtab-desc">
          {(tl.subtitle || '1096–1466 yılları arasında {{count}} olayın kronolojik akışı.').replace('{{count}}', events.length)}
        </p>
        <div className="sal-gold-line" style={{ width: 80 }} />
      </div>

      {/* Filters */}
      <div className="sal-glass-card sal-timeline-filters sal-fade-in">
        <div className="sal-timeline-filter-group">
          <label className="sal-filter-label">{tl.source_filter || 'Kaynak'}</label>
          <div className="sal-filter-tags">
            <button onClick={() => setSrcFilter('all')}
              className={`sal-tag sal-tag--btn ${srcFilter === 'all' ? 'sal-tag--active' : ''}`}>
              {tl.all || 'Tümü'}
            </button>
            {sources.map(s => (
              <button key={s.short} onClick={() => setSrcFilter(s.short)}
                className={`sal-tag sal-tag--btn ${srcFilter === s.short ? 'sal-tag--active' : ''}`}
                style={srcFilter === s.short ? { borderColor: s.color, color: s.color } : {}}>
                {s.full_tr}
              </button>
            ))}
          </div>
        </div>

        <div className="sal-timeline-filter-group">
          <label className="sal-filter-label">{tl.type_filter || 'Olay Türü'}</label>
          <div className="sal-filter-tags">
            <button onClick={() => setTypeFilter('all')}
              className={`sal-tag sal-tag--btn ${typeFilter === 'all' ? 'sal-tag--active' : ''}`}>
              {tl.all || 'Tümü'}
            </button>
            {allTypes.slice(0, 10).map(([tp, cnt]) => (
              <button key={tp} onClick={() => setTypeFilter(tp)}
                className={`sal-tag sal-tag--btn ${typeFilter === tp ? 'sal-tag--active' : ''}`}>
                {eventTypeLabels[tp] || tp} ({cnt})
              </button>
            ))}
          </div>
        </div>

        <div className="sal-timeline-count">
          {(tl.showing || '{{count}} olay gösteriliyor').replace('{{count}}', filtered.length)}
        </div>
      </div>

      {/* Distribution bar */}
      <div className="sal-glass-card sal-timeline-distbar sal-fade-in">
        <h3 className="sal-filter-label">{tl.distribution || 'Dağılım'}</h3>
        <div className="sal-distbar">
          {decades.map(([dec, cnt]) => (
            <div key={dec} className="sal-distbar__col" title={`${dec}s: ${cnt}`}>
              <span className="sal-distbar__cnt">{cnt}</span>
              <div className="sal-distbar__bar"
                style={{
                  height: `${Math.max(4, (cnt / maxDecCount) * 100)}%`,
                  background: srcFilter !== 'all'
                    ? srcColors[srcFilter]
                    : 'linear-gradient(to top, rgba(212,168,72,0.4), rgba(212,168,72,0.7))',
                  opacity: 0.6,
                }} />
            </div>
          ))}
        </div>
        {decades.length > 0 && (
          <div className="sal-distbar__labels">
            <span>{decades[0]?.[0]}s</span>
            <span>{decades[decades.length - 1]?.[0]}s</span>
          </div>
        )}
      </div>

      {/* Canvas Timeline */}
      <div className="sal-fade-in">
        <SalibiyyatCanvasTimeline
          events={events} sources={sources}
          filters={{ source: srcFilter, type: typeFilter }}
          srcColors={srcColors} srcNames={srcNames}
          eventTypeLabels={eventTypeLabels}
        />
        <p className="sal-timeline-hint">{tl.zoom_hint || 'Fare tekerleği ile yakınlaştır / uzaklaştır, sürükleyerek kaydır'}</p>
      </div>
    </div>
  );
}
