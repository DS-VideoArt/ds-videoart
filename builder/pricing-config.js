/* ============================================================
   DS Creative Studio — pricing & catalogue (single source of truth)

   Every price the site shows or calculates comes from here.
   Rules:
   - Only prices that were approved in the brief are numeric.
   - Anything without an approved price is `price: null` with
     `review: true`, which makes the builder flag the request for
     a personal quote instead of inventing a number.
   - This file has no DOM code, so it can later feed an order summary,
     an internal dashboard, or a server without changes.
   ============================================================ */

window.DS_PRICING = {
  currency: "₪",

  services: {
    landing: {
      id: "landing",
      name: "דף נחיתה",
      basePrice: 440,
      priceMode: "fixed",             // shown as "440 ₪"
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
      priceMode: "from",              // shown as "החל מ־1,290 ₪"
      includedPages: 3,
      deliveryDays: 5,
      short: "כמה עמודים עם תפריט, שמציגים את העסק בצורה רחבה יותר.",
      includedNote: "המחיר כולל אתר תדמית של עד 3 עמודים. צריכים אתר רחב יותר או מבנה מורכב יותר? נתאים את ההיקף והמחיר לצורך שלכם.",
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
  },

  /* How many pages the client expects. Only "up to 3" fits the entry price. */
  pageOptions: [
    { id: "upto3",   label: "עד 3",          hint: "כלול במחיר הכניסה", withinBase: true },
    { id: "4to6",    label: "4 עד 6",        hint: "היקף רחב יותר",     withinBase: false },
    { id: "7to10",   label: "7 עד 10",       hint: "היקף רחב יותר",     withinBase: false },
    { id: "over10",  label: "יותר מ־10",     hint: "היקף רחב יותר",     withinBase: false },
    { id: "unknown", label: "עדיין לא יודעים", hint: "נעזור להחליט",   withinBase: false }
  ],

  /* Things a client can ask for in a business site.
     included: part of the entry package as-is.
     review:   no approved price yet, so it flags the request for a personal quote. */
  siteFeatures: [
    { id: "about",        label: "אודות",              hint: "עמוד שמספר על העסק",          included: true },
    { id: "services",     label: "שירותים",            hint: "מה אתם מציעים",               included: true },
    { id: "faq",          label: "שאלות נפוצות",       hint: "תשובות לשאלות שחוזרות",       included: true },
    { id: "contact-form", label: "טופס יצירת קשר",     hint: "טופס בסיסי",                  included: true },
    { id: "map",          label: "מפה",                hint: "מפה בסיסית עם המיקום",        included: true },
    { id: "gallery",      label: "גלריה / עבודות",     hint: "תמונות או פרויקטים",          included: false, review: true },
    { id: "blog",         label: "בלוג / כתבות",       hint: "תוכן שמתעדכן",                included: false, review: true },
    { id: "extra-lang",   label: "שפה נוספת",          hint: "למשל אנגלית",                 included: false, review: true },
    { id: "other",        label: "משהו אחר",           hint: "ספרו לנו בקצרה",              included: false, review: true, hasNote: true }
  ],

  /* Add-on catalogue. Each entry: id, name, desc, price, fixed, review.
     No add-on has an approved price in the current brief, so all are review-only.
     When a price list is approved, set price + fixed: true and the builder
     will start adding it to "סה\"כ לפי הבחירות" automatically. */
  addons: [
    { id: "extra-page", name: "עמוד נוסף",        desc: "עמוד מעבר לשלושה הכלולים במחיר הכניסה", price: null, fixed: false, review: true },
    { id: "gallery",    name: "גלריה / עבודות",   desc: "עמוד או אזור עם תמונות ופרויקטים",       price: null, fixed: false, review: true },
    { id: "blog",       name: "בלוג / כתבות",     desc: "מבנה לכתבות שמתעדכנות",                  price: null, fixed: false, review: true },
    { id: "extra-lang", name: "שפה נוספת",        desc: "גרסה של האתר בשפה נוספת",                 price: null, fixed: false, review: true },
    { id: "other",      name: "רכיב מיוחד",       desc: "משהו שלא ברשימה",                          price: null, fixed: false, review: true }
  ],

  maintenance: [
    { id: "none",     name: "ללא תחזוקה",     price: 0,   per: "לחודש",
      includes: ["האתר שלכם, בלי תשלום חודשי", "שינוי נקודתי בעתיד מתומחר בנפרד ומראש"] },
    { id: "basic",    name: "תחזוקה בסיסית",  price: 149, per: "לחודש",
      includes: ["עד 30 דקות עבודה בחודש", "שינויי טקסט קטנים והחלפת תמונות", "בדיקת קישורים וטפסים, תיקונים קטנים", "מענה בתוך שני ימי עסקים"] },
    { id: "extended", name: "תחזוקה מורחבת",  price: 349, per: "לחודש",
      includes: ["עד 90 דקות עבודה בחודש", "שינויים שוטפים ובדיקה טכנית", "טיפול בעדיפות", "מענה בתוך יום עסקים"] }
  ],
  maintenanceNote: "זמן שלא נוצל בחודש לא עובר לחודש הבא. אפשר להצטרף או להפסיק בכל שלב. שום מסלול לא נבחר מראש.",

  copy: {
    hosting: "ברוב דפי הנחיתה ואתרי התדמית הקטנים ניתן להתחיל עם אחסון ללא עלות חודשית במסגרת המסלול החינמי של הספק. אם בעתיד יהיה צורך בשדרוג, תדעו על כך מראש ולא יתבצע חיוב ללא אישורכם.",
    infra: "לפרויקט ניתן להקים חשבון תשתית ייעודי ששייך לכם. בסיום העבודה תקבלו את פרטי הגישה ותוכלו להחליף את הסיסמה.",
    domainHelp: "נעזור לכם לבחור, לרכוש, להגדיר ולחבר את הדומיין ללא דמי שירות נוספים. אתם משלמים רק את עלות הדומיין לספק, והדומיין נרשם על שמכם.",
    customQuote: "הבקשה כוללת רכיב שדורש התאמת מחיר. שלחו את הפרטים ונחזור אליכם עם סיכום ומחיר מלא לפני כל התחייבות.",
    biggerScope: "נראה שהאתר שלכם דורש היקף רחב יותר. המשיכו למלא את הפרטים כדי שנוכל להכין לכם מחיר מדויק.",
    notBinding: "שליחת הטופס אינה מחייבת בתשלום. נעבור על הפרטים ונשלח לכם סיכום לאישור.",
    reviewPrice: "מחיר ייקבע לאחר בדיקת הבקשה"
  },

  formatPrice(n) {
    if (n === null || n === undefined || isNaN(n)) return this.copy.reviewPrice;
    return new Intl.NumberFormat("he-IL").format(n) + " " + this.currency;
  }
};
