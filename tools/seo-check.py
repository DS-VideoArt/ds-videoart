#!/usr/bin/env python3
"""Static SEO QA for dscreative.co.il. Usage: python3 tools/seo-check.py [root-dir]
Checks core pages for exactly one title/description/canonical, robots meta, one H1, valid JSON-LD,
forbidden legacy/staging strings, internal link targets, sitemap and robots.txt. Exit 1 on failure."""
import json, os, re, sys
root = sys.argv[1] if len(sys.argv) > 1 else "."
PAGES = {  # file: (expected robots substring, expect_h1, expect_jsonld)
    "index.html": ("index, follow", True, True),
    "builder/index.html": ("noindex, follow", False, False),
    "privacy.html": ("index, follow", True, False),
    "legal/terms.html": ("index, follow", True, False),
    "legal/accessibility.html": ("index, follow", True, False),
    "404.html": ("noindex, follow", True, False),
    "card.html": ("noindex, follow", None, False),
    "qr.html": ("noindex, follow", None, False),
}
FORBIDDEN = ["localhost", "127.0.0.1", "netlify.app", "example.com", "DS VideoArt", "AI Commercials", "AI Creative Director", "staging."]
CORE_TEXT = list(PAGES) + ["analytics.js", "site.js", "manifest.json", "robots.txt", "sitemap.xml", "_headers"]
fails, notes = [], []
def read(p): return open(os.path.join(root, p), encoding="utf-8").read()
def count(pat, s): return len(re.findall(pat, s))
redirect_sources = set()
for line in read("_redirects").splitlines():
    line = line.strip()
    if line and not line.startswith("#"):
        redirect_sources.add(line.split()[0])
for page, (robots, h1, jsonld) in PAGES.items():
    s = read(page); head = s[: s.find("</head>")]
    if count(r"<title>", head) != 1: fails.append(f"{page}: title count {count(r'<title>', head)}")
    if count(r'<meta name="description"', head) != 1: fails.append(f"{page}: description count")
    if count(r'<link rel="canonical"', head) != (0 if page == "404.html" else 1): fails.append(f"{page}: canonical count")
    m = re.search(r'<meta name="robots" content="([^"]*)"', head)
    if not m or robots not in m.group(1): fails.append(f"{page}: robots meta '{m.group(1) if m else None}' expected '{robots}'")
    c = re.search(r'<link rel="canonical" href="([^"]*)"', head)
    if c and not c.group(1).startswith("https://dscreative.co.il/"): fails.append(f"{page}: canonical host {c.group(1)}")
    if c and c.group(1).endswith(".html"): fails.append(f"{page}: canonical ends with .html {c.group(1)}")
    n_h1 = count(r"<h1[\s>]", s)
    if h1 is True and n_h1 != 1: fails.append(f"{page}: h1 count {n_h1}")
    if h1 is False and n_h1 != 0: notes.append(f"{page}: has {n_h1} h1 (builder renders headings in JS)")
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
        try: json.loads(block)
        except Exception as e: fails.append(f"{page}: invalid JSON-LD: {e}")
    if jsonld:
        blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S)
        if len(blocks) != 1: fails.append(f"{page}: JSON-LD blocks {len(blocks)}")
        else:
            d = json.loads(blocks[0]); types = [g.get("@type") for g in d.get("@graph", [d])]
            for t in ("Organization", "WebSite"):
                if t not in types: fails.append(f"{page}: JSON-LD missing {t}")
            for g in d.get("@graph", []):
                if g.get("name") != "DS Creative Studio": fails.append(f"{page}: JSON-LD name {g.get('name')}")
                if g.get("url") != "https://dscreative.co.il/": fails.append(f"{page}: JSON-LD url {g.get('url')}")
    if page == "index.html":
        for tag in ("og:type", "og:locale", "og:site_name", "og:title", "og:description", "og:url", "og:image", "og:image:alt"):
            if count(rf'property="{tag}"', head) != 1: fails.append(f"index: {tag} count")
        if count(r'name="twitter:card"', head) != 1: fails.append("index: twitter:card")
        if 'content="https://dscreative.co.il/"' not in head: fails.append("index: og:url/canonical not canonical")
        if "DS Creative Studio" not in re.search(r"<title>(.*?)</title>", head).group(1): fails.append("index: brand not in title")
# card.html is a noindex digital business card whose visible copy still lists the old DS VideoArt areas (documented, not an SEO surface).
EXEMPT = {"card.html": {"DS VideoArt"}}
for f in CORE_TEXT:
    s = read(f)
    for bad in FORBIDDEN:
        if bad in s and bad not in EXEMPT.get(f, set()): fails.append(f"{f}: contains '{bad}'")
        elif bad in s: notes.append(f"{f}: contains '{bad}' (documented exception, page is noindex)")
# internal links from core pages
def exists(path):
    path = path.split("#")[0].split("?")[0]
    if not path or path.startswith(("http", "mailto:", "tel:", "javascript:")): return True
    if path in redirect_sources: return True
    p = path.lstrip("/")
    cands = [p, p + ".html", os.path.join(p, "index.html")] if p else ["index.html"]
    return any(os.path.exists(os.path.join(root, c)) for c in cands)
for page in ("index.html", "privacy.html", "legal/terms.html", "legal/accessibility.html", "404.html", "builder/index.html"):
    base = os.path.dirname(page)
    for href in re.findall(r'href="([^"]+)"', read(page)):
        if href.startswith("#") or href.startswith(("http", "mailto:", "tel:")): continue
        target = href if href.startswith("/") else "/" + os.path.normpath(os.path.join(base, href)).lstrip("./")
        if not exists(target): fails.append(f"{page}: broken internal link {href} -> {target}")
# sitemap
sm = read("sitemap.xml"); locs = re.findall(r"<loc>(.*?)</loc>", sm)
for u in locs:
    if not u.startswith("https://dscreative.co.il/"): fails.append(f"sitemap: non canonical {u}")
    if u.endswith(".html"): fails.append(f"sitemap: .html url {u}")
if len(locs) != len(set(locs)): fails.append("sitemap: duplicates")
rb = read("robots.txt")
if "Sitemap: https://dscreative.co.il/sitemap.xml" not in rb or "Disallow" in rb: fails.append("robots.txt unexpected")
print("SEO CHECK", "FAIL" if fails else "PASS", f"({len(fails)} failures)")
for f in fails: print("  FAIL:", f)
for n in notes: print("  note:", n)
print(f"  sitemap urls: {locs}")
sys.exit(1 if fails else 0)
