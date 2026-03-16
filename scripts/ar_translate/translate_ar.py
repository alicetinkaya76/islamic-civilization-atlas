#!/usr/bin/env python3
"""
translate_ar.py — Arapça içerik üretim orkestratörü
Islamic Dynasties Atlas v5.2.0.0 → v5.3.0.0

Kullanım:
  python translate_ar.py --tier 1 --entity dynasties [--dry-run] [--batch-size 50]
  python translate_ar.py --tier 1 --all
  python translate_ar.py --tier 2 --target i18n
  python translate_ar.py --tier 3 --entity scholars --batch-size 10
  python translate_ar.py --tier 4 --all
  python translate_ar.py --validate
  python translate_ar.py --stats

Gereksinimler:
  pip install anthropic
  export ANTHROPIC_API_KEY=sk-ant-...

Tier 1: İsimler (ar alanı)
Tier 2: UI stringleri (i18n, glossary, era_info, tours, meta dosyaları)
Tier 3: Anlatılar (narr_ar, key_ar, rise_ar, fall_ar, ctx_b_ar, ctx_a_ar, ...)
Tier 4: Kalan (causal dar, short fields)
"""

import json, os, sys, time, argparse, csv, re, copy
from pathlib import Path
from datetime import datetime

# ─── Paths ───────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
SRC_DATA = PROJECT_ROOT / "src" / "data"
DATA_DIR = PROJECT_ROOT / "data"
DB_PATH = SRC_DATA / "db.json"
PROGRESS_FILE = SCRIPT_DIR / "ar_translation_progress.json"
BACKUP_DIR = SCRIPT_DIR / "backups"

# ─── API Config ──────────────────────────────────────────────────────
MODEL = "claude-sonnet-4-20250514"
MAX_TOKENS = 8192
MAX_TOKENS_NARRATIVE = 16384

SYSTEM_PROMPT = """Sen İslam tarihi konusunda uzman bir Arapça yazarsın. Verilen metinleri (Türkçe veya İngilizce kaynak) Arapça'ya çeviriyorsun.

KURALLAR:
1. Klasik İslam tarih yazıcılığı (تأريخ) üslubunu kullan
2. Modern Standart Arapça (فصحى) ile yaz
3. İslami ıstılahları (اصطلاحات) doğru kullan:
   - خليفة (halife), أمير المؤمنين (emirü'l-mü'minin)
   - سلطان, أمير, وزير, قاضي
   - فتوح (fetihler), جهاد, غزوة, معركة
   - مذهب (mezhep), فقه (fıkıh), حديث, تفسير
4. Özel isimler ve yer adları için standart Arapça imlâ kullan:
   - بغداد (Bağdat), دمشق (Şam), القاهرة (Kahire)
   - الأمويون (Emevîler), العباسيون (Abbâsîler)
5. Harekeler (تشكيل) KULLANMA — harekesiz düz metin
6. Çeviri değil, yeniden yazım yap — Arapça okuyucu için doğal akışlı olsun
7. Kaynak metindeki bilgi doğruluğunu koru, ekleme/çıkarma yapma
8. Her metin karşılığı source ile aynı uzunluk aralığında olsun (±%30)

STANDART TERİMLER:
خلافة (hilafet) | سلطنة (saltanat) | إمارة (emirlik) | مذهب (mezhep)
غزوة (gazve) | معركة (muharebe) | فتح (fetih) | حصار (kuşatma)
مدرسة (medrese) | مسجد (cami) | قصر (saray) | قلعة (kale)
وقف (vakıf) | ديوان (divan) | وزير (vezir) | قاضي (kadı)

DÖNEM İSİMLERİ:
الخلفاء الراشدون | الأمويون | العباسيون | السلاجقة | الأيوبيون | المماليك | العثمانيون

COĞRAFYA:
بغداد | دمشق | القاهرة | قرطبة | سمرقند | بلاد الشام | العراق | خراسان | ما وراء النهر | المغرب | الأندلس | مصر | الحجاز

ÇIKTI FORMATI:
Giriş JSON dizisi verilecek. Çıktı olarak aynı yapıda JSON dizisi döndür.
JSON dışında hiçbir şey yazma — ne açıklama ne preamble."""

# ─── Entity field maps ───────────────────────────────────────────────
NARRATIVE_FIELDS = {
    "dynasties": ["narr", "key", "rise", "fall", "ctx_b", "ctx_a"],
    "battles":   ["narr", "impact", "tactic"],
    "events":    ["narr", "sig"],
    "scholars":  ["narr", "chain", "patron"],
    "monuments": ["narr", "arch", "visitor"],
    "cities":    ["narr", "role", "founded"],
    "routes":    ["narr", "econ"],
    "madrasas":  ["narr", "desc"],
    "diplomacy": ["narr"],
}

SHORT_FIELDS = {
    "scholars":  ["city", "disc"],
    "monuments": ["type", "city"],
    "routes":    ["type", "goods"],
    "madrasas":  ["type", "city", "founder", "dynasty", "fields", "status"],
}

# ─── Utilities ───────────────────────────────────────────────────────

def load_db():
    with open(DB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def save_db(db):
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)
    print(f"  ✓ db.json saved ({DB_PATH})")

def backup_db(label):
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    dest = BACKUP_DIR / f"db_{label}_{ts}.json"
    import shutil
    shutil.copy2(DB_PATH, dest)
    print(f"  ✓ Backup: {dest.name}")

def load_progress():
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE) as f:
            return json.load(f)
    return {}

def save_progress(progress):
    with open(PROGRESS_FILE, "w") as f:
        json.dump(progress, f, indent=2)

def should_skip(progress, tier, entity, batch_num):
    key = f"{tier}:{entity}"
    return progress.get(key, {}).get("last_batch", -1) >= batch_num

def mark_done(progress, tier, entity, batch_num, count):
    key = f"{tier}:{entity}"
    if key not in progress:
        progress[key] = {"last_batch": -1, "total_translated": 0, "started": time.time()}
    progress[key]["last_batch"] = batch_num
    progress[key]["total_translated"] += count
    progress[key]["timestamp"] = time.time()
    save_progress(progress)

# ─── API Calls ───────────────────────────────────────────────────────

def get_client():
    from anthropic import Anthropic
    return Anthropic()

def repair_truncated_json(text):
    """Kesilmiş JSON çıktısını kurtarmaya çalış"""
    text = text.strip()
    # Strip markdown fences
    if text.startswith("```"):
        first_nl = text.find("\n")
        if first_nl > 0:
            text = text[first_nl+1:]
        last_fence = text.rfind("```")
        if last_fence > 0:
            text = text[:last_fence]
        text = text.strip()
    
    # Try direct parse first
    try:
        result = json.loads(text)
        if isinstance(result, list):
            return {"items": result}
        return result
    except json.JSONDecodeError:
        pass
    
    # Case 1: Bare array missing closing ]
    if text.startswith("["):
        # Try just adding ]
        try:
            result = json.loads(text + "]")
            if isinstance(result, list):
                print(f"    ℹ Recovered {len(result)} items (added ])")
                return {"items": result}
        except json.JSONDecodeError:
            pass
        
        # Find last complete item }, then close array
        last_complete = text.rfind('},')
        if last_complete > 0:
            candidate = text[:last_complete + 1] + ']'
            try:
                result = json.loads(candidate)
                if isinstance(result, list) and len(result) > 0:
                    print(f"    ℹ Recovered {len(result)} items from truncated array")
                    return {"items": result}
            except json.JSONDecodeError:
                pass
        
        # Try last } without comma
        last_brace = text.rfind('}')
        if last_brace > 0:
            candidate = text[:last_brace + 1] + ']'
            try:
                result = json.loads(candidate)
                if isinstance(result, list) and len(result) > 0:
                    print(f"    ℹ Recovered {len(result)} items from truncated array")
                    return {"items": result}
            except json.JSONDecodeError:
                pass
    
    # Case 2: Object with items array {"items": [...
    if '{"items"' in text or text.startswith("{"):
        last_complete = text.rfind('},')
        if last_complete == -1:
            last_complete = text.rfind('}')
        
        if last_complete > 0:
            for suffix in [']}', '\n]}', '\n]\n}']:
                candidate = text[:last_complete + 1] + suffix
                try:
                    result = json.loads(candidate)
                    if "items" in result and len(result["items"]) > 0:
                        print(f"    ℹ Recovered {len(result['items'])} items from truncated object")
                        return result
                except json.JSONDecodeError:
                    continue
    
    return None

def translate_batch(client, items, batch_type, entity_type, max_tokens=MAX_TOKENS, retries=3):
    """Tek bir batch'i API'ye gönder ve sonucu döndür"""
    user_msg = json.dumps({
        "type": batch_type,
        "entity": entity_type,
        "items": items
    }, ensure_ascii=False)

    for attempt in range(retries):
        try:
            response = client.messages.create(
                model=MODEL,
                max_tokens=max_tokens,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_msg}]
            )
            text = response.content[0].text.strip()
            stop = response.stop_reason
            
            # Strip markdown fences (```json ... ```)
            if text.startswith("```"):
                first_nl = text.find("\n")
                if first_nl > 0:
                    text = text[first_nl+1:]
                last_fence = text.rfind("```")
                if last_fence > 0:
                    text = text[:last_fence]
                text = text.strip()
            
            # Sometimes model adds preamble text before JSON — find the JSON start
            json_start = -1
            for marker in ['{"items"', '[{']:
                pos = text.find(marker)
                if pos >= 0 and (json_start < 0 or pos < json_start):
                    json_start = pos
            
            if json_start > 0:
                preamble = text[:json_start].strip()
                if preamble:
                    # There was text before JSON — skip it
                    text = text[json_start:]
            
            # Try direct parse
            try:
                result = json.loads(text)
                # If result is a bare array, wrap it
                if isinstance(result, list):
                    result = {"items": result}
                return result
            except json.JSONDecodeError:
                # Try repair regardless of stop reason
                result = repair_truncated_json(text)
                if result:
                    return result
                
                if stop == "max_tokens":
                    print(f"    ⚠ Truncated (max_tokens={max_tokens}), recovery failed")
                    if attempt < retries - 1:
                        max_tokens = min(max_tokens * 2, 16384)
                        print(f"    Retrying with max_tokens={max_tokens}...")
                        time.sleep(2)
                        continue
                else:
                    # Debug: show first/last chars
                    preview = text[:120].replace('\n', '\\n')
                    print(f"    ⚠ JSON parse error (attempt {attempt+1}), stop={stop}, preview: {preview}...")
                    if attempt < retries - 1:
                        time.sleep(2 ** (attempt + 1))
        except Exception as e:
            print(f"    ⚠ API error (attempt {attempt+1}): {e}")
            if attempt < retries - 1:
                wait = min(60, 2 ** (attempt + 1))
                print(f"    Waiting {wait}s...")
                time.sleep(wait)
    
    print(f"    ✗ Failed after {retries} retries")
    return None

# ─── Tier 1: Names ──────────────────────────────────────────────────

def load_csv_transliterations():
    """CSV'den dynasty transliteration haritası"""
    csv_path = DATA_DIR / "all_dynasties_enriched.csv"
    result = {}
    with open(csv_path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            result[row["dynasty_name_tr"]] = row.get("dynasty_name_ar", "")
    return result

def process_tier1_names(db, entity_type, client, batch_size=50, dry_run=False):
    """İsim çevirisi — tüm entity'lerin 'ar' alanı"""
    progress = load_progress()
    items = db[entity_type]
    csv_translit = load_csv_transliterations() if entity_type == "dynasties" else {}
    
    results = {}
    total_batches = (len(items) + batch_size - 1) // batch_size
    
    for batch_num in range(total_batches):
        if should_skip(progress, "tier1", entity_type, batch_num):
            print(f"  ⏭ Batch {batch_num+1}/{total_batches} (skipped)")
            continue
        
        start = batch_num * batch_size
        batch = items[start:start + batch_size]
        
        # Build input — keep it minimal for rulers
        input_batch = []
        for it in batch:
            if entity_type == "rulers":
                entry = {"id": it["id"], "n": it.get("n", ""), "fn": it.get("fn", "")}
            elif entity_type == "dynasties":
                entry = {"id": it["id"], "tr": it.get("tr", ""), "en": it.get("en", ""),
                         "transliteration": csv_translit.get(it["tr"], "")}
            else:
                entry = {"id": it["id"], "tr": it.get("tr", ""), "en": it.get("en", "")}
            input_batch.append(entry)
        
        if dry_run:
            print(f"  [DRY] Batch {batch_num+1}/{total_batches}: {len(batch)} items")
            print(f"    Sample: {json.dumps(input_batch[0], ensure_ascii=False)}")
            continue
        
        print(f"  → Batch {batch_num+1}/{total_batches}: {len(batch)} items...", end=" ", flush=True)
        batch_results = _translate_names_batch(client, input_batch, entity_type)
        
        if batch_results is None:
            # Split and retry in halves
            print(f"retrying in 2 halves...")
            mid = len(input_batch) // 2
            for half_idx, half in enumerate([input_batch[:mid], input_batch[mid:]]):
                print(f"    → Half {half_idx+1}/2: {len(half)} items...", end=" ", flush=True)
                half_results = _translate_names_batch(client, half, entity_type)
                if half_results:
                    results.update(half_results)
                    print(f"✓ ({len(half_results)})")
                else:
                    print("✗")
                time.sleep(1)
        else:
            results.update(batch_results)
        
        mark_done(progress, "tier1", entity_type, batch_num, len(batch))
        time.sleep(1)
    
    return results


def _translate_names_batch(client, input_batch, entity_type):
    """Single batch translation, returns {id: ar_name} dict or None"""
    result = translate_batch(client, input_batch, "names", entity_type)
    if not result or "items" not in result:
        return None
    
    out = {}
    for r in result["items"]:
        ar_val = r.get("ar") or r.get("name_ar") or r.get("arabic") or r.get("name") or ""
        rid = r.get("id")
        if not ar_val or rid is None:
            # Try to find any Arabic string value
            for k, v in r.items():
                if k == "id": continue
                if isinstance(v, str) and any(0x0600 <= ord(c) <= 0x06FF for c in v):
                    ar_val = v
                    break
        if ar_val and rid is not None:
            out[rid] = ar_val
    return out if out else None

# ─── Tier 2: UI Strings & Meta ──────────────────────────────────────

def process_tier2_glossary(client, dry_run=False):
    """glossary.js AR çevirisi"""
    glossary_path = SRC_DATA / "glossary.js"
    content = glossary_path.read_text(encoding="utf-8")
    
    # Parse glossary entries (JS → extract JSON-like data)
    items = []
    for m in re.finditer(r"\{\s*id:\s*(\d+),\s*term_tr:\s*'([^']*)',\s*term_en:\s*'([^']*)',\s*term_ar:\s*'([^']*)',\s*def_tr:\s*'((?:[^'\\]|\\.)*)',\s*def_en:\s*'((?:[^'\\]|\\.)*)',\s*def_ar:\s*'([^']*)'\s*\}", content):
        items.append({
            "id": int(m.group(1)),
            "term_tr": m.group(2),
            "term_en": m.group(3),
            "term_ar_existing": m.group(4),
            "def_tr": m.group(5).replace("\\'", "'"),
            "def_en": m.group(6).replace("\\'", "'"),
        })
    
    print(f"  Parsed {len(items)} glossary entries")
    
    if dry_run:
        for it in items[:3]:
            print(f"    {it['id']}: {it['term_tr']} → ...")
        return None
    
    # Batch translate
    input_batch = [{"id": it["id"], "term_tr": it["term_tr"], "term_en": it["term_en"],
                     "def_tr": it["def_tr"], "def_en": it["def_en"]} for it in items]
    
    # Split into 2 batches of ~25
    results = {}
    mid = len(input_batch) // 2
    for i, batch in enumerate([input_batch[:mid], input_batch[mid:]]):
        print(f"  → Glossary batch {i+1}/2: {len(batch)} items...", end=" ", flush=True)
        result = translate_batch(client, batch, "glossary", "glossary", max_tokens=MAX_TOKENS_NARRATIVE)
        if result and "items" in result:
            for r in result["items"]:
                results[r["id"]] = {"term_ar": r["term_ar"], "def_ar": r["def_ar"]}
            print(f"✓")
        else:
            print("✗")
        time.sleep(2)
    
    return results

def apply_glossary_results(results):
    """Apply glossary translation results to glossary.js"""
    if not results:
        return
    glossary_path = SRC_DATA / "glossary.js"
    content = glossary_path.read_text(encoding="utf-8")
    
    for gid, vals in results.items():
        # Replace term_ar: '' with term_ar: 'VALUE'
        term_ar = vals["term_ar"].replace("'", "\\'")
        def_ar = vals["def_ar"].replace("'", "\\'")
        
        pattern = rf"(id:\s*{gid},\s*term_tr:\s*'[^']*',\s*term_en:\s*'[^']*',\s*term_ar:\s*)''"
        content = re.sub(pattern, rf"\1'{term_ar}'", content)
        
        pattern = rf"(id:\s*{gid},[^}}]*def_ar:\s*)''"
        content = re.sub(pattern, rf"\1'{def_ar}'", content)
    
    glossary_path.write_text(content, encoding="utf-8")
    print(f"  ✓ glossary.js updated ({len(results)} entries)")

# ─── Tier 3: Narratives ─────────────────────────────────────────────

def process_tier3_narratives(db, entity_type, client, batch_size=10, dry_run=False):
    """Anlatı çevirisi — flat format (nested JSON sorununu önler)"""
    progress = load_progress()
    items = db[entity_type]
    field_list = NARRATIVE_FIELDS.get(entity_type, [])
    
    if not field_list:
        print(f"  ⚠ No narrative fields defined for {entity_type}")
        return {}
    
    results = {}
    total_batches = (len(items) + batch_size - 1) // batch_size
    
    for batch_num in range(total_batches):
        if should_skip(progress, "tier3", entity_type, batch_num):
            print(f"  ⏭ Batch {batch_num+1}/{total_batches} (skipped)")
            continue
        
        start = batch_num * batch_size
        batch = items[start:start + batch_size]
        
        # Build FLAT input — each field as a separate top-level key
        input_batch = []
        for it in batch:
            entry = {"id": it.get("id", it.get("did", "?"))}
            has_content = False
            for f in field_list:
                tr_val = it.get(f"{f}_tr", "")
                en_val = it.get(f"{f}_en", "")
                # Send whichever is available, prefer TR
                src = tr_val or en_val
                if src:
                    entry[f"{f}_src"] = src
                    has_content = True
            if has_content:
                input_batch.append(entry)
        
        if not input_batch:
            continue
        
        if dry_run:
            print(f"  [DRY] Batch {batch_num+1}/{total_batches}: {len(input_batch)} items, fields={field_list}")
            continue
        
        print(f"  → Batch {batch_num+1}/{total_batches}: {len(input_batch)} items...", end=" ", flush=True)
        
        # Use a simpler system prompt for flat format
        flat_prompt = SYSTEM_PROMPT + """

ÖNEMLİ FORMAT TALİMATI:
Giriş verisinde her alan "_src" son ekiyle gelir (örn: narr_src, key_src).
Çıktıda aynı alanları "_ar" son ekiyle döndür (örn: narr_ar, key_ar).
Her item için sadece id ve _ar alanlarını döndür.
Çıktı: {"items": [{"id": 1, "narr_ar": "...", "key_ar": "..."}, ...]}"""
        
        result = _translate_narratives_batch(client, input_batch, entity_type, flat_prompt)
        
        if result:
            results.update(result)
            print(f"✓ ({len(result)} items)")
            mark_done(progress, "tier3", entity_type, batch_num, len(input_batch))
        else:
            # Retry singles
            print(f"retrying singles...")
            for single in input_batch:
                sid = single.get("id", "?")
                print(f"    → id={sid}...", end=" ", flush=True)
                r2 = _translate_narratives_batch(client, [single], entity_type, flat_prompt)
                if r2:
                    results.update(r2)
                    print("✓")
                else:
                    print("✗")
                time.sleep(1)
            mark_done(progress, "tier3", entity_type, batch_num, len(input_batch))
        
        time.sleep(2)
    
    return results


def _translate_narratives_batch(client, input_batch, entity_type, system_prompt):
    """Single narrative batch — returns {id: {field_ar: value}} dict or None"""
    user_msg = json.dumps({
        "type": "narratives",
        "entity": entity_type,
        "items": input_batch
    }, ensure_ascii=False)
    
    for attempt in range(3):
        try:
            response = client.messages.create(
                model=MODEL,
                max_tokens=MAX_TOKENS_NARRATIVE,
                system=system_prompt,
                messages=[{"role": "user", "content": user_msg}]
            )
            text = response.content[0].text.strip()
            stop = response.stop_reason
            
            # Strip markdown fences
            if text.startswith("```"):
                first_nl = text.find("\n")
                if first_nl > 0:
                    text = text[first_nl+1:]
                last_fence = text.rfind("```")
                if last_fence > 0:
                    text = text[:last_fence]
                text = text.strip()
            
            # Find JSON start
            for marker in ['{"items"', '[{']:
                pos = text.find(marker)
                if pos > 0:
                    text = text[pos:]
                    break
            
            # Parse
            try:
                result = json.loads(text)
            except json.JSONDecodeError:
                result = repair_truncated_json(text)
            
            if not result:
                if attempt < 2:
                    preview = text[:150].replace('\n', '\\n')
                    print(f"\n    ⚠ Parse fail (attempt {attempt+1}), preview: {preview}...")
                    time.sleep(2)
                    continue
                return None
            
            # Normalize
            if isinstance(result, list):
                result = {"items": result}
            
            if "items" not in result or not result["items"]:
                return None
            
            # Extract flat fields
            out = {}
            for r in result["items"]:
                rid = r.get("id")
                if rid is None:
                    continue
                fields = {}
                for k, v in r.items():
                    if k == "id":
                        continue
                    # Accept keys ending in _ar, or raw field names with Arabic content
                    if k.endswith("_ar") and isinstance(v, str) and v:
                        fields[k] = v
                    elif isinstance(v, str) and any(0x0600 <= ord(c) <= 0x06FF for c in v):
                        # Normalize key: ensure _ar suffix
                        ar_key = k if k.endswith("_ar") else f"{k}_ar"
                        fields[ar_key] = v
                    elif isinstance(v, dict):
                        # Handle nested format: {field: {tr/ar: "..."}}
                        ar_val = v.get("ar") or v.get("tr") or ""
                        if ar_val and any(0x0600 <= ord(c) <= 0x06FF for c in ar_val):
                            fields[f"{k}_ar"] = ar_val
                if fields:
                    out[rid] = fields
            
            return out if out else None
            
        except Exception as e:
            if attempt < 2:
                print(f"\n    ⚠ API error (attempt {attempt+1}): {e}")
                time.sleep(2 ** (attempt + 1))
            else:
                return None
    
    return None

# ─── Tier 4: Short fields & Causal ──────────────────────────────────

def process_tier4_short_fields(db, entity_type, client, batch_size=30, dry_run=False):
    """Kısa alan çevirisi (city, disc, type vb.)"""
    progress = load_progress()
    items = db[entity_type]
    field_list = SHORT_FIELDS.get(entity_type, [])
    
    if not field_list:
        return {}
    
    results = {}
    total_batches = (len(items) + batch_size - 1) // batch_size
    
    for batch_num in range(total_batches):
        if should_skip(progress, "tier4", entity_type, batch_num):
            print(f"  ⏭ Batch {batch_num+1}/{total_batches} (skipped)")
            continue
        
        start = batch_num * batch_size
        batch = items[start:start + batch_size]
        
        input_batch = []
        for it in batch:
            fields = {}
            for f in field_list:
                tr_val = it.get(f"{f}_tr", "")
                en_val = it.get(f"{f}_en", "")
                if tr_val or en_val:
                    fields[f] = {"tr": tr_val, "en": en_val}
            if fields:
                input_batch.append({"id": it["id"], "fields": fields})
        
        if not input_batch:
            continue
        
        if dry_run:
            print(f"  [DRY] Short fields batch {batch_num+1}/{total_batches}: {len(input_batch)} items")
            continue
        
        print(f"  → Short batch {batch_num+1}/{total_batches}: {len(input_batch)} items...", end=" ", flush=True)
        result = translate_batch(client, input_batch, "short_fields", entity_type)
        
        if result and "items" in result:
            for r in result["items"]:
                rid = r.get("id")
                if rid is None:
                    continue
                fields = r.get("fields", {})
                if not fields:
                    # Try flat keys
                    fields = {}
                    for k, v in r.items():
                        if k == "id":
                            continue
                        if isinstance(v, str) and v:
                            fields[k] = v
                if fields:
                    results[rid] = fields
            print(f"✓ ({len(result['items'])})")
            mark_done(progress, "tier4", entity_type, batch_num, len(result["items"]))
        else:
            print("✗")
        
        time.sleep(1)
    
    return results

def process_tier4_causal(db, client, batch_size=50, dry_run=False):
    """Causal link açıklamaları"""
    progress = load_progress()
    items = db["causal"]
    results = {}
    total_batches = (len(items) + batch_size - 1) // batch_size
    
    for batch_num in range(total_batches):
        if should_skip(progress, "tier4", "causal", batch_num):
            print(f"  ⏭ Batch {batch_num+1}/{total_batches} (skipped)")
            continue
        
        start = batch_num * batch_size
        batch = items[start:start + batch_size]
        
        input_batch = [{"id": it["id"], "dtr": it.get("dtr",""), "den": it.get("den",""), "lt": it.get("lt","")}
                       for it in batch if it.get("dtr") or it.get("den")]
        
        if dry_run:
            print(f"  [DRY] Causal batch {batch_num+1}/{total_batches}: {len(input_batch)} items")
            continue
        
        print(f"  → Causal batch {batch_num+1}/{total_batches}: {len(input_batch)} items...", end=" ", flush=True)
        result = translate_batch(client, input_batch, "causal_descriptions", "causal")
        
        if result and "items" in result:
            for r in result["items"]:
                rid = r.get("id")
                ar_val = r.get("dar") or r.get("dar_ar") or r.get("ar") or r.get("description") or ""
                if not ar_val:
                    for v in r.values():
                        if isinstance(v, str) and any(0x0600 <= ord(c) <= 0x06FF for c in v):
                            ar_val = v
                            break
                if rid is not None and ar_val:
                    results[rid] = ar_val
            print(f"✓ ({len(result['items'])})")
            mark_done(progress, "tier4", "causal", batch_num, len(result["items"]))
        else:
            print("✗")
        
        time.sleep(1)
    
    return results

# ─── Merge Results ───────────────────────────────────────────────────

def merge_names(db, entity_type, name_results):
    """İsim sonuçlarını db'ye merge et"""
    count = 0
    for item in db[entity_type]:
        eid = item.get("id")
        if eid in name_results and name_results[eid]:
            item["ar"] = name_results[eid]
            count += 1
    print(f"  ✓ Merged {count} names into {entity_type}")
    return count

def merge_narratives(db, entity_type, narr_results):
    """Narrative sonuçlarını db'ye merge et"""
    count = 0
    for item in db[entity_type]:
        eid = item.get("id")
        if eid in narr_results:
            for field_key, ar_value in narr_results[eid].items():
                ar_key = f"{field_key}_ar" if not field_key.endswith("_ar") else field_key
                if ar_key in item:
                    item[ar_key] = ar_value
                    count += 1
    print(f"  ✓ Merged {count} narrative fields into {entity_type}")
    return count

def merge_short_fields(db, entity_type, results):
    count = 0
    for item in db[entity_type]:
        eid = item.get("id")
        if eid in results:
            for field_key, ar_value in results[eid].items():
                ar_key = f"{field_key}_ar" if not field_key.endswith("_ar") else field_key
                if ar_key in item:
                    item[ar_key] = ar_value
                    count += 1
    print(f"  ✓ Merged {count} short fields into {entity_type}")
    return count

def merge_causal(db, results):
    count = 0
    for item in db["causal"]:
        eid = item["id"]
        if eid in results and results[eid]:
            item["dar"] = results[eid]
            count += 1
    print(f"  ✓ Merged {count} causal descriptions")
    return count

# ─── Validation ──────────────────────────────────────────────────────

def validate_ar_output(db):
    """Arapça içerik doğrulama"""
    issues = []
    stats = {"total": 0, "filled": 0, "empty": 0, "low_ar": 0, "too_short": 0, "too_long": 0}
    
    for etype, items in db.items():
        if not isinstance(items, list) or not items or not isinstance(items[0], dict):
            continue
        
        for item in items:
            eid = item.get("id", "?")
            
            for k, v in item.items():
                if k == "ar" or k.endswith("_ar"):
                    stats["total"] += 1
                    if not v:
                        stats["empty"] += 1
                        issues.append(f"EMPTY: {etype}#{eid}.{k}")
                    else:
                        stats["filled"] += 1
                        # Arabic character ratio
                        ar_chars = sum(1 for c in str(v) if 0x0600 <= ord(c) <= 0x06FF)
                        total_alpha = sum(1 for c in str(v) if c.isalpha())
                        if total_alpha > 0 and ar_chars / total_alpha < 0.7:
                            stats["low_ar"] += 1
                            issues.append(f"LOW_AR: {etype}#{eid}.{k} — {ar_chars}/{total_alpha} Arabic chars ({ar_chars/total_alpha:.0%})")
                        
                        # Length consistency
                        base_tr = k.replace("_ar", "_tr") if k.endswith("_ar") else None
                        if base_tr and base_tr in item and item[base_tr]:
                            tr_len = len(item[base_tr])
                            ar_len = len(v)
                            if ar_len < tr_len * 0.3:
                                stats["too_short"] += 1
                                issues.append(f"TOO_SHORT: {etype}#{eid}.{k} — AR:{ar_len} vs TR:{tr_len}")
                            elif ar_len > tr_len * 2.5:
                                stats["too_long"] += 1
                                issues.append(f"TOO_LONG: {etype}#{eid}.{k} — AR:{ar_len} vs TR:{tr_len}")
    
    return issues, stats

def print_stats(db):
    """AR doluluk istatistikleri"""
    print("\n" + "═" * 60)
    print("  ARABIC CONTENT STATISTICS")
    print("═" * 60)
    
    grand_total = 0
    grand_filled = 0
    
    for etype, items in db.items():
        if not isinstance(items, list) or not items or not isinstance(items[0], dict):
            continue
        ar_fields = [k for k in items[0].keys() if k == "ar" or k.endswith("_ar")]
        if not ar_fields:
            continue
        
        total = len(items) * len(ar_fields)
        filled = sum(1 for it in items for af in ar_fields if it.get(af))
        grand_total += total
        grand_filled += filled
        pct = filled / total * 100 if total else 0
        bar = "█" * int(pct / 5) + "░" * (20 - int(pct / 5))
        print(f"  {etype:12s} {bar} {filled:5d}/{total:5d} ({pct:5.1f}%)")
    
    pct = grand_filled / grand_total * 100 if grand_total else 0
    print("─" * 60)
    print(f"  {'TOTAL':12s}                      {grand_filled:5d}/{grand_total:5d} ({pct:5.1f}%)")
    print("═" * 60)

# ─── Main ────────────────────────────────────────────────────────────

ALL_ENTITIES_TIER1 = ["dynasties", "battles", "events", "scholars", "monuments", "cities", "routes", "madrasas", "rulers"]
ALL_ENTITIES_TIER3 = ["dynasties", "battles", "events", "scholars", "monuments", "cities", "routes", "madrasas", "diplomacy"]
ALL_ENTITIES_TIER4_SHORT = ["scholars", "monuments", "routes", "madrasas"]

TIER3_BATCH_SIZES = {
    "dynasties": 5, "scholars": 10, "battles": 10, "events": 15,
    "monuments": 10, "cities": 15, "routes": 15, "madrasas": 15, "diplomacy": 10,
}

def main():
    parser = argparse.ArgumentParser(description="Arabic content translation orchestrator")
    parser.add_argument("--tier", type=int, choices=[1,2,3,4], help="Translation tier")
    parser.add_argument("--entity", type=str, help="Entity type (dynasties, scholars, ...)")
    parser.add_argument("--all", action="store_true", help="Process all entities in tier")
    parser.add_argument("--target", type=str, help="Tier 2 target (i18n, glossary, era_info, tours, ...)")
    parser.add_argument("--batch-size", type=int, help="Override batch size")
    parser.add_argument("--dry-run", action="store_true", help="Don't call API, show what would be done")
    parser.add_argument("--validate", action="store_true", help="Run validation only")
    parser.add_argument("--stats", action="store_true", help="Show statistics only")
    parser.add_argument("--reset-progress", action="store_true", help="Reset progress tracking")
    args = parser.parse_args()
    
    db = load_db()
    
    if args.stats:
        print_stats(db)
        return
    
    if args.validate:
        issues, stats = validate_ar_output(db)
        print(f"\nValidation: {stats['filled']}/{stats['total']} filled, {stats['empty']} empty")
        print(f"  Low AR: {stats['low_ar']}, Too short: {stats['too_short']}, Too long: {stats['too_long']}")
        if issues:
            print(f"\nFirst 20 issues:")
            for iss in issues[:20]:
                print(f"  {iss}")
        return
    
    if args.reset_progress:
        if PROGRESS_FILE.exists():
            PROGRESS_FILE.unlink()
            print("Progress reset.")
        return
    
    if not args.tier:
        parser.print_help()
        return
    
    client = None if args.dry_run else get_client()
    
    # ── Tier 1 ──
    if args.tier == 1:
        entities = ALL_ENTITIES_TIER1 if args.all else ([args.entity] if args.entity else [])
        if not entities:
            print("Specify --entity or --all"); return
        
        backup_db("pre_tier1")
        for etype in entities:
            print(f"\n{'='*40}")
            print(f"TIER 1 — Names: {etype}")
            print(f"{'='*40}")
            bs = args.batch_size or (15 if etype == "rulers" else 50)
            results = process_tier1_names(db, etype, client, batch_size=bs, dry_run=args.dry_run)
            if results and not args.dry_run:
                merge_names(db, etype, results)
        
        if not args.dry_run:
            save_db(db)
    
    # ── Tier 2 ──
    elif args.tier == 2:
        target = args.target or "glossary"
        print(f"\n{'='*40}")
        print(f"TIER 2 — {target}")
        print(f"{'='*40}")
        
        if target == "glossary":
            results = process_tier2_glossary(client, dry_run=args.dry_run)
            if results and not args.dry_run:
                apply_glossary_results(results)
        else:
            print(f"  Target '{target}' not yet implemented. Available: glossary")
    
    # ── Tier 3 ──
    elif args.tier == 3:
        entities = ALL_ENTITIES_TIER3 if args.all else ([args.entity] if args.entity else [])
        if not entities:
            print("Specify --entity or --all"); return
        
        backup_db("pre_tier3")
        for etype in entities:
            print(f"\n{'='*40}")
            print(f"TIER 3 — Narratives: {etype}")
            print(f"{'='*40}")
            bs = args.batch_size or TIER3_BATCH_SIZES.get(etype, 15)
            results = process_tier3_narratives(db, etype, client, batch_size=bs, dry_run=args.dry_run)
            if results and not args.dry_run:
                merge_narratives(db, etype, results)
        
        if not args.dry_run:
            save_db(db)
    
    # ── Tier 4 ──
    elif args.tier == 4:
        backup_db("pre_tier4")
        
        if args.all or args.entity == "causal":
            print(f"\n{'='*40}")
            print(f"TIER 4 — Causal descriptions")
            print(f"{'='*40}")
            results = process_tier4_causal(db, client, dry_run=args.dry_run)
            if results and not args.dry_run:
                merge_causal(db, results)
        
        entities = ALL_ENTITIES_TIER4_SHORT if args.all else ([args.entity] if args.entity and args.entity != "causal" else [])
        for etype in entities:
            print(f"\n{'='*40}")
            print(f"TIER 4 — Short fields: {etype}")
            print(f"{'='*40}")
            bs = args.batch_size or 30
            results = process_tier4_short_fields(db, etype, client, batch_size=bs, dry_run=args.dry_run)
            if results and not args.dry_run:
                merge_short_fields(db, etype, results)
        
        if not args.dry_run:
            save_db(db)
    
    # Final stats
    if not args.dry_run:
        db = load_db()
        print_stats(db)


if __name__ == "__main__":
    main()
