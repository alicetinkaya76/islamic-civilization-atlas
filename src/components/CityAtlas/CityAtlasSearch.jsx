export default function CityAtlasSearch({ value, onChange, lang }) {
  const placeholder =
    lang === 'en' ? 'Search monuments...' :
    lang === 'ar' ? 'ابحث عن الآثار...' :
    'Yapı ara...';

  return (
    <div className="ca-search">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="ca-search-input"
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <button
          className="ca-search-clear"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
