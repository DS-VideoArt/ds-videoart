#!/usr/bin/env python3
"""Local preview server that behaves like Netlify for this site: pretty URLs (/studio -> studio.html), directory index,
404.html, the exact rules of _redirects (with the query kept, like Netlify) and the headers from _headers (incl. CSP).
A POST is answered with 200 and never leaves the machine, so a form test sends nothing.

    npm run build && python3 tools/dev-server.py dist 3460     # then open http://localhost:3460/

tools/ is not copied into the site."""
import http.server, os, sys, re
from urllib.parse import unquote
ROOT = sys.argv[1]; PORT = int(sys.argv[2])
rules, cur = [], None
hp = os.path.join(ROOT, "_headers")
if os.path.exists(hp):
    for line in open(hp, encoding="utf-8"):
        if not line.strip() or line.lstrip().startswith("#"): continue
        if not line.startswith((" ", "\t")): cur = (line.strip(), []); rules.append(cur)
        else:
            k, v = line.strip().split(":", 1); cur[1].append((k.strip(), v.strip()))
def headers_for(path):
    out = []
    for pat, hs in rules:
        if re.match("^" + re.escape(pat).replace("\\*", ".*") + "$", path): out += hs
    return out
REDIRECTS = {}
rp = os.path.join(ROOT, "_redirects")
if os.path.exists(rp):
    for line in open(rp, encoding="utf-8"):
        parts = line.split()
        if len(parts) >= 3 and parts[0].startswith("/") and not line.lstrip().startswith("#") and "*" not in parts[0]:
            REDIRECTS.setdefault(parts[0], (parts[1], int(parts[2].rstrip("!"))))
TYPES = {".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".pdf": "application/pdf", ".json": "application/json", ".xml": "application/xml", ".webp": "image/webp", ".woff2": "font/woff2"}
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0)); self.rfile.read(n)
        self.send_response(200); self.send_header("Content-Length", "2"); self.end_headers(); self.wfile.write(b"ok")
    def do_GET(self):
        path = self.path.split("?")[0].split("#")[0]
        if path in REDIRECTS:   # like Netlify: exact rules from _redirects; the original query is kept unless the target has one
            dst, code = REDIRECTS[path]; q = self.path.partition("?")[2]
            if q and "?" not in dst: dst += "?" + q
            self.send_response(code); self.send_header("Location", dst); self.send_header("Content-Length", "0"); self.end_headers(); return
        fs = os.path.join(ROOT, unquote(path).lstrip("/")); status = 200
        if path.endswith("/"): fs = os.path.join(fs, "index.html")
        elif not os.path.exists(fs) and os.path.exists(fs + ".html"): fs = fs + ".html"
        elif os.path.isdir(fs): self.send_response(301); self.send_header("Location", path + "/"); self.end_headers(); return
        if not os.path.exists(fs): fs = os.path.join(ROOT, "404.html"); status = 404
        data = open(fs, "rb").read()
        self.send_response(status)
        self.send_header("Content-Type", TYPES.get(os.path.splitext(fs)[1], "application/octet-stream"))
        self.send_header("Content-Length", str(len(data)))
        for k, v in headers_for(path): self.send_header(k, v)
        self.end_headers(); self.wfile.write(data)
http.server.ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
