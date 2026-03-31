/**
 * RenaissanceStory.jsx — islamicatlas.org Science Layer (v7.4.0.0 / O8)
 *
 * B6: "Rönesans Nasıl Tetiklendi?" — scroll-driven narrative
 *     6 contribution cards with visual icons
 *     Links to related routes
 */

import { useState } from 'react';

/* ── Story chapters ── */
const CHAPTERS = [
  {
    id: 'paper',
    icon: '📜',
    routeId: 'route_011',
    title: {
      en: 'Paper: The Foundation',
      tr: 'Kağıt: Temel',
      ar: 'الورق: الأساس',
    },
    body: {
      en: 'The Battle of Talas (751) brought Chinese papermaking to the Islamic world. Within decades, Baghdad had its own paper mills. By the 12th century, paper had reached Europe via Islamic Spain — making books affordable and knowledge portable. Without paper, no Renaissance.',
      tr: 'Talas Savaşı (751) Çin kağıtçılığını İslam dünyasına taşıdı. On yıllar içinde Bağdat kendi kağıt imalathanelerine kavuştu. 12. yüzyılda kağıt, Endülüs üzerinden Avrupa\'ya ulaştı — kitapları ucuzlattı, bilgiyi taşınabilir kıldı. Kağıt olmadan Rönesans olmazdı.',
      ar: 'نقلت معركة طلاس (751) صناعة الورق الصينية إلى العالم الإسلامي. وفي غضون عقود، أنشأت بغداد مصانعها الخاصة. وبحلول القرن الثاني عشر، وصل الورق إلى أوروبا عبر الأندلس — فأصبحت الكتب في متناول الجميع والمعرفة قابلة للنقل.',
    },
    year: '751–1200',
  },
  {
    id: 'translation',
    icon: '📖',
    routeId: 'route_012',
    title: {
      en: 'Translation: The Bridge',
      tr: 'Çeviri: Köprü',
      ar: 'الترجمة: الجسر',
    },
    body: {
      en: 'The Toledo School of Translators (12th c.) turned Arabic scientific texts into Latin. Works by al-Khwarizmi, Ibn Sina, and Ibn Rushd became the foundation of European university curricula. Gerard of Cremona alone translated 87 major works.',
      tr: 'Toledo Çeviri Okulu (12. yy) Arapça bilimsel metinleri Latince\'ye çevirdi. Hârizmî, İbn Sînâ ve İbn Rüşd\'ün eserleri Avrupa üniversite müfredatının temeli oldu. Cremonalı Gerard tek başına 87 büyük eseri tercüme etti.',
      ar: 'حوّلت مدرسة طليطلة للترجمة (القرن 12) النصوص العلمية العربية إلى اللاتينية. وأصبحت أعمال الخوارزمي وابن سينا وابن رشد أساساً لمناهج الجامعات الأوروبية. ترجم جيرار الكريموني وحده 87 عملاً كبيراً.',
    },
    year: '1100–1300',
  },
  {
    id: 'agriculture',
    icon: '🌾',
    routeId: 'route_018',
    title: {
      en: 'Agriculture: The Green Revolution',
      tr: 'Tarım: Yeşil Devrim',
      ar: 'الزراعة: الثورة الخضراء',
    },
    body: {
      en: 'Islamic agriculture introduced sophisticated irrigation, new crops (citrus, rice, sugar cane, cotton), and rotation systems to Europe via Andalusia and Sicily. This "Arab Agricultural Revolution" fed growing European cities and freed labor for intellectual pursuits.',
      tr: 'İslam tarımı, Endülüs ve Sicilya üzerinden Avrupa\'ya gelişmiş sulama, yeni ürünler (narenciye, pirinç, şeker kamışı, pamuk) ve ekim nöbeti sistemleri tanıttı. Bu "Arap Tarım Devrimi" büyüyen Avrupa şehirlerini besledi ve entelektüel uğraşlar için iş gücü serbest bıraktı.',
      ar: 'قدمت الزراعة الإسلامية أنظمة ري متطورة ومحاصيل جديدة (حمضيات، أرز، قصب سكر، قطن) وأنظمة تناوب إلى أوروبا عبر الأندلس وصقلية. غذّت هذه "الثورة الزراعية العربية" المدن الأوروبية المتنامية وحرّرت العمالة للمساعي الفكرية.',
    },
    year: '800–1300',
  },
  {
    id: 'medicine',
    icon: '⚕️',
    routeId: 'route_016',
    title: {
      en: 'Medicine: From Canon to Curriculum',
      tr: 'Tıp: Kānûn\'dan Müfredata',
      ar: 'الطب: من القانون إلى المنهج',
    },
    body: {
      en: 'Ibn Sina\'s Canon of Medicine became the primary medical textbook in European universities for 500 years. Al-Zahrawi\'s surgical instruments, Ibn al-Nafis\'s discovery of pulmonary circulation, and the bimaristan (hospital) model all transformed European medicine.',
      tr: 'İbn Sînâ\'nın el-Kānûn\'u 500 yıl boyunca Avrupa üniversitelerinde temel tıp ders kitabı oldu. Zehrâvî\'nin cerrahi aletleri, İbnü\'n-Nefîs\'in küçük kan dolaşımı keşfi ve bîmâristan (hastane) modeli Avrupa tıbbını dönüştürdü.',
      ar: 'أصبح قانون ابن سينا الكتاب الطبي الرئيسي في الجامعات الأوروبية لخمسة قرون. وحوّلت آلات الزهراوي الجراحية واكتشاف ابن النفيس للدورة الدموية الرئوية ونموذج البيمارستان الطب الأوروبي.',
    },
    year: '980–1500',
  },
  {
    id: 'astronomy',
    icon: '🔭',
    routeId: 'route_014',
    title: {
      en: 'Astronomy: Maragha to Copernicus',
      tr: 'Astronomi: Merâga\'dan Kopernik\'e',
      ar: 'الفلك: من مراغة إلى كوبرنيكوس',
    },
    body: {
      en: 'The Maragha Observatory\'s mathematical models — the Tusi Couple and Ibn al-Shatir\'s planetary theory — appear almost identically in Copernicus\'s De Revolutionibus. The transmission route through Byzantine and Italian intermediaries remains a subject of active research.',
      tr: 'Merâga Rasathanesinin matematiksel modelleri — Tûsî Çifti ve İbnü\'ş-Şâtir\'in gezegen teorisi — Kopernik\'in De Revolutionibus\'unda neredeyse aynı biçimde karşımıza çıkar. Bizans ve İtalyan aracılar üzerinden aktarım yolu hâlâ aktif bir araştırma konusudur.',
      ar: 'تظهر النماذج الرياضية لمرصد مراغة — زوج الطوسي ونظرية ابن الشاطر الكوكبية — بشكل شبه مطابق في كتاب كوبرنيكوس. ولا يزال طريق الانتقال عبر الوسطاء البيزنطيين والإيطاليين موضع بحث نشط.',
    },
    year: '1259–1543',
  },
  {
    id: 'method',
    icon: '🔬',
    routeId: 'route_017',
    title: {
      en: 'The Experimental Method',
      tr: 'Deneysel Yöntem',
      ar: 'المنهج التجريبي',
    },
    body: {
      en: 'Ibn al-Haytham\'s Kitab al-Manazir established the experimental method: hypothesis, controlled experiment, peer review. Roger Bacon, the "father of the scientific method" in Europe, explicitly built on Ibn al-Haytham\'s work. This methodological revolution made modern science possible.',
      tr: 'İbnü\'l-Heysem\'in Kitâbü\'l-Menâzır\'ı deneysel yöntemi kurdu: hipotez, kontrollü deney, hakemli inceleme. Avrupa\'da "bilimsel yöntemin babası" kabul edilen Roger Bacon, açıkça İbnü\'l-Heysem\'in çalışmalarını temel aldı. Bu metodolojik devrim, modern bilimi mümkün kıldı.',
      ar: 'أسّس كتاب المناظر لابن الهيثم المنهج التجريبي: فرضية، تجربة مضبوطة، مراجعة أقران. وبنى روجر بيكون، "أبو المنهج العلمي" في أوروبا، عمله صراحةً على أعمال ابن الهيثم. جعلت هذه الثورة المنهجية العلم الحديث ممكناً.',
    },
    year: '1011–1267',
  },
];

/* ── i18n ── */
const STORY_T = {
  tr: {
    title: 'Rönesans Nasıl Tetiklendi?',
    subtitle: 'İslam medeniyetinin altı temel katkısı',
    back: '← Geri',
    explore: 'Güzergâhı Keşfet',
    conclusion: 'Bu altı akış bir araya geldiğinde, 14. yüzyıl İtalyasında Rönesans\'ı tetikleyen entelektüel birikimi oluşturdu. Her biri tek başına dönüştürücüydü — birlikte, dünyayı değiştirdiler.',
  },
  en: {
    title: 'How Was the Renaissance Triggered?',
    subtitle: 'Six foundational contributions from Islamic civilization',
    back: '← Back',
    explore: 'Explore Route',
    conclusion: 'When these six streams converged, they created the intellectual foundation that triggered the Renaissance in 14th-century Italy. Each was transformative on its own — together, they changed the world.',
  },
  ar: {
    title: 'كيف انطلق عصر النهضة؟',
    subtitle: 'ست مساهمات أساسية من الحضارة الإسلامية',
    back: '← رجوع',
    explore: 'استكشف المسار',
    conclusion: 'عندما تلاقت هذه التيارات الستة، شكّلت الأساس الفكري الذي أطلق عصر النهضة في إيطاليا في القرن الرابع عشر. كلٌّ منها كان تحويلياً بمفرده — معاً، غيّروا العالم.',
  },
};

export default function RenaissanceStory({ lang, onClose, onRouteClick }) {
  const t = STORY_T[lang] || STORY_T.en;
  const isRTL = lang === 'ar';
  const [activeChapter, setActiveChapter] = useState(null);

  return (
    <div className="sci-story" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="sci-story-header">
        <button className="sci-about-back" onClick={onClose}>{t.back}</button>
        <div className="sci-story-header-text">
          <h2 className="sci-story-title">{t.title}</h2>
          <p className="sci-story-subtitle">{t.subtitle}</p>
        </div>
      </div>

      {/* Chapters */}
      <div className="sci-story-chapters">
        {CHAPTERS.map((ch, idx) => (
          <div
            key={ch.id}
            className={`sci-story-card${activeChapter === ch.id ? ' expanded' : ''}`}
            onClick={() => setActiveChapter(activeChapter === ch.id ? null : ch.id)}
          >
            <div className="sci-story-card-num">{idx + 1}</div>
            <div className="sci-story-card-icon">{ch.icon}</div>
            <h3 className="sci-story-card-title">{ch.title[lang] || ch.title.en}</h3>
            <span className="sci-story-card-year">{ch.year}</span>

            {activeChapter === ch.id && (
              <div className="sci-story-card-body">
                <p>{ch.body[lang] || ch.body.en}</p>
                {ch.routeId && (
                  <button
                    className="sci-story-explore-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRouteClick?.(ch.routeId);
                    }}
                  >
                    {t.explore} →
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Conclusion */}
      <div className="sci-story-conclusion">
        <p>{t.conclusion}</p>
      </div>
    </div>
  );
}
