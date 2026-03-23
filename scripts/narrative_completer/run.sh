#!/bin/bash
# islamicatlas.org - Narrative Completer
# 50/581 already done, 531 remaining
# Est. cost: ~$1-2, time: ~3-5 min

pip install anthropic -q 2>/dev/null

if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "Usage: ANTHROPIC_API_KEY=sk-... ./run.sh"
  echo "Or:    python3 complete_narratives.py --key sk-..."
  exit 1
fi

python3 complete_narratives.py --key "$ANTHROPIC_API_KEY"

echo ""
echo "Done! Output: data/db_completed.json"
echo "Copy to repo: cp data/db_completed.json /path/to/islamic-civilization-atlas/src/data/db.json"
