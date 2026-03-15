/**
 * AdminContext — Auth + Data Management + Changelog
 * v5.2.0.0 — Admin Panel
 */
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
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

  const logChange = useCallback((type, entity, id, field, oldVal, newVal) => {
    setChangeLog(prev => [...prev, {
      ts: Date.now(), type, entity, id, field,
      old: oldVal != null && typeof oldVal === 'string' ? oldVal.slice(0, 120) : oldVal,
      new: newVal != null && typeof newVal === 'string' ? newVal.slice(0, 120) : newVal,
    }]);
  }, []);

  /* ═══ CRUD: db.json collections ═══ */
  const updateEntity = useCallback((collection, id, updates) => {
    setDb(prev => {
      const next = { ...prev };
      next[collection] = prev[collection].map(item =>
        item.id === id ? { ...item, ...updates } : item
      );
      return next;
    });
    Object.entries(updates).forEach(([field, val]) => {
      logChange('update', collection, id, field, '…', typeof val === 'string' ? val.slice(0, 80) : val);
    });
  }, [logChange]);

  const addEntity = useCallback((collection, newItem) => {
    let assignedId;
    setDb(prev => {
      const maxId = Math.max(0, ...prev[collection].map(i => i.id || 0));
      assignedId = maxId + 1;
      const item = { ...newItem, id: assignedId };
      return { ...prev, [collection]: [...prev[collection], item] };
    });
    logChange('add', collection, assignedId, '*', null, 'new');
  }, [logChange]);

  const deleteEntity = useCallback((collection, id) => {
    if (user?.role !== 'admin') return false;
    setDb(prev => ({
      ...prev,
      [collection]: prev[collection].filter(item => item.id !== id)
    }));
    logChange('delete', collection, id, '*', 'deleted', null);
    return true;
  }, [user, logChange]);

  /* Index-based update for collections without id (relations, diplomacy) */
  const updateEntityByIndex = useCallback((collection, index, updates) => {
    setDb(prev => {
      const next = { ...prev };
      next[collection] = prev[collection].map((item, i) =>
        i === index ? { ...item, ...updates } : item
      );
      return next;
    });
    Object.entries(updates).forEach(([field, val]) => {
      logChange('update', collection, `idx:${index}`, field, '…', typeof val === 'string' ? val.slice(0, 80) : val);
    });
  }, [logChange]);

  const addEntityRaw = useCallback((collection, newItem) => {
    setDb(prev => ({ ...prev, [collection]: [...prev[collection], newItem] }));
    logChange('add', collection, '—', '*', null, 'new');
  }, [logChange]);

  const deleteEntityByIndex = useCallback((collection, index) => {
    if (user?.role !== 'admin') return false;
    setDb(prev => ({
      ...prev,
      [collection]: prev[collection].filter((_, i) => i !== index)
    }));
    logChange('delete', collection, `idx:${index}`, '*', 'deleted', null);
    return true;
  }, [user, logChange]);

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
  }, []);

  const value = useMemo(() => ({
    // Auth
    user, login, logout,
    // DB
    db, setDb, updateEntity, addEntity, deleteEntity,
    updateEntityByIndex, addEntityRaw, deleteEntityByIndex,
    getEntityName,
    // Auxiliary
    i18n, setI18n,
    tours, setTours,
    eraInfo, setEraInfo,
    glossary, setGlossary,
    scholarLinks, setScholarLinks,
    scholarMeta, setScholarMeta,
    battleMeta, setBattleMeta,
    isnadChains, setIsnadChains,
    colors, setColors,
    layerConfig, setLayerConfig,
    // Changelog
    changeLog, logChange, isDirty,
    resetAll,
  }), [user, login, logout, db, updateEntity, addEntity, deleteEntity,
    updateEntityByIndex, addEntityRaw, deleteEntityByIndex, getEntityName,
    i18n, tours, eraInfo, glossary, scholarLinks, scholarMeta, battleMeta, isnadChains,
    colors, layerConfig, changeLog, logChange, isDirty, resetAll]);

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
