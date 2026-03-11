#!/usr/bin/env python3
"""
build_yaqut_data.py — Mu'cem el-Büldân veri dönüşüm scripti
Yâkût yaqut_entries.json → Atlas-ready JSON dosyaları

Girdiler:
  - data/yaqut_entries.json            (12.954 giriş)
  - data/yaqut_alam_crossref_enriched.json  (606 yer, 8.692 kişi)
  - data/yaqut_place_graph.json        (2.523 düğüm, 2.102 kenar)

Çıktılar:
  - src/data/yaqut_lite.json     (hafif liste: sidebar + filtre)
  - src/data/yaqut_crossref.json (Ziriklî cross-ref, by yaqut_id)
  - public/yaqut_detail.json     (tam detay, on-demand)
  - public/yaqut_graph.json      (yer-yer graf, on-demand)
"""

import json
import sys
import os
from pathlib import Path

# ─── Paths ───
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"
SRC_DATA = PROJECT_ROOT / "src" / "data"
PUBLIC_DIR = PROJECT_ROOT / "public"

ENTRIES_FILE = DATA_DIR / "yaqut_entries.json"
CROSSREF_FILE = DATA_DIR / "yaqut_alam_crossref_enriched.json"
GRAPH_FILE = DATA_DIR / "yaqut_place_graph.json"


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(data, path, indent=None):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=indent, separators=(",", ":") if indent is None else None)
    size_mb = os.path.getsize(path) / (1024 * 1024)
    print(f"  ✓ {path.name}: {size_mb:.2f} MB")


def truncate(s, maxlen=200):
    """Truncate string, adding '…' if too long."""
    if not s:
        return s
    return s[:maxlen - 1] + "…" if len(s) > maxlen else s


def build_lite(entries):
    """Build yaqut_lite.json — lightweight list for sidebar + filters."""
    lite = []
    for e in entries:
        coords = e.get("coordinates") or {}
        lat = coords.get("lat")
        lon = coords.get("lon")

        # Dates hijri → list
        dh = e.get("dates_hijri") or []

        # Notable persons count
        nps = e.get("notable_persons") or []
        evts = e.get("events") or []

        # Atlas tags
        tg = e.get("atlas_tags") or []

        # Alternate names
        an = e.get("alternate_names") or []

        item = {
            "id": e["id"],
            "h": e["heading"],                          # Arabic heading
            "ht": e.get("heading_tr", ""),               # TR heading
            "he": e.get("heading_en", ""),               # EN heading
            "st": truncate(e.get("summary_tr", ""), 160), # TR summary (short)
            "se": truncate(e.get("summary_en", ""), 160), # EN summary (short)
            "gt": e.get("geo_type_corrected") or e.get("geo_type", ""),
            "gtt": e.get("geo_type_tr", ""),
            "gte": e.get("geo_type_en", ""),
            "lt": e.get("letter", ""),                   # Arabic letter
        }

        # Optional fields (save space by omitting empty/zero)
        ct = e.get("modern_country", "")
        if ct: item["ct"] = ct
        rg = e.get("modern_region", "")
        if rg: item["rg"] = rg
        hp = e.get("historical_period", "")
        if hp: item["hp"] = hp
        if tg: item["tg"] = tg[:6]
        ds = e.get("dia_slug", "")
        if ds: item["ds"] = ds
        pc = e.get("alam_person_count", 0)
        if pc: item["pc"] = pc
        if nps: item["np"] = len(nps)
        if evts: item["ec"] = len(evts)
        py = e.get("poetry_count", 0)
        if py: item["py"] = py

        if lat is not None:
            item["lat"] = round(lat, 4)
            item["lon"] = round(lon, 4)
        if an:
            item["an"] = an[:5]
        if dh:
            item["dh"] = dh[:10]

        lite.append(item)

    return lite


def build_detail(entries):
    """Build yaqut_detail.json — full detail keyed by ID."""
    detail = {}
    for e in entries:
        d = {}

        # Full text (truncated to 3000 chars)
        ft = e.get("full_text", "")
        if ft:
            d["ft"] = ft[:3000]

        # Hareke
        hr = e.get("hareke")
        if hr:
            d["hr"] = hr

        # Etymology
        et = e.get("etymology")
        if et:
            d["et"] = et

        # Parent locations
        pl = e.get("parent_locations")
        if pl:
            d["pl"] = pl

        # Location relations
        lr = e.get("location_relations")
        if lr:
            d["lr"] = lr

        # Notable persons
        nps = e.get("notable_persons") or []
        if nps:
            d["np"] = [
                {
                    "na": p.get("name_ar", ""),
                    "nt": p.get("name_tr", ""),
                    "r": p.get("role", ""),
                    "d": p.get("death_h"),
                }
                for p in nps[:30]
            ]

        # Events
        evts = e.get("events") or []
        if evts:
            d["ev"] = [
                {
                    "y": ev.get("year_h"),
                    "d": ev.get("description_tr", ""),
                }
                for ev in evts[:20]
            ]

        # Quran refs
        qr = e.get("quran_refs")
        if qr:
            d["qr"] = qr

        # Page refs
        pr = e.get("page_refs")
        if pr:
            d["pr"] = pr

        # Coordinates text (Ptolemaic)
        ct = e.get("coordinates_text")
        if ct:
            d["ct"] = ct

        # DIA url
        dia = e.get("dia_url")
        if dia:
            d["dia"] = dia

        # Full summary (untruncated)
        st = e.get("summary_tr", "")
        se = e.get("summary_en", "")
        if st and len(st) > 250:
            d["sft"] = st
        if se and len(se) > 250:
            d["sfe"] = se

        # All alternate names
        an = e.get("alternate_names") or []
        if len(an) > 5:
            d["an"] = an

        # All atlas tags
        tg = e.get("atlas_tags") or []
        if len(tg) > 8:
            d["tg"] = tg

        # Alam cross refs (from entry itself, brief)
        acr = e.get("alam_cross_refs")
        if acr:
            d["acr"] = acr

        if d:  # Only include if there's detail data
            detail[str(e["id"])] = d

    return detail


def build_crossref(crossref_data):
    """Build yaqut_crossref.json — Ziriklî cross-references keyed by yaqut_id."""
    xrefs = crossref_data.get("cross_references", {})
    result = {}

    for place_name, place_data in xrefs.items():
        yid = place_data.get("yaqut_id")
        if not yid:
            continue

        persons = place_data.get("persons", [])
        if not persons:
            continue

        result[str(yid)] = [
            {
                "id": p.get("alam_id"),
                "ht": p.get("heading_tr", ""),
                "he": p.get("heading_en", ""),
                "pt": p.get("profession_tr", ""),
                "pe": p.get("profession_en", ""),
                "dh": p.get("death_hijri"),
                "dm": p.get("death_miladi"),
                "g": p.get("gender", "M"),
                "mz": p.get("madhab"),
                "dia": p.get("dia_url", ""),
            }
            for p in persons
        ]

    return result


def build_graph(graph_data):
    """Build yaqut_graph.json — place-place relationship graph."""
    raw_graph = graph_data.get("graph", {})
    nodes = []
    edges = []
    seen_edges = set()

    for place_name, info in raw_graph.items():
        pid = info.get("id")
        if not pid:
            continue
        nodes.append({"id": pid, "n": place_name})

        neighbors = info.get("neighbors", [])
        for nb in neighbors:
            # Look up neighbor ID
            nb_info = raw_graph.get(nb)
            if nb_info and nb_info.get("id"):
                nb_id = nb_info["id"]
                edge_key = tuple(sorted([pid, nb_id]))
                if edge_key not in seen_edges:
                    seen_edges.add(edge_key)
                    edges.append({"s": pid, "t": nb_id})

    return {"nodes": nodes, "edges": edges}


def main():
    print("═══ Mu'cem el-Büldân Veri Dönüşümü ═══\n")

    # Load
    print("Yükleniyor...")
    entries_raw = load_json(ENTRIES_FILE)
    entries = entries_raw.get("entries", entries_raw) if isinstance(entries_raw, dict) else entries_raw
    print(f"  Girişler: {len(entries)}")

    crossref_data = load_json(CROSSREF_FILE) if CROSSREF_FILE.exists() else {}
    print(f"  Cross-ref yerleri: {len(crossref_data.get('cross_references', {}))}")

    graph_data = load_json(GRAPH_FILE) if GRAPH_FILE.exists() else {"graph": {}}
    print(f"  Graf düğümleri: {len(graph_data.get('graph', {}))}")

    # Build
    print("\nDönüştürülüyor...")

    # 1) Lite
    lite = build_lite(entries)
    save_json(lite, SRC_DATA / "yaqut_lite.json")

    # 2) Detail
    detail = build_detail(entries)
    save_json(detail, PUBLIC_DIR / "yaqut_detail.json")

    # 3) Cross-ref
    crossref = build_crossref(crossref_data)
    save_json(crossref, SRC_DATA / "yaqut_crossref.json")

    # 4) Graph
    graph = build_graph(graph_data)
    save_json(graph, PUBLIC_DIR / "yaqut_graph.json")

    # Stats
    geocoded = sum(1 for e in lite if "lat" in e)
    with_dia = sum(1 for e in lite if e.get("ds"))
    with_persons = sum(1 for e in lite if e.get("np", 0) > 0)

    print(f"\n═══ Özet ═══")
    print(f"  Toplam giriş:     {len(lite):,}")
    print(f"  Koordinatlı:      {geocoded:,}")
    print(f"  DİA bağlantılı:   {with_dia:,}")
    print(f"  Kişili girişler:  {with_persons:,}")
    print(f"  Cross-ref yerler: {len(crossref):,}")
    print(f"  Graf düğüm/kenar: {len(graph['nodes']):,} / {len(graph['edges']):,}")
    print(f"\n✓ Tamamlandı!")


if __name__ == "__main__":
    main()
