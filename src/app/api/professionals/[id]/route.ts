import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const professional = await prisma.professional.update({
      where: { id },
      data: {
        role: data.role,
        name: data.name,
        company: data.company,
        phone: data.phone,
        email: data.email,
      },
    });

    return NextResponse.json(professional);
  } catch (error) {
    console.error('Error updating professional:', error);
    return NextResponse.json({ error: 'Failed to update professional' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.professional.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting professional:', error);
    return NextResponse.json({ error: 'Failed to delete professional' }, { status: 500 });
  }
}
