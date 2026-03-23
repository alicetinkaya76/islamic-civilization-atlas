#!/usr/bin/env node
/**
 * Build MiniSearch Index from DİA Chunks
 * =======================================
 * Reads dia_chunks.json and creates a pre-built MiniSearch index
 * for client-side full-text search.
 *
 * Usage:
 *   node scripts/build_search_index.js [--input public/data/dia_chunks.json] [--output public/data/dia_search_index.json]
 *
 * Prerequisites:
 *   npm install minisearch
 */

import { readFileSync, writeFileSync, statSync } from 'fs';
import { resolve } from 'path';
import MiniSearch from 'minisearch';

// ─── Config ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const inputPath = resolve(getArg('--input', 'public/data/dia_chunks.json'));
const outputPath = resolve(getArg('--output', 'public/data/dia_search_index.json'));

function getArg(flag, defaultVal) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
}

// ─── Main ───────────────────────────────────────────────────────────

console.log(`📂 Reading chunks from: ${inputPath}`);

const raw = readFileSync(inputPath, 'utf-8');
const chunks = JSON.parse(raw);

console.log(`📝 Loaded ${chunks.length} chunks`);

// Create MiniSearch instance
const miniSearch = new MiniSearch({
  fields: ['n', 't', 'a', 'sec'],  // name, text, arabic, section
  storeFields: ['n', 's', 'a', 'd', 'sec', 'c'],
  idField: '_id',
  searchOptions: {
    boost: { n: 5, a: 3, sec: 2 },  // Name and Arabic get higher weight
    fuzzy: 0.2,                       // Handles transliteration variants
    prefix: true,                     // Prefix search enabled
  },
  // Turkish-aware tokenization
  tokenize: (text) => {
    // Split on whitespace and common punctuation, keep Arabic/Turkish chars
    return text
      .toLowerCase()
      .split(/[\s\-_/\\()[\]{}<>,.;:!?'"]+/)
      .filter(t => t.length > 1);
  },
});

console.log('🔨 Building index...');
const start = Date.now();

miniSearch.addAll(chunks);

const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.log(`✅ Index built in ${elapsed}s`);

// Serialize
const indexJSON = JSON.stringify(miniSearch);
writeFileSync(outputPath, indexJSON);

const fileSize = statSync(outputPath).size;
const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(1);

console.log(`\n${'='.repeat(60)}`);
console.log(`✅ Output: ${outputPath}`);
console.log(`📊 Statistics:`);
console.log(`   Documents indexed: ${chunks.length}`);
console.log(`   Unique articles:   ${new Set(chunks.map(c => c.s)).size}`);
console.log(`   Index file size:   ${fileSizeMB} MB`);
console.log(`   Est. gzip size:    ~${(fileSizeMB * 0.3).toFixed(1)} MB`);
console.log(`${'='.repeat(60)}`);

// Quick search test
console.log('\n🔍 Test searches:');
const testQueries = ['İbn Sînâ', 'Gazzâlî kelâm', 'hadis', 'felsefe', 'Buhara'];
for (const query of testQueries) {
  const results = miniSearch.search(query, { limit: 3 });
  const hits = results.map(r => `${r.n}[${r.sec || 'ana'}]`).join(', ');
  console.log(`   "${query}" → ${results.length} hits: ${hits || '(none)'}`);
}
