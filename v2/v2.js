/* DS Creative Studio, redesign V2 prototype: header state, mobile menu, reveal on scroll, work filters.
   No measurement here on purpose: the prototype is local and must not send analytics hits. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* header turns solid once the page scrolls */
  const head = document.querySelector(".site-head");
  if (head && !head.classList.contains("always-solid")) {
    const update = () => head.classList.toggle("is-solid", window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* mobile menu: native dialog gives focus containment, Esc and an inert page behind it */
  const menu = document.getElementById("menu");
  const openBtn = document.querySelector("[data-menu-open]");
  if (menu && openBtn && typeof menu.showModal === "function") {
    openBtn.addEventListener("click", () => { menu.showModal(); openBtn.setAttribute("aria-expanded", "true"); });
    menu.addEventListener("close", () => { openBtn.setAttribute("aria-expanded", "false"); openBtn.focus(); });
    menu.querySelectorAll("[data-menu-close], nav a, .menu-contact a").forEach((el) => el.addEventListener("click", () => menu.close()));
  }

  /* reveal on scroll; without IntersectionObserver everything is simply visible */
  const items = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add("in"));
  }

  /* work gallery: one simple choice, real projects or concepts, with a live count */
  const gallery = document.querySelector("[data-gallery]");
  if (gallery) {
    const count = document.querySelector("[data-gallery-count]");
    const apply = (kind) => {
      let shown = 0;
      gallery.querySelectorAll("[data-group]").forEach((group) => {
        const ok = kind === "all" || group.dataset.group === kind;
        group.hidden = !ok;
        if (ok) shown += group.querySelectorAll(".work-item").length;
      });
      if (count) count.textContent = shown === 1 ? "מוצגת עבודה אחת" : `מוצגות ${shown} עבודות`;
    };
    document.querySelectorAll('[data-filter="kind"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll('[data-filter="kind"]').forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        apply(btn.dataset.value);
      });
    });
    apply("all");
  }
})();
