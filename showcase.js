/* ============================================================
   DS VideoArt: Showcase engine
   Tier = structure (which sections appear). Style = live skin swap
   ([data-style] on #demoStage, read by showcase.css as --sx-* vars).
   Picking a tier plays a live build sequence: a build-console HUD
   scrolls through each section while it "materializes" from a
   blueprint outline into full content.
   Reuses script.js utilities: escHtml, getLang, qs, qsa, fetchJSON,
   applyStaticLang, initReveals.
   ============================================================ */

const SX = {
  data: null,
  tierId: null,
  styleId: "bold",
  buildToken: 0,
  skipRequested: false,
};

let pickerIntroPlayed = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tweenPromise(target, vars) {
  return new Promise((resolve) => {
    if (typeof gsap === "undefined") {
      resolve();
      return;
    }
    gsap.to(target, Object.assign({}, vars, { onComplete: resolve }));
  });
}

/* ---------- section template functions ---------- */

function sxHero(s, lang) {
  const title = s["title_" + lang] || s.title_he;
  const subtitle = s["subtitle_" + lang] || s.subtitle_he;
  const cta = s["primaryCta_" + lang] || s.primaryCta_he;
  return `
    <section class="sx-hero">
      <div class="container sx-hero-inner">
        <h2>${escHtml(title)}</h2>
        <p>${escHtml(subtitle)}</p>
        <a href="#tierPicker" class="sx-btn dock-quote-trigger">${escHtml(cta)}</a>
      </div>
    </section>`;
}

function sxHeroVideo(s, lang) {
  const title = s["title_" + lang] || s.title_he;
  const subtitle = s["subtitle_" + lang] || s.subtitle_he;
  const cta = s["primaryCta_" + lang] || s.primaryCta_he;
  const video = s.videoUrl
    ? `<video src="${escHtml(s.videoUrl)}" autoplay muted loop playsinline></video>`
    : "";
  return `
    <section class="sx-hero-video">
      ${video}
      <div class="container sx-hero-inner">
        <h2>${escHtml(title)}</h2>
        <p>${escHtml(subtitle)}</p>
        <a href="#tierPicker" class="sx-btn dock-quote-trigger">${escHtml(cta)}</a>
      </div>
    </section>`;
}

function sxPricingBreakdown(s, lang, tier) {
  const price = tier["priceRange_" + lang] || tier.priceRange_he;
  const rationale = tier["priceRationale_" + lang] || tier.priceRationale_he;
  const heading = lang === "en" ? "Why this price" : "למה המחיר ככה";
  const rows = (tier.priceBreakdown || [])
    .map(
      (row) => `
      <div class="sx-pricing-row">
        <span>${escHtml(row["label_" + lang] || row.label_he)}</span>
        <span class="amt">${escHtml(row["amount_" + lang] || row.amount_he)}</span>
      </div>`
    )
    .join("");
  return `
    <section class="sx-alt">
      <div class="container">
        <div class="sx-pricing">
          <div class="sx-pricing-head">
            <span class="price">${escHtml(price)}</span>
            <h3>${escHtml(heading)}</h3>
          </div>
          <div class="sx-pricing-rows">${rows}</div>
          <p class="sx-pricing-note">${escHtml(rationale)}</p>
        </div>
      </div>
    </section>`;
}

function sxCtaStrip(s, lang) {
  const headline = s["headline_" + lang] || s.headline_he;
  const button = s["button_" + lang] || s.button_he;
  return `
    <section class="sx-cta-strip sx-alt">
      <div class="container">
        <h3>${escHtml(headline)}</h3>
        <a href="#tierPicker" class="sx-btn">${escHtml(button)}</a>
      </div>
    </section>`;
}

function sxServices(s, lang) {
  const title = s["title_" + lang] || s.title_he;
  const items = (s.items || [])
    .map(
      (it) => `
      <div class="sx-service-card">
        <h4>${escHtml(it["title_" + lang] || it.title_he)}</h4>
        <p>${escHtml(it["desc_" + lang] || it.desc_he)}</p>
      </div>`
    )
    .join("");
  return `
    <section>
      <div class="container">
        <div class="sx-section-head"><h3>${escHtml(title)}</h3></div>
        <div class="sx-services-grid">${items}</div>
      </div>
    </section>`;
}

function sxAbout(s, lang) {
  const title = s["title_" + lang] || s.title_he;
  const text = s["text_" + lang] || s.text_he;
  return `
    <section class="sx-alt">
      <div class="container">
        <div class="sx-about">
          <h3>${escHtml(title)}</h3>
          <p>${escHtml(text)}</p>
        </div>
      </div>
    </section>`;
}

function sxGallery(s, lang) {
  const title = s["title_" + lang] || s.title_he;
  const subtitle = s["subtitle_" + lang] || s.subtitle_he;
  const tiles = (s.items || [])
    .map((it) => `<div class="sx-gallery-tile">${escHtml(it["label_" + lang] || it.label_he)}</div>`)
    .join("");
  return `
    <section>
      <div class="container">
        <div class="sx-section-head"><h3>${escHtml(title)}</h3><p>${escHtml(subtitle)}</p></div>
        <div class="sx-gallery-grid">${tiles}</div>
      </div>
    </section>`;
}

function sxTestimonials(s, lang) {
  const title = s["title_" + lang] || s.title_he;
  const items = (s.items || [])
    .map(
      (it) => `
      <div class="sx-quote">
        <p class="q">"${escHtml(it["quote_" + lang] || it.quote_he)}"</p>
        <div class="author">${escHtml(it["author_" + lang] || it.author_he)}, ${escHtml(it["role_" + lang] || it.role_he)}</div>
      </div>`
    )
    .join("");
  return `
    <section class="sx-alt">
      <div class="container">
        <div class="sx-section-head"><h3>${escHtml(title)}</h3></div>
        <div class="sx-testimonials-grid">${items}</div>
      </div>
    </section>`;
}

function sxPortfolioEmbed(s, lang) {
  const title = s["title_" + lang] || s.title_he;
  const subtitle = s["subtitle_" + lang] || s.subtitle_he;
  const labels = lang === "en" ? ["Ad", "Creative", "Product", "Social"] : ["פרסומת", "יצירתי", "מוצר", "רשתות"];
  const tiles = labels.map((l) => `<div class="sx-embed-tile">${escHtml(l)}</div>`).join("");
  return `
    <section>
      <div class="container">
        <div class="sx-section-head"><h3>${escHtml(title)}</h3><p>${escHtml(subtitle)}</p></div>
        <div class="sx-embed-strip">${tiles}</div>
      </div>
    </section>`;
}

function sxVideoBanner(s, lang) {
  const title = s["title_" + lang] || s.title_he;
  const text = s["text_" + lang] || s.text_he;
  const cta = s["cta_" + lang] || s.cta_he;
  return `
    <section class="sx-alt">
      <div class="container">
        <div class="sx-video-banner">
          <h3>${escHtml(title)}</h3>
          <p>${escHtml(text)}</p>
          <a href="portfolio.html" class="sx-btn">${escHtml(cta)}</a>
        </div>
      </div>
    </section>`;
}

function sxContactMini(s, lang, tier) {
  const title = s["title_" + lang] || s.title_he;
  const subtitle = s["subtitle_" + lang] || s.subtitle_he;
  const button = s["button_" + lang] || s.button_he;
  return `
    <section>
      <div class="container">
        <div class="sx-contact-mini">
          <h3>${escHtml(title)}</h3>
          <p>${escHtml(subtitle)}</p>
          <a href="index.html?tier=${escHtml(tier.id)}#contact" class="sx-btn">${escHtml(button)}</a>
        </div>
      </div>
    </section>`;
}

const SECTION_RENDERERS = {
  hero: sxHero,
  "hero-video": sxHeroVideo,
  "pricing-breakdown": sxPricingBreakdown,
  "cta-strip": sxCtaStrip,
  services: sxServices,
  about: sxAbout,
  gallery: sxGallery,
  testimonials: sxTestimonials,
  "portfolio-embed": sxPortfolioEmbed,
  "video-banner": sxVideoBanner,
  "contact-mini": sxContactMini,
};

const SECTION_LABELS = {
  hero: { he: "הכותרת הראשית", en: "the hero section" },
  "hero-video": { he: "הכותרת הראשית עם הווידאו", en: "the video hero" },
  "pricing-breakdown": { he: "פירוט התמחור", en: "the pricing breakdown" },
  "cta-strip": { he: "פס הקריאה לפעולה", en: "the call-to-action strip" },
  services: { he: "מקטע השירותים", en: "the services section" },
  about: { he: "מקטע האודות", en: "the about section" },
  gallery: { he: "הגלריה", en: "the gallery" },
  testimonials: { he: "ההמלצות", en: "the testimonials" },
  "portfolio-embed": { he: "תיק העבודות המוטמע", en: "the embedded portfolio" },
  "video-banner": { he: "באנר הווידאו", en: "the video banner" },
  "contact-mini": { he: "טופס יצירת הקשר", en: "the contact section" },
};

function sectionLabel(type, lang) {
  const l = SECTION_LABELS[type] || { he: type, en: type };
  return lang === "en" ? l.en : l.he;
}

/* ---------- tier picker ---------- */

function tierCardHtml(tier, lang) {
  const includes = (tier["includes_" + lang] || tier.includes_he)
    .map((i) => `<li>${escHtml(i)}</li>`)
    .join("");
  const notIncludes = tier["notIncludes_" + lang] || tier.notIncludes_he;
  const priceRange = tier["priceRange_" + lang] || tier.priceRange_he;
  const openLabel = lang === "en" ? "See a live demo" : "ראו דוגמה חיה";
  return `
    <div class="tier-card">
      <h3>${escHtml(tier["name_" + lang] || tier.name_he)}</h3>
      <div class="tier-price">${escHtml(priceRange)}</div>
      <div class="tier-tagline">${escHtml(tier["tagline_" + lang] || tier.tagline_he)}</div>
      <ul class="tier-includes">${includes}</ul>
      <div class="tier-not-includes">${escHtml(notIncludes)}</div>
      <button class="btn btn-primary tier-select-btn" data-tier="${escHtml(tier.id)}">${escHtml(openLabel)}</button>
    </div>`;
}

function renderTierPicker() {
  const grid = document.getElementById("tierGrid");
  const lang = getLang();
  grid.innerHTML = SX.data.tiers.map((t) => tierCardHtml(t, lang)).join("");
  qsa(".tier-select-btn", grid).forEach((btn) => {
    btn.addEventListener("click", () => openTier(btn.dataset.tier, true));
  });
  playPickerIntro();
}

function playPickerIntro() {
  if (prefersReducedMotion || typeof gsap === "undefined") return;
  const heading = document.getElementById("pickerHeading");
  const sub = document.getElementById("pickerSubheading");
  const cards = qsa(".tier-card");
  if (!pickerIntroPlayed) {
    pickerIntroPlayed = true;
    gsap.from([heading, sub], { opacity: 0, y: 24, duration: 0.7, stagger: 0.12, ease: "power2.out" });
    gsap.from(cards, { opacity: 0, y: 24, scale: 0.97, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.2 });
  } else {
    gsap.set(cards, { opacity: 1, y: 0, scale: 1 });
  }
}

/* ---------- demo stage ---------- */

function getTier(id) {
  return SX.data.tiers.find((t) => t.id === id);
}

function mountStage(tier, lang) {
  const stage = document.getElementById("demoStage");
  const html = tier.sections
    .map((s) => (SECTION_RENDERERS[s.type] ? SECTION_RENDERERS[s.type](s, lang, tier) : ""))
    .join("");
  stage.innerHTML = html;
  stage.dataset.style = SX.styleId;
  qsa(".dock-quote-trigger", stage).forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("dockQuoteBtn").click();
    });
  });
  return qsa("section", stage);
}

function addLogLine(logEl, text, done) {
  const line = document.createElement("div");
  line.className = "build-log-line" + (done ? " done" : "");
  line.textContent = text;
  logEl.prepend(line);
  while (logEl.children.length > 5) logEl.removeChild(logEl.lastChild);
  return line;
}

function markLineDone(line) {
  if (!line) return;
  line.classList.add("done");
  const chk = document.createElement("span");
  chk.className = "chk";
  chk.textContent = "✓";
  line.appendChild(chk);
}

function playMaterializeFlash(sectionEl) {
  if (prefersReducedMotion || typeof gsap === "undefined") return;
  const flash = document.createElement("div");
  flash.className = "sx-materialize-flash";
  sectionEl.style.position = "relative";
  sectionEl.appendChild(flash);
  gsap.fromTo(
    flash,
    { y: "-100%" },
    { y: "100%", duration: 0.6, ease: "power1.inOut", onComplete: () => flash.remove() }
  );
}

async function playBuildSequence(tier, lang, sectionEls) {
  const myToken = ++SX.buildToken;
  SX.skipRequested = false;
  const consoleEl = document.getElementById("buildConsole");
  const bar = document.getElementById("buildProgressBar");
  const log = document.getElementById("buildLog");
  const title = document.getElementById("buildConsoleTitle");

  title.textContent =
    lang === "en"
      ? `Building: ${tier.name_en}`
      : `בונים את הרמה: ${tier.name_he}`;
  log.innerHTML = "";
  bar.style.width = "0%";
  consoleEl.classList.remove("hidden");

  if (typeof gsap !== "undefined") {
    gsap.set(sectionEls, { opacity: 0, scale: 0.95, filter: "blur(6px)" });
  }
  sectionEls.forEach((el) => el.classList.add("sx-building-outline"));

  const total = sectionEls.length;
  for (let i = 0; i < total; i++) {
    if (SX.buildToken !== myToken) return;
    const el = sectionEls[i];
    const label = sectionLabel(tier.sections[i].type, lang);
    const line = addLogLine(log, lang === "en" ? `Building ${label}...` : `בונה את ${label}...`, false);

    if (!SX.skipRequested && !prefersReducedMotion) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      await sleep(420);
    }
    if (SX.buildToken !== myToken) return;

    el.classList.remove("sx-building-outline");
    await tweenPromise(el, {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      duration: SX.skipRequested || prefersReducedMotion ? 0.15 : 0.5,
      ease: "power2.out",
    });
    if (!prefersReducedMotion) playMaterializeFlash(el);
    markLineDone(line);
    bar.style.width = Math.round(((i + 1) / total) * 100) + "%";
    if (SX.buildToken !== myToken) return;
    await sleep(SX.skipRequested ? 40 : 180);
  }

  addLogLine(log, lang === "en" ? "Site ready" : "האתר מוכן", true);
  bar.style.width = "100%";
  await sleep(700);
  if (SX.buildToken !== myToken) return;
  consoleEl.classList.add("hidden");
}

function skipBuild() {
  SX.buildToken++;
  SX.skipRequested = true;
  const stage = document.getElementById("demoStage");
  const sectionEls = qsa("section", stage);
  if (typeof gsap !== "undefined") {
    gsap.set(sectionEls, { opacity: 1, scale: 1, filter: "none" });
  }
  sectionEls.forEach((el) => {
    el.classList.remove("sx-building-outline");
    const flash = qs(".sx-materialize-flash", el);
    if (flash) flash.remove();
  });
  document.getElementById("buildProgressBar").style.width = "100%";
  document.getElementById("buildConsole").classList.add("hidden");
}

async function mountAndBuild(tier, lang, animate) {
  const sectionEls = mountStage(tier, lang);
  if (!animate || prefersReducedMotion || typeof gsap === "undefined") {
    if (typeof gsap !== "undefined") gsap.set(sectionEls, { opacity: 1, scale: 1, filter: "none" });
    document.getElementById("buildConsole").classList.add("hidden");
    return;
  }
  await playBuildSequence(tier, lang, sectionEls);
}

function updateDock() {
  const lang = getLang();
  const dockTiers = document.getElementById("dockTiers");
  dockTiers.innerHTML = SX.data.tiers
    .map(
      (t) =>
        `<button class="dock-tier-btn${t.id === SX.tierId ? " active" : ""}" data-tier="${escHtml(t.id)}">${escHtml(t["name_" + lang] || t.name_he)}</button>`
    )
    .join("");
  qsa(".dock-tier-btn", dockTiers).forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.tier !== SX.tierId) openTier(btn.dataset.tier, true);
    });
  });

  const dockStyles = document.getElementById("dockStyles");
  dockStyles.innerHTML = SX.data.styles
    .map(
      (st) =>
        `<button class="dock-style-dot${st.id === SX.styleId ? " active" : ""}" data-style="${escHtml(st.id)}" title="${escHtml(st["name_" + lang] || st.name_he)}"></button>`
    )
    .join("");
  qsa(".dock-style-dot", dockStyles).forEach((btn) => {
    btn.addEventListener("click", () => selectStyle(btn.dataset.style));
  });

  const quoteBtn = document.getElementById("dockQuoteBtn");
  quoteBtn.setAttribute("href", `index.html?tier=${encodeURIComponent(SX.tierId)}#contact`);
}

function selectStyle(styleId) {
  SX.styleId = styleId;
  const stage = document.getElementById("demoStage");
  stage.dataset.style = styleId;
  updateDock();
  const style = SX.data.styles.find((s) => s.id === styleId);
  const lang = getLang();
  const note = style && (style["note_" + lang] || style.note_he);
  const noteEl = ensureStyleNote();
  noteEl.textContent = note || "";
}

function ensureStyleNote() {
  let note = document.getElementById("styleNote");
  if (!note) {
    note = document.createElement("p");
    note.id = "styleNote";
    note.className = "style-note";
    document.getElementById("demoStage").prepend(note);
  }
  return note;
}

async function openTier(tierId, userInitiated) {
  const tier = getTier(tierId);
  const lang = getLang();
  SX.tierId = tierId;
  document.getElementById("demoStage").classList.remove("hidden");
  document.getElementById("showcaseDock").classList.remove("hidden");
  updateDock();
  await mountAndBuild(tier, lang, userInitiated);
  selectStyle(SX.styleId);
}

function backToPicker() {
  SX.buildToken++;
  document.getElementById("demoStage").classList.add("hidden");
  document.getElementById("showcaseDock").classList.add("hidden");
  document.getElementById("buildConsole").classList.add("hidden");
}

/* ---------- mount (called on cold load and on every router entry) ---------- */

function initShowcasePage() {
  SX.data = null;
  SX.tierId = null;
  SX.styleId = "bold";
  SX.buildToken++;
  SX.skipRequested = false;
  pickerIntroPlayed = false;

  return fetchJSON("showcase-data.json")
    .then((data) => {
      SX.data = data;
      SX.tierId = data.tiers[0].id;
      renderTierPicker();

      document.getElementById("dockBack").addEventListener("click", (e) => {
        e.preventDefault();
        backToPicker();
        document.getElementById("tierPicker").scrollIntoView({ behavior: "smooth" });
      });

      document.getElementById("buildSkip").addEventListener("click", skipBuild);

      onLangChange(() => {
        renderTierPicker();
        if (SX.tierId && !document.getElementById("demoStage").classList.contains("hidden")) {
          const tier = getTier(SX.tierId);
          mountAndBuild(tier, getLang(), false);
          updateDock();
          selectStyle(SX.styleId);
        }
      });
    })
    .catch((err) => console.error(err));
}
