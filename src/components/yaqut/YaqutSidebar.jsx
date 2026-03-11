import { useState, useCallback, useRef, useEffect } from 'react';

/* ═══ Geo type color + icon map ═══ */
const GEO_COLORS = {
  city:       '#d4a84b', // altın
  village:    '#66bb6a', // yeşil
  mountain:   '#a1887f', // kahverengi
  river:      '#4fc3f7', // mavi
  fortress:   '#ef5350', // kırmızı
  region:     '#ce93d8', // mor
  town:       '#ff8a65', // turuncu
  district:   '#ffb74d', // açık turuncu
  valley:     '#81c784', // açık yeşil
  water:      '#29b6f6', // koyu mavi
  well:       '#4dd0e1', // turkuaz
  monastery:  '#9575cd', // lacivert
  spring:     '#26c6da', // cyan
  pass:       '#8d6e63', // koyu kahve
  island:     '#4db6ac', // teal
  desert:     '#ffd54f', // sarı
  place:      '#90a4ae', // gri
  market:     '#f06292', // pembe
  quarter:    '#78909c', // gri-mavi
  wadi:       '#aed581', // lime
  sea:        '#1565c0', // koyu mavi
};

const GEO_ICONS = {
  city: '🏙', village: '🏘', mountain: '⛰', river: '🏞', fortress: '🏰',
  region: '📍', town: '🏛', district: '📌', valley: '🌿', water: '💧',
  well: '🕳', monastery: '⛪', spring: '💦', pass: '🛤', island: '🏝',
  desert: '🏜', place: '📍', market: '🏪', quarter: '🏠', wadi: '🌊', sea: '🌊',
};

/* ═══ Virtual list ═══ */
const ITEM_HEIGHT = 68;
const OVERSCAN = 5;

function VirtualList({ items, selectedId, onSelect, lang }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries) setContainerHeight(e.contentRect.height);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const endIdx = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN);
  const totalHeight = items.length * ITEM_HEIGHT;
  const offsetY = startIdx * ITEM_HEIGHT;
  const visible = items.slice(startIdx, endIdx);

  return (
    <div ref={containerRef} className="yaqut-list-container" onScroll={handleScroll}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
          {visible.map(e => (
            <div key={e.id}
              className={`yaqut-list-item${e.id === selectedId ? ' selected' : ''}`}
              style={{ height: ITEM_HEIGHT }}
              onClick={() => onSelect(e.id)}>
              <div className="yaqut-list-top">
                <span className="yaqut-list-icon" style={{ color: GEO_COLORS[e.gt] || '#90a4ae' }}>
                  {GEO_ICONS[e.gt] || '📍'}
                </span>
                <div className="yaqut-list-heading" dir="rtl">{e.h}</div>
              </div>
              <div className="yaqut-list-name">{lang === 'tr' ? e.ht : e.he}</div>
              <div className="yaqut-list-meta">
                <span className="yaqut-list-type">{lang === 'tr' ? e.gtt : e.gte}</span>
                {e.ct && <span className="yaqut-list-country"> · {e.ct}</span>}
                {(e.pc > 0) && <span className="yaqut-list-xref"> · 👤{e.pc}</span>}
                {e.ds && <span className="yaqut-list-dia"> · DİA</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ Geo type TR → EN map ═══ */
const GEO_EN = {
  city: 'City', village: 'Village', mountain: 'Mountain', river: 'River',
  fortress: 'Fortress', region: 'Region', town: 'Town', district: 'District',
  valley: 'Valley', water: 'Water', well: 'Well', monastery: 'Monastery',
  spring: 'Spring', pass: 'Pass', island: 'Island', desert: 'Desert',
  place: 'Place', market: 'Market', quarter: 'Quarter', wadi: 'Wadi', sea: 'Sea',
};

const GEO_TR = {
  city: 'Şehir', village: 'Köy', mountain: 'Dağ', river: 'Nehir',
  fortress: 'Kale', region: 'Bölge', town: 'Kasaba', district: 'Nahiye',
  valley: 'Vadi', water: 'Su', well: 'Kuyu', monastery: 'Manastır',
  spring: 'Pınar', pass: 'Geçit', island: 'Ada', desert: 'Çöl',
  place: 'Mevki', market: 'Pazar', quarter: 'Mahalle', wadi: 'Kuru Dere', sea: 'Deniz',
};

/* ═══ Period TR/EN ═══ */
const PERIOD_LABEL = {
  active: { tr: 'Aktif', en: 'Active' },
  ruined: { tr: 'Harap', en: 'Ruined' },
  legendary: { tr: 'Efsanevî', en: 'Legendary' },
};

export default function YaqutSidebar({
  lang, ty, filtered, search, setSearch,
  selectedGeoTypes, setSelectedGeoTypes,
  selectedCountry, setSelectedCountry,
  selectedLetter, setSelectedLetter,
  selectedPeriod, setSelectedPeriod,
  selectedTags, setSelectedTags,
  crossRefRange, setCrossRefRange,
  selectedId, onSelect,
  topGeoTypes, allCountries, allLetters, topTags, periods,
}) {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const debounceRef = useRef(null);

  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 200);
  }, [setSearch]);

  const toggleGeoType = useCallback((gt) => {
    setSelectedGeoTypes(prev => {
      const next = new Set(prev);
      if (next.has(gt)) next.delete(gt);
      else next.add(gt);
      return next;
    });
  }, [setSelectedGeoTypes]);

  const toggleTag = useCallback((tag) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, [setSelectedTags]);

  const isTr = lang === 'tr';

  return (
    <div className="yaqut-sidebar-inner">
      {/* Search */}
      <div className="yaqut-search-row">
        <span className="yaqut-search-icon">🔍</span>
        <input type="text" className="yaqut-search-input"
          placeholder={ty.search || 'Search…'}
          defaultValue={search}
          onChange={handleSearchChange}
          aria-label={ty.search} />
      </div>

      {/* Filters toggle */}
      <button className="yaqut-filters-toggle" onClick={() => setFiltersOpen(p => !p)}>
        {filtersOpen ? '▾' : '▸'} {isTr ? 'Filtreler' : 'Filters'}
        <span className="yaqut-filter-count">{filtered.length.toLocaleString()} {ty.entries || 'giriş'}</span>
      </button>

      {filtersOpen && (
        <div className="yaqut-filters">
          {/* Arabic Letter */}
          <div className="yaqut-filter-group">
            <label className="yaqut-filter-label">{ty.letter || 'Harf (الحرف)'}</label>
            <div className="yaqut-letter-chips">
              {allLetters.map(lt => (
                <button key={lt}
                  className={`yaqut-letter-chip${selectedLetter === lt ? ' active' : ''}`}
                  onClick={() => setSelectedLetter(selectedLetter === lt ? '' : lt)}>
                  {lt}
                </button>
              ))}
            </div>
          </div>

          {/* Geo Type chips */}
          <div className="yaqut-filter-group">
            <label className="yaqut-filter-label">{ty.geoType || 'Coğrafi Tip'}</label>
            <div className="yaqut-geo-chips">
              {topGeoTypes.map(gt => (
                <button key={gt}
                  className={`yaqut-geo-chip${selectedGeoTypes.has(gt) ? ' active' : ''}`}
                  style={{
                    color: GEO_COLORS[gt] || '#90a4ae',
                    borderColor: selectedGeoTypes.has(gt) ? (GEO_COLORS[gt] || '#90a4ae') : 'transparent'
                  }}
                  onClick={() => toggleGeoType(gt)}>
                  {GEO_ICONS[gt] || '📍'} {isTr ? (GEO_TR[gt] || gt) : (GEO_EN[gt] || gt)}
                </button>
              ))}
            </div>
          </div>

          {/* Country */}
          <div className="yaqut-filter-group">
            <label className="yaqut-filter-label">{ty.country || 'Ülke'}</label>
            <select className="yaqut-select" value={selectedCountry}
              onChange={e => setSelectedCountry(e.target.value)}>
              <option value="">{ty.allCountries || 'Tüm Ülkeler'}</option>
              {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Historical Period */}
          <div className="yaqut-filter-group">
            <label className="yaqut-filter-label">{ty.historicalPeriod || 'Tarihî Dönem'}</label>
            <div className="yaqut-period-row">
              <button className={`yaqut-period-btn${selectedPeriod === '' ? ' active' : ''}`}
                onClick={() => setSelectedPeriod('')}>{ty.allPeriods || 'Tümü'}</button>
              {periods.map(p => (
                <button key={p}
                  className={`yaqut-period-btn${selectedPeriod === p ? ' active' : ''}`}
                  onClick={() => setSelectedPeriod(selectedPeriod === p ? '' : p)}>
                  {PERIOD_LABEL[p]?.[lang] || p}
                </button>
              ))}
            </div>
          </div>

          {/* Atlas Tags */}
          <div className="yaqut-filter-group">
            <label className="yaqut-filter-label">{ty.atlasTags || 'Etiketler'}</label>
            <div className="yaqut-tag-chips">
              {topTags.slice(0, 15).map(tg => (
                <button key={tg}
                  className={`yaqut-tag-chip${selectedTags.has(tg) ? ' active' : ''}`}
                  onClick={() => toggleTag(tg)}>
                  {tg}
                </button>
              ))}
            </div>
          </div>

          {/* Cross-ref range */}
          <div className="yaqut-filter-group">
            <label className="yaqut-filter-label">{ty.crossRefCount || 'Ziriklî Kişi Sayısı'}</label>
            <div className="yaqut-period-row">
              <button className={`yaqut-period-btn${crossRefRange === '' ? ' active' : ''}`}
                onClick={() => setCrossRefRange('')}>{ty.allRanges || 'Tümü'}</button>
              <button className={`yaqut-period-btn${crossRefRange === '0' ? ' active' : ''}`}
                onClick={() => setCrossRefRange(crossRefRange === '0' ? '' : '0')}>0</button>
              <button className={`yaqut-period-btn${crossRefRange === '1-10' ? ' active' : ''}`}
                onClick={() => setCrossRefRange(crossRefRange === '1-10' ? '' : '1-10')}>1-10</button>
              <button className={`yaqut-period-btn${crossRefRange === '10-50' ? ' active' : ''}`}
                onClick={() => setCrossRefRange(crossRefRange === '10-50' ? '' : '10-50')}>10-50</button>
              <button className={`yaqut-period-btn${crossRefRange === '50+' ? ' active' : ''}`}
                onClick={() => setCrossRefRange(crossRefRange === '50+' ? '' : '50+')}>50+</button>
            </div>
          </div>

          {/* DIA random */}
          <button className="yaqut-random-dia" onClick={() => {
            const diaBios = filtered.filter(e => e.ds);
            if (diaBios.length) {
              const pick = diaBios[Math.floor(Math.random() * diaBios.length)];
              window.open(`https://islamansiklopedisi.org.tr/${pick.ds}`, '_blank');
            }
          }}>
            🎲 {ty.randomDia || 'Rastgele DİA Maddesi'}
          </button>
        </div>
      )}

      {/* Entry list header */}
      <div className="yaqut-list-header">
        {filtered.length.toLocaleString()} {ty.entries || 'giriş'}
        {filtered.length === 0 && <div className="yaqut-no-results">{ty.noEntries || 'Bu filtre ile eşleşen giriş bulunamadı.'}</div>}
      </div>

      <VirtualList
        items={filtered}
        selectedId={selectedId}
        onSelect={onSelect}
        lang={lang}
      />
    </div>
  );
}

export { GEO_COLORS, GEO_ICONS };
