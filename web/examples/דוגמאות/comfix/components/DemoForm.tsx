"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

export function DemoForm({ variant }: { variant: "repair" | "contact" }) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    form.reset();
    setSubmitted(true);
  }

  return (
    <form className="demo-form" onSubmit={handleSubmit} onChange={() => setSubmitted(false)}>
      <div className="form-grid">
        <label>
          <span>שם מלא</span>
          <input name="name" autoComplete="name" required placeholder="איך לפנות אליכם?" />
        </label>
        <label>
          <span>טלפון</span>
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required pattern="[0-9 +]{9,14}" placeholder="050 123 4567" />
        </label>
        <label>
          <span>דואר אלקטרוני</span>
          <input name="email" type="email" autoComplete="email" placeholder="name@example.com" />
        </label>
        {variant === "repair" ? (
          <>
            <label>
              <span>סוג המכשיר</span>
              <select name="device" required defaultValue="">
                <option value="" disabled>בחירת מכשיר</option>
                <option>מחשב נייד</option><option>מחשב נייח</option><option>מחשב גיימינג</option><option>מחשב Apple</option><option>אחר</option>
              </select>
            </label>
            <label>
              <span>רמת דחיפות</span>
              <select name="urgency" required defaultValue="רגיל">
                <option>רגיל</option><option>דחוף, המחשב מושבת</option><option>אפשר לתאם לשבוע הבא</option>
              </select>
            </label>
          </>
        ) : (
          <label>
            <span>נושא הפנייה</span>
            <select name="topic" defaultValue="רכישת מחשב">
              <option>רכישת מחשב</option><option>מחשב מחודש</option><option>ציוד נלווה</option><option>שאלה על תיקון</option><option>אחר</option>
            </select>
          </label>
        )}
        <label className="full-field">
          <span>{variant === "repair" ? "מה קרה למחשב?" : "איך נוכל לעזור?"}</span>
          <textarea name="description" required rows={5} placeholder={variant === "repair" ? "ספרו מה לא עובד, מתי התקלה התחילה ומה כבר ניסיתם" : "כתבו כמה מילים ונחזור אליכם"} />
        </label>
      </div>
      <label className="consent-field"><input type="checkbox" required /> <span>אני מאשר או מאשרת שיחזרו אליי בנוגע לפנייה</span></label>
      <button className="button" type="submit"><Send aria-hidden="true" /> {variant === "repair" ? "שליחת בקשת תיקון" : "שליחת הפנייה"}</button>
      <p className="form-note">זהו טופס הדגמה. הפרטים אינם נשלחים ואינם נשמרים.</p>
      {submitted ? <div className="form-success" role="status"><CheckCircle2 aria-hidden="true" /><span><strong>הפרטים נקלטו בהדגמה.</strong> באתר אמיתי הפנייה תישלח ישירות לעסק.</span></div> : null}
    </form>
  );
}
