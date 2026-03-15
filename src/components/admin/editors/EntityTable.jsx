/**
 * EntityTable — Aranabilir, sıralanabilir, sayfalanabilir tablo
 * v5.2.0.0
 */
import { useState, useMemo } from 'react';
import { useAdmin } from '../AdminContext';

const PAGE_SIZE = 25;

export default function EntityTable({ collection, schema, onEdit, onAdd, onDelete }) {
  const { db, user, getEntityName } = useAdmin();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);

  const items = db[collection] || [];
  const cols = schema.listColumns || ['id', 'tr', 'en'];
  const hasId = !schema.noId;

  /* Search */
  const searched = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(item =>
      cols.some(c => {
        const v = item[c];
        if (v == null) return false;
        return String(v).toLowerCase().includes(q);
      })
    );
  }, [items, search, cols]);

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

  /* Paginate */
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
    /* If col is a ref, resolve name */
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
            onChange={e => { setSearch(e.target.value); setPage(0); }} />
          <span className="admin-table-count">{searched.length} / {items.length}</span>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={onAdd}>
          + Yeni Ekle
        </button>
      </div>

      {/* Table */}
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              {cols.map(col => (
                <th key={col} onClick={() => toggleSort(col)} className="admin-th">
                  {col}
                  {sortKey === col && <span className="admin-sort-arrow">{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>}
                </th>
              ))}
              <th className="admin-th admin-th-actions">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((item, idx) => {
              const rowKey = hasId ? item.id : page * PAGE_SIZE + idx;
              const rowIdx = items.indexOf(item);
              return (
                <tr key={rowKey} className="admin-tr" onDoubleClick={() => onEdit(hasId ? item.id : rowIdx)}>
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
            {paged.length === 0 && (
              <tr><td colSpan={cols.length + 1} className="admin-td admin-empty">Kayıt bulunamadı</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button className="admin-btn admin-btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹ Önceki</button>
          <span className="admin-page-info">{page + 1} / {totalPages}</span>
          <button className="admin-btn admin-btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Sonraki ›</button>
        </div>
      )}
    </div>
  );
}
