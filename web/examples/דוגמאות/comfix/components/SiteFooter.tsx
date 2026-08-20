import { Clock3, Mail, MapPin, MonitorCog, Phone } from "lucide-react";
import { DemoAction } from "@/components/DemoAction";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <a className="brand brand-light" href="/">
            <span className="brand-mark"><MonitorCog aria-hidden="true" /></span>
            <span className="brand-copy"><strong>ComFix</strong><small>מחשבים שעובדים בשבילכם</small></span>
          </a>
          <p>מעבדת מחשבים מקומית שמדברת בגובה העיניים. תיקונים, מחשבים וציוד עם הסבר ברור לפני כל החלטה.</p>
          <span className="demo-pill">אתר הדגמה</span>
        </div>
        <div>
          <h2>שירותים</h2>
          <ul className="footer-links">
            <li><a href="/repairs">תיקוני מחשבים</a></li>
            <li><a href="/new-computers">מחשבים חדשים</a></li>
            <li><a href="/refurbished">מחשבים מחודשים</a></li>
            <li><a href="/accessories">רכיבים וציוד נלווה</a></li>
          </ul>
        </div>
        <div>
          <h2>פרטי המעבדה</h2>
          <ul className="contact-list">
            <li><MapPin aria-hidden="true" /> רחוב הברזל 18, תל אביב</li>
            <li><Phone aria-hidden="true" /> <DemoAction className="text-demo-action" message="מספר הטלפון הוא דוגמה בלבד ואינו מחייג.">03 555 0184</DemoAction></li>
            <li><Mail aria-hidden="true" /> <DemoAction className="text-demo-action" message="כתובת הדואר האלקטרוני היא דוגמה בלבד ואינה פותחת הודעה.">hello@comfix.example</DemoAction></li>
            <li><Clock3 aria-hidden="true" /> ראשון עד חמישי, 09:00 עד 19:00</li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>© 2026 ComFix. כל הפרטים, המחירים ופרטי העסק באתר הם לצורכי הדגמה בלבד.</p>
        <a href="/contact">מדיניות פרטיות</a>
      </div>
    </footer>
  );
}
