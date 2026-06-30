import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rewards = await prisma.loyaltyReward.findMany({
      where: { active: true },
      orderBy: { pointsRequired: 'asc' },
    });

    return NextResponse.json({ rewards }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch loyalty rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty rewards' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (!body.pointsRequired || typeof body.pointsRequired !== 'number' || body.pointsRequired < 1) {
      return NextResponse.json({ error: 'pointsRequired must be a positive number' }, { status: 400 });
    }
    if (body.discountValue === undefined || typeof body.discountValue !== 'number' || body.discountValue < 0) {
      return NextResponse.json({ error: 'discountValue must be a non-negative number' }, { status: 400 });
    }

    const reward = await prisma.loyaltyReward.create({
      data: {
        name: body.name,
        description: body.description || '',
        pointsRequired: body.pointsRequired,
        discountValue: body.discountValue,
        active: true,
      },
    });

    return NextResponse.json({ reward }, { status: 201 });
  } catch (error) {
    console.error('Failed to create loyalty reward:', error);
    return NextResponse.json(
      { error: 'Failed to create loyalty reward' },
      { status: 500 }
    );
  }
}
