"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Pause, Play, ShieldCheck } from "lucide-react";

const scenes = [
  {
    src: "https://images.unsplash.com/photo-1721332153521-120cb0cd02d9?auto=format&fit=crop&w=1900&q=90",
    label: "במעבדת התיקונים",
    position: "center center",
  },
  {
    src: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=1900&q=90",
    label: "בעמדת הגיימינג",
    position: "center center",
  },
  {
    src: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1900&q=90",
    label: "בהתאמת מחשב חדש",
    position: "center center",
  },
  {
    src: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1900&q=90",
    label: "בבחירת ציוד נלווה",
    position: "center center",
  },
  {
    src: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1900&q=90",
    label: "בבדיקת מחשב מחודש",
    position: "center center",
  },
];

const effects = ["scene-fade", "scene-zoom", "scene-glide", "scene-wipe"];

export function HomeHero() {
  const [active, setActive] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  const selectScene = (next: number) => {
    if (next === active) return;
    setPrevious(active);
    setActive(next);
  };

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActive((current) => {
        setPrevious(current);
        return (current + 1) % scenes.length;
      });
    }, 4300);
    return () => window.clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    if (previous === null) return;
    const timer = window.setTimeout(() => setPrevious(null), 1050);
    return () => window.clearTimeout(timer);
  }, [active, previous]);

  return (
    <section className="immersive-hero" aria-label="ComFix מעבדת מחשבים">
      <div className="scene-stage" aria-hidden="true">
        {previous !== null ? (
          <div className="hero-scene scene-out" style={{ backgroundImage: `url(${scenes[previous].src})`, backgroundPosition: scenes[previous].position }} />
        ) : null}
        <div
          key={active}
          className={`hero-scene scene-current ${effects[active % effects.length]}`}
          style={{ backgroundImage: `url(${scenes[active].src})`, backgroundPosition: scenes[active].position }}
        />
      </div>
      <div className="hero-scrim" aria-hidden="true" />
      <div className="hero-noise" aria-hidden="true" />
      <div className="hero-orbit" aria-hidden="true"><span>CF</span></div>

      <div className="container immersive-inner">
        <div className="immersive-copy">
          <span className="hero-kicker"><span className="status-dot" /> אבחון ראשוני ללא עלות</span>
          <h1>המחשב שלך,<br /><em>חוזר לעבוד</em><br />כמו שצריך.</h1>
          <p>מעבדת מחשבים שמסבירה לפני שמתקנת. שירות מהיר, מחיר ברור ואחריות אמיתית על כל עבודה.</p>
          <div className="button-row hero-actions">
            <a className="button" href="/repairs#booking">הזמנת תיקון <ArrowLeft aria-hidden="true" /></a>
            <a className="button button-glass" href="/new-computers">צפייה במחשבים</a>
          </div>
          <div className="hero-mini-proof"><ShieldCheck aria-hidden="true" /><span><strong>מחיר לפני תיקון</strong><small>ואחריות כתובה בסיום</small></span></div>
        </div>
      </div>

      <div className="scene-meta">
        <span>עכשיו ב ComFix</span>
        <strong key={`label-${active}`}>{scenes[active].label}</strong>
      </div>

      <div className="scene-controls">
        <button type="button" className="scene-pause" onClick={() => setPaused((value) => !value)} aria-label={paused ? "הפעלת החלפת תמונות" : "עצירת החלפת תמונות"}>
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
        </button>
        <div className="scene-dots" aria-label="בחירת תמונת פתיחה">
          {scenes.map((scene, index) => <button key={scene.label} type="button" aria-label={`הצגת ${scene.label}`} aria-pressed={active === index} onClick={() => selectScene(index)} />)}
        </div>
        <div className="scene-progress" key={`progress-${active}`}><span /></div>
      </div>

      <div className="motion-ribbon" aria-hidden="true">
        <div><span>תיקונים</span><i /> <span>מחשבים חדשים</span><i /> <span>מחשבים מחודשים</span><i /> <span>שדרוגים</span><i /> <span>ציוד נלווה</span><i /></div>
        <div><span>תיקונים</span><i /> <span>מחשבים חדשים</span><i /> <span>מחשבים מחודשים</span><i /> <span>שדרוגים</span><i /> <span>ציוד נלווה</span><i /></div>
      </div>
    </section>
  );
}
