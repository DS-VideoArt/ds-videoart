/* ============================================================
   DS VideoArt — shared client logic
   Plain JS, no build step. Bilingual (he/en) via data-he/data-en attrs.
   ============================================================ */

const DS = {
  portfolio: [],
  posts: [],
};

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

/* ---------- scroll-in animations ---------- */

function initScrollAnimations() {
  const targets = qsa(".value-card, .card");
  if (!("IntersectionObserver" in window) || targets.length === 0) {
    targets.forEach((t) => t.classList.add("in-view"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = (Array.prototype.indexOf.call(targets, el) % 6) * 0.06;
          el.style.transitionDelay = delay + "s";
          el.classList.add("in-view");
          io.unobserve(el);
        }
      });
    },
    { threshold: 0.15 }
  );
  targets.forEach((t) => io.observe(t));
}

/* ---------- animated counters ---------- */

function initCounters() {
  const nums = qsa(".stat-number[data-target]");
  if (nums.length === 0) return;
  const animate = (el) => {
    const target = parseInt(el.dataset.target, 10) || 0;
    const duration = 1600;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString() + (el.dataset.suffix || "");
    }
    requestAnimationFrame(tick);
  };
  if (!("IntersectionObserver" in window)) {
    nums.forEach(animate);
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  nums.forEach((n) => io.observe(n));
}

/* ---------- portfolio rendering ---------- */

function portfolioCardHtml(item, lang) {
  const title = item["title_" + lang] || item.title_he;
  const desc = item["desc_" + lang] || item.desc_he;
  const cat = item["category_" + lang] || item.category_he;
  const badgeHe = "דוגמה — ממתין לתוכן אמיתי";
  const badgeEn = "Sample — awaiting real content";
  const badge = item.isPlaceholder
    ? `<span class="card-badge">${escHtml(lang === "en" ? badgeEn : badgeHe)}</span>`
    : "";
  const media = item.thumbnail
    ? `<img src="${escHtml(item.thumbnail)}" alt="${escHtml(title)}" loading="lazy">`
    : "";
  return `
    <article class="card portfolio-card" data-category="${escHtml(item.category)}" data-video="${escHtml(item.videoUrl || "")}">
      <div class="card-media ${item.thumbnail ? "" : "placeholder-media"}">
        ${badge}
        ${media}
        <div class="play-icon">▶</div>
      </div>
      <div class="card-body">
        <span class="card-cat">${escHtml(cat)}</span>
        <h3>${escHtml(title)}</h3>
        <p>${escHtml(desc)}</p>
        <div class="card-meta"><span>${escHtml(item.date || "")}</span></div>
      </div>
    </article>`;
}

function renderPortfolioGrid(container, items, activeFilter) {
  const lang = getLang();
  const filtered =
    !activeFilter || activeFilter === "all"
      ? items
      : items.filter((i) => i.category === activeFilter);
  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state" data-he="אין עדיין עבודות בקטגוריה הזו." data-en="No works in this category yet."></div>`;
    applyStaticLang(lang);
    return;
  }
  container.innerHTML = filtered.map((item) => portfolioCardHtml(item, lang)).join("");
  qsa(".portfolio-card", container).forEach((card) => {
    const url = card.dataset.video;
    if (url) card.addEventListener("click", () => openLightbox(url));
  });
  initScrollAnimations();
}

function initPortfolioGrid(gridSelector, filterRowSelector, limit) {
  const grid = qs(gridSelector);
  if (!grid) return Promise.resolve();
  return fetchJSON("portfolio.json")
    .then((data) => {
      DS.portfolio = data;
      const items = limit ? data.slice(0, limit) : data;
      renderPortfolioGrid(grid, items, "all");
      const filterRow = filterRowSelector ? qs(filterRowSelector) : null;
      if (filterRow) {
        qsa(".filter-pill", filterRow).forEach((btn) => {
          btn.addEventListener("click", () => {
            qsa(".filter-pill", filterRow).forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            renderPortfolioGrid(grid, data, btn.dataset.filter);
          });
        });
      }
      document.addEventListener("langchange", () => {
        const active = filterRow ? qs(".filter-pill.active", filterRow) : null;
        renderPortfolioGrid(grid, limit ? data.slice(0, limit) : data, active ? active.dataset.filter : "all");
      });
    })
    .catch((err) => {
      grid.innerHTML = `<div class="empty-state">Could not load portfolio.json</div>`;
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
      "position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:2000;display:flex;align-items:center;justify-content:center;padding:24px;";
    overlay.innerHTML = `<div style="width:100%;max-width:900px;aspect-ratio:16/9;position:relative;">
      <button id="dsLightboxClose" style="position:absolute;top:-40px;inset-inline-end:0;color:#fff;font-size:28px;background:none;border:none;cursor:pointer;">×</button>
      <div id="dsLightboxFrame" style="width:100%;height:100%;border-radius:16px;overflow:hidden;background:#000;"></div>
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
    <a class="card blog-card" href="post.html?id=${post.id}" data-category="${escHtml(post.category)}">
      <div class="card-media ${post.image ? "" : "placeholder-media"}">${media}</div>
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
  initScrollAnimations();
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
      document.title = (post["title_" + lang] || post.title_he) + " · DS VideoArt";
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

function initQuoteForm() {
  const form = qs("#quoteForm");
  if (!form) return;
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
  initLang();
  initNav();
  initScrollAnimations();
  initCounters();
  initQuoteForm();
  initPostPage();
});
