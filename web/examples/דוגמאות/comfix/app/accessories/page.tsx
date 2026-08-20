import type { Metadata } from "next";
import { ArrowLeft, Cable, CircleCheckBig, PackageCheck } from "lucide-react";
import { Catalog } from "@/components/Catalog";
import { accessories } from "@/lib/catalog";

export const metadata: Metadata = { title: "רכיבים וציוד נלווה", description: "מסכים, אחסון, ציוד היקפי ושדרוגים למחשב עם בדיקת תאימות." };

export default function AccessoriesPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container page-hero-inner">
          <div className="breadcrumb"><a href="/">עמוד הבית</a><span>›</span><span>ציוד נלווה</span></div>
          <span className="eyebrow">החיבור הנכון, בפעם הראשונה</span>
          <h1>כל מה שהמחשב צריך כדי לעבוד טוב יותר</h1>
          <p>מסכים, אחסון, שדרוגים וציוד היקפי שנבחרו בגלל איכות ותאימות. לא בטוחים מה מתאים? נבדוק לפני הרכישה.</p>
          <div className="button-row"><a className="button" href="#catalog-title">חיפוש בקטלוג <ArrowLeft aria-hidden="true" /></a><a className="button button-secondary" href="/contact">בדיקת תאימות</a></div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container feature-band">
          <article className="card"><CircleCheckBig className="icon-inline" aria-hidden="true" /><h3>בדיקת תאימות</h3><p>מוודאים שהמוצר יעבוד עם המחשב והחיבורים שלכם.</p></article>
          <article className="card"><Cable className="icon-inline" aria-hidden="true" /><h3>התקנה במקום</h3><p>זיכרון, אחסון ותחנות עגינה מותקנים ונבדקים במעבדה.</p></article>
          <article className="card"><PackageCheck className="icon-inline" aria-hidden="true" /><h3>אחריות ברורה</h3><p>כל מוצר מגיע עם חשבונית וכתובת לשירות במקרה הצורך.</p></article>
        </div>
      </section>

      <Catalog products={accessories} categories={["מסכים", "אחסון", "ציוד היקפי", "שדרוגים"]} title="ציוד ורכיבים נבחרים" />

      <section className="section"><div className="container cta-panel"><div><h2>יש לכם דגם מסוים?</h2><p>שלחו לנו את דגם המחשב ונבדוק מה מתאים לפני שתוציאו כסף.</p></div><a className="button button-light" href="/contact">בדיקת תאימות <ArrowLeft aria-hidden="true" /></a></div></section>
    </>
  );
}
