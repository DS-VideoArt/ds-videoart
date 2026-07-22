/* ============================================================
   DS hub: click/return choreography over the real lab photo.
   No 3D engine — the depth is already baked into the image
   (hub-media/image/hero.jpg). This file: positions the room
   hotspots against the actual letterboxed image bounds, zooms the
   footage toward whichever room was clicked before navigating,
   and reverses that zoom on arrival back at the hub.
   ============================================================ */

const ROOM_COLORS = {
  videoart: "#d1414c",
  web: "#3d8ef0",
  lab: "#4ade80",
  creative: "#ec4899",
};

function canUseMotion() {
  return typeof prefersReducedMotion !== "undefined" && !prefersReducedMotion && typeof gsap !== "undefined";
}

/**
 * Runs a GSAP timeline and resolves when it completes, or after
 * timeoutMs, whichever comes first (force-jumping the timeline to
 * its end in that case). Without this, a throttled tab could leave
 * the flight timeline never firing onComplete, stranding the user
 * on a frozen frame instead of navigating.
 */
function raceTimeline(tl, timeoutMs) {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      tl.progress(1);
      resolve();
    }, timeoutMs);
    tl.eventCallback("onComplete", () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve();
    });
  });
}

/**
 * Computes a transform-origin for `zoom` (the element being scaled)
 * centered on `hotspot`. Must be measured against `zoom` itself, not
 * the outer stage - the hotspots live inside `zoom` now, and `zoom`
 * is a smaller, letterboxed, aspect-locked box centered in the stage
 * rather than filling it edge to edge.
 */
function hotspotOrigin(hotspot, zoom) {
  const hRect = hotspot.getBoundingClientRect();
  const zRect = zoom.getBoundingClientRect();
  const cx = ((hRect.left + hRect.width / 2 - zRect.left) / zRect.width) * 100;
  const cy = ((hRect.top + hRect.height / 2 - zRect.top) / zRect.height) * 100;
  return cx + "% " + cy + "%";
}

let transitionInFlight = false;

function enterRoom(hotspot, key, href) {
  if (transitionInFlight) return;
  transitionInFlight = true;

  const stage = qs(".hub-stage");
  const zoom = qs("#hubStageZoom");
  const flash = qs("#hubBrandFlash");

  function go() {
    sessionStorage.setItem("ds_hub_transition", key);
    window.location.href = href;
  }

  if (!stage || !zoom || !flash || !canUseMotion()) {
    go();
    return;
  }

  // Safety net: if the animation below throws or stalls for any reason,
  // still navigate rather than leaving the user stuck on a frozen hub.
  const forceGo = setTimeout(go, 3000);

  try {
    flash.style.background = ROOM_COLORS[key] || "#e8ecf2";
    zoom.style.transformOrigin = hotspotOrigin(hotspot, zoom);

    const chrome = qsa(".navbar, .hub-caption, .hub-hotspots");
    const tl = gsap.timeline({ defaults: { ease: "power2.in" } });
    tl.to(chrome, { opacity: 0, duration: 0.35 }, 0)
      .to(zoom, { scale: 2.4, duration: 1.1 }, 0)
      .to(flash, { opacity: 1, duration: 0.5 }, 0.65);

    raceTimeline(tl, 2000).then(() => {
      clearTimeout(forceGo);
      go();
    });
  } catch (err) {
    clearTimeout(forceGo);
    go();
  }
}

function initHotspots() {
  qsa(".hub-hotspot").forEach((hotspot) => {
    hotspot.addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      enterRoom(hotspot, hotspot.dataset.room, hotspot.getAttribute("href"));
    });
  });
}

/**
 * The hero media uses object-fit:contain, so the browser letterboxes
 * it (bars on the sides or top/bottom depending on window shape) and
 * the actual visible image never fills #hubStageZoom exactly. Plain
 * CSS percentages on the hotspots would drift out of alignment with
 * the real image the moment the window's aspect ratio differs from
 * the source (1916x821). Instead: compute the real letterboxed image
 * rect in pixels (same math the browser uses for object-fit:contain)
 * and position each hotspot against that, in pixels, directly.
 */
const HERO_ASPECT = 1916 / 821;
const ROOM_BOUNDS = {
  lab: { left: 0.02, top: 0.03, width: 0.32, height: 0.38 },
  videoart: { left: 0.66, top: 0.03, width: 0.32, height: 0.38 },
  web: { left: 0.02, top: 0.54, width: 0.32, height: 0.4 },
  creative: { left: 0.66, top: 0.54, width: 0.32, height: 0.4 },
};

function positionHotspots() {
  const stage = qs(".hub-stage");
  if (!stage) return;
  const stageRect = stage.getBoundingClientRect();
  if (stageRect.width === 0 || stageRect.height === 0) return;

  const containerRatio = stageRect.width / stageRect.height;
  let imgWidth, imgHeight, imgLeft, imgTop;
  if (containerRatio > HERO_ASPECT) {
    imgHeight = stageRect.height;
    imgWidth = imgHeight * HERO_ASPECT;
    imgLeft = (stageRect.width - imgWidth) / 2;
    imgTop = 0;
  } else {
    imgWidth = stageRect.width;
    imgHeight = imgWidth / HERO_ASPECT;
    imgLeft = 0;
    imgTop = (stageRect.height - imgHeight) / 2;
  }

  qsa(".hub-hotspot").forEach((hotspot) => {
    const b = ROOM_BOUNDS[hotspot.dataset.room];
    if (!b) return;
    hotspot.style.left = imgLeft + b.left * imgWidth + "px";
    hotspot.style.top = imgTop + b.top * imgHeight + "px";
    hotspot.style.width = b.width * imgWidth + "px";
    hotspot.style.height = b.height * imgHeight + "px";
    hotspot.style.right = "auto";
  });
}

function initHotspotLayout() {
  positionHotspots();
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(positionHotspots, 100);
  });
}

/**
 * Arriving back at the hub from a room's exit link: reverse the zoom
 * from that room's hotspot back to the overview, revealing the scene
 * as the brand-color flash (already opaque, set by the blocking
 * script in <head>) fades out.
 */
function handleHubReturn() {
  const returnKey = sessionStorage.getItem("ds_hub_return");
  if (!returnKey) return;
  sessionStorage.removeItem("ds_hub_return");

  // Absolute safety net: whatever happens below (a thrown error, a CDN
  // script that never finishes loading, a stalled animation), the
  // full-screen color flash must never stay stuck covering the page.
  // If the normal path below doesn't clear the class within 3s, force it.
  const forceClear = setTimeout(() => {
    document.documentElement.classList.remove("hub-returning");
  }, 3000);

  try {
    const stage = qs(".hub-stage");
    const zoom = qs("#hubStageZoom");
    const flash = qs("#hubBrandFlash");

    if (!stage || !zoom || !flash || !canUseMotion()) {
      clearTimeout(forceClear);
      document.documentElement.classList.remove("hub-returning");
      return;
    }

    const hotspot = qs('.hub-hotspot[data-room="' + returnKey + '"]');
    if (hotspot) zoom.style.transformOrigin = hotspotOrigin(hotspot, zoom);

    const chrome = qsa(".navbar, .hub-caption, .hub-hotspots");
    gsap.set(zoom, { scale: 2.4 });
    gsap.set(chrome, { opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.to(flash, { opacity: 0, duration: 0.6 }, 0)
      .to(zoom, { scale: 1, duration: 1.1 }, 0)
      .to(chrome, { opacity: 1, duration: 0.5 }, 0.5);

    raceTimeline(tl, 2000).then(() => {
      clearTimeout(forceClear);
      document.documentElement.classList.remove("hub-returning");
    });
  } catch (err) {
    clearTimeout(forceClear);
    document.documentElement.classList.remove("hub-returning");
  }
}

/**
 * Welcome splash: full-bleed image + Hebrew/English greeting shown on
 * every fresh load or refresh of the hub root. Skipped when arriving
 * back from a room (that already has its own color-flash handoff) or
 * when the user prefers reduced motion, since the point of the splash
 * is the zoom/fade choreography itself, not the message alone.
 */
function initSplash() {
  const splash = qs("#dsSplash");
  if (!splash) return;

  if (sessionStorage.getItem("ds_hub_return")) {
    splash.classList.add("is-gone");
    return;
  }

  if (typeof prefersReducedMotion !== "undefined" && prefersReducedMotion) {
    splash.classList.add("is-gone");
    return;
  }

  setTimeout(() => {
    splash.classList.add("is-hiding");
    splash.addEventListener("transitionend", () => splash.classList.add("is-gone"), { once: true });
  }, 2600);
}

document.addEventListener("DOMContentLoaded", () => {
  initSplash();
  initHotspots();
  initHotspotLayout();
  handleHubReturn();
});

/**
 * Restores every transient bit of visual state the enter/return
 * animations touch back to their resting default. Used whenever the
 * hub is shown via the browser's back-forward cache (see the
 * pageshow listener below) - without this, the page can reappear
 * frozen mid-animation (chrome hidden, image zoomed in, full-screen
 * color flash opaque) because bfcache restores the exact DOM/inline-
 * style state the page was in the instant it was left, and none of
 * the normal boot code runs again on that kind of restore.
 */
function resetHubVisualState() {
  transitionInFlight = false;
  const zoom = qs("#hubStageZoom");
  const flash = qs("#hubBrandFlash");
  const chrome = qsa(".navbar, .hub-caption, .hub-hotspots");
  if (typeof gsap !== "undefined") {
    if (zoom) gsap.set(zoom, { scale: 1, clearProps: "transform" });
    if (flash) gsap.set(flash, { opacity: 0 });
    if (chrome.length) gsap.set(chrome, { opacity: 1 });
  } else {
    if (zoom) zoom.style.transform = "";
    if (flash) flash.style.opacity = "0";
    chrome.forEach((el) => (el.style.opacity = "1"));
  }
  document.documentElement.classList.remove("hub-returning");
}

window.addEventListener("pageshow", (e) => {
  if (e.persisted) resetHubVisualState();
});
