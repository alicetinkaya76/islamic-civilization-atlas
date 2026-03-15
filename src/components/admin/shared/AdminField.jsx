/**
 * AdminField — Tekil alan bileşeni
 * text, number, textarea, richtext, select, multi-select,
 * boolean, color, readonly, ref, ref-multi, array-coords, trilingual
 * v5.2.0.0
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAdmin } from '../AdminContext';

/* ═══ Ref Autocomplete ═══ */
function RefAutocomplete({ collection, value, onChange, nullable }) {
  const { db, getEntityName } = useAdmin();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const items = db[collection] || [];
  const filtered = query
    ? items.filter(i => {
        const name = (i.tr || i.n || i.en || '').toLowerCase();
        return name.includes(query.toLowerCase()) || String(i.id) === query;
      }).slice(0, 20)
    : items.slice(0, 20);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName = value ? getEntityName(collection, value) : '';

  return (
    <div className="admin-ref-wrap" ref={ref}>
      {value ? (
        <div className="admin-ref-selected">
          <span className="admin-ref-tag">#{value} {displayName}</span>
          <button className="admin-ref-clear" onClick={() => onChange(nullable ? null : 0)}>×</button>
        </div>
      ) : (
        <input
          className="admin-input admin-ref-input"
          placeholder="Ara..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      )}
      {open && !value && (
        <div className="admin-ref-dropdown">
          {filtered.map(item => (
            <button key={item.id} className="admin-ref-option"
              onClick={() => { onChange(item.id); setQuery(''); setOpen(false); }}>
              #{item.id} {item.tr || item.n || item.en || '—'}
            </button>
          ))}
          {filtered.length === 0 && <div className="admin-ref-empty">Sonuç yok</div>}
        </div>
      )}
    </div>
  );
}

/* ═══ Multi-Ref (tag input) ═══ */
function RefMulti({ collection, value, onChange }) {
  const { db, getEntityName } = useAdmin();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const arr = Array.isArray(value) ? value : [];
  const items = db[collection] || [];
  const filtered = query
    ? items.filter(i => {
        if (arr.includes(i.id)) return false;
        const name = (i.tr || i.n || i.en || '').toLowerCase();
        return name.includes(query.toLowerCase()) || String(i.id) === query;
      }).slice(0, 15)
    : items.filter(i => !arr.includes(i.id)).slice(0, 15);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="admin-ref-wrap" ref={ref}>
      <div className="admin-ref-tags">
        {arr.map(id => (
          <span key={id} className="admin-ref-tag">
            #{id} {getEntityName(collection, id)}
            <button className="admin-ref-tag-x" onClick={() => onChange(arr.filter(v => v !== id))}>×</button>
          </span>
        ))}
      </div>
      <input
        className="admin-input admin-ref-input"
        placeholder="Ekle..."
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <div className="admin-ref-dropdown">
          {filtered.map(item => (
            <button key={item.id} className="admin-ref-option"
              onClick={() => { onChange([...arr, item.id]); setQuery(''); }}>
              #{item.id} {item.tr || item.n || item.en || '—'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══ Trilingual Editor ═══ */
function TrilingualField({ fieldKey, item, onChange, type }) {
  const keys = [`${fieldKey}_tr`, `${fieldKey}_en`, `${fieldKey}_ar`];
  const labels = ['TR', 'EN', 'AR'];
  const isRichtext = type === 'richtext';
  const rows = isRichtext ? 6 : 3;

  return (
    <div className="admin-tri-wrap">
      {keys.map((k, i) => {
        const val = item[k] || '';
        const isAr = i === 2;
        const isEmpty = !val;
        return (
          <div key={k} className={`admin-tri-col${isEmpty ? ' empty' : ''}`}>
            <div className="admin-tri-label">
              <span>{labels[i]}</span>
              <span className="admin-tri-count">{val.length}</span>
            </div>
            <textarea
              className={`admin-input admin-textarea${isAr ? ' rtl' : ''}`}
              rows={rows}
              value={val}
              dir={isAr ? 'rtl' : 'ltr'}
              onChange={e => onChange({ [k]: e.target.value })}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ═══ Array Coords Editor ═══ */
function ArrayCoordsField({ value, onChange }) {
  const arr = Array.isArray(value) ? value : [];
  const updatePoint = (idx, coord, val) => {
    const next = arr.map((p, i) => i === idx ? (coord === 0 ? [val, p[1]] : [p[0], val]) : p);
    onChange(next);
  };
  const addPoint = () => onChange([...arr, [0, 0]]);
  const removePoint = (idx) => onChange(arr.filter((_, i) => i !== idx));

  return (
    <div className="admin-coords-list">
      {arr.map((p, i) => (
        <div key={i} className="admin-coords-row">
          <span className="admin-coords-idx">{i + 1}</span>
          <input type="number" className="admin-input admin-input-sm" step="0.01" value={p[0] || 0}
            onChange={e => updatePoint(i, 0, parseFloat(e.target.value) || 0)} placeholder="lat" />
          <input type="number" className="admin-input admin-input-sm" step="0.01" value={p[1] || 0}
            onChange={e => updatePoint(i, 1, parseFloat(e.target.value) || 0)} placeholder="lon" />
          <button className="admin-btn-icon danger" onClick={() => removePoint(i)}>×</button>
        </div>
      ))}
      <button className="admin-btn admin-btn-sm" onClick={addPoint}>+ Nokta Ekle</button>
    </div>
  );
}

/* ═══ Main AdminField ═══ */
export default function AdminField({ field, item, onChange }) {
  const { type, key, label, options, step, trilingual, refCollection, nullable, rtl } = field;

  /* Trilingual fields are handled specially */
  if (trilingual) {
    return (
      <div className="admin-field-group admin-field-trilingual">
        <label className="admin-label">{label}</label>
        <TrilingualField fieldKey={key} item={item} onChange={onChange} type={type} />
      </div>
    );
  }

  const val = item[key];

  let input;
  switch (type) {
    case 'readonly':
      input = <div className="admin-input admin-readonly">{val ?? '—'}</div>;
      break;

    case 'text':
      input = (
        <input className={`admin-input${rtl ? ' rtl' : ''}`} type="text" value={val || ''}
          dir={rtl ? 'rtl' : 'ltr'}
          onChange={e => onChange({ [key]: e.target.value })} />
      );
      break;

    case 'number':
      input = (
        <input className="admin-input" type="number" step={step || 1} value={val ?? ''}
          onChange={e => onChange({ [key]: e.target.value === '' ? null : Number(e.target.value) })} />
      );
      break;

    case 'textarea':
      input = (
        <textarea className={`admin-input admin-textarea${rtl ? ' rtl' : ''}`} rows={3}
          value={val || ''} dir={rtl ? 'rtl' : 'ltr'}
          onChange={e => onChange({ [key]: e.target.value })} />
      );
      break;

    case 'richtext':
      input = (
        <textarea className={`admin-input admin-textarea admin-richtext${rtl ? ' rtl' : ''}`} rows={6}
          value={val || ''} dir={rtl ? 'rtl' : 'ltr'}
          onChange={e => onChange({ [key]: e.target.value })} />
      );
      break;

    case 'select':
      input = (
        <select className="admin-input admin-select" value={val || ''}
          onChange={e => onChange({ [key]: e.target.value })}>
          <option value="">— Seçiniz —</option>
          {(options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
      break;

    case 'boolean':
      input = (
        <label className="admin-checkbox-label">
          <input type="checkbox" checked={!!val}
            onChange={e => onChange({ [key]: e.target.checked })} />
          <span>{val ? 'Evet' : 'Hayır'}</span>
        </label>
      );
      break;

    case 'color':
      input = (
        <div className="admin-color-wrap">
          <input type="color" value={val || '#000000'}
            onChange={e => onChange({ [key]: e.target.value })} />
          <input className="admin-input admin-input-sm" type="text" value={val || ''}
            onChange={e => onChange({ [key]: e.target.value })} />
        </div>
      );
      break;

    case 'ref':
      input = <RefAutocomplete collection={refCollection} value={val} onChange={v => onChange({ [key]: v })} nullable={nullable} />;
      break;

    case 'ref-multi':
      input = <RefMulti collection={refCollection} value={val} onChange={v => onChange({ [key]: v })} />;
      break;

    case 'array-coords':
      input = <ArrayCoordsField value={val} onChange={v => onChange({ [key]: v })} />;
      break;

    default:
      input = (
        <input className="admin-input" type="text" value={val || ''}
          onChange={e => onChange({ [key]: e.target.value })} />
      );
  }

  return (
    <div className={`admin-field-group${field.required ? ' required' : ''}`}>
      <label className="admin-label">
        {label}
        {field.required && <span className="admin-required">*</span>}
      </label>
      {input}
    </div>
  );
}
