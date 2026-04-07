import { useMemo } from 'react';
import { IQLIM_COLORS, IQLIM_LABELS, CERT_OPACITY, IQLIM_DESC } from './constants';

const CERT_BADGE = {
  certain: { bg: '#1d9e75', label: { tr: 'Kesin', en: 'Certain', ar: 'مؤكد' } },
  exact: { bg: '#1d9e75', label: { tr: 'Kesin', en: 'Exact', ar: 'دقيق' } },
  modern_known: { bg: '#1d9e75', label: { tr: 'Modern bilinen', en: 'Modern known', ar: 'معروف حديثاً' } },
  approximate: { bg: '#378add', label: { tr: 'Yaklaşık', en: 'Approximate', ar: 'تقريبي' } },
  country: { bg: '#378add', label: { tr: 'Ülke düzeyi', en: 'Country level', ar: 'مستوى البلد' } },
  region: { bg: '#378add', label: { tr: 'Bölge düzeyi', en: 'Region level', ar: 'مستوى المنطقة' } },
  inferred: { bg: '#378add', label: { tr: 'Çıkarımsanan', en: 'Inferred', ar: 'مُستنتَج' } },
  uncertain: { bg: '#ef9f27', label: { tr: 'Belirsiz', en: 'Uncertain', ar: 'غير مؤكد' } },
  estimated: { bg: '#d85a30', label: { tr: 'Tahmini', en: 'Estimated', ar: 'تقديري' } },
};

export default function MuqaddasiIdCard({ place, connectedRoutes, xrefs, onClose, tr, lang }) {
  if (!place) {
    return (
      <div className="muq-idcard muq-idcard-empty">
        <p>{tr.noSelection}</p>
      </div>
    );
  }

  const color = IQLIM_COLORS[place.iqlim_ar] || '#808080';
  const cert = CERT_BADGE[place.certainty] || CERT_BADGE.uncertain;
  const iqLabel = lang === 'ar' ? place.iqlim_ar : (IQLIM_LABELS[place.iqlim_ar]?.[lang] || place.iqlim_ar || '');

  return (
    <div className="muq-idcard">
      {/* Close button */}
      <button className="muq-idcard-close" onClick={onClose}>✕</button>

      {/* Title */}
      <h3 className="muq-idcard-title" style={{ direction: 'rtl' }}>{place.name_ar}</h3>

      {/* Iqlim badge */}
      {place.iqlim_ar && (
        <span className="muq-idcard-iqlim" style={{ background: color, color: '#fff' }}>
          {iqLabel}
        </span>
      )}

      {/* Certainty badge */}
      <span className="muq-idcard-cert" style={{ background: cert.bg, color: '#fff' }}>
        {cert.label[lang] || cert.label.tr}
      </span>

      {/* Coordinates */}
      {place.lat != null && (
        <div className="muq-idcard-row">
          <span className="muq-idcard-label">{tr.coordinates}</span>
          <span className="muq-idcard-value">{place.lat.toFixed(4)}, {place.lon.toFixed(4)}</span>
        </div>
      )}

      {/* Coord source */}
      {place.coord_source && (
        <div className="muq-idcard-row">
          <span className="muq-idcard-label">{tr.coordSource}</span>
          <span className="muq-idcard-value">{place.coord_source}</span>
        </div>
      )}

      {/* Description */}
      {place.desc_tr ? (
        <div className="muq-idcard-desc">
          <span className="muq-idcard-label">
            {tr.description}
            {lang !== 'tr' && <span className="muq-lang-badge">TR</span>}
          </span>
          <p>{place.desc_tr}</p>
          {place.desc_tr.endsWith('...') && (
            <span className="muq-truncated-note">
              {lang === 'tr' ? '(Metin kaynakta kırpılmıştır)' :
               lang === 'ar' ? '(النص مختصر في المصدر)' :
               '(Text truncated in source)'}
            </span>
          )}
        </div>
      ) : place.iqlim_ar && IQLIM_DESC[place.iqlim_ar] ? (
        <div className="muq-idcard-desc">
          <span className="muq-idcard-label">{tr.iqlim}: {iqLabel}</span>
          <p style={{ fontStyle: 'italic', opacity: 0.8 }}>
            {IQLIM_DESC[place.iqlim_ar]?.[lang] || IQLIM_DESC[place.iqlim_ar]?.tr || ''}
          </p>
        </div>
      ) : null}

      {/* Connected routes */}
      {connectedRoutes.length > 0 && (
        <div className="muq-idcard-routes">
          <span className="muq-idcard-label">{tr.routeInfo} ({connectedRoutes.length})</span>
          <ul>
            {connectedRoutes.slice(0, 10).map((r, i) => {
              const other = r.from_id === place.id ? r.to_ar : r.from_ar;
              const dir = r.from_id === place.id ? '→' : '←';
              return (
                <li key={i}>
                  <span style={{ direction: 'rtl' }}>{dir} {other}</span>
                  {r.km_est && <span className="muq-route-km">{r.km_est} {tr.km}</span>}
                  {r.distance_raw && <span className="muq-route-raw">{r.distance_raw}</span>}
                </li>
              );
            })}
            {connectedRoutes.length > 10 && (
              <li className="muq-route-more">+{connectedRoutes.length - 10} daha…</li>
            )}
          </ul>
        </div>
      )}

      {/* No routes info */}
      {connectedRoutes.length === 0 && (
        <div className="muq-idcard-desc" style={{ marginTop: 12, opacity: 0.6 }}>
          <p style={{ fontSize: 11 }}>
            {lang === 'tr' ? 'Bu yer için Makdisî güzergâh bilgisi kaydetmemiştir.' :
             lang === 'ar' ? 'لم يسجل المقدسي طريقاً لهذا الموضع.' :
             'al-Muqaddasī did not record a route for this place.'}
          </p>
        </div>
      )}

      {/* Cross-references */}
      {xrefs && xrefs.length > 0 && (
        <div className="muq-idcard-xref">
          <span className="muq-idcard-label">
            {lang === 'tr' ? 'Diğer Kaynaklarda' : lang === 'ar' ? 'في مصادر أخرى' : 'In Other Sources'}
          </span>
          <div className="muq-xref-list">
            {xrefs.map((x, i) => {
              const icons = { yaqut: '🌍', lestrange: '🗺️', rihla: '🧭', evliya: '🐫', alam: '📖', dia: '📚' };
              const labels = {
                yaqut: { tr: "Mu'cemü'l-Büldân", en: "Muʿjam al-Buldān", ar: 'معجم البلدان' },
                lestrange: { tr: 'Le Strange', en: 'Le Strange', ar: 'لي سترينج' },
                rihla: { tr: 'İbn Battûta', en: 'Ibn Battuta', ar: 'ابن بطوطة' },
                evliya: { tr: 'Evliyâ Çelebi', en: 'Evliya Çelebi', ar: 'أوليا جلبي' },
                alam: { tr: 'el-Aʿlâm', en: 'al-Aʿlām', ar: 'الأعلام' },
                dia: { tr: 'DİA', en: 'DİA', ar: 'DİA' },
              };
              const tabMap = { rihla:'rihla', evliya:'evliya', lestrange:'lestrange', yaqut:'yaqut', alam:'alam', dia:'dia' };

              // A'lam or DIA: show scholar count + top names
              if ((x.s === 'alam' || x.s === 'dia') && x.count) {
                return (
                  <div key={i} className="muq-xref-scholars">
                    <div className="muq-xref-scholars-header"
                      onClick={() => { window.location.hash = tabMap[x.s]; }}
                      style={{ cursor: 'pointer' }}>
                      <span className="muq-xref-icon">{icons[x.s]}</span>
                      <span className="muq-xref-source">{labels[x.s]?.[lang] || x.s}</span>
                      <span className="muq-xref-count">{x.count} {lang === 'tr' ? 'âlim' : lang === 'ar' ? 'عالم' : 'scholars'}</span>
                    </div>
                    {x.top && x.top.length > 0 && (
                      <ul className="muq-xref-scholar-list">
                        {x.top.map((s, j) => (
                          <li key={j}>
                            <span style={{ direction: 'rtl' }}>{s.h || s.ht || s.t || ''}</span>
                            {s.d ? <span className="muq-xref-date">
                              {s.d > 0 ? `ö. ${s.d} H.` : ''}
                            </span> : null}
                            {s.ds ? <span className="muq-xref-date">{s.ds}</span> : null}
                          </li>
                        ))}
                        {x.count > 3 && (
                          <li className="muq-route-more">+{x.count - 3} daha…</li>
                        )}
                      </ul>
                    )}
                  </div>
                );
              }

              // Regular source xref (yaqut, lestrange, rihla, evliya)
              const matchLabel = x.m === 'geo'
                ? `~${x.d} km`
                : (lang === 'tr' ? 'isim eşleşmesi' : lang === 'ar' ? 'تطابق اسمي' : 'name match');

              return (
                <button
                  key={i}
                  className="muq-xref-item"
                  onClick={() => { window.location.hash = tabMap[x.s] || 'map'; }}
                  title={x.h || x.ht || x.n || ''}
                >
                  <span className="muq-xref-icon">{icons[x.s] || '📌'}</span>
                  <span className="muq-xref-source">{labels[x.s]?.[lang] || x.s}</span>
                  {(x.h || x.ht || x.n) && (
                    <span className="muq-xref-name" style={{ direction: x.h ? 'rtl' : 'ltr' }}>
                      {x.ht || x.n || x.h}
                    </span>
                  )}
                  <span className="muq-xref-match">{matchLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
