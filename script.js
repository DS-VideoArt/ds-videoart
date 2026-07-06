/* ============================================================
   DS VideoArt: shared client logic
   Plain JS, no build step. Bilingual (he/en) via data-he/data-en attrs.
   Motion is driven by GSAP + ScrollTrigger, loaded via CDN script tags.
   ============================================================ */

const DS = {
  portfolio: [],
  posts: [],
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- utilities ---------- */

function escHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getLang() {
  return localStorage.getItem("ds_lang") || "he";
}

function fetchJSON(path) {
  return fetch(path).then((res) => {
    if (!res.ok) throw new Error("Failed to load " + path);
    return res.json();
  });
}

function qs(sel, root) {
  return (root || document).querySelector(sel);
}

function qsa(sel, root) {
  return Array.from((root || document).querySelectorAll(sel));
}

/* ---------- language toggle ---------- */

function setLang(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  localStorage.setItem("ds_lang", lang);
  applyStaticLang(lang);
  qsa(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
}

function applyStaticLang(lang) {
  qsa("[data-he]").forEach((el) => {
    const val = lang === "en" ? el.dataset.en : el.dataset.he;
    if (val != null) el.textContent = val;
  });
  qsa("[data-he-html]").forEach((el) => {
    const val = lang === "en" ? el.dataset.enHtml : el.dataset.heHtml;
    if (val != null) el.innerHTML = val;
  });
  qsa("[data-he-placeholder]").forEach((el) => {
    const val = lang === "en" ? el.dataset.enPlaceholder : el.dataset.hePlaceholder;
    if (val != null) el.setAttribute("placeholder", val);
  });
  qsa("[data-lang-block]").forEach((el) => {
    el.classList.toggle("hidden", el.dataset.langBlock !== lang);
  });
}

function initLang() {
  const saved = getLang();
  setLang(saved);
  qsa(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.dataset.lang));
  });
}

/* ---------- navbar / mobile menu ---------- */

function initNav() {
  const toggle = qs(".hamburger");
  const menu = qs(".mobile-menu");
  if (!toggle || !menu) return;
  toggle.addEventListener("click", () => {
    menu.classList.toggle("open");
  });
  qsa("a", menu).forEach((a) =>
    a.addEventListener("click", () => menu.classList.remove("open"))
  );
}

/* ---------- GSAP scroll reveals ---------- */

function initReveals(root) {
  const items = qsa(".reveal:not([data-revealed])", root);
  if (items.length === 0) return;
  items.forEach((el) => el.setAttribute("data-revealed", "1"));

  if (prefersReducedMotion || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    items.forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    return;
  }

  gsap.set(items, { opacity: 0, y: 24 });
  ScrollTrigger.batch(items, {
    start: "top 88%",
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power2.out",
      }),
  });
}

/* ---------- film countdown intro (index.html only) ---------- */

function initCountdownIntro() {
  const overlay = qs("#countdownIntro");
  if (!overlay) return false;

  if (sessionStorage.getItem("ds_intro_played") || prefersReducedMotion || typeof gsap === "undefined") {
    overlay.remove();
    return false;
  }
  sessionStorage.setItem("ds_intro_played", "1");

  const numberEl = qs(".countdown-number", overlay);
  document.body.style.overflow = "hidden";

  const tl = gsap.timeline({
    onComplete: () => {
      overlay.remove();
      document.body.style.overflow = "";
    },
  });

  [3, 2, 1].forEach((n) => {
    tl.set(numberEl, { textContent: n, opacity: 0, scale: 1.4 })
      .to(numberEl, { opacity: 1, scale: 1, duration: 0.28, ease: "power2.out" })
      .to(numberEl, { opacity: 0, duration: 0.18 }, "+=0.32");
  });
  tl.to(overlay, { opacity: 0, duration: 0.4, ease: "power1.out" });
  return true;
}

/* ---------- kinetic hero headline ---------- */

function kineticHeroReveal(introIsPlaying) {
  const h1 = qs(".hero h1");
  if (!h1 || typeof gsap === "undefined" || prefersReducedMotion) return;
  const text = h1.textContent;
  const words = text.split(" ").filter(Boolean);
  h1.innerHTML = words
    .map((w) => `<span style="display:inline-block;will-change:transform">${escHtml(w)}</span>`)
    .join(" ");
  const spans = qsa("span", h1);
  gsap.set(spans, { opacity: 0, y: 28, rotate: 3 });
  gsap.to(spans, {
    opacity: 1,
    y: 0,
    rotate: 0,
    duration: 0.75,
    stagger: 0.06,
    ease: "power3.out",
    delay: introIsPlaying ? 1.5 : 0.15,
  });
}

/* ---------- film-strip portfolio rendering ---------- */

function frameHtml(item, lang) {
  const title = item["title_" + lang] || item.title_he;
  const desc = item["desc_" + lang] || item.desc_he;
  const cat = item["category_" + lang] || item.category_he;
  const badgeHe = "דוגמה: ממתין לתוכן אמיתי";
  const badgeEn = "Sample: awaiting real content";
  const badge = item.isPlaceholder
    ? `<span class="frame-badge">${escHtml(lang === "en" ? badgeEn : badgeHe)}</span>`
    : "";
  const media = item.thumbnail
    ? `<img src="${escHtml(item.thumbnail)}" alt="${escHtml(title)}" loading="lazy">`
    : "";
  const sprockets = Array.from({ length: 8 }).map(() => "<span></span>").join("");
  return `
    <article class="frame reveal" data-category="${escHtml(item.category)}" data-video="${escHtml(item.videoUrl || "")}">
      <div class="sprocket-row">${sprockets}</div>
      <div class="frame-media">
        ${badge}
        ${media}
        <div class="play-icon">▶</div>
      </div>
      <div class="frame-body">
        <span class="frame-cat">${escHtml(cat)}</span>
        <h3>${escHtml(title)}</h3>
        <p>${escHtml(desc)}</p>
        <div class="frame-meta">${escHtml(item.date || "")}</div>
      </div>
      <div class="sprocket-row">${sprockets}</div>
    </article>`;
}

let filmstripMarquee = null;

function stopMarquee() {
  if (filmstripMarquee) {
    filmstripMarquee.kill();
    filmstripMarquee = null;
  }
}

function startMarquee(viewport, track) {
  stopMarquee();
  if (prefersReducedMotion || typeof gsap === "undefined") return;
  const setWidth = track.scrollWidth / 2;
  if (!setWidth) return;
  const dir = document.documentElement.dir === "rtl" ? 1 : -1;
  gsap.set(track, { x: 0 });
  filmstripMarquee = gsap.to(track, {
    x: dir * -setWidth,
    duration: setWidth / 40,
    ease: "none",
    repeat: -1,
    modifiers: {
      x: (x) => `${parseFloat(x) % setWidth}px`,
    },
  });
  viewport.addEventListener("pointerenter", () => filmstripMarquee && filmstripMarquee.pause());
  viewport.addEventListener("pointerleave", () => filmstripMarquee && filmstripMarquee.resume());
}

function initDragScroll(viewport) {
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  viewport.addEventListener("pointerdown", (e) => {
    isDown = true;
    viewport.classList.add("dragging");
    startX = e.clientX;
    startScroll = viewport.scrollLeft;
  });
  window.addEventListener("pointermove", (e) => {
    if (!isDown) return;
    viewport.scrollLeft = startScroll - (e.clientX - startX);
  });
  window.addEventListener("pointerup", () => {
    isDown = false;
    viewport.classList.remove("dragging");
  });
}

function initArrows(wrap, viewport) {
  if (!wrap) return;
  const prev = qs(".filmstrip-prev", wrap);
  const next = qs(".filmstrip-next", wrap);
  if (prev) prev.addEventListener("click", () => viewport.scrollBy({ left: -viewport.clientWidth * 0.85, behavior: "smooth" }));
  if (next) next.addEventListener("click", () => viewport.scrollBy({ left: viewport.clientWidth * 0.85, behavior: "smooth" }));
}

function renderFilmstrip(viewport, items, activeFilter, autoplay) {
  const lang = getLang();
  const filtered =
    !activeFilter || activeFilter === "all"
      ? items
      : items.filter((i) => i.category === activeFilter);
  const track = qs(".filmstrip-track", viewport) || viewport;
  stopMarquee();
  if (filtered.length === 0) {
    track.innerHTML = `<div class="empty-state" data-he="אין עדיין עבודות בקטגוריה הזו." data-en="No works in this category yet."></div>`;
    applyStaticLang(lang);
    return;
  }
  const html = filtered.map((item) => frameHtml(item, lang)).join("");
  track.innerHTML = autoplay ? html + html : html;
  qsa(".frame", track).forEach((card) => {
    const url = card.dataset.video;
    if (url) qs(".frame-media", card).addEventListener("click", () => openLightbox(url));
  });
  initReveals(track);
  if (autoplay) {
    requestAnimationFrame(() => startMarquee(viewport, track));
  }
}

function initFilmstrip(viewportSelector, filterRowSelector, limit, options) {
  const autoplay = !!(options && options.autoplay);
  const viewport = qs(viewportSelector);
  if (!viewport) return Promise.resolve();
  const wrap = viewport.closest(".filmstrip-wrap");
  if (!autoplay) {
    initDragScroll(viewport);
    initArrows(wrap, viewport);
  }
  return fetchJSON("portfolio.json")
    .then((data) => {
      DS.portfolio = data;
      const items = limit ? data.slice(0, limit) : data;
      renderFilmstrip(viewport, items, "all", autoplay);
      const filterRow = filterRowSelector ? qs(filterRowSelector) : null;
      if (filterRow) {
        qsa(".filter-pill", filterRow).forEach((btn) => {
          btn.addEventListener("click", () => {
            qsa(".filter-pill", filterRow).forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            renderFilmstrip(viewport, data, btn.dataset.filter, autoplay);
          });
        });
      }
      document.addEventListener("langchange", () => {
        const active = filterRow ? qs(".filter-pill.active", filterRow) : null;
        renderFilmstrip(viewport, limit ? data.slice(0, limit) : data, active ? active.dataset.filter : "all", autoplay);
      });
    })
    .catch((err) => {
      viewport.innerHTML = `<div class="empty-state">Could not load portfolio.json</div>`;
      console.error(err);
    });
}

/* ---------- lightbox for video embeds ---------- */

function isLocalVideoFile(url) {
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(url);
}

function openLightbox(url) {
  let overlay = qs("#dsLightbox");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "dsLightbox";
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:2000;display:flex;align-items:center;justify-content:center;padding:24px;";
    overlay.innerHTML = `<div style="width:100%;max-width:900px;aspect-ratio:16/9;position:relative;">
      <button id="dsLightboxClose" style="position:absolute;top:-40px;inset-inline-end:0;color:#f2f1ee;font-size:28px;background:none;border:none;cursor:pointer;">×</button>
      <div id="dsLightboxFrame" style="width:100%;height:100%;border-radius:10px;overflow:hidden;background:#000;"></div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeLightbox();
    });
    qs("#dsLightboxClose", overlay).addEventListener("click", closeLightbox);
  }
  const frame = qs("#dsLightboxFrame", overlay);
  if (isLocalVideoFile(url)) {
    frame.innerHTML = `<video src="${escHtml(url)}" style="width:100%;height:100%;object-fit:contain;" controls autoplay playsinline></video>`;
  } else {
    frame.innerHTML = `<iframe src="${escHtml(url)}" style="width:100%;height:100%;border:0;" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
  }
  overlay.style.display = "flex";
}

function closeLightbox() {
  const overlay = qs("#dsLightbox");
  if (overlay) {
    overlay.style.display = "none";
    qs("#dsLightboxFrame", overlay).innerHTML = "";
  }
}

/* ---------- blog rendering ---------- */

function blogCardHtml(post, lang) {
  const title = post["title_" + lang] || post.title_he;
  const excerpt = post["excerpt_" + lang] || post.excerpt_he;
  const cat = post["category_" + lang] || post.category_he;
  const media = post.image
    ? `<img src="${escHtml(post.image)}" alt="${escHtml(title)}" loading="lazy">`
    : "";
  return `
    <a class="card blog-card reveal" href="post.html?id=${post.id}" data-category="${escHtml(post.category)}">
      <div class="card-media">${media}</div>
      <div class="card-body">
        <span class="card-cat">${escHtml(cat)}</span>
        <h3>${escHtml(title)}</h3>
        <p>${escHtml(excerpt)}</p>
        <div class="card-meta">
          <span>${escHtml(post.author || "")}</span>
          <span>${escHtml(post.date || "")}</span>
        </div>
      </div>
    </a>`;
}

function renderBlogGrid(container, items, activeFilter) {
  const lang = getLang();
  const filtered =
    !activeFilter || activeFilter === "all"
      ? items
      : items.filter((i) => i.category === activeFilter);
  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state" data-he="אין עדיין פוסטים בקטגוריה הזו." data-en="No posts in this category yet."></div>`;
    applyStaticLang(lang);
    return;
  }
  container.innerHTML = filtered
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((post) => blogCardHtml(post, lang))
    .join("");
  initReveals(container);
}

function initBlogGrid(gridSelector, filterRowSelector, limit) {
  const grid = qs(gridSelector);
  if (!grid) return Promise.resolve();
  return fetchJSON("posts.json")
    .then((data) => {
      DS.posts = data;
      const sorted = data.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
      const items = limit ? sorted.slice(0, limit) : sorted;
      renderBlogGrid(grid, items, "all");
      const filterRow = filterRowSelector ? qs(filterRowSelector) : null;
      if (filterRow) {
        qsa(".filter-pill", filterRow).forEach((btn) => {
          btn.addEventListener("click", () => {
            qsa(".filter-pill", filterRow).forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            renderBlogGrid(grid, data, btn.dataset.filter);
          });
        });
      }
      document.addEventListener("langchange", () => {
        const active = filterRow ? qs(".filter-pill.active", filterRow) : null;
        renderBlogGrid(grid, limit ? sorted.slice(0, limit) : sorted, active ? active.dataset.filter : "all");
      });
    })
    .catch((err) => {
      grid.innerHTML = `<div class="empty-state">Could not load posts.json</div>`;
      console.error(err);
    });
}

/* ---------- single post page ---------- */

function renderPostContent(post) {
  const lang = getLang();
  qsa("[data-post-field]").forEach((el) => {
    const field = el.dataset.postField;
    if (field === "body") {
      el.innerHTML = post["body_" + lang] || post.body_he;
    } else if (field === "title") {
      el.textContent = post["title_" + lang] || post.title_he;
      document.title = (post["title_" + lang] || post.title_he) + " - DS VideoArt";
    } else if (field === "category") {
      el.textContent = post["category_" + lang] || post.category_he;
    } else if (field === "author") {
      el.textContent = post.author || "";
    } else if (field === "date") {
      el.textContent = post.date || "";
    }
  });
  const cover = qs("[data-post-cover]");
  if (cover) {
    if (post.image) {
      cover.innerHTML = `<img src="${escHtml(post.image)}" alt="">`;
      cover.classList.remove("hidden");
    } else {
      cover.classList.add("hidden");
    }
  }
}

function initPostPage() {
  const container = qs("[data-post-field]");
  if (!container) return;
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"), 10);
  fetchJSON("posts.json")
    .then((data) => {
      DS.posts = data;
      const post = data.find((p) => p.id === id) || data[0];
      if (!post) return;
      renderPostContent(post);
      document.addEventListener("langchange", () => renderPostContent(post));

      const relatedGrid = qs("#relatedPosts");
      if (relatedGrid) {
        const related = data.filter((p) => p.id !== post.id).slice(0, 3);
        renderBlogGrid(relatedGrid, related, "all");
        document.addEventListener("langchange", () => renderBlogGrid(relatedGrid, related, "all"));
      }
    })
    .catch((err) => console.error(err));
}

/* ---------- contact / quote form ---------- */

function prefillTierFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const tier = params.get("tier");
  if (!tier) return;
  const tierField = qs("#tierField");
  if (tierField) tierField.value = tier;
  const projectType = qs("#projectTypeField");
  if (projectType) projectType.value = "website";
}

function initQuoteForm() {
  const form = qs("#quoteForm");
  if (!form) return;
  prefillTierFromQuery();
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(data).toString(),
    })
      .then(() => showQuoteSuccess())
      .catch(() => showQuoteSuccess());
  });
}

function showQuoteSuccess() {
  const form = qs("#quoteForm");
  const success = qs("#quoteSuccess");
  if (form) form.style.display = "none";
  if (success) success.style.display = "block";
}

/* ---------- hash scrolling ---------- */

function scrollToHash() {
  if (!window.location.hash) return;
  const target = qs(window.location.hash);
  if (!target) return;
  const prevBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = "auto";
  target.scrollIntoView({ block: "start" });
  document.documentElement.style.scrollBehavior = prevBehavior;
}

/* ---------- boot ---------- */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }
  initLang();
  initNav();
  const introIsPlaying = initCountdownIntro();
  kineticHeroReveal(introIsPlaying);
  initReveals();
  initQuoteForm();
  initPostPage();
});
