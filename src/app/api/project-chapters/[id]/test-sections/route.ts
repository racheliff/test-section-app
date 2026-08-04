import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function generateFormNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TST-${year}-${random}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const testSections = await prisma.testSection.findMany({
      where: { projectChapterId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        participants: true,
        crewMembers: true,
        equipment: true,
        tests: true,
        attachments: true,
      },
    });

    return NextResponse.json(testSections);
  } catch (error) {
    console.error('Error fetching test sections:', error);
    return NextResponse.json({ error: 'Failed to fetch test sections' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const formNumber = generateFormNumber();

    const testSection = await prisma.testSection.create({
      data: {
        formNumber,
        projectChapterId: id,
        date: new Date(data.date),
        sectionName: data.sectionName,
        locationDescription: data.locationDescription,
        structure: data.structure,
        crossSections: data.crossSections,
        descriptionNotes: data.descriptionNotes,
        executionSteps: data.executionSteps,
        qualityControlApproval: data.qualityControlApproval,
        qualityControlApproverName: data.qualityControlApproverName || null,
        qualityControlApprovalDate: data.qualityControlApprovalDate ? new Date(data.qualityControlApprovalDate) : null,
        supervisionApproval: data.supervisionApproval,
        supervisionApproverName: data.supervisionApproverName || null,
        supervisionApprovalDate: data.supervisionApprovalDate ? new Date(data.supervisionApprovalDate) : null,
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

    return NextResponse.json(testSection, { status: 201 });
  } catch (error) {
    console.error('Error creating test section:', error);
    return NextResponse.json({ error: 'Failed to create test section' }, { status: 500 });
  }
}
