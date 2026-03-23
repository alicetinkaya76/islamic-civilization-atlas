/**
 * AIChatMessage — Single chat message
 * v2 — Session 29: Fixed Arabic source links (A3)
 */

import { useState } from 'react';

const DIA_BASE = 'https://islamansiklopedisi.org.tr/';

function formatAnswer(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

/**
 * Build a valid DİA URL from source info.
 * Priority: slug (from LLM response) > transliterated name > lowercase name
 */
function getSourceInfo(src) {
  if (src && typeof src === 'object') {
    const name = src.name || 'Kaynak';
    const slug = src.slug || '';
    return { name, slug };
  }
  // Handle string format (fallback): "MAKALE ADI (DİA)"
  const name = String(src).replace(/\s*\(DİA\)\s*$/i, '');
  return { name, slug: '' };
}

/**
 * Transliterate Arabic name to a DİA-compatible slug.
 * DİA uses Turkish-friendly Latin slugs: الغزالي → gazzali
 * This is a best-effort mapping — slug from LLM response is always preferred.
 */
const AR_SLUG_MAP = {
  'ا':'a','أ':'a','إ':'a','آ':'a','ب':'b','ت':'t','ث':'s','ج':'c',
  'ح':'h','خ':'h','د':'d','ذ':'z','ر':'r','ز':'z','س':'s','ش':'s',
  'ص':'s','ض':'d','ط':'t','ظ':'z','ع':'','غ':'g','ف':'f','ق':'k',
  'ك':'k','ل':'l','م':'m','ن':'n','ه':'h','و':'v','ي':'y','ى':'a',
  'ة':'e','ئ':'i','ؤ':'u','ّ':'','َ':'','ُ':'','ِ':'','ً':'','ٌ':'','ٍ':'',
  'ْ':'','ـ':''
};

function arabicToSlug(text) {
  if (!/[\u0600-\u06FF]/.test(text)) return '';
  const latin = text
    .replace(/[\u0600-\u06FF]/g, ch => AR_SLUG_MAP[ch] || '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return latin.length >= 2 ? latin : '';
}

function buildDiaUrl(name, slug) {
  // 1. If slug is provided and looks valid, use it directly
  if (slug && slug.length >= 2 && /^[a-z0-9-]+$/i.test(slug)) {
    return `${DIA_BASE}${slug}`;
  }
  // 2. If name contains Arabic, try transliteration
  if (/[\u0600-\u06FF]/.test(name)) {
    const arSlug = arabicToSlug(name);
    if (arSlug) return `${DIA_BASE}${arSlug}`;
  }
  // 3. Fallback: Turkish-friendly lowercase slug from Latin name
  const fallbackSlug = name
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/ı/g, 'i')
    .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
    .replace(/[''ʿʾ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${DIA_BASE}${fallbackSlug}`;
}

export default function AIChatMessage({ msg, lang }) {
  const [showSources, setShowSources] = useState(true);
  const isUser = msg.role === 'user';

  return (
    <div className={`ai-msg ${isUser ? 'ai-msg-user' : 'ai-msg-assistant'}${msg.error ? ' ai-msg-error' : ''}`}>
      <div className="ai-msg-avatar">
        {isUser ? '👤' : '📖'}
      </div>
      <div className="ai-msg-content">
        {isUser ? (
          <p className="ai-msg-text">{msg.text}</p>
        ) : (
          <>
            <div
              className="ai-msg-text"
              dangerouslySetInnerHTML={{ __html: formatAnswer(msg.text) }}
            />
            {msg.sources?.length > 0 && (
              <div className="ai-msg-sources">
                <button
                  className="ai-sources-toggle"
                  onClick={() => setShowSources(s => !s)}
                >
                  📚 {msg.sources.length} {
                    { tr: 'kaynak', en: 'source', ar: 'مصدر' }[lang] || 'source'
                  }{msg.sources.length > 1 ? (lang === 'tr' ? '' : 's') : ''}
                  <span className={`ai-sources-arrow ${showSources ? 'open' : ''}`}>▸</span>
                </button>
                {showSources && (
                  <ul className="ai-sources-list">
                    {msg.sources.map((src, i) => {
                      const { name, slug } = getSourceInfo(src);
                      const href = buildDiaUrl(name, slug);
                      // Display name: prefer the name as-is (could be Arabic or Turkish)
                      const displayName = name;
                      return (
                        <li key={i}>
                          <a href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`DİA: ${displayName}`}
                          >
                            {displayName}
                          </a>
                          {slug && <span className="ai-source-slug" title={slug}>↗</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
