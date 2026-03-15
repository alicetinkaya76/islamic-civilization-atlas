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
