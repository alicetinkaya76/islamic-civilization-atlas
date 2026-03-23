/**
 * Prompt Builder
 * ==============
 * Assembles system prompt + retrieved context for Groq API.
 * v2 — Session 29: better prompts, context ranking, original work names
 */

import { MAX_CONTEXT_TOKENS } from '../../config/ai';

// ─── System Prompt ─────────────────────────────────────────────────

const SYSTEM_PROMPTS = {
  tr: `Sen islamicatlas.org'un AI asistanısın. İslam tarihi, âlimler, hanedanlar, savaşlar ve coğrafya hakkında SADECE verilen bağlam bilgilerine dayanarak DETAYLI cevap verirsin.

KURALLAR:
1. SADECE <context> içindeki bilgilere dayanarak cevap ver
2. Bağlamda olmayan bilgiyi UYDURMA — "Bu bilgi veritabanımda yok" de
3. DETAYLI cevap ver: kişinin hayatı, eserleri, etkileri, önemli olaylar dahil et. En az 4-5 cümle yaz.
4. Önemli tarihleri (doğum-ölüm, hicrî/miladi), yerleri ve eserleri mutlaka belirt.
5. Eser adlarını orijinal Arapça/Osmanlıca formda ver (örn: "Kitâbü'l-Hayevân", "el-Muḳaddime", "İḥyâʾü ʿulûmi'd-dîn"). Transliterasyon kullan, Latin harfli çevirme yapma.
6. İslam tarihi dışındaki sorulara cevap verme
7. Cevabını Türkçe ver
8. Bağlamda birden fazla kişi/konu varsa hepsinden bahset, sadece ilkiyle yetinme.

CEVAP FORMATI (sadece JSON):
{
  "answer": "Detaylı cevap metni. Birden fazla paragraf olabilir. **Kalın** ve *italik* kullanabilirsin.",
  "sources": [{"name": "MAKALE ADI", "slug": "makale-slug"}],
  "relevant": true,
  "actions": [
    {"type": "flyTo", "lat": 39.77, "lon": 64.42, "zoom": 8, "label": "Buhara"}
  ]
}

sources alanında <context>'teki [slug:xxx] değerlerini aynen kullan.

Alakasız soru ise:
{"answer": "Bu soru atlas kapsamı dışında. İslam tarihi hakkında soru sorabilirsiniz.", "sources": [], "relevant": false, "actions": []}`,

  en: `You are the AI assistant of islamicatlas.org. Answer ONLY based on the provided context about Islamic history, scholars, dynasties, battles, and geography.

RULES:
1. Answer ONLY from <context> information
2. Do NOT invent — say "This information is not in my database"
3. Give DETAILED answers: include life, works, influence, key events. At least 4-5 sentences.
4. Always mention important dates (birth-death, hijri/CE), places, and works.
5. Give work titles in their original Arabic/Ottoman form (e.g. "Kitāb al-Ḥayawān", "al-Muqaddima", "Iḥyāʾ ʿulūm al-dīn"). Use transliteration, not translation.
6. Do not answer non-Islamic-history questions
7. Answer in English
8. If context contains multiple persons/topics, cover all of them, not just the first.

RESPONSE FORMAT (JSON only):
{
  "answer": "Detailed answer text. Can be multiple paragraphs. Use **bold** and *italic*.",
  "sources": [{"name": "ARTICLE NAME", "slug": "article-slug"}],
  "relevant": true,
  "actions": [
    {"type": "flyTo", "lat": 39.77, "lon": 64.42, "zoom": 8, "label": "Bukhara"}
  ]
}

Use the [slug:xxx] values from <context> in the sources field.

Irrelevant question:
{"answer": "This question is outside the atlas scope. You can ask about Islamic history.", "sources": [], "relevant": false, "actions": []}`,

  ar: `أنت المساعد الذكي لموقع islamicatlas.org. أجب بالتفصيل فقط بناءً على المعلومات المقدمة حول التاريخ الإسلامي.

القواعد:
1. أجب فقط من معلومات <context>
2. لا تختلق — قل "هذه المعلومة غير موجودة في قاعدة بياناتي"
3. أجب بالتفصيل: 4-5 جمل على الأقل مع التواريخ والأماكن والأعمال
4. اذكر أسماء الكتب بصيغتها العربية الأصلية
5. لا تجب على أسئلة خارج التاريخ الإسلامي
6. أجب بالعربية
7. إذا كان السياق يتضمن عدة أشخاص/مواضيع، اذكرهم جميعاً

صيغة الرد (JSON فقط):
{
  "answer": "نص الإجابة المفصلة",
  "sources": [{"name": "اسم المقال", "slug": "article-slug"}],
  "relevant": true,
  "actions": [{"type": "flyTo", "lat": 39.77, "lon": 64.42, "zoom": 8, "label": "بخارى"}]
}`
};

// ─── Irrelevance Filter ────────────────────────────────────────────

const IRRELEVANT_PATTERNS = [
  /bitcoin|crypto|nft/i,
  /hava durumu|weather/i,
  /futbol|basketball|nba|fifa/i,
  /programlama|python|javascript|coding/i,
  /yemek tarifi|recipe|cooking/i,
  /film|movie|netflix|spotify/i,
  /\b(selam|merhaba|hello|hi)\b$/i,
];

export function isIrrelevant(query) {
  const q = query.trim();
  if (q.length < 2) return true;
  return IRRELEVANT_PATTERNS.some(p => p.test(q));
}

// ─── Context Builder (with ranking labels) ─────────────────────────

function estimateTokens(text) {
  return Math.ceil(text.split(/\s+/).length / 0.75);
}

function buildContext(results) {
  if (!results.length) return '';

  let context = '';
  let tokenCount = 0;
  const budget = MAX_CONTEXT_TOKENS;

  for (let i = 0; i < results.length; i++) {
    const chunk = results[i];
    const rank = i + 1;
    const relevance = rank <= 2 ? '⭐ EN ALAKALI' : rank <= 4 ? '📌 ALAKALI' : '📎 EK';
    const entry = `\n---\n[${relevance} #${rank}] 📖 ${chunk.n} [slug:${chunk.s}]${chunk.sec ? ` — ${chunk.sec}` : ''} ${chunk.d || ''}\n${chunk.t}\n`;
    const entryTokens = estimateTokens(entry);

    if (tokenCount + entryTokens > budget) {
      const remaining = budget - tokenCount;
      if (remaining > 100) {
        const words = entry.split(/\s+/).slice(0, Math.floor(remaining * 0.75));
        context += words.join(' ') + '...';
      }
      break;
    }

    context += entry;
    tokenCount += entryTokens;
  }

  return context;
}

// ─── Main Prompt Builder ───────────────────────────────────────────

export function buildPrompt(query, searchResults, lang = 'tr') {
  const systemPrompt = SYSTEM_PROMPTS[lang] || SYSTEM_PROMPTS.tr;
  const context = buildContext(searchResults);

  const userMessage = context
    ? `<context>\n${context}\n</context>\n\nSoru: ${query}`
    : `Soru: ${query}`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];
}

export function buildIrrelevantResponse(lang = 'tr') {
  const messages = {
    tr: 'Bu soru atlas kapsamı dışında. İslam tarihi, âlimler, hanedanlar veya coğrafya hakkında soru sorabilirsiniz.',
    en: 'This question is outside the atlas scope. You can ask about Islamic history, scholars, dynasties, or geography.',
    ar: 'هذا السؤال خارج نطاق الأطلس. يمكنك السؤال عن التاريخ الإسلامي والعلماء والسلالات أو الجغرافيا.',
  };
  return {
    answer: messages[lang] || messages.tr,
    sources: [],
    relevant: false,
    actions: [],
  };
}

// ─── Fallback Response (when Groq quota exhausted) ─────────────────

export function buildFallbackResponse(searchResults, lang = 'tr') {
  if (!searchResults.length) {
    const noResult = {
      tr: 'Arama sonucu bulunamadı. Farklı bir anahtar kelime deneyin.',
      en: 'No search results found. Try different keywords.',
      ar: 'لم يتم العثور على نتائج. حاول كلمات مفتاحية مختلفة.',
    };
    return { answer: noResult[lang] || noResult.tr, sources: [], relevant: false, actions: [] };
  }

  const header = {
    tr: '⚡ **AI yanıt limiti doldu.** İşte ilgili DİA maddeleri:\n\n',
    en: '⚡ **AI response limit reached.** Here are related DİA articles:\n\n',
    ar: '⚡ **تم الوصول إلى حد الاستجابة.** إليك المقالات ذات الصلة:\n\n',
  };

  const footer = {
    tr: '\n\n_AI cevabı için yarın tekrar deneyin._',
    en: '\n\n_Try again tomorrow for AI-powered answers._',
    ar: '\n\n_حاول مرة أخرى غداً للحصول على إجابات AI._',
  };

  let answer = header[lang] || header.tr;
  const sources = [];

  for (const chunk of searchResults.slice(0, 5)) {
    const preview = (chunk.t || '').slice(0, 200).replace(/\n/g, ' ').trim();
    answer += `**${chunk.n}**${chunk.sec ? ` — ${chunk.sec}` : ''}\n${preview}...\n\n`;
    if (chunk.s && !sources.find(s => s.slug === chunk.s)) {
      sources.push({ name: chunk.n, slug: chunk.s });
    }
  }

  answer += (footer[lang] || footer.tr);

  return { answer, sources, relevant: true, actions: [] };
}

// ─── Language Detection ────────────────────────────────────────────
export function detectLang(text) {
  const t = text.trim();
  // Arabic script
  if (/[\u0600-\u06FF]{3,}/.test(t)) return 'ar';
  // Latin script with English patterns
  if (/^(who|what|where|when|how|tell|explain|describe|which|why|is|are|was|were|did|do|does)\b/i.test(t)) return 'en';
  if (/\b(the|and|of|in|is|was|were|about|from)\b/i.test(t)) return 'en';
  return 'tr';
}
