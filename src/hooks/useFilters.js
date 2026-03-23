import { useState, useCallback } from 'react';
import { DEFAULT_LAYERS, DEFAULT_FILTERS, LAYER_KEYS } from '../config/layers';

export function useLayers() {
  const [layers, setLayers] = useState(DEFAULT_LAYERS);

  const toggleLayer = useCallback(k => setLayers(p => ({ ...p, [k]: !p[k] })), []);

  /** Show ONLY this layer, hide all others */
  const soloLayer = useCallback(k => {
    setLayers(() => {
      const next = {};
      LAYER_KEYS.forEach(lk => { next[lk] = lk === k; });
      return next;
    });
  }, []);

  /** Show all layers (reset to defaults) */
  const showAllLayers = useCallback(() => setLayers(DEFAULT_LAYERS), []);

  /** Check if exactly one layer is visible (solo mode active) */
  const isSolo = LAYER_KEYS.filter(k => layers[k]).length === 1;

  return { layers, toggleLayer, soloLayer, showAllLayers, isSolo };
}

export function useMapFilters() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const setFilter = useCallback((k, v) => setFilters(p => ({ ...p, [k]: v })), []);
  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);
  return { filters, setFilter, resetFilters };
}

/** Year range hook for time range filtering */
export function useYearRange(initialMin = 622, initialMax = 1924) {
  const [yearRange, setYearRange] = useState([initialMin, initialMax]);
  const setMin = useCallback(v => setYearRange(p => [Math.min(v, p[1]), p[1]]), []);
  const setMax = useCallback(v => setYearRange(p => [p[0], Math.max(v, p[0])]), []);
  const resetRange = useCallback(() => setYearRange([initialMin, initialMax]), []);
  return { yearRange, setYearRange, setMin, setMax, resetRange };
}
