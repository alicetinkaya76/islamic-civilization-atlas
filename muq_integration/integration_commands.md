# Makdisî Katmanı — islamicatlas.org Entegrasyon Komutları
# ══════════════════════════════════════════════════════════
# Tüm komutları sırasıyla terminalde çalıştırın.
# Repo: ~/Desktop/huseyin/projects/digital_projects/project/islamic_dynasties_atlas/islamic-dynasties-atlas

REPO=~/Desktop/huseyin/projects/digital_projects/project/islamic_dynasties_atlas/islamic-dynasties-atlas
cd "$REPO"

# ─────────────────────────────────────────────────────────
# ADIM 1: Yeni branch oluştur
# ─────────────────────────────────────────────────────────
git checkout -b feature/muqaddasi-layer

# ─────────────────────────────────────────────────────────
# ADIM 2: Claude'dan indirilen zip'i aç (Downloads'a kaydettiğini varsayıyorum)
# ─────────────────────────────────────────────────────────
# Faz 5 zip'inden muqaddasi_atlas_layer_v5.0.json lazım.
# Eğer Downloads'teyse:
# unzip -o ~/Downloads/muqaddasi_faz5_output.zip -d /tmp/muq_faz5/

# ─────────────────────────────────────────────────────────
# ADIM 3: Bu oturumdan çıkan entegrasyon dosyalarını kopyala
#   - Claude çıktısındaki dosyaları indirdikten sonra yollarını ayarla
#   - Aşağıdaki dosyalar bu oturumda oluşturuldu:
# ─────────────────────────────────────────────────────────

# 3a. Veri dosyası → public/data/
# (Bu dosya Claude'un bu oturumunda atlas-compatible formata dönüştürüldü)
# cp /tmp/muq_integration/muqaddasi_atlas_layer.json "$REPO/public/data/"

# 3b. Bileşen dosyaları → src/components/muqaddasi/
mkdir -p "$REPO/src/components/muqaddasi"
# cp constants.js MuqaddasiMap.jsx MuqaddasiSidebar.jsx MuqaddasiIdCard.jsx MuqaddasiView.jsx "$REPO/src/components/muqaddasi/"

# 3c. CSS → src/styles/
# cp muqaddasi.css "$REPO/src/styles/"

# ─────────────────────────────────────────────────────────
# ADIM 4: App.jsx patch'leri (Manuel)
# ─────────────────────────────────────────────────────────

# 4a. Lazy import ekle (EvliyaView satırının altına):
#   const MuqaddasiView = lazy(() => import('./components/muqaddasi/MuqaddasiView'));

# 4b. VALID_TABS dizisine 'muqaddasi' ekle:
#   'evliya', 'muqaddasi', 'admin'

# 4c. Tab menü entries'e ekle (evliya satırının altına):
#   { id: 'muqaddasi', label: t.tabs.muqaddasi || '📐 Makdisî', badge: '2,049', preload: '/data/muqaddasi_atlas_layer.json' },

# 4d. Tab button ekle (evliya button'unun altına):
#   <button role="tab" aria-selected={tab === 'muqaddasi'} className={`tab${tab === 'muqaddasi' ? ' active' : ''}`} onClick={() => selectTab('muqaddasi')} onMouseEnter={() => preloadData('/data/muqaddasi_atlas_layer.json')}>{"📐 " + (t.tabs.muqaddasi || "Makdisî")}</button>

# 4e. Render case ekle (science satırının altına):
#   tab === 'muqaddasi' ? <MuqaddasiView lang={lang} t={t} initialSearch={hashParams.search} /> :

# ─────────────────────────────────────────────────────────
# ADIM 5: i18n.js tab label'ları (3 dilde)
# ─────────────────────────────────────────────────────────

# TR tabs objesine ekle: muqaddasi: "📐 Makdisî"
# EN tabs objesine ekle: muqaddasi: '📐 al-Muqaddasī'
# AR tabs objesine ekle: muqaddasi: '📐 المقدسي'

# ─────────────────────────────────────────────────────────
# ADIM 6: Test et
# ─────────────────────────────────────────────────────────
cd "$REPO"
npm run dev
# Tarayıcıda http://localhost:5173/#muqaddasi aç

# ─────────────────────────────────────────────────────────
# ADIM 7: Commit & push
# ─────────────────────────────────────────────────────────
git add -A
git commit -m "feat: add Muqaddasi layer (2,049 places, 1,427 routes, 14 iqlim)

- MuqaddasiView/Map/Sidebar/IdCard components
- public/data/muqaddasi_atlas_layer.json (1 MB)
- Iqlim color-coded markers with certainty opacity
- Route visualization with dash styles
- TR/EN/AR i18n support
- Mobile responsive layout"

git push -u origin feature/muqaddasi-layer

# ─────────────────────────────────────────────────────────
# ADIM 8: GitHub Pages deploy (eğer otomatik değilse)
# ─────────────────────────────────────────────────────────
# npm run build
# npx gh-pages -d dist
