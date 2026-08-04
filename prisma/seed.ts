import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

const chapters = [
  { code: "00", name: "מוקדמות" },
  { code: "01", name: "עבודות עפר" },
  { code: "02", name: "עבודות בטון יצוק באתר" },
  { code: "03", name: "מוצרי בטון טרום (בטון טרומי)" },
  { code: "04", name: "עבודות בנייה" },
  { code: "05", name: "עבודות איטום" },
  { code: "06", name: "מוצרי נגרות אומן ומסגרות פלדה" },
  { code: "07", name: "מתקני תברואה" },
  { code: "08", name: "מתקני חשמל" },
  { code: "09", name: "עבודות טיח" },
  { code: "10", name: "עבודות ריצוף וחיפוי" },
  { code: "11", name: "עבודות צביעה" },
  { code: "12", name: "עבודות אלומיניום" },
  { code: "14", name: "עבודות אבן" },
  { code: "15", name: "מתקני מיזוג אוויר" },
  { code: "18", name: "תשתיות תקשורת" },
  { code: "22", name: "רכיבים מתועשים בבניין" },
  { code: "19", name: "מסגרות חרש" },
  { code: "34", name: "מערכות גילוי וכיבוי אש" },
  { code: "39", name: "מערכות דיזל-גנרטור" },
  { code: "40", name: "פיתוח האתר" },
  { code: "41", name: "גינון והשקיה" },
  { code: "43", name: "קירות תומכים ועבודות פיתוח מיוחדות" },
  { code: "51", name: "סלילת כבישים ורחבות" },
  { code: "54", name: "עבודות מנהור" },
  { code: "57", name: "קווי מים, ביוב וניקוז" },
  { code: "58", name: "מקלטים ומרחבים מוגנים" },
  { code: "59", name: 'ממ"דים ומרחבים מוגנים מיוחדים' },
  { code: "60", name: "עבודות גישור" },
  { code: "66", name: "מתקני פלדה נושאי אנטנות" },
  { code: "67", name: "מתקני פלדה לציוד ייעודי" },
  { code: "81", name: "BIM לניהול, תיאום וביצוע עבודות בנייה" },
  { code: "97", name: "בטיחות בעבודות בנייה" },
  { code: "102", name: "המסמכים ההנדסיים של מכרז וחוזה הבנייה" },
  { code: "1000", name: "לוח הפרסומים והעדכונים" },
];

async function main() {
  console.log("Seeding chapters...");

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    await (prisma as any).chapter.upsert({
      where: { code: chapter.code },
      update: { name: chapter.name, sortOrder: i },
      create: { code: chapter.code, name: chapter.name, sortOrder: i },
    });
  }

  console.log(`Seeded ${chapters.length} chapters`);

  console.log("Creating demo project...");

  await (prisma as any).project.upsert({
    where: { code: "PRJ-001" },
    update: {},
    create: {
      code: "PRJ-001",
      name: "פרויקט מגורים - רמת השרון",
    },
  });

  console.log("Demo project created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
