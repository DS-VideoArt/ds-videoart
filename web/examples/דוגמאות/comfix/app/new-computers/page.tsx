import type { Metadata } from "next";
import { ArrowLeft, BriefcaseBusiness, Gamepad2, GraduationCap } from "lucide-react";
import { Catalog } from "@/components/Catalog";
import { newComputers } from "@/lib/catalog";

export const metadata: Metadata = { title: "מחשבים חדשים", description: "מחשבים חדשים שנבחרו לפי הצורך, התקציב ואופי העבודה שלכם." };

export default function NewComputersPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container page-hero-inner">
          <div className="breadcrumb"><a href="/">עמוד הבית</a><span>›</span><span>מחשבים חדשים</span></div>
          <span className="eyebrow">מתאימים מחשב, לא רק מפרט</span>
          <h1>המחשב הנכון מתחיל במה שאתם באמת צריכים</h1>
          <p>ספרו לנו איך נראה יום העבודה שלכם. אנחנו נתאים ביצועים, ניידות ותקציב בלי לדחוף תוספות שלא ישמשו אתכם.</p>
          <div className="button-row"><a className="button" href="#catalog-title">צפייה במחשבים <ArrowLeft aria-hidden="true" /></a><a className="button button-secondary" href="/contact">ייעוץ לפני רכישה</a></div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container feature-band">
          <article className="card"><GraduationCap className="icon-inline" aria-hidden="true" /><h3>ללימודים</h3><p>קל, שקט ועם סוללה שמחזיקה יום שלם.</p></article>
          <article className="card"><BriefcaseBusiness className="icon-inline" aria-hidden="true" /><h3>לעבודה</h3><p>אמינות, אבטחה ואחריות שמתאימה לעסק.</p></article>
          <article className="card"><Gamepad2 className="icon-inline" aria-hidden="true" /><h3>לגיימינג ויצירה</h3><p>ביצועים מאוזנים, קירור נכון ושדרוג עתידי.</p></article>
        </div>
      </section>

      <Catalog products={newComputers} categories={["חדש"]} title="המחשבים החדשים שלנו" />

      <section className="section"><div className="container cta-panel"><div><h2>לא בטוחים מה לבחור?</h2><p>שיחה של כמה דקות יכולה לחסוך קנייה יקרה ולא מתאימה.</p></div><a className="button button-light" href="/contact">קבלת המלצה אישית <ArrowLeft aria-hidden="true" /></a></div></section>
    </>
  );
}
