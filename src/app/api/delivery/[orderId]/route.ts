import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const delivery = await prisma.delivery.findUnique({
      where: { orderId },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: 'Delivery not found for this order' },
        { status: 404 }
      );
    }

    return NextResponse.json({ delivery }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch delivery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery' },
      { status: 500 }
    );
  }
}
