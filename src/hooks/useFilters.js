import { useState, useCallback } from 'react';
import { DEFAULT_LAYERS, DEFAULT_FILTERS } from '../config/layers';

export function useLayers() {
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const toggleLayer = useCallback(k => setLayers(p => ({ ...p, [k]: !p[k] })), []);
  return { layers, toggleLayer };
}

export function useMapFilters() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const setFilter = useCallback((k, v) => setFilters(p => ({ ...p, [k]: v })), []);
  return { filters, setFilter };
}
