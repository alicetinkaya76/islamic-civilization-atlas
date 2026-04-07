/* ═══ Muqaddasi Layer Constants ═══ */

/* ── Layer description ── */
export const LAYER_ABOUT = {
  tr: `Makdisî (ö. 390/1000), İslam dünyasını bizzat gezip gözlemleyerek yazdığı Ahsenü't-Tekâsîm adlı eserinde 14 iklime (bölge) ayırdığı coğrafyayı, şehirleri, güzergâhları ve mesafeleri sistemli biçimde kaydetmiştir. Her güzergâh iki yer arasındaki mesafeyi "merhale" (günlük yürüyüş, ~35 km) cinsinden verir. Bu katman, eserdeki 2.049 yerleşimi ve 1.427 güzergâhı harita üzerinde görselleştirir.`,
  en: `al-Muqaddasī (d. 390/1000) personally traveled the Islamic world and systematically recorded its geography in Aḥsan al-Taqāsīm, dividing it into 14 iqlīm (regions) with cities, routes, and distances. Each route gives the distance between two places in "marhala" (day's march, ~35 km). This layer visualizes 2,049 settlements and 1,427 routes from the work.`,
  ar: `المقدسي (ت. ٣٩٠هـ) طاف بالعالم الإسلامي شخصياً وسجّل جغرافيته في أحسن التقاسيم، قسّمها إلى ١٤ إقليماً مع المدن والطرق والمسافات. كل طريق يعطي المسافة بين موضعين بالمرحلة (~٣٥ كم). هذه الطبقة تُظهر ٢٬٠٤٩ موضعاً و١٬٤٢٧ طريقاً.`,
};

/* ── Iqlim descriptions (from Muqaddasi's own characterizations) ── */
export const IQLIM_DESC = {
  'إقليم المشرق': {
    tr: 'Horasan, Mâverâünnehir, Fergâne, Harezm ve Sîstan\'ı kapsayan en geniş iklim. Makdisî\'nin "bilginin ve kültürün merkezi" dediği Buhârâ ve Semerkant bu bölgededir.',
    en: 'The largest iqlīm, spanning Khurāsān, Transoxiana, Farghāna, Khwārizm, and Sīstān. Bukhārā and Samarqand, which al-Muqaddasī called "centers of knowledge and culture," are in this region.',
  },
  'جزيرة العرب': {
    tr: 'Hicaz, Yemen, Umân ve Bahreyn\'i kapsayan Arap Yarımadası. Mekke ve Medine\'nin kutsal toprakları, Yemen\'in verimli dağları ve Umân\'ın deniz ticareti.',
    en: 'The Arabian Peninsula covering Ḥijāz, Yemen, Oman, and Bahrain. The sacred lands of Mecca and Medina, Yemen\'s fertile mountains, and Oman\'s maritime trade.',
  },
  'فارس': {
    tr: 'İran\'ın güneybatısı. Şîrâz başkent, İstaḫr antik merkez. Makdisî bu bölgeyi zengin tarım ve ticaretiyle över.',
    en: 'Southwestern Iran. Shīrāz as capital, Istakhr as ancient center. Al-Muqaddasī praises this region for its rich agriculture and trade.',
  },
  'المغرب': {
    tr: 'Kuzey Afrika: İfrîkıye (Tunus), Mağrib-i Aksâ (Fas), Sicilya. Kayrevân ve Fâs gibi büyük şehirleri barındırır.',
    en: 'North Africa: Ifrīqiya (Tunisia), Far Maghrib (Morocco), Sicily. Contains great cities like Qayrawān and Fās.',
  },
  'الشام': {
    tr: 'Büyük Suriye: Filistin, Ürdün, Dımaşk, Humus, Kınnesrîn. Makdisî\'nin doğduğu Kudüs bu bölgededir.',
    en: 'Greater Syria: Palestine, Jordan, Damascus, Homs, Qinnasrīn. Jerusalem, where al-Muqaddasī was born, is in this region.',
  },
  'الرحاب': {
    tr: 'Azerbaycan, Ermenistan ve Arrân bölgesi. Tebriz, Erdebîl, Derbend gibi önemli şehirleri kapsar.',
    en: 'Azerbaijan, Armenia, and Arrān region. Includes important cities like Tabriz, Ardabīl, and Darband.',
  },
  'أقور': {
    tr: 'Kuzey Mezopotamya (el-Cezîre): Musul, Diyârbekir, Harran, Rakka. Dicle ve Fırat arasındaki bereketli topraklar.',
    en: 'Upper Mesopotamia (al-Jazīra): Mosul, Diyārbakir, Ḥarrān, Raqqa. The fertile lands between the Tigris and Euphrates.',
  },
  'العراق': {
    tr: 'Güney Mezopotamya: Bağdat, Kûfe, Basra, Vâsıt. Abbâsî hilâfetinin merkezi ve İslam medeniyetinin kalbi.',
    en: 'Southern Mesopotamia: Baghdad, Kūfa, Basra, Wāsiṭ. The center of the Abbasid caliphate and heart of Islamic civilization.',
  },
  'الديلم': {
    tr: 'Hazar Denizi\'nin güneyindeki bölge: Taberistân, Cürcân, Rey. Dağlık coğrafya ve yoğun ormanlar.',
    en: 'Region south of the Caspian Sea: Ṭabaristān, Jurjān, Rayy. Mountainous terrain and dense forests.',
  },
  'الجبال': {
    tr: 'Batı İran dağlık bölgesi: Hemedân, İsfahân, Kazvin. Zagros sıradağları boyunca önemli ticaret güzergâhları.',
    en: 'Western Iranian highlands: Hamadhān, Iṣfahān, Qazwīn. Important trade routes along the Zagros mountains.',
  },
  'خوزستان': {
    tr: 'Güneybatı İran ovası: Ahvaz, Tüster, Sûs. Şeker kamışı üretimi ve nehir ağı ile tanınır.',
    en: 'Southwestern Iranian lowland: Ahwāz, Tustar, Sūs. Known for sugarcane production and its river network.',
  },
  'السند': {
    tr: 'İndüs havzası: Mansûre, Debîl, Multân. İslam dünyasının doğu sınırı, Hint ticaret bağlantısı.',
    en: 'Indus basin: Manṣūra, Daybul, Multān. The eastern frontier of the Islamic world, connecting to Indian trade.',
  },
  'مصر': {
    tr: 'Nil vadisi: Fustat, İskenderiye, Saîd. Makdisî Mısır\'ı "dünyanın ambarı" olarak tanımlar.',
    en: 'Nile valley: Fusṭāṭ, Alexandria, Ṣaʿīd. Al-Muqaddasī describes Egypt as "the granary of the world."',
  },
  'كرمان': {
    tr: 'Güneydoğu İran: Sîrcân, Berdâsîr, Cîruft. Çöl ile dağ arasında geçiş bölgesi, maden kaynakları.',
    en: 'Southeastern Iran: Sīrjān, Bardasīr, Jīruft. Transition zone between desert and mountains, mineral resources.',
  },
};

export const IQLIM_COLORS = {
  'إقليم المشرق': '#e6194b',
  'جزيرة العرب': '#f58231',
  'فارس': '#ffe119',
  'المغرب': '#3cb44b',
  'الشام': '#42d4f4',
  'الرحاب': '#4363d8',
  'أقور': '#911eb4',
  'العراق': '#f032e6',
  'الديلم': '#a9a9a9',
  'الجبال': '#9a6324',
  'خوزستان': '#800000',
  'السند': '#469990',
  'مصر': '#dcbeff',
  'كرمان': '#aaffc3',
};

export const IQLIM_LABELS = {
  'إقليم المشرق': { tr: 'Meşrik', en: 'al-Mashriq' },
  'جزيرة العرب': { tr: 'Arap Yarımadası', en: 'Arabian Peninsula' },
  'فارس': { tr: 'Fars', en: 'Fārs' },
  'المغرب': { tr: 'Mağrib', en: 'al-Maghrib' },
  'الشام': { tr: 'Şam', en: 'al-Shām' },
  'الرحاب': { tr: 'Rihâb', en: 'al-Riḥāb' },
  'أقور': { tr: 'Akur', en: 'Aqūr' },
  'العراق': { tr: 'Irak', en: 'Iraq' },
  'الديلم': { tr: 'Deylem', en: 'al-Daylam' },
  'الجبال': { tr: 'Cibâl', en: 'al-Jibāl' },
  'خوزستان': { tr: 'Hûzistan', en: 'Khūzistān' },
  'السند': { tr: 'Sind', en: 'al-Sind' },
  'مصر': { tr: 'Mısır', en: 'Egypt' },
  'كرمان': { tr: 'Kirman', en: 'Kirmān' },
};

export const CERT_OPACITY = {
  certain: 1.0, exact: 1.0, modern_known: 1.0,
  approximate: 0.7, country: 0.7, region: 0.7,
  uncertain: 0.45, inferred: 0.45,
  estimated: 0.35,
};

export const CERT_RADIUS = {
  certain: 5, exact: 5, modern_known: 5,
  approximate: 4, country: 4, region: 4,
  uncertain: 3.5, inferred: 3.5,
  estimated: 3,
};

export const DEFAULT_COLOR = '#808080';

export const normalize = (s) =>
  (s || '').toLowerCase()
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
    .replace(/[āáà]/g, 'a').replace(/[ūú]/g, 'u').replace(/[īíì]/g, 'i')
    .replace(/[ḥḫ]/g, 'h').replace(/ṣ/g, 's').replace(/ṭ/g, 't')
    .replace(/ḍ/g, 'd').replace(/ẓ/g, 'z').replace(/ʿ|ʾ|'/g, '')
    .replace(/[\u0610-\u065f\u0670]/g, '')
    .replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/أ|إ|آ/g, 'ا');

export const MUQ_T = {
  tr: {
    title: 'Ahsenü\'t-Tekâsim',
    sub: 'Makdisî (ö. 390/1000) — 2.049 Yerleşim · 1.427 Güzergâh · 14 İklim',
    loading: 'Makdisî verileri yükleniyor…',
    totalPlaces: 'yerleşim', routes: 'güzergâh', aqualim: 'iklim',
    geocoded: 'konumlu',
    search: 'Yer ara…',
    entries: 'yer',
    noEntries: 'Bu filtre ile eşleşen yer bulunamadı.',
    noSelection: 'Detay için bir yere tıklayın',
    source: "Kaynak: el-Makdisî, Ahsenü't-Tekâsîm fî Ma'rifeti'l-Ekâlîm (thk. De Goeje, BGA III)",
    allIqlim: 'Tüm İklimler',
    allCert: 'Tüm Güven',
    certainty: 'Güven',
    certain: 'Kesin', approximate: 'Yaklaşık', uncertain: 'Belirsiz', estimated: 'Tahmini',
    coordinates: 'Koordinat',
    coordSource: 'Kaynak',
    iqlim: 'İklim',
    description: 'Açıklama',
    showRoutes: 'Güzergâhları göster',
    routeInfo: 'Güzergâh bilgisi',
    distance: 'Mesafe',
    marhala: 'merhale',
    listView: 'Liste',
    mapView: 'Harita',
    km: 'km',
  },
  en: {
    title: 'Aḥsan al-Taqāsīm',
    sub: 'al-Muqaddasī (d. 390/1000) — 2,049 Places · 1,427 Routes · 14 Iqlīm',
    loading: 'Loading Muqaddasī data…',
    totalPlaces: 'places', routes: 'routes', aqualim: 'iqlīm',
    geocoded: 'geocoded',
    search: 'Search places…',
    entries: 'places',
    noEntries: 'No places match this filter.',
    noSelection: 'Click a place for details',
    source: "Source: al-Muqaddasī, Aḥsan al-Taqāsīm fī Maʿrifat al-Aqālīm (ed. De Goeje, BGA III)",
    allIqlim: 'All Iqlīm',
    allCert: 'All Confidence',
    certainty: 'Confidence',
    certain: 'Certain', approximate: 'Approximate', uncertain: 'Uncertain', estimated: 'Estimated',
    coordinates: 'Coordinates',
    coordSource: 'Source',
    iqlim: 'Iqlīm',
    description: 'Description',
    showRoutes: 'Show routes',
    routeInfo: 'Route info',
    distance: 'Distance',
    marhala: 'marhala',
    listView: 'List',
    mapView: 'Map',
    km: 'km',
  },
  ar: {
    title: 'أحسن التقاسيم في معرفة الأقاليم',
    sub: 'المقدسي (ت. ٣٩٠هـ) — ٢٬٠٤٩ موضعًا · ١٬٤٢٧ طريقًا · ١٤ إقليمًا',
    loading: 'جارٍ تحميل بيانات المقدسي…',
    totalPlaces: 'موضع', routes: 'طريق', aqualim: 'إقليم',
    search: 'ابحث عن موضع…',
    entries: 'موضع',
    noSelection: 'اضغط على موضع لعرض التفاصيل',
    source: 'المصدر: المقدسي، أحسن التقاسيم في معرفة الأقاليم (تحقيق دي خويه)',
    allIqlim: 'كل الأقاليم',
    iqlim: 'الإقليم',
  },
};
