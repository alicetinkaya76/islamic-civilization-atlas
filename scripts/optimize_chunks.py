#!/usr/bin/env python3
"""
dia_chunks.json Size Optimizer — Session 29 (A1)
=================================================
Reduces dia_chunks.json from ~69 MB to ~35 MB by:
  1. Stripping excess whitespace from text fields
  2. Removing "Bibliyografya" / "Literatur" / bibliography chunks
  3. Removing empty or near-empty chunks (<20 words)
  4. Trimming very long chunks (>600 words → cap at 500 + "...")
  5. Removing redundant fields (keep only what MiniSearch needs)
  6. Compact JSON output (no indentation)

Usage:
    python scripts/optimize_chunks.py --input public/data/dia_chunks.json --output public/data/dia_chunks.json

The script overwrites the input file if --output is the same path.
"""

import json
import re
import argparse
import sys
from pathlib import Path


# Patterns that indicate bibliography/literature sections
BIBL_PATTERNS = re.compile(
    r'(?:bibliyograf|bibliograph|literatu[rü]|kaynakça|sources?\s*$)',
    re.IGNORECASE
)

# Patterns for content that is mostly references (author names, book titles, page nums)
REF_HEAVY_PATTERN = re.compile(
    r'(?:\b[A-Z][a-z]+\s*,\s*[A-Z]\.\s*){3,}|'  # "Smith, J., Jones, K., Brown, L.,"
    r'(?:s\.\s*\d+[-–]\d+\s*[;,]?\s*){3,}|'       # "s. 123-456; s. 789-012;"
    r'(?:\bI{1,3}V?\b\s*,\s*\d+\s*[;,]?\s*){3,}'  # "IV, 123; II, 456;"
)

MULTI_SPACE = re.compile(r'\s+')


def is_bibl_chunk(chunk):
    """Check if chunk is a bibliography/literature section."""
    sec = chunk.get('sec', '') or ''
    if BIBL_PATTERNS.search(sec):
        return True
    # Check chunk id
    cid = chunk.get('id', '') or ''
    if BIBL_PATTERNS.search(cid):
        return True
    return False


def is_ref_heavy(text):
    """Check if text is predominantly references/citations."""
    if len(text) < 50:
        return False
    matches = REF_HEAVY_PATTERN.findall(text)
    ref_chars = sum(len(m) for m in matches)
    return ref_chars > len(text) * 0.4


def clean_text(text):
    """Strip excess whitespace, normalize spaces."""
    if not text:
        return ''
    # Collapse multiple spaces/newlines
    text = MULTI_SPACE.sub(' ', text).strip()
    return text


def truncate_text(text, max_words=500):
    """Truncate text at a sentence boundary near max_words."""
    words = text.split()
    if len(words) <= max_words:
        return text
    # Try to cut at sentence boundary
    candidate = ' '.join(words[:max_words])
    last_period = candidate.rfind('. ')
    if last_period > len(candidate) * 0.7:
        return candidate[:last_period + 1]
    return candidate + '...'


def optimize(chunks, verbose=False):
    """Apply all optimizations and return filtered list."""
    stats = {
        'input': len(chunks),
        'bibl_removed': 0,
        'empty_removed': 0,
        'ref_heavy_removed': 0,
        'truncated': 0,
        'output': 0,
    }
    
    result = []
    
    for chunk in chunks:
        # 1. Remove bibliography chunks
        if is_bibl_chunk(chunk):
            stats['bibl_removed'] += 1
            continue
        
        # 2. Clean text
        text = clean_text(chunk.get('t', ''))
        
        # 3. Remove empty/near-empty chunks
        word_count = len(text.split())
        if word_count < 20:
            stats['empty_removed'] += 1
            continue
        
        # 4. Remove reference-heavy chunks
        if is_ref_heavy(text):
            stats['ref_heavy_removed'] += 1
            continue
        
        # 5. Truncate very long chunks
        if word_count > 600:
            text = truncate_text(text, 500)
            stats['truncated'] += 1
        
        # 6. Build optimized chunk — only essential fields
        optimized = {
            '_id': chunk.get('_id', 0),
            's': chunk.get('s', ''),        # slug
            'n': clean_text(chunk.get('n', '')),  # name
            't': text,                       # text
        }
        
        # Only include optional fields if non-empty
        a = clean_text(chunk.get('a', ''))
        if a:
            optimized['a'] = a  # arabic title
        
        d = clean_text(chunk.get('d', ''))
        if d:
            optimized['d'] = d  # death date
        
        sec = clean_text(chunk.get('sec', ''))
        if sec:
            optimized['sec'] = sec  # section title
        
        c = chunk.get('c', 0)
        if c:
            optimized['c'] = c  # chunk index (skip if 0)
        
        result.append(optimized)
    
    # Re-assign sequential IDs
    for i, chunk in enumerate(result):
        chunk['_id'] = i
    
    stats['output'] = len(result)
    return result, stats


def main():
    parser = argparse.ArgumentParser(description='Optimize dia_chunks.json size')
    parser.add_argument('--input', '-i', required=True, help='Input JSON file')
    parser.add_argument('--output', '-o', required=True, help='Output JSON file')
    parser.add_argument('--verbose', '-v', action='store_true')
    args = parser.parse_args()
    
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"❌ Input not found: {input_path}", file=sys.stderr)
        sys.exit(1)
    
    input_size = input_path.stat().st_size / (1024 * 1024)
    print(f"📂 Input: {input_path} ({input_size:.1f} MB)")
    
    with open(input_path, 'r', encoding='utf-8') as f:
        chunks = json.load(f)
    
    print(f"   {len(chunks)} chunks loaded")
    
    result, stats = optimize(chunks, verbose=args.verbose)
    
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, separators=(',', ':'))
    
    output_size = output_path.stat().st_size / (1024 * 1024)
    reduction = ((input_size - output_size) / input_size) * 100
    
    print(f"\n{'='*60}")
    print(f"✅ Output: {output_path}")
    print(f"📊 Results:")
    print(f"   Input chunks:      {stats['input']:,}")
    print(f"   Output chunks:     {stats['output']:,}")
    print(f"   Bibl removed:      {stats['bibl_removed']:,}")
    print(f"   Empty removed:     {stats['empty_removed']:,}")
    print(f"   Ref-heavy removed: {stats['ref_heavy_removed']:,}")
    print(f"   Truncated:         {stats['truncated']:,}")
    print(f"   Size: {input_size:.1f} MB → {output_size:.1f} MB ({reduction:.0f}% reduction)")
    print(f"   Est. gzip: ~{output_size * 0.25:.1f} MB")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
