import { useMemo } from 'react';
import { FIELD_COLORS } from './DiaSidebar';

function fmtDate(h, m, place) {
  const parts = [];
  if (h) parts.push(`${h} H`);
  if (m) parts.push(`${m} M`);
  const ds = parts.join(' / ');
  return place ? `${ds} — ${place}` : ds;
}

const ACTION_ICONS = { travel_to: '→', stayed_at: '⊙', born_at: '🌱', died_at: '🕊' };

export default function DiaIdCard({ lang, td, bio, works, relations, lookup, travel, xref, onClose, onNavigate, onNavigateAlam }) {
  if (!bio) {
    return (
      <div className="dia-idcard-empty">
        <div className="dia-idcard-placeholder">
          <span className="dia-idcard-icon">📚</span>
          <p>{td.noSelection || 'Bir âlim seçin'}</p>
        </div>
      </div>
    );
  }

  const scholarWorks = useMemo(() => works?.[bio.id] || [], [works, bio.id]);

  const scholarTravel = useMemo(() => travel?.[bio.id] || [], [travel, bio.id]);

  const { teachers, students, contemporaries } = useMemo(() => {
    if (!relations) return { teachers: [], students: [], contemporaries: [] };
    const ts = [], st = [], co = [];
    relations.ts.forEach(([teacher, student, count]) => {
      if (student === bio.id && lookup[teacher]) ts.push({ ...lookup[teacher], _mc: count });
      if (teacher === bio.id && lookup[student]) st.push({ ...lookup[student], _mc: count });
    });
    relations.co.forEach(([a, b, count]) => {
      if (a === bio.id && lookup[b]) co.push({ ...lookup[b], _mc: count });
      else if (b === bio.id && lookup[a]) co.push({ ...lookup[a], _mc: count });
    });
    return {
      teachers: ts.sort((a, b) => (b._mc || 0) - (a._mc || 0)),
      students: st.sort((a, b) => (b._mc || 0) - (a._mc || 0)),
      contemporaries: co.sort((a, b) => (b._mc || 0) - (a._mc || 0)),
    };
  }, [relations, bio.id, lookup]);

  /* el-A'lâm cross-reference */
  const alamIds = useMemo(() => {
    if (!xref) return [];
    return xref.dia_to_alam?.[bio.id] || [];
  }, [xref, bio.id]);

  const diaUrl = `https://islamansiklopedisi.org.tr/${bio.dia || bio.id}`;
  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#dia/${bio.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
  };

  return (
    <div className="dia-idcard">
      <button className="dia-idcard-close" onClick={onClose} aria-label="Close">✕</button>

      <div className="dia-idcard-header">
        <h3 className="dia-idcard-title">{bio.t}</h3>
        {bio.ar && <div className="dia-idcard-arabic" dir="rtl">{bio.ar}</div>}
        {bio.fn && <div className="dia-idcard-fullname">{bio.fn}</div>}
      </div>

      {bio.ds && <p className="dia-idcard-desc">{bio.ds}</p>}

      {/* Dates */}
      <div className="dia-idcard-section">
        <div className="dia-idcard-label">{td.dates || 'Tarihler'}</div>
        {(bio.bh || bio.bc) && <div className="dia-idcard-row"><span className="dia-idcard-icon-sm">🌱</span>{fmtDate(bio.bh, bio.bc, bio.bp)}</div>}
        {(bio.dh || bio.dc) && <div className="dia-idcard-row"><span className="dia-idcard-icon-sm">🕊</span>{fmtDate(bio.dh, bio.dc, bio.dp)}</div>}
      </div>

      {/* Madhab + Aqidah */}
      {(bio.mz || bio.aq) && (
        <div className="dia-idcard-section">
          <div className="dia-idcard-badges">
            {bio.mz && <span className="dia-badge dia-badge-madhab">{bio.mz}</span>}
            {bio.aq && <span className="dia-badge dia-badge-aqidah">{bio.aq}</span>}
          </div>
        </div>
      )}

      {/* Fields */}
      {bio.fl?.length > 0 && (
        <div className="dia-idcard-section">
          <div className="dia-idcard-label">{td.fieldsLabel || 'İlim Dalları'}</div>
          <div className="dia-idcard-badges">
            {bio.fl.map(f => <span key={f} className="dia-badge" style={{ background: FIELD_COLORS[f] || '#546e7a' }}>{f}</span>)}
          </div>
        </div>
      )}

      {/* Nisbe */}
      {bio.ni && <div className="dia-idcard-section"><div className="dia-idcard-label">{td.nisbe || 'Nisbe'}</div><div className="dia-idcard-text">{bio.ni}</div></div>}

      {/* Importance */}
      {bio.is && (
        <div className="dia-idcard-section">
          <div className="dia-idcard-label">{td.importance || 'Önem Skoru'}</div>
          <div className="dia-importance-meter">
            <div className="dia-importance-fill" style={{ width: `${Math.min(bio.is, 100)}%` }} />
            <span className="dia-importance-value">{bio.is}</span>
          </div>
        </div>
      )}

      {/* Travel chain */}
      {scholarTravel.length > 0 && (
        <div className="dia-idcard-section">
          <div className="dia-idcard-label">🧭 {td.travelChain || 'Seyahat Zinciri'} ({scholarTravel.length})</div>
          <div className="dia-travel-chain">
            {scholarTravel.map((t, i) => (
              <span key={i} className="dia-travel-step">
                <span className="dia-travel-action">{ACTION_ICONS[t.a] || '•'}</span>
                <span className="dia-travel-place">{t.p}</span>
                {i < scholarTravel.length - 1 && <span className="dia-travel-arrow">→</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Works */}
      {scholarWorks.length > 0 && (
        <div className="dia-idcard-section">
          <div className="dia-idcard-label">📚 {td.works || 'Eserleri'} ({scholarWorks.length})</div>
          <ul className="dia-works-list">
            {scholarWorks.slice(0, 20).map((w, i) => <li key={i} className="dia-work-item">{w}</li>)}
            {scholarWorks.length > 20 && <li className="dia-work-more">+{scholarWorks.length - 20} {td.more || 'daha'}</li>}
          </ul>
        </div>
      )}

      {/* Teachers */}
      {teachers.length > 0 && (
        <div className="dia-idcard-section">
          <div className="dia-idcard-label">🎓 {td.teachers || 'Hocaları'} ({teachers.length})</div>
          <div className="dia-rel-list">
            {teachers.slice(0, 10).map(r => (
              <button key={r.id} className="dia-rel-chip dia-rel-teacher" onClick={() => onNavigate(r.id)}>
                {r.t} {r.dc ? `(ö.${r.dc})` : ''}</button>
            ))}
            {teachers.length > 10 && <span className="dia-rel-more">+{teachers.length - 10}</span>}
          </div>
        </div>
      )}

      {/* Students */}
      {students.length > 0 && (
        <div className="dia-idcard-section">
          <div className="dia-idcard-label">📖 {td.students || 'Talebeleri'} ({students.length})</div>
          <div className="dia-rel-list">
            {students.slice(0, 10).map(r => (
              <button key={r.id} className="dia-rel-chip dia-rel-student" onClick={() => onNavigate(r.id)}>
                {r.t} {r.dc ? `(ö.${r.dc})` : ''}</button>
            ))}
            {students.length > 10 && <span className="dia-rel-more">+{students.length - 10}</span>}
          </div>
        </div>
      )}

      {/* Contemporaries */}
      {contemporaries.length > 0 && (
        <div className="dia-idcard-section">
          <div className="dia-idcard-label">🤝 {td.contemporaries || 'Muâsırları'} ({contemporaries.length})</div>
          <div className="dia-rel-list">
            {contemporaries.slice(0, 8).map(r => (
              <button key={r.id} className="dia-rel-chip dia-rel-contemp" onClick={() => onNavigate(r.id)}>
                {r.t} {r.dc ? `(ö.${r.dc})` : ''}</button>
            ))}
            {contemporaries.length > 8 && <span className="dia-rel-more">+{contemporaries.length - 8}</span>}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="dia-idcard-actions">
        <a href={diaUrl} target="_blank" rel="noopener noreferrer" className="dia-btn dia-btn-primary">
          📚 {td.viewDia || "DİA'da Görüntüle"}</a>
        <button className="dia-btn dia-btn-secondary" onClick={handleShare}>🔗 {td.share || 'Paylaş'}</button>
      </div>

      {/* Cross-ref to el-A'lâm */}
      {alamIds.length > 0 && (
        <div className="dia-idcard-xref">
          <button className="dia-btn dia-btn-xref" onClick={() => onNavigateAlam(alamIds[0])}>
            📖 {td.viewAlam || "el-A'lâm'da Görüntüle"}</button>
        </div>
      )}
    </div>
  );
}
