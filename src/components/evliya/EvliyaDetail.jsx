/**
 * EvliyaDetail.jsx — Detay kartı (3 dil, çapraz ref, İbn Battûta link)
 * v8.0.0.0 — improved: XSS safe, keyboard accessible, shared constants
 */
import React, { useState, useCallback } from 'react';
import {
  CAT_ICONS, CAT_LABELS, XREF_LABELS, XREF_ICONS,
  getLabels, stripHtml,
} from './constants';

export default function EvliyaDetail({
  place,
  voyage,
  lang,
  onClose,
  ibnBattutaMatch = null,
  onNavigateToIbnBattuta = null,
}) {
  const [showFull, setShowFull] = useState(false);
  const [activeLang, setActiveLang] = useState(lang);

  const l = getLabels(activeLang);
  const cl = CAT_LABELS[activeLang] || CAT_LABELS.tr;
  const isRtl = activeLang === 'ar';

  const name = place[activeLang] || place.tr;
  const rawNarr = activeLang === 'tr' ? place.narr_tr
    : activeLang === 'en' ? place.narr_en
    : place.narr_ar;

  // XSS prevention: strip HTML tags from narrative
  const narr = stripHtml(rawNarr);

  const xrefs = place.xref || {};
  const xrefEntries = Object.entries(xrefs);
  const xrefCount = xrefEntries.length;

  const icon = CAT_ICONS[place.category] || '📍';
  const catLabel = cl[place.category] || place.category;

  const NARR_PREVIEW_LEN = 400;
  const narrPreview = narr && narr.length > NARR_PREVIEW_LEN && !showFull
    ? narr.slice(0, NARR_PREVIEW_LEN) + '…'
    : narr;

  const toggleShowFull = useCallback(() => setShowFull(f => !f), []);

  const handleBannerClick = useCallback(() => {
    onNavigateToIbnBattuta?.(place.tr);
  }, [onNavigateToIbnBattuta, place.tr]);

  const handleBannerKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onNavigateToIbnBattuta?.(place.tr);
    }
  }, [onNavigateToIbnBattuta, place.tr]);

  return (
    <div className="evliya-detail" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="evliya-detail-header">
        <div className="evliya-detail-title">
          <span className="evliya-detail-icon">{icon}</span>
          <div>
            <h3>{name}</h3>
            <span className="evliya-detail-id">{place.id}</span>
          </div>
        </div>
        <button className="evliya-detail-close" onClick={onClose} aria-label="Close">✕</button>
      </div>

      {/* Meta tags */}
      <div className="evliya-detail-meta">
        {voyage && (
          <span
            className="evliya-detail-voyage"
            style={{ borderColor: voyage.color, color: voyage.color }}
          >
            {voyage.id} — {voyage[`title_${activeLang}`] || voyage.title_tr}
            <span className="evliya-detail-voyage-years"> ({voyage.start_year}–{voyage.end_year})</span>
          </span>
        )}
        <span className="evliya-detail-category">{catLabel}</span>
        <span className="evliya-detail-coords">
          {place.lat.toFixed(4)}, {place.lon.toFixed(4)}
        </span>
      </div>

      {/* İbn Battûta cross-link banner */}
      {(ibnBattutaMatch || xrefs.ibn_battuta) && (
        <div
          className="evliya-ibn-battuta-banner"
          onClick={onNavigateToIbnBattuta ? handleBannerClick : undefined}
          onKeyDown={onNavigateToIbnBattuta ? handleBannerKeyDown : undefined}
          role={onNavigateToIbnBattuta ? 'button' : undefined}
          tabIndex={onNavigateToIbnBattuta ? 0 : undefined}
          aria-label={l.ibnBattutaVisited}
        >
          <span className="evliya-ibn-battuta-icon">🐫</span>
          <span className="evliya-ibn-battuta-text">{l.ibnBattutaVisited}</span>
          {onNavigateToIbnBattuta && <span className="evliya-ibn-battuta-arrow">→</span>}
        </div>
      )}

      {/* Language switcher */}
      <div className="evliya-detail-langs" role="group" aria-label="Language">
        {['tr', 'en', 'ar'].map(code => (
          <button
            key={code}
            className={`evliya-lang-btn ${activeLang === code ? 'active' : ''}`}
            onClick={() => setActiveLang(code)}
            aria-pressed={activeLang === code}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Narrative (plain text, XSS-safe) */}
      {narrPreview && (
        <div className="evliya-detail-narr">
          <p>{narrPreview}</p>
          {narr && narr.length > NARR_PREVIEW_LEN && (
            <button className="evliya-btn-small" onClick={toggleShowFull}>
              {showFull ? '▲' : '▼'} {showFull ? l.readLess : l.readMore}
            </button>
          )}
        </div>
      )}

      {/* Cross-references */}
      {xrefCount > 0 && (
        <div className="evliya-detail-xref">
          <h4>{l.crossRefs} ({xrefCount})</h4>
          {xrefEntries.map(([key, val]) => (
            <div key={key} className="evliya-xref-item">
              <span className="evliya-xref-icon">{XREF_ICONS[key] || '🔗'}</span>
              <span className="evliya-xref-label">{XREF_LABELS[key] || key}</span>
              <span className="evliya-xref-name">{val.name}</span>
              {val.distance_km != null && (
                <span className="evliya-xref-dist">{val.distance_km} km</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Original Turkish name */}
      {place.tr && activeLang !== 'tr' && (
        <div className="evliya-detail-original">
          <span className="evliya-detail-original-label">{l.originalName}</span>
          {' '}{place.tr}
        </div>
      )}
    </div>
  );
}
