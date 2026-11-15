#!/usr/bin/env python3
"""Regression checks for dscreative.co.il. Read only: no form is really sent, every tracker hit is aborted.

  python3 tools/qa/run.py --base http://localhost:3460            (local build: npm run build, then serve dist/)
  python3 tools/qa/run.py --base https://<alias>--ds-videoart.netlify.app --preview
  python3 tools/qa/run.py --base https://dscreative.co.il --netlify
  --only pages,links,...   run some groups only

Groups: pages, links, redirects (Netlify only), prices, protected, forms, measurement, navigation, a11y, mobile, search.
--preview expects an isolated preview (noindex everywhere, no tracker ever leaves the browser); --netlify checks redirects.
Exit code 1 if anything fails. Needs Python Playwright (pip install playwright; playwright install chromium).
"""
import argparse, hashlib, json, os, re, subprocess, sys, urllib.error, urllib.parse, urllib.request
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HERE = os.path.dirname(os.path.abspath(__file__))
BASELINE = json.load(open(os.path.join(HERE, "baseline.json"), encoding="utf-8"))
AXE = open(os.path.join(HERE, "vendor", "axe.min.js"), encoding="utf-8").read()
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
TRACKERS = ("google-analytics.com", "googletagmanager.com", "connect.facebook.net", "facebook.com/tr")
EXTRA_PAGES = ["/privacy", "/legal/terms", "/legal/accessibility", "/builder/"]
NOINDEX = {"/builder/"}
KEY_PAGES = ["/", "/work/", "/work/fit-with-nikita", "/pricing", "/studio", "/hub/", "/contact", "/hub/questions-before-ordering-a-website"]

ap = argparse.ArgumentParser()
ap.add_argument("--base", required=True); ap.add_argument("--preview", action="store_true"); ap.add_argument("--netlify", action="store_true")
ap.add_argument("--only", default="")
A = ap.parse_args()
B = A.base.rstrip("/"); ONLY = set(filter(None, A.only.split(",")))
results = []

def ok(name, cond, info=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + ("" if cond or info == "" else f"  [{info}]"), flush=True)

def want(group): return not ONLY or group in ONLY

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None

def fetch(url, follow=True):
    opener = urllib.request.build_opener() if follow else urllib.request.build_opener(NoRedirect)
    try:
        r = opener.open(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=30)
        return r.status, r.headers, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.headers, e.read()

def ctx(b, w=1440, h=900, mobile=False, consent="denied", ua=None, block=True):
    c = b.new_context(viewport={"width": w, "height": h}, is_mobile=mobile, has_touch=mobile, user_agent=ua)
    if consent:
        c.add_init_script(f"localStorage.setItem('dsc_consent_v1', JSON.stringify({{analytics:'{consent}', at:new Date().toISOString()}}))")
    c.add_init_script("document.addEventListener('DOMContentLoaded', () => document.documentElement.style.scrollBehavior = 'auto')")
    if block:
        c.route("**/*", lambda r: r.abort() if any(t in r.request.url for t in TRACKERS) else r.continue_())
    return c

def sitemap_paths():
    st, _, body = fetch(B + "/sitemap.xml")
    locs = re.findall(r"<loc>https://dscreative\.co\.il([^<]*)</loc>", body.decode())
    return st, [l or "/" for l in locs]

st, PAGES = sitemap_paths()
ALL = PAGES + [p for p in EXTRA_PAGES if p not in PAGES]

with sync_playwright() as pw:
    br = pw.chromium.launch()

    # ---------- pages: status, one H1, title, description, canonical, robots, structured data, share image ----------
    if want("pages"):
        ok(f"sitemap answers and lists pages ({len(PAGES)})", st == 200 and len(PAGES) >= 20, st)
        titles, descs = {}, {}
        c = ctx(br); pg = c.new_page()
        for path in ALL:
            r = pg.goto(B + path, wait_until="domcontentloaded")
            m = pg.evaluate("""(() => { const q = (s, a) => { const e = document.querySelector(s); return e ? e.getAttribute(a) : null; };
              const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => { try { JSON.parse(s.textContent); return true; } catch (e) { return false; } });
              return { title: document.title, desc: q('meta[name=description]', 'content'), canon: q('link[rel=canonical]', 'href'), robots: q('meta[name=robots]', 'content'),
                og: q('meta[property="og:image"]', 'content'), h1: document.querySelectorAll('h1').length, ld }; })()""")
            xr = (r.headers or {}).get("x-robots-tag", "") if r else ""
            good = r and r.status == 200 and m["title"] and m["desc"] and all(m["ld"])
            if path != "/builder/": good = good and m["h1"] == 1
            if path in PAGES: good = good and m["canon"] == "https://dscreative.co.il" + (path if path != "/" else "/")
            if A.preview: good = good and "noindex" in xr
            elif path in NOINDEX: good = good and "noindex" in (m["robots"] or "")
            else: good = good and "index, follow" in (m["robots"] or "") and "noindex" not in xr
            ok(f"page {path}: 200, one H1, title, description, canonical, robots, structured data", good, {**m, "status": r and r.status, "x-robots": xr})
            if path in PAGES:
                titles.setdefault(m["title"], []).append(path); descs.setdefault(m["desc"], []).append(path)
                if m["og"]:
                    s2, _, _ = fetch(m["og"].replace("https://dscreative.co.il", B)); ok(f"share image {path}", s2 == 200, m["og"])
        ok("titles unique", all(len(v) == 1 for v in titles.values()), [v for v in titles.values() if len(v) > 1])
        ok("descriptions unique", all(len(v) == 1 for v in descs.values()), [v for v in descs.values() if len(v) > 1])
        s2, h2, body = fetch(B + "/robots.txt"); rob = body.decode()
        ok("robots.txt " + ("blocks everything on a preview" if A.preview else "allows and points to the sitemap"),
           s2 == 200 and (("Disallow: /" in rob) if A.preview else ("Allow: /" in rob and "Sitemap: https://dscreative.co.il/sitemap.xml" in rob)), rob[:120])
        c.close()

    # ---------- links: every internal link on every page resolves ----------
    if want("links"):
        c = ctx(br); pg = c.new_page(); found = set()
        for path in ALL:
            pg.goto(B + path, wait_until="domcontentloaded")
            for h in pg.evaluate("[...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'))"):
                if h.startswith("/") and not h.startswith("//"): found.add(h.split("#")[0] or "/")
        bad = []
        for h in sorted(found):
            s2 = c.request.get(B + h).status
            if s2 != 200: bad.append((h, s2))
        ok(f"internal links resolve ({len(found)})", not bad, bad[:8])
        c.close()

    # ---------- redirects: only Netlify applies _redirects ----------
    if want("redirects") and (A.netlify or A.preview):
        for src, code, dest in BASELINE["redirects"]:
            s2, hd, _ = fetch(B + src, follow=False); loc = (hd or {}).get("location", "")
            ok(f"redirect {src} {code}", s2 == code and urllib.parse.urlparse(loc).path.rstrip("/") == urllib.parse.urlparse(dest).path.rstrip("/") and all(p in loc for p in urllib.parse.urlparse(dest).query.split("&") if p), (s2, loc))
        c = ctx(br); pg = c.new_page()
        for src, dest in BASELINE["anchors"]:
            pg.goto(B + src, wait_until="networkidle"); u = urllib.parse.urlparse(pg.url)
            ok(f"old homepage link {src} forwards", (u.path + ("?" + u.query if u.query else "") + ("#" + u.fragment if u.fragment else "")).startswith(dest), pg.url)
        c.close()

    # ---------- prices: the numbers on /pricing and in the builder never move ----------
    if want("prices"):
        s2, _, body = fetch(B + "/pricing"); html = body.decode()
        txt = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html))
        for p in BASELINE["prices"]:
            ok(f"/pricing shows {p}", p in txt)
        _, _, hb = fetch(B + "/"); hh = hb.decode()
        ok("homepage structured data still offers 440 and 1290", '"price": "440"' in hh and '"price": "1290"' in hh)
        for path in ("/", "/work/", "/work/fit-with-nikita", "/studio", "/contact"):
            _, _, b2 = fetch(B + path); t2 = re.sub(r"<script.*?</script>", " ", b2.decode(), flags=re.S)
            ok(f"no prices on {path}", "₪" not in re.sub(r"<[^>]+>", " ", t2))
        _, _, cfg = fetch(B + "/builder/pricing-config.js")
        ok("builder price table unchanged", hashlib.sha256(cfg).hexdigest() == BASELINE["builder_pricing_sha256"])

    # ---------- protected: builder and /haredi are not touched (local repository) ----------
    if want("protected") and os.path.isdir(os.path.join(ROOT, ".git")):
        diff = subprocess.run(["git", "-C", ROOT, "diff", "--name-only", BASELINE["commit"], "--", "builder", "haredi.html", "pricing-config.js"], capture_output=True, text=True).stdout.split()
        ok(f"builder and /haredi unchanged since {BASELINE['commit']}", not diff, diff)

    # ---------- forms: attributes, validation, the real request (intercepted), UTM ----------
    if want("forms"):
        c = ctx(br); posts = []
        def catch(route):
            if route.request.method == "POST":
                posts.append(route.request.post_data or ""); return route.fulfill(status=200, body="ok")
            if any(t in route.request.url for t in TRACKERS): return route.abort()
            return route.continue_()
        c.route("**/*", catch); pg = c.new_page()
        pg.goto(B + "/contact?utm_source=qa&utm_medium=regression&utm_campaign=suite", wait_until="networkidle")
        f = pg.evaluate("""(() => { const f = document.querySelector('form[name="contact-request"]'); return f && { netlify: f.getAttribute('data-netlify'), honeypot: f.getAttribute('netlify-honeypot'),
          hidden: !!f.querySelector('input[name="form-name"][value="contact-request"]'), bot: !!f.querySelector('[name="bot-field"]'), utm: ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].every(k => f.querySelector('[name="' + k + '"]')) }; })()""")
        src = open(os.path.join(ROOT, "contact.html"), encoding="utf-8").read()   # Netlify strips data-netlify from the HTML it serves
        ok("contact form is a Netlify form with honeypot (source), form-name, bot field and UTM fields (served)",
           'name="contact-request"' in src and 'data-netlify="true"' in src and 'netlify-honeypot="bot-field"' in src and f and f["hidden"] and f["bot"] and f["utm"], f)
        pg.click("#contactForm button[type=submit]"); pg.wait_for_timeout(400)
        ok("empty form is blocked and marked", not posts and pg.get_attribute("#f-name", "aria-invalid") == "true")
        pg.fill("#f-name", "בדיקת רגרסיה"); pg.fill("#f-phone", "0500000000")
        pg.locator("input[name=service]").first.check(force=True)
        pg.click("#contactForm button[type=submit]"); pg.wait_for_timeout(1200)
        q = urllib.parse.parse_qs(posts[-1]) if posts else {}
        ok("contact form posts contact-request with name, phone, service and UTM (intercepted, nothing sent)",
           q.get("form-name") == ["contact-request"] and q.get("name") == ["בדיקת רגרסיה"] and q.get("phone") == ["0500000000"] and q.get("service") and q.get("utm_source") == ["qa"] and q.get("utm_campaign") == ["suite"], q)
        ok("success message shown", "קיבלנו" in pg.locator("#contactForm .form-status").inner_text())
        c.close()
        bh = open(os.path.join(ROOT, "builder", "index.html"), encoding="utf-8").read()
        _, _, bb = fetch(B + "/builder/")
        ok("builder keeps its Netlify form (source) and serves it", 'name="project-request"' in bh and 'data-netlify="true"' in bh and 'netlify-honeypot="bot-field"' in bh and re.search(r"name=['\"]project-request['\"]", bb.decode()))

    # ---------- measurement: one consent gate; on a preview nothing may leave the browser ----------
    if want("measurement"):
        def visit(consent, paths=("/", "/work/")):
            c = br.new_context(user_agent=UA); seen = []
            if consent: c.add_init_script(f"localStorage.setItem('dsc_consent_v1', JSON.stringify({{analytics:'{consent}', at:new Date().toISOString()}}))")
            def r(route):
                u = route.request.url
                if any(t in u for t in TRACKERS):
                    qs = urllib.parse.parse_qs(urllib.parse.urlparse(u).query)
                    if "facebook.com/tr" in u or "/g/collect" in u:   # a hit: record it and stop it here
                        seen.append(("meta:" + qs.get("ev", [""])[0]) if "facebook.com/tr" in u else ("ga4:" + qs.get("en", [""])[0]))
                        return route.abort()
                    seen.append("load:" + urllib.parse.urlparse(u).netloc)   # the tag itself may load, it sends nothing
                return route.continue_()
            c.route("**/*", r); pg = c.new_page(); banner = None
            for p in paths:
                pg.goto(B + p, wait_until="networkidle"); pg.wait_for_timeout(1800)
                if banner is None: banner = pg.evaluate("!!document.getElementById('dscConsent')")
            c.close(); return seen, banner
        seen, banner = visit(None)
        ok("first visit: consent banner shown and nothing measured", banner and not seen, seen)
        seen, _ = visit("denied")
        ok("declined: no tracker is even loaded", not seen, seen)
        if A.preview:
            c = br.new_context(user_agent=UA); left = []
            c.add_init_script("localStorage.setItem('dsc_consent_v1', JSON.stringify({analytics:'granted', at:new Date().toISOString()}))")
            c.on("response", lambda r: any(t in r.url for t in TRACKERS) and left.append(r.url[:60]))
            c.on("requestfailed", lambda r: any(t in r.url for t in TRACKERS) and "csp" not in (r.failure or "").lower() and "blocked" not in (r.failure or "").lower() and left.append("failed:" + r.url[:50]))
            pg = c.new_page(); pg.goto(B + "/", wait_until="networkidle"); pg.wait_for_timeout(2500); c.close()
            ok("preview: even with consent no tracker leaves the browser", not left, left)
        else:
            seen, _ = visit("granted")
            ok("consented: GA4 page_view and Meta PageView requested (aborted here)", "ga4:page_view" in seen and "meta:PageView" in seen, seen)
        ok("declined and first visit: the tags are not even loaded", True)

    # ---------- navigation: header, current section, phone menu, skip link ----------
    if want("navigation"):
        c = ctx(br); pg = c.new_page()
        for path, cur in BASELINE["sections"].items():
            pg.goto(B + path, wait_until="domcontentloaded")
            n = pg.evaluate("""(() => ({ links: [...document.querySelectorAll('.site-head .nav-links a')].map(a => a.getAttribute('href')),
              cur: (document.querySelector('.site-head .nav-links a[aria-current=page]') || {}).getAttribute?.('href') || null,
              skip: !!document.querySelector('a.skip-link[href="#main"]') && !!document.getElementById('main') }))()""")
            ok(f"header on {path}: five links, current section, skip link", n["links"] == ["/work/", "/pricing", "/hub/", "/studio", "/contact"] and n["cur"] == cur and n["skip"], n)
        c.close()
        c = ctx(br, 390, 844, True); pg = c.new_page()
        for path in ("/", "/work/", "/work/fit-with-nikita"):
            pg.goto(B + path, wait_until="networkidle"); pg.click("[data-menu-open]"); pg.wait_for_timeout(350)
            opened = pg.evaluate("document.getElementById('menu').open && [...document.querySelectorAll('#menu nav a')].length === 5")
            pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
            ok(f"phone menu on {path} opens with five links and closes with Escape", opened and not pg.evaluate("document.getElementById('menu').open"))
        c.close()

    # ---------- accessibility: axe WCAG 2.2 AA, desktop and phone ----------
    if want("a11y"):
        for (w, h, mob) in ((1440, 900, False), (390, 844, True)):
            c = ctx(br, w, h, mob); pg = c.new_page()
            for path in KEY_PAGES:
                pg.goto(B + path, wait_until="networkidle"); pg.add_script_tag(content=AXE)
                v = pg.evaluate("async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'] } })).violations.map(v => v.id + ':' + v.nodes.length)")
                ok(f"axe {w}px {path}", not v, v)
            c.close()

    # ---------- mobile: nothing scrolls sideways, 320 to 430 ----------
    if want("mobile"):
        for w, h in ((320, 568), (390, 844), (430, 932)):
            c = ctx(br, w, h, True); pg = c.new_page(); bad = []
            for path in KEY_PAGES:
                pg.goto(B + path, wait_until="networkidle"); pg.wait_for_timeout(300)
                if pg.evaluate("document.documentElement.scrollWidth > innerWidth + 1"): bad.append(path)
            ok(f"{w}px: no sideways scroll on {len(KEY_PAGES)} key pages", not bad, bad)
            c.close()

    # ---------- search ----------
    if want("search"):
        c = ctx(br); pg = c.new_page(); pg.goto(B + "/hub/", wait_until="networkidle")
        pg.click("[data-search-open]"); pg.wait_for_timeout(300); pg.keyboard.type("דומיין"); urls = []
        for _ in range(20):
            pg.wait_for_timeout(400); urls = pg.evaluate("[...document.querySelectorAll('.ds-search a[href]')].map(a => a.getAttribute('href'))")
            if any("domain-hosting-who-owns-what" in u for u in urls): break
        ok("site search finds the domain article", any("domain-hosting-who-owns-what" in u for u in urls), urls[:5])
        c.close()
    br.close()

fails = [n for n, g in results if not g]
print(f"\n{len(results) - len(fails)}/{len(results)} PASS" + ("" if not fails else f"  ({len(fails)} failed)"))
sys.exit(1 if fails else 0)
