/**
 * AdminHeader — Üst bar: geri, export, GitHub save, logout
 * v5.3.1.0
 */
import { useState, useCallback } from 'react';
import { useAdmin } from './AdminContext';
import { useToast } from './shared/AdminToast';
import { getGitHubToken } from './settings/GitHubSettings';
import GitHubSaveModal from './shared/GitHubSaveModal';

export default function AdminHeader({ onBack, onNavigate }) {
  const { user, logout, isDirty, changeLog, dirtyFiles, saveToGitHub } = useAdmin();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [modalFiles, setModalFiles] = useState(null);
  const [modalCommit, setModalCommit] = useState('');

  const handleGitHubSave = useCallback(async () => {
    const token = getGitHubToken();
    if (!token) {
      toast?.addToast('Önce GitHub token ayarlayın (⚙ Ayarlar)', 'warn');
      onNavigate('settings');
      return;
    }
    if (!isDirty || dirtyFiles.size === 0) {
      toast?.addToast('Kaydedilecek değişiklik yok.', 'info');
      return;
    }

    setSaving(true);
    try {
      const result = await saveToGitHub(token, (files, commit) => {
        setModalFiles([...files]);
        setModalCommit(commit);
      });
      if (result.ok) {
        toast?.addToast(`${result.files.length} dosya GitHub'a kaydedildi. Vercel ~30 sn içinde deploy edecek.`, 'success', 8000);
      } else {
        const errCount = result.files.filter(f => f.status === 'error').length;
        toast?.addToast(`${errCount} dosyada hata oluştu. Detaylar için pencereye bakın.`, 'error', 8000);
      }
    } catch (err) {
      toast?.addToast(`Kaydetme hatası: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  }, [isDirty, dirtyFiles, saveToGitHub, onNavigate, toast]);

  return (
    <>
      <header className="admin-header">
        <div className="admin-header-left">
          <button className="admin-btn admin-btn-ghost" onClick={onBack} title="Atlasa Dön">
            ← Atlas
          </button>
          <span className="admin-header-title">Admin Panel</span>
          {isDirty && (
            <span className="admin-header-dirty" title={`${changeLog.length} değişiklik, ${dirtyFiles.size} dosya`}>
              ● {changeLog.length} değişiklik ({dirtyFiles.size} dosya)
            </span>
          )}
        </div>
        <div className="admin-header-right">
          <button
            className="admin-btn admin-btn-github"
            onClick={handleGitHubSave}
            disabled={!isDirty || saving}
            title={!isDirty ? 'Değişiklik yok' : `${dirtyFiles.size} dosyayı GitHub'a kaydet`}
          >
            {saving ? '⏳ Kaydediliyor...' : '🚀 GitHub\'a Kaydet'}
          </button>
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

      {modalFiles && (
        <GitHubSaveModal
          files={modalFiles}
          commitMessage={modalCommit}
          onClose={() => setModalFiles(null)}
        />
      )}
    </>
  );
}
