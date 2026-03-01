/* ═══════════════════════════════════════════════════
   Dönem Bilgi Kartları — Era Info Data
   10 dönem × TR/EN açıklama + anahtar gelişmeler + öne çıkan âlimler
   ═══════════════════════════════════════════════════ */

const ERA_INFO = [
  {
    id: 'rashidun',
    start: 622,
    end: 661,
    label: { tr: 'Râşidîn Halifeleri', en: 'Rashidun Caliphate' },
    color: '#4ade80',
    description: {
      tr: 'Hz. Muhammed\'in vefatının ardından dört halife döneminde İslam devleti, Arap Yarımadası\'ndan Mısır, Suriye ve İran\'a kadar genişledi. Ridde savaşları ile iç birlik sağlandı, ardından Bizans ve Sâsânî imparatorluklarına karşı fetih harekâtı başladı. Hz. Ömer döneminde kurulan divan sistemi ve şehir planlaması, İslam medeniyetinin idari temellerini attı. Hz. Osman döneminde Kur\'an mushafı resmî olarak derlendi ve çoğaltıldı. Bu dönem, İslam siyasi düşüncesinde istişare (şûrâ) ilkesinin en güçlü biçimde uygulandığı devir olarak kabul edilir.',
      en: 'Following the Prophet Muhammad\'s death, the four Rightly-Guided Caliphs expanded the Islamic state from the Arabian Peninsula to Egypt, Syria, and Iran. The Ridda Wars consolidated internal unity, followed by major campaigns against the Byzantine and Sasanian empires. Umar\'s reign established the diwan administrative system and urban planning that laid the foundations of Islamic governance. Under Uthman, the Quran was officially compiled and distributed as a standardized text. This era is regarded as the period when the principle of consultation (shura) was most strongly practiced in Islamic political thought.'
    },
    keyDevelopments: {
      tr: ['Kur\'an\'ın resmî derlenmesi', 'Divan sistemi ve idari yapılanma', 'Suriye ve Mısır fetihleri', 'Kûfe ve Basra şehirlerinin kuruluşu'],
      en: ['Official compilation of the Quran', 'Diwan system and administration', 'Conquest of Syria and Egypt', 'Foundation of Kufa and Basra']
    },
    scholars: {
      tr: ['Hz. Ali b. Ebî Tâlib (ilim kapısı)', 'Abdullah b. Mes\'ûd (tefsir)', 'Zeyd b. Sâbit (Kur\'an derlemesi)'],
      en: ['Ali ibn Abi Talib (gate of knowledge)', 'Abdullah ibn Masud (exegesis)', 'Zayd ibn Thabit (Quran compilation)']
    },
    flyTo: { lat: 24.47, lon: 39.61, zoom: 5 }
  },
  {
    id: 'umayyad',
    start: 661,
    end: 750,
    label: { tr: 'Emevîler', en: 'Umayyad Caliphate' },
    color: '#f59e0b',
    description: {
      tr: 'Emevî hanedanı başkenti Şam\'a taşıyarak İslam devletini İspanya\'dan Orta Asya\'ya uzanan bir imparatorluğa dönüştürdü. Arapça devlet dili olarak resmîleştirildi ve İslam sikkesi basılmaya başlandı. Emevî Camii ve Kubbetüs-Sahra gibi mimari şaheserler bu dönemde inşa edildi. Muâviye\'nin kurduğu veraset sistemi İslam siyasi geleneğinde kalıcı bir değişim yarattı. Ancak mevalî (Arap olmayan Müslümanlar) politikaları ve iç çekişmeler Abbâsî devrimine zemin hazırladı.',
      en: 'The Umayyad dynasty moved the capital to Damascus, transforming the Islamic state into an empire stretching from Spain to Central Asia. Arabic was established as the official language of administration, and Islamic coinage was introduced. Architectural masterpieces such as the Umayyad Mosque and Dome of the Rock were built during this period. Muawiya\'s hereditary succession system created a lasting change in Islamic political tradition. However, policies toward non-Arab Muslims (mawali) and internal conflicts eventually paved the way for the Abbasid revolution.'
    },
    keyDevelopments: {
      tr: ['Arapça resmî devlet dili', 'İslam sikkesi (Abdülmelik)', 'Endülüs\'ün fethi (711)', 'Kubbetüs-Sahra inşası'],
      en: ['Arabic as official state language', 'Islamic coinage (Abd al-Malik)', 'Conquest of Iberia (711)', 'Construction of Dome of the Rock']
    },
    scholars: {
      tr: ['Hasan el-Basrî (zühd ve kelam)', 'İbn Şihâb ez-Zührî (hadis)', 'İkrime (tefsir)'],
      en: ['Hasan al-Basri (asceticism & theology)', 'Ibn Shihab al-Zuhri (hadith)', 'Ikrimah (exegesis)']
    },
    flyTo: { lat: 33.51, lon: 36.29, zoom: 5 }
  },
  {
    id: 'early_abbasid',
    start: 750,
    end: 945,
    label: { tr: 'Erken Abbâsîler', en: 'Early Abbasid Period' },
    color: '#8b5cf6',
    description: {
      tr: 'Abbâsî devrimi ile iktidar Arap aristokrasisinden kozmopolit bir yapıya geçti. Bağdat (762) dünyanın en büyük ve en parlak şehirlerinden biri olarak kuruldu. Beytü\'l-Hikme\'de Yunanca, Farsça ve Hintçe eserler Arapçaya çevrildi; bu tercüme hareketi bilimsel devrimin temelini attı. Dört büyük fıkıh mezhebinin kurucuları bu dönemde yaşadı. Harun Reşid ve Me\'mûn dönemleri İslam medeniyetinin altın çağının başlangıcı sayılır.',
      en: 'The Abbasid revolution shifted power from Arab aristocracy to a cosmopolitan structure. Baghdad (762) was founded as one of the world\'s largest and most brilliant cities. At the House of Wisdom (Bayt al-Hikma), Greek, Persian, and Indian works were translated into Arabic, laying the foundations for a scientific revolution. The founders of the four major schools of Islamic jurisprudence lived during this period. The reigns of Harun al-Rashid and al-Ma\'mun are considered the beginning of the golden age of Islamic civilization.'
    },
    keyDevelopments: {
      tr: ['Bağdat\'ın kuruluşu (762)', 'Beytü\'l-Hikme tercüme hareketi', 'Cebir ilminin doğuşu (Hârizmî)', 'Dört mezhep imamlarının dönemi'],
      en: ['Foundation of Baghdad (762)', 'House of Wisdom translation movement', 'Birth of algebra (al-Khwarizmi)', 'Era of the four school founders']
    },
    scholars: {
      tr: ['İmam Ebû Hanîfe', 'İmam Mâlik', 'İmam Şâfiî', 'İmam Ahmed b. Hanbel', 'Hârizmî (matematik)'],
      en: ['Abu Hanifa', 'Malik ibn Anas', 'al-Shafi\'i', 'Ahmad ibn Hanbal', 'al-Khwarizmi (mathematics)']
    },
    flyTo: { lat: 33.31, lon: 44.37, zoom: 5 }
  },
  {
    id: 'buyid_fatimid',
    start: 945,
    end: 1055,
    label: { tr: 'Büveyhî / Fâtımî Dönemi', en: 'Buyid / Fatimid Period' },
    color: '#ec4899',
    description: {
      tr: 'Büveyhîlerin Bağdat\'ı kontrol altına almasıyla Abbâsî halifeleri sembolik bir konuma düştü. Mısır\'da kurulan Fâtımî hilafeti, Sünnî dünyaya alternatif bir güç merkezi oluşturdu. Kahire (969) ve el-Ezher üniversitesi bu dönemde kuruldu. Şiî ve Sünnî entelektüel rekabeti bilim ve felsefede büyük atılımlara yol açtı. İbn Sînâ\'nın el-Kānûn fi\'t-Tıbb\'ı ve Bîrûnî\'nin astronomik çalışmaları bu çağın zirvesini temsil eder.',
      en: 'When the Buyids took control of Baghdad, the Abbasid caliphs were reduced to symbolic figures. The Fatimid caliphate established in Egypt created an alternative center of power to the Sunni world. Cairo (969) and al-Azhar University were founded during this period. Shia-Sunni intellectual competition led to great advances in science and philosophy. Avicenna\'s Canon of Medicine and al-Biruni\'s astronomical works represent the pinnacle of this era.'
    },
    keyDevelopments: {
      tr: ['Kahire\'nin kuruluşu (969)', 'el-Ezher Üniversitesi', 'İbn Sînâ\'nın el-Kānûn\'u', 'Bîrûnî\'nin astronomik ölçümleri'],
      en: ['Foundation of Cairo (969)', 'Al-Azhar University', 'Avicenna\'s Canon of Medicine', 'Al-Biruni\'s astronomical measurements']
    },
    scholars: {
      tr: ['İbn Sînâ (tıp/felsefe)', 'Bîrûnî (astronomi)', 'Fârâbî (siyaset felsefesi)', 'İbn Heysem (optik)'],
      en: ['Avicenna (medicine/philosophy)', 'Al-Biruni (astronomy)', 'Al-Farabi (political philosophy)', 'Ibn al-Haytham (optics)']
    },
    flyTo: { lat: 30.04, lon: 31.24, zoom: 5 }
  },
  {
    id: 'seljuq_crusader',
    start: 1055,
    end: 1258,
    label: { tr: 'Selçuklu / Haçlı Dönemi', en: 'Seljuq / Crusader Period' },
    color: '#ef4444',
    description: {
      tr: 'Selçukluların Bağdat\'a girişi (1055) Sünnî İslam dünyasında Türk askeri gücünün yükselişini simgeledi. Malazgirt Zaferi (1071) Anadolu\'nun kapılarını Türklere açtı. Haçlı seferleri (1096–1291) İslam dünyasında büyük bir askerî ve kültürel şok yarattı. Nizâmülmülk\'ün kurduğu medrese sistemi, İslam eğitim geleneğini kurumsallaştırdı. Gazzâlî\'nin İhyâ\'sı tasavvuf ile kelam arasında bir sentez oluşturarak İslam düşüncesinde derin bir dönüşüm başlattı.',
      en: 'The Seljuq entry into Baghdad (1055) symbolized the rise of Turkish military power in the Sunni Islamic world. The Battle of Manzikert (1071) opened Anatolia\'s gates to the Turks. The Crusades (1096–1291) created a major military and cultural shock in the Islamic world. Nizam al-Mulk\'s madrasa system institutionalized Islamic education. Al-Ghazali\'s Ihya created a synthesis between Sufism and theology, initiating a profound transformation in Islamic thought.'
    },
    keyDevelopments: {
      tr: ['Malazgirt Zaferi (1071)', 'Nizâmiye medreseleri', 'Haçlı seferleri (1096–1291)', 'Selâhaddîn\'in Kudüs\'ü geri alması (1187)'],
      en: ['Battle of Manzikert (1071)', 'Nizamiyya madrasas', 'Crusades (1096–1291)', 'Saladin\'s recapture of Jerusalem (1187)']
    },
    scholars: {
      tr: ['Gazzâlî (kelam/tasavvuf)', 'Ömer Hayyâm (matematik)', 'Zemahşerî (tefsir)', 'İdrîsî (coğrafya)'],
      en: ['Al-Ghazali (theology/Sufism)', 'Omar Khayyam (mathematics)', 'Al-Zamakhshari (exegesis)', 'Al-Idrisi (geography)']
    },
    flyTo: { lat: 33.31, lon: 44.37, zoom: 5 }
  },
  {
    id: 'mongol',
    start: 1258,
    end: 1370,
    label: { tr: 'Moğol İstilası', en: 'Mongol Invasion' },
    color: '#f97316',
    description: {
      tr: 'Bağdat\'ın Moğollar tarafından yıkılması (1258) Abbâsî hilafetine son verdi ve İslam dünyasında derin bir travma yarattı. Ancak Moğol hükümdarların büyük bölümü zamanla İslam\'ı kabul etti. İlhanlılar İran\'da, Altın Orda Kıpçak bozkırlarında İslam medeniyetini farklı coğrafyalara taşıdı. Ayn Câlût Savaşı\'nda (1260) Memlûkler Moğol ilerleyişini durdurarak İslam dünyasının batı kanadını korudu. Bu dönem yıkım kadar yeni sentezlerin de doğduğu bir geçiş çağıdır.',
      en: 'The Mongol destruction of Baghdad (1258) ended the Abbasid caliphate and created deep trauma in the Islamic world. However, most Mongol rulers eventually embraced Islam. The Ilkhanids in Iran and the Golden Horde in the Kipchak steppes carried Islamic civilization to new geographies. At the Battle of Ain Jalut (1260), the Mamluks halted the Mongol advance, protecting the western wing of the Islamic world. This period was an era of transition that produced new syntheses alongside destruction.'
    },
    keyDevelopments: {
      tr: ['Bağdat\'ın düşüşü (1258)', 'Ayn Câlût Savaşı (1260)', 'İlhanlıların İslam\'ı kabulü', 'Memlûk Mısır\'ının yükselişi'],
      en: ['Fall of Baghdad (1258)', 'Battle of Ain Jalut (1260)', 'Ilkhanid conversion to Islam', 'Rise of Mamluk Egypt']
    },
    scholars: {
      tr: ['İbn Teymiyye (ıslah)', 'Nasîrüddîn Tûsî (astronomi)', 'İbn Nefîs (tıp/dolaşım)', 'Kutbüddîn Şirâzî (fizik)'],
      en: ['Ibn Taymiyya (reform)', 'Nasir al-Din al-Tusi (astronomy)', 'Ibn al-Nafis (medicine/circulation)', 'Qutb al-Din al-Shirazi (physics)']
    },
    flyTo: { lat: 33.31, lon: 44.37, zoom: 4 }
  },
  {
    id: 'timurid',
    start: 1370,
    end: 1500,
    label: { tr: 'Timurlu Dönemi', en: 'Timurid Period' },
    color: '#a78bfa',
    description: {
      tr: 'Timur\'un fetihleri büyük yıkıma yol açsa da Timurlu hanedanı Herat ve Semerkant\'ı sanat ve bilimin merkezlerine dönüştürdü. Uluğ Bey\'in rasathanesi dönemin en ileri astronomik gözlemlerini gerçekleştirdi. Minyatür sanatı, hat ve tezhip bu dönemde zirveye ulaştı. İbn Haldûn\'un Mukaddime\'si tarih felsefesinde çığır açtı. Bu dönem, üç büyük İslam imparatorluğunun (Osmanlı, Safevî, Bâbür) temellerinin atıldığı geçiş çağıdır.',
      en: 'Though Timur\'s conquests caused great devastation, the Timurid dynasty transformed Herat and Samarkand into centers of art and science. Ulugh Beg\'s observatory conducted the most advanced astronomical observations of its time. Miniature painting, calligraphy, and illumination reached their zenith during this period. Ibn Khaldun\'s Muqaddimah broke new ground in the philosophy of history. This era was the transitional period when the foundations of the three great Islamic empires (Ottoman, Safavid, Mughal) were laid.'
    },
    keyDevelopments: {
      tr: ['Uluğ Bey rasathanesi (Semerkant)', 'İbn Haldûn\'un Mukaddime\'si', 'Herat minyatür okulu', 'Timurlu mimari rönesansı'],
      en: ['Ulugh Beg Observatory (Samarkand)', 'Ibn Khaldun\'s Muqaddimah', 'Herat miniature school', 'Timurid architectural renaissance']
    },
    scholars: {
      tr: ['İbn Haldûn (tarih felsefesi)', 'Uluğ Bey (astronomi)', 'Ali Kuşçu (matematik)', 'Câmî (edebiyat)'],
      en: ['Ibn Khaldun (philosophy of history)', 'Ulugh Beg (astronomy)', 'Ali Qushji (mathematics)', 'Jami (literature)']
    },
    flyTo: { lat: 39.65, lon: 66.96, zoom: 5 }
  },
  {
    id: 'early_modern',
    start: 1500,
    end: 1700,
    label: { tr: 'Erken Modern (Barut İmparatorlukları)', en: 'Early Modern (Gunpowder Empires)' },
    color: '#06b6d4',
    description: {
      tr: 'Osmanlı, Safevî ve Bâbür imparatorlukları "barut imparatorlukları" olarak İslam dünyasının en geniş coğrafyasını yönetti. Osmanlı İstanbul\'u fethederek (1453) Bizans mirasını devraldı, Mimar Sinan ile mimarlık tarihinde yeni bir sayfa açtı. Safevîler İran\'da Şiîliği devlet mezhebi yaparak bugünkü mezhep coğrafyasını şekillendirdi. Bâbürlüler Hindistan\'da Tac Mahal gibi eşsiz eserler ortaya koydu. Bu çağ, İslam medeniyetinin siyasi ve kültürel olarak en yaygın olduğu dönemdir.',
      en: 'The Ottoman, Safavid, and Mughal empires, known as the "Gunpowder Empires," governed the widest geography of the Islamic world. The Ottomans conquered Constantinople (1453), inherited the Byzantine legacy, and opened a new chapter in architectural history with Mimar Sinan. The Safavids made Shia Islam the state religion in Iran, shaping today\'s sectarian geography. The Mughals produced matchless works like the Taj Mahal in India. This was the era when Islamic civilization reached its widest political and cultural extent.'
    },
    keyDevelopments: {
      tr: ['İstanbul\'un fethi (1453)', 'Safevî devletinin kuruluşu', 'Bâbür İmparatorluğu\'nun kuruluşu', 'Süleymaniye Camii (Mimar Sinan)'],
      en: ['Conquest of Constantinople (1453)', 'Establishment of the Safavid state', 'Foundation of the Mughal Empire', 'Süleymaniye Mosque (Mimar Sinan)']
    },
    scholars: {
      tr: ['Mimar Sinan (mimarlık)', 'Kâtip Çelebi (bibliyografya)', 'Pîrî Reis (haritacılık)', 'Şeyh Bedreddin (felsefe)'],
      en: ['Mimar Sinan (architecture)', 'Katip Çelebi (bibliography)', 'Piri Reis (cartography)', 'Sheikh Bedreddin (philosophy)']
    },
    flyTo: { lat: 41.01, lon: 28.98, zoom: 4 }
  },
  {
    id: 'decline_reform',
    start: 1700,
    end: 1850,
    label: { tr: 'Gerileme ve Islah', en: 'Decline and Reform' },
    color: '#eab308',
    description: {
      tr: 'Avrupa\'nın askerî ve teknolojik üstünlüğü karşısında İslam imparatorlukları gerilemeye başladı. Osmanlı\'da Lale Devri, Tanzimat ve Islahat fermanları modernleşme çabalarını yansıttı. Hindistan\'da Bâbürlülerin çöküşü İngiliz sömürge dönemini başlattı. Vehhâbî hareketi Arap Yarımadası\'nda dini yenilenme çağrısında bulundu. Mısır\'da Mehmed Ali Paşa bağımsız bir modernleşme modeli denedi. Bu dönem, gelenek ile modernite arasındaki gerilimin en keskin biçimde yaşandığı çağdır.',
      en: 'Facing Europe\'s military and technological superiority, Islamic empires began to decline. In the Ottoman Empire, the Tulip Period, Tanzimat, and Reform Edicts reflected modernization efforts. In India, the fall of the Mughals initiated the British colonial period. The Wahhabi movement called for religious renewal in the Arabian Peninsula. In Egypt, Muhammad Ali Pasha attempted an independent modernization model. This era saw the sharpest tension between tradition and modernity.'
    },
    keyDevelopments: {
      tr: ['Tanzimat Fermanı (1839)', 'Vehhâbî hareketi', 'Mısır\'da Mehmed Ali modernleşmesi', 'Matbaanın yaygınlaşması'],
      en: ['Tanzimat Edict (1839)', 'Wahhabi movement', 'Muhammad Ali\'s modernization in Egypt', 'Spread of the printing press']
    },
    scholars: {
      tr: ['Şah Veliyyullah Dihlevî (ıslah)', 'İsmail Gelenbevî (matematik)', 'Rifâa et-Tahtâvî (eğitim)', 'Ahmed Cevdet Paşa (tarih)'],
      en: ['Shah Waliullah Dehlawi (reform)', 'Ismail Gelenbevi (mathematics)', 'Rifa\'a al-Tahtawi (education)', 'Ahmed Cevdet Pasha (history)']
    },
    flyTo: { lat: 41.01, lon: 28.98, zoom: 4 }
  },
  {
    id: 'modern',
    start: 1850,
    end: 1924,
    label: { tr: 'Modern Dönem', en: 'Modern Period' },
    color: '#64748b',
    description: {
      tr: 'Osmanlı İmparatorluğu\'nun son dönemi meşrutiyet, savaş ve çöküş ile şekillendi. I. Meşrutiyet (1876) ve II. Meşrutiyet (1908) anayasal yönetim denemeleriydi. Balkan Savaşları ve I. Dünya Savaşı imparatorluğun sonunu getirdi. Hilafetin kaldırılması (1924) İslam dünyasında siyasi birlik sembolünün sona ermesi anlamına geldi. Bu dönemde Afgânî ve Abduh gibi düşünürler İslam modernizmi hareketini başlattı; ulus-devlet modeli İslam coğrafyasını yeniden şekillendirdi.',
      en: 'The final period of the Ottoman Empire was shaped by constitutionalism, war, and dissolution. The First (1876) and Second (1908) Constitutional Eras were experiments in constitutional governance. The Balkan Wars and World War I brought the empire to its end. The abolition of the caliphate (1924) meant the end of the political unity symbol in the Islamic world. Thinkers like al-Afghani and Abduh launched the Islamic modernism movement during this period; the nation-state model reshaped the geography of Islam.'
    },
    keyDevelopments: {
      tr: ['I. Meşrutiyet (1876)', 'II. Meşrutiyet (1908)', 'Hilafetin kaldırılması (1924)', 'Ulus-devletlerin doğuşu'],
      en: ['First Constitutional Era (1876)', 'Second Constitutional Era (1908)', 'Abolition of the Caliphate (1924)', 'Birth of nation-states']
    },
    scholars: {
      tr: ['Cemâleddîn Afgânî (pan-İslam)', 'Muhammed Abduh (modernizm)', 'Mehmed Âkif Ersoy (edebiyat)', 'Said Nursî (tefsir)'],
      en: ['Jamal al-Din al-Afghani (pan-Islam)', 'Muhammad Abduh (modernism)', 'Mehmed Akif Ersoy (literature)', 'Said Nursi (exegesis)']
    },
    flyTo: { lat: 41.01, lon: 28.98, zoom: 4 }
  }
];

export default ERA_INFO;
