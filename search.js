/* DS Creative Studio: site search (Pagefind, client side, no server).
   - A visible search field sits in the header of every public page (.nav-search).
   - Focus or typing opens an accessible dialog with the results: listbox, arrow keys, Enter, Esc, focus trap, aria-live summary.
   - Hebrew: no stemming in Pagefind, so every record carries a manual alias layer built at index time. No automatic prefix expansion. */
(function () {
  "use strict";
  var FIELD = document.querySelector(".nav-search input");
  if (!FIELD) return;
  var LONG = "מה תרצו לדעת? למשל: מה ההבדל בין דף נחיתה לאתר?", SHORT = "מה תרצו לדעת?";
  var mq = window.matchMedia("(max-width: 860px)");
  function placeholder() { FIELD.placeholder = mq.matches ? SHORT : LONG; }
  placeholder(); mq.addEventListener ? mq.addEventListener("change", placeholder) : mq.addListener(placeholder);

  var TOPICS = ["אתר או דף נחיתה", "מחירים", "תכנון והכנה", "דומיין ואחסון", "Google ו־SEO", "פרטיות, נגישות ומדידה", "תחזוקה", "מערכות ותוספות", "תיק עבודות"];
  var pf = null, pfError = false, dialog = null, input = null, list = null, live = null, chips = null, status = null;
  var topic = "", results = [], active = -1, lastFocus = null, token = 0, closing = false;

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function build() {
    if (dialog) return;
    dialog = el("div", "ds-search"); dialog.setAttribute("role", "dialog"); dialog.setAttribute("aria-modal", "true"); dialog.setAttribute("aria-label", "חיפוש באתר"); dialog.hidden = true;
    dialog.innerHTML =
      '<div class="ds-search-backdrop" data-close></div>' +
      '<div class="ds-search-panel">' +
        '<form class="ds-search-field" role="search" onsubmit="return false">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
          '<label class="sr-only" for="dsSearchInput">מה תרצו לדעת?</label>' +
          '<input id="dsSearchInput" type="search" autocomplete="off" spellcheck="false" placeholder="' + LONG + '" role="combobox" aria-expanded="true" aria-controls="dsSearchResults" aria-autocomplete="list">' +
          '<button type="button" class="ds-search-close" data-close>סגירה <span aria-hidden="true">Esc</span></button>' +
        '</form>' +
        '<div class="ds-search-chips" role="group" aria-label="סינון לפי נושא"></div>' +
        '<p class="ds-search-status" aria-live="polite" aria-atomic="true"></p>' +
        '<ul class="ds-search-results" id="dsSearchResults" role="listbox" aria-label="תוצאות חיפוש"></ul>' +
        '<div class="ds-search-hints" aria-hidden="true"><span><kbd>↑</kbd> <kbd>↓</kbd> מעבר בין תוצאות</span><span><kbd>Enter</kbd> פתיחה</span><span><kbd>Esc</kbd> סגירה</span></div>' +
      '</div>';
    document.body.appendChild(dialog);
    input = dialog.querySelector("#dsSearchInput"); list = dialog.querySelector(".ds-search-results"); live = dialog.querySelector(".ds-search-status"); chips = dialog.querySelector(".ds-search-chips");
    var all = el("button", "", "הכול"); all.type = "button"; all.setAttribute("aria-pressed", "true"); all.dataset.topic = ""; chips.appendChild(all);
    TOPICS.forEach(function (t) { var b = el("button", "", t); b.type = "button"; b.setAttribute("aria-pressed", "false"); b.dataset.topic = t; chips.appendChild(b); });
    chips.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; topic = b.dataset.topic; chips.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); run(input.value); input.focus(); });
    dialog.addEventListener("click", function (e) { if (e.target.closest("[data-close]")) close(); });
    input.addEventListener("input", function () { run(input.value); });
    input.addEventListener("keydown", onKey);
    dialog.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key === "Tab") trap(e);
    });
    list.addEventListener("click", function (e) { var a = e.target.closest("a"); if (a) go(a.href); });
  }
  function trap(e) {
    var f = dialog.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])'); if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function onKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); select(Math.min(active + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); select(Math.max(active - 1, -1)); }
    else if (e.key === "Enter") { var a = active >= 0 ? list.querySelectorAll("a")[active] : list.querySelector("a"); if (a) { e.preventDefault(); go(a.href); } }
    else if (e.key === "Home" && results.length) { e.preventDefault(); select(0); }
    else if (e.key === "End" && results.length) { e.preventDefault(); select(results.length - 1); }
  }
  function select(i) {
    active = i; var items = list.querySelectorAll("a");
    items.forEach(function (a, k) { a.setAttribute("aria-selected", String(k === i)); if (k === i) { a.scrollIntoView({ block: "nearest" }); input.setAttribute("aria-activedescendant", a.id); } });
    if (i < 0) input.removeAttribute("aria-activedescendant");
  }
  function go(href) { close(); window.location.href = href; }
  function open(prefill) {
    build(); lastFocus = document.activeElement; dialog.hidden = false; document.body.classList.add("ds-search-open");
    input.value = prefill || ""; input.focus(); load().then(function () { run(input.value); });
  }
  function close() { if (!dialog || dialog.hidden) return; dialog.hidden = true; document.body.classList.remove("ds-search-open"); FIELD.value = ""; closing = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); setTimeout(function () { closing = false; }, 0); }
  function load() {
    if (pf) return Promise.resolve(pf);
    live.textContent = "טוען את החיפוש…";
    return import("/pagefind/pagefind.js").then(function (m) { pf = m; return pf.options({ excerptLength: 22, ranking: { pageLength: 0.4, termFrequency: 0.9 } }); }).then(function () { return pf.init(); }).then(function () { live.textContent = ""; return pf; })
      .catch(function (err) { pfError = true; live.textContent = "החיפוש לא זמין כרגע. אפשר לעיין במידע השימושי או בשאלות הנפוצות."; list.innerHTML = '<li class="ds-search-empty"><a href="/hub/">לכל המידע השימושי</a><a href="/#faq">לשאלות הנפוצות</a></li>'; if (window.console) console.error("search unavailable", err); });
  }
  function run(q) {
    if (!pf || pfError) return; q = (q || "").trim(); var my = ++token; active = -1; input.removeAttribute("aria-activedescendant");
    if (!q) { results = []; list.innerHTML = ""; live.textContent = "הקלידו שאלה או מילה, למשל: דומיין, מחיר, וואטסאפ."; return; }
    var opts = topic ? { filters: { topic: [topic] } } : {};
    pf.debouncedSearch(q, opts, 200).then(function (search) {
      if (search === null || my !== token) return;
      return Promise.all(search.results.slice(0, 8).map(function (r) { return r.data(); })).then(function (data) {
        if (my !== token) return; results = data; render(q, search.results.length);
      });
    });
  }
  function render(q, total) {
    list.innerHTML = "";
    if (!results.length) {
      live.textContent = 'לא נמצאו תוצאות ל"' + q + '". נסו ניסוח אחר, או התחילו מהנושאים הנפוצים.';
      var li = el("li", "ds-search-empty"); li.innerHTML = '<a href="/hub/how-much-does-a-website-cost">כמה עולה אתר</a><a href="/hub/landing-page-or-business-website">דף נחיתה או אתר תדמית</a><a href="/hub/domain-hosting-who-owns-what">דומיין ואחסון</a><a href="/#faq">שאלות נפוצות</a>';
      list.appendChild(li); return;
    }
    live.textContent = (total === 1 ? "תוצאה אחת" : total + " תוצאות") + ' ל"' + q + '"' + (topic ? " בנושא " + topic : "");
    results.forEach(function (d, i) {
      var li = el("li"); li.setAttribute("role", "none");
      var a = el("a"); a.href = d.url.replace(/\/index\.html$/, "/").replace(/\.html$/, "");   /* canonical urls are extensionless */ a.id = "dsSearchResult" + i; a.setAttribute("role", "option"); a.setAttribute("aria-selected", "false");
      a.innerHTML = "<strong></strong>" + (d.meta && d.meta.type ? '<span class="type"></span>' : "") + '<span class="excerpt"></span>';
      a.querySelector("strong").textContent = (d.meta && d.meta.title) || d.url;
      if (d.meta && d.meta.type) a.querySelector(".type").textContent = d.meta.type;
      a.querySelector(".excerpt").innerHTML = excerpt(d.content || "", q) || d.excerpt || "";
      li.appendChild(a); list.appendChild(li);
    });
  }
  /* Excerpts are built here rather than taken from Pagefind, because each record carries a hidden alias list (between ⟦ ⟧)
     that Pagefind would otherwise pick as the densest match. */
  function excerpt(content, q) {
    var i = content.indexOf("⟦"), j = content.indexOf("⟧");
    if (i >= 0 && j > i) content = content.slice(0, i) + " " + content.slice(j + 1);
    var words = content.replace(/\s+/g, " ").trim().split(" "); if (!words[0]) return "";
    var terms = q.split(/\s+/).filter(function (t) { return t.length > 1; }).sort(function (a, b) { return b.length - a.length; });
    var strip = function (w) { return w.replace(/^["'(«]+/, ""); }, hit = -1, pass, w, t;
    for (pass = 0; pass < 2 && hit < 0; pass++) for (w = 0; w < words.length && hit < 0; w++) for (t = 0; t < terms.length; t++) {
      if (pass === 0 ? strip(words[w]).indexOf(terms[t]) === 0 : words[w].indexOf(terms[t]) >= 0) { hit = w; break; }
    }
    if (hit < 0) hit = 0;
    var start = Math.max(0, hit - 8), end = Math.min(words.length, start + 28);
    var span = document.createElement("span");
    span.textContent = (start > 0 ? "… " : "") + words.slice(start, end).join(" ") + (end < words.length ? " …" : "");
    var html = span.innerHTML;
    terms.forEach(function (term) {
      var re = new RegExp("(^|[\\s\"'(«,.:;])(" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\u0590-\\u05FFA-Za-z0-9]*)", "g");
      html = html.replace(re, "$1<mark>$2</mark>");
    });
    return html;
  }
  /* header field: opening the dialog on focus or on the first keystroke keeps the field itself a real, visible search box */
  FIELD.addEventListener("focus", function () { if (!closing) open(FIELD.value); });
  FIELD.addEventListener("input", function () { if (!dialog || dialog.hidden) open(FIELD.value); });
  FIELD.addEventListener("click", function () { if (!dialog || dialog.hidden) open(FIELD.value); });   /* the field keeps focus after Esc, so a second click must reopen */
  FIELD.closest("form").addEventListener("submit", function (e) { e.preventDefault(); open(FIELD.value); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !e.target.closest("input, textarea, select, [contenteditable]")) { e.preventDefault(); FIELD.focus(); }
  });
  /* deep links from search results into a FAQ question: open that question */
  function openFaq() { var m = location.hash.match(/^#(faq-\d+)$/); if (!m) return; var d = document.getElementById(m[1]); if (d && d.tagName === "DETAILS") { d.open = true; d.scrollIntoView({ block: "start" }); } }
  window.addEventListener("hashchange", openFaq); openFaq();
})();
