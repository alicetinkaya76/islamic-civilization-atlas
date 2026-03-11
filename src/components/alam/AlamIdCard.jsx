import { useMemo } from 'react';
import XREFS from '../../data/alam_xrefs.json';

/* ═══ Normalize xrefs ═══ */
function normalizeXrefs(raw) {
  if (!raw.length) return [];
  const first = raw[0];
  if (Array.isArray(first)) {
    return raw.map(([s, t]) => ({ s, t, r: 'related', src: ['alam'], c: 2 }));
  }
  return raw;
}
const XREFS_NORM = normalizeXrefs(XREFS);

/* ═══ İlişki türü etiket/renk ═══ */
const REL_BADGE = {
  student_of:    { tr: 'Hoca-Talebe', en: 'Teacher-Student', color: '#4fc3f7' },
  influenced_by: { tr: 'Etki',        en: 'Influence',       color: '#81c784' },
  criticism:     { tr: 'Eleştiri',    en: 'Criticism',       color: '#ef5350' },
  commentary:    { tr: 'Şerh',        en: 'Commentary',      color: '#ffb74d' },
  peer:          { tr: 'Akran',       en: 'Peer',            color: '#ce93d8' },
  family:        { tr: 'Aile',        en: 'Family',          color: '#f06292' },
  related:       { tr: 'Ref',         en: 'Ref',             color: '#546e7a' },
};

/* ═══ Format date string: hijri/miladi ═══ */
function formatDate(hVal, mVal, place, ta) {
  const parts = [];
  if (hVal) parts.push(`${hVal} ${ta.hijri}`);
  if (mVal) parts.push(`${mVal} ${ta.miladi}`);
  const dateStr = parts.join(' / ');
  if (place) return `${dateStr} — ${place}`;
  return dateStr;
}

export default function AlamIdCard({ lang, ta, bio, detail, onClose, allData, onNavigate }) {
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

  /* İlişkiler: bu kişinin bağlı olduğu tüm kenarları bul */
  const relations = useMemo(() => {
    if (!bio || !allData) return null;
    const byId = {};
    allData.forEach(b => { byId[b.id] = b; });

    const teachers = [], students = [], influences = [], peers = [], others = [];

    XREFS_NORM.forEach(edge => {
      const { s, t, r, src, c } = edge;
      let otherId = null;
      let direction = null;

      if (s === bio.id) { otherId = t; direction = 'out'; }
      else if (t === bio.id) { otherId = s; direction = 'in'; }

      if (!otherId || !byId[otherId]) return;

      const other = byId[otherId];
      const entry = {
        id: otherId,
        name: isTr ? other.ht : other.he,
        arabic: other.h,
        death: other.md,
        rel: r,
        src: src || ['alam'],
        c: c || 2,
        direction,
      };

      if (r === 'student_of') {
        if (direction === 'out') teachers.push(entry);   // bu kişi → hoca
        else students.push(entry);                        // talebe → bu kişi
      } else if (r === 'influenced_by') {
        influences.push(entry);
      } else if (r === 'peer') {
        peers.push(entry);
      } else {
        others.push(entry);
      }
    });

    // Güven skoruna göre sırala, max 8 göster
    const sort = arr => arr.sort((a, b) => b.c - a.c).slice(0, 8);
    return {
      teachers: sort(teachers),
      students: sort(students),
      influences: sort(influences),
      peers: sort(peers),
      others: sort(others),
      total: teachers.length + students.length + influences.length + peers.length + others.length,
    };
  }, [bio, allData, isTr]);

  const RelList = ({ title, items, icon }) => {
    if (!items || items.length === 0) return null;
    return (
      <div style={{ marginBottom: 8 }}>
        <h5 style={{ fontSize: 11, color: '#90a4ae', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>
          {icon} {title}
        </h5>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map(p => (
            <div key={`${p.id}-${p.rel}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '3px 6px', background: '#1e2a44', borderRadius: 6, cursor: onNavigate ? 'pointer' : 'default',
                borderLeft: `3px solid ${REL_BADGE[p.rel]?.color || '#546e7a'}`
              }}
              onClick={() => onNavigate && onNavigate(p.id)}
            >
              <div>
                <span style={{ fontSize: 12, color: '#c4b89a' }}>{p.name}</span>
                <span dir="rtl" style={{ fontSize: 10, color: '#6b8096', marginLeft: 4 }}>{p.arabic}</span>
              </div>
              <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                {p.src.map(s => (
                  <span key={s} style={{
                    fontSize: 9, padding: '1px 4px', borderRadius: 3,
                    background: '#0d1623', color: '#90a4ae', fontFamily: 'monospace'
                  }}>{s[0].toUpperCase()}</span>
                ))}
                {p.death && <span style={{ fontSize: 10, color: '#546e7a' }}>†{p.death}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="alam-idcard">
      {/* Close button */}
      <button className="alam-idcard-close" onClick={onClose} aria-label="Close">✕</button>

      {/* Header */}
      <div className="alam-idcard-header">
        <h3 className="alam-idcard-h1">{heading1}</h3>
        <p className="alam-idcard-h2">{heading2}</p>
        <p className="alam-idcard-arabic" dir="rtl">{bio.h}</p>
        {bio.g === 'F' && <span className="alam-idcard-gender-badge">{lang === 'tr' ? 'Kadın' : 'Female'}</span>}
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

      {/* İlişkiler bölümü */}
      {relations && relations.total > 0 && (
        <div className="alam-idcard-works" style={{ marginTop: 8 }}>
          <h4 className="alam-idcard-section-title">
            🕸 {isTr ? `İlişkiler (${relations.total})` : `Relationships (${relations.total})`}
          </h4>
          <RelList
            title={isTr ? 'Hocaları' : 'Teachers'}
            items={relations.teachers}
            icon="→"
          />
          <RelList
            title={isTr ? 'Talebeleri' : 'Students'}
            items={relations.students}
            icon="←"
          />
          <RelList
            title={isTr ? 'Etkilendikleri' : 'Influenced by'}
            items={relations.influences}
            icon="💡"
          />
          <RelList
            title={isTr ? 'Akranlar' : 'Peers'}
            items={relations.peers}
            icon="⟷"
          />
          <RelList
            title={isTr ? 'Diğer' : 'Other'}
            items={relations.others}
            icon="·"
          />
          {onNavigate && (
            <p style={{ fontSize: 10, color: '#546e7a', marginTop: 4 }}>
              {isTr ? '↑ Tıkla → kişiye git' : '↑ Click → navigate to person'}
            </p>
          )}
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
