/**
 * EntityForm — Şemadan dinamik form üretimi
 * v5.2.0.0
 */
import { useState, useEffect } from 'react';
import AdminField from '../shared/AdminField';

export default function EntityForm({ schema, item, onSave, onCancel, isNew }) {
  const [draft, setDraft] = useState(() => ({ ...item }));

  useEffect(() => {
    setDraft({ ...item });
  }, [item]);

  const handleChange = (updates) => {
    setDraft(prev => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    /* Validate required fields */
    const missing = schema.fields
      .filter(f => f.required && !draft[f.key] && f.type !== 'readonly')
      .map(f => f.label);
    if (missing.length > 0) {
      alert('Zorunlu alanlar eksik: ' + missing.join(', '));
      return;
    }
    onSave(draft);
  };

  return (
    <div className="admin-entity-form">
      <div className="admin-form-header">
        <h3 className="admin-form-title">
          {isNew ? '➕ Yeni Kayıt' : `✏️ #${draft.id || '—'} Düzenle`}
        </h3>
        <div className="admin-form-actions">
          <button className="admin-btn admin-btn-primary" onClick={handleSave}>💾 Kaydet</button>
          <button className="admin-btn admin-btn-ghost" onClick={onCancel}>İptal</button>
        </div>
      </div>
      <div className="admin-form-body">
        {schema.fields.map(field => (
          <AdminField key={field.key} field={field} item={draft} onChange={handleChange} />
        ))}
      </div>
    </div>
  );
}
