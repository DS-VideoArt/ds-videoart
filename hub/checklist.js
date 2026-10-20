/* ============================================================
   "15 questions" checklist page: download and print measurement,
   and the "print directly" button.
   The button appears only when scripts run; the download link works without them.
   ============================================================ */

(function () {
  "use strict";

  // One event per real action, sent only through DS_ANALYTICS: it drops the event when
  // measurement was declined, and holds it on this page until the visitor decides.
  const track = (name) => { if (window.DS_ANALYTICS) window.DS_ANALYTICS.trackEvent(name); };

  // The download: one event per click on the file link (Enter on the link is a click too).
  document.querySelectorAll('a[href="/hub/media/questions-before-ordering-a-website.pdf"]').forEach((link) => {
    link.addEventListener("click", () => track("checklist_download"));
  });

  // Printing: counted once per print dialog, from beforeprint only, so the button and the
  // browser's own print command count the same way and never twice.
  let lastPrint = 0;
  window.addEventListener("beforeprint", () => {
    const now = Date.now();
    if (now - lastPrint < 2000) return;
    lastPrint = now;
    track("checklist_print");
  });

  const button = document.querySelector("[data-print]");
  if (!button || typeof window.print !== "function") return;
  button.hidden = false;
  button.addEventListener("click", () => window.print());
})();
