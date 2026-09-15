/* ============================================================
   DS Creative Studio, Project Builder (wizard)

   Layers, kept apart on purpose so each can change alone:
     1. state       - what the client filled in (persisted locally)
     2. rules       - pricing decisions live in pricing-config.js (P.calc)
     3. steps       - which screens exist for the chosen route
     4. ui          - rendering, validation, focus, progress, side help
     5. submission  - payload shaping + Netlify Forms POST

   Vanilla JS, no dependencies.
   ============================================================ */

(function () {
  "use strict";

  const P = window.DS_PRICING;
  const STORAGE_KEY = "dsc_builder_v1";
  const CONTACT_URL = "/#contact";
  const WA = "https://wa.me/972548203022";

  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ======================= 1. STATE ======================= */

  function defaultState() {
    return {
      type: null,                 // 'landing' | 'site' | 'unsure'
      business: { businessName: "", contactName: "", phone: "", email: "", category: "", categoryOther: "", about: "" },
      goals: [], goalOther: "",
      landing: { offer: "", audience: "", cta: "" },
      site: { pages: "", pageKinds: [], pageOther: "", features: [] },
      addons: {},                 // { catalogId: quantity }
      addonNotes: {},             // { catalogId: free text }
      content: { service: "", pages: 0 },     // pages 0 = not set yet, defaults to the site estimate
      urgent: false,
      materials: { logo: "", texts: "", images: "", style: "", references: "" },
      domain: "",
      hosting: { acknowledged: false },
      maintenance: "",
      notes: "",
      stepIndex: 0,
      startedAt: new Date().toISOString(),
      tracking: { started: false, lastStep: "" }   // funnel bookkeeping only, never sent as content
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      const d = defaultState();
      const merged = Object.assign(d, s);
      merged.business = Object.assign(defaultState().business, s.business || {});
      merged.landing = Object.assign(defaultState().landing, s.landing || {});
      merged.site = Object.assign(defaultState().site, s.site || {});
      /* saved states from the old 3-page model are reset to the current options */
      if (!P.byId(P.pageOptions, merged.site.pages)) merged.site.pages = "";
      merged.site.pageKinds = (Array.isArray(merged.site.pageKinds) ? merged.site.pageKinds : []).filter((k) => P.byId(P.pageKinds, k));
      merged.site.features = (Array.isArray(merged.site.features) ? merged.site.features : []).filter((f) => P.byId(P.includedFeatures, f));
      merged.site.pageOther = typeof merged.site.pageOther === "string" ? merged.site.pageOther : "";
      delete merged.site.extraPages; delete merged.site.featuresOther;
      merged.materials = Object.assign(defaultState().materials, s.materials || {});
      merged.hosting = Object.assign(defaultState().hosting, s.hosting || {});
      merged.content = Object.assign(defaultState().content, s.content || {});
      merged.addons = Object.assign({}, s.addons || {});
      merged.addonNotes = Object.assign({}, s.addonNotes || {});
      merged.tracking = Object.assign(defaultState().tracking, s.tracking || {});
      return merged;
    } catch { return null; }
  }
  function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }
  function clearSaved() { try { localStorage.removeItem(STORAGE_KEY); } catch {} }

  let state = load() || defaultState();

  /* ---- attribution: remember the UTM set the visitor arrived with ----
     Stored in localStorage (30 days) so it survives steps, refresh, back, and the
     switch to the "prefer to talk" route. A new explicit UTM set replaces the old one.
     Nothing is invented when there is no UTM: the fields are simply empty. */
  const UTM_KEY = "dsc_utm_v1";
  const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  function captureUtm() {
    try {
      const p = new URLSearchParams(location.search);
      const found = {}; let any = false;
      UTM_KEYS.forEach((k) => { const v = (p.get(k) || "").trim().slice(0, 200); found[k] = v; if (v) any = true; });
      if (any) { found.captured_at = new Date().toISOString(); localStorage.setItem(UTM_KEY, JSON.stringify(found)); return found; }
      const raw = localStorage.getItem(UTM_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s.captured_at || Date.now() - Date.parse(s.captured_at) > 30 * 86400000) { localStorage.removeItem(UTM_KEY); return null; }
      return s;
    } catch { return null; }
  }
  const UTM = captureUtm();
  const utmValue = (k) => (UTM && UTM[k]) || "";

  /* Entry from a specific package card: ?type=landing | ?type=site */
  const params = new URLSearchParams(location.search);
  const presetType = params.get("type");
  if (presetType === "landing" || presetType === "site") {
    if (state.type !== presetType) { state = defaultState(); state.type = presetType; }
  }

  /* Demo presets (screenshots / previews only). ?demo=landing | site-priced | site-custom, optional &step=<id> */
  if (params.get("demo")) applyDemo(params.get("demo"));

  /* ======================= 2. RULES (see pricing-config.js) ======================= */

  const calc = (st) => P.calc(st);
  const priced = (st) => !!(st.type && P.services[st.type]);
  const item = (id) => P.byId(P.catalog, id);

  /* ---- measurement hooks (analytics.js decides whether anything is actually sent) ---- */
  const track = (name, params) => { try { return !!(window.DS_ANALYTICS && window.DS_ANALYTICS.trackEvent(name, params)); } catch { return false; } };
  const serviceType = (st) => (st.type === "site" ? "website" : st.type === "landing" ? "landing_page" : "unsure");
  function funnelParams(st) {
    const c = calc(st);
    const p = { service_type: serviceType(st), custom_quote: !!c.custom_quote_required, maintenance_plan: st.maintenance || "not_selected" };
    if (!c.custom_quote_required && typeof c.setup_total === "number") p.setup_total = c.setup_total;
    return p;
  }
  function markStarted() {
    if (state.tracking.started) return;
    state.tracking.started = true; save();
    track("builder_start", { service_type: serviceType(state) });
  }

  /* ======================= 3. STEPS ======================= */

  function stepList(st) {
    const common = ["business", "goal"];
    const route = st.type === "site" ? ["site-scope", "site-features"] : ["landing-offer"];
    const tail = ["extras", "materials", "domain", "hosting", "maintenance", "summary"];
    const first = presetType ? [] : ["type"];
    return [...first, ...common, ...route, ...tail];
  }

  const STEP_TITLES = {
    "type": "מה תרצו לבנות?",
    "business": "על העסק",
    "goal": "מה הדבר העיקרי שאתם רוצים שהמבקר יעשה?",
    "landing-offer": "על דף הנחיתה",
    "site-scope": "אילו עמודים יהיו באתר?",
    "site-features": "מה תרצו באתר?",
    "extras": "מה עוד תרצו?",
    "materials": "מה כבר יש לכם ביד",
    "domain": "דומיין",
    "hosting": "אחסון וחשבון הפרויקט",
    "maintenance": "רוצים שנמשיך לטפל באתר גם אחרי המסירה?",
    "summary": "הפרויקט שלכם"
  };

  /* ======================= 4. UI ======================= */

  const els = {
    stage: qs("#stage"),
    progressText: qs("#progressText"),
    progressBar: qs("#progressBar"),
    back: qs("#btnBack"),
    next: qs("#btnNext"),
    summary: qs("#summaryPanel"),
    summaryMobile: qs("#summaryMobile"),
    sideHelp: qs("#sideHelp"),
    restart: qs("#btnRestart"),
    footerNote: qs("#footerNote")
  };

  function cards({ name, options, selected, multi = false, note = null, cls = "" }) {
    return `<div class="cards ${cls}" role="${multi ? "group" : "radiogroup"}">` + options.map((o) => {
      const checked = multi ? selected.includes(o.id) : selected === o.id;
      return `<label class="card-choice${checked ? " on" : ""}">
        <input type="${multi ? "checkbox" : "radio"}" name="${name}" value="${esc(o.id)}" ${checked ? "checked" : ""}>
        ${o.icon ? `<span class="cc-icon" aria-hidden="true">${o.icon}</span>` : ""}
        <span class="cc-body">
          <span class="cc-title">${esc(o.label)}</span>
          ${o.hint ? `<span class="cc-hint">${esc(o.hint)}</span>` : ""}
          ${o.badge ? `<span class="cc-badge ${o.badgeKind || ""}">${esc(o.badge)}</span>` : ""}
        </span>
        <span class="cc-check" aria-hidden="true"></span>
      </label>`;
    }).join("") + `</div>${note ? `<p class="step-note">${note}</p>` : ""}`;
  }

  const ICONS = {
    landing: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    site: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 9v11"/></svg>',
    unsure: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7"/><path d="M12 17h.01"/></svg>'
  };

  function field(id, label, input, hint) {
    return `<div class="bf-field" data-field-wrap="${id}">
      <label for="${id}">${label}</label>
      ${input}
      ${hint ? `<p class="bf-hint">${hint}</p>` : ""}
      <p class="bf-err" id="${id}-err"></p>
    </div>`;
  }
  const req = '<span class="req" aria-hidden="true">*</span>';

  /* Badge text for a catalogue item */
  function badgeOf(c) {
    if (c.pricing_type === "fixed") return P.formatPrice(c.price) + (c.unit ? " " + c.unit : "");
    return P.copy.customShort;
  }

  /* One add-on card (checkbox) with an optional quantity control and note field */
  function addonCard(c) {
    const qty = Number(state.addons[c.id]) || 0;
    const on = qty > 0;
    const badgeKind = c.pricing_type === "fixed" ? "price" : "review";
    return `<div class="addon-item" data-addon="${c.id}">
      <label class="card-choice addon${on ? " on" : ""}">
        <input type="checkbox" name="addon" value="${c.id}" ${on ? "checked" : ""}>
        <span class="cc-body">
          <span class="cc-title">${esc(c.label)}</span>
          <span class="cc-hint">${esc(c.description)}</span>
          <span class="cc-badge ${badgeKind}">${esc(badgeOf(c))}</span>
        </span>
        <span class="cc-check" aria-hidden="true"></span>
      </label>
      ${c.maxQty ? `<div class="qty" ${on ? "" : "hidden"}>
        <span>כמה?</span>
        <button type="button" class="qty-btn" data-qty="-1" aria-label="פחות">−</button>
        <input type="number" id="qty-${c.id}" min="1" max="${c.maxQty}" value="${Math.max(1, qty)}" aria-label="כמות: ${esc(c.label)}">
        <button type="button" class="qty-btn" data-qty="1" aria-label="יותר">+</button>
      </div>` : ""}
      ${c.hasNote ? `<div class="bf-field addon-note" ${on ? "" : "hidden"}>
        <label for="note-${c.id}">ספרו לנו בקצרה</label>
        <input id="note-${c.id}" type="text" data-note="${c.id}" value="${esc(state.addonNotes[c.id] || "")}">
      </div>` : ""}
    </div>`;
  }

  function addonGroup(title, lead, items, extra = "") {
    if (!items.length) return "";
    return `<div class="addon-group">
      <h2 class="group-title">${esc(title)}</h2>
      ${lead ? `<p class="group-lead">${lead}</p>` : ""}
      <div class="cards catalog">${items.map(addonCard).join("")}</div>
      ${extra}
    </div>`;
  }

  const inScope = (group) => P.catalog.filter((c) => c.group === group && c.scope.includes(state.type));

  const CATEGORIES = ["מסעדה, קפה ואוכל", "יופי וטיפוח", "בריאות ורפואה", "ייעוץ ושירותים מקצועיים", "נדל\"ן", "חינוך והדרכה", "ספורט ופנאי", "חנות וקמעונאות", "בנייה, שיפוצים ובעלי מקצוע", "אחר"];
  const GOALS = [
    { id: "whatsapp", label: "לשלוח וואטסאפ" }, { id: "call", label: "להתקשר" }, { id: "lead", label: "להשאיר פרטים" },
    { id: "read", label: "לקרוא על העסק והשירותים" }, { id: "visit", label: "להגיע לעסק" }, { id: "other", label: "משהו אחר" }
  ];

  /* pages the client expects: the pages they picked, else a sensible figure for the size they chose */
  function totalPagesEstimate(st) {
    if (st.type !== "site") return 1;
    const picked = (st.site.pageKinds || []).length;
    if (picked > 0) return picked;
    return { upto6: P.services.site.includedPages, "7to10": 7, over10: 10 }[st.site.pages] || 1;
  }

  const render = {
    "type"() {
      const svc = P.services;
      return `<p class="step-lead">שני שירותים, אותה רמת איכות. ההבדל הוא היקף העבודה.</p>
      ${cards({ name: "type", selected: state.type, cls: "services", options: [
        { id: "landing", label: svc.landing.name, hint: svc.landing.short, badge: P.formatPrice(svc.landing.basePrice), badgeKind: "price", icon: ICONS.landing },
        { id: "site", label: svc.site.name, hint: svc.site.short + " המחיר כולל עד 6 עמודי תוכן סטנדרטיים.", badge: "החל מ־" + P.formatPrice(svc.site.basePrice), badgeKind: "price", icon: ICONS.site },
        { id: "unsure", label: "אני עדיין לא בטוח", hint: "נעזור לכם להחליט", icon: ICONS.unsure }
      ] })}
      <p class="bf-err" id="type-err"></p>
      <details class="compare-details" ${window.matchMedia("(max-width: 720px)").matches ? "" : "open"}>
      <summary>מה ההבדל?</summary>
      <div class="compare" aria-label="השוואה קצרה בין השירותים">
        <div class="cmp-row head"><span>בקצרה</span><strong>${esc(svc.landing.name)}</strong><strong>${esc(svc.site.name)}</strong></div>
        <div class="cmp-row"><span>מתאים ל</span><em>שירות אחד, קמפיין, או התחלה בקטן</em><em>עסק שרוצה להציג כמה נושאים ולהופיע בגוגל בכמה חיפושים</em></div>
        <div class="cmp-row"><span>מה מקבלים</span><em>עמוד אחד ממוקד עם עד 6 עד 7 אזורי תוכן</em><em>עד 6 עמודי תוכן סטנדרטיים עם תפריט. 7 ומעלה מתומחרים לאחר אפיון</em></div>
        <div class="cmp-row"><span>מסירה</span><em>עד ${svc.landing.deliveryDays} ימי עסקים</em><em>עד ${svc.site.deliveryDays} ימי עסקים</em></div>
        <div class="cmp-row"><span>מחיר</span><em>${P.formatPrice(svc.landing.basePrice)}, ${esc(svc.landing.priceNote).toLowerCase()}</em><em>החל מ־${P.formatPrice(svc.site.basePrice)}, כולל עד 6 עמודי תוכן סטנדרטיים</em></div>
      </div>
      </details>
      <div class="unsure-box" id="unsureBox" ${state.type === "unsure" ? "" : "hidden"}>
        <h3>לא בטוחים? שתי דרכים להתקדם</h3>
        <p>רוב העסקים שמוכרים שירות אחד מתחילים בדף נחיתה, ואפשר להרחיב אחר כך. עסק עם כמה תחומים או כמה שירותים בדרך כלל מרוויח יותר מאתר תדמית. ואם עדיין לא ברור, שיחה של כמה דקות תפתור את זה.</p>
        <div class="unsure-actions">
          <button type="button" class="btn btn-ghost" data-pick="landing">דף נחיתה מתאים לי</button>
          <button type="button" class="btn btn-ghost" data-pick="site">אתר תדמית מתאים לי</button>
          <a class="btn btn-primary" href="${CONTACT_URL}">אני מעדיף לדבר</a>
        </div>
      </div>`;
    },

    "business"() {
      const b = state.business;
      return `<p class="step-lead">כמה פרטים כדי שנדע עם מי אנחנו עובדים. בלי ז'רגון.</p>
      <div class="bf-grid">
        ${field("businessName", "שם העסק " + req, `<input id="businessName" data-path="business.businessName" type="text" value="${esc(b.businessName)}" autocomplete="organization" placeholder="שם העסק">`)}
        ${field("contactName", "שם איש הקשר " + req, `<input id="contactName" data-path="business.contactName" type="text" value="${esc(b.contactName)}" autocomplete="name" placeholder="שם מלא">`)}
        ${field("phone", "טלפון " + req, `<input id="phone" data-path="business.phone" type="tel" inputmode="tel" dir="ltr" value="${esc(b.phone)}" autocomplete="tel" placeholder="מספר טלפון">`)}
        ${field("email", "אימייל", `<input id="email" data-path="business.email" type="email" inputmode="email" dir="ltr" value="${esc(b.email)}" autocomplete="email" placeholder="כתובת אימייל">`, "לא חובה. נוח לשליחת הסיכום.")}
      </div>
      <div class="bf-field">
        <span class="bf-label">תחום העסק ${req}</span>
        ${cards({ name: "category", selected: b.category, options: CATEGORIES.map((c) => ({ id: c, label: c })) })}
        <p class="bf-err" id="category-err"></p>
        <div class="bf-field" id="categoryOtherWrap" ${b.category === "אחר" ? "" : "hidden"}>
          <label for="categoryOther">איזה תחום?</label>
          <input id="categoryOther" data-path="business.categoryOther" type="text" value="${esc(b.categoryOther)}">
        </div>
      </div>
      ${field("about", "במשפט או שניים: מה העסק עושה? " + req, `<textarea id="about" data-path="business.about" rows="3" placeholder="למשל: קליניקה לטיפולי פנים בחיפה, בעיקר לנשים בגילאי 30 עד 55">${esc(b.about)}</textarea>`)}`;
    },

    "goal"() {
      return `<p class="step-lead">אפשר לבחור יותר מאחד. זה עוזר לנו להחליט מה מקבל את המקום הבולט ביותר.</p>
      ${cards({ name: "goals", selected: state.goals, multi: true, options: GOALS })}
      <p class="bf-err" id="goals-err"></p>
      <div class="bf-field" id="goalOtherWrap" ${state.goals.includes("other") ? "" : "hidden"}>
        <label for="goalOther">מה למשל?</label>
        <input id="goalOther" data-path="goalOther" type="text" value="${esc(state.goalOther)}">
      </div>`;
    },

    "landing-offer"() {
      const l = state.landing;
      const svc = P.services.landing;
      return `<div class="included-box">
        <div class="ib-head"><strong>${esc(svc.name)}</strong><span>${P.formatPrice(svc.basePrice)} · ${esc(svc.priceNote)}</span></div>
        <details class="ib-details"><summary>מה כלול במחיר</summary><ul>${svc.includes.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></details>
      </div>
      ${field("offer", "מה השירות או המוצר שהדף מקדם? " + req, `<textarea id="offer" data-path="landing.offer" rows="2" placeholder="למשל: סדנת בישול לזוגות, פעם בשבוע">${esc(l.offer)}</textarea>`)}
      ${field("audience", "למי הדף מיועד?", `<input id="audience" data-path="landing.audience" type="text" value="${esc(l.audience)}" placeholder="למשל: זוגות בגילאי 25 עד 45 מאזור המרכז">`, "לא חובה, אבל עוזר מאוד לניסוח.")}
      <div class="bf-field">
        <span class="bf-label">הפעולה המרכזית בדף ${req}</span>
        ${cards({ name: "cta", selected: l.cta, options: [
          { id: "whatsapp", label: "וואטסאפ" }, { id: "call", label: "שיחת טלפון" }, { id: "form", label: "השארת פרטים" }, { id: "other", label: "משהו אחר" }
        ] })}
        <p class="bf-err" id="cta-err"></p>
      </div>`;
    },

    "site-scope"() {
      const svc = P.services.site;
      const s = state.site;
      const pg = P.byId(P.pageOptions, s.pages);
      return `<div class="included-box">
        <div class="ib-head"><strong>${esc(svc.name)}</strong><span>החל מ־${P.formatPrice(svc.basePrice)} · תשלום חד פעמי</span></div>
        <p class="ib-note">${esc(svc.includedNote)}</p>
        <details class="ib-details"><summary>מה כלול במחיר הבסיס</summary><ul>${svc.includes.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></details>
        <details class="ib-details"><summary>מה נחשב עמוד תוכן סטנדרטי?</summary><p>${esc(P.copy.standardPage)}</p></details>
      </div>
      <div class="bf-field">
        <span class="bf-label">כמה עמודי תוכן אתם מעריכים שתצטרכו? ${req}</span>
        ${cards({ name: "pages", selected: s.pages, options: P.pageOptions.map((o) => ({ id: o.id, label: o.label, hint: o.hint, badge: o.included ? "כלול" : (o.custom ? "לאחר אפיון" : ""), badgeKind: o.included ? "ok" : "review" })) })}
        <p class="bf-err" id="pages-err"></p>
        <div class="scope-msg" id="overSixMsg" ${pg && pg.custom ? "" : "hidden"}>${esc(P.copy.overSix)}</div>
        <div class="scope-msg soft" id="unknownMsg" ${pg && pg.unknown ? "" : "hidden"}>${esc(P.copy.pagesUnknownNote)}</div>
      </div>
      <div class="bf-field">
        <span class="bf-label">אילו עמודים תרצו?</span>
        <p class="bf-hint">לא חובה, אפשר להחליט יחד. בחרו את סוגי העמודים שמתאימים לעסק שלכם: עד 6 עמודי תוכן סטנדרטיים כלולים במחיר הבסיס, בלי תוספת.</p>
        ${cards({ name: "pageKinds", selected: s.pageKinds, multi: true, options: P.pageKinds.map((k) => ({ id: k.id, label: k.label })) })}
        <p class="step-note" id="kindCount"></p>
        <div id="pageOtherWrap" ${s.pageKinds.includes("other") ? "" : "hidden"}>
          ${field("pageOther", "איזה עמוד?", `<input id="pageOther" data-path="site.pageOther" type="text" value="${esc(s.pageOther)}" placeholder="למשל: עמוד מאמרים, עמוד צוות, עמוד מחירון">`)}
        </div>
        <p class="bf-err" id="pageKinds-err"></p>
      </div>`;
    },

    "site-features"() {
      const s = state.site;
      return `<p class="step-lead">מה שכלול במחיר הבסיס מסומן "כלול". לשאר יש מחיר ברור, והוא מתעדכן בסיכום מיד.</p>
      <div class="addon-group">
        <h2 class="group-title">כלול במחיר הבסיס</h2>
        ${cards({ name: "features", selected: s.features, multi: true, options: P.includedFeatures.map((f) => ({ id: f.id, label: f.label, hint: f.hint, badge: "כלול", badgeKind: "ok" })) })}
      </div>
      ${addonGroup("תוספות לאתר", "מחירים לפי המחירון. מה שאין לו מחיר קבוע מסומן, ונשלח לכם מחיר מותאם.", inScope("site-pages"))}`;
    },

    "extras"() {
      const landing = state.type === "landing";
      const groups = [];
      if (landing) groups.push(addonGroup("אזורים ותמונות", "מה שכלול בדף: עד 6 עד 7 אזורי תוכן. כאן מוסיפים מעבר לזה.", inScope("landing-sections")));
      groups.push(addonGroup("מדידה ופרטיות", "רוצים לדעת כמה אנשים מגיעים ומאיפה? בוחרים את שני כלי המדידה יחד, ומשלמים 150 ₪ במקום 200. " + esc(P.copy.consentHint), inScope("tracking")));
      if (landing) groups.push(addonGroup("חיבור למערכות שכבר יש לכם", "מערכת תורים, לינק תשלום או רשימת תפוצה שכבר עובדים אצלכם.", inScope("connect")));
      groups.push(addonGroup("דברים שדורשים מחיר מותאם", "לאלה אין מחיר קבוע, כי ההיקף משתנה מעסק לעסק. סמנו מה שרלוונטי, ונחזור אליכם עם מחיר לפני כל התחייבות.", inScope("custom")));
      return `<p class="step-lead">הכול כאן אופציונלי. אפשר לדלג ולהמשיך.</p>
      ${groups.join("")}
      <div class="addon-group">
        <h2 class="group-title">לוח זמנים</h2>
        ${cards({ name: "urgent", selected: state.urgent ? "urgent" : "regular", cls: "two", options: [
          { id: "regular", label: "רגיל", hint: `לפי זמני המסירה הרגילים: עד ${P.services[state.type].deliveryDays} ימי עסקים מקבלת החומרים.` },
          { id: "urgent", label: P.urgency.label, hint: P.urgency.description, badge: "+" + P.urgency.percent + "%", badgeKind: "price" }
        ] })}
      </div>`;
    },

    "materials"() {
      const m = state.materials;
      const yn = (id, label, opts) => `<div class="bf-field"><span class="bf-label">${label} ${req}</span>${cards({ name: id, selected: m[id], options: opts })}<p class="bf-err" id="${id}-err"></p></div>`;
      const showContent = m.texts === "partial" || m.texts === "no";
      const edit = item("content-edit"), write = item("content-write");
      const perPage = state.type === "site";
      const priceTxt = (c) => P.formatPrice(c.price) + (perPage ? " לעמוד" : "");
      return `<p class="step-lead">אין לכם משהו מהרשימה? זה בסדר גמור. נעזור.</p>
      ${yn("logo", "לוגו", [{ id: "yes", label: "יש לוגו" }, { id: "no", label: "אין לוגו" }])}
      ${yn("texts", "טקסטים", [{ id: "yes", label: "יש טקסטים מוכנים" }, { id: "partial", label: "יש חלק" }, { id: "no", label: "אין, נצטרך עזרה" }])}
      <div class="content-help" id="contentHelp" ${showContent ? "" : "hidden"}>
        <span class="bf-label">רוצים שנטפל בתוכן? ${req}</span>
        ${cards({ name: "contentService", selected: state.content.service, options: [
          { id: "none", label: "לא, נביא טקסטים בעצמנו", hint: "בלי תוספת" },
          { id: "edit", label: edit.label, hint: edit.description, badge: priceTxt(edit), badgeKind: "price" },
          { id: "write", label: write.label, hint: write.description, badge: priceTxt(write), badgeKind: "price" }
        ] })}
        <p class="bf-err" id="contentService-err"></p>
        ${perPage ? `<div class="bf-field inline-qty" id="contentPagesWrap" ${state.content.service === "edit" || state.content.service === "write" ? "" : "hidden"}>
          <label for="contentPages">לכמה עמודים?</label>
          <input id="contentPages" type="number" min="1" max="30" value="${Number(state.content.pages) > 0 ? state.content.pages : totalPagesEstimate(state)}">
          <p class="bf-hint">לפי ההערכה שלכם, האתר יכלול ${totalPagesEstimate(state)} עמודים. אפשר לבחור פחות.</p>
        </div>` : ""}
      </div>
      ${yn("images", "תמונות", [{ id: "yes", label: "יש תמונות" }, { id: "partial", label: "יש חלק" }, { id: "no", label: "אין, נצטרך עזרה" }])}
      ${field("style", "צבעים או סגנון שאתם אוהבים", `<input id="style" data-path="materials.style" type="text" value="${esc(m.style)}" placeholder="למשל: נקי ובהיר, צבעי המותג כחול וזהב">`, "לא חובה.")}
      ${field("references", "קישורים לאתרים שאתם אוהבים", `<textarea id="references" data-path="materials.references" rows="2" dir="ltr" placeholder="https://...">${esc(m.references)}</textarea>`, "לא חובה. עוזר לנו להבין טעם.")}`;
    },

    "domain"() {
      return `<p class="step-lead">הדומיין הוא הכתובת של האתר, למשל שם-העסק.co.il.</p>
      ${cards({ name: "domain", selected: state.domain, options: [
        { id: "yes", label: "כן, יש לנו דומיין" }, { id: "no", label: "לא, עדיין אין" }, { id: "unsure", label: "אני לא בטוח" }
      ] })}
      <p class="bf-err" id="domain-err"></p>
      <div class="scope-msg soft" id="domainHelp" ${state.domain === "no" || state.domain === "unsure" ? "" : "hidden"}>${esc(P.copy.domainHelp)}</div>`;
    },

    "hosting"() {
      return `<div class="info-cards">
        <div class="info-card"><h3>אחסון</h3><p>${esc(P.copy.hosting)}</p></div>
        <div class="info-card"><h3>חשבון תשתית לפרויקט</h3><p>${esc(P.copy.infra)}</p></div>
      </div>
      <label class="ack"><input type="checkbox" id="hostingAck" ${state.hosting.acknowledged ? "checked" : ""}><span>קראתי והבנתי</span></label>
      <p class="bf-err" id="hostingAck-err"></p>`;
    },

    "maintenance"() {
      return `<p class="step-lead">אפשרות בלבד. תשלום חודשי נפרד, לא חלק ממחיר ההקמה. שום מסלול לא מסומן מראש, ואפשר להחליט גם אחר כך.</p>
      <div class="cards plans" role="radiogroup">${P.maintenance.map((p) => `
        <label class="card-choice plan${state.maintenance === p.id ? " on" : ""}">
          <input type="radio" name="maintenance" value="${p.id}" ${state.maintenance === p.id ? "checked" : ""}>
          <span class="cc-body">
            <span class="cc-title">${esc(p.name)}</span>
            <span class="plan-price">${P.formatPrice(p.price)} <small>${esc(p.per)}</small></span>
            <ul class="plan-list">${p.includes.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
          </span>
          <span class="cc-check" aria-hidden="true"></span>
        </label>`).join("")}</div>
      <p class="bf-err" id="maintenance-err"></p>
      <p class="step-note">${esc(P.maintenanceNote)}</p>`;
    },

    "summary"() {
      return `<p class="step-lead">עברו על הסיכום. שליחה לא מחייבת בכלום, ואפשר לחזור ולשנות.</p>
      <div id="summaryInline"></div>
      ${field("notes", "משהו נוסף שכדאי שנדע?", `<textarea id="notes" data-path="notes" rows="3" placeholder="מועד יעד, בקשה מיוחדת, כל דבר">${esc(state.notes)}</textarea>`, "לא חובה.")}
      <div class="not-binding">${esc(P.copy.notBinding)}</div>
      <div class="form-status" id="submitStatus" role="status" aria-live="polite"></div>`;
    }
  };

  /* -------- side help: relevant to the step, not the same card everywhere -------- */

  function chosenSoFar() {
    const b = state.business; const out = [];
    if (b.businessName) out.push(["העסק", b.businessName]);
    if (b.category) out.push(["תחום", b.category === "אחר" ? b.categoryOther || "אחר" : b.category]);
    if (state.goals.length) out.push(["המטרה", state.goals.map((g) => (P.byId(GOALS, g) || {}).label || g).join(", ")]);
    if (state.type === "site" && state.site.pages) out.push(["עמודים", (P.byId(P.pageOptions, state.site.pages) || {}).label]);
    if (state.type === "site" && state.site.pageKinds.length) out.push(["נבחרו", state.site.pageKinds.map((k) => (P.byId(P.pageKinds, k) || {}).label || k).join(", ")]);
    return out;
  }

  function sideHelpFor(id) {
    const how = { title: "איך זה עובד?", html: "עונים על כמה שאלות קצרות, רואים סיכום לפי הבחירות, ושולחים. אנחנו עוברים על הפרטים ושולחים סיכום הזמנה לאישור. רק אחרי שאישרתם, מתחילים." };
    const list = (rows) => rows.length ? `<ul class="help-list">${rows.map(([k, v]) => `<li><span>${esc(k)}</span><strong>${esc(v)}</strong></li>`).join("")}</ul>` : "<p>עדיין לא נבחר כלום. זה בסדר, מתחילים.</p>";
    switch (id) {
      case "type": case "business": case "goal": return how;
      case "landing-offer": return { title: "טיפ קטן", html: "הצעה אחת ברורה עובדת טוב יותר משלוש. אם יש כמה שירותים, בחרו את זה שהכי כדאי להתחיל ממנו, ואת השאר אפשר להזכיר בקצרה." };
      case "site-scope": case "site-features": return { title: "מה כבר בחרתם", html: list(chosenSoFar()) };
      case "extras": return { title: "מה חשוב לדעת", html: "לכל מה שיש לו מחיר במחירון, הסכום מתעדכן מיד בסיכום. מה שאין לו מחיר קבוע מסומן, ואתם מקבלים מחיר מותאם לפני כל התחייבות. שום דבר לא מחויב בלי אישורכם." };
      case "materials": return { title: "טיפ קטן", html: "אין טקסטים מוכנים? זה קורה לרוב העסקים. אפשר לבחור כאן עריכה או כתיבה, והמחיר מופיע בסיכום. תמונות טובות מהטלפון עדיפות על תמונות גנריות." };
      case "domain": return { title: "מה חשוב לדעת", html: "הדומיין נרשם על שמכם ונשאר שלכם. אם אין לכם, נעזור לבחור ולרכוש, בלי דמי שירות מצידנו. משלמים רק לספק הדומיין." };
      case "hosting": return { title: "מה חשוב לדעת", html: "החשבונות של הפרויקט נרשמים עליכם, ואתם מקבלים את פרטי הגישה בסיום. אין תלות בנו כדי להחזיק את האתר באוויר." };
      case "maintenance": return { title: "אפשר לשנות אחר כך", html: "תחזוקה היא תשלום חודשי נפרד, לא חלק ממחיר ההקמה. אפשר להצטרף חודשיים אחרי המסירה, או להפסיק בכל שלב." };
      default: return null;
    }
  }

  /* -------- summary block (used in side panel, mobile bar, and final step) -------- */

  function summaryHTML(st, compact = false) {
    if (!priced(st)) {
      return `<p class="sum-empty">${st.type === "unsure" ? "עוד לא בטוחים? זה בסדר. בחרו שירות כשתרצו, או דברו איתנו." : "בחרו שירות כדי לראות סיכום."}</p>`;
    }
    const c = calc(st);
    const svc = c.service;
    const rows = [];
    rows.push({ k: svc.name, v: c.baseLabel, strong: true });
    if (st.type === "site" && st.site.pages) rows.push({ k: "מספר עמודים", v: c.page_label });
    c.lines.forEach((l) => rows.push({ k: l.label, v: l.pricing_type === "fixed" ? P.formatPrice(l.total) : P.copy.customShort, review: l.pricing_type !== "fixed" }));
    if (c.urgent) rows.push({ k: "דחוף, +" + P.urgency.percent + "%", v: c.custom_quote_required ? "ייכלל במחיר המותאם" : P.formatPrice(c.urgent_fee), review: c.custom_quote_required });

    const totals = c.custom_quote_required
      ? `<div class="sum-total custom"><span>מחיר</span><strong>${esc(P.copy.customShort)}</strong></div>
         <div class="sum-quote">${esc(P.copy.customQuote)}${c.urgent ? " " + esc(P.urgency.customNote) : ""}</div>`
      : `<div class="sum-total"><span>${esc(P.copy.totalLabel)}<small>${esc(P.copy.setupLabel)}</small></span><strong>${P.formatPrice(c.setup_total)}</strong></div>
         <div class="sum-split"><div><small>${esc(P.copy.depositLabel)}</small><strong>${P.formatPrice(c.deposit)}</strong></div><div><small>${esc(P.copy.balanceLabel)}</small><strong>${P.formatPrice(c.balance)}</strong></div></div>`;

    const mp = c.maintenance;
    const maint = mp
      ? `<div class="sum-maint"><div><span>תחזוקה חודשית</span><small>${esc(mp.name)} · ${esc(P.copy.maintenanceSeparate)}</small></div><strong>${P.formatPrice(mp.price)} ${esc(mp.per)}</strong></div>`
      : "";

    return `<dl class="sum-rows">${rows.map((r) => `<div class="sum-row${r.review ? " review" : ""}${r.strong ? " strong" : ""}"><dt>${esc(r.k)}</dt><dd>${esc(r.v)}</dd></div>`).join("")}</dl>
      ${totals}
      ${maint}
      ${compact ? "" : `<p class="sum-fine">${esc(P.copy.fine)}</p>`}`;
  }

  function refreshSummary() {
    if (els.summary) els.summary.innerHTML = `<h2>הפרויקט שלכם</h2>${summaryHTML(state)}`;
    if (els.summaryMobile) {
      const c = calc(state);
      els.summaryMobile.innerHTML = !priced(state) ? "" :
        `<button type="button" class="sm-toggle" aria-expanded="false" aria-controls="smBody"><span>${c.custom_quote_required ? esc(P.copy.customShort) : esc(P.copy.totalLabel) + ": " + P.formatPrice(c.setup_total)}</span><i></i></button><div class="sm-body" id="smBody" hidden>${summaryHTML(state, true)}</div>`;
      const t = qs(".sm-toggle", els.summaryMobile);
      if (t) t.addEventListener("click", () => { const b = qs("#smBody"); b.hidden = !b.hidden; t.setAttribute("aria-expanded", String(!b.hidden)); });
    }
    const inline = qs("#summaryInline");
    if (inline) inline.innerHTML = `<div class="sum-card">${summaryHTML(state)}</div>`;
  }

  function refreshSideHelp(id) {
    if (!els.sideHelp) return;
    const h = sideHelpFor(id);
    els.sideHelp.hidden = !h;
    if (h) els.sideHelp.innerHTML = `<strong>${esc(h.title)}</strong>${h.html.startsWith("<") ? h.html : `<p>${h.html}</p>`}`;
  }

  /* -------- validation -------- */

  const validPhone = (v) => { const d = v.replace(/[^\d+]/g, ""); return /^(\+972|0)?5\d{8}$/.test(d) || /^(\+972|0)?[2-9]\d{7,8}$/.test(d); };
  const validEmail = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  function setErr(id, msg) {
    const err = qs("#" + id + "-err");
    const wrap = qs(`[data-field-wrap="${id}"]`);
    if (err) err.textContent = msg || "";
    if (wrap) wrap.classList.toggle("invalid", !!msg);
    const input = qs("#" + id);
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  const validate = {
    "type"() { if (!state.type || state.type === "unsure") return { ok: false, msg: state.type === "unsure" ? "בחרו אחת מהאפשרויות למטה, או דברו איתנו." : "בחרו מה תרצו לבנות." }; return { ok: true }; },
    "business"() {
      const b = state.business; let first = null;
      const check = (id, ok, msg) => { setErr(id, ok ? "" : msg); if (!ok && !first) first = id; };
      check("businessName", b.businessName.trim().length >= 2, "איך קוראים לעסק?");
      check("contactName", b.contactName.trim().length >= 2, "איך לפנות אליכם?");
      check("phone", validPhone(b.phone.trim()), "נראה שהמספר לא שלם.");
      check("email", validEmail(b.email.trim()), "כתובת האימייל לא נראית תקינה.");
      check("category", !!b.category, "בחרו תחום.");
      check("about", b.about.trim().length >= 6, "משפט אחד מספיק.");
      return first ? { ok: false, focus: first } : { ok: true };
    },
    "goal"() { const ok = state.goals.length > 0; setErr("goals", ok ? "" : "בחרו לפחות פעולה אחת."); return { ok }; },
    "landing-offer"() {
      let first = null;
      const check = (id, ok, msg) => { setErr(id, ok ? "" : msg); if (!ok && !first) first = id; };
      check("offer", state.landing.offer.trim().length >= 4, "כמה מילים על מה שמקדמים.");
      check("cta", !!state.landing.cta, "בחרו פעולה מרכזית.");
      return first ? { ok: false, focus: first } : { ok: true };
    },
    "site-scope"() {
      const pg = P.byId(P.pageOptions, state.site.pages);
      if (!pg) { setErr("pages", "בחרו הערכה. אפשר לשנות אחר כך."); return { ok: false }; }
      setErr("pages", "");
      const n = state.site.pageKinds.length;
      const max = P.services.site.includedPages;
      if (pg.included && n > max) {
        setErr("pageKinds", `סימנתם ${n} עמודים, ועד ${max} כלולים במחיר הבסיס. הסירו עמודים, או בחרו למעלה "7 עד 10 עמודים" ונכין מחיר לאחר אפיון.`);
        return { ok: false };
      }
      setErr("pageKinds", "");
      if (state.site.pageKinds.includes("other") && state.site.pageOther.trim().length < 2) { setErr("pageOther", "כמה מילים על העמוד הנוסף."); return { ok: false, focus: "pageOther" }; }
      setErr("pageOther", "");
      return { ok: true };
    },
    "site-features"() { return { ok: true }; },
    "extras"() { return { ok: true }; },
    "materials"() {
      let first = null;
      ["logo", "texts", "images"].forEach((id) => { const ok = !!state.materials[id]; setErr(id, ok ? "" : "בחרו אפשרות."); if (!ok && !first) first = id; });
      const needContent = state.materials.texts === "partial" || state.materials.texts === "no";
      if (needContent) { const ok = !!state.content.service; setErr("contentService", ok ? "" : "בחרו איך נטפל בתוכן. גם 'נביא בעצמנו' זו בחירה."); if (!ok && !first) first = "contentService"; }
      else setErr("contentService", "");
      return first ? { ok: false } : { ok: true };
    },
    "domain"() { const ok = !!state.domain; setErr("domain", ok ? "" : "בחרו אפשרות."); return { ok }; },
    "hosting"() { const ok = state.hosting.acknowledged; setErr("hostingAck", ok ? "" : "סמנו שקראתם, כדי שנדע שההסבר עבר."); return { ok }; },
    "maintenance"() { const ok = !!state.maintenance; setErr("maintenance", ok ? "" : "בחרו מסלול, גם 'ללא תחזוקה' זו בחירה."); return { ok }; },
    "summary"() { return { ok: true }; }
  };

  /* -------- rendering a step -------- */

  function setPath(path, value) {
    const parts = path.split("."); let o = state;
    for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = value;
  }

  function currentSteps() { return stepList(state); }
  function currentId() { const s = currentSteps(); state.stepIndex = Math.min(state.stepIndex, s.length - 1); return s[state.stepIndex]; }

  function renderStep(focusHeading = true) {
    const steps = currentSteps();
    const id = currentId();
    const idx = state.stepIndex;
    els.stage.innerHTML = `<section class="step" data-step="${id}" aria-labelledby="stepTitle">
      <h1 class="step-title" id="stepTitle" tabindex="-1">${esc(STEP_TITLES[id])}</h1>
      ${render[id]()}
    </section>`;
    els.progressText.textContent = `שלב ${idx + 1} מתוך ${steps.length}`;
    els.progressBar.style.setProperty("--p", ((idx + 1) / steps.length * 100).toFixed(1) + "%");
    els.back.hidden = idx === 0;
    els.next.textContent = id === "summary" ? "שליחת הבקשה ל-DS" : "המשך";
    els.next.classList.toggle("btn-submit", id === "summary");
    els.footerNote.textContent = id === "summary" ? P.copy.notBinding : "";
    bindStep(id);
    refreshSummary();
    refreshSideHelp(id);
    if (state.tracking.lastStep !== id) {           // a refresh of the same step is not a new view
      state.tracking.lastStep = id;
      track("builder_step_view", { step_number: idx + 1, step_name: id });
      if (id === "summary") track("builder_summary_view", funnelParams(state));
    }
    save();
    if (focusHeading) { const h = qs("#stepTitle"); if (h) h.focus({ preventScroll: false }); window.scrollTo({ top: 0, behavior: "auto" }); }
  }

  function updateKindCount() {
    const el = qs("#kindCount");
    if (!el) return;
    const n = state.site.pageKinds.length, max = P.services.site.includedPages;
    el.textContent = n === 0 ? "" : n <= max ? `נבחרו ${n} מתוך ${max} עמודי התוכן הכלולים במחיר הבסיס.` : `נבחרו ${n} עמודים. מעל ${max} עמודי תוכן המחיר נקבע לאחר אפיון.`;
  }

  function bindStep(id) {
    /* text inputs & textareas */
    qsa("[data-path]", els.stage).forEach((inp) => {
      inp.addEventListener("input", () => { setPath(inp.dataset.path, inp.value); save(); refreshSummary(); });
    });
    /* choice cards */
    qsa(".card-choice input", els.stage).forEach((inp) => {
      inp.addEventListener("change", () => {
        const name = inp.name;
        const group = qsa(`.card-choice input[name="${name}"]`, els.stage);
        group.forEach((g) => g.closest(".card-choice").classList.toggle("on", g.checked));
        const values = group.filter((g) => g.checked).map((g) => g.value);
        applyChoice(name, inp.type === "checkbox" ? values : values[0] || "", inp);
        save(); refreshSummary();
        if (id === "site-scope" || id === "site-features") refreshSideHelp(id);
      });
    });
    /* add-on quantity controls and notes */
    qsa(".addon-item .qty-btn", els.stage).forEach((b) => b.addEventListener("click", () => {
      const id2 = b.closest(".addon-item").dataset.addon; const c = item(id2);
      const inp = qs("#qty-" + id2);
      const v = Math.max(1, Math.min(c.maxQty, (Number(inp.value) || 1) + Number(b.dataset.qty)));
      inp.value = v; state.addons[id2] = v; save(); refreshSummary();
    }));
    qsa(".addon-item input[type=number]", els.stage).forEach((inp) => inp.addEventListener("input", () => {
      const id2 = inp.closest(".addon-item").dataset.addon; const c = item(id2);
      const v = Math.max(1, Math.min(c.maxQty, Number(inp.value) || 1));
      state.addons[id2] = v; if (inp.value !== "" && Number(inp.value) !== v) inp.value = v; save(); refreshSummary();
    }));
    qsa(".addon-item input[type=number]", els.stage).forEach((inp) => inp.addEventListener("change", () => { const id2 = inp.closest(".addon-item").dataset.addon; inp.value = state.addons[id2] || 1; }));
    qsa("[data-note]", els.stage).forEach((inp) => inp.addEventListener("input", () => { state.addonNotes[inp.dataset.note] = inp.value; save(); }));

    if (id === "type") {
      qsa("[data-pick]", els.stage).forEach((b) => b.addEventListener("click", () => {
        state.type = b.dataset.pick; track("service_selected", { service_type: serviceType(state) }); save(); renderStep(false);
        qs(`.card-choice input[value="${state.type}"]`)?.focus();
      }));
    }
    if (id === "site-scope") updateKindCount();
    if (id === "materials") {
      const cp = qs("#contentPages");
      if (cp) cp.addEventListener("input", () => { state.content.pages = Math.max(1, Math.min(30, Number(cp.value) || 1)); save(); refreshSummary(); });
    }
    if (id === "hosting") {
      qs("#hostingAck").addEventListener("change", (e) => { state.hosting.acknowledged = e.target.checked; setErr("hostingAck", ""); save(); });
    }
  }

  function applyChoice(name, value, inp) {
    switch (name) {
      case "type":
        state.type = value;
        qs("#unsureBox").hidden = value !== "unsure";
        if (value !== "unsure") { state.stepIndex = 0; track("service_selected", { service_type: serviceType(state) }); }
        setErr("type", "");
        break;
      case "category":
        state.business.category = value;
        qs("#categoryOtherWrap").hidden = value !== "אחר";
        setErr("category", "");
        break;
      case "goals":
        state.goals = value;
        qs("#goalOtherWrap").hidden = !value.includes("other");
        setErr("goals", "");
        break;
      case "cta": state.landing.cta = value; setErr("cta", ""); break;
      case "pages": {
        state.site.pages = value;
        const pg = P.byId(P.pageOptions, value);
        qs("#overSixMsg").hidden = !(pg && pg.custom);
        qs("#unknownMsg").hidden = !(pg && pg.unknown);
        setErr("pages", ""); setErr("pageKinds", "");
        updateKindCount();
        break;
      }
      case "pageKinds": {
        state.site.pageKinds = value;
        qs("#pageOtherWrap").hidden = !value.includes("other");
        setErr("pageKinds", "");
        updateKindCount();
        break;
      }
      case "features": state.site.features = value; break;
      case "addon": {
        const id = inp.value; const c = item(id);
        if (inp.checked) { const q = qs("#qty-" + id); state.addons[id] = c && c.maxQty ? Math.max(1, Number(q && q.value) || 1) : 1; }
        else delete state.addons[id];
        const wrap = inp.closest(".addon-item");
        const q = qs(".qty", wrap); if (q) q.hidden = !inp.checked;
        const n = qs(".addon-note", wrap); if (n) n.hidden = !inp.checked;
        break;
      }
      case "urgent": state.urgent = value === "urgent"; break;
      case "contentService": {
        state.content.service = value; setErr("contentService", "");
        const w = qs("#contentPagesWrap"); if (w) w.hidden = !(value === "edit" || value === "write");
        if (!(Number(state.content.pages) > 0)) { state.content.pages = totalPagesEstimate(state); const cp = qs("#contentPages"); if (cp) cp.value = state.content.pages; }
        break;
      }
      case "logo": case "images":
        state.materials[name] = value; setErr(name, ""); break;
      case "texts": {
        state.materials.texts = value; setErr("texts", "");
        const need = value === "partial" || value === "no";
        qs("#contentHelp").hidden = !need;
        if (!need) { state.content.service = ""; setErr("contentService", ""); }
        break;
      }
      case "domain":
        state.domain = value;
        qs("#domainHelp").hidden = !(value === "no" || value === "unsure");
        setErr("domain", "");
        break;
      case "maintenance":
        state.maintenance = value; setErr("maintenance", ""); break;
    }
  }

  /* -------- navigation -------- */

  function next() {
    const id = currentId();
    const v = validate[id]();
    if (!v.ok) {
      if (v.msg) setErr(id === "type" ? "type" : id, v.msg);
      const target = v.focus ? qs("#" + v.focus) : qs(".card-choice input, input, textarea", els.stage);
      if (target) target.focus();
      return;
    }
    if (id === "summary") { submit(); return; }
    state.stepIndex = Math.min(state.stepIndex + 1, currentSteps().length - 1);
    renderStep();
  }
  function back() {
    if (state.stepIndex === 0) return;
    state.stepIndex -= 1;
    renderStep();
  }
  function restart() {
    if (!confirm("להתחיל מחדש? כל מה שמילאתם בטופס יימחק.")) return;
    track("builder_reset", { service_type: serviceType(state) });
    clearSaved();
    state = defaultState();
    if (presetType) state.type = presetType;
    renderStep();
  }

  /* ======================= 5. SUBMISSION ======================= */

  function payload(st) {
    const c = calc(st);
    const b = st.business;
    const labelOf = (list, id) => (P.byId(list, id) || {}).label || id;
    const breakdown = st.type === "site"
      ? st.site.pageKinds.map((k) => k === "other" ? "עמוד אחר: " + st.site.pageOther.trim() : labelOf(P.pageKinds, k)).join(", ")
      : "";
    const addonList = c.lines.map((l) => l.label + (l.pricing_type === "fixed" ? ` (${P.formatPrice(l.total)})` : " (מחיר מותאם)") + (st.addonNotes[l.id] ? ` [${st.addonNotes[l.id].trim()}]` : "")).join("; ");
    const contentLabel = st.content.service === "edit" || st.content.service === "write"
      ? (item(st.content.service === "edit" ? "content-edit" : "content-write").label + (st.type === "site" ? ` × ${st.content.pages} עמודים` : ""))
      : (st.content.service === "none" ? "הלקוח מביא טקסטים" : "");
    return {
      project_type: st.type === "site" ? "אתר תדמית" : "דף נחיתה",
      contact_name: b.contactName.trim(),
      business_name: b.businessName.trim(),
      phone: b.phone.trim(),
      email: b.email.trim(),
      business_category: b.category === "אחר" ? "אחר: " + b.categoryOther.trim() : b.category,
      business_about: b.about.trim(),
      primary_goal: st.goals.map((g) => g === "other" ? "אחר: " + st.goalOther.trim() : labelOf(GOALS, g)).join(", "),
      landing_offer: st.type === "landing" ? st.landing.offer.trim() : "",
      target_audience: st.type === "landing" ? st.landing.audience.trim() : "",
      primary_cta: st.type === "landing" ? st.landing.cta : "",
      estimated_pages: st.type === "site" ? labelOf(P.pageOptions, st.site.pages) : "1 (דף נחיתה)",
      exact_page_count: st.type === "site" ? (c.page_count ?? "") : 1,
      page_breakdown: breakdown,
      requested_features: st.type === "site" ? st.site.features.map((f) => labelOf(P.includedFeatures, f)).join(", ") : "",
      selected_addons: addonList,
      content_service: contentLabel,
      has_logo: st.materials.logo, has_texts: st.materials.texts, has_images: st.materials.images,
      design_preferences: [st.materials.style.trim(), st.materials.references.trim()].filter(Boolean).join(" | "),
      domain_status: st.domain,
      hosting_acknowledged: st.hosting.acknowledged ? "yes" : "no",
      maintenance_plan: st.maintenance,
      monthly_maintenance: c.monthly_maintenance,
      cookie_consent_option: st.addons["cookie-banner"] ? "yes" : "no",
      base_price: c.base_price ?? "",
      addons_total: c.addons_total,
      urgent: c.urgent ? "true" : "false",
      urgent_fee: c.custom_quote_required ? "" : c.urgent_fee,
      setup_total: c.custom_quote_required ? "" : c.setup_total,
      custom_quote_required: c.custom_quote_required ? "true" : "false",
      custom_quote_reasons: c.custom_reasons.join(", "),
      notes: st.notes.trim(),
      utm_source: utmValue("utm_source"),
      utm_medium: utmValue("utm_medium"),
      utm_campaign: utmValue("utm_campaign"),
      utm_content: utmValue("utm_content"),
      utm_term: utmValue("utm_term"),
      timestamp: new Date().toISOString(),
      started_at: st.startedAt
    };
  }

  async function submit() {
    const form = qs("#projectRequestForm");
    const status = qs("#submitStatus");
    const data = payload(state);
    Object.entries(data).forEach(([k, v]) => { const inp = form.elements[k]; if (inp) inp.value = v; });
    els.next.disabled = true;
    const label = els.next.textContent;
    els.next.textContent = "שולחים…";
    if (status) status.className = "form-status";
    try {
      const body = new URLSearchParams(new FormData(form)).toString();
      const res = await fetch(form.getAttribute("action") || "/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
      if (!res.ok) throw new Error("status " + res.status);
      track("project_request_submitted", funnelParams(state));   // only after the server accepted
      clearSaved();
      showSuccess(data);
    } catch (err) {
      console.error("project-builder submit failed", err);
      if (status) {
        status.className = "form-status fail";
        const text = encodeURIComponent(`היי, מילאתי את בונה הפרויקט באתר ולא הצלחתי לשלוח. ${data.project_type}, ${data.business_name}, ${data.phone}`);
        status.innerHTML = `משהו השתבש בשליחה. הפרטים שלכם נשמרו בדפדפן, אפשר לנסות שוב או <a href="${WA}?text=${text}" target="_blank" rel="noopener">לשלוח לנו בוואטסאפ</a>.`;
      }
    } finally {
      els.next.disabled = false;
      els.next.textContent = label;
    }
  }

  function showSuccess(data) {
    qs(".builder-main").innerHTML = `<section class="step done" aria-labelledby="doneTitle">
      <div class="done-mark" aria-hidden="true"></div>
      <h1 id="doneTitle" tabindex="-1">הבקשה התקבלה</h1>
      <p class="step-lead">נעבור על הפרטים וניצור איתכם קשר או נשלח סיכום מסודר להמשך.</p>
      <div class="sum-card">${summaryHTML(Object.assign({}, state), false)}</div>
      <p class="done-fine">${esc(data.project_type)} עבור ${esc(data.business_name)}. ${data.custom_quote_required === "true" ? "הבקשה כוללת פריט שדורש מחיר מותאם, ולכן המחיר המלא יגיע בסיכום." : "המחיר הסופי נסגר בסיכום הזמנה שתאשרו לפני תחילת העבודה."}</p>
      <div class="done-actions"><a class="btn btn-primary" href="/">חזרה לאתר</a><a class="btn btn-ghost" href="${WA}" target="_blank" rel="noopener">לכתוב לנו בוואטסאפ</a></div>
    </section>`;
    if (els.sideHelp) els.sideHelp.hidden = true;
    qs("#doneTitle").focus();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  /* ======================= DEMO PRESETS (previews only) ======================= */

  function applyDemo(kind) {
    const d = defaultState();
    d.business = { businessName: "קפה הרצל", contactName: "מאיה לוי", phone: "0500000000", email: "", category: "מסעדה, קפה ואוכל", categoryOther: "", about: "בית קפה שכונתי בחיפה עם מאפים של הבוקר" };
    d.goals = ["whatsapp", "visit"];
    d.materials = { logo: "yes", texts: "partial", images: "yes", style: "חם ונעים", references: "" };
    d.content = { service: "none", pages: 1 };
    d.domain = "no"; d.hosting.acknowledged = true; d.maintenance = "basic";
    if (kind === "site-custom") {
      d.type = "site"; d.site = { pages: "7to10", pageKinds: ["home", "about", "services", "projects", "faq", "contact", "other"], pageOther: "עמוד מאמרים", features: ["contact-form", "map"] };
      d.addons = { "extra-lang-site": 1 };
    } else if (kind === "site-priced") {
      d.type = "site"; d.site = { pages: "upto6", pageKinds: ["home", "about", "services", "projects", "faq", "contact"], pageOther: "", features: ["contact-form", "whatsapp", "map", "social"] };
      d.addons = { blog: 1, ga: 1, "meta-pixel": 1 }; d.maintenance = "extended";
      d.content = { service: "edit", pages: 6 };
    } else {
      d.type = "landing"; d.landing = { offer: "ארוחת בוקר זוגית בסופי שבוע", audience: "זוגות מהאזור", cta: "whatsapp" };
      d.addons = { "gallery-landing": 1, ga: 1 };
    }
    const steps = stepList(d);
    const step = params.get("step");
    d.stepIndex = step && steps.includes(step) ? steps.indexOf(step) : steps.length - 1;
    state = d;
  }

  /* ======================= BOOT ======================= */

  els.next.addEventListener("click", next);
  els.back.addEventListener("click", back);
  els.restart.addEventListener("click", restart);
  els.stage.addEventListener("change", markStarted);
  els.stage.addEventListener("input", markStarted);
  track("builder_view");
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches("input:not([type=checkbox]):not([type=radio]):not([type=number])")) { e.preventDefault(); next(); }
  });
  renderStep(false);
})();
