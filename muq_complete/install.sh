#!/bin/bash
set -e
SRC="muq_complete/repo_files"
echo "📐 Makdisî katmanı kuruluyor..."
mkdir -p src/components/muqaddasi
cp "$SRC/components/muqaddasi/"* src/components/muqaddasi/
cp "$SRC/shared/BottomTabBar.jsx" src/components/shared/
cp "$SRC/shared/AboutModal.jsx" src/components/shared/
cp "$SRC/dashboard/Dashboard.jsx" src/components/dashboard/
cp "$SRC/styles/muqaddasi.css" src/styles/
cp "$SRC/data/muqaddasi_atlas_layer.json" public/data/
cp "$SRC/data/muqaddasi_xref.json" public/data/
if git apply --check "$SRC/app_i18n.patch" 2>/dev/null; then
  git apply "$SRC/app_i18n.patch"
  echo "✅ App.jsx + i18n.js patch uygulandı"
else
  echo "⚠️  Patch uygulanamadı — manuel düzenleme gerekli (bkz. app_i18n.patch)"
fi
echo "✅ Kurulum tamamlandı → npm run dev → localhost:#muqaddasi"
