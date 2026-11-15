#!/usr/bin/env python3
"""Static SEO QA for dscreative.co.il. Usage: python3 tools/seo-check.py [root-dir]
Checks core pages for exactly one title/description/canonical, robots meta, one H1, valid JSON-LD,
forbidden legacy/staging strings, internal link targets, sitemap and robots.txt. Exit 1 on failure."""
import json, os, re, sys
root = sys.argv[1] if len(sys.argv) > 1 else "."
PAGES = {  # file: (expected robots substring, expect_h1, expect_jsonld)
    "index.html": ("index, follow", True, True),
    "pricing.html": ("index, follow", True, False),
    "builder/index.html": ("noindex, follow", False, False),
    "privacy.html": ("index, follow", True, False),
    "haredi.html": ("index, follow", True, False),
    "legal/terms.html": ("index, follow", True, False),
    "legal/accessibility.html": ("index, follow", True, False),
    "404.html": ("noindex, follow", True, False),
    "card.html": ("noindex, follow", None, False),
    "qr.html": ("noindex, follow", None, False),
    "hub/index.html": ("index, follow", True, False),
    "hub/do-you-need-a-website.html": ("index, follow", True, False),
    "hub/landing-page-or-business-website.html": ("index, follow", True, False),
    "hub/how-much-does-a-website-cost.html": ("index, follow", True, False),
    "hub/which-pages-does-a-business-website-need.html": ("index, follow", True, False),
    "hub/what-to-prepare-before-building-a-website.html": ("index, follow", True, False),
    "hub/domain-hosting-who-owns-what.html": ("index, follow", True, False),
    "hub/website-is-live-what-now.html": ("index, follow", True, False),
    "hub/business-website-or-custom-system.html": ("index, follow", True, False),
    "hub/questions-before-ordering-a-website.html": ("index, follow", True, False),
    "hub/diy-ai-or-professional.html": ("index, follow", True, False),
    # V2 (October 2026): gallery, project pages, studio, contact
    "work/index.html": ("index, follow", True, False),
    "work/fit-with-nikita.html": ("index, follow", True, False),
    "work/golondon.html": ("index, follow", True, False),
    "work/bit-uborg.html": ("index, follow", True, False),
    "work/kemach-umayim.html": ("index, follow", True, False),
    "work/padel-layla.html": ("index, follow", True, False),
    "studio.html": ("index, follow", True, False),
    "contact.html": ("index, follow", True, False),
}
# the redesigned pages share the V2 chrome (tools/site-chrome.py); /builder/ and /haredi keep the classic one
V2_PAGES = [p for p in PAGES if p not in ("builder/index.html", "haredi.html", "card.html", "qr.html")]
FORBIDDEN = ["localhost", "127.0.0.1", "netlify.app", "example.com", "DS VideoArt", "AI Commercials", "AI Creative Director", "staging.", "עד 3 עמודים", "עד שלושה עמודים", "שלושה עמודים", "כולל עד 3", "דקות עבודה", "עד 30 דקות", "עד 90 דקות", "חצי שעה", "שעה וחצי", "6 עד 7 אזורי"]
# External live URLs the portfolio links to on purpose (decision 2026-09-25: no custom domain for the client site yet; the demo site stays on Netlify).
ALLOWED_EXTERNAL = ["https://fit-with-nikita-app.netlify.app/", "https://bit-uborg-demo.netlify.app/"]
CORE_TEXT = list(PAGES) + ["studio.css", "studio.js", "analytics.js", "site.js", "search.js", "builder/pricing-config.js", "builder/project-builder.js", "manifest.json", "robots.txt", "sitemap.xml", "_headers", "hub/content-hub.css", "home.css", "pricing.js"]
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
# Content Hub schema checks
for page, want in (("hub/do-you-need-a-website.html", {"Article", "BreadcrumbList", "Organization"}), ("hub/landing-page-or-business-website.html", {"Article", "BreadcrumbList", "Organization"}), ("hub/how-much-does-a-website-cost.html", {"Article", "BreadcrumbList", "Organization"}), ("hub/which-pages-does-a-business-website-need.html", {"Article", "BreadcrumbList", "Organization"}), ("hub/what-to-prepare-before-building-a-website.html", {"Article", "BreadcrumbList", "Organization"}), ("hub/domain-hosting-who-owns-what.html", {"Article", "BreadcrumbList", "Organization"}), ("hub/website-is-live-what-now.html", {"Article", "BreadcrumbList", "Organization"}), ("hub/business-website-or-custom-system.html", {"Article", "BreadcrumbList", "Organization"}), ("hub/questions-before-ordering-a-website.html", {"Article", "BreadcrumbList", "Organization"}), ("hub/diy-ai-or-professional.html", {"Article", "BreadcrumbList", "Organization"}), ("hub/index.html", {"CollectionPage", "BreadcrumbList"})):
    s = read(page); blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S)
    if len(blocks) != 1: fails.append(f"{page}: JSON-LD blocks {len(blocks)}")
    else:
        d = json.loads(blocks[0]); types = {g.get("@type") for g in d.get("@graph", [])}
        if not want <= types: fails.append(f"{page}: JSON-LD types {types} missing {want - types}")
        for g in d.get("@graph", []):
            if g.get("@type") == "Article":
                for k in ("headline", "description", "url", "mainEntityOfPage", "inLanguage", "datePublished", "dateModified", "image", "publisher"):
                    if k not in g: fails.append(f"{page}: Article missing {k}")
                if g.get("url") != re.search(r'<link rel="canonical" href="([^"]*)"', s).group(1): fails.append(f"{page}: Article url != canonical")
    for img in re.findall(r'<img[^>]+>', s):
        if 'alt=' not in img: fails.append(f"{page}: img without alt")
        if ('width=' not in img or 'height=' not in img): fails.append(f"{page}: img without dimensions")
for f in CORE_TEXT:
    s = read(f)
    for u in ALLOWED_EXTERNAL: s = s.replace(u, "")
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
for page in [p for p in PAGES if p not in ("card.html", "qr.html")]:
    base = os.path.dirname(page)
    for href in re.findall(r'href="([^"]+)"', read(page)):
        if href.startswith("#") or href.startswith(("http", "mailto:", "tel:")): continue
        target = href if href.startswith("/") else "/" + os.path.normpath(os.path.join(base, href)).lstrip("./")
        if not exists(target): fails.append(f"{page}: broken internal link {href} -> {target}")
# Content Hub cross-links between the two live articles
a1 = read("hub/do-you-need-a-website.html"); a2 = read("hub/landing-page-or-business-website.html")
if 'href="/hub/landing-page-or-business-website"' not in a1: fails.append("article 01 does not link to article 02")
if 'href="/hub/do-you-need-a-website"' not in a2: fails.append("article 02 does not link to article 01")
home = read("index.html")
# Homepage "Creative Worlds" (concept, 2026-10-27): an opening with two actions (talk, or plan with the builder), four worlds that
# lead to work, services, magazine and studio, an area for the builder, and a short invitation. Every picture is one of the
# art-directed series in /assets/worlds/ (no people). No article lists, no prices, no form.
_body = home[home.index("<body"):]
_main = _body[_body.index("<main"):_body.index("</main>")]
_open = _main[:_main.index('data-scene="gallery"')]
for _href in ("/contact", "/builder/"):
    if f'href="{_href}"' not in _open: fails.append(f"homepage: the opening needs its action to {_href}")
_ways = re.findall(r'<a class="w-go" href="([^"]+)"', _main)
if _ways != ["/work/", "/pricing", "/hub/", "/studio"]: fails.append(f"homepage: the four worlds should lead to work, services, magazine and studio, got {_ways}")
if 'class="w-build"' not in _main or _main[_main.index('class="w-build"'):].count('href="/builder/"') < 1: fails.append("homepage: the builder area needs its link to /builder/")
for _src in re.findall(r'(?:src|srcset)="([^"]+)"', _main):
    for _u in re.findall(r"(/[^\s,]+)", _src):
        if not _u.startswith("/assets/worlds/"): fails.append(f"homepage: picture outside the worlds series: {_u}")
for _img in re.findall(r"<img\b[^>]*>", _main):
    if 'alt="' not in _img: fails.append("homepage: every picture needs an alt attribute")
if re.search(r'href="/hub/[a-z]', _main): fails.append("homepage: article links belong in the magazine")
if "₪" in _body or re.search(r"\b(440|1,290|149|349)\b", _body): fails.append("homepage: prices belong on /pricing only")
if "<form" in _body: fails.append("homepage: the contact form lives on /contact")
_words = len(re.sub(r"<[^>]+>", " ", re.sub(r"<svg.*?</svg>", " ", _main, flags=re.S)).split())
if _words > 320: fails.append(f"homepage: keep the worlds short, {_words} words")
# the old homepage sections live on their own pages now: their anchors forward there and keep the query
for _id in ("work", "magazine", "services", "work-fit-with-nikita", "work-golondon", "complex"):
    if f'h === "#{_id}"' not in home: fails.append(f"homepage: old anchor #{_id} is not forwarded")
# no people in screenshots: these two captures show a passer-by and a hand
for page in V2_PAGES:
    if re.search(r"golondon-desktop\.jpg|computer-lab-", read(page)): fails.append(f"{page}: uses a screenshot with people in it")
# gallery and project pages: real and concept work stay apart and keep their notes
_w = read("work/index.html")
# the gallery (2026-11): real projects in their own dark room, concepts in a separate light room, each one labelled
_real = _w[_w.index('id="real"'):_w.index('id="concepts"')] if 'id="real"' in _w and 'id="concepts"' in _w else ""
_conc = _w[_w.index('id="concepts"'):] if 'id="concepts"' in _w else ""
if _real.count('data-kind="real"') != 2 or _conc.count('data-kind="concept"') != 3 or 'data-kind="concept"' in _real or 'data-kind="real"' in _conc:
    fails.append("work: expected 2 real projects in the real room and 3 concepts in the concept room")
if _real.count('class="tag tag-real">פרויקט') != 2 or _conc.count('class="tag tag-concept">') < 4 or "המחשה בלבד" not in _conc:
    fails.append("work: every work keeps its real or concept label, and the concept room keeps its note")
for _f, _txt in (("work/golondon.html", "פרויקט מסוג זה אינו חלק מחבילת אתר התדמית הבסיסית"), ("work/bit-uborg.html", "עסק בדיוני. השם, הפרטים, המחירים וההמלצות באתר הם המחשה בלבד."),
                 ("work/fit-with-nikita.html", "ומוצג כאן באישור הלקוח"), ("work/kemach-umayim.html", "עסק בדיוני"), ("work/padel-layla.html", "עסק בדיוני")):
    if _txt not in read(_f): fails.append(f"{_f}: note missing: {_txt}")
for _f in ["studio.html", "contact.html"] + [p for p in PAGES if p.startswith("work/")]:
    _b = read(_f); _b = _b[_b.index("<body"):]
    if "₪" in _b: fails.append(f"{_f}: prices belong on /pricing only")
# contact page: the same Netlify form as before (name and fields), so submissions and conversion tracking continue
_c = read("contact.html")
for _need in ('<form id="contactForm"', 'name="contact-request"', 'data-netlify="true"', 'netlify-honeypot="bot-field"', 'name="form-name" value="contact-request"',
              'name="builder_context"', 'name="utm_source"', 'name="utm_medium"', 'name="utm_campaign"', 'name="utm_content"', 'name="utm_term"', 'name="bot-field"', 'name="name"', 'name="phone"', 'name="service"'):
    if _need not in _c: fails.append(f"contact: form is missing {_need}")
# homepage redesign (2026-10-15): the detail sections live on /pricing, the homepage keeps the summary and forwards old anchors
pp = read("pricing.html")
_faq_ids = re.findall(r'<details class="faq" id="(faq-\d+)"', pp)
if sorted(_faq_ids, key=lambda x: int(x[4:])) != [f"faq-{i}" for i in range(1, 26)]: fails.append(f"pricing: expected faq-1..faq-25 once each, got {len(_faq_ids)}")
# the questions are grouped by topic: every group has a heading and a chip linking to it
_topics = re.findall(r'<div class="pp-faq-group[^"]*" id="(topic-[a-z]+)"', pp)
if len(_topics) < 4 or any(f'href="#{t}"' not in pp for t in _topics): fails.append(f"pricing: FAQ topic groups or their links missing {_topics}")
if 'class="pp-subnav"' not in pp or 'pricing.js?v=' not in pp: fails.append("pricing: sticky in-page navigation or its script missing")
for _id in ("packages", "package-landing", "package-website", "maintenance", "transparency", "process", "faq", "custom"):
    if f'id="{_id}"' not in pp: fails.append(f"pricing: anchor #{_id} missing")
for _price in ("440", "1,290", "149", "349", "220"):
    if _price not in pp: fails.append(f"pricing: price {_price} missing")
_fwd = re.search(r'/\^#\((.*?)\)\$/\.test\(h\)', home)
if not _fwd or 'location.replace("/pricing"' not in home: fails.append("homepage: forward of moved anchors to /pricing missing")
else:
    for _id in ("pricing", "process", "faq", "maintenance", "package-", "transparency"):
        if _id not in _fwd.group(1): fails.append(f"homepage: moved anchor #{_id} is not forwarded to /pricing")
if 'h === "#contact") location.replace("/contact"' not in home: fails.append("homepage: /#contact is not forwarded to /contact")
# the checklist (2026-10-19, 15 questions since 2026-10-20): the questions, one checkbox each, a print file, a separate DS area with one answer per question, links in from the sources
cl = read("hub/questions-before-ordering-a-website.html")
CL_QUESTIONS = 15
if len(re.findall(r'<li class="cl-item" id="q\d+">', cl)) != CL_QUESTIONS: fails.append(f"checklist: expected {CL_QUESTIONS} questions")
for _n in range(1, CL_QUESTIONS + 1):
    if f'id="q{_n}"' not in cl or f'<input class="cl-check" type="checkbox" id="c{_n}">' not in cl or f'<label for="c{_n}">' not in cl: fails.append(f"checklist: question {_n} needs its card, checkbox and label")
if not os.path.isfile(os.path.join(root, "hub/media/questions-before-ordering-a-website.pdf")): fails.append("checklist: print file hub/media/questions-before-ordering-a-website.pdf missing")
if cl.find('class="cl-ds"') < cl.rfind(f'id="q{CL_QUESTIONS}"'): fails.append("checklist: the DS answers must come after the last question")
if len(re.findall(r'<div><dt><span aria-hidden="true">\d+</span>', cl)) != CL_QUESTIONS: fails.append(f"checklist: expected {CL_QUESTIONS} DS answers, one per question")
if re.search(r'(?<![\d.,])(?:12 שאלות|12 השאלות|ל־12 השאלות)', cl): fails.append("checklist: still mentions 12 questions")
for _src in ("hub/how-much-does-a-website-cost.html", "hub/domain-hosting-who-owns-what.html", "hub/what-to-prepare-before-building-a-website.html", "hub/index.html", "pricing.html"):
    if 'href="/hub/questions-before-ordering-a-website"' not in read(_src): fails.append(f"{_src}: no link to the checklist")
# search: every public page with the standard nav carries the visible search field and the search script
for page in [p for p in PAGES if p not in ("builder/index.html", "card.html", "qr.html")]:
    s = read(page)
    if 'class="nav-search"' not in s and "data-search-open" not in s: fails.append(f"{page}: search field or button missing")
    if not re.search(r'<script src="(?:\.\./|/)?search\.js\?v=', s): fails.append(f"{page}: search.js missing")
# marketing short links /go/<slug>: temporary redirect (302, or 307) to an existing page on this site, with UTM, never in the sitemap
_go = {}
for _line in read("_redirects").splitlines():
    _p = _line.split()
    if not _p or not _p[0].startswith("/go/"): continue
    _src, _dst, _status = _p[0], (_p[1] if len(_p) > 1 else ""), (_p[2] if len(_p) > 2 else "")
    if _src in _go: fails.append(f"_redirects: {_src} defined twice")
    _go[_src] = _dst
    if not re.fullmatch(r"/go/[a-z0-9]+(?:-[a-z0-9]+)*", _src): fails.append(f"_redirects: {_src}: slug must be lowercase a-z, 0-9 and single hyphens")
    if _status not in ("302", "302!", "307", "307!"): fails.append(f"_redirects: {_src}: must be a temporary 302 (or 307) redirect so the target can change, got '{_status}'")
    _path, _, _query = _dst.partition("?")
    if not _path.startswith("/") or _path.startswith("//"): fails.append(f"_redirects: {_src}: target must be a page on this site, got {_dst}")
    _keys = {kv.split("=", 1)[0] for kv in _query.split("&") if "=" in kv}
    for _k in ("utm_source", "utm_medium", "utm_campaign"):
        if _k not in _keys: fails.append(f"_redirects: {_src}: target is missing {_k}")
    _file = _path.strip("/")
    if not any(os.path.isfile(os.path.join(root, f)) for f in (_file + ".html", os.path.join(_file, "index.html"), _file or "index.html")):
        fails.append(f"_redirects: {_src}: target page {_path} does not exist")
if "/go/" in read("sitemap.xml"): fails.append("sitemap.xml: /go/ short links must not be listed")
notes.append(f"short links /go/: {len(_go)}")
# sitemap
sm = read("sitemap.xml"); locs = re.findall(r"<loc>(.*?)</loc>", sm)
for u in locs:
    if not u.startswith("https://dscreative.co.il/"): fails.append(f"sitemap: non canonical {u}")
    if u.endswith(".html"): fails.append(f"sitemap: .html url {u}")
    path = u.replace("https://dscreative.co.il", "")
    p = path.lstrip("/")
    if not any(os.path.exists(os.path.join(root, c)) for c in ([p, p + ".html", os.path.join(p, "index.html")] if p else ["index.html"])): fails.append(f"sitemap: file missing for {u}")
    if p in redirect_sources: fails.append(f"sitemap: redirected url {u}")
if len(locs) != len(set(locs)): fails.append("sitemap: duplicates")
rb = read("robots.txt")
if "Sitemap: https://dscreative.co.il/sitemap.xml" not in rb or "Disallow" in rb: fails.append("robots.txt unexpected")
print("SEO CHECK", "FAIL" if fails else "PASS", f"({len(fails)} failures)")
for f in fails: print("  FAIL:", f)
for n in notes: print("  note:", n)
print(f"  sitemap urls: {locs}")
sys.exit(1 if fails else 0)
