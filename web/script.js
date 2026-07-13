/* ============================================================
   DS Web: room-specific client logic
   Loaded after ../ds-shared.js. Single static page, no router.
   ============================================================ */

function initWebQuoteForm() {
  const form = qs("#webQuoteForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    fetch(window.location.pathname, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(data).toString(),
    })
      .then(() => showWebQuoteSuccess())
      .catch(() => showWebQuoteSuccess());
  });
}

function showWebQuoteSuccess() {
  const form = qs("#webQuoteForm");
  const success = qs("#webQuoteSuccess");
  if (form) form.style.display = "none";
  if (success) success.style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {
  initReveals();
  initWebQuoteForm();
});
