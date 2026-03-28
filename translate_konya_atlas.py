#!/usr/bin/env python3
"""
Konya Atlas — Batch Translation Script (TR → EN + AR)
Uses Claude API to translate all Turkish content fields.

Usage:
  export ANTHROPIC_API_KEY="sk-ant-..."
  python3 translate_konya_atlas.py

Input:  konya.json (219 records)
Output: konya_translated.json

Estimated cost: ~$3-5 (Sonnet, ~219 records in ~22 batches of 10)
"""

import json
import os
import sys
import time
import re
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("❌ pip install anthropic")
    print("   pip install anthropic --break-system-packages")
    sys.exit(1)

# ── Config ──
INPUT_FILE = "konya.json"
OUTPUT_FILE = "konya_translated.json"
CHECKPOINT_FILE = "konya_translation_checkpoint.json"
BATCH_SIZE = 5  # records per API call
MODEL = "claude-sonnet-4-20250514"
MAX_RETRIES = 3

# ── Fields to translate ──
# Each tuple: (json_path, target_en_key, target_ar_key)
TRANSLATABLE_FIELDS = [
    # Location
    ("location.description_tr", "location.description_en", "location.description_ar"),
    ("location.mahalle", "location.mahalle_en", "location.mahalle_ar"),
    # Architecture
    ("architecture.roof_type", "architecture.roof_type_en", "architecture.roof_type_ar"),
    ("architecture.plan_type", "architecture.plan_type_en", "architecture.plan_type_ar"),
    ("architecture.materials", "architecture.materials_en", "architecture.materials_ar"),  # list
    ("architecture.features", "architecture.features_en", "architecture.features_ar"),    # list
    # Patron
    ("patron.title", "patron.title_en", "patron.title_ar"),
    ("patron.notes", "patron.notes_en", "patron.notes_ar"),
    # Vakfiye
    ("vakfiye.summary", "vakfiye.summary_en", "vakfiye.summary_ar"),
    # Top-level
    ("konyali_notes", "konyali_notes_en", "konyali_notes_ar"),
]


def get_nested(obj, path):
    """Get value from nested dict using dot path."""
    parts = path.split(".")
    current = obj
    for p in parts:
        if current is None:
            return None
        if isinstance(current, dict):
            current = current.get(p)
        else:
            return None
    return current


def set_nested(obj, path, value):
    """Set value in nested dict using dot path."""
    parts = path.split(".")
    current = obj
    for p in parts[:-1]:
        if p not in current:
            current[p] = {}
        current = current[p]
    current[parts[-1]] = value


def extract_translatable(record):
    """Extract all non-empty Turkish text fields from a record."""
    texts = {}
    for src_path, _, _ in TRANSLATABLE_FIELDS:
        val = get_nested(record, src_path)
        if val:
            if isinstance(val, list) and len(val) > 0:
                texts[src_path] = val
            elif isinstance(val, str) and val.strip():
                texts[src_path] = val.strip()
    return texts


def build_prompt(batch_texts):
    """Build translation prompt for a batch of records."""
    prompt = """You are a professional translator specializing in Islamic architectural history, Ottoman/Seljuk heritage, and Turkish historical terminology.

Translate the following Turkish texts to BOTH English (EN) and Arabic (AR).

RULES:
1. Preserve proper nouns (personal names, dynasty names, place names) — transliterate, don't translate
2. For architectural terms, use standard English/Arabic equivalents:
   - kubbe → dome / قبة
   - tuğla → brick / طوب
   - taş → stone / حجر
   - alçı → plaster / جص
   - çini → tile / بلاط
   - mermer → marble / رخام
   - kesme taş → cut stone / حجر منحوت
   - minare → minaret / مئذنة
   - mihrap → mihrab / محراب
   - minber → minbar / منبر
   - son cemaat yeri → portico / رواق
   - avlu → courtyard / فناء
   - türbe → tomb / تربة
   - medrese → madrasa / مدرسة
   - vakıf → waqf / وقف
   - zaviye → zawiya / زاوية
   - tekke → dervish lodge / تكية
   - hamam → bathhouse / حمّام
   - han → caravanserai / خان
   - çeşme → fountain / سبيل
   - sarnıç → cistern / صهريج
   - köprü → bridge / جسر
   - imaret → soup kitchen / عمارة
   - istalaktit → muqarnas / مقرنصات
   - kitabe → inscription / نقش
   - vakfiye → endowment deed / وقفية
3. For lists (materials, features), translate each item
4. Keep translations concise — don't add explanations
5. For mahalle names, transliterate (don't translate)
6. Ottoman Turkish terms in parentheses can be kept as-is

RESPOND ONLY WITH VALID JSON — no markdown, no backticks, no preamble.

Input format:
{
  "record_id": {
    "field_path": "Turkish text or list"
  }
}

Output format:
{
  "record_id": {
    "field_path": {
      "en": "English translation",
      "ar": "Arabic translation"
    }
  }
}

INPUT:
"""
    prompt += json.dumps(batch_texts, ensure_ascii=False, indent=2)
    return prompt


def translate_batch(client, batch_texts, attempt=1):
    """Send a batch to Claude API and parse response."""
    prompt = build_prompt(batch_texts)

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=8000,
            temperature=0,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text.strip()

        # Clean potential markdown fences
        text = re.sub(r'^```json\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
        text = text.strip()

        result = json.loads(text)
        return result

    except json.JSONDecodeError as e:
        print(f"  ⚠️ JSON parse error (attempt {attempt}): {e}")
        if attempt < MAX_RETRIES:
            time.sleep(2)
            return translate_batch(client, batch_texts, attempt + 1)
        print(f"  ❌ Failed after {MAX_RETRIES} attempts. Raw response:")
        print(text[:500])
        return None

    except Exception as e:
        print(f"  ⚠️ API error (attempt {attempt}): {e}")
        if attempt < MAX_RETRIES:
            time.sleep(5 * attempt)
            return translate_batch(client, batch_texts, attempt + 1)
        return None


def apply_translations(records, translations):
    """Apply translated texts back to records."""
    applied = 0
    for record in records:
        rid = record["id"]
        if rid not in translations:
            continue

        tr = translations[rid]
        for src_path, en_path, ar_path in TRANSLATABLE_FIELDS:
            if src_path in tr:
                val = tr[src_path]
                if isinstance(val, dict) and "en" in val and "ar" in val:
                    set_nested(record, en_path, val["en"])
                    set_nested(record, ar_path, val["ar"])
                    applied += 1

    return applied


def load_checkpoint():
    """Load checkpoint of already-translated record IDs."""
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE, "r") as f:
            return json.load(f)
    return {"translated_ids": [], "translations": {}}


def save_checkpoint(checkpoint):
    """Save checkpoint."""
    with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
        json.dump(checkpoint, f, ensure_ascii=False)


def main():
    # ── Check API key ──
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ Set ANTHROPIC_API_KEY environment variable")
        print("   export ANTHROPIC_API_KEY='sk-ant-...'")
        sys.exit(1)

    # ── Load data ──
    if not os.path.exists(INPUT_FILE):
        print(f"❌ {INPUT_FILE} not found")
        print(f"   Copy konya.json to current directory")
        sys.exit(1)

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        records = json.load(f)

    print(f"📂 Loaded {len(records)} records from {INPUT_FILE}")

    # ── Load checkpoint ──
    checkpoint = load_checkpoint()
    done_ids = set(checkpoint["translated_ids"])
    all_translations = checkpoint["translations"]
    print(f"📌 Checkpoint: {len(done_ids)} already translated")

    # ── Extract texts to translate ──
    to_translate = {}
    for r in records:
        if r["id"] in done_ids:
            continue
        texts = extract_translatable(r)
        if texts:
            to_translate[r["id"]] = texts

    print(f"📝 {len(to_translate)} records need translation")

    if len(to_translate) == 0:
        print("✅ All records already translated!")
        # Apply and save
        apply_translations(records, all_translations)
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False, indent=2)
        print(f"💾 Saved {OUTPUT_FILE}")
        return

    # ── Initialize client ──
    client = anthropic.Anthropic(api_key=api_key)

    # ── Batch and translate ──
    ids = list(to_translate.keys())
    total_batches = (len(ids) + BATCH_SIZE - 1) // BATCH_SIZE
    total_applied = 0

    for i in range(0, len(ids), BATCH_SIZE):
        batch_ids = ids[i:i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        batch_texts = {rid: to_translate[rid] for rid in batch_ids}

        print(f"\n🔄 Batch {batch_num}/{total_batches} ({len(batch_ids)} records: {', '.join(batch_ids[:3])}{'...' if len(batch_ids) > 3 else ''})")

        result = translate_batch(client, batch_texts)

        if result:
            all_translations.update(result)
            for rid in batch_ids:
                done_ids.add(rid)

            # Save checkpoint
            checkpoint["translated_ids"] = list(done_ids)
            checkpoint["translations"] = all_translations
            save_checkpoint(checkpoint)

            translated_count = sum(1 for rid in batch_ids if rid in result)
            print(f"  ✅ {translated_count}/{len(batch_ids)} translated")
            total_applied += translated_count
        else:
            print(f"  ❌ Batch failed — will retry on next run")

        # Rate limit pause
        if i + BATCH_SIZE < len(ids):
            time.sleep(1)

    # ── Apply all translations ──
    print(f"\n📊 Applying translations...")
    field_count = apply_translations(records, all_translations)
    print(f"  Applied {field_count} field translations across {total_applied} records")

    # ── Stats ──
    stats = {"has_en_desc": 0, "has_ar_desc": 0, "has_en_notes": 0, "has_ar_notes": 0}
    for r in records:
        if get_nested(r, "location.description_en"):
            stats["has_en_desc"] += 1
        if get_nested(r, "location.description_ar"):
            stats["has_ar_desc"] += 1
        if r.get("konyali_notes_en"):
            stats["has_en_notes"] += 1
        if r.get("konyali_notes_ar"):
            stats["has_ar_notes"] += 1

    print(f"\n📊 Coverage:")
    print(f"  EN descriptions: {stats['has_en_desc']}/{len(records)}")
    print(f"  AR descriptions: {stats['has_ar_desc']}/{len(records)}")
    print(f"  EN notes: {stats['has_en_notes']}/{len(records)}")
    print(f"  AR notes: {stats['has_ar_notes']}/{len(records)}")

    # ── Save ──
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    size_kb = os.path.getsize(OUTPUT_FILE) / 1024
    print(f"\n💾 Saved {OUTPUT_FILE} ({size_kb:.0f} KB)")
    print(f"✅ Done! {len(done_ids)}/{len(records)} records translated")

    # ── Cleanup hint ──
    print(f"\n📋 Next steps:")
    print(f"  1. Review {OUTPUT_FILE}")
    print(f"  2. cp {OUTPUT_FILE} public/data/city-atlas/konya.json")
    print(f"  3. Update CityAtlasDetail.jsx to use _en/_ar fields")
    print(f"  4. rm {CHECKPOINT_FILE}")


if __name__ == "__main__":
    main()
