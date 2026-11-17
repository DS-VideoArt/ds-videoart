"""Writes tools/qa/content-baseline.json: every visible text fragment inside <main> of the given pages, as they are at
<commit>. The QA group "content" then checks that each fragment is still on the served page, so a redesign can move
and restyle the words but cannot drop a price, a promise or a sentence by accident.
Usage: python3 tools/qa/make-content-baseline.py <commit> page.html [page.html ...]   (merges into the existing file)"""
import html, json, os, re, subprocess, sys
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "content-baseline.json")
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}

class Texts(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True); self.stack = []; self.out = []; self.main = 0
    def handle_starttag(self, tag, attrs):
        if tag in VOID: return
        a = dict(attrs)
        hidden = a.get("aria-hidden") == "true" or tag in ("script", "style", "noscript", "svg") or "sr-only" in (a.get("class") or "")
        self.stack.append((tag, bool(hidden or (self.stack and self.stack[-1][1]))))
        if tag == "main": self.main += 1
    def handle_endtag(self, tag):
        if tag in VOID: return
        while self.stack:
            t, _ = self.stack.pop()
            if t == "main": self.main -= 1
            if t == tag: break
    def handle_data(self, d):
        if not self.main or (self.stack and self.stack[-1][1]): return
        t = re.sub(r"\s+", " ", d).strip()
        if len(t) >= 2: self.out.append(t)

commit, pages = sys.argv[1], sys.argv[2:]
data = json.load(open(OUT, encoding="utf-8")) if os.path.exists(OUT) else {}
data["commit"] = commit
for page in pages:
    src = subprocess.run(["git", "show", f"{commit}:{page}"], capture_output=True, text=True, check=True, cwd=os.path.join(HERE, "../..")).stdout
    p = Texts(); p.feed(src)
    seen = []
    for t in p.out:
        if t not in seen: seen.append(t)
    path = "/" + re.sub(r"(index)?\.html$", "", page)
    data.setdefault("pages", {})[path] = seen
    print(f"{path}: {len(seen)} fragments")
json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
