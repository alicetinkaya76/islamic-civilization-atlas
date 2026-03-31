/**
 * RoutePopup.jsx — islamicatlas.org Science Layer (v7.4.0.0 / O8)
 *
 * B2: Transfer route popup cards — each cultural transfer has unique content
 * B5: Route → Scholar navigation via route_scholars
 */

import { useMemo } from 'react';
import { FIELD_COLORS, FIELD_NAMES } from './ScienceLayerView';
import '../../styles/science_layer_popup.css';

/* ── Category meta ── */
const CAT_META = {
  internal: {
    icon: '🔵', labelColor: '#3B82F6',
    en: 'Internal Knowledge Route', tr: 'İç Bilgi Güzergâhı', ar: 'مسار معرفي داخلي',
  },
  science_transfer: {
    icon: '🟠', labelColor: '#F59E0B',
    en: 'Science Transfer Route', tr: 'Bilim Transfer Güzergâhı', ar: 'مسار نقل العلوم',
  },
  cultural_transfer: {
    icon: '🟢', labelColor: '#10B981',
    en: 'Cultural Transfer Route', tr: 'Kültür Transfer Güzergâhı', ar: 'مسار النقل الثقافي',
  },
};

/* ── i18n ── */
const RT_T = {
  tr: {
    close: 'Kapat', period: 'Dönem', subjects: 'Konular', description: 'Açıklama',
    waypoints: 'Güzergâh Noktaları', from: 'Başlangıç', to: 'Varış', via: 'Ara Durak',
    scholars: 'İlgili Alimler', events: 'Olaylar', noScholars: 'Bu güzergâhla henüz alim ilişkilendirilmemiş.',
    storyMode: 'Hikâye Moduna Geç',
  },
  en: {
    close: 'Close', period: 'Period', subjects: 'Subjects', description: 'Description',
    waypoints: 'Waypoints', from: 'Origin', to: 'Destination', via: 'Via',
    scholars: 'Related Scholars', events: 'Events', noScholars: 'No scholars linked to this route yet.',
    storyMode: 'Enter Story Mode',
  },
  ar: {
    close: 'إغلاق', period: 'الفترة', subjects: 'المواضيع', description: 'الوصف',
    waypoints: 'نقاط المسار', from: 'المنطلق', to: 'الوجهة', via: 'عبر',
    scholars: 'العلماء المرتبطون', events: 'الأحداث', noScholars: 'لا يوجد علماء مرتبطون بهذا المسار بعد.',
    storyMode: 'وضع الرواية',
  },
};

/* ── Waypoint timeline ── */
function WaypointTimeline({ route, lang, catColor }) {
  const wps = [];
  if (route.from) wps.push({ ...route.from, _type: 'from' });
  (route.via || []).forEach(v => wps.push({ ...v, _type: 'via' }));
  if (route.to) wps.push({ ...route.to, _type: 'to' });

  return (
    <div className="rt-wp-timeline">
      {wps.map((wp, i) => {
        const name = typeof wp.name === 'object'
          ? (wp.name[lang] || wp.name.en || '')
          : (wp.name || '');
        const event = wp.event
          ? (wp.event[lang] || wp.event.en || '')
          : '';
        const isLast = i === wps.length - 1;

        return (
          <div key={i} className="rt-wp-item">
            <div className="rt-wp-line-col">
              <span className="rt-wp-dot" style={{ background: catColor, boxShadow: `0 0 6px ${catColor}50` }} />
              {!isLast && <span className="rt-wp-connector" style={{ background: `${catColor}40` }} />}
            </div>
            <div className="rt-wp-content">
              <span className="rt-wp-name">{name}</span>
              {event && <span className="rt-wp-event">{event}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function RoutePopup({
  route, lang, onClose, onScholarClick, allScholars = [], onStoryMode,
}) {
  const t = RT_T[lang] || RT_T.en;
  const isRTL = lang === 'ar';
  const cat = route.category || 'internal';
  const catMeta = CAT_META[cat] || CAT_META.internal;
  const catColor = catMeta.labelColor;
  const routeName = route.name?.[lang] || route.name?.en || '';
  const description = route.description?.[lang] || route.description?.en || '';

  /* ── Resolve route_scholars ── */
  const linkedScholars = useMemo(() => {
    if (!route.route_scholars?.length) return [];
    return route.route_scholars
      .map(sid => allScholars.find(s => s.id === sid))
      .filter(Boolean);
  }, [route.route_scholars, allScholars]);

  /* ── Waypoint count ── */
  const wpCount = 1 + (route.via?.length || 0) + 1;

  return (
    <div className="sci-popup route-popup" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="sci-popup-header" style={{ borderBottom: `2px solid ${catColor}30` }}>
        <div className="sci-popup-title-row">
          <span className="rt-cat-badge" style={{ background: `${catColor}20`, color: catColor, borderColor: `${catColor}40` }}>
            {catMeta.icon} {catMeta[lang] || catMeta.en}
          </span>
          <button className="sci-popup-close" onClick={onClose} title={t.close}>✕</button>
        </div>
        <h3 className="sci-popup-name" style={{ color: catColor }}>{routeName}</h3>
        <div className="sci-popup-meta">
          {route.period && <span>{t.period}: {route.period}</span>}
          <span className="sci-popup-sep">·</span>
          <span>{wpCount} {t.waypoints.toLowerCase()}</span>
          {linkedScholars.length > 0 && (
            <>
              <span className="sci-popup-sep">·</span>
              <span>{linkedScholars.length} {t.scholars.toLowerCase()}</span>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="sci-popup-section">
          <h4 className="sci-popup-section-title">{t.description}</h4>
          <p className="sci-popup-text">{description}</p>
        </div>
      )}

      {/* Subjects chips */}
      {route.subjects?.length > 0 && (
        <div className="sci-popup-section">
          <h4 className="sci-popup-section-title">{t.subjects}</h4>
          <div className="sci-popup-chips">
            {route.subjects.map((sub, i) => (
              <span key={i} className="sci-popup-chip" style={{ '--chip-c': catColor }}>
                {FIELD_NAMES[sub]?.[lang] || sub}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Waypoint timeline */}
      <div className="sci-popup-section">
        <h4 className="sci-popup-section-title">{t.waypoints}</h4>
        <WaypointTimeline route={route} lang={lang} catColor={catColor} />
      </div>

      {/* Related Scholars (B5) */}
      <div className="sci-popup-section">
        <h4 className="sci-popup-section-title">{t.scholars} {linkedScholars.length > 0 && <span className="sci-badge">{linkedScholars.length}</span>}</h4>
        {linkedScholars.length > 0 ? (
          <div className="rt-scholars-list">
            {linkedScholars.map(s => {
              const color = FIELD_COLORS[s.primary_field] || '#888';
              return (
                <button
                  key={s.id}
                  className="sci-result-card"
                  onClick={() => onScholarClick?.(s.id)}
                >
                  <span className="sci-result-dot" style={{ background: color }} />
                  <div className="sci-result-info">
                    <span className="sci-result-name">{s.name?.[lang] || s.name?.en}</span>
                    <span className="sci-result-meta">
                      {FIELD_NAMES[s.primary_field]?.[lang] || s.primary_field} · {s.birth_year}–{s.death_year}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="sci-popup-text sci-popup-text--muted" style={{ fontSize: 11 }}>{t.noScholars}</p>
        )}
      </div>

      {/* Story mode button for Route 017 (Renaissance Catalyst) */}
      {route.id === 'route_017' && onStoryMode && (
        <div className="sci-popup-section" style={{ textAlign: 'center', paddingTop: 4 }}>
          <button className="rt-story-btn" onClick={() => onStoryMode(route)} style={{ '--btn-c': catColor }}>
            ✦ {t.storyMode}
          </button>
        </div>
      )}
    </div>
  );
}
