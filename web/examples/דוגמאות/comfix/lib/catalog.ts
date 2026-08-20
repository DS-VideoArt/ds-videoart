export type ProductCategory =
  | "חדש"
  | "מחודש"
  | "מסכים"
  | "אחסון"
  | "ציוד היקפי"
  | "שדרוגים";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  useCase: string;
  price: number;
  badge?: string;
  specs: string[];
  image: string;
  warranty: string;
};

const images = {
  laptop: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=82",
  work: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=82",
  gaming: "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=1200&q=82",
  desktop: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=1200&q=82",
  keyboard: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=82",
  accessories: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1200&q=82",
  storage: "https://images.unsplash.com/photo-1721332153521-120cb0cd02d9?auto=format&fit=crop&w=1200&q=82",
  hardware: "https://images.unsplash.com/photo-1721332155637-8b339526cf4c?auto=format&fit=crop&w=1200&q=82",
};

export const newComputers: Product[] = [
  {
    id: "nova-air-14",
    name: "Nova Air 14",
    category: "חדש",
    useCase: "לימודים ועבודה ניידת",
    price: 3290,
    badge: "בחירת הצוות",
    specs: ["Intel Core i5", "זיכרון 16GB", "כונן 512GB SSD"],
    image: images.laptop,
    warranty: "3 שנות אחריות במעבדה",
  },
  {
    id: "prodesk-s1",
    name: "ProDesk S1",
    category: "חדש",
    useCase: "עסקים ומשרד",
    price: 3890,
    specs: ["Intel Core i7", "זיכרון 16GB", "Windows 11 Pro"],
    image: images.work,
    warranty: "3 שנות אחריות בבית הלקוח",
  },
  {
    id: "forge-g5",
    name: "Forge G5",
    category: "חדש",
    useCase: "גיימינג ברזולוציה גבוהה",
    price: 6790,
    badge: "חדש במלאי",
    specs: ["AMD Ryzen 7", "GeForce RTX 5070", "זיכרון 32GB"],
    image: images.gaming,
    warranty: "3 שנות אחריות ואיסוף",
  },
  {
    id: "studio-x2",
    name: "Studio X2",
    category: "חדש",
    useCase: "עריכת וידאו ועיצוב",
    price: 8290,
    specs: ["Intel Core Ultra 9", "זיכרון 64GB", "כונן 2TB NVMe"],
    image: images.desktop,
    warranty: "3 שנות אחריות מורחבת",
  },
];

export const refurbishedComputers: Product[] = [
  {
    id: "thinkpro-t14",
    name: "ThinkPro T14",
    category: "מחודש",
    useCase: "עבודה ולימודים",
    price: 1890,
    badge: "מצב מצוין",
    specs: ["Intel Core i5 דור 11", "זיכרון 16GB", "כונן 512GB SSD"],
    image: images.work,
    warranty: "12 חודשי אחריות",
  },
  {
    id: "elitebook-840",
    name: "EliteBook 840",
    category: "מחודש",
    useCase: "ניהול ועסקים",
    price: 2190,
    specs: ["Intel Core i7 דור 11", "מסך מגע 14 אינץ׳", "סוללה חדשה"],
    image: images.laptop,
    warranty: "12 חודשי אחריות",
  },
  {
    id: "minidesk-m8",
    name: "MiniDesk M8",
    category: "מחודש",
    useCase: "משרד ביתי קומפקטי",
    price: 1490,
    badge: "חיסכון של 42%",
    specs: ["Intel Core i5", "זיכרון 16GB", "WiFi מובנה"],
    image: images.desktop,
    warranty: "12 חודשי אחריות",
  },
  {
    id: "creator-15",
    name: "Creator 15",
    category: "מחודש",
    useCase: "גרפיקה ויצירה",
    price: 3390,
    specs: ["Intel Core i7", "GeForce RTX 3060", "מסך 15.6 אינץ׳"],
    image: images.gaming,
    warranty: "12 חודשי אחריות",
  },
];

export const accessories: Product[] = [
  { id: "view-27", name: "מסך View 27 QHD", category: "מסכים", useCase: "עבודה ויצירה", price: 1190, specs: ["רזולוציית QHD", "קצב 100Hz", "חיבור USB C"], image: images.desktop, warranty: "3 שנות אחריות" },
  { id: "focus-24", name: "מסך Focus 24", category: "מסכים", useCase: "משרד ולימודים", price: 690, specs: ["פאנל IPS", "רזולוציית Full HD", "רמקולים מובנים"], image: images.work, warranty: "3 שנות אחריות" },
  { id: "fastdrive-1", name: "FastDrive 1TB", category: "אחסון", useCase: "שדרוג מהירות ואחסון", price: 349, badge: "הנמכר ביותר", specs: ["תקן NVMe", "מהירות עד 5,000MB", "כולל התקנה"], image: images.storage, warranty: "5 שנות אחריות" },
  { id: "backup-2", name: "BackupBox 2TB", category: "אחסון", useCase: "גיבוי תמונות וקבצים", price: 399, specs: ["חיבור USB 3.2", "תואם Windows ו Mac", "תוכנת גיבוי"], image: images.hardware, warranty: "3 שנות אחריות" },
  { id: "keys-pro", name: "מקלדת Keys Pro", category: "ציוד היקפי", useCase: "עבודה ממושכת", price: 279, specs: ["עברית ואנגלית", "חיבור אלחוטי", "טעינת USB C"], image: images.keyboard, warranty: "שנתיים אחריות" },
  { id: "flow-mouse", name: "עכבר Flow", category: "ציוד היקפי", useCase: "עבודה מדויקת ונוחה", price: 189, specs: ["חיבור לשלושה מכשירים", "סוללה ל 18 חודשים", "לחצנים שקטים"], image: images.accessories, warranty: "שנתיים אחריות" },
  { id: "memory-32", name: "ערכת זיכרון 32GB", category: "שדרוגים", useCase: "עריכה וריבוי משימות", price: 449, specs: ["שני מודולים", "מהירות 3200MHz", "בדיקת תאימות"], image: images.hardware, warranty: "אחריות לכל החיים" },
  { id: "dock-11", name: "תחנת עגינה Dock 11", category: "שדרוגים", useCase: "חיבור משרד מלא", price: 529, specs: ["שני מסכים", "טעינה בהספק 100W", "11 חיבורים"], image: images.accessories, warranty: "שנתיים אחריות" },
];
