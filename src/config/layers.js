/* ═══ Layer Configuration ═══ */

export const LAYER_KEYS = ['dynasties', 'battles', 'events', 'scholars', 'monuments', 'cities', 'routes', 'rulers', 'madrasas'];

export const FILTER_KEYS = ['religion', 'ethnic', 'government', 'period', 'zone'];

export const DEFAULT_LAYERS = {
  dynasties: true, battles: true, events: true,
  scholars: true, monuments: true, cities: true, routes: true, rulers: false, madrasas: true
};

export const DEFAULT_FILTERS = {
  religion: '', ethnic: '', government: '', period: '', zone: ''
};

export const MAP_CONFIG = {
  center: [30, 42],
  zoom: 4,
  minZoom: 3,
  maxZoom: 10,
  tileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};
