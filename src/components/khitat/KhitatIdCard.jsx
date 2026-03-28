import T from '../../data/i18n';

/* Status badge */
function StatusBadge({ status, tk }) {
  if (status === 'extant') return <span className="khitat-status-badge extant">{tk.extant || 'Mevcut'}</span>;
  if (status === 'demolished') return <span className="khitat-status-badge demolished">{tk.demolished || 'Yıkılmış'}</span>;
  return <span className="khitat-status-badge unknown">{tk.unknown || 'Bilinmiyor'}</span>;
}

/* Confidence badge */
function ConfBadge({ confidence, tk }) {
  const labels = { high: tk.high || 'Yüksek', approximate: tk.approximate || 'Yaklaşık', low: tk.low || 'Düşük' };
  return <span className={`khitat-conf-badge ${confidence}`}>{labels[confidence] || confidence}</span>;
}

export default function KhitatIdCard({ lang, tk, structure, catMeta, onClose }) {
  const t = T[lang];

  if (!structure) {
    return (
      <div className="khitat-idcard-empty">
        <div className="khitat-idcard-placeholder">
          <span className="khitat-idcard-icon">🏛️</span>
          <p>{tk.noSelection || 'Bir yapı seçin'}</p>
        </div>
      </div>
    );
  }

  const s = structure;
  const meta = catMeta[s.cat] || {};
  const catLabel = lang === 'en' ? (meta.en || s.cat) : (meta.tr || s.cat);

  return (
    <div className="khitat-idcard">
      {/* Close */}
      <button className="khitat-idcard-close" onClick={onClose} aria-label="Close">✕</button>

      {/* Header */}
      <div className="khitat-idcard-header">
        <span className="khitat-idcard-cat-icon" style={{ color: meta.color }}>{meta.icon || '📍'}</span>
        <h3 className="khitat-idcard-name" dir="rtl">{s.ar}</h3>
        <div className="khitat-idcard-cat-row">
          <span className="khitat-idcard-cat-label" style={{ color: meta.color }}>{catLabel}</span>
          {s.sub && s.sub !== s.cat && <span className="khitat-idcard-sub"> · {s.sub}</span>}
        </div>
        <StatusBadge status={s.st} tk={tk} />
      </div>

      {/* Fields */}
      <div className="khitat-idcard-fields">
        {s.ah && (
          <div className="khitat-idcard-row">
            <span className="khitat-idcard-label">📅 {tk.founded || 'Kuruluş'}</span>
            <span className="khitat-idcard-value">{s.ah} H / {s.ce} M</span>
          </div>
        )}
        {s.f_ar && (
          <div className="khitat-idcard-row">
            <span className="khitat-idcard-label">⚒ {tk.founder || 'Kurucu'}</span>
            <span className="khitat-idcard-value" dir="rtl">{s.f_ar}</span>
          </div>
        )}
        {s.dy_tr && (
          <div className="khitat-idcard-row">
            <span className="khitat-idcard-label">👑 {tk.dynasty || 'Hanedan'}</span>
            <span className="khitat-idcard-value">{lang === 'en' ? s.dy_en : s.dy_tr}</span>
          </div>
        )}
        {s.gz && (
          <div className="khitat-idcard-row">
            <span className="khitat-idcard-label">📍 {tk.zone || 'Bölge'}</span>
            <span className="khitat-idcard-value" dir="rtl">{s.gz}</span>
          </div>
        )}
        {s.lat != null && (
          <div className="khitat-idcard-row">
            <span className="khitat-idcard-label">🌐 {tk.coords || 'Koordinat'}</span>
            <span className="khitat-idcard-value">{s.lat}, {s.lon}</span>
          </div>
        )}
        <div className="khitat-idcard-row">
          <span className="khitat-idcard-label">🎯 {tk.confidence || 'Güven'}</span>
          <ConfBadge confidence={s.cf} tk={tk} />
        </div>
        {s.ln && (
          <div className="khitat-idcard-row">
            <span className="khitat-idcard-label">📄 {tk.sourceLine || 'Satır'}</span>
            <span className="khitat-idcard-value khitat-mono">#{s.ln}</span>
          </div>
        )}
      </div>

      {/* Excerpt */}
      {s.ex && (
        <div className="khitat-idcard-excerpt">
          <div className="khitat-idcard-excerpt-label">{tk.excerpt || 'el-Hıṭaṭ Alıntısı'}</div>
          <p className="khitat-idcard-excerpt-text" dir="rtl">{s.ex}</p>
        </div>
      )}

      {/* ID footer */}
      <div className="khitat-idcard-footer">
        <span className="khitat-idcard-id">ID: {s.id}</span>
        <span className="khitat-idcard-gm">{s.gm}</span>
      </div>
    </div>
  );
}
