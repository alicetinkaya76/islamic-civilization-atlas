import { useMemo } from 'react';
import DB from '../data/db.json';

/** Utility: get localized name */
export const n = (o, lang) => lang === 'tr' ? o.tr : o.en;

/** Localized field helper: picks _tr or _en suffix, with fallback */
export const lf = (obj, field, lang) => {
  const primary = lang === 'tr' ? obj[`${field}_tr`] : obj[`${field}_en`];
  if (primary) return primary;
  // Fallback to other language
  const fallback = lang === 'tr' ? obj[`${field}_en`] : obj[`${field}_tr`];
  return fallback || '';
};

/**
 * Builds a name lookup map keyed by "type:id"
 */
export function useNameMap(lang) {
  return useMemo(() => {
    const m = {};
    DB.dynasties.forEach(d => { m[`dynasty:${d.id}`] = n(d, lang); });
    DB.battles.forEach(b => { m[`battle:${b.id}`] = n(b, lang); });
    DB.events.forEach(e => { m[`event:${e.id}`] = n(e, lang); });
    DB.scholars.forEach(s => { m[`scholar:${s.id}`] = n(s, lang); });
    DB.monuments.forEach(mon => { m[`monument:${mon.id}`] = n(mon, lang); });
    return m;
  }, [lang]);
}

/**
 * Builds analytics lookup map
 */
export function useAnalyticsMap() {
  return useMemo(() => {
    const m = {};
    DB.analytics.forEach(a => { m[a.id] = a; });
    return m;
  }, []);
}

/**
 * Builds unique filter values for dynasties
 */
export function useFilterUniques() {
  return useMemo(() => ({
    religion: [...new Set(DB.dynasties.map(d => d.rel).filter(Boolean))],
    ethnic: [...new Set(DB.dynasties.map(d => d.eth).filter(Boolean))].sort(),
    government: [...new Set(DB.dynasties.map(d => d.gov).filter(Boolean))].sort(),
    period: [...new Set(DB.dynasties.map(d => d.period).filter(Boolean))].sort(),
    zone: [...new Set(DB.dynasties.map(d => d.zone).filter(Boolean))].sort(),
  }), []);
}
