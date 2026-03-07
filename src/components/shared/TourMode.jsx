import { useState, useEffect, useRef } from 'react';
import TOURS from '../../data/tours';

export default function TourMode({ lang, onNavigate, onClose, onTourComplete }) {
  const [tourId, setTourId] = useState(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playRef = useRef(false);
  const completedRef = useRef(new Set());

  const tour = TOURS.find(t => t.id === tourId);
  const stop = tour?.stops[step];

  // Auto-play
  useEffect(() => {
    playRef.current = playing;
    if (!playing || !tour) return;
    const iv = setInterval(() => {
      if (!playRef.current) { clearInterval(iv); return; }
      setStep(s => {
        if (s >= tour.stops.length - 1) { setPlaying(false); return s; }
        return s + 1;
      });
    }, 6000);
    return () => clearInterval(iv);
  }, [playing, tour]);

  // Navigate map when stop changes + check for tour completion
  useEffect(() => {
    if (stop && onNavigate) {
      onNavigate({ lat: stop.lat, lon: stop.lon, zoom: stop.zoom, year: stop.year });
    }
    // Tour completion check
    if (tour && step === tour.stops.length - 1 && !completedRef.current.has(tour.id)) {
      completedRef.current.add(tour.id);
      if (onTourComplete) onTourComplete(tour.id);
    }
  }, [step, tourId, onNavigate]);

  const lf = (obj, field) => lang === 'tr' ? obj[`${field}_tr`] : obj[`${field}_en`];

  // Tour selection screen
  if (!tourId) {
    return (
      <div className="tour-overlay">
        <div className="tour-select">
          <div className="tour-select-header">
            <h2 className="tour-select-title">
              {lang === 'tr' ? '🗺 Rehberli Turlar' : '🗺 Guided Tours'}
            </h2>
            <p className="tour-select-sub">
              {lang === 'tr' ? 'Bir tur seçerek İslam tarihini keşfedin' : 'Explore Islamic history by selecting a tour'}
            </p>
            <button className="tour-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="tour-grid">
            {TOURS.map(t => (
              <button key={t.id} className="tour-card" onClick={() => { setTourId(t.id); setStep(0); }}>
                <span className="tour-card-icon">{t.icon}</span>
                <span className="tour-card-title">{lf(t, 'title')}</span>
                <span className="tour-card-desc">{lf(t, 'desc')}</span>
                <span className="tour-card-stops">{t.stops.length} {lang === 'tr' ? 'durak' : 'stops'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Active tour
  return (
    <div className="tour-panel">
      <div className="tour-panel-header">
        <button className="tour-back" onClick={() => { setTourId(null); setPlaying(false); }}>← {lang === 'tr' ? 'Turlar' : 'Tours'}</button>
        <span className="tour-panel-title">{tour.icon} {lf(tour, 'title')}</span>
        <button className="tour-close-btn-sm" onClick={onClose}>✕</button>
      </div>

      <div className="tour-progress">
        {tour.stops.map((_, i) => (
          <button key={i} className={`tour-dot${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}
            onClick={() => setStep(i)} title={`${i + 1}`} />
        ))}
      </div>

      <div className="tour-stop">
        <div className="tour-stop-num">{step + 1} / {tour.stops.length}</div>
        <h3 className="tour-stop-title">{lf(stop, 'title')}</h3>
        <p className="tour-stop-text">{lf(stop, 'text')}</p>
        {stop.year && <div className="tour-stop-year">📅 {stop.year}</div>}
      </div>

      <div className="tour-nav">
        <button className="tour-nav-btn" disabled={step === 0} onClick={() => setStep(s => s - 1)}>
          ← {lang === 'tr' ? 'Önceki' : 'Previous'}
        </button>
        <button className="tour-play-btn" onClick={() => setPlaying(p => !p)}>
          {playing ? '⏸' : '▶'}
        </button>
        <button className="tour-nav-btn" disabled={step === tour.stops.length - 1} onClick={() => setStep(s => s + 1)}>
          {lang === 'tr' ? 'Sonraki' : 'Next'} →
        </button>
      </div>

      {/* Tour completion indicator */}
      {step === tour.stops.length - 1 && (
        <div className="tour-complete-msg">
          🎉 {lang === 'tr' ? 'Tur tamamlandı!' : 'Tour completed!'}
        </div>
      )}
    </div>
  );
}
