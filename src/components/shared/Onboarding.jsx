import { useState, useCallback } from 'react';
import T from '../../data/i18n';

function getSteps(t) {
  return [
    { icon: '🗺', title: t.tabs.map.replace(/🗺\s?/, ''), text: t.onb.mapDesc },
    { icon: '📊', title: t.tabs.timeline.replace(/📅\s?/, ''), text: t.onb.timelineDesc },
    { icon: '🔗', title: t.onb.scholarNet, text: t.onb.scholarDesc },
    { icon: '⚔', title: t.layers.battles, text: t.onb.battleDesc },
    { icon: '🎓', title: 'Quiz', text: t.onb.quizDesc },
  ];
}

export default function Onboarding({ lang, onDone }) {
  const [step, setStep] = useState(0);
  const [dontShow, setDontShow] = useState(false);
  const t = T[lang];
  const STEPS = getSteps(t);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = useCallback(() => {
    if (isLast) { onDone(dontShow); return; }
    setStep(s => s + 1);
  }, [isLast, dontShow, onDone]);

  const handlePrev = useCallback(() => setStep(s => Math.max(0, s - 1)), []);
  const handleSkip = useCallback(() => onDone(dontShow), [dontShow, onDone]);

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-step-indicator">
          {STEPS.map((_, i) => (
            <span key={i} className={`onboarding-dot${i === step ? ' active' : ''}${i < step ? ' done' : ''}`} />
          ))}
        </div>

        <div className="onboarding-icon">{current.icon}</div>
        <h2 className="onboarding-title">
          {current.title}
        </h2>
        <p className="onboarding-text">
          {current.text}
        </p>

        <div className="onboarding-nav">
          {step > 0 && (
            <button className="onboarding-btn secondary" onClick={handlePrev}>
              {t.onb.back}
            </button>
          )}
          <button className="onboarding-btn primary" onClick={handleNext}>
            {isLast ? t.onb.start : t.onb.next}
          </button>
        </div>

        <div className="onboarding-footer">
          <label className="onboarding-checkbox-label">
            <input type="checkbox" checked={dontShow} onChange={e => setDontShow(e.target.checked)} />
            <span>{t.onb.dismiss}</span>
          </label>
          <button className="onboarding-skip" onClick={handleSkip}>
            {t.onb.skip}
          </button>
        </div>
      </div>
    </div>
  );
}
