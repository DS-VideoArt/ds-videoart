# Content Hub, DS Creative Studio

עודכן: 14.9.2026. ה-Hub חי בכתובת https://dscreative.co.il/hub/ ומכיל מאמרים סטטיים. אין framework ואין CMS: כל מאמר הוא קובץ HTML אחד.

## מבנה
- `hub/index.html` עמוד המרכז (`/hub/`), עם כרטיס לכל מאמר.
- `hub/<slug>.html` מאמר (`/hub/<slug>`, בלי סיומת ובלי לוכסן סופי). Netlify מגיש כתובות בלי סיומת; ב-`_redirects` מוסיפים לכל מאמר הפניית 301 מהצורה עם `.html` (כפויה, `301!`) ומהצורה עם לוכסן סופי.
- `hub/content-hub.css` עיצוב משותף (מעל `site.css`).
- `hub/media/<slug>-hero.svg` (או תמונה אחרת) ו-`hub/media/<slug>-og.jpg` (1200×630).
- `tools/seo-check.py` בודק את כל העמודים, כולל המאמרים (רשימת `PAGES`).

## כתובת קנונית
`https://dscreative.co.il/hub/<slug>`. slug באנגלית, מילים מופרדות במקף, ללא תאריכים.

## הוספת מאמר 02 ("דף נחיתה או אתר תדמית, איך באמת יודעים מה צריך?")
1. להעתיק את `hub/do-you-need-a-website.html` ל-`hub/<slug-02>.html` ולעדכן: title, description, canonical, og:url, og:title, og:description, og:image, og:image:alt, article:published_time, ה-JSON-LD (headline, description, url, mainEntityOfPage, datePublished, dateModified, image, פריט הפירורים השלישי), הפירורים הגלויים, ה-H1, ה-meta (תאריך, זמן קריאה), ה-hero (src, alt) והגוף.
2. ליצור ויזואל ייעודי לפי התקן למטה, ולרנדר ממנו OG 1200×630 (Chrome headless, ראו `tools`, או כל כלי אחר).
3. להוסיף כרטיס ב-`hub/index.html` (החדש ראשון), ולמלא את אזור `section.related` בשני המאמרים (עד 3 כרטיסים לכל מאמר). האזור מוסתר כשהוא ריק.
4. במאמר 01, בסוף הסעיף "אז איך מחליטים?", להוסיף משפט קישור טבעי למאמר 02 (למשל: "איך יודעים בפועל מה מתאים לעסק שלכם? על זה במאמר הבא"). לא לפני שמאמר 02 חי.
5. `_redirects`: להוסיף שתי שורות הפניה לכתובת החדשה. `sitemap.xml`: להוסיף `<url>` עם lastmod, ולעדכן lastmod של `/hub/`.
6. `tools/seo-check.py`: להוסיף את הקובץ ל-`PAGES` ולבדיקת הסכמות, ולהריץ. לפרוס רק אחרי שהבדיקה עוברת, ואז לאמת בפרודקשן.

## תקן ויזואלי ל-Hub
כל מאמר מקבל לפחות ויזואל ייעודי אחד שמסביר, משווה, ממחיש או מחזק את רעיון המאמר. לא תמונות דקורטיביות סתם, לא סטוק אנשים, לא טקסט עברי בתוך התמונה, לא UI מזויף שנראה קריא. פלטת DS (plum, stone, sand, terracotta, copper), עומק עדין, נקי. הוויזואלים צריכים להיראות כמשפחה אחת בלי להיות תבנית זהה. Hero ביחס 16:9, רוחב מקור 1600 לפחות, width ו-height מפורשים, לא lazy כשהוא ה-LCP; OG ביחס 1200×630 מאותה שפה ויזואלית; alt תיאורי וקצר. מאמר 01 בוצע כאיור וקטורי (SVG, 9KB) שצויר ידנית בפלטת האתר, וה-OG רונדר ממנו.

## מדיניות אינדוקס
`/hub/` והמאמרים: index, follow, max-image-preview:large, ב-sitemap. אין קטגוריות ריקות, אין עמודי placeholder, אין מאמרים "בקרוב".
