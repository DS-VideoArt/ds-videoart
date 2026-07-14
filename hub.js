/* ============================================================
   DS hub: click/return choreography over the real lab footage.
   No 3D engine — the depth is already baked into the looping
   video (hub-media/videos/hero-loop.mp4) and its poster image.
   This file only: fades the video in once it can play, zooms the
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

function hotspotOrigin(hotspot, stage) {
  const hRect = hotspot.getBoundingClientRect();
  const sRect = stage.getBoundingClientRect();
  const cx = ((hRect.left + hRect.width / 2 - sRect.left) / sRect.width) * 100;
  const cy = ((hRect.top + hRect.height / 2 - sRect.top) / sRect.height) * 100;
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
    zoom.style.transformOrigin = hotspotOrigin(hotspot, stage);

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

function initHeroVideo() {
  const video = qs("#hubBgVideo");
  if (!video) return;
  if (video.readyState >= 3) {
    video.classList.add("is-ready");
    return;
  }
  video.addEventListener("canplay", () => video.classList.add("is-ready"), { once: true });
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
    if (hotspot) zoom.style.transformOrigin = hotspotOrigin(hotspot, stage);

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

document.addEventListener("DOMContentLoaded", () => {
  initHeroVideo();
  initHotspots();
  handleHubReturn();
});
