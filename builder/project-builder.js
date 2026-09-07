/* ============================================================
   DS Creative Studio — Project Builder (wizard)

   Layers, kept apart on purpose so each can change alone:
     1. state       - what the client filled in (persisted locally)
     2. rules       - pricing + custom-quote decisions (uses pricing-config.js)
     3. steps       - which screens exist for the chosen route
     4. ui          - rendering, validation, focus, progress
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
      type: null,                 // 'landing' | 'site'
      business: { businessName: "", contactName: "", phone: "", email: "", category: "", categoryOther: "", about: "" },
      goals: [], goalOther: "",
      landing: { offer: "", audience: "", cta: "" },
      site: { pages: "", features: [], featuresOther: "" },
      materials: { logo: "", texts: "", images: "", style: "", references: "" },
      domain: "",
      hosting: { acknowledged: false },
      maintenance: "",
      notes: "",
      stepIndex: 0,
      startedAt: new Date().toISOString()
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return Object.assign(defaultState(), s, {
        business: Object.assign(defaultState().business, s.business || {}),
        landing: Object.assign(defaultState().landing, s.landing || {}),
        site: Object.assign(defaultState().site, s.site || {}),
        materials: Object.assign(defaultState().materials, s.materials || {}),
        hosting: Object.assign(defaultState().hosting, s.hosting || {})
      });
    } catch { return null; }
  }
  function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }
  function clearSaved() { try { localStorage.removeItem(STORAGE_KEY); } catch {} }

  let state = load() || defaultState();

  /* Entry from a specific package card: ?type=landing | ?type=site */
  const params = new URLSearchParams(location.search);
  const presetType = params.get("type");
  if (presetType === "landing" || presetType === "site") {
    if (state.type !== presetType) { state = defaultState(); state.type = presetType; }
  }

  /* Demo presets (screenshots / previews only). ?demo=landing | ?demo=site-custom, optional &step=<id> */
  if (params.get("demo")) applyDemo(params.get("demo"));

  /* ======================= 2. RULES ======================= */

  function calc(st) {
    const out = { base: null, baseLabel: "", addonsPrice: 0, total: null, customQuote: false, reasons: [], reviewItems: [], deposit: null, balance: null };
    if (!st.type || !P.services[st.type]) return out;
    const svc = P.services[st.type];
    out.base = svc.basePrice;
    out.baseLabel = svc.priceMode === "from" ? "החל מ־" + P.formatPrice(svc.basePrice) : P.formatPrice(svc.basePrice);

    if (st.type === "site") {
      const pg = P.pageOptions.find((o) => o.id === st.site.pages);
      if (pg && !pg.withinBase) { out.customQuote = true; out.reasons.push(pg.id === "unknown" ? "מספר העמודים עדיין לא ידוע" : "יותר משלושה עמודים"); }
      st.site.features.forEach((fid) => {
        const f = P.siteFeatures.find((x) => x.id === fid);
        if (!f) return;
        if (f.review) {
          const addon = P.addons.find((a) => a.id === fid) || { id: fid, name: f.label, price: null, fixed: false, review: true };
          out.reviewItems.push(addon);
          if (addon.fixed && typeof addon.price === "number") out.addonsPrice += addon.price;
          else { out.customQuote = true; if (!out.reasons.includes(f.label)) out.reasons.push(f.label); }
        }
      });
    }
    if (!out.customQuote) {
      out.total = out.base + out.addonsPrice;
      out.deposit = Math.round(out.total / 2);
      out.balance = out.total - out.deposit;
    }
    return out;
  }

  /* ======================= 3. STEPS ======================= */

  function stepList(st) {
    const common = ["business", "goal"];
    const route = st.type === "site" ? ["site-scope", "site-features"] : ["landing-offer"];
    const tail = ["materials", "domain", "hosting", "maintenance", "summary"];
    const first = presetType ? [] : ["type"];
    return [...first, ...common, ...route, ...tail];
  }

  const STEP_TITLES = {
    "type": "מה תרצו לבנות?",
    "business": "על העסק",
    "goal": "מה הדבר העיקרי שאתם רוצים שהמבקר יעשה?",
    "landing-offer": "על דף הנחיתה",
    "site-scope": "היקף האתר",
    "site-features": "אילו דברים תרצו באתר?",
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
    restart: qs("#btnRestart"),
    footerNote: qs("#footerNote")
  };

  function cards({ name, options, selected, multi = false, note = null }) {
    return `<div class="cards" role="${multi ? "group" : "radiogroup"}">` + options.map((o) => {
      const checked = multi ? selected.includes(o.id) : selected === o.id;
      return `<label class="card-choice${checked ? " on" : ""}">
        <input type="${multi ? "checkbox" : "radio"}" name="${name}" value="${esc(o.id)}" ${checked ? "checked" : ""}>
        <span class="cc-body">
          <span class="cc-title">${esc(o.label)}</span>
          ${o.hint ? `<span class="cc-hint">${esc(o.hint)}</span>` : ""}
          ${o.badge ? `<span class="cc-badge ${o.badgeKind || ""}">${esc(o.badge)}</span>` : ""}
        </span>
        <span class="cc-check" aria-hidden="true"></span>
      </label>`;
    }).join("") + `</div>${note ? `<p class="step-note">${note}</p>` : ""}`;
  }

  function field(id, label, input, hint) {
    return `<div class="bf-field" data-field-wrap="${id}">
      <label for="${id}">${label}</label>
      ${input}
      ${hint ? `<p class="bf-hint">${hint}</p>` : ""}
      <p class="bf-err" id="${id}-err"></p>
    </div>`;
  }
  const req = '<span class="req" aria-hidden="true">*</span>';

  const CATEGORIES = ["מסעדה, קפה ואוכל", "יופי וטיפוח", "בריאות ורפואה", "ייעוץ ושירותים מקצועיים", "נדל\"ן", "חינוך והדרכה", "ספורט ופנאי", "חנות וקמעונאות", "בנייה, שיפוצים ובעלי מקצוע", "אחר"];

  const render = {
    "type"() {
      const svc = P.services;
      return `<p class="step-lead">שני שירותים, אותה רמת איכות. ההבדל הוא היקף העבודה.</p>
      ${cards({ name: "type", selected: state.type, options: [
        { id: "landing", label: svc.landing.name, hint: svc.landing.short, badge: P.formatPrice(svc.landing.basePrice) },
        { id: "site", label: svc.site.name, hint: svc.site.short, badge: "החל מ־" + P.formatPrice(svc.site.basePrice) },
        { id: "unsure", label: "אני עדיין לא בטוח", hint: "נעזור לכם להחליט" }
      ] })}
      <p class="bf-err" id="type-err"></p>
      <div class="unsure-box" id="unsureBox" ${state.type === "unsure" ? "" : "hidden"}>
        <h3>ההבדל, בשתי שורות</h3>
        <p><strong>דף נחיתה</strong> הוא עמוד אחד ממוקד למטרה אחת: להסביר מה אתם מציעים ולהוביל לפעולה, למשל וואטסאפ או השארת פרטים. מתאים לשירות אחד, לקמפיין, או לעסק שרוצה להתחיל בקטן.</p>
        <p><strong>אתר תדמית</strong> הוא כמה עמודים עם תפריט: בית, אודות, שירותים, צור קשר וכדומה. מתאים לעסק שרוצה להציג את עצמו בצורה רחבה יותר ולהופיע בגוגל בכמה נושאים.</p>
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
        ${field("businessName", "שם העסק " + req, `<input id="businessName" data-path="business.businessName" type="text" value="${esc(b.businessName)}" autocomplete="organization">`)}
        ${field("contactName", "שם איש הקשר " + req, `<input id="contactName" data-path="business.contactName" type="text" value="${esc(b.contactName)}" autocomplete="name">`)}
        ${field("phone", "טלפון " + req, `<input id="phone" data-path="business.phone" type="tel" inputmode="tel" dir="ltr" value="${esc(b.phone)}" autocomplete="tel" placeholder="050 000 0000">`)}
        ${field("email", "אימייל", `<input id="email" data-path="business.email" type="email" inputmode="email" dir="ltr" value="${esc(b.email)}" autocomplete="email">`, "לא חובה. נוח לשליחת הסיכום.")}
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
      const opts = [
        { id: "whatsapp", label: "לשלוח וואטסאפ" },
        { id: "call", label: "להתקשר" },
        { id: "lead", label: "להשאיר פרטים" },
        { id: "read", label: "לקרוא על העסק והשירותים" },
        { id: "visit", label: "להגיע לעסק" },
        { id: "other", label: "משהו אחר" }
      ];
      return `<p class="step-lead">אפשר לבחור יותר מאחד. זה עוזר לנו להחליט מה מקבל את המקום הבולט ביותר.</p>
      ${cards({ name: "goals", selected: state.goals, multi: true, options: opts })}
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
        <div class="ib-head"><strong>${esc(svc.name)}</strong><span>${P.formatPrice(svc.basePrice)} · תשלום חד-פעמי</span></div>
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
      const pg = P.pageOptions.find((o) => o.id === s.pages);
      return `<div class="included-box">
        <div class="ib-head"><strong>${esc(svc.name)}</strong><span>החל מ־${P.formatPrice(svc.basePrice)} · תשלום חד-פעמי</span></div>
        <p class="ib-note">${esc(svc.includedNote)}</p>
        <details class="ib-details"><summary>מה כלול במחיר הכניסה</summary><ul>${svc.includes.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></details>
      </div>
      <div class="bf-field">
        <span class="bf-label">כמה עמודים אתם מעריכים שתצטרכו? ${req}</span>
        ${cards({ name: "pages", selected: s.pages, options: P.pageOptions.map((o) => ({ id: o.id, label: o.label, hint: o.hint })) })}
        <p class="bf-err" id="pages-err"></p>
      </div>
      <div class="scope-msg" id="scopeMsg" ${pg && !pg.withinBase ? "" : "hidden"}>${esc(P.copy.biggerScope)}</div>`;
    },

    "site-features"() {
      const s = state.site;
      return `<p class="step-lead">בחירה כאן לא אומרת שהפריט כלול במחיר הכניסה. מה שלא כלול מסומן, ונתמחר אותו לפני כל התחייבות.</p>
      ${cards({ name: "features", selected: s.features, multi: true, options: P.siteFeatures.map((f) => ({
        id: f.id, label: f.label, hint: f.hint,
        badge: f.included ? "כלול" : "לתמחור",
        badgeKind: f.included ? "ok" : "review"
      })) })}
      <div class="bf-field" id="featuresOtherWrap" ${s.features.includes("other") ? "" : "hidden"}>
        <label for="featuresOther">מה למשל?</label>
        <input id="featuresOther" data-path="site.featuresOther" type="text" value="${esc(s.featuresOther)}">
      </div>`;
    },

    "materials"() {
      const m = state.materials;
      const yn = (id, label, opts) => `<div class="bf-field"><span class="bf-label">${label} ${req}</span>${cards({ name: id, selected: m[id], options: opts })}<p class="bf-err" id="${id}-err"></p></div>`;
      return `<p class="step-lead">אין לכם משהו מהרשימה? זה בסדר גמור. נעזור.</p>
      ${yn("logo", "לוגו", [{ id: "yes", label: "יש לוגו" }, { id: "no", label: "אין לוגו" }])}
      ${yn("texts", "טקסטים", [{ id: "yes", label: "יש טקסטים מוכנים" }, { id: "partial", label: "יש חלק" }, { id: "no", label: "אין, נצטרך עזרה" }])}
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
      return `<p class="step-lead">אפשרות בלבד. שום מסלול לא מסומן מראש, ואפשר להחליט גם אחר כך.</p>
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

  /* -------- summary block (used in side panel, mobile bar, and final step) -------- */

  function summaryHTML(st, compact = false) {
    if (!st.type || !P.services[st.type]) {
      return `<p class="sum-empty">${st.type === "unsure" ? "עוד לא בטוחים? זה בסדר. בחרו שירות כשתרצו, או דברו איתנו." : "בחרו שירות כדי לראות סיכום."}</p>`;
    }
    const c = calc(st);
    const svc = P.services[st.type];
    const rows = [];
    rows.push({ k: svc.name, v: c.baseLabel });
    if (st.type === "site" && st.site.pages) {
      const pg = P.pageOptions.find((o) => o.id === st.site.pages);
      rows.push({ k: "מספר עמודים", v: pg ? pg.label : "" });
    }
    c.reviewItems.forEach((a) => rows.push({ k: a.name, v: a.fixed && typeof a.price === "number" ? P.formatPrice(a.price) : P.copy.reviewPrice, review: !(a.fixed && typeof a.price === "number") }));
    const mp = P.maintenance.find((m) => m.id === st.maintenance);
    const totals = c.customQuote
      ? `<div class="sum-quote">${esc(P.copy.customQuote)}</div>`
      : `<div class="sum-total"><span>סה"כ לפי הבחירות שלכם</span><strong>${P.formatPrice(c.total)}</strong></div>
         <div class="sum-split"><div><small>50% מקדמה</small><strong>${P.formatPrice(c.deposit)}</strong></div><div><small>יתרה לפני מסירה</small><strong>${P.formatPrice(c.balance)}</strong></div></div>`;
    return `<dl class="sum-rows">${rows.map((r) => `<div class="sum-row${r.review ? " review" : ""}"><dt>${esc(r.k)}</dt><dd>${esc(r.v)}</dd></div>`).join("")}</dl>
      ${totals}
      ${mp ? `<div class="sum-maint"><span>${esc(mp.name)}</span><strong>${P.formatPrice(mp.price)} ${esc(mp.per)}</strong></div>` : ""}
      ${compact ? "" : `<p class="sum-fine">תשלום חד-פעמי לבנייה. תחזוקה, אם נבחרה, נפרדת וחודשית. המחיר הסופי נסגר בסיכום הזמנה שאתם מאשרים לפני תחילת העבודה.</p>`}`;
  }

  function refreshSummary() {
    if (els.summary) els.summary.innerHTML = `<h2>הפרויקט שלכם</h2>${summaryHTML(state)}`;
    if (els.summaryMobile) {
      const c = calc(state);
      els.summaryMobile.innerHTML = (!state.type || !P.services[state.type]) ? "" :
        `<button type="button" class="sm-toggle" aria-expanded="false" aria-controls="smBody"><span>${c.customQuote ? "כולל רכיב לתמחור אישי" : "סה\"כ לפי הבחירות: " + P.formatPrice(c.total)}</span><i></i></button><div class="sm-body" id="smBody" hidden>${summaryHTML(state, true)}</div>`;
      const t = qs(".sm-toggle", els.summaryMobile);
      if (t) t.addEventListener("click", () => { const b = qs("#smBody"); b.hidden = !b.hidden; t.setAttribute("aria-expanded", String(!b.hidden)); });
    }
    const inline = qs("#summaryInline");
    if (inline) inline.innerHTML = `<div class="sum-card">${summaryHTML(state)}</div>`;
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
    "site-scope"() { const ok = !!state.site.pages; setErr("pages", ok ? "" : "בחרו הערכה. אפשר לשנות אחר כך."); return { ok }; },
    "site-features"() { return { ok: true }; },
    "materials"() {
      let first = null;
      ["logo", "texts", "images"].forEach((id) => { const ok = !!state.materials[id]; setErr(id, ok ? "" : "בחרו אפשרות."); if (!ok && !first) first = id; });
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
    save();
    if (focusHeading) { const h = qs("#stepTitle"); if (h) h.focus({ preventScroll: false }); window.scrollTo({ top: 0, behavior: "auto" }); }
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
        applyChoice(name, inp.type === "checkbox" ? values : values[0] || "");
        save(); refreshSummary();
      });
    });
    if (id === "type") {
      qsa("[data-pick]", els.stage).forEach((b) => b.addEventListener("click", () => {
        state.type = b.dataset.pick; save(); renderStep(false);
        qs(`.card-choice input[value="${state.type}"]`)?.focus();
      }));
    }
    if (id === "hosting") {
      qs("#hostingAck").addEventListener("change", (e) => { state.hosting.acknowledged = e.target.checked; setErr("hostingAck", ""); save(); });
    }
  }

  function applyChoice(name, value) {
    switch (name) {
      case "type":
        state.type = value;
        qs("#unsureBox").hidden = value !== "unsure";
        if (value !== "unsure") state.stepIndex = 0;
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
        const pg = P.pageOptions.find((o) => o.id === value);
        qs("#scopeMsg").hidden = !(pg && !pg.withinBase);
        setErr("pages", "");
        break;
      }
      case "features":
        state.site.features = value;
        qs("#featuresOtherWrap").hidden = !value.includes("other");
        break;
      case "logo": case "texts": case "images":
        state.materials[name] = value; setErr(name, ""); break;
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
    clearSaved();
    state = defaultState();
    if (presetType) state.type = presetType;
    renderStep();
  }

  /* ======================= 5. SUBMISSION ======================= */

  function payload(st) {
    const c = calc(st);
    const b = st.business;
    const labelOf = (list, id) => (list.find((x) => x.id === id) || {}).label || id;
    const goalLabels = { whatsapp: "לשלוח וואטסאפ", call: "להתקשר", lead: "להשאיר פרטים", read: "לקרוא על העסק והשירותים", visit: "להגיע לעסק", other: "משהו אחר" };
    return {
      project_type: st.type === "site" ? "אתר תדמית" : "דף נחיתה",
      contact_name: b.contactName.trim(),
      business_name: b.businessName.trim(),
      phone: b.phone.trim(),
      email: b.email.trim(),
      business_category: b.category === "אחר" ? "אחר: " + b.categoryOther.trim() : b.category,
      business_about: b.about.trim(),
      primary_goal: st.goals.map((g) => g === "other" ? "אחר: " + st.goalOther.trim() : goalLabels[g]).join(", "),
      landing_offer: st.type === "landing" ? st.landing.offer.trim() : "",
      target_audience: st.type === "landing" ? st.landing.audience.trim() : "",
      primary_cta: st.type === "landing" ? st.landing.cta : "",
      estimated_pages: st.type === "site" ? labelOf(P.pageOptions, st.site.pages) : "1 (דף נחיתה)",
      requested_features: st.type === "site" ? st.site.features.map((f) => f === "other" ? "אחר: " + st.site.featuresOther.trim() : labelOf(P.siteFeatures, f)).join(", ") : "",
      has_logo: st.materials.logo, has_texts: st.materials.texts, has_images: st.materials.images,
      design_preferences: [st.materials.style.trim(), st.materials.references.trim()].filter(Boolean).join(" | "),
      domain_status: st.domain,
      hosting_acknowledged: st.hosting.acknowledged ? "yes" : "no",
      maintenance_plan: st.maintenance,
      selected_addons: c.reviewItems.map((a) => a.name).join(", "),
      calculated_base_price: c.base ?? "",
      calculated_addons_price: c.addonsPrice,
      calculated_total: c.customQuote ? "" : c.total,
      custom_quote_required: c.customQuote ? "true" : "false",
      custom_quote_reasons: c.reasons.join(", "),
      notes: st.notes.trim(),
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
      <p class="done-fine">${esc(data.project_type)} עבור ${esc(data.business_name)}. ${data.custom_quote_required === "true" ? "הבקשה כוללת רכיב לתמחור אישי, ולכן המחיר המלא יגיע בסיכום." : "המחיר הסופי נסגר בסיכום הזמנה שתאשרו לפני תחילת העבודה."}</p>
      <div class="done-actions"><a class="btn btn-primary" href="/">חזרה לאתר</a><a class="btn btn-ghost" href="${WA}" target="_blank" rel="noopener">לכתוב לנו בוואטסאפ</a></div>
    </section>`;
    qs("#doneTitle").focus();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  /* ======================= DEMO PRESETS (previews only) ======================= */

  function applyDemo(kind) {
    const d = defaultState();
    d.business = { businessName: "קפה הרצל", contactName: "מאיה לוי", phone: "050-000-0000", email: "", category: "מסעדה, קפה ואוכל", categoryOther: "", about: "בית קפה שכונתי בחיפה עם מאפים של הבוקר" };
    d.goals = ["whatsapp", "visit"];
    d.materials = { logo: "yes", texts: "partial", images: "yes", style: "חם ונעים", references: "" };
    d.domain = "no"; d.hosting.acknowledged = true; d.maintenance = "basic";
    if (kind === "site-custom") { d.type = "site"; d.site = { pages: "7to10", features: ["about", "services", "gallery", "contact-form"], featuresOther: "" }; }
    else { d.type = "landing"; d.landing = { offer: "ארוחת בוקר זוגית בסופי שבוע", audience: "זוגות מהאזור", cta: "whatsapp" }; }
    const steps = stepList(d);
    const step = params.get("step");
    d.stepIndex = step && steps.includes(step) ? steps.indexOf(step) : steps.length - 1;
    state = d;
  }

  /* ======================= BOOT ======================= */

  els.next.addEventListener("click", next);
  els.back.addEventListener("click", back);
  els.restart.addEventListener("click", restart);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches("input:not([type=checkbox]):not([type=radio])")) { e.preventDefault(); next(); }
  });
  renderStep(false);
})();
