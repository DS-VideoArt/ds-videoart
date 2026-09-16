/* ============================================================
   DS Creative Studio — site script
   Vanilla JS, no dependencies. Everything here is progressive:
   the page reads and works fully without it.
   ============================================================ */

(function () {
  "use strict";

  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const motionOff = () => reduceMotion || document.documentElement.classList.contains("a11y-still");

  /* ---------- Navigation ---------- */

  function initNav() {
    const nav = qs(".nav");
    const toggle = qs(".nav-toggle");
    const menu = qs(".mobile-menu");
    if (nav) {
      const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 16);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    if (toggle && menu) {
      const setOpen = (open) => {
        toggle.setAttribute("aria-expanded", String(open));
        menu.classList.toggle("open", open);
        document.body.style.overflow = open ? "hidden" : "";
      };
      toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
      qsa("a", menu).forEach((a) => a.addEventListener("click", () => setOpen(false)));
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && menu.classList.contains("open")) { setOpen(false); toggle.focus(); }
      });
    }
  }

  /* ---------- Reveal on scroll ---------- */

  function initReveal() {
    const items = qsa(".rv");
    if (!items.length) return;
    // ?static=1 shows everything at once (used for headless screenshots and as a debug switch).
    const forceStatic = /[?&]static=1/.test(location.search);
    if (forceStatic) document.documentElement.style.scrollBehavior = "auto";
    if (forceStatic || motionOff() || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Pointer-reactive shapes (hero) ---------- */

  function initParallax() {
    if (!finePointer || motionOff()) return;
    const zones = qsa("[data-parallax-zone]");
    zones.forEach((zone) => {
      const layers = qsa("[data-depth]", zone);
      if (!layers.length) return;
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      const render = () => {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        layers.forEach((el) => {
          const d = parseFloat(el.dataset.depth) || 0;
          el.style.transform = `translate3d(${(cx * d).toFixed(2)}px, ${(cy * d).toFixed(2)}px, 0)`;
        });
        if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) raf = requestAnimationFrame(render);
        else raf = null;
      };
      zone.addEventListener("pointermove", (e) => {
        const r = zone.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 28;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 28;
        if (!raf) raf = requestAnimationFrame(render);
      });
      zone.addEventListener("pointerleave", () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(render); });
    });
  }

  /* ---------- Work: desktop / mobile switch ---------- */

  function initWorkSwitch() {
    qsa(".view-switch").forEach((sw) => {
      const frame = sw.closest(".work-visual")?.querySelector(".work-frame");
      if (!frame) return;
      qsa("button", sw).forEach((btn) => {
        btn.addEventListener("click", () => {
          const view = btn.dataset.view;
          frame.dataset.view = view;
          qsa("button", sw).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        });
      });
    });
  }

  /* ---------- Process line progress ---------- */

  function initTimeline() {
    const tl = qs(".timeline");
    const bar = qs(".timeline-progress");
    if (!tl || !bar) return;
    const steps = qsa(".step", tl);
    const update = () => {
      const r = tl.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress: from when the top passes 70% of the viewport to when the bottom passes 40%
      const start = vh * 0.7;
      const end = vh * 0.4;
      const p = Math.min(1, Math.max(0, (start - r.top) / (r.height - end + (start - end))));
      bar.style.setProperty("--p", (p * 100).toFixed(1) + "%");
      const lineTop = r.top;
      steps.forEach((s) => {
        const sr = s.getBoundingClientRect();
        const dotY = sr.top - lineTop + 12;
        s.classList.toggle("done", dotY <= p * r.height);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* ---------- Sticky mobile CTA ---------- */

  function initStickyCta() {
    const bar = qs(".sticky-cta");
    const hero = qs(".hero");
    const contact = qs("#contact");
    if (!bar || !hero) return;
    let heroOut = false, contactIn = false, typing = false;
    const apply = () => {
      const show = heroOut && !contactIn && !typing;
      bar.classList.toggle("show", show);
      document.body.classList.toggle("sticky-visible", show && window.matchMedia("(max-width: 860px)").matches);
    };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((en) => { heroOut = !en[0].isIntersecting; apply(); }, { threshold: 0.05 }).observe(hero);
      if (contact) new IntersectionObserver((en) => { contactIn = en[0].isIntersecting; apply(); }, { threshold: 0.2 }).observe(contact);
    }
    document.addEventListener("focusin", (e) => { if (e.target.matches("input, textarea, select")) { typing = true; apply(); } });
    document.addEventListener("focusout", (e) => { if (e.target.matches("input, textarea, select")) { typing = false; apply(); } });
  }

  /* ---------- Contact form ---------- */


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

  function initForm() {
    const form = qs("#contactForm");
    if (!form) return;
    const status = qs(".form-status", form);
    const name = qs("#f-name", form);
    const phone = qs("#f-phone", form);
    const submit = qs('button[type="submit"]', form);

    const setInvalid = (input, bad) => {
      const field = input.closest(".field");
      field.classList.toggle("invalid", bad);
      input.setAttribute("aria-invalid", bad ? "true" : "false");
    };
    const validPhone = (v) => {
      const digits = v.replace(/[^\d+]/g, "");
      return /^(\+972|0)?5\d{8}$/.test(digits) || /^(\+972|0)?[2-9]\d{7,8}$/.test(digits);
    };
    const validate = () => {
      const okName = name.value.trim().length >= 2;
      const okPhone = validPhone(phone.value.trim());
      setInvalid(name, !okName);
      setInvalid(phone, !okPhone);
      if (!okName) name.focus(); else if (!okPhone) phone.focus();
      return okName && okPhone;
    };
    name.addEventListener("blur", () => setInvalid(name, name.value.trim().length < 2 && name.value !== ""));
    phone.addEventListener("blur", () => setInvalid(phone, !validPhone(phone.value.trim()) && phone.value !== ""));

    // If the visitor started the project builder and then chose to talk instead,
    // pass a short summary of what they already filled in, so the call has context.
    const builderContext = () => {
      try {
        const s = JSON.parse(localStorage.getItem("dsc_builder_v1") || "null");
        if (!s || !s.type) return "";
        const parts = [s.type === "site" ? "אתר תדמית" : "דף נחיתה"];
        if (s.business?.businessName) parts.push("עסק: " + s.business.businessName);
        if (s.business?.category) parts.push("תחום: " + s.business.category);
        if (s.site?.pages) parts.push("עמודים: " + s.site.pages);
        if (s.site?.features?.length) parts.push("רכיבים: " + s.site.features.join(","));
        if (s.maintenance) parts.push("תחזוקה: " + s.maintenance);
        return parts.join(" | ").slice(0, 500);
      } catch { return ""; }
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.className = "form-status";
      if (!validate()) return;
      const ctx = qs("#builderContext", form);
      if (ctx) ctx.value = builderContext();
      UTM_KEYS.forEach((k) => { const inp = form.elements[k]; if (inp) inp.value = utmValue(k); });
      submit.disabled = true;
      const original = submit.textContent;
      submit.textContent = "שולחים…";
      try {
        const body = new URLSearchParams(new FormData(form)).toString();
        const res = await fetch(form.getAttribute("action") || "/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        if (!res.ok) throw new Error("bad status " + res.status);
        try {
          const svc = (form.querySelector("input[name=service]:checked") || {}).value || "";
          const serviceType = svc === "דף נחיתה" ? "landing_page" : svc === "אתר תדמית" ? "website" : "unsure";
          if (window.DS_ANALYTICS) window.DS_ANALYTICS.trackEvent("contact_request_submitted", { service_type: serviceType });
          if (window.DS_ANALYTICS && window.DS_ANALYTICS.metaTrack) window.DS_ANALYTICS.metaTrack("Lead", { form_type: "contact" });   // Meta Lead: only here, after the server accepted
        } catch {}
        status.className = "form-status ok";
        status.textContent = "קיבלנו. נחזור אליכם לשיחה קצרה בהקדם.";
        form.reset();
      } catch (err) {
        status.className = "form-status fail";
        status.innerHTML = 'משהו השתבש בשליחה. אפשר לכתוב לנו ישירות <a href="' + (form.dataset.wa || "#") + '" target="_blank" rel="noopener">בוואטסאפ</a> או להתקשר.';
      } finally {
        submit.disabled = false;
        submit.textContent = original;
      }
    });
  }

  /* ---------- Accessibility widget ---------- */

  const A11Y_KEY = "dsc_a11y";
  const FONT_STEPS = ["100%", "112%", "125%", "140%"];

  function readA11y() {
    try { return Object.assign({ font: 0, contrast: false, underline: false, still: false }, JSON.parse(localStorage.getItem(A11Y_KEY) || "{}")); }
    catch { return { font: 0, contrast: false, underline: false, still: false }; }
  }
  function applyA11y(s) {
    const html = document.documentElement;
    html.style.fontSize = FONT_STEPS[s.font] || "100%";
    html.classList.toggle("a11y-contrast", !!s.contrast);
    html.classList.toggle("a11y-underline", !!s.underline);
    html.classList.toggle("a11y-still", !!s.still);
    try { localStorage.setItem(A11Y_KEY, JSON.stringify(s)); } catch {}
  }

  function initA11y() {
    const state = readA11y();
    applyA11y(state);

    const root = document.createElement("div");
    root.className = "a11y";
    root.innerHTML = `
      <button type="button" class="a11y-toggle" aria-expanded="false" aria-controls="a11yPanel" aria-label="תפריט נגישות">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="4.5" r="2"/><path d="M4 8.5a1 1 0 0 1 1.2-.98L12 9l6.8-1.48A1 1 0 0 1 20 8.5a1 1 0 0 1-.8 1L14 10.7V14l2.7 6.4a1 1 0 1 1-1.85.78L12 15.3l-2.85 5.88a1 1 0 1 1-1.85-.78L10 14v-3.3L4.8 9.5A1 1 0 0 1 4 8.5Z"/></svg>
      </button>
      <div class="a11y-panel" id="a11yPanel" hidden>
        <h2>הגדרות נגישות</h2>
        <div class="a11y-row"><span>גודל טקסט</span>
          <div class="group">
            <button type="button" data-a11y="font-dec" aria-label="הקטנת טקסט">−</button>
            <button type="button" data-a11y="font-inc" aria-label="הגדלת טקסט">+</button>
          </div>
        </div>
        <button type="button" class="a11y-opt" data-a11y="contrast" aria-pressed="false">ניגודיות גבוהה</button>
        <button type="button" class="a11y-opt" data-a11y="underline" aria-pressed="false">קו תחתון לקישורים</button>
        <button type="button" class="a11y-opt" data-a11y="still" aria-pressed="false">עצירת אנימציות</button>
        <button type="button" class="a11y-reset" data-a11y="reset">איפוס הגדרות</button>
      </div>`;
    document.body.appendChild(root);

    const toggle = qs(".a11y-toggle", root);
    const panel = qs(".a11y-panel", root);
    const sync = () => {
      qsa(".a11y-opt", panel).forEach((b) => b.setAttribute("aria-pressed", String(!!state[b.dataset.a11y])));
    };
    sync();

    toggle.addEventListener("click", () => {
      const open = panel.hidden;
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !panel.hidden) { panel.hidden = true; toggle.setAttribute("aria-expanded", "false"); toggle.focus(); }
    });
    document.addEventListener("click", (e) => {
      if (!panel.hidden && !root.contains(e.target)) { panel.hidden = true; toggle.setAttribute("aria-expanded", "false"); }
    });

    panel.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-a11y]");
      if (!btn) return;
      const a = btn.dataset.a11y;
      if (a === "font-inc") state.font = Math.min(state.font + 1, FONT_STEPS.length - 1);
      else if (a === "font-dec") state.font = Math.max(state.font - 1, 0);
      else if (a === "reset") { state.font = 0; state.contrast = false; state.underline = false; state.still = false; }
      else state[a] = !state[a];
      applyA11y(state);
      sync();
      if (a === "still" && state.still) qsa(".rv").forEach((el) => el.classList.add("in"));
    });
  }

  /* ---------- Boot ---------- */

  document.addEventListener("DOMContentLoaded", () => {
    initA11y();
    initNav();
    initReveal();
    initParallax();
    initWorkSwitch();
    initTimeline();
    initStickyCta();
    initForm();
    // ?y=<px> jumps to a scroll position on load (QA / screenshot helper, no effect otherwise).
    const y = new URLSearchParams(location.search).get("y");
    if (y) requestAnimationFrame(() => window.scrollTo({ top: parseInt(y, 10) || 0, behavior: "instant" }));
  });
})();
