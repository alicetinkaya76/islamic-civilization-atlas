# Next Session — Oturum 3 Devam: API ile Kalan AR İçerik

## Durum
- v5.2.1.0: Tier 1 isimler (802/802) + glossary (52/52) tamamlandı
- Kalan: 4,710 hücre (rulers, narratives, causal, short fields)

## Hemen Yapılacak

### 1. Ruler İsimleri (830 kayıt, ~$0.50)
```bash
cd scripts/ar_translate
export ANTHROPIC_API_KEY=sk-ant-...
python translate_ar.py --tier 1 --entity rulers --batch-size 50
```

### 2. Narratives — Tüm Entity'ler (~$3-4)
```bash
python translate_ar.py --tier 3 --all
# Sıra: dynasties(10/batch) → scholars(15) → battles(15) → events(20) → monuments(15) → cities(20) → routes(15) → madrasas(20) → diplomacy(15)
# Toplam ~56 API çağrısı, ~2-3 saat
```

### 3. Short Fields + Causal (~$0.50)
```bash
python translate_ar.py --tier 4 --all
```

### 4. Doğrulama
```bash
python translate_ar.py --validate
python translate_ar.py --stats
```

### 5. Tag
```bash
git add -A
git commit -m "feat: full Arabic content — 5,500+ translation cells populated"
git tag v5.3.0.0
```

## Script Özellikleri
- Progress tracking: kesintide kaldığı yerden devam eder
- Backup: her tier öncesi otomatik yedek
- Retry: API hataları için 3 deneme + exponential backoff
- Validation: boş alan, düşük AR oranı, uzunluk tutarlılığı kontrolü
