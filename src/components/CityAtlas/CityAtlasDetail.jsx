export default function CityAtlasDetail({ record: r, city, lang, getName, getCat, onClose }) {
  // ── Multilingual content helper ──
  const ml = (fieldBase, record) => {
    if (lang === "en") return record[fieldBase + "_en"] || record[fieldBase] || "";
    if (lang === "ar") return record[fieldBase + "_ar"] || record[fieldBase] || "";
    return record[fieldBase] || "";
  };
  const mlNested = (obj, field) => {
    if (!obj) return null;
    if (lang === "en") return obj[field + "_en"] || obj[field];
    if (lang === "ar") return obj[field + "_ar"] || obj[field];
    return obj[field];
  };

  const catCfg = city.categories[r.category] || {};
  const perCfg = city.periods[r.period] || {};
  const t = (tr, en, ar) => (lang === 'en' ? en : lang === 'ar' ? ar : tr);

  const statusMap = {
    mevcut:   { cls: 'ca-status-mevcut',   label: t('Mevcut', 'Extant', 'قائم') },
    yikilmis: { cls: 'ca-status-yikilmis', label: t('Yıkılmış', 'Demolished', 'مهدم') },
    harap:    { cls: 'ca-status-harap',     label: t('Harap', 'Ruined', 'خراب') },
    belirsiz: { cls: 'ca-status-belirsiz',  label: t('Belirsiz', 'Unknown', 'غير محدد') },
  };
  const st = statusMap[r.current_status] || statusMap.belirsiz;

  return (
    <div className="ca-detail">
      {/* ── Header ── */}
      <header className="ca-detail-header" style={{ borderColor: catCfg.color }}>
        <div>
          <span className="ca-detail-icon">{catCfg.icon || '📍'}</span>
          <h2>{getName(r)}</h2>
          {r.name_original && r.name_original !== r.name_tr && (
            <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: 2 }}>{r.name_original}</div>
          )}
          {/* Trilingual names */}
          {lang === 'tr' && r.name_en && (
            <div style={{ fontSize: '0.72rem', opacity: 0.4, marginTop: 1 }}>
              {r.name_en}{r.name_ar ? ` · ${r.name_ar}` : ''}
            </div>
          )}
          {lang === 'en' && r.name_ar && (
            <div style={{ fontSize: '0.72rem', opacity: 0.4, marginTop: 1 }}>
              {r.name_ar}{r.name_tr !== r.name_en ? ` · ${r.name_tr}` : ''}
            </div>
          )}
          <div className="ca-detail-badges">
            <span className="ca-badge" style={{ background: catCfg.color }}>{getCat(r)}</span>
            {r.subcategory && r.subcategory !== r.category && (
              <span className="ca-badge" style={{ background: 'rgba(255,255,255,0.1)' }}>
                {r.subcategory}
              </span>
            )}
            <span className="ca-badge" style={{ background: perCfg.color || '#616161' }}>
              {perCfg[`label_${lang}`] || perCfg.label_en || r.period}
            </span>
            <span className={`ca-badge ${st.cls}`}>{st.label}</span>
          </div>
        </div>
        <button className="ca-close" onClick={onClose}>✕</button>
      </header>

      <div className="ca-detail-body">
        {/* ── Tarih ── */}
        {(r.dates?.founding_hijri || r.dates?.founding_miladi) && (
          <section className="ca-detail-section">
            <h3>{t('Tarih', 'Date', 'التاريخ')}</h3>
            <p>
              {r.dates.founding_hijri != null && `H. ${r.dates.founding_hijri}`}
              {r.dates.founding_hijri != null && r.dates.founding_miladi != null && ' / '}
              {r.dates.founding_miladi != null && `${r.dates.founding_miladi} M.`}
              {r.dates.founding_approximate && ` (${t('tahmini', 'approx.', 'تقريبي')})`}
            </p>
            {r.dates.date_source && (
              <p style={{ fontSize: '0.72rem', opacity: 0.5 }}>
                {t('Kaynak', 'Source', 'المصدر')}: {r.dates.date_source}
              </p>
            )}
            {r.dates.restoration_dates?.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <p style={{ fontSize: '0.72rem', color: '#999' }}>
                  {t('Onarımlar', 'Restorations', 'الترميمات')}:
                </p>
                {r.dates.restoration_dates.map((rd, i) => (
                  <p key={i} style={{ fontSize: '0.72rem', color: '#888', margin: '1px 0' }}>
                    • {rd.hijri && `H.${rd.hijri}`} {rd.miladi && `/ ${rd.miladi}`} {rd.note && `— ${rd.note}`}
                  </p>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Hanedan (Cairo) ── */}
        {r.dynasty && (r.dynasty.tr || r.dynasty.en) && (
          <section className="ca-detail-section">
            <h3>{t('Hanedan', 'Dynasty', 'الدولة')}</h3>
            <p>{lang === 'en' ? r.dynasty.en : r.dynasty.tr || r.dynasty.en}</p>
          </section>
        )}

        {/* ── Bâni / Patron ── */}
        {r.patron?.name && (
          <section className="ca-detail-section">
            <h3>{t('Bâni', 'Patron', 'الباني')}</h3>
            <p>
              <strong>{r.patron.name}</strong>
              {r.patron.title && ` — ${mlNested(r.patron, "title") || r.patron.title}`}
            </p>
            {r.patron.dynasty && (
              <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>{r.patron.dynasty}</p>
            )}
            {r.patron.notes && <p className="ca-notes">{mlNested(r.patron, "notes") || r.patron.notes}</p>}
          </section>
        )}

        {/* ── Konum ── */}
        {(r.location?.description_tr || r.location?.mahalle || r.location?.lat) && (
          <section className="ca-detail-section">
            <h3>{t('Konum', 'Location', 'الموقع')}</h3>
            {r.location.mahalle && (
              <p>
                <strong>{t('Mahalle', 'Quarter', 'محلة')}:</strong> {mlNested(r.location, "mahalle") || r.location.mahalle}
              </p>
            )}
            {r.location.description_tr && <p>{(lang === "en" ? r.location.description_en : lang === "ar" ? r.location.description_ar : null) || r.location.description_tr}</p>}
            {r.location.nearby_landmarks?.length > 0 && (
              <p style={{ fontSize: '0.72rem', color: '#888' }}>
                {t('Yakın', 'Near', 'بالقرب من')}: {r.location.nearby_landmarks.join(', ')}
              </p>
            )}
            {r.location.lat != null && (
              <p style={{ fontSize: '0.65rem', color: '#555' }}>
                📍 {r.location.lat?.toFixed(4)}, {r.location.lng?.toFixed(4)}
                {r.location.geocoding_confidence && ` (${r.location.geocoding_confidence})`}
              </p>
            )}
          </section>
        )}

        {/* ── Mimari ── */}
        {(r.architecture?.materials?.length > 0 ||
          r.architecture?.features?.length > 0 ||
          r.architecture?.roof_type ||
          r.architecture?.plan_type) && (
          <section className="ca-detail-section">
            <h3>{t('Mimari', 'Architecture', 'العمارة')}</h3>
            {r.architecture.plan_type && (
              <p><strong>{t('Plan', 'Plan', 'المخطط')}:</strong> {mlNested(r.architecture, "plan_type") || r.architecture.plan_type}</p>
            )}
            {r.architecture.roof_type && (
              <p><strong>{t('Örtü', 'Roof', 'السقف')}:</strong> {mlNested(r.architecture, "roof_type") || r.architecture.roof_type}</p>
            )}
            {r.architecture.materials?.length > 0 && (
              <p><strong>{t('Malzeme', 'Materials', 'المواد')}:</strong> {(mlNested(r.architecture, "materials") || r.architecture.materials).join(', ')}</p>
            )}
            {r.architecture.features?.length > 0 && (
              <p><strong>{t('Özellikler', 'Features', 'الخصائص')}:</strong> {(mlNested(r.architecture, "features") || r.architecture.features).join(', ')}</p>
            )}
          </section>
        )}

        {/* ── Kitabeler ── */}
        {r.inscriptions?.length > 0 && (
          <section className="ca-detail-section">
            <h3>{t('Kitabeler', 'Inscriptions', 'النقوش')} ({r.inscriptions.length})</h3>
            {r.inscriptions.map((ins, i) => (
              <div key={ins.id || i} className="ca-inscription">
                <p className="ca-inscription-text">{ins.text_ar}</p>
                {ins.material && (
                  <span className="ca-inscription-material">{ins.material}</span>
                )}
                {ins.language && ins.language !== 'ar' && (
                  <span className="ca-inscription-material" style={{ marginLeft: 8 }}>
                    [{ins.language}]
                  </span>
                )}
              </div>
            ))}
          </section>
        )}

        {/* ── Vakfiye ── */}
        {r.vakfiye?.exists && (
          <section className="ca-detail-section">
            <h3>{t('Vakfiye', 'Endowment Deed', 'الوقفية')}</h3>
            {r.vakfiye.date_hijri && <p>H. {r.vakfiye.date_hijri}</p>}
            {r.vakfiye.archive_ref && (
              <p style={{ fontSize: '0.75rem', color: '#999' }}>📁 {r.vakfiye.archive_ref}</p>
            )}
            {r.vakfiye.summary && <p>{mlNested(r.vakfiye, "summary") || r.vakfiye.summary}</p>}
          </section>
        )}

        {/* ── Medfun (gömülü kişiler — türbelerde) ── */}
        {r.medfun?.length > 0 && (
          <section className="ca-detail-section">
            <h3>{t('Medfunlar', 'Buried Persons', 'المدفونون')}</h3>
            {r.medfun.map((m, i) => (
              <p key={i} style={{ fontSize: '0.8rem' }}>
                • {m.name || m}
                {m.death_hijri && ` (ö. H.${m.death_hijri})`}
              </p>
            ))}
          </section>
        )}

        {/* ── Alternatif İsimler ── */}
        {r.alternative_names?.length > 0 && (
          <section className="ca-detail-section">
            <h3>{t('Diğer Adlar', 'Alternative Names', 'الأسماء البديلة')}</h3>
            <p style={{ fontSize: '0.8rem' }}>{r.alternative_names.join(' · ')}</p>
          </section>
        )}

        {/* ── Makrîzî Metni (Cairo) ── */}
        {r.source_excerpt_ar && (
          <section className="ca-detail-section">
            <h3>{t('Kaynak Metin', 'Source Text', 'النص المصدر')}</h3>
            <div className="ca-source-excerpt">
              {r.source_excerpt_ar}
            </div>
            {r.source_line && (
              <p className="ca-source-ref">
                📄 {city.source} · {t('Satır', 'Line', 'السطر')} {r.source_line}
              </p>
            )}
          </section>
        )}

        {/* ── Çapraz Referanslar ── */}
        {r.cross_references?.length > 0 && (
          <section className="ca-detail-section">
            <h3>{t('Kaynaklar', 'References', 'المراجع')}</h3>
            {r.cross_references.map((ref, i) => (
              <p key={i} style={{ fontSize: '0.72rem', color: '#888' }}>
                📖 {ref.source}{ref.author && ` — ${ref.author}`}
              </p>
            ))}
          </section>
        )}

        {/* ── Konyalı Notları (Konya) ── */}
        {r.konyali_notes && (
          <section className="ca-detail-section">
            <h3>{t('Konyalı Notları', 'Konyalı Notes', 'ملاحظات القونوي')}</h3>
            <p className="ca-notes">{ml("konyali_notes", r)}</p>
            {r.konyali_line_range && (
              <p className="ca-source-ref">
                📄 {r.source || 'Konyalı'} · {t('Satır', 'Lines', 'الأسطر')} {r.konyali_line_range[0]}–{r.konyali_line_range[1]}
                {r.konyali_char_count && ` · ${(r.konyali_char_count / 1000).toFixed(1)}K ${t('karakter', 'chars', 'حرف')}`}
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
