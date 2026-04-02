import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';

/**
 * SalibiyyatRoutes — Ported from standalone RoutesPage.jsx
 * Shows 11 crusade routes as card list + mini Leaflet map detail.
 * 
 * Props:
 *   routes   — routes[] array from salibiyyat JSON
 *   tr       — i18n object (SAL_T)
 *   lang     — current language key ('tr'|'en'|'ar')
 */
export default function SalibiyyatRoutes({ routes = [], tr = {}, lang = 'tr' }) {
  const [selected, setSelected] = useState(null);
  const miniMapRef = useRef(null);
  const miniMapInstance = useRef(null);

  // Roman numeral helper
  const toRoman = (n) => {
    const m = [[8,'VIII'],[7,'VII'],[6,'VI'],[5,'V'],[4,'IV'],[3,'III'],[2,'II'],[1,'I']];
    for (const [val, rom] of m) { if (n >= val) return rom; }
    return String(n);
  };

  // Mini map effect
  useEffect(() => {
    if (!selected || !miniMapRef.current) return;
    if (miniMapInstance.current) { miniMapInstance.current.remove(); miniMapInstance.current = null; }

    const map = L.map(miniMapRef.current, { zoomControl: false, attributionControl: false })
      .setView([38, 28], 4);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18, subdomains: 'abcd'
    }).addTo(map);

    const r = selected;
    const coords = (r.waypoints || r.wp || []).map(w => [w.lat || w.a, w.lon || w.o]);
    if (coords.length < 2) return;

    L.polyline(coords, {
      color: r.color || r.col, weight: r.type === 'land' || r.tp === 'land' ? 4 : 3,
      opacity: 0.8, dashArray: (r.type || r.tp) === 'sea' ? '10,8' : null,
    }).addTo(map);

    const wps = r.waypoints || r.wp || [];
    wps.forEach((w, i) => {
      const lat = w.lat || w.a;
      const lon = w.lon || w.o;
      const name = w.name || w.n;
      const m = L.circleMarker([lat, lon], {
        radius: i === 0 || i === wps.length - 1 ? 6 : 4,
        fillColor: r.color || r.col, color: '#fff', weight: 1.5, fillOpacity: 0.9,
      });
      m.bindTooltip(`${i + 1}. ${name}`, {
        permanent: i === 0 || i === wps.length - 1, direction: 'top', offset: [0, -8]
      });
      m.addTo(map);
    });

    const bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [30, 30] });
    miniMapInstance.current = map;

    return () => { if (miniMapInstance.current) { miniMapInstance.current.remove(); miniMapInstance.current = null; } };
  }, [selected]);

  // Field accessors (support both standalone short & atlas full fields)
  const getField = (r, full, short) => r[full] !== undefined ? r[full] : r[short];

  return (
    <div className="sal-subtab-container">
      {/* Header */}
      <div className="sal-subtab-header sal-fade-in">
        <h2 className="sal-subtab-title">{tr.routes_page?.title || 'Sefer Güzergâhları'}</h2>
        <p className="sal-subtab-title-ar">{tr.routes_page?.subtitle_ar || 'مسارات الحملات الصليبية'}</p>
        <p className="sal-subtab-desc">{tr.routes_page?.subtitle || 'I.–VIII. Haçlı Seferleri boyunca 11 farklı güzergâh.'}</p>
        <div className="sal-gold-line" style={{ width: 80 }} />
      </div>

      <div className="sal-routes-grid">
        {/* Routes list */}
        <div className="sal-routes-list">
          {routes.map((r, i) => {
            const color = r.color || r.col;
            const type = r.type || r.tp;
            const crusadeNum = r.crusade_number || r.cr;
            const nameTr = r.name_tr || r.nt;
            const nameEn = r.name_en || r.ne;
            const leaders = r.leaders || r.ld;
            const year = r.period || r.yr;
            const wps = r.waypoints || r.wp || [];

            return (
              <div
                key={r.id}
                className={`sal-route-card sal-fade-in ${selected?.id === r.id ? 'sal-route-card--active' : ''}`}
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => setSelected(r)}
              >
                <div className="sal-route-card__accent" style={{ background: color }} />
                <div className="sal-route-card__body">
                  <div className="sal-route-card__header">
                    <span className="sal-route-card__icon">{type === 'land' ? '🛤' : '⚓'}</span>
                    <div>
                      <h3 className="sal-route-card__name">
                        {toRoman(crusadeNum)}. {tr.common?.crusade || 'Haçlı Seferi'} — {type === 'land'
                          ? (tr.routes_page?.land_route || 'Kara Yolu')
                          : (tr.routes_page?.sea_route || 'Deniz Yolu')}
                      </h3>
                      <p className="sal-route-card__subname">{lang === 'en' ? nameEn : nameTr}</p>
                    </div>
                  </div>
                  <div className="sal-route-card__tags">
                    <span className="sal-tag" style={{ borderColor: color, color }}>{year}</span>
                    <span className="sal-tag">{wps.length} {tr.routes_page?.stops || 'durak'}</span>
                    <span className="sal-tag">{type === 'land' ? 'Kara' : 'Deniz'}</span>
                  </div>
                  <p className="sal-route-card__leaders">{leaders}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail / Mini map */}
        <div className="sal-routes-detail">
          {selected ? (
            <div className="sal-glass-card sal-fade-in" key={selected.id}>
              <div ref={miniMapRef} className="sal-routes-minimap" />
              <div className="sal-routes-detail__info">
                <h3 className="sal-routes-detail__title">
                  {lang === 'en' ? (selected.name_en || selected.ne) : (selected.name_tr || selected.nt)}
                </h3>
                <p className="sal-routes-detail__desc">
                  {lang === 'en' ? (selected.name_en || selected.ne) : (selected.name_tr || selected.nt)}
                </p>
                <div className="sal-route-card__tags">
                  <span className="sal-tag" style={{ borderColor: selected.color || selected.col, color: selected.color || selected.col }}>
                    {selected.period || selected.yr}
                  </span>
                  <span className="sal-tag">
                    {(selected.type || selected.tp) === 'land' ? 'Kara yolu' : 'Deniz yolu'}
                  </span>
                </div>

                <h4 className="sal-routes-detail__section-title">{tr.routes_page?.leaders || 'Liderler'}</h4>
                <p className="sal-routes-detail__text">{selected.leaders || selected.ld}</p>

                <h4 className="sal-routes-detail__section-title">
                  {tr.routes_page?.stops || 'Duraklar'} ({(selected.waypoints || selected.wp || []).length})
                </h4>
                <div className="sal-routes-detail__stops">
                  {(selected.waypoints || selected.wp || []).map((w, i) => (
                    <div key={i} className="sal-routes-detail__stop">
                      <span className="sal-routes-detail__stop-num">{i + 1}</span>
                      <div className="sal-routes-detail__stop-dot" style={{ background: selected.color || selected.col }} />
                      <span className="sal-routes-detail__stop-name">{w.name || w.n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="sal-glass-card sal-routes-empty">
              <div className="sal-routes-empty__icon">🗺</div>
              <p>{tr.routes_page?.select_route || 'Bir güzergâh seçin'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
