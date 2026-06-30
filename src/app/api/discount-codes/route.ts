import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { broadcastEvent } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const codes = await prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ codes }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch discount codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount codes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.code || typeof body.code !== 'string') {
      return NextResponse.json({ error: 'code is required' }, { status: 400 });
    }
    if (!body.type || !['percentage', 'fixed'].includes(body.type)) {
      return NextResponse.json({ error: 'type must be "percentage" or "fixed"' }, { status: 400 });
    }
    if (!body.value || typeof body.value !== 'number' || body.value <= 0) {
      return NextResponse.json({ error: 'value must be a positive number' }, { status: 400 });
    }
    if (!body.usageLimit || typeof body.usageLimit !== 'number' || body.usageLimit < 1) {
      return NextResponse.json({ error: 'usageLimit must be at least 1' }, { status: 400 });
    }

    // Default expiry: 3 months from now
    const expiryDate = body.expiryDate ? new Date(body.expiryDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const code = await prisma.discountCode.create({
      data: {
        code: body.code.toUpperCase(),
        type: body.type,
        value: body.value,
        usageLimit: body.usageLimit,
        usageCount: 0,
        expiryDate,
        active: true,
      },
    });

    // Broadcast new discount code event for mobile notifications
    broadcastEvent('new-discount-code', code);

    return NextResponse.json({ code }, { status: 201 });
  } catch (error) {
    console.error('Failed to create discount code:', error);
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('Unique')) {
      return NextResponse.json({ error: 'A code with that name already exists' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to create discount code' },
      { status: 500 }
    );
  }
}
