"use client";

import { useState } from "react";
import { Home, Menu, MonitorCog, Phone, Search, X } from "lucide-react";
import { DemoAction } from "@/components/DemoAction";
import { openComfixSearch } from "@/components/NavigationExperience";
import { usePathname } from "next/navigation";
import { normalizeRoutePath } from "@/lib/route-path";

const navigation = [
  { href: "/repairs", label: "תיקונים" },
  { href: "/new-computers", label: "מחשבים חדשים" },
  { href: "/refurbished", label: "מחשבים מחודשים" },
  { href: "/accessories", label: "ציוד נלווה" },
  { href: "/contact", label: "אודות ויצירת קשר" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const routePath = normalizeRoutePath(pathname);

  return (
    <header className="site-header">
      <div className="utility-bar">
        <div className="container utility-inner">
          <p>מעבדה מקצועית בתל אביב · אבחון ראשוני ללא עלות</p>
          <DemoAction className="utility-action" message="מספר הטלפון הוא חלק מאתר ההדגמה ואינו מחייג בפועל.">
            <Phone size={15} aria-hidden="true" />
            03 555 0184
          </DemoAction>
        </div>
      </div>
      <div className="container header-inner">
        <a className="brand" href="/" aria-label="ComFix עמוד הבית" onClick={() => setOpen(false)}>
          <span className="brand-mark"><MonitorCog aria-hidden="true" /></span>
          <span className="brand-copy">
            <strong>ComFix</strong>
            <small>מחשבים שעובדים בשבילכם</small>
          </span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-label={open ? "סגירת תפריט" : "פתיחת תפריט"}
          aria-expanded={open}
          aria-controls="site-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <nav id="site-navigation" className={open ? "main-nav is-open" : "main-nav"} aria-label="ניווט ראשי">
          <a className={routePath === "/" ? "home-nav is-active" : "home-nav"} href="/" onClick={() => setOpen(false)} aria-label="דף הבית">
            <Home aria-hidden="true" /> <span>דף הבית</span>
          </a>
          {navigation.map((item) => (
            <a className={routePath === item.href ? "is-active" : ""} aria-current={routePath === item.href ? "page" : undefined} key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
          <button className="header-search" type="button" onClick={() => { setOpen(false); openComfixSearch(); }} aria-label="חיפוש בכל האתר">
            <Search aria-hidden="true" /> <span>חיפוש</span><kbd>/</kbd>
          </button>
          <a className="button button-sm" href="/repairs#booking" onClick={() => setOpen(false)}>
            הזמנת תיקון
          </a>
        </nav>
      </div>
    </header>
  );
}
