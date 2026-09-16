/* ============================================================
   DS Creative Studio, measurement (GA4 + Meta Pixel behind one consent gate)

   The only place in the site that knows about Google Analytics and the Meta Pixel.
   - MEASUREMENT_ID empty  -> everything is inert: no banner, no script, no requests.
   - Consent not decided   -> quiet banner; nothing is loaded; events wait in memory.
   - Consent denied        -> nothing is loaded, events are dropped, choice remembered.
   - Consent granted       -> gtag.js loads, page_view fires, waiting events flush;
                              the Meta Pixel base code loads once and sends PageView only.

   Public API (window.DS_ANALYTICS):
     trackEvent(name, params)  send a whitelisted, non-personal event
     consent("granted"|"denied")
     getConsent()              "granted" | "denied" | null
     reset()                   forget the choice (QA / "measurement settings" link)
   ============================================================ */

(function () {
  "use strict";

  /* Set the GA4 Measurement ID of dscreative.co.il here (format G-XXXXXXXXXX).
     Never a placeholder: while this is empty, measurement stays completely off. */
  const MEASUREMENT_ID = "G-7VK30G4GVC";

  /* Meta Pixel of DS Creative Studio. Base code only (PageView); loaded once, after consent, on every page
     that includes this file. No Lead / Contact / custom events yet. Empty string = pixel off. */
  const META_PIXEL_ID = "1100234145856436";

  const CONSENT_KEY = "dsc_consent_v1";
  const PRIVACY_URL = "/privacy";
  const ALLOWED_PARAMS = ["service_type", "step_number", "step_name", "custom_quote", "maintenance_plan", "setup_total"];
  const MAX_QUEUE = 30;

  let tagLoaded = false;
  let pixelLoaded = false;
  const waiting = [];

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  /* ---------- consent storage ---------- */
  function getConsent() {
    try {
      const s = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
      return s && (s.analytics === "granted" || s.analytics === "denied") ? s.analytics : null;
    } catch { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: value, at: new Date().toISOString() })); } catch {}
  }

  /* ---------- the tag itself: loaded only after an explicit "granted" ---------- */
  function loadTag() {
    if (tagLoaded || !MEASUREMENT_ID || document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return;
    tagLoaded = true;
    gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    gtag("js", new Date());
    gtag("config", MEASUREMENT_ID, { anonymize_ip: true, send_page_view: true });
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(MEASUREMENT_ID);
    document.head.appendChild(s);
    waiting.splice(0).forEach((ev) => gtag("event", ev.name, ev.params));
  }

  /* ---------- Meta Pixel base code: loaded once, only after an explicit "granted" ---------- */
  function loadPixel() {
    if (pixelLoaded || !META_PIXEL_ID) return;
    pixelLoaded = true;
    if (window.fbq && window.fbq.loaded) return;   // already installed by something else: never load twice
    /* Meta Pixel Code (official base snippet) */
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
    /* End Meta Pixel Code */
  }
  function loadMeasurement() { loadTag(); loadPixel(); }

  /* ---------- events: whitelisted names and params, never free text ---------- */
  function clean(params) {
    const out = {};
    Object.entries(params || {}).forEach(([k, v]) => {
      if (!ALLOWED_PARAMS.includes(k)) return;
      if (typeof v === "number" && isFinite(v)) out[k] = v;
      else if (typeof v === "boolean") out[k] = v;
      else if (typeof v === "string" && /^[A-Za-z0-9_\-]{1,60}$/.test(v)) out[k] = v;
    });
    return out;
  }
  function trackEvent(name, params) {
    if (!MEASUREMENT_ID || typeof name !== "string" || !/^[a-z][a-z0-9_]{2,39}$/.test(name)) return false;
    const ev = { name, params: clean(params) };
    const c = getConsent();
    if (c === "denied") return false;
    if (c === "granted") { loadTag(); gtag("event", ev.name, ev.params); return true; }
    if (waiting.length < MAX_QUEUE) waiting.push(ev);   // decided later on this page: flush on grant, drop on deny
    return false;
  }

  /* ---------- consent UI: small, quiet, one decision ---------- */
  function removeBanner() { const b = document.getElementById("dscConsent"); if (b) b.remove(); }
  function decide(value) {
    setConsent(value);
    removeBanner();
    if (value === "granted") loadMeasurement();
    else waiting.length = 0;
    document.dispatchEvent(new CustomEvent("dsc:consent", { detail: { analytics: value } }));
  }
  function showBanner() {
    if (document.getElementById("dscConsent")) return;
    const el = document.createElement("div");
    el.id = "dscConsent";
    el.className = "consent";
    el.setAttribute("role", "region");
    el.setAttribute("aria-label", "הסכמה למדידה");
    el.innerHTML =
      '<p>כדי להבין איך משתמשים באתר ולשפר אותו, אנחנו משתמשים ב־Google Analytics וב־Meta Pixel. אפשר לאשר או להמשיך בלי מדידה. ' +
      '<a href="' + PRIVACY_URL + '">מדיניות פרטיות</a></p>' +
      '<div class="consent-actions">' +
      '<button type="button" class="btn btn-primary" data-consent="granted">אישור מדידה</button>' +
      '<button type="button" class="btn btn-ghost" data-consent="denied">להמשיך בלי</button>' +
      "</div>";
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-consent]");
      if (b) decide(b.dataset.consent);
    });
    document.body.appendChild(el);
  }
  /* A small "measurement settings" link in the site footer, so the choice can be changed later. */
  function addSettingsLink() {
    const bottom = document.querySelector(".footer .bottom span:last-child");
    if (!bottom || document.getElementById("dscConsentLink")) return;
    const a = document.createElement("a");
    a.href = "#"; a.id = "dscConsentLink"; a.textContent = "הגדרות מדידה";
    a.addEventListener("click", (e) => { e.preventDefault(); showBanner(); });
    bottom.appendChild(document.createTextNode(" · "));
    bottom.appendChild(a);
  }

  function init() {
    if (!MEASUREMENT_ID) return;
    const c = getConsent();
    if (c === "granted") loadMeasurement();
    else if (c === null) showBanner();
    addSettingsLink();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.DS_ANALYTICS = {
    id: MEASUREMENT_ID,
    pixelId: META_PIXEL_ID,
    trackEvent,
    consent: decide,
    getConsent,
    reset() { try { localStorage.removeItem(CONSENT_KEY); } catch {} waiting.length = 0; showBanner(); }
  };
})();
