// Builds the Pagefind search index for dscreative.co.il.
// Usage: node build-index.mjs <site-dir>. Called by the canonical build (tools/build.mjs, npm run build); /pagefind/ is never committed.
// Scope: hub articles, hub index, privacy, terms, accessibility (pages tagged data-pagefind-body),
//        plus virtual records with anchor urls: the pricing page split into FAQ questions, packages, maintenance,
//        process, transparency and custom projects; the homepage split into portfolio items and contact.
// Hebrew: Pagefind has no Hebrew stemming. Each record carries a manual alias layer (data-search-terms); no automatic prefix expansion.
import * as pagefind from "pagefind";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const SITE = process.argv[2];
if (!SITE) { console.error("usage: node build-index.mjs <site-dir>"); process.exit(1); }
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const text = (html) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
const block = (tag) => (html, id) => { let i = html.indexOf(`id="${id}"`); if (i < 0) return ""; i = html.lastIndexOf("<", i); const s = html.slice(i); return s.slice(0, s.indexOf(`</${tag}>`)); };
const section = block("section"), article = block("article");

const { index } = await pagefind.createIndex({
  forceLanguage: "he",
  excludeSelectors: [".nav", ".mobile-menu", ".footer", ".grain", ".skip-link", ".deco", ".nav-search", ".ds-search", "[data-pagefind-ignore]"],
});
const dir = await index.addDirectory({ path: SITE, glob: "{hub/*.html,privacy.html,legal/*.html}" });
if (dir.errors?.length) { console.error(dir.errors); process.exit(1); }
console.log(`pages indexed from files: ${dir.page_count}`);

// ---------- virtual records with anchor urls (pricing page + homepage) ----------
const home = readFileSync(join(SITE, "index.html"), "utf8");
const pricingPage = readFileSync(join(SITE, "pricing.html"), "utf8");
const records = [];
const push = (r) => records.push(r);

// FAQ: one record per question (the <details> elements carry id="faq-N")
const faq = section(pricingPage, "faq");
const TITLE_ALIASES = [
  ["דומיין", "דומיין, הדומיין, לדומיין, דומיינים, שם מתחם, כתובת אתר, רשם"],
  ["אחסון", "אחסון, האחסון, לאחסון, hosting, שרת, Netlify, מסלול חינמי"],
  ["גוגל", "גוגל, בגוגל, לגוגל, Google, SEO, קידום, אינדוקס, מקום ראשון"],
  ["תחזוקה", "תחזוקה, התחזוקה, עדכונים, שינויים, מנוי חודשי, 149, 349"],
  ["מחיר", "מחיר, מחירים, המחיר, עלות, כמה עולה, תשלום, 440, 1,290"],
  ["משלמים", "תשלום, מקדמה, מתי משלמים, חשבונית"],
  ["מנוי", "מנוי, מנוי חודשי, תשלום חודשי, תחזוקה"],
  ["חד פעמי", "תשלום חד פעמי, מחיר, מחירים"],
  ["עמוד", "עמודים, עמוד, כמה עמודים, אילו עמודים, עמוד תוכן"],
  ["תיקונים", "תיקונים, סבב תיקונים, שינויים, הערות"],
  ["זמן", "זמן, כמה זמן לוקח, ימי עסקים, מסירה"],
  ["טקסטים", "טקסטים, תוכן, כתיבה, ניסוח"],
  ["תמונות", "תמונות, צילום, מאגר תמונות"],
  ["משפטיים", "מסמכים משפטיים, מדיניות פרטיות, תנאי שימוש, הצהרת נגישות, נגישות, פרטיות"],
  ["מסירה", "מסירה, אחרי המסירה, בעלות, גישה, חשבון"],
  ["דף נחיתה", "דף נחיתה, דפי נחיתה, landing page, אתר תדמית, ההבדל, מה ההבדל"],
  ["לדבר", "שיחה, טלפון, וואטסאפ, ייעוץ, לדבר איתכם"],
  ["תוספת", "תוספות, תוספת, שינוי באמצע, מחיר נוסף"],
];
let n = 0;
for (const m of faq.matchAll(/<details[^>]*id="(faq-\d+)"[^>]*>([\s\S]*?)<\/details>/g)) {
  const q = text((m[2].match(/<summary[^>]*>([\s\S]*?)<\/summary>/) || ["", ""])[1]);
  const a = text(m[2].replace(/<summary[\s\S]*?<\/summary>/, ""));
  const aliases = TITLE_ALIASES.filter(([k]) => q.includes(k)).map(([, v]) => v).join(", ");
  const topic = /דומיין|אחסון/.test(q) ? "דומיין ואחסון" : /גוגל/.test(q) ? "Google ו־SEO" : /תחזוקה|מסירה/.test(q) ? "תחזוקה" : /מחיר|משלמים|מנוי|חד פעמי|תוספת/.test(q) ? "מחירים" : /משפטיים/.test(q) ? "פרטיות, נגישות ומדידה" : /עמוד|טקסטים|תמונות|זמן|תיקונים|חומרים/.test(q) ? "תכנון והכנה" : "אתר או דף נחיתה";
  push({ url: `/pricing#${m[1]}`, title: q, body: a, type: "שאלה נפוצה", topics: [topic], aliases, weight: 1.2 }); n++;
}
console.log(`faq records: ${n}`);
if (n < 20) { console.error("FAQ records missing: is #faq on /pricing intact?"); process.exit(1); }

// pricing: one record per package + maintenance
// "1,290" is split by the index into "1" and "290", so each package carries its price as one plain token too
const PRICE_ALIASES = { "package-website": ", 1290, ב־1290, 1,290, מחיר אתר תדמית", "package-landing": ", 440, 440 ₪, ב־440, מחיר דף נחיתה 440" };
const pricing = section(pricingPage, "packages");
for (const art of pricing.matchAll(/<article class="package[^"]*"([^>]*)>([\s\S]*?)<\/article>/g)) {
  const id = (art[1].match(/id="([^"]+)"/) || [])[1]; const t = text(art[2]); const title = text((art[2].match(/<h3[^>]*>([\s\S]*?)<\/h3>/) || ["", ""])[1]);
  if (!title || !id) continue;
  push({ url: `/pricing#${id}`, title: `${title}: המחיר ומה כלול`, body: t.slice(0, 1400), type: "מחירים", topics: ["מחירים"], aliases: "מחיר, מחירים, כמה עולה, עלות, עלויות, חבילה, חבילות, מה כלול, תשלום חד פעמי, מסירה, דומיין, אחסון, SEO" + (PRICE_ALIASES[id] || "") });
}
const mt = pricing.indexOf("ואחרי המסירה");
if (records.filter((r) => r.type === "מחירים").length !== 2) { console.error("expected 2 package records on /pricing"); process.exit(1); }
if (mt > 0) push({ url: "/pricing#maintenance", title: "תחזוקה אחרי המסירה: 0, 149 או 349 ₪ לחודש", body: text(pricing.slice(mt)).slice(0, 1000), type: "מחירים", topics: ["תחזוקה", "מחירים"], aliases: "תחזוקה, התחזוקה, מנוי חודשי, עדכונים, שינויים, 149, 349, בלי תחזוקה, אחרי המסירה" });

// portfolio: featured projects (.sel-item) and design samples (.demo) on the homepage
const work = section(home, "work");
for (const art of work.matchAll(/<article class="(?:sel-item|demo)\b[^"]*" id="([^"]+)">([\s\S]*?)<\/article>/g)) {
  const title = text((art[2].match(/<h[34] class="(?:sel|demo)-title">([\s\S]*?)<\/h[34]>/) || ["", ""])[1]);
  const body = text(art[2].replace(/<a class="(?:sel|demo)-visual"[\s\S]*?<\/a>/, "").replace(/<a class="link-arrow"[\s\S]*?<\/a>/g, ""));
  if (title) push({ url: `/#${art[1]}`, title: `תיק עבודות: ${title}`, body, type: "תיק עבודות", topics: ["תיק עבודות"], aliases: "תיק עבודות, דוגמאות, עבודות, פרויקטים, לקוחות, הדגמה, portfolio, עיצוב", weight: 0.4 });
}
// other sections: [page html, page path, anchor, how to cut it, title, topic, aliases]
const others = [
  [pricingPage, "/pricing", "process", section, "איך זה עובד, שלב אחרי שלב", "תכנון והכנה", "תהליך, שלבים, כמה זמן לוקח, ימי עסקים, מקדמה, סיכום הזמנה, תיקונים, שיחה, בונה הפרויקט"],
  [pricingPage, "/pricing", "transparency", section, "שקיפות: מה כלול ומה לא", "מחירים", "תוספות, מה כלול, מה לא כלול, הפתעות, מחיר סופי, סיכום"],
  [pricingPage, "/pricing", "custom", article, "פרויקטים מורכבים בהתאמה אישית", "מערכות ותוספות", "מערכת, מערכות, המערכת, אזור אישי, אזור לקוחות, חנות, תורים, קביעת תורים, פיתוח, אפיון, פרויקט מורכב, תוספות"],
  [home, "/", "contact", section, "יצירת קשר: טופס פנייה, וואטסאפ וטלפון", "תכנון והכנה", "טופס, טופס פנייה, טופס יצירת קשר, הטופס, השארת פרטים, פנייה, פניות, לקבל פניות, יצירת קשר, צור קשר, וואטסאפ, בוואטסאפ, טלפון, שיחה, לדבר"],
];
for (const [html, path, id, cut, title, topic, aliases] of others) {
  const sec = cut(html, id);
  if (sec) push({ url: `${path}#${id}`, title, body: text(sec).slice(0, 1400), type: "עמוד", topics: [topic], aliases });
  else { console.error(`missing section #${id} in ${path}`); process.exit(1); }
}
for (const r of records) {
  const topics = r.topics.map((t) => `<span data-pagefind-filter="topic:${esc(t)}"></span>`).join("");
  const w = r.weight ? ` data-pagefind-weight="${r.weight}"` : "";
  const content = `<html lang="he"><body><main data-pagefind-body${w}><h1>${esc(r.title)}</h1><p>${esc(r.body)}</p><span data-pagefind-index-attrs="data-search-terms" data-search-terms="⟦ ${esc(r.aliases)} ⟧" data-pagefind-weight="0.6"></span><span data-pagefind-meta="type:${esc(r.type)}" data-pagefind-filter="type:${esc(r.type)}"></span>${topics}</main></body></html>`;
  const res = await index.addHTMLFile({ url: r.url, content });
  if (res.errors?.length) { console.error(r.url, res.errors); process.exit(1); }
}
console.log(`virtual records (pricing page + homepage): ${records.length}`);
rmSync(join(SITE, "pagefind"), { recursive: true, force: true });   // Pagefind does not remove index files from a previous run
const out = await index.writeFiles({ outputPath: join(SITE, "pagefind") });
if (out.errors?.length) { console.error(out.errors); process.exit(1); }
await pagefind.close();
console.log("index written to /pagefind/");
