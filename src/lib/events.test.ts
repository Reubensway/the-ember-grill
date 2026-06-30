import { describe, it, expect, vi } from 'vitest';
import { broadcastEvent, subscribeToEvents } from './events';

describe('events pub/sub system', () => {
  it('delivers events to subscribers', () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToEvents(callback);

    broadcastEvent('new-order', { orderId: '123' });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'new-order',
        data: { orderId: '123' },
        timestamp: expect.any(String),
      })
    );

    unsubscribe();
  });

  it('delivers events to multiple subscribers', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const unsub1 = subscribeToEvents(callback1);
    const unsub2 = subscribeToEvents(callback2);

    broadcastEvent('order-updated', { orderId: '456', status: 'preparing' });

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);

    unsub1();
    unsub2();
  });

  it('stops delivering events after unsubscribe', () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToEvents(callback);

    broadcastEvent('new-order', { orderId: '1' });
    expect(callback).toHaveBeenCalledTimes(1);

    unsubscribe();

    broadcastEvent('new-order', { orderId: '2' });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('includes a valid ISO timestamp in events', () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToEvents(callback);

    broadcastEvent('delivery-updated', { deliveryId: '789' });

    const event = callback.mock.calls[0][0];
    expect(() => new Date(event.timestamp)).not.toThrow();
    expect(new Date(event.timestamp).toISOString()).toBe(event.timestamp);

    unsubscribe();
  });

  it('removes subscribers that throw errors', () => {
    const brokenCallback = vi.fn(() => {
      throw new Error('broken');
    });
    const healthyCallback = vi.fn();

    const unsub1 = subscribeToEvents(brokenCallback);
    const unsub2 = subscribeToEvents(healthyCallback);

    broadcastEvent('new-reservation', { reservationId: '1' });

    // Broken callback was called but then removed
    expect(brokenCallback).toHaveBeenCalledTimes(1);
    expect(healthyCallback).toHaveBeenCalledTimes(1);

    // On next broadcast, broken callback should not be called again
    broadcastEvent('new-reservation', { reservationId: '2' });
    expect(brokenCallback).toHaveBeenCalledTimes(1);
    expect(healthyCallback).toHaveBeenCalledTimes(2);

    unsub1();
    unsub2();
  });
});
