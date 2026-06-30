import { prisma } from '@/lib/db';
import { broadcastEvent } from '@/lib/events';

/**
 * Delivery status transitions with accelerated timings (in milliseconds) for demo purposes.
 * Each entry defines the next status and the delay before transitioning to it.
 */
const DELIVERY_SIMULATION_STEPS: { status: string; delayMs: number }[] = [
  { status: 'en-route-to-restaurant', delayMs: 10_000 },
  { status: 'collecting', delayMs: 10_000 },
  { status: 'en-route-to-customer', delayMs: 15_000 },
  { status: 'delivered', delayMs: 20_000 },
];

/**
 * Starts a simulated delivery progression through Stuart statuses.
 * This is fire-and-forget — it schedules status transitions on accelerated timers
 * and does not return a promise that resolves when the simulation completes.
 *
 * Expects the delivery to already be in 'rider-assigned' status.
 */
export function startDeliverySimulation({
  deliveryId,
  orderId,
}: {
  deliveryId: string;
  orderId: string;
}): void {
  let cumulativeDelay = 0;

  for (const step of DELIVERY_SIMULATION_STEPS) {
    cumulativeDelay += step.delayMs;

    setTimeout(async () => {
      try {
        const isDelivered = step.status === 'delivered';

        // Update the Delivery record
        const updatedDelivery = await prisma.delivery.update({
          where: { id: deliveryId },
          data: {
            status: step.status,
            ...(isDelivered ? { deliveredAt: new Date() } : {}),
          },
        });

        // Broadcast delivery status change
        broadcastEvent('delivery-updated', updatedDelivery);

        // When delivered, also update the Order status
        if (isDelivered) {
          const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status: 'delivered' },
          });

          broadcastEvent('order-updated', updatedOrder);
        }
      } catch (error) {
        console.error(
          `[mock-stuart] Failed to update delivery ${deliveryId} to status "${step.status}":`,
          error
        );
      }
    }, cumulativeDelay);
  }
}
