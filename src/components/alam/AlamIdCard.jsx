import { useMemo, useState } from 'react';
import XREFS from '../../data/alam_xrefs.json';
import { hn, dn } from '../../data/i18n-utils';
import T from '../../data/i18n';

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
  const t = T[lang];
  const [worksExpanded, setWorksExpanded] = useState(false);
  const [relExpanded, setRelExpanded] = useState(true);
  const [placesExpanded, setPlacesExpanded] = useState(false);

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
  const heading1 = hn(bio, lang);
  const heading2 = lang === "tr" ? bio.he : bio.ht;
  const fullName = detail ? (lang === "tr" ? detail.nt : detail.ne) : (hn(bio, lang));
  const desc = detail ? (dn(detail, lang)) : (dn(bio, lang));
  const prof = lang === "tr" ? bio.pt : bio.pe;
  const nisbe = detail ? (lang === "tr" ? detail.n2 : detail.ne2) : '';
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
        name: hn(other, lang),
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
  }, [bio, allData, lang === "tr"]);

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
        {bio.g === 'F' && <span className="alam-idcard-gender-badge">{t.alam.statsFemale}</span>}
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

      {/* İlişkiler bölümü — collapsible */}
      {relations && relations.total > 0 && (
        <div className="alam-idcard-works" style={{ marginTop: 8 }}>
          <button className="alam-section-toggle" onClick={() => setRelExpanded(p => !p)}
            aria-expanded={relExpanded}>
            🕸 {lang === "tr" ? `İlişkiler (${relations.total})` : `Relationships (${relations.total})`}
            <span className="alam-toggle-arrow">{relExpanded ? '▾' : '▸'}</span>
          </button>
          <div className={`alam-collapsible${relExpanded ? ' expanded' : ' collapsed'}`}>
          <RelList
            title={t.alam.idTeachers}
            items={relations.teachers}
            icon="→"
          />
          <RelList
            title={t.alam.idStudents}
            items={relations.students}
            icon="←"
          />
          <RelList
            title={t.alam.idInfluencedBy}
            items={relations.influences}
            icon="💡"
          />
          <RelList
            title={t.alam.idPeers}
            items={relations.peers}
            icon="⟷"
          />
          <RelList
            title={t.alam.idOther}
            items={relations.others}
            icon="·"
          />
          {onNavigate && (
            <p style={{ fontSize: 10, color: '#546e7a', marginTop: 4 }}>
              {t.alam.idClickPerson}
            </p>
          )}
          </div>
        </div>
      )}

      {/* Works — collapsible */}
      {works && works.length > 0 && (
        <div className="alam-idcard-works">
          <button className="alam-section-toggle" onClick={() => setWorksExpanded(p => !p)}
            aria-expanded={worksExpanded}>
            📚 {ta.works} ({works.length})
            <span className="alam-toggle-arrow">{worksExpanded ? '▾' : '▸'}</span>
          </button>
          <ul className={`alam-works-list alam-collapsible${worksExpanded ? ' expanded' : ' collapsed'}`}>
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

      {/* Multi-coordinates — collapsible */}
      {multiCoords && multiCoords.length > 1 && (
        <div className="alam-idcard-places">
          <button className="alam-section-toggle" onClick={() => setPlacesExpanded(p => !p)}
            aria-expanded={placesExpanded}>
            📍 {t.alam.idPlaces}
            <span className="alam-toggle-arrow">{placesExpanded ? '▾' : '▸'}</span>
          </button>
          <div className={`alam-places-list alam-collapsible${placesExpanded ? ' expanded' : ''}`}>
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

      {/* Navigate to DİA tab internally */}
      {bio.ds && (
        <button className="alam-dia-link" style={{ background:'#1a3a2a', border:'1px solid #1a6b5a44', cursor:'pointer', marginTop:4 }}
          onClick={() => { window.location.hash = `dia/${bio.ds}`; }}>
          📚 {ta.diaBrowse || "DİA Sekmesinde Aç"}
        </button>
      )}

      {/* Source footer */}
      <div className="alam-idcard-source">{ta.source}</div>
    </div>
  );
}
