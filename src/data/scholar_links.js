/**
 * Scholar relationship links (teacher-student, influence, debate).
 * All IDs correspond to db.json scholars array.
 * v4.2.0 — covers existing 49 scholars; new scholars (50+) to be linked in future sessions.
 */
const SCHOLAR_LINKS = [
  // Fıkıh silsilesi
  { source:1, target:42, type:'influence' },   // Ebû Hanîfe → Mâtürîdî
  { source:2, target:3,  type:'teacher' },     // Mâlik → Şâfiî
  { source:3, target:4,  type:'teacher' },     // Şâfiî → Ahmed b. Hanbel
  { source:4, target:8,  type:'influence' },   // Ahmed b. Hanbel → İbn Teymiyye
  // Hadis silsilesi
  { source:5, target:45, type:'influence' },   // Buhârî → İbn Hacer
  { source:5, target:6,  type:'influence' },   // Buhârî → Müslim (çağdaş)
  { source:41, target:5, type:'influence' },   // İbn Mâce — Buhârî (çağdaş, aynı ağ)
  // Kelam / Felsefe silsilesi
  { source:19, target:20, type:'teacher' },    // Kindî → Fârâbî
  { source:20, target:10, type:'teacher' },    // Fârâbî → İbn Sînâ
  { source:10, target:21, type:'influence' },  // İbn Sînâ → İbn Rüşd
  { source:43, target:7,  type:'influence' },  // Eş'arî → Gazâlî (silsile)
  { source:7,  target:21, type:'debate' },     // Gazâlî → İbn Rüşd (Tehâfüt-Tehâfütü't-Tehâfüt)
  { source:10, target:7,  type:'influence' },  // İbn Sînâ → Gazâlî
  { source:12, target:10, type:'debate' },     // Bîrûnî ↔ İbn Sînâ (yazışmalar)
  // Tıp silsilesi
  { source:13, target:39, type:'influence' },  // Câbir → Râzî
  { source:39, target:10, type:'influence' },  // Râzî → İbn Sînâ
  { source:10, target:49, type:'influence' },  // İbn Sînâ → İbn Nefîs
  { source:39, target:40, type:'influence' },  // Râzî → İbn Zuhr
  { source:40, target:21, type:'influence' },  // İbn Zuhr → İbn Rüşd (işbirliği)
  // Tarih silsilesi
  { source:44, target:34, type:'influence' },  // İbn Hişâm → Taberî
  { source:34, target:18, type:'influence' },  // Taberî → İbn Haldûn
  { source:18, target:47, type:'influence' },  // İbn Haldûn → Kâtip Çelebi
  { source:35, target:48, type:'influence' },  // İbn Battûta → Evliyâ Çelebi
  { source:46, target:47, type:'influence' },  // Pîrî Reis → Kâtip Çelebi
  // Tasavvuf silsilesi
  { source:31, target:23, type:'influence' },  // İbn Arabî → Mevlânâ (çağdaş etki)
  { source:33, target:28, type:'teacher' },    // Hacı Bektâş → Yûnus Emre
  { source:23, target:27, type:'influence' },  // Mevlânâ → Fuzûlî (edebî etki)
  // Edebiyat silsilesi
  { source:22, target:25, type:'influence' },  // Firdevsî → Sa'dî
  { source:25, target:24, type:'influence' },  // Sa'dî → Hâfız
  { source:24, target:27, type:'influence' },  // Hâfız → Fuzûlî
  { source:26, target:27, type:'influence' },  // Ali Şîr Nevâî → Fuzûlî
  // Hat silsilesi
  { source:38, target:36, type:'influence' },  // Yâkūt el-Müsta'sımî → Mimar Sinan dönemine etki
  // Astronomi silsilesi
  { source:9,  target:17, type:'influence' },  // Hârizmî → Ömer Hayyâm
  { source:14, target:12, type:'influence' },  // Nasîrüddîn Tûsî → Bîrûnî (kronoloji ters ama etki var)
];
export default SCHOLAR_LINKS;
