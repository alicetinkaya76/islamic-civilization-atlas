/**
 * I18nEditor — UI metinleri ağaç görünümü düzenleyici
 * v5.2.0.0
 */
import { useState, useCallback } from 'react';
import { useAdmin } from '../AdminContext';

function I18nNode({ path, obj, onUpdate, search, showMissing, depth = 0 }) {
  const [open, setOpen] = useState(depth < 2);

  if (typeof obj !== 'object' || obj === null) return null;

  const keys = Object.keys(obj);
  const isLeaf = keys.length > 0 && typeof obj[keys[0]] !== 'object';

  /* For leaf nodes in the 3-lang structure: each key is a lang */
  /* But i18n structure is T.tr.xxx, T.en.xxx, T.ar.xxx — so we edit per-key across langs */

  return null; // This is handled differently — see below
}

/* Flattened key-value editor for i18n */
function flattenI18n(obj, prefix = '') {
  const result = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      result.push(...flattenI18n(obj[key], fullKey));
    } else {
      result.push({ key: fullKey, value: obj[key] });
    }
  }
  return result;
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  let current = obj;
  for (const k of keys) {
    if (typeof current[k] !== 'object') current[k] = {};
    current = current[k];
  }
  current[last] = value;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

/* Get all unique keys from all languages */
function getAllKeys(i18n) {
  const keys = new Set();
  for (const lang of ['tr', 'en', 'ar']) {
    if (!i18n[lang]) continue;
    flattenI18n(i18n[lang]).forEach(({ key }) => keys.add(key));
  }
  return Array.from(keys).sort();
}

/* Tree structure builder */
function buildTree(keys) {
  const tree = {};
  for (const key of keys) {
    const parts = key.split('.');
    let node = tree;
    for (let i = 0; i < parts.length; i++) {
      if (i === parts.length - 1) {
        node[parts[i]] = key; // leaf: full key path
      } else {
        if (!node[parts[i]] || typeof node[parts[i]] === 'string') node[parts[i]] = {};
        node = node[parts[i]];
      }
    }
  }
  return tree;
}

function TreeNode({ node, label, i18n, onUpdate, search, showMissing, depth }) {
  const [open, setOpen] = useState(depth < 2);

  if (typeof node === 'string') {
    /* Leaf: render TR | EN | AR side by side */
    const fullKey = node;
    const trVal = getNestedValue(i18n.tr, fullKey) || '';
    const enVal = getNestedValue(i18n.en, fullKey) || '';
    const arVal = getNestedValue(i18n.ar, fullKey) || '';

    /* Search filter */
    if (search) {
      const q = search.toLowerCase();
      if (!fullKey.toLowerCase().includes(q) &&
          !trVal.toLowerCase().includes(q) &&
          !enVal.toLowerCase().includes(q) &&
          !arVal.toLowerCase().includes(q)) return null;
    }

    /* Missing filter */
    if (showMissing && arVal) return null;

    const isEmpty = !arVal;

    return (
      <div className="admin-i18n-leaf">
        <div className="admin-i18n-key" title={fullKey}>{label}</div>
        <div className="admin-i18n-vals">
          <input className="admin-input admin-i18n-input" value={trVal}
            onChange={e => onUpdate('tr', fullKey, e.target.value)} placeholder="TR" />
          <input className="admin-input admin-i18n-input" value={enVal}
            onChange={e => onUpdate('en', fullKey, e.target.value)} placeholder="EN" />
          <input className={`admin-input admin-i18n-input rtl${isEmpty ? ' empty-warn' : ''}`}
            value={arVal} dir="rtl"
            onChange={e => onUpdate('ar', fullKey, e.target.value)} placeholder="AR" />
        </div>
      </div>
    );
  }

  /* Branch node */
  const childKeys = Object.keys(node);
  return (
    <div className="admin-i18n-branch" style={{ marginLeft: depth > 0 ? 12 : 0 }}>
      <button className="admin-i18n-toggle" onClick={() => setOpen(!open)}>
        {open ? '▼' : '►'} <strong>{label}</strong>
        <span className="admin-i18n-count">({childKeys.length})</span>
      </button>
      {open && childKeys.map(k => (
        <TreeNode key={k} node={node[k]} label={k} i18n={i18n} onUpdate={onUpdate}
          search={search} showMissing={showMissing} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function I18nEditor() {
  const { i18n, setI18n, logChange } = useAdmin();
  const [search, setSearch] = useState('');
  const [showMissing, setShowMissing] = useState(false);

  const allKeys = getAllKeys(i18n);
  const tree = buildTree(allKeys);

  /* Count missing AR */
  const missingAr = allKeys.filter(k => !getNestedValue(i18n.ar, k)).length;

  const handleUpdate = useCallback((lang, key, value) => {
    setI18n(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[lang]) next[lang] = {};
      setNestedValue(next[lang], key, value);
      return next;
    });
    logChange('update', 'i18n', `${lang}.${key}`, 'value', '…', value.slice(0, 80));
  }, [setI18n, logChange]);

  return (
    <div className="admin-i18n-editor">
      <div className="admin-entity-header">
        <h2 className="admin-section-title">🌐 UI Metinleri (i18n)</h2>
      </div>

      <div className="admin-table-toolbar">
        <div className="admin-table-toolbar-left">
          <input className="admin-input admin-search-input" type="text"
            placeholder="Ara (key veya değer)..." value={search}
            onChange={e => setSearch(e.target.value)} />
          <label className="admin-checkbox-label">
            <input type="checkbox" checked={showMissing} onChange={e => setShowMissing(e.target.checked)} />
            <span>Eksik AR ({missingAr})</span>
          </label>
        </div>
        <span className="admin-table-count">{allKeys.length} anahtar</span>
      </div>

      <div className="admin-i18n-header-row">
        <div className="admin-i18n-key">Anahtar</div>
        <div className="admin-i18n-vals">
          <span>TR</span><span>EN</span><span>AR</span>
        </div>
      </div>

      <div className="admin-i18n-tree">
        {Object.keys(tree).map(k => (
          <TreeNode key={k} node={tree[k]} label={k} i18n={i18n} onUpdate={handleUpdate}
            search={search} showMissing={showMissing} depth={0} />
        ))}
      </div>
    </div>
  );
}
