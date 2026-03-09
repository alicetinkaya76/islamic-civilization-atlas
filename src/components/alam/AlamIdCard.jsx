import { useMemo } from 'react';

/* ═══ Format date string: hijri/miladi ═══ */
function formatDate(hVal, mVal, place, ta) {
  const parts = [];
  if (hVal) parts.push(`${hVal} ${ta.hijri}`);
  if (mVal) parts.push(`${mVal} ${ta.miladi}`);
  const dateStr = parts.join(' / ');
  if (place) return `${dateStr} — ${place}`;
  return dateStr;
}

export default function AlamIdCard({ lang, ta, bio, detail, onClose }) {
  if (!bio) {
    return (
      <div className="alam-idcard-empty">
        <div className="alam-idcard-placeholder">
          <span className="alam-idcard-icon">📖</span>
          <p>{ta.noSelection}</p>
        </div>
      </div>
    );
  }

  const isTr = lang === 'tr';
  const heading1 = isTr ? bio.ht : bio.he;
  const heading2 = isTr ? bio.he : bio.ht;
  const fullName = detail ? (isTr ? detail.nt : detail.ne) : (isTr ? bio.ht : bio.he);
  const desc = detail ? (isTr ? detail.dt : detail.de) : (isTr ? bio.dt : bio.de);
  const prof = isTr ? bio.pt : bio.pe;
  const nisbe = detail ? (isTr ? detail.n2 : detail.ne2) : '';
  const birthPlace = detail ? detail.bp : bio.bp;
  const deathPlace = detail ? detail.dp : bio.dp;
  const kunya = detail ? detail.ku : bio.ku;
  const works = detail ? detail.wk : null;
  const diaUrl = detail ? detail.dia : (bio.ds ? `https://islamansiklopedisi.org.tr/${bio.ds}` : null);
  const multiCoords = detail ? detail.mc : null;

  return (
    <div className="alam-idcard">
      {/* Close button */}
      <button className="alam-idcard-close" onClick={onClose} aria-label="Close">✕</button>

      {/* Header */}
      <div className="alam-idcard-header">
        <h3 className="alam-idcard-h1">{heading1}</h3>
        <p className="alam-idcard-h2">{heading2}</p>
        <p className="alam-idcard-arabic" dir="rtl">{bio.h}</p>
        {bio.g === 'F' && <span className="alam-idcard-gender-badge">♀</span>}
      </div>

      {/* Full name */}
      {fullName && fullName !== heading1 && (
        <div className="alam-idcard-fullname">
          {detail && detail.fn && <p className="alam-idcard-fn-ar" dir="rtl">{detail.fn}</p>}
          <p className="alam-idcard-fn">{fullName}</p>
        </div>
      )}

      {/* Fields */}
      <div className="alam-idcard-fields">
        {kunya && (
          <div className="alam-idcard-row">
            <span className="alam-idcard-label">{ta.kunya}</span>
            <span className="alam-idcard-value" dir="rtl">{kunya}</span>
          </div>
        )}
        {nisbe && (
          <div className="alam-idcard-row">
            <span className="alam-idcard-label">{ta.nisba}</span>
            <span className="alam-idcard-value">{nisbe}</span>
          </div>
        )}
        {(bio.hb || bio.mb) && (
          <div className="alam-idcard-row">
            <span className="alam-idcard-label">{ta.birthDate}</span>
            <span className="alam-idcard-value">{formatDate(bio.hb, bio.mb, birthPlace, ta)}</span>
          </div>
        )}
        {(bio.hd || bio.md) && (
          <div className="alam-idcard-row">
            <span className="alam-idcard-label">{ta.deathDate}</span>
            <span className="alam-idcard-value">{formatDate(bio.hd, bio.md, deathPlace, ta)}</span>
          </div>
        )}
        {prof && (
          <div className="alam-idcard-row">
            <span className="alam-idcard-label">{ta.profession}</span>
            <span className="alam-idcard-value">{prof}</span>
          </div>
        )}
        {bio.mz && (
          <div className="alam-idcard-row">
            <span className="alam-idcard-label">{ta.fiqhMadhab}</span>
            <span className="alam-idcard-value alam-madhab-badge">{bio.mz}</span>
          </div>
        )}
        {bio.c && (
          <div className="alam-idcard-row">
            <span className="alam-idcard-label">{ta.century}</span>
            <span className="alam-idcard-value">{bio.c}. {ta.century} {ta.miladi}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {desc && (
        <div className="alam-idcard-desc">
          <p>{desc}</p>
        </div>
      )}

      {/* Works */}
      {works && works.length > 0 && (
        <div className="alam-idcard-works">
          <h4 className="alam-idcard-section-title">📚 {ta.works} ({works.length})</h4>
          <ul className="alam-works-list">
            {works.map((w, i) => (
              <li key={i} className="alam-work-item" dir="rtl">
                <span className="alam-work-name">{w.n}</span>
                <span className={`alam-work-type ${w.t === 'printed' ? 'printed' : 'manuscript'}`}>
                  {w.t === 'printed' ? `(${ta.printedWork})` : w.t === 'manuscript' ? `(${ta.manuscriptWork})` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Multi-coordinates */}
      {multiCoords && multiCoords.length > 1 && (
        <div className="alam-idcard-places">
          <h4 className="alam-idcard-section-title">📍 {isTr ? 'Mekânlar' : 'Places'}</h4>
          <div className="alam-places-list">
            {multiCoords.map((c, i) => (
              <span key={i} className="alam-place-tag">
                {c.p || `${c.lat}, ${c.lon}`}
                {c.r && <small> ({c.r})</small>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* DIA link */}
      {diaUrl && (
        <a href={diaUrl} target="_blank" rel="noopener noreferrer" className="alam-dia-link">
          📖 {ta.diaLink} ↗
        </a>
      )}

      {/* Source footer */}
      <div className="alam-idcard-source">{ta.source}</div>
    </div>
  );
}
