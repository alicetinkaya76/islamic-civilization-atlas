import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import DB from '../data/db.json';

/* ══════════════════════════════════════════════════════════
   QuizMode — 6 question types, 3 difficulties, bilingual
   ══════════════════════════════════════════════════════════ */

const TOTAL_Q = 10;

/* ── Difficulty filters ── */
const DIFF_DYNASTY = {
  easy:   d => d.imp === 'Kritik' || d.imp === 'Yüksek',
  medium: d => d.imp !== 'Düşük',
  hard:   () => true,
};

const DIFF_BATTLE = {
  easy:   b => b.sig === 'Kritik',
  medium: b => b.sig === 'Kritik' || b.sig === 'Yüksek',
  hard:   () => true,
};

/* ── Helpers ── */
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
const pick = (arr, n = 1) => shuffle(arr).slice(0, n);
const centuryOf = yr => Math.ceil(yr / 100);
const centuryLabel = (yr, lang) => {
  const c = centuryOf(yr);
  return lang === 'tr' ? `${c}. yüzyıl` : `${c}th century`;
};
const name = (item, lang) => item[lang] || item.tr || item.en || '?';

/* ── Generate wrong century options ── */
function centuryDistractors(correctYr, count = 3) {
  const c = centuryOf(correctYr);
  const pool = [];
  for (let i = Math.max(1, c - 4); i <= Math.min(20, c + 4); i++) {
    if (i !== c) pool.push(i);
  }
  return pick(pool, count);
}

/* ══════════════════════════════════════════════════════════
   Question generators — each returns { question, options, correctIndex, flyTo }
   ══════════════════════════════════════════════════════════ */

/* Type 1: "Bu hanedan hangi yüzyılda kuruldu?" */
function genDynastyCentury(lang, diff) {
  const pool = DB.dynasties.filter(DIFF_DYNASTY[diff]).filter(d => d.start);
  if (pool.length < 4) return null;
  const d = pick(pool)[0];
  const correct = centuryLabel(d.start, lang);
  const wrongs = centuryDistractors(d.start, 3).map(c =>
    lang === 'tr' ? `${c}. yüzyıl` : `${c}th century`
  );
  const options = shuffle([correct, ...wrongs]);
  return {
    question: lang === 'tr'
      ? `"${name(d, lang)}" hangi yüzyılda kuruldu?`
      : `In which century was "${name(d, lang)}" founded?`,
    options,
    correctIndex: options.indexOf(correct),
    flyTo: d.lat && d.lon ? { lat: d.lat, lon: d.lon, zoom: 6 } : null,
    emoji: '🏛',
  };
}

/* Type 2: "Bu savaşın galibi kim?" — using battle result text */
function genBattleWinner(lang, diff) {
  const pool = DB.battles.filter(DIFF_BATTLE[diff]).filter(b => b.res);
  if (pool.length < 4) return null;
  const b = pick(pool)[0];
  const correctText = b.res;
  const wrongBattles = pick(pool.filter(x => x.id !== b.id), 3);
  if (wrongBattles.length < 3) return null;
  const options = shuffle([correctText, ...wrongBattles.map(w => w.res)]);
  return {
    question: lang === 'tr'
      ? `"${name(b, lang)}" (${b.yr}) — sonucu nedir?`
      : `"${name(b, lang)}" (${b.yr}) — what was the outcome?`,
    options,
    correctIndex: options.indexOf(correctText),
    flyTo: b.lat && b.lon ? { lat: b.lat, lon: b.lon, zoom: 7 } : null,
    emoji: '⚔️',
  };
}

/* Type 3: "Bu âlim hangi şehirde himaye gördü?" — via patron dynasty → city */
function genScholarCity(lang, diff) {
  const dynMap = {};
  DB.dynasties.forEach(d => { dynMap[d.id] = d; });
  const scholarsWithCity = DB.scholars.filter(s => {
    const patron = dynMap[s.patron_d];
    return patron && patron.cap;
  });
  if (scholarsWithCity.length < 4) return null;
  const s = pick(scholarsWithCity)[0];
  const patronDyn = dynMap[s.patron_d];
  const correctCity = patronDyn.cap.split(';')[0].trim();
  const otherCities = pick(
    DB.cities.filter(c => name(c, lang) !== correctCity && name(c, lang) !== correctCity.split('(')[0].trim()),
    3
  ).map(c => name(c, lang));
  if (otherCities.length < 3) return null;
  const options = shuffle([correctCity, ...otherCities]);
  return {
    question: lang === 'tr'
      ? `"${name(s, lang)}" hangi şehirde himaye gördü?`
      : `In which city was "${name(s, lang)}" patronized?`,
    options,
    correctIndex: options.indexOf(correctCity),
    flyTo: patronDyn.lat && patronDyn.lon ? { lat: patronDyn.lat, lon: patronDyn.lon, zoom: 7 } : null,
    emoji: '📚',
  };
}

/* Type 4: "Hangisi daha önce kuruldu?" */
function genWhichEarlier(lang, diff) {
  const pool = DB.dynasties.filter(DIFF_DYNASTY[diff]).filter(d => d.start);
  if (pool.length < 4) return null;
  const two = pick(pool, 2);
  if (two[0].start === two[1].start) return null; // avoid ties
  const earlier = two[0].start < two[1].start ? two[0] : two[1];
  const nameA = name(two[0], lang);
  const nameB = name(two[1], lang);
  const options = [nameA, nameB];
  return {
    question: lang === 'tr'
      ? `Hangisi daha önce kuruldu?`
      : `Which was founded earlier?`,
    options,
    correctIndex: options.indexOf(name(earlier, lang)),
    flyTo: earlier.lat && earlier.lon ? { lat: earlier.lat, lon: earlier.lon, zoom: 5 } : null,
    emoji: '⏳',
  };
}

/* Type 5: "Bu eser nerede?" — monuments → city */
function genMonumentCity(lang, diff) {
  const monuments = DB.monuments.filter(m => m.city_tr || m.city_en);
  if (monuments.length < 4) return null;
  const m = pick(monuments)[0];
  const correctCity = lang === 'tr' ? (m.city_tr || m.city_en) : (m.city_en || m.city_tr);
  const wrongCities = pick(
    DB.cities.filter(c => name(c, lang) !== correctCity),
    3
  ).map(c => name(c, lang));
  if (wrongCities.length < 3) return null;
  const options = shuffle([correctCity, ...wrongCities]);
  return {
    question: lang === 'tr'
      ? `"${name(m, lang)}" hangi şehirdedir?`
      : `In which city is "${name(m, lang)}" located?`,
    options,
    correctIndex: options.indexOf(correctCity),
    flyTo: m.lat && m.lon ? { lat: m.lat, lon: m.lon, zoom: 8 } : null,
    emoji: '🕌',
  };
}

/* Type 6: "Bu olay hangi yüzyılda oldu?" */
function genEventCentury(lang, diff) {
  const pool = DB.events.filter(e => e.yr);
  if (pool.length < 4) return null;
  const e = pick(pool)[0];
  const correct = centuryLabel(e.yr, lang);
  const wrongs = centuryDistractors(e.yr, 3).map(c =>
    lang === 'tr' ? `${c}. yüzyıl` : `${c}th century`
  );
  const options = shuffle([correct, ...wrongs]);
  return {
    question: lang === 'tr'
      ? `"${name(e, lang)}" hangi yüzyılda gerçekleşti?`
      : `In which century did "${name(e, lang)}" occur?`,
    options,
    correctIndex: options.indexOf(correct),
    flyTo: e.lat && e.lon ? { lat: e.lat, lon: e.lon, zoom: 7 } : null,
    emoji: '📜',
  };
}

const GENERATORS = [
  genDynastyCentury,
  genBattleWinner,
  genScholarCity,
  genWhichEarlier,
  genMonumentCity,
  genEventCentury,
];

function generateQuiz(lang, diff) {
  const questions = [];
  const usedTypes = new Set();
  let attempts = 0;

  while (questions.length < TOTAL_Q && attempts < 200) {
    attempts++;
    // First ensure at least one of each type, then random
    let genIdx;
    if (usedTypes.size < GENERATORS.length && questions.length < GENERATORS.length) {
      const unused = [...Array(GENERATORS.length).keys()].filter(i => !usedTypes.has(i));
      genIdx = unused[Math.floor(Math.random() * unused.length)];
    } else {
      genIdx = Math.floor(Math.random() * GENERATORS.length);
    }
    const q = GENERATORS[genIdx](lang, diff);
    if (q) {
      questions.push(q);
      usedTypes.add(genIdx);
    }
  }
  return questions;
}

/* ── Score titles ── */
function getScoreTitle(score, lang) {
  if (score >= 9) return lang === 'tr' ? 'Tarih Üstadı! 🏆' : 'History Master! 🏆';
  if (score >= 7) return lang === 'tr' ? 'Tarih Meraklısı! 🏅' : 'History Enthusiast! 🏅';
  if (score >= 5) return lang === 'tr' ? 'İyi Deneme! 📖' : 'Good Attempt! 📖';
  if (score >= 3) return lang === 'tr' ? 'Öğrenmeye Devam! 📝' : 'Keep Learning! 📝';
  return lang === 'tr' ? 'Tekrar Dene! 💪' : 'Try Again! 💪';
}

/* ══════════════════════════════════════════════════════════
   React Component
   ══════════════════════════════════════════════════════════ */

export default function QuizMode({ lang, onFlyTo, onClose }) {
  const [phase, setPhase] = useState('menu'); // menu | playing | result
  const [diff, setDiff] = useState('medium');
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const timerRef = useRef(null);

  const t = useMemo(() => ({
    title: lang === 'tr' ? 'Bilgi Yarışması' : 'Knowledge Quiz',
    subtitle: lang === 'tr'
      ? 'İslam tarihinden 10 soru ile bilginizi test edin!'
      : 'Test your knowledge with 10 questions from Islamic history!',
    start: lang === 'tr' ? 'Başla' : 'Start',
    next: lang === 'tr' ? 'Sonraki Soru' : 'Next Question',
    finish: lang === 'tr' ? 'Sonuçları Gör' : 'See Results',
    playAgain: lang === 'tr' ? 'Tekrar Oyna' : 'Play Again',
    close: lang === 'tr' ? 'Kapat' : 'Close',
    qOf: lang === 'tr' ? 'Soru' : 'Question',
    score: lang === 'tr' ? 'Skor' : 'Score',
    correct: lang === 'tr' ? 'Doğru!' : 'Correct!',
    wrong: lang === 'tr' ? 'Yanlış!' : 'Wrong!',
    correctAnswer: lang === 'tr' ? 'Doğru cevap' : 'Correct answer',
    difficulty: lang === 'tr' ? 'Zorluk' : 'Difficulty',
    easy: lang === 'tr' ? 'Kolay' : 'Easy',
    medium: lang === 'tr' ? 'Orta' : 'Medium',
    hard: lang === 'tr' ? 'Zor' : 'Hard',
    easyDesc: lang === 'tr' ? 'Büyük hanedanlar ve kritik olaylar' : 'Major dynasties and critical events',
    mediumDesc: lang === 'tr' ? 'Karma zorluk' : 'Mixed difficulty',
    hardDesc: lang === 'tr' ? 'Küçük beylikler dahil' : 'Including minor principalities',
    yourScore: lang === 'tr' ? 'Skorunuz' : 'Your Score',
  }), [lang]);

  const startQuiz = useCallback(() => {
    const qs = generateQuiz(lang, diff);
    setQuestions(qs);
    setQIdx(0);
    setSelected(null);
    setScore(0);
    setAnswered(false);
    setPhase('playing');
  }, [lang, diff]);

  const handleAnswer = useCallback((optIdx) => {
    if (answered) return;
    setSelected(optIdx);
    setAnswered(true);
    const q = questions[qIdx];
    const isCorrect = optIdx === q.correctIndex;
    if (isCorrect) {
      setScore(s => s + 1);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 800);
    }
    // FlyTo on correct answer
    if (isCorrect && q.flyTo && onFlyTo) {
      setTimeout(() => onFlyTo(q.flyTo), 400);
    }
  }, [answered, questions, qIdx, onFlyTo]);

  const handleNext = useCallback(() => {
    if (qIdx + 1 >= questions.length) {
      setPhase('result');
      return;
    }
    setQIdx(i => i + 1);
    setSelected(null);
    setAnswered(false);
  }, [qIdx, questions.length]);

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (phase === 'playing' && !answered) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= questions[qIdx]?.options?.length) {
          handleAnswer(num - 1);
        }
      }
      if (phase === 'playing' && answered && (e.key === 'Enter' || e.key === ' ')) {
        handleNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, answered, qIdx, questions, handleAnswer, handleNext, onClose]);

  const currentQ = questions[qIdx];

  /* ── MENU ── */
  if (phase === 'menu') {
    return (
      <div className="quiz-overlay" onClick={onClose}>
        <div className="quiz-panel quiz-menu" onClick={e => e.stopPropagation()}>
          <button className="quiz-close" onClick={onClose} aria-label={t.close}>✕</button>
          <div className="quiz-menu-header">
            <div className="quiz-menu-icon">🎓</div>
            <h2>{t.title}</h2>
            <p>{t.subtitle}</p>
          </div>

          <div className="quiz-diff-section">
            <h3>{t.difficulty}</h3>
            <div className="quiz-diff-options">
              {['easy', 'medium', 'hard'].map(d => (
                <button
                  key={d}
                  className={`quiz-diff-btn ${diff === d ? 'active' : ''} diff-${d}`}
                  onClick={() => setDiff(d)}
                >
                  <span className="diff-emoji">
                    {d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : '🔴'}
                  </span>
                  <span className="diff-label">{t[d]}</span>
                  <span className="diff-desc">{t[`${d}Desc`]}</span>
                </button>
              ))}
            </div>
          </div>

          <button className="quiz-start-btn" onClick={startQuiz}>
            {t.start} →
          </button>
        </div>
      </div>
    );
  }

  /* ── RESULT ── */
  if (phase === 'result') {
    const pct = Math.round((score / TOTAL_Q) * 100);
    return (
      <div className="quiz-overlay" onClick={onClose}>
        <div className="quiz-panel quiz-result" onClick={e => e.stopPropagation()}>
          <button className="quiz-close" onClick={onClose} aria-label={t.close}>✕</button>
          <div className="quiz-result-content">
            <div className="quiz-result-circle">
              <svg viewBox="0 0 120 120" className="quiz-result-ring">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="8" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--gold)" strokeWidth="8"
                  strokeDasharray={`${pct * 3.267} ${326.7 - pct * 3.267}`}
                  strokeDashoffset="81.675" strokeLinecap="round"
                  className="quiz-result-progress" />
              </svg>
              <div className="quiz-result-number">
                <span className="quiz-result-score">{score}</span>
                <span className="quiz-result-total">/{TOTAL_Q}</span>
              </div>
            </div>
            <h2 className="quiz-result-title">{getScoreTitle(score, lang)}</h2>
            <p className="quiz-result-pct">{pct}%</p>
          </div>
          <div className="quiz-result-actions">
            <button className="quiz-btn-primary" onClick={() => { setPhase('menu'); }}>
              {t.playAgain}
            </button>
            <button className="quiz-btn-secondary" onClick={onClose}>
              {t.close}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── PLAYING ── */
  if (!currentQ) return null;
  const isCorrect = selected === currentQ.correctIndex;

  return (
    <div className="quiz-overlay" onClick={onClose}>
      <div className="quiz-panel quiz-playing" onClick={e => e.stopPropagation()}>
        <button className="quiz-close" onClick={onClose} aria-label={t.close}>✕</button>

        {/* Progress bar */}
        <div className="quiz-progress">
          <div className="quiz-progress-bar" style={{ width: `${((qIdx + 1) / TOTAL_Q) * 100}%` }} />
        </div>

        {/* Header */}
        <div className="quiz-q-header">
          <span className="quiz-q-num">{t.qOf} {qIdx + 1}/{TOTAL_Q}</span>
          <span className="quiz-q-score">{t.score}: {score}</span>
        </div>

        {/* Question */}
        <div className="quiz-question">
          <span className="quiz-q-emoji">{currentQ.emoji}</span>
          <h3>{currentQ.question}</h3>
        </div>

        {/* Options */}
        <div className="quiz-options">
          {currentQ.options.map((opt, i) => {
            let cls = 'quiz-option';
            if (answered) {
              if (i === currentQ.correctIndex) cls += ' correct';
              else if (i === selected && !isCorrect) cls += ' wrong';
              else cls += ' faded';
            }
            if (i === selected && !answered) cls += ' selected';
            return (
              <button
                key={i}
                className={cls}
                onClick={() => handleAnswer(i)}
                disabled={answered}
              >
                <span className="quiz-opt-key">{i + 1}</span>
                <span className="quiz-opt-text">{opt}</span>
                {answered && i === currentQ.correctIndex && <span className="quiz-opt-check">✓</span>}
                {answered && i === selected && !isCorrect && i !== currentQ.correctIndex && <span className="quiz-opt-x">✗</span>}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {answered && (
          <div className={`quiz-feedback ${isCorrect ? 'correct' : 'wrong'}`}>
            <span>{isCorrect ? t.correct : t.wrong}</span>
            {!isCorrect && (
              <span className="quiz-feedback-answer">
                {t.correctAnswer}: {currentQ.options[currentQ.correctIndex]}
              </span>
            )}
          </div>
        )}

        {/* Confetti burst */}
        {showConfetti && <div className="quiz-confetti" aria-hidden="true">
          {[...Array(12)].map((_, i) => <span key={i} className="confetti-bit" style={{
            '--angle': `${i * 30}deg`,
            '--dist': `${40 + Math.random() * 40}px`,
            '--color': ['#c9a84c', '#e8c65a', '#4ecdc4', '#ff6b6b', '#f7dc6f', '#82e0aa'][i % 6],
          }} />)}
        </div>}

        {/* Next button */}
        {answered && (
          <button className="quiz-next-btn" onClick={handleNext}>
            {qIdx + 1 >= TOTAL_Q ? t.finish : t.next} →
          </button>
        )}
      </div>
    </div>
  );
}
