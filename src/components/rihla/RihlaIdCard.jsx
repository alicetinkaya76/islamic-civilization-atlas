import { useState } from 'react';

/* ═══ Stop type labels ═══ */
const TYPE_LABELS = {
  capital: { tr: 'Başkent', en: 'Capital' }, major_city: { tr: 'Büyük Şehir', en: 'Major City' },
  city: { tr: 'Şehir', en: 'City' }, town: { tr: 'Kasaba', en: 'Town' },
  village: { tr: 'Köy', en: 'Village' }, port: { tr: 'Liman', en: 'Port' },
  fortress: { tr: 'Kale', en: 'Fortress' }, oasis: { tr: 'Vaha', en: 'Oasis' },
  shrine: { tr: 'Türbe/Ziyaret', en: 'Shrine' }, pilgrimage: { tr: 'Hac Noktası', en: 'Pilgrimage' },
  palace: { tr: 'Saray', en: 'Palace' }, court: { tr: 'Saray/Divan', en: 'Court' },
  camp: { tr: 'Kamp', en: 'Camp' }, island: { tr: 'Ada', en: 'Island' },
  departure: { tr: 'Hareket', en: 'Departure' }, destination: { tr: 'Varış', en: 'Destination' },
  transit: { tr: 'Geçiş', en: 'Transit' }, crossroads: { tr: 'Kavşak', en: 'Crossroads' },
  caravan_station: { tr: 'Kervansaray', en: 'Caravansarai' },
  rest_stop: { tr: 'Mola', en: 'Rest Stop' }, ruins: { tr: 'Harabeler', en: 'Ruins' },
  mine: { tr: 'Maden', en: 'Mine' }, sea_event: { tr: 'Deniz Olayı', en: 'Sea Event' },
  disaster: { tr: 'Afet', en: 'Disaster' }, military: { tr: 'Askeri', en: 'Military' },
  retreat: { tr: 'İnziva', en: 'Retreat' }, residence: { tr: 'İkamet', en: 'Residence' },
  customs: { tr: 'Gümrük', en: 'Customs' }, ihram: { tr: 'İhram', en: 'Ihram' },
  waypoint: { tr: 'Ara Nokta', en: 'Waypoint' }, territory: { tr: 'Bölge', en: 'Territory' },
  historical_site: { tr: 'Tarihi Yer', en: 'Historical Site' },
  caravan_camp: { tr: 'Kervan Kampı', en: 'Caravan Camp' },
  island_city: { tr: 'Ada Şehri', en: 'Island City' },
};

const TYPE_ICONS = {
  capital: '👑', major_city: '🏙', city: '🏛', town: '🏘', village: '🏠',
  port: '⚓', fortress: '🏰', oasis: '🌴', shrine: '🕌', pilgrimage: '🕋',
  palace: '🏰', court: '👑', camp: '⛺', island: '🏝', departure: '🚶',
  destination: '📍', transit: '🔄', crossroads: '🔀', caravan_station: '🐫',
  rest_stop: '☕', ruins: '🏚', mine: '⛏', sea_event: '🌊', disaster: '⚡',
  military: '⚔', retreat: '🏕', residence: '🏠', customs: '🛂',
  ihram: '🕋', waypoint: '📌', territory: '🗺', historical_site: '🏛',
  caravan_camp: '🐪', island_city: '🏝',
};

const SIG_BADGE = {
  high:   { tr: 'Yüksek', en: 'High',   color: '#e63946' },
  medium: { tr: 'Orta',   en: 'Medium', color: '#d4a84b' },
  low:    { tr: 'Düşük',  en: 'Low',    color: '#90a4ae' },
};

const CONFIDENCE_BADGE = {
  high:   { tr: 'Yüksek', en: 'High',   color: '#66bb6a' },
  medium: { tr: 'Orta',   en: 'Medium', color: '#ffb74d' },
  low:    { tr: 'Düşük',  en: 'Low',    color: '#ef5350' },
};

export default function RihlaIdCard({ lang, tr, stop, voyageMap, onClose }) {
  const [quoteExpanded, setQuoteExpanded] = useState(false);
  const [peopleExpanded, setPeopleExpanded] = useState(true);

  if (!stop) {
    return (
      <div className="rihla-idcard-empty">
        <div className="rihla-idcard-placeholder">
          <span className="rihla-idcard-icon">🧭</span>
          <p>{tr.noSelection}</p>
        </div>
      </div>
    );
  }

  const voyage = voyageMap[stop.voyage_id];
  const name = lang === 'ar' ? stop.ar : lang === 'en' ? stop.en : stop.tr;
  const name2 = lang === 'tr' ? stop.en : stop.tr;
  const typeLabel = TYPE_LABELS[stop.type]?.[lang] || stop.type;
  const typeIcon = TYPE_ICONS[stop.type] || '📍';
  const sigBadge = SIG_BADGE[stop.sig];
  const confBadge = CONFIDENCE_BADGE[stop.confidence];
  const narr = lang === 'en' ? stop.narr_en : stop.narr_tr;
  const obs = lang === 'en' ? stop.obs_en : stop.obs_tr;
  const quote = lang === 'en' ? stop.quote_en : lang === 'ar' ? stop.quote_ar : stop.quote_tr;

  return (
    <div className="rihla-idcard">
      <button className="rihla-idcard-close" onClick={onClose} aria-label="Close">✕</button>

      {/* ── Header ── */}
      <div className="rihla-idcard-header">
        <h3 className="rihla-idcard-h1">{name}</h3>
        <p className="rihla-idcard-h2">{name2}</p>
        {stop.ar && <p className="rihla-idcard-arabic" dir="rtl">{stop.ar}</p>}
      </div>

      {/* ── Badges ── */}
      <div className="rihla-idcard-badges">
        {voyage && (
          <span className="rihla-badge rihla-badge-voyage" style={{ borderColor: voyage.color, color: voyage.color }}>
            V{voyage.id} · {voyage.start_year}–{voyage.end_year}
          </span>
        )}
        <span className="rihla-badge rihla-badge-type">
          {typeIcon} {typeLabel}
        </span>
        {sigBadge && (
          <span className="rihla-badge" style={{ borderColor: sigBadge.color, color: sigBadge.color }}>
            {sigBadge[lang]}
          </span>
        )}
        {stop.date_uncertain && (
          <span className="rihla-badge rihla-badge-warn">⚠ {tr.dateUncertain}</span>
        )}
        {stop.disputed && (
          <span className="rihla-badge rihla-badge-warn">❓ {tr.disputed}</span>
        )}
      </div>

      {/* ── Fields ── */}
      <div className="rihla-idcard-fields">
        {stop.arr && (
          <div className="rihla-idcard-row">
            <span className="rihla-idcard-label">📅 {tr.arrivalDate}</span>
            <span className="rihla-idcard-value">
              {stop.arr}{stop.arr_ah ? ` (${stop.arr_ah} H)` : ''}
            </span>
          </div>
        )}
        {stop.dep && stop.dep !== stop.arr && (
          <div className="rihla-idcard-row">
            <span className="rihla-idcard-label">🚶 {tr.departureDate}</span>
            <span className="rihla-idcard-value">{stop.dep}</span>
          </div>
        )}
        {stop.stay > 0 && (
          <div className="rihla-idcard-row">
            <span className="rihla-idcard-label">🏕 {tr.stayDays}</span>
            <span className="rihla-idcard-value">{stop.stay} {tr.days}</span>
          </div>
        )}
        {stop.region_tr && (
          <div className="rihla-idcard-row">
            <span className="rihla-idcard-label">📍 {tr.region}</span>
            <span className="rihla-idcard-value">{lang === 'en' ? stop.region_en : stop.region_tr}</span>
          </div>
        )}
        {stop.country && (
          <div className="rihla-idcard-row">
            <span className="rihla-idcard-label">🌍 {tr.country}</span>
            <span className="rihla-idcard-value">{stop.country}</span>
          </div>
        )}
        {stop.lat != null && (
          <div className="rihla-idcard-row">
            <span className="rihla-idcard-label">🧭 {tr.coordinates}</span>
            <span className="rihla-idcard-value">{stop.lat.toFixed(4)}°, {stop.lon.toFixed(4)}°</span>
          </div>
        )}
      </div>

      {/* ── Description ── */}
      {narr && (
        <div className="rihla-idcard-desc">
          <p>{narr}</p>
        </div>
      )}

      {/* ── Observations ── */}
      {obs && (
        <div className="rihla-idcard-section">
          <h4 className="rihla-idcard-section-title">👁 {tr.observations}</h4>
          <p className="rihla-obs-text">{obs}</p>
        </div>
      )}

      {/* ── Topics ── */}
      {stop.topics && stop.topics.length > 0 && (
        <div className="rihla-idcard-tags">
          {stop.topics.map((t, i) => (
            <span key={i} className="rihla-tag-badge">{t}</span>
          ))}
        </div>
      )}

      {/* ── Notable People ── */}
      {stop.people && stop.people.length > 0 && (
        <div className="rihla-idcard-section">
          <button className="rihla-section-toggle" onClick={() => setPeopleExpanded(p => !p)}
            aria-expanded={peopleExpanded}>
            👤 {tr.notablePeople} ({stop.people.length})
            <span className="rihla-toggle-arrow">{peopleExpanded ? '▾' : '▸'}</span>
          </button>
          <div className={`rihla-collapsible${peopleExpanded ? ' expanded' : ' collapsed'}`}>
            <div className="rihla-people-list">
              {stop.people.map((p, i) => (
                <div key={i} className="rihla-person-item">
                  <span className="rihla-person-name" dir="rtl">{p.name_ar}</span>
                  <span className="rihla-person-en">{p.name_en}</span>
                  {p.role && <span className="rihla-person-role">{p.role}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Rihla Quote ── */}
      {(stop.quote_ar || stop.quote_tr) && (
        <div className="rihla-idcard-section">
          <button className="rihla-section-toggle" onClick={() => setQuoteExpanded(p => !p)}
            aria-expanded={quoteExpanded}>
            📜 {tr.rihlaQuote}
            <span className="rihla-toggle-arrow">{quoteExpanded ? '▾' : '▸'}</span>
          </button>
          <div className={`rihla-collapsible${quoteExpanded ? ' expanded' : ' collapsed'}`}>
            {stop.quote_ar && (
              <div className="rihla-quote rihla-quote-ar" dir="rtl">{stop.quote_ar}</div>
            )}
            {quote && lang !== 'ar' && (
              <div className="rihla-quote rihla-quote-tr">{quote}</div>
            )}
          </div>
        </div>
      )}

      {/* ── Cross-references ── */}
      {stop.xref && (stop.xref.yakut_match || stop.xref.atlas_dynasty_id) && (
        <div className="rihla-idcard-section">
          <h4 className="rihla-idcard-section-title">🔗 {tr.crossRefs}</h4>
          <div className="rihla-xref-list">
            {stop.xref.yakut_match && (
              <span className="rihla-xref-badge rihla-xref-yakut">📖 {tr.yakutMatch}</span>
            )}
            {stop.xref.atlas_dynasty_id && (
              <a href={`#dynasty/${stop.xref.atlas_dynasty_id}`} className="rihla-xref-badge rihla-xref-dynasty">
                🏛 {tr.dynastyLink} #{stop.xref.atlas_dynasty_id}
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Confidence ── */}
      {confBadge && (
        <div className="rihla-idcard-confidence">
          {tr.confidence}: <span style={{ color: confBadge.color }}>{confBadge[lang]}</span>
          {stop.src_page && <span className="rihla-src-ref"> · {stop.src_page}</span>}
        </div>
      )}

      {/* ── Source ── */}
      <div className="rihla-idcard-source">{tr.source}</div>
    </div>
  );
}
