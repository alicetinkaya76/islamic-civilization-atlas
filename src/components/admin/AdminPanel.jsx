/**
 * AdminPanel — Ana layout: sidebar + content area + routing
 * v5.3.1.0 — GitHub save + settings
 */
import { useState, useCallback, useMemo } from 'react';
import { AdminProvider, useAdmin } from './AdminContext';
import { ToastProvider } from './shared/AdminToast';
import AdminLogin from './AdminLogin';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import EntityEditor from './editors/EntityEditor';
import I18nEditor from './editors/I18nEditor';
import ToursEditor from './editors/ToursEditor';
import {
  EraInfoEditor, GlossaryEditor, ScholarLinksEditor,
  IsnadChainsEditor, BattleMetaEditor, ScholarMetaEditor, ConstantsEditor
} from './editors/AuxEditors';
import ExportManager, { ChangeLogView } from './editors/ExportManager';
import { BulkImport, SearchReplace, ValidationReport } from './editors/AdminTools';
import CausalEditor from './editors/CausalEditor';
import GitHubSettings from './settings/GitHubSettings';
import { SCHEMAS, COLLECTION_ORDER } from './schemas/entitySchemas';
import '../../styles/admin.css';

/* ═══ Dashboard / Home ═══ */
import DataQualityCard from './dashboard/DataQualityCard';
import TranslationCoverage from './dashboard/TranslationCoverage';
import CoordinateHealth from './dashboard/CoordinateHealth';
import RecentActivity from './dashboard/RecentActivity';
import CollectionSummary from './dashboard/CollectionSummary';

function AdminHome({ onNavigate }) {
  const { db, changeLog, i18n } = useAdmin();

  /* Count total items */
  const totalItems = useMemo(() =>
    COLLECTION_ORDER.reduce((sum, k) => sum + (db[k]?.length || 0), 0),
  [db]);

  /* Count missing AR translations */
  const missingAr = useMemo(() => {
    let count = 0;
    for (const [col, items] of Object.entries(db)) {
      if (!Array.isArray(items)) continue;
      items.forEach(item => {
        for (const [k, v] of Object.entries(item)) {
          if (k.endsWith('_ar') && !v) count++;
        }
      });
    }
    return count;
  }, [db]);

  return (
    <div className="admin-home">
      <h2 className="admin-section-title">🏠 Genel Bakış</h2>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-value">{totalItems}</div>
          <div className="admin-stat-label">Toplam Kayıt</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{COLLECTION_ORDER.length}</div>
          <div className="admin-stat-label">Koleksiyon</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{changeLog.length}</div>
          <div className="admin-stat-label">Değişiklik</div>
        </div>
        <div className="admin-stat-card warn">
          <div className="admin-stat-value">{missingAr}</div>
          <div className="admin-stat-label">Eksik AR</div>
        </div>
      </div>

      {/* Enhanced Dashboard Row */}
      <div className="admin-dashboard-grid">
        <DataQualityCard />
        <TranslationCoverage />
      </div>
      <div className="admin-dashboard-grid">
        <CoordinateHealth onNavigate={onNavigate} />
        <CollectionSummary onNavigate={onNavigate} />
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}

/* ═══ Content Router ═══ */
function AdminContent({ route, onNavigate }) {
  if (route === 'home') return <AdminHome onNavigate={onNavigate} />;
  if (route === 'export') return <ExportManager />;
  if (route === 'changelog') return <ChangeLogView />;
  if (route === 'import') return <BulkImport />;
  if (route === 'search-replace') return <SearchReplace />;
  if (route === 'validate') return <ValidationReport />;
  if (route === 'settings') return <GitHubSettings />;
  if (route === 'causal-editor') return <CausalEditor onNavigate={onNavigate} />;

  if (route.startsWith('entity/')) {
    const collection = route.replace('entity/', '');
    return <EntityEditor collection={collection} />;
  }

  if (route.startsWith('aux/')) {
    const mod = route.replace('aux/', '');
    switch (mod) {
      case 'i18n': return <I18nEditor />;
      case 'tours': return <ToursEditor />;
      case 'eraInfo': return <EraInfoEditor />;
      case 'glossary': return <GlossaryEditor />;
      case 'scholarLinks': return <ScholarLinksEditor />;
      case 'isnadChains': return <IsnadChainsEditor />;
      case 'battleMeta': return <BattleMetaEditor />;
      case 'scholarMeta': return <ScholarMetaEditor />;
      case 'constants': return <ConstantsEditor />;
      default: return <div className="admin-error">Bilinmeyen modül: {mod}</div>;
    }
  }

  return <AdminHome onNavigate={onNavigate} />;
}

/* ═══ Inner panel (authenticated) ═══ */
function AdminPanelInner({ onBack }) {
  const { user } = useAdmin();
  const [route, setRoute] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!user) return <AdminLogin />;

  return (
    <div className="admin-panel">
      <AdminHeader onBack={onBack} onNavigate={setRoute} />
      <div className="admin-body">
        <AdminSidebar
          activeRoute={route}
          onNavigate={setRoute}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(p => !p)}
        />
        <div className="admin-content">
          <AdminContent route={route} onNavigate={setRoute} />
        </div>
      </div>
    </div>
  );
}

/* ═══ Outer wrapper with Provider ═══ */
export default function AdminPanel({ lang, onBack }) {
  const handleBack = useCallback(() => {
    if (onBack) onBack();
    else {
      try { window.history.replaceState(null, '', '#map'); } catch {}
      window.location.reload();
    }
  }, [onBack]);

  return (
    <AdminProvider>
      <ToastProvider>
        <AdminPanelInner onBack={handleBack} />
      </ToastProvider>
    </AdminProvider>
  );
}
