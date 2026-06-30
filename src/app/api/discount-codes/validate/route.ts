import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface ValidateDiscountBody {
  code: string;
  orderTotal: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidateDiscountBody = await request.json();

    // Validate required fields
    if (!body.code || typeof body.code !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'code is required' },
        { status: 400 }
      );
    }

    if (body.orderTotal === undefined || typeof body.orderTotal !== 'number' || body.orderTotal < 0) {
      return NextResponse.json(
        { valid: false, error: 'orderTotal must be a non-negative number' },
        { status: 400 }
      );
    }

    // Look up the discount code
    const discountCode = await prisma.discountCode.findUnique({
      where: { code: body.code },
    });

    if (!discountCode) {
      return NextResponse.json(
        { valid: false, error: 'Discount code not found' },
        { status: 400 }
      );
    }

    // Check if the code is active
    if (!discountCode.active) {
      return NextResponse.json(
        { valid: false, error: 'Discount code is inactive' },
        { status: 400 }
      );
    }

    // Check if the code has expired
    if (new Date() > new Date(discountCode.expiryDate)) {
      return NextResponse.json(
        { valid: false, error: 'Discount code has expired' },
        { status: 400 }
      );
    }

    // Check if the usage limit has been reached
    if (discountCode.usageCount >= discountCode.usageLimit) {
      return NextResponse.json(
        { valid: false, error: 'Discount code usage limit reached' },
        { status: 400 }
      );
    }

    // Calculate the discount amount
    let discountAmount: number;
    if (discountCode.type === 'percentage') {
      discountAmount = body.orderTotal * discountCode.value / 100;
    } else {
      // fixed type: can't discount more than the total
      discountAmount = Math.min(discountCode.value, body.orderTotal);
    }

    return NextResponse.json(
      {
        valid: true,
        discountAmount,
        type: discountCode.type,
        value: discountCode.value,
        code: discountCode.code,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to validate discount code:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate discount code' },
      { status: 500 }
    );
  }
}
