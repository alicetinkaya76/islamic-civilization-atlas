/**
 * RecentActivity — Son değişiklikler zaman çizelgesi
 * v5.4.0.0
 */
import { useAdmin } from '../AdminContext';

const TYPE_STYLE = {
  update: { bg: '#1a2a1a', color: 'var(--admin-accent)', icon: '✏️' },
  add:    { bg: '#1a1a2a', color: 'var(--admin-info)',    icon: '➕' },
  delete: { bg: '#2a1a1a', color: 'var(--admin-danger)',  icon: '🗑' },
  import: { bg: '#2a2a1a', color: 'var(--admin-warn)',    icon: '📥' },
  replace:{ bg: '#1a2a2a', color: '#22d3ee',              icon: '🔄' },
};

export default function RecentActivity() {
  const { changeLog } = useAdmin();

  const recent = changeLog.slice(-20).reverse();

  const formatTime = (ts) => {
    const d = new Date(ts);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    const s = d.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  if (recent.length === 0) {
    return (
      <div className="admin-dq-card">
        <div className="admin-dq-header">
          <span className="admin-dq-title">🕐 Son Değişiklikler</span>
        </div>
        <div className="admin-ra-empty">Bu oturumda henüz değişiklik yok.</div>
      </div>
    );
  }

  return (
    <div className="admin-dq-card">
      <div className="admin-dq-header">
        <span className="admin-dq-title">🕐 Son Değişiklikler</span>
        <span className="admin-dq-badge">{changeLog.length}</span>
      </div>
      <div className="admin-ra-list">
        {recent.map((c, i) => {
          const style = TYPE_STYLE[c.type] || TYPE_STYLE.update;
          return (
            <div key={i} className="admin-ra-item">
              <div className="admin-ra-timeline">
                <div className="admin-ra-dot" style={{ background: style.color }} />
                {i < recent.length - 1 && <div className="admin-ra-line" />}
              </div>
              <div className="admin-ra-content">
                <div className="admin-ra-row">
                  <span className="admin-ra-badge" style={{ background: style.bg, color: style.color }}>
                    {style.icon} {c.type}
                  </span>
                  <span className="admin-ra-entity">{c.entity}</span>
                  <span className="admin-ra-id">#{c.id}</span>
                  {c.field && c.field !== '*' && <span className="admin-ra-field">.{c.field}</span>}
                  <span className="admin-ra-time">{formatTime(c.ts)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
