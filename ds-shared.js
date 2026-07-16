/* ============================================================
   DS: shared client logic for every sub-brand room
   Plain JS, no build step. Bilingual (he/en) via data-he/data-en
   attrs, persisted in localStorage so language choice survives
   moving between rooms. Loaded before each room's own script.js
   (and, on VideoArt, before router.js).
   ============================================================ */

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- utilities ---------- */

function qs(sel, root) {
  return (root || document).querySelector(sel);
}

function qsa(sel, root) {
  return Array.from((root || document).querySelectorAll(sel));
}

function escHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fetchJSON(path) {
  return fetch(path).then((res) => {
    if (!res.ok) throw new Error("Failed to load " + path);
    return res.json();
  });
}

function getLang() {
  return localStorage.getItem("ds_lang") || "he";
}

/* ---------- page-scoped listeners (cleared on each page mount by a room's router, if it has one) ---------- */

let pageScopedListeners = [];

function addPageListener(target, event, handler) {
  target.addEventListener(event, handler);
  pageScopedListeners.push({ target, event, handler });
}

function onLangChange(handler) {
  addPageListener(document, "langchange", handler);
}

function clearLangChangeHandlers() {
  pageScopedListeners.forEach(({ target, event, handler }) => target.removeEventListener(event, handler));
  pageScopedListeners = [];
}

/* ---------- language toggle ---------- */

function setLang(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  localStorage.setItem("ds_lang", lang);
  applyStaticLang(lang);
  qsa(".lang-btn").forEach((btn) => {
    const isActive = btn.dataset.lang === lang;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });
  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
}

function applyStaticLang(lang) {
  qsa("[data-he]").forEach((el) => {
    const val = lang === "en" ? el.dataset.en : el.dataset.he;
    if (val != null) el.textContent = val;
  });
  qsa("[data-he-html]").forEach((el) => {
    const val = lang === "en" ? el.dataset.enHtml : el.dataset.heHtml;
    if (val != null) el.innerHTML = val;
  });
  qsa("[data-he-placeholder]").forEach((el) => {
    const val = lang === "en" ? el.dataset.enPlaceholder : el.dataset.hePlaceholder;
    if (val != null) el.setAttribute("placeholder", val);
  });
  qsa("[data-lang-block]").forEach((el) => {
    el.classList.toggle("hidden", el.dataset.langBlock !== lang);
  });
}

function initLang() {
  const saved = getLang();
  setLang(saved);
  qsa(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.dataset.lang));
  });
}

/* ---------- navbar / mobile menu ---------- */

function initNav() {
  const toggle = qs(".hamburger");
  const menu = qs(".mobile-menu");
  if (!toggle || !menu) return;
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-haspopup", "true");
  if (!menu.id) menu.id = "mobileMenu";
  toggle.setAttribute("aria-controls", menu.id);
  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
  qsa("a", menu).forEach((a) =>
    a.addEventListener("click", () => {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );
}

/* ---------- GSAP scroll reveals ---------- */

function initReveals(root) {
  const items = qsa(".reveal:not([data-revealed])", root);
  if (items.length === 0) return;
  items.forEach((el) => el.setAttribute("data-revealed", "1"));

  if (prefersReducedMotion || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    items.forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    return;
  }

  gsap.set(items, { opacity: 0, y: 24 });
  ScrollTrigger.batch(items, {
    start: "top 88%",
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power2.out",
      }),
  });
}

/* ---------- hash scrolling ---------- */

function scrollToHash() {
  if (!window.location.hash) return;
  const target = qs(window.location.hash);
  if (!target) return;
  const prevBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = "auto";
  target.scrollIntoView({ block: "start" });
  document.documentElement.style.scrollBehavior = prevBehavior;
}

/* ---------- hub arrival: fade out the brand-color overlay left by the
   hub's camera-flight, if we actually arrived that way. A tiny inline
   blocking script in <head> (see each room's HTML) sets the
   "hub-arrival" class on <html> before first paint, based on a
   sessionStorage flag the hub sets right before navigating, so there's
   no flash-of-wrong-state on arrival, and no flash at all on a direct/
   bookmarked load where the class is never set. ---------- */

function clearHubArrival() {
  if (!document.documentElement.classList.contains("hub-arrival")) return;
  sessionStorage.removeItem("ds_hub_transition");
  const overlay = qs("#hubTransitionOverlay");
  if (!overlay || prefersReducedMotion || typeof gsap === "undefined") {
    document.documentElement.classList.remove("hub-arrival");
    return;
  }
  gsap.to(overlay, {
    opacity: 0,
    duration: 0.4,
    ease: "power1.out",
    onComplete: () => document.documentElement.classList.remove("hub-arrival"),
  });
}

/* ---------- hub exit: leaving a room back to "/" fades to that room's own
   --accent color first, so the trip back reads as flying out through
   color rather than a flat page swap. Reuses #hubTransitionOverlay
   (the same element the arrival fade uses) since it's already styled
   as background: var(--accent) and only one of the two ever runs on a
   given page load. Listeners are attached directly on the link (not
   delegated) and stop propagation so VideoArt's router.js never also
   tries to handle the same click. ---------- */

let hubExitInFlight = false;

function initHubExitLinks() {
  if (!document.body.dataset.room) return;
  qsa('a[href="/"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      e.stopPropagation();
      if (hubExitInFlight) return;
      hubExitInFlight = true;

      const href = link.getAttribute("href");
      const roomKey = document.body.dataset.room || "";
      const overlay = qs("#hubTransitionOverlay");

      let navigated = false;
      function go() {
        if (navigated) return;
        navigated = true;
        sessionStorage.setItem("ds_hub_return", roomKey);
        window.location.href = href;
      }

      if (!overlay || prefersReducedMotion || typeof gsap === "undefined") {
        go();
        return;
      }
      overlay.style.display = "block";
      gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.in", onComplete: go });
      setTimeout(go, 900);
    });
  });
}

/* ---------- bfcache restore: undo whatever mid-animation state the
   exit-to-hub transition left behind. Leaving a room fades
   #hubTransitionOverlay to fully opaque (the room's own accent color)
   right before navigating away. If the browser restores this exact
   page from its back-forward cache (pressing Back after arriving on
   whatever page came next), none of the normal boot code re-runs -
   the page just reappears exactly as it looked the instant it was
   left, i.e. covered edge-to-edge in solid color. pageshow with
   persisted:true is the one event that fires on that kind of
   restore, so it's the only reliable place to reset it. ---------- */

window.addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  hubExitInFlight = false;
  document.documentElement.classList.remove("hub-arrival", "hub-returning");
  const overlay = qs("#hubTransitionOverlay");
  if (overlay) {
    if (typeof gsap !== "undefined") gsap.set(overlay, { opacity: 0 });
    else overlay.style.opacity = "0";
    overlay.style.display = "";
  }
});

/* ---------- accessibility widget ----------
   A visible accessibility button + panel (font size, high contrast,
   underlined links, paused motion), injected on every page so it
   doesn't need to be hand-added to 12 HTML files. Settings persist
   in localStorage (shared across all DS rooms, like language) and
   are re-applied on every page load before the panel even opens. */

const A11Y_STORAGE_KEY = "ds_a11y";
const A11Y_FONT_STEPS = ["", "a11y-font-lg", "a11y-font-xl"];

function getA11ySettings() {
  try {
    return Object.assign({ font: 0, contrast: false, underline: false, pauseMotion: false }, JSON.parse(localStorage.getItem(A11Y_STORAGE_KEY) || "{}"));
  } catch (e) {
    return { font: 0, contrast: false, underline: false, pauseMotion: false };
  }
}

function saveA11ySettings(settings) {
  localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(settings));
}

function applyA11ySettings(settings) {
  const html = document.documentElement;
  A11Y_FONT_STEPS.forEach((cls) => cls && html.classList.remove(cls));
  if (A11Y_FONT_STEPS[settings.font]) html.classList.add(A11Y_FONT_STEPS[settings.font]);
  html.classList.toggle("a11y-contrast", !!settings.contrast);
  html.classList.toggle("a11y-underline", !!settings.underline);
  html.classList.toggle("a11y-pause-motion", !!settings.pauseMotion);
}

function initA11yWidget() {
  const settings = getA11ySettings();
  applyA11ySettings(settings);

  const wrap = document.createElement("div");
  wrap.className = "a11y-widget";
  wrap.innerHTML = [
    '<button type="button" class="a11y-toggle" aria-haspopup="true" aria-expanded="false" aria-controls="a11yPanel" aria-label="תפריט נגישות">',
    '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><circle cx="12" cy="4" r="2"/><path d="M12 7c-3 0-7 1-7 3v1h6v9h2v-9h0v9h2v-9h6V10c0-2-4-3-7-3z"/></svg>',
    "</button>",
    '<div class="a11y-panel" id="a11yPanel" role="dialog" aria-label="הגדרות נגישות" hidden>',
    '<h2 data-he="הגדרות נגישות" data-en="Accessibility settings">הגדרות נגישות</h2>',
    '<div class="a11y-row">',
    '<span data-he="גודל טקסט" data-en="Text size">גודל טקסט</span>',
    '<div class="a11y-btn-group">',
    '<button type="button" data-a11y="font-dec" aria-label="הקטן טקסט">A-</button>',
    '<button type="button" data-a11y="font-inc" aria-label="הגדל טקסט">A+</button>',
    "</div></div>",
    '<button type="button" class="a11y-option" data-a11y="contrast" aria-pressed="false"><span data-he="ניגודיות גבוהה" data-en="High contrast">ניגודיות גבוהה</span></button>',
    '<button type="button" class="a11y-option" data-a11y="underline" aria-pressed="false"><span data-he="קו תחתון לקישורים" data-en="Underline links">קו תחתון לקישורים</span></button>',
    '<button type="button" class="a11y-option" data-a11y="pause-motion" aria-pressed="false"><span data-he="עצירת אנימציות" data-en="Pause animations">עצירת אנימציות</span></button>',
    '<button type="button" class="a11y-reset" data-a11y="reset" data-he="איפוס הגדרות" data-en="Reset settings">איפוס הגדרות</button>',
    "</div>",
  ].join("");
  document.body.appendChild(wrap);

  const toggle = qs(".a11y-toggle", wrap);
  const panel = qs(".a11y-panel", wrap);

  function syncPanelUI() {
    const s = getA11ySettings();
    qsa(".a11y-option", wrap).forEach((btn) => {
      const key = btn.dataset.a11y === "pause-motion" ? "pauseMotion" : btn.dataset.a11y;
      btn.setAttribute("aria-pressed", String(!!s[key]));
    });
  }
  function syncToggleLabel() {
    toggle.setAttribute("aria-label", getLang() === "he" ? "תפריט נגישות" : "Accessibility menu");
  }
  syncPanelUI();
  syncToggleLabel();
  applyStaticLang(getLang());
  document.addEventListener("langchange", syncToggleLabel);

  toggle.addEventListener("click", () => {
    const isOpen = panel.hasAttribute("hidden") === false;
    if (isOpen) {
      panel.setAttribute("hidden", "");
      toggle.setAttribute("aria-expanded", "false");
    } else {
      panel.removeAttribute("hidden");
      toggle.setAttribute("aria-expanded", "true");
    }
  });

  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target) && !panel.hasAttribute("hidden")) {
      panel.setAttribute("hidden", "");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  panel.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      panel.setAttribute("hidden", "");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    }
  });

  panel.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-a11y]");
    if (!btn) return;
    const action = btn.dataset.a11y;
    const s = getA11ySettings();

    if (action === "font-inc") s.font = Math.min(s.font + 1, A11Y_FONT_STEPS.length - 1);
    else if (action === "font-dec") s.font = Math.max(s.font - 1, 0);
    else if (action === "contrast") s.contrast = !s.contrast;
    else if (action === "underline") s.underline = !s.underline;
    else if (action === "pause-motion") s.pauseMotion = !s.pauseMotion;
    else if (action === "reset") {
      s.font = 0;
      s.contrast = false;
      s.underline = false;
      s.pauseMotion = false;
    }

    saveA11ySettings(s);
    applyA11ySettings(s);
    syncPanelUI();
  });
}

/* ---------- boot ---------- */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }
  initHubExitLinks();
  initLang();
  initNav();
  initA11yWidget();
  clearHubArrival();
  if (typeof bootRouter === "function") bootRouter();
});
