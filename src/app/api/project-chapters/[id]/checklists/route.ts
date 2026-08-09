import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// פרק 01 - עבודות עפר (בדיוק כמו ב-HTML)
const CHAPTER_01_ITEMS = [
  // פרק 1 – בקרה מקדימה (6 פריטים)
  { workStage: 'בקרה מקדימה', description: 'קיימות תוכניות חפירה, מילוי, מפלסים ותשתיות מאושרות.', responsible: 'קבלן', sortOrder: 1 },
  { workStage: 'בקרה מקדימה', description: 'גבולות העבודה, הצירים והמפלסים סומנו ואומתו.', responsible: 'קבלן', sortOrder: 2 },
  { workStage: 'בקרה מקדימה', description: 'תשתיות קיימות אותרו, סומנו והוגנו.', responsible: 'קבלן', sortOrder: 3 },
  { workStage: 'בקרה מקדימה', description: 'סוגי הקרקע וחומר המילוי תואמים למסמכים המאושרים.', responsible: 'בקרת איכות', sortOrder: 4 },
  { workStage: 'בקרה מקדימה', description: 'ציוד הביצוע והידוק מתאים לסוג העבודה.', responsible: 'קבלן', sortOrder: 5 },
  { workStage: 'בקרה מקדימה', description: 'תוספת ניקוז זמני, גישה ובטיחות החפירה.', responsible: 'קבלן', sortOrder: 6 },
  // פרק 2 – בקרה שוטפת (8 פריטים)
  { workStage: 'בקרה שוטפת', description: 'החפירה מתבצעת למידות, לשיפועים ולמפלסים הנדרשים.', responsible: 'קבלן', sortOrder: 7 },
  { workStage: 'בקרה שוטפת', description: 'דפנות החפירה, התמיכות והשיפועים נשמרים יציבים.', responsible: 'קבלן', sortOrder: 8 },
  { workStage: 'בקרה שוטפת', description: 'קרקעית בלתי מתאימה מורחקת ומטופלת באישור.', responsible: 'בקרת איכות', sortOrder: 9 },
  { workStage: 'בקרה שוטפת', description: 'חומר המילוי מפוזר בשכבות ובעובי הנדרש.', responsible: 'קבלן', sortOrder: 10 },
  { workStage: 'בקרה שוטפת', description: 'הלחויות והידוק מבוקרים בהתאם למפרט.', responsible: 'בקרת איכות', sortOrder: 11 },
  { workStage: 'בקרה שוטפת', description: 'מבוצעות בדיקות צפיפות/הידוק בתדירות שנקבעה.', responsible: 'בקרת איכות', sortOrder: 12 },
  { workStage: 'בקרה שוטפת', description: 'נשמרת הפרדה בין סוגי מילוי ותשתיות.', responsible: 'קבלן', sortOrder: 13 },
  { workStage: 'בקרה שוטפת', description: 'המפלסים והשיפועים נבדקים במהלך הביצוע.', responsible: 'קבלן', sortOrder: 14 },
  // פרק 3 – אישור לפני מסירה (6 פריטים)
  { workStage: 'אישור לפני מסירה', description: 'מידות, מפלסים ושיפועים סופיים נבדקו.', responsible: 'בקרת איכות', sortOrder: 15 },
  { workStage: 'אישור לפני מסירה', description: 'תוצאות בדיקות הידוק התקבלו ונמצאו מתאימות.', responsible: 'בקרת איכות', sortOrder: 16 },
  { workStage: 'אישור לפני מסירה', description: 'לא נותרו אזורים רופפים, שקועים או מוצפים.', responsible: 'קבלן', sortOrder: 17 },
  { workStage: 'אישור לפני מסירה', description: 'ניקוי השטח והחיבורים לתשתיות הושלמו.', responsible: 'קבלן', sortOrder: 18 },
  { workStage: 'אישור לפני מסירה', description: 'ליקויים תוקנו ונבדקו מחדש.', responsible: 'בקרת איכות', sortOrder: 19 },
  { workStage: 'אישור לפני מסירה', description: 'הושלמו מדידות, תיעוד ותוכניות עדות.', responsible: 'קבלן', sortOrder: 20 },
];

// פרק 02 - בטון יצוק באתר (24 סעיפים: 9+9+6)
const CHAPTER_02_ITEMS = [
  // פרק 1 – בקרה מקדימה (9 פריטים)
  { workStage: 'בקרה מקדימה', description: 'קיימות תוכניות, פרטי ביצוע, מפרט ותוכניות יציקה מאושרים.', responsible: 'קבלן', sortOrder: 1 },
  { workStage: 'בקרה מקדימה', description: 'סוג הבטון, דרגת החוזק, דרגת החשיפה והתערובת תואמים למסמכים המאושרים.', responsible: 'בקרת איכות', sortOrder: 2 },
  { workStage: 'בקרה מקדימה', description: 'התבניות יציבות, נקיות, משומנות, ותומכות במפלסים הנדרשים.', responsible: 'קבלן', sortOrder: 3 },
  { workStage: 'בקרה מקדימה', description: 'הזיון תואם לתוכניות: קטרים, מרחקים, כריכות, וכיפופי עבודה.', responsible: 'בקרת איכות', sortOrder: 4 },
  { workStage: 'בקרה מקדימה', description: 'כיסוי בטון, ספייסרים והתומכות יציבים ובמיצוב הנכון.', responsible: 'קבלן', sortOrder: 5 },
  { workStage: 'בקרה מקדימה', description: 'פתחים, שרוולים, עוגנים, מוליכים ופרופילים מותקנים ומקובעים.', responsible: 'קבלן', sortOrder: 6 },
  { workStage: 'בקרה מקדימה', description: 'תפרים והפסקות יציקה מוגדרים, יציקה קודמת מותאמת ומנוקה.', responsible: 'קבלן', sortOrder: 7 },
  { workStage: 'בקרה מקדימה', description: 'שטח היציקה נקי ויבש, פסולת ובטון קשור סולקו.', responsible: 'קבלן', sortOrder: 8 },
  { workStage: 'בקרה מקדימה', description: 'קיימים ציוד יציקה, אספקת מים, תאורה, ורטטים תקינים.', responsible: 'קבלן', sortOrder: 9 },
  // פרק 2 – בקרה שוטפת (9 פריטים)
  { workStage: 'בקרה שוטפת', description: 'תעודות המשלוח נבדקו והתערובת תואמת להזמנה ולמפרט המאושר.', responsible: 'בקרת איכות', sortOrder: 10 },
  { workStage: 'בקרה שוטפת', description: 'זמן היציאה מהמפעל, זמן ההגעה ותחילת הפריקה נרשמו ונמצאו תקינים.', responsible: 'בקרת איכות', sortOrder: 11 },
  { workStage: 'בקרה שוטפת', description: 'לא נוספו מים או תוספים באתר ללא אישור ותיעוד.', responsible: 'בקרת איכות', sortOrder: 12 },
  { workStage: 'בקרה שוטפת', description: 'מבוצעות בדיקות בטון טרי ולקיחת דגימות בהתאם לתוכנית הבדיקות.', responsible: 'בקרת איכות', sortOrder: 13 },
  { workStage: 'בקרה שוטפת', description: 'הבטון יוצק ברציפות ובמסלול מתוכנן, ללא הפרדה ונפילה חופשית מעל 1.5 מ.', responsible: 'קבלן', sortOrder: 14 },
  { workStage: 'בקרה שוטפת', description: 'מבוצע ריטוט מתאים ומספק, ללא ריטוט יתר הפוגע בבטון ובתבניות.', responsible: 'קבלן', sortOrder: 15 },
  { workStage: 'בקרה שוטפת', description: 'לא נצפו תפיחות, פתיחות, נזילות או עיוותים של התבניות והתמיכות.', responsible: 'קבלן', sortOrder: 16 },
  { workStage: 'בקרה שוטפת', description: 'המפלסים, העובי, השיפועים וגימור פני הבטון מבוצעים בהתאם לתוכנית.', responsible: 'קבלן', sortOrder: 17 },
  { workStage: 'בקרה שוטפת', description: 'מבוצע אשפור הבטון במועד ובשיטה שנקבעו במפרט.', responsible: 'בקרת איכות', sortOrder: 18 },
  // פרק 3 – אישור לפני מסירה (6 פריטים)
  { workStage: 'אישור לפני מסירה', description: 'פירוק התבניות והתמיכות מבוצע לאחר השגת חוזק נדרש ואישור.', responsible: 'בקרת איכות', sortOrder: 19 },
  { workStage: 'אישור לפני מסירה', description: 'נבדקו מידות, מפלסים, אנכיות ומיקום פתחים בהתאם לתוכנית.', responsible: 'בקרת איכות', sortOrder: 20 },
  { workStage: 'אישור לפני מסירה', description: 'פני הבטון נבדקו ולא נמצאו חלולים, קינון, סדקים או שחיתה.', responsible: 'קבלן', sortOrder: 21 },
  { workStage: 'אישור לפני מסירה', description: 'ליקויים תועדו, תוקנו ואושרו מחדש.', responsible: 'בקרת איכות', sortOrder: 22 },
  { workStage: 'אישור לפני מסירה', description: 'תוצאות בדיקות חוזק הבטון התקבלו ונמצאו תקינות.', responsible: 'בקרת איכות', sortOrder: 23 },
  { workStage: 'אישור לפני מסירה', description: 'הושלם תיעוד: תעודות משלוח, פרוטוקולים ותוכניות As-Made.', responsible: 'קבלן', sortOrder: 24 },
];

// פרק 04 - עבודות בנייה (20 סעיפים: 6+8+6)
const CHAPTER_04_ITEMS = [
  // פרק 1 – בקרה מקדימה (6 פריטים)
  { workStage: 'בקרה מקדימה', description: 'קיימים תוכניות, פריסות, פרטים וסאבמיטלים מאושרים.', responsible: 'קבלן', sortOrder: 1 },
  { workStage: 'בקרה מקדימה', description: 'סוג הבלוקים/לבנים וחומרי המליטה תואמים לאישור.', responsible: 'בקרת איכות', sortOrder: 2 },
  { workStage: 'בקרה מקדימה', description: 'התשתית, קווי הבנייה, הפתחים והמפלסים סומנו.', responsible: 'קבלן', sortOrder: 3 },
  { workStage: 'בקרה מקדימה', description: 'קוצים, עוגנים, חגורות ועמודונים הוכנו לפי הפרטים.', responsible: 'קבלן', sortOrder: 4 },
  { workStage: 'בקרה מקדימה', description: 'החומרים שלמים, יבשים ומאוחסנים כנדרש.', responsible: 'קבלן', sortOrder: 5 },
  { workStage: 'בקרה מקדימה', description: 'תואמו מעברי מערכות וחיבורים לאלמנטים סמוכים.', responsible: 'קבלן', sortOrder: 6 },
  // פרק 2 – בקרה שוטפת (8 פריטים)
  { workStage: 'בקרה שוטפת', description: 'השורה הראשונה מפולסת וממוקמת בהתאם לתוכנית.', responsible: 'קבלן', sortOrder: 7 },
  { workStage: 'בקרה שוטפת', description: 'הקירות נבנים במישור, באנכיות ובמידות הנדרשות.', responsible: 'קבלן', sortOrder: 8 },
  { workStage: 'בקרה שוטפת', description: 'עובי המישקים ומילויים אחידים ורציפים.', responsible: 'בקרת איכות', sortOrder: 9 },
  { workStage: 'בקרה שוטפת', description: 'הקשרים, העוגנים והחיזוקים מותקנים לפי הפרטים.', responsible: 'קבלן', sortOrder: 10 },
  { workStage: 'בקרה שוטפת', description: 'פתחים, משקופים ומעברי מערכות מבוצעים במיקום הנכון.', responsible: 'קבלן', sortOrder: 11 },
  { workStage: 'בקרה שוטפת', description: 'חגורות, קורות ועמודונים מבוצעים כנדרש.', responsible: 'קבלן', sortOrder: 12 },
  { workStage: 'בקרה שוטפת', description: 'חיתוך הרכיבים מבוקר ואין שברים או השלמות מאולתרות.', responsible: 'בקרת איכות', sortOrder: 13 },
  { workStage: 'בקרה שוטפת', description: 'ראשי הקירות והמפגשים עם שלד מטופלים לפי הפרט.', responsible: 'קבלן', sortOrder: 14 },
  // פרק 3 – אישור לפני מסירה (6 פריטים)
  { workStage: 'אישור לפני מסירה', description: 'מידות, מישוריות, אנכיות ומיקום הפתחים נבדקו.', responsible: 'בקרת איכות', sortOrder: 15 },
  { workStage: 'אישור לפני מסירה', description: 'הקירות שלמים ללא סדקים, חלקים רופפים או חללים.', responsible: 'בקרת איכות', sortOrder: 16 },
  { workStage: 'אישור לפני מסירה', description: 'החיבורים לשלד, למשקופים ולמערכות הושלמו.', responsible: 'קבלן', sortOrder: 17 },
  { workStage: 'אישור לפני מסירה', description: 'חריצים ופתחים תוקנו בחומרים מתאימים.', responsible: 'קבלן', sortOrder: 18 },
  { workStage: 'אישור לפני מסירה', description: 'השטח נוקה והוכן לעבודות הגמר.', responsible: 'קבלן', sortOrder: 19 },
  { workStage: 'אישור לפני מסירה', description: 'ליקויים, תיעוד ואישורי הבקרה הושלמו.', responsible: 'בקרת איכות', sortOrder: 20 },
];

// פרק 05 - עבודות איטום (22 סעיפים: 7+9+6)
const CHAPTER_05_ITEMS = [
  // פרק 1 – בקרה מקדימה (7 פריטים)
  { workStage: 'בקרה מקדימה', description: 'קיימים תוכנית, פרטי ביצוע וסאבמיטל מאושרים.', responsible: 'קבלן', sortOrder: 1 },
  { workStage: 'בקרה מקדימה', description: 'החומרים תואמים למערכת המאושרת ולהוראות היצרן.', responsible: 'בקרת איכות', sortOrder: 2 },
  { workStage: 'בקרה מקדימה', description: 'התשתית יציבה, נקייה, יבשה וללא חלקים רופפים.', responsible: 'קבלן', sortOrder: 3 },
  { workStage: 'בקרה מקדימה', description: 'השיפועים לכיוון הנקזים בוצעו כנדרש.', responsible: 'קבלן', sortOrder: 4 },
  { workStage: 'בקרה מקדימה', description: 'סדקים, כיסי חצץ, בליטות ושקעים טופלו.', responsible: 'קבלן', sortOrder: 5 },
  { workStage: 'בקרה מקדימה', description: 'רולקות, פינות, חדירות, תפרים ונקזים הוכנו.', responsible: 'קבלן', sortOrder: 6 },
  { workStage: 'בקרה מקדימה', description: 'תנאי מזג האוויר מתאימים לביצוע העבודה.', responsible: 'קבלן', sortOrder: 7 },
  // פרק 2 – בקרה שוטפת (9 פריטים)
  { workStage: 'בקרה שוטפת', description: 'הפריימר מתאים, אחיד ויבש לפני המשך העבודה.', responsible: 'בקרת איכות', sortOrder: 8 },
  { workStage: 'בקרה שוטפת', description: 'נשמרו הוראות הערבוב, היישום וזמני ההמתנה.', responsible: 'קבלן', sortOrder: 9 },
  { workStage: 'בקרה שוטפת', description: 'מספר השכבות, העובי וצריכת החומר תואמים לדרישות.', responsible: 'בקרת איכות', sortOrder: 10 },
  { workStage: 'בקרה שוטפת', description: 'האיטום רציף ללא חורים, קרעים, בועות או ניתוקים.', responsible: 'בקרת איכות', sortOrder: 11 },
  { workStage: 'בקרה שוטפת', description: 'חפיפות וחיבורים בין יריעות בוצעו כנדרש.', responsible: 'קבלן', sortOrder: 12 },
  { workStage: 'בקרה שוטפת', description: 'בוצעו חיזוקים בפינות ובמפגשי רצפה-קיר.', responsible: 'קבלן', sortOrder: 13 },
  { workStage: 'בקרה שוטפת', description: 'חדירות, תפרים, נקזים וספי פתחים נאטמו.', responsible: 'קבלן', sortOrder: 14 },
  { workStage: 'בקרה שוטפת', description: 'גובה העלייה וסיום האיטום תואמים לפרטים.', responsible: 'בקרת איכות', sortOrder: 15 },
  { workStage: 'בקרה שוטפת', description: 'האיטום מוגן מפגיעה במהלך המשך העבודות.', responsible: 'קבלן', sortOrder: 16 },
  // פרק 3 – אישור לפני מסירה (6 פריטים)
  { workStage: 'אישור לפני מסירה', description: 'בוצעה בדיקה חזותית מלאה ולא נמצאו פגמים.', responsible: 'בקרת איכות', sortOrder: 17 },
  { workStage: 'אישור לפני מסירה', description: 'כל החדירות, הקצוות, החיבורים והנקזים הושלמו.', responsible: 'קבלן', sortOrder: 18 },
  { workStage: 'אישור לפני מסירה', description: 'בדיקת הצפה/אטימות הושלמה ללא סימני כשל.', responsible: 'בקרת איכות', sortOrder: 19 },
  { workStage: 'אישור לפני מסירה', description: 'כל הליקויים תוקנו ונבדקו מחדש.', responsible: 'בקרת איכות', sortOrder: 20 },
  { workStage: 'אישור לפני מסירה', description: 'שכבת ההגנה בוצעה ללא פגיעה באיטום.', responsible: 'קבלן', sortOrder: 21 },
  { workStage: 'אישור לפני מסירה', description: 'הושלמו תמונות, אישורי חומרים ודוח הבדיקה.', responsible: 'קבלן', sortOrder: 22 },
];

// פרק 06 - מוצרי נגרות אומן ומסגרות פלדה (19 סעיפים: 6+7+6)
const CHAPTER_06_ITEMS = [
  // פרק 1 – בקרה מקדימה (6 פריטים)
  { workStage: 'בקרה מקדימה', description: 'קיימים רשימות פריטים, תוכניות, פרטים וסאבמיטלים מאושרים.', responsible: 'קבלן', sortOrder: 1 },
  { workStage: 'בקרה מקדימה', description: 'מידות הפתחים והמפלסים נבדקו לפני הייצור/ההתקנה.', responsible: 'קבלן', sortOrder: 2 },
  { workStage: 'בקרה מקדימה', description: 'סוגי החומרים, הפרזול והגמר תואמים לאישור.', responsible: 'בקרת איכות', sortOrder: 3 },
  { workStage: 'בקרה מקדימה', description: 'התקבלו אישורי אש, אקוסטיקה או בטיחות לפי הצורך.', responsible: 'בקרת איכות', sortOrder: 4 },
  { workStage: 'בקרה מקדימה', description: 'הפריטים מוגנים מפגיעה ומאוחסנים בתנאים מתאימים.', responsible: 'קבלן', sortOrder: 5 },
  { workStage: 'בקרה מקדימה', description: 'נקודות העיגון והתשתיות מוכנות להתקנה.', responsible: 'קבלן', sortOrder: 6 },
  // פרק 2 – בקרה שוטפת (7 פריטים)
  { workStage: 'בקרה שוטפת', description: 'סוג, מידות וכיוון הפתיחה של כל פריט תואמים לתוכנית.', responsible: 'בקרת איכות', sortOrder: 7 },
  { workStage: 'בקרה שוטפת', description: 'המשקופים והמסגרות מותקנים במיקום, אנכיות ומפלס תקינים.', responsible: 'קבלן', sortOrder: 8 },
  { workStage: 'בקרה שוטפת', description: 'העיגונים, החיבורים והמילויים מבוצעים לפי הפרטים.', responsible: 'קבלן', sortOrder: 9 },
  { workStage: 'בקרה שוטפת', description: 'הפרזול, הצירים, המנעולים והמחזירים מותקנים כנדרש.', responsible: 'קבלן', sortOrder: 10 },
  { workStage: 'בקרה שוטפת', description: 'מרווחים, אטמים וחיבורים לקירות רציפים ואחידים.', responsible: 'בקרת איכות', sortOrder: 11 },
  { workStage: 'בקרה שוטפת', description: 'הציפוי והגמר מוגנים במהלך ההתקנה.', responsible: 'קבלן', sortOrder: 12 },
  { workStage: 'בקרה שוטפת', description: 'דלתות ופריטים נעים נפתחים ונסגרים בחופשיות.', responsible: 'קבלן', sortOrder: 13 },
  // פרק 3 – אישור לפני מסירה (6 פריטים)
  { workStage: 'אישור לפני מסירה', description: 'הפריטים שלמים, נקיים וללא פגיעות או קורוזיה.', responsible: 'בקרת איכות', sortOrder: 14 },
  { workStage: 'אישור לפני מסירה', description: 'הפתיחה, הסגירה, הנעילה והפרזול נבדקו.', responsible: 'בקרת איכות', sortOrder: 15 },
  { workStage: 'אישור לפני מסירה', description: 'מידות המרווחים, המישוריות והאנכיות תקינות.', responsible: 'בקרת איכות', sortOrder: 16 },
  { workStage: 'אישור לפני מסירה', description: 'סימונים ואביזרים ייעודיים הותקנו.', responsible: 'קבלן', sortOrder: 17 },
  { workStage: 'אישור לפני מסירה', description: 'תיקוני גמר בוצעו בהתאמה למוצר המאושר.', responsible: 'קבלן', sortOrder: 18 },
  { workStage: 'אישור לפני מסירה', description: 'נמסרו מפתחות, אישורים, אחריות ותיעוד.', responsible: 'קבלן', sortOrder: 19 },
];

// פרק 07 - מתקני תברואה (20 סעיפים: 6+8+6)
const CHAPTER_07_ITEMS = [
  // פרק 1 – בקרה מקדימה (6 פריטים)
  { workStage: 'בקרה מקדימה', description: 'קיימים תוכניות ביצוע, סכמות, פרטים וסאבמיטלים מאושרים.', responsible: 'קבלן', sortOrder: 1 },
  { workStage: 'בקרה מקדימה', description: 'סוגי הצנרת, האביזרים והקטרים תואמים לתכנון.', responsible: 'בקרת איכות', sortOrder: 2 },
  { workStage: 'בקרה מקדימה', description: 'תוואים, מפלסים, שיפועים ופתחים תואמו עם יתר המערכות.', responsible: 'קבלן', sortOrder: 3 },
  { workStage: 'בקרה מקדימה', description: 'החומרים נושאים סימון ואישורים ונשמרים כנדרש.', responsible: 'בקרת איכות', sortOrder: 4 },
  { workStage: 'בקרה מקדימה', description: 'שרוולים, מעברים ונקודות קיבוע הוכנו.', responsible: 'קבלן', sortOrder: 5 },
  { workStage: 'בקרה מקדימה', description: 'נקבעו מקטעי בדיקה ושיטת בדיקת הלחץ/האטימות.', responsible: 'בקרת איכות', sortOrder: 6 },
  // פרק 2 – בקרה שוטפת (8 פריטים)
  { workStage: 'בקרה שוטפת', description: 'הצנרת מותקנת בתוואי, בקוטר ובשיפוע הנדרשים.', responsible: 'קבלן', sortOrder: 7 },
  { workStage: 'בקרה שוטפת', description: 'חיבורים מבוצעים בשיטה ובאביזרים המתאימים.', responsible: 'קבלן', sortOrder: 8 },
  { workStage: 'בקרה שוטפת', description: 'תמיכות, חבקים ועיגונים מותקנים במרווחים הנדרשים.', responsible: 'קבלן', sortOrder: 9 },
  { workStage: 'בקרה שוטפת', description: 'נשמרת הפרדה והגנה בין מערכות וחומרים שונים.', responsible: 'בקרת איכות', sortOrder: 10 },
  { workStage: 'בקרה שוטפת', description: 'חדירות דרך קירות ותקרות נאטמות לפי הדרישות.', responsible: 'קבלן', sortOrder: 11 },
  { workStage: 'בקרה שוטפת', description: 'מגופים, נקודות ביקורת ואביזרים נגישים לתחזוקה.', responsible: 'קבלן', sortOrder: 12 },
  { workStage: 'בקרה שוטפת', description: 'הצנרת מוגנת לפני כיסוי או יציקה.', responsible: 'קבלן', sortOrder: 13 },
  { workStage: 'בקרה שוטפת', description: 'בדיקות לחץ, אטימות ושטיפה מתועדות לפני כיסוי.', responsible: 'בקרת איכות', sortOrder: 14 },
  // פרק 3 – אישור לפני מסירה (6 פריטים)
  { workStage: 'אישור לפני מסירה', description: 'כל הבדיקות עברו בהצלחה והליקויים נסגרו.', responsible: 'בקרת איכות', sortOrder: 15 },
  { workStage: 'אישור לפני מסירה', description: 'הכלים והאביזרים מותקנים, יציבים ופועלים כנדרש.', responsible: 'קבלן', sortOrder: 16 },
  { workStage: 'אישור לפני מסירה', description: 'זרימות, ניקוזים, שיפועים ואוורור המערכת נבדקו.', responsible: 'בקרת איכות', sortOrder: 17 },
  { workStage: 'אישור לפני מסירה', description: 'חדירות, בידוד וסימון הצנרת הושלמו.', responsible: 'קבלן', sortOrder: 18 },
  { workStage: 'אישור לפני מסירה', description: 'בוצעו ניקוי, שטיפה וחיטוי לפי הצורך.', responsible: 'קבלן', sortOrder: 19 },
  { workStage: 'אישור לפני מסירה', description: 'הושלמו תוכניות עדות, אישורים והוראות תחזוקה.', responsible: 'קבלן', sortOrder: 20 },
];

// פרק 08 - מתקני חשמל (20 סעיפים: 6+8+6)
const CHAPTER_08_ITEMS = [
  // פרק 1 – בקרה מקדימה (6 פריטים)
  { workStage: 'בקרה מקדימה', description: 'קיימים תוכניות, סכמות, לוחות, פרטים וסאבמיטלים מאושרים.', responsible: 'קבלן', sortOrder: 1 },
  { workStage: 'בקרה מקדימה', description: 'תוואים, עומסים, נקודות וממשקים תואמו עם יתר המערכות.', responsible: 'קבלן', sortOrder: 2 },
  { workStage: 'בקרה מקדימה', description: 'ציוד, כבלים, מובילים ולוחות תואמים למסמכים המאושרים.', responsible: 'בקרת איכות', sortOrder: 3 },
  { workStage: 'בקרה מקדימה', description: 'הוכנו פתחים, שרוולים, הארקות ונקודות עיגון.', responsible: 'קבלן', sortOrder: 4 },
  { workStage: 'בקרה מקדימה', description: 'הציוד מאוחסן מוגן ועם סימון מתאים.', responsible: 'קבלן', sortOrder: 5 },
  { workStage: 'בקרה מקדימה', description: 'נקבעו בדיקות, נקודות עצירה וגורם בודק מוסמך.', responsible: 'בקרת איכות', sortOrder: 6 },
  // פרק 2 – בקרה שוטפת (8 פריטים)
  { workStage: 'בקרה שוטפת', description: 'מובילים ותעלות מותקנים בתוואי ובקיבוע הנדרשים.', responsible: 'קבלן', sortOrder: 7 },
  { workStage: 'בקרה שוטפת', description: 'כבלים וחיווט מתאימים, מסומנים ומוגנים מפגיעה.', responsible: 'קבלן', sortOrder: 8 },
  { workStage: 'בקרה שוטפת', description: 'הפרדות בין מערכות ומעברי אש נשמרים כנדרש.', responsible: 'בקרת איכות', sortOrder: 9 },
  { workStage: 'בקרה שוטפת', description: 'לוחות מותקנים במיקום, במפלס ובנגישות מתאימים.', responsible: 'קבלן', sortOrder: 10 },
  { workStage: 'בקרה שוטפת', description: 'הארקות והשוואת פוטנציאלים מחוברות ומסומנות.', responsible: 'קבלן', sortOrder: 11 },
  { workStage: 'בקרה שוטפת', description: 'חיבורים, מהדקים ואטימות אביזרים מבוצעים כנדרש.', responsible: 'קבלן', sortOrder: 12 },
  { workStage: 'בקרה שוטפת', description: 'הציוד מוגן במהלך עבודות הגמר.', responsible: 'קבלן', sortOrder: 13 },
  { workStage: 'בקרה שוטפת', description: 'מתבצעות בדיקות ביניים לפני סגירה או כיסוי.', responsible: 'בקרת איכות', sortOrder: 14 },
  // פרק 3 – אישור לפני מסירה (6 פריטים)
  { workStage: 'אישור לפני מסירה', description: 'בוצעו בדיקות בידוד, רציפות, הארקה והגנות כנדרש.', responsible: 'בקרת איכות', sortOrder: 15 },
  { workStage: 'אישור לפני מסירה', description: 'הלוחות והמעגלים מסומנים בהתאם לתוכניות.', responsible: 'קבלן', sortOrder: 16 },
  { workStage: 'אישור לפני מסירה', description: 'האביזרים שלמים, מקובעים ופועלים כראוי.', responsible: 'בקרת איכות', sortOrder: 17 },
  { workStage: 'אישור לפני מסירה', description: 'מעברי אש, אטימות ומכסים הושלמו.', responsible: 'קבלן', sortOrder: 18 },
  { workStage: 'אישור לפני מסירה', description: 'התקבל אישור בודק מוסמך ככל שנדרש.', responsible: 'בקרת איכות', sortOrder: 19 },
  { workStage: 'אישור לפני מסירה', description: 'נמסרו תוכניות עדות, דוחות בדיקה והוראות הפעלה.', responsible: 'קבלן', sortOrder: 20 },
];

// פרק 09 - עבודות טיח (20 סעיפים: 6+8+6)
const CHAPTER_09_ITEMS = [
  // פרק 1 – בקרה מקדימה (6 פריטים)
  { workStage: 'בקרה מקדימה', description: 'קיימים מפרט, פרטים וסאבמיטלים מאושרים.', responsible: 'קבלן', sortOrder: 1 },
  { workStage: 'בקרה מקדימה', description: 'סוגי הטיח, הרשתות והאביזרים תואמים לתשתית ולייעוד.', responsible: 'בקרת איכות', sortOrder: 2 },
  { workStage: 'בקרה מקדימה', description: 'התשתית יציבה, נקייה וללא אבק, שמן או חלקים רופפים.', responsible: 'קבלן', sortOrder: 3 },
  { workStage: 'בקרה מקדימה', description: 'סדקים, חיבורים, חריצים ומעברי מערכות טופלו.', responsible: 'קבלן', sortOrder: 4 },
  { workStage: 'בקרה מקדימה', description: 'מובילים, פינות וסרגלים הותקנו במיקום הנדרש.', responsible: 'קבלן', sortOrder: 5 },
  { workStage: 'בקרה מקדימה', description: 'בוצע קטע ניסיון ואושרו מרקם וגמר לפי הצורך.', responsible: 'בקרת איכות', sortOrder: 6 },
  // פרק 2 – בקרה שוטפת (8 פריטים)
  { workStage: 'בקרה שוטפת', description: 'בוצעה שכבת הכנה/הרבצה בהתאם למערכת המאושרת.', responsible: 'קבלן', sortOrder: 7 },
  { workStage: 'בקרה שוטפת', description: 'רשתות חיזוק מותקנות במפגשי חומרים ובאזורים הנדרשים.', responsible: 'קבלן', sortOrder: 8 },
  { workStage: 'בקרה שוטפת', description: 'עובי השכבות וזמני ההמתנה תואמים להוראות.', responsible: 'בקרת איכות', sortOrder: 9 },
  { workStage: 'בקרה שוטפת', description: 'הטיח מיושם במישוריות, באנכיות ובפינות ישרות.', responsible: 'קבלן', sortOrder: 10 },
  { workStage: 'בקרה שוטפת', description: 'החיבורים למשקופים, אדנים ופתחים רציפים.', responsible: 'קבלן', sortOrder: 11 },
  { workStage: 'בקרה שוטפת', description: 'נשמרת הגנה מתנאי מזג אוויר והתייבשות מהירה.', responsible: 'קבלן', sortOrder: 12 },
  { workStage: 'בקרה שוטפת', description: 'האשפרה מבוצעת בהתאם לסוג הטיח.', responsible: 'קבלן', sortOrder: 13 },
  { workStage: 'בקרה שוטפת', description: 'לא נראים סדקים, התנפחויות או היפרדות במהלך הביצוע.', responsible: 'בקרת איכות', sortOrder: 14 },
  // פרק 3 – אישור לפני מסירה (6 פריטים)
  { workStage: 'אישור לפני מסירה', description: 'מישוריות, אנכיות, עובי ומרקם הגמר נבדקו.', responsible: 'בקרת איכות', sortOrder: 15 },
  { workStage: 'אישור לפני מסירה', description: 'ההקשה אינה מצביעה על אזורים חלולים או רופפים.', responsible: 'בקרת איכות', sortOrder: 16 },
  { workStage: 'אישור לפני מסירה', description: 'לא נמצאו סדקים, קילופים, כתמים או תיקונים בולטים.', responsible: 'בקרת איכות', sortOrder: 17 },
  { workStage: 'אישור לפני מסירה', description: 'פינות, קנטים ומפגשים עם פריטים אחרים הושלמו.', responsible: 'קבלן', sortOrder: 18 },
  { workStage: 'אישור לפני מסירה', description: 'בוצעו בדיקות הידבקות ככל שנדרשו.', responsible: 'בקרת איכות', sortOrder: 19 },
  { workStage: 'אישור לפני מסירה', description: 'ליקויים תוקנו והשטח נמסר נקי ומוגן.', responsible: 'קבלן', sortOrder: 20 },
];

// פרק 10 - עבודות ריצוף וחיפוי (20 סעיפים: 6+8+6)
const CHAPTER_10_ITEMS = [
  // פרק 1 – בקרה מקדימה (6 פריטים)
  { workStage: 'בקרה מקדימה', description: 'קיימים תוכניות פריסה, פרטים וסאבמיטלים מאושרים.', responsible: 'קבלן', sortOrder: 1 },
  { workStage: 'בקרה מקדימה', description: 'האריחים, הדבקים, המילוי והאביזרים תואמים לאישור.', responsible: 'בקרת איכות', sortOrder: 2 },
  { workStage: 'בקרה מקדימה', description: 'התשתית יציבה, נקייה, מפולסת ובשיפועים הנדרשים.', responsible: 'קבלן', sortOrder: 3 },
  { workStage: 'בקרה מקדימה', description: 'איטום ובדיקת הצפה אושרו לפני כיסוי, ככל שנדרש.', responsible: 'בקרת איכות', sortOrder: 4 },
  { workStage: 'בקרה מקדימה', description: 'מידות, גוונים, אצוות וכמות חומר להשלמות נבדקו.', responsible: 'קבלן', sortOrder: 5 },
  { workStage: 'בקרה מקדימה', description: 'נקבעו קווי התחלה, מישקים, פתחים וספי גמר.', responsible: 'קבלן', sortOrder: 6 },
  // פרק 2 – בקרה שוטפת (8 פריטים)
  { workStage: 'בקרה שוטפת', description: 'הפריסה, הכיוון והחיתוכים תואמים לתוכנית המאושרת.', responsible: 'בקרת איכות', sortOrder: 7 },
  { workStage: 'בקרה שוטפת', description: 'הדבק מוכן ומיושם בשיטה ובכיסוי הנדרשים.', responsible: 'קבלן', sortOrder: 8 },
  { workStage: 'בקרה שוטפת', description: 'האריחים מקובעים ללא חללים או הפרשי גובה חריגים.', responsible: 'קבלן', sortOrder: 9 },
  { workStage: 'בקרה שוטפת', description: 'רוחב המישקים, הקווים והמפלסים אחידים.', responsible: 'בקרת איכות', sortOrder: 10 },
  { workStage: 'בקרה שוטפת', description: 'שיפועים לנקזים מבוצעים ללא מים עומדים.', responsible: 'קבלן', sortOrder: 11 },
  { workStage: 'בקרה שוטפת', description: 'תפרי הפרדה והתפשטות נשמרים ומטופלים כנדרש.', responsible: 'קבלן', sortOrder: 12 },
  { workStage: 'בקרה שוטפת', description: 'פינות, ספים, פנלים וחיבורים לאביזרים מבוצעים נקי.', responsible: 'קבלן', sortOrder: 13 },
  { workStage: 'בקרה שוטפת', description: 'המשטח מוגן מתנועה ומפגיעה עד להתקשות.', responsible: 'קבלן', sortOrder: 14 },
  // פרק 3 – אישור לפני מסירה (6 פריטים)
  { workStage: 'אישור לפני מסירה', description: 'מישוריות, הפרשי גובה, שיפועים ומפלסים נבדקו.', responsible: 'בקרת איכות', sortOrder: 15 },
  { workStage: 'אישור לפני מסירה', description: 'לא נמצאו אריחים חלולים, סדוקים, מוכתמים או רופפים.', responsible: 'בקרת איכות', sortOrder: 16 },
  { workStage: 'אישור לפני מסירה', description: 'המישקים מולאו באופן אחיד ונקי.', responsible: 'קבלן', sortOrder: 17 },
  { workStage: 'אישור לפני מסירה', description: 'תפרים, ספים, פנלים ונקזים הושלמו.', responsible: 'קבלן', sortOrder: 18 },
  { workStage: 'אישור לפני מסירה', description: 'בדיקות ניקוז/הצפה הושלמו לפי הצורך.', responsible: 'בקרת איכות', sortOrder: 19 },
  { workStage: 'אישור לפני מסירה', description: 'השטח נוקה, הוגן ונשמרו אריחים להחלפה.', responsible: 'קבלן', sortOrder: 20 },
];

// פרק 11 - עבודות צביעה (19 סעיפים: 6+7+6)
const CHAPTER_11_ITEMS = [
  // פרק 1 – בקרה מקדימה (6 פריטים)
  { workStage: 'בקרה מקדימה', description: 'קיימים מפרט, גוונים, מערכות צבע וסאבמיטלים מאושרים.', responsible: 'קבלן', sortOrder: 1 },
  { workStage: 'בקרה מקדימה', description: 'הצבע מתאים לתשתית, לסביבה ולייעוד.', responsible: 'בקרת איכות', sortOrder: 2 },
  { workStage: 'בקרה מקדימה', description: 'התשתית יבשה, יציבה, נקייה וללא אבק או שומן.', responsible: 'קבלן', sortOrder: 3 },
  { workStage: 'בקרה מקדימה', description: 'תיקוני טיח, שפכטל, סדקים וחיבורים הושלמו.', responsible: 'קבלן', sortOrder: 4 },
  { workStage: 'בקרה מקדימה', description: 'פריטים סמוכים הוגנו מפני לכלוך והתזה.', responsible: 'קבלן', sortOrder: 5 },
  { workStage: 'בקרה מקדימה', description: 'בוצע קטע ניסיון ואושרו הגוון ורמת הגמר.', responsible: 'בקרת איכות', sortOrder: 6 },
  // פרק 2 – בקרה שוטפת (7 פריטים)
  { workStage: 'בקרה שוטפת', description: 'חומר היסוד מתאים ומיושם באופן אחיד.', responsible: 'קבלן', sortOrder: 7 },
  { workStage: 'בקרה שוטפת', description: 'הערבוב, הדילול וזמני הייבוש תואמים להוראות היצרן.', responsible: 'קבלן', sortOrder: 8 },
  { workStage: 'בקרה שוטפת', description: 'מספר השכבות ושיעור הכיסוי תואמים למערכת.', responsible: 'בקרת איכות', sortOrder: 9 },
  { workStage: 'בקרה שוטפת', description: 'כל שכבה יבשה, נקייה ותקינה לפני השכבה הבאה.', responsible: 'קבלן', sortOrder: 10 },
  { workStage: 'בקרה שוטפת', description: 'היישום אחיד ללא נזילות, סימני כלים או אזורים חסרים.', responsible: 'בקרת איכות', sortOrder: 11 },
  { workStage: 'בקרה שוטפת', description: 'קנטים, פינות וחיבורים לפריטים אחרים מבוצעים נקי.', responsible: 'קבלן', sortOrder: 12 },
  { workStage: 'בקרה שוטפת', description: 'נשמרת הגנה מאבק, לחות ופגיעה במהלך הייבוש.', responsible: 'קבלן', sortOrder: 13 },
  // פרק 3 – אישור לפני מסירה (6 פריטים)
  { workStage: 'אישור לפני מסירה', description: 'הגוון, הברק והכיסוי אחידים בהתאם לדוגמה המאושרת.', responsible: 'בקרת איכות', sortOrder: 14 },
  { workStage: 'אישור לפני מסירה', description: 'אין קילופים, בועות, סדקים, נזילות או כתמים.', responsible: 'בקרת איכות', sortOrder: 15 },
  { workStage: 'אישור לפני מסירה', description: 'התיקונים נטמעים ואינם נראים לעין בתנאי התאורה הרגילים.', responsible: 'בקרת איכות', sortOrder: 16 },
  { workStage: 'אישור לפני מסירה', description: 'קווי החיבור והקנטים ישרים ונקיים.', responsible: 'קבלן', sortOrder: 17 },
  { workStage: 'אישור לפני מסירה', description: 'פריטים סמוכים נוקו וההגנות הוסרו.', responsible: 'קבלן', sortOrder: 18 },
  { workStage: 'אישור לפני מסירה', description: 'הושלמו תיקונים, תיעוד ומסירת חומר להשלמות.', responsible: 'קבלן', sortOrder: 19 },
];

// פרק 12 - עבודות אלומיניום (19 סעיפים: 6+7+6)
const CHAPTER_12_ITEMS = [
  // פרק 1 – בקרה מקדימה (6 פריטים)
  { workStage: 'בקרה מקדימה', description: 'קיימים רשימות פתחים, תוכניות ייצור, פרטים וסאבמיטלים מאושרים.', responsible: 'קבלן', sortOrder: 1 },
  { workStage: 'בקרה מקדימה', description: 'מידות הפתחים והמפלסים נמדדו ואומתו באתר.', responsible: 'קבלן', sortOrder: 2 },
  { workStage: 'בקרה מקדימה', description: 'הפרופילים, הזיגוג, האטמים והפרזול תואמים לאישור.', responsible: 'בקרת איכות', sortOrder: 3 },
  { workStage: 'בקרה מקדימה', description: 'קיימים אישורי ביצועים, בטיחות ואש ככל שנדרש.', responsible: 'בקרת איכות', sortOrder: 4 },
  { workStage: 'בקרה מקדימה', description: 'הפתחים, העוגנים והספים מוכנים להתקנה.', responsible: 'קבלן', sortOrder: 5 },
  { workStage: 'בקרה מקדימה', description: 'הפריטים מאוחסנים ומוגנים מפגיעה.', responsible: 'קבלן', sortOrder: 6 },
  // פרק 2 – בקרה שוטפת (7 פריטים)
  { workStage: 'בקרה שוטפת', description: 'המסגרות מותקנות במיקום, באנכיות ובמפלס הנדרשים.', responsible: 'קבלן', sortOrder: 7 },
  { workStage: 'בקרה שוטפת', description: 'עיגונים וחיבורים לתשתית מבוצעים לפי פרטי המערכת.', responsible: 'קבלן', sortOrder: 8 },
  { workStage: 'בקרה שוטפת', description: 'מרווחים היקפיים, חומרי מילוי ואיטום רציפים ומתאימים.', responsible: 'בקרת איכות', sortOrder: 9 },
  { workStage: 'בקרה שוטפת', description: 'הזכוכית מותקנת בסוג, בעובי ובכיוון הנכונים.', responsible: 'קבלן', sortOrder: 10 },
  { workStage: 'בקרה שוטפת', description: 'אטמים, ניקוזים ופתחי השוואת לחצים פתוחים ותקינים.', responsible: 'בקרת איכות', sortOrder: 11 },
  { workStage: 'בקרה שוטפת', description: 'הפרזול מותקן ומכוון ללא מאמץ או חיכוך.', responsible: 'קבלן', sortOrder: 12 },
  { workStage: 'בקרה שוטפת', description: 'הגמר והציפוי מוגנים במהלך העבודות.', responsible: 'קבלן', sortOrder: 13 },
  // פרק 3 – אישור לפני מסירה (6 פריטים)
  { workStage: 'אישור לפני מסירה', description: 'פתיחה, סגירה, נעילה וכיוון כל הכנפיים נבדקו.', responsible: 'בקרת איכות', sortOrder: 14 },
  { workStage: 'אישור לפני מסירה', description: 'בוצעה בדיקת אטימות/המטרה ככל שנדרשה.', responsible: 'בקרת איכות', sortOrder: 15 },
  { workStage: 'אישור לפני מסירה', description: 'הזיגוג, האטמים והאיטום שלמים ורציפים.', responsible: 'בקרת איכות', sortOrder: 16 },
  { workStage: 'אישור לפני מסירה', description: 'המסגרות נקיות ללא שריטות, עיוותים או פגיעות.', responsible: 'קבלן', sortOrder: 17 },
  { workStage: 'אישור לפני מסירה', description: 'ניקוזי המסילות והפתחים חופשיים.', responsible: 'קבלן', sortOrder: 18 },
  { workStage: 'אישור לפני מסירה', description: 'נמסרו אישורים, אחריות, הוראות תחזוקה ותיעוד.', responsible: 'קבלן', sortOrder: 19 },
];

// פרק 14 - עבודות אבן (19 סעיפים: 6+7+6)
const CHAPTER_14_ITEMS = [
  // פרק 1 – בקרה מקדימה (6 פריטים)
  { workStage: 'בקרה מקדימה', description: 'קיימים תוכניות פריסה, פרטי עיגון וסאבמיטלים מאושרים.', responsible: 'קבלן', sortOrder: 1 },
  { workStage: 'בקרה מקדימה', description: 'סוג האבן, המקור, המידות והגמר תואמים לאישור.', responsible: 'בקרת איכות', sortOrder: 2 },
  { workStage: 'בקרה מקדימה', description: 'התקבלו בדיקות ואישורי התאמה הנדרשים לאבן.', responsible: 'בקרת איכות', sortOrder: 3 },
  { workStage: 'בקרה מקדימה', description: 'התשתית, העוגנים, הזוויות והמפלסים מוכנים.', responsible: 'קבלן', sortOrder: 4 },
  { workStage: 'בקרה מקדימה', description: 'בוצע קטע ניסיון ואושרו גוון, מרקם ומישקים.', responsible: 'בקרת איכות', sortOrder: 5 },
  { workStage: 'בקרה מקדימה', description: 'האבן מאוחסנת, ממוינת ומוגנת מפגיעה וכתמים.', responsible: 'קבלן', sortOrder: 6 },
  // פרק 2 – בקרה שוטפת (7 פריטים)
  { workStage: 'בקרה שוטפת', description: 'הפריסה, מידות האבן וכיוון המרקם תואמים לתוכנית.', responsible: 'בקרת איכות', sortOrder: 7 },
  { workStage: 'בקרה שוטפת', description: 'העוגנים והחיבורים מותקנים לפי פרטי המערכת.', responsible: 'קבלן', sortOrder: 8 },
  { workStage: 'בקרה שוטפת', description: 'נשמרים מישקים, מרווחי אוורור ותפרים כנדרש.', responsible: 'קבלן', sortOrder: 9 },
  { workStage: 'בקרה שוטפת', description: 'האבנים יציבות, במישור וללא הפרשי גובה חריגים.', responsible: 'בקרת איכות', sortOrder: 10 },
  { workStage: 'בקרה שוטפת', description: 'חיתוכים ופתחים מבוצעים נקי וללא סדיקה.', responsible: 'קבלן', sortOrder: 11 },
  { workStage: 'בקרה שוטפת', description: 'חיבורים לפתחים, קופינגים ופינות מטופלים לפי הפרטים.', responsible: 'קבלן', sortOrder: 12 },
  { workStage: 'בקרה שוטפת', description: 'המשטח מוגן מלכלוך ומפגיעה במהלך הביצוע.', responsible: 'קבלן', sortOrder: 13 },
  // פרק 3 – אישור לפני מסירה (6 פריטים)
  { workStage: 'אישור לפני מסירה', description: 'החיפוי נבדק למישוריות, יציבות ואחידות חזותית.', responsible: 'בקרת איכות', sortOrder: 14 },
  { workStage: 'אישור לפני מסירה', description: 'לא נמצאו אבנים סדוקות, רופפות, מוכתמות או פגומות.', responsible: 'בקרת איכות', sortOrder: 15 },
  { workStage: 'אישור לפני מסירה', description: 'המישקים, התפרים והאיטום הושלמו.', responsible: 'קבלן', sortOrder: 16 },
  { workStage: 'אישור לפני מסירה', description: 'עוגנים וחיבורים נבדקו ותועדו לפני הסתרה.', responsible: 'בקרת איכות', sortOrder: 17 },
  { workStage: 'אישור לפני מסירה', description: 'בוצעו ניקוי וטיפול מגן מאושר ככל שנדרש.', responsible: 'קבלן', sortOrder: 18 },
  { workStage: 'אישור לפני מסירה', description: 'הושלמו בדיקות, תיקונים, תיעוד ואבנים להחלפה.', responsible: 'קבלן', sortOrder: 19 },
];

// פרק 15 - מתקני מיזוג אוויר (20 סעיפים: 6+8+6)
const CHAPTER_15_ITEMS = [
  // פרק 1 – בקרה מקדימה (6 פריטים)
  { workStage: 'בקרה מקדימה', description: 'קיימים תוכניות ביצוע, חישובים, סכמות וסאבמיטלים מאושרים.', responsible: 'קבלן', sortOrder: 1 },
  { workStage: 'בקרה מקדימה', description: 'הציוד, התעלות, הצנרת והאביזרים תואמים לאישור.', responsible: 'בקרת איכות', sortOrder: 2 },
  { workStage: 'בקרה מקדימה', description: 'מיקומים, פתחים, עומסים וממשקים תואמו עם יתר המערכות.', responsible: 'קבלן', sortOrder: 3 },
  { workStage: 'בקרה מקדימה', description: 'בסיסים, תליות, ניקוזים והזנות מוכנים.', responsible: 'קבלן', sortOrder: 4 },
  { workStage: 'בקרה מקדימה', description: 'הציוד מאוחסן מוגן ועם סימון זיהוי.', responsible: 'קבלן', sortOrder: 5 },
  { workStage: 'בקרה מקדימה', description: 'קיימת תוכנית בדיקות, הפעלה, איזון ומסירה.', responsible: 'בקרת איכות', sortOrder: 6 },
  // פרק 2 – בקרה שוטפת (8 פריטים)
  { workStage: 'בקרה שוטפת', description: 'ציוד מותקן במיקום, במפלס ובנגישות לתחזוקה.', responsible: 'קבלן', sortOrder: 7 },
  { workStage: 'בקרה שוטפת', description: 'תעלות וצנרת מותקנות בתוואי ובתמיכות הנדרשות.', responsible: 'קבלן', sortOrder: 8 },
  { workStage: 'בקרה שוטפת', description: 'חיבורים, אוגנים ואטימות המערכת מבוצעים כנדרש.', responsible: 'קבלן', sortOrder: 9 },
  { workStage: 'בקרה שוטפת', description: 'בידוד תרמי/אקוסטי רציף ומוגן, כולל מחסומי אדים.', responsible: 'בקרת איכות', sortOrder: 10 },
  { workStage: 'בקרה שוטפת', description: 'ניקוזי עיבוי מותקנים בשיפוע ונבדקים לזרימה.', responsible: 'קבלן', sortOrder: 11 },
  { workStage: 'בקרה שוטפת', description: 'בולמי רעידות, שרוולים גמישים ואביזרי ויסות מותקנים.', responsible: 'קבלן', sortOrder: 12 },
  { workStage: 'בקרה שוטפת', description: 'מעברי אש וחדירות מטופלים בהתאם לדרישות.', responsible: 'קבלן', sortOrder: 13 },
  { workStage: 'בקרה שוטפת', description: 'המערכת נשמרת נקייה ואטומה במהלך הביצוע.', responsible: 'קבלן', sortOrder: 14 },
  // פרק 3 – אישור לפני מסירה (6 פריטים)
  { workStage: 'אישור לפני מסירה', description: 'בוצעו בדיקות לחץ, אטימות, ניקוז והפעלה.', responsible: 'בקרת איכות', sortOrder: 15 },
  { workStage: 'אישור לפני מסירה', description: 'בוצעו שטיפה, ואקום ומילוי בהתאם לסוג המערכת.', responsible: 'קבלן', sortOrder: 16 },
  { workStage: 'אישור לפני מסירה', description: 'בוצעו איזון אוויר/מים ומדידות ביצועים כנדרש.', responsible: 'בקרת איכות', sortOrder: 17 },
  { workStage: 'אישור לפני מסירה', description: 'רעש, רעידות, טמפרטורות וספיקות נמצאו תקינים.', responsible: 'בקרת איכות', sortOrder: 18 },
  { workStage: 'אישור לפני מסירה', description: 'הציוד, המסננים, הפתחים והבקרה מסומנים ופועלים.', responsible: 'קבלן', sortOrder: 19 },
  { workStage: 'אישור לפני מסירה', description: 'נמסרו דוחות, תוכניות עדות, הוראות ואחריות.', responsible: 'קבלן', sortOrder: 20 },
];

// פרק 19 - מסגרות חרש (20 סעיפים: 6+8+6)
const CHAPTER_19_ITEMS = [
  // פרק 1 – בקרה מקדימה (6 פריטים)
  { workStage: 'בקרה מקדימה', description: 'קיימים תוכניות ייצור והרכבה, חישובים ופרטים מאושרים.', responsible: 'קבלן', sortOrder: 1 },
  { workStage: 'בקרה מקדימה', description: 'פרופילים, פחים, ברגים וחומרי ריתוך תואמים לאישור.', responsible: 'בקרת איכות', sortOrder: 2 },
  { workStage: 'בקרה מקדימה', description: 'תעודות חומר, הסמכות רתכים ונהלי ריתוך זמינים.', responsible: 'בקרת איכות', sortOrder: 3 },
  { workStage: 'בקרה מקדימה', description: 'מידות, צירים, בסיסים ועוגנים נמדדו ואומתו.', responsible: 'קבלן', sortOrder: 4 },
  { workStage: 'בקרה מקדימה', description: 'תוכנית בדיקות ריתוך והידוק אושרה.', responsible: 'בקרת איכות', sortOrder: 5 },
  { workStage: 'בקרה מקדימה', description: 'הוגדרו שיטת הרמה, תמיכות זמניות ובטיחות ההרכבה.', responsible: 'קבלן', sortOrder: 6 },
  // פרק 2 – בקרה שוטפת (8 פריטים)
  { workStage: 'בקרה שוטפת', description: 'סימון, מידות וכיוון האלמנטים תואמים לתוכניות.', responsible: 'בקרת איכות', sortOrder: 7 },
  { workStage: 'בקרה שוטפת', description: 'ההרכבה מתבצעת לפי סדר מאושר עם ייצוב זמני.', responsible: 'קבלן', sortOrder: 8 },
  { workStage: 'בקרה שוטפת', description: 'חיבורי ברגים מורכבים ומהודקים בשיטה הנדרשת.', responsible: 'קבלן', sortOrder: 9 },
  { workStage: 'בקרה שוטפת', description: 'הריתוכים מבוצעים לפי הנוהל המאושר ובידי רתכים מוסמכים.', responsible: 'בקרת איכות', sortOrder: 10 },
  { workStage: 'בקרה שוטפת', description: 'מידות הריתוך, רציפותו ומראהו נבדקים.', responsible: 'בקרת איכות', sortOrder: 11 },
  { workStage: 'בקרה שוטפת', description: 'אנכיות, מפלסים, צירים וקמבר נבדקים במהלך ההרכבה.', responsible: 'קבלן', sortOrder: 12 },
  { workStage: 'בקרה שוטפת', description: 'נזקי ציפוי וקורוזיה מטופלים במערכת המאושרת.', responsible: 'קבלן', sortOrder: 13 },
  { workStage: 'בקרה שוטפת', description: 'בדיקות לא הורסות מבוצעות ומתועדות לפי התוכנית.', responsible: 'בקרת איכות', sortOrder: 14 },
  // פרק 3 – אישור לפני מסירה (6 פריטים)
  { workStage: 'אישור לפני מסירה', description: 'הגאומטריה, המפלסים, האנכיות והחיבורים הסופיים נבדקו.', responsible: 'בקרת איכות', sortOrder: 15 },
  { workStage: 'אישור לפני מסירה', description: 'כל הברגים, הריתוכים והעוגנים הושלמו וסומנו.', responsible: 'קבלן', sortOrder: 16 },
  { workStage: 'אישור לפני מסירה', description: 'תוצאות בדיקות הריתוך וההידוק התקבלו ואושרו.', responsible: 'בקרת איכות', sortOrder: 17 },
  { workStage: 'אישור לפני מסירה', description: 'תיקוני גלוון/צבע והגנת קורוזיה הושלמו.', responsible: 'קבלן', sortOrder: 18 },
  { workStage: 'אישור לפני מסירה', description: 'תמיכות זמניות הוסרו לאחר קבלת אישור.', responsible: 'קבלן', sortOrder: 19 },
  { workStage: 'אישור לפני מסירה', description: 'הושלמו תוכניות עדות, תעודות חומר ודוחות בדיקה.', responsible: 'קבלן', sortOrder: 20 },
];

// פרק 22 - רכיבים מתועשים בבניין (20 סעיפים: 6+8+6)
const CHAPTER_22_ITEMS = [
  // פרק 1 – בקרה מקדימה (6 פריטים)
  { workStage: 'בקרה מקדימה', description: 'קיימים תוכניות, פריסות, פרטים וסאבמיטלים מאושרים.', responsible: 'קבלן', sortOrder: 1 },
  { workStage: 'בקרה מקדימה', description: 'סוגי הלוחות, השלד, הבידוד והאביזרים תואמים לאישור.', responsible: 'בקרת איכות', sortOrder: 2 },
  { workStage: 'בקרה מקדימה', description: 'סומנו מיקומי מחיצות, פתחים, מפלסים וממשקי מערכות.', responsible: 'קבלן', sortOrder: 3 },
  { workStage: 'בקרה מקדימה', description: 'התשתיות יבשות, נקיות ומוכנות להתקנה.', responsible: 'קבלן', sortOrder: 4 },
  { workStage: 'בקרה מקדימה', description: 'רכיבים נשמרים יבשים, ישרים ומוגנים מפגיעה.', responsible: 'קבלן', sortOrder: 5 },
  { workStage: 'בקרה מקדימה', description: 'דרישות אש, אקוסטיקה ורטיבות זוהו בתוכניות.', responsible: 'בקרת איכות', sortOrder: 6 },
  // פרק 2 – בקרה שוטפת (8 פריטים)
  { workStage: 'בקרה שוטפת', description: 'מסילות וניצבים מותקנים במיקום ובמרווחים הנדרשים.', responsible: 'קבלן', sortOrder: 7 },
  { workStage: 'בקרה שוטפת', description: 'עיגונים וחיזוקים לפתחים, ציוד ואביזרים מבוצעים לפי הפרטים.', responsible: 'קבלן', sortOrder: 8 },
  { workStage: 'בקרה שוטפת', description: 'מערכות ובידוד מותקנים לפני סגירת הדופן ומתועדים.', responsible: 'בקרת איכות', sortOrder: 9 },
  { workStage: 'בקרה שוטפת', description: 'סוג, מספר ושכבות הלוחות תואמים לייעוד המחיצה.', responsible: 'בקרת איכות', sortOrder: 10 },
  { workStage: 'בקרה שוטפת', description: 'ברגים מותקנים במרווח ובעומק המתאימים ללא פגיעה בלוח.', responsible: 'קבלן', sortOrder: 11 },
  { workStage: 'בקרה שוטפת', description: 'מישקים, פינות וראשי ברגים מטופלים במערכת המאושרת.', responsible: 'קבלן', sortOrder: 12 },
  { workStage: 'בקרה שוטפת', description: 'חיבורים לרצפה, לתקרה ולקירות סמוכים מבוצעים לפי הפרט.', responsible: 'קבלן', sortOrder: 13 },
  { workStage: 'בקרה שוטפת', description: 'הגנה מאש, אקוסטיקה ואיטום חדירות נשמרים ברציפות.', responsible: 'בקרת איכות', sortOrder: 14 },
  // פרק 3 – אישור לפני מסירה (6 פריטים)
  { workStage: 'אישור לפני מסירה', description: 'מידות, מישוריות, אנכיות ומיקום פתחים נבדקו.', responsible: 'בקרת איכות', sortOrder: 15 },
  { workStage: 'אישור לפני מסירה', description: 'אין לוחות שבורים, רטובים, מעוותים או חיבורים רופפים.', responsible: 'בקרת איכות', sortOrder: 16 },
  { workStage: 'אישור לפני מסירה', description: 'המישקים והגמר אחידים ללא סדקים או בליטות.', responsible: 'קבלן', sortOrder: 17 },
  { workStage: 'אישור לפני מסירה', description: 'חיזוקים, פתחים ואביזרים הושלמו.', responsible: 'קבלן', sortOrder: 18 },
  { workStage: 'אישור לפני מסירה', description: 'בוצעו בדיקות אש/אקוסטיקה ככל שנדרשו.', responsible: 'בקרת איכות', sortOrder: 19 },
  { workStage: 'אישור לפני מסירה', description: 'הושלמו תיקונים, תיעוד והכנה לצבע/חיפוי.', responsible: 'קבלן', sortOrder: 20 },
];

// פרק 34 - מערכות גילוי וכיבוי אש (19 סעיפים: 6+7+6)
const CHAPTER_34_ITEMS = [
  // פרק 1 – בקרה מקדימה (6 פריטים)
  { workStage: 'בקרה מקדימה', description: 'קיימים תוכניות מאושרות, מטריצת הפעלות וסאבמיטלים.', responsible: 'קבלן', sortOrder: 1 },
  { workStage: 'בקרה מקדימה', description: 'הציוד והאביזרים תואמים לאישור ולייעוד המערכת.', responsible: 'בקרת איכות', sortOrder: 2 },
  { workStage: 'בקרה מקדימה', description: 'מיקומי ציוד, צנרת, גלאים ומתזים תואמו עם יתר המערכות.', responsible: 'קבלן', sortOrder: 3 },
  { workStage: 'בקרה מקדימה', description: 'מקורות מים/חשמל, פתחים ותשתיות מוכנים.', responsible: 'קבלן', sortOrder: 4 },
  { workStage: 'בקרה מקדימה', description: 'ציוד מאוחסן מוגן ועם סימון זיהוי.', responsible: 'קבלן', sortOrder: 5 },
  { workStage: 'בקרה מקדימה', description: 'נקבעו בדיקות, אינטגרציה ואישורי גורמים מוסמכים.', responsible: 'בקרת איכות', sortOrder: 6 },
  // פרק 2 – בקרה שוטפת (7 פריטים)
  { workStage: 'בקרה שוטפת', description: 'צנרת, כבלים וציוד מותקנים בתוואי ובתמיכות הנדרשות.', responsible: 'קבלן', sortOrder: 7 },
  { workStage: 'בקרה שוטפת', description: 'גלאים, מתזים ואביזרים מותקנים במיקום ובכיסוי המתוכננים.', responsible: 'קבלן', sortOrder: 8 },
  { workStage: 'בקרה שוטפת', description: 'מגופים, תחנות שליטה וציוד נגישים ומסומנים.', responsible: 'קבלן', sortOrder: 9 },
  { workStage: 'בקרה שוטפת', description: 'חיבורים, הארקות, אטימות ומעברי אש מבוצעים כנדרש.', responsible: 'בקרת איכות', sortOrder: 10 },
  { workStage: 'בקרה שוטפת', description: 'המערכת מוגנת מלכלוך ומפגיעה במהלך העבודות.', responsible: 'קבלן', sortOrder: 11 },
  { workStage: 'בקרה שוטפת', description: 'בדיקות לחץ, שטיפה ורציפות מתועדות לפני סגירה.', responsible: 'בקרת איכות', sortOrder: 12 },
  { workStage: 'בקרה שוטפת', description: 'ממשקים למערכות אחרות מחוברים לפי מטריצת ההפעלות.', responsible: 'קבלן', sortOrder: 13 },
  // פרק 3 – אישור לפני מסירה (6 פריטים)
  { workStage: 'אישור לפני מסירה', description: 'בוצעו בדיקות הפעלה לכל רכיבי המערכת.', responsible: 'בקרת איכות', sortOrder: 14 },
  { workStage: 'אישור לפני מסירה', description: 'בוצעה בדיקת אינטגרציה בהתאם למטריצת ההפעלות.', responsible: 'בקרת איכות', sortOrder: 15 },
  { workStage: 'אישור לפני מסירה', description: 'לחצים, ספיקות, התרעות, חיוויים ופקודות נמצאו תקינים.', responsible: 'בקרת איכות', sortOrder: 16 },
  { workStage: 'אישור לפני מסירה', description: 'כל הציוד, המגופים והאזורים מסומנים.', responsible: 'קבלן', sortOrder: 17 },
  { workStage: 'אישור לפני מסירה', description: 'התקבלו אישורי מעבדה/רשות/גורם מוסמך כנדרש.', responsible: 'בקרת איכות', sortOrder: 18 },
  { workStage: 'אישור לפני מסירה', description: 'נמסרו תוכניות עדות, דוחות, הדרכה והוראות תחזוקה.', responsible: 'קבלן', sortOrder: 19 },
];

// ברירת מחדל לפרקים שאין להם תבנית ספציפית
const DEFAULT_CHECKLIST_ITEMS = [
  { workStage: 'בקרה מקדימה', description: 'בדיקת תוכניות ומסמכים מאושרים', responsible: 'בקרת איכות', sortOrder: 1 },
  { workStage: 'בקרה מקדימה', description: 'בדיקת חומרים ואישורים', responsible: 'קבלן', sortOrder: 2 },
  { workStage: 'בקרה מקדימה', description: 'בדיקת תשתית וניקיון', responsible: 'קבלן', sortOrder: 3 },
  { workStage: 'בקרה שוטפת', description: 'ביצוע לפי תוכנית', responsible: 'קבלן', sortOrder: 4 },
  { workStage: 'בקרה שוטפת', description: 'בדיקות איכות שוטפות', responsible: 'בקרת איכות', sortOrder: 5 },
  { workStage: 'בקרה שוטפת', description: 'תיעוד ממצאים', responsible: 'בקרת איכות', sortOrder: 6 },
  { workStage: 'אישור לפני מסירה', description: 'בדיקה סופית', responsible: 'בקרת איכות', sortOrder: 7 },
  { workStage: 'אישור לפני מסירה', description: 'תיקון ליקויים', responsible: 'קבלן', sortOrder: 8 },
  { workStage: 'אישור לפני מסירה', description: 'אישור מסירה', responsible: 'פיקוח', sortOrder: 9 },
];

const CHAPTER_CHECKLIST_ITEMS: Record<string, typeof DEFAULT_CHECKLIST_ITEMS> = {
  '01': CHAPTER_01_ITEMS,
  '02': CHAPTER_02_ITEMS,
  '04': CHAPTER_04_ITEMS,
  '05': CHAPTER_05_ITEMS,
  '06': CHAPTER_06_ITEMS,
  '07': CHAPTER_07_ITEMS,
  '08': CHAPTER_08_ITEMS,
  '09': CHAPTER_09_ITEMS,
  '10': CHAPTER_10_ITEMS,
  '11': CHAPTER_11_ITEMS,
  '12': CHAPTER_12_ITEMS,
  '14': CHAPTER_14_ITEMS,
  '15': CHAPTER_15_ITEMS,
  '19': CHAPTER_19_ITEMS,
  '22': CHAPTER_22_ITEMS,
  '34': CHAPTER_34_ITEMS,
};

function getChecklistItemsForChapter(chapterCode: string) {
  return CHAPTER_CHECKLIST_ITEMS[chapterCode] || DEFAULT_CHECKLIST_ITEMS;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const checklists = await prisma.checklist.findMany({
      where: { projectChapterId: id },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(checklists);
  } catch (error) {
    console.error('Error fetching checklists:', error);
    return NextResponse.json({ error: 'Failed to fetch checklists' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    // קבל את קוד הפרק כדי לבחור את פריטי הרשימה המתאימים
    const projectChapter = await prisma.projectChapter.findUnique({
      where: { id },
      include: { chapter: true },
    });

    const chapterCode = projectChapter?.chapter?.code || '';
    const checklistItems = getChecklistItemsForChapter(chapterCode);

    const checklist = await prisma.checklist.create({
      data: {
        projectChapterId: id,
        name: data.name,
        building: data.building,
        elementType: data.elementType,
        location: data.location,
        planNumber: data.planNumber,
        mainContractor: data.mainContractor,
        openDate: data.openDate ? new Date(data.openDate) : null,
        closeDate: data.closeDate ? new Date(data.closeDate) : null,
        items: {
          create: checklistItems,
        },
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return NextResponse.json(checklist, { status: 201 });
  } catch (error) {
    console.error('Error creating checklist:', error);
    return NextResponse.json({ error: 'Failed to create checklist' }, { status: 500 });
  }
}
