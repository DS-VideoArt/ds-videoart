/* DS Creative Studio, homepage "Creative Worlds" (concept): opening sequence, gold dust, scroll scenes and small pointer depth.
   Everything here is decoration. Without this file, with reduced motion, or with "stop animations"
   in the site's accessibility menu (html.a11y-still), every scene shows its final state. */
(function () {
  "use strict";
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const open = document.querySelector("[data-open]");
  if (!open) return;

  /* reveals work in every mode: with reduced motion the CSS simply shows the final state.
     A clipped picture is watched through its parent: a fully clipped element never reports as intersecting */
  const once = document.querySelectorAll("[data-reveal], [data-page], .w-plate");
  const watched = new Map();
  once.forEach((el) => {
    const probe = el.matches("[data-page]") ? el.parentElement : el;
    watched.set(probe, [...(watched.get(probe) || []), el]);
  });
  const mark = (el) => el.classList.add("in");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        watched.get(e.target).forEach(mark);
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });
    watched.forEach((_, probe) => io.observe(probe));
  } else {
    once.forEach(mark);
  }

  /* ---------- motion ---------- */
  const scenes = [...document.querySelectorAll("[data-scene]")];
  const drifts = [...document.querySelectorAll("[data-drift]")];
  const pinned = new Map();
  let live = false, ticking = false;

  function measure() { scenes.forEach((s) => pinned.set(s, getComputedStyle(s.querySelector(".w-stage")).position === "sticky")); }
  function frame() {
    ticking = false;
    if (!live) return;
    const vh = window.innerHeight;
    open.style.setProperty("--h", Math.min(1, Math.max(0, window.scrollY / (vh * 0.9))).toFixed(4));
    scenes.forEach((s) => {
      let p;
      if (pinned.get(s)) {
        /* desktop: the stage is pinned while the section scrolls past, the scene plays over that distance */
        const r = s.getBoundingClientRect();
        p = -r.top / (Math.max(1, r.height - vh) * 0.8);
      } else {
        /* phones: nothing is pinned, the scene plays while its picture travels from the bottom of the screen to a third from the top */
        const r = (s.querySelector(".w-lens") || s.querySelector(".w-stage")).getBoundingClientRect();
        p = (vh - r.top) / (vh * 0.68);
      }
      s.style.setProperty("--p", Math.min(1, Math.max(0, p)).toFixed(4));
    });
    drifts.forEach((d) => {
      const r = d.getBoundingClientRect();
      d.style.setProperty("--d", Math.max(-1, Math.min(1, ((r.top + r.height / 2) - vh / 2) / vh)).toFixed(4));
    });
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", () => { measure(); request(); });

  /* opening sequence starts once the planet is decoded, so it never fades in half loaded */
  const planet = open.querySelector(".w-open-art img");
  const ready = () => requestAnimationFrame(() => open.classList.add("w-ready"));

  /* pointer depth: the planet leans away from the cursor, the builder model tilts toward it */
  if (finePointer.matches) {
    const art = open.querySelector("[data-depth]");
    open.addEventListener("pointermove", (e) => {
      if (!live) return;
      art.style.setProperty("--px", ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
      art.style.setProperty("--py", ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
    });
    const model = document.querySelector("[data-tilt]");
    if (model) {
      model.addEventListener("pointermove", (e) => {
        if (!live) return;
        const r = model.getBoundingClientRect();
        model.style.setProperty("--tx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        model.style.setProperty("--ty", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      });
      model.addEventListener("pointerleave", () => { model.style.setProperty("--tx", 0); model.style.setProperty("--ty", 0); });
    }
  }

  /* gold dust drifting around the planet; pauses when the opening is off screen, the tab is hidden or motion is off */
  const canvas = open.querySelector("[data-dust]");
  const ctx = canvas && canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0, motes = [], running = false, visible = true;
  function size() {
    if (!ctx) return;
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(90, (w * h) / 16000));
    motes = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h, r: 0.5 + Math.random() * 1.5,
      vy: -(0.06 + Math.random() * 0.22), vx: (Math.random() - 0.5) * 0.12, t: Math.random() * Math.PI * 2
    }));
  }
  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    for (const m of motes) {
      m.x += m.vx; m.y += m.vy; m.t += 0.02;
      if (m.y < -4) { m.y = h + 4; m.x = Math.random() * w; }
      const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(m.t));
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(226, 194, 127, ${a.toFixed(3)})`; ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  function play() {
    if (!ctx) return;
    const go = live && visible && !document.hidden;
    if (go && !running) { running = true; requestAnimationFrame(draw); }
    else if (!go) { running = false; ctx.clearRect(0, 0, w, h); }
  }
  if (ctx) {
    size();
    window.addEventListener("resize", size);
    document.addEventListener("visibilitychange", play);
    if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; play(); }).observe(open);
  }

  /* motion on or off: system setting and the site's own "stop animations" switch, both live */
  const cleared = [open, ...scenes, ...drifts, open.querySelector("[data-depth]"), document.querySelector("[data-tilt]")].filter(Boolean);
  function setMotion() {
    const on = !reduce.matches && !root.classList.contains("a11y-still");
    if (on === live) return;
    live = on;
    root.classList.toggle("w-motion", on);
    if (on) {
      measure(); frame();
      if (planet && planet.decode) planet.decode().then(ready, ready); else ready();
      setTimeout(ready, 1200);
    } else {
      /* drop every scroll value so the CSS falls back to the final state of each scene */
      cleared.forEach((el) => ["--h", "--p", "--d", "--px", "--py", "--tx", "--ty"].forEach((v) => el.style.removeProperty(v)));
    }
    play();
  }
  setMotion();
  if (reduce.addEventListener) reduce.addEventListener("change", setMotion);
  new MutationObserver(setMotion).observe(root, { attributes: true, attributeFilter: ["class"] });
})();
