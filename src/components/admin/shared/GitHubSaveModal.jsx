/**
 * GitHubSaveModal — İlerleme göstergesi (dosya dosya durum)
 * v5.3.1.0
 */

export default function GitHubSaveModal({ files, commitMessage, onClose }) {
  // files: [{ name, status: 'pending'|'saving'|'done'|'error', size, error? }]
  const total = files.length;
  const done = files.filter(f => f.status === 'done').length;
  const hasError = files.some(f => f.status === 'error');
  const allDone = done === total;

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="admin-modal-overlay" onClick={allDone || hasError ? onClose : undefined}>
      <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
        <h3 className="admin-modal-title">
          {hasError ? '❌ Kaydetme Hatası' : allDone ? '✅ Kaydedildi!' : '🚀 GitHub\'a Kaydediliyor'}
        </h3>

        <div className="admin-save-files">
          {files.map((f, i) => (
            <div key={i} className={`admin-save-file admin-save-file-${f.status}`}>
              <span className="admin-save-file-icon">
                {f.status === 'done' ? '✅' :
                 f.status === 'saving' ? '⏳' :
                 f.status === 'error' ? '❌' : '○'}
              </span>
              <span className="admin-save-file-name">{f.name}</span>
              {f.size && <span className="admin-save-file-size">{f.size}</span>}
              {f.error && <span className="admin-save-file-error">{f.error}</span>}
            </div>
          ))}
        </div>

        <div className="admin-save-progress">
          <div className="admin-save-bar">
            <div className="admin-save-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="admin-save-count">{done}/{total}</span>
        </div>

        {commitMessage && (
          <div className="admin-save-commit">
            <strong>Commit:</strong> {commitMessage.split('\n')[0]}
          </div>
        )}

        {(allDone || hasError) && (
          <div className="admin-save-footer">
            {allDone && !hasError && (
              <p className="admin-save-deploy-note">
                Vercel ~30 saniye içinde deploy edecek.
              </p>
            )}
            <button className="admin-btn admin-btn-primary" onClick={onClose}>
              Kapat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
