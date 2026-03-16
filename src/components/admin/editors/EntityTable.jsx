/**
 * EntityTable — Virtual scrolling + aranabilir, sıralanabilir tablo
 * v5.4.0.0 — Performance optimized for 10K+ rows
 */
import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useAdmin } from '../AdminContext';

const ROW_HEIGHT = 36;
const BUFFER = 8;
const VIRTUAL_THRESHOLD = 50;
const DEBOUNCE_MS = 300;

/* Normalize Turkish chars for search */
function normalize(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ç/g, 'c').replace(/Ç/g, 'c');
}

export default function EntityTable({ collection, schema, onEdit, onAdd, onDelete }) {
  const { db, user, getEntityName } = useAdmin();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef(null);
  const debounceRef = useRef(null);

  const items = db[collection] || [];
  const cols = schema.listColumns || ['id', 'tr', 'en'];
  const hasId = !schema.noId;
  const useVirtual = items.length > VIRTUAL_THRESHOLD;

  /* Debounced search */
  const handleSearch = useCallback((val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), DEBOUNCE_MS);
  }, []);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  /* Reset scroll on search/sort change */
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setScrollTop(0);
  }, [debouncedSearch, sortKey, sortDir]);

  /* Search */
  const searched = useMemo(() => {
    if (!debouncedSearch) return items;
    const q = normalize(debouncedSearch);
    return items.filter(item =>
      cols.some(c => {
        const v = item[c];
        if (v == null) return false;
        return normalize(String(v)).includes(q);
      })
    );
  }, [items, debouncedSearch, cols]);

  /* Sort */
  const sorted = useMemo(() => {
    if (!sortKey) return searched;
    return [...searched].sort((a, b) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }, [searched, sortKey, sortDir]);

  /* Virtual scroll calculation */
  const { startIdx, endIdx, visibleItems } = useMemo(() => {
    if (!useVirtual) return { startIdx: 0, endIdx: sorted.length, visibleItems: sorted };
    const visibleCount = Math.ceil(600 / ROW_HEIGHT);
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
    const end = Math.min(sorted.length, start + visibleCount + BUFFER * 2);
    return { startIdx: start, endIdx: end, visibleItems: sorted.slice(start, end) };
  }, [sorted, scrollTop, useVirtual]);

  const handleScroll = useCallback((e) => {
    if (useVirtual) setScrollTop(e.target.scrollTop);
  }, [useVirtual]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const renderCell = (item, col) => {
    const val = item[col];
    if (val == null || val === '') return '—';
    const field = schema.fields?.find(f => f.key === col);
    if (field?.type === 'ref' && field.refCollection) {
      return `#${val} ${getEntityName(field.refCollection, val)}`;
    }
    if (Array.isArray(val)) return val.length + ' öğe';
    if (typeof val === 'boolean') return val ? '✓' : '—';
    return String(val).length > 60 ? String(val).slice(0, 60) + '…' : String(val);
  };

  return (
    <div className="admin-entity-table-wrap">
      {/* Toolbar */}
      <div className="admin-table-toolbar">
        <div className="admin-table-toolbar-left">
          <input className="admin-input admin-search-input" type="text"
            placeholder="Ara..." value={search}
            onChange={e => handleSearch(e.target.value)} />
          <span className="admin-table-count">
            {searched.length === items.length ? items.length : `${searched.length} / ${items.length}`}
            {useVirtual && <span className="admin-vs-badge"> ⚡</span>}
          </span>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={onAdd}>
          + Yeni Ekle
        </button>
      </div>

      {/* Table */}
      <div
        className="admin-table-scroll"
        ref={scrollRef}
        onScroll={handleScroll}
        style={useVirtual ? { maxHeight: 600, overflowY: 'auto' } : {}}
      >
        <table className="admin-table">
          <thead>
            <tr>
              {cols.map(col => (
                <th key={col} onClick={() => toggleSort(col)} className="admin-th"
                  style={useVirtual ? { position: 'sticky', top: 0, zIndex: 2 } : {}}>
                  {col}
                  {sortKey === col && <span className="admin-sort-arrow">{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>}
                </th>
              ))}
              <th className="admin-th admin-th-actions"
                style={useVirtual ? { position: 'sticky', top: 0, zIndex: 2 } : {}}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {/* Virtual scroll spacer top */}
            {useVirtual && startIdx > 0 && (
              <tr style={{ height: startIdx * ROW_HEIGHT }}>
                <td colSpan={cols.length + 1} style={{ padding: 0, border: 'none' }} />
              </tr>
            )}

            {visibleItems.map((item, idx) => {
              const rowKey = hasId ? item.id : (useVirtual ? startIdx + idx : idx);
              const rowIdx = items.indexOf(item);
              return (
                <tr key={rowKey} className="admin-tr"
                  style={useVirtual ? { height: ROW_HEIGHT } : {}}
                  onDoubleClick={() => onEdit(hasId ? item.id : rowIdx)}>
                  {cols.map(col => (
                    <td key={col} className="admin-td">{renderCell(item, col)}</td>
                  ))}
                  <td className="admin-td admin-td-actions">
                    <button className="admin-btn-icon" onClick={() => onEdit(hasId ? item.id : rowIdx)} title="Düzenle">✏️</button>
                    {user?.role === 'admin' && (
                      <button className="admin-btn-icon danger" onClick={() => onDelete(hasId ? item.id : rowIdx)} title="Sil">🗑</button>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Virtual scroll spacer bottom */}
            {useVirtual && endIdx < sorted.length && (
              <tr style={{ height: (sorted.length - endIdx) * ROW_HEIGHT }}>
                <td colSpan={cols.length + 1} style={{ padding: 0, border: 'none' }} />
              </tr>
            )}

            {visibleItems.length === 0 && (
              <tr><td colSpan={cols.length + 1} className="admin-td admin-empty">Kayıt bulunamadı</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Info bar */}
      {useVirtual && (
        <div className="admin-vs-info">
          ⚡ Virtual scroll aktif — {sorted.length} kayıt, {visibleItems.length} görünür
        </div>
      )}
    </div>
  );
}
