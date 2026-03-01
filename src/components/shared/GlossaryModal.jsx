import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import glossary from '../../data/glossary';

/* ═══ Turkish Character Normalization for Search ═══ */
const normalize = (s) =>
  s.toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u');

export default function GlossaryModal({ lang }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  /* Focus search on open */
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 150);
    }
  }, [open]);

  /* ESC to close */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  /* Filtered list */
  const filtered = useMemo(() => {
    if (!query.trim()) return glossary;
    const q = normalize(query.trim());
    return glossary.filter(g =>
      normalize(g.term_tr).includes(q) ||
      normalize(g.term_en).includes(q) ||
      normalize(g.def_tr).includes(q) ||
      normalize(g.def_en).includes(q)
    );
  }, [query]);

  const toggleExpand = useCallback((id) => {
    setExpanded(prev => prev === id ? null : id);
  }, []);

  return (
    <>
      <button className="glossary-btn" onClick={() => setOpen(true)}
        aria-label={lang === 'tr' ? 'Sözlük' : 'Glossary'} title={lang === 'tr' ? 'Sözlük' : 'Glossary'}>
        📖
      </button>

      {open && (
        <div className="glossary-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="glossary-panel" ref={panelRef} role="dialog" aria-modal="true"
            aria-label={lang === 'tr' ? 'İslam Tarihi Sözlüğü' : 'Islamic History Glossary'}>
            {/* Header */}
            <div className="glossary-header">
              <div className="glossary-title-row">
                <span className="glossary-icon">📖</span>
                <h2 className="glossary-title">
                  {lang === 'tr' ? 'İslam Tarihi Sözlüğü' : 'Islamic History Glossary'}
                </h2>
              </div>
              <button className="glossary-close" onClick={() => setOpen(false)} aria-label={lang === 'tr' ? 'Kapat' : 'Close'}>✕</button>
            </div>

            {/* Search */}
            <div className="glossary-search-wrap">
              <span className="glossary-search-icon">🔍</span>
              <input
                ref={inputRef}
                type="text"
                className="glossary-search"
                placeholder={lang === 'tr' ? 'Terim ara… (ör: halife, vakıf, medrese)' : 'Search terms… (e.g. caliph, waqf, madrasa)'}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={lang === 'tr' ? 'Sözlükte ara' : 'Search glossary'}
              />
              {query && (
                <button className="glossary-clear" onClick={() => setQuery('')} aria-label={lang === 'tr' ? 'Temizle' : 'Clear'}>✕</button>
              )}
            </div>

            {/* Count */}
            <div className="glossary-count">
              {filtered.length} / {glossary.length} {lang === 'tr' ? 'terim' : 'terms'}
            </div>

            {/* List */}
            <div className="glossary-list">
              {filtered.length === 0 ? (
                <div className="glossary-empty">
                  {lang === 'tr' ? 'Sonuç bulunamadı.' : 'No results found.'}
                </div>
              ) : (
                filtered.map(g => (
                  <div key={g.id} className={`glossary-item${expanded === g.id ? ' expanded' : ''}`}
                    onClick={() => toggleExpand(g.id)}>
                    <div className="glossary-item-header">
                      <span className="glossary-term-tr">{g.term_tr}</span>
                      <span className="glossary-term-en">{g.term_en}</span>
                      <span className="glossary-arrow">{expanded === g.id ? '▾' : '▸'}</span>
                    </div>
                    {expanded === g.id && (
                      <div className="glossary-def">
                        <p className="glossary-def-text">
                          <span className="glossary-lang-tag">TR</span>
                          {g.def_tr}
                        </p>
                        <p className="glossary-def-text">
                          <span className="glossary-lang-tag en">EN</span>
                          {g.def_en}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
