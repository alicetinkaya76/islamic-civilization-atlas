import { useMemo } from 'react';
import SalibiyyatEventNetwork from './SalibiyyatEventNetwork';

/**
 * SalibiyyatSourceDetail — Source profile detail view
 * Ported from standalone SourceDetail.jsx
 *
 * Props:
 *   source          — single source object
 *   events          — all events[]
 *   eventTypeLabels — { typeCode: 'label' }
 *   outcomeLabels   — { outcomeCode: 'label' }
 *   tr              — i18n object (SAL_T)
 *   onBack          — callback to return to sources grid
 */
export default function SalibiyyatSourceDetail({
  source, events = [], eventTypeLabels = {}, outcomeLabels = {},
  tr = {}, onBack
}) {
  // Normalize
  const getSrc = (e) => e.source_short || e.s;
  const getYear = (e) => e.year !== undefined ? e.year : e.y;
  const getType = (e) => e.type || e.t;
  const getOutcome = (e) => e.outcome || e.u;
  const getTitle = (e) => e.title || e.n;
  const getLoc = (e) => e.location || e.l;
  const getArabic = (e) => e.arabic_text || e.r;

  const srcEvents = useMemo(() => events.filter(e => getSrc(e) === source.short), [events, source]);

  const sortedTypes = useMemo(() => {
    const tc = {};
    srcEvents.forEach(e => { const t = getType(e); tc[t] = (tc[t] || 0) + 1; });
    return Object.entries(tc).sort((a, b) => b[1] - a[1]);
  }, [srcEvents]);

  const outcomeCount = useMemo(() => {
    const oc = {};
    srcEvents.forEach(e => { const o = getOutcome(e); if (o && o !== 'not_applicable') oc[o] = (oc[o] || 0) + 1; });
    return oc;
  }, [srcEvents]);

  const decades = useMemo(() => {
    const d = {};
    srcEvents.forEach(e => { const yr = getYear(e); if (yr) { const dec = Math.floor(yr / 10) * 10; d[dec] = (d[dec] || 0) + 1; } });
    return d;
  }, [srcEvents]);
  const maxDec = Math.max(...Object.values(decades), 1);

  const sd = tr.source_detail || {};

  return (
    <div className="sal-subtab-container">
      {/* Back button */}
      <button className="sal-source-back sal-fade-in" onClick={onBack}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        {sd.back || 'Kaynaklara dön'}
      </button>

      {/* Header */}
      <div className="sal-subtab-header sal-fade-in" style={{ marginTop: 8 }}>
        <div className="sal-source-detail-header">
          <div>
            <h2 className="sal-subtab-title">{source.full_tr}</h2>
            <p className="sal-subtab-desc" style={{ marginTop: 4 }}>{source.full_en}</p>
            <p className="sal-source-detail-work">{source.work_tr} · {source.work_en}</p>
          </div>
          <div className="sal-source-detail-ar">
            <div className="sal-source-detail-ar__name">{source.name_ar}</div>
            <div className="sal-source-detail-ar__work" dir="rtl">{source.work_ar}</div>
          </div>
        </div>
        <div className="sal-filter-tags" style={{ marginTop: 16 }}>
          <span className="sal-tag" style={{ borderColor: source.color, color: source.color, fontWeight: 600 }}>
            {source.record_count} {sd.records || 'kayıt'}
          </span>
          <span className="sal-tag">{source.period}</span>
          <span className="sal-tag">{source.perspective?.replace(/_/g, ' ')}</span>
        </div>
        <div style={{ height: 4, borderRadius: 2, marginTop: 16, maxWidth: 200, background: source.color, opacity: 0.5 }} />
      </div>

      {/* Decades distribution */}
      <div className="sal-fade-in">
        <h3 className="sal-section-title">{sd.time_dist || 'Zaman Dağılımı (On Yıllık)'}</h3>
        <div className="sal-glass-card" style={{ padding: 20, marginBottom: 32 }}>
          <div className="sal-distbar sal-distbar--tall">
            {Object.entries(decades).sort((a, b) => +a[0] - +b[0]).map(([dec, cnt]) => (
              <div key={dec} className="sal-distbar__col" title={`${dec}s: ${cnt}`}>
                <span className="sal-distbar__cnt">{cnt}</span>
                <div className="sal-distbar__bar"
                  style={{ height: `${(cnt / maxDec) * 100}%`, background: source.color, opacity: 0.6, minHeight: 4 }} />
                <span className="sal-distbar__dec-label">{dec}s</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* D3 Network */}
      <div className="sal-fade-in">
        <h3 className="sal-section-title">{sd.network_title || 'Olay Ağı'}</h3>
        <div style={{ marginBottom: 32 }}>
          <SalibiyyatEventNetwork events={srcEvents} sourceColor={source.color} sourceName={source.full_tr} tr={tr} />
          <p className="sal-timeline-hint">Sürükle, yakınlaştır/uzaklaştır. Büyük düğümler konumları, küçükler olayları temsil eder.</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="sal-source-stats-grid sal-fade-in">
        {/* Event types */}
        <div className="sal-glass-card" style={{ padding: 20 }}>
          <h4 className="sal-filter-label">{sd.event_types || 'Olay Türleri'}</h4>
          <div className="sal-bar-list">
            {sortedTypes.map(([type, cnt]) => (
              <div key={type} className="sal-bar-list__row">
                <span className="sal-bar-list__label">{eventTypeLabels[type] || type}</span>
                <div className="sal-bar-list__track">
                  <div className="sal-bar-list__fill" style={{ width: `${(cnt / srcEvents.length) * 100}%`, background: source.color, opacity: 0.6 }} />
                </div>
                <span className="sal-bar-list__val">{cnt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Outcomes + Geo */}
        <div className="sal-glass-card" style={{ padding: 20 }}>
          <h4 className="sal-filter-label">{sd.outcomes || 'Sonuçlar'}</h4>
          {Object.keys(outcomeCount).length > 0 ? (
            <div className="sal-bar-list">
              {Object.entries(outcomeCount).sort((a, b) => b[1] - a[1]).map(([out, cnt]) => (
                <div key={out} className="sal-bar-list__row">
                  <span className="sal-bar-list__label">{outcomeLabels[out] || out}</span>
                  <div className="sal-bar-list__track">
                    <div className="sal-bar-list__fill" style={{ width: `${(cnt / srcEvents.length) * 100}%`, background: 'rgba(212,168,72,0.5)' }} />
                  </div>
                  <span className="sal-bar-list__val">{cnt}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="sal-subtab-desc">{sd.no_outcome || 'Bu kaynak için sonuç verisi bulunmamaktadır.'}</p>
          )}

          <h4 className="sal-filter-label" style={{ marginTop: 24 }}>{sd.geo_dist || 'Coğrafi Dağılım'}</h4>
          <div className="sal-geo-list">
            {(() => {
              const locs = {};
              srcEvents.forEach(e => { const loc = getLoc(e); if (loc) locs[loc] = (locs[loc] || 0) + 1; });
              return Object.entries(locs).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([loc, cnt]) => (
                <div key={loc} className="sal-geo-list__row">
                  <span>{loc}</span><span>{cnt}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Events list */}
      <div className="sal-fade-in" style={{ marginTop: 32 }}>
        <h3 className="sal-section-title">{sd.events || 'Olaylar'} ({srcEvents.length})</h3>
        <div className="sal-events-list">
          {srcEvents.sort((a, b) => (getYear(a) || 0) - (getYear(b) || 0)).map((ev, i) => (
            <div key={`${getTitle(ev)}-${getYear(ev)}-${i}`} className="sal-event-row">
              <span className="sal-event-row__year">{getYear(ev)}</span>
              <div className="sal-event-row__dot" style={{ background: source.color }} />
              <div className="sal-event-row__body">
                <div className="sal-event-row__title">{getTitle(ev)}</div>
                {getArabic(ev) && <div className="sal-event-row__ar" dir="rtl">{getArabic(ev)}</div>}
              </div>
              <span className="sal-tag" style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                {eventTypeLabels[getType(ev)] || getType(ev)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
