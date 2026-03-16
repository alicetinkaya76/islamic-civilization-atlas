/**
 * CollectionSummary — Koleksiyon kayıt sayısı bar chart
 * v5.4.0.0
 */
import { useMemo } from 'react';
import { useAdmin } from '../AdminContext';
import { SCHEMAS, COLLECTION_ORDER } from '../schemas/entitySchemas';

export default function CollectionSummary({ onNavigate }) {
  const { db } = useAdmin();

  const data = useMemo(() => {
    const result = [];
    let max = 0;
    for (const col of COLLECTION_ORDER) {
      const items = db[col];
      const count = Array.isArray(items) ? items.length : 0;
      const schema = SCHEMAS[col];
      if (!schema) continue;
      if (count > max) max = count;
      result.push({ col, count, label: schema.label?.tr || col, icon: schema.icon });
    }
    return { items: result, max };
  }, [db]);

  return (
    <div className="admin-dq-card">
      <div className="admin-dq-header">
        <span className="admin-dq-title">📁 Koleksiyonlar</span>
      </div>
      <div className="admin-cs-list">
        {data.items.map(d => {
          const pct = data.max > 0 ? (d.count / data.max) * 100 : 0;
          return (
            <div key={d.col} className="admin-cs-row" onClick={() => onNavigate?.(`entity/${d.col}`)}
              style={{ cursor: 'pointer' }}>
              <span className="admin-cs-icon">{d.icon}</span>
              <span className="admin-cs-label">{d.label}</span>
              <div className="admin-cs-bar-wrap">
                <div className="admin-cs-bar" style={{ width: `${Math.max(pct, 2)}%` }} />
              </div>
              <span className="admin-cs-count">{d.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
