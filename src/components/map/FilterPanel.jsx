import { LYR_COL } from '../../config/colors';
import { LAYER_KEYS } from '../../config/layers';
import DB from '../../data/db.json';

const META = {};
LAYER_KEYS.forEach(k => {
  const dataKey = k === 'routes' ? 'routes' : k;
  META[k] = { c: LYR_COL[k], n: DB[dataKey]?.length || 0 };
});

export default function FilterPanel({ lang, t, layers, toggleLayer, filters, setFilter, uniques, activeCount, year, sidebarOpen, onCloseMobile }) {
  return (
    <div className={`map-panel${sidebarOpen ? ' mobile-visible' : ''}`} role="complementary" aria-label={lang === 'tr' ? 'Harita kontrolleri' : 'Map controls'}>
      {/* Mobile close button */}
      <button className="map-panel-close" onClick={onCloseMobile} aria-label={lang === 'tr' ? 'Paneli kapat' : 'Close panel'}>✕</button>
      {/* Layers */}
      <div className="ps">
        <div className="ps-h">{lang === 'tr' ? 'Katmanlar' : 'Layers'}</div>
        {LAYER_KEYS.map(k => (
          <div key={k} className="lyr" onClick={() => toggleLayer(k)}>
            <div className={`lyr-cb${layers[k] ? ' on' : ''}`}>{layers[k] ? '✓' : ''}</div>
            <div className="lyr-dot" style={{ background: META[k].c }} />
            <span>{t.layers[k]}</span>
            <span className="lyr-n">{META[k].n}</span>
          </div>
        ))}
      </div>
      {/* Filters */}
      <div className="ps">
        <div className="ps-h">{lang === 'tr' ? 'Filtreler' : 'Filters'}</div>
        {['religion', 'ethnic', 'government', 'period', 'zone'].map(fk => (
          <div key={fk} className="flt">
            <div className="flt-l">{t.filters[fk]}</div>
            <select className="flt-s" value={filters[fk]} onChange={e => setFilter(fk, e.target.value)}>
              <option value="">{t.filters.all}</option>
              {uniques[fk].map(v => (
                <option key={v} value={v}>{fk === 'religion' ? (t.rel[v] || v) : fk === 'government' ? (t.gov[v] || v) : v}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      {/* Status */}
      <div className="ps">
        <div className="ps-h">{lang === 'tr' ? 'Durum' : 'Status'}</div>
        <div className="st"><span className="st-l">{t.m.year}</span><span className="st-v">{year}</span></div>
        <div className="st"><span className="st-l">{t.m.active}</span><span className="st-v">{activeCount}</span></div>
        <div className="st"><span className="st-l">🔗</span><span className="st-v">{DB.causal?.length || 0}</span></div>
      </div>
    </div>
  );
}
