/**
 * CoordinateHealth — Koordinat sağlık analizi
 * v5.4.0.0
 */
import { useMemo, useState } from 'react';
import { useAdmin } from '../AdminContext';
import { SCHEMAS, COLLECTION_ORDER } from '../schemas/entitySchemas';

export default function CoordinateHealth({ onNavigate }) {
  const { db } = useAdmin();
  const [showList, setShowList] = useState(false);
  const [filter, setFilter] = useState('all'); // all | missing | invalid

  const issues = useMemo(() => {
    const results = [];
    for (const col of COLLECTION_ORDER) {
      const items = db[col];
      if (!Array.isArray(items)) continue;
      const schema = SCHEMAS[col];
      if (!schema) continue;
      const hasLatLon = schema.fields?.some(f => f.key === 'lat');
      if (!hasLatLon) continue;

      items.forEach(item => {
        const lat = item.lat;
        const lon = item.lon;
        const name = item.tr || item.n || item.en || `#${item.id}`;

        if (lat == null || lon == null || (lat === 0 && lon === 0)) {
          results.push({ col, id: item.id, name, icon: schema.icon, type: 'missing', label: schema.label?.tr });
        } else if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
          results.push({ col, id: item.id, name, icon: schema.icon, type: 'invalid', label: schema.label?.tr,
            detail: `lat=${lat}, lon=${lon}` });
        }
      });
    }
    return results;
  }, [db]);

  const missing = issues.filter(i => i.type === 'missing');
  const invalid = issues.filter(i => i.type === 'invalid');
  const filtered = filter === 'all' ? issues : issues.filter(i => i.type === filter);

  return (
    <div className="admin-dq-card">
      <div className="admin-dq-header">
        <span className="admin-dq-title">📍 Koordinat Sağlığı</span>
        <button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => setShowList(p => !p)}>
          {showList ? 'Gizle' : 'Detay'}
        </button>
      </div>

      <div className="admin-ch-stats">
        <div className="admin-ch-stat" onClick={() => { setFilter('missing'); setShowList(true); }} style={{ cursor: 'pointer' }}>
          <span className="admin-ch-stat-val" style={{ color: missing.length > 0 ? 'var(--admin-warn)' : 'var(--admin-accent)' }}>
            {missing.length}
          </span>
          <span className="admin-ch-stat-label">Eksik</span>
        </div>
        <div className="admin-ch-stat" onClick={() => { setFilter('invalid'); setShowList(true); }} style={{ cursor: 'pointer' }}>
          <span className="admin-ch-stat-val" style={{ color: invalid.length > 0 ? 'var(--admin-danger)' : 'var(--admin-accent)' }}>
            {invalid.length}
          </span>
          <span className="admin-ch-stat-label">Geçersiz</span>
        </div>
      </div>

      {showList && (
        <div className="admin-ch-list-wrap">
          <div className="admin-ch-filter-row">
            {['all', 'missing', 'invalid'].map(f => (
              <button key={f} className={`admin-btn admin-btn-sm${filter === f ? ' admin-btn-primary' : ''}`}
                onClick={() => setFilter(f)}>
                {f === 'all' ? `Tümü (${issues.length})` : f === 'missing' ? `Eksik (${missing.length})` : `Geçersiz (${invalid.length})`}
              </button>
            ))}
          </div>
          <div className="admin-ch-list">
            {filtered.slice(0, 50).map((item, i) => (
              <div key={`${item.col}-${item.id}-${i}`} className="admin-ch-item"
                onClick={() => onNavigate?.(`entity/${item.col}`)}>
                <span className="admin-ch-item-icon">{item.icon}</span>
                <span className="admin-ch-item-name">{item.name}</span>
                <span className="admin-ch-item-col">{item.label}</span>
                <span className={`admin-ch-item-badge ${item.type}`}>
                  {item.type === 'missing' ? 'eksik' : item.detail}
                </span>
              </div>
            ))}
            {filtered.length > 50 && (
              <div className="admin-ch-more">...ve {filtered.length - 50} daha</div>
            )}
            {filtered.length === 0 && (
              <div className="admin-ch-empty">Sorun bulunamadı ✓</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
