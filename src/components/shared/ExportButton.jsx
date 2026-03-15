import { useState, useRef, useEffect, useCallback } from 'react';
import DB from '../../data/db.json';
import { f } from '../../data/i18n-utils';

/* ═══ CSV helpers ═══ */
function escapeCSV(val) {
  if (val == null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function downloadCSV(filename, headers, rows) {
  const lines = [headers.join(',')];
  rows.forEach(row => lines.push(row.map(escapeCSV).join(',')));
  const csvString = lines.join('\n');
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ═══ Export definitions ═══ */
const EXPORTS = {
  scholars: {
    label_tr: 'Âlimler', label_en: 'Scholars',
    count: () => DB.scholars.length,
    fn: () => {
      const headers = ['id','name_tr','name_en','birth','death','discipline_tr','discipline_en','city_tr','city_en'];
      const rows = DB.scholars.map(s => [s.id, s.tr, s.en, s.b, s.d, s.disc_tr, s.disc_en || '', s.city_tr || '', s.city_en || '']);
      downloadCSV('scholars.csv', headers, rows);
    }
  },
  battles: {
    label_tr: 'Savaşlar', label_en: 'Battles',
    count: () => DB.battles.length,
    fn: () => {
      const headers = ['id','name_tr','name_en','year','lat','lon','result_tr','forces_muslim','forces_opponent','terrain_tr'];
      const rows = DB.battles.map(b => [b.id, b.tr, b.en, b.yr, b.lat, b.lon, b.result_tr || '', b.forces_m || '', b.forces_o || '', b.terrain_tr || '']);
      downloadCSV('battles.csv', headers, rows);
    }
  },
  monuments: {
    label_tr: 'Anıtlar', label_en: 'Monuments',
    count: () => DB.monuments.length,
    fn: () => {
      const headers = ['id','name_tr','name_en','year','city_tr','city_en','type_tr','builder_tr','style','status'];
      const rows = DB.monuments.map(m => [m.id, m.tr, m.en, m.yr || '', m.city_tr || '', m.city_en || '', m.type_tr || '', m.builder_tr || '', m.style || '', m.status || '']);
      downloadCSV('monuments.csv', headers, rows);
    }
  },
  cities: {
    label_tr: 'Şehirler', label_en: 'Cities',
    count: () => {
      const seen = new Set();
      DB.cities.forEach(c => seen.add(c.id));
      return seen.size;
    },
    fn: () => {
      const headers = ['id','name_tr','name_en','lat','lon','role_tr','role_en','modern_country'];
      const seen = new Set();
      const rows = [];
      DB.cities.forEach(c => {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          rows.push([c.id, c.tr, c.en, c.lat, c.lon, c.role_tr || '', c.role_en || '', c.modern_country || '']);
        }
      });
      downloadCSV('cities.csv', headers, rows);
    }
  },
  dynasties: {
    label_tr: 'Hanedanlar', label_en: 'Dynasties',
    count: () => DB.dynasties.length,
    fn: () => {
      const headers = ['id','name_tr','name_en','start','end','capital','zone','religion','government'];
      const rows = DB.dynasties.map(d => [d.id, d.tr, d.en, d.start || '', d.end || '', d.cap || '', d.zone || '', d.rel || '', d.gov || '']);
      downloadCSV('dynasties.csv', headers, rows);
    }
  },
};

export default function ExportButton({ lang }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const handleExport = useCallback((key) => {
    EXPORTS[key].fn();
    setOpen(false);
  }, []);

  return (
    <div className="export-wrap" ref={ref}>
      <button className="export-btn" onClick={() => setOpen(p => !p)}
        title={{ tr: 'CSV İndir', en: 'Download CSV', ar: '' }[lang]}
        aria-label={{ tr: 'CSV İndir', en: 'Download CSV', ar: '' }[lang]}>
        📥 CSV
      </button>
      {open && (
        <div className="export-dropdown">
          {Object.entries(EXPORTS).map(([key, exp]) => (
            <button key={key} className="export-item" onClick={() => handleExport(key)}>
              <span className="export-item-label">{f(exp, 'label', lang)}</span>
              <span className="export-item-count">({exp.count()})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
