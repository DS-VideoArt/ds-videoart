/* ============================================================
   /pricing: the sticky in-page navigation marks the part of the
   page being read, and on phones keeps that link in view.
   Progressive: without it the links still jump to their sections.
   ============================================================ */

(function () {
  "use strict";

  const nav = document.querySelector(".pp-subnav");
  if (!nav) return;
  const strip = nav.querySelector(".pp-subnav-inner");
  const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
  const targets = links.map((a) => document.getElementById(a.getAttribute("href").slice(1)));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let current = null, queued = false;

  function update() {
    queued = false;
    // the part being read: the last section whose top has passed just below the bars
    const line = nav.getBoundingClientRect().bottom + 24;
    let index = -1;
    targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top <= line) index = i; });
    const link = index >= 0 ? links[index] : null;
    if (link === current) return;
    if (current) current.removeAttribute("aria-current");
    current = link;
    if (!link) return;
    link.setAttribute("aria-current", "location");
    const r = link.getBoundingClientRect(), s = strip.getBoundingClientRect();
    if (r.left < s.left || r.right > s.right) {
      strip.scrollBy({ left: (r.left + r.width / 2) - (s.left + s.width / 2), behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  // On phones the process steps scroll sideways. When they do, the strip takes keyboard focus
  // (arrow keys scroll it) and is announced as one labelled region.
  const steps = document.querySelector(".pp-steps");
  function syncSteps() {
    if (!steps) return;
    if (steps.scrollWidth > steps.clientWidth + 1) {
      steps.tabIndex = 0; steps.setAttribute("aria-label", "שלבי העבודה, 7 שלבים");
    } else {
      steps.removeAttribute("tabindex"); steps.removeAttribute("aria-label");
    }
  }
  syncSteps();
  window.addEventListener("resize", syncSteps);

  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  update();
})();
