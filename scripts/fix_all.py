#!/usr/bin/env python3
"""
islamicatlas.org — Toplu Düzeltme Scripti
Aşama 1 (tactic_en sync) + Aşama 3 (ref-multi string→array) düzeltmeleri
v5.3.1.0 — 16 Mart 2026

Kullanım:
    python fix_all.py                   # Dry-run (değişiklik yapmaz)
    python fix_all.py --apply           # Değişiklikleri uygula
    python fix_all.py --apply --backup  # Backup al ve uygula
"""

import json
import sys
import shutil
import subprocess
import re
from pathlib import Path
from datetime import datetime

# ─── Config ──────────────────────────────────────────────────────────────────

DRY_RUN = "--apply" not in sys.argv
BACKUP = "--backup" in sys.argv

BASE = Path(".")  # Proje kök dizininde çalıştırılmalı
DB_PATH = BASE / "src/data/db.json"
BM_PATH = BASE / "src/data/battle_meta.js"
SCHEMA_PATH = BASE / "src/components/admin/schemas/entitySchemas.js"

# ─── Helpers ─────────────────────────────────────────────────────────────────

def load_db():
    with open(DB_PATH) as f:
        return json.load(f)

def save_db(db, path=None):
    target = path or DB_PATH
    with open(target, 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=2)
    print(f"  ✅ Kaydedildi: {target}")

def load_battle_meta():
    """Parse battle_meta.js using Node.js"""
    node_script = """
    const fs = require('fs');
    let content = fs.readFileSync('%s', 'utf8');
    content = content.replace('export default BATTLE_META;', '');
    content = content.replace('const BATTLE_META =', 'var BATTLE_META =');
    eval(content);
    console.log(JSON.stringify(BATTLE_META));
    """ % str(BM_PATH)
    
    result = subprocess.run(['node', '-e', node_script], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ❌ battle_meta.js parse hatası: {result.stderr[:200]}")
        sys.exit(1)
    return json.loads(result.stdout)

# ─── Phase 1 Fix: tactic_en sync ────────────────────────────────────────────

def fix_phase1(db, bmeta):
    print("\n" + "="*60)
    print("AŞAMA 1 FIX — tactic_en: battle_meta → db.json")
    print("="*60)
    
    battles_by_id = {str(b["id"]): b for b in db["battles"]}
    changes = 0
    
    for bid, bm_entry in bmeta.items():
        if not bm_entry or len(bm_entry) == 0:
            continue
        
        db_entry = battles_by_id.get(bid)
        if not db_entry:
            continue
        
        # Copy tactic_en from battle_meta to db.json if db is empty
        bm_tactic = str(bm_entry.get("tactic_en", "")).strip()
        db_tactic = str(db_entry.get("tactic_en", "")).strip()
        
        if bm_tactic and not db_tactic:
            if not DRY_RUN:
                db_entry["tactic_en"] = bm_tactic
            changes += 1
            print(f"  id:{bid} tactic_en ← '{bm_tactic[:60]}...'")
    
    print(f"\n  Toplam: {changes} alan {'güncellenecek' if DRY_RUN else 'güncellendi'}")
    return changes

# ─── Phase 3 Fix: string→array for ref-multi fields ─────────────────────────

def fix_phase3_arrays(db):
    print("\n" + "="*60)
    print("AŞAMA 3 FIX — ref-multi string→array dönüşümü")
    print("="*60)
    
    # Known ref-multi fields that store comma-separated strings
    fixes = [
        ("battles", "rel_dyn"),
        ("events", "rel_bat"),
    ]
    
    changes = 0
    
    for coll, field in fixes:
        for rec in db.get(coll, []):
            val = rec.get(field)
            if val is None or isinstance(val, list):
                continue
            
            # String like "3,4" or "1,2,3" → convert to array of ints
            if isinstance(val, str) and "," in val:
                try:
                    arr = [int(x.strip()) for x in val.split(",") if x.strip()]
                    if not DRY_RUN:
                        rec[field] = arr
                    changes += 1
                    print(f"  {coll} id:{rec.get('id')} {field}: '{val}' → {arr}")
                except ValueError:
                    print(f"  ⚠️ {coll} id:{rec.get('id')} {field}: parse edilemedi: '{val}'")
            elif isinstance(val, (int, float)):
                # Single value → wrap in array
                if not DRY_RUN:
                    rec[field] = [int(val)]
                changes += 1
                print(f"  {coll} id:{rec.get('id')} {field}: {val} → [{int(val)}]")
    
    print(f"\n  Toplam: {changes} alan {'dönüştürülecek' if DRY_RUN else 'dönüştürüldü'}")
    return changes

# ─── Phase 3 Fix: monuments dyn=0 → flag ────────────────────────────────────

def fix_phase3_zero_refs(db):
    print("\n" + "="*60)
    print("AŞAMA 3 FIX — dyn=0 referansları")
    print("="*60)
    
    flagged = 0
    for rec in db.get("monuments", []):
        if rec.get("dyn") == 0:
            flagged += 1
            name = rec.get("en") or rec.get("tr") or f"id:{rec.get('id')}"
            print(f"  ⚠️ monuments id:{rec.get('id')} ({name}) — dyn=0, MANUEL düzeltme gerekli")
    
    if flagged == 0:
        print("  ✅ Sorun yok")
    else:
        print(f"\n  {flagged} kayıt manuel düzeltme bekliyor")
    
    return flagged

# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    print("islamicatlas.org — Toplu Düzeltme Scripti")
    print(f"Mod: {'DRY-RUN (değişiklik yapılmayacak)' if DRY_RUN else '⚡ UYGULAMA MODU'}")
    print(f"Tarih: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    
    if not DB_PATH.exists():
        print(f"❌ {DB_PATH} bulunamadı. Proje kök dizininde çalıştırın.")
        sys.exit(1)
    
    # Backup
    if BACKUP and not DRY_RUN:
        ts = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_path = DB_PATH.parent / f"db.json.backup_{ts}"
        shutil.copy2(DB_PATH, backup_path)
        print(f"  Backup: {backup_path}")
    
    # Load data
    db = load_db()
    bmeta = load_battle_meta()
    
    # Apply fixes
    c1 = fix_phase1(db, bmeta)
    c2 = fix_phase3_arrays(db)
    c3 = fix_phase3_zero_refs(db)
    
    total = c1 + c2
    
    print("\n" + "="*60)
    print(f"ÖZET: {total} otomatik düzeltme")
    print(f"  Aşama 1: {c1} tactic_en kopyalandı")
    print(f"  Aşama 3: {c2} ref-multi array'e dönüştürüldü")
    print(f"  Manuel:  {c3} kayıt insan müdahalesi bekliyor")
    print("="*60)
    
    if not DRY_RUN and total > 0:
        save_db(db)
        print(f"\n✅ db.json güncellendi ({total} değişiklik)")
    elif DRY_RUN:
        print(f"\n📋 Dry-run tamamlandı. Uygulamak için: python fix_all.py --apply --backup")

if __name__ == "__main__":
    main()
