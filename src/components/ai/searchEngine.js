/**
 * Client-Side Search Engine
 * =========================
 * MiniSearch wrapper for DİA full-text search.
 * Index is built in-browser from chunks (no pre-built index needed).
 */

import MiniSearch from 'minisearch';

let _engine = null;
let _chunks = null;
let _loading = false;
let _loadPromise = null;

const MINISEARCH_OPTIONS = {
  fields: ['n', 't', 'a', 'sec'],
  storeFields: ['n', 's', 'a', 'd', 'sec', 'c'],
  idField: '_id',
  searchOptions: {
    boost: { n: 5, a: 3, sec: 2 },
    fuzzy: 0.2,
    prefix: true,
  },
  tokenize: (text) => {
    return text
      .toLowerCase()
      .split(/[\s\-_/\\()[\]{}<>,.;:!?'"]+/)
      .filter(t => t.length > 1);
  },
};

/**
 * Lazy-load chunks and build MiniSearch index in browser.
 * Returns MiniSearch instance.
 * Safe to call multiple times — loads only once.
 */
export async function loadSearchEngine() {
  if (_engine) return _engine;
  if (_loadPromise) return _loadPromise;

  _loading = true;
  _loadPromise = (async () => {
    try {
      const res = await fetch('/data/dia_chunks.json');
      if (!res.ok) throw new Error('Failed to load chunks data');

      const chunksData = await res.json();

      // Build index in browser
      const engine = new MiniSearch(MINISEARCH_OPTIONS);
      engine.addAll(chunksData);

      // Store chunks for context retrieval
      _chunks = new Map();
      for (const chunk of chunksData) {
        _chunks.set(chunk._id, chunk);
      }

      _engine = engine;
      _loading = false;
      console.log(`[AI] Search engine built: ${chunksData.length} chunks indexed`);
      return _engine;
    } catch (err) {
      _loading = false;
      _loadPromise = null;
      console.error('[AI] Failed to load search engine:', err);
      throw err;
    }
  })();

  return _loadPromise;
}

/**
 * Search chunks and return top N results with full text.
 */
export function search(engine, query, limit = 5) {
  if (!engine || !query.trim()) return [];

  const results = engine.search(query, {
    limit: limit * 2,
    boost: { n: 5, a: 3, sec: 2 },
    fuzzy: 0.2,
    prefix: true,
  });

  const seen = new Map();
  const output = [];

  for (const r of results) {
    const chunk = _chunks?.get(r.id) || r;
    const slug = chunk.s || r.s;
    const key = `${slug}:${chunk.sec || ''}`;
    if (!seen.has(key)) {
      seen.set(key, true);
      output.push({ ...chunk, score: r.score });
      if (output.length >= limit) break;
    }
  }

  return output;
}

/**
 * Get all chunks for a specific article slug.
 */
export function getArticleChunks(slug) {
  if (!_chunks) return [];
  const result = [];
  for (const [, chunk] of _chunks) {
    if (chunk.s === slug) result.push(chunk);
  }
  return result.sort((a, b) => {
    if (a.sec !== b.sec) return (a.sec || '').localeCompare(b.sec || '');
    return (a.c || 0) - (b.c || 0);
  });
}

export function isLoaded() { return _engine !== null; }
export function isLoading() { return _loading; }
