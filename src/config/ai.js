/**
 * AI Chat Configuration
 * =====================
 * Groq Free Tier — llama-3.3-70b-versatile
 * Key is obfuscated (split into parts) — not true security,
 * but acceptable for a free-tier key with 1,000 req/day limit.
 *
 * To rotate: console.groq.com → API Keys → Regenerate
 */

// ─── Obfuscated API Key ────────────────────────────────────────────
// Replace these parts with your actual Groq API key split into 4 parts
// Example: gsk_abcdefghij1234567890ABCDEFGHIJ1234567890abcdefghij12
//   → ['gsk_', 'abcdefghij12', '34567890ABCDEF', 'GHIJ1234567890abcdefghij12']
const _p = [
  'gsk_NUozZ7j9G4',    // part 1: starts with gsk_
  'OC4Mh4sBvPWG',     // part 2
  'dyb3FYuxSJRrVb',      // part 3
  'nrtm22hQQpQyqigt'         // part 4
];
export const GROQ_KEY = _p.join('');

// ─── Model & Endpoint ──────────────────────────────────────────────
export const GROQ_MODEL = 'llama-3.3-70b-versatile';
export const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ─── Rate Limits ───────────────────────────────────────────────────
export const DAILY_LIMIT = 20;          // per-user (localStorage)
export const MAX_CONTEXT_TOKENS = 4000; // max tokens sent as context
export const MAX_RESPONSE_TOKENS = 1024;
export const TEMPERATURE = 0.3;

// ─── Feature Flags ─────────────────────────────────────────────────
export const AI_ENABLED = true;         // master switch
export const SHOW_SOURCES = true;       // show DİA source cards
export const ENABLE_MAP_ACTIONS = true; // allow flyTo, highlight, filter
