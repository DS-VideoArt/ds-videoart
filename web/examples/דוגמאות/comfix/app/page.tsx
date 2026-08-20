import { ArrowLeft, BadgeCheck, CheckCircle2, ChevronLeft, CircleDollarSign, HardDrive, Laptop, MonitorUp, PackageCheck, Star, Wrench } from "lucide-react";
import { HomeHero } from "@/components/HomeHero";
import { ProductCard } from "@/components/ProductCard";
import { newComputers } from "@/lib/catalog";

const services = [
  { icon: Wrench, title: "תיקוני מחשבים", text: "אבחון, תיקון ושדרוג למחשבים ניידים ונייחים.", href: "/repairs", tone: "blue" },
  { icon: Laptop, title: "מחשבים חדשים", text: "התאמה לפי שימוש ותקציב, עם אחריות מלאה.", href: "/new-computers", tone: "mint" },
  { icon: BadgeCheck, title: "מחשבים מחודשים", text: "מחשבים בדוקים עם אחריות וחיסכון משמעותי.", href: "/refurbished", tone: "blue" },
  { icon: HardDrive, title: "שדרוגים ורכיבים", text: "אחסון, זיכרון וקירור שמחזירים למחשב מהירות.", href: "/accessories", tone: "mint" },
  { icon: MonitorUp, title: "ציוד נלווה", text: "מסכים, תחנות עגינה וציוד היקפי שמתאים באמת.", href: "/accessories", tone: "blue" },
];

export default function Home() {
  return (
    <>
      <HomeHero />

      <section className="trust-section">
        <div className="container trust-strip">
          <div className="trust-item"><strong>12</strong><span>שנות ניסיון</span></div>
          <div className="trust-item"><strong>24 שעות</strong><span>לאבחון ראשוני</span></div>
          <div className="trust-item"><strong>4.9</strong><span>דירוג לקוחות</span></div>
          <div className="trust-item"><strong>100%</strong><span>מחיר לפני תיקון</span></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading"><span className="eyebrow">כל מה שהמחשב צריך</span><h2>כתובת אחת. כל הפתרונות.</h2><p>מתיקון קטן ועד מחשב חדש, אנחנו עוזרים לבחור נכון ומלווים גם אחרי המסירה.</p></div>
          <div className="services-showcase">
            {services.map(({ icon: Icon, title, text, href, tone }) => <a className="service-link card" href={href} key={title}><span className={`icon-wrap ${tone === "mint" ? "mint" : ""}`}><Icon aria-hidden="true" /></span><h3>{title}</h3><p>{text}</p><span className="learn-more">למידע נוסף <ChevronLeft aria-hidden="true" /></span></a>)}
          </div>
        </div>
      </section>

      <section className="section section-dark why-section">
        <div className="container split">
          <div className="why-visual">
            <img src="https://images.unsplash.com/photo-1721332155637-8b339526cf4c?auto=format&fit=crop&w=1500&q=86" alt="מחשב פתוח בבדיקה מקצועית במעבדת ComFix" width="900" height="1000" />
            <div className="scan-line" aria-hidden="true" />
            <div className="visual-label"><span className="status-dot" /> בדיקה מקצועית בתהליך</div>
          </div>
          <div><span className="eyebrow">למה ComFix</span><h2>בלי ניחושים.<br />בלי הפתעות בחשבון.</h2><p>אנחנו מאמינים שתיקון טוב מתחיל בהסבר טוב. לפני שנוגעים במחשב, אתם יודעים מה מצאנו, מה האפשרויות וכמה זה יעלה.</p><ul className="benefit-list"><li><span><CheckCircle2 aria-hidden="true" /></span><div><strong>אבחון שקוף</strong><p>דוח ברור והצעת מחיר לפני תחילת העבודה.</p></div></li><li><span><CircleDollarSign aria-hidden="true" /></span><div><strong>מתקנים רק מה שצריך</strong><p>מציעים חלופות לפי גיל המחשב והתקציב.</p></div></li><li><span><PackageCheck aria-hidden="true" /></span><div><strong>אחריות גם אחרי המסירה</strong><p>כל חלק ועבודה מתועדים באחריות כתובה.</p></div></li></ul><a className="button button-light" href="/repairs">איך עובד תיקון אצלנו <ArrowLeft aria-hidden="true" /></a></div>
        </div>
      </section>

      <section className="section section-muted">
        <div className="container">
          <div className="section-heading heading-row"><div><span className="eyebrow">נבחרו על ידי הטכנאים</span><h2>מחשבים שעושים את העבודה</h2></div><a className="text-link" href="/new-computers">לכל המחשבים <ArrowLeft aria-hidden="true" /></a></div>
          <div className="product-grid">{newComputers.slice(0, 3).map((product) => <ProductCard key={product.id} product={product} />)}</div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading center"><span className="eyebrow">פשוט מההתחלה ועד הסוף</span><h2>ככה חוזרים לשגרה</h2><p>שלושה צעדים, עדכון בכל שלב ואפס הפתעות.</p></div>
          <div className="process-grid"><article className="process-card card"><h3>מתארים את התקלה</h3><p>בטופס קצר, בשיחה או בהגעה למעבדה.</p></article><article className="process-card card"><h3>מקבלים אבחון והצעה</h3><p>אנחנו בודקים, מסבירים ומחכים לאישור.</p></article><article className="process-card card"><h3>חוזרים לעבוד</h3><p>מקבלים מחשב בדוק, דוח ואחריות כתובה.</p></article></div>
        </div>
      </section>

      <section className="section testimonial-section">
        <div className="container">
          <div className="section-heading"><span className="eyebrow">לקוחות מספרים</span><h2>שירות שרוצים להמליץ עליו</h2></div>
          <div className="testimonial-grid"><blockquote className="testimonial-card card"><span className="quote-mark">״</span><p>הגעתי עם מחשב שלא נדלק ועם חשש שאיבדתי הכול. תוך יום קיבלתי אבחון, המידע נשמר והמחיר היה בדיוק מה שסוכם.</p><footer><span className="client-avatar">יע</span><div><strong>יעל אדרי</strong><small>תיקון מחשב נייד</small></div><span className="stars"><Star /><Star /><Star /><Star /><Star /></span></footer></blockquote><blockquote className="testimonial-card card"><span className="quote-mark">״</span><p>במקום למכור לי את המחשב הכי יקר, שאלו מה אני באמת עושה והציעו דגם זול יותר שהתאים בול. זו בדיוק השקיפות שחיפשתי.</p><footer><span className="client-avatar">אל</span><div><strong>אורי לוי</strong><small>מחשב לעסק קטן</small></div><span className="stars"><Star /><Star /><Star /><Star /><Star /></span></footer></blockquote></div>
        </div>
      </section>

      <section className="section section-muted">
        <div className="container faq-layout"><div className="section-heading"><span className="eyebrow">שאלות נפוצות</span><h2>לפני שמגיעים למעבדה</h2><p>אם לא מצאתם תשובה, אנחנו זמינים בשיחה או ב WhatsApp.</p><a className="button button-ghost" href="/contact">לכל דרכי הקשר</a></div><div className="faq-list"><details open><summary>כמה זמן לוקח אבחון?</summary><p>ברוב המקרים עד 24 שעות. בתקלות מורכבות נעדכן מראש אם נדרש זמן נוסף.</p></details><details><summary>האם האבחון עולה כסף?</summary><p>האבחון הראשוני ללא עלות. בדיקות מעבדה עמוקות יתומחרו מראש ורק לאחר אישור.</p></details><details><summary>האם אפשר להציל קבצים ממחשב שלא נדלק?</summary><p>במקרים רבים כן. נבדוק את מצב הכונן ונציג אפשרויות לפני כל פעולה.</p></details><details><summary>יש אחריות על מחשב מחודש?</summary><p>כן. כל מחשב מחודש מגיע עם 12 חודשי אחריות ודוח בדיקה.</p></details></div></div>
      </section>

      <section className="section"><div className="container cta-panel"><div><h2>המחשב לא מחכה? גם אנחנו לא.</h2><p>השאירו פרטים עכשיו ונחזור אליכם עם הצעד הנכון.</p></div><a className="button button-light" href="/repairs#booking">הזמנת תיקון <ArrowLeft aria-hidden="true" /></a></div></section>
    </>
  );
}
