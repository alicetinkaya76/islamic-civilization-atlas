/**
 * GitHubSettings — GitHub token giriş/test/kaldır ekranı
 * v5.3.1.0
 */
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'atlas-github-token';
const REPO = 'alicetinkaya76/islamic-civilization-atlas';

export function getGitHubToken() {
  try { return localStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; }
}

export function setGitHubToken(token) {
  try { localStorage.setItem(STORAGE_KEY, token); } catch {}
}

export function removeGitHubToken() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

export default function GitHubSettings() {
  const [token, setToken] = useState('');
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { ok, message }

  useEffect(() => {
    const t = getGitHubToken();
    if (t) {
      setToken(t);
      setSaved(true);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!token.trim()) return;
    setGitHubToken(token.trim());
    setSaved(true);
    setTestResult(null);
  }, [token]);

  const handleRemove = useCallback(() => {
    removeGitHubToken();
    setToken('');
    setSaved(false);
    setTestResult(null);
  }, []);

  const handleTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult({
          ok: true,
          message: `Bağlantı başarılı! Repo: ${data.full_name} — Son güncelleme: ${new Date(data.pushed_at).toLocaleString('tr')}`
        });
      } else if (res.status === 401) {
        setTestResult({ ok: false, message: 'Token geçersiz veya süresi dolmuş (401 Unauthorized).' });
      } else if (res.status === 403) {
        setTestResult({ ok: false, message: 'Erişim reddedildi (403 Forbidden). Token yetkilerini kontrol edin.' });
      } else {
        setTestResult({ ok: false, message: `Hata: ${res.status} ${res.statusText}` });
      }
    } catch (err) {
      setTestResult({ ok: false, message: `Ağ hatası: ${err.message}` });
    } finally {
      setTesting(false);
    }
  }, [token]);

  const maskedToken = token ? token.slice(0, 12) + '•'.repeat(Math.max(0, token.length - 12)) : '';

  return (
    <div className="admin-settings">
      <h2 className="admin-section-title">⚙ GitHub Ayarları</h2>

      <div className="admin-github-card">
        <h3 className="admin-sub-title">GitHub Bağlantısı</h3>

        <div className="admin-field">
          <label className="admin-label">GitHub Personal Access Token</label>
          <div className="admin-github-token-row">
            <input
              type={saved ? 'password' : 'text'}
              className="admin-input admin-input-mono"
              value={saved ? maskedToken : token}
              onChange={e => { setToken(e.target.value); setSaved(false); setTestResult(null); }}
              placeholder="github_pat_..."
              spellCheck={false}
            />
            {!saved ? (
              <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={!token.trim()}>
                Kaydet
              </button>
            ) : (
              <span className="admin-github-saved-badge">✅ Kayıtlı</span>
            )}
          </div>
        </div>

        {saved && (
          <div className="admin-github-actions">
            <button className="admin-btn admin-btn-outline" onClick={handleTest} disabled={testing}>
              {testing ? '⏳ Test ediliyor...' : '🔗 Token Test Et'}
            </button>
            <button className="admin-btn admin-btn-danger-outline" onClick={handleRemove}>
              🗑 Token Kaldır
            </button>
          </div>
        )}

        {testResult && (
          <div className={`admin-github-result ${testResult.ok ? 'success' : 'error'}`}>
            {testResult.ok ? '✅' : '❌'} {testResult.message}
          </div>
        )}

        <div className="admin-github-help">
          <strong>Token oluşturmak için:</strong>
          <ol>
            <li>GitHub → Settings → Developer settings</li>
            <li>Personal access tokens → Fine-grained tokens</li>
            <li>Repository: <code>{REPO}</code></li>
            <li>Permission: <strong>Contents → Read and Write</strong></li>
          </ol>
        </div>
      </div>
    </div>
  );
}
