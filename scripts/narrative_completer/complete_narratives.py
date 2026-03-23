#!/usr/bin/env python3
"""
islamicatlas.org — Truncated Narrative Completer
Uses Claude API to complete 581 truncated narratives in db.json.
"""

import json, os, sys, time

try:
    import anthropic
except ImportError:
    os.system("pip install anthropic --break-system-packages -q")
    import anthropic

INPUT_FILE = "data/db.json"
OUTPUT_FILE = "data/db_completed.json"
BACKUP_FILE = "data/db_backup.json"
PROGRESS_FILE = "data/completion_progress.json"
MODEL = "claude-sonnet-4-20250514"
MAX_TOKENS = 400
RATE_LIMIT_DELAY = 0.1
COLLECTIONS = ["battles", "events", "scholars", "dynasties"]
LANG_FIELDS = ["narr_tr", "narr_en", "narr_ar"]

def is_truncated(text):
    if not text or not text.strip():
        return False
    s = text.strip()
    if s.endswith("..."): return True
    if len(s) < 50: return True
    if s[-1] not in ".!?\u060C\u061F": return True
    return False

def build_context(item, col):
    keys_map = {
        "battles": ["tr","en","yr","impact_tr","tactic_tr"],
        "events": ["tr","en","yr","cat","desc"],
        "scholars": ["tr","en","b","d","city_tr","disc_tr"],
        "dynasties": ["tr","en","start","end","cap","zone"],
    }
    return {k: item[k] for k in keys_map.get(col,[]) if item.get(k)}

TYPE_NAMES = {
    "narr_tr": {"battles":"savas","events":"olay","scholars":"alim","dynasties":"hanedan"},
    "narr_en": {"battles":"battle","events":"event","scholars":"scholar","dynasties":"dynasty"},
    "narr_ar": {"battles":"معركة","events":"حدث","scholars":"عالم","dynasties":"سلالة"},
}

PROMPTS = {
    "narr_tr": "Islam medeniyeti atlasi icin {type} anlatisi. Konu: {ctx}\n\nMetin cumle ortasinda kesilmis. Ayni uslupla 1-3 cumleyle tamamla. Tarihi dogruluk onemli. SADECE tamamlama kismini yaz.\n\nKesilmis: \"{text}\"\n\nTamamlama:",
    "narr_en": "Islamic civilization atlas {type} narrative. Topic: {ctx}\n\nText cut mid-sentence. Continue same style, 1-3 sentences. Historical accuracy. ONLY write the completion.\n\nTruncated: \"{text}\"\n\nCompletion:",
    "narr_ar": "نص سردي عن {type} في أطلس الحضارة الإسلامية. {ctx}\n\nالنص مقطوع. أكمله بنفس الأسلوب بـ١-٣ جمل. اكتب فقط الإكمال.\n\nالمقطوع: \"{text}\"\n\nالإكمال:",
}

def make_prompt(item, col, lang):
    ctx = build_context(item, col)
    ctx_str = ", ".join(f"{k}={v}" for k,v in ctx.items())
    tp = TYPE_NAMES[lang][col]
    text = item[lang].strip()
    snippet = text if len(text) <= 350 else "..." + text[-300:]
    return PROMPTS[lang].format(type=tp, ctx=ctx_str, text=snippet)

def run(api_key, dry_run=False, limit=None):
    client = anthropic.Anthropic(api_key=api_key)
    
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        db = json.load(f)
    with open(BACKUP_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False)
    print(f"Backup -> {BACKUP_FILE}")
    
    progress = {}
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, "r") as f:
            progress = json.load(f)
        print(f"Resuming ({len(progress)} done)")
    
    tasks = []
    for col in COLLECTIONS:
        for item in db[col]:
            for lang in LANG_FIELDS:
                text = item.get(lang, "").strip()
                if text and is_truncated(text):
                    key = f"{col}/{item['id']}/{lang}"
                    if key not in progress:
                        tasks.append((col, item, lang, key))
    
    print(f"Tasks: {len(tasks)}")
    if limit:
        tasks = tasks[:limit]
        print(f"Limited to {limit}")
    
    if dry_run:
        for col, item, lang, key in tasks[:3]:
            print(f"\n--- {key} ---")
            print(make_prompt(item, col, lang)[:300])
        return db
    
    done = 0; errs = 0; toks = 0
    
    for i, (col, item, lang, key) in enumerate(tasks):
        prompt = make_prompt(item, col, lang)
        try:
            resp = client.messages.create(model=MODEL, max_tokens=MAX_TOKENS,
                messages=[{"role":"user","content":prompt}])
            comp = resp.content[0].text.strip()
            if comp.startswith('"') and comp.endswith('"'):
                comp = comp[1:-1]
            
            orig = item[lang].strip()
            lc = orig[-1]
            if lc.isalpha() or ord(lc) > 0x600:
                full = orig + comp
            else:
                full = orig + " " + comp
            full = full.strip()
            if full and full[-1] not in ".!?\u060C\u061F":
                full += "."
            
            item[lang] = full
            toks += resp.usage.input_tokens + resp.usage.output_tokens
            progress[key] = {"ok": True, "added": len(comp)}
            done += 1
            
            if (i+1) % 20 == 0 or i == 0:
                print(f"  [{i+1}/{len(tasks)}] {key} +{len(comp)}c | tok={toks} ~${toks*3/1e6:.2f}")
            
            if (i+1) % 50 == 0:
                with open(PROGRESS_FILE,"w") as f: json.dump(progress,f,ensure_ascii=False)
                with open(OUTPUT_FILE,"w",encoding="utf-8") as f: json.dump(db,f,ensure_ascii=False,indent=2)
                print(f"  Checkpoint ({done} done)")
            
            time.sleep(RATE_LIMIT_DELAY)
        except anthropic.RateLimitError:
            print("  Rate limited, wait 30s...")
            time.sleep(30)
            tasks.insert(i+1, (col, item, lang, key))
        except Exception as e:
            errs += 1
            progress[key] = {"ok": False, "err": str(e)[:80]}
            print(f"  [{i+1}] ERR {key}: {e}")
            if errs > 20:
                print("Too many errors, stopping.")
                break
    
    with open(OUTPUT_FILE,"w",encoding="utf-8") as f:
        json.dump(db,f,ensure_ascii=False,indent=2)
    with open(PROGRESS_FILE,"w") as f:
        json.dump(progress,f,ensure_ascii=False)
    
    print(f"\n{'='*50}")
    print(f"Done: {done} | Errors: {errs} | Tokens: {toks} | ~${toks*3/1e6:.2f}")
    print(f"Output: {OUTPUT_FILE}")
    return db

if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--key", required=True)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--limit", type=int, default=None)
    a = p.parse_args()
    run(a.key, a.dry_run, a.limit)
