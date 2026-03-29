import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/theme.css';
import './styles/base.css';
import './styles/map.css';
import './styles/popup.css';
import './styles/timeline.css';
import './styles/causal.css';
import './styles/footer.css';
import './styles/tour.css';
import './styles/pedagogy.css';
import './styles/mobile.css';
import './styles/quiz.css';
import './styles/features.css';
import './styles/rtl.css';
import './styles/session13.css';
import './styles/session14.css';
import './styles/ei1.css';
import './styles/session22.css';
import './styles/session23.css';

/* ═══ Global Error Boundary — catches mobile crashes ═══ */
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[Atlas] Unhandled error:', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', background: '#0f1419',
          color: '#e8dcc8', fontFamily: '-apple-system, sans-serif',
          padding: '20px', textAlign: 'center', gap: '16px',
        }}>
          <div style={{ fontSize: '48px' }}>☪</div>
          <h2 style={{ color: '#c9a84c', fontSize: '18px', margin: 0 }}>islamicatlas.org</h2>
          <p style={{ color: '#a89b8c', fontSize: '14px', maxWidth: '320px' }}>
            Sayfa yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.
          </p>
          <p style={{ color: '#a89b8c', fontSize: '14px', maxWidth: '320px' }}>
            An error occurred while loading. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#c9a84c', color: '#0f1419', border: 'none',
              padding: '12px 32px', borderRadius: '8px', fontSize: '14px',
              fontWeight: 600, cursor: 'pointer', marginTop: '8px',
            }}
          >
            🔄 Yenile / Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ═══ Catch unhandled promise rejections (mobile Safari) ═══ */
window.addEventListener('unhandledrejection', (e) => {
  console.warn('[Atlas] Unhandled promise rejection:', e.reason);
  e.preventDefault();
});

/* ═══ Catch global errors ═══ */
window.addEventListener('error', (e) => {
  console.warn('[Atlas] Global error:', e.message);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);
