import { useState, useCallback } from 'react';
import BottomSheet from './BottomSheet';

const PRIMARY_TABS = [
  { id: 'map',       icon: '🗺️', tr: 'Harita',   en: 'Map',       ar: 'خريطة' },
  { id: 'dashboard', icon: '📊', tr: 'Pano',     en: 'Dashboard', ar: 'لوحة' },
  { id: 'alam',      icon: '📖', tr: 'A\'lâm',   en: 'al-Aʿlām',  ar: 'الأعلام' },
  { id: 'dia',       icon: '📚', tr: 'DİA',      en: 'DİA',       ar: 'موسوعة' },
];

const SECONDARY_TABS = [
  { id: 'ei1',      icon: '📕', tr: 'EI-1',            en: 'EI-1',      ar: 'دائرة المعارف' },
  { id: 'timeline', icon: '📅', tr: 'Zaman Çizelgesi', en: 'Timeline',  ar: 'الجدول الزمني' },
  { id: 'links',    icon: '🔗', tr: 'Nedensellik',     en: 'Causality', ar: 'السببية' },
  { id: 'scholars', icon: '🎓', tr: 'Âlimler',         en: 'Scholars',  ar: 'العلماء' },
  { id: 'battles',  icon: '⚔️', tr: 'Savaşlar',        en: 'Battles',   ar: 'المعارك' },
  { id: 'yaqut',    icon: '🌍', tr: "Mu'cem",          en: "Mu'jam",    ar: 'معجم' },
];

const MORE_LABEL = { tr: 'Daha', en: 'More', ar: 'المزيد' };
const QUIZ_LABEL = { tr: 'Quiz', en: 'Quiz', ar: 'اختبار' };
const ABOUT_LABEL = { tr: 'Hakkında', en: 'About', ar: 'حول' };

/**
 * BottomTabBar — fixed bottom navigation for mobile (≤768px).
 * Shows 4 primary tabs + "More" that opens a BottomSheet.
 *
 * Props:
 *   tab        — current active tab id
 *   onSelect   — (tabId) => void
 *   lang       — 'tr' | 'en' | 'ar'
 *   onQuiz     — () => void  (open quiz)
 *   onAbout    — () => void  (open about)
 *   onLang     — (lang) => void
 *   currentLang — string
 */
export default function BottomTabBar({ tab, onSelect, lang, onQuiz, onAbout, onLang }) {
  const [moreOpen, setMoreOpen] = useState(false);

  const handleMore = useCallback(() => setMoreOpen(true), []);
  const handleClose = useCallback(() => setMoreOpen(false), []);

  const handleSecondary = useCallback((id) => {
    onSelect(id);
    setMoreOpen(false);
  }, [onSelect]);

  const isSecondaryActive = SECONDARY_TABS.some(t => t.id === tab);

  return (
    <>
      <nav className="bottom-tab-bar" role="tablist"
        aria-label={{ tr: 'Alt navigasyon', en: 'Bottom navigation', ar: 'التنقل السفلي' }[lang]}>
        {PRIMARY_TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`btb-item${tab === t.id ? ' active' : ''}`}
            onClick={() => onSelect(t.id)}
          >
            <span className="btb-icon">{t.icon}</span>
            <span className="btb-label">{t[lang]}</span>
          </button>
        ))}
        <button
          className={`btb-item btb-more${isSecondaryActive ? ' active' : ''}`}
          onClick={handleMore}
          aria-label={MORE_LABEL[lang]}
        >
          <span className="btb-icon">•••</span>
          <span className="btb-label">{MORE_LABEL[lang]}</span>
        </button>
      </nav>

      <BottomSheet open={moreOpen} onClose={handleClose} className="btb-more-sheet">
        <div className="btb-more-list">
          {SECONDARY_TABS.map(t => (
            <button
              key={t.id}
              className={`btb-more-item${tab === t.id ? ' active' : ''}`}
              onClick={() => handleSecondary(t.id)}
            >
              <span className="btb-more-icon">{t.icon}</span>
              <span className="btb-more-text">{t[lang]}</span>
            </button>
          ))}
        </div>
        <div className="btb-more-footer">
          <button className="btb-more-action" onClick={() => { onQuiz?.(); setMoreOpen(false); }}>
            🎓 {QUIZ_LABEL[lang]}
          </button>
          <button className="btb-more-action" onClick={() => { onAbout?.(); setMoreOpen(false); }}>
            ℹ️ {ABOUT_LABEL[lang]}
          </button>
          <div className="btb-lang-row">
            {['tr', 'en', 'ar'].map(l => (
              <button
                key={l}
                className={`btb-lang-btn${lang === l ? ' active' : ''}`}
                onClick={() => { onLang?.(l); setMoreOpen(false); }}
              >
                {{ tr: '🇹🇷 TR', en: '🇬🇧 EN', ar: '🇸🇦 AR' }[l]}
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
