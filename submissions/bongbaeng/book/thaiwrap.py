#!/usr/bin/env python
# Insert zero-width spaces (U+200B) between Thai words so Chrome breaks lines
# at word boundaries. Skips code fences and inline code; leaves markdown intact.
import re, sys
from pythainlp.tokenize import word_tokenize

ZWSP = "​"
thai_run = re.compile(r"[฀-๿]+")

def seg(m):
    return ZWSP.join(word_tokenize(m.group(0), engine="newmm"))

def process_inline(line):
    # protect inline `code` spans
    parts = re.split(r"(`[^`]*`)", line)
    out = []
    for p in parts:
        if p.startswith("`") and p.endswith("`"):
            out.append(p)
        else:
            out.append(thai_run.sub(seg, p))
    return "".join(out)

src = open(sys.argv[1], encoding="utf-8").read()
lines = src.split("\n")
out, in_code = [], False
for ln in lines:
    if ln.lstrip().startswith("```"):
        in_code = not in_code
        out.append(ln); continue
    if in_code:
        out.append(ln); continue
    out.append(process_inline(ln))
open(sys.argv[2], "w", encoding="utf-8").write("\n".join(out))
print("thai-wrapped →", sys.argv[2])
