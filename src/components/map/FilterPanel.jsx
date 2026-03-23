import { LYR_COL } from '../../config/colors';
import { LAYER_KEYS } from '../../config/layers';
import DB from '../../data/db.json';

const META = {};
LAYER_KEYS.forEach(k => {
  const dataKey = k === 'routes' ? 'routes' : k;
  META[k] = { c: LYR_COL[k], n: DB[dataKey]?.length || 0 };
});

const L_TR = { tr: 'Katmanlar', en: 'Layers', ar: 'الطبقات' };
const F_TR = { tr: 'Filtreler', en: 'Filters', ar: 'المرشحات' };
const S_TR = { tr: 'Durum', en: 'Status', ar: 'الحالة' };
const CLOSE_TR = { tr: 'Paneli kapat', en: 'Close panel', ar: 'إغلاق اللوحة' };
const CTRL_TR = { tr: 'Harita kontrolleri', en: 'Map controls', ar: 'أدوات التحكم بالخريطة' };
const ALL_TR = { tr: 'Tümü', en: 'All', ar: 'الكل' };
const SOLO_TR = { tr: 'Sadece', en: 'Only', ar: 'فقط' };
const TIME_TR = { tr: 'Zaman Aralığı', en: 'Time Range', ar: 'النطاق الزمني' };
const RESET_TR = { tr: 'Sıfırla', en: 'Reset', ar: 'إعادة' };

export default function FilterPanel({
  lang, t, layers, toggleLayer, soloLayer, showAllLayers, isSolo,
  filters, setFilter, resetFilters, uniques,
  activeCount, year,
  yearRange, setMin, setMax, resetRange,
  sidebarOpen, onCloseMobile, inBottomSheet
}) {
  return (
    <div className={`map-panel${sidebarOpen ? ' mobile-visible' : ''}${inBottomSheet ? ' in-bottom-sheet' : ''}`}
      role="complementary" aria-label={CTRL_TR[lang]}>
      {/* Mobile close button — hide when in bottom sheet */}
      {!inBottomSheet && <button className="map-panel-close" onClick={onCloseMobile} aria-label={CLOSE_TR[lang]}>✕</button>}

      {/* ── Layers ── */}
      <div className="ps">
        <div className="ps-h">
          {L_TR[lang]}
          {isSolo && (
            <button className="lyr-show-all" onClick={showAllLayers} title={ALL_TR[lang]}>
              ↩ {ALL_TR[lang]}
            </button>
          )}
        </div>
        <div className={inBottomSheet ? 'lyr-grid' : ''}>
          {LAYER_KEYS.map(k => (
            <div key={k} className={`lyr${layers[k] ? '' : ' lyr-off'}`}>
              <div className={`lyr-cb${layers[k] ? ' on' : ''}`} onClick={() => toggleLayer(k)}>
                {layers[k] ? '✓' : ''}
              </div>
              <div className="lyr-dot" style={{ background: META[k].c }} />
              <span className="lyr-label" onClick={() => toggleLayer(k)}>{t.layers[k]}</span>
              <span className="lyr-n">{META[k].n}</span>
              <button
                className={`lyr-solo${layers[k] && isSolo ? ' active' : ''}`}
                onClick={(e) => { e.stopPropagation(); soloLayer(k); }}
                title={`${SOLO_TR[lang]}: ${t.layers[k]}`}
              >
                ◎
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Dynasty Filters ── */}
      <div className="ps">
        <div className="ps-h">
          {F_TR[lang]}
          {(filters.religion || filters.ethnic || filters.government || filters.period || filters.zone) && (
            <button className="lyr-show-all" onClick={resetFilters} title={RESET_TR[lang]}>
              ↩ {RESET_TR[lang]}
            </button>
          )}
        </div>
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

      {/* ── Time Range Filter ── */}
      {yearRange && (
        <div className="ps">
          <div className="ps-h">
            {TIME_TR[lang]}
            {(yearRange[0] !== 622 || yearRange[1] !== 1924) && (
              <button className="lyr-show-all" onClick={resetRange} title={RESET_TR[lang]}>
                ↩ {RESET_TR[lang]}
              </button>
            )}
          </div>
          <div className="yr-range">
            <div className="yr-range-labels">
              <span>{yearRange[0]}</span>
              <span className="yr-range-span">{yearRange[1] - yearRange[0]} {lang === 'ar' ? 'سنة' : lang === 'en' ? 'yrs' : 'yıl'}</span>
              <span>{yearRange[1]}</span>
            </div>
            <div className="yr-range-sliders">
              <input type="range" className="yr-range-input yr-range-min"
                min={622} max={1924} value={yearRange[0]}
                onChange={e => setMin(+e.target.value)}
              />
              <input type="range" className="yr-range-input yr-range-max"
                min={622} max={1924} value={yearRange[1]}
                onChange={e => setMax(+e.target.value)}
              />
            </div>
            <div className="yr-range-inputs">
              <input type="number" className="yr-num" min={622} max={1924}
                value={yearRange[0]}
                onChange={e => { const v = +e.target.value; if (v >= 622 && v <= yearRange[1]) setMin(v); }}
              />
              <span className="yr-range-dash">–</span>
              <input type="number" className="yr-num" min={622} max={1924}
                value={yearRange[1]}
                onChange={e => { const v = +e.target.value; if (v >= yearRange[0] && v <= 1924) setMax(v); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Status ── */}
      <div className="ps">
        <div className="ps-h">{S_TR[lang]}</div>
        <div className="st"><span className="st-l">{t.m.year}</span><span className="st-v">{year}</span></div>
        <div className="st"><span className="st-l">{t.m.active}</span><span className="st-v">{activeCount}</span></div>
        <div className="st"><span className="st-l">🔗</span><span className="st-v">{DB.causal?.length || 0}</span></div>
      </div>
    </div>
  );
}
