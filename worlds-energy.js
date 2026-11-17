/* DS Creative Studio, homepage "Creative Worlds", ENERGY EXPERIMENT (2026-10-29): day and night on the planet,
   the hand light in the gallery, and the blocks that build the light chapter. Decoration only. With reduced motion or
   with "stop animations" in the site's accessibility menu (html.a11y-still) every part rests in its final state. */
(function () {
  "use strict";
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const open = document.querySelector("[data-open]");
  const planet = document.querySelector(".w-scene-planet");
  const gallery = document.querySelector(".w-gallery");
  const hall = document.querySelector("[data-hall]");
  const spotLayer = document.querySelector(".w-spot");
  const spot = document.querySelector("[data-spot]");
  const day = document.querySelector("[data-edge]");
  let live = false;
  const allowed = () => !reduce.matches && !root.classList.contains("a11y-still");

  /* ---------- the light chapter is built from blocks: bottom row first, each block lands with a cool flash ---------- */
  let edge = null;
  function buildEdge() {
    if (!day) return;
    const cols = window.matchMedia("(max-width: 899px)").matches ? 8 : 16;
    if (edge && edge.childElementCount === cols * 3) return;
    if (!edge) { edge = document.createElement("div"); edge.className = "w-edge"; edge.setAttribute("aria-hidden", "true"); day.prepend(edge); }
    edge.style.setProperty("--cols", cols);
    let seed = 7;
    const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    edge.replaceChildren(...Array.from({ length: cols * 3 }, (_, k) => {
      const row = Math.floor(k / cols);                              /* 0 is the top row */
      const i = document.createElement("i");
      i.style.setProperty("--d", ((2 - row) * 0.2 + rand() * 0.2).toFixed(3));
      const col = k % cols;                                           /* column 0 is on the right (RTL) */
      if ((row === 0 && col >= cols - (cols === 16 ? 4 : 2)) || (row === 1 && col === cols - 1)) i.className = "gap";
      return i;
    }));
    day.classList.add("w-edge-on");
  }
  buildEdge();
  window.addEventListener("resize", buildEdge);

  /* ---------- scroll: progress of the blocks ---------- */
  let ticking = false;
  function onScroll() {
    ticking = false;
    if (!live || !edge) return;
    const vh = window.innerHeight, r = edge.getBoundingClientRect();
    edge.style.setProperty("--t", Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.7))).toFixed(4));
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);

  /* ---------- the sun: the night side turns away from the pointer (or a tap); on its own it swings gently around
     the lower right, where the picture's own shadow side is ---------- */
  const suns = [...document.querySelectorAll("[data-sun]")];
  let angle = 40, target = null, heroOn = true, loop = 0, last = 0, clock = 0, release = 0;
  function orbit(now) {
    loop = 0;
    if (!live || !heroOn || document.hidden) return;
    const dt = Math.min(64, now - (last || now)); last = now; clock += dt;
    const goal = target === null ? 40 + 32 * Math.sin(clock / 2400) : target;   /* about 15 seconds a swing */
    angle += ((((goal - angle) % 360) + 540) % 360 - 180) * (target === null ? 0.05 : 0.08);
    suns.forEach((el) => el.style.setProperty("--sun", angle.toFixed(2) + "deg"));
    loop = requestAnimationFrame(orbit);
  }
  const play = () => { if (!loop && live && heroOn && !document.hidden) { last = 0; loop = requestAnimationFrame(orbit); } };
  function aim(e) {
    const r = planet.getBoundingClientRect();
    const cx = r.left + r.width * 0.28, cy = r.top + r.height * 0.495;   /* the planet's centre in the picture */
    target = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 180;   /* night faces away from the sun */
  }
  if (open && suns.length) {
    open.addEventListener("pointermove", (e) => { if (live && e.pointerType === "mouse") aim(e); });
    open.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") target = null; });
    open.addEventListener("pointerdown", (e) => {
      if (!live || e.pointerType === "mouse") return;
      aim(e); clearTimeout(release); release = setTimeout(() => (target = null), 2600);
    });
  }

  /* ---------- the hand light in the gallery ---------- */
  let dim = 0;
  function light(e) {
    const r = hall.getBoundingClientRect(), k = r.width / hall.offsetWidth;
    hall.style.setProperty("--sx", ((e.clientX - r.left) / k).toFixed(1) + "px");
    hall.style.setProperty("--sy", ((e.clientY - r.top) / k).toFixed(1) + "px");
    spotLayer.classList.add("is-on");
  }
  if (gallery && hall && spot) {
    gallery.addEventListener("pointermove", (e) => { if (live && e.pointerType === "mouse") light(e); });
    gallery.addEventListener("pointerleave", () => spotLayer.classList.remove("is-on"));
    gallery.addEventListener("pointerdown", (e) => {
      if (!live || e.pointerType === "mouse") return;
      light(e); clearTimeout(dim); dim = setTimeout(() => spotLayer.classList.remove("is-on"), 1800);
    });
  }

  /* ---------- pause everything that is off screen ---------- */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => { heroOn = e.isIntersecting; open.classList.toggle("w-paused", !heroOn); play(); }).observe(open);
    if (gallery) new IntersectionObserver(([e]) => gallery.classList.toggle("w-paused", !e.isIntersecting)).observe(gallery);
  }
  document.addEventListener("visibilitychange", play);

  /* ---------- motion on or off, live ---------- */
  function setMotion() {
    const on = allowed();
    if (on === live) return;
    live = on;
    if (on) { onScroll(); play(); }
    else {
      target = null; spotLayer && spotLayer.classList.remove("is-on");
      suns.forEach((el) => el.style.removeProperty("--sun"));
      edge && edge.style.removeProperty("--t");
    }
  }
  setMotion();
  if (reduce.addEventListener) reduce.addEventListener("change", setMotion);
  new MutationObserver(setMotion).observe(root, { attributes: true, attributeFilter: ["class"] });
})();
