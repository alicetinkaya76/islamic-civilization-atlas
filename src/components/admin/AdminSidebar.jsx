/**
 * AdminSidebar — Sol menü navigasyonu
 * v5.3.1.0
 */
import { SCHEMAS, COLLECTION_ORDER, AUX_MODULES } from './schemas/entitySchemas';
import { useAdmin } from './AdminContext';

export default function AdminSidebar({ activeRoute, onNavigate, collapsed, onToggle }) {
  const { db, changeLog } = useAdmin();

  return (
    <aside className={`admin-sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="admin-sidebar-header">
        {!collapsed && <span className="admin-sidebar-brand">Admin</span>}
        <button className="admin-sidebar-toggle" onClick={onToggle} title={collapsed ? 'Genişlet' : 'Daralt'}>
          {collapsed ? '»' : '«'}
        </button>
      </div>

      <nav className="admin-sidebar-nav">
        {/* Dashboard */}
        <button
          className={`admin-nav-item${activeRoute === 'home' ? ' active' : ''}`}
          onClick={() => onNavigate('home')}
          title="Genel Bakış"
        >
          <span className="admin-nav-icon">🏠</span>
          {!collapsed && <span className="admin-nav-label">Genel Bakış</span>}
        </button>

        {/* db.json collections */}
        {!collapsed && <div className="admin-nav-section">Veri Koleksiyonları</div>}
        {COLLECTION_ORDER.map(key => {
          const schema = SCHEMAS[key];
          if (!schema) return null;
          const count = db[key]?.length || 0;
          return (
            <button
              key={key}
              className={`admin-nav-item${activeRoute === `entity/${key}` ? ' active' : ''}`}
              onClick={() => onNavigate(`entity/${key}`)}
              title={`${schema.label.tr} (${count})`}
            >
              <span className="admin-nav-icon">{schema.icon}</span>
              {!collapsed && (
                <>
                  <span className="admin-nav-label">{schema.label.tr}</span>
                  <span className="admin-nav-badge">{count}</span>
                </>
              )}
            </button>
          );
        })}

        {/* Auxiliary modules */}
        {!collapsed && <div className="admin-nav-section">Yardımcı Veriler</div>}
        {AUX_MODULES.map(mod => (
          <button
            key={mod.key}
            className={`admin-nav-item${activeRoute === `aux/${mod.key}` ? ' active' : ''}`}
            onClick={() => onNavigate(`aux/${mod.key}`)}
            title={mod.label.tr}
          >
            <span className="admin-nav-icon">{mod.icon}</span>
            {!collapsed && <span className="admin-nav-label">{mod.label.tr}</span>}
          </button>
        ))}

        {/* Tools */}
        {!collapsed && <div className="admin-nav-section">Araçlar</div>}
        <button
          className={`admin-nav-item${activeRoute === 'export' ? ' active' : ''}`}
          onClick={() => onNavigate('export')}
          title="Dışa Aktar"
        >
          <span className="admin-nav-icon">📦</span>
          {!collapsed && <span className="admin-nav-label">Dışa Aktar</span>}
        </button>
        <button
          className={`admin-nav-item${activeRoute === 'changelog' ? ' active' : ''}`}
          onClick={() => onNavigate('changelog')}
          title="Değişiklikler"
        >
          <span className="admin-nav-icon">📋</span>
          {!collapsed && (
            <>
              <span className="admin-nav-label">Değişiklikler</span>
              {changeLog.length > 0 && <span className="admin-nav-badge warn">{changeLog.length}</span>}
            </>
          )}
        </button>
        <button
          className={`admin-nav-item${activeRoute === 'import' ? ' active' : ''}`}
          onClick={() => onNavigate('import')}
          title="İçe Aktar"
        >
          <span className="admin-nav-icon">📥</span>
          {!collapsed && <span className="admin-nav-label">İçe Aktar</span>}
        </button>
        <button
          className={`admin-nav-item${activeRoute === 'search-replace' ? ' active' : ''}`}
          onClick={() => onNavigate('search-replace')}
          title="Bul & Değiştir"
        >
          <span className="admin-nav-icon">🔍</span>
          {!collapsed && <span className="admin-nav-label">Bul & Değiştir</span>}
        </button>
        <button
          className={`admin-nav-item${activeRoute === 'validate' ? ' active' : ''}`}
          onClick={() => onNavigate('validate')}
          title="Doğrulama"
        >
          <span className="admin-nav-icon">✅</span>
          {!collapsed && <span className="admin-nav-label">Doğrulama</span>}
        </button>
        <button
          className={`admin-nav-item${activeRoute === 'causal-editor' ? ' active' : ''}`}
          onClick={() => onNavigate('causal-editor')}
          title="Nedensellik Editörü"
        >
          <span className="admin-nav-icon">🔀</span>
          {!collapsed && <span className="admin-nav-label">Nedensellik Editörü</span>}
        </button>
        <button
          className={`admin-nav-item${activeRoute === 'settings' ? ' active' : ''}`}
          onClick={() => onNavigate('settings')}
          title="Ayarlar"
        >
          <span className="admin-nav-icon">⚙</span>
          {!collapsed && <span className="admin-nav-label">Ayarlar</span>}
        </button>
      </nav>
    </aside>
  );
}
