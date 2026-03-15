/**
 * ExportManager — Dosya üretimi, indirme, changelog
 * v5.2.0.0
 */
import { useCallback } from 'react';
import { useAdmin } from '../AdminContext';

/* ═══ File generators ═══ */

function generateDbJson(db) {
  return JSON.stringify(db, null, 2);
}

function generateJsModule(varName, data, header) {
  const h = header ? `/* ${header} */\n` : '';
  const json = JSON.stringify(data, null, 2);
  return `${h}const ${varName} = ${json};\n\nexport default ${varName};\n`;
}

function generateColorsJs(colors) {
  let out = '/* ═══ Color Palettes ═══ */\n\n';
  for (const [name, obj] of Object.entries(colors)) {
    out += `export const ${name} = ${JSON.stringify(obj, null, 2)};\n\n`;
  }
  return out;
}

function generateLayersJs(config) {
  let out = '/* ═══ Layer Configuration ═══ */\n\n';
  for (const [name, val] of Object.entries(config)) {
    out += `export const ${name} = ${JSON.stringify(val, null, 2)};\n\n`;
  }
  return out;
}

function generateI18nJs(data) {
  return `const T = ${JSON.stringify(data, null, 2)};\n\nexport default T;\n`;
}

function generateChangelog(changeLog, user) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  let md = `# islamicatlas.org — Değişiklik Raporu\n`;
  md += `# Tarih: ${now}\n`;
  md += `# Kullanıcı: ${user?.username || 'unknown'}\n\n`;
  md += `## Değişiklikler (${changeLog.length})\n\n`;

  const grouped = {};
  for (const c of changeLog) {
    if (!grouped[c.entity]) grouped[c.entity] = [];
    grouped[c.entity].push(c);
  }

  for (const [entity, changes] of Object.entries(grouped)) {
    md += `### ${entity}\n`;
    for (const c of changes) {
      if (c.type === 'add') md += `- ADD #${c.id}: yeni kayıt\n`;
      else if (c.type === 'delete') md += `- DELETE #${c.id}\n`;
      else md += `- UPDATE #${c.id} ${c.field}: "${c.old}" → "${c.new}"\n`;
    }
    md += '\n';
  }
  return md;
}

function downloadFile(filename, content, type = 'application/octet-stream') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadZip(files) {
  /* Simple ZIP without dependencies — use Blob array approach */
  /* For simplicity, download each file individually when ZIP not available */
  for (const f of files) {
    downloadFile(f.name, f.content, f.type || 'text/plain');
    await new Promise(r => setTimeout(r, 200));
  }
}

export default function ExportManager() {
  const { db, i18n, tours, eraInfo, glossary, scholarLinks, scholarMeta, battleMeta,
    isnadChains, colors, layerConfig, changeLog, user } = useAdmin();

  const files = [
    { name: 'db.json', gen: () => generateDbJson(db), type: 'application/json' },
    { name: 'i18n.js', gen: () => generateI18nJs(i18n) },
    { name: 'tours.js', gen: () => generateJsModule('TOURS', tours, '═══ Guided Tour Definitions ═══') },
    { name: 'era_info.js', gen: () => generateJsModule('ERA_INFO', eraInfo, '═══ Dönem Bilgi Kartları ═══') },
    { name: 'glossary.js', gen: () => generateJsModule('glossary', glossary, '═══ Sözlük / Glossary ═══') },
    { name: 'scholar_links.js', gen: () => generateJsModule('SCHOLAR_LINKS', scholarLinks, '═══ Scholar Links ═══') },
    { name: 'scholar_meta.js', gen: () => generateJsModule('SCHOLAR_META', scholarMeta, '═══ Scholar Meta ═══') },
    { name: 'battle_meta.js', gen: () => generateJsModule('BATTLE_META', battleMeta, '═══ Battle Meta ═══') },
    { name: 'isnad_chains.js', gen: () => generateJsModule('ISNAD_CHAINS', isnadChains, '═══ İsnâd Zincirleri ═══') },
    { name: 'colors.js', gen: () => generateColorsJs(colors), path: 'config/' },
    { name: 'layers.js', gen: () => generateLayersJs(layerConfig), path: 'config/' },
  ];

  const handleDownload = useCallback((file) => {
    downloadFile(file.name, file.gen(), file.type || 'text/javascript');
  }, []);

  const handleDownloadAll = useCallback(async () => {
    const allFiles = files.map(f => ({ name: (f.path || 'data/') + f.name, content: f.gen(), type: f.type }));
    allFiles.push({ name: 'CHANGELOG.md', content: generateChangelog(changeLog, user) });
    await downloadZip(allFiles);
  }, [files, changeLog, user]);

  const handleDownloadChangelog = useCallback(() => {
    downloadFile('CHANGELOG.md', generateChangelog(changeLog, user), 'text/markdown');
  }, [changeLog, user]);

  /* Group changes by entity */
  const grouped = {};
  for (const c of changeLog) {
    if (!grouped[c.entity]) grouped[c.entity] = [];
    grouped[c.entity].push(c);
  }

  return (
    <div className="admin-export">
      <h2 className="admin-section-title">📦 Dışa Aktarma</h2>

      <div className="admin-export-summary">
        <strong>Değişiklik Özeti:</strong> {changeLog.length} değişiklik
      </div>

      {changeLog.length > 0 && (
        <div className="admin-changelog-preview">
          {Object.entries(grouped).map(([entity, changes]) => (
            <div key={entity}>
              <strong>{entity}</strong> ({changes.length})
              {changes.slice(0, 5).map((c, i) => (
                <div key={i} className="admin-changelog-item">
                  <span className={`admin-changelog-type ${c.type}`}>[{c.type.toUpperCase()}]</span>
                  <span>#{c.id} {c.field} → {typeof c.new === 'string' ? `"${c.new}"` : c.new}</span>
                </div>
              ))}
              {changes.length > 5 && <div className="admin-changelog-more">...ve {changes.length - 5} daha</div>}
            </div>
          ))}
        </div>
      )}

      <div className="admin-export-actions">
        <button className="admin-btn admin-btn-primary admin-btn-lg" onClick={handleDownloadAll}>
          ⬇ Tümünü İndir (Tekil Dosyalar)
        </button>
      </div>

      <h3 className="admin-sub-title">Tekil İndirmeler</h3>
      <div className="admin-export-grid">
        {files.map(f => (
          <button key={f.name} className="admin-btn admin-btn-outline" onClick={() => handleDownload(f)}>
            ⬇ {f.name}
          </button>
        ))}
        <button className="admin-btn admin-btn-outline" onClick={handleDownloadChangelog}>
          ⬇ CHANGELOG.md
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CHANGELOG VIEW
   ═══════════════════════════════════════════════════════ */
export function ChangeLogView() {
  const { changeLog } = useAdmin();

  if (changeLog.length === 0) {
    return (
      <div>
        <h2 className="admin-section-title">📋 Değişiklik Listesi</h2>
        <p className="admin-empty">Henüz değişiklik yapılmadı.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="admin-section-title">📋 Değişiklik Listesi ({changeLog.length})</h2>
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="admin-th">Zaman</th>
              <th className="admin-th">Tip</th>
              <th className="admin-th">Varlık</th>
              <th className="admin-th">ID</th>
              <th className="admin-th">Alan</th>
              <th className="admin-th">Eski</th>
              <th className="admin-th">Yeni</th>
            </tr>
          </thead>
          <tbody>
            {[...changeLog].reverse().map((c, i) => (
              <tr key={i}>
                <td className="admin-td">{new Date(c.ts).toLocaleTimeString('tr')}</td>
                <td className="admin-td"><span className={`admin-changelog-type ${c.type}`}>{c.type}</span></td>
                <td className="admin-td">{c.entity}</td>
                <td className="admin-td">{c.id}</td>
                <td className="admin-td">{c.field}</td>
                <td className="admin-td admin-td-truncate">{c.old != null ? String(c.old) : '—'}</td>
                <td className="admin-td admin-td-truncate">{c.new != null ? String(c.new) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
