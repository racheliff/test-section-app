import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const testSection = await prisma.testSection.findUnique({
      where: { id },
      include: {
        participants: true,
        crewMembers: true,
        equipment: true,
        tests: true,
        attachments: true,
        projectChapter: {
          include: {
            project: true,
            chapter: true,
          },
        },
      },
    });

    if (!testSection) {
      return NextResponse.json({ error: 'Test section not found' }, { status: 404 });
    }

    return NextResponse.json(testSection);
  } catch (error) {
    console.error('Error fetching test section:', error);
    return NextResponse.json({ error: 'Failed to fetch test section' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    await prisma.participant.deleteMany({ where: { testSectionId: id } });
    await prisma.crewMember.deleteMany({ where: { testSectionId: id } });
    await prisma.equipment.deleteMany({ where: { testSectionId: id } });
    await prisma.test.deleteMany({ where: { testSectionId: id } });

    const testSection = await prisma.testSection.update({
      where: { id },
      data: {
        date: new Date(data.date),
        sectionName: data.sectionName,
        locationDescription: data.locationDescription,
        structure: data.structure,
        crossSections: data.crossSections,
        descriptionNotes: data.descriptionNotes,
        executionSteps: data.executionSteps,
        qualityControlApproval: data.qualityControlApproval,
        supervisionApproval: data.supervisionApproval,
        status: data.status,
        summaryNotes: data.summaryNotes,
        participants: {
          create: data.participants.map((p: any) => ({
            role: p.role,
            name: p.name,
            company: p.company,
            phone: p.phone,
          })),
        },
        crewMembers: {
          create: data.crewMembers.filter((c: any) => c.name).map((c: any) => ({
            name: c.name,
            role: c.role,
          })),
        },
        equipment: {
          create: data.equipment.filter((e: any) => e.name).map((e: any) => ({
            name: e.name,
            quantity: e.quantity,
            notes: e.notes,
          })),
        },
        tests: {
          create: data.tests.filter((t: any) => t.testType).map((t: any) => ({
            testType: t.testType,
            requirement: t.requirement,
            result: t.result,
            certificateNumber: t.certificateNumber,
            status: t.status,
          })),
        },
        attachments: {
          create: data.attachments.map((a: any) => ({
            filename: a.filename,
            filepath: a.filepath,
            filesize: a.filesize,
            mimetype: a.mimetype,
          })),
        },
      },
      include: {
        participants: true,
        crewMembers: true,
        equipment: true,
        tests: true,
        attachments: true,
      },
    });

    return NextResponse.json(testSection);
  } catch (error) {
    console.error('Error updating test section:', error);
    return NextResponse.json({ error: 'Failed to update test section' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.testSection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting test section:', error);
    return NextResponse.json({ error: 'Failed to delete test section' }, { status: 500 });
  }
}
