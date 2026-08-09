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
