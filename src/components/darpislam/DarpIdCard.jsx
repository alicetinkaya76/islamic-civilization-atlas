import { useState, useMemo } from 'react';

const METAL_INFO = {
  AU: { tr: 'Altın/Dinar', en: 'Gold/Dinar', icon: '🥇', color: '#FFD700' },
  AR: { tr: 'Gümüş/Dirhem', en: 'Silver/Dirham', icon: '🥈', color: '#C0C0C0' },
  AE: { tr: 'Bakır/Fels', en: 'Copper/Fals', icon: '🥉', color: '#B87333' },
  EL: { tr: 'Elektron', en: 'Electrum', icon: '⚡', color: '#CFB53B' },
  Pb: { tr: 'Kurşun', en: 'Lead', icon: '⚫', color: '#7F7F7F' },
  GL: { tr: 'Cam', en: 'Glass', icon: '💎', color: '#87CEEB' },
};

export default function DarpIdCard({ mint, detail, loading, lang, onClose, isMobile }) {
  const [activeTab, setActiveTab] = useState('info');
  const t = (tr, en) => lang === 'tr' ? tr : en;

  const name = lang === 'tr' ? mint.name_tr : mint.name_en;
  const region = lang === 'tr' ? mint.region_tr : mint.region_en;

  // Group emissions by dynasty
  const emissionsByDynasty = useMemo(() => {
    if (!detail?.emissions) return [];
    const groups = {};
    detail.emissions.forEach(em => {
      const key = em.dynasty || t('Bilinmiyor', 'Unknown');
      if (!groups[key]) groups[key] = [];
      groups[key].push(em);
    });
    return Object.entries(groups).sort((a, b) => {
      const aMin = Math.min(...a[1].map(e => e.year_ah || 999));
      const bMin = Math.min(...b[1].map(e => e.year_ah || 999));
      return aMin - bMin;
    });
  }, [detail, lang]);

  // Emission timeline data
  const timelineData = useMemo(() => {
    if (!detail?.emissions) return [];
    return detail.emissions
      .filter(e => e.year_ah)
      .sort((a, b) => a.year_ah - b.year_ah);
  }, [detail]);

  const tabs = [
    { id: 'info', label: t('Bilgi', 'Info'), icon: 'ℹ️' },
    { id: 'emissions', label: t('Darbiyat', 'Emissions'), icon: '🪙', count: detail?.emissions?.length },
    { id: 'dynasties', label: t('Hanedanlar', 'Dynasties'), icon: '👑', count: detail?.dynasty_meta?.length },
    { id: 'sources', label: t('Kaynaklar', 'Sources'), icon: '📚' },
  ];

  return (
    <div className={`darp-idcard ${isMobile ? 'darp-idcard-mobile' : ''}`}>
      {/* Header */}
      <div className="darp-idcard-header">
        <div className="darp-idcard-title-row">
          <h3 className="darp-idcard-name">{name}</h3>
          <button className="darp-idcard-close" onClick={onClose}>✕</button>
        </div>
        {mint.name_ar && (
          <div className="darp-idcard-arabic">{mint.name_ar}</div>
        )}
        <div className="darp-idcard-subtitle">
          {region && <span className="darp-idcard-region">📍 {region}</span>}
          {mint.emission_count > 0 && (
            <span className="darp-idcard-emissions">🪙 {mint.emission_count} {t('darbiyat', 'emissions')}</span>
          )}
        </div>

        {/* Quick stats row */}
        <div className="darp-idcard-quick">
          {(mint.year_min || mint.year_max) && (
            <div className="darp-quick-item">
              <span className="darp-quick-label">{t('Dönem', 'Period')}</span>
              <span className="darp-quick-value">
                H. {mint.year_min || '?'}–{mint.year_max || '?'}
                {mint.year_min_ce && <small> ({mint.year_min_ce}–{mint.year_max_ce})</small>}
              </span>
            </div>
          )}
          {mint.metals?.length > 0 && (
            <div className="darp-quick-item">
              <span className="darp-quick-label">{t('Metaller', 'Metals')}</span>
              <span className="darp-quick-value darp-metals-row">
                {mint.metals.map(m => (
                  <span key={m} className="darp-metal-tag" style={{ borderColor: METAL_INFO[m]?.color }}>
                    {METAL_INFO[m]?.icon} {METAL_INFO[m]?.[lang] || m}
                  </span>
                ))}
              </span>
            </div>
          )}
          {mint.dynasty_count > 0 && (
            <div className="darp-quick-item">
              <span className="darp-quick-label">{t('Hanedanlar', 'Dynasties')}</span>
              <span className="darp-quick-value">{mint.dynasty_count}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="darp-idcard-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`darp-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
            {tab.count > 0 && <span className="darp-tab-count">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="darp-idcard-body">
        {loading ? (
          <div className="darp-loading">{t('Yükleniyor…', 'Loading…')}</div>
        ) : (
          <>
            {activeTab === 'info' && (
              <div className="darp-tab-content">
                {/* Yakut description */}
                {(detail?.yakut_tr || detail?.yakut_en) && (
                  <div className="darp-section">
                    <h4>📖 {t('Yâkût el-Hamevî', 'Yāqūt al-Ḥamawī')}</h4>
                    <p className="darp-yakut-text">
                      {lang === 'tr' ? detail.yakut_tr : detail.yakut_en}
                    </p>
                  </div>
                )}

                {/* City info */}
                {(detail?.city_narr_tr || detail?.city_narr_en) && (
                  <div className="darp-section">
                    <h4>🏛️ {t('Şehir Bilgisi', 'City Info')}</h4>
                    <p>{lang === 'tr' ? detail.city_narr_tr : detail.city_narr_en}</p>
                    {(detail?.city_role_tr || detail?.city_role_en) && (
                      <p className="darp-city-role">
                        <strong>{t('Rol:', 'Role:')}</strong> {lang === 'tr' ? detail.city_role_tr : detail.city_role_en}
                      </p>
                    )}
                  </div>
                )}

                {/* Nearby battles */}
                {detail?.battles?.length > 0 && (
                  <div className="darp-section">
                    <h4>⚔️ {t('Yakın Savaşlar', 'Nearby Battles')} ({detail.battles.length})</h4>
                    <div className="darp-battles-list">
                      {detail.battles.map((b, i) => (
                        <div key={i} className="darp-battle-item">
                          <span className="darp-battle-name">
                            {lang === 'tr' ? b.name_tr : b.name_en}
                          </span>
                          <span className="darp-battle-meta">
                            {b.year_ce} CE · {b.distance_km.toFixed(0)} km
                            {b.significance === 'Yüksek' && ' ⭐'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coordinates & confidence */}
                <div className="darp-section darp-meta-section">
                  <div className="darp-meta-row">
                    <span>{t('Koordinat', 'Coordinates')}</span>
                    <span>{mint.lat?.toFixed(4)}, {mint.lng?.toFixed(4)}</span>
                  </div>
                  {mint.confidence && (
                    <div className="darp-meta-row">
                      <span>{t('Güvenilirlik', 'Confidence')}</span>
                      <span className={`darp-confidence darp-conf-${mint.confidence}`}>
                        {mint.confidence}
                      </span>
                    </div>
                  )}
                  {detail?.ruler_coverage > 0 && (
                    <div className="darp-meta-row">
                      <span>{t('Hükümdar Kapsama', 'Ruler Coverage')}</span>
                      <span>{(detail.ruler_coverage * 100).toFixed(0)}%</span>
                    </div>
                  )}
                  {mint.quality > 0 && (
                    <div className="darp-meta-row">
                      <span>{t('Kalite Skoru', 'Quality Score')}</span>
                      <span>{mint.quality.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'emissions' && (
              <div className="darp-tab-content">
                {!detail?.emissions?.length ? (
                  <p className="darp-empty">{t('Kayıtlı darbiyat yok', 'No recorded emissions')}</p>
                ) : (
                  <>
                    {/* Mini timeline bar */}
                    {timelineData.length > 0 && (
                      <div className="darp-timeline-bar">
                        <div className="darp-timeline-label">
                          H. {timelineData[0].year_ah} → {timelineData[timelineData.length - 1].year_ah}
                        </div>
                        <div className="darp-timeline-track">
                          {timelineData.map((em, i) => {
                            const minY = timelineData[0].year_ah;
                            const maxY = timelineData[timelineData.length - 1].year_ah;
                            const range = maxY - minY || 1;
                            const left = ((em.year_ah - minY) / range) * 100;
                            return (
                              <div
                                key={i}
                                className="darp-timeline-dot"
                                style={{
                                  left: `${left}%`,
                                  background: METAL_INFO[em.metal]?.color || '#888',
                                }}
                                title={`H. ${em.year_ah} - ${em.metal} - ${em.dynasty || ''}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Emissions by dynasty */}
                    {emissionsByDynasty.map(([dynasty, emissions]) => (
                      <div key={dynasty} className="darp-emission-group">
                        <h5 className="darp-emission-dynasty">
                          👑 {dynasty} <span>({emissions.length})</span>
                        </h5>
                        <div className="darp-emission-list">
                          {emissions.map((em, i) => (
                            <div key={i} className="darp-emission-item">
                              <div className="darp-em-year">
                                {em.year_ah ? `H. ${em.year_ah}` : '?'}
                                {em.year_ce && <small> ({em.year_ce})</small>}
                              </div>
                              <div className="darp-em-metal">
                                <span
                                  className="darp-em-metal-dot"
                                  style={{ background: METAL_INFO[em.metal]?.color || '#888' }}
                                />
                                {METAL_INFO[em.metal]?.[lang] || em.metal_name || em.metal}
                              </div>
                              {em.ruler && (
                                <div className="darp-em-ruler">
                                  {em.ruler_ar && <span className="darp-em-ruler-ar">{em.ruler_ar}</span>}
                                  <span className="darp-em-ruler-name">{em.ruler}</span>
                                  {em.ruler_title && <span className="darp-em-ruler-title">{em.ruler_title}</span>}
                                  {em.ruler_reign && <span className="darp-em-reign">({em.ruler_reign})</span>}
                                </div>
                              )}
                              {em.reference && (
                                <div className="darp-em-ref">{em.reference}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {activeTab === 'dynasties' && (
              <div className="darp-tab-content">
                {!detail?.dynasty_meta?.length ? (
                  <p className="darp-empty">{t('Hanedan bilgisi yok', 'No dynasty info')}</p>
                ) : (
                  <div className="darp-dynasty-list">
                    {detail.dynasty_meta.map((d, i) => (
                      <div key={i} className="darp-dynasty-card">
                        <h5>{lang === 'tr' ? d.name_tr : d.name}</h5>
                        <div className="darp-dynasty-details">
                          {d.capital && (
                            <div className="darp-dyn-row">
                              <span>🏰</span> {d.capital}
                            </div>
                          )}
                          {(d.start_ce || d.end_ce) && (
                            <div className="darp-dyn-row">
                              <span>📅</span> {d.start_ce}–{d.end_ce} CE
                            </div>
                          )}
                          {d.zone && (
                            <div className="darp-dyn-row">
                              <span>🌍</span> {d.zone}
                            </div>
                          )}
                          {d.ethnicity && (
                            <div className="darp-dyn-row">
                              <span>🏷️</span> {d.ethnicity}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sources' && (
              <div className="darp-tab-content">
                {detail?.diler_refs?.length > 0 && (
                  <div className="darp-section">
                    <h4>📖 Diler Referansları</h4>
                    <ul className="darp-ref-list">
                      {detail.diler_refs.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
                {detail?.nomisma_uri && (
                  <div className="darp-section">
                    <h4>🔗 Nomisma.org</h4>
                    <a href={detail.nomisma_uri} target="_blank" rel="noopener" className="darp-ext-link">
                      {detail.nomisma_uri}
                    </a>
                  </div>
                )}
                {detail?.ei1_ref && (
                  <div className="darp-section">
                    <h4>📚 Encyclopaedia of Islam</h4>
                    <p>{detail.ei1_ref}</p>
                  </div>
                )}
                {mint.sources?.length > 0 && (
                  <div className="darp-section">
                    <h4>{t('Veri Kaynakları', 'Data Sources')}</h4>
                    <div className="darp-source-tags">
                      {mint.sources.map(s => (
                        <span key={s} className="darp-source-tag">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
