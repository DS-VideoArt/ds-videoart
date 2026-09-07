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
      priceNote: "המחיר כולל אתר של עד 3 עמודים",
      includedPages: 3,
      deliveryDays: 5,
      short: "כמה עמודים עם תפריט, שמציגים את העסק בצורה רחבה יותר.",
      includedNote: "המחיר כולל אתר של עד 3 עמודים. צריכים אתר רחב יותר? נתאים את ההיקף והמחיר לצורך שלכם.",
      includes: [
        "עד 3 עמודים, בעיצוב מותאם אישית",
        "התאמה מלאה לטלפון",
        "תפריט ניווט, כותרת עליונה ותחתית",
        "כפתורי פעולה, וואטסאפ וטלפון לפי הצורך",
        "טופס יצירת קשר בסיסי, ומפה בסיסית אם נדרשת",
        "קישורים לרשתות חברתיות אם קיימים",
        "הכנה בסיסית למנועי חיפוש לכל עמוד",
        "חיבור לדומיין קיים והעלאה לאוויר",
        "בדיקות במחשב ובטלפון",
        "עד שני סבבי תיקונים מרוכזים"
      ]
    }
  };

  /* ---------------- site size ----------------
     extraMin / extraMax: how many pages beyond the 3 included ones
     the estimate implies. customByDefault: still priced per page for
     the client's information, but the request goes to a personal quote. */
  const pageOptions = [
    { id: "upto3",   label: "עד 3",             hint: "כלול במחיר הבסיס",           extraMin: 0, extraMax: 0 },
    { id: "4to6",    label: "4 עד 6",           hint: "נחשב לפי סוג העמודים",       extraMin: 1, extraMax: 3 },
    { id: "7to10",   label: "7 עד 10",          hint: "נחשב לפי סוג העמודים",       extraMin: 4, extraMax: 7 },
    { id: "over10",  label: "יותר מ־10",        hint: "מחיר מותאם",                  extraMin: 8, extraMax: null, customByDefault: true },
    { id: "unknown", label: "עדיין לא יודעים",  hint: "נעזור להחליט",                custom: true }
  ];

  /* Price per extra page, by page type. */
  const pageTypes = [
    { id: "normal",  label: "עמוד רגיל",  description: "עמוד תוכן רגיל נוסף.",                         price: 250, pricing_type: "fixed", requires_review: false },
    { id: "long",    label: "עמוד ארוך",  description: "עמוד עם 7 עד 10 אזורי תוכן.",                   price: 350, pricing_type: "fixed", requires_review: false },
    { id: "special", label: "עמוד מיוחד", description: "עמוד שכולל טאבים, סינון או מחשבון פשוט.",       price: 500, pricing_type: "fixed", requires_review: false }
  ];

  /* Things that are part of the site base package, shown for information only. */
  const includedFeatures = [
    { id: "about",        label: "אודות",           hint: "עמוד שמספר על העסק" },
    { id: "services",     label: "שירותים",         hint: "מה אתם מציעים" },
    { id: "contact-form", label: "טופס יצירת קשר",  hint: "טופס בסיסי" },
    { id: "map",          label: "מפה",             hint: "מפה בסיסית עם המיקום" }
  ];

  /* ---------------- add-on catalogue ----------------
     id, label, description, price, pricing_type (fixed | percentage | custom),
     requires_review, scope (which service), group (where the wizard shows it),
     unit / maxQty for quantity items. */
  const catalog = [
    /* site pages and areas */
    { id: "faq-page",      label: "עמוד שאלות נפוצות",          description: "עמוד עם התשובות לשאלות שחוזרות.",                     price: 150, pricing_type: "fixed",  requires_review: false, scope: ["site"],    group: "site-pages" },
    { id: "gallery-site",  label: "גלריה / תיק עבודות",         description: "עמוד או אזור עם תמונות ופרויקטים.",                    price: 150, pricing_type: "fixed",  requires_review: false, scope: ["site"],    group: "site-pages" },
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
    { id: "ga",            label: "Google Analytics",           description: "מדידת מבקרים ומקורות תנועה.",                            price: 100, pricing_type: "fixed", requires_review: false, scope: ["landing", "site"], group: "tracking" },
    { id: "meta-pixel",    label: "Meta Pixel",                 description: "מדידה לקמפיינים בפייסבוק ובאינסטגרם.",                   price: 100, pricing_type: "fixed", requires_review: false, scope: ["landing", "site"], group: "tracking" },
    { id: "cookie-banner", label: "הודעת עוגיות",               description: "הודעה והסכמה לעוגיות, לפי הדרישות המקובלות.",            price: 100, pricing_type: "fixed", requires_review: false, scope: ["landing", "site"], group: "tracking" },

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
    customNote: "המחיר המותאם שנשלח לכם יכלול גם את תוספת הדחיפות."
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
    customQuote: "הבקשה כוללת רכיב שדורש התאמת מחיר. נעבור על הפרטים ונשלח לכם סיכום ומחיר מלא לפני כל התחייבות.",
    customShort: "נדרש מחיר מותאם",
    biggerScope: "האתר שלכם רחב יותר משלושה עמודים. סמנו למטה אילו עמודים נוספים תצטרכו, והמחיר יתעדכן לפי המחירון.",
    notBinding: "שליחת הטופס אינה מחייבת בתשלום. נעבור על הפרטים ונשלח לכם סיכום לאישור.",
    reviewPrice: "מחיר ייקבע לאחר בדיקת הבקשה",
    totalLabel: "סה\"כ לפי הבחירות שלכם",
    setupLabel: "סה\"כ הקמה",
    depositLabel: "50% מקדמה",
    balanceLabel: "יתרה לפני מסירה",
    maintenanceSeparate: "אופציונלי ונפרד. תשלום חודשי, לא חלק ממחיר ההקמה.",
    fine: "תשלום חד-פעמי לבנייה. תחזוקה, אם נבחרה, נפרדת וחודשית. המחיר הסופי נסגר בסיכום הזמנה שאתם מאשרים לפני תחילת העבודה."
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
       site.extraPages: { normal, long, special: numbers, unknown: bool }
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
      custom_quote_required: false, custom_reasons: []
    };
    if (!st || !st.type || !services[st.type]) return out;
    const svc = services[st.type];
    out.service = svc;
    out.base_price = svc.basePrice;
    out.baseLabel = svc.priceMode === "from" ? "החל מ־" + formatPrice(svc.basePrice) : formatPrice(svc.basePrice);

    const custom = (reason) => { out.custom_quote_required = true; if (reason && !out.custom_reasons.includes(reason)) out.custom_reasons.push(reason); };
    const addLine = (l) => { out.lines.push(l); if (l.pricing_type === "fixed" && typeof l.total === "number") out.addons_total += l.total; };

    /* extra pages for a site */
    if (st.type === "site") {
      const pg = byId(pageOptions, (st.site || {}).pages);
      if (pg && pg.custom) custom("מספר העמודים עדיין לא ידוע");
      if (pg && !pg.custom && pg.extraMax !== 0) {
        const bp = (st.site && st.site.extraPages) || {};
        if (bp.unknown) custom("סוגי העמודים הנוספים עדיין לא ידועים");
        else pageTypes.forEach((t) => {
          const qty = Number(bp[t.id]) || 0;
          if (qty > 0) addLine({ id: "page-" + t.id, label: t.label + (qty > 1 ? " × " + qty : ""), qty, unit: "לעמוד", price: t.price, total: qty * t.price, pricing_type: "fixed", requires_review: false });
        });
        if (pg.customByDefault) custom("יותר מ־10 עמודים");
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

  const api = { currency, services, pageOptions, pageTypes, includedFeatures, catalog, bundles, urgency, maintenance, maintenanceNote, copy, formatPrice, calc, byId };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.DS_PRICING = api;
})(typeof window !== "undefined" ? window : null);
