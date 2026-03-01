import { useMemo } from 'react';
import DB from '../data/db.json';

/**
 * Builds a causal index keyed by "type:id"
 */
export function useCausalIndex() {
  return useMemo(() => {
    const idx = {};
    (DB.causal || []).forEach(c => {
      const sk = `${c.st}:${c.si}`, tk = `${c.tt}:${c.ti}`;
      if (!idx[sk]) idx[sk] = [];
      if (!idx[tk]) idx[tk] = [];
      idx[sk].push({ dir: 'out', ...c });
      idx[tk].push({ dir: 'in', ...c });
    });
    return idx;
  }, []);
}

/**
 * Returns unique link types and entity types from causal data
 */
export function useCausalMeta() {
  return useMemo(() => ({
    linkTypes: [...new Set((DB.causal || []).map(c => c.lt))].sort(),
    entityTypes: [...new Set((DB.causal || []).flatMap(c => [c.st, c.tt]))].sort(),
  }), []);
}
