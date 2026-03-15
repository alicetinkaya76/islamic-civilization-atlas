/**
 * İsnâd Zincirleri — Golden Chains of Hadith Narration
 * v4.8.7.0 — 10 meşhur altın zincir
 */
const ISNAD_CHAINS = [
  {
    id: 1,
    name_tr: "Silsiletü'z-Zeheb (Altın Zincir)",
    name_en: "Golden Chain (Silsilat al-Dhahab)",
    name_ar: '',
    desc_tr: "İmam Buhârî'nin 'esahhu'l-esânîd' dediği en sahih isnâd zinciri: Mâlik → Nâfi' → İbn Ömer",
    desc_en: "The most authentic chain of narration according to Imam Bukhari: Malik → Nafi' → Ibn Umar",
    desc_ar: '',
    grade_tr: "Esahhu'l-Esânîd",
    grade_en: "Most Authentic Chain",
    grade_ar: '',
    school_tr: "Medine Ekolü",
    school_en: "Medinan School",
    school_ar: '',
    color: "#FFD700",
    links: [
      { from: 52,  to: 306 },   // İbn Ömer → Nâfi'
      { from: 306, to: 2 },     // Nâfi' → Mâlik
    ]
  },
  {
    id: 2,
    name_tr: "Uzatılmış Altın Zincir",
    name_en: "Extended Golden Chain",
    name_ar: '',
    desc_tr: "Altın zincirin devamı: Mâlik → Şâfiî → Ahmed b. Hanbel — üç büyük imamı birbirine bağlar",
    desc_en: "Extension of the Golden Chain: Malik → al-Shafi'i → Ahmad ibn Hanbal — connecting three great imams",
    desc_ar: '',
    grade_tr: "Silsiletü'z-Zeheb",
    grade_en: "Golden Chain",
    grade_ar: '',
    school_tr: "Medine → Hicaz",
    school_en: "Medina → Hijaz",
    school_ar: '',
    color: "#FFD700",
    links: [
      { from: 2,   to: 3 },     // Mâlik → Şâfiî
      { from: 3,   to: 4 },     // Şâfiî → Ahmed b. Hanbel
    ]
  },
  {
    id: 3,
    name_tr: "Buhârî'nin İlk Hadis Zinciri",
    name_en: "Bukhari's First Hadith Chain",
    name_ar: '',
    desc_tr: "Sahîh-i Buhârî'nin ilk hadisinin isnâd zinciri: İbn Abbâs → Amr b. Dînâr → Süfyân b. Uyeyne → Humeydî → Buhârî",
    desc_en: "Chain of the first hadith in Sahih al-Bukhari: Ibn Abbas → Amr ibn Dinar → Sufyan ibn Uyayna → al-Humaydi → Bukhari",
    desc_ar: '',
    grade_tr: "Sahîh'in İlk İsnâdı",
    grade_en: "First Isnad of the Sahih",
    grade_ar: '',
    school_tr: "Mekke Ekolü",
    school_en: "Meccan School",
    school_ar: '',
    color: "#E8C65A",
    links: [
      { from: 303, to: 313 },   // İbn Abbâs → Amr b. Dînâr
      { from: 313, to: 315 },   // Amr b. Dînâr → Süfyân b. Uyeyne
      { from: 315, to: 324 },   // Süfyân b. Uyeyne → Humeydî
      { from: 324, to: 5 },     // Humeydî → Buhârî
    ]
  },
  {
    id: 4,
    name_tr: "Medine — Âişe Rivayetleri",
    name_en: "Medina — Aisha Narrations",
    name_ar: '',
    desc_tr: "Kadın râviler arasında en sahih zincir: Hz. Âişe → Urve b. Zübeyr → İbn Şihâb ez-Zührî",
    desc_en: "Most authentic chain among female narrators: Aisha → Urwa ibn al-Zubayr → Ibn Shihab al-Zuhri",
    desc_ar: '',
    grade_tr: "Esahhu'l-Esânîd ani'n-Nisâ",
    grade_en: "Most Authentic Chain from Women",
    grade_ar: '',
    school_tr: "Medine Ekolü",
    school_en: "Medinan School",
    school_ar: '',
    color: "#DB2777",
    links: [
      { from: 110, to: 307 },   // Âişe → Urve b. Zübeyr
      { from: 307, to: 59 },    // Urve → Zührî
    ]
  },
  {
    id: 5,
    name_tr: "Kûfe — İbn Mes'ûd Fıkıh Silsilesi",
    name_en: "Kufa — Ibn Masud Fiqh Chain",
    name_ar: '',
    desc_tr: "Kûfe fıkıh geleneğinin omurgası: İbn Mes'ûd → Alkame → İbrâhîm en-Nehaî → Hammâd → Ebû Hanîfe",
    desc_en: "Backbone of the Kufa fiqh tradition: Ibn Masud → Alqama → Ibrahim al-Nakha'i → Hammad → Abu Hanifa",
    desc_ar: '',
    grade_tr: "Kûfe Fıkıh Silsilesi",
    grade_en: "Kufa Fiqh Chain",
    grade_ar: '',
    school_tr: "Kûfe Ekolü",
    school_en: "Kufan School",
    school_ar: '',
    color: "#16A34A",
    links: [
      { from: 304, to: 309 },   // İbn Mes'ûd → Alkame
      { from: 309, to: 61 },    // Alkame → İbrâhîm en-Nehaî
      { from: 61,  to: 139 },   // İbrâhîm → Hammâd
      { from: 139, to: 1 },     // Hammâd → Ebû Hanîfe
    ]
  },
  {
    id: 6,
    name_tr: "Kûfe — A'meş Hadis Zinciri",
    name_en: "Kufa — A'mash Hadith Chain",
    name_ar: '',
    desc_tr: "Kûfe hadis geleneğinin ana kolu: İbn Mes'ûd → Ebû Vâil → A'meş → Süfyân es-Sevrî",
    desc_en: "Main branch of the Kufa hadith tradition: Ibn Masud → Abu Wa'il → al-A'mash → Sufyan al-Thawri",
    desc_ar: '',
    grade_tr: "Kûfe Hadis Silsilesi",
    grade_en: "Kufa Hadith Chain",
    grade_ar: '',
    school_tr: "Kûfe Ekolü",
    school_en: "Kufan School",
    school_ar: '',
    color: "#2563EB",
    links: [
      { from: 304, to: 325 },   // İbn Mes'ûd → Ebû Vâil
      { from: 325, to: 317 },   // Ebû Vâil → A'meş
      { from: 317, to: 314 },   // A'meş → Süfyân es-Sevrî
    ]
  },
  {
    id: 7,
    name_tr: "Kûfe — Mansûr Alternatif Zinciri",
    name_en: "Kufa — Mansur Alternative Chain",
    name_ar: '',
    desc_tr: "İbrâhîm en-Nehaî → Mansûr → Süfyân es-Sevrî — A'meş ile paralel ikinci kol",
    desc_en: "Ibrahim al-Nakha'i → Mansur → Sufyan al-Thawri — second branch parallel to al-A'mash",
    desc_ar: '',
    grade_tr: "Kûfe Alternatif Silsilesi",
    grade_en: "Kufa Alternative Chain",
    grade_ar: '',
    school_tr: "Kûfe Ekolü",
    school_en: "Kufan School",
    school_ar: '',
    color: "#7C3AED",
    links: [
      { from: 61,  to: 318 },   // İbrâhîm → Mansûr
      { from: 318, to: 314 },   // Mansûr → Süfyân es-Sevrî
    ]
  },
  {
    id: 8,
    name_tr: "Basra — Enes b. Mâlik Zinciri",
    name_en: "Basra — Anas ibn Malik Chain",
    name_ar: '',
    desc_tr: "Basra hadis geleneğinin ana zinciri: Enes b. Mâlik → Katâde → Şu'be",
    desc_en: "Main chain of the Basra hadith tradition: Anas ibn Malik → Qatada → Shu'ba",
    desc_ar: '',
    grade_tr: "Basra Silsilesi",
    grade_en: "Basra Chain",
    grade_ar: '',
    school_tr: "Basra Ekolü",
    school_en: "Basran School",
    school_ar: '',
    color: "#0891B2",
    links: [
      { from: 123, to: 311 },   // Enes → Katâde
      { from: 311, to: 316 },   // Katâde → Şu'be
    ]
  },
  {
    id: 9,
    name_tr: "Medine — Zührî Silsilesi",
    name_en: "Medina — Zuhri Chain",
    name_ar: '',
    desc_tr: "İbn Ömer → Sâlim → İbn Şihâb ez-Zührî → Mâlik — Medine okulunun ikinci ana kolu",
    desc_en: "Ibn Umar → Salim → Ibn Shihab al-Zuhri → Malik — second main branch of the Medinan school",
    desc_ar: '',
    grade_tr: "Zührî Silsilesi",
    grade_en: "Zuhri Chain",
    grade_ar: '',
    school_tr: "Medine Ekolü",
    school_en: "Medinan School",
    school_ar: '',
    color: "#CA8A04",
    links: [
      { from: 52,  to: 310 },   // İbn Ömer → Sâlim
      { from: 310, to: 59 },    // Sâlim → Zührî
      { from: 59,  to: 2 },     // Zührî → Mâlik
    ]
  },
  {
    id: 10,
    name_tr: "Ebû Hüreyre Zinciri",
    name_en: "Abu Hurayra Chain",
    name_ar: '',
    desc_tr: "En çok rivayet eden sahâbî zinciri: Ebû Hüreyre → Saîd b. Müseyyeb → Zührî → Mâlik",
    desc_en: "Chain of the Companion with most narrations: Abu Hurayra → Sa'id ibn al-Musayyab → al-Zuhri → Malik",
    desc_ar: '',
    grade_tr: "En Çok Rivayet Zinciri",
    grade_en: "Most Narrated Chain",
    grade_ar: '',
    school_tr: "Medine Ekolü",
    school_en: "Medinan School",
    school_ar: '',
    color: "#EA580C",
    links: [
      { from: 109, to: 305 },   // Ebû Hüreyre → Saîd b. Müseyyeb
      { from: 305, to: 59 },    // Saîd → Zührî
      { from: 59,  to: 2 },     // Zührî → Mâlik
    ]
  },
];

export default ISNAD_CHAINS;
