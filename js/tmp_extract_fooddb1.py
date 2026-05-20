import re
from pathlib import Path
path = Path('foodDB1.js')
text = path.read_text(encoding='utf-8')
start = text.index('// ==========================
  // 2: 면 (Category 2)
  // ==========================')
segment = text[start:]
objs = []
idx = 0
while True:
    m = re.search(r'{\n\s*"id":', segment[idx:])
    if not m:
        break
    i = idx + m.start()
    depth = 0
    in_str = False
    esc = False
    for j, ch in enumerate(segment[i:], start=i):
        if in_str:
            if esc:
                esc = False
            elif ch == '\\':
                esc = True
            elif ch == '"':
                in_str = False
        else:
            if ch == '"':
                in_str = True
            elif ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    objs.append(segment[i:j+1])
                    idx = j+1
                    break
for obj in objs:
    m = re.search(r'"id":\s*(\d+).*?"name":\s*"([^"]+)"', obj, re.S)
    if m:
        print(m.group(1), m.group(2))
print('TOTAL', len(objs))
