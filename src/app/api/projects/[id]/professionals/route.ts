import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const professionals = await prisma.professional.findMany({
      where: { projectId: id },
      orderBy: [
        { category: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return NextResponse.json(professionals);
  } catch (error) {
    console.error('Error fetching professionals:', error);
    return NextResponse.json({ error: 'Failed to fetch professionals' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const professional = await prisma.professional.create({
      data: {
        projectId: id,
        category: data.category,
        role: data.role,
        name: data.name,
        company: data.company,
        phone: data.phone,
        email: data.email,
      },
    });

    return NextResponse.json(professional, { status: 201 });
  } catch (error) {
    console.error('Error creating professional:', error);
    return NextResponse.json({ error: 'Failed to create professional' }, { status: 500 });
  }
}
