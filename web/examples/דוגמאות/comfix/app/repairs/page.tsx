import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, Clock3, DatabaseBackup, Fan, Gauge, Laptop, ShieldCheck, Wrench } from "lucide-react";
import { DemoForm } from "@/components/DemoForm";
import { DemoAction } from "@/components/DemoAction";

export const metadata: Metadata = { title: "תיקוני מחשבים", description: "אבחון ותיקון מחשבים עם הצעת מחיר ברורה לפני תחילת העבודה." };

const services = [
  { icon: Laptop, title: "מחשב לא נדלק", text: "אבחון ספק כוח, סוללה, שקע טעינה ולוח אם." },
  { icon: Gauge, title: "המחשב איטי", text: "בדיקת אחסון, זיכרון, עומס תוכנות וחום." },
  { icon: Fan, title: "רעש והתחממות", text: "ניקוי מערכת הקירור, בדיקת מאווררים ומשחה תרמית." },
  { icon: DatabaseBackup, title: "שחזור וגיבוי", text: "הצלת קבצים, מעבר לכונן חדש והקמת גיבוי מסודר." },
  { icon: ShieldCheck, title: "וירוסים ואבטחה", text: "ניקוי תוכנות זדוניות, עדכונים והקשחת המחשב." },
  { icon: Wrench, title: "שדרוג ותיקון", text: "מסכים, מקלדות, אחסון, זיכרון ושקעי טעינה." },
];

const prices = [
  ["אבחון תקלה", "ללא עלות", "עד 24 שעות"],
  ["ניקוי מערכת קירור", "החל מ 220 ₪", "יום עבודה"],
  ["התקנת כונן והעברת מידע", "החל מ 280 ₪", "יום עבודה"],
  ["התקנת מערכת הפעלה", "החל מ 250 ₪", "עד 24 שעות"],
  ["החלפת מסך למחשב נייד", "החל מ 490 ₪", "אחד עד שלושה ימים"],
  ["שחזור מידע", "החל מ 350 ₪", "לפי מצב הכונן"],
];

export default function RepairsPage() {
  return (
    <>
      <section className="page-hero repair-hero">
        <div className="container page-hero-inner">
          <div className="breadcrumb"><a href="/">עמוד הבית</a><span>›</span><span>תיקוני מחשבים</span></div>
          <span className="eyebrow">אבחון לפני שמחליטים</span>
          <h1>המחשב תקוע? אנחנו מחזירים אותו למסלול</h1>
          <p>מסבירים מה התקלקל, מציגים מחיר לפני שמתחילים ומתקנים רק את מה שצריך. אבחון ראשוני ללא עלות.</p>
          <div className="button-row"><a className="button" href="#booking">הזמנת תיקון <ArrowLeft aria-hidden="true" /></a><DemoAction className="button button-secondary" message="באתר אמיתי הכפתור יחייג ישירות לטכנאי. באתר ההדגמה לא מתבצעת שיחה.">שיחה עם טכנאי</DemoAction></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading"><span className="eyebrow">מה אנחנו מתקנים</span><h2>מתקלה קטנה ועד מחשב מושבת</h2><p>ציוד בדיקה מקצועי, חלקים איכותיים ותהליך שקוף לכל אורך הדרך.</p></div>
          <div className="service-grid">{services.map(({ icon: Icon, title, text }) => <article className="icon-card card" key={title}><span className="icon-wrap"><Icon aria-hidden="true" /></span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>

      <section className="section section-muted">
        <div className="container">
          <div className="section-heading"><span className="eyebrow">מחירים לדוגמה</span><h2>יודעים את המחיר לפני התיקון</h2><p>המחיר הסופי נקבע לאחר אבחון ובהתאם לדגם ולחלקים הנדרשים. לא מתחילים עבודה ללא אישור.</p></div>
          <div className="price-table" role="table" aria-label="מחירי תיקונים לדוגמה">
            <div className="price-row price-head" role="row"><span role="columnheader">שירות</span><span role="columnheader">מחיר</span><span role="columnheader">זמן משוער</span></div>
            {prices.map(([service, price, time]) => <div className="price-row" role="row" key={service}><strong role="cell">{service}</strong><span role="cell">{price}</span><span role="cell"><Clock3 aria-hidden="true" /> {time}</span></div>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div className="image-frame"><img src="https://images.unsplash.com/photo-1721332153521-120cb0cd02d9?auto=format&fit=crop&w=1400&q=85" alt="טכנאי ComFix עובד על מחשב נייד פתוח" width="900" height="1000" /><div className="image-note"><strong>אבחון עד 24 שעות</strong><span>מקבלים הסבר והצעת מחיר לפני כל פעולה</span></div></div>
          <div><span className="eyebrow">ככה זה עובד</span><h2>שלושה צעדים וחוזרים לעבוד</h2><div className="stacked-steps"><article><span>1</span><div><h3>מוסרים את המחשב</h3><p>במעבדה או בתיאום איסוף באזור תל אביב.</p></div></article><article><span>2</span><div><h3>מקבלים אבחון</h3><p>הסבר פשוט, מחיר מדויק וזמן טיפול משוער.</p></div></article><article><span>3</span><div><h3>מאשרים ומתקנים</h3><p>רק לאחר אישור שלכם. בסיום מקבלים דוח ואחריות.</p></div></article></div><ul className="check-list privacy-list"><li><CheckCircle2 aria-hidden="true" /> לא פותחים קבצים אישיים שאינם קשורים לתקלה</li><li><CheckCircle2 aria-hidden="true" /> לא מוחקים מידע ללא אישור מפורש</li><li><CheckCircle2 aria-hidden="true" /> כל תיקון מתועד ומגובה באחריות</li></ul></div>
        </div>
      </section>

      <section className="section section-dark" id="booking">
        <div className="container form-layout"><div><span className="eyebrow">הזמנת תיקון</span><h2>ספרו לנו מה קרה</h2><p>מלאו את הפרטים ונוכל להכין את השיחה הראשונה מראש. באתר עסקי אמיתי הטופס יגיע ישירות למעבדה.</p><div className="mini-trust"><ShieldCheck aria-hidden="true" /><span><strong>הפרטים נשארים פרטיים</strong><small>באתר ההדגמה דבר לא נשלח או נשמר</small></span></div></div><div className="form-card"><DemoForm variant="repair" /></div></div>
      </section>
    </>
  );
}
