/**
 * Groq API Client — Direct Client-Side Fetch
 * ============================================
 * No backend proxy. Free tier = 1,000 req/day.
 * Returns parsed JSON from structured LLM response.
 * v2 — Session 29: env key check, improved error handling
 */

import { GROQ_KEY, GROQ_MODEL, GROQ_URL, MAX_RESPONSE_TOKENS, TEMPERATURE } from '../../config/ai';

export async function askGroq(messages) {
  // Check API key availability
  if (!GROQ_KEY) {
    console.warn('[AI] GROQ_KEY not set. AI features are disabled in this deployment.');
    throw new Error('AI_UNAVAILABLE');
  }

  console.log("[AI] PROMPT →", JSON.stringify(messages, null, 2));

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: TEMPERATURE,
      max_tokens: MAX_RESPONSE_TOKENS,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error('RATE_LIMIT');
    if (res.status === 401) throw new Error('AUTH_ERROR');
    throw new Error(`GROQ_ERROR_${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error('EMPTY_RESPONSE');

  try {
    const parsed = JSON.parse(content);
    console.log("[AI] RESPONSE ←", parsed);
    return parsed;
  } catch {
    // If LLM didn't return valid JSON, wrap it
    return {
      answer: content,
      sources: [],
      relevant: true,
      actions: [],
    };
  }
}
