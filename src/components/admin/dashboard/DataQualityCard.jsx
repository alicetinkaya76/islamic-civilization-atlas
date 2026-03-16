/**
 * DataQualityCard — Veri kalitesi skoru (0-100%)
 * v5.4.0.0
 */
import { useMemo } from 'react';
import { useAdmin } from '../AdminContext';
import { SCHEMAS, COLLECTION_ORDER } from '../schemas/entitySchemas';

export default function DataQualityCard() {
  const { db } = useAdmin();

  const metrics = useMemo(() => {
    let totalEntities = 0;
    let withCoords = 0;
    let totalEnFields = 0;
    let filledEnFields = 0;
    let totalRequired = 0;
    let filledRequired = 0;

    for (const col of COLLECTION_ORDER) {
      const items = db[col];
      if (!Array.isArray(items)) continue;
      const schema = SCHEMAS[col];
      if (!schema) continue;

      items.forEach(item => {
        totalEntities++;
        if (item.lat != null && item.lon != null && item.lat !== 0 && item.lon !== 0) withCoords++;

        schema.fields?.forEach(f => {
          if (f.key === 'en') {
            totalEnFields++;
            if (item.en) filledEnFields++;
          }
          if (f.required) {
            totalRequired++;
            const v = item[f.key];
            if (v != null && v !== '' && v !== 0) filledRequired++;
          }
        });
      });
    }

    const coordRate = totalEntities > 0 ? withCoords / totalEntities : 0;
    const transRate = totalEnFields > 0 ? filledEnFields / totalEnFields : 0;
    const reqRate = totalRequired > 0 ? filledRequired / totalRequired : 0;
    const overall = Math.round((coordRate * 0.3 + transRate * 0.3 + reqRate * 0.4) * 100);

    return {
      coordRate: Math.round(coordRate * 100),
      transRate: Math.round(transRate * 100),
      reqRate: Math.round(reqRate * 100),
      overall,
      totalEntities,
      withCoords,
    };
  }, [db]);

  const getColor = (pct) => {
    if (pct >= 80) return 'var(--admin-accent)';
    if (pct >= 60) return 'var(--admin-warn)';
    return 'var(--admin-danger)';
  };

  return (
    <div className="admin-dq-card">
      <div className="admin-dq-header">
        <span className="admin-dq-title">📊 Veri Kalitesi</span>
        <span className="admin-dq-score" style={{ color: getColor(metrics.overall) }}>
          %{metrics.overall}
        </span>
      </div>
      <div className="admin-dq-bars">
        <QualityBar label="Koordinat Doluluk" value={metrics.coordRate} color={getColor(metrics.coordRate)} />
        <QualityBar label="EN Çeviri Doluluk" value={metrics.transRate} color={getColor(metrics.transRate)} />
        <QualityBar label="Zorunlu Alan Doluluk" value={metrics.reqRate} color={getColor(metrics.reqRate)} />
      </div>
      <div className="admin-dq-footer">
        Toplam {metrics.totalEntities} entity, {metrics.withCoords} koordinatlı
      </div>
    </div>
  );
}

function QualityBar({ label, value, color }) {
  return (
    <div className="admin-dq-bar-wrap">
      <div className="admin-dq-bar-header">
        <span className="admin-dq-bar-label">{label}</span>
        <span className="admin-dq-bar-pct" style={{ color }}>%{value}</span>
      </div>
      <div className="admin-dq-bar-track">
        <div className="admin-dq-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}
