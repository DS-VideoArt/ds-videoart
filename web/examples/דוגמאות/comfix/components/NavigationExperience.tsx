"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { normalizeRoutePath } from "@/lib/route-path";

type MotionVariant = "home" | "repairs" | "new-computers" | "refurbished" | "accessories" | "contact";

const routeDetails: Record<string, { label: string; motion: MotionVariant }> = {
  "/": { label: "ביט ובורג", motion: "home" },
  "/repairs": { label: "תיקונים", motion: "repairs" },
  "/new-computers": { label: "מחשבים חדשים", motion: "new-computers" },
  "/refurbished": { label: "מחשבים מחודשים", motion: "refurbished" },
  "/accessories": { label: "ציוד נלווה", motion: "accessories" },
  "/contact": { label: "אודות ויצירת קשר", motion: "contact" },
  "/privacy": { label: "מדיניות פרטיות", motion: "contact" },
};

export function NavigationExperience() {
  const pathname = usePathname();
  const routePath = normalizeRoutePath(pathname);
  const [transitioning, setTransitioning] = useState(false);
  const [destination, setDestination] = useState("ביט ובורג");
  const [motion, setMotion] = useState<MotionVariant>("home");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const showNotice = (event: Event) => {
      const message = (event as CustomEvent<string>).detail;
      setNotice(message || "זהו אתר הדגמה. באתר אמיתי הפעולה תחובר ישירות לעסק.");
    };
    window.addEventListener("demo:demo-notice", showNotice);
    return () => window.removeEventListener("demo:demo-notice", showNotice);
  }, []);

  useEffect(() => {
    if (!document.documentElement.dataset.routeArrival) return;
    const timer = window.setTimeout(() => {
      document.documentElement.removeAttribute("data-route-arrival");
      sessionStorage.removeItem("demo-route-transition");
    }, 420);
    return () => {
      window.clearTimeout(timer);
    };
  }, [routePath]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4300);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const interceptNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as HTMLElement).closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      const targetPath = normalizeRoutePath(url.pathname);
      if (url.origin !== window.location.origin || targetPath === routePath) return;
      event.preventDefault();
      if (transitioning) return;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const details = routeDetails[targetPath] || routeDetails["/"];
      setDestination(details.label);
      setMotion(details.motion);
      sessionStorage.setItem("demo-route-transition", JSON.stringify({ motion: details.motion, at: Date.now() }));
      setTransitioning(true);
      window.setTimeout(() => window.location.assign(`${url.pathname}${url.search}${url.hash}`), reducedMotion ? 0 : 270);
    };
    document.addEventListener("click", interceptNavigation);
    return () => document.removeEventListener("click", interceptNavigation);
  }, [routePath, transitioning]);

  return (
    <>
      <div className={`route-transition motion-${motion}${transitioning ? " is-active" : ""}`} aria-hidden={!transitioning}>
        <span className="route-transition-base" />
        <span className="route-transition-motif route-motif-one" />
        <span className="route-transition-motif route-motif-two" />
        <span className="route-transition-motif route-motif-three" />
        <strong>{destination}</strong>
      </div>

      {notice ? <div className="demo-toast" role="status"><strong>פעולת הדגמה</strong><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="סגירת ההודעה"><X aria-hidden="true" /></button></div> : null}
    </>
  );
}
