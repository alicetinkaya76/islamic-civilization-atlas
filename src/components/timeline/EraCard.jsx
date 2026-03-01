import { useState, useEffect } from 'react';
import ERA_INFO from '../../data/era_info.js';

/**
 * EraCard — Pedagogical info card for era bands.
 * Triggered when user clicks an era band on the Timeline.
 * Shows description, key developments, and notable scholars.
 */
export default function EraCard({ eraId, lang, onClose, onFlyTo }) {
  const [visible, setVisible] = useState(false);
  const era = ERA_INFO.find(e => e.id === eraId);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));
  }, [eraId]);

  if (!era) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  const handleFly = () => {
    if (onFlyTo && era.flyTo) {
      onFlyTo(era.flyTo);
    }
  };

  const desc = era.description[lang] || era.description.en;
  const devs = era.keyDevelopments[lang] || era.keyDevelopments.en;
  const schs = era.scholars[lang] || era.scholars.en;
  const label = era.label[lang] || era.label.en;

  return (
    <div className={`era-card-overlay${visible ? ' era-card-overlay--visible' : ''}`} onClick={handleClose}>
      <div
        className={`era-card${visible ? ' era-card--visible' : ''}`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label={label}
      >
        {/* Header */}
        <div className="era-card__header" style={{ borderLeftColor: era.color }}>
          <div className="era-card__era-dot" style={{ background: era.color }} />
          <div className="era-card__title-group">
            <h3 className="era-card__title">{label}</h3>
            <span className="era-card__dates">{era.start} – {era.end}</span>
          </div>
          <button className="era-card__close" onClick={handleClose} aria-label={lang === 'tr' ? 'Kapat' : 'Close'}>✕</button>
        </div>

        {/* Description */}
        <div className="era-card__body">
          <p className="era-card__desc">{desc}</p>

          {/* Key Developments */}
          <div className="era-card__section">
            <h4 className="era-card__section-title">
              <span className="era-card__section-icon">⚡</span>
              {lang === 'tr' ? 'Anahtar Gelişmeler' : 'Key Developments'}
            </h4>
            <div className="era-card__tags">
              {devs.map((d, i) => (
                <span key={i} className="era-card__tag" style={{ borderColor: era.color + '66' }}>
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* Notable Scholars */}
          <div className="era-card__section">
            <h4 className="era-card__section-title">
              <span className="era-card__section-icon">📚</span>
              {lang === 'tr' ? 'Öne Çıkan Âlimler' : 'Notable Scholars'}
            </h4>
            <div className="era-card__scholars">
              {schs.map((s, i) => (
                <span key={i} className="era-card__scholar">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with fly-to button */}
        {era.flyTo && (
          <div className="era-card__footer">
            <button className="era-card__fly-btn" onClick={handleFly} style={{ background: era.color + '22', borderColor: era.color + '66', color: era.color }}>
              🗺 {lang === 'tr' ? 'Haritada Göster' : 'Show on Map'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
