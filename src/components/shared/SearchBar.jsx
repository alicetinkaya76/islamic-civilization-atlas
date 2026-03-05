import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import DB from '../../data/db.json';
import { n } from '../../hooks/useEntityLookup';

/* ═══ Turkish-tolerant normalization ═══ */
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
    .replace(/û/g, 'u');

/* ═══ Build search index once ═══ */
function buildSearchIndex() {
  const idx = [];

  DB.dynasties.forEach(d => {
    if (d.lat && d.lon) {
      idx.push({ type: 'dynasty', icon: '🏛', obj: d, lat: d.lat, lon: d.lon, zoom: 6,
        name_tr: d.tr, name_en: d.en, search_tr: normalize(d.tr), search_en: normalize(d.en || '') });
    }
  });

  DB.battles.forEach(b => {
    if (b.lat && b.lon) {
      idx.push({ type: 'battle', icon: '⚔', obj: b, lat: b.lat, lon: b.lon, zoom: 7,
        name_tr: b.tr, name_en: b.en, search_tr: normalize(b.tr), search_en: normalize(b.en || '') });
    }
  });

  DB.events.forEach(e => {
    if (e.lat && e.lon) {
      idx.push({ type: 'event', icon: '📜', obj: e, lat: e.lat, lon: e.lon, zoom: 7,
        name_tr: e.tr, name_en: e.en, search_tr: normalize(e.tr), search_en: normalize(e.en || '') });
    }
  });

  DB.scholars.forEach(s => {
    if (s.lat && s.lon) {
      idx.push({ type: 'scholar', icon: '📚', obj: s, lat: s.lat, lon: s.lon, zoom: 7,
        name_tr: s.tr, name_en: s.en, search_tr: normalize(s.tr), search_en: normalize(s.en || '') });
    }
  });

  DB.monuments.forEach(m => {
    if (m.lat && m.lon) {
      idx.push({ type: 'monument', icon: '🕌', obj: m, lat: m.lat, lon: m.lon, zoom: 8,
        name_tr: m.tr, name_en: m.en, search_tr: normalize(m.tr), search_en: normalize(m.en || '') });
    }
  });

  /* Cities: deduplicate by id (take first entry) */
  const citySeen = new Set();
  DB.cities.forEach(c => {
    if (c.lat && c.lon && !citySeen.has(c.id)) {
      citySeen.add(c.id);
      idx.push({ type: 'city', icon: '🏙', obj: c, lat: c.lat, lon: c.lon, zoom: 8,
        name_tr: c.tr, name_en: c.en, search_tr: normalize(c.tr), search_en: normalize(c.en || '') });
    }
  });

  /* Rulers: take only founders and notable rulers */
  (DB.rulers || []).forEach(r => {
    if (r.lat && r.lon) {
      idx.push({ type: 'ruler', icon: '👑', obj: r, lat: r.lat, lon: r.lon, zoom: 7,
        name_tr: r.n, name_en: r.fn || r.n, search_tr: normalize(r.n), search_en: normalize(r.fn || r.n || '') });
    }
  });

  return idx;
}

/* ═══ Fuzzy substring match (Turkish-tolerant) ═══ */
function fuzzyMatch(haystack, needle) {
  if (haystack.includes(needle)) return { match: true, score: 0 };
  /* Allow 1 character tolerance for short queries */
  if (needle.length < 3) return { match: false, score: Infinity };
  /* Check if all chars of needle appear in order in haystack */
  let hi = 0;
  let gaps = 0;
  for (let ni = 0; ni < needle.length; ni++) {
    const found = haystack.indexOf(needle[ni], hi);
    if (found === -1) return { match: false, score: Infinity };
    gaps += (found - hi);
    hi = found + 1;
  }
  return { match: true, score: gaps + 10 }; /* Penalize fuzzy over exact */
}

/* ═══ Type labels ═══ */
const TYPE_LABEL = {
  tr: { dynasty: 'Hanedan', battle: 'Savaş', event: 'Olay', scholar: 'Âlim', monument: 'Eser', city: 'Şehir', ruler: 'Hükümdar' },
  en: { dynasty: 'Dynasty', battle: 'Battle', event: 'Event', scholar: 'Scholar', monument: 'Monument', city: 'City', ruler: 'Ruler' }
};

export default function SearchBar({ lang, onFlyTo, onSelectEntity }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  /* Build index once */
  const searchIndex = useMemo(() => buildSearchIndex(), []);

  /* Click outside → close dropdown */
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Debounced search */
  const doSearch = useCallback((q) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const needle = normalize(q.trim());
    const scored = [];

    for (const item of searchIndex) {
      const mTr = fuzzyMatch(item.search_tr, needle);
      const mEn = fuzzyMatch(item.search_en, needle);
      const best = mTr.score < mEn.score ? mTr : mEn;
      if (best.match) {
        scored.push({ ...item, score: best.score });
      }
    }

    scored.sort((a, b) => a.score - b.score);
    setResults(scored.slice(0, 8));
    setShowDropdown(scored.length > 0);
    setSelectedIdx(-1);
  }, [searchIndex]);

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  }, [doSearch]);

  /* Select a result */
  const handleSelect = useCallback((item) => {
    setShowDropdown(false);
    setQuery('');
    if (onFlyTo) {
      onFlyTo({ lat: item.lat, lon: item.lon, zoom: item.zoom });
    }
    if (onSelectEntity) {
      onSelectEntity(item);
    }
  }, [onFlyTo, onSelectEntity]);

  /* Random entity */
  const handleRandom = useCallback(() => {
    const idx = Math.floor(Math.random() * searchIndex.length);
    const item = searchIndex[idx];
    setQuery('');
    setShowDropdown(false);
    if (onFlyTo) {
      onFlyTo({ lat: item.lat, lon: item.lon, zoom: item.zoom });
    }
    if (onSelectEntity) {
      onSelectEntity(item);
    }
  }, [searchIndex, onFlyTo, onSelectEntity]);

  /* Keyboard navigation */
  const handleKeyDown = useCallback((e) => {
    if (!showDropdown || results.length === 0) {
      if (e.key === 'Enter') handleRandom();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIdx]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }, [showDropdown, results, selectedIdx, handleSelect, handleRandom]);

  const labels = TYPE_LABEL[lang] || TYPE_LABEL.en;

  return (
    <div className="search-wrap" ref={wrapRef}>
      <div className="search-input-row">
        <span className="search-icon">🔍</span>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={lang === 'tr' ? 'Hanedan, savaş, âlim ara…' : 'Search dynasties, battles, scholars…'}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
          aria-label={lang === 'tr' ? 'Haritada ara' : 'Search map'}
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          role="combobox"
        />
        <button className="search-random-btn" onClick={handleRandom}
          title={lang === 'tr' ? 'Rastgele keşfet' : 'Random discovery'}
          aria-label={lang === 'tr' ? 'Rastgele keşfet' : 'Random discovery'}>
          🎲
        </button>
      </div>

      {showDropdown && results.length > 0 && (
        <ul className="search-dropdown" role="listbox">
          {results.map((r, i) => (
            <li key={`${r.type}-${r.obj.id}-${i}`}
              className={`search-result${i === selectedIdx ? ' selected' : ''}`}
              onClick={() => handleSelect(r)}
              onMouseEnter={() => setSelectedIdx(i)}
              role="option"
              aria-selected={i === selectedIdx}>
              <span className="search-result-icon">{r.icon}</span>
              <div className="search-result-info">
                <span className="search-result-name">
                  {lang === 'tr' ? r.name_tr : r.name_en}
                </span>
                <span className="search-result-type">{labels[r.type]}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
