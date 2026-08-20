"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CornerDownLeft, Search, X } from "lucide-react";
import { siteSearchIndex } from "@/lib/site-search";

type MotionVariant = "home" | "repairs" | "new-computers" | "refurbished" | "accessories" | "contact";

const routeDetails: Record<string, { label: string; motion: MotionVariant }> = {
  "/": { label: "ComFix", motion: "home" },
  "/repairs": { label: "תיקונים", motion: "repairs" },
  "/new-computers": { label: "מחשבים חדשים", motion: "new-computers" },
  "/refurbished": { label: "מחשבים מחודשים", motion: "refurbished" },
  "/accessories": { label: "ציוד נלווה", motion: "accessories" },
  "/contact": { label: "אודות ויצירת קשר", motion: "contact" },
};

export function openComfixSearch() {
  window.dispatchEvent(new Event("comfix:open-search"));
}

export function NavigationExperience() {
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const [destination, setDestination] = useState("ComFix");
  const [motion, setMotion] = useState<MotionVariant>("home");
  const [notice, setNotice] = useState("");

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("he");
    if (!normalized) return siteSearchIndex.slice(0, 7);
    return siteSearchIndex.filter((entry) => `${entry.title} ${entry.description} ${entry.keywords}`.toLocaleLowerCase("he").includes(normalized)).slice(0, 8);
  }, [query]);

  useEffect(() => {
    const openSearch = () => setSearchOpen(true);
    const showNotice = (event: Event) => {
      const message = (event as CustomEvent<string>).detail;
      setNotice(message || "זהו אתר הדגמה. באתר אמיתי הפעולה תחובר ישירות לעסק.");
    };
    window.addEventListener("comfix:open-search", openSearch);
    window.addEventListener("comfix:demo-notice", showNotice);
    const openWithShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === "/" && !target.closest("input, textarea, select, [contenteditable='true']")) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", openWithShortcut);
    return () => {
      window.removeEventListener("comfix:open-search", openSearch);
      window.removeEventListener("comfix:demo-notice", showNotice);
      window.removeEventListener("keydown", openWithShortcut);
    };
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    document.body.classList.add("overlay-open");
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("overlay-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!document.documentElement.dataset.routeArrival) return;
    const timer = window.setTimeout(() => {
      document.documentElement.removeAttribute("data-route-arrival");
      sessionStorage.removeItem("comfix-route-transition");
    }, 420);
    return () => {
      window.clearTimeout(timer);
    };
  }, [pathname]);

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
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      event.preventDefault();
      if (transitioning) return;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const details = routeDetails[url.pathname] || routeDetails["/"];
      setDestination(details.label);
      setMotion(details.motion);
      sessionStorage.setItem("comfix-route-transition", JSON.stringify({ motion: details.motion, at: Date.now() }));
      setTransitioning(true);
      window.setTimeout(() => window.location.assign(`${url.pathname}${url.search}${url.hash}`), reducedMotion ? 0 : 270);
    };
    document.addEventListener("click", interceptNavigation);
    return () => document.removeEventListener("click", interceptNavigation);
  }, [transitioning]);

  return (
    <>
      <div className={`route-transition motion-${motion}${transitioning ? " is-active" : ""}`} aria-hidden={!transitioning}>
        <span className="route-transition-base" />
        <span className="route-transition-motif route-motif-one" />
        <span className="route-transition-motif route-motif-two" />
        <span className="route-transition-motif route-motif-three" />
        <strong>{destination}</strong>
      </div>

      {searchOpen ? (
        <div className="global-search" role="dialog" aria-modal="true" aria-labelledby="global-search-title">
          <button className="global-search-backdrop" type="button" onClick={() => setSearchOpen(false)} aria-label="סגירת החיפוש" />
          <div className="global-search-panel">
            <div className="global-search-head">
              <div><span>חיפוש בכל האתר</span><h2 id="global-search-title">מה תרצו למצוא?</h2></div>
              <button type="button" className="search-close" onClick={() => setSearchOpen(false)} aria-label="סגירת החיפוש"><X aria-hidden="true" /></button>
            </div>
            <label className="global-search-input">
              <Search aria-hidden="true" />
              <input ref={inputRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="למשל, מחשב איטי, מסך או גיימינג" />
              <kbd>ESC</kbd>
            </label>
            <div className="global-search-results" aria-live="polite">
              {results.length ? results.map((entry) => (
                <a href={entry.href} key={`${entry.href}-${entry.title}`} onClick={() => setSearchOpen(false)}>
                  <span className="search-result-type">{entry.type}</span>
                  <span><strong>{entry.title}</strong><small>{entry.description}</small></span>
                  <ArrowLeft aria-hidden="true" />
                </a>
              )) : <div className="search-empty"><Search aria-hidden="true" /><strong>לא מצאנו התאמה</strong><span>נסו לכתוב מילה אחרת או עברו לתפריט הראשי.</span></div>}
            </div>
            <p className="search-hint"><CornerDownLeft aria-hidden="true" /> בחרו תוצאה כדי לעבור לעמוד</p>
          </div>
        </div>
      ) : null}

      {notice ? <div className="demo-toast" role="status"><strong>פעולת הדגמה</strong><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="סגירת ההודעה"><X aria-hidden="true" /></button></div> : null}
    </>
  );
}
