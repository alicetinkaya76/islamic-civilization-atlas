/**
 * CausalEditor — Nedensellik Bağı Görsel Editörü
 * v5.4.0.0
 */
import { useState, useMemo, useCallback } from 'react';
import { useAdmin } from '../AdminContext';
import { SCHEMAS } from '../schemas/entitySchemas';

const LINK_TYPES = [
  'succession','conquest','division','patronage','cultural','expansion',
  'foundation','influence','rivalry','alliance','decline','crisis',
  'collapse','trigger','defeat','reform','creation','economic',
  'diplomatic','control','context','coup','delegation','flight'
];

const ENTITY_TYPES = ['dynasty','battle','event','scholar','monument','trade_route','diplomacy'];

const LINK_COLORS = {
  succession: '#4ade80', conquest: '#f87171', division: '#fbbf24',
  patronage: '#60a5fa', cultural: '#c084fc', expansion: '#34d399',
  foundation: '#22d3ee', influence: '#a78bfa', rivalry: '#fb923c',
  alliance: '#2dd4bf', decline: '#ef4444', crisis: '#dc2626',
  collapse: '#991b1b', trigger: '#f59e0b', defeat: '#b91c1c',
  reform: '#10b981', creation: '#06b6d4', economic: '#eab308',
  diplomatic: '#8b5cf6', control: '#6366f1', context: '#94a3b8',
  coup: '#e11d48', delegation: '#0ea5e9', flight: '#78716c',
};

function getEntityLabel(db, type, id) {
  const col = db[type === 'trade_route' ? 'routes' : type === 'dynasty' ? 'dynasties' :
    type === 'battle' ? 'battles' : type === 'event' ? 'events' :
    type === 'scholar' ? 'scholars' : type === 'monument' ? 'monuments' :
    type === 'diplomacy' ? 'diplomacy' : type];
  if (!Array.isArray(col)) return `#${id}`;
  const item = col.find(i => i.id === id);
  return item ? (item.tr || item.n || item.en || `#${id}`) : `#${id}`;
}

export default function CausalEditor() {
  const { db, updateEntityByIndex, addEntityRaw, deleteEntityByIndex, user } = useAdmin();
  const causalLinks = db.causal || [];

  const [filter, setFilter] = useState({ entityType: '', linkType: '', search: '' });
  const [editIdx, setEditIdx] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ st: 'dynasty', si: '', tt: 'dynasty', ti: '', lt: 'succession', dtr: '', den: '', dar: '' });

  /* Filtered links */
  const filtered = useMemo(() => {
    return causalLinks.filter((link, idx) => {
      if (filter.entityType && link.st !== filter.entityType && link.tt !== filter.entityType) return false;
      if (filter.linkType && link.lt !== filter.linkType) return false;
      if (filter.search) {
        const q = filter.search.toLowerCase();
        const srcLabel = getEntityLabel(db, link.st, link.si).toLowerCase();
        const tgtLabel = getEntityLabel(db, link.tt, link.ti).toLowerCase();
        if (!srcLabel.includes(q) && !tgtLabel.includes(q) &&
            !(link.dtr || '').toLowerCase().includes(q) &&
            !(link.den || '').toLowerCase().includes(q)) return false;
      }
      return true;
    }).map((link, i) => ({ ...link, _origIdx: causalLinks.indexOf(link) }));
  }, [causalLinks, filter, db]);

  const handleEdit = useCallback((origIdx) => {
    const link = causalLinks[origIdx];
    setFormData({ ...link });
    setEditIdx(origIdx);
    setShowForm(true);
  }, [causalLinks]);

  const handleNew = () => {
    setFormData({ st: 'dynasty', si: '', tt: 'dynasty', ti: '', lt: 'succession', dtr: '', den: '', dar: '' });
    setEditIdx(null);
    setShowForm(true);
  };

  const handleSave = () => {
    const data = { ...formData, si: Number(formData.si) || 0, ti: Number(formData.ti) || 0 };
    if (editIdx != null) {
      updateEntityByIndex('causal', editIdx, data);
    } else {
      const newId = causalLinks.length > 0 ? Math.max(...causalLinks.map(l => l.id || 0)) + 1 : 1;
      addEntityRaw('causal', { ...data, id: newId });
    }
    setShowForm(false);
    setEditIdx(null);
  };

  const handleDelete = (origIdx) => {
    if (!window.confirm('Bu bağlantıyı silmek istediğinize emin misiniz?')) return;
    deleteEntityByIndex('causal', origIdx);
  };

  /* Entity autocomplete helper */
  const EntityPicker = ({ type, value, onChange }) => {
    const [q, setQ] = useState('');
    const [open, setOpen] = useState(false);
    const colName = type === 'trade_route' ? 'routes' : type === 'dynasty' ? 'dynasties' :
      type === 'battle' ? 'battles' : type === 'event' ? 'events' :
      type === 'scholar' ? 'scholars' : type === 'monument' ? 'monuments' : type;
    const items = db[colName] || [];
    const found = q ? items.filter(i =>
      (i.tr || i.n || i.en || '').toLowerCase().includes(q.toLowerCase()) ||
      String(i.id) === q
    ).slice(0, 15) : items.slice(0, 15);

    const display = value ? getEntityLabel(db, type, Number(value)) : '';

    return (
      <div className="admin-ref-wrap" style={{ position: 'relative' }}>
        {value ? (
          <div className="admin-ref-selected">
            <span className="admin-ref-tag">#{value} {display}</span>
            <button className="admin-ref-clear" onClick={() => onChange('')}>×</button>
          </div>
        ) : (
          <input className="admin-input" placeholder={`${type} ara...`}
            value={q} onChange={e => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 200)} />
        )}
        {open && !value && (
          <div className="admin-ref-dropdown">
            {found.map(item => (
              <button key={item.id} className="admin-ref-option"
                onMouseDown={() => { onChange(String(item.id)); setQ(''); setOpen(false); }}>
                #{item.id} {item.tr || item.n || item.en || '—'}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="admin-causal-editor">
      <div className="admin-entity-header">
        <h2 className="admin-section-title">🔀 Nedensellik Bağları Editörü</h2>
        <button className="admin-btn admin-btn-primary" onClick={handleNew}>+ Yeni Bağlantı</button>
      </div>

      {/* Filters */}
      <div className="admin-causal-filters">
        <input className="admin-input" style={{ maxWidth: 200 }}
          placeholder="Ara..." value={filter.search}
          onChange={e => setFilter(p => ({ ...p, search: e.target.value }))} />
        <select className="admin-input admin-select" style={{ maxWidth: 160 }}
          value={filter.entityType} onChange={e => setFilter(p => ({ ...p, entityType: e.target.value }))}>
          <option value="">Tüm Entity Tipleri</option>
          {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="admin-input admin-select" style={{ maxWidth: 160 }}
          value={filter.linkType} onChange={e => setFilter(p => ({ ...p, linkType: e.target.value }))}>
          <option value="">Tüm Bağlantı Tipleri</option>
          {LINK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="admin-table-count">{filtered.length} / {causalLinks.length}</span>
      </div>

      {/* Form (slide panel) */}
      {showForm && (
        <div className="admin-causal-form-card">
          <div className="admin-form-header">
            <h3 className="admin-form-title">{editIdx != null ? 'Bağlantı Düzenle' : 'Yeni Bağlantı'}</h3>
            <button className="admin-btn admin-btn-ghost" onClick={() => setShowForm(false)}>✕</button>
          </div>
          <div className="admin-causal-form-grid">
            <div className="admin-field-group">
              <label className="admin-label">Kaynak Tipi</label>
              <select className="admin-input admin-select" value={formData.st}
                onChange={e => setFormData(p => ({ ...p, st: e.target.value, si: '' }))}>
                {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="admin-field-group">
              <label className="admin-label">Kaynak Entity</label>
              <EntityPicker type={formData.st} value={formData.si}
                onChange={v => setFormData(p => ({ ...p, si: v }))} />
            </div>
            <div className="admin-field-group">
              <label className="admin-label">Hedef Tipi</label>
              <select className="admin-input admin-select" value={formData.tt}
                onChange={e => setFormData(p => ({ ...p, tt: e.target.value, ti: '' }))}>
                {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="admin-field-group">
              <label className="admin-label">Hedef Entity</label>
              <EntityPicker type={formData.tt} value={formData.ti}
                onChange={v => setFormData(p => ({ ...p, ti: v }))} />
            </div>
            <div className="admin-field-group" style={{ gridColumn: '1 / -1' }}>
              <label className="admin-label">Bağlantı Tipi</label>
              <select className="admin-input admin-select" value={formData.lt}
                onChange={e => setFormData(p => ({ ...p, lt: e.target.value }))}>
                {LINK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="admin-field-group">
              <label className="admin-label">Açıklama (TR)</label>
              <input className="admin-input" value={formData.dtr || ''}
                onChange={e => setFormData(p => ({ ...p, dtr: e.target.value }))} />
            </div>
            <div className="admin-field-group">
              <label className="admin-label">Description (EN)</label>
              <input className="admin-input" value={formData.den || ''}
                onChange={e => setFormData(p => ({ ...p, den: e.target.value }))} />
            </div>
            <div className="admin-field-group" style={{ gridColumn: '1 / -1' }}>
              <label className="admin-label">الوصف (AR)</label>
              <input className="admin-input rtl" dir="rtl" value={formData.dar || ''}
                onChange={e => setFormData(p => ({ ...p, dar: e.target.value }))} />
            </div>
          </div>
          <div className="admin-form-actions" style={{ marginTop: 12 }}>
            <button className="admin-btn admin-btn-primary" onClick={handleSave}>
              {editIdx != null ? '💾 Güncelle' : '➕ Ekle'}
            </button>
            <button className="admin-btn" onClick={() => setShowForm(false)}>İptal</button>
          </div>
        </div>
      )}

      {/* Link list */}
      <div className="admin-causal-list">
        {filtered.map((link, i) => {
          const srcLabel = getEntityLabel(db, link.st, link.si);
          const tgtLabel = getEntityLabel(db, link.tt, link.ti);
          const color = LINK_COLORS[link.lt] || '#94a3b8';
          return (
            <div key={link._origIdx} className="admin-causal-item">
              <div className="admin-causal-item-main">
                <span className="admin-causal-entity-tag">{link.st} #{link.si}</span>
                <span className="admin-causal-entity-name">{srcLabel}</span>
                <span className="admin-causal-arrow" style={{ color }}>→</span>
                <span className="admin-causal-link-badge" style={{ background: color + '22', color, borderColor: color }}>
                  {link.lt}
                </span>
                <span className="admin-causal-arrow" style={{ color }}>→</span>
                <span className="admin-causal-entity-tag">{link.tt} #{link.ti}</span>
                <span className="admin-causal-entity-name">{tgtLabel}</span>
              </div>
              {(link.dtr || link.den) && (
                <div className="admin-causal-item-desc">
                  {link.dtr && <span>{link.dtr}</span>}
                  {link.den && <span className="admin-text2"> — {link.den}</span>}
                </div>
              )}
              <div className="admin-causal-item-actions">
                <button className="admin-btn-icon" onClick={() => handleEdit(link._origIdx)} title="Düzenle">✏️</button>
                {user?.role === 'admin' && (
                  <button className="admin-btn-icon danger" onClick={() => handleDelete(link._origIdx)} title="Sil">🗑</button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="admin-empty" style={{ padding: 24 }}>
            {causalLinks.length === 0 ? 'Henüz nedensellik bağı yok.' : 'Filtreye uygun sonuç yok.'}
          </div>
        )}
      </div>
    </div>
  );
}
