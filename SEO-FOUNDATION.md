# SEO Foundation, DS Creative Studio (dscreative.co.il)

עודכן: 14.9.2026. מסמך זה מתעד את ההחלטות הטכניות והסמנטיות של תשתית הסריקה והאינדוקס, ואת מדיניות ההרחבה.

## טכנולוגיה ופריסה
אתר סטטי (HTML, CSS, JS) בלי שלב build. Netlify מפרסם את שורש הריפו DS-VideoArt/ds-videoart (ענף main) ישירות. Pretty URLs מופעל (כתובות ללא סיומת .html). כל מטא-דאטה, JSON-LD, robots.txt ו-sitemap.xml הם קבצים סטטיים בריפו, ומקור האמת היחיד הוא ה-HTML עצמו (אין הזרקה ב-JavaScript).

## ישות המותג
השם הרשמי: DS Creative Studio. מופיע ב-title (בתחילתו), ב-og:site_name, ב-og:title, בלוגו הטקסטואלי בכותרת, בפסקת "אודות" ("ב-DS Creative Studio מתמקדים בדבר אחד: דפי נחיתה ואתרי תדמית לעסקים"), בפוטר, ב-manifest, ובסכמות Organization ו-WebSite. ה-H1 נשאר טקסט המרה ("אתר לעסק שלכם. בלי פרויקט על הראש.") בכוונה.

## מלאי כתובות ומדיניות אינדוקס
| כתובת | סיווג | robots | canonical | הערה |
|---|---|---|---|---|
| / | INDEX | index, follow, max-image-preview:large | https://dscreative.co.il/ | ב-sitemap |
| /hub/ | INDEX | index, follow, max-image-preview:large | https://dscreative.co.il/hub/ | מרכז התוכן, ב-sitemap |
| /hub/do-you-need-a-website | INDEX | index, follow, max-image-preview:large | self | מאמר 01, ב-sitemap. ראו CONTENT-HUB.md |
| /hub/landing-page-or-business-website | INDEX | index, follow, max-image-preview:large | self | מאמר 02, ב-sitemap |
| /builder/ | NOINDEX | noindex, follow | https://dscreative.co.il/builder/ | אשף; התוכן נטען ב-JavaScript, ואינו תוצאת חיפוש עצמאית טובה. דף הבית הוא נקודת הכניסה |
| /privacy | LEGAL | index, follow | https://dscreative.co.il/privacy | כתובת פרטיות קבועה (גם ל-Meta ול-LinkedIn) |
| /legal/terms | LEGAL | index, follow | https://dscreative.co.il/legal/terms | הצורה עם .html מפנה 301 |
| /legal/accessibility | LEGAL | index, follow | https://dscreative.co.il/legal/accessibility | הצורה עם .html מפנה 301 |
| /card, /qr | UTILITY | noindex, follow | self | כרטיס ביקור דיגיטלי לסריקת QR |
| /ig-a1, /fb-a1, /ig-440a1, /fb-440a1, /ig-a1-h1, /fb-a1-h1, /ig-440a1-h2, /fb-440a1-h2 | CAMPAIGN | (302) | | הפניות לבונה עם UTM. לא עמודים |
| /privacy.html, /privacy/, /legal/privacy, /legal/privacy.html | REDIRECT | (301) | | לכתובת הקבועה |
| /videoart/*, /web/*, /lab/*, /creative/* | ARCHIVE | noindex, nofollow | | ארכיון של המותג הקודם DS VideoArt. לא מקושר מהאתר. מומלץ להסיר או להפנות בעתיד |
| /404.html וכל כתובת לא קיימת | 404 | noindex, follow | | 404 אמיתי ממותג |
| https://ds-videoart.netlify.app/* | REDIRECT | (301!) | | דומיין ברירת המחדל של Netlify מפנה לדומיין הראשי |

## עמודים משפטיים
נשארים index, follow (אין נזק, ומדיניות הפרטיות חייבת להיות נגישה כ-URL רשמי). אינם ב-sitemap ואינם חלק מאשכולות תוכן.

## sitemap.xml
מכיל רק כתובות שרוצים באינדקס: דף הבית, /hub/ והמאמרים. כל כתובת חייבת להיות קנונית, ציבורית, 200, ללא הפניה וללא noindex.
הרחבה עתידית ל-Content Hub: כל מאמר מתפרסם ככתובת קבועה `/hub/<slug>` (קובץ `hub/<slug>.html` או `hub/<slug>/index.html`), עם title ו-description ייחודיים, canonical עצמי, robots index, JSON-LD מסוג Article (headline, datePublished, dateModified, author, publisher ← Organization @id, image) ו-BreadcrumbList, קישורים פנימיים לדף הבית ולמאמרים קרובים, והוספת `<url>` ל-sitemap עם lastmod. עמוד אינדקס `/hub/` ייכנס ל-sitemap רק כשיש בו לפחות מאמר אחד. אין ליצור קטגוריות ריקות. מומלץ סקריפט קטן שמייצר את ה-sitemap מרשימת המאמרים כדי למנוע טעויות ידניות.

## סכמות
JSON-LD אחד בדף הבית עם @graph: Organization (@id #organization: name, url, logo 512×512, image, description, telephone, contactPoint, areaServed IL, sameAs, makesOffer עם שני מחירי החבילה הבסיסית) ו-WebSite (@id #website: name, url, inLanguage he-IL, publisher). לא LocalBusiness: אין כתובת פיזית ציבורית מאושרת, אין שעות פעילות. ה-ProfessionalService הקודם (תת-סוג של LocalBusiness) הוחלף.

## sameAs (אומתו חיים ב-14.9.2026)
- https://www.facebook.com/p/DS-Creative-Studio-61593417119660/ (ה-og:url שפייסבוק עצמה מציגה לעמוד)
- https://www.instagram.com/dscreative_studio/
- https://www.linkedin.com/company/ds-creative-studio/

## דומיין
https://dscreative.co.il/ בלבד. http ← https (301), www ← ללא www (301), Netlify default subdomain ← הדומיין (301 כפוי). HSTS פעיל. אין netlify.toml; ההגדרות ב-_redirects ו-_headers.

## Search Console
Domain property dscreative.co.il, אימות TXT ב-JetServer (פעולה ידנית של המשתמש, בלי שינוי nameservers, בלי Cloudflare). אחרי האימות: הגשת sitemap, בדיקת URL ובקשת אינדוקס לדף הבית.

## Google Business Profile
לא מומלץ ליצור: DS פועל כשירות דיגיטלי ללא כתובת פיזית לקבלת לקוחות, ואין להמציא מיקום כדי לעמוד בתנאי הזכאות.
