#!/usr/bin/env python3
"""
islamicatlas.org — Toplu TR→EN Çeviri Scripti (Claude API)
v5.3.1.1 — 16 Mart 2026

Bu script db.json'daki boş EN trilingual alanlarını, dolu TR karşılıklarından
Claude API ile çevirerek doldurur.

Kullanım:
    # API anahtarını ayarla
    export ANTHROPIC_API_KEY="sk-ant-..."

    # Dry-run (çeviri yapmaz, sadece sayar)
    python translate_en.py

    # Belirli koleksiyonu çevir
    python translate_en.py --apply --collection dynasties

    # Tamamını çevir (dikkat: ~800 API call)
    python translate_en.py --apply --all

    # Batch boyutunu ayarla (varsayılan: 10 kayıt/batch)
    python translate_en.py --apply --all --batch-size 20

Maliyet tahmini:
    ~800 alan × ~200 token/alan ≈ 160K token
    Claude Sonnet: ~$0.48 input + ~$1.20 output ≈ ~$1.70 toplam
"""

import json
import os
import sys
import time
import argparse
from pathlib import Path
from datetime import datetime

# ─── Config ──────────────────────────────────────────────────────────────────

BASE = Path(".")
DB_PATH = BASE / "src/data/db.json"
SCHEMAS_CACHE = Path("/tmp/entitySchemas.json")

API_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-sonnet-4-20250514"

# ─── Helpers ─────────────────────────────────────────────────────────────────

def load_db():
    with open(DB_PATH) as f:
        return json.load(f)

def save_db(db):
    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

def get_trilingual_fields(schemas):
    """Get trilingual field keys per collection from schemas."""
    result = {}
    for coll_name, schema in schemas.items():
        tri = [fld['key'] for fld in schema.get('fields', []) if fld.get('trilingual')]
        if tri:
            result[coll_name] = tri
    return result

def get_missing_en(db, tri_fields, collection=None):
    """Find all records where EN is empty but TR is filled."""
    missing = []
    colls = [collection] if collection else list(tri_fields.keys())
    
    for coll in colls:
        if coll not in tri_fields:
            continue
        for rec in db.get(coll, []):
            rid = rec.get('id', '?')
            name = rec.get('en') or rec.get('tr') or str(rid)
            for field in tri_fields[coll]:
                en_key = f"{field}_en"
                tr_key = f"{field}_tr"
                en_val = str(rec.get(en_key, '')).strip()
                tr_val = str(rec.get(tr_key, '')).strip()
                
                if not en_val and tr_val:
                    missing.append({
                        'collection': coll,
                        'id': rid,
                        'name': name,
                        'field': field,
                        'en_key': en_key,
                        'tr_key': tr_key,
                        'tr_val': tr_val,
                    })
    return missing

def call_claude_api(api_key, batch):
    """Send a batch of TR texts to Claude for EN translation."""
    import urllib.request
    
    # Build prompt with all texts in batch
    texts_block = ""
    for i, item in enumerate(batch):
        coll = item['collection']
        field = item['field']
        name = item['name']
        texts_block += f"<item index=\"{i}\" collection=\"{coll}\" field=\"{field}\" name=\"{name}\">\n{item['tr_val']}\n</item>\n\n"
    
    prompt = f"""You are translating Turkish text to English for an Islamic history atlas (islamicatlas.org).

Context: These are database fields for dynasties, scholars, battles, routes, and other Islamic civilization entities. The translations should be:
- Academically accurate (EI3/EI2 transliteration for Arabic/Persian names)
- Concise but complete
- Matching the tone of an educational reference work
- Preserving all proper nouns, dates, and technical terms

Translate each <item> from Turkish to English. Return ONLY a JSON array where each element has "index" (matching the input) and "en" (the English translation). No other text.

{texts_block}

Return JSON array only:"""

    body = json.dumps({
        "model": MODEL,
        "max_tokens": 4096,
        "messages": [{"role": "user", "content": prompt}]
    }).encode('utf-8')
    
    req = urllib.request.Request(
        API_URL,
        data=body,
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        }
    )
    
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        
        # Extract text content
        text = ""
        for block in data.get("content", []):
            if block.get("type") == "text":
                text += block["text"]
        
        # Parse JSON from response
        # Clean potential markdown fences
        text = text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1]  # Remove first line
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
        
        translations = json.loads(text)
        return translations
        
    except Exception as e:
        print(f"  ❌ API hatası: {e}")
        return None

# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='TR→EN batch translation via Claude API')
    parser.add_argument('--apply', action='store_true', help='Actually perform translations')
    parser.add_argument('--all', action='store_true', help='Translate all collections')
    parser.add_argument('--collection', type=str, help='Translate specific collection')
    parser.add_argument('--batch-size', type=int, default=10, help='Items per API call')
    parser.add_argument('--limit', type=int, default=0, help='Max items to translate (0=all)')
    args = parser.parse_args()
    
    print("islamicatlas.org — TR→EN Çeviri Scripti")
    print(f"Tarih: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    
    # Check API key
    api_key = os.environ.get('ANTHROPIC_API_KEY', '')
    if args.apply and not api_key:
        print("❌ ANTHROPIC_API_KEY environment variable gerekli.")
        print("   export ANTHROPIC_API_KEY='sk-ant-...'")
        sys.exit(1)
    
    # Load data
    db = load_db()
    
    # Load schemas — try cache first, then parse from source
    if SCHEMAS_CACHE.exists():
        with open(SCHEMAS_CACHE) as f:
            schemas = json.load(f)['SCHEMAS']
    else:
        # Parse entitySchemas.js directly via Node.js
        schema_js = BASE / "src/components/admin/schemas/entitySchemas.js"
        if not schema_js.exists():
            print("❌ entitySchemas.js bulunamadı.")
            sys.exit(1)
        
        import subprocess
        node_code = f"""
        const fs = require('fs');
        let c = fs.readFileSync('{schema_js}', 'utf8');
        c = c.replace(/export\\s+default\\s+\\w+;?\\s*$/, '');
        c = c.replace(/export\\s+\\{{[^}}]*\\}};?\\s*$/, '');
        c = c.replace(/^(export\\s+)?const /gm, 'var ');
        c = c.replace(/^(export\\s+)?let /gm, 'var ');
        eval(c);
        const vars = c.match(/^var\\s+(\\w+)/gm);
        const r = {{}};
        vars.forEach(v => {{ const n = v.replace('var ', ''); try {{ r[n] = eval(n); }} catch(e) {{}} }});
        console.log(JSON.stringify(r));
        """
        result = subprocess.run(['node', '-e', node_code], capture_output=True, text=True)
        if result.returncode != 0:
            print(f"❌ Schema parse hatası: {result.stderr[:200]}")
            sys.exit(1)
        parsed = json.loads(result.stdout)
        schemas = parsed.get('SCHEMAS', {})
        
        # Cache for next time
        with open(SCHEMAS_CACHE, 'w') as f:
            json.dump({'SCHEMAS': schemas}, f)
        print("  ✅ Schema parse edildi ve cache'lendi.")
    
    tri_fields = get_trilingual_fields(schemas)
    
    # Find missing
    target_coll = args.collection if args.collection else (None if args.all else None)
    missing = get_missing_en(db, tri_fields, target_coll)
    
    if args.limit > 0:
        missing = missing[:args.limit]
    
    # Report
    by_coll = {}
    for item in missing:
        by_coll.setdefault(item['collection'], []).append(item)
    
    print(f"\nÇevrilecek alan sayısı: {len(missing)}")
    for coll, items in by_coll.items():
        print(f"  {coll}: {len(items)}")
    
    if not args.apply:
        print(f"\n📋 Dry-run. Çeviri yapmak için: python translate_en.py --apply --all")
        
        # Show cost estimate
        avg_tokens = 200
        total_tokens = len(missing) * avg_tokens
        cost = total_tokens / 1_000_000 * 15  # rough estimate
        print(f"   Tahmini maliyet: ~${cost:.2f} ({total_tokens:,} token)")
        print(f"   API call sayısı: ~{len(missing) // args.batch_size + 1}")
        return
    
    if not args.all and not args.collection:
        print("❌ --all veya --collection belirtmelisin.")
        sys.exit(1)
    
    # Backup
    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = DB_PATH.parent / f"db.json.backup_translate_{ts}"
    import shutil
    shutil.copy2(DB_PATH, backup_path)
    print(f"  Backup: {backup_path}")
    
    # Process in batches
    total_translated = 0
    total_failed = 0
    batch_size = args.batch_size
    
    for i in range(0, len(missing), batch_size):
        batch = missing[i:i+batch_size]
        batch_num = i // batch_size + 1
        total_batches = (len(missing) + batch_size - 1) // batch_size
        
        print(f"\n  Batch {batch_num}/{total_batches} ({len(batch)} alan)...")
        
        translations = call_claude_api(api_key, batch)
        
        if translations is None:
            total_failed += len(batch)
            print(f"  ❌ Batch {batch_num} başarısız, atlanıyor")
            time.sleep(5)
            continue
        
        # Apply translations
        # Build lookup for db records
        db_index = {}
        for coll_name, records in db.items():
            for rec in records:
                db_index[(coll_name, rec.get('id'))] = rec
        
        for trans in translations:
            try:
                idx = int(trans.get('index', -1))
            except (ValueError, TypeError):
                continue
            en_text = str(trans.get('en', '')).strip()
            
            if idx < 0 or idx >= len(batch) or not en_text:
                continue
            
            item = batch[idx]
            key = (item['collection'], item['id'])
            rec = db_index.get(key)
            
            if rec:
                rec[item['en_key']] = en_text
                total_translated += 1
                print(f"    ✅ {item['collection']} id:{item['id']} {item['en_key']}")
        
        # Rate limit — be gentle
        time.sleep(1)
    
    # Save
    if total_translated > 0:
        save_db(db)
        print(f"\n{'='*60}")
        print(f"✅ {total_translated} alan çevrildi ve kaydedildi.")
        print(f"❌ {total_failed} alan başarısız.")
        print(f"Backup: {backup_path}")
    else:
        print(f"\n⚠️ Hiçbir alan çevrilemedi.")

if __name__ == "__main__":
    main()
