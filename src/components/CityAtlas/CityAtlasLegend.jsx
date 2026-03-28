export default function CityAtlasLegend({ city, lang, activeCats }) {
  const entries = Object.entries(city.categories)
    .filter(([key]) => !activeCats || activeCats.has(key));

  if (entries.length === 0) return null;

  return (
    <div className="ca-legend">
      <div className="ca-legend-group">
        {entries.map(([key, cfg]) => (
          <div key={key} className="ca-legend-item">
            <span className="ca-legend-dot" style={{ background: cfg.color }} />
            <span>
              {cfg.icon}{' '}
              {cfg[`label_${lang}`] || cfg.label_en || key}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
