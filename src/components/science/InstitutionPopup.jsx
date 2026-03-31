/**
 * InstitutionPopup.jsx — islamicatlas.org Science Layer
 * Glassmorphic popup card for institution records.
 *
 * Props:
 *   institution    — institution object from science_layer_data_v4.json
 *   lang           — "en" | "tr" | "ar" (default "en")
 *   onClose        — close handler
 *   onScholarClick — (id) => void, navigate to scholar
 *   icons          — optional map { institutionType: svgUrl }
 *   allScholars    — full scholars array for resolving key_scholars IDs
 */

import React, { useEffect, useCallback } from 'react';
import '../../styles/science_layer_popup.css';

/* ── i18n labels ── */
const LABELS = {
  en: {
    founded: 'Founded', declined: 'Declined', city: 'City',
    fields: 'Fields', scholars: 'Key Scholars',
    context: 'Scholarly Context', modernParallel: 'Modern Parallel',
    close: 'Close', ce: 'CE', ah: 'AH',
    institutionTypes: {
      academy: 'Academy / Library',
      madrasa: 'Madrasa',
      observatory: 'Observatory',
      hospital: 'Bimaristan',
      translation_center: 'Translation Center',
    },
  },
  tr: {
    founded: 'Kuruluş', declined: 'Çöküş', city: 'Şehir',
    fields: 'Alanlar', scholars: 'Önemli Alimler',
    context: 'Akademik Bağlam', modernParallel: 'Modern Karşılık',
    close: 'Kapat', ce: 'MS', ah: 'AH',
    institutionTypes: {
      academy: 'Akademi / Kütüphane',
      madrasa: 'Medrese',
      observatory: 'Rasathane',
      hospital: 'Bîmâristân',
      translation_center: 'Çeviri Merkezi',
    },
  },
  ar: {
    founded: 'التأسيس', declined: 'الانهيار', city: 'المدينة',
    fields: 'المجالات', scholars: 'أبرز العلماء',
    context: 'السياق العلمي', modernParallel: 'المقابل المعاصر',
    close: 'إغلاق', ce: 'م', ah: 'هـ',
    institutionTypes: {
      academy: 'أكاديمية / مكتبة',
      madrasa: 'مدرسة',
      observatory: 'مرصد',
      hospital: 'بيمارستان',
      translation_center: 'مركز ترجمة',
    },
  },
};

/* ── Institution type colours ── */
const TYPE_COLORS = {
  academy: '#a855f7',
  madrasa: '#c8a45e',
  observatory: '#6366f1',
  hospital: '#10b981',
  translation_center: '#a855f7',
};

/* ── Field colours ── */
const FIELD_COLORS = {
  mathematics: '#3b82f6', astronomy: '#6366f1', medicine: '#10b981',
  optics: '#06b6d4', chemistry: '#f59e0b', geography: '#84cc16',
  philosophy: '#8b5cf6', engineering: '#f97316', natural_sciences: '#14b8a6',
  religious_sciences: '#c8a45e', social_sciences: '#ec4899',
  translation: '#a855f7', literature: '#a855f7', history: '#ec4899',
  music: '#f97316', education: '#c8a45e', navigation: '#84cc16',
  physics: '#06b6d4', theology: '#c8a45e', architecture: '#f97316',
};

const FIELD_NAMES = {
  en: {
    mathematics: 'Mathematics', astronomy: 'Astronomy', medicine: 'Medicine',
    optics: 'Optics', chemistry: 'Chemistry', geography: 'Geography',
    philosophy: 'Philosophy', engineering: 'Engineering',
    natural_sciences: 'Natural Sciences', religious_sciences: 'Religious Sciences',
    social_sciences: 'Social Sciences', translation: 'Translation',
    literature: 'Literature', history: 'History', music: 'Music',
    education: 'Education', navigation: 'Navigation', physics: 'Physics',
    theology: 'Theology', architecture: 'Architecture',
  },
  tr: {
    mathematics: 'Matematik', astronomy: 'Astronomi', medicine: 'Tıp',
    optics: 'Optik', chemistry: 'Kimya', geography: 'Coğrafya',
    philosophy: 'Felsefe', engineering: 'Mühendislik',
    natural_sciences: 'Doğa Bilimleri', religious_sciences: 'Dini İlimler',
    social_sciences: 'Sosyal Bilimler', translation: 'Çeviri',
    literature: 'Edebiyat', history: 'Tarih', music: 'Müzik',
    education: 'Eğitim', navigation: 'Denizcilik', physics: 'Fizik',
    theology: 'Kelam', architecture: 'Mimarlık',
  },
  ar: {
    mathematics: 'الرياضيات', astronomy: 'الفلك', medicine: 'الطب',
    optics: 'البصريات', chemistry: 'الكيمياء', geography: 'الجغرافيا',
    philosophy: 'الفلسفة', engineering: 'الهندسة',
    natural_sciences: 'العلوم الطبيعية', religious_sciences: 'العلوم الشرعية',
    social_sciences: 'العلوم الاجتماعية', translation: 'الترجمة',
    literature: 'الأدب', history: 'التاريخ', music: 'الموسيقى',
    education: 'التعليم', navigation: 'الملاحة', physics: 'الفيزياء',
    theology: 'الكلام', architecture: 'العمارة',
  },
};

/* ── Helpers ── */
function ceToHijri(ce) {
  if (!ce) return '';
  return Math.round((ce - 622) * (33 / 32));
}

function t(obj, lang) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.en || obj.tr || obj.ar || '';
}

/* ── Component ── */
export default function InstitutionPopup({
  institution,
  lang = 'en',
  onClose,
  onScholarClick,
  icons = {},
  allScholars = [],
}) {
  const L = LABELS[lang] || LABELS.en;
  const FN = FIELD_NAMES[lang] || FIELD_NAMES.en;
  const isRtl = lang === 'ar';

  /* Close on Escape */
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose?.();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  if (!institution) return null;

  const {
    name, city, founded, declined,
    institution_type, description,
    key_scholars = [], fields = [],
    scholarly_context, modern_parallel,
  } = institution;

  const accentColor = TYPE_COLORS[institution_type] || '#a855f7';
  const typeLabel = L.institutionTypes?.[institution_type] || institution_type;

  /* Resolve scholar IDs to name objects */
  const scholarMap = {};
  allScholars.forEach((s) => { scholarMap[s.id] = s; });

  return (
    <div
      className="sl-popup-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={t(name, 'en')}
    >
      <div
        className="sl-popup"
        dir={isRtl ? 'rtl' : 'ltr'}
        lang={lang}
        style={{ '--sl-accent': accentColor, '--sl-accent-soft': accentColor + '18' }}
      >
        {/* Close */}
        <button className="sl-popup__close" onClick={onClose} aria-label={L.close}>×</button>

        {/* ── Header ── */}
        <div className="sl-popup__header">
          <div className="sl-popup__icon-row">
            {icons[institution_type] && (
              <img
                className="sl-popup__field-icon"
                src={icons[institution_type]}
                alt={typeLabel}
              />
            )}
            <span className="sl-popup__name-en">{t(name, lang)}</span>
          </div>
          <div className="sl-popup__names-row">
            {lang !== 'ar' && name?.ar && (
              <span className="sl-popup__name-ar">{name.ar}</span>
            )}
            {lang !== 'tr' && name?.tr && (
              <span className="sl-popup__name-tr">{name.tr}</span>
            )}
            {lang === 'ar' && name?.en && (
              <span className="sl-popup__name-tr">{name.en}</span>
            )}
          </div>

          {/* Type badge */}
          <div style={{ marginTop: 8 }}>
            <span
              className="sl-badge sl-badge--primary"
              style={{ background: accentColor, color: '#fff' }}
            >
              {typeLabel}
            </span>
          </div>
        </div>

        {/* ── Institution metadata ── */}
        <div className="sl-popup__inst-meta">
          {founded && (
            <div className="sl-popup__inst-meta-item">
              <span className="sl-popup__inst-meta-icon">🏗️</span>
              <span>
                {L.founded}: <strong>{founded} {L.ce}</strong>
                {' / '}
                <span className="sl-popup__hijri">{ceToHijri(founded)} {L.ah}</span>
              </span>
            </div>
          )}
          {declined && (
            <div className="sl-popup__inst-meta-item">
              <span className="sl-popup__inst-meta-icon">📉</span>
              <span>
                {L.declined}: <strong>{declined} {L.ce}</strong>
              </span>
            </div>
          )}
        </div>

        {/* City */}
        {city && (
          <div className="sl-popup__inst-meta" style={{ paddingTop: 0 }}>
            <div className="sl-popup__inst-meta-item">
              <span className="sl-popup__inst-meta-icon">📍</span>
              <span>{L.city}: <strong>{t(city, lang)}</strong></span>
            </div>
          </div>
        )}

        {/* ── Description ── */}
        {description && (
          <div className="sl-popup__contribution">
            <div className="sl-popup__contribution-text">
              {t(description, lang)}
            </div>
            {modern_parallel && (
              <div className="sl-popup__modern-parallel">
                <span className="sl-popup__modern-parallel-icon">💡</span>
                <span>{t(modern_parallel, lang)}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Field badges ── */}
        {fields.length > 0 && (
          <div className="sl-popup__fields">
            {fields.map((f) => (
              <span
                key={f}
                className="sl-badge"
                style={{
                  '--sl-accent': FIELD_COLORS[f] || '#888',
                  '--sl-accent-soft': (FIELD_COLORS[f] || '#888') + '18',
                }}
              >
                <span className="sl-badge__dot" style={{ background: FIELD_COLORS[f] }} />
                {FN[f] || f}
              </span>
            ))}
          </div>
        )}

        {/* ── Key Scholars ── */}
        {key_scholars.length > 0 && (
          <div className="sl-popup__scholars-list">
            <div className="sl-popup__section-title">
              <span className="sl-popup__section-icon">👤</span>
              {L.scholars}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {key_scholars.map((sid) => {
                const scholar = scholarMap[sid];
                const sName = scholar ? t(scholar.name, lang) : sid;
                return (
                  <button
                    key={sid}
                    className="sl-popup__scholar-link"
                    onClick={() => onScholarClick?.(sid)}
                  >
                    {sName}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Scholarly Context ── */}
        {scholarly_context && (
          <div className="sl-popup__context">
            <div className="sl-popup__section-title">
              <span className="sl-popup__section-icon">🔬</span>
              {L.context}
            </div>
            <div className="sl-popup__context-text">{t(scholarly_context, lang)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
