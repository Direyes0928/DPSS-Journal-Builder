#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path('templates')
modified = []
for p in ROOT.rglob('*.json'):
    try:
        data = json.loads(p.read_text())
    except Exception as e:
        continue
    if 'sections' not in data or not isinstance(data['sections'], list):
        continue
    sections = data['sections']
    changed = False
    for i, s in enumerate(sections, start=1):
        expected = f'section_{i}'
        if s.get('id') != expected:
            s['id'] = expected
            changed = True
    if changed:
        bak = p.with_suffix(p.suffix + '.renumber.bak')
        bak.write_text(json.dumps(data, indent=2))
        p.write_text(json.dumps(data, indent=2) + '\n')
        modified.append(str(p))
print('Renumbered files:')
for m in modified:
    print(m)
print('Done')
