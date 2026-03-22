import { useState, useEffect, useCallback } from 'react';

/**
 * ThemeToggle — Dark/Light mode switch with smooth transition.
 * Persists choice to localStorage. Adds data-theme to <html>.
 */
export default function ThemeToggle({ compact = false }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('atlas-theme') || 'dark';
    } catch { return 'dark'; }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-transitioning');
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('atlas-theme', theme); } catch {}
    const timer = setTimeout(() => root.classList.remove('theme-transitioning'), 400);
    return () => clearTimeout(timer);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Açık tema' : 'Koyu tema'}
    >
      <div className="theme-toggle-track">
        <div className="theme-toggle-thumb">
          {theme === 'dark' ? '🌙' : '☀️'}
        </div>
      </div>
      {!compact && (
        <span className="theme-toggle-label">
          {theme === 'dark' ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
