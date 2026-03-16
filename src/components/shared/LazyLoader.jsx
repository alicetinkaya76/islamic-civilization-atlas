import { useEffect, useState } from 'react';

/**
 * Loading overlay for lazy-loaded panels and data.
 * Supports Suspense fallback (no props) and data-loading (with message).
 */
export default function LazyLoader({ message, error, onRetry }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(id);
  }, []);

  if (error) {
    return (
      <div className="lazy-loader">
        <div className="lazy-error-icon">⚠️</div>
        <p className="lazy-error-msg">{String(error.message || error)}</p>
        {onRetry && (
          <button className="lazy-retry-btn" onClick={onRetry}>
            Tekrar dene / Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="lazy-loader">
      <div className="lazy-spinner" />
      <p className="lazy-msg">{message || 'Yükleniyor'}{dots}</p>
    </div>
  );
}

/* ═══ Inline styles injected once ═══ */
const STYLE_ID = 'lazy-loader-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.lazy-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  padding: 40px 20px;
  color: #c4b89a;
  gap: 16px;
}
.lazy-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(196, 184, 154, 0.2);
  border-top-color: #c9a84c;
  border-radius: 50%;
  animation: lazy-spin 0.8s linear infinite;
}
@keyframes lazy-spin {
  to { transform: rotate(360deg); }
}
.lazy-msg {
  font-size: 14px;
  color: #a89b8c;
  min-width: 120px;
}
.lazy-error-icon {
  font-size: 32px;
}
.lazy-error-msg {
  font-size: 13px;
  color: #ef5350;
  font-family: monospace;
  max-width: 400px;
  text-align: center;
}
.lazy-retry-btn {
  margin-top: 8px;
  padding: 8px 20px;
  background: #1a6b5a;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.lazy-retry-btn:hover {
  background: #228b6b;
}
`;
  document.head.appendChild(style);
}
