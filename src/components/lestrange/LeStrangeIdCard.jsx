import { useState, useMemo } from 'react';

/* ═══ Source abbreviations → full name tooltip ═══ */
const SOURCE_ABBR = {
  "I.K.": "İbn Hurdâzbih (h.250)", "Kud.": "Kudâme (h.266)",
  "Ykb.": "Yaʿkūbî (h.278)", "I.S.": "İbn Serapion (h.290)",
  "I.R.": "İbn Rusta (h.290)", "I.F.": "İbn Fakīh (h.290)",
  "Mas.": "Mesʿûdî (h.332)", "Ist.": "İstahrî (h.340)",
  "I.H.": "İbn Havkal (h.367)", "Muk.": "Mukaddesî (h.375)",
  "N.K.": "Nâsır-ı Hüsrev (h.438)", "Idr.": "İdrîsî (h.548)",
  "I.J.": "İbn Cübeyr (h.580)", "Yak.": "Yâkūt (h.623)",
  "Kaz.": "Kazvînî (h.674)", "Mar.": "Merâsid (h.700)",
  "A.F.": "Ebü'l-Fidâ (h.721)", "Mst.": "Müstevfî (h.740)",
  "I.B.": "İbn Battûta (h.756)", "A.Y.": "Ali Yezdî (h.820)",
};

/* ═══ Geo type icons ═══ */
const GEO_ICONS = {
  province: '🏛️', city: '🏙️', town: '🏘️', village: '🏠',
  river: '🌊', canal: '🚿', lake: '💧', sea: '🌊',
  mountain: '⛰️', desert: '🏜️', pass: '🏔️',
  fortress: '🏰', castle: '🏰', island: '🏝️', port: '⚓', oasis: '🌴',
  district: '📍', region: '🗺️', bridge: '🌉', monastery: '⛪',
  mine: '⛏️', swamp: '🌿',
};

/* ═══ Period tag colors ═══ */
const PERIOD_COLORS = {
  PRE_ISLAMIC: '#9e9e9e', SASSANID: '#8d6e63', RASHIDUN: '#4caf50',
  UMAYYAD: '#2196f3', ABBASID: '#ffc107', BUYID: '#ff9800',
  SELJUK: '#e91e63', GHAZNAVID: '#9c27b0', SAMANID: '#00bcd4',
  KHWARAZMSHAH: '#ff5722', MONGOL: '#f44336', TIMURID: '#3f51b5',
  OTTOMAN: '#c62828', SAFFARID: '#795548', TAHIRID: '#607d8b',
  GHURID: '#ab47bc', BYZANTINE: '#5c6bc0', CRUSADER: '#d32f2f',
  UZBEG: '#1b5e20',
};

/* ═══ Coord source badges ═══ */
const COORD_BADGES = {
  modern_known: { icon: '✅', color: '#4caf50' },
  approximate: { icon: '📍', color: '#ff9800' },
  estimated: { icon: '📏', color: '#ffc107' },
  uncertain: { icon: '❓', color: '#f44336' },
  unlocated: { icon: '🚫', color: '#9e9e9e' },
};

function Section({ title, children, icon }) {
  if (!children) return null;
  return (
    <div className="ls-card-section">
      <div className="ls-card-section-title">{icon && <span>{icon} </span>}{title}</div>
      {children}
    </div>
  );
}

export default function LeStrangeIdCard({ lang, tr, record, xref, onClose }) {
  const [showAllDescs, setShowAllDescs] = useState(false);

  /* Cross-reference lookup — MUST be before any early return */
  const recXref = useMemo(() => {
    if (!record) return {};
    return xref[String(record.id)] || {};
  }, [xref, record]);

  if (!record) {
    return (
      <div className="ls-card-empty">
        <div className="ls-card-empty-icon">🗺️</div>
        <p>{tr.noSelection}</p>
      </div>
    );
  }

  const r = record;
  const nameKey = lang === 'ar' ? 'name_ar' : lang === 'en' ? 'name_en' : 'name_tr';
  const primaryName = r[nameKey] || r.name_en;
  const geoIcon = GEO_ICONS[r.geo_type] || '📍';
  const coordBadge = COORD_BADGES[r.coord_source] || COORD_BADGES.uncertain;

  /* Primary description based on lang, others collapsible */
  const descOrder = lang === 'ar' ? ['ar', 'en', 'tr'] : lang === 'en' ? ['en', 'tr', 'ar'] : ['tr', 'en', 'ar'];
  const descFields = { tr: 'description_tr', en: 'description_en', ar: 'description_ar' };
  const descLabels = { tr: 'Türkçe', en: 'English', ar: 'العربية' };
  const primaryDesc = r[descFields[descOrder[0]]];
  const otherDescs = descOrder.slice(1).filter(l => r[descFields[l]]);


  return (
    <div className="ls-card" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Close button */}
      <button className="ls-card-close" onClick={onClose}>✕</button>

      {/* ── Header ── */}
      <div className="ls-card-header">
        <div className="ls-card-names">
          {r.name_ar && <div className="ls-card-name-ar">{r.name_ar}</div>}
          <div className="ls-card-name-primary">{geoIcon} {primaryName}</div>
          {r.name_en && r.name_en !== primaryName && <div className="ls-card-name-secondary">{r.name_en}</div>}
          {r.name_tr && r.name_tr !== primaryName && <div className="ls-card-name-secondary">{r.name_tr}</div>}
          {r.le_strange_form && (
            <div className="ls-card-le-strange-form">
              <em>"{r.le_strange_form}"</em> <span className="ls-card-form-label">— Le Strange</span>
            </div>
          )}
        </div>
        <div className="ls-card-geo-badge">
          <span className="ls-card-geo-type">{geoIcon} {r.geo_type_en || r.geo_type}</span>
        </div>
      </div>

      {/* ── Location ── */}
      <Section title={tr.province} icon="📌">
        <div className="ls-card-location">
          <span className="ls-card-province-badge">{r.province}</span>
          {r.district && <span className="ls-card-district">› {r.district}</span>}
          {r.parent_location && <span className="ls-card-district">({r.parent_location})</span>}
        </div>
        {(r.modern_name || r.modern_country) && (
          <div className="ls-card-modern">
            {r.modern_name && <span>{tr.modernName}: <strong>{r.modern_name}</strong></span>}
            {r.modern_country && <span className="ls-card-country-badge">{r.modern_country}</span>}
          </div>
        )}
        {r.latitude && r.coord_source !== 'unlocated' && (
          <div className="ls-card-coords">
            <span style={{ color: coordBadge.color }}>{coordBadge.icon} {tr[r.coord_source] || r.coord_source}</span>
            <span className="ls-card-latlon">{r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</span>
          </div>
        )}
      </Section>

      {/* ── Chapter ── */}
      <Section title={tr.chapter} icon="📖">
        <div className="ls-card-chapter">
          <strong>{tr.chapter} {r.chapter}:</strong> {r.chapter_title}
          {r.page_range && <span className="ls-card-pages">pp. {r.page_range}</span>}
        </div>
      </Section>

      {/* ── Alternate Names ── */}
      {r.alternate_names?.length > 0 && (
        <Section title={tr.altNames} icon="🏷️">
          <div className="ls-card-alt-names">
            {r.alternate_names.map((n, i) => <span key={i} className="ls-card-tag">{n}</span>)}
          </div>
        </Section>
      )}

      {/* ── Description ── */}
      {primaryDesc && (
        <Section title={tr.description} icon="📝">
          <p className="ls-card-desc" dir={descOrder[0] === 'ar' ? 'rtl' : 'ltr'}>{primaryDesc}</p>
          {otherDescs.length > 0 && (
            <>
              <button className="ls-card-toggle" onClick={() => setShowAllDescs(p => !p)}>
                {showAllDescs ? '▲' : '▼'} {otherDescs.map(l => descLabels[l]).join(' · ')}
              </button>
              {showAllDescs && otherDescs.map(l => (
                <div key={l} className="ls-card-desc-extra">
                  <div className="ls-card-desc-lang">{descLabels[l]}</div>
                  <p className="ls-card-desc" dir={l === 'ar' ? 'rtl' : 'ltr'}>{r[descFields[l]]}</p>
                </div>
              ))}
            </>
          )}
        </Section>
      )}

      {/* ── Period Tags ── */}
      {r.period_tags?.length > 0 && (
        <Section title={tr.period} icon="🕰️">
          <div className="ls-card-periods">
            {r.period_tags.map(p => (
              <span key={p} className="ls-card-period-badge"
                style={{ background: PERIOD_COLORS[p] || '#666', color: '#fff' }}>
                {p.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
          {(r.founded_hijri || r.founded_ce) && (
            <div className="ls-card-founded">
              {tr.founded}: {r.founded_hijri && `h. ${r.founded_hijri}`}{r.founded_hijri && r.founded_ce && ' / '}{r.founded_ce && `${r.founded_ce} CE`}
            </div>
          )}
        </Section>
      )}

      {/* ── Features ── */}
      {r.features?.length > 0 && (
        <Section title={tr.features} icon="⭐">
          <div className="ls-card-features">
            {r.features.map((f, i) => <span key={i} className="ls-card-tag feature">{f}</span>)}
          </div>
        </Section>
      )}

      {/* ── Sources Cited ── */}
      {r.sources_cited?.length > 0 && (
        <Section title={tr.sourcesCited} icon="📚">
          <div className="ls-card-sources">
            {r.sources_cited.map((s, i) => (
              <span key={i} className="ls-card-source-badge" title={SOURCE_ABBR[s] || s}>
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* ── Products ── */}
      {r.products?.length > 0 && (
        <Section title={tr.products} icon="🏺">
          <div className="ls-card-tags-row">
            {r.products.map((p, i) => <span key={i} className="ls-card-tag product">{p.replace(/_/g, ' ')}</span>)}
          </div>
        </Section>
      )}

      {/* ── Roads ── */}
      {r.roads?.length > 0 && (
        <Section title={tr.roads} icon="🛤️">
          <div className="ls-card-tags-row">
            {r.roads.map((rd, i) => (
              <span key={i} className="ls-card-tag road">
                {typeof rd === 'string' ? rd : `→ ${rd.destination || ''}${rd.description ? ` (${rd.description})` : ''}`}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* ── Related Places ── */}
      {r.related_places?.length > 0 && (
        <Section title={tr.relatedPlaces} icon="🔗">
          <div className="ls-card-tags-row">
            {r.related_places.map((rp, i) => (
              <span key={i} className="ls-card-tag related">
                {typeof rp === 'string' ? rp : `${rp.name || ''}${rp.relation ? ` (${rp.relation.replace(/_/g, ' ')})` : ''}`}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* ═══ CROSS-REFERENCE WIDGET ═══ */}
      {(() => {
        /* Build effective xref: verified xref.json + fallback from record's cross_references */
        const cr = r.cross_references || {};
        const hasYaqut = recXref.yaqut || cr.yaqut_heading;
        const hasEi1 = recXref.ei1 || cr.ei2_entry;
        const hasDia = recXref.dia || cr.dia_slug;
        const hasAtlas = recXref.atlas;
        if (!hasYaqut && !hasEi1 && !hasDia && !hasAtlas) return null;

        return (
          <div className="ls-xref-widget">
            <div className="ls-xref-title">🔗 {tr.crossRefs}</div>
            <div className="ls-xref-links">
              {/* Yāqūt */}
              {(recXref.yaqut || cr.yaqut_heading) && (
                <a href={`#yaqut?search=${encodeURIComponent(recXref.yaqut?.h || cr.yaqut_heading)}`} className="ls-xref-link yaqut">
                  <span className="ls-xref-icon">📖</span>
                  <div className="ls-xref-info">
                    <span className="ls-xref-source">{tr.xrefYaqut}</span>
                    <span className="ls-xref-detail">
                      «{recXref.yaqut?.h || cr.yaqut_heading}»
                      {recXref.yaqut?.ht && ` (${recXref.yaqut.ht})`}
                    </span>
                  </div>
                  <span className="ls-xref-arrow">→</span>
                </a>
              )}
              {/* EI-1 / EI-2 */}
              {(recXref.ei1 || cr.ei2_entry) && (
                <a href={`#ei1?search=${encodeURIComponent(recXref.ei1?.t || cr.ei2_entry)}`} className="ls-xref-link ei1">
                  <span className="ls-xref-icon">📕</span>
                  <div className="ls-xref-info">
                    <span className="ls-xref-source">{tr.xrefEi1}</span>
                    <span className="ls-xref-detail">"{recXref.ei1?.t || cr.ei2_entry}"</span>
                  </div>
                  <span className="ls-xref-arrow">→</span>
                </a>
              )}
              {/* Atlas map */}
              {recXref.atlas && (
                <a href="#map" className="ls-xref-link atlas"
                  onClick={() => {
                    window.location.hash = `#map?lat=${r.latitude}&lon=${r.longitude}&z=10`;
                  }}>
                  <span className="ls-xref-icon">🗺️</span>
                  <div className="ls-xref-info">
                    <span className="ls-xref-source">{tr.xrefAtlas}</span>
                    <span className="ls-xref-detail">{recXref.atlas[lang] || recXref.atlas.tr || recXref.atlas.en}</span>
                  </div>
                  <span className="ls-xref-arrow">→</span>
                </a>
              )}
              {/* DİA */}
              {(recXref.dia || cr.dia_slug) && (
                <a href={recXref.dia?.url || `https://islamansiklopedisi.org.tr/${cr.dia_slug}`}
                  target="_blank" rel="noopener noreferrer" className="ls-xref-link dia">
                  <span className="ls-xref-icon">📚</span>
                  <div className="ls-xref-info">
                    <span className="ls-xref-source">{tr.xrefDia}</span>
                    <span className="ls-xref-detail">{recXref.dia?.slug || cr.dia_slug} ↗</span>
                  </div>
                  <span className="ls-xref-arrow">↗</span>
                </a>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
