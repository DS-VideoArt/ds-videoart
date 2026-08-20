import type { Metadata } from "next";
import { ArrowLeft, Clock3, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Sparkles, ThumbsUp } from "lucide-react";
import { DemoForm } from "@/components/DemoForm";
import { DemoAction } from "@/components/DemoAction";

export const metadata: Metadata = { title: "אודות ויצירת קשר", description: "הכירו את ComFix ופנו אלינו לייעוץ, תיקון או התאמת מחשב." };

export default function ContactPage() {
  return (
    <>
      <section className="page-hero"><div className="container page-hero-inner"><div className="breadcrumb"><a href="/">עמוד הבית</a><span>›</span><span>אודות ויצירת קשר</span></div><span className="eyebrow">אנשים לפני מחשבים</span><h1>שירות טכני בלי מילים מסובכות</h1><p>ComFix נולדה כדי לתת לאנשים כתובת אחת אמינה למחשב שלהם. מסבירים ברור, מתאמים ציפיות ועומדים מאחורי העבודה.</p><a className="button" href="#contact-form">דברו איתנו <ArrowLeft aria-hidden="true" /></a></div></section>

      <section className="section"><div className="container split"><div><span className="eyebrow">הסיפור שלנו</span><h2>טכנולוגיה טובה צריכה להרגיש פשוטה</h2><p>המעבדה המומצאת ComFix התחילה משולחן עבודה קטן ושאלה אחת שחזרה שוב ושוב: למה כל תיקון מחשב מרגיש כמו הימור?</p><p>בנינו תהליך שבו קודם מבינים את הצורך, אחר כך מאבחנים ורק אז מציעים פתרון. אותה גישה מלווה אותנו בתיקונים, במכירת מחשבים ובהתאמת ציוד.</p><div className="value-grid"><article><ShieldCheck aria-hidden="true" /><strong>שקיפות</strong><span>מחיר ואפשרויות לפני החלטה</span></article><article><ThumbsUp aria-hidden="true" /><strong>אחריות</strong><span>כתובת אחת גם אחרי המסירה</span></article><article><Sparkles aria-hidden="true" /><strong>פשטות</strong><span>הסברים שכל אחד מבין</span></article></div></div><div className="image-frame"><img src="https://images.unsplash.com/photo-1721332149346-00e39ce5c24f?auto=format&fit=crop&w=1400&q=85" alt="עבודה מקצועית על רכיבי מחשב במעבדת ComFix" width="900" height="1000" /><div className="image-note"><strong>12 שנות ניסיון</strong><span>נתון המחשה עבור אתר ההדגמה</span></div></div></div></section>

      <section className="section section-muted" id="contact-form"><div className="container form-layout contact-layout"><div><span className="eyebrow">פרטי המעבדה</span><h2>בואו נדבר</h2><p>אפשר להגיע למעבדה, להתקשר או לשלוח הודעה. פרטי העסק בעמוד הם חלק מאתר ההדגמה.</p><ul className="contact-cards"><li><span><MapPin aria-hidden="true" /></span><div><strong>כתובת</strong><p>רחוב הברזל 18, תל אביב</p></div></li><li><span><Phone aria-hidden="true" /></span><div><strong>טלפון</strong><p><DemoAction className="text-demo-action" message="מספר הטלפון הוא דוגמה בלבד ואינו מחייג.">03 555 0184</DemoAction></p></div></li><li><span><Mail aria-hidden="true" /></span><div><strong>דואר אלקטרוני</strong><p><DemoAction className="text-demo-action" message="כתובת הדואר האלקטרוני היא דוגמה בלבד ואינה פותחת הודעה.">hello@comfix.example</DemoAction></p></div></li><li><span><Clock3 aria-hidden="true" /></span><div><strong>שעות פעילות</strong><p>ראשון עד חמישי 09:00 עד 19:00<br />שישי 09:00 עד 13:00</p></div></li></ul><DemoAction className="button button-ghost" message="באתר אמיתי הכפתור יפתח שיחת WhatsApp. כאן הוא נשאר בתוך אתר ההדגמה."><MessageCircle aria-hidden="true" /> פתיחת WhatsApp</DemoAction></div><div className="form-card"><h2>השאירו פרטים</h2><p>נחזור אליכם עם תשובה פשוטה וברורה.</p><DemoForm variant="contact" /></div></div></section>

      <section className="section-sm"><div className="container demo-notice"><strong>זוהי הדגמת אתר</strong><p>ComFix הוא עסק מומצא. הכתובת, הטלפון, ההמלצות והמחירים מוצגים כדי להמחיש אתר עסקי מלא.</p></div></section>
    </>
  );
}
