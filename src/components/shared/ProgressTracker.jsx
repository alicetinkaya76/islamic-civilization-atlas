import { useState, useEffect, useCallback, useRef } from 'react';
import T from '../../data/i18n';
import { f } from '../../data/i18n-utils';

/* ═══ Progress / Discovery Tracker ═══ */

const STORAGE_KEY = 'atlas-discovery-progress';

/* Badge definitions */
const BADGES = [
  { id: 'first_step', icon: '🚀', threshold: 1, type: 'total',
    label_tr: 'İlk Adım', label_en: 'First Step',
    desc_tr: 'İlk keşfini yaptın!', desc_en: 'You made your first discovery!' },
  { id: '10_battles', icon: '⚔', threshold: 10, type: 'battle',
    label_tr: '10 Savaş', label_en: '10 Battles',
    desc_tr: '10 savaş keşfettin!', desc_en: 'You explored 10 battles!' },
  { id: '10_scholars', icon: '📚', threshold: 10, type: 'scholar',
    label_tr: '10 Âlim', label_en: '10 Scholars',
    desc_tr: '10 âlim keşfettin!', desc_en: 'You explored 10 scholars!' },
  { id: '50_dynasties', icon: '🏛', threshold: 50, type: 'dynasty',
    label_tr: '50 Hanedan', label_en: '50 Dynasties',
    desc_tr: '50 hanedan keşfettin!', desc_en: 'You explored 50 dynasties!' },
  { id: '25_monuments', icon: '🕌', threshold: 25, type: 'monument',
    label_tr: '25 Eser', label_en: '25 Monuments',
    desc_tr: '25 mimari eser keşfettin!', desc_en: 'You explored 25 monuments!' },
  { id: '100_total', icon: '🌟', threshold: 100, type: 'total',
    label_tr: '100 Keşif', label_en: '100 Discoveries',
    desc_tr: '100 keşif yaptın!', desc_en: 'You reached 100 discoveries!' },
  { id: '20_cities', icon: '🏙', threshold: 20, type: 'city',
    label_tr: '20 Şehir', label_en: '20 Cities',
    desc_tr: '20 şehir keşfettin!', desc_en: 'You explored 20 cities!' },
  { id: '10_events', icon: '📜', threshold: 10, type: 'event',
    label_tr: '10 Olay', label_en: '10 Events',
    desc_tr: '10 tarihi olay keşfettin!', desc_en: 'You explored 10 events!' },
  { id: 'tour_1', icon: '🗺', threshold: 1, type: 'tour',
    label_tr: 'İlk Tur', label_en: 'First Tour',
    desc_tr: 'İlk turunu tamamladın!', desc_en: 'You completed your first tour!' },
  { id: 'tour_3', icon: '🧭', threshold: 3, type: 'tour',
    label_tr: 'Gezgin', label_en: 'Explorer',
    desc_tr: '3 tur tamamladın!', desc_en: 'You completed 3 tours!' },
];

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { discovered: {}, counts: { total: 0, dynasty: 0, battle: 0, event: 0, scholar: 0, monument: 0, city: 0, ruler: 0, route: 0, tour: 0 }, badges: [] };
}

function saveProgress(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function useProgress() {
  const [progress, setProgress] = useState(() => loadProgress());
  const newBadgeRef = useRef(null);
  const [newBadge, setNewBadge] = useState(null);

  /* Persist on change */
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  /* Record a discovery */
  const recordDiscovery = useCallback((entityType, entityId) => {
    setProgress(prev => {
      const key = `${entityType}:${entityId}`;
      if (prev.discovered[key]) return prev; /* Already discovered */

      const newDiscovered = { ...prev.discovered, [key]: Date.now() };
      const newCounts = { ...prev.counts };
      newCounts.total = (newCounts.total || 0) + 1;
      newCounts[entityType] = (newCounts[entityType] || 0) + 1;

      /* Check for new badges */
      const newBadges = [...(prev.badges || [])];
      for (const badge of BADGES) {
        if (newBadges.includes(badge.id)) continue;
        const count = badge.type === 'total' ? newCounts.total : (newCounts[badge.type] || 0);
        if (count >= badge.threshold) {
          newBadges.push(badge.id);
          newBadgeRef.current = badge;
        }
      }

      return { discovered: newDiscovered, counts: newCounts, badges: newBadges };
    });
  }, []);

  /* Check and show new badge notification */
  useEffect(() => {
    if (newBadgeRef.current) {
      setNewBadge(newBadgeRef.current);
      newBadgeRef.current = null;
      const timer = setTimeout(() => setNewBadge(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  const resetProgress = useCallback(() => {
    const empty = { discovered: {}, counts: { total: 0, dynasty: 0, battle: 0, event: 0, scholar: 0, monument: 0, city: 0, ruler: 0, route: 0, tour: 0 }, badges: [] };
    setProgress(empty);
    saveProgress(empty);
  }, []);

  return { progress, recordDiscovery, resetProgress, newBadge, setNewBadge };
}

/* ═══ Progress Display Component ═══ */
export default function ProgressTracker({ lang, progress, onReset }) {
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef(null);
  const t = T[lang];

  /* Click outside to close */
  useEffect(() => {
    if (!showPanel) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPanel]);

  const total = progress.counts.total || 0;
  const earnedBadges = BADGES.filter(b => (progress.badges || []).includes(b.id));
  const unearnedBadges = BADGES.filter(b => !(progress.badges || []).includes(b.id));

  const catLabels = {
    dynasty: t.layers.dynasties, battle: t.layers.battles,
    event: t.layers.events, scholar: t.layers.scholars,
    monument: t.layers.monuments, city: t.layers.cities,
    ruler: t.layers.rulers,
  };
  const catIcons = { dynasty: '🏛', battle: '⚔', event: '📜', scholar: '📚', monument: '🕌', city: '🏙', ruler: '👑' };

  return (
    <div className="progress-wrap" ref={panelRef}>
      <button className="progress-btn" onClick={() => setShowPanel(p => !p)}
        title={`${total} ${t.progress.discoveries}`}
        aria-label={`${t.progress.progressLabel}: ${total} ${t.progress.discoveries}`}>
        <span className="progress-icon">🧭</span>
        <span className="progress-count">{total}</span>
      </button>

      {showPanel && (
        <div className="progress-panel">
          <div className="progress-panel-header">
            <h3 className="progress-panel-title">
              {t.progress.title}
            </h3>
          </div>

          {/* Category counts */}
          <div className="progress-stats">
            {Object.entries(catLabels).map(([key, label]) => (
              <div key={key} className="progress-stat-row">
                <span className="progress-stat-icon">{catIcons[key]}</span>
                <span className="progress-stat-label">{label}</span>
                <span className="progress-stat-count">{progress.counts[key] || 0}</span>
              </div>
            ))}
            <div className="progress-stat-row total">
              <span className="progress-stat-icon">📊</span>
              <span className="progress-stat-label">{t.progress.total}</span>
              <span className="progress-stat-count">{total}</span>
            </div>
          </div>

          {/* Badges */}
          <div className="progress-badges-section">
            <h4 className="progress-badges-title">
              {t.progress.badges}
              <span className="progress-badges-count">{earnedBadges.length}/{BADGES.length}</span>
            </h4>
            <div className="progress-badges-grid">
              {earnedBadges.map(b => (
                <div key={b.id} className="progress-badge earned" title={f(b, 'desc', lang)}>
                  <span className="progress-badge-icon">{b.icon}</span>
                  <span className="progress-badge-label">{f(b, 'label', lang)}</span>
                </div>
              ))}
              {unearnedBadges.map(b => (
                <div key={b.id} className="progress-badge locked" title={`${b.threshold} ${t.progress.needed}`}>
                  <span className="progress-badge-icon">🔒</span>
                  <span className="progress-badge-label">{f(b, 'label', lang)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reset */}
          <button className="progress-reset" onClick={() => {
            if (window.confirm(t.progress.resetConfirm)) {
              onReset();
            }
          }}>
            {t.progress.reset}
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══ Badge Toast Notification ═══ */
export function BadgeToast({ badge, lang, onDismiss }) {
  if (!badge) return null;
  const t = T[lang];
  return (
    <div className="badge-toast" onClick={onDismiss}>
      <span className="badge-toast-icon">{badge.icon}</span>
      <div className="badge-toast-text">
        <strong>{t.progress.newBadge}</strong>
        <span>{f(badge, 'label', lang)}</span>
      </div>
    </div>
  );
}
