import { useState } from 'react';

const eTitle = (e, lang) => lang === 'ar' ? (e.title_ar || e.title) : lang === 'en' ? (e.title_en || e.title) : e.title;


/* ═══ Event type icons ═══ */
const TYPE_ICONS = {
  battle: '⚔', siege: '🏰', conquest: '🚩', diplomacy: '🤝', treaty: '📜',
  death: '💀', raid: '🏇', military: '⚔', event: '📌', naval: '⛵',
  anecdote: '📖', assassination: '🗡', captivity: '⛓', encounter: '🤺',
  muslim_conquest: '☪️', muslim_capture: '☪️', crusader_capture: '✝️',
  muslim_victory: '🏆', muslim_defeat: '💔', crusader_defeat: '💔',
};

/* ═══ Outcome badges ═══ */
const OUTCOME_BADGES = {
  muslim_victory:   { tr: 'İslâm Zaferi',       en: 'Muslim Victory',   ar: 'نصر إسلامي',    color: '#4ade80' },
  crusader_victory:  { tr: 'Haçlı Zaferi',       en: 'Crusader Victory', ar: 'نصر صليبي',     color: '#ef4444' },
  treaty:           { tr: 'Antlaşma',            en: 'Treaty',           ar: 'معاهدة',        color: '#60a5fa' },
  inconclusive:     { tr: 'Sonuçsuz',            en: 'Inconclusive',     ar: 'غير حاسم',     color: '#94a3b8' },
  not_applicable:   { tr: '',                    en: '',                 ar: '',              color: '#64748b' },
};

/* ═══ Castle type labels ═══ */
const CASTLE_TYPES = {
  concentric_castle: { tr: 'Konsantrik Kale', en: 'Concentric Castle' },
  spur_castle:       { tr: 'Dağ Kalesi',      en: 'Spur Castle' },
  hilltop_castle:    { tr: 'Tepe Kalesi',      en: 'Hilltop Castle' },
  coastal_castle:    { tr: 'Sahil Kalesi',     en: 'Coastal Castle' },
  urban_citadel:     { tr: 'Şehir Kalesi',     en: 'Urban Citadel' },
  cave_fortress:     { tr: 'Mağara Kalesi',    en: 'Cave Fortress' },
  fortress:          { tr: 'Kale',             en: 'Fortress' },
};

/* ═══ Helper: find source id from short code ═══ */
function findSourceByShort(shortCode, sourceMap) {
  for (const [id, src] of Object.entries(sourceMap)) {
    if (src.short === shortCode) return id;
  }
  return null;
}

/* ═══ Parse ownership_history string into timeline segments ═══ */
function parseOwnership(str) {
  if (!str) return [];
  return str.split('→').map(s => s.trim()).filter(Boolean).map(seg => {
    const match = seg.match(/^(.+?)\s*\((\d{3,4})–(\d{3,4})\)$/);
    if (match) return { owner: match[1].trim(), from: parseInt(match[2]), to: parseInt(match[3]) };
    return { owner: seg, from: null, to: null };
  });
}

export default function SalibiyyatIdCard({
  lang, tr, event, castle,
  sourceMap, enums,
  clusterMap, eventClusterMap,
  crossRefs,
  onClose, onGoToCompare, onCrossRef,
}) {
  const [textExpanded, setTextExpanded] = useState(true);

  /* ── Empty state ── */
  if (!event && !castle) {
    return (
      <div className="sal-idcard-empty">
        <div className="sal-idcard-placeholder">
          <span className="sal-idcard-icon">⚔️</span>
          <p>{tr.noSelection}</p>
        </div>
      </div>
    );
  }

  /* ═══ Event Card ═══ */
  if (event) {
    const src = sourceMap[event.source_id];
    const color = src?.color || '#999';
    const icon = TYPE_ICONS[event.type] || '📌';
    const typeLabel = enums.event_types?.[event.type]?.[lang] || enums.event_types?.[event.type]?.tr || event.type;
    const outcomeBadge = OUTCOME_BADGES[event.outcome];
    const clusterId = eventClusterMap[event.id];
    const cluster = clusterId ? clusterMap[clusterId] : null;

    /* Cross-ref: check if this event's cluster has an atlas link */
    const clusterCrossRef = cluster?.cross_ref || null;

    return (
      <div className="sal-idcard">
        <button className="sal-idcard-close" onClick={onClose} aria-label="Close">✕</button>

        {/* ── Source color stripe ── */}
        <div className="sal-idcard-stripe" style={{ background: color }} />

        {/* ── Header ── */}
        <div className="sal-idcard-header">
          <h3 className="sal-idcard-h1">{icon} {eTitle(event, lang)}</h3>
          <div className="sal-idcard-source-info">
            <span className="sal-idcard-source-dot" style={{ background: color }} />
            <span className="sal-idcard-source-name">
              {src?.short} — {lang === 'en' ? src?.name_en : src?.name_tr}
            </span>
          </div>
          <p className="sal-idcard-work" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {lang === 'ar' ? src?.work_ar : lang === 'en' ? src?.work_en : src?.work_tr}
          </p>
        </div>

        {/* ── Badges ── */}
        <div className="sal-idcard-badges">
          <span className="sal-badge sal-badge-year">📅 {event.year}</span>
          <span className="sal-badge sal-badge-type">{icon} {typeLabel}</span>
          {outcomeBadge && outcomeBadge[lang] && (
            <span className="sal-badge" style={{ borderColor: outcomeBadge.color, color: outcomeBadge.color }}>
              {outcomeBadge[lang]}
            </span>
          )}
        </div>

        {/* ── Fields ── */}
        <div className="sal-idcard-fields">
          {event.location && (
            <div className="sal-idcard-row">
              <span className="sal-idcard-label">📍 {tr.location}</span>
              <span className="sal-idcard-value">{event.location}</span>
            </div>
          )}
          {event.lat != null && (
            <div className="sal-idcard-row">
              <span className="sal-idcard-label">🧭 {tr.coordinates}</span>
              <span className="sal-idcard-value">{event.lat.toFixed(4)}°, {event.lon.toFixed(4)}°</span>
            </div>
          )}
        </div>

        {/* ── Arabic text ── */}
        {event.arabic_text && (
          <div className="sal-idcard-section">
            <button className="sal-section-toggle" onClick={() => setTextExpanded(p => !p)}
              aria-expanded={textExpanded}>
              📜 {tr.arabicText}
              <span className="sal-toggle-arrow">{textExpanded ? '▾' : '▸'}</span>
            </button>
            <div className={`sal-collapsible${textExpanded ? ' expanded' : ' collapsed'}`}>
              <div className="sal-arabic-text" dir="rtl">{event.arabic_text}</div>
            </div>
          </div>
        )}

        {/* ── Cluster link ── */}
        {cluster && (
          <div className="sal-idcard-cluster">
            <div className="sal-cluster-info">
              🔗 <strong>{cluster.event_count}</strong> {tr.clusterLink}
            </div>
            <div className="sal-cluster-sources">
              {cluster.events.map(ce => {
                const cSrcId = findSourceByShort(ce.source_short, sourceMap);
                const cSrc = cSrcId ? sourceMap[cSrcId] : null;
                return (
                  <span key={ce.id} className="sal-cluster-source-dot"
                    style={{ background: cSrc?.color || '#999' }}
                    title={ce.source_short}>
                    {ce.source_short}
                  </span>
                );
              })}
            </div>
            <button className="sal-compare-btn" onClick={() => onGoToCompare(cluster.id)}>
              ⚖️ {tr.compareBtn}
            </button>
          </div>
        )}

        {/* ── Cross-ref: link to Atlas battle ── */}
        {clusterCrossRef && clusterCrossRef.type === 'atlas_battle' && onCrossRef && (
          <div className="sal-idcard-crossref">
            <button className="sal-crossref-btn" onClick={() => onCrossRef('atlas_battle', clusterCrossRef.atlas_id)}>
              🔗 {tr.crossRefBattle || 'Atlas\'ta görüntüle'}:
              <strong> {clusterCrossRef[`label_${lang}`] || clusterCrossRef.label_tr}</strong>
              <span className="sal-crossref-arrow">↗</span>
            </button>
          </div>
        )}

        {/* ── Source ── */}
        <div className="sal-idcard-footer">
          {lang === 'en' ? src?.name_en : src?.name_tr} · {lang === 'en' ? src?.work_en : src?.work_tr}
        </div>
      </div>
    );
  }

  /* ═══ Castle Card ═══ */
  if (castle) {
    const name = lang === 'ar' ? castle.name_ar : lang === 'en' ? castle.name_en : castle.name_tr;
    const typeLabel = CASTLE_TYPES[castle.type]?.[lang] || CASTLE_TYPES[castle.type]?.tr || castle.type;
    const ownership = parseOwnership(castle.ownership_history);

    /* Cross-ref: check if this castle has a khitat link */
    const castleCrossRef = castle.cross_ref || null;

    return (
      <div className="sal-idcard sal-idcard-castle">
        <button className="sal-idcard-close" onClick={onClose} aria-label="Close">✕</button>

        {/* ── Castle image ── */}
        {castle.image_url && (
          <div className="sal-castle-image">
            <img src={castle.image_url} alt={name}
              onError={e => { e.target.style.display = 'none'; }}
              loading="lazy" />
          </div>
        )}

        {/* ── Header ── */}
        <div className="sal-idcard-header">
          <h3 className="sal-idcard-h1">🏰 {name}</h3>
          {castle.name_ar && <p className="sal-idcard-arabic" dir="rtl">{castle.name_ar}</p>}
          {castle.name_en && lang !== 'en' && <p className="sal-idcard-h2">{castle.name_en}</p>}
        </div>

        {/* ── Badges ── */}
        <div className="sal-idcard-badges">
          <span className="sal-badge sal-badge-type">🏰 {typeLabel}</span>
          {castle.crusader_state && (
            <span className="sal-badge sal-badge-state">✝️ {castle.crusader_state}</span>
          )}
          {castle.unesco && (
            <span className="sal-badge sal-badge-unesco">🏛 UNESCO</span>
          )}
        </div>

        {/* ── Description ── */}
        {(castle.description_tr || castle.description_en || castle.description_ar) && (
          <div className="sal-idcard-desc">
            <p>{lang === 'en' ? (castle.description_en || castle.description_tr)
              : lang === 'ar' ? (castle.description_ar || castle.description_tr)
              : castle.description_tr}</p>
          </div>
        )}

        {/* ── Coordinates ── */}
        {castle.lat != null && (
          <div className="sal-idcard-fields">
            <div className="sal-idcard-row">
              <span className="sal-idcard-label">🧭 {tr.coordinates}</span>
              <span className="sal-idcard-value">{castle.lat.toFixed(4)}°, {castle.lon.toFixed(4)}°</span>
            </div>
          </div>
        )}

        {/* ── Ownership timeline ── */}
        {ownership.length > 0 && (
          <div className="sal-idcard-section">
            <h4 className="sal-idcard-section-title">📜 {tr.ownership}</h4>
            <div className="sal-ownership-timeline">
              {ownership.map((o, i) => {
                const isMuslim = !o.owner.match(/Knights|County|Kingdom|Principality|Crusader|Hospitaller|Templar/i);
                return (
                  <div key={i} className={`sal-ownership-item${isMuslim ? ' muslim' : ' crusader'}`}>
                    <div className="sal-ownership-dot" />
                    <div className="sal-ownership-content">
                      <span className="sal-ownership-owner">{o.owner}</span>
                      {o.from && <span className="sal-ownership-years">{o.from}–{o.to}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Cross-ref: link to Khitat ── */}
        {castleCrossRef && castleCrossRef.type === 'atlas_khitat' && onCrossRef && (
          <div className="sal-idcard-crossref">
            <button className="sal-crossref-btn" onClick={() => onCrossRef('atlas_khitat', castleCrossRef.atlas_id)}>
              🔗 {tr.crossRefKhitat || 'Hıtât katmanında görüntüle'}:
              <strong> {castleCrossRef[`label_${lang}`] || castleCrossRef.label_tr}</strong>
              <span className="sal-crossref-arrow">↗</span>
            </button>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="sal-idcard-footer">{tr.castleName} · {name}</div>
      </div>
    );
  }

  return null;
}
