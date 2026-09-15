/* ============================================================
   DS Creative Studio, pricing catalogue + rules (single source of truth)

   Everything the site shows or calculates about money comes from here:
   services, page types, add-ons, maintenance, urgency, and the calc()
   function that turns the wizard state into a priced summary.

   Rules:
   - Only prices that were approved in the brief are numeric.
   - Anything without an approved price has pricing_type "custom" and
     requires_review: true. The wizard then flags the request for a
     personal quote instead of inventing a number.
   - No DOM code here. The file runs in the browser (window.DS_PRICING)
     and in node (module.exports) so the rules can be unit tested.
   ============================================================ */

(function (root) {
  "use strict";

  const currency = "₪";

  /* ---------------- services ---------------- */
  const services = {
    landing: {
      id: "landing",
      name: "דף נחיתה",
      basePrice: 440,
      priceMode: "fixed",
      priceNote: "מחיר החבילה הבסיסית",
      deliveryDays: 3,
      short: "עמוד אחד ממוקד שמוביל לפעולה אחת ברורה.",
      includes: [
        "דף נחיתה אחד, בעיצוב שמותאם לעסק",
        "התאמה מלאה לטלפון",
        "עד 6 עד 7 אזורי תוכן",
        "כפתורי פעולה, וואטסאפ וטלפון לפי הצורך",
        "טופס יצירת קשר בסיסי",
        "קישורים לרשתות חברתיות אם קיימים",
        "הכנה בסיסית למנועי חיפוש",
        "חיבור לדומיין קיים והעלאה לאוויר",
        "בדיקות במחשב ובטלפון",
        "עד שני סבבי תיקונים מרוכזים"
      ]
    },
    site: {
      id: "site",
      name: "אתר תדמית",
      basePrice: 1290,
      priceMode: "from",
      priceNote: "המחיר כולל עד 6 עמודי תוכן סטנדרטיים",
      includedPages: 6,
      deliveryDays: 5,
      short: "כמה עמודים עם תפריט, שמציגים את העסק בצורה רחבה יותר.",
      includedNote: "המחיר כולל עד 6 עמודי תוכן סטנדרטיים: עמודים שמשתמשים בשפה העיצובית, במערכת הרכיבים ובתשתית של האתר, למשל בית, אודות, שירותים, פרויקטים, שאלות נפוצות וצור קשר, או כל מבנה אחר שמתאים לעסק. 7 עמודים ומעלה, או מערכות מיוחדות, מתומחרים בנפרד לאחר אפיון.",
      includes: [
        "עד 6 עמודי תוכן סטנדרטיים, בעיצוב מותאם לעסק",
        "התאמה מלאה לטלפון",
        "תפריט ניווט, כותרת עליונה ותחתית",
        "כפתורי פעולה, וואטסאפ וטלפון לפי הצורך",
        "טופס יצירת קשר בסיסי, ומפה בסיסית אם נדרשת",
        "קישורים לרשתות חברתיות אם קיימים",
        "הכנה בסיסית למנועי חיפוש לכל עמוד",
        "חיבור לדומיין קיים והעלאה לאוויר",
        "בדיקות במחשב ובטלפון",
        "עד שני סבבי תיקונים מרוכזים",
        "עמודי תשתית לפי הצורך (מדיניות פרטיות, הצהרת נגישות, תנאי שימוש, 404), מעבר למכסת עמודי התוכן"
      ]
    }
  };

  /* ---------------- site size ----------------
     Up to 6 standard content pages are included in the base price.
     7 pages and more: no automatic calculation, the price is set after a
     scoping conversation. "unknown": the client may continue; nothing is
     added automatically.
     The legacy per-page price list (250 / 350 / 500) was retired on
     2026-09-15: it is not a current business decision and must not be
     used on the active path. History lives in git. */
  const pageOptions = [
    { id: "upto6",   label: "עד 6 עמודים",        hint: "כלול במחיר הבסיס",                      included: true },
    { id: "7to10",   label: "7 עד 10 עמודים",     hint: "מחיר ייקבע לאחר אפיון",                 custom: true },
    { id: "over10",  label: "יותר מ־10 עמודים",   hint: "מחיר ייקבע לאחר אפיון",                 custom: true },
    { id: "unknown", label: "עדיין לא יודעים",     hint: "אפשר להמשיך, בלי תוספת מחיר אוטומטית",  unknown: true }
  ];

  /* Standard content pages the client can pick. Informational: up to 6 are
     included, nothing here changes the price. */
  const pageKinds = [
    { id: "home",     label: "בית" },
    { id: "about",    label: "אודות" },
    { id: "services", label: "שירותים" },
    { id: "projects", label: "פרויקטים / גלריה" },
    { id: "faq",      label: "שאלות נפוצות" },
    { id: "contact",  label: "צור קשר" },
    { id: "other",    label: "עמוד אחר" }
  ];

  /* Things that are part of the site base package, shown for information only. */
  const includedFeatures = [
    { id: "contact-form", label: "טופס יצירת קשר",         hint: "טופס בסיסי" },
    { id: "whatsapp",     label: "כפתור וואטסאפ או טלפון",  hint: "לפי הצורך" },
    { id: "map",          label: "מפה בסיסית",              hint: "עם המיקום של העסק" },
    { id: "social",       label: "קישורים לרשתות חברתיות", hint: "אם קיימים" }
  ];

  /* ---------------- add-on catalogue ----------------
     id, label, description, price, pricing_type (fixed | percentage | custom),
     requires_review, scope (which service), group (where the wizard shows it),
     unit / maxQty for quantity items. */
  const catalog = [
    /* site pages and areas */
    { id: "blog",          label: "בלוג בסיסי + תבנית כתבה",    description: "עמוד כתבות ותבנית לכתבה חדשה.",                        price: 300, pricing_type: "fixed",  requires_review: false, scope: ["site"],    group: "site-pages" },
    { id: "extra-lang-site", label: "שפה נוספת",                description: "גרסה של האתר בשפה נוספת. המחיר תלוי במספר העמודים.", price: null, pricing_type: "custom", requires_review: true,  scope: ["site"],    group: "site-pages" },
    { id: "site-other",    label: "משהו אחר",                   description: "ספרו לנו בקצרה, ונתמחר לפני כל התחייבות.",             price: null, pricing_type: "custom", requires_review: true,  scope: ["site"],    group: "site-pages", hasNote: true },

    /* landing sections and visuals */
    { id: "extra-section-simple",  label: "אזור תוכן פשוט נוסף",     description: "אזור נוסף מעבר לאזורים הכלולים בדף.",                     price: 50,  pricing_type: "fixed",  requires_review: false, scope: ["landing"], group: "landing-sections", unit: "לאזור", maxQty: 6 },
    { id: "extra-section-complex", label: "אזור מורכב או ייחודי",    description: "אזור עם עיצוב או התנהגות מיוחדים. מתומחר אחרי שנבין מה צריך.", price: null, pricing_type: "custom", requires_review: true,  scope: ["landing"], group: "landing-sections", hasNote: true },
    { id: "gallery-landing",       label: "גלריה / תיק עבודות",      description: "אזור עם תמונות או פרויקטים.",                              price: 100, pricing_type: "fixed",  requires_review: false, scope: ["landing"], group: "landing-sections" },
    { id: "images-5",              label: "הכנת עד 5 תמונות מותאמות", description: "יצירה או התאמה של עד 5 תמונות לדף.",                       price: 100, pricing_type: "fixed",  requires_review: false, scope: ["landing"], group: "landing-sections" },

    /* content help (per page for a site, flat for a landing page) */
    { id: "content-edit",  label: "עריכה וליטוש תוכן",          description: "אתם מביאים חומרים, אנחנו מסדרים ומלטשים.",              price: 150, pricing_type: "fixed", requires_review: false, scope: ["landing", "site"], group: "content", unit: "לעמוד" },
    { id: "content-write", label: "כתיבת תוכן כמעט מאפס",       description: "כותבים את התוכן יחד איתכם, מכמה נקודות שתיתנו.",         price: 250, pricing_type: "fixed", requires_review: false, scope: ["landing", "site"], group: "content", unit: "לעמוד" },

    /* measurement and privacy */
    /* Tracking tools are consent-gated by design: in a client site they must load only after
       the visitor agreed, whenever the site requires consent. The DS site itself runs no tracking.
       TODO (technical, before enabling analytics/pixel on a real client site): wire the tag loader
       to the consent mechanism (cookie-consent add-on or the client's own), never fire on page load. */
    { id: "ga",            label: "Google Analytics",           description: "מדידת מבקרים ומקורות תנועה. מופעל רק אחרי הסכמת הגולש, כשהאתר דורש זאת.",   price: 100, pricing_type: "fixed", requires_review: false, scope: ["landing", "site"], group: "tracking", consentGated: true },
    { id: "meta-pixel",    label: "Meta Pixel",                 description: "מדידה לקמפיינים בפייסבוק ובאינסטגרם. מופעל רק אחרי הסכמת הגולש, כשהאתר דורש זאת.", price: 100, pricing_type: "fixed", requires_review: false, scope: ["landing", "site"], group: "tracking", consentGated: true },
    { id: "cookie-banner", label: "מנגנון הודעה והסכמה לעוגיות", description: "הוספת ממשק הודעה/הסכמה לעוגיות לפי הצורך הטכני של האתר.",  price: 100, pricing_type: "fixed", requires_review: false, scope: ["landing", "site"], group: "tracking" },

    /* connections to systems the client already has */
    { id: "crm-simple",    label: "חיבור לרשימת תפוצה או CRM פשוט", description: "חיבור בסיסי של הטופס למערכת קיימת, כשהחיבור פשוט ומוגדר מראש.", price: 150, pricing_type: "fixed", requires_review: false, scope: ["landing"], group: "connect" },
    { id: "booking-embed", label: "הטמעת מערכת תורים קיימת",    description: "שיבוץ של מערכת קביעת תורים שכבר יש לכם.",                price: 100, pricing_type: "fixed", requires_review: false, scope: ["landing"], group: "connect" },
    { id: "payment-link",  label: "חיבור לינק תשלום קיים",      description: "כפתור או קישור למערכת תשלום שכבר עובדת אצלכם.",          price: 100, pricing_type: "fixed", requires_review: false, scope: ["landing"], group: "connect" },
    { id: "extra-lang-landing", label: "שפה נוספת",             description: "גרסה של הדף בשפה נוספת.",                                price: 250, pricing_type: "fixed", requires_review: false, scope: ["landing"], group: "connect" },

    /* no approved price: always a personal quote */
    { id: "complex-form",   label: "טופס מורכב",                 description: "טופס עם שלבים, תנאים או חישובים.",                      price: null, pricing_type: "custom", requires_review: true, scope: ["landing", "site"], group: "custom" },
    { id: "complex-integration", label: "חיבור מורכב למערכת חיצונית", description: "חיבור שדורש פיתוח או הגדרות מיוחדות.",           price: null, pricing_type: "custom", requires_review: true, scope: ["landing", "site"], group: "custom" },
    { id: "user-system",    label: "אזור אישי או משתמשים",       description: "הרשמה, התחברות ותוכן אישי.",                            price: null, pricing_type: "custom", requires_review: true, scope: ["landing", "site"], group: "custom" },
    { id: "shop",           label: "חנות מקוונת",                description: "מוצרים, עגלה ותשלום.",                                  price: null, pricing_type: "custom", requires_review: true, scope: ["landing", "site"], group: "custom" },
    { id: "booking-full",   label: "מערכת הזמנות מלאה",          description: "ניהול תורים או הזמנות בתוך האתר.",                      price: null, pricing_type: "custom", requires_review: true, scope: ["landing", "site"], group: "custom" },
    { id: "payment-full",   label: "מערכת תשלום מלאה",           description: "סליקה ותשלום בתוך האתר.",                               price: null, pricing_type: "custom", requires_review: true, scope: ["landing", "site"], group: "custom" },
    { id: "dashboard",      label: "לוח ניהול או מסד נתונים",     description: "מסכי ניהול, נתונים שנשמרים, דוחות.",                    price: null, pricing_type: "custom", requires_review: true, scope: ["landing", "site"], group: "custom" },
    { id: "custom-logic",   label: "משהו מיוחד שלא ברשימה",       description: "לוגיקה מותאמת, חיבור למערכת שלכם, או כל דבר אחר.",     price: null, pricing_type: "custom", requires_review: true, scope: ["landing", "site"], group: "custom", hasNote: true }
  ];

  /* Choosing both tracking tools costs less than the two apart. */
  const bundles = [
    { id: "tracking-bundle", label: "Google Analytics + Meta Pixel", price: 150, pricing_type: "fixed", requires_review: false, replaces: ["ga", "meta-pixel"] }
  ];

  /* Urgent delivery: percentage on DS work only (base + fixed add-ons).
     Never on monthly maintenance or third-party costs. */
  const urgency = {
    id: "urgent",
    label: "דחוף",
    percent: 25,
    pricing_type: "percentage",
    requires_review: false,
    description: "מסירה מהירה יותר, בתיאום. תוספת של 25% על עבודת DS בלבד, לא על תחזוקה ולא על עלויות של ספקים חיצוניים.",
    customNote: "תוספת הדחיפות תחושב במסגרת המחיר המותאם."
  };

  const maintenance = [
    { id: "none",     name: "ללא תחזוקה",     price: 0,   per: "לחודש",
      includes: ["האתר שלכם, בלי תשלום חודשי", "שינוי נקודתי בעתיד מתומחר בנפרד ומראש"] },
    { id: "basic",    name: "תחזוקה בסיסית",  price: 149, per: "לחודש",
      includes: ["עד 30 דקות עבודה בחודש", "שינויי טקסט קטנים והחלפת תמונות", "בדיקת קישורים וטפסים, תיקונים קטנים", "מענה בתוך שני ימי עסקים"] },
    { id: "extended", name: "תחזוקה מורחבת",  price: 349, per: "לחודש",
      includes: ["עד 90 דקות עבודה בחודש", "שינויים שוטפים ובדיקה טכנית", "טיפול בעדיפות", "מענה בתוך יום עסקים"] }
  ];
  const maintenanceNote = "זמן שלא נוצל בחודש לא עובר לחודש הבא. אפשר להצטרף או להפסיק בכל שלב. שום מסלול לא נבחר מראש.";

  const copy = {
    hosting: "ברוב דפי הנחיתה ואתרי התדמית הקטנים ניתן להתחיל עם אחסון ללא עלות חודשית במסגרת המסלול החינמי של הספק. אם בעתיד יהיה צורך בשדרוג, תדעו על כך מראש ולא יתבצע חיוב ללא אישורכם.",
    infra: "לפרויקט ניתן להקים חשבון תשתית ייעודי ששייך לכם. בסיום העבודה תקבלו את פרטי הגישה ותוכלו להחליף את הסיסמה.",
    domainHelp: "נעזור לכם לבחור, לרכוש, להגדיר ולחבר את הדומיין ללא דמי שירות נוספים. אתם משלמים רק את עלות הדומיין לספק, והדומיין נרשם על שמכם.",
    customQuote: "הבקשה כוללת רכיב שדורש בדיקה. נעבור על הפרטים ונשלח לכם סיכום ומחיר מלא לפני כל התחייבות.",
    customShort: "נדרש מחיר מותאם",
    overSix: "מעל 6 עמודי תוכן סטנדרטיים המחיר נקבע לאחר אפיון, לפי היקף. אין חישוב אוטומטי. המשיכו למלא, ונחזור אליכם עם מחיר מדויק לפני כל התחייבות.",
    pagesUnknownNote: "עוד לא יודעים כמה עמודים? אפשר להמשיך. שום מחיר לא מתווסף אוטומטית, ואם יידרשו יותר מ־6 עמודי תוכן, המחיר ייקבע לאחר אפיון.",
    standardPage: "עמוד תוכן סטנדרטי הוא עמוד שמשתמש בשפה העיצובית, במערכת הרכיבים ובתשתית של האתר. חנות, אזור אישי, מערכות הזמנה או סליקה, לוח ניהול, כלים אינטראקטיביים מורכבים ופיתוח ייחודי אינם נחשבים עמוד תוכן ומתומחרים בנפרד. עמודי תשתית כמו מדיניות פרטיות, הצהרת נגישות ותנאי שימוש אינם נספרים במכסה.",
    notBinding: "שליחת הבקשה אינה מחייבת בתשלום. נעבור על הפרטים ונשלח לכם סיכום לאישור. שום עבודה או חיוב לא מתחילים לפני אישורכם.",
    reviewPrice: "מחיר ייקבע לאחר בדיקת הבקשה",
    totalLabel: "סה\"כ לפי הבחירות שלכם",
    setupLabel: "סה\"כ הקמה",
    pagesUnknown: "טרם נקבע",
    consentHint: "כלי המדידה מופעלים רק אחרי הסכמת הגולש, כשהאתר דורש זאת.",
    depositLabel: "50% מקדמה",
    balanceLabel: "יתרה לפני מסירה",
    maintenanceSeparate: "אופציונלי ונפרד. תשלום חודשי, לא חלק ממחיר ההקמה.",
    fine: "תשלום חד פעמי לבנייה. תחזוקה, אם נבחרה, נפרדת וחודשית. המחיר הסופי נסגר בסיכום הזמנה שאתם מאשרים לפני תחילת העבודה."
  };

  function formatPrice(n) {
    if (n === null || n === undefined || isNaN(n)) return copy.reviewPrice;
    return new Intl.NumberFormat("he-IL").format(n) + " " + currency;
  }

  const byId = (list, id) => list.find((x) => x.id === id) || null;

  /* ---------------- the rules ----------------
     calc(state) is pure: same state in, same numbers out.
     state shape (from project-builder.js):
       type: "landing" | "site"
       site.pages: pageOptions id
       site.pageKinds: pageKinds ids (informational), site.pageOther: text
       addons: { [catalog id]: quantity (number) }
       content: { service: "" | "none" | "edit" | "write", pages: number }
       urgent: bool
       maintenance: maintenance id */
  function calc(st) {
    const out = {
      service: null, base_price: null, baseLabel: "",
      lines: [],                 // priced or custom items, in display order
      addons_total: 0,           // fixed add-ons only
      urgent: false, urgent_fee: 0,
      setup_total: null, deposit: null, balance: null,
      monthly_maintenance: 0, maintenance: null,
      page_count: null, page_label: "",   // exact page count when it is known, else a range / "not set"
      custom_quote_required: false, custom_reasons: []
    };
    if (!st || !st.type || !services[st.type]) return out;
    const svc = services[st.type];
    out.service = svc;
    out.base_price = svc.basePrice;
    out.baseLabel = svc.priceMode === "from" ? "החל מ־" + formatPrice(svc.basePrice) : formatPrice(svc.basePrice);

    const custom = (reason) => { out.custom_quote_required = true; if (reason && !out.custom_reasons.includes(reason)) out.custom_reasons.push(reason); };
    const addLine = (l) => { out.lines.push(l); if (l.pricing_type === "fixed" && typeof l.total === "number") out.addons_total += l.total; };

    /* site size: up to 6 standard content pages are included; nothing is
       added automatically. 7+ pages (or more than 6 picked) mean a custom quote. */
    if (st.type === "site") {
      const site = st.site || {};
      const pg = byId(pageOptions, site.pages);
      const kinds = Array.isArray(site.pageKinds) ? site.pageKinds.filter((k) => byId(pageKinds, k)) : [];
      if (pg && pg.custom) { custom(pg.label + ", מחיר ייקבע לאחר אפיון"); out.page_label = pg.label; }
      else if (pg && pg.unknown) out.page_label = copy.pagesUnknown;
      else if (pg) out.page_label = pg.label;
      if (kinds.length > 0) {
        out.page_count = kinds.length;
        if (pg && pg.included) out.page_label = kinds.length + " מתוך " + svc.includedPages + " הכלולים";
        if (pg && pg.included && kinds.length > svc.includedPages) custom("נבחרו יותר מ־" + svc.includedPages + " עמודי תוכן, מחיר ייקבע לאחר אפיון");
      }
    }

    /* add-ons from the catalogue */
    const chosen = st.addons || {};
    const picked = catalog.filter((c) => c.scope.includes(st.type) && chosen[c.id]);
    const bundle = bundles.find((b) => b.replaces.every((id) => picked.some((p) => p.id === id)));
    picked.forEach((c) => {
      if (bundle && bundle.replaces.includes(c.id)) return;
      const qty = c.maxQty ? Math.max(1, Math.min(c.maxQty, Number(chosen[c.id]) || 1)) : 1;
      if (c.pricing_type === "fixed") addLine({ id: c.id, label: c.label + (qty > 1 ? " × " + qty : ""), qty, unit: c.unit || "", price: c.price, total: qty * c.price, pricing_type: "fixed", requires_review: false });
      else { addLine({ id: c.id, label: c.label, qty: 1, price: null, total: null, pricing_type: "custom", requires_review: true }); custom(c.label); }
    });
    if (bundle) addLine({ id: bundle.id, label: bundle.label, qty: 1, price: bundle.price, total: bundle.price, pricing_type: "fixed", requires_review: false });

    /* content help */
    const ct = st.content || {};
    if (ct.service === "edit" || ct.service === "write") {
      const item = byId(catalog, ct.service === "edit" ? "content-edit" : "content-write");
      const pages = st.type === "site" ? Math.max(1, Number(ct.pages) || 1) : 1;
      addLine({ id: item.id, label: item.label + (pages > 1 ? " × " + pages + " עמודים" : ""), qty: pages, unit: item.unit, price: item.price, total: pages * item.price, pricing_type: "fixed", requires_review: false });
    }

    /* urgency: percentage of DS work (base + fixed add-ons) */
    out.urgent = !!st.urgent;
    if (out.urgent) out.urgent_fee = Math.round((out.base_price + out.addons_total) * urgency.percent / 100);

    /* totals: only when every chosen item has a price */
    if (!out.custom_quote_required) {
      out.setup_total = out.base_price + out.addons_total + out.urgent_fee;
      out.deposit = Math.round(out.setup_total / 2);
      out.balance = out.setup_total - out.deposit;
    }

    /* maintenance is monthly and separate; never inside setup_total or the deposit */
    const mp = byId(maintenance, st.maintenance);
    if (mp) { out.maintenance = mp; out.monthly_maintenance = mp.price; }
    return out;
  }

  const api = { currency, services, pageOptions, pageKinds, includedFeatures, catalog, bundles, urgency, maintenance, maintenanceNote, copy, formatPrice, calc, byId };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.DS_PRICING = api;
})(typeof window !== "undefined" ? window : null);
