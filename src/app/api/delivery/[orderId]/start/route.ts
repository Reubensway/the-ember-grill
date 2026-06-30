import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { startDeliverySimulation } from '@/lib/mock-stuart';
import { broadcastEvent } from '@/lib/events';

export const dynamic = 'force-dynamic';

const MOCK_RIDER_NAMES = [
  'Mike Johnson',
  'Sarah Williams',
  'David Chen',
  'Emma Thompson',
  "James O'Brien",
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // Look up the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Validate order is a delivery type
    if (order.orderType !== 'delivery') {
      return NextResponse.json(
        { error: 'Order is not a delivery order' },
        { status: 400 }
      );
    }

    // Validate order status is 'ready'
    if (order.status !== 'ready') {
      return NextResponse.json(
        { error: 'Order must have status "ready" to start delivery' },
        { status: 400 }
      );
    }

    // Assign a random rider
    const riderName =
      MOCK_RIDER_NAMES[Math.floor(Math.random() * MOCK_RIDER_NAMES.length)];

    // Create or update the delivery record
    const delivery = await prisma.delivery.upsert({
      where: { orderId },
      create: {
        orderId,
        status: 'rider-assigned',
        riderName,
        assignedAt: new Date(),
      },
      update: {
        status: 'rider-assigned',
        riderName,
        assignedAt: new Date(),
      },
    });

    // Update the order status to 'out-for-delivery'
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'out-for-delivery' },
      include: { items: { include: { menuItem: true } }, delivery: true },
    });

    // Broadcast events for real-time updates
    broadcastEvent('delivery-updated', delivery);
    broadcastEvent('order-updated', updatedOrder);

    // Start the mock Stuart delivery simulation (auto-progresses through statuses)
    startDeliverySimulation({ deliveryId: delivery.id, orderId });

    return NextResponse.json({ delivery }, { status: 201 });
  } catch (error) {
    console.error('Failed to start delivery:', error);
    return NextResponse.json(
      { error: 'Failed to start delivery' },
      { status: 500 }
    );
  }
}
