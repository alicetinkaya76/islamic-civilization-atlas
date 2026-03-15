/**
 * AdminHeader — Üst bar: geri, export, logout
 * v5.2.0.0
 */
import { useAdmin } from './AdminContext';

export default function AdminHeader({ onBack, onNavigate }) {
  const { user, logout, isDirty, changeLog } = useAdmin();

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <button className="admin-btn admin-btn-ghost" onClick={onBack} title="Atlasa Dön">
          ← Atlas
        </button>
        <span className="admin-header-title">Admin Panel</span>
        {isDirty && (
          <span className="admin-header-dirty" title={`${changeLog.length} değişiklik`}>
            ● {changeLog.length} değişiklik
          </span>
        )}
      </div>
      <div className="admin-header-right">
        <button className="admin-btn admin-btn-outline" onClick={() => onNavigate('export')}>
          📦 Dışa Aktar
        </button>
        <span className="admin-header-user">
          {user?.role === 'admin' ? '👑' : '✏️'} {user?.username}
        </span>
        <button className="admin-btn admin-btn-ghost" onClick={logout}>
          Çıkış
        </button>
      </div>
    </header>
  );
}
