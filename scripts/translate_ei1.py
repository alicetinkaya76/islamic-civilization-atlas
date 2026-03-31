#!/usr/bin/env python3
"""
EI-1 Encyclopaedia of Islam — Batch Translation (EN → TR + AR)
Claude API ile short_description çevirisi

Kullanım:
  export ANTHROPIC_API_KEY=sk-ant-...
  python3 translate_ei1.py

Girdi: ei1_scholars.json (aynı dizinde)
Çıktı: ei1_scholars_tr_ar.json
"""

import json, os, sys, time, re

try:
    import anthropic
except ImportError:
    print("pip install anthropic --break-system-packages")
    sys.exit(1)

INPUT_FILE = "ei1_scholars.json"
OUTPUT_FILE = "ei1_scholars_tr_ar.json"
CHECKPOINT_FILE = "ei1_tr_ar_checkpoint.json"
BATCH_SIZE = 40
MODEL = "claude-sonnet-4-20250514"

# ── Field label translations ──
FIELD_TR = {
    'politics': 'siyaset', 'literature': 'edebiyat', 'history': 'tarih',
    'geography': 'coğrafya', 'mysticism': 'tasavvuf', 'jurisprudence': 'fıkıh',
    'hadith': 'hadis', 'medicine': 'tıp', 'theology': 'kelâm',
    'philosophy': 'felsefe', 'mathematics': 'matematik', 'astronomy': 'astronomi',
    'music': 'müzik', 'art': 'sanat', 'architecture': 'mimari',
    'science': 'bilim', 'education': 'eğitim', 'trade': 'ticaret',
    'agriculture': 'ziraat', 'military': 'askeriye', 'navigation': 'denizcilik',
    'linguistics': 'dilbilimi', 'quran': 'tefsir', 'law': 'hukuk',
    'grammar': 'nahiv', 'poetry': 'şiir', 'rhetoric': 'belâgat',
    'logic': 'mantık', 'chemistry': 'kimya', 'pharmacology': 'eczacılık',
    'calligraphy': 'hat', 'numismatics': 'nümismatik',
}
FIELD_AR = {
    'politics': 'سياسة', 'literature': 'أدب', 'history': 'تاريخ',
    'geography': 'جغرافيا', 'mysticism': 'تصوّف', 'jurisprudence': 'فقه',
    'hadith': 'حديث', 'medicine': 'طب', 'theology': 'كلام',
    'philosophy': 'فلسفة', 'mathematics': 'رياضيات', 'astronomy': 'فلك',
    'music': 'موسيقى', 'art': 'فن', 'architecture': 'عمارة',
    'science': 'علوم', 'education': 'تعليم', 'trade': 'تجارة',
    'agriculture': 'زراعة', 'military': 'عسكرية', 'navigation': 'ملاحة',
    'linguistics': 'لسانيات', 'quran': 'تفسير', 'law': 'قانون',
    'grammar': 'نحو', 'poetry': 'شعر', 'rhetoric': 'بلاغة',
    'logic': 'منطق', 'chemistry': 'كيمياء', 'pharmacology': 'صيدلة',
    'calligraphy': 'خط', 'numismatics': 'مسكوكات',
}
TYPE_TR = {
    'biography': 'Biyografi', 'place': 'Yer', 'concept': 'Kavram',
    'dynasty': 'Hanedan', 'unknown': 'Diğer', 'event': 'Olay',
    'tribe': 'Kabile', 'institution': 'Kurum', 'term': 'Terim',
}
TYPE_AR = {
    'biography': 'سيرة', 'place': 'مكان', 'concept': 'مفهوم',
    'dynasty': 'أسرة حاكمة', 'unknown': 'أخرى', 'event': 'حدث',
    'tribe': 'قبيلة', 'institution': 'مؤسسة', 'term': 'مصطلح',
}


def translate_batch(client, entries):
    """Translate a batch of entries EN → TR + AR using Claude API."""
    items = []
    for i, e in enumerate(entries):
        desc = e.get('short_description', '').strip()
        if not desc or len(desc) < 10:
            continue
        desc = re.sub(r'\n+', ' ', desc).strip()
        items.append({"idx": i, "headword": e.get("headword", ""), "desc": desc[:250]})

    if not items:
        return {}

    prompt = """Aşağıdaki İslam Ansiklopedisi (Brill EI-1, 1913–1936) madde özetlerini İngilizce'den hem Türkçe'ye hem Arapça'ya çevir.

Kurallar:
- Kısa ve akademik ansiklopedi üslubu
- Türkçe: Osmanlı/Türk transliterasyonu (Muhammad → Muhammed, Mecca → Mekke, caliph → halife, Abu Bakr → Ebû Bekir, Ibn → İbn, Baghdad → Bağdat, Damascus → Şam, Cairo → Kahire)
- Arapça: Standart fusha, İslami terimler aslıyla (محمد، مكة، خليفة، أبو بكر، ابن، بغداد، دمشق، القاهرة)
- Hicri tarihleri koru, miladi yıllardan sonra TR'de "M.", AR'de "م" ekle

SADECE JSON döndür, başka hiçbir şey yazma:
{"translations": {"0": {"tr": "türkçe...", "ar": "عربي..."}, "1": {"tr": "...", "ar": "..."}, ...}}

Maddeler:
"""
    for item in items:
        prompt += f'\n{item["idx"]}: [{item["headword"]}] {item["desc"]}'

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=8192,
            messages=[{"role": "user", "content": prompt}]
        )
        text = response.content[0].text.strip()
        if '```' in text:
            m = re.search(r'```(?:json)?\s*(.*?)```', text, re.DOTALL)
            text = m.group(1) if m else '{}'
        result = json.loads(text)
        tr_dict = result.get("translations", result)
        return {int(k): v for k, v in tr_dict.items()}
    except Exception as ex:
        print(f"  ⚠ API error: {ex}")
        return {}


def main():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ANTHROPIC_API_KEY environment variable gerekli!")
        print("   export ANTHROPIC_API_KEY=sk-ant-...")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"📚 {len(data)} madde yüklendi")

    # Load checkpoint
    translations = {}
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
            translations = json.load(f)
        print(f"♻️  Checkpoint: {len(translations)} çeviri mevcut")

    # Filter
    to_translate = []
    for i, e in enumerate(data):
        desc = e.get("short_description", "").strip()
        if desc and len(desc) > 20 and str(i) not in translations:
            to_translate.append((i, e))

    total_batches = (len(to_translate) + BATCH_SIZE - 1) // BATCH_SIZE
    print(f"🔄 Çevrilecek: {len(to_translate)} madde ({total_batches} batch)")
    print()

    for batch_num in range(total_batches):
        start = batch_num * BATCH_SIZE
        batch = to_translate[start:start + BATCH_SIZE]
        indices = [idx for idx, _ in batch]
        entries = [e for _, e in batch]

        print(f"  Batch {batch_num+1}/{total_batches} ({len(batch)} madde)...", end=" ", flush=True)
        t0 = time.time()
        result = translate_batch(client, entries)
        elapsed = time.time() - t0

        for local_idx, tr_obj in result.items():
            global_idx = indices[local_idx]
            translations[str(global_idx)] = tr_obj

        print(f"✓ {len(result)} çeviri ({elapsed:.1f}s)")

        # Checkpoint every 5 batches
        if (batch_num + 1) % 5 == 0 or batch_num == total_batches - 1:
            with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
                json.dump(translations, f, ensure_ascii=False, indent=1)
            print(f"  💾 Checkpoint ({len(translations)} toplam)")

        if elapsed < 2:
            time.sleep(2 - elapsed)

    # ── Apply ──
    print(f"\n📝 Çeviriler uygulanıyor...")
    tr_count = ar_count = 0
    for i, entry in enumerate(data):
        # Field labels
        if entry.get("fields"):
            entry["fields_tr"] = [FIELD_TR.get(f, f) for f in entry["fields"]]
            entry["fields_ar"] = [FIELD_AR.get(f, f) for f in entry["fields"]]
        # Article type
        if entry.get("article_type"):
            entry["article_type_tr"] = TYPE_TR.get(entry["article_type"], entry["article_type"])
            entry["article_type_ar"] = TYPE_AR.get(entry["article_type"], entry["article_type"])
        # Description TR + AR
        t = translations.get(str(i))
        if t:
            if isinstance(t, dict):
                if t.get("tr"):
                    entry["short_description_tr"] = t["tr"]
                    tr_count += 1
                if t.get("ar"):
                    entry["short_description_ar"] = t["ar"]
                    ar_count += 1
            elif isinstance(t, str):
                entry["short_description_tr"] = t
                tr_count += 1

    print(f"✅ TR: {tr_count} | AR: {ar_count} açıklama çevrildi")
    print(f"✅ {sum(1 for e in data if e.get('fields_tr'))} alan etiketi (TR+AR)")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)

    size_mb = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)
    print(f"📁 Çıktı: {OUTPUT_FILE} ({size_mb:.1f} MB)")

    if os.path.exists(CHECKPOINT_FILE):
        os.remove(CHECKPOINT_FILE)
    print("\n🎉 Tamamlandı!")


if __name__ == "__main__":
    main()
