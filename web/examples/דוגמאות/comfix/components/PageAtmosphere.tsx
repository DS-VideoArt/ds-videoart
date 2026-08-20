"use client";

import { usePathname } from "next/navigation";

const atmosphereByPath: Record<string, string> = {
  "/": "home",
  "/repairs": "repairs",
  "/new-computers": "new-computers",
  "/refurbished": "refurbished",
  "/accessories": "accessories",
  "/contact": "contact",
};

export function PageAtmosphere() {
  const pathname = usePathname();
  const atmosphere = atmosphereByPath[pathname] || "home";

  return (
    <div className="page-atmosphere" data-atmosphere={atmosphere} aria-hidden="true">
      <span className="atmosphere-shape atmosphere-one" />
      <span className="atmosphere-shape atmosphere-two" />
      <span className="atmosphere-shape atmosphere-three" />
      <span className="atmosphere-shape atmosphere-four" />
      <span className="atmosphere-shape atmosphere-five" />
    </div>
  );
}
