import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server renders the finished Hebrew ComFix home page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*lang="he"[^>]*dir="rtl"/i);
  assert.match(html, /ComFix/);
  assert.match(html, /המחשב שלך/);
  assert.match(html, /הזמנת תיקון/);
  assert.match(html, /מחשבים מחודשים/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Your site is taking shape/);
});

test("server renders every requested business route", async () => {
  const routes = [
    ["/repairs", /מחירים לדוגמה/],
    ["/new-computers", /המחשבים החדשים שלנו/],
    ["/refurbished", /42 נקודות בדיקה/],
    ["/accessories", /ציוד ורכיבים נבחרים/],
    ["/contact", /ComFix הוא עסק מומצא/],
  ];

  for (const [path, expected] of routes) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, expected, path);
    assert.match(html, /aria-label="דף הבית"/, `${path} includes a home control`);
    assert.match(html, /aria-label="חיפוש בכל האתר"/, `${path} includes global search`);
    assert.doesNotMatch(html, /href="(?:https:\/\/wa\.me|tel:|mailto:)/i, `${path} has no live outbound contact action`);
  }
});

test("global navigation exposes every internal business page", async () => {
  const html = await (await render()).text();
  for (const route of ["/repairs", "/new-computers", "/refurbished", "/accessories", "/contact"]) {
    assert.match(html, new RegExp(`href="${route.replace("/", "\\/")}`), route);
  }
  assert.doesNotMatch(html, /href="(?:https:\/\/wa\.me|tel:|mailto:)/i);
  assert.match(html, /הדגמת פתיחת שיחה/);
});

test("production navigation does not depend on the vinext Link prefetch runtime", async () => {
  const sourceFiles = [
    ...(await readdir(new URL("../app", import.meta.url), { recursive: true })).filter((file) => file.endsWith(".tsx")).map((file) => new URL(`../app/${file}`, import.meta.url)),
    ...(await readdir(new URL("../components", import.meta.url), { recursive: true })).filter((file) => file.endsWith(".tsx")).map((file) => new URL(`../components/${file}`, import.meta.url)),
  ];

  for (const file of sourceFiles) {
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, /from ["']next\/link["']/, file.pathname);
  }
});

test("route motion has a pre-paint bridge and a unique variant for every destination", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const navigation = await readFile(new URL("../components/NavigationExperience.tsx", import.meta.url), "utf8");

  assert.match(layout, /comfix-route-transition/);
  assert.match(layout, /route-prepaint-stage/);

  for (const variant of ["home", "repairs", "new-computers", "refurbished", "accessories", "contact"]) {
    assert.match(navigation, new RegExp(`motion: ["']${variant}["']`), variant);
  }
});

test("every route renders a decorative route-specific atmosphere", async () => {
  for (const path of ["/", "/repairs", "/new-computers", "/refurbished", "/accessories", "/contact"]) {
    const html = await (await render(path)).text();
    assert.match(html, /class="page-atmosphere"/, path);
    assert.match(html, /data-atmosphere=/, path);
    assert.match(html, /aria-hidden="true"/, path);
  }
});

test("Netlify trailing-slash routes keep their active navigation and atmosphere", async () => {
  for (const file of ["PageAtmosphere.tsx", "SiteHeader.tsx", "NavigationExperience.tsx"]) {
    const source = await readFile(new URL(`../components/${file}`, import.meta.url), "utf8");
    assert.match(source, /normalizeRoutePath\(pathname\)/, `${file} normalizes Netlify paths`);
  }
});

test("motion styles include reduced-motion protection", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.page-atmosphere/);
  assert.match(css, /\.route-transition/);
  assert.match(css, /imageBreathe/);
});

test("starter preview assets and dependency were removed", async () => {
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("app/_sites-preview", projectRoot)));
});
