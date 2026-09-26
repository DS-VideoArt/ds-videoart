import type { Metadata } from "next";
import { headers } from "next/headers";
import { Heebo } from "next/font/google";
import { MessageCircle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DemoAction } from "@/components/DemoAction";
import { NavigationExperience } from "@/components/NavigationExperience";
import { PageAtmosphere } from "@/components/PageAtmosphere";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

const routePrepaintScript = `(() => {
  try {
    const saved = JSON.parse(sessionStorage.getItem("demo-route-transition") || "null");
    const allowed = ["home", "repairs", "new-computers", "refurbished", "accessories", "contact"];
    if (saved && allowed.includes(saved.motion) && Date.now() - saved.at < 5000) {
      document.documentElement.dataset.routeArrival = saved.motion;
    } else {
      sessionStorage.removeItem("demo-route-transition");
    }
  } catch (_) {}
})();`;

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3001";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  const description = "אתר הדגמה · עסק בדיוני. ביט ובורג היא מעבדת מחשבים מומצאת שנבנתה כדי להמחיש אתר תדמית של עד 6 עמודים. הפרטים, המחירים וההמלצות באתר הם המחשה בלבד.";

  return {
    metadataBase,
    title: { default: "ביט ובורג | מעבדת מחשבים ושירותי מחשוב · אתר הדגמה", template: "%s | ביט ובורג · אתר הדגמה" },
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
    description,
    openGraph: {
      type: "website",
      locale: "he_IL",
      title: "ביט ובורג | מעבדת מחשבים ושירותי מחשוב · אתר הדגמה",
      description,
      images: [{ url: new URL("/og.jpg", metadataBase).toString(), width: 1200, height: 630, alt: "ביט ובורג, מעבדת מחשבים ושירותי מחשוב. אתר הדגמה · עסק בדיוני" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "ביט ובורג | מעבדת מחשבים ושירותי מחשוב · אתר הדגמה",
      description,
      images: [new URL("/og.jpg", metadataBase).toString()],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: routePrepaintScript }} />
      </head>
      <body className={heebo.variable}>
        <div className="route-prepaint-stage" aria-hidden="true">
          <span className="route-prepaint-base" />
          <span className="route-prepaint-motif route-prepaint-one" />
          <span className="route-prepaint-motif route-prepaint-two" />
          <span className="route-prepaint-motif route-prepaint-three" />
        </div>
        <a className="skip-link" href="#main-content">
          מעבר לתוכן הראשי
        </a>
        <SiteHeader />
        <PageAtmosphere />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <DemoAction
          className="whatsapp-float"
          aria-label="הדגמת פתיחת שיחה עם ביט ובורג ב WhatsApp"
          message="באתר אמיתי הכפתור יפתח שיחת WhatsApp ישירות עם העסק. כאן הוא מוצג לצורכי הדגמה בלבד."
        >
          <MessageCircle aria-hidden="true" />
          <span>דברו איתנו</span>
        </DemoAction>
        <NavigationExperience />
      </body>
    </html>
  );
}
