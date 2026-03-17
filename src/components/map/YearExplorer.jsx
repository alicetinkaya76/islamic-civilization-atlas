/**
 * YearExplorer.jsx — SESSION 13, Bileşen 2
 * "Bu Yıl Ne Oldu?" — Kullanıcı bir yıl seçer, o yıla ait tüm veriler kartlar halinde gösterilir.
 *
 * Props:
 *   lang     : 'tr' | 'en' | 'ar'
 *   onFlyTo  : ({ lat, lon, zoom }) => void
 *   onClose  : () => void
 */
import { useState, useMemo, useCallback } from 'react';
import DB from '../../data/db.json';
import useAsyncData from '../../hooks/useAsyncData';

/* ─── i18n ─── */
const LABELS = {
  tr: {
    title: 'Bu Yıl Ne Oldu?',
    subtitle: 'Bir yıl seçin ve o yıla ait tüm kayıtları görün',
    dynastyFounded: 'Kurulan Devletler',
    dynastyFell: 'Yıkılan Devletler',
    dynastyActive: 'Aktif Devletler',
    battles: 'Savaşlar',
    events: 'Olaylar',
    scholarBorn: 'Doğan Âlimler',
    scholarDied: 'Vefat Eden Âlimler',
    monuments: 'İnşa Edilen Eserler',
    madrasas: 'Kurulan Medreseler',
    rulers: 'Tahta Çıkan Hükümdarlar',
    alamDied: "el-A'lâm — Vefat Edenler",
    empty: 'Bu yıl için kayıtlı veri bulunamadı.',
    close: 'Kapat',
    goToMap: 'Haritada Göster',
    year: 'Yıl',
  },
  en: {
    title: 'What Happened This Year?',
    subtitle: 'Select a year and explore all related records',
    dynastyFounded: 'Dynasties Founded',
    dynastyFell: 'Dynasties Fallen',
    dynastyActive: 'Active Dynasties',
    battles: 'Battles',
    events: 'Events',
    scholarBorn: 'Scholars Born',
    scholarDied: 'Scholars Deceased',
    monuments: 'Monuments Built',
    madrasas: 'Madrasas Founded',
    rulers: 'Rulers Enthroned',
    alamDied: 'al-Aʿlām — Deceased',
    empty: 'No records found for this year.',
    close: 'Close',
    goToMap: 'Show on Map',
    year: 'Year',
  },
  ar: {
    title: 'ماذا حدث في هذا العام؟',
    subtitle: 'اختر سنة واستعرض جميع السجلات',
    dynastyFounded: 'دول تأسست',
    dynastyFell: 'دول سقطت',
    dynastyActive: 'دول نشطة',
    battles: 'المعارك',
    events: 'الأحداث',
    scholarBorn: 'علماء ولدوا',
    scholarDied: 'علماء توفوا',
    monuments: 'آثار بنيت',
    madrasas: 'مدارس تأسست',
    rulers: 'حكام تولوا العرش',
    alamDied: 'الأعلام — المتوفون',
    empty: 'لم يتم العثور على سجلات لهذا العام.',
    close: 'إغلاق',
    goToMap: 'عرض على الخريطة',
    year: 'السنة',
  },
};

/* ─── Category config ─── */
const CATEGORY_ICONS = {
  dynastyFounded: '🏛',
  dynastyFell: '💀',
  battles: '⚔',
  events: '📅',
  scholarBorn: '🌟',
  scholarDied: '📿',
  monuments: '🕌',
  madrasas: '📚',
  rulers: '👑',
  alamDied: '📖',
};

const CATEGORY_COLORS = {
  dynastyFounded: '#4ade80',
  dynastyFell: '#f87171',
  battles: '#dc2626',
  events: '#60a5fa',
  scholarBorn: '#34d399',
  scholarDied: '#a78bfa',
  monuments: '#fbbf24',
  madrasas: '#22d3ee',
  rulers: '#e879f9',
  alamDied: '#f59e0b',
};

/* ─── Name getter ─── */
function n(obj, lang) {
  if (!obj) return '';
  return obj[lang] || obj.en || obj.tr || obj.ar || '';
}

/* ─── Precompute ruler start years ─── */
function getRulerStartYear(r) {
  return r.rs || null;
}

/* ─── Main Component ─── */
export default function YearExplorer({ lang = 'tr', onFlyTo, onClose }) {
  const [year, setYear] = useState(1000);
  const t = LABELS[lang] || LABELS.en;

  const { data: alamData } = useAsyncData('/data/alam_lite.json');

  /* ─── Compute results for selected year ─── */
  const results = useMemo(() => {
    const r = {};
    const tolerance = 0; // exact year match

    // Dynasties founded
    r.dynastyFounded = DB.dynasties.filter(d => d.start === year);

    // Dynasties fallen
    r.dynastyFell = DB.dynasties.filter(d => d.end === year);

    // Battles
    r.battles = DB.battles.filter(b => b.yr === year);

    // Events
    r.events = DB.events.filter(e => e.yr === year);

    // Scholars born
    r.scholarBorn = DB.scholars.filter(s => s.b === year);

    // Scholars died
    r.scholarDied = DB.scholars.filter(s => s.d === year);

    // Monuments
    r.monuments = DB.monuments.filter(m => m.yr === year);

    // Madrasas
    r.madrasas = (DB.madrasas || []).filter(m => m.founded === year);

    // Rulers enthroned
    r.rulers = DB.rulers.filter(ru => getRulerStartYear(ru) === year);

    // el-A'lâm deceased
    if (alamData) {
      r.alamDied = alamData.filter(a => a.md === year && a.lat && a.lon).slice(0, 30);
    } else {
      r.alamDied = [];
    }

    return r;
  }, [year, alamData]);

  const totalCount = useMemo(() =>
    Object.values(results).reduce((s, arr) => s + arr.length, 0),
    [results]
  );

  const handleSlider = useCallback((e) => setYear(+e.target.value), []);
  const handleInput = useCallback((e) => {
    const v = +e.target.value;
    if (v >= 622 && v <= 2000) setYear(v);
  }, []);

  /* ─── Card renderer ─── */
  const renderCard = (item, category) => {
    const name = category === 'alamDied'
      ? (item.ht || item.he || item.h || '')
      : n(item, lang);
    const hasCoords = item.lat && item.lon;
    const color = CATEGORY_COLORS[category];

    let detail = '';
    if (category === 'dynastyFounded' || category === 'dynastyFell') {
      detail = item.zone || '';
    } else if (category === 'battles') {
      detail = n({ tr: item.narr_tr, en: item.narr_en, ar: item.narr_ar }, lang)?.slice(0, 80) || '';
    } else if (category === 'events') {
      detail = n({ tr: item.narr_tr, en: item.narr_en, ar: item.narr_ar }, lang)?.slice(0, 80) || '';
    } else if (category.startsWith('scholar')) {
      detail = `${item.city_tr || item.city_en || ''} — ${item.disc_tr || item.disc_en || ''}`;
    } else if (category === 'monuments') {
      detail = item.city_tr || item.city_en || '';
    } else if (category === 'madrasas') {
      detail = item.city_tr || item.city_en || '';
    } else if (category === 'rulers') {
      const dyn = DB.dynasties.find(d => d.id === item.did);
      detail = dyn ? n(dyn, lang) : '';
    } else if (category === 'alamDied') {
      detail = item.dt || item.de || '';
      if (detail.length > 60) detail = detail.slice(0, 60) + '…';
    }

    return (
      <div key={`${category}-${item.id}`} className="ye-card" style={{ borderLeftColor: color }}>
        <div className="ye-card-name">{name}</div>
        {detail && <div className="ye-card-detail">{detail}</div>}
        {hasCoords && onFlyTo && (
          <button className="ye-card-map" onClick={() => onFlyTo({ lat: item.lat, lon: item.lon, zoom: 8 })}>
            📍 {t.goToMap}
          </button>
        )}
      </div>
    );
  };

  /* ─── Category section renderer ─── */
  const renderSection = (key) => {
    const items = results[key];
    if (!items || items.length === 0) return null;
    return (
      <div key={key} className="ye-section">
        <div className="ye-section-header" style={{ color: CATEGORY_COLORS[key] }}>
          <span className="ye-section-icon">{CATEGORY_ICONS[key]}</span>
          <span className="ye-section-title">{t[key]}</span>
          <span className="ye-section-count">({items.length})</span>
        </div>
        <div className="ye-cards">
          {items.map(item => renderCard(item, key))}
        </div>
      </div>
    );
  };

  const categories = [
    'dynastyFounded', 'dynastyFell', 'battles', 'events',
    'scholarBorn', 'scholarDied', 'monuments', 'madrasas', 'rulers', 'alamDied'
  ];

  return (
    <div className="ye-overlay" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="ye-container">
        {/* Header */}
        <div className="ye-header">
          <div>
            <h2 className="ye-title">{t.title}</h2>
            <p className="ye-subtitle">{t.subtitle}</p>
          </div>
          {onClose && (
            <button className="ye-close" onClick={onClose} aria-label={t.close}>✕</button>
          )}
        </div>

        {/* Year controls */}
        <div className="ye-controls">
          <input
            type="number"
            className="ye-year-input"
            min={622} max={2000}
            value={year}
            onChange={handleInput}
            aria-label={t.year}
          />
          <input
            type="range"
            className="ye-slider"
            min={622} max={2000} step={1}
            value={year}
            onChange={handleSlider}
            aria-label={t.year}
          />
          <div className="ye-ticks">
            {['622', '750', '900', '1100', '1258', '1453', '1600', '1800', '2000'].map(y => (
              <span key={y} className={+y === year ? 'active' : ''} onClick={() => setYear(+y)}>{y}</span>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="ye-results">
          {totalCount === 0 ? (
            <div className="ye-empty">{t.empty}</div>
          ) : (
            categories.map(renderSection)
          )}
        </div>
      </div>
    </div>
  );
}
