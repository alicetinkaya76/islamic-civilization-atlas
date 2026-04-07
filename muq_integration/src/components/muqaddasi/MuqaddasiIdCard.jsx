import { useMemo } from 'react';
import { IQLIM_COLORS, IQLIM_LABELS, CERT_OPACITY } from './constants';

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

export default function MuqaddasiIdCard({ place, connectedRoutes, onClose, tr, lang }) {
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
      {place.desc_tr && (
        <div className="muq-idcard-desc">
          <span className="muq-idcard-label">{tr.description}</span>
          <p>{place.desc_tr}</p>
        </div>
      )}

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
    </div>
  );
}
