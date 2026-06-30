import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'email query param is required' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { email },
      select: { loyaltyPoints: true, name: true },
    });

    if (!customer) {
      return NextResponse.json({ points: 0, name: null }, { status: 200 });
    }

    return NextResponse.json({ points: customer.loyaltyPoints, name: customer.name }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch loyalty points:', error);
    return NextResponse.json({ error: 'Failed to fetch points' }, { status: 500 });
  }
}
