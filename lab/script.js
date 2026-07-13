/* ============================================================
   DS Lab: room-specific client logic
   Loaded after ../ds-shared.js. Renders lab-items.json into a
   card grid. Extensible: adding a launch item later is just
   editing the JSON, no code changes.
   ============================================================ */

function labCardHtml(item, lang) {
  const title = item["title_" + lang] || item.title_he;
  const desc = item["desc_" + lang] || item.desc_he;
  const isLive = item.status === "live";
  const badgeHe = isLive ? "זמין" : "בקרוב";
  const badgeEn = isLive ? "Live" : "Coming soon";
  const badge = `<span class="lab-badge${isLive ? " is-live" : ""}">${escHtml(lang === "en" ? badgeEn : badgeHe)}</span>`;
  const media = item.thumbnail
    ? `<img src="${escHtml(item.thumbnail)}" alt="${escHtml(title)}" loading="lazy">`
    : "";
  const body = `
      <div class="lab-card-media">${badge}${media}</div>
      <div class="lab-card-body">
        <h3>${escHtml(title)}</h3>
        <p>${escHtml(desc)}</p>
      </div>`;
  if (isLive && item.href) {
    return `<a class="lab-card reveal" href="${escHtml(item.href)}" target="_blank" rel="noopener">${body}</a>`;
  }
  return `<div class="lab-card reveal">${body}</div>`;
}

function renderLabGrid(items) {
  const grid = qs("#labGrid");
  if (!grid) return;
  const lang = getLang();
  grid.innerHTML = items.map((item) => labCardHtml(item, lang)).join("");
  initReveals(grid);
}

function initLabGrid() {
  const grid = qs("#labGrid");
  if (!grid) return Promise.resolve();
  return fetchJSON("lab-items.json")
    .then((items) => {
      renderLabGrid(items);
      onLangChange(() => renderLabGrid(items));
    })
    .catch((err) => {
      grid.innerHTML = `<div class="empty-state">Could not load lab-items.json</div>`;
      console.error(err);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  initReveals();
  initLabGrid();
});
