import { accessories, newComputers, refurbishedComputers } from "@/lib/catalog";

export type SearchEntry = {
  title: string;
  description: string;
  href: string;
  type: "עמוד" | "שירות" | "מוצר";
  keywords: string;
};

const pages: SearchEntry[] = [
  { title: "דף הבית", description: "כל השירותים, המחשבים והפתרונות של ComFix", href: "/", type: "עמוד", keywords: "בית ראשי comfix מעבדה" },
  { title: "תיקוני מחשבים", description: "אבחון, תיקון, שחזור מידע ושדרוגים", href: "/repairs", type: "שירות", keywords: "תיקון מחשב איטי לא נדלק מסך סוללה וירוסים שחזור" },
  { title: "מחשבים חדשים", description: "מחשבים לעבודה, לימודים, יצירה וגיימינג", href: "/new-computers", type: "עמוד", keywords: "חדש נייד נייח גיימינג עבודה לימודים" },
  { title: "מחשבים מחודשים", description: "מחשבים בדוקים עם אחריות וחיסכון", href: "/refurbished", type: "עמוד", keywords: "מחודש יד שניה אחריות חיסכון" },
  { title: "ציוד נלווה ורכיבים", description: "מסכים, אחסון, מקלדות, עכברים ושדרוגים", href: "/accessories", type: "עמוד", keywords: "ציוד מסך ssd אחסון מקלדת עכבר זיכרון תחנת עגינה" },
  { title: "אודות ויצירת קשר", description: "הסיפור, שעות הפעילות וטופס הפנייה", href: "/contact", type: "עמוד", keywords: "אודות קשר טלפון מייל כתובת שעות" },
  { title: "הזמנת תיקון", description: "טופס הדגמה לתיאור תקלה במחשב", href: "/repairs#booking", type: "שירות", keywords: "טופס הזמנה תקלה אבחון" },
];

const productRoute = (category: string) => category === "חדש" ? "/new-computers" : category === "מחודש" ? "/refurbished" : "/accessories";

const products: SearchEntry[] = [...newComputers, ...refurbishedComputers, ...accessories].map((product) => ({
  title: product.name,
  description: `${product.useCase}, ${product.specs.slice(0, 2).join(", ")}`,
  href: productRoute(product.category),
  type: "מוצר",
  keywords: `${product.category} ${product.useCase} ${product.specs.join(" ")}`,
}));

export const siteSearchIndex = [...pages, ...products];
