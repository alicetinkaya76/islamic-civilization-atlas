/**
 * AdminContext — Auth + Data Management + Changelog + GitHub Save
 * v5.3.1.0 — Direct GitHub save from admin panel
 */
import { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import DB_ORIGINAL from '../../data/db.json';
import T_ORIGINAL from '../../data/i18n';
import TOURS_ORIGINAL from '../../data/tours';
import ERA_INFO_ORIGINAL from '../../data/era_info';
import GLOSSARY_ORIGINAL from '../../data/glossary';
import SCHOLAR_LINKS_ORIGINAL from '../../data/scholar_links';
import SCHOLAR_META_ORIGINAL from '../../data/scholar_meta';
import BATTLE_META_ORIGINAL from '../../data/battle_meta';
import ISNAD_CHAINS_ORIGINAL from '../../data/isnad_chains';
import { REL_C, ZONE_C, IMP_OP, LYR_COL, LINK_COL, NODE_COL, ENTITY_ICON } from '../../config/colors';
import { LAYER_KEYS, FILTER_KEYS, DEFAULT_LAYERS, DEFAULT_FILTERS, MAP_CONFIG } from '../../config/layers';

const AdminContext = createContext(null);

const REPO = 'alicetinkaya76/islamic-civilization-atlas';
const GITHUB_API = `https://api.github.com/repos/${REPO}/contents`;

/* ═══ Hardcoded users (client-side only) ═══ */
const USERS = [
  { username: 'admin',  password: 'atlas2026!', role: 'admin' },
  { username: 'editor', password: 'editor2026',  role: 'editor' },
];

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadSession() {
  try {
    const saved = localStorage.getItem('atlas-admin');
    if (saved) {
      const { username, role, expires } = JSON.parse(saved);
      if (Date.now() < expires) return { username, role };
    }
  } catch { /* ignore */ }
  return null;
}

/* ═══ GitHub API helpers ═══ */
async function getFileSha(path, token) {
  const res = await fetch(`${GITHUB_API}/${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`SHA fetch failed: ${res.status}`);
  const data = await res.json();
  return data.sha;
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function updateGitHubFile(path, content, message, token) {
  let sha;
  try {
    sha = await getFileSha(path, token);
  } catch {
    sha = undefined; // file might not exist — create new
  }

  const body = { message, content: utf8ToBase64(content), branch: 'main' };
  if (sha) body.sha = sha;

  const res = await fetch(`${GITHUB_API}/${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (res.status === 409 && sha) {
    // SHA conflict — retry once with fresh SHA
    const freshSha = await getFileSha(path, token);
    body.sha = freshSha;
    const retry = await fetch(`${GITHUB_API}/${path}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!retry.ok) {
      const err = await retry.json().catch(() => ({}));
      throw new Error(err.message || `GitHub API error: ${retry.status}`);
    }
    return retry.json();
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error: ${res.status}`);
  }
  return res.json();
}

/* ═══ File path mapping ═══ */
const FILE_PATHS = {
  'db.json': 'src/data/db.json',
  'i18n.js': 'src/data/i18n.js',
  'tours.js': 'src/data/tours.js',
  'era_info.js': 'src/data/era_info.js',
  'glossary.js': 'src/data/glossary.js',
  'scholar_links.js': 'src/data/scholar_links.js',
  'scholar_meta.js': 'src/data/scholar_meta.js',
  'battle_meta.js': 'src/data/battle_meta.js',
  'isnad_chains.js': 'src/data/isnad_chains.js',
  'colors.js': 'src/config/colors.js',
  'layers.js': 'src/config/layers.js',
};

export function AdminProvider({ children }) {
  /* ═══ Auth ═══ */
  const [user, setUser] = useState(loadSession);

  const login = useCallback((username, password) => {
    const u = USERS.find(u => u.username === username && u.password === password);
    if (!u) return false;
    const session = { username: u.username, role: u.role, expires: Date.now() + 24 * 60 * 60 * 1000 };
    try { localStorage.setItem('atlas-admin', JSON.stringify(session)); } catch {}
    setUser({ username: u.username, role: u.role });
    return true;
  }, []);

  const logout = useCallback(() => {
    try { localStorage.removeItem('atlas-admin'); } catch {}
    setUser(null);
  }, []);

  /* ═══ Data stores ═══ */
  const [db, setDb] = useState(() => deepClone(DB_ORIGINAL));
  const [i18n, setI18n] = useState(() => deepClone(T_ORIGINAL));
  const [tours, setTours] = useState(() => deepClone(TOURS_ORIGINAL));
  const [eraInfo, setEraInfo] = useState(() => deepClone(ERA_INFO_ORIGINAL));
  const [glossary, setGlossary] = useState(() => deepClone(GLOSSARY_ORIGINAL));
  const [scholarLinks, setScholarLinks] = useState(() => deepClone(SCHOLAR_LINKS_ORIGINAL));
  const [scholarMeta, setScholarMeta] = useState(() => deepClone(SCHOLAR_META_ORIGINAL));
  const [battleMeta, setBattleMeta] = useState(() => deepClone(BATTLE_META_ORIGINAL));
  const [isnadChains, setIsnadChains] = useState(() => deepClone(ISNAD_CHAINS_ORIGINAL));

  /* Constants & Layers as editable state */
  const [colors, setColors] = useState(() => deepClone({ REL_C, ZONE_C, IMP_OP, LYR_COL, LINK_COL, NODE_COL, ENTITY_ICON }));
  const [layerConfig, setLayerConfig] = useState(() => deepClone({ LAYER_KEYS, FILTER_KEYS, DEFAULT_LAYERS, DEFAULT_FILTERS, MAP_CONFIG }));

  /* ═══ Changelog ═══ */
  const [changeLog, setChangeLog] = useState([]);

  /* ═══ Dirty files tracking ═══ */
  const [dirtyFiles, setDirtyFiles] = useState(new Set());

  /* ═══ Undo/Redo History (Command Pattern) ═══ */
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false); // prevent recording during undo/redo

  const pushHistory = useCallback((command) => {
    if (isUndoRedoRef.current) return;
    setHistory(prev => {
      // Truncate any redo history beyond current index
      const base = prev.slice(0, historyIndex + 1);
      const next = [...base, command];
      // Limit history to 100 items
      if (next.length > 100) next.shift();
      return next;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 99));
  }, [historyIndex]);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  const undo = useCallback(() => {
    if (historyIndex < 0 || !history[historyIndex]) return null;
    const cmd = history[historyIndex];
    isUndoRedoRef.current = true;

    if (cmd.type === 'update') {
      setDb(prev => {
        const next = { ...prev };
        next[cmd.collection] = prev[cmd.collection].map(item =>
          item.id === cmd.id ? { ...item, ...cmd.oldData } : item
        );
        return next;
      });
      markDirty('db.json');
    } else if (cmd.type === 'add') {
      setDb(prev => ({
        ...prev,
        [cmd.collection]: prev[cmd.collection].filter(item => item.id !== cmd.itemId)
      }));
      markDirty('db.json');
    } else if (cmd.type === 'delete') {
      setDb(prev => {
        const arr = [...prev[cmd.collection]];
        arr.splice(cmd.index, 0, cmd.item);
        return { ...prev, [cmd.collection]: arr };
      });
      markDirty('db.json');
    }

    setHistoryIndex(prev => prev - 1);
    isUndoRedoRef.current = false;
    return cmd;
  }, [history, historyIndex, markDirty]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return null;
    const cmd = history[historyIndex + 1];
    isUndoRedoRef.current = true;

    if (cmd.type === 'update') {
      setDb(prev => {
        const next = { ...prev };
        next[cmd.collection] = prev[cmd.collection].map(item =>
          item.id === cmd.id ? { ...item, ...cmd.newData } : item
        );
        return next;
      });
      markDirty('db.json');
    } else if (cmd.type === 'add') {
      setDb(prev => ({
        ...prev,
        [cmd.collection]: [...prev[cmd.collection], cmd.item]
      }));
      markDirty('db.json');
    } else if (cmd.type === 'delete') {
      setDb(prev => ({
        ...prev,
        [cmd.collection]: prev[cmd.collection].filter(item => item.id !== cmd.item.id)
      }));
      markDirty('db.json');
    }

    setHistoryIndex(prev => prev + 1);
    isUndoRedoRef.current = false;
    return cmd;
  }, [history, historyIndex, markDirty]);

  const markDirty = useCallback((fileName) => {
    setDirtyFiles(prev => {
      const next = new Set(prev);
      next.add(fileName);
      return next;
    });
  }, []);

  const logChange = useCallback((type, entity, id, field, oldVal, newVal) => {
    setChangeLog(prev => [...prev, {
      ts: Date.now(), type, entity, id, field,
      old: oldVal != null && typeof oldVal === 'string' ? oldVal.slice(0, 120) : oldVal,
      new: newVal != null && typeof newVal === 'string' ? newVal.slice(0, 120) : newVal,
    }]);
  }, []);

  /* ═══ CRUD: db.json collections ═══ */
  const updateEntity = useCallback((collection, id, updates) => {
    /* Capture old data for undo */
    const oldItem = db[collection]?.find(item => item.id === id);
    if (oldItem) {
      const oldData = {};
      for (const k of Object.keys(updates)) oldData[k] = oldItem[k];
      pushHistory({ type: 'update', collection, id, oldData, newData: updates });
    }

    setDb(prev => {
      const next = { ...prev };
      next[collection] = prev[collection].map(item =>
        item.id === id ? { ...item, ...updates } : item
      );
      return next;
    });
    markDirty('db.json');
    Object.entries(updates).forEach(([field, val]) => {
      logChange('update', collection, id, field, '…', typeof val === 'string' ? val.slice(0, 80) : val);
    });
  }, [db, logChange, markDirty, pushHistory]);

  const addEntity = useCallback((collection, newItem) => {
    let assignedId;
    setDb(prev => {
      const maxId = Math.max(0, ...prev[collection].map(i => i.id || 0));
      assignedId = maxId + 1;
      const item = { ...newItem, id: assignedId };
      pushHistory({ type: 'add', collection, itemId: assignedId, item });
      return { ...prev, [collection]: [...prev[collection], item] };
    });
    markDirty('db.json');
    logChange('add', collection, assignedId, '*', null, 'new');
  }, [logChange, markDirty, pushHistory]);

  const deleteEntity = useCallback((collection, id) => {
    if (user?.role !== 'admin') return false;
    /* Capture item + index for undo */
    const arr = db[collection] || [];
    const idx = arr.findIndex(item => item.id === id);
    const item = idx >= 0 ? deepClone(arr[idx]) : null;
    if (item) pushHistory({ type: 'delete', collection, item, index: idx });

    setDb(prev => ({
      ...prev,
      [collection]: prev[collection].filter(item => item.id !== id)
    }));
    markDirty('db.json');
    logChange('delete', collection, id, '*', 'deleted', null);
    return true;
  }, [user, db, logChange, markDirty, pushHistory]);

  /* Index-based update for collections without id (relations, diplomacy) */
  const updateEntityByIndex = useCallback((collection, index, updates) => {
    setDb(prev => {
      const next = { ...prev };
      next[collection] = prev[collection].map((item, i) =>
        i === index ? { ...item, ...updates } : item
      );
      return next;
    });
    markDirty('db.json');
    Object.entries(updates).forEach(([field, val]) => {
      logChange('update', collection, `idx:${index}`, field, '…', typeof val === 'string' ? val.slice(0, 80) : val);
    });
  }, [logChange, markDirty]);

  const addEntityRaw = useCallback((collection, newItem) => {
    setDb(prev => ({ ...prev, [collection]: [...prev[collection], newItem] }));
    markDirty('db.json');
    logChange('add', collection, '—', '*', null, 'new');
  }, [logChange, markDirty]);

  const deleteEntityByIndex = useCallback((collection, index) => {
    if (user?.role !== 'admin') return false;
    setDb(prev => ({
      ...prev,
      [collection]: prev[collection].filter((_, i) => i !== index)
    }));
    markDirty('db.json');
    logChange('delete', collection, `idx:${index}`, '*', 'deleted', null);
    return true;
  }, [user, logChange, markDirty]);

  /* ═══ Wrapped setters that track dirty ═══ */
  const setI18nDirty = useCallback((updater) => {
    setI18n(typeof updater === 'function' ? updater : () => updater);
    markDirty('i18n.js');
  }, [markDirty]);
  const setToursDirty = useCallback((updater) => {
    setTours(typeof updater === 'function' ? updater : () => updater);
    markDirty('tours.js');
  }, [markDirty]);
  const setEraInfoDirty = useCallback((updater) => {
    setEraInfo(typeof updater === 'function' ? updater : () => updater);
    markDirty('era_info.js');
  }, [markDirty]);
  const setGlossaryDirty = useCallback((updater) => {
    setGlossary(typeof updater === 'function' ? updater : () => updater);
    markDirty('glossary.js');
  }, [markDirty]);
  const setScholarLinksDirty = useCallback((updater) => {
    setScholarLinks(typeof updater === 'function' ? updater : () => updater);
    markDirty('scholar_links.js');
  }, [markDirty]);
  const setScholarMetaDirty = useCallback((updater) => {
    setScholarMeta(typeof updater === 'function' ? updater : () => updater);
    markDirty('scholar_meta.js');
  }, [markDirty]);
  const setBattleMetaDirty = useCallback((updater) => {
    setBattleMeta(typeof updater === 'function' ? updater : () => updater);
    markDirty('battle_meta.js');
  }, [markDirty]);
  const setIsnadChainsDirty = useCallback((updater) => {
    setIsnadChains(typeof updater === 'function' ? updater : () => updater);
    markDirty('isnad_chains.js');
  }, [markDirty]);
  const setColorsDirty = useCallback((updater) => {
    setColors(typeof updater === 'function' ? updater : () => updater);
    markDirty('colors.js');
  }, [markDirty]);
  const setLayerConfigDirty = useCallback((updater) => {
    setLayerConfig(typeof updater === 'function' ? updater : () => updater);
    markDirty('layers.js');
  }, [markDirty]);

  /* ═══ Entity lookup helper (for ref fields) ═══ */
  const getEntityName = useCallback((collection, id) => {
    const arr = db[collection];
    if (!arr) return `#${id}`;
    const item = arr.find(i => i.id === id);
    if (!item) return `#${id}`;
    return item.tr || item.n || item.en || `#${id}`;
  }, [db]);

  /* ═══ Dirty tracking ═══ */
  const isDirty = useMemo(() => changeLog.length > 0, [changeLog]);

  /* ═══ GitHub Save ═══ */
  const getFileContentGenerators = useCallback(() => {
    const generateDbJson = (data) => JSON.stringify(data, null, 2);
    const generateJsModule = (varName, data, header) => {
      const h = header ? `/* ${header} */\n` : '';
      return `${h}const ${varName} = ${JSON.stringify(data, null, 2)};\n\nexport default ${varName};\n`;
    };
    const generateI18nJs = (data) => `const T = ${JSON.stringify(data, null, 2)};\n\nexport default T;\n`;
    const generateColorsJs = (cols) => {
      let out = '/* ═══ Color Palettes ═══ */\n\n';
      for (const [name, obj] of Object.entries(cols)) out += `export const ${name} = ${JSON.stringify(obj, null, 2)};\n\n`;
      return out;
    };
    const generateLayersJs = (cfg) => {
      let out = '/* ═══ Layer Configuration ═══ */\n\n';
      for (const [name, val] of Object.entries(cfg)) out += `export const ${name} = ${JSON.stringify(val, null, 2)};\n\n`;
      return out;
    };
    return {
      'db.json': () => generateDbJson(db),
      'i18n.js': () => generateI18nJs(i18n),
      'tours.js': () => generateJsModule('TOURS', tours, '═══ Guided Tour Definitions ═══'),
      'era_info.js': () => generateJsModule('ERA_INFO', eraInfo, '═══ Dönem Bilgi Kartları ═══'),
      'glossary.js': () => generateJsModule('glossary', glossary, '═══ Sözlük / Glossary ═══'),
      'scholar_links.js': () => generateJsModule('SCHOLAR_LINKS', scholarLinks, '═══ Scholar Links ═══'),
      'scholar_meta.js': () => generateJsModule('SCHOLAR_META', scholarMeta, '═══ Scholar Meta ═══'),
      'battle_meta.js': () => generateJsModule('BATTLE_META', battleMeta, '═══ Battle Meta ═══'),
      'isnad_chains.js': () => generateJsModule('ISNAD_CHAINS', isnadChains, '═══ İsnâd Zincirleri ═══'),
      'colors.js': () => generateColorsJs(colors),
      'layers.js': () => generateLayersJs(layerConfig),
    };
  }, [db, i18n, tours, eraInfo, glossary, scholarLinks, scholarMeta, battleMeta, isnadChains, colors, layerConfig]);

  const buildCommitMessage = useCallback(() => {
    const fileList = [...dirtyFiles].join(', ');
    let msg = `admin: update ${fileList}\n\nChanges by editor (admin panel):`;
    const items = changeLog.slice(0, 10);
    for (const c of items) {
      if (c.type === 'add') msg += `\n- ${c.entity} #${c.id}: new`;
      else if (c.type === 'delete') msg += `\n- ${c.entity} #${c.id}: deleted`;
      else msg += `\n- ${c.entity} #${c.id}: ${c.field} updated`;
    }
    if (changeLog.length > 10) msg += `\n... and ${changeLog.length - 10} more`;
    msg += `\n[${changeLog.length} changes total]`;
    return msg;
  }, [dirtyFiles, changeLog]);

  const saveToGitHub = useCallback(async (token, onProgress) => {
    const generators = getFileContentGenerators();
    const filesToSave = [...dirtyFiles].filter(f => generators[f] && FILE_PATHS[f]);
    const commitMsg = buildCommitMessage();

    const fileStates = filesToSave.map(f => {
      const content = generators[f]();
      const sizeBytes = new TextEncoder().encode(content).length;
      const sizeKB = Math.round(sizeBytes / 1024);
      return {
        name: f, path: FILE_PATHS[f], content,
        size: sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`,
        status: 'pending', error: null
      };
    });

    onProgress(fileStates, commitMsg);

    for (let i = 0; i < fileStates.length; i++) {
      fileStates[i].status = 'saving';
      onProgress([...fileStates], commitMsg);
      try {
        await updateGitHubFile(fileStates[i].path, fileStates[i].content, commitMsg, token);
        fileStates[i].status = 'done';
      } catch (err) {
        fileStates[i].status = 'error';
        fileStates[i].error = err.message;
      }
      onProgress([...fileStates], commitMsg);
    }

    const allOk = fileStates.every(f => f.status === 'done');
    if (allOk) {
      setDirtyFiles(new Set());
      setChangeLog([]);
    }
    return { ok: allOk, files: fileStates };
  }, [dirtyFiles, getFileContentGenerators, buildCommitMessage]);

  /* ═══ Reset all data ═══ */
  const resetAll = useCallback(() => {
    setDb(deepClone(DB_ORIGINAL));
    setI18n(deepClone(T_ORIGINAL));
    setTours(deepClone(TOURS_ORIGINAL));
    setEraInfo(deepClone(ERA_INFO_ORIGINAL));
    setGlossary(deepClone(GLOSSARY_ORIGINAL));
    setScholarLinks(deepClone(SCHOLAR_LINKS_ORIGINAL));
    setScholarMeta(deepClone(SCHOLAR_META_ORIGINAL));
    setBattleMeta(deepClone(BATTLE_META_ORIGINAL));
    setIsnadChains(deepClone(ISNAD_CHAINS_ORIGINAL));
    setColors(deepClone({ REL_C, ZONE_C, IMP_OP, LYR_COL, LINK_COL, NODE_COL, ENTITY_ICON }));
    setLayerConfig(deepClone({ LAYER_KEYS, FILTER_KEYS, DEFAULT_LAYERS, DEFAULT_FILTERS, MAP_CONFIG }));
    setChangeLog([]);
    setDirtyFiles(new Set());
  }, []);

  const value = useMemo(() => ({
    // Auth
    user, login, logout,
    // DB
    db, setDb, updateEntity, addEntity, deleteEntity,
    updateEntityByIndex, addEntityRaw, deleteEntityByIndex,
    getEntityName,
    // Undo/Redo
    undo, redo, canUndo, canRedo,
    // Auxiliary (dirty-tracking wrappers)
    i18n, setI18n: setI18nDirty,
    tours, setTours: setToursDirty,
    eraInfo, setEraInfo: setEraInfoDirty,
    glossary, setGlossary: setGlossaryDirty,
    scholarLinks, setScholarLinks: setScholarLinksDirty,
    scholarMeta, setScholarMeta: setScholarMetaDirty,
    battleMeta, setBattleMeta: setBattleMetaDirty,
    isnadChains, setIsnadChains: setIsnadChainsDirty,
    colors, setColors: setColorsDirty,
    layerConfig, setLayerConfig: setLayerConfigDirty,
    // Changelog & dirty
    changeLog, logChange, isDirty,
    dirtyFiles,
    // GitHub
    saveToGitHub, buildCommitMessage,
    // Reset
    resetAll,
  }), [user, login, logout, db, updateEntity, addEntity, deleteEntity,
    updateEntityByIndex, addEntityRaw, deleteEntityByIndex, getEntityName,
    undo, redo, canUndo, canRedo,
    i18n, setI18nDirty, tours, setToursDirty, eraInfo, setEraInfoDirty,
    glossary, setGlossaryDirty, scholarLinks, setScholarLinksDirty,
    scholarMeta, setScholarMetaDirty, battleMeta, setBattleMetaDirty,
    isnadChains, setIsnadChainsDirty, colors, setColorsDirty,
    layerConfig, setLayerConfigDirty,
    changeLog, logChange, isDirty, dirtyFiles,
    saveToGitHub, buildCommitMessage, resetAll]);

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
