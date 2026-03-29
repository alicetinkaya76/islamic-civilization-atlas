import { useState } from 'react';
import T from '../../data/i18n';
import CitationBox from './CitationBox';

export default function Footer({ lang }) {
  const [showCite, setShowCite] = useState(false);
  const t = T[lang];

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-authors">
          <div className="footer-names">
            <span className="footer-author">
              Dr. Hüseyin Gökalp
              <a href="https://orcid.org/0000-0001-6796-5765" target="_blank" rel="noopener noreferrer" className="footer-orcid-badge" title="ORCID: 0000-0001-6796-5765">
                <img src="https://orcid.org/sites/default/files/images/orcid_16x16.png" alt="ORCID" width="14" height="14" />
                <span className="footer-orcid-id">0000-0001-6796-5765</span>
              </a>
            </span>
            <span className="footer-sep">&</span>
            <span className="footer-author">
              Dr. Ali Çetinkaya
              <a href="https://orcid.org/0000-0002-7747-6854" target="_blank" rel="noopener noreferrer" className="footer-orcid-badge" title="ORCID: 0000-0002-7747-6854">
                <img src="https://orcid.org/sites/default/files/images/orcid_16x16.png" alt="ORCID" width="14" height="14" />
                <span className="footer-orcid-id">0000-0002-7747-6854</span>
              </a>
            </span>
          </div>
          <div className="footer-affil">
            Selçuk {t.about.univ} — Konya, {t.about.country}
          </div>
        </div>
        <div className="footer-center">
          <a className="footer-doi" href="https://doi.org/10.5281/zenodo.19183845" target="_blank" rel="noopener noreferrer">
            <img src="https://zenodo.org/badge/DOI/10.5281/zenodo.19183845.svg" alt="DOI" height="18" />
          </a>
          <button className="footer-cite-btn" onClick={() => setShowCite(p => !p)}>
            📝 {t.footer.cite}
          </button>
        </div>
        <div className="footer-right">
          <span className="footer-copy">© 2026 · CC BY-SA 4.0</span>
          <span style={{ fontSize: 10, color: '#4b5563', marginLeft: 6 }}>v7.2.0.0</span>
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
