/**
 * useAIChat — Custom Hook
 * =======================
 * Manages chat state, MiniSearch queries, and Groq API calls.
 * Handles rate limiting, error states, and map actions.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { askGroq } from './groqClient';
import { loadSearchEngine, search, isLoaded } from './searchEngine';
import { buildPrompt, isIrrelevant, buildIrrelevantResponse } from './promptBuilder';
import { DAILY_LIMIT, AI_ENABLED, ENABLE_MAP_ACTIONS } from '../../config/ai';

const QUOTA_KEY = 'ia-ai-quota';

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

export function useAIChat({ lang, onFlyTo, onHighlight, onFilter }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [engineReady, setEngineReady] = useState(isLoaded());
  const [engineError, setEngineError] = useState(false);
  const [remaining, setRemaining] = useState(loadQuota);
  const engineRef = useRef(null);

  // Save quota changes
  useEffect(() => {
    saveQuota(remaining);
  }, [remaining]);

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

    // Check quota
    if (remaining <= 0) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: {
          tr: '⏳ Günlük soru limitiniz doldu. Yarın tekrar deneyin.',
          en: '⏳ Daily question limit reached. Try again tomorrow.',
          ar: '⏳ تم الوصول إلى الحد اليومي. حاول غداً.',
        }[lang] || '⏳ Daily limit reached.',
        error: true,
        time: Date.now(),
      }]);
      return;
    }

    // Client-side irrelevance filter (no API call)
    if (isIrrelevant(trimmed)) {
      const response = buildIrrelevantResponse(lang);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: response.answer,
        sources: [],
        relevant: false,
        time: Date.now(),
      }]);
      return; // Don't count against quota
    }

    setLoading(true);

    try {
      // 1. Search chunks
      let results = [];
      if (engineRef.current) {
        results = search(engineRef.current, trimmed, 8);
      }

      // 2. Build prompt with context
      const prompt = buildPrompt(trimmed, results, lang);

      // 3. Call Groq API
      const parsed = await askGroq(prompt);

      // 4. Execute map actions
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

      // 5. Add assistant response
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

  // ─── Clear Chat ───────────────────────────────────────────────
  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    loading,
    remaining,
    engineReady,
    engineError,
    sendMessage,
    clearChat,
    initEngine,
  };
}
