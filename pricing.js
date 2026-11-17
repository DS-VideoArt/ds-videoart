/* ============================================================
   /pricing: the sticky in-page navigation marks the part of the
   page being read, and on phones keeps that link in view.
   On phones the seven steps open one by one, or all at once.
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

  // Phones (round 2.1, 2026-11-17): the seven steps show their titles; each title opens its detail, and one button
  // opens or closes all of them. Wider screens show every detail. Without this script everything is simply open.
  const stepList = document.querySelector(".pp-steps");
  const allBtn = document.querySelector("[data-steps-all]");
  const phone = window.matchMedia("(max-width: 760px)");
  const CHEV = '<span class="chev" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg></span>';
  const items = stepList ? Array.from(stepList.querySelectorAll(".pp-step")) : [];
  const toggleOf = (li) => li.querySelector(".pp-step-toggle");
  function setOpen(li, open) {
    const b = toggleOf(li), body = li.querySelector(".pp-step-body");
    if (!b || !body) return;
    b.setAttribute("aria-expanded", String(open));
    body.hidden = !open;
  }
  function syncAll() {
    if (!allBtn) return;
    const allOpen = items.length > 0 && items.every((li) => toggleOf(li) && toggleOf(li).getAttribute("aria-expanded") === "true");
    allBtn.setAttribute("aria-expanded", String(allOpen));
    allBtn.textContent = allOpen ? "לסגור את הפירוט של כל השלבים" : "לפתוח את הפירוט של כל השלבים";
  }
  function compact(on) {
    items.forEach((li) => {
      const h3 = li.querySelector("h3"), body = li.querySelector(".pp-step-body");
      if (!h3 || !body) return;
      let b = toggleOf(li);
      if (on && !b) {
        b = document.createElement("button");
        b.type = "button"; b.className = "pp-step-toggle"; b.setAttribute("aria-controls", body.id);
        const label = document.createElement("span");
        while (h3.firstChild) label.appendChild(h3.firstChild);
        b.appendChild(label); b.insertAdjacentHTML("beforeend", CHEV); h3.appendChild(b);
        b.addEventListener("click", () => { setOpen(li, b.getAttribute("aria-expanded") !== "true"); syncAll(); });
        setOpen(li, false);
      } else if (!on && b) {
        const label = b.querySelector("span:not(.chev)");
        while (label && label.firstChild) h3.insertBefore(label.firstChild, b);
        b.remove(); body.hidden = false;
      }
    });
    if (allBtn) allBtn.hidden = !on;
    syncAll();
  }
  if (allBtn) allBtn.addEventListener("click", () => {
    const open = allBtn.getAttribute("aria-expanded") !== "true";
    items.forEach((li) => setOpen(li, open)); syncAll();
  });
  if (items.length) {
    compact(phone.matches);
    if (phone.addEventListener) phone.addEventListener("change", (e) => compact(e.matches));
  }

  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  update();
})();
