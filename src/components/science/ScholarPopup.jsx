/**
 * ScholarPopup.jsx — islamicatlas.org Science Layer (v7.4.0.0 / O8)
 *
 * B4: Added "Related Routes" section (scholar.transfer_routes)
 *     Click → route highlights on map + opens route popup
 */

import { useMemo } from 'react';
import { FIELD_COLORS, FIELD_NAMES, PERIODS } from './ScienceLayerView';
import '../../styles/science_layer_popup.css';

/* ── Route category meta ── */
const ROUTE_CAT_COLORS = {
  internal: '#3B82F6',
  science_transfer: '#F59E0B',
  cultural_transfer: '#10B981',
};
const ROUTE_CAT_ICONS = {
  internal: '🔵',
  science_transfer: '🟠',
  cultural_transfer: '🟢',
};

/* ── i18n ── */
const POP_T = {
  tr: {
    fields: 'Alanlar', period: 'Dönem', born: 'Doğum', died: 'Vefat',
    works: 'Başlıca Eserler', contribution: 'Temel Katkı',
    scholarly: 'Akademik Bağlam', historiographical: 'Tarihyazımsal Not',
    modern: 'Modern Karşılık', flow: 'Bilgi Akışı',
    teacher: 'Hoca', student: 'Talebe', influence: 'Etki Alanı',
    references: 'Referanslar', dia: 'DİA', alam: 'el-A\'lâm', ei1: 'EI-1',
    affiliations: 'Bağlı Kurumlar', discoveries: 'Keşifler',
    parallel: 'Karşılaştırmalı Gelenekler', female: 'Kadın Alim', male: 'Erkek Alim',
    close: 'Kapat', routes: 'İlgili Güzergâhlar',
    xref: 'Çapraz Referanslar', viewInAlam: 'el-A\'lâm\'da Gör', viewInYaqut: 'Yâkût\'ta Gör',
    alamEntry: 'el-A\'lâm Maddesi', yaqutPlace: 'Doğum Yeri (Yâkût)',
  },
  en: {
    fields: 'Fields', period: 'Period', born: 'Born', died: 'Died',
    works: 'Key Works', contribution: 'Key Contribution',
    scholarly: 'Scholarly Context', historiographical: 'Historiographical Note',
    modern: 'Modern Parallel', flow: 'Knowledge Flow',
    teacher: 'Teacher', student: 'Student', influence: 'Sphere of Influence',
    references: 'References', dia: 'DİA', alam: 'al-Aʿlām', ei1: 'EI-1',
    affiliations: 'Affiliated Institutions', discoveries: 'Discoveries',
    parallel: 'Parallel Traditions', female: 'Woman Scholar', male: 'Male Scholar',
    close: 'Close', routes: 'Related Routes',
    xref: 'Cross-References', viewInAlam: 'View in al-Aʿlām', viewInYaqut: 'View in Yāqūt',
    alamEntry: 'al-Aʿlām Entry', yaqutPlace: 'Birthplace (Yāqūt)',
  },
  ar: {
    fields: 'المجالات', period: 'الفترة', born: 'الميلاد', died: 'الوفاة',
    works: 'أهم المؤلفات', contribution: 'المساهمة الرئيسية',
    scholarly: 'السياق الأكاديمي', historiographical: 'الملاحظة التأريخية',
    modern: 'المقابل الحديث', flow: 'تدفق المعرفة',
    teacher: 'الأستاذ', student: 'التلميذ', influence: 'مجال التأثير',
    references: 'المراجع', dia: 'الموسوعة', alam: 'الأعلام', ei1: 'دائرة المعارف',
    affiliations: 'المؤسسات المنتسب إليها', discoveries: 'الاكتشافات',
    parallel: 'التقاليد المقارنة', female: 'عالمة', male: 'عالم',
    close: 'إغلاق', routes: 'المسارات المرتبطة',
    xref: 'المراجع المتقاطعة', viewInAlam: 'عرض في الأعلام', viewInYaqut: 'عرض في ياقوت',
    alamEntry: 'مادة الأعلام', yaqutPlace: 'مكان الميلاد (ياقوت)',
  },
};

/* ── Period label helper ── */
const getPeriodLabel = (periodId, lang) => {
  const p = PERIODS.find(x => x.id === periodId);
  return p ? `${p.label[lang] || p.label.en} (${p.range})` : periodId;
};

export default function ScholarPopup({
  scholar, lang, onClose, onScholarClick, onRouteClick,
  onNavigateAlam, onNavigateYaqut,
  allScholars = [], allInstitutions = [], allDiscoveries = [], allRoutes = [],
}) {
  const t = POP_T[lang] || POP_T.en;
  const isRTL = lang === 'ar';
  const s = scholar;
  const name = s.name?.[lang] || s.name?.en || '';
  const fullName = s.full_name?.[lang] || s.full_name?.ar || '';

  /* ── Scholar's discoveries ── */
  const scholarDiscoveries = useMemo(() =>
    allDiscoveries.filter(d => d.scholar_id === s.id),
    [allDiscoveries, s.id]
  );

  /* ── Affiliated institutions ── */
  const affiliatedInsts = useMemo(() => {
    if (!s.affiliated_institutions?.length) return [];
    return s.affiliated_institutions
      .map(instId => allInstitutions.find(i => i.id === instId))
      .filter(Boolean);
  }, [s.affiliated_institutions, allInstitutions]);

  /* ── Related routes (B4) ── */
  const relatedRoutes = useMemo(() => {
    if (!s.transfer_routes?.length) return [];
    return s.transfer_routes
      .map(rid => allRoutes.find(r => r.id === rid))
      .filter(Boolean);
  }, [s.transfer_routes, allRoutes]);

  /* ── Knowledge flow: resolve names ── */
  const resolveScholarName = (id) => {
    const found = allScholars.find(x => x.id === id);
    return found ? (found.name?.[lang] || found.name?.en || id) : id;
  };

  return (
    <div className="sci-popup scholar-popup" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="sci-popup-header">
        <div className="sci-popup-title-row">
          <h3 className="sci-popup-name">{name}</h3>
          {s.gender === 'female' && (
            <span className="sci-gender-badge sci-gender-female" title={t.female}>♀</span>
          )}
          <button className="sci-popup-close" onClick={onClose} title={t.close}>✕</button>
        </div>
        {fullName && fullName !== name && (
          <p className="sci-popup-fullname">{fullName}</p>
        )}
        <div className="sci-popup-meta">
          <span>{t.born}: {s.birth_year}</span>
          <span className="sci-popup-sep">·</span>
          <span>{t.died}: {s.death_year}</span>
          {s.birth_place?.name && (
            <>
              <span className="sci-popup-sep">·</span>
              <span>{s.birth_place.name[lang] || s.birth_place.name.en}</span>
            </>
          )}
        </div>
      </div>

      {/* Fields chips */}
      <div className="sci-popup-section">
        <h4 className="sci-popup-section-title">{t.fields}</h4>
        <div className="sci-popup-chips">
          {s.fields.map(f => (
            <span key={f} className="sci-popup-chip" style={{ '--chip-c': FIELD_COLORS[f] || '#888' }}>
              {FIELD_NAMES[f]?.[lang] || f}
            </span>
          ))}
        </div>
      </div>

      {/* Period */}
      <div className="sci-popup-section sci-popup-inline">
        <span className="sci-popup-label">{t.period}:</span>
        <span className="sci-popup-value">{getPeriodLabel(s.period, lang)}</span>
      </div>

      {/* Key Contribution */}
      {s.key_contribution && (
        <div className="sci-popup-section">
          <h4 className="sci-popup-section-title">{t.contribution}</h4>
          <p className="sci-popup-text">{s.key_contribution[lang] || s.key_contribution.en}</p>
        </div>
      )}

      {/* Key Works */}
      {s.key_works?.length > 0 && (
        <div className="sci-popup-section">
          <h4 className="sci-popup-section-title">{t.works}</h4>
          <ul className="sci-popup-works">
            {s.key_works.map((w, i) => (
              <li key={i}>
                <strong>{w.title?.[lang] || w.title?.ar || w.title?.en || w.title}</strong>
                {w.description && (
                  <span className="sci-work-desc"> — {w.description[lang] || w.description.en}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Discoveries */}
      {scholarDiscoveries.length > 0 && (
        <div className="sci-popup-section">
          <h4 className="sci-popup-section-title">{t.discoveries} ({scholarDiscoveries.length})</h4>
          <ul className="sci-popup-discoveries">
            {scholarDiscoveries.map(d => (
              <li key={d.id} className="sci-discovery-item">
                <span className="sci-discovery-dot" style={{ background: FIELD_COLORS[d.field] || '#888' }} />
                <div>
                  <strong>{d.name[lang] || d.name.en}</strong>
                  <span className="sci-discovery-year"> ({d.year})</span>
                  {d.description && (
                    <p className="sci-discovery-desc">{d.description[lang] || d.description.en}</p>
                  )}
                  {d.parallel_traditions?.length > 0 && (
                    <div className="sci-parallel-box">
                      <span className="sci-parallel-label">{t.parallel}:</span>
                      {d.parallel_traditions.map((pt, pi) => (
                        <span key={pi} className="sci-parallel-tag">
                          {pt.tradition}: {pt.contribution?.[lang] || pt.contribution?.en || pt.note}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Affiliated Institutions */}
      {affiliatedInsts.length > 0 && (
        <div className="sci-popup-section">
          <h4 className="sci-popup-section-title">{t.affiliations}</h4>
          <div className="sci-popup-affiliations">
            {affiliatedInsts.map(inst => (
              <button
                key={inst.id}
                className="sci-affiliation-btn"
                onClick={() => {}}
                title={inst.name[lang] || inst.name.en}
              >
                <span className="sci-affiliation-diamond" style={{ background: inst.marker_color || '#a855f7' }} />
                <span>{inst.name[lang] || inst.name.en}</span>
                <span className="sci-affiliation-city">{inst.city?.[lang] || inst.city?.en}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Related Routes (B4) ── */}
      {relatedRoutes.length > 0 && (
        <div className="sci-popup-section">
          <h4 className="sci-popup-section-title">
            {t.routes} <span className="sci-badge">{relatedRoutes.length}</span>
          </h4>
          <div className="sci-popup-routes">
            {relatedRoutes.map(route => {
              const cat = route.category || 'internal';
              const catColor = ROUTE_CAT_COLORS[cat] || '#3B82F6';
              const catIcon = ROUTE_CAT_ICONS[cat] || '🔵';
              const rName = route.name?.[lang] || route.name?.en || '';
              return (
                <button
                  key={route.id}
                  className="sci-route-link-btn"
                  style={{ '--rl-c': catColor }}
                  onClick={() => onRouteClick?.(route.id)}
                >
                  <span className="sci-route-link-icon">{catIcon}</span>
                  <span className="sci-route-link-name">{rName}</span>
                  <span className="sci-route-link-arrow">→</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Scholarly Context */}
      {s.scholarly_context && (
        <div className="sci-popup-section">
          <h4 className="sci-popup-section-title">{t.scholarly}</h4>
          <p className="sci-popup-text">{s.scholarly_context[lang] || s.scholarly_context.en}</p>
        </div>
      )}

      {/* Historiographical Note */}
      {s.historiographical_note && (
        <div className="sci-popup-section">
          <h4 className="sci-popup-section-title">{t.historiographical}</h4>
          <p className="sci-popup-text sci-popup-text--muted">{s.historiographical_note[lang] || s.historiographical_note.en}</p>
        </div>
      )}

      {/* Modern Parallel */}
      {s.modern_parallel && (
        <div className="sci-popup-section">
          <h4 className="sci-popup-section-title">{t.modern}</h4>
          <p className="sci-popup-text sci-popup-text--accent">{s.modern_parallel[lang] || s.modern_parallel.en}</p>
        </div>
      )}

      {/* Knowledge Flow */}
      {s.knowledge_flow && (
        <div className="sci-popup-section sci-flow-section">
          <h4 className="sci-popup-section-title">{t.flow}</h4>
          <div className="sci-flow-grid">
            {s.knowledge_flow.teachers?.length > 0 && (
              <div className="sci-flow-col">
                <span className="sci-flow-label">{t.teacher}</span>
                {s.knowledge_flow.teachers.map((tid, i) => (
                  <button key={i} className="sci-flow-link"
                    onClick={() => onScholarClick?.(typeof tid === 'string' && tid.startsWith('scholar_') ? tid : null)}>
                    {typeof tid === 'string' && tid.startsWith('scholar_') ? resolveScholarName(tid) : (tid?.name?.[lang] || tid?.name?.en || String(tid))}
                  </button>
                ))}
              </div>
            )}
            {s.knowledge_flow.students?.length > 0 && (
              <div className="sci-flow-col">
                <span className="sci-flow-label">{t.student}</span>
                {s.knowledge_flow.students.map((sid, i) => (
                  <button key={i} className="sci-flow-link"
                    onClick={() => onScholarClick?.(typeof sid === 'string' && sid.startsWith('scholar_') ? sid : null)}>
                    {typeof sid === 'string' && sid.startsWith('scholar_') ? resolveScholarName(sid) : (sid?.name?.[lang] || sid?.name?.en || String(sid))}
                  </button>
                ))}
              </div>
            )}
            {s.knowledge_flow.influence && (
              <div className="sci-flow-col">
                <span className="sci-flow-label">{t.influence}</span>
                <p className="sci-flow-text">{s.knowledge_flow.influence[lang] || s.knowledge_flow.influence.en}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* References */}
      {s.references && (
        <div className="sci-popup-section sci-ref-section">
          <h4 className="sci-popup-section-title">{t.references}</h4>
          <div className="sci-ref-grid">
            {s.references.dia && (
              <a className="sci-ref-badge sci-ref-dia" href={s.references.dia_url || '#'} target="_blank" rel="noopener noreferrer">
                <span className="sci-ref-src">{t.dia}</span>
                <span className="sci-ref-vol">{s.references.dia}</span>
              </a>
            )}
            {s.references.alam && (
              <span className="sci-ref-badge sci-ref-alam">
                <span className="sci-ref-src">{t.alam}</span>
                <span className="sci-ref-vol">{s.references.alam}</span>
              </span>
            )}
            {s.references.ei1 && (
              <span className="sci-ref-badge sci-ref-ei1">
                <span className="sci-ref-src">{t.ei1}</span>
                <span className="sci-ref-vol">{s.references.ei1}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Cross-References: el-A'lâm + Yâkût (O8) ── */}
      {(s.xref_alam || s.xref_yaqut) && (
        <div className="sci-popup-section sci-xref-section">
          <h4 className="sci-popup-section-title">{t.xref}</h4>
          <div className="sci-xref-grid">
            {s.xref_alam && (
              <button
                className="sci-xref-btn sci-xref-alam"
                onClick={() => onNavigateAlam?.(s.xref_alam.id)}
                title={`${s.xref_alam.name_tr} — ${t.alamEntry}`}
              >
                <span className="sci-xref-icon">📖</span>
                <div className="sci-xref-info">
                  <span className="sci-xref-label">{t.viewInAlam}</span>
                  <span className="sci-xref-detail">{s.xref_alam.name_tr || s.xref_alam.name_ar}</span>
                </div>
                <span className="sci-xref-arrow">→</span>
              </button>
            )}
            {s.xref_yaqut && (
              <button
                className="sci-xref-btn sci-xref-yaqut"
                onClick={() => onNavigateYaqut?.(s.xref_yaqut.id)}
                title={`${s.xref_yaqut.name_tr} — ${t.yaqutPlace}`}
              >
                <span className="sci-xref-icon">🌍</span>
                <div className="sci-xref-info">
                  <span className="sci-xref-label">{t.viewInYaqut}</span>
                  <span className="sci-xref-detail">{s.xref_yaqut.name_tr || s.xref_yaqut.name_en} ({s.xref_yaqut.region})</span>
                </div>
                <span className="sci-xref-arrow">→</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
