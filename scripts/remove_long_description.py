#!/usr/bin/env python3
import json
from pathlib import Path
import re

ROOT = Path('templates')
pattern = re.compile(r'long description', re.I)

modified = []
for p in ROOT.rglob('*.json'):
    try:
        data = json.loads(p.read_text())
    except Exception as e:
        # skip non-json or parse errors
        continue
    if 'sections' not in data or not isinstance(data['sections'], list):
        continue
    sections = data['sections']
    # detect sections to remove
    new_sections = [s for s in sections if not (isinstance(s.get('title',''), str) and pattern.search(s.get('title','')))]
    if len(new_sections) == len(sections):
        continue
    # backup
    bak = p.with_suffix(p.suffix + '.bak')
    bak.write_text(json.dumps(data, indent=2))
    # renumber ids
    for i, s in enumerate(new_sections, start=1):
        s['id'] = f'section_{i}'
    data['sections'] = new_sections
    p.write_text(json.dumps(data, indent=2) + '\n')
    modified.append(str(p))

print('Modified files:')
for m in modified:
    print(m)
print('Done.')