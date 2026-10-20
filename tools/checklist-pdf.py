#!/usr/bin/env python3
"""Builds the downloadable checklist: hub/media/questions-before-ordering-a-website.pdf

The file is printed from the page itself (hub/questions-before-ordering-a-website.html) with its
print styles (hub/checklist.css, @media print), so the page and the file always say the same thing.
Run it again after any change to the page's questions or to the print styles:

    python3 tools/checklist-pdf.py

Needs Python Playwright with Chromium (pip install playwright && playwright install chromium) and,
for the page count check, pypdf. The Heebo font is fetched from Google Fonts while printing and is
embedded in the file, so the file itself needs no internet connection to display correctly.
"""
import functools, http.server, os, sys, threading
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = "/hub/questions-before-ordering-a-website.html"
OUT = os.path.join(ROOT, "hub", "media", "questions-before-ordering-a-website.pdf")
EXPECTED_PAGES = 3   # questions 1 to 7, questions 8 to 15, the comparison sheet

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

def main():
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=ROOT))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_address[1]}{PAGE}"
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        # no consent banner on paper
        page.add_init_script("localStorage.setItem('dsc_consent_v1', JSON.stringify({analytics: 'denied', at: 'print'}));")
        page.goto(url, wait_until="networkidle")
        page.emulate_media(media="print")
        page.evaluate("document.fonts.ready")
        page.pdf(
            path=OUT, prefer_css_page_size=True, print_background=True,
            display_header_footer=True, header_template="<span></span>", tagged=True, outline=True,
            footer_template='<div style="width:100%;text-align:center;font:8px Arial,sans-serif;color:#6a5d70"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
        )
        browser.close()
    server.shutdown()
    try:
        from pypdf import PdfReader
        pages = len(PdfReader(OUT).pages)
    except ImportError:
        pages = None
    size = os.path.getsize(OUT) // 1024
    print(f"written {os.path.relpath(OUT, ROOT)}: {pages} pages, {size} KB")
    if pages is not None and pages != EXPECTED_PAGES:
        print(f"expected {EXPECTED_PAGES} pages, got {pages}: shorten the page or tighten the print styles")
        sys.exit(1)

if __name__ == "__main__":
    main()
