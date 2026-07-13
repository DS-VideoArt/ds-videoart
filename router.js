/* ============================================================
   DS VideoArt: room-transition router
   A small fetch/DOMParser navigation engine that swaps the shared
   #view region between real, independently-loadable .html pages,
   with a GSAP-driven "camera through a film gate" transition.
   No build step, no framework. Table-driven, 8 known destinations.

   Depends on globals defined in script.js: qs, qsa, escHtml,
   getLang, onLangChange, addPageListener, clearLangChangeHandlers,
   initReveals, initFilmstrip, initBlogGrid, initPostPage,
   initQuoteForm, kineticHeroReveal, initCountdownIntro, scrollToHash,
   prefersReducedMotion. On showcase.html, also depends on
   initShowcasePage (showcase.js).
   ============================================================ */

/* ---------- per-page-type body-level extras outside #view ---------- */

const PAGE_EXTRAS = {
  showcase: ["#showcaseDock", "#demoShiftTag"],
};

/* ---------- per-page-type extra scripts, lazy-loaded once on first router visit ---------- */

const PAGE_SCRIPTS = {
  showcase: ["showcase.js"],
};

const loadedScripts = new Set();

function ensurePageScripts(pageKey) {
  const scripts = PAGE_SCRIPTS[pageKey];
  if (!scripts) return Promise.resolve();
  return Promise.all(
    scripts.map((src) => {
      if (loadedScripts.has(src)) return Promise.resolve();
      if (document.querySelector('script[src="' + src + '"]')) {
        loadedScripts.add(src);
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        const el = document.createElement("script");
        el.src = src;
        el.onload = () => {
          loadedScripts.add(src);
          resolve();
        };
        el.onerror = () => reject(new Error("Failed to load " + src));
        document.body.appendChild(el);
      });
    })
  );
}

/* ---------- light-leak flash color per destination category ---------- */

const CATEGORY_FLASH = {
  home: "var(--accent)",
  portfolio: "var(--leak-magenta)",
  blog: "var(--leak-teal)",
  post: "var(--leak-teal)",
  showcase: "var(--leak-amber)",
  legal: "var(--accent)",
};

/* ---------- mount functions: called on cold load AND on every router arrival ---------- */

function mountHome(opts) {
  const coldLoad = !!(opts && opts.coldLoad);
  const introIsPlaying = coldLoad ? initCountdownIntro() : false;
  kineticHeroReveal(introIsPlaying);
  initQuoteForm();
  initReveals();
  const ready = Promise.all([
    initFilmstrip("#homePortfolioStrip", null, 6, { autoplay: true }),
    initBlogGrid("#homeBlogGrid", null, 3),
  ]);
  Promise.all([ready, document.fonts ? document.fonts.ready : Promise.resolve()]).then(scrollToHash);
  return ready;
}

function mountPortfolio() {
  initReveals();
  return initFilmstrip("#portfolioStrip", "#portfolioFilters");
}

function mountBlog() {
  initReveals();
  return initBlogGrid("#blogGrid", "#blogFilters");
}

function mountPost() {
  initPostPage();
  initReveals();
  return Promise.resolve();
}

function mountShowcase() {
  initReveals();
  return typeof initShowcasePage === "function" ? initShowcasePage() : Promise.resolve();
}

function mountLegal() {
  initReveals();
  return Promise.resolve();
}

const PAGE_INIT = {
  home: mountHome,
  portfolio: mountPortfolio,
  blog: mountBlog,
  post: mountPost,
  showcase: mountShowcase,
  legal: mountLegal,
};

/* ---------- nav sync ---------- */

function syncActiveNav() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  qsa(".nav-links a, .mobile-menu a, .footer-col a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    const hrefPath = href.split("#")[0].split("?")[0] || "index.html";
    a.classList.toggle("active", hrefPath === path);
  });
}

/* ---------- body-level extras (elements outside #view, e.g. showcase dock) ---------- */

function applyExtras(pageKey, parsedDoc) {
  const selectors = PAGE_EXTRAS[pageKey];
  if (!selectors) return;
  selectors.forEach((sel) => {
    if (qs(sel)) return;
    const src = parsedDoc.querySelector(sel);
    if (src) document.body.appendChild(document.importNode(src, true));
  });
}

function removeExtras(pageKey) {
  const selectors = PAGE_EXTRAS[pageKey];
  if (!selectors) return;
  selectors.forEach((sel) => {
    const el = qs(sel);
    if (el) el.remove();
  });
}

/* ---------- the film-gate shutter ---------- */

function sprocketRail() {
  return `<div class="sprocket-row">${Array.from({ length: 10 })
    .map(() => "<span></span>")
    .join("")}</div>`;
}

function ensureShutter() {
  let shutter = qs("#roomShutter");
  if (shutter) return shutter;
  shutter = document.createElement("div");
  shutter.id = "roomShutter";
  shutter.innerHTML = `
    <div class="rt-panel rt-panel-a">${sprocketRail()}</div>
    <div class="rt-flash"></div>
    <div class="rt-panel rt-panel-b">${sprocketRail()}</div>
  `;
  document.body.appendChild(shutter);
  return shutter;
}

/**
 * Plays the "lunge forward, gate closes" half of the transition.
 * Resolves once the screen is fully covered, with a function to call
 * once the new DOM is in place to play the "arrive in the room" half.
 */
function closeGate(view, flashColor) {
  const shutter = ensureShutter();
  const panelA = qs(".rt-panel-a", shutter);
  const panelB = qs(".rt-panel-b", shutter);
  const flash = qs(".rt-flash", shutter);
  shutter.classList.add("active");

  if (prefersReducedMotion || typeof gsap === "undefined") {
    shutter.style.opacity = "1";
    return Promise.resolve(() => {
      shutter.style.opacity = "0";
      return new Promise((resolve) => setTimeout(() => {
        shutter.classList.remove("active");
        resolve();
      }, 150));
    });
  }

  flash.style.background = flashColor;

  return new Promise((resolveClosed) => {
    gsap
      .timeline({ onComplete: resolveClosed, defaults: { transformPerspective: 1200, transformOrigin: "50% 50%" } })
      .to(view, { scale: 1.22, z: 140, filter: "brightness(0.55) blur(7px)", duration: 0.35, ease: "power2.in" }, 0)
      .fromTo(panelA, { yPercent: -100 }, { yPercent: 0, duration: 0.35, ease: "power2.in" }, 0)
      .fromTo(panelB, { yPercent: 100 }, { yPercent: 0, duration: 0.35, ease: "power2.in" }, 0)
      .to(flash, { opacity: 1, duration: 0.09 }, 0.28)
      .to(flash, { opacity: 0, duration: 0.13 }, 0.4);
  }).then(() => (view) => openGate(view, shutter, panelA, panelB));
}

function openGate(view, shutter, panelA, panelB) {
  if (prefersReducedMotion || typeof gsap === "undefined") {
    return new Promise((resolve) =>
      setTimeout(() => {
        shutter.classList.remove("active");
        shutter.style.opacity = "0";
        resolve();
      }, 150)
    );
  }
  gsap.set(view, { scale: 0.9, z: -180, opacity: 0, filter: "blur(5px)" });
  return new Promise((resolveOpen) => {
    gsap
      .timeline({
        defaults: { transformPerspective: 1200, transformOrigin: "50% 50%" },
        onComplete: () => {
          shutter.classList.remove("active");
          resolveOpen();
        },
      })
      .to(panelA, { yPercent: -100, duration: 0.42, ease: "power3.out" }, 0)
      .to(panelB, { yPercent: 100, duration: 0.42, ease: "power3.out" }, 0)
      .to(view, { scale: 1, z: 0, opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power3.out" }, 0.05);
  });
}

/* ---------- navigation engine ---------- */

const responseCache = new Map();
let currentPageKey = null;
let transitionInFlight = false;

function fetchPage(path) {
  if (responseCache.has(path)) return Promise.resolve(responseCache.get(path));
  return fetch(path)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch " + path);
      return res.text();
    })
    .then((html) => {
      responseCache.set(path, html);
      return html;
    });
}

function navigateTo(url, opts) {
  const push = !opts || opts.push !== false;
  const hashIndex = url.indexOf("#");
  const path = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : url.slice(hashIndex);

  return fetchPage(path || "index.html")
    .then((html) => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const newView = doc.querySelector("#view");
      const view = qs("#view");
      if (!newView || !view) {
        window.location.href = url;
        return;
      }
      const newPageKey = newView.dataset.page;
      const flashColor = CATEGORY_FLASH[newPageKey] || "var(--accent)";

      return closeGate(view, flashColor).then((finishOpen) => {
        if (currentPageKey && currentPageKey !== newPageKey) removeExtras(currentPageKey);
        view.innerHTML = newView.innerHTML;
        view.dataset.page = newPageKey;
        applyExtras(newPageKey, doc);

        const newTitle = doc.querySelector("title");
        if (newTitle) document.title = newTitle.textContent;
        const newDesc = doc.querySelector('meta[name="description"]');
        const curDesc = qs('meta[name="description"]');
        if (newDesc && curDesc) curDesc.setAttribute("content", newDesc.getAttribute("content") || "");

        if (push) history.pushState({ url }, "", url);
        currentPageKey = newPageKey;
        syncActiveNav();
        clearLangChangeHandlers();

        const mount = PAGE_INIT[newPageKey] || (() => Promise.resolve());
        ensurePageScripts(newPageKey)
          .then(() => mount({ coldLoad: false }))
          .catch((err) => console.error(err));

        return finishOpen(view).then(() => {
          if (hash) scrollToHash();
        });
      });
    })
    .catch((err) => {
      console.error(err);
      window.location.href = url;
    });
}

function isRoutableLink(a) {
  if (!a) return false;
  if (a.target === "_blank" || a.hasAttribute("download") || a.dataset.noRouter != null) return false;
  const href = a.getAttribute("href");
  if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  if (a.origin !== window.location.origin) return false;
  return true;
}

function initRouterNav() {
  document.body.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest("a[href]");
    if (!isRoutableLink(a)) return;

    const href = a.getAttribute("href");
    const hashIndex = href.indexOf("#");
    const targetPath = hashIndex === -1 ? href : href.slice(0, hashIndex);
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const resolvedTarget = targetPath || currentPath;

    if (resolvedTarget === currentPath && hashIndex !== -1) {
      return; // same-page anchor: let the normal click + scrollToHash-on-hashchange behavior happen
    }

    e.preventDefault();
    if (transitionInFlight) return;
    transitionInFlight = true;
    Promise.resolve(navigateTo(href)).finally(() => {
      transitionInFlight = false;
    });
  });

  window.addEventListener("popstate", () => {
    if (transitionInFlight) return;
    transitionInFlight = true;
    Promise.resolve(navigateTo(window.location.pathname + window.location.hash, { push: false })).finally(() => {
      transitionInFlight = false;
    });
  });

  window.addEventListener("hashchange", () => {
    scrollToHash();
  });
}

function bootRouter() {
  const view = qs("#view");
  currentPageKey = view ? view.dataset.page : null;
  const mount = view ? PAGE_INIT[currentPageKey] : null;
  if (mount) mount({ coldLoad: true });
  initRouterNav();
}
