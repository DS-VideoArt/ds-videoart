# ANALYTICS-QA — DS Creative Studio (dscreative.co.il)

עודכן: 7.9.2026, אחרי פרסום לפרודקשן.

## 1. GA4 Measurement ID בפועל

`G-7VK30G4GVC`, מוגדר במקום אחד בלבד: הקבוע `MEASUREMENT_ID` בראש `analytics.js`. ללא Google Tag Manager. אין כלי מדידה נוסף.

## 2. איך ההסכמה עובדת

- ברירת מחדל: אין מדידה. הקוד של Google לא נטען עד להחלטה מפורשת.
- בביקור הראשון מופיע כרטיס קטן בתחתית המסך: "כדי להבין איך משתמשים באתר ולשפר אותו, אנחנו משתמשים ב-Google Analytics. אפשר לאשר או להמשיך בלי מדידה." עם "אישור מדידה", "להמשיך בלי" וקישור למדיניות הפרטיות.
- "אישור מדידה": נשמר בדפדפן (`localStorage`, מפתח `dsc_consent_v1`), `gtag.js` נטען מ-googletagmanager.com, `page_view` נשלח, ואירועים שקרו באותו עמוד לפני האישור נשלחים.
- "להמשיך בלי": נשמר, שום דבר לא נטען, אירועים נזרקים, אין הודעה בביקור הבא.
- שינוי הבחירה: הקישור "הגדרות מדידה" בתחתית העמוד.
- בנייד ההודעה יושבת מעל פס הכפתורים הדביק (בבית ובבונה).

## 3. רשימת האירועים

| אירוע | מתי | היכן |
|---|---|---|
| `page_view` | בטעינת עמוד, אחרי אישור | `analytics.js` |
| `builder_view` | בכניסה ל-`/builder/` | `builder/project-builder.js` |
| `builder_start` | פעם אחת בכל סשן בונה, באינטראקציה אמיתית ראשונה | `builder/project-builder.js` |
| `service_selected` | בבחירת דף נחיתה או אתר תדמית | `builder/project-builder.js` |
| `builder_step_view` | במעבר לשלב חדש, לא ברענון של אותו שלב | `builder/project-builder.js` |
| `builder_summary_view` | בהגעה למסך הסיכום | `builder/project-builder.js` |
| `project_request_submitted` | רק אחרי תשובת הצלחה מהשרת לטופס `project-request` | `builder/project-builder.js` |
| `contact_request_submitted` | רק אחרי תשובת הצלחה מהשרת לטופס `contact-request` | `site.js` |
| `builder_reset` | ב"להתחיל מחדש" | `builder/project-builder.js` |

## 4. פרמטרים (רשימה סגורה, מסוננת ב-`analytics.js`)

- `service_type`: `landing_page` / `website` / `unsure`
- `step_number`: מספר. `step_name`: מזהה השלב.
- `custom_quote`: true / false. `maintenance_plan`: `none` / `basic` / `extended` / `not_selected`.
- `setup_total`: מספר בלבד, ורק כשאין מחיר מותאם.
- אין טקסט חופשי, שם, טלפון, אימייל, שם עסק או תוכן טופס. אומת בפרודקשן על גוף הבקשות ל-Google.

## 5. Key Events

לסמן ב-GA4 (Admin → Events): `project_request_submitted`, `contact_request_submitted`. לא לסמן: `page_view`, `builder_view`, `builder_start`, `service_selected`. **דורש פעולה ידנית** בממשק GA4, אין לי גישה ל-property.

## 6. Search Console

**לא בוצע, לפי ההנחיה.** האתר מוכן: Domain property עם TXT ב-DNS (פעולה שלכם), או URL-prefix עם תג HTML שאוסיף כשיימסר token אמיתי.

## 7. שיטת האימות

ממתין להחלטה. robots.txt ו-sitemap.xml כבר באוויר, כך שאחרי האימות אפשר להגיש את ה-sitemap מיד.

## 8. Sitemap

`https://dscreative.co.il/sitemap.xml` מחזיר 200 ומכיל עמוד אחד: `https://dscreative.co.il/`. הבונה הוא מסלול המרה ולא תוכן SEO, והעמודים המשפטיים לא נכללו רק כי הם קיימים. מדיניות האינדוקס של העמודים עצמם לא השתנתה (הבונה נשאר `index, follow` כפי שהיה). אין הפניות ל-netlify.app.

## 9. robots.txt

`https://dscreative.co.il/robots.txt` מחזיר 200: מאפשר הכול ומצביע על ה-sitemap. המסלולים הישנים נשארים זחילים כדי שה-`noindex` שלהם ייקרא.

## 10. UTM

לא נגעה. חמשת השדות נשלחים ל-Netlify בשני הטפסים. `/ig-a1` ו-`/fb-a1` מפנים ב-302 עם ה-UTM המלאים. GA4 מקבל את ה-UTM דרך `page_location` (אומת בבקשה ל-Google: הכתובת המלאה עם utm_source=instagram). אין לוגיקת attribution כפולה.

## 11. בדיקות בפרודקשן (7.9.2026, deploy 6a9f241f ואחריו 6a9f24eb)

- לפני החלטה: הודעה מוצגת, אין סקריפט של Google, אפס בקשות ל-Google. PASS
- דחייה: ההודעה נעלמת, מעבר לבונה דרך `/ig-a1` בלי סקריפט, בלי בקשות, בלי אירועים, הבחירה נשמרת. PASS
- אישור: סקריפט `gtag.js` יחיד, בקשה ראשונה ל-www.google-analytics.com עם `tid=G-7VK30G4GVC` ו-`en=page_view`. PASS
- שמירת הבחירה: ביקור חוזר בבית ובבונה בלי הודעה, סקריפט יחיד. PASS
- CSP: אפס שגיאות קונסול, הבקשות ל-googletagmanager.com ול-google-analytics.com עוברות. PASS
- אירועים שנשלחו בפועל ל-Google (נלכדו מגוף ה-beacons): `page_view`, `builder_view`, `builder_reset`, `builder_step_view`, `service_selected`, `builder_start`, עם `ep.service_type` ו-`ep.step_name`. PASS
- `builder_summary_view` בפרודקשן: `{service_type: landing_page, custom_quote: false, maintenance_plan: none, setup_total: 540}`. PASS
- `project_request_submitted`: לא נשלח לפני הלחיצה, נשלח רק אחרי "הבקשה התקבלה", עם אותם פרמטרים. הבקשה הגיעה ל-Netlify עם UTM. PASS
- `contact_request_submitted`: נשלח רק אחרי "קיבלנו", עם `service_type: website`. הבקשה הגיעה ל-Netlify עם UTM. PASS
- `builder_start` פעם אחת; `builder_step_view` בלי כפילות ברענון. PASS
- נייד 390: בית ובונה בלי גלילה אופקית, ההודעה מעל הפסים הדביקים. PASS
- מחירים: 33 מקרי בדיקה אוטומטיים עוברים; טפסים עובדים כמו קודם. PASS

## 12. מגבלות ידועות

- ה-Realtime של GA4 עצמו לא נבדק מתוך ממשק Google (אין גישה). אומתו הבקשות היוצאות עצמן.
- מבקר שדחה ואחר כך אישר באותו עמוד מאבד את האירועים שקרו לפני האישור באותה טעינה.
- Key Events וSearch Console דורשים פעולות ידניות שלכם.
- רשומות בדיקה "DS Production Test / PRODUCTION QA — DELETE" נשארו ב-Netlify.

## 13. Final verdict

**ANALYTICS READY.** נדרש מכם: סימון שני ה-Key Events ב-GA4, ובחירת שיטת אימות ל-Search Console.
