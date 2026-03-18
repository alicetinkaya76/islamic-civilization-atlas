/**
 * SkeletonLoader — content-shaped loading placeholder.
 * Renders animated shimmer lines that match expected content layout.
 *
 * Props:
 *   variant — 'list' | 'card' | 'map' | 'chart' | 'default'
 *   rows    — number of skeleton rows (default depends on variant)
 *   message — optional loading text
 */
export default function SkeletonLoader({ variant = 'default', rows, message }) {
  const count = rows || { list: 8, card: 1, map: 1, chart: 1, default: 5 }[variant] || 5;

  return (
    <div className={`skeleton-loader skeleton-${variant}`} aria-busy="true" aria-label="Loading">
      {variant === 'map' && (
        <div className="skeleton-map-placeholder">
          <div className="skeleton-shimmer skeleton-map-rect" />
          <div className="skeleton-map-controls">
            <div className="skeleton-shimmer skeleton-pill" style={{ width: 60 }} />
            <div className="skeleton-shimmer skeleton-pill" style={{ width: 80 }} />
            <div className="skeleton-shimmer skeleton-pill" style={{ width: 50 }} />
          </div>
        </div>
      )}

      {variant === 'chart' && (
        <div className="skeleton-chart-placeholder">
          <div className="skeleton-shimmer skeleton-chart-title" />
          <div className="skeleton-chart-bars">
            {[70, 45, 85, 60, 30, 90, 55].map((h, i) => (
              <div key={i} className="skeleton-shimmer skeleton-bar" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      )}

      {variant === 'card' && (
        <div className="skeleton-card-placeholder">
          <div className="skeleton-shimmer skeleton-card-header" />
          <div className="skeleton-shimmer skeleton-card-line" style={{ width: '80%' }} />
          <div className="skeleton-shimmer skeleton-card-line" style={{ width: '60%' }} />
          <div className="skeleton-card-badges">
            <div className="skeleton-shimmer skeleton-pill" style={{ width: 60 }} />
            <div className="skeleton-shimmer skeleton-pill" style={{ width: 80 }} />
          </div>
          <div className="skeleton-shimmer skeleton-card-line" style={{ width: '100%' }} />
          <div className="skeleton-shimmer skeleton-card-line" style={{ width: '90%' }} />
        </div>
      )}

      {(variant === 'list' || variant === 'default') && (
        <div className="skeleton-list-placeholder">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="skeleton-list-row">
              <div className="skeleton-shimmer skeleton-avatar" />
              <div className="skeleton-list-lines">
                <div className="skeleton-shimmer skeleton-line" style={{ width: `${60 + Math.random() * 30}%` }} />
                <div className="skeleton-shimmer skeleton-line-sm" style={{ width: `${40 + Math.random() * 30}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {message && <p className="skeleton-message">{message}</p>}
    </div>
  );
}
