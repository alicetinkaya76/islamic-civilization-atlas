/**
 * AI Chat Configuration
 * =====================
 * Groq Free Tier — llama-3.3-70b-versatile
 *
 * API Key: stored in .env as VITE_GROQ_KEY
 *   → Create .env in project root:  VITE_GROQ_KEY=gsk_xxxxx
 *   → Vite exposes it via import.meta.env.VITE_GROQ_KEY
 *   → Never commit .env to git (already in .gitignore)
 *
 * To rotate: console.groq.com → API Keys → Regenerate
 */

// ─── API Key from Environment ──────────────────────────────────────
export const GROQ_KEY = import.meta.env.VITE_GROQ_KEY || '';

// ─── Model & Endpoint ──────────────────────────────────────────────
export const GROQ_MODEL = 'llama-3.3-70b-versatile';
export const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ─── Rate Limits ───────────────────────────────────────────────────
export const DAILY_LIMIT = 20;          // per-user (localStorage)
export const MAX_CONTEXT_TOKENS = 4000; // max tokens sent as context
export const MAX_RESPONSE_TOKENS = 1500; // ← was 1024, increased for detailed answers
export const TEMPERATURE = 0.3;

// ─── Feature Flags ─────────────────────────────────────────────────
export const AI_ENABLED = true;         // master switch
export const SHOW_SOURCES = true;       // show DİA source cards
export const ENABLE_MAP_ACTIONS = true; // allow flyTo, highlight, filter
