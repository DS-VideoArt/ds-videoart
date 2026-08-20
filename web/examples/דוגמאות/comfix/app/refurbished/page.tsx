import type { Metadata } from "next";
import { ArrowLeft, BadgeCheck, BatteryCharging, Microscope } from "lucide-react";
import { Catalog } from "@/components/Catalog";
import { refurbishedComputers } from "@/lib/catalog";

export const metadata: Metadata = { title: "מחשבים מחודשים", description: "מחשבים מחודשים שעברו בדיקה מקצועית ומגיעים עם אחריות של ComFix." };

export default function RefurbishedPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container page-hero-inner">
          <div className="breadcrumb"><a href="/">עמוד הבית</a><span>›</span><span>מחשבים מחודשים</span></div>
          <span className="eyebrow">יותר מחשב, פחות הוצאה</span>
          <h1>מחשב מחודש שאפשר לסמוך עליו</h1>
          <p>כל מחשב עובר בדיקה של 42 נקודות, ניקוי מלא, התקנה חדשה ובדיקת עומס. אתם מקבלים ביצועים מצוינים עם אחריות כתובה.</p>
          <div className="button-row"><a className="button" href="#catalog-title">לצפייה במלאי <ArrowLeft aria-hidden="true" /></a><a className="button button-secondary" href="/contact">בדיקת התאמה</a></div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container feature-band">
          <article className="card"><Microscope className="icon-inline" aria-hidden="true" /><h3>42 נקודות בדיקה</h3><p>חיבורים, מסך, קירור, אחסון וביצועים תחת עומס.</p></article>
          <article className="card"><BatteryCharging className="icon-inline" aria-hidden="true" /><h3>בריאות סוללה</h3><p>סוללה מתחת לרף שלנו מוחלפת לפני שהמחשב מוצע.</p></article>
          <article className="card"><BadgeCheck className="icon-inline" aria-hidden="true" /><h3>12 חודשי אחריות</h3><p>כתובת אחת ברורה לכל שאלה או תקלה לאחר הרכישה.</p></article>
        </div>
      </section>

      <Catalog products={refurbishedComputers} categories={["מחודש"]} title="מחשבים מחודשים זמינים" />

      <section className="section section-muted">
        <div className="container split">
          <div><span className="eyebrow">השקיפות שלנו</span><h2>יודעים בדיוק מה אתם מקבלים</h2><p>בכל מחשב מצוין המצב החיצוני, מצב הסוללה והחלקים שהוחלפו. אין ניסוחים מעורפלים ואין הפתעות בקופה.</p><ul className="check-list"><li><BadgeCheck aria-hidden="true" /> דוח בדיקה מצורף לכל מחשב</li><li><BadgeCheck aria-hidden="true" /> התקנה נקייה ועדכוני אבטחה</li><li><BadgeCheck aria-hidden="true" /> אפשרות שדרוג לפני המסירה</li></ul></div>
          <div className="savings-card card"><span>חיסכון ממוצע</span><strong>38%</strong><p>לעומת מחשב חדש ברמת ביצועים דומה</p><small>הנתון באתר הוא המחשה לדוגמה ומשתנה בין דגמים.</small></div>
        </div>
      </section>

      <section className="section"><div className="container cta-panel"><div><h2>רוצים שנמצא לכם מציאה?</h2><p>כתבו לנו תקציב ושימוש, ונחזור עם שתי אפשרויות מתאימות.</p></div><a className="button button-light" href="/contact">שליחת בקשה <ArrowLeft aria-hidden="true" /></a></div></section>
    </>
  );
}
