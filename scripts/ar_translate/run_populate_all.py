#!/usr/bin/env python3
"""
run_populate_all.py — Master script: populate ALL Arabic content into db.json and aux files
This runs without API calls — uses pre-compiled data maps.

Usage: python run_populate_all.py [--dry-run]
"""

import json, sys, re, shutil
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
SRC_DATA = PROJECT_ROOT / "src" / "data"
DB_PATH = SRC_DATA / "db.json"
BACKUP_DIR = SCRIPT_DIR / "backups"

# Import name maps
sys.path.insert(0, str(SCRIPT_DIR))
from populate_ar_names import DYNASTY_AR, BATTLE_AR, EVENT_AR
from populate_ar_names_ext import CITY_AR, MONUMENT_AR, ROUTE_AR, MADRASA_AR, SCHOLAR_AR

# ═══════════════════════════════════════════════════════════════════════
# GLOSSARY — direct Arabic terms and definitions
# ═══════════════════════════════════════════════════════════════════════

GLOSSARY_AR = {
    1:  ("خليفة", "القائد السياسي والديني للأمة الإسلامية بعد وفاة النبي محمد صلى الله عليه وسلم. كلمة خليفة تعني الذي يخلف أو ينوب."),
    2:  ("سلطان", "لقب الحاكم المستقل. انتشر منذ عهد الغزنويين وأصبح أعلى لقب سياسي في العهد العثماني."),
    3:  ("أمير", "لقب القائد العسكري أو والي الإقليم. أمير المؤمنين هو لقب الخليفة."),
    4:  ("وزير", "المساعد الأول للخليفة أو السلطان والرئيس الفعلي لإدارة الدولة. تم تنظيمه مؤسسيا في العهد العباسي."),
    5:  ("مدرسة", "مؤسسة التعليم العالي في العالم الإسلامي لتدريس العلوم الشرعية كالفقه والحديث والتفسير والكلام. نظمت في عهد السلاجقة من خلال المدارس النظامية."),
    6:  ("رباط", "حصن ديني عسكري على الحدود يعمل كقاعدة دفاعية وتكية صوفية في آن واحد. انتشر في شمال أفريقيا."),
    7:  ("وقف", "مال محبوس على جهة بر لا يباع ولا يورث. كان المصدر الأساسي لتمويل التعليم والصحة والخدمات الاجتماعية في الحضارة الإسلامية."),
    8:  ("إقطاع", "نظام تخصيص أراضي الدولة مع عائداتها الضريبية للمسؤولين العسكريين أو المدنيين. انتشر في عهد البويهيين والسلاجقة."),
    9:  ("ديوان", "جهاز إداري حكومي أو وزارة. بدأ كنظام تسجيل مالي في عهد الخليفة عمر ثم تطور ليصبح مجلس الدولة."),
    10: ("فتوى", "رأي ديني شرعي يصدره عالم مؤهل (مفتي) في مسألة محددة من مسائل الفقه الإسلامي."),
    11: ("سلالة حاكمة", "سلسلة من الحكام المتعاقبين من نفس الأسرة يمارسون السلطة السياسية عبر الأجيال."),
    12: ("أمة", "مفهوم المجتمع الإسلامي العالمي الذي يتجاوز الفوارق العرقية واللغوية والجغرافية."),
    13: ("شريعة", "النظام القانوني الإسلامي المستمد من القرآن والسنة والإجماع والقياس."),
    14: ("فقه", "علم الفقه الإسلامي؛ التخصص العلمي الذي يبحث في الأحكام العملية وتطبيقات الشريعة."),
    15: ("حديث", "ما نقل عن النبي محمد صلى الله عليه وسلم من قول أو فعل أو تقرير. المصدر الثاني للتشريع الإسلامي بعد القرآن."),
    16: ("جهاد", "في اللغة العربية بمعنى الجهد والمكابدة. يشمل في الإسلام مجاهدة النفس (الجهاد الأكبر) والدفاع المشروع (الجهاد الأصغر)."),
    17: ("غزوة", "حملة عسكرية شارك فيها النبي محمد صلى الله عليه وسلم بنفسه. الحملات التي لم يشارك فيها تسمى سرايا."),
    18: ("فتنة", "فترة صراع داخلي وانقسام كبير في المجتمع المسلم. وقعت عدة فتن كبرى في التاريخ أولاها بدأت باستشهاد الخليفة عثمان."),
    19: ("بيعة", "عهد الولاء للخليفة أو الحاكم؛ العقد السياسي الأساسي لإقامة السلطة الشرعية في الإسلام."),
    20: ("خلافة", "مؤسسة الدولة الإسلامية تحت سلطة الخليفة. استمرت بأشكال مختلفة من سنة 632 حتى 1924."),
    21: ("سلطنة", "شكل الدولة التي يحكمها سلطان. النظام الحكومي لدول مثل الغزنويين وسلطنة دلهي والعثمانيين."),
    22: ("بكوية", "وحدة سياسية صغيرة يحكمها بك. تطلق خاصة على الإمارات التركمانية التي ظهرت بعد انهيار سلاجقة الأناضول."),
    23: ("خانية", "دولة يحكمها خان. لقب مستمد من التقاليد السياسية المغولية والتركية، استخدم في دول كالقبيلة الذهبية وخانية القرم."),
    24: ("أتابك", "قائد عسكري مسؤول عن تربية ووصاية الأمراء السلاجقة الصغار. كثير منهم أسسوا أسرا حاكمة مستقلة."),
    25: ("تفسير", "علم شرح وتأويل القرآن الكريم. من أبرز المفسرين الطبري والقرطبي وابن كثير."),
    26: ("مذهب", "مدرسة فقهية في الشريعة الإسلامية. المذاهب الأربعة الكبرى هي الحنفي والمالكي والشافعي والحنبلي."),
    27: ("حج", "ركن الإسلام الخامس. فريضة الحج إلى مكة المكرمة مرة في العمر لمن استطاع إليه سبيلا."),
    28: ("جزية", "ضريبة تفرض على أهل الذمة (غير المسلمين) مقابل حماية الدولة وإعفائهم من الخدمة العسكرية."),
    29: ("صوفية", "البعد الروحي والتصوفي في الإسلام. يركز على تزكية النفس والسلوك إلى الله من خلال الذكر والمجاهدة."),
    30: ("بيمارستان", "مستشفى في العالم الإسلامي. من أبرزها بيمارستان نور الدين في دمشق والبيمارستان المنصوري في القاهرة."),
    31: ("فتح", "الفتوحات الإسلامية التي نشرت الإسلام في مساحات شاسعة من آسيا وأفريقيا وأوروبا."),
    32: ("حصار", "عملية عسكرية لمحاصرة مدينة أو قلعة. من أشهر الحصارات: حصار القسطنطينية وحصار فيينا."),
    33: ("قصر", "المقر الملكي أو الحكومي. من أشهر القصور الإسلامية: قصر الحمراء وقصر طوبقابي."),
    34: ("قلعة", "حصن دفاعي. انتشرت القلاع في العالم الإسلامي لحماية المدن والطرق التجارية."),
    35: ("خراج", "ضريبة الأرض المفروضة على المنتجات الزراعية. كانت من أهم مصادر دخل الدولة الإسلامية."),
    36: ("قاضي", "القاضي الشرعي المكلف بالفصل في المنازعات وفق أحكام الشريعة الإسلامية."),
    37: ("علم الكلام", "علم العقيدة الإسلامية الذي يبحث في أصول الدين بالأدلة العقلية والنقلية."),
    38: ("إسناد", "سلسلة الرواة التي ينقل بها الحديث. علم الإسناد من أهم أدوات نقد الحديث والتحقق من صحته."),
    39: ("خان", "نزل للمسافرين والتجار على طرق القوافل. من المؤسسات الأساسية في شبكة التجارة الإسلامية."),
    40: ("طريقة", "مدرسة صوفية ذات منهج روحي وسلسلة شيوخ متصلة. من أبرزها القادرية والنقشبندية والتجانية."),
    41: ("منبر", "المكان المرتفع في المسجد الذي يخطب منه الإمام يوم الجمعة. رمز للسلطة الدينية والسياسية."),
    42: ("محراب", "التجويف في جدار القبلة الذي يشير إلى اتجاه مكة المكرمة. من أبرز العناصر المعمارية في المسجد."),
    43: ("مئذنة", "البرج الذي يؤذن منه للصلاة. تطورت أشكاله المعمارية عبر العصور والأقاليم."),
    44: ("عرب", "الشعب العربي الذي نشأ في شبه الجزيرة العربية وحمل رسالة الإسلام إلى العالم."),
    45: ("إجازة", "شهادة أو إذن علمي يمنحه الشيخ لتلميذه بعد إتمام دراسة معينة، يخوله رواية الحديث أو تدريس العلم."),
    46: ("رحلة", "تقليد الرحلة في طلب العلم، وأيضا أدب الرحلات الجغرافية. من أبرز الرحالة ابن بطوطة وابن جبير."),
    47: ("حسبة", "نظام الرقابة على الأسواق والأخلاق العامة. المحتسب هو الموظف المكلف بالأمر بالمعروف والنهي عن المنكر."),
    48: ("دار الإسلام", "الأراضي الخاضعة للحكم الإسلامي حيث تطبق أحكام الشريعة."),
    49: ("ثغر", "منطقة حدودية محصنة بين دار الإسلام ودار الحرب. الثغور كانت خط الدفاع الأول ومراكز الجهاد."),
    50: ("مقدمة", "المقدمة العلمية أو الفلسفية لمؤلف ما. أشهرها مقدمة ابن خلدون في فلسفة التاريخ وعلم العمران."),
}

# ═══════════════════════════════════════════════════════════════════════
# CAUSAL DESCRIPTIONS (dar field) — built from dtr/den
# ═══════════════════════════════════════════════════════════════════════

# These will be generated via API — placeholder for the script structure
# The translate_ar.py script handles this via --tier 4


def backup_db():
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    dest = BACKUP_DIR / f"db_pre_ar_populate_{ts}.json"
    shutil.copy2(DB_PATH, dest)
    print(f"  ✓ Backup: {dest.name}")


def populate_names(db, dry_run=False):
    """Populate all entity 'ar' name fields"""
    name_maps = {
        "dynasties": DYNASTY_AR,
        "battles": BATTLE_AR,
        "events": EVENT_AR,
        "cities": CITY_AR,
        "monuments": MONUMENT_AR,
        "scholars": SCHOLAR_AR,
        "routes": ROUTE_AR,
        "madrasas": MADRASA_AR,
    }
    
    total = 0
    for coll, ar_map in name_maps.items():
        count = 0
        for item in db[coll]:
            eid = item.get("id")
            if eid in ar_map and ar_map[eid]:
                if not dry_run:
                    item["ar"] = ar_map[eid]
                count += 1
        total += count
        print(f"  {'[DRY] ' if dry_run else ''}✓ {coll}: {count}/{len(db[coll])} names")
    
    return total


def populate_glossary(dry_run=False):
    """Write term_ar and def_ar into glossary.js"""
    glossary_path = SRC_DATA / "glossary.js"
    content = glossary_path.read_text(encoding="utf-8")
    
    count = 0
    for gid, (term_ar, def_ar) in GLOSSARY_AR.items():
        # Escape single quotes for JS
        term_escaped = term_ar.replace("'", "\\'")
        def_escaped = def_ar.replace("'", "\\'")
        
        # Replace term_ar: '' with term_ar: 'VALUE' for this id
        pattern = rf"(id:\s*{gid},\s*term_tr:\s*'[^']*',\s*term_en:\s*'[^']*',\s*term_ar:\s*)''"
        new_content = re.sub(pattern, rf"\g<1>'{term_escaped}'", content)
        if new_content != content:
            content = new_content
        
        # Replace def_ar: '' 
        pattern2 = rf"(id:\s*{gid},[^}}]*def_ar:\s*)''"
        new_content2 = re.sub(pattern2, rf"\g<1>'{def_escaped}'", content)
        if new_content2 != content:
            content = new_content2
            count += 1
    
    if not dry_run:
        glossary_path.write_text(content, encoding="utf-8")
    print(f"  {'[DRY] ' if dry_run else ''}✓ glossary.js: {count}/{len(GLOSSARY_AR)} entries")
    return count


def populate_ruler_names(db, dry_run=False):
    """Populate ruler 'ar' field from their existing n/fn fields using transliteration→Arabic mapping"""
    # For rulers, we need API or a comprehensive map. 
    # For now, let's populate the ones we can derive from scholar/dynasty data
    # This is a stub — full ruler names (830) should use translate_ar.py --tier 1 --entity rulers
    print(f"  ⏭ rulers: 0/830 (requires API — use translate_ar.py --tier 1 --entity rulers)")
    return 0


def print_stats(db):
    """Print AR coverage statistics"""
    print("\n" + "═" * 60)
    print("  ARABIC CONTENT COVERAGE")
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


def main():
    dry_run = "--dry-run" in sys.argv
    
    print("═" * 60)
    print("  Islamic Dynasties Atlas — Arabic Content Population")
    print("═" * 60)
    
    # Load db
    with open(DB_PATH, "r", encoding="utf-8") as f:
        db = json.load(f)
    
    if not dry_run:
        backup_db()
    
    # 1. Entity names
    print("\n── TIER 1: Entity Names ──")
    name_count = populate_names(db, dry_run)
    ruler_count = populate_ruler_names(db, dry_run)
    
    # 2. Glossary
    print("\n── TIER 2: Glossary ──")
    glossary_count = populate_glossary(dry_run)
    
    # 3. Save
    if not dry_run:
        with open(DB_PATH, "w", encoding="utf-8") as f:
            json.dump(db, f, ensure_ascii=False, indent=2)
        print(f"\n✓ db.json saved")
    
    # 4. Stats
    # Reload for accurate stats
    with open(DB_PATH, "r", encoding="utf-8") as f:
        db = json.load(f)
    print_stats(db)
    
    # Summary
    total = name_count + glossary_count
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Total populated: {total} cells")
    print(f"\nRemaining work (requires translate_ar.py with API key):")
    print(f"  - 830 ruler names (--tier 1 --entity rulers)")
    print(f"  - All narrative fields (~4,135 cells) (--tier 3 --all)")
    print(f"  - Causal descriptions (200 cells) (--tier 4 --entity causal)")
    print(f"  - Short fields (scholars disc/city, monument type/city, etc.) (--tier 4 --all)")


if __name__ == "__main__":
    main()
