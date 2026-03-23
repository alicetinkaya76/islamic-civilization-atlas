import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import DB from '../../data/db.json';
import useAsyncData from '../../hooks/useAsyncData.jsx';
import T from '../../data/i18n';
import { n } from '../../hooks/useEntityLookup';
import { f } from '../../data/i18n-utils';

/* ═══ Turkish + Arabic tolerant normalization ═══ */
const normalize = (s) =>
  s.toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u')
    .replace(/[āáà]/g, 'a')
    .replace(/[ūú]/g, 'u')
    .replace(/[īíì]/g, 'i')
    .replace(/[ḥḫ]/g, 'h')
    .replace(/ṣ/g, 's')
    .replace(/ṭ/g, 't')
    .replace(/ḍ/g, 'd')
    .replace(/ẓ/g, 'z')
    .replace(/ʿ|ʾ|'/g, '')
    .replace(/[\u0610-\u065f\u0670]/g, '')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/أ|إ|آ/g, 'ا');

/* ═══ Build search index with multi-field support ═══ */
function buildSearchIndex(alamData) {
  const idx = [];

  DB.dynasties.forEach(d => {
    if (d.lat && d.lon) {
      const extra = [d.cap || '', d.zone || '', d.period || ''].filter(Boolean).map(normalize).join(' ');
      idx.push({ type: 'dynasty', icon: '🏛', obj: d, lat: d.lat, lon: d.lon, zoom: 6,
        name_tr: d.tr, name_en: d.en,
        search_tr: normalize(d.tr), search_en: normalize(d.en || ''),
        search_extra: extra,
        ctx_yr: d.start && d.end ? `(${d.start}–${d.end})` : '',
        ctx_detail: d.cap || '',
      });
    }
  });

  DB.battles.forEach(b => {
    if (b.lat && b.lon) {
      const extra = [
        b.yr ? String(b.yr) : '',
        b.impact_tr || '', b.cmd_m_tr || '', b.cmd_o_tr || '',
        b.terrain_tr || '', b.result_tr || '',
      ].filter(Boolean).map(normalize).join(' ');
      idx.push({ type: 'battle', icon: '⚔', obj: b, lat: b.lat, lon: b.lon, zoom: 7,
        name_tr: b.tr, name_en: b.en,
        search_tr: normalize(b.tr), search_en: normalize(b.en || ''),
        search_extra: extra,
        ctx_yr: b.yr ? `(${b.yr})` : '',
        ctx_detail: [b.terrain_tr || '', b.result_tr || ''].filter(Boolean).join(' · '),
      });
    }
  });

  DB.events.forEach(e => {
    if (e.lat && e.lon) {
      idx.push({ type: 'event', icon: '📜', obj: e, lat: e.lat, lon: e.lon, zoom: 7,
        name_tr: e.tr, name_en: e.en,
        search_tr: normalize(e.tr), search_en: normalize(e.en || ''),
        search_extra: normalize([e.yr ? String(e.yr) : '', e.impact_tr || ''].join(' ')),
        ctx_yr: e.yr ? `(${e.yr})` : '',
        ctx_detail: '',
      });
    }
  });

  DB.scholars.forEach(s => {
    if (s.lat && s.lon) {
      const extra = [
        s.disc_tr || '', s.disc_en || '',
        s.city_tr || '', s.city_en || '',
        s.works_tr || '',
      ].filter(Boolean).map(normalize).join(' ');
      idx.push({ type: 'scholar', icon: '📚', obj: s, lat: s.lat, lon: s.lon, zoom: 7,
        name_tr: s.tr, name_en: s.en,
        search_tr: normalize(s.tr), search_en: normalize(s.en || ''),
        search_extra: extra,
        ctx_yr: s.b && s.d ? `(ö. ${s.d > 2024 ? '?' : s.d})` : '',
        ctx_detail: [s.disc_tr || '', s.city_tr || ''].filter(Boolean).join(' · '),
      });
    }
  });

  DB.monuments.forEach(m => {
    if (m.lat && m.lon) {
      const extra = [
        m.city_tr || '', m.city_en || '',
        m.type_tr || '', m.type_en || '',
        m.builder_tr || '', m.builder_en || '',
        m.style || '',
      ].filter(Boolean).map(normalize).join(' ');
      idx.push({ type: 'monument', icon: '🕌', obj: m, lat: m.lat, lon: m.lon, zoom: 8,
        name_tr: m.tr, name_en: m.en,
        search_tr: normalize(m.tr), search_en: normalize(m.en || ''),
        search_extra: extra,
        ctx_yr: m.yr ? `(${m.yr})` : '',
        ctx_detail: [m.type_tr || '', m.city_tr || ''].filter(Boolean).join(' · '),
      });
    }
  });

  const citySeen = new Set();
  DB.cities.forEach(c => {
    if (c.lat && c.lon && !citySeen.has(c.id)) {
      citySeen.add(c.id);
      const extra = [
        c.role_tr || '', c.role_en || '',
        c.modern_country || '',
      ].filter(Boolean).map(normalize).join(' ');
      idx.push({ type: 'city', icon: '🏙', obj: c, lat: c.lat, lon: c.lon, zoom: 8,
        name_tr: c.tr, name_en: c.en,
        search_tr: normalize(c.tr), search_en: normalize(c.en || ''),
        search_extra: extra,
        ctx_yr: '',
        ctx_detail: [c.modern_country || '', c.role_tr || ''].filter(Boolean).join(' · '),
      });
    }
  });

  (DB.rulers || []).forEach(r => {
    if (r.lat && r.lon) {
      const extra = [r.dyn_tr || '', r.reign || ''].filter(Boolean).map(normalize).join(' ');
      idx.push({ type: 'ruler', icon: '👑', obj: r, lat: r.lat, lon: r.lon, zoom: 7,
        name_tr: r.n, name_en: r.fn || r.n,
        search_tr: normalize(r.n), search_en: normalize(r.fn || r.n || ''),
        search_extra: extra,
        ctx_yr: r.reign ? `(${r.reign})` : '',
        ctx_detail: r.dyn_tr || '',
      });
    }
  });

  (DB.madrasas || []).forEach(m => {
    if (m.lat && m.lon) {
      const extra = [
        m.city_tr || '', m.city_en || '',
        m.type_tr || '', m.type_en || '',
        m.founder_tr || '', m.founder_en || '',
        m.fields_tr || '', m.dynasty_tr || '',
      ].filter(Boolean).map(normalize).join(' ');
      idx.push({ type: 'madrasa', icon: '🎓', obj: m, lat: m.lat, lon: m.lon, zoom: 8,
        name_tr: m.tr, name_en: m.en,
        search_tr: normalize(m.tr), search_en: normalize(m.en || ''),
        search_extra: extra,
        ctx_yr: m.founded ? `(${m.founded})` : '',
        ctx_detail: [m.type_tr || '', m.city_tr || ''].filter(Boolean).join(' · '),
      });
    }
  });

  // el-A'lâm biographies (only geocoded for map, all for search)
  (alamData || []).forEach(b => {
    const searchTr = normalize(b.ht || '');
    const searchEn = normalize(b.he || '');
    const searchAr = normalize(b.h || '');
    const extra = normalize([b.pt || '', b.pe || '', b.dt || '', b.de || ''].join(' '));
    idx.push({
      type: 'alam', icon: '📖',
      obj: { id: b.id },
      lat: b.lat || 30, lon: b.lon || 45,
      zoom: b.lat ? 7 : 4,
      name_tr: b.ht || b.h, name_en: b.he || b.h,
      search_tr: searchTr + ' ' + searchAr,
      search_en: searchEn + ' ' + searchAr,
      search_extra: extra,
      ctx_yr: b.md ? `(ö. ${b.md})` : b.mb ? `(d. ${b.mb})` : '',
      ctx_detail: [b.pt || '', b.mz || ''].filter(Boolean).join(' · '),
    });
  });

  return idx;
}

/* ═══ Fuzzy substring match ═══ */
function fuzzyMatch(haystack, needle) {
  if (haystack.includes(needle)) return { match: true, score: 0 };
  if (needle.length < 3) return { match: false, score: Infinity };
  let hi = 0, gaps = 0;
  for (let ni = 0; ni < needle.length; ni++) {
    const found = haystack.indexOf(needle[ni], hi);
    if (found === -1) return { match: false, score: Infinity };
    gaps += (found - hi);
    hi = found + 1;
  }
  return { match: true, score: gaps + 10 };
}

/* ═══ Type labels — derived from t inside component ═══ */
function getTypeLabels(t) {
  return {
    dynasty: t.m.dynasty, battle: t.m.battle, event: t.m.event,
    scholar: t.m.scholar, monument: t.m.monument, city: t.m.city,
    ruler: t.m.ruler, madrasa: t.layers.madrasas, alam: t.alam.title,
  };
}

const CATEGORIES = [
  { key: 'dynasty',  icon: '🏛', labelKey: 'dynasty' },
  { key: 'battle',   icon: '⚔', labelKey: 'battle' },
  { key: 'scholar',  icon: '📚', labelKey: 'scholar' },
  { key: 'monument', icon: '🕌', labelKey: 'monument' },
  { key: 'city',     icon: '🏙', labelKey: 'city' },
  { key: 'event',    icon: '📜', labelKey: 'event' },
  { key: 'ruler',    icon: '👑', labelKey: 'ruler' },
  { key: 'alam',     icon: '📖', labelKey: 'alam' },
];

/* Map from search category key → map layer key */
const CAT_TO_LAYER = {
  dynasty: 'dynasties', battle: 'battles', scholar: 'scholars',
  monument: 'monuments', city: 'cities', event: 'events',
  ruler: 'rulers', madrasa: 'madrasas', alam: null,
};

const RECENT_KEY = 'atlas-recent-searches';
function loadRecent() { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; } }
function saveRecent(a) { try { localStorage.setItem(RECENT_KEY, JSON.stringify(a)); } catch {} }

export default function SearchBar({ lang, onFlyTo, onSelectEntity }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [activeCategories, setActiveCategories] = useState(() => new Set(CATEGORIES.map(c => c.key)));
  const [recentSearches, setRecentSearches] = useState(() => loadRecent());
  const [showRecent, setShowRecent] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  // Lazy-load alam data — search works immediately with DB data, alam entries arrive later
  const { data: alamData } = useAsyncData('/data/alam_lite.json');

  const searchIndex = useMemo(() => buildSearchIndex(alamData), [alamData]);
  const totalCount = searchIndex.length;

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowDropdown(false);
        setShowRecent(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleCategory = useCallback((key) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      if (next.size === 0) CATEGORIES.forEach(c => next.add(c.key));

      // When exactly one category is active, solo the corresponding map layer
      if (next.size === 1) {
        const soloKey = [...next][0];
        const layerKey = CAT_TO_LAYER[soloKey];
        if (layerKey) window.dispatchEvent(new CustomEvent('atlas:layersolo', { detail: { layer: layerKey } }));
      } else if (next.size === CATEGORIES.length) {
        // All selected → reset layers
        window.dispatchEvent(new CustomEvent('atlas:layersolo', { detail: { layer: null } }));
      }

      return next;
    });
  }, []);

  const doSearch = useCallback((q, cats) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]); setShowDropdown(false); return;
    }
    const needle = normalize(q.trim());
    const scored = [];
    for (const item of searchIndex) {
      if (!cats.has(item.type)) continue;
      const mTr = fuzzyMatch(item.search_tr, needle);
      const mEn = fuzzyMatch(item.search_en, needle);
      const mEx = item.search_extra ? fuzzyMatch(item.search_extra, needle) : { match: false, score: Infinity };
      if (mEx.match) mEx.score += 5;
      const best = [mTr, mEn, mEx].reduce((a, b) => a.score < b.score ? a : b);
      if (best.match) scored.push({ ...item, score: best.score });
    }
    scored.sort((a, b) => a.score - b.score);
    setResults(scored.slice(0, 10));
    setShowDropdown(scored.length > 0);
    setShowRecent(false);
    setSelectedIdx(-1);
  }, [searchIndex]);

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val, activeCategories), 300);
  }, [doSearch, activeCategories]);

  useEffect(() => {
    if (query.trim().length >= 2) doSearch(query, activeCategories);
  }, [activeCategories]);

  const addToRecent = useCallback((term) => {
    if (!term || term.length < 2) return;
    setRecentSearches(prev => {
      const next = [term, ...prev.filter(r => r !== term)].slice(0, 5);
      saveRecent(next);
      return next;
    });
  }, []);

  const handleSelect = useCallback((item) => {
    setShowDropdown(false); setShowRecent(false);
    addToRecent(query.trim() || (f(item, 'name', lang)));
    setQuery('');
    if (onFlyTo) onFlyTo({ lat: item.lat, lon: item.lon, zoom: item.zoom });
    if (onSelectEntity) onSelectEntity(item);
  }, [onFlyTo, onSelectEntity, query, lang, addToRecent]);

  const handleRandom = useCallback(() => {
    const filtered = searchIndex.filter(i => activeCategories.has(i.type));
    if (!filtered.length) return;
    const item = filtered[Math.floor(Math.random() * filtered.length)];
    setQuery(''); setShowDropdown(false); setShowRecent(false);
    if (onFlyTo) onFlyTo({ lat: item.lat, lon: item.lon, zoom: item.zoom });
    if (onSelectEntity) onSelectEntity(item);
  }, [searchIndex, activeCategories, onFlyTo, onSelectEntity]);

  const handleFocus = useCallback(() => {
    if (query.trim().length >= 2 && results.length > 0) setShowDropdown(true);
    else if (!query.trim() && recentSearches.length > 0) { setShowRecent(true); setShowDropdown(false); }
  }, [query, results, recentSearches]);

  const clearRecent = useCallback(() => { setRecentSearches([]); saveRecent([]); setShowRecent(false); }, []);
  const pickRecent = useCallback((term) => { setQuery(term); setShowRecent(false); doSearch(term, activeCategories); }, [doSearch, activeCategories]);

  const handleKeyDown = useCallback((e) => {
    if (showRecent) { if (e.key === 'Escape') setShowRecent(false); return; }
    if (!showDropdown || results.length === 0) { if (e.key === 'Enter') handleRandom(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && selectedIdx >= 0) { e.preventDefault(); handleSelect(results[selectedIdx]); }
    else if (e.key === 'Escape') setShowDropdown(false);
  }, [showDropdown, showRecent, results, selectedIdx, handleSelect, handleRandom]);

  const t = T[lang] || T.tr;
  if (!t || !t.search) {
    console.error('[SearchBar] T[lang] is broken. lang=', lang, 'T keys=', Object.keys(T));
    return <div style={{color:'red'}}>SearchBar: i18n error (lang={String(lang)})</div>;
  }
  const labels = getTypeLabels(t);

  return (
    <div className="search-wrap" ref={wrapRef}>
      <div className="search-input-row">
        <span className="search-icon">🔍</span>
        <input ref={inputRef} type="text" className="search-input"
          placeholder={t.search.placeholder}
          value={query} onChange={handleChange} onKeyDown={handleKeyDown} onFocus={handleFocus}
          aria-label={t.search.ariaSearch}
          aria-expanded={showDropdown || showRecent} aria-autocomplete="list" role="combobox" />
        <button className="search-random-btn" onClick={handleRandom}
          title={t.search.random}
          aria-label={t.search.random}>🎲</button>
      </div>

      {/* Category filter chips */}
      <div className="search-chips">
        {CATEGORIES.map(cat => (
          <button key={cat.key}
            className={`search-chip${activeCategories.has(cat.key) ? ' active' : ''}`}
            onClick={() => toggleCategory(cat.key)}
            title={labels[cat.labelKey]}>
            <span className="search-chip-icon">{cat.icon}</span>
            <span className="search-chip-label">{labels[cat.labelKey]}</span>
          </button>
        ))}
      </div>

      {/* Recent searches */}
      {showRecent && recentSearches.length > 0 && (
        <ul className="search-dropdown" role="listbox">
          <li className="search-recent-header">
            <span>{t.search.recentTitle}</span>
            <button className="search-recent-clear" onClick={clearRecent}>
              {t.search.clear}
            </button>
          </li>
          {recentSearches.map((term, i) => (
            <li key={`recent-${i}`} className="search-result recent" onClick={() => pickRecent(term)} role="option">
              <span className="search-result-icon">🕐</span>
              <div className="search-result-info">
                <span className="search-result-name">{term}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Search results */}
      {showDropdown && results.length > 0 && (
        <ul className="search-dropdown" role="listbox">
          {results.map((r, i) => (
            <li key={`${r.type}-${r.obj.id}-${i}`}
              className={`search-result${i === selectedIdx ? ' selected' : ''}`}
              onClick={() => handleSelect(r)}
              onMouseEnter={() => setSelectedIdx(i)}
              role="option" aria-selected={i === selectedIdx}>
              <span className="search-result-icon">{r.icon}</span>
              <div className="search-result-info">
                <span className="search-result-name">{f(r, 'name', lang)}</span>
                {(r.ctx_yr || r.ctx_detail) && (
                  <span className="search-result-meta">
                    {r.ctx_yr}{r.ctx_yr && r.ctx_detail ? ' · ' : ''}{r.ctx_detail}
                  </span>
                )}
                <span className="search-result-type">{labels[r.type]}</span>
              </div>
            </li>
          ))}
          <li className="search-stats">
            {results.length} {t.search.results} / {totalCount.toLocaleString()} {t.search.among}
          </li>
        </ul>
      )}
    </div>
  );
}
