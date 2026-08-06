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
  { workStage: 'בקרה מקדימה', description: 'קיימות תוכניות, פרטי ביצוע, ומפרט ותוכניות יציקה מאושרים.', responsible: 'קבלן', sortOrder: 1 },
  { workStage: 'בקרה מקדימה', description: 'סוג הבטון, דרגת החוזק, דרגת החשיפה והתערובת תואמים למסמכים המאושרים.', responsible: 'בקרת איכות', sortOrder: 2 },
  { workStage: 'בקרה מקדימה', description: 'התפסות ביציבות, נקיות, שמנות, ותומכות במפלסים הנדרשים.', responsible: 'קבלן', sortOrder: 3 },
  { workStage: 'בקרה מקדימה', description: 'זיווג תוכנית והתוכניות: קוטרים, מרחקים, דריכות, וכיפופי עבודה.', responsible: 'בקרת איכות', sortOrder: 4 },
  { workStage: 'בקרה מקדימה', description: 'כיסוי בטון, ספייסרים והתומכות ביציבות ובמיצוב.', responsible: 'קבלן', sortOrder: 5 },
  { workStage: 'בקרה מקדימה', description: 'פתחים, שרוולים, עוגנים, ומוברים ופרופילים מותקנים ומקובעים.', responsible: 'קבלן', sortOrder: 6 },
  { workStage: 'בקרה מקדימה', description: 'תפרים, והפסקות יציקה ומוגדרים ליציקה קודמת מתאם לפרמיה.', responsible: 'קבלן', sortOrder: 7 },
  { workStage: 'בקרה מקדימה', description: 'שטח היציקה נקי ויבש, פסולת, ובטון קשור והכברים זרו.', responsible: 'קבלן', sortOrder: 8 },
  { workStage: 'בקרה מקדימה', description: 'קיימות ציוד, כון מים, תאורה, ורטט והציוד משפרה והתאמות.', responsible: 'קבלן', sortOrder: 9 },
  // פרק 2 – בקרה שוטפת (9 פריטים)
  { workStage: 'בקרה שוטפת', description: 'תעודות המשלוח נבדקו והזווג תואמת להזמנה ולתערובת המאושרת.', responsible: 'בקרת איכות', sortOrder: 10 },
  { workStage: 'בקרה שוטפת', description: 'כונן ותיעוד, תמונות והפרטוק ומסור הפרטוק נרשמו או ניצף תקינות.', responsible: 'בקרת איכות', sortOrder: 11 },
  { workStage: 'בקרה שוטפת', description: 'לא נוספה מים לא תוספים באתר ללא אישור ותיעוד.', responsible: 'בקרת איכות', sortOrder: 12 },
  { workStage: 'בקרה שוטפת', description: 'מבוצעות בדיקות בטון ברמה לא בכל מועמדות בהתאם לתוכניות ולבדיקות.', responsible: 'בקרת איכות', sortOrder: 13 },
  { workStage: 'בקרה שוטפת', description: 'הבטונה יצקת ברציפות ובמסור התוכניה, ללא הפרדות לא נפילות לתוך הבקרות.', responsible: 'קבלן', sortOrder: 14 },
  { workStage: 'בקרה שוטפת', description: 'מבוצע ריטוט שתואמת ומספק, ללא ריטוט ותיר שפוגע בבטון ובתפסות.', responsible: 'קבלן', sortOrder: 15 },
  { workStage: 'בקרה שוטפת', description: 'לא נצפה תפוחה, פתיחות, נזילות או עוויות של התפסות והתומכות.', responsible: 'קבלן', sortOrder: 16 },
  { workStage: 'בקרה שוטפת', description: 'המפלס, עובי, ושיפועים וכיור פני הבטון מבוצעת בהתאם לתוכניה.', responsible: 'קבלן', sortOrder: 17 },
  { workStage: 'בקרה שוטפת', description: 'והמשפרה בבטונה עם הזווג והמועד והמשלוח של נקבע.', responsible: 'בקרת איכות', sortOrder: 18 },
  // פרק 3 – אישור לפני מסירה (6 פריטים)
  { workStage: 'אישור לפני מסירה', description: 'פירוק התפסות והתומכות מבוצע לאחר קבלת חוזק ואישור והמועד תואם.', responsible: 'בקרת איכות', sortOrder: 19 },
  { workStage: 'אישור לפני מסירה', description: 'נבדקו איכות, המפלסים, לא נמצאות, ומיקום פתחים והמוגדרים לאלמנט.', responsible: 'בקרת איכות', sortOrder: 20 },
  { workStage: 'אישור לפני מסירה', description: 'פני הבטון נבדקו ולא נמצאו סדירציות, חוסר יצק, סוגים לא ומרות ושחיף.', responsible: 'קבלן', sortOrder: 21 },
  { workStage: 'אישור לפני מסירה', description: 'ליקויים תועדו ותוקנו ואושרו והמוגדרים לאושרים.', responsible: 'בקרת איכות', sortOrder: 22 },
  { workStage: 'אישור לפני מסירה', description: 'תוצאות בדיקות הבטון התקבלו, נבדקו והשיגו לבטונה ולהמועד ליציקה.', responsible: 'בקרת איכות', sortOrder: 23 },
  { workStage: 'אישור לפני מסירה', description: 'והמשפרה, ותיעוד, תעודות והמשלוח, ובאות הזמנות לתוכניות.', responsible: 'קבלן', sortOrder: 24 },
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
