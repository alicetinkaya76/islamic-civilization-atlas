# islamicatlas.org — Session 28 Prompt
# AI Chat Test & Deploy + Enhancements

## Previous Session (27) Summary
Built complete DİA AI Chat system — all code written, tested with 2 sample articles:
- ✅ HTML parser: 2 articles → 89 chunks (Abbas b. Firnâs: 1 chunk, Gazzâlî: 88 chunks, 6 sections)
- ✅ MiniSearch index builder
- ✅ Groq client, prompt builder, search engine, useAIChat hook
- ✅ AIChatPanel UI with floating button, slide-out panel, suggestions, sources
- ✅ CSS with dark/light theme, RTL, responsive
- ✅ App.jsx integration (lazy-loaded)
- ✅ package.json v6.6.0.0 + CHANGELOG

## REMAINING: Lokal Test Adımları

### Adım 1: Groq API Key Ayarla
```bash
# console.groq.com → API Keys → Create
# Key'i 4 parçaya böl ve src/config/ai.js'e yaz:
const _p = [
  'gsk_XXXX',   // ilk parça
  'YYYYYYYY',   // 2. parça
  'ZZZZZZZZ',   // 3. parça
  'WWWWWWWW'    // 4. parça
];
```

### Adım 2: DİA HTML → Chunks
```bash
cd islamic-dynasties-atlas

# Chunking çalıştır (~5-10 dk for 8,500 files)
python3 scripts/prepare_dia_chunks.py \
  --input "/Users/alicetinkaya/Desktop/huseyin/projects/digital_projects/project/dia_parser/v2/cache/html" \
  --output public/data/dia_chunks.json \
  --stats

# Boyut kontrol
ls -lh public/data/dia_chunks.json
# Hedef: < 80 MB ham, < 20 MB gzip
```

### Adım 3: MiniSearch Index
```bash
npm install minisearch  # zaten yapıldı ama emin ol

node scripts/build_search_index.js
# Bu 5 test araması yapar, sonuçlar görünmeli

ls -lh public/data/dia_search_index.json
# Hedef: < 30 MB ham, < 8 MB gzip
```

### Adım 4: Lokal Test
```bash
npm run dev
# http://localhost:5173 → sağ alttaki 🤖 butonuna tıkla
```

#### Test Senaryoları:
1. **Basit biyografi**: "İbn Sînâ kimdir?" → Cevap + kaynak
2. **Karşılaştırma**: "Gazzâlî ve İbn Rüşd tartışması" → İki kaynak
3. **Coğrafi**: "Bağdat'taki âlimler" → flyTo aksiyonu
4. **İngilizce**: "Who was al-Farabi?" → English response
5. **Arapça**: "من هو ابن سينا؟" → Arabic response
6. **Alakasız**: "Bitcoin fiyatı" → Kısa ret (API çağrısı yok)
7. **Limit**: 20 soru sor → limit mesajı
8. **Mobil**: DevTools → responsive → tam ekran panel
9. **Dark mode**: Tema değiştir → panel renkleri kontrol
10. **RTL**: Arapça'ya geç → panel sola kayar

### Adım 5: Boyut Optimizasyonu (gerekirse)
Eğer dia_chunks.json çok büyükse:
- Chunk size'ı 500→300 words'e düşür
- Bibliyografya bölümlerini tamamen çıkar (zaten çıkıyoruz)
- Literatür bölümlerini çıkar
- Yalnızca biyografi makalelerini dahil et (yer adı, kavram makaleleri hariç)

### Adım 6: Deploy
```bash
npm run build
# dist/ klasörünü kontrol et
# public/data/ içindeki JSON'lar dist/data/'ya kopyalandı mı?

git add -A
git commit -m "v6.6.0.0: DİA AI Assistant — client-side RAG + Groq LLM"
git tag v6.6.0.0
git push && git push --tags
```

---

## Session 28 Enhancement Ideas

### Öncelik 1: Cross-Source Compare
```
Kullanıcı: "İbn Sînâ hakkında kaynaklar ne diyor?"
→ DİA chunk + el-Aʿlâm biyografisi + EI-1 maddesi yan yana
→ "3 kaynak karşılaştırması" kartı
```

### Öncelik 2: Scholar Migration Animation
```
Kullanıcı: "İbn Battûta'nın seyahat rotası"
→ scholars_travel verisi → animasyonlu polyline
→ Tarih sıralı flyTo dizisi
```

### Öncelik 3: Chat History (localStorage)
- Son 5 sohbeti localStorage'da sakla
- "Önceki sohbetler" butonu
- Session arası devam

### Öncelik 4: Fallback Mode (LLM olmadan)
- Groq limiti aşılınca sadece MiniSearch sonuçları göster
- Yapılandırılmış veri kartları (tarih, alan, hocalar, eserler)
- API çağrısı gerektirmez

---

## Dosya Yapısı (Session 27 sonrası)
```
src/config/ai.js                    ← API key, model, limits
src/components/ai/
  AIChatPanel.jsx                   ← Main panel (floating button + chat)
  AIChatMessage.jsx                 ← Message bubble
  AIChatSuggestions.jsx             ← Example questions
  useAIChat.js                      ← Custom hook (state + API)
  groqClient.js                     ← Groq fetch wrapper
  searchEngine.js                   ← MiniSearch lazy-load + search
  promptBuilder.js                  ← System prompt + context assembly
src/styles/ai-chat.css              ← Full styling
scripts/
  prepare_dia_chunks.py             ← HTML → JSON chunks (run locally)
  build_search_index.js             ← Chunks → MiniSearch index (run locally)
public/data/
  dia_chunks.json                   ← HENÜZ OLUŞTURULMADI (lokal adım 2)
  dia_search_index.json             ← HENÜZ OLUŞTURULMADI (lokal adım 3)
```

## KNOWN ISSUE
- `src/config/ai.js` → API key placeholder — `REPLACE_WITH_YOUR_KEY`
- `public/data/dia_chunks.json` → MISSING — lokalde oluşturulacak
- `public/data/dia_search_index.json` → MISSING — lokalde oluşturulacak
