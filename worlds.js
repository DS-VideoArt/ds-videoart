/* DS Creative Studio, homepage "Creative Worlds" (concept): opening sequence, gold dust, scroll scenes and small pointer depth.
   Everything here is decoration. Without this file, or with reduced motion, every scene shows its final state. */
(function () {
  "use strict";
  const root = document.documentElement;
  const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const open = document.querySelector("[data-open]");
  if (!open) return;

  /* reveals work in every mode: with reduced motion the CSS simply shows the final state */
  /* a clipped picture is watched through its parent: a fully clipped element never reports as intersecting */
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

  if (!motion.matches) return;
  root.classList.add("w-motion");

  /* opening sequence starts once the planet is decoded, so it never fades in half loaded */
  const planet = open.querySelector(".w-open-art img");
  const start = () => requestAnimationFrame(() => open.classList.add("w-ready"));
  if (planet && planet.decode) planet.decode().then(start, start); else start();
  setTimeout(start, 1200);

  /* scroll scenes: one rAF per frame, only transform / clip / opacity change */
  const scenes = [...document.querySelectorAll("[data-scene]")];
  const drifts = [...document.querySelectorAll("[data-drift]")];
  let ticking = false;
  function frame() {
    ticking = false;
    const vh = window.innerHeight;
    open.style.setProperty("--h", Math.min(1, Math.max(0, window.scrollY / (vh * 0.9))).toFixed(4));
    scenes.forEach((s) => {
      const r = s.getBoundingClientRect();
      const travel = Math.max(1, r.height - vh);
      const p = Math.min(1, Math.max(0, -r.top / (travel * 0.8)));
      s.style.setProperty("--p", p.toFixed(4));
    });
    drifts.forEach((d) => {
      const r = d.getBoundingClientRect();
      const v = ((r.top + r.height / 2) - vh / 2) / vh;
      d.style.setProperty("--d", Math.max(-1, Math.min(1, v)).toFixed(4));
    });
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  frame();

  /* pointer depth: the planet leans away from the cursor, the builder model tilts toward it */
  if (finePointer.matches) {
    const art = open.querySelector("[data-depth]");
    open.addEventListener("pointermove", (e) => {
      art.style.setProperty("--px", ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
      art.style.setProperty("--py", ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
    });
    const model = document.querySelector("[data-tilt]");
    if (model) {
      model.addEventListener("pointermove", (e) => {
        const r = model.getBoundingClientRect();
        model.style.setProperty("--tx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        model.style.setProperty("--ty", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      });
      model.addEventListener("pointerleave", () => { model.style.setProperty("--tx", 0); model.style.setProperty("--ty", 0); });
    }
  }

  /* gold dust drifting around the planet; pauses when the opening is off screen or the tab is hidden */
  const canvas = open.querySelector("[data-dust]");
  const ctx = canvas && canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0, motes = [], running = false, visible = true;
  function size() {
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
  function play() { const go = visible && !document.hidden; if (go && !running) { running = true; requestAnimationFrame(draw); } else if (!go) running = false; }
  size();
  window.addEventListener("resize", () => { size(); });
  document.addEventListener("visibilitychange", play);
  if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; play(); }).observe(open);
  play();
})();
