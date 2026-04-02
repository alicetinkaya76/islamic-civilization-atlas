import { useState } from 'react';
import SalibiyyatSourceDetail from './SalibiyyatSourceDetail';

/**
 * SalibiyyatSources — Source profile cards grid
 * Ported from standalone SourcesPage.jsx + SourceDetail.jsx
 *
 * Props:
 *   sources         — sources[] array
 *   events          — all events[] array
 *   eventTypeLabels — { typeCode: 'label' }
 *   outcomeLabels   — { outcomeCode: 'label' }
 *   tr              — i18n object (SAL_T)
 */

const PERSPECTIVE_LABELS = {
  standard_chronicle: 'Standart Kronik',
  anecdotal_eyewitness: 'Anekdotal Görgü Tanığı',
  comprehensive_chronicle: 'Kapsamlı Kronik',
  eyewitness_biography: 'Görgü Tanığı Biyografisi',
  literary_chronicle: 'Edebî Kronik',
};

export default function SalibiyyatSources({
  sources = [], events = [], eventTypeLabels = {}, outcomeLabels = {}, tr = {}
}) {
  const [selectedSourceId, setSelectedSourceId] = useState(null);

  // Normalize field access
  const getSrc = (e) => e.source_short || e.s;
  const getType = (e) => e.type || e.t;

  // If a source is selected, show detail view
  if (selectedSourceId) {
    const source = sources.find(s => s.id === selectedSourceId);
    if (source) {
      return (
        <SalibiyyatSourceDetail
          source={source} events={events}
          eventTypeLabels={eventTypeLabels} outcomeLabels={outcomeLabels}
          tr={tr} onBack={() => setSelectedSourceId(null)}
        />
      );
    }
  }

  const sp = tr.sources_page || {};

  return (
    <div className="sal-subtab-container">
      {/* Header */}
      <div className="sal-subtab-header sal-fade-in">
        <h2 className="sal-subtab-title">{sp.title || 'Kaynaklar'}</h2>
        <p className="sal-subtab-title-ar">المصادر الأولية</p>
        <p className="sal-subtab-desc">{sp.subtitle || 'Altı İslâm kaynağından karşılaştırmalı bakış'}</p>
        <div className="sal-gold-line" style={{ width: 80 }} />
      </div>

      {/* Sources grid */}
      <div className="sal-sources-grid">
        {sources.map((s, i) => {
          const srcEvents = events.filter(e => getSrc(e) === s.short);
          const typeCount = {};
          srcEvents.forEach(e => { const t = getType(e); typeCount[t] = (typeCount[t] || 0) + 1; });
          const topTypes = Object.entries(typeCount).sort((a, b) => b[1] - a[1]).slice(0, 4);

          return (
            <div
              key={s.id}
              className="sal-source-card sal-fade-in"
              style={{ animationDelay: `${i * 70}ms` }}
              onClick={() => setSelectedSourceId(s.id)}
            >
              <div className="sal-source-card__accent" style={{ background: s.color }} />
              <div className="sal-source-card__accent-hover" style={{ background: s.color }} />

              <div className="sal-source-card__body">
                {/* Header */}
                <div className="sal-source-card__header">
                  <div>
                    <h3 className="sal-source-card__name">{s.full_tr}</h3>
                    <p className="sal-source-card__sub">{s.full_en}</p>
                  </div>
                  <div className="sal-source-card__ar-block">
                    <div className="sal-source-card__ar-name">{s.name_ar}</div>
                    <div className="sal-source-card__ar-work" dir="rtl">{s.work_ar}</div>
                  </div>
                </div>

                {/* Work name */}
                <p className="sal-source-card__work">{s.work_tr}</p>

                {/* Tags */}
                <div className="sal-filter-tags" style={{ marginBottom: 16 }}>
                  <span className="sal-tag" style={{ borderColor: s.color, color: s.color, fontWeight: 600 }}>
                    {s.record_count} kayıt
                  </span>
                  <span className="sal-tag">{s.period}</span>
                  <span className="sal-tag">{PERSPECTIVE_LABELS[s.perspective] || s.perspective}</span>
                </div>

                {/* Mini bar chart */}
                <div className="sal-bar-list sal-bar-list--mini">
                  {topTypes.map(([type, cnt]) => (
                    <div key={type} className="sal-bar-list__row">
                      <span className="sal-bar-list__label">{type.replace(/_/g, ' ')}</span>
                      <div className="sal-bar-list__track">
                        <div className="sal-bar-list__fill"
                          style={{ width: `${(cnt / srcEvents.length) * 100}%`, background: s.color, opacity: 0.7 }} />
                      </div>
                      <span className="sal-bar-list__val">{cnt}</span>
                    </div>
                  ))}
                </div>

                {/* Arrow */}
                <div className="sal-source-card__arrow">
                  Detay
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
