#!/bin/bash
# Yeni oturuma yüklenecek dosyaları topla
cd ~/Desktop/huseyin/projects/digital_projects/project/islamic_dynasties_atlas/islamic-dynasties-atlas

mkdir -p /tmp/next_session_files

# Tema & genel
cp src/styles/theme.css           /tmp/next_session_files/
cp src/styles/base.css            /tmp/next_session_files/
cp src/styles/mobile.css          /tmp/next_session_files/

# Footer
cp src/components/shared/Footer.jsx /tmp/next_session_files/
cp src/styles/footer.css          /tmp/next_session_files/

# App.jsx (routing + hash parse)
cp src/App.jsx                    /tmp/next_session_files/

# Kaynak view'ler
cp src/components/alam/AlamView.jsx     /tmp/next_session_files/
cp src/components/yaqut/YaqutView.jsx   /tmp/next_session_files/
cp src/components/dia/DiaView.jsx       /tmp/next_session_files/
cp src/components/ei1/Ei1View.jsx       /tmp/next_session_files/
cp src/components/rihla/RihlaView.jsx   /tmp/next_session_files/
cp src/components/khitat/KhitatView.jsx /tmp/next_session_files/
cp src/components/lestrange/LeStrangeView.jsx /tmp/next_session_files/
cp src/components/darpislam/DarpView.jsx /tmp/next_session_files/

# Kaynak CSS'leri
cp src/styles/alam.css            /tmp/next_session_files/
cp src/styles/yaqut.css           /tmp/next_session_files/
cp src/styles/dia.css             /tmp/next_session_files/
cp src/styles/ei1.css             /tmp/next_session_files/
cp src/styles/rihla.css           /tmp/next_session_files/
cp src/styles/khitat.css          /tmp/next_session_files/
cp src/styles/lestrange.css       /tmp/next_session_files/
cp src/styles/darpislam.css       /tmp/next_session_files/

# CityAtlas
cp src/components/CityAtlas/CityAtlasDetail.jsx /tmp/next_session_files/
cp src/components/CityAtlas/CityAtlasView.jsx   /tmp/next_session_files/
cp src/styles/cityAtlas.css       /tmp/next_session_files/

# ZIP
cd /tmp/next_session_files
zip -r ~/Desktop/next_session_theme_footer_search.zip .

echo ""
echo "════════════════════════════════════════"
echo "  DOSYALAR TOPLANDI"
echo "════════════════════════════════════════"
echo ""
ls -la /tmp/next_session_files/ | wc -l
echo "dosya"
echo ""
echo "ZIP: ~/Desktop/next_session_theme_footer_search.zip"
echo ""
echo "Yeni oturuma şu 2 dosyayı yükle:"
echo "  1. ~/Desktop/next_session_theme_footer_search.zip"
echo "  2. next-session-prompt-theme-footer-search.md (outputs'tan indir)"
echo "════════════════════════════════════════"
