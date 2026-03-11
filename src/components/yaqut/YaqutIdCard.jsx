import { useMemo, useState } from 'react';
import YAQUT_CROSSREF from '../../data/yaqut_crossref.json';

/* ═══ Geo type icons ═══ */
const GEO_ICONS = {
  city: '🏙', village: '🏘', mountain: '⛰', river: '🏞', fortress: '🏰',
  region: '📍', town: '🏛', district: '📌', valley: '🌿', water: '💧',
  well: '🕳', monastery: '⛪', spring: '💦', pass: '🛤', island: '🏝',
  desert: '🏜', place: '📍', market: '🏪', quarter: '🏠', wadi: '🌊', sea: '🌊',
};

const PERIOD_BADGE = {
  active:    { tr: 'Aktif', en: 'Active', color: '#66bb6a' },
  ruined:    { tr: 'Harap', en: 'Ruined', color: '#ff8a65' },
  legendary: { tr: 'Efsanevî', en: 'Legendary', color: '#ce93d8' },
};

export default function YaqutIdCard({ lang, ty, entry, detail, onClose }) {
  const [showFullText, setShowFullText] = useState(false);
  const [xrefPage, setXrefPage] = useState(0);
  const XREF_PER_PAGE = 15;

  if (!entry) {
    return (
      <div className="yaqut-idcard-empty">
        <div className="yaqut-idcard-placeholder">
          <span className="yaqut-idcard-icon">🌍</span>
          <p>{ty.noSelection || 'Detay için bir yere tıklayın'}</p>
        </div>
      </div>
    );
  }

  const isTr = lang === 'tr';
  const heading1 = isTr ? entry.ht : entry.he;
  const heading2 = isTr ? entry.he : entry.ht;
  const summary = detail
    ? (isTr ? (detail.sft || entry.st) : (detail.sfe || entry.se))
    : (isTr ? entry.st : entry.se);
  const geoType = isTr ? entry.gtt : entry.gte;
  const periodBadge = PERIOD_BADGE[entry.hp] || null;

  // Cross-ref persons for this place
  const crossRefPersons = useMemo(() => {
    return YAQUT_CROSSREF[String(entry.id)] || [];
  }, [entry.id]);

  const xrefTotal = crossRefPersons.length;
  const xrefPages = Math.ceil(xrefTotal / XREF_PER_PAGE);
  const xrefSlice = crossRefPersons.slice(xrefPage * XREF_PER_PAGE, (xrefPage + 1) * XREF_PER_PAGE);

  return (
    <div className="yaqut-idcard">
      {/* Close button */}
      <button className="yaqut-idcard-close" onClick={onClose} aria-label="Close">✕</button>

      {/* Header */}
      <div className="yaqut-idcard-header">
        <h3 className="yaqut-idcard-h1">{heading1}</h3>
        <p className="yaqut-idcard-h2">{heading2}</p>
        <p className="yaqut-idcard-arabic" dir="rtl">{entry.h}</p>
      </div>

      {/* Type & Period badges */}
      <div className="yaqut-idcard-badges">
        {geoType && (
          <span className="yaqut-badge yaqut-badge-geo">
            {GEO_ICONS[entry.gt] || '📍'} {geoType}
          </span>
        )}
        {periodBadge && (
          <span className="yaqut-badge" style={{ borderColor: periodBadge.color, color: periodBadge.color }}>
            {periodBadge[lang]}
          </span>
        )}
        {entry.ds && (
          <a href={`https://islamansiklopedisi.org.tr/${entry.ds}`}
            target="_blank" rel="noopener noreferrer"
            className="yaqut-badge yaqut-badge-dia">
            📖 DİA ↗
          </a>
        )}
      </div>

      {/* Fields */}
      <div className="yaqut-idcard-fields">
        {entry.ct && (
          <div className="yaqut-idcard-row">
            <span className="yaqut-idcard-label">{ty.country || 'Ülke'}</span>
            <span className="yaqut-idcard-value">{entry.ct}{entry.rg ? ` — ${entry.rg}` : ''}</span>
          </div>
        )}
        {entry.lat != null && (
          <div className="yaqut-idcard-row">
            <span className="yaqut-idcard-label">{ty.coordinates || 'Koordinat'}</span>
            <span className="yaqut-idcard-value">{entry.lat}°, {entry.lon}°</span>
          </div>
        )}
        {detail && detail.hr && (
          <div className="yaqut-idcard-row">
            <span className="yaqut-idcard-label">{ty.hareke || 'Hareke'}</span>
            <span className="yaqut-idcard-value yaqut-arabic-text" dir="rtl">{detail.hr}</span>
          </div>
        )}
        {detail && detail.et && (
          <div className="yaqut-idcard-row">
            <span className="yaqut-idcard-label">{ty.etymology || 'Etimoloji'}</span>
            <span className="yaqut-idcard-value">{detail.et}</span>
          </div>
        )}
        {detail && detail.pl && (
          <div className="yaqut-idcard-row">
            <span className="yaqut-idcard-label">{ty.parentLocations || 'Üst Bölge'}</span>
            <span className="yaqut-idcard-value" dir="rtl">{detail.pl.join(' / ')}</span>
          </div>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <div className="yaqut-idcard-desc">
          <p>{summary}</p>
        </div>
      )}

      {/* Atlas Tags */}
      {entry.tg && entry.tg.length > 0 && (
        <div className="yaqut-idcard-tags">
          {entry.tg.map((tag, i) => (
            <span key={i} className="yaqut-tag-badge">{tag}</span>
          ))}
          {detail && detail.tg && detail.tg.filter(t => !entry.tg.includes(t)).map((tag, i) => (
            <span key={`d-${i}`} className="yaqut-tag-badge">{tag}</span>
          ))}
        </div>
      )}

      {/* Alternate names */}
      {entry.an && entry.an.length > 0 && (
        <div className="yaqut-idcard-section">
          <h4 className="yaqut-idcard-section-title">📛 {ty.alternateNames || 'Diğer Adlar'}</h4>
          <div className="yaqut-alt-names" dir="rtl">
            {entry.an.join(' / ')}
            {detail && detail.an && detail.an.filter(a => !entry.an.includes(a)).length > 0 && (
              <span> / {detail.an.filter(a => !entry.an.includes(a)).join(' / ')}</span>
            )}
          </div>
        </div>
      )}

      {/* Historical Events */}
      {detail && detail.ev && detail.ev.length > 0 && (
        <div className="yaqut-idcard-section">
          <h4 className="yaqut-idcard-section-title">📅 {ty.events || 'Tarihî Olaylar'} ({detail.ev.length})</h4>
          <div className="yaqut-events-list">
            {detail.ev.map((ev, i) => (
              <div key={i} className="yaqut-event-item">
                {ev.y && <span className="yaqut-event-year">{ev.y} H</span>}
                <span className="yaqut-event-desc">{ev.d}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notable Persons (from Yaqut) */}
      {detail && detail.np && detail.np.length > 0 && (
        <div className="yaqut-idcard-section">
          <h4 className="yaqut-idcard-section-title">👤 {ty.notablePersons || 'Önemli Kişiler (Yâkût)'} ({detail.np.length})</h4>
          <div className="yaqut-persons-list">
            {detail.np.map((p, i) => (
              <div key={i} className="yaqut-person-item">
                <span className="yaqut-person-name" dir="rtl">{p.na}</span>
                {p.nt && <span className="yaqut-person-tr">{p.nt}</span>}
                <div className="yaqut-person-meta">
                  {p.r && <span className="yaqut-person-role">{p.r}</span>}
                  {p.d && <span className="yaqut-person-death">ö. {p.d} H</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cross-ref persons (from Zirikli) */}
      {xrefTotal > 0 && (
        <div className="yaqut-idcard-section yaqut-xref-section">
          <h4 className="yaqut-idcard-section-title">
            📖 {ty.crossRefPersons || 'Ziriklî Kişileri'} ({xrefTotal})
          </h4>
          <div className="yaqut-xref-list">
            {xrefSlice.map((p, i) => (
              <div key={i} className="yaqut-xref-item">
                <div className="yaqut-xref-name">
                  {isTr ? p.ht : p.he}
                  {p.dia && (
                    <a href={p.dia} target="_blank" rel="noopener noreferrer" className="yaqut-xref-dia-link">↗</a>
                  )}
                </div>
                <div className="yaqut-xref-meta">
                  <span className="yaqut-xref-prof">{isTr ? p.pt : p.pe}</span>
                  {p.dh && <span className="yaqut-xref-death">ö. {p.dh} H / {p.dm}</span>}
                </div>
              </div>
            ))}
          </div>
          {xrefPages > 1 && (
            <div className="yaqut-xref-pager">
              <button disabled={xrefPage === 0} onClick={() => setXrefPage(p => p - 1)}>←</button>
              <span>{xrefPage + 1} / {xrefPages}</span>
              <button disabled={xrefPage >= xrefPages - 1} onClick={() => setXrefPage(p => p + 1)}>→</button>
            </div>
          )}
        </div>
      )}

      {/* Poetry & Quran */}
      {(entry.py > 0 || (detail && detail.qr)) && (
        <div className="yaqut-idcard-section">
          <div className="yaqut-poetry-row">
            {entry.py > 0 && <span className="yaqut-poetry-badge">📜 {entry.py} {isTr ? 'şiir' : 'poems'}</span>}
            {detail && detail.qr && <span className="yaqut-quran-badge">📖 {isTr ? 'Kur\'an ref.' : 'Quran ref.'}</span>}
          </div>
        </div>
      )}

      {/* Ptolemaic coordinates */}
      {detail && detail.ct && (
        <div className="yaqut-idcard-section">
          <h4 className="yaqut-idcard-section-title">🧭 {ty.ptolemaic || 'Batlamyus Koord.'}</h4>
          <div className="yaqut-ptolemaic">
            {detail.ct.longitude_text && <span>Tûl: {detail.ct.longitude_text} ({detail.ct.longitude_approx}°)</span>}
            {detail.ct.latitude_text && <span>Arz: {detail.ct.latitude_text} ({detail.ct.latitude_approx}°)</span>}
          </div>
        </div>
      )}

      {/* Full text */}
      {detail && detail.ft && (
        <div className="yaqut-idcard-section">
          <button className="yaqut-fulltext-toggle" onClick={() => setShowFullText(p => !p)}>
            📜 {showFullText ? (isTr ? 'Metni gizle' : 'Hide text') : (isTr ? 'Orijinal metin' : 'Original text')}
          </button>
          {showFullText && (
            <div className="yaqut-fulltext" dir="rtl">
              {detail.ft}
            </div>
          )}
        </div>
      )}

      {/* Source footer */}
      <div className="yaqut-idcard-source">{ty.source || "Kaynak: Yâkût el-Hamevî, Mu'cemü'l-Büldân"}</div>
    </div>
  );
}
