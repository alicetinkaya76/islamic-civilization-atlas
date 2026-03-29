/**
 * AdminHeader — Üst bar: undo/redo, geri, export, GitHub save, logout
 * v5.4.0.0
 */
import { useState, useCallback, useEffect } from 'react';
import { useAdmin } from './AdminContext';
import { useToast } from './shared/AdminToast';
import { getGitHubToken } from './settings/GitHubSettings';
import GitHubSaveModal from './shared/GitHubSaveModal';

export default function AdminHeader({ onBack, onNavigate }) {
  const { user, logout, isDirty, changeLog, dirtyFiles, saveToGitHub, undo, redo, canUndo, canRedo } = useAdmin();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [modalFiles, setModalFiles] = useState(null);
  const [modalCommit, setModalCommit] = useState('');

  /* Keyboard shortcuts: Ctrl/Cmd+Z = undo, Ctrl/Cmd+Shift+Z = redo */
  useEffect(() => {
    const handler = (e) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod || e.key.toLowerCase() !== 'z') return;

      e.preventDefault();
      if (e.shiftKey) {
        const cmd = redo();
        if (cmd) toast?.addToast(`Yinelendi: ${cmd.collection} #${cmd.id || cmd.itemId || ''}`, 'info', 2000);
      } else {
        const cmd = undo();
        if (cmd) toast?.addToast(`Geri alındı: ${cmd.collection} #${cmd.id || cmd.item?.id || ''}`, 'info', 2000);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, toast]);

  const handleUndo = useCallback(() => {
    const cmd = undo();
    if (cmd) toast?.addToast(`Geri alındı: ${cmd.collection} #${cmd.id || cmd.item?.id || ''}`, 'info', 2000);
  }, [undo, toast]);

  const handleRedo = useCallback(() => {
    const cmd = redo();
    if (cmd) toast?.addToast(`Yinelendi: ${cmd.collection} #${cmd.id || cmd.itemId || ''}`, 'info', 2000);
  }, [redo, toast]);

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
          <button className="admin-btn admin-btn-back" onClick={onBack} title="Atlasa Dön"
            style={{
              background: 'rgba(201,168,76,0.15)', border: '1px solid #c9a84c',
              color: '#c9a84c', padding: '6px 16px', borderRadius: 6,
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s', minHeight: 36,
            }}>
            ← Atlas'a Dön
          </button>
          <span className="admin-header-title">Admin Panel</span>
          {isDirty && (
            <span className="admin-header-dirty" title={`${changeLog.length} değişiklik, ${dirtyFiles.size} dosya`}>
              ● {changeLog.length} değişiklik ({dirtyFiles.size} dosya)
            </span>
          )}
        </div>
        <div className="admin-header-right">
          <button className="admin-btn admin-btn-ghost admin-undo-btn"
            onClick={handleUndo} disabled={!canUndo}
            title="Geri Al (⌘Z)">↩</button>
          <button className="admin-btn admin-btn-ghost admin-redo-btn"
            onClick={handleRedo} disabled={!canRedo}
            title="Yinele (⌘⇧Z)">↪</button>
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
