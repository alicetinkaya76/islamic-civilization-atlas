/**
 * TranslationCoverage — i18n kapsam analizi
 * v5.4.0.0
 */
import { useMemo } from 'react';
import { useAdmin } from '../AdminContext';
import { SCHEMAS, COLLECTION_ORDER } from '../schemas/entitySchemas';

export default function TranslationCoverage() {
  const { db, i18n } = useAdmin();

  /* i18n.js key coverage */
  const i18nStats = useMemo(() => {
    let totalKeys = 0;
    let trFilled = 0, enFilled = 0, arFilled = 0;

    const walk = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      for (const [k, v] of Object.entries(obj)) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          if ('tr' in v || 'en' in v || 'ar' in v) {
            totalKeys++;
            if (v.tr) trFilled++;
            if (v.en) enFilled++;
            if (v.ar) arFilled++;
          } else {
            walk(v);
          }
        }
      }
    };
    walk(i18n);

    return {
      totalKeys,
      tr: totalKeys > 0 ? Math.round((trFilled / totalKeys) * 100) : 0,
      en: totalKeys > 0 ? Math.round((enFilled / totalKeys) * 100) : 0,
      ar: totalKeys > 0 ? Math.round((arFilled / totalKeys) * 100) : 0,
    };
  }, [i18n]);

  /* Collection _ar field coverage */
  const colArStats = useMemo(() => {
    const results = [];
    for (const col of COLLECTION_ORDER) {
      const items = db[col];
      if (!Array.isArray(items) || items.length === 0) continue;
      const schema = SCHEMAS[col];
      if (!schema) continue;

      const arFields = schema.fields?.filter(f => f.key === 'ar' || f.key.endsWith('_ar') || f.rtl) || [];
      if (arFields.length === 0) continue;

      let total = 0, filled = 0;
      items.forEach(item => {
        arFields.forEach(f => {
          total++;
          if (item[f.key]) filled++;
        });
      });

      results.push({
        col,
        label: schema.label?.tr || col,
        icon: schema.icon,
        total,
        filled,
        pct: total > 0 ? Math.round((filled / total) * 100) : 0,
      });
    }
    return results;
  }, [db]);

  return (
    <div className="admin-dq-card">
      <div className="admin-dq-header">
        <span className="admin-dq-title">🌐 Çeviri Kapsamı</span>
      </div>

      {/* i18n.js stats */}
      <div className="admin-tc-section">
        <div className="admin-tc-section-title">UI Metinleri (i18n.js) — {i18nStats.totalKeys} key</div>
        <div className="admin-tc-lang-bars">
          <LangBar lang="TR" pct={i18nStats.tr} />
          <LangBar lang="EN" pct={i18nStats.en} />
          <LangBar lang="AR" pct={i18nStats.ar} />
        </div>
      </div>

      {/* Collection AR coverage */}
      <div className="admin-tc-section">
        <div className="admin-tc-section-title">Koleksiyon AR Alan Doluluk</div>
        <div className="admin-tc-col-list">
          {colArStats.map(s => (
            <div key={s.col} className="admin-tc-col-row">
              <span className="admin-tc-col-name">{s.icon} {s.label}</span>
              <div className="admin-tc-col-bar-wrap">
                <div className="admin-tc-col-bar-track">
                  <div
                    className="admin-tc-col-bar-fill"
                    style={{
                      width: `${s.pct}%`,
                      background: s.pct >= 80 ? 'var(--admin-accent)' : s.pct >= 40 ? 'var(--admin-warn)' : 'var(--admin-danger)',
                    }}
                  />
                </div>
                <span className="admin-tc-col-pct">%{s.pct}</span>
              </div>
              <span className="admin-tc-col-count">{s.filled}/{s.total}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LangBar({ lang, pct }) {
  const color = pct >= 90 ? 'var(--admin-accent)' : pct >= 60 ? 'var(--admin-warn)' : 'var(--admin-danger)';
  return (
    <div className="admin-tc-lang-row">
      <span className="admin-tc-lang-label">{lang}</span>
      <div className="admin-dq-bar-track" style={{ flex: 1 }}>
        <div className="admin-dq-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="admin-tc-lang-pct" style={{ color }}>%{pct}</span>
    </div>
  );
}
