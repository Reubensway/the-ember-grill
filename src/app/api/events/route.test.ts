import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';

// Mock the events module
vi.mock('@/lib/events', () => {
  const subscribers: Array<(event: any) => void> = [];
  return {
    subscribeToEvents: vi.fn((callback: (event: any) => void) => {
      subscribers.push(callback);
      return () => {
        const index = subscribers.indexOf(callback);
        if (index > -1) subscribers.splice(index, 1);
      };
    }),
    __getSubscribers: () => subscribers,
  };
});

import { subscribeToEvents, __getSubscribers } from '@/lib/events';

describe('GET /api/events (SSE)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a response with correct SSE headers', async () => {
    const response = await GET();

    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-transform');
    expect(response.headers.get('Connection')).toBe('keep-alive');
  });

  it('sends an initial connected event', async () => {
    const response = await GET();
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    const { value } = await reader.read();
    const text = decoder.decode(value);

    expect(text).toContain('event: connected');
    expect(text).toContain('"message":"Connected to SSE"');

    reader.cancel();
  });

  it('subscribes to the global event emitter', async () => {
    await GET();
    expect(subscribeToEvents).toHaveBeenCalledTimes(1);
    expect(subscribeToEvents).toHaveBeenCalledWith(expect.any(Function));
  });

  it('streams events from the global emitter to the client', async () => {
    const response = await GET();
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    // Read the initial connected event
    await reader.read();

    // Simulate an event broadcast
    const subscribers = (__getSubscribers as any)();
    const callback = subscribers[subscribers.length - 1];
    callback({ type: 'new-order', data: { orderId: 'order-1' }, timestamp: '2024-01-01T00:00:00.000Z' });

    const { value } = await reader.read();
    const text = decoder.decode(value);

    expect(text).toContain('event: new-order');
    expect(text).toContain('"orderId":"order-1"');

    reader.cancel();
  });

  it('formats SSE messages correctly with event type and JSON data', async () => {
    const response = await GET();
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    // Read initial event
    await reader.read();

    // Simulate event
    const subscribers = (__getSubscribers as any)();
    const callback = subscribers[subscribers.length - 1];
    callback({ type: 'order-updated', data: { orderId: '123', status: 'preparing' }, timestamp: '2024-01-01T00:00:00.000Z' });

    const { value } = await reader.read();
    const text = decoder.decode(value);

    // Verify SSE format: "event: {type}\ndata: {json}\n\n"
    expect(text).toBe('event: order-updated\ndata: {"orderId":"123","status":"preparing"}\n\n');

    reader.cancel();
  });
});
