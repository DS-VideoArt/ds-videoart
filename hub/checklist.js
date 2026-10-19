/* ============================================================
   "12 questions" checklist page: the "print directly" button.
   It appears only when scripts run; the download link works without them.
   ============================================================ */

(function () {
  "use strict";

  const button = document.querySelector("[data-print]");
  if (!button || typeof window.print !== "function") return;
  button.hidden = false;
  button.addEventListener("click", () => window.print());
})();
