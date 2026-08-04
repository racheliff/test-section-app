import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_CHECKLIST_ITEMS = [
  { workStage: 'בקרה מקדימה', description: 'בדיקת ניקיון ויישור התשתית', responsible: 'קבלן', sortOrder: 1 },
  { workStage: 'בקרה מקדימה', description: 'בדיקת חומרים מאושרים ועבודה לפי תוכנית עדכנית', responsible: 'בקרת איכות', sortOrder: 2 },
  { workStage: 'קונסטרוקציה', description: 'סימון מיקום קירות/תקרות לפי', responsible: 'מודד/קבלן', sortOrder: 3 },
  { workStage: 'קונסטרוקציה', description: 'בדיקת פרופילים (מרחקים, עיגון, יישור)', responsible: 'קבלן', sortOrder: 4 },
  { workStage: 'קונסטרוקציה', description: 'בדיקת חיזוקים במקומות נדרשים', responsible: 'קבלן/בקרת איכות', sortOrder: 5 },
  { workStage: "סגירת צד א'", description: "בדיקת לוחות גבס צד א' (קיבוע, מרווחים, ברגים)", responsible: 'קבלן', sortOrder: 6 },
  { workStage: 'מיזוג אויר', description: 'בדיקת תעלות על פי תוכנית', responsible: 'קבלן מערכות', sortOrder: 7 },
  { workStage: 'מיזוג אויר', description: 'בדיקת אביזרים, דמפרים, מפוחים, VRF', responsible: 'קבלן מערכות', sortOrder: 8 },
  { workStage: 'מיזוג אויר', description: 'צנרת גז לאחר טסט+אישור קבלן', responsible: 'קבלן מערכות', sortOrder: 9 },
  { workStage: 'מיזוג אויר', description: 'מיקום פתחים על פי תוכנית תקרה', responsible: 'קבלן מערכות', sortOrder: 10 },
  { workStage: 'חשמל + תקשורת', description: 'בדיקת צנרת על פי מפרט', responsible: 'קבלן מערכות', sortOrder: 11 },
  { workStage: 'חשמל + תקשורת', description: 'מיקום נקודות על פי תוכנית', responsible: 'קבלן מערכות', sortOrder: 12 },
  { workStage: 'אינסטלציה - מים', description: 'קיבוע צנרת על פי תקן', responsible: 'קבלן מערכות', sortOrder: 13 },
  { workStage: 'אינסטלציה - מים', description: 'בדיקת צנרת על פי מפרט', responsible: 'קבלן מערכות', sortOrder: 14 },
  { workStage: 'אינסטלציה - מים', description: 'מיקום נקודות על פי תוכנית', responsible: 'קבלן מערכות', sortOrder: 15 },
  { workStage: 'אינסטלציה - מים', description: 'קיבוע צנרת על פי תקן', responsible: 'קבלן מערכות', sortOrder: 16 },
  { workStage: 'בידוד', description: 'התקנת בידוד אקוסטי לפי מפרט (צמר זכוכית 2")', responsible: 'קבלן', sortOrder: 17 },
  { workStage: 'אישור לפני סגירה', description: "אישור פיקוח ובקרת איכות לסגירת צד ב'", responsible: 'פיקוח / בקרת איכות', sortOrder: 18 },
  { workStage: "סגירת צד ב'", description: "בדיקת סגירת צד ב' לאחר אישור מערכות", responsible: 'קבלן', sortOrder: 19 },
  { workStage: 'גמר', description: 'בדיקת שפכטל, סרטים וחיבורים', responsible: 'קבלן', sortOrder: 20 },
  { workStage: 'גמר', description: 'בדיקת יישור ואיכות פני שטח', responsible: 'בקרת איכות', sortOrder: 21 },
  { workStage: 'מסירה', description: 'בדיקת מסירה סופית ותיקונים', responsible: 'פיקוח / בקרת איכות', sortOrder: 22 },
];

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
          create: DEFAULT_CHECKLIST_ITEMS,
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
