/* ═══ Layer Configuration ═══ */

export const LAYER_KEYS = ['dynasties', 'battles', 'events', 'scholars', 'monuments', 'cities', 'routes', 'rulers'];

export const FILTER_KEYS = ['religion', 'ethnic', 'government', 'period', 'zone'];

export const DEFAULT_LAYERS = {
  dynasties: true, battles: true, events: true,
  scholars: true, monuments: true, cities: true, routes: true, rulers: false
};

export const DEFAULT_FILTERS = {
  religion: '', ethnic: '', government: '', period: '', zone: ''
};

export const MAP_CONFIG = {
  center: [30, 42],
  zoom: 4,
  minZoom: 3,
  maxZoom: 10,
  tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
  labelUrl: 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
};
