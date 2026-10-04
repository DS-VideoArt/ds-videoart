// Canonical build for dscreative.co.il:  npm run build
// Every deploy path runs this one command: Netlify Git deploys and `netlify deploy` (netlify.toml), and tools/deploy.sh.
//   1. copies the public site into dist/ (the files git tracks, or would track, minus build tooling)
//   2. runs the static SEO check on dist/
//   3. builds the Pagefind search index into dist/pagefind/ and verifies it
// dist/ is the publish directory and exists only after a successful build, so the site cannot be published without its search index.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "dist");
const MIN_RECORDS = 40;   // 47 at the time of writing: 11 pages + 36 homepage records
const SKIP = [/^tools\//, /^dist\//, /(^|\/)node_modules\//, /^package(-lock)?\.json$/, /^netlify\.toml$/, /(^|\/)\.(?!well-known\/)/];

function files() {
  if (existsSync(join(ROOT, ".git"))) {
    // tracked files plus new files that are not ignored: the same set a commit, and therefore a Git deploy, would contain
    return execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20 })
      .split("\0").filter(Boolean);
  }
  // exported tree (git archive) has no .git: everything in it is part of the site
  const out = [];
  (function walk(dir) {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name), rel = relative(ROOT, abs).split(sep).join("/");
      if (statSync(abs).isDirectory()) { if (!SKIP.some((rx) => rx.test(rel + "/"))) walk(abs); }
      else out.push(rel);
    }
  })(ROOT);
  return out;
}

rmSync(OUT, { recursive: true, force: true });
let copied = 0;
for (const rel of [...new Set(files())]) {
  if (SKIP.some((rx) => rx.test(rel))) continue;
  const src = join(ROOT, rel);
  if (!existsSync(src) || statSync(src).isDirectory()) continue;   // deleted in the working tree
  mkdirSync(dirname(join(OUT, rel)), { recursive: true });
  cpSync(src, join(OUT, rel));
  copied++;
}
console.log(`build: ${copied} files copied to dist/`);

execFileSync("python3", [join(ROOT, "tools/seo-check.py"), OUT], { stdio: "inherit" });
execFileSync(process.execPath, [join(ROOT, "tools/search/build-index.mjs"), OUT], { stdio: "inherit" });

const entry = JSON.parse(readFileSync(join(OUT, "pagefind/pagefind-entry.json"), "utf8"));
const records = Object.values(entry.languages || {}).reduce((n, l) => n + (l.page_count || 0), 0);
if (!existsSync(join(OUT, "pagefind/pagefind.js")) || records < MIN_RECORDS) {
  console.error(`build: search index incomplete (${records} records, expected at least ${MIN_RECORDS})`);
  process.exit(1);
}
console.log(`build: OK, search index has ${records} records`);
