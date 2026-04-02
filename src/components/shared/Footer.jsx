import T from '../../data/i18n';

export default function Footer({ lang }) {
  return (
    <footer className="site-footer site-footer-minimal">
      <div className="footer-inner" style={{ justifyContent: 'center', gap: 12, padding: '6px 16px' }}>
        <span className="footer-copy">© 2026 · CC BY-SA 4.0</span>
        <span style={{ fontSize: 10, color: 'var(--text2)' }}>v7.6.0.0</span>
        <a className="footer-gh" href="https://github.com/alicetinkaya76/islamic-civilization-atlas" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </div>
    </footer>
  );
}
