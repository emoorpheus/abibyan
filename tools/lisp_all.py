#!/usr/bin/env python3
import re, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def lisp(s):
    return s.replace('с', 'ш').replace('С', 'Ш')

# 1. Update src/data.js line by line for LINES
data_path = os.path.join(ROOT, 'src', 'data.js')
with open(data_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

in_lines = False
for i in range(len(lines)):
    l = lines[i]
    if 'const LINES = {' in l:
        in_lines = True
    elif in_lines and l.strip().startswith('};'):
        in_lines = False

    if in_lines:
        lines[i] = re.sub(r"'([^'\\]*(?:\\.[^'\\]*)*)'", lambda m: "'" + lisp(m.group(1)) + "'", l)

txt = ''.join(lines)

# Replace GPARTY monkey arrays
start_gp = txt.find('const GPARTY = {')
end_gp = txt.find('};', start_gp) + 2
gp_block = txt[start_gp:end_gp]
def lisp_gp(m):
    key = m.group(1)
    val = m.group(2)
    val = re.sub(r"'([^'\\]*(?:\\.[^'\\]*)*)'", lambda sm: "'" + lisp(sm.group(1)) + "'", val)
    return key + ': ' + val

new_gp = re.sub(r'\b(wow|thanks|coins|photo|bye)\s*:\s*(\[[^\]]+\])', lisp_gp, gp_block)
txt = txt[:start_gp] + new_gp + txt[end_gp:]

# Replace FRIENDS monkey dialogue: ['a', '...']
txt = re.sub(r"\[\s*'a'\s*,\s*'([^'\\]*(?:\\.[^'\\]*)*)'", lambda m: "['a', '" + lisp(m.group(1)) + "'", txt)

with open(data_path, 'w', encoding='utf-8') as f:
    f.write(txt)
print("src/data.js line-by-line updated.")

# 2. Update src/friends.js monkey lines
friends_path = os.path.join(ROOT, 'src', 'friends.js')
with open(friends_path, 'r', encoding='utf-8') as f:
    ftxt = f.read()

ftxt = ftxt.replace("'Ушёл в гости!'", "'Ушёл в гошти!'")
ftxt = ftxt.replace("'Морковка стесняется!'", "'Морковка штешняетшя!'")
ftxt = ftxt.replace("'Ну ты и хвастун, Перчик!'", "'Ну ты и хваштун, Перчик!'")

with open(friends_path, 'w', encoding='utf-8') as f:
    f.write(ftxt)
print("src/friends.js updated.")

# 3. Update src/tour.js
tour_path = os.path.join(ROOT, 'src', 'tour.js')
with open(tour_path, 'r', encoding='utf-8') as f:
    ttxt = f.read()

ttxt = ttxt.replace("'Почти первое место!'", "'Почти первое мешто!'")
ttxt = ttxt.replace("'В следующий раз я выиграю!'", "'В шледующий раз я выиграю!'")

with open(tour_path, 'w', encoding='utf-8') as f:
    f.write(ttxt)
print("src/tour.js updated.")

# 4. Update tools/lines.js
lines_tool_path = os.path.join(ROOT, 'tools', 'lines.js')
with open(lines_tool_path, 'r', encoding='utf-8') as f:
    ltxt = f.read()

ltxt = ltxt.replace("const add = (s) => { s = String(s).trim(); if (s) out.add(s); };",
                    "const lisp = (s) => String(s).replace(/с/g, 'ш').replace(/С/g, 'Ш');\nconst add = (s) => { s = lisp(String(s).trim()); if (s) out.add(s); };")

with open(lines_tool_path, 'w', encoding='utf-8') as f:
    f.write(ltxt)
print("tools/lines.js updated.")
