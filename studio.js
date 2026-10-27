/* DS Creative Studio, site behaviour for the redesigned pages (V2): header state, mobile menu, reveal on scroll,
   the work gallery choice and the magazine topics. Measurement stays in analytics.js and site.js. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");   /* also set in each page head, so nothing flashes */

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
  /* magazine topics: one choice at a time, cards outside the topic hide, a live count */
  const mag = document.querySelector("[data-magazine]");
  if (mag) {
    const out = document.querySelector("[data-magazine-count]");
    const show = (topic) => {
      let n = 0;
      mag.querySelectorAll("[data-topics]").forEach((card) => {
        const ok = topic === "all" || card.dataset.topics.split("|").includes(topic);
        card.hidden = !ok; if (ok) n++;
      });
      if (out) out.textContent = n === 1 ? "מוצג מאמר אחד" : `מוצגים ${n} מאמרים`;
    };
    document.querySelectorAll("[data-topic]").forEach((btn) => btn.addEventListener("click", () => {
      document.querySelectorAll("[data-topic]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      show(btn.dataset.topic);
    }));
    show("all");
  }
})();
