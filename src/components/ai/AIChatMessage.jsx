/**
 * AIChatMessage — Single chat message
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

function getSourceInfo(src) {
  // Handle object format: {name, slug}
  if (src && typeof src === 'object') {
    return { name: src.name || 'Kaynak', slug: src.slug || '' };
  }
  // Handle string format (fallback): "MAKALE ADI (DİA)"
  const name = String(src).replace(/\s*\(DİA\)\s*$/i, '');
  return { name, slug: '' };
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
                      const href = slug
                        ? `${DIA_BASE}${slug}`
                        : `${DIA_BASE}${name.toLowerCase().replace(/\s+/g, '-')}`;
                      return (
                        <li key={i}>
                          
                          <a href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`DİA: ${name}`}
                          >
                            {name}
                          </a>
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
