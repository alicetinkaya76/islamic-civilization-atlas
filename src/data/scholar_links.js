/**
 * Scholar relationship links (teacher-student, influence, debate).
 * All IDs correspond to db.json scholars array.
 * v4.8.4.4 — 130+ bağlantı (34 mevcut + ~100 yeni)
 */
const SCHOLAR_LINKS = [
  // ═══════════════════════════════════════════════════
  // MEVCUT 34 BAĞLANTI (v4.8.4.3'ten)
  // ═══════════════════════════════════════════════════

  // Fıkıh silsilesi (mevcut)
  { source:1, target:42, type:'influence' },   // Ebû Hanîfe → Mâtürîdî
  { source:2, target:3,  type:'teacher' },     // Mâlik → Şâfiî
  { source:3, target:4,  type:'teacher' },     // Şâfiî → Ahmed b. Hanbel
  { source:4, target:8,  type:'influence' },   // Ahmed b. Hanbel → İbn Teymiyye
  // Hadis silsilesi (mevcut)
  { source:5, target:45, type:'influence' },   // Buhârî → İbn Hacer
  { source:5, target:6,  type:'influence' },   // Buhârî → Müslim (çağdaş)
  { source:41, target:5, type:'influence' },   // İbn Mâce — Buhârî (çağdaş, aynı ağ)
  // Kelam / Felsefe silsilesi (mevcut)
  { source:19, target:20, type:'teacher' },    // Kindî → Fârâbî
  { source:20, target:10, type:'teacher' },    // Fârâbî → İbn Sînâ
  { source:10, target:21, type:'influence' },  // İbn Sînâ → İbn Rüşd
  { source:43, target:7,  type:'influence' },  // Eş'arî → Gazâlî (silsile)
  { source:7,  target:21, type:'debate' },     // Gazâlî → İbn Rüşd (Tehâfüt)
  { source:10, target:7,  type:'influence' },  // İbn Sînâ → Gazâlî
  { source:12, target:10, type:'debate' },     // Bîrûnî ↔ İbn Sînâ
  // Tıp silsilesi (mevcut)
  { source:13, target:39, type:'influence' },  // Câbir → Râzî
  { source:39, target:10, type:'influence' },  // Râzî → İbn Sînâ
  { source:10, target:49, type:'influence' },  // İbn Sînâ → İbn Nefîs
  { source:39, target:40, type:'influence' },  // Râzî → İbn Zuhr
  { source:40, target:21, type:'influence' },  // İbn Zuhr → İbn Rüşd (işbirliği)
  // Tarih silsilesi (mevcut)
  { source:44, target:34, type:'influence' },  // İbn Hişâm → Taberî
  { source:34, target:18, type:'influence' },  // Taberî → İbn Haldûn
  { source:18, target:47, type:'influence' },  // İbn Haldûn → Kâtip Çelebi
  { source:35, target:48, type:'influence' },  // İbn Battûta → Evliyâ Çelebi
  { source:46, target:47, type:'influence' },  // Pîrî Reis → Kâtip Çelebi
  // Tasavvuf silsilesi (mevcut)
  { source:33, target:28, type:'teacher' },    // Hacı Bektâş → Yûnus Emre
  // Edebiyat silsilesi (mevcut)
  { source:22, target:25, type:'influence' },  // Firdevsî → Sa'dî
  { source:25, target:24, type:'influence' },  // Sa'dî → Hâfız
  { source:24, target:27, type:'influence' },  // Hâfız → Fuzûlî
  { source:26, target:27, type:'influence' },  // Ali Şîr Nevâî → Fuzûlî
  // Hat silsilesi (mevcut)
  { source:38, target:36, type:'influence' },  // Yâkūt el-Müsta'sımî → Mimar Sinan dönemi
  // Astronomi silsilesi (mevcut)
  { source:9,  target:17, type:'influence' },  // Hârizmî → Ömer Hayyâm
  { source:14, target:12, type:'influence' },  // Nasîrüddîn Tûsî ← Bîrûnî

  // ═══════════════════════════════════════════════════
  // YENİ BAĞLANTILAR (v4.8.4.4)
  // ═══════════════════════════════════════════════════

  // FIKIH SİLSİLESİ — Yeni
  { source:1,   target:281, type:'teacher' },   // Ebû Hanîfe → Ebû Yûsuf
  { source:1,   target:282, type:'teacher' },   // Ebû Hanîfe → Muhammed eş-Şeybânî
  { source:282, target:3,   type:'teacher' },   // Şeybânî → Şâfiî
  { source:3,   target:283, type:'teacher' },   // Şâfiî → Müzenî
  { source:4,   target:255, type:'influence' },  // Ahmed b. Hanbel → İbn Kudâme
  { source:8,   target:253, type:'teacher' },   // İbn Teymiyye → İbn Kayyım el-Cevziyye
  { source:253, target:259, type:'teacher' },   // İbn Kayyım → İbn Receb
  { source:139, target:1,   type:'teacher' },   // Hammâd b. Ebî Süleymân → Ebû Hanîfe
  { source:61,  target:139, type:'teacher' },   // İbrâhîm en-Nehaî → Hammâd
  { source:281, target:282, type:'influence' },  // Ebû Yûsuf ↔ Şeybânî (çağdaş etkileşim)

  // HADİS SİLSİLESİ — Yeni
  { source:141, target:142, type:'influence' },  // Ebû Dâvûd → Nesâî
  { source:45,  target:87,  type:'teacher' },   // İbn Hacer → Süyûtî
  { source:76,  target:45,  type:'influence' },  // Nevevî → İbn Hacer
  { source:254, target:81,  type:'teacher' },   // Zehebî → İbn Kesîr ed-Dımaşkî
  { source:5,   target:140, type:'influence' },  // Buhârî → Tirmizî
  { source:59,  target:2,   type:'teacher' },   // İbn Şihâb ez-Zührî → Mâlik
  { source:148, target:5,   type:'influence' },  // Abdürrazzâk → Buhârî (isnad)
  { source:150, target:5,   type:'influence' },  // Yahyâ b. Maîn → Buhârî (cerh-ta'dîl)
  { source:151, target:5,   type:'teacher' },   // Ali b. Medînî → Buhârî
  { source:266, target:76,  type:'influence' },  // İbn Salâh → Nevevî (hadis usûlü)

  // KELAM / FELSEFE — Yeni
  { source:43,  target:272, type:'teacher' },   // Eş'arî → Bâkıllânî
  { source:272, target:273, type:'influence' },  // Bâkıllânî → Cüveynî
  { source:273, target:7,   type:'teacher' },   // Cüveynî → Gazâlî
  { source:7,   target:75,  type:'influence' },  // Gazâlî → Fahreddin er-Râzî
  { source:75,  target:274, type:'influence' },  // Fahreddin er-Râzî → Îcî
  { source:225, target:224, type:'influence' },  // Teftâzânî → Cürcânî
  { source:42,  target:275, type:'influence' },  // Mâtürîdî → Nesefî (Ebü'l-Muîn)
  { source:277, target:285, type:'influence' },  // Muhâsibî → Cüneyd (kelam-tasavvuf)

  // TASAVVUF — Yeni
  { source:58,  target:136, type:'influence' },  // Hasan el-Basrî → Râbia el-Adeviyye

  { source:7,   target:32,  type:'influence' },  // Gazâlî → Abdülkādir Geylânî


  { source:33,  target:242, type:'influence' },  // Hacı Bektâş → Hacı Bayram Velî
  { source:242, target:243, type:'teacher' },   // Hacı Bayram Velî → Akşemseddin
  { source:229, target:228, type:'influence' },  // Senâî → Attâr
  { source:276, target:7,   type:'influence' },  // Kuşeyrî → Gazâlî (tasavvuf)
  { source:220, target:33,  type:'influence' },  // Ahmed Yesevî → Hacı Bektâş
  { source:196, target:197, type:'influence' },  // Bahâüddîn Zekeriyyâ → Ferîdüddîn Genc-i Şeker
  { source:197, target:198, type:'teacher' },   // Ferîdüddîn → Nizâmüddîn Evliyâ
  { source:198, target:199, type:'influence' },  // Nizâmüddîn → Emîr Hüsrev

  // TIP — Yeni
  { source:287, target:39,  type:'influence' },  // Huneyn b. İshâk → Râzî (tercüme hareketi)
  { source:288, target:40,  type:'influence' },  // Zehrâvî → İbn Zuhr
  { source:289, target:10,  type:'influence' },  // Mecûsî → İbn Sînâ
  { source:10,  target:292, type:'influence' },  // İbn Sînâ → İbn Baytâr (tıp geleneği)
  { source:185, target:294, type:'influence' },  // Sabuncuoğlu → İtâkî (Osmanlı tıp geleneği)

  // MATEMATİK / ASTRONOMİ — Yeni
  { source:9,   target:216, type:'influence' },  // Hârizmî → Ebü'l-Vefâ
  { source:12,  target:17,  type:'influence' },  // Bîrûnî → Hayyâm
  { source:17,  target:14,  type:'influence' },  // Hayyâm → Nasîrüddin Tûsî
  { source:14,  target:84,  type:'influence' },  // Tûsî → Uluğ Bey
  { source:84,  target:83,  type:'teacher' },   // Uluğ Bey → Ali Kuşçu
  { source:83,  target:93,  type:'influence' },  // Ali Kuşçu → Takiyyüddin
  { source:83,  target:302, type:'influence' },  // Ali Kuşçu → Bâlî Efendi (silsile)
  { source:214, target:9,   type:'influence' },  // Battânî → Hârizmî (astronomi geleneği)
  { source:215, target:214, type:'influence' },  // Fergânî → Battânî
  { source:14,  target:221, type:'teacher' },   // Tûsî → Kemâleddîn Fârisî
  { source:14,  target:77,  type:'teacher' },   // Tûsî → Kutbüddîn eş-Şîrâzî
  { source:223, target:84,  type:'influence' },  // Kâşî → Uluğ Bey (Semerkant rasathanesi)
  { source:93,  target:301, type:'influence' },  // Takiyyüddin → Gelenbevî (Osmanlı geleneği)

  // TARİH — Yeni
  { source:34,  target:299, type:'influence' },  // Taberî → İbn Miskeveyh
  { source:299, target:18,  type:'influence' },  // İbn Miskeveyh → İbn Haldûn
  { source:18,  target:91,  type:'influence' },  // İbn Haldûn → Taşköprülüzâde
  { source:81,  target:87,  type:'influence' },  // İbn Kesîr → Süyûtî
  { source:67,  target:18,  type:'influence' },  // Mes'ûdî → İbn Haldûn
  { source:18,  target:300, type:'influence' },  // İbn Haldûn → Naîmâ
  { source:82,  target:87,  type:'influence' },  // Makrîzî → Süyûtî
  { source:278, target:81,  type:'influence' },  // İbn Asâkir → İbn Kesîr (Dımaşk)
  { source:279, target:254, type:'influence' },  // İbn Hallikân → Zehebî (biyografi)

  // EDEBİYAT — Yeni
  { source:22,  target:226, type:'influence' },  // Firdevsî → Nizâmî
  { source:226, target:228, type:'influence' },  // Nizâmî → Attâr
  { source:24,  target:86,  type:'influence' },  // Hâfız → Câmî
  { source:86,  target:26,  type:'influence' },  // Câmî → Ali Şîr Nevâî
  { source:27,  target:94,  type:'influence' },  // Fuzûlî → Bâkî
  { source:30,  target:29,  type:'influence' },  // Mütenebbî → Ebü'l-Alâ el-Maarrî
  { source:227, target:22,  type:'influence' },  // Rûdekî → Firdevsî
  { source:244, target:66,  type:'influence' },  // Câhız → İbn Kuteybe
  { source:199, target:26,  type:'influence' },  // Emîr Hüsrev → Nevâî

  // COĞRAFYA — Yeni
  { source:295, target:296, type:'influence' },  // İbn Havkal → Mukaddesî
  { source:16,  target:78,  type:'influence' },  // İdrîsî → Yâkūt el-Hamevî
  { source:297, target:298, type:'influence' },  // İbn Mâcid → Seydî Ali Reis
  { source:46,  target:298, type:'influence' },  // Pîrî Reis → Seydî Ali Reis

  // OSMANLI İLMİYE — Yeni
  { source:90,  target:178, type:'influence' },  // Ebüssuûd → Birgivî
  { source:92,  target:90,  type:'influence' },  // Kemâlpaşazâde → Ebüssuûd
  { source:85,  target:176, type:'influence' },  // Molla Fenarî → Molla Hüsrev
  { source:176, target:177, type:'influence' },  // Molla Hüsrev → Zenbilli Ali Efendi
  { source:91,  target:179, type:'influence' },  // Taşköprîzâde → Nev'î Efendi
  { source:96,  target:300, type:'influence' },  // Müneccimbaşı → Naîmâ (tarih yazımı)

  // HİNT ALT KITASI — Yeni
  { source:97,  target:202, type:'influence' },  // Şah Veliyullah → Nânotvî
  { source:201, target:97,  type:'influence' },  // Ahmed Sirhindî → Şah Veliyullah
  { source:102, target:100, type:'influence' },  // Afgānî → Abduh
  { source:100, target:101, type:'influence' },  // Abduh → Reşid Rıza
  { source:103, target:208, type:'influence' },  // İkbâl → Ebü'l-Kelâm Âzâd

  // ENDÜLÜS — Yeni
  { source:157, target:168, type:'influence' },  // İbn Hazm → İbn Bâcce
  { source:168, target:158, type:'influence' },  // İbn Bâcce → İbn Tufeyl
  { source:158, target:21,  type:'influence' },  // İbn Tufeyl → İbn Rüşd

  // ═══════════════════════════════════════════════════
  // İSNÂD BAĞLANTILARI (v4.8.7.0)
  // ═══════════════════════════════════════════════════

  // Zincir 1: Altın Zincir — İbn Ömer → Nâfi' → Mâlik
  { source:52,  target:306, type:'isnad' },
  { source:306, target:2,   type:'isnad' },

  // Zincir 2: Mâlik → Şâfiî → Ahmed
  { source:2,   target:3,   type:'isnad' },
  { source:3,   target:4,   type:'isnad' },

  // Zincir 3: İbn Abbâs → Amr b. Dînâr → Süfyân b. Uyeyne → Humeydî → Buhârî
  { source:303, target:313, type:'isnad' },
  { source:313, target:315, type:'isnad' },
  { source:315, target:324, type:'isnad' },
  { source:324, target:5,   type:'isnad' },

  // Zincir 4: Âişe → Urve → Zührî
  { source:110, target:307, type:'isnad' },
  { source:307, target:59,  type:'isnad' },

  // Zincir 5: İbn Mes'ûd → Alkame → İbrâhîm → Hammâd → Ebû Hanîfe
  { source:304, target:309, type:'isnad' },
  { source:309, target:61,  type:'isnad' },
  { source:61,  target:139, type:'isnad' },
  { source:139, target:1,   type:'isnad' },

  // Zincir 6: İbn Mes'ûd → Ebû Vâil → A'meş → Süfyân es-Sevrî
  { source:304, target:325, type:'isnad' },
  { source:325, target:317, type:'isnad' },
  { source:317, target:314, type:'isnad' },

  // Zincir 7: İbrâhîm → Mansûr → Süfyân es-Sevrî
  { source:61,  target:318, type:'isnad' },
  { source:318, target:314, type:'isnad' },

  // Zincir 8: Enes → Katâde → Şu'be
  { source:123, target:311, type:'isnad' },
  { source:311, target:316, type:'isnad' },

  // Zincir 9: İbn Ömer → Sâlim → Zührî → Mâlik
  { source:52,  target:310, type:'isnad' },
  { source:310, target:59,  type:'isnad' },
  { source:59,  target:2,   type:'isnad' },

  // Zincir 10: Ebû Hüreyre → Saîd b. Müseyyeb → Zührî → Mâlik
  { source:109, target:305, type:'isnad' },
  { source:305, target:59,  type:'isnad' },

  // EK İSNÂD BAĞLANTILARI
  { source:303, target:308, type:'isnad' },  // İbn Abbâs → İkrime
  { source:314, target:323, type:'isnad' },  // Süfyân es-Sevrî → Vekî'
  { source:323, target:4,   type:'isnad' },  // Vekî' → Ahmed b. Hanbel
  { source:59,  target:322, type:'isnad' },  // Zührî → Leys b. Sa'd
  { source:306, target:322, type:'isnad' },  // Nâfi' → Leys b. Sa'd
  { source:306, target:319, type:'isnad' },  // Nâfi' → Yahyâ b. Saîd
  { source:319, target:314, type:'isnad' },  // Yahyâ b. Saîd → Süfyân es-Sevrî
  { source:313, target:320, type:'isnad' },  // Amr b. Dînâr → İbn Cüreyc
  { source:321, target:314, type:'isnad' },  // İbn Mübârek ← Süfyân es-Sevrî
  { source:321, target:2,   type:'isnad' },  // İbn Mübârek ← Mâlik
  { source:307, target:312, type:'isnad' },  // Urve → Hişâm b. Urve (father→son)
  { source:315, target:3,   type:'isnad' },  // Süfyân b. Uyeyne → Şâfiî
  { source:315, target:4,   type:'isnad' },  // Süfyân b. Uyeyne → Ahmed
];
export default SCHOLAR_LINKS;
