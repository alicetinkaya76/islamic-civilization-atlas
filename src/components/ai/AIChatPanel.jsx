/**
 * AIChatPanel — Floating AI Chat Button + Panel
 * ===============================================
 * - Floating button in bottom-right (above BottomTabBar on mobile)
 * - Slide-out panel with chat messages
 * - Lazy-loads search engine on first open
 * - Responsive: full-screen on mobile, side panel on desktop
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAIChat } from './useAIChat';
import AIChatMessage from './AIChatMessage';
import AIChatSuggestions from './AIChatSuggestions';
import { AI_ENABLED } from '../../config/ai';
import '../../styles/ai-chat.css';

export default function AIChatPanel({ lang, onFlyTo }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    messages,
    loading,
    remaining,
    engineReady,
    engineError,
    sendMessage,
    clearChat,
    initEngine,
  } = useAIChat({ lang, onFlyTo });

  // ─── Initialize engine on first open ──────────────────────────
  useEffect(() => {
    if (open) {
      initEngine();
      // Focus input after panel opens
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, initEngine]);

  // ─── Auto-scroll to bottom ────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ─── Handle send ──────────────────────────────────────────────
  const handleSend = useCallback(() => {
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
    setInput('');
  }, [input, loading, sendMessage]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleSuggestion = useCallback((text) => {
    sendMessage(text);
  }, [sendMessage]);

  // ─── Close on Escape ──────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!AI_ENABLED) return null;

  const t = {
    tr: {
      title: 'DİA AI Asistan',
      placeholder: 'İslam tarihi hakkında sorun...',
      send: 'Gönder',
      loading: 'Düşünüyor...',
      remaining: `${remaining} soru kaldı`,
      clear: 'Temizle',
      engineLoading: 'Arama motoru yükleniyor...',
      engineError: 'Arama motoru yüklenemedi. Tekrar deneyin.',
    },
    en: {
      title: 'DİA AI Assistant',
      placeholder: 'Ask about Islamic history...',
      send: 'Send',
      loading: 'Thinking...',
      remaining: `${remaining} questions left`,
      clear: 'Clear',
      engineLoading: 'Loading search engine...',
      engineError: 'Search engine failed to load. Try again.',
    },
    ar: {
      title: 'مساعد DİA الذكي',
      placeholder: 'اسأل عن التاريخ الإسلامي...',
      send: 'إرسال',
      loading: 'يفكر...',
      remaining: `${remaining} أسئلة متبقية`,
      clear: 'مسح',
      engineLoading: 'جاري تحميل محرك البحث...',
      engineError: 'فشل تحميل محرك البحث.',
    },
  }[lang] || {};

  return (
    <>
      {/* ═══ Floating Button ═══ */}
      <button
        className={`ai-fab${open ? ' ai-fab-hidden' : ''}`}
        onClick={() => setOpen(true)}
        aria-label={t.title}
        title={t.title}
      >
        <svg className="ai-fab-icon" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          <path d="M12 3v4" opacity="0.5"/>
          <circle cx="12" cy="2" r="1" fill="#f5c542" stroke="none"/>
        </svg>
        <span className="ai-fab-pulse" />
      </button>

      {/* ═══ Backdrop ═══ */}
      {open && <div className="ai-backdrop" onClick={() => setOpen(false)} />}

      {/* ═══ Chat Panel ═══ */}
      <div className={`ai-panel${open ? ' ai-panel-open' : ''}`} role="dialog" aria-label={t.title}>
        {/* Header */}
        <div className="ai-panel-header">
          <div className="ai-panel-title">
            <svg className="ai-panel-logo" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              <circle cx="12" cy="2" r="1" fill="#f5c542" stroke="none"/>
            </svg>
            <span>{t.title}</span>
            <span className="ai-panel-badge">beta</span>
          </div>
          <div className="ai-panel-actions">
            <span className="ai-remaining">{t.remaining}</span>
            {messages.length > 0 && (
              <button className="ai-clear-btn" onClick={clearChat} title={t.clear}>🗑</button>
            )}
            <button className="ai-close-btn" onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </div>
        </div>

        {/* Messages */}
        <div className="ai-panel-messages">
          {/* Engine status */}
          {!engineReady && !engineError && (
            <div className="ai-engine-status">
              <div className="ai-loading-spinner" />
              <span>{t.engineLoading}</span>
            </div>
          )}
          {engineError && (
            <div className="ai-engine-status ai-engine-error">
              <span>⚠️ {t.engineError}</span>
              <button onClick={initEngine} className="ai-retry-btn">↻</button>
            </div>
          )}

          {/* Suggestions (only when no messages) */}
          {messages.length === 0 && engineReady && (
            <AIChatSuggestions lang={lang} onSelect={handleSuggestion} />
          )}

          {/* Chat messages */}
          {messages.map((msg, i) => (
            <AIChatMessage key={i} msg={msg} lang={lang} />
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="ai-msg ai-msg-assistant ai-msg-loading">
              <div className="ai-msg-avatar">📖</div>
              <div className="ai-msg-content">
                <div className="ai-typing">
                  <span /><span /><span />
                </div>
                <span className="ai-typing-text">{t.loading}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="ai-panel-input">
          <textarea
            ref={inputRef}
            className="ai-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            rows={1}
            disabled={loading || remaining <= 0}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          />
          <button
            className="ai-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || loading || remaining <= 0}
            aria-label={t.send}
          >
            {loading ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </>
  );
}
