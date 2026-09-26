import type { Metadata } from "next";
import { ArrowLeft, Clock3, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Sparkles, ThumbsUp } from "lucide-react";
import { DemoForm } from "@/components/DemoForm";
import { DemoAction } from "@/components/DemoAction";

export const metadata: Metadata = { title: "אודות ויצירת קשר", description: "הכירו את ביט ובורג, מעבדת מחשבים בדיונית שנבנתה להדגמה, ואת טופס הפנייה לדוגמה." };

export default function ContactPage() {
  return (
    <>
      <section className="page-hero"><div className="container page-hero-inner"><div className="breadcrumb"><a href="/">עמוד הבית</a><span>›</span><span>אודות ויצירת קשר</span></div><span className="eyebrow">אנשים לפני מחשבים</span><h1>שירות טכני בלי מילים מסובכות</h1><p>ביט ובורג נולדה, בסיפור ההדגמה, כדי לתת לאנשים כתובת אחת אמינה למחשב שלהם. מסבירים ברור, מתאמים ציפיות ועומדים מאחורי העבודה.</p><a className="button" href="#contact-form">דברו איתנו <ArrowLeft aria-hidden="true" /></a></div></section>

      <section className="section"><div className="container split"><div><span className="eyebrow">הסיפור שלנו</span><h2>טכנולוגיה טובה צריכה להרגיש פשוטה</h2><p>המעבדה המומצאת ביט ובורג התחילה משולחן עבודה קטן ושאלה אחת שחזרה שוב ושוב: למה כל תיקון מחשב מרגיש כמו הימור?</p><p>בנינו תהליך שבו קודם מבינים את הצורך, אחר כך מאבחנים ורק אז מציעים פתרון. אותה גישה מלווה אותנו בתיקונים, במכירת מחשבים ובהתאמת ציוד.</p><div className="value-grid"><article><ShieldCheck aria-hidden="true" /><strong>שקיפות</strong><span>מחיר ואפשרויות לפני החלטה</span></article><article><ThumbsUp aria-hidden="true" /><strong>אחריות</strong><span>כתובת אחת גם אחרי המסירה</span></article><article><Sparkles aria-hidden="true" /><strong>פשטות</strong><span>הסברים שכל אחד מבין</span></article></div></div><div className="image-frame"><img src="https://images.unsplash.com/photo-1721332149346-00e39ce5c24f?auto=format&fit=crop&w=1400&q=85" alt="עבודה על רכיבי מחשב במעבדה" width="900" height="1000" /><div className="image-note"><strong>עסק בדיוני</strong><span>הסיפור והתמונות בעמוד הם המחשה</span></div></div></div></section>

      <section className="section section-muted" id="contact-form"><div className="container form-layout contact-layout"><div><span className="eyebrow">פרטי המעבדה</span><h2>בואו נדבר</h2><p>אפשר להגיע למעבדה, להתקשר או לשלוח הודעה. פרטי העסק בעמוד הם חלק מאתר ההדגמה.</p><ul className="contact-cards"><li><span><MapPin aria-hidden="true" /></span><div><strong>כתובת</strong><p>תל אביב · לעסק הבדיוני אין כתובת</p></div></li><li><span><Phone aria-hidden="true" /></span><div><strong>טלפון</strong><p><DemoAction className="text-demo-action" message="באתר ההדגמה אין מספר טלפון אמיתי.">טלפון לדוגמה</DemoAction></p></div></li><li><span><Mail aria-hidden="true" /></span><div><strong>דואר אלקטרוני</strong><p><DemoAction className="text-demo-action" message="כתובת הדואר האלקטרוני היא דוגמה בלבד ואינה פותחת הודעה.">hello@bit-uborg.example</DemoAction></p></div></li><li><span><Clock3 aria-hidden="true" /></span><div><strong>שעות פעילות</strong><p>ראשון עד חמישי 09:00 עד 19:00<br />שישי 09:00 עד 13:00</p></div></li></ul><DemoAction className="button button-ghost" message="באתר אמיתי הכפתור יפתח שיחת WhatsApp. כאן הוא נשאר בתוך אתר ההדגמה."><MessageCircle aria-hidden="true" /> פתיחת WhatsApp</DemoAction></div><div className="form-card"><h2>השאירו פרטים</h2><p>נחזור אליכם עם תשובה פשוטה וברורה.</p><DemoForm variant="contact" /></div></div></section>

      <section className="section-sm"><div className="container demo-notice"><strong>אתר הדגמה · עסק בדיוני</strong><p>ביט ובורג הוא עסק מומצא. אין לו כתובת, טלפון או לקוחות. השם, ההמלצות, הנתונים והמחירים מוצגים כדי להמחיש אתר תדמית של עסק.</p></div></section>
    </>
  );
}
