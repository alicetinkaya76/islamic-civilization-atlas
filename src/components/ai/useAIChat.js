/**
 * useAIChat — Custom Hook
 * =======================
 * Manages chat state, MiniSearch queries, and Groq API calls.
 * v2 — Session 29:
 *   A5: Chat history persistence (localStorage)
 *   A6: Fallback mode (MiniSearch-only when Groq quota exhausted)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { askGroq } from './groqClient';
import { loadSearchEngine, search, isLoaded, transliterateArabic } from './searchEngine';
import {
  buildPrompt, isIrrelevant, buildIrrelevantResponse,
  buildFallbackResponse, detectLang
} from './promptBuilder';
import { DAILY_LIMIT, AI_ENABLED, ENABLE_MAP_ACTIONS } from '../../config/ai';

const QUOTA_KEY = 'ia-ai-quota';
const HISTORY_KEY = 'ia-ai-history';
const HISTORY_MAX_CHATS = 5;
const HISTORY_MAX_BYTES = 500 * 1024; // 500 KB

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function loadQuota() {
  try {
    const stored = JSON.parse(localStorage.getItem(QUOTA_KEY) || '{}');
    if (stored.date === getToday()) return stored.remaining;
  } catch { /* ignore */ }
  return DAILY_LIMIT;
}

function saveQuota(remaining) {
  try {
    localStorage.setItem(QUOTA_KEY, JSON.stringify({
      date: getToday(),
      remaining,
    }));
  } catch { /* ignore */ }
}

// ─── Chat History Persistence (A5) ─────────────────────────────────

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data;
  } catch { return []; }
}

function saveHistory(chats) {
  try {
    // Keep only last N chats
    const trimmed = chats.slice(-HISTORY_MAX_CHATS);
    const json = JSON.stringify(trimmed);
    // Enforce size limit
    if (json.length > HISTORY_MAX_BYTES) {
      // Drop oldest chats until under limit
      let arr = [...trimmed];
      while (arr.length > 1 && JSON.stringify(arr).length > HISTORY_MAX_BYTES) {
        arr.shift();
      }
      localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
    } else {
      localStorage.setItem(HISTORY_KEY, json);
    }
  } catch { /* ignore — quota exceeded etc. */ }
}

function createChatSession(messages) {
  return {
    id: Date.now().toString(36),
    date: getToday(),
    messages: messages.map(m => ({
      role: m.role,
      text: m.text,
      sources: m.sources || [],
      time: m.time,
    })),
  };
}

export function useAIChat({ lang, onFlyTo, onHighlight, onFilter }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [engineReady, setEngineReady] = useState(isLoaded());
  const [engineError, setEngineError] = useState(false);
  const [remaining, setRemaining] = useState(loadQuota);
  const [chatHistory, setChatHistory] = useState(loadHistory);
  const [activeChatId, setActiveChatId] = useState(null);
  const engineRef = useRef(null);

  // Save quota changes
  useEffect(() => {
    saveQuota(remaining);
  }, [remaining]);

  // Save history when messages change (debounced on unmount or new chat)
  const saveCurrentChat = useCallback(() => {
    if (messages.length === 0) return;
    setChatHistory(prev => {
      const updated = activeChatId
        ? prev.map(c => c.id === activeChatId ? { ...c, messages: messages.map(m => ({ role: m.role, text: m.text, sources: m.sources || [], time: m.time })) } : c)
        : [...prev, createChatSession(messages)];
      saveHistory(updated);
      return updated;
    });
  }, [messages, activeChatId]);

  // Auto-save on message changes
  useEffect(() => {
    if (messages.length > 0) {
      saveCurrentChat();
    }
  }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load last chat on mount
  useEffect(() => {
    const history = loadHistory();
    if (history.length > 0) {
      const last = history[history.length - 1];
      setMessages(last.messages);
      setActiveChatId(last.id);
      setChatHistory(history);
    }
  }, []);

  // ─── Initialize Search Engine (lazy) ──────────────────────────
  const initEngine = useCallback(async () => {
    if (engineRef.current || !AI_ENABLED) return;
    try {
      setEngineError(false);
      engineRef.current = await loadSearchEngine();
      setEngineReady(true);
    } catch (err) {
      console.error('[AI] Engine init failed:', err);
      setEngineError(true);
    }
  }, []);

  // ─── Send Message ─────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      text: trimmed,
      time: Date.now(),
    }]);

    // Client-side irrelevance filter (no API call, no quota)
    if (isIrrelevant(trimmed)) {
      const response = buildIrrelevantResponse(lang);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: response.answer,
        sources: [],
        relevant: false,
        time: Date.now(),
      }]);
      return;
    }

    setLoading(true);

    try {
      // 1. Search chunks
      let results = [];
      if (engineRef.current) {
        const searchQuery = /[\u0600-\u06FF]/.test(trimmed)
          ? transliterateArabic(trimmed) + ' ' + trimmed
          : trimmed;
        console.log('[AI] Search query:', searchQuery);
        results = search(engineRef.current, searchQuery, 8);
      }

      // 2. Check quota — if exhausted, use fallback mode (A6)
      if (remaining <= 0) {
        const fallback = buildFallbackResponse(results, lang);
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: fallback.answer,
          sources: fallback.sources,
          relevant: fallback.relevant,
          fallback: true,
          time: Date.now(),
        }]);
        setLoading(false);
        return;
      }

      // 3. Build prompt with context
      const queryLang = detectLang(trimmed);
      const prompt = buildPrompt(trimmed, results, queryLang);

      // 4. Call Groq API
      const parsed = await askGroq(prompt);

      // 5. Execute map actions
      if (ENABLE_MAP_ACTIONS && parsed.relevant && parsed.actions?.length) {
        for (const action of parsed.actions) {
          try {
            if (action.type === 'flyTo' && onFlyTo) {
              onFlyTo({ lat: action.lat, lon: action.lon, zoom: action.zoom });
            }
            if (action.type === 'highlight' && onHighlight) {
              onHighlight(action.scholarIds);
            }
            if (action.type === 'filterByYear' && onFilter) {
              onFilter(action);
            }
          } catch (e) {
            console.warn('[AI] Action failed:', e);
          }
        }
      }

      // 6. Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: parsed.answer || '',
        sources: parsed.sources || [],
        relevant: parsed.relevant !== false,
        actions: parsed.actions || [],
        time: Date.now(),
      }]);

      setRemaining(r => Math.max(0, r - 1));

    } catch (err) {
      console.error('[AI] Error:', err);

      // If rate limited, try fallback mode
      if (err.message === 'RATE_LIMIT') {
        let results = [];
        if (engineRef.current) {
          const searchQuery = /[\u0600-\u06FF]/.test(trimmed)
            ? transliterateArabic(trimmed) + ' ' + trimmed
            : trimmed;
          results = search(engineRef.current, searchQuery, 8);
        }
        if (results.length > 0) {
          const fallback = buildFallbackResponse(results, lang);
          setMessages(prev => [...prev, {
            role: 'assistant',
            text: fallback.answer,
            sources: fallback.sources,
            relevant: true,
            fallback: true,
            time: Date.now(),
          }]);
          setLoading(false);
          return;
        }
      }

      const errorMessages = {
        RATE_LIMIT: {
          tr: '⚠️ API limit aşıldı. Biraz bekleyip tekrar deneyin.',
          en: '⚠️ API rate limit hit. Wait a moment and retry.',
          ar: '⚠️ تم تجاوز حد API. انتظر لحظة وأعد المحاولة.',
        },
        AUTH_ERROR: {
          tr: '🔑 API anahtarı geçersiz. Lütfen yöneticiyle iletişime geçin.',
          en: '🔑 Invalid API key. Please contact the administrator.',
          ar: '🔑 مفتاح API غير صالح.',
        },
        default: {
          tr: '❌ Bir hata oluştu. Tekrar deneyin.',
          en: '❌ An error occurred. Please try again.',
          ar: '❌ حدث خطأ. حاول مرة أخرى.',
        },
      };

      const msgKey = errorMessages[err.message] ? err.message : 'default';
      const errorText = (errorMessages[msgKey])[lang] || errorMessages[msgKey].tr;

      setMessages(prev => [...prev, {
        role: 'assistant',
        text: errorText,
        error: true,
        time: Date.now(),
      }]);
    }

    setLoading(false);
  }, [lang, loading, remaining, onFlyTo, onHighlight, onFilter]);

  // ─── New Chat (A5) ───────────────────────────────────────────
  const newChat = useCallback(() => {
    // Save current before starting new
    if (messages.length > 0) {
      saveCurrentChat();
    }
    setMessages([]);
    setActiveChatId(null);
  }, [messages, saveCurrentChat]);

  // ─── Clear Chat (legacy) ──────────────────────────────────────
  const clearChat = useCallback(() => {
    setMessages([]);
    setActiveChatId(null);
  }, []);

  // ─── Load a specific chat from history ────────────────────────
  const loadChat = useCallback((chatId) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
      setActiveChatId(chat.id);
    }
  }, [chatHistory]);

  return {
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
  };
}
