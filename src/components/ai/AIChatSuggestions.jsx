/**
 * AIChatSuggestions — Example question chips
 */

const SUGGESTIONS = {
  tr: [
    { icon: '🏛', text: "Bağdat'ta yetişen hadis âlimleri" },
    { icon: '🗺', text: "İbn Haldun'un seyahat rotası" },
    { icon: '⚖', text: "Gazzâlî ve İbn Rüşd tartışması" },
    { icon: '⚔', text: "Moğol istilası sonrası ilim merkezi kayması" },
    { icon: '📚', text: "En çok eser yazan 10 âlim" },
    { icon: '🏥', text: "13. yüzyıl Şam'ında tıp geleneği" },
  ],
  en: [
    { icon: '🏛', text: "Scholars who studied in both Baghdad and Cairo" },
    { icon: '⚖', text: "Compare Ibn Sina and al-Farabi" },
    { icon: '⚔', text: "Impact of the Crusades on Islamic scholarship" },
    { icon: '📊', text: "Top 10 most connected scholars in the network" },
    { icon: '🗺', text: "Migration patterns of Hadith scholars" },
    { icon: '📚', text: "Major works of al-Ghazali" },
  ],
  ar: [
    { icon: '🏛', text: "العلماء الذين درسوا في بغداد والقاهرة" },
    { icon: '⚖', text: "قارن بين ابن سينا والفارابي" },
    { icon: '📚', text: "أهم مؤلفات الغزالي" },
    { icon: '🗺', text: "طرق هجرة علماء الحديث" },
    { icon: '⚔', text: "تأثير الغزو المغولي على مراكز العلم" },
  ],
};

export default function AIChatSuggestions({ lang, onSelect }) {
  const items = SUGGESTIONS[lang] || SUGGESTIONS.tr;

  return (
    <div className="ai-suggestions">
      <p className="ai-suggestions-label">
        {{ tr: 'Örnek sorular:', en: 'Try asking:', ar: 'جرّب أن تسأل:' }[lang] || 'Try asking:'}
      </p>
      <div className="ai-suggestions-grid">
        {items.map((item, i) => (
          <button
            key={i}
            className="ai-suggestion-chip"
            onClick={() => onSelect(item.text)}
          >
            <span className="ai-chip-icon">{item.icon}</span>
            <span className="ai-chip-text">{item.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
