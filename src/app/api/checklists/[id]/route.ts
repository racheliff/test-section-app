import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const checklist = await prisma.checklist.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        projectChapter: {
          include: {
            project: true,
            chapter: true,
          },
        },
      },
    });

    if (!checklist) {
      return NextResponse.json({ error: 'Checklist not found' }, { status: 404 });
    }

    return NextResponse.json(checklist);
  } catch (error) {
    console.error('Error fetching checklist:', error);
    return NextResponse.json({ error: 'Failed to fetch checklist' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.building !== undefined) updateData.building = data.building;
    if (data.elementType !== undefined) updateData.elementType = data.elementType;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.planNumber !== undefined) updateData.planNumber = data.planNumber;
    if (data.mainContractor !== undefined) updateData.mainContractor = data.mainContractor;
    if (data.openDate !== undefined) updateData.openDate = data.openDate ? new Date(data.openDate) : null;
    if (data.closeDate !== undefined) updateData.closeDate = data.closeDate ? new Date(data.closeDate) : null;
    if (data.signature !== undefined) updateData.signature = data.signature;
    if (data.signedBy !== undefined) updateData.signedBy = data.signedBy;
    if (data.signedAt !== undefined) updateData.signedAt = data.signedAt ? new Date(data.signedAt) : null;

    const checklist = await prisma.checklist.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return NextResponse.json(checklist);
  } catch (error) {
    console.error('Error updating checklist:', error);
    return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.checklist.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting checklist:', error);
    return NextResponse.json({ error: 'Failed to delete checklist' }, { status: 500 });
  }
}
