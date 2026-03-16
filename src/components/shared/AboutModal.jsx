import { useState } from 'react';
import T from '../../data/i18n';

export default function AboutModal({ lang, onResetOnboarding, onResetLanding }) {
  const [open, setOpen] = useState(false);
  const t = T[lang];

  return (
    <>
      <button className="about-btn" onClick={() => setOpen(true)}>
        ℹ {t.about.btn}
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{t.about.title}</h2>
            <p className="modal-p">{t.about.desc1}</p>
            <p className="modal-p">{t.about.desc2}</p>
            <p className="modal-p">{t.about.desc3}</p>
            <div className="modal-section">
              <h3 className="modal-h3">{t.about.authors}</h3>
              <div className="modal-author">
                <strong>Dr. Hüseyin Gökalp</strong><br />
                {t.about.gokalp}
              </div>
              <div className="modal-author">
                <strong>Dr. Ali Çetinkaya</strong>
                <a href="https://orcid.org/0000-0002-7747-6854" target="_blank" rel="noopener noreferrer" className="modal-orcid">
                  <img src="https://orcid.org/sites/default/files/images/orcid_16x16.png" alt="ORCID" width="14" height="14" />
                </a>
                <br />
                {t.about.cetinkaya}
              </div>
            </div>
            <div className="modal-section">
              <h3 className="modal-h3">{t.about.data}</h3>
              <p className="modal-p modal-ref">{t.about.dataDesc}</p>
            </div>
            <p className="modal-license">{t.about.license}</p>
            {onResetOnboarding && (
              <button className="modal-onboarding-reset" onClick={() => { onResetOnboarding(); setOpen(false); }}>
                🗺 {t.about.showGuide}
              </button>
            )}
            {onResetLanding && (
              <button className="modal-onboarding-reset" onClick={() => { onResetLanding(); setOpen(false); }} style={{ marginTop: 6 }}>
                ☪ {t.about.showLanding}
              </button>
            )}
            <button className="modal-close" onClick={() => setOpen(false)}>{t.about.close}</button>
          </div>
        </div>
      )}
    </>
  );
}
