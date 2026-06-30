import { SSEEvent } from '@/types';

export type EventType = 'new-order' | 'order-updated' | 'delivery-updated' | 'new-reservation';

type EventCallback = (event: SSEEvent) => void;

const subscribers = new Set<EventCallback>();

/**
 * Subscribe to all SSE events. Returns an unsubscribe function.
 */
export function subscribeToEvents(callback: EventCallback): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Broadcast an event to all connected SSE clients.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function broadcastEvent(type: string, data: any): void {
  const event: SSEEvent = {
    type,
    data,
    timestamp: new Date().toISOString(),
  };

  subscribers.forEach((callback) => {
    try {
      callback(event);
    } catch {
      // Remove broken subscribers silently
      subscribers.delete(callback);
    }
  });
}
