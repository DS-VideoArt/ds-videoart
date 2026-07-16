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

/* ---------- boot ---------- */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }
  initHubExitLinks();
  initLang();
  initNav();
  clearHubArrival();
  if (typeof bootRouter === "function") bootRouter();
});
