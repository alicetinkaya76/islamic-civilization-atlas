#!/usr/bin/env python3
"""
DİA HTML → Chunked JSON for MiniSearch RAG
==========================================
Parses TDV İslâm Ansiklopedisi HTML files into ~500-word chunks
for client-side search and Groq LLM context.

Usage:
    python scripts/prepare_dia_chunks.py --input ~/dia_html/ --output public/data/dia_chunks.json

Input:  Directory of slug-named HTML files (abbas-b-firnas.html, gazzali.html, ...)
Output: JSON array of chunk objects for MiniSearch indexing
"""

import os
import re
import json
import argparse
import sys
from html.parser import HTMLParser
from pathlib import Path


# ─── HTML Text Extractor ───────────────────────────────────────────────

class DiaHTMLExtractor(HTMLParser):
    """Extract structured content from a DİA article HTML file."""

    def __init__(self):
        super().__init__()
        self.title = ""
        self.arabic_title = ""
        self.death_date = ""
        self.description = ""
        self.authors = []
        self.sections = []  # [(section_id, section_title, text)]

        # Parser state
        self._in_article_title = False
        self._in_arabic_title = False
        self._in_article_info = False
        self._in_article_dt = False
        self._in_m_content = False
        self._in_bibl = False
        self._in_part_authors = False
        self._part_authors_span_depth = 0
        self._in_article_ps = False  # publication info div
        self._in_desc_span = False
        self._current_section_id = ""
        self._current_section_title = ""
        self._current_text = []
        self._depth = 0
        self._span_depth = 0
        self._m_content_depth = 0
        self._skip_depth = 0

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        cls = attrs_dict.get("class", "")

        # Track depth for nested div handling
        if tag == "div":
            self._depth += 1

        # Title: <div class="article_title"><h1>TITLE</h1></div>
        if tag == "h1" and self._check_parent_class("article_title"):
            self._in_article_title = True

        # Arabic title: <div class="arabic_title">
        if tag == "div" and "arabic_title" in cls:
            self._in_arabic_title = True

        # Article info (death date + description)
        if tag == "div" and "article_info" in cls:
            self._in_article_info = True
        if tag == "span" and "article-dt" in cls:
            self._in_article_dt = True

        # Article section: <div class="article-part" id="_1">
        if tag == "div" and "article-part" in cls:
            section_id = attrs_dict.get("id", "")
            # Derive section title from id: "_2-kelam-ilmindeki-yeri" → "Kelâm İlmindeki Yeri"
            self._current_section_id = section_id
            self._current_section_title = self._id_to_title(section_id)

        # Content div: <div class="m-content">
        if tag == "div" and "m-content" in cls:
            self._in_m_content = True
            self._m_content_depth = self._depth
            self._current_text = []

        # Bibliography: <bibl> — skip this
        if tag == "bibl":
            self._in_bibl = True

        # Publication info: <div class="article-ps"> — skip
        if tag == "div" and "article-ps" in cls:
            self._in_article_ps = True

        # Authors: <span class="part-authors">
        if tag == "span" and "part-authors" in cls:
            self._in_part_authors = True
            self._part_authors_span_depth = self._span_depth

        # Track span depth
        if tag == "span":
            self._span_depth += 1

        # Description color span inside article_info
        if tag == "span" and self._in_article_info and 'color:#e16328' in attrs_dict.get('style', ''):
            self._in_desc_span = True

        # Bold text in content — keep as-is (section headers like "Felsefesi. 1. Şüpheciliği")
        # Eser names — keep text
        # We just collect all text within m-content

    def handle_endtag(self, tag):
        if tag == "div":
            # Check if we're closing m-content
            if self._in_m_content and self._depth == self._m_content_depth:
                self._in_m_content = False
                text = " ".join(self._current_text).strip()
                if text:
                    self.sections.append((
                        self._current_section_id,
                        self._current_section_title,
                        text
                    ))
                self._current_text = []
            self._depth -= 1

        if tag == "h1":
            self._in_article_title = False
        if tag == "div" and self._in_arabic_title:
            self._in_arabic_title = False
        if tag == "span" and self._in_article_dt:
            self._in_article_dt = False
        if tag == "bibl":
            self._in_bibl = False
        if tag == "div" and self._in_article_ps:
            self._in_article_ps = False
        if tag == "span":
            self._span_depth -= 1
            if self._in_part_authors and self._span_depth == self._part_authors_span_depth:
                self._in_part_authors = False
            if self._in_desc_span:
                self._in_desc_span = False

    def handle_data(self, data):
        text = data.strip()
        if not text:
            return

        if self._in_article_title:
            self.title = text
        elif self._in_arabic_title:
            self.arabic_title = text
        elif self._in_article_dt:
            self.death_date = text
        elif self._in_part_authors:
            # Extract author name — skip "Müellif:" label
            if text and text != "Müellif:" and not text.startswith("Müellif"):
                name = text.strip()
                if name and name not in self.authors and len(name) > 2:
                    self.authors.append(name)
        elif self._in_m_content and not self._in_bibl and not self._in_article_ps:
            self._current_text.append(text)
        elif self._in_desc_span:
            if text and not self.description:
                self.description = text.strip()
        elif self._in_article_info and not self._in_article_dt and not self.description:
            # Fallback description from article_info h2
            pass

    def _check_parent_class(self, cls):
        """Simple heuristic — we set a flag when entering article_title div."""
        return True  # h1 is rare enough in these files

    @staticmethod
    def _id_to_title(section_id):
        """Convert section id to readable title: '_2-kelam-ilmindeki-yeri' → 'Kelam ilmindeki yeri'"""
        if not section_id or section_id == "_1":
            return ""
        # Remove leading underscore and number
        title = re.sub(r'^_\d+-?', '', section_id)
        title = title.replace('-', ' ').strip()
        return title.capitalize() if title else ""


# ─── Chunking Logic ────────────────────────────────────────────────────

def chunk_text(text, chunk_size=500, overlap=50):
    """
    Split text into ~chunk_size word chunks with overlap.
    Tries to break at sentence boundaries.
    """
    words = text.split()
    if len(words) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))

        # Try to find a sentence boundary near the end
        if end < len(words):
            chunk_text_candidate = " ".join(words[start:end])
            # Look for last sentence-ending punctuation
            last_period = max(
                chunk_text_candidate.rfind('. '),
                chunk_text_candidate.rfind('.) '),
                chunk_text_candidate.rfind('." '),
            )
            if last_period > len(chunk_text_candidate) * 0.6:
                # Recount words up to that point
                truncated = chunk_text_candidate[:last_period + 1]
                end = start + len(truncated.split())

        chunk = " ".join(words[start:end])
        chunks.append(chunk)

        # Move forward with overlap
        start = end - overlap if end < len(words) else end

    return chunks


def parse_html_file(filepath):
    """Parse a single DİA HTML file and return extracted data."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            html = f.read()
    except UnicodeDecodeError:
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            html = f.read()

    extractor = DiaHTMLExtractor()
    try:
        extractor.feed(html)
    except Exception as e:
        print(f"  ⚠ Parse error in {filepath}: {e}", file=sys.stderr)
        return None

    if not extractor.title and not extractor.sections:
        return None

    slug = Path(filepath).stem

    return {
        'slug': slug,
        'title': extractor.title,
        'arabic': extractor.arabic_title,
        'death': extractor.death_date,
        'desc': extractor.description,
        'authors': extractor.authors,
        'sections': extractor.sections,
    }


def process_article(article, chunk_size=500):
    """Convert a parsed article into search chunks."""
    chunks = []
    slug = article['slug']
    title = article['title']

    for section_id, section_title, text in article['sections']:
        # Add title context to each chunk
        prefix = title
        if section_title:
            prefix = f"{title} — {section_title}"

        text_chunks = chunk_text(text, chunk_size=chunk_size)

        for i, chunk_text_str in enumerate(text_chunks):
            chunk_id = f"{slug}-{section_id or '1'}-{i}"
            chunks.append({
                'id': chunk_id,
                's': slug,           # slug (for URL linking)
                'n': title,          # name/title
                'a': article.get('arabic', ''),  # arabic title
                'd': article.get('death', ''),   # death date
                'sec': section_title,             # section title
                't': chunk_text_str,              # text content
                'c': i,                           # chunk index within section
            })

    return chunks


# ─── Main ──────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='DİA HTML → Chunked JSON')
    parser.add_argument('--input', '-i', required=True,
                        help='Directory containing DİA HTML files')
    parser.add_argument('--output', '-o', default='public/data/dia_chunks.json',
                        help='Output JSON file path')
    parser.add_argument('--chunk-size', type=int, default=500,
                        help='Words per chunk (default: 500)')
    parser.add_argument('--limit', type=int, default=0,
                        help='Process only N files (0 = all)')
    parser.add_argument('--stats', action='store_true',
                        help='Print detailed statistics')
    parser.add_argument('--filter-slugs', type=str, default='',
                        help='Path to dia_lite.json — only process matching slugs')

    args = parser.parse_args()

    input_dir = Path(args.input)
    if not input_dir.is_dir():
        print(f"❌ Input directory not found: {input_dir}", file=sys.stderr)
        sys.exit(1)

    html_files = sorted(input_dir.glob('*.html'))
    if not html_files:
        print(f"❌ No HTML files found in {input_dir}", file=sys.stderr)
        sys.exit(1)

    # Filter by dia_lite.json slugs if provided
    allowed_slugs = None
    if args.filter_slugs:
        import json as _json
        with open(args.filter_slugs, 'r', encoding='utf-8') as _f:
            _data = _json.load(_f)
        allowed_slugs = set()
        for entry in _data:
            slug = entry.get('dia', '') or entry.get('slug', '') or entry.get('id', '')
            if slug:
                allowed_slugs.add(slug)
        before = len(html_files)
        html_files = [f for f in html_files if f.stem in allowed_slugs]
        print(f"🔍 Filter: {len(allowed_slugs)} slugs from {args.filter_slugs}")
        print(f"   {before} → {len(html_files)} HTML files after filtering")

    if args.limit > 0:
        html_files = html_files[:args.limit]

    print(f"📂 Found {len(html_files)} HTML files in {input_dir}")
    print(f"📝 Chunk size: {args.chunk_size} words")

    all_chunks = []
    success = 0
    failed = 0
    total_words = 0

    for i, filepath in enumerate(html_files):
        if (i + 1) % 500 == 0 or i == 0:
            print(f"  Processing {i + 1}/{len(html_files)}: {filepath.name}")

        article = parse_html_file(filepath)
        if article is None:
            failed += 1
            continue

        chunks = process_article(article, chunk_size=args.chunk_size)
        if chunks:
            all_chunks.extend(chunks)
            success += 1
            total_words += sum(len(c['t'].split()) for c in chunks)
        else:
            failed += 1

    # Assign sequential numeric IDs (MiniSearch needs this)
    for idx, chunk in enumerate(all_chunks):
        chunk['_id'] = idx

    # Write output
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_chunks, f, ensure_ascii=False)

    file_size = output_path.stat().st_size
    file_size_mb = file_size / (1024 * 1024)

    print(f"\n{'='*60}")
    print(f"✅ Output: {output_path}")
    print(f"📊 Statistics:")
    print(f"   Articles parsed:  {success}")
    print(f"   Articles failed:  {failed}")
    print(f"   Total chunks:     {len(all_chunks)}")
    print(f"   Total words:      {total_words:,}")
    print(f"   Avg chunks/article: {len(all_chunks)/max(success,1):.1f}")
    print(f"   File size:        {file_size_mb:.1f} MB")
    print(f"   Est. gzip size:   ~{file_size_mb * 0.25:.1f} MB")
    print(f"{'='*60}")

    if args.stats and all_chunks:
        # Sample output
        print(f"\n📋 Sample chunk (first):")
        sample = all_chunks[0]
        print(f"   id:   {sample['id']}")
        print(f"   slug: {sample['s']}")
        print(f"   name: {sample['n']}")
        print(f"   text: {sample['t'][:200]}...")


if __name__ == '__main__':
    main()
