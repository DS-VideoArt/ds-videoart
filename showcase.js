/* ============================================================
   DS VideoArt: Showcase engine
   Tier = structure (which sections appear). Style = live skin swap
   ([data-style] on #demoStage, read by showcase.css as --sx-* vars).
   Reuses script.js utilities: escHtml, getLang, qs, qsa, fetchJSON,
   applyStaticLang, initReveals.
   ============================================================ */

const SX = {
  data: null,
  tierId: null,
  styleId: "bold",
};

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

function sxContactMini(s, lang) {
  const title = s["title_" + lang] || s.title_he;
  const subtitle = s["subtitle_" + lang] || s.subtitle_he;
  const button = s["button_" + lang] || s.button_he;
  return `
    <section>
      <div class="container">
        <div class="sx-contact-mini">
          <h3>${escHtml(title)}</h3>
          <p>${escHtml(subtitle)}</p>
          <a href="index.html?tier=${escHtml(SX.tierId)}#contact" class="sx-btn">${escHtml(button)}</a>
        </div>
      </div>
    </section>`;
}

const SECTION_RENDERERS = {
  hero: sxHero,
  "hero-video": sxHeroVideo,
  "cta-strip": sxCtaStrip,
  services: sxServices,
  about: sxAbout,
  gallery: sxGallery,
  testimonials: sxTestimonials,
  "portfolio-embed": sxPortfolioEmbed,
  "video-banner": sxVideoBanner,
  "contact-mini": sxContactMini,
};

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
}

/* ---------- demo stage ---------- */

function getTier(id) {
  return SX.data.tiers.find((t) => t.id === id);
}

function renderDemoStage(showShiftMessage) {
  const tier = getTier(SX.tierId);
  const lang = getLang();
  const stage = document.getElementById("demoStage");
  const prevSectionCount = qsa("section", stage).length;

  const html = tier.sections
    .map((s) => (SECTION_RENDERERS[s.type] ? SECTION_RENDERERS[s.type](s, lang) : ""))
    .join("");
  stage.innerHTML = html;
  stage.dataset.style = SX.styleId;
  initReveals(stage);
  qsa(".dock-quote-trigger", stage).forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("dockQuoteBtn").click();
    });
  });

  if (showShiftMessage && prevSectionCount > 0) {
    const diff = tier.sections.length - prevSectionCount;
    if (diff !== 0) {
      const msgHe =
        diff > 0
          ? `ברמה הזו נוספו עוד ${diff} מקטעים`
          : `ברמה הזו יש ${Math.abs(diff)} מקטעים פחות, ממוקד יותר`;
      const msgEn =
        diff > 0
          ? `This tier adds ${diff} more section${diff > 1 ? "s" : ""}`
          : `This tier has ${Math.abs(diff)} fewer section${Math.abs(diff) > 1 ? "s" : ""}, more focused`;
      showShiftTag(lang === "en" ? msgEn : msgHe);
    }
  }
}

function showShiftTag(text) {
  const tag = document.getElementById("demoShiftTag");
  tag.textContent = text;
  tag.classList.add("show");
  clearTimeout(showShiftTag._t);
  showShiftTag._t = setTimeout(() => tag.classList.remove("show"), 3200);
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
    btn.addEventListener("click", () => openTier(btn.dataset.tier, true));
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

function openTier(tierId, userInitiated) {
  SX.tierId = tierId;
  document.getElementById("demoStage").classList.remove("hidden");
  document.getElementById("showcaseDock").classList.remove("hidden");
  renderDemoStage(userInitiated);
  updateDock();
  selectStyle(SX.styleId);
  if (userInitiated) {
    document.getElementById("demoStage").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function backToPicker() {
  document.getElementById("demoStage").classList.add("hidden");
  document.getElementById("showcaseDock").classList.add("hidden");
}

/* ---------- boot ---------- */

document.addEventListener("DOMContentLoaded", () => {
  fetchJSON("showcase-data.json")
    .then((data) => {
      SX.data = data;
      SX.tierId = data.tiers[0].id;
      renderTierPicker();

      document.getElementById("dockBack").addEventListener("click", (e) => {
        e.preventDefault();
        backToPicker();
        document.getElementById("tierPicker").scrollIntoView({ behavior: "smooth" });
      });

      document.addEventListener("langchange", () => {
        renderTierPicker();
        if (SX.tierId && !document.getElementById("demoStage").classList.contains("hidden")) {
          renderDemoStage(false);
          updateDock();
          selectStyle(SX.styleId);
        }
      });
    })
    .catch((err) => console.error(err));
});
