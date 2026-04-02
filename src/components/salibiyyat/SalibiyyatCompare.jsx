import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';

const eTitle = (e, lang) => lang === 'ar' ? (e.title_ar || e.title) : lang === 'en' ? (e.title_en || e.title) : e.title;


/* ═══ Tile ═══ */
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; OSM &copy; CARTO';

export default function SalibiyyatCompare({
  lang, tr, clusters, sourceMap, enums, initialClusterId, onCrossRef,
}) {
  const [selectedClusterId, setSelectedClusterId] = useState(null);
  const miniMapRef = useRef(null);
  const miniMapContainer = useRef(null);
  const containerRef = useRef(null);

  /* ── Set initial cluster ── */
  useEffect(() => {
    if (initialClusterId && clusters.some(c => c.id === initialClusterId)) {
      setSelectedClusterId(initialClusterId);
    } else if (clusters.length > 0 && !selectedClusterId) {
      setSelectedClusterId(clusters[0].id);
    }
  }, [initialClusterId, clusters, selectedClusterId]);

  const currentIdx = useMemo(() =>
    clusters.findIndex(c => c.id === selectedClusterId),
    [clusters, selectedClusterId]
  );

  const cluster = currentIdx >= 0 ? clusters[currentIdx] : null;

  /* ── Navigation ── */
  const goPrev = useCallback(() => {
    if (currentIdx > 0) setSelectedClusterId(clusters[currentIdx - 1].id);
  }, [currentIdx, clusters]);

  const goNext = useCallback(() => {
    if (currentIdx < clusters.length - 1) setSelectedClusterId(clusters[currentIdx + 1].id);
  }, [currentIdx, clusters]);

  /* ── Keyboard navigation (← →) ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') { goPrev(); e.preventDefault(); }
      if (e.key === 'ArrowRight') { goNext(); e.preventDefault(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goPrev, goNext]);

  /* ── Mini map ── */
  useEffect(() => {
    if (!miniMapContainer.current) return;

    /* Clean up previous map instance */
    if (miniMapRef.current) {
      miniMapRef.current.remove();
      miniMapRef.current = null;
    }

    if (!cluster) return;

    /* FIX: Use computed lat/lon from cluster (derived from events) */
    const lat = cluster.lat ?? 33;
    const lon = cluster.lon ?? 36;

    const map = L.map(miniMapContainer.current, {
      center: [lat, lon], zoom: 8,
      zoomControl: false, attributionControl: false,
      dragging: false, scrollWheelZoom: false,
      doubleClickZoom: false, touchZoom: false,
    });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 18 }).addTo(map);

    /* Mark cluster location */
    L.circleMarker([lat, lon], {
      radius: 10, color: '#d4a84b', fillColor: '#d4a84b',
      fillOpacity: 0.3, weight: 2,
    }).addTo(map);

    miniMapRef.current = map;

    return () => {
      if (miniMapRef.current) {
        miniMapRef.current.remove();
        miniMapRef.current = null;
      }
    };
  }, [cluster]);

  const groupedBySource = useMemo(() => {
    if (!cluster) return [];
    const groups = {};
    cluster.events.forEach(e => {
      const srcId = findSourceId(e.source_short, sourceMap);
      if (!groups[srcId]) groups[srcId] = [];
      groups[srcId].push(e);
    });
    return Object.entries(groups).map(([srcId, events]) => ({
      source: sourceMap[srcId] || { short: events[0]?.source_short, color: '#999' },
      events,
    }));
  }, [cluster, sourceMap]);

  const crossRef = cluster?.cross_ref || null;

  if (!cluster) {
    return (
      <div className="sal-compare-empty">
        <p>{lang === 'en' ? 'No multi-source clusters available.' : 'Çoklu kaynak noktasi bulunamadi.'}</p>
      </div>
    );
  }

  return (
    <div className="sal-compare" ref={containerRef} tabIndex={-1}>
      {/* ── Header ── */}
      <div className="sal-compare-header">
        <h3 className="sal-compare-title">
          ⚖️ {lang === 'en' ? 'Perspective Comparison' : 'Perspektif Karşılaştırması'}
        </h3>
        <p className="sal-compare-subtitle">
          {cluster.location} · {cluster.year} · {cluster.event_count} {lang === 'en' ? 'accounts' : 'rivayet'}
        </p>
        {/* Cross-ref badge */}
        {crossRef && crossRef.type === 'atlas_battle' && onCrossRef && (
          <button className="sal-crossref-btn sal-crossref-inline"
            onClick={() => onCrossRef('atlas_battle', crossRef.atlas_id)}>
            🔗 {crossRef[`label_${lang}`] || crossRef.label_tr}
            <span className="sal-crossref-arrow">↗</span>
          </button>
        )}
      </div>

      {/* ── Cluster selector ── */}
      <div className="sal-compare-nav">
        <button className="sal-nav-btn" onClick={goPrev} disabled={currentIdx <= 0}>
          {tr.prevCluster}
        </button>

        <select className="sal-compare-select"
          value={selectedClusterId || ''}
          onChange={e => setSelectedClusterId(e.target.value)}>
          {clusters.map((c, i) => (
            <option key={c.id} value={c.id}>
              #{i + 1} — {c.location} ({c.year}) · {c.event_count} {lang === 'en' ? 'sources' : 'kaynak'}
              {c.cross_ref ? ' ↗' : ''}
            </option>
          ))}
        </select>

        <button className="sal-nav-btn" onClick={goNext} disabled={currentIdx >= clusters.length - 1}>
          {tr.nextCluster}
        </button>
      </div>

      {/* ── Keyboard hint ── */}
      <div className="sal-compare-keyhint">
        ← → {lang === 'en' ? 'Navigate clusters' : 'Kümeler arası gezin'}
      </div>

      {/* ── Mini map ── */}
      <div className="sal-compare-minimap">
        <div ref={miniMapContainer} className="sal-minimap-container" />
        <div className="sal-minimap-label">
          📍 {cluster.location}
          {cluster.lat != null && (
            <span className="sal-minimap-coords">
              {' '}({cluster.lat.toFixed(2)}°, {cluster.lon.toFixed(2)}°)
            </span>
          )}
        </div>
      </div>

      {/* ── Source columns ── */}
      <div className="sal-compare-grid" style={{ gridTemplateColumns: `repeat(${groupedBySource.length}, 1fr)` }}>
        {groupedBySource.map(({ source, events }) => (
          <div key={source.id || source.short} className="sal-compare-column">
            {/* Column header */}
            <div className="sal-compare-col-header" style={{ borderTopColor: source.color }}>
              <span className="sal-compare-source-dot" style={{ background: source.color }} />
              <div className="sal-compare-source-info">
                <strong>{source.short}</strong>
                <span className="sal-compare-author">
                  {lang === 'en' ? source.name_en : source.name_tr}
                </span>
                <span className="sal-compare-work">
                  {lang === 'ar' ? source.work_ar : lang === 'en' ? source.work_en : source.work_tr}
                </span>
              </div>
            </div>

            {/* Events from this source */}
            {events.map(e => {
              const typeLabel = enums.event_types?.[e.type]?.[lang] ||
                enums.event_types?.[e.type]?.tr || e.type;
              const outcomeLabel = enums.outcome_types?.[e.outcome]?.[lang] ||
                enums.outcome_types?.[e.outcome]?.tr || '';

              return (
                <div key={e.id} className="sal-compare-event">
                  <div className="sal-compare-event-header">
                    <span className="sal-compare-type-badge">{typeLabel}</span>
                    {outcomeLabel && (
                      <span className="sal-compare-outcome">{outcomeLabel}</span>
                    )}
                  </div>
                  <p className="sal-compare-title-text">{eTitle(e, lang)}</p>
                  {e.arabic_text && (
                    <div className="sal-compare-arabic" dir="rtl">
                      {e.arabic_text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Cluster stats ── */}
      <div className="sal-compare-footer">
        <span>{lang === 'en' ? 'Cluster' : 'Küme'} {currentIdx + 1} / {clusters.length}</span>
        <span className="sal-compare-sources-label">{tr.clusterSources}:</span>
        {cluster.sources.map(srcId => {
          const src = sourceMap[srcId];
          return (
            <span key={srcId} className="sal-compare-footer-dot"
              style={{ background: src?.color || '#999' }}
              title={src?.short}>
              {src?.short}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ── Helper: find source id from short code ── */
function findSourceId(shortCode, sourceMap) {
  for (const [id, src] of Object.entries(sourceMap)) {
    if (src.short === shortCode) return id;
  }
  return shortCode;
}
