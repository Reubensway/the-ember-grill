import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ORDER_STATUS_TRANSITIONS } from '@/lib/constants';
import { broadcastEvent } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();
    const { status } = body;

    if (!status || typeof status !== 'string') {
      return NextResponse.json(
        { error: 'status is required and must be a string' },
        { status: 400 }
      );
    }

    // Look up the existing order
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Validate the status transition
    const allowedTransitions = ORDER_STATUS_TRANSITIONS[existingOrder.status];

    if (!allowedTransitions || !allowedTransitions.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from '${existingOrder.status}' to '${status}'`,
        },
        { status: 400 }
      );
    }

    // Update the order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        delivery: true,
      },
    });

    // Broadcast the update to all connected SSE clients
    broadcastEvent('order-updated', updatedOrder);

    return NextResponse.json({ order: updatedOrder }, { status: 200 });
  } catch (error) {
    console.error('Failed to update order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
