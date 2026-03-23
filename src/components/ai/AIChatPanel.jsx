/**
 * AIChatPanel — Floating AI Chat Button + Panel
 * ===============================================
 * v2 — Session 29:
 *   A5: Chat history persistence + "New Chat" button
 *   A6: Fallback notice in header when quota exhausted
 *   B6: Mobile FAB collision fix (CSS)
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
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    messages,
    loading,
    remaining,
    engineReady,
    engineError,
    chatHistory,
    sendMessage,
    clearChat,
    newChat,
    loadChat,
    initEngine,
  } = useAIChat({ lang, onFlyTo });

  // ─── Initialize engine on first open ──────────────────────────
  useEffect(() => {
    if (open) {
      initEngine();
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

  const handleNewChat = useCallback(() => {
    newChat();
    setShowHistory(false);
  }, [newChat]);

  const handleLoadChat = useCallback((chatId) => {
    loadChat(chatId);
    setShowHistory(false);
  }, [loadChat]);

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
      remaining: remaining > 0 ? `${remaining} soru kaldı` : 'Limit doldu',
      clear: 'Temizle',
      newChat: 'Yeni Sohbet',
      history: 'Geçmiş',
      engineLoading: 'Arama motoru yükleniyor...',
      engineError: 'Arama motoru yüklenemedi. Tekrar deneyin.',
      noHistory: 'Henüz sohbet yok',
      fallbackMode: '⚡ Offline mod — sadece arama sonuçları',
    },
    en: {
      title: 'DİA AI Assistant',
      placeholder: 'Ask about Islamic history...',
      send: 'Send',
      loading: 'Thinking...',
      remaining: remaining > 0 ? `${remaining} questions left` : 'Limit reached',
      clear: 'Clear',
      newChat: 'New Chat',
      history: 'History',
      engineLoading: 'Loading search engine...',
      engineError: 'Search engine failed to load. Try again.',
      noHistory: 'No chat history yet',
      fallbackMode: '⚡ Offline mode — search results only',
    },
    ar: {
      title: 'مساعد DİA الذكي',
      placeholder: 'اسأل عن التاريخ الإسلامي...',
      send: 'إرسال',
      loading: 'يفكر...',
      remaining: remaining > 0 ? `${remaining} أسئلة متبقية` : 'تم الوصول إلى الحد',
      clear: 'مسح',
      newChat: 'محادثة جديدة',
      history: 'السجل',
      engineLoading: 'جاري تحميل محرك البحث...',
      engineError: 'فشل تحميل محرك البحث.',
      noHistory: 'لا يوجد سجل محادثات',
      fallbackMode: '⚡ وضع غير متصل — نتائج البحث فقط',
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
            <span className={`ai-remaining${remaining <= 0 ? ' ai-remaining-zero' : ''}`}>
              {t.remaining}
            </span>
            {/* New Chat button */}
            <button className="ai-new-btn" onClick={handleNewChat} title={t.newChat}>＋</button>
            {/* History toggle */}
            {chatHistory.length > 0 && (
              <button className="ai-history-btn" onClick={() => setShowHistory(s => !s)} title={t.history}>📋</button>
            )}
            {messages.length > 0 && (
              <button className="ai-clear-btn" onClick={clearChat} title={t.clear}>🗑</button>
            )}
            <button className="ai-close-btn" onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </div>
        </div>

        {/* Fallback mode notice (A6) */}
        {remaining <= 0 && (
          <div className="ai-fallback-banner">{t.fallbackMode}</div>
        )}

        {/* Chat History Dropdown (A5) */}
        {showHistory && (
          <div className="ai-history-panel">
            <div className="ai-history-title">{t.history}</div>
            {chatHistory.length === 0 ? (
              <div className="ai-history-empty">{t.noHistory}</div>
            ) : (
              <ul className="ai-history-list">
                {[...chatHistory].reverse().map(chat => {
                  const firstMsg = chat.messages.find(m => m.role === 'user');
                  const preview = firstMsg ? firstMsg.text.slice(0, 60) : '...';
                  return (
                    <li key={chat.id}>
                      <button className="ai-history-item" onClick={() => handleLoadChat(chat.id)}>
                        <span className="ai-history-date">{chat.date}</span>
                        <span className="ai-history-preview">{preview}{preview.length >= 60 ? '...' : ''}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

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
            disabled={loading}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          />
          <button
            className="ai-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            aria-label={t.send}
          >
            {loading ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </>
  );
}
