import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const projectChapter = await prisma.projectChapter.findUnique({
      where: { id },
      include: {
        project: true,
        chapter: true,
        testSections: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!projectChapter) {
      return NextResponse.json({ error: 'Project chapter not found' }, { status: 404 });
    }

    return NextResponse.json(projectChapter);
  } catch (error) {
    console.error('Error fetching project chapter:', error);
    return NextResponse.json({ error: 'Failed to fetch project chapter' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.projectChapter.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project chapter:', error);
    return NextResponse.json({ error: 'Failed to delete project chapter' }, { status: 500 });
  }
}
