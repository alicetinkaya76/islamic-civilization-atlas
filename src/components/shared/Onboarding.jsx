import { useState, useCallback } from 'react';

const STEPS = [
  { icon: '🗺', title_tr: 'Harita', title_en: 'Map',
    text_tr: 'Tarihî olayları, savaşları ve anıtları haritada keşfedin.',
    text_en: 'Discover historical events, battles, and monuments on the map.' },
  { icon: '📊', title_tr: 'Zaman Çizelgesi', title_en: 'Timeline',
    text_tr: '290 âlimin hayat çizgilerini inceleyin.',
    text_en: 'Explore the life spans of 290 scholars.' },
  { icon: '🔗', title_tr: 'Âlim Ağı', title_en: 'Scholar Network',
    text_tr: 'Hoca-öğrenci ilişkilerini keşfedin.',
    text_en: 'Discover teacher-student relationships.' },
  { icon: '⚔', title_tr: 'Savaşlar', title_en: 'Battles',
    text_tr: '65 savaşın detaylarını ve taktik analizlerini okuyun.',
    text_en: 'Read detailed analyses of 65 battles.' },
  { icon: '🎓', title_tr: 'Quiz', title_en: 'Quiz',
    text_tr: 'Bilginizi test edin ve rozet kazanın.',
    text_en: 'Test your knowledge and earn badges.' },
];

export default function Onboarding({ lang, onDone }) {
  const [step, setStep] = useState(0);
  const [dontShow, setDontShow] = useState(false);

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
          {lang === 'tr' ? current.title_tr : current.title_en}
        </h2>
        <p className="onboarding-text">
          {lang === 'tr' ? current.text_tr : current.text_en}
        </p>

        <div className="onboarding-nav">
          {step > 0 && (
            <button className="onboarding-btn secondary" onClick={handlePrev}>
              ← {lang === 'tr' ? 'Geri' : 'Back'}
            </button>
          )}
          <button className="onboarding-btn primary" onClick={handleNext}>
            {isLast
              ? (lang === 'tr' ? 'Başla!' : 'Start!')
              : (lang === 'tr' ? 'İleri →' : 'Next →')}
          </button>
        </div>

        <div className="onboarding-footer">
          <label className="onboarding-checkbox-label">
            <input type="checkbox" checked={dontShow} onChange={e => setDontShow(e.target.checked)} />
            <span>{lang === 'tr' ? 'Tekrar gösterme' : "Don't show again"}</span>
          </label>
          <button className="onboarding-skip" onClick={handleSkip}>
            {lang === 'tr' ? 'Atla' : 'Skip'}
          </button>
        </div>
      </div>
    </div>
  );
}
