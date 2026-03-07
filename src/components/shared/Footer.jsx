import { useState } from 'react';
import CitationBox from './CitationBox';

export default function Footer({ lang }) {
  const [showCite, setShowCite] = useState(false);

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-authors">
          <div className="footer-names">
            <span className="footer-author">Dr. Hüseyin Gökalp</span>
            <span className="footer-sep">&</span>
            <span className="footer-author">
              Dr. Ali Çetinkaya
              <a href="https://orcid.org/0000-0002-7747-6854" target="_blank" rel="noopener noreferrer" className="footer-orcid" title="ORCID">
                <img src="https://orcid.org/sites/default/files/images/orcid_16x16.png" alt="ORCID" width="12" height="12" />
              </a>
            </span>
          </div>
          <div className="footer-affil">
            Selçuk {lang === 'tr' ? 'Üniversitesi' : 'University'} — Konya, {lang === 'tr' ? 'Türkiye' : 'Turkey'}
          </div>
        </div>
        <div className="footer-center">
          <a className="footer-doi" href="https://doi.org/10.5281/zenodo.18818238" target="_blank" rel="noopener noreferrer">
            <img src="https://zenodo.org/badge/DOI/10.5281/zenodo.18818238.svg" alt="DOI" height="18" />
          </a>
          <button className="footer-cite-btn" onClick={() => setShowCite(p => !p)}>
            📝 {lang === 'tr' ? 'Atıf Yap' : 'Cite'}
          </button>
        </div>
        <div className="footer-right">
          <span className="footer-copy">© 2026 · CC BY-SA 4.0</span>
          <span style={{ fontSize: 10, color: '#4b5563', marginLeft: 6 }}>v4.8.4.3</span>
          <a className="footer-gh" href="https://github.com/alicetinkaya76/islamic-civilization-atlas" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </div>
      </div>
      {showCite && (
        <div className="footer-cite-panel">
          <CitationBox lang={lang} />
        </div>
      )}
    </footer>
  );
}
