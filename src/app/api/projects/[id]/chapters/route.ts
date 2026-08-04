import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const fileType = searchParams.get('fileType') || 'building';

    const projectChapters = await prisma.projectChapter.findMany({
      where: {
        projectId: id,
        fileType: fileType,
      },
      include: {
        chapter: true,
        _count: {
          select: { testSections: true },
        },
      },
      orderBy: {
        chapter: {
          sortOrder: 'asc',
        },
      },
    });

    return NextResponse.json(projectChapters);
  } catch (error) {
    console.error('Error fetching project chapters:', error);
    return NextResponse.json({ error: 'Failed to fetch project chapters' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const projectChapter = await prisma.projectChapter.create({
      data: {
        projectId: id,
        chapterId: data.chapterId,
        fileType: data.fileType || 'building',
      },
      include: {
        chapter: true,
      },
    });

    return NextResponse.json(projectChapter, { status: 201 });
  } catch (error) {
    console.error('Error adding chapter to project:', error);
    return NextResponse.json({ error: 'Failed to add chapter to project' }, { status: 500 });
  }
}
