#!/bin/bash
# ──────────────────────────────────────────────
# patch_detail_multilingual.sh
# CityAtlasDetail.jsx'i çeviri sonrası günceller
# Çalıştır: bash patch_detail_multilingual.sh
# ──────────────────────────────────────────────

FILE="src/components/CityAtlas/CityAtlasDetail.jsx"

echo "🔧 Patching $FILE for multilingual content..."

# ── 1. Multilingual helper fonksiyonu ekle (onClose }) satırından sonra)
sed -i '' '/const catCfg = city.categories/i\
  // ── Multilingual content helper ──\
  const ml = (fieldBase, record) => {\
    if (lang === "en") return record[fieldBase + "_en"] || record[fieldBase] || "";\
    if (lang === "ar") return record[fieldBase + "_ar"] || record[fieldBase] || "";\
    return record[fieldBase] || "";\
  };\
  const mlNested = (obj, field) => {\
    if (!obj) return null;\
    if (lang === "en") return obj[field + "_en"] || obj[field];\
    if (lang === "ar") return obj[field + "_ar"] || obj[field];\
    return obj[field];\
  };\

' "$FILE"

# ── 2. description_tr → multilingual
sed -i '' 's/{r\.location\.description_tr}/{mlNested(r.location, "description_tr") || r.location.description_tr}/g' "$FILE"

# ── 3. mahalle → multilingual
sed -i '' 's/{r\.location\.mahalle}/{mlNested(r.location, "mahalle") || r.location.mahalle}/g' "$FILE"

# ── 4. konyali_notes → multilingual
sed -i '' 's/{r\.konyali_notes}/{ml("konyali_notes", r)}/g' "$FILE"

# ── 5. architecture fields → multilingual
sed -i '' 's/{r\.architecture\.materials\.join/''{(mlNested(r.architecture, "materials") || r.architecture.materials).join/g' "$FILE"
sed -i '' 's/{r\.architecture\.features\.join/''{(mlNested(r.architecture, "features") || r.architecture.features).join/g' "$FILE"
sed -i '' 's/{r\.architecture\.roof_type}/{mlNested(r.architecture, "roof_type") || r.architecture.roof_type}/g' "$FILE"
sed -i '' 's/{r\.architecture\.plan_type}/{mlNested(r.architecture, "plan_type") || r.architecture.plan_type}/g' "$FILE"

# ── 6. patron fields → multilingual
sed -i '' 's/{r\.patron\.notes}/{mlNested(r.patron, "notes") || r.patron.notes}/g' "$FILE"
sed -i '' 's/{r\.patron\.title}/{mlNested(r.patron, "title") || r.patron.title}/g' "$FILE"

# ── 7. vakfiye summary → multilingual
sed -i '' 's/{r\.vakfiye\.summary}/{mlNested(r.vakfiye, "summary") || r.vakfiye.summary}/g' "$FILE"

echo "✅ Patched! Multilingual content fields now active."
echo ""
echo "📋 Fields updated:"
echo "  • location.description → description_en / description_ar"
echo "  • location.mahalle → mahalle_en / mahalle_ar"
echo "  • konyali_notes → konyali_notes_en / konyali_notes_ar"
echo "  • architecture.materials/features/roof_type/plan_type"
echo "  • patron.title/notes"
echo "  • vakfiye.summary"
