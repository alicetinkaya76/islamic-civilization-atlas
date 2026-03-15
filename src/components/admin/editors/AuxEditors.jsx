/**
 * AuxEditors — EraInfo, Glossary, ScholarLinks, IsnadChains,
 *              BattleMeta, ScholarMeta, ConstantsEditor
 * v5.2.0.0 — All auxiliary data editors in one file
 */
import { useState, useCallback } from 'react';
import { useAdmin } from '../AdminContext';

/* ═══════════════════════════════════════════════════════
   ERA INFO EDITOR
   ═══════════════════════════════════════════════════════ */
export function EraInfoEditor() {
  const { eraInfo, setEraInfo, logChange } = useAdmin();
  const [openIdx, setOpenIdx] = useState(null);

  const update = (idx, key, val) => {
    setEraInfo(prev => prev.map((e, i) => i === idx ? { ...e, [key]: val } : e));
    logChange('update', 'eraInfo', eraInfo[idx]?.id || idx, key, '…', typeof val === 'string' ? val.slice(0, 60) : JSON.stringify(val).slice(0, 60));
  };

  const updateNested = (idx, key, subKey, val) => {
    setEraInfo(prev => prev.map((e, i) =>
      i === idx ? { ...e, [key]: { ...e[key], [subKey]: val } } : e
    ));
    logChange('update', 'eraInfo', eraInfo[idx]?.id, `${key}.${subKey}`, '…', typeof val === 'string' ? val.slice(0, 60) : '…');
  };

  const updateArrayItem = (idx, key, lang, arrIdx, val) => {
    setEraInfo(prev => prev.map((e, i) => {
      if (i !== idx) return e;
      const arr = [...(e[key]?.[lang] || [])];
      arr[arrIdx] = val;
      return { ...e, [key]: { ...e[key], [lang]: arr } };
    }));
  };

  const addArrayItem = (idx, key, lang) => {
    setEraInfo(prev => prev.map((e, i) => {
      if (i !== idx) return e;
      const arr = [...(e[key]?.[lang] || []), ''];
      return { ...e, [key]: { ...e[key], [lang]: arr } };
    }));
  };

  const removeArrayItem = (idx, key, lang, arrIdx) => {
    setEraInfo(prev => prev.map((e, i) => {
      if (i !== idx) return e;
      const arr = (e[key]?.[lang] || []).filter((_, j) => j !== arrIdx);
      return { ...e, [key]: { ...e[key], [lang]: arr } };
    }));
  };

  return (
    <div className="admin-era-editor">
      <h2 className="admin-section-title">📅 Dönem Kartları ({eraInfo.length})</h2>
      {eraInfo.map((era, idx) => (
        <div key={era.id} className="admin-tour-card">
          <div className="admin-tour-card-header" onClick={() => setOpenIdx(openIdx === idx ? null : idx)}>
            <span style={{ display: 'inline-block', width: 16, height: 16, background: era.color, borderRadius: 3, marginRight: 8 }} />
            <span>{era.label?.tr || era.id} ({era.start}–{era.end})</span>
            <span className="admin-tour-toggle">{openIdx === idx ? '▼' : '►'}</span>
          </div>
          {openIdx === idx && (
            <div className="admin-tour-card-body">
              <div className="admin-tri-wrap">
                {['tr', 'en', 'ar'].map(lang => (
                  <div key={lang} className="admin-tri-col">
                    <div className="admin-tri-label"><span>Label {lang.toUpperCase()}</span></div>
                    <input className={`admin-input${lang === 'ar' ? ' rtl' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      value={era.label?.[lang] || ''} onChange={e => updateNested(idx, 'label', lang, e.target.value)} />
                  </div>
                ))}
              </div>
              <div className="admin-field-group">
                <label className="admin-label">Renk</label>
                <div className="admin-color-wrap">
                  <input type="color" value={era.color || '#000'} onChange={e => update(idx, 'color', e.target.value)} />
                  <input className="admin-input admin-input-sm" value={era.color || ''} onChange={e => update(idx, 'color', e.target.value)} />
                </div>
              </div>
              <div className="admin-field-group">
                <label className="admin-label">Başlangıç / Bitiş</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="admin-input admin-input-sm" type="number" value={era.start || ''} onChange={e => update(idx, 'start', +e.target.value)} />
                  <input className="admin-input admin-input-sm" type="number" value={era.end || ''} onChange={e => update(idx, 'end', +e.target.value)} />
                </div>
              </div>
              <div className="admin-tri-wrap">
                {['tr', 'en', 'ar'].map(lang => (
                  <div key={lang} className="admin-tri-col">
                    <div className="admin-tri-label"><span>Açıklama {lang.toUpperCase()}</span></div>
                    <textarea className={`admin-input admin-textarea${lang === 'ar' ? ' rtl' : ''}`} rows={4} dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      value={era.description?.[lang] || ''} onChange={e => updateNested(idx, 'description', lang, e.target.value)} />
                  </div>
                ))}
              </div>
              {/* Key Developments */}
              {['keyDevelopments', 'scholars'].map(arrKey => (
                <div key={arrKey} className="admin-field-group">
                  <label className="admin-label">{arrKey === 'keyDevelopments' ? 'Temel Gelişmeler' : 'Âlimler'}</label>
                  <div className="admin-tri-wrap">
                    {['tr', 'en', 'ar'].map(lang => (
                      <div key={lang} className="admin-tri-col">
                        <div className="admin-tri-label"><span>{lang.toUpperCase()}</span></div>
                        {(era[arrKey]?.[lang] || []).map((item, arrIdx) => (
                          <div key={arrIdx} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                            <input className={`admin-input${lang === 'ar' ? ' rtl' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}
                              value={item} onChange={e => updateArrayItem(idx, arrKey, lang, arrIdx, e.target.value)} />
                            <button className="admin-btn-icon danger" onClick={() => removeArrayItem(idx, arrKey, lang, arrIdx)}>×</button>
                          </div>
                        ))}
                        <button className="admin-btn admin-btn-sm" onClick={() => addArrayItem(idx, arrKey, lang)}>+</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   GLOSSARY EDITOR
   ═══════════════════════════════════════════════════════ */
export function GlossaryEditor() {
  const { glossary, setGlossary, logChange, user } = useAdmin();
  const [search, setSearch] = useState('');

  const filtered = search
    ? glossary.filter(g => [g.term_tr, g.term_en, g.term_ar, g.def_tr, g.def_en].some(v => (v || '').toLowerCase().includes(search.toLowerCase())))
    : glossary;

  const update = (idx, key, val) => {
    setGlossary(prev => prev.map((g, i) => i === idx ? { ...g, [key]: val } : g));
    logChange('update', 'glossary', glossary[idx]?.id || idx, key, '…', val.slice(0, 60));
  };

  const addTerm = () => {
    const maxId = Math.max(0, ...glossary.map(g => g.id || 0));
    setGlossary(prev => [...prev, { id: maxId + 1, term_tr: '', term_en: '', term_ar: '', def_tr: '', def_en: '', def_ar: '' }]);
    logChange('add', 'glossary', maxId + 1, '*', null, 'new');
  };

  const deleteTerm = (idx) => {
    if (user?.role !== 'admin') return;
    setGlossary(prev => prev.filter((_, i) => i !== idx));
    logChange('delete', 'glossary', idx, '*', 'deleted', null);
  };

  return (
    <div className="admin-glossary-editor">
      <div className="admin-entity-header">
        <h2 className="admin-section-title">📖 Sözlük ({glossary.length})</h2>
        <button className="admin-btn admin-btn-primary" onClick={addTerm}>+ Yeni Terim</button>
      </div>
      <input className="admin-input admin-search-input" placeholder="Ara..." value={search}
        onChange={e => setSearch(e.target.value)} style={{ marginBottom: 12 }} />
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="admin-th">#</th>
              <th className="admin-th">Terim TR</th>
              <th className="admin-th">Term EN</th>
              <th className="admin-th">المصطلح AR</th>
              <th className="admin-th">Tanım TR</th>
              <th className="admin-th">Def EN</th>
              <th className="admin-th">التعريف AR</th>
              <th className="admin-th">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g, idx) => {
              const realIdx = glossary.indexOf(g);
              return (
                <tr key={g.id || idx}>
                  <td className="admin-td">{g.id}</td>
                  <td className="admin-td"><input className="admin-input admin-inline-edit" value={g.term_tr || ''} onChange={e => update(realIdx, 'term_tr', e.target.value)} /></td>
                  <td className="admin-td"><input className="admin-input admin-inline-edit" value={g.term_en || ''} onChange={e => update(realIdx, 'term_en', e.target.value)} /></td>
                  <td className="admin-td"><input className="admin-input admin-inline-edit rtl" dir="rtl" value={g.term_ar || ''} onChange={e => update(realIdx, 'term_ar', e.target.value)} /></td>
                  <td className="admin-td"><input className="admin-input admin-inline-edit" value={g.def_tr || ''} onChange={e => update(realIdx, 'def_tr', e.target.value)} /></td>
                  <td className="admin-td"><input className="admin-input admin-inline-edit" value={g.def_en || ''} onChange={e => update(realIdx, 'def_en', e.target.value)} /></td>
                  <td className="admin-td"><input className="admin-input admin-inline-edit rtl" dir="rtl" value={g.def_ar || ''} onChange={e => update(realIdx, 'def_ar', e.target.value)} /></td>
                  <td className="admin-td">
                    {user?.role === 'admin' && <button className="admin-btn-icon danger" onClick={() => deleteTerm(realIdx)}>🗑</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SCHOLAR LINKS EDITOR
   ═══════════════════════════════════════════════════════ */
export function ScholarLinksEditor() {
  const { scholarLinks, setScholarLinks, logChange, getEntityName } = useAdmin();

  const update = (idx, key, val) => {
    setScholarLinks(prev => prev.map((l, i) => i === idx ? { ...l, [key]: val } : l));
    logChange('update', 'scholarLinks', idx, key, '…', String(val));
  };

  const addLink = () => {
    setScholarLinks(prev => [...prev, { source: 0, target: 0, type: 'influence' }]);
    logChange('add', 'scholarLinks', '—', '*', null, 'new');
  };

  const deleteLink = (idx) => {
    setScholarLinks(prev => prev.filter((_, i) => i !== idx));
    logChange('delete', 'scholarLinks', idx, '*', 'deleted', null);
  };

  return (
    <div>
      <div className="admin-entity-header">
        <h2 className="admin-section-title">🔗 Âlim Bağlantıları ({scholarLinks.length})</h2>
        <button className="admin-btn admin-btn-primary" onClick={addLink}>+ Yeni Bağlantı</button>
      </div>
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="admin-th">#</th>
              <th className="admin-th">Kaynak</th>
              <th className="admin-th">Hedef</th>
              <th className="admin-th">Tip</th>
              <th className="admin-th">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {scholarLinks.map((link, idx) => (
              <tr key={idx}>
                <td className="admin-td">{idx + 1}</td>
                <td className="admin-td">
                  <input className="admin-input admin-input-sm" type="number" value={link.source || 0}
                    onChange={e => update(idx, 'source', +e.target.value)} />
                  <span className="admin-ref-hint">{getEntityName('scholars', link.source)}</span>
                </td>
                <td className="admin-td">
                  <input className="admin-input admin-input-sm" type="number" value={link.target || 0}
                    onChange={e => update(idx, 'target', +e.target.value)} />
                  <span className="admin-ref-hint">{getEntityName('scholars', link.target)}</span>
                </td>
                <td className="admin-td">
                  <select className="admin-input admin-select" value={link.type || ''}
                    onChange={e => update(idx, 'type', e.target.value)}>
                    {['teacher', 'influence', 'debate', 'isnad'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td className="admin-td">
                  <button className="admin-btn-icon danger" onClick={() => deleteLink(idx)}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ISNAD CHAINS EDITOR
   ═══════════════════════════════════════════════════════ */
export function IsnadChainsEditor() {
  const { isnadChains, setIsnadChains, logChange, getEntityName } = useAdmin();
  const [openIdx, setOpenIdx] = useState(null);

  const update = (idx, key, val) => {
    setIsnadChains(prev => prev.map((c, i) => i === idx ? { ...c, [key]: val } : c));
    logChange('update', 'isnadChains', isnadChains[idx]?.id || idx, key, '…', typeof val === 'string' ? val.slice(0, 60) : '…');
  };

  const updateLink = (chainIdx, linkIdx, key, val) => {
    setIsnadChains(prev => prev.map((c, i) => {
      if (i !== chainIdx) return c;
      const links = [...c.links];
      links[linkIdx] = { ...links[linkIdx], [key]: val };
      return { ...c, links };
    }));
  };

  const addLink = (chainIdx) => {
    setIsnadChains(prev => prev.map((c, i) =>
      i === chainIdx ? { ...c, links: [...c.links, { from: 0, to: 0 }] } : c
    ));
  };

  const removeLink = (chainIdx, linkIdx) => {
    setIsnadChains(prev => prev.map((c, i) =>
      i === chainIdx ? { ...c, links: c.links.filter((_, j) => j !== linkIdx) } : c
    ));
  };

  return (
    <div>
      <h2 className="admin-section-title">⛓ İsnâd Zincirleri ({isnadChains.length})</h2>
      {isnadChains.map((chain, idx) => (
        <div key={chain.id || idx} className="admin-tour-card">
          <div className="admin-tour-card-header" onClick={() => setOpenIdx(openIdx === idx ? null : idx)}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: chain.color, borderRadius: 2, marginRight: 6 }} />
            <span>{chain.name_tr || chain.id}</span>
            <span className="admin-tour-toggle">{openIdx === idx ? '▼' : '►'}</span>
          </div>
          {openIdx === idx && (
            <div className="admin-tour-card-body">
              <div className="admin-tri-wrap">
                {[['name_tr', 'TR'], ['name_en', 'EN'], ['name_ar', 'AR']].map(([k, l]) => (
                  <div key={k} className="admin-tri-col">
                    <div className="admin-tri-label"><span>İsim {l}</span></div>
                    <input className={`admin-input${k.endsWith('ar') ? ' rtl' : ''}`} dir={k.endsWith('ar') ? 'rtl' : 'ltr'}
                      value={chain[k] || ''} onChange={e => update(idx, k, e.target.value)} />
                  </div>
                ))}
              </div>
              <div className="admin-tri-wrap">
                {[['desc_tr', 'TR'], ['desc_en', 'EN'], ['desc_ar', 'AR']].map(([k, l]) => (
                  <div key={k} className="admin-tri-col">
                    <div className="admin-tri-label"><span>Açıklama {l}</span></div>
                    <textarea className={`admin-input admin-textarea${k.endsWith('ar') ? ' rtl' : ''}`} rows={2}
                      dir={k.endsWith('ar') ? 'rtl' : 'ltr'} value={chain[k] || ''} onChange={e => update(idx, k, e.target.value)} />
                  </div>
                ))}
              </div>
              <div className="admin-field-group">
                <label className="admin-label">Renk</label>
                <div className="admin-color-wrap">
                  <input type="color" value={chain.color || '#FFD700'} onChange={e => update(idx, 'color', e.target.value)} />
                  <input className="admin-input admin-input-sm" value={chain.color || ''} onChange={e => update(idx, 'color', e.target.value)} />
                </div>
              </div>
              <h4 className="admin-sub-title">Zincir Halkaları ({chain.links?.length || 0})</h4>
              {(chain.links || []).map((link, li) => (
                <div key={li} className="admin-coords-row">
                  <span>From:</span>
                  <input className="admin-input admin-input-sm" type="number" value={link.from || 0}
                    onChange={e => updateLink(idx, li, 'from', +e.target.value)} />
                  <span className="admin-ref-hint">{getEntityName('scholars', link.from)}</span>
                  <span>→ To:</span>
                  <input className="admin-input admin-input-sm" type="number" value={link.to || 0}
                    onChange={e => updateLink(idx, li, 'to', +e.target.value)} />
                  <span className="admin-ref-hint">{getEntityName('scholars', link.to)}</span>
                  <button className="admin-btn-icon danger" onClick={() => removeLink(idx, li)}>×</button>
                </div>
              ))}
              <button className="admin-btn admin-btn-sm" onClick={() => addLink(idx)}>+ Halka Ekle</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BATTLE META EDITOR
   ═══════════════════════════════════════════════════════ */
export function BattleMetaEditor() {
  const { battleMeta, setBattleMeta, logChange, getEntityName } = useAdmin();
  const [search, setSearch] = useState('');

  const entries = Object.entries(battleMeta).filter(([id]) => {
    if (!search) return true;
    const name = getEntityName('battles', +id);
    return name.toLowerCase().includes(search.toLowerCase()) || id.includes(search);
  });

  const update = (id, key, val) => {
    setBattleMeta(prev => ({ ...prev, [id]: { ...prev[id], [key]: val } }));
    logChange('update', 'battleMeta', id, key, '…', val.slice(0, 60));
  };

  const metaKeys = ['cmd_m_tr', 'cmd_m_en', 'cmd_m_ar', 'cmd_o_tr', 'cmd_o_en', 'cmd_o_ar', 'opp_tr', 'opp_en', 'opp_ar', 'type_tr', 'type_en', 'type_ar', 'out_tr', 'out_en', 'out_ar', 'tactic_en', 'tactic_ar'];

  return (
    <div>
      <h2 className="admin-section-title">🗡 Savaş Detayları ({Object.keys(battleMeta).length})</h2>
      <input className="admin-input admin-search-input" placeholder="Ara (ID veya isim)..." value={search}
        onChange={e => setSearch(e.target.value)} style={{ marginBottom: 12 }} />
      {entries.slice(0, 30).map(([id, meta]) => (
        <div key={id} className="admin-meta-row">
          <div className="admin-meta-id">#{id} {getEntityName('battles', +id)}</div>
          <div className="admin-meta-fields">
            {metaKeys.map(k => (
              <div key={k} className="admin-meta-field">
                <label className="admin-label-sm">{k}</label>
                <input className={`admin-input admin-inline-edit${k.endsWith('ar') ? ' rtl' : ''}`}
                  dir={k.endsWith('ar') ? 'rtl' : 'ltr'}
                  value={meta[k] || ''} onChange={e => update(id, k, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SCHOLAR META EDITOR
   ═══════════════════════════════════════════════════════ */
export function ScholarMetaEditor() {
  const { scholarMeta, setScholarMeta, logChange, getEntityName } = useAdmin();
  const [search, setSearch] = useState('');

  const entries = Object.entries(scholarMeta).filter(([id]) => {
    if (!search) return true;
    const name = getEntityName('scholars', +id);
    return name.toLowerCase().includes(search.toLowerCase()) || id.includes(search);
  });

  const update = (id, key, val) => {
    setScholarMeta(prev => ({ ...prev, [id]: { ...prev[id], [key]: val } }));
    logChange('update', 'scholarMeta', id, key, '…', typeof val === 'string' ? val.slice(0, 60) : String(val));
  };

  const metaKeys = ['disc_tr', 'disc_en', 'disc_ar', 'city_tr', 'city_en', 'city_ar', 'works_tr', 'works_en', 'works_ar'];

  return (
    <div>
      <h2 className="admin-section-title">🎓 Âlim Detayları ({Object.keys(scholarMeta).length})</h2>
      <input className="admin-input admin-search-input" placeholder="Ara..." value={search}
        onChange={e => setSearch(e.target.value)} style={{ marginBottom: 12 }} />
      {entries.slice(0, 30).map(([id, meta]) => (
        <div key={id} className="admin-meta-row">
          <div className="admin-meta-id">#{id} {getEntityName('scholars', +id)}</div>
          <div className="admin-meta-fields">
            {metaKeys.map(k => (
              <div key={k} className="admin-meta-field">
                <label className="admin-label-sm">{k}</label>
                <input className={`admin-input admin-inline-edit${k.endsWith('ar') ? ' rtl' : ''}`}
                  dir={k.endsWith('ar') ? 'rtl' : 'ltr'}
                  value={meta[k] || ''} onChange={e => update(id, k, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CONSTANTS / COLORS / SETTINGS EDITOR
   ═══════════════════════════════════════════════════════ */
export function ConstantsEditor() {
  const { colors, setColors, layerConfig, setLayerConfig, logChange } = useAdmin();

  const updateColor = (group, key, val) => {
    setColors(prev => ({ ...prev, [group]: { ...prev[group], [key]: val } }));
    logChange('update', 'constants', group, key, '…', val);
  };

  const updateMapConfig = (key, val) => {
    setLayerConfig(prev => ({ ...prev, MAP_CONFIG: { ...prev.MAP_CONFIG, [key]: val } }));
    logChange('update', 'layerConfig', 'MAP_CONFIG', key, '…', String(val));
  };

  const ColorGroup = ({ title, group, data }) => (
    <div className="admin-const-group">
      <h3 className="admin-sub-title">{title}</h3>
      <div className="admin-const-grid">
        {Object.entries(data).map(([key, val]) => (
          <div key={key} className="admin-const-item">
            <label className="admin-label-sm">{key}</label>
            {typeof val === 'string' && val.startsWith('#') ? (
              <div className="admin-color-wrap">
                <input type="color" value={val} onChange={e => updateColor(group, key, e.target.value)} />
                <input className="admin-input admin-input-sm" value={val} onChange={e => updateColor(group, key, e.target.value)} />
              </div>
            ) : typeof val === 'number' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="range" min="0" max="1" step="0.01" value={val}
                  onChange={e => updateColor(group, key, +e.target.value)} style={{ flex: 1 }} />
                <span style={{ minWidth: 40 }}>{val.toFixed(2)}</span>
              </div>
            ) : (
              <input className="admin-input admin-input-sm" value={val || ''} onChange={e => updateColor(group, key, e.target.value)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="admin-section-title">🎨 Renk ve Ayarlar</h2>
      <ColorGroup title="Mezhep Renkleri (REL_C)" group="REL_C" data={colors.REL_C} />
      <ColorGroup title="Bölge Renkleri (ZONE_C)" group="ZONE_C" data={colors.ZONE_C} />
      <ColorGroup title="Önem Opaklıkları (IMP_OP)" group="IMP_OP" data={colors.IMP_OP} />
      <ColorGroup title="Katman Renkleri (LYR_COL)" group="LYR_COL" data={colors.LYR_COL} />

      <div className="admin-const-group">
        <h3 className="admin-sub-title">Harita Ayarları</h3>
        <div className="admin-const-grid">
          {['zoom', 'minZoom', 'maxZoom'].map(k => (
            <div key={k} className="admin-const-item">
              <label className="admin-label-sm">{k}</label>
              <input className="admin-input admin-input-sm" type="number" value={layerConfig.MAP_CONFIG?.[k] ?? ''}
                onChange={e => updateMapConfig(k, +e.target.value)} />
            </div>
          ))}
          <div className="admin-const-item">
            <label className="admin-label-sm">center lat</label>
            <input className="admin-input admin-input-sm" type="number" step="0.1"
              value={layerConfig.MAP_CONFIG?.center?.[0] ?? ''}
              onChange={e => updateMapConfig('center', [+e.target.value, layerConfig.MAP_CONFIG?.center?.[1] || 0])} />
          </div>
          <div className="admin-const-item">
            <label className="admin-label-sm">center lon</label>
            <input className="admin-input admin-input-sm" type="number" step="0.1"
              value={layerConfig.MAP_CONFIG?.center?.[1] ?? ''}
              onChange={e => updateMapConfig('center', [layerConfig.MAP_CONFIG?.center?.[0] || 0, +e.target.value])} />
          </div>
          <div className="admin-const-item" style={{ gridColumn: 'span 2' }}>
            <label className="admin-label-sm">Tile URL</label>
            <input className="admin-input" value={layerConfig.MAP_CONFIG?.tileUrl || ''}
              onChange={e => updateMapConfig('tileUrl', e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}
