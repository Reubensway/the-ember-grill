import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.customerEmail || typeof body.customerEmail !== 'string') {
      return NextResponse.json({ error: 'customerEmail is required' }, { status: 400 });
    }
    if (!body.rewardId || typeof body.rewardId !== 'string') {
      return NextResponse.json({ error: 'rewardId is required' }, { status: 400 });
    }

    // Find the customer
    const customer = await prisma.customer.findUnique({
      where: { email: body.customerEmail },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Find the reward
    const reward = await prisma.loyaltyReward.findUnique({
      where: { id: body.rewardId },
    });

    if (!reward || !reward.active) {
      return NextResponse.json({ error: 'Reward not found or inactive' }, { status: 404 });
    }

    // Check if customer has enough points
    if (customer.loyaltyPoints < reward.pointsRequired) {
      return NextResponse.json(
        {
          error: `Not enough points. You have ${customer.loyaltyPoints} but need ${reward.pointsRequired}.`,
          currentPoints: customer.loyaltyPoints,
          pointsRequired: reward.pointsRequired,
        },
        { status: 400 }
      );
    }

    // Deduct points from customer
    const updatedCustomer = await prisma.customer.update({
      where: { email: body.customerEmail },
      data: {
        loyaltyPoints: { decrement: reward.pointsRequired },
      },
    });

    return NextResponse.json({
      success: true,
      discountValue: reward.discountValue,
      rewardName: reward.name,
      remainingPoints: updatedCustomer.loyaltyPoints,
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to redeem loyalty reward:', error);
    return NextResponse.json(
      { error: 'Failed to redeem reward' },
      { status: 500 }
    );
  }
}
