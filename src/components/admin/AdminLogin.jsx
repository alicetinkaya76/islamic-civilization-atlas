/**
 * AdminLogin — Giriş Formu
 * v5.2.0.0
 */
import { useState } from 'react';
import { useAdmin } from './AdminContext';

export default function AdminLogin() {
  const { login } = useAdmin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleBack = () => {
    try { window.history.replaceState(null, '', '#map'); } catch {}
    window.location.reload();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(username, password)) {
      setError('');
    } else {
      setError('Kullanıcı adı veya şifre hatalı');
    }
  };

  return (
    <div className="admin-login-wrap">
      {/* ═══ Prominent back button — always visible ═══ */}
      <button className="admin-login-back" onClick={handleBack}
        style={{
          position: 'fixed', top: 16, left: 16, zIndex: 10000,
          background: 'rgba(201,168,76,0.15)', border: '1px solid #c9a84c',
          color: '#c9a84c', padding: '10px 20px', borderRadius: 8,
          cursor: 'pointer', fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
          backdropFilter: 'blur(8px)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.target.style.background = 'rgba(201,168,76,0.3)'; }}
        onMouseLeave={e => { e.target.style.background = 'rgba(201,168,76,0.15)'; }}
      >
        ← Atlas'a Dön
      </button>

      <div className="admin-login-card">
        <div className="admin-login-logo">☪</div>
        <h2 className="admin-login-title">Admin Panel</h2>
        <p className="admin-login-sub">islamicatlas.org</p>
        <div className="admin-login-form" role="form">
          <div className="admin-field-group">
            <label className="admin-label">Kullanıcı Adı</label>
            <input
              type="text"
              className="admin-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
              autoComplete="username"
              autoFocus
            />
          </div>
          <div className="admin-field-group">
            <label className="admin-label">Şifre</label>
            <input
              type="password"
              className="admin-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
              autoComplete="current-password"
            />
          </div>
          {error && <div className="admin-error">{error}</div>}
          <button className="admin-btn admin-btn-primary admin-login-btn" onClick={handleSubmit}>
            Giriş Yap
          </button>
        </div>
      </div>
    </div>
  );
}
