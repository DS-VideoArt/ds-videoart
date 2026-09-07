# ANALYTICS-QA — DS Creative Studio (dscreative.co.il)

עודכן: 7.9.2026. מסמך זה מתאר את שכבת המדידה של האתר, מה נבדק, ומה עדיין חסר.

## 1. GA4 Measurement ID בפועל

**עדיין לא הוגדר.** בסריקה של כל הפרויקט, הסביבה והתיעוד לא נמצא מזהה מדידה של DS Creative Studio, ולא הומצא אחד.
המקום היחיד שבו המזהה מוגדר: הקבוע `MEASUREMENT_ID` בראש הקובץ `analytics.js`. כל עוד הוא ריק, שכבת המדידה כבויה לחלוטין: אין הודעת הסכמה, לא נטען קוד של Google, ולא נשלחת שום בקשה.

## 2. איך ההסכמה עובדת

- ברירת מחדל: אין מדידה. הקוד של Google לא נטען עד להחלטה מפורשת של המבקר.
- בביקור הראשון (רק כשיש מזהה) מופיע כרטיס קטן בתחתית המסך: "כדי להבין איך משתמשים באתר ולשפר אותו, אנחנו משתמשים ב-Google Analytics. אפשר לאשר או להמשיך בלי מדידה." עם "אישור מדידה", "להמשיך בלי" וקישור למדיניות הפרטיות.
- "אישור מדידה": הבחירה נשמרת בדפדפן (`localStorage`, מפתח `dsc_consent_v1`), הקוד של Google נטען, `page_view` נשלח, ואירועים שקרו באותו עמוד לפני האישור נשלחים גם הם.
- "להמשיך בלי": הבחירה נשמרת, שום דבר לא נטען, אירועים נזרקים. בביקור הבא הבחירה מכובדת ואין הודעה.
- שינוי הבחירה: הקישור "הגדרות מדידה" בתחתית העמוד פותח את ההודעה מחדש.
- אין פלטפורמת עוגיות חיצונית. לא נטענים Meta Pixel, Google Ads, GTM או כל כלי אחר.

## 3. רשימת האירועים

| אירוע | מתי | היכן בקוד |
|---|---|---|
| `page_view` | בטעינת עמוד, אחרי אישור | `analytics.js` |
| `builder_view` | בכניסה ל-`/builder/` | `builder/project-builder.js` |
| `builder_start` | פעם אחת בכל סשן בונה, באינטראקציה אמיתית ראשונה (בחירה או הקלדה), לא בטעינה | `builder/project-builder.js` |
| `service_selected` | בבחירת דף נחיתה או אתר תדמית | `builder/project-builder.js` |
| `builder_step_view` | במעבר לשלב חדש. רענון של אותו שלב לא שולח שוב | `builder/project-builder.js` |
| `builder_summary_view` | בהגעה למסך הסיכום | `builder/project-builder.js` |
| `project_request_submitted` | רק אחרי תשובת הצלחה מהשרת לטופס `project-request` | `builder/project-builder.js` |
| `contact_request_submitted` | רק אחרי תשובת הצלחה מהשרת לטופס `contact-request` | `site.js` |
| `builder_reset` | ב"להתחיל מחדש" אחרי אישור | `builder/project-builder.js` |

## 4. פרמטרים

רק פרמטרים מהרשימה הסגורה הבאה עוברים, וכל ערך אחר מסונן ב-`analytics.js`. אין טקסט חופשי, אין שם, טלפון, אימייל, שם עסק או תוכן טופס.

- `service_type`: `landing_page` / `website` / `unsure`
- `step_number`: מספר
- `step_name`: מזהה השלב (למשל `business`, `site-scope`, `summary`)
- `custom_quote`: true / false
- `maintenance_plan`: `none` / `basic` / `extended` / `not_selected`
- `setup_total`: מספר בלבד, ורק כשאין מחיר מותאם. כשנדרש מחיר מותאם הפרמטר לא נשלח.

## 5. Key Events

מיועדים לסימון כ-Key Events ב-GA4: `project_request_submitted`, `contact_request_submitted`.
לא לסמן: `page_view`, `builder_view`, `builder_start`, `service_selected`.
**סטטוס: דורש סימון ידני** ב-GA4 (Admin → Events → Mark as key event) אחרי שהאירועים יתחילו להגיע. אין לי גישה להגדרות ה-property.

## 6. Search Console

**סטטוס: VERIFICATION REQUIRED.** אין בסביבה credentials של Google, ולכן לא ניתן ליצור או לאמת property. לא הומצא token.
מומלץ: Domain property עבור `dscreative.co.il`. האימות דורש רשומת TXT אצל ספק ה-DNS. אם תעדיפו URL-prefix עם תג HTML, שלחו את ה-content של `google-site-verification` ואוסיף אותו ל-`index.html`.

## 7. שיטת האימות (מוכן לקליטה)

- Domain property: הוסיפו את רשומת ה-TXT שגוגל תיתן לכם ב-DNS. אני לא נוגע ב-DNS.
- URL-prefix: תג `<meta name="google-site-verification" content="...">` ב-`index.html`, יתווסף רק עם token אמיתי שתמסרו.
- robots.txt ו-sitemap.xml כבר מוכנים (ראו למטה), כך שאחרי האימות אפשר להגיש את ה-sitemap מיד.

## 8. Sitemap

`sitemap.xml` חדש בשורש האתר, חמישה עמודים בלבד: הבית, הבונה, פרטיות, תנאים, נגישות. עמודי הדוגמה והמסלולים הישנים (`web`, `videoart`, `lab`, `creative`) לא בסיטמאפ ומסומנים `noindex` בעצמם. אין הפניות ל-netlify.app. **סטטוס לפני deploy: קיים בקוד, עדיין מחזיר 404 בפרודקשן** (הקובץ לא הועלה עד לקבלת המזהה).

## 9. robots.txt

`robots.txt` חדש: מאפשר הכול ומצביע על ה-sitemap. מסלולים ישנים נשארים זחילים כדי שה-`noindex` שלהם ייקרא. **סטטוס לפני deploy: קיים בקוד, עדיין 404 בפרודקשן.**

## 10. UTM

מערכת ה-UTM הקיימת לא נגעה: חמשת השדות עדיין נשמרים ב-`dsc_utm_v1` ונשלחים ל-Netlify בשני הטפסים. GA4 יקרא את ה-UTM מהכתובת בעצמו (attribution רגיל של Google). שני הקישורים `/ig-a1` ו-`/fb-a1` מפנים ב-302 עם ה-UTM המלאים, ואומתו בפרודקשן ב-7.9.2026 (לפני שינוי זה). אין לוגיקת attribution כפולה: `analytics.js` לא נוגע ב-UTM בכלל.

## 11. בדיקות

**מקומי (עם מזהה בדיקה זמני שהוסר לפני ה-commit):**

- A. הסכמה נדחתה → מעבר לבונה: אין הודעה, לא נטען קוד של Google, אפס אירועים, אפס בקשות. PASS
- B. הסכמה אושרה על הבונה: הקוד נטען מ-googletagmanager.com רק אחרי הלחיצה, `builder_view` שהמתין נשלח. PASS
- C. `builder_start` פעם אחת בלבד לאורך כל המילוי. PASS
- D. בחירת דף נחיתה → `service_selected` עם `landing_page`. PASS
- E. בחירת אתר תדמית → `service_selected` עם `website`. PASS
- F. `builder_step_view` לכל 11 השלבים עם מספר ושם. PASS
- G. `builder_summary_view` עם `website`, `custom_quote=false`, `maintenance_plan=basic`, `setup_total=1540`. PASS
- H. שליחה שנכשלת (השרת המקומי מחזיר 501): `project_request_submitted` לא נשלח. PASS. הצלחה אמיתית: **ממתין לפרודקשן.**
- I. טופס קשר שנכשל מקומית: `contact_request_submitted` לא נשלח. PASS. הצלחה אמיתית: **ממתין לפרודקשן.**
- J. רענון על מסך הסיכום: רק `builder_view`, בלי `builder_step_view` או `builder_summary_view` כפולים. PASS
- K. התחלה מחדש: `builder_reset` נשלח, מצב הבונה מתאפס, UTM נשמר, ההסכמה נשמרת. PASS
- ביצועים: הקוד של Google נטען `async` ורק אחרי הסכמה, אין כפילות, אפס שגיאות קונסול (מלבד 501 מקומי צפוי).
- נייד 390: ההודעה יושבת מעל פס הכפתורים הדביק, בלי חפיפה ובלי גלילה אופקית.
- מחירים: 33 מקרי הבדיקה האוטומטיים עוברים.

**פרודקשן: לא בוצע.** אין deploy בלי מזהה אמיתי.

## 12. מגבלות ידועות

- CSP: `_headers` עודכן כדי לאפשר `googletagmanager.com`, `google-analytics.com` ו-`analytics.google.com`. ייכנס לתוקף רק ב-deploy הבא, ואז יש לאמת בפרודקשן שאין חסימת CSP.
- מבקר שדחה מדידה ואחר כך אישר באותו עמוד: האירועים שקרו לפני האישור באותה טעינה לא נשלחים (נזרקו בזמן הדחייה).
- ללא מזהה, הקישור "הגדרות מדידה" וההודעה לא מופיעים בכלל.

## 13. Final verdict

**ANALYTICS BLOCKED — MEASUREMENT ID REQUIRED.** הקוד מוכן, נבדק מקומית, ולא פורסם. נדרש מ-DS: מזהה GA4 של dscreative.co.il (G-XXXXXXXXXX), ולבחירתכם רשומת TXT או token של Search Console.
