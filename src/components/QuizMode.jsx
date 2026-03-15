import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import DB from '../data/db.json';
import ALAM_LITE from '../data/alam_lite.json';
import YAQUT_LITE from '../data/yaqut_lite.json';

/* ══════════════════════════════════════════════════════════
   QuizMode — 10 question types, 3 difficulties, bilingual
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
  return { tr: `${c}. yüzyıl`, en: `${c}th century`, ar: `` }[lang];
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
    ({ tr: `${c}. yüzyıl`, en: `${c}th century`, ar: `` }[lang])
  );
  const options = shuffle([correct, ...wrongs]);
  return {
    question: { tr: `"${name(d, lang)}" hangi yüzyılda kuruldu?`, en: `In which century was "${name(d, lang)}" founded?`, ar: `` }[lang],
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
    question: { tr: `"${name(b, lang)}" (${b.yr}) — sonucu nedir?`, en: `"${name(b, lang)}" (${b.yr}) — what was the outcome?`, ar: `` }[lang],
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
    question: { tr: `"${name(s, lang)}" hangi şehirde himaye gördü?`, en: `In which city was "${name(s, lang)}" patronized?`, ar: `` }[lang],
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
    question: { tr: `Hangisi daha önce kuruldu?`, en: `Which was founded earlier?`, ar: `` }[lang],
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
  const correctCity = m[`city_${lang}`] || m.city_en || m.city_tr;
  const wrongCities = pick(
    DB.cities.filter(c => name(c, lang) !== correctCity),
    3
  ).map(c => name(c, lang));
  if (wrongCities.length < 3) return null;
  const options = shuffle([correctCity, ...wrongCities]);
  return {
    question: { tr: `"${name(m, lang)}" hangi şehirdedir?`, en: `In which city is "${name(m, lang)}" located?`, ar: `` }[lang],
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
    ({ tr: `${c}. yüzyıl`, en: `${c}th century`, ar: `` }[lang])
  );
  const options = shuffle([correct, ...wrongs]);
  return {
    question: { tr: `"${name(e, lang)}" hangi yüzyılda gerçekleşti?`, en: `In which century did "${name(e, lang)}" occur?`, ar: `` }[lang],
    options,
    correctIndex: options.indexOf(correct),
    flyTo: e.lat && e.lon ? { lat: e.lat, lon: e.lon, zoom: 7 } : null,
    emoji: '📜',
  };
}

/* Type 7: el-A'lâm — "Bu âlimin mesleği nedir?" */
function genAlamProfession(lang, diff) {
  const pool = ALAM_LITE.filter(b => b.pt && b.pe && b.md);
  if (pool.length < 4) return null;
  const b = pick(pool)[0];
  const correctProf = lang === 'ar' ? (b.pe || b.pt) : lang === 'tr' ? b.pt : b.pe;
  const others = pick(pool.filter(x => (lang === 'tr' ? x.pt : x.pe) !== correctProf), 3)
    .map(x => lang === 'tr' ? x.pt : x.pe);
  if (others.length < 3) return null;
  const options = shuffle([correctProf, ...others]);
  return {
    question: { tr: `"${b.ht}" (ö. ${b.md}) — mesleği nedir?`, en: `"${b.he}" (d. ${b.md}) — what was their profession?`, ar: `` }[lang],
    options,
    correctIndex: options.indexOf(correctProf),
    flyTo: b.lat && b.lon ? { lat: b.lat, lon: b.lon, zoom: 6 } : null,
    emoji: '📖',
  };
}

/* Type 8: el-A'lâm — "Bu âlim hangi yüzyılda yaşadı?" */
function genAlamCentury(lang, diff) {
  const pool = ALAM_LITE.filter(b => b.md && b.c);
  if (pool.length < 4) return null;
  const b = pick(pool)[0];
  const correct = centuryLabel(b.md, lang);
  const wrongs = centuryDistractors(b.md, 3).map(c =>
    ({ tr: `${c}. yüzyıl`, en: `${c}th century`, ar: `` }[lang])
  );
  const options = shuffle([correct, ...wrongs]);
  return {
    question: { tr: `"${b.ht}" hangi yüzyılda vefat etti?`, en: `In which century did "${b.he}" die?`, ar: `` }[lang],
    options,
    correctIndex: options.indexOf(correct),
    flyTo: b.lat && b.lon ? { lat: b.lat, lon: b.lon, zoom: 6 } : null,
    emoji: '📖',
  };
}

/* Type 9: Yâkût — "Bu yer hangi ülkede?" */
function genYaqutCountry(lang, diff) {
  const pool = YAQUT_LITE.filter(e => e.ct && e.ht && e.he);
  if (pool.length < 4) return null;
  const e = pick(pool)[0];
  const correctCountry = e.ct;
  const countries = [...new Set(pool.map(x => x.ct))].filter(c => c !== correctCountry);
  const wrongs = pick(countries, 3);
  if (wrongs.length < 3) return null;
  const options = shuffle([correctCountry, ...wrongs]);
  return {
    question: { tr: `Yâkût'a göre "${e.ht}" (${e.gtt || e.gt}) hangi ülkededir?`, en: `According to Yāqūt, in which country is "${e.he}" (${e.gte || e.gt})?`, ar: `` }[lang],
    options,
    correctIndex: options.indexOf(correctCountry),
    flyTo: e.lat && e.lon ? { lat: e.lat, lon: e.lon, zoom: 7 } : null,
    emoji: '🌍',
  };
}

/* Type 10: Yâkût — "Bu yer ne tür bir coğrafi birim?" */
function genYaqutGeoType(lang, diff) {
  const GEO_TR = { city: 'Şehir', village: 'Köy', mountain: 'Dağ', river: 'Nehir', fortress: 'Kale', region: 'Bölge', town: 'Kasaba', island: 'Ada', desert: 'Çöl', well: 'Kuyu' };
  const GEO_EN = { city: 'City', village: 'Village', mountain: 'Mountain', river: 'River', fortress: 'Fortress', region: 'Region', town: 'Town', island: 'Island', desert: 'Desert', well: 'Well' };
  const validTypes = Object.keys(GEO_TR);
  const pool = YAQUT_LITE.filter(e => validTypes.includes(e.gt) && e.ht && e.he);
  if (pool.length < 4) return null;
  const e = pick(pool)[0];
  const labels = lang === 'tr' ? GEO_TR : GEO_EN;
  const correctLabel = labels[e.gt];
  const otherTypes = validTypes.filter(t => t !== e.gt);
  const wrongs = pick(otherTypes, 3).map(t => labels[t]);
  if (wrongs.length < 3) return null;
  const options = shuffle([correctLabel, ...wrongs]);
  return {
    question: { tr: `Yâkût'un sözlüğünde "${e.ht}" ne tür bir coğrafi birimdir?`, en: `In Yāqūt's dictionary, what type of geographic entity is "${e.he}"?`, ar: `` }[lang],
    options,
    correctIndex: options.indexOf(correctLabel),
    flyTo: e.lat && e.lon ? { lat: e.lat, lon: e.lon, zoom: 7 } : null,
    emoji: '🌍',
  };
}

const GENERATORS = [
  genDynastyCentury,
  genBattleWinner,
  genScholarCity,
  genWhichEarlier,
  genMonumentCity,
  genEventCentury,
  genAlamProfession,
  genAlamCentury,
  genYaqutCountry,
  genYaqutGeoType,
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
  if (score >= 9) return { tr: 'Tarih Üstadı! 🏆', en: 'History Master! 🏆', ar: '' }[lang];
  if (score >= 7) return { tr: 'Tarih Meraklısı! 🏅', en: 'History Enthusiast! 🏅', ar: '' }[lang];
  if (score >= 5) return { tr: 'İyi Deneme! 📖', en: 'Good Attempt! 📖', ar: '' }[lang];
  if (score >= 3) return { tr: 'Öğrenmeye Devam! 📝', en: 'Keep Learning! 📝', ar: '' }[lang];
  return { tr: 'Tekrar Dene! 💪', en: 'Try Again! 💪', ar: '' }[lang];
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
    title: { tr: 'Bilgi Yarışması', en: 'Knowledge Quiz', ar: '' }[lang],
    subtitle: { tr: 'Hanedanlar, savaşlar, el-A\'lâm ve Yâkût\'tan 10 soru!', en: 'Test your knowledge: dynasties, battles, al-Aʿlām & Yāqūt!', ar: '' }[lang],
    start: { tr: 'Başla', en: 'Start', ar: '' }[lang],
    next: { tr: 'Sonraki Soru', en: 'Next Question', ar: '' }[lang],
    finish: { tr: 'Sonuçları Gör', en: 'See Results', ar: '' }[lang],
    playAgain: { tr: 'Tekrar Oyna', en: 'Play Again', ar: '' }[lang],
    close: { tr: 'Kapat', en: 'Close', ar: '' }[lang],
    qOf: { tr: 'Soru', en: 'Question', ar: '' }[lang],
    score: { tr: 'Skor', en: 'Score', ar: '' }[lang],
    correct: { tr: 'Doğru!', en: 'Correct!', ar: '' }[lang],
    wrong: { tr: 'Yanlış!', en: 'Wrong!', ar: '' }[lang],
    correctAnswer: { tr: 'Doğru cevap', en: 'Correct answer', ar: '' }[lang],
    difficulty: { tr: 'Zorluk', en: 'Difficulty', ar: '' }[lang],
    easy: { tr: 'Kolay', en: 'Easy', ar: '' }[lang],
    medium: { tr: 'Orta', en: 'Medium', ar: '' }[lang],
    hard: { tr: 'Zor', en: 'Hard', ar: '' }[lang],
    easyDesc: { tr: 'Büyük hanedanlar ve kritik olaylar', en: 'Major dynasties and critical events', ar: '' }[lang],
    mediumDesc: { tr: 'Karma zorluk', en: 'Mixed difficulty', ar: '' }[lang],
    hardDesc: { tr: 'Küçük beylikler dahil', en: 'Including minor principalities', ar: '' }[lang],
    yourScore: { tr: 'Skorunuz', en: 'Your Score', ar: '' }[lang],
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
