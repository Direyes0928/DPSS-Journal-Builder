#!/usr/bin/env python3
import json
from pathlib import Path
import re

ROOT = Path('templates')
pattern = re.compile(r'long description', re.I)

bad_files = []
for p in ROOT.rglob('*.json'):
    try:
        data = json.loads(p.read_text())
    except Exception as e:
        continue
    if 'sections' not in data or not isinstance(data['sections'], list):
        continue
    ids = [s.get('id','') for s in data['sections']]
    # check for title LONG DESCRIPTION
    long_titles = [s for s in data['sections'] if isinstance(s.get('title',''), str) and pattern.search(s.get('title',''))]
    # check contiguous ids
    expected = [f'section_{i+1}' for i in range(len(ids))]
    if ids != expected or long_titles:
        bad_files.append((str(p), ids, expected, [s.get('title') for s in long_titles]))

if not bad_files:
    print('All templates OK')
else:
    print('Issues found:')
    for bf in bad_files:
        print(bf[0])
        print('  ids:', bf[1])
        print('  expected:', bf[2])
        if bf[3]: print('  long_titles:', bf[3])
print('Done')
