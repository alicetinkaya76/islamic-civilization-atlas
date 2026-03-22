import { useMemo, useState } from 'react';
import { EI1_FIELD_COLORS } from './ei1Constants';

function fmtDate(h, m, place) {
  const parts = [];
  if (h) parts.push(`${h} AH`);
  if (m) parts.push(`${m} CE`);
  const ds = parts.join(' / ');
  return place ? `${ds} — ${place}` : ds;
}

const TYPE_LABELS = {
  biography: '👤 Biography', geography: '🌍 Geography',
  concept: '💡 Concept', dynasty: '👑 Dynasty',
  cross_reference: '🔗 Cross Reference', unknown: '📄 Entry',
};

export default function Ei1IdCard({ lang, te, bio, works, relations, lookup, onClose, onNavigate }) {
  const [worksExpanded, setWorksExpanded] = useState(false);
  const [xrefExpanded, setXrefExpanded] = useState(false);

  /* ═══ ALL hooks MUST be above conditional return ═══ */
  const scholarWorks = useMemo(() => {
    if (!bio || !works) return [];
    return works[String(bio.id)] || [];
  }, [works, bio]);

  const xrefs = useMemo(() => {
    if (!bio || !relations?.xref) return [];
    return relations.xref
      .filter(([src]) => src === bio.id)
      .map(([, tid, rel, extName]) => ({
        id: tid,
        name: tid >= 0 && lookup[tid] ? lookup[tid].t : extName || '?',
        rel,
        isInternal: tid >= 0 && !!lookup[tid],
      }));
  }, [relations, bio, lookup]);

  if (!bio) {
    return (
      <div className="ei1-idcard-empty">
        <div className="ei1-idcard-placeholder">
          <span className="ei1-idcard-icon">📕</span>
          <p>{te.noSelection || 'Select an entry'}</p>
          <span className="ei1-idcard-hint">{te.noSelectionHint || 'Choose from the list to see details'}</span>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#ei1/${bio.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
  };

  return (
    <div className="ei1-idcard">
      <button className="ei1-idcard-close" onClick={onClose} aria-label="Close">✕</button>

      {/* Header with article type badge */}
      <div className="ei1-idcard-header">
        <div className="ei1-idcard-type-badge">{TYPE_LABELS[bio.at] || TYPE_LABELS.unknown}</div>
        <h3 className="ei1-idcard-title">{bio.t}</h3>
        {bio.fn && <div className="ei1-idcard-fullname">{bio.fn}</div>}
        {bio.vol && <div className="ei1-idcard-volume">Vol. {bio.vol}</div>}
      </div>

      {/* Description */}
      {bio.ds && <p className="ei1-idcard-desc">{bio.ds}</p>}

      {/* Dates */}
      {(bio.bh || bio.bc || bio.dh || bio.dc) && (
        <div className="ei1-idcard-section">
          <div className="ei1-idcard-label">{te.dates || 'Dates'}</div>
          {(bio.bh || bio.bc) && (
            <div className="ei1-idcard-row">
              <span className="ei1-idcard-icon-sm">🌱</span>
              {fmtDate(bio.bh, bio.bc, bio.bp)}
            </div>
          )}
          {(bio.dh || bio.dc) && (
            <div className="ei1-idcard-row">
              <span className="ei1-idcard-icon-sm">🕊</span>
              {fmtDate(bio.dh, bio.dc, bio.dp)}
            </div>
          )}
        </div>
      )}

      {/* Fields */}
      {bio.fl?.length > 0 && (
        <div className="ei1-idcard-section">
          <div className="ei1-idcard-label">{te.fieldsLabel || 'Fields'}</div>
          <div className="ei1-idcard-badges">
            {bio.fl.map(f => (
              <span key={f} className="ei1-badge" style={{ background: EI1_FIELD_COLORS[f] || '#546e7a' }}>{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* Madhab */}
      {bio.mz && (
        <div className="ei1-idcard-section">
          <div className="ei1-idcard-label">{te.madhab || 'Madhab'}</div>
          <span className="ei1-badge ei1-badge-madhab">{bio.mz}</span>
        </div>
      )}

      {/* Dynasty / Region */}
      {(bio.dy || bio.rg) && (
        <div className="ei1-idcard-section">
          {bio.dy && <div className="ei1-idcard-row"><span className="ei1-idcard-icon-sm">👑</span> {bio.dy}</div>}
          {bio.rg && <div className="ei1-idcard-row"><span className="ei1-idcard-icon-sm">🌐</span> {bio.rg}</div>}
        </div>
      )}

      {/* EI-1 Article Author */}
      {bio.au && (
        <div className="ei1-idcard-section">
          <div className="ei1-idcard-label">{te.eiAuthor || 'EI¹ Article Author'}</div>
          <div className="ei1-idcard-text ei1-article-author">{bio.au}</div>
        </div>
      )}

      {/* Confidence / importance meter */}
      {bio.is > 0 && (
        <div className="ei1-idcard-section">
          <div className="ei1-idcard-label">{te.confidence || 'Data Confidence'}</div>
          <div className="ei1-importance-meter">
            <div className="ei1-importance-fill" style={{ width: `${Math.min(bio.is, 100)}%` }} />
            <span className="ei1-importance-value">{bio.is}%</span>
          </div>
        </div>
      )}

      {/* Works — collapsible */}
      {scholarWorks.length > 0 && (
        <div className="ei1-idcard-section">
          <button className="ei1-idcard-label ei1-works-toggle" onClick={() => setWorksExpanded(p => !p)}
            aria-expanded={worksExpanded}>
            📚 {te.works || 'Works'} ({scholarWorks.length}) {worksExpanded ? '▾' : '▸'}
          </button>
          <ul className={`ei1-works-list ${worksExpanded ? 'expanded' : 'collapsed'}`}>
            {scholarWorks.slice(0, 20).map((w, i) => <li key={i} className="ei1-work-item">{w}</li>)}
            {scholarWorks.length > 20 && <li className="ei1-work-more">+{scholarWorks.length - 20} more</li>}
          </ul>
        </div>
      )}

      {/* Cross-references — collapsible */}
      {xrefs.length > 0 && (
        <div className="ei1-idcard-section">
          <button className="ei1-idcard-label ei1-works-toggle" onClick={() => setXrefExpanded(p => !p)}
            aria-expanded={xrefExpanded}>
            🔗 {te.crossRefs || 'Cross-References'} ({xrefs.length}) {xrefExpanded ? '▾' : '▸'}
          </button>
          <div className={`ei1-xref-list ${xrefExpanded ? 'expanded' : 'collapsed'}`}>
            {xrefs.map((x, i) => (
              x.isInternal ? (
                <button key={i} className="ei1-xref-chip" onClick={() => onNavigate(x.id)}>
                  {x.name} <span className="ei1-xref-rel">{x.rel}</span>
                </button>
              ) : (
                <span key={i} className="ei1-xref-chip external">
                  {x.name} <span className="ei1-xref-rel">{x.rel}</span>
                </span>
              )
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="ei1-idcard-actions">
        <button className="ei1-btn ei1-btn-secondary" onClick={handleShare}>
          🔗 {te.share || 'Share'}
        </button>
      </div>
    </div>
  );
}
