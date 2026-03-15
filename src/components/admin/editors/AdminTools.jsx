/**
 * AdminTools — BulkImport, SearchReplace, Validation
 * v5.2.0.0
 */
import { useState, useCallback } from 'react';
import { useAdmin } from '../AdminContext';
import { SCHEMAS, COLLECTION_ORDER } from '../schemas/entitySchemas';

/* ═══════════════════════════════════════════════════════
   BULK IMPORT
   ═══════════════════════════════════════════════════════ */
export function BulkImport() {
  const { db, setDb, logChange } = useAdmin();
  const [collection, setCollection] = useState('dynasties');
  const [mode, setMode] = useState('update');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  const handleFile = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target.result;
        let data;
        if (file.name.endsWith('.json')) {
          data = JSON.parse(text);
          if (!Array.isArray(data)) data = [data];
        } else {
          /* CSV parse */
          const lines = text.split('\n').filter(l => l.trim());
          if (lines.length < 2) { setError('CSV en az 2 satır olmalı'); return; }
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          data = lines.slice(1).map(line => {
            const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const obj = {};
            headers.forEach((h, i) => {
              const v = vals[i] || '';
              obj[h] = isNaN(v) || v === '' ? v : Number(v);
            });
            return obj;
          });
        }
        setPreview(data);
        setError('');
      } catch (err) {
        setError('Dosya okunamadı: ' + err.message);
        setPreview(null);
      }
    };
    reader.readAsText(file, 'utf-8');
  }, []);

  const handleImport = useCallback(() => {
    if (!preview || preview.length === 0) return;
    setDb(prev => {
      const next = { ...prev };
      const existing = [...(prev[collection] || [])];

      if (mode === 'add') {
        let maxId = Math.max(0, ...existing.map(i => i.id || 0));
        const newItems = preview.map(item => ({ ...item, id: item.id || ++maxId }));
        next[collection] = [...existing, ...newItems];
      } else if (mode === 'update') {
        const map = new Map(existing.map(i => [i.id, i]));
        for (const item of preview) {
          if (item.id && map.has(item.id)) {
            map.set(item.id, { ...map.get(item.id), ...item });
          }
        }
        next[collection] = Array.from(map.values());
      } else {
        /* merge: fill empty fields only */
        const map = new Map(existing.map(i => [i.id, i]));
        for (const item of preview) {
          if (item.id && map.has(item.id)) {
            const cur = map.get(item.id);
            const merged = { ...cur };
            for (const [k, v] of Object.entries(item)) {
              if (!cur[k] || cur[k] === '') merged[k] = v;
            }
            map.set(item.id, merged);
          }
        }
        next[collection] = Array.from(map.values());
      }
      return next;
    });
    logChange('import', collection, '—', '*', null, `${preview.length} kayıt (${mode})`);
    setPreview(null);
    alert(`${preview.length} kayıt ${mode === 'add' ? 'eklendi' : mode === 'update' ? 'güncellendi' : 'birleştirildi'}.`);
  }, [preview, collection, mode, setDb, logChange]);

  return (
    <div>
      <h2 className="admin-section-title">📥 Toplu İçe Aktarma</h2>

      <div className="admin-import-form">
        <div className="admin-field-group">
          <label className="admin-label">Koleksiyon</label>
          <select className="admin-input admin-select" value={collection} onChange={e => setCollection(e.target.value)}>
            {COLLECTION_ORDER.map(k => <option key={k} value={k}>{SCHEMAS[k]?.label?.tr || k}</option>)}
          </select>
        </div>

        <div className="admin-field-group">
          <label className="admin-label">Mod</label>
          <div className="admin-radio-group">
            {[['update', 'Güncelle (mevcut ID\'leri üzerine yaz)'], ['add', 'Ekle (yeni kayıt)'], ['merge', 'Birleştir (eksik alanları doldur)']].map(([val, label]) => (
              <label key={val} className="admin-radio-label">
                <input type="radio" name="importMode" value={val} checked={mode === val}
                  onChange={e => setMode(e.target.value)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="admin-field-group">
          <label className="admin-label">Dosya (CSV veya JSON)</label>
          <input type="file" accept=".csv,.json" onChange={handleFile} className="admin-file-input" />
        </div>

        {error && <div className="admin-error">{error}</div>}

        {preview && (
          <div className="admin-import-preview">
            <h4>Önizleme ({preview.length} kayıt)</h4>
            <div className="admin-table-scroll" style={{ maxHeight: 200 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    {Object.keys(preview[0] || {}).slice(0, 8).map(k => <th key={k} className="admin-th">{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 5).map((item, i) => (
                    <tr key={i}>
                      {Object.keys(preview[0] || {}).slice(0, 8).map(k => (
                        <td key={k} className="admin-td">{String(item[k] || '').slice(0, 40)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="admin-btn admin-btn-primary" onClick={handleImport}>
              İçe Aktar ({preview.length} kayıt)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SEARCH & REPLACE
   ═══════════════════════════════════════════════════════ */
export function SearchReplace() {
  const { db, setDb, i18n, setI18n, logChange } = useAdmin();
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [scope, setScope] = useState({ db: true, i18n: true });
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(new Set());

  const doSearch = useCallback(() => {
    if (!find) { setResults([]); return; }
    const matches = [];
    const q = caseSensitive ? find : find.toLowerCase();

    if (scope.db) {
      for (const [col, items] of Object.entries(db)) {
        if (!Array.isArray(items)) continue;
        items.forEach((item, idx) => {
          for (const [key, val] of Object.entries(item)) {
            if (typeof val !== 'string') continue;
            const check = caseSensitive ? val : val.toLowerCase();
            if (check.includes(q)) {
              matches.push({ source: 'db', collection: col, id: item.id || idx, field: key, value: val });
            }
          }
        });
      }
    }

    if (scope.i18n) {
      const searchI18n = (obj, prefix) => {
        for (const [k, v] of Object.entries(obj)) {
          const fullKey = prefix ? `${prefix}.${k}` : k;
          if (typeof v === 'object') searchI18n(v, fullKey);
          else if (typeof v === 'string') {
            const check = caseSensitive ? v : v.toLowerCase();
            if (check.includes(q)) {
              matches.push({ source: 'i18n', collection: 'i18n', id: fullKey, field: 'value', value: v });
            }
          }
        }
      };
      for (const lang of ['tr', 'en', 'ar']) {
        if (i18n[lang]) searchI18n(i18n[lang], lang);
      }
    }

    setResults(matches);
    setSelected(new Set(matches.map((_, i) => i)));
  }, [find, caseSensitive, scope, db, i18n]);

  const doReplace = useCallback(() => {
    if (!find || !replace) return;
    let count = 0;
    const regex = caseSensitive ? new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      : new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

    results.forEach((r, i) => {
      if (!selected.has(i)) return;

      if (r.source === 'db') {
        setDb(prev => {
          const next = { ...prev };
          next[r.collection] = prev[r.collection].map(item => {
            if ((item.id || 0) !== r.id) return item;
            if (typeof item[r.field] !== 'string') return item;
            return { ...item, [r.field]: item[r.field].replace(regex, replace) };
          });
          return next;
        });
        count++;
      } else if (r.source === 'i18n') {
        setI18n(prev => {
          const next = JSON.parse(JSON.stringify(prev));
          const keys = r.id.split('.');
          let obj = next;
          for (let j = 0; j < keys.length - 1; j++) obj = obj[keys[j]];
          const lastKey = keys[keys.length - 1];
          if (typeof obj[lastKey] === 'string') obj[lastKey] = obj[lastKey].replace(regex, replace);
          return next;
        });
        count++;
      }
    });

    logChange('replace', 'bulk', '—', `"${find}" → "${replace}"`, find, `${count} değişiklik`);
    setResults([]);
    alert(`${count} eşleşme değiştirildi.`);
  }, [find, replace, caseSensitive, results, selected, setDb, setI18n, logChange]);

  return (
    <div>
      <h2 className="admin-section-title">🔍 Bul ve Değiştir</h2>
      <div className="admin-sr-form">
        <div className="admin-field-group">
          <label className="admin-label">Bul</label>
          <input className="admin-input" value={find} onChange={e => setFind(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()} />
        </div>
        <div className="admin-field-group">
          <label className="admin-label">Değiştir</label>
          <input className="admin-input" value={replace} onChange={e => setReplace(e.target.value)} />
        </div>
        <div className="admin-field-group" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <label className="admin-checkbox-label">
            <input type="checkbox" checked={caseSensitive} onChange={e => setCaseSensitive(e.target.checked)} />
            <span>Büyük/küçük harf duyarlı</span>
          </label>
          <label className="admin-checkbox-label">
            <input type="checkbox" checked={scope.db} onChange={e => setScope(s => ({ ...s, db: e.target.checked }))} />
            <span>db.json</span>
          </label>
          <label className="admin-checkbox-label">
            <input type="checkbox" checked={scope.i18n} onChange={e => setScope(s => ({ ...s, i18n: e.target.checked }))} />
            <span>i18n</span>
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="admin-btn admin-btn-primary" onClick={doSearch}>Ara</button>
          {results.length > 0 && (
            <button className="admin-btn admin-btn-outline" onClick={doReplace}>
              Seçilileri Değiştir ({selected.size})
            </button>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className="admin-sr-results">
          <h4>{results.length} eşleşme</h4>
          {results.slice(0, 50).map((r, i) => (
            <label key={i} className="admin-sr-result">
              <input type="checkbox" checked={selected.has(i)}
                onChange={e => {
                  const next = new Set(selected);
                  e.target.checked ? next.add(i) : next.delete(i);
                  setSelected(next);
                }} />
              <span className="admin-sr-path">{r.collection} #{r.id} .{r.field}</span>
              <span className="admin-sr-value">…{r.value.slice(0, 60)}…</span>
            </label>
          ))}
          {results.length > 50 && <p>…ve {results.length - 50} daha</p>}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VALIDATION REPORT
   ═══════════════════════════════════════════════════════ */
export function ValidationReport() {
  const { db } = useAdmin();
  const [report, setReport] = useState(null);

  const runValidation = useCallback(() => {
    const issues = [];

    for (const [col, items] of Object.entries(db)) {
      if (!Array.isArray(items)) continue;
      const schema = SCHEMAS[col];
      if (!schema) continue;

      items.forEach((item, idx) => {
        const id = item.id || idx;

        /* Required fields */
        schema.fields.filter(f => f.required).forEach(f => {
          if (!item[f.key] && item[f.key] !== 0) {
            issues.push({ type: 'missing', severity: 'error', col, id, msg: `Zorunlu alan boş: ${f.label} (${f.key})` });
          }
        });

        /* Coordinate ranges */
        if (item.lat != null && (item.lat < -90 || item.lat > 90)) {
          issues.push({ type: 'coords', severity: 'error', col, id, msg: `Enlem aralık dışı: ${item.lat}` });
        }
        if (item.lon != null && (item.lon < -180 || item.lon > 180)) {
          issues.push({ type: 'coords', severity: 'error', col, id, msg: `Boylam aralık dışı: ${item.lon}` });
        }

        /* Chronology: start > end */
        if (item.start && item.end && item.start > item.end) {
          issues.push({ type: 'chrono', severity: 'warn', col, id, msg: `Başlangıç (${item.start}) > Bitiş (${item.end})` });
        }
        if (item.rs && item.re && item.rs > item.re) {
          issues.push({ type: 'chrono', severity: 'warn', col, id, msg: `Hüküm başlangıcı (${item.rs}) > sonu (${item.re})` });
        }

        /* Orphan refs */
        schema.fields.filter(f => f.type === 'ref' && f.refCollection).forEach(f => {
          const refVal = item[f.key];
          if (refVal && !db[f.refCollection]?.find(r => r.id === refVal)) {
            issues.push({ type: 'orphan', severity: 'error', col, id, msg: `Yetim referans: ${f.key}=${refVal} (${f.refCollection}'da bulunamadı)` });
          }
        });

        /* Missing translations */
        schema.fields.filter(f => f.trilingual).forEach(f => {
          if (!item[`${f.key}_ar`]) {
            issues.push({ type: 'translation', severity: 'info', col, id, msg: `Eksik AR çeviri: ${f.key}_ar` });
          }
          if (!item[`${f.key}_en`]) {
            issues.push({ type: 'translation', severity: 'info', col, id, msg: `Eksik EN çeviri: ${f.key}_en` });
          }
        });
      });
    }

    setReport(issues);
  }, [db]);

  const errorCount = report?.filter(i => i.severity === 'error').length || 0;
  const warnCount = report?.filter(i => i.severity === 'warn').length || 0;
  const infoCount = report?.filter(i => i.severity === 'info').length || 0;

  return (
    <div>
      <h2 className="admin-section-title">✅ Doğrulama Raporu</h2>
      <button className="admin-btn admin-btn-primary" onClick={runValidation}>Doğrulama Çalıştır</button>

      {report && (
        <div className="admin-validation-results" style={{ marginTop: 16 }}>
          <div className="admin-validation-summary">
            <span className="admin-val-badge error">🔴 {errorCount} hata</span>
            <span className="admin-val-badge warn">🟡 {warnCount} uyarı</span>
            <span className="admin-val-badge info">🔵 {infoCount} bilgi</span>
          </div>

          {report.filter(i => i.severity === 'error').length > 0 && (
            <>
              <h4>Hatalar</h4>
              {report.filter(i => i.severity === 'error').slice(0, 50).map((r, i) => (
                <div key={i} className="admin-val-item error">
                  <span className="admin-val-path">{r.col} #{r.id}</span>
                  <span>{r.msg}</span>
                </div>
              ))}
            </>
          )}

          {warnCount > 0 && (
            <>
              <h4>Uyarılar</h4>
              {report.filter(i => i.severity === 'warn').slice(0, 20).map((r, i) => (
                <div key={i} className="admin-val-item warn">
                  <span className="admin-val-path">{r.col} #{r.id}</span>
                  <span>{r.msg}</span>
                </div>
              ))}
            </>
          )}

          {infoCount > 0 && (
            <>
              <h4>Eksik Çeviriler ({infoCount})</h4>
              <p className="admin-text2">Toplam {infoCount} eksik çeviri alanı var.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
