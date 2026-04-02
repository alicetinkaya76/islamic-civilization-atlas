import { useState } from 'react';

/**
 * SalibiyyatCastles — Ported from standalone CastlesPage.jsx
 * Castle grid with type filters + detail modal.
 *
 * Props:
 *   castles  — castles[] array
 *   tr       — i18n object (SAL_T)
 *   lang     — 'tr'|'en'|'ar'
 *   parseOwnership — optional fn from SalibiyyatIdCard (pass if available)
 */
export default function SalibiyyatCastles({ castles = [], tr = {}, lang = 'tr' }) {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  // Field accessors (support both short & full)
  const getName = (c, key) => c[key] || c[{name_en:'ne',name_ar:'na',name_tr:'nt'}[key]];
  const getImg = (c) => c.image_url || c.img;
  const getType = (c) => c.type || c.tp;
  const getState = (c) => c.crusader_state || c.st;
  const getUnesco = (c) => c.unesco || c.un;
  const getDesc = (c) => {
    if (lang === 'en') return c.description_en || c.description_tr || c.dt;
    if (lang === 'ar') return c.description_ar || c.description_tr || c.dt;
    return c.description_tr || c.dt;
  };
  const getOwn = (c) => c.ownership_history || c.own;

  const types = [...new Set(castles.map(c => getType(c)).filter(Boolean))];
  const filtered = filter === 'all' ? castles : castles.filter(c => getType(c) === filter);

  const cp = tr.castles_page || {};

  return (
    <div className="sal-subtab-container">
      {/* Header */}
      <div className="sal-subtab-header sal-fade-in">
        <h2 className="sal-subtab-title">{cp.title || 'Kaleler'}</h2>
        <p className="sal-subtab-title-ar">القلاع الصليبية</p>
        <p className="sal-subtab-desc">
          {cp.subtitle || '24 önemli kale — fotoğraflar, el değiştirme kronolojisi ve üç dilli isimlerle.'}
        </p>
        <div className="sal-gold-line" style={{ width: 80 }} />
      </div>

      {/* Filters */}
      <div className="sal-filter-tags sal-fade-in" style={{ marginBottom: 24 }}>
        <button
          onClick={() => setFilter('all')}
          className={`sal-tag sal-tag--btn ${filter === 'all' ? 'sal-tag--active' : ''}`}
        >
          {cp.all || 'Tümü'} ({castles.length})
        </button>
        {types.map(t => {
          const cnt = castles.filter(c => getType(c) === t).length;
          return (
            <button key={t} onClick={() => setFilter(t)}
              className={`sal-tag sal-tag--btn ${filter === t ? 'sal-tag--active' : ''}`}>
              {t.replace(/_/g, ' ')} ({cnt})
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="sal-castles-grid">
        {filtered.map((c, i) => {
          const img = getImg(c);
          return (
            <div key={c.id} className="sal-castle-card sal-fade-in"
              style={{ animationDelay: `${i * 40}ms` }}
              onClick={() => setSelected(c)}>
              <div className="sal-castle-card__img">
                {img ? (
                  <img src={img} alt={getName(c, 'name_en')} loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={e => { e.target.onerror = null; e.target.parentNode.innerHTML = '<div class="sal-castle-card__placeholder">🏰</div>'; }} />
                ) : (
                  <div className="sal-castle-card__placeholder">🏰</div>
                )}
                {getUnesco(c) && <div className="sal-castle-card__badge">UNESCO</div>}
              </div>
              <div className="sal-castle-card__info">
                <h3 className="sal-castle-card__name">{getName(c, 'name_tr')}</h3>
                <div className="sal-castle-card__ar" dir="rtl">{getName(c, 'name_ar')}</div>
                <p className="sal-castle-card__en">{getName(c, 'name_en')}</p>
                {getState(c) && <span className="sal-tag" style={{ fontSize: '0.6rem', marginTop: 8 }}>{getState(c)}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {selected && (
        <div className="sal-modal-overlay" onClick={() => setSelected(null)}>
          <div className="sal-modal sal-fade-in" onClick={e => e.stopPropagation()}>
            {getImg(selected) && (
              <div className="sal-modal__img">
                <img src={getImg(selected)} alt={getName(selected, 'name_en')}
                  referrerPolicy="no-referrer"
                  onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }} />
              </div>
            )}
            <div className="sal-modal__body">
              <div className="sal-modal__header">
                <div>
                  <h2 className="sal-modal__title">{getName(selected, 'name_tr')}</h2>
                  <p className="sal-modal__sub">{getName(selected, 'name_en')}</p>
                </div>
                <div className="sal-modal__ar" dir="rtl">{getName(selected, 'name_ar')}</div>
              </div>

              <div className="sal-filter-tags" style={{ marginBottom: 16 }}>
                {getUnesco(selected) && <span className="sal-tag" style={{ borderColor: '#f39c12', color: '#f39c12' }}>UNESCO</span>}
                {getType(selected) && <span className="sal-tag">{getType(selected).replace(/_/g, ' ')}</span>}
                {getState(selected) && <span className="sal-tag">{getState(selected)}</span>}
              </div>

              {getDesc(selected) && <p className="sal-modal__desc">{getDesc(selected)}</p>}

              {getOwn(selected) && (
                <div className="sal-glass-card" style={{ padding: 16, marginBottom: 16 }}>
                  <h4 className="sal-filter-label">El Değiştirme Kronolojisi</h4>
                  <p className="sal-modal__desc">{getOwn(selected)}</p>
                </div>
              )}

              <button className="sal-modal__close-btn" onClick={() => setSelected(null)}>
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
