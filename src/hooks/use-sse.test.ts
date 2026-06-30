// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSSE } from './use-sse';

// Mock EventSource
class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState = 0;
  private listeners: Record<string, ((event: MessageEvent) => void)[]> = {};

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, handler: (event: MessageEvent) => void) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(handler);
  }

  removeEventListener(type: string, handler: (event: MessageEvent) => void) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter((h) => h !== handler);
    }
  }

  close() {
    this.readyState = 2;
  }

  // Test helpers
  simulateOpen() {
    this.readyState = 1;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  simulateConnected() {
    if (this.listeners['connected']) {
      this.listeners['connected'].forEach((handler) => {
        handler(new MessageEvent('connected', { data: JSON.stringify({ message: 'Connected to SSE' }) }));
      });
    }
  }

  simulateEvent(type: string, data: any) {
    const event = new MessageEvent(type, { data: JSON.stringify(data) });
    if (this.listeners[type]) {
      this.listeners[type].forEach((handler) => handler(event));
    }
  }

  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

describe('useSSE', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockEventSource.instances = [];
    (global as any).EventSource = MockEventSource;
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (global as any).EventSource;
  });

  it('should connect to /api/events on mount', () => {
    renderHook(() => useSSE());

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toBe('/api/events');
  });

  it('should return connected: false initially', () => {
    const { result } = renderHook(() => useSSE());

    expect(result.current.connected).toBe(false);
  });

  it('should set connected to true when connection opens', async () => {
    const { result } = renderHook(() => useSSE());

    act(() => {
      MockEventSource.instances[0].simulateOpen();
    });

    expect(result.current.connected).toBe(true);
  });

  it('should set connected to true when connected event is received', async () => {
    const { result } = renderHook(() => useSSE());

    act(() => {
      MockEventSource.instances[0].simulateConnected();
    });

    expect(result.current.connected).toBe(true);
  });

  it('should call onEvent when a named event is received', () => {
    const onEvent = vi.fn();
    renderHook(() => useSSE({ onEvent, eventTypes: ['new-order'] }));

    act(() => {
      MockEventSource.instances[0].simulateOpen();
      MockEventSource.instances[0].simulateEvent('new-order', { orderId: '123' });
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'new-order',
        data: { orderId: '123' },
      })
    );
  });

  it('should not call onEvent for filtered-out event types', () => {
    const onEvent = vi.fn();
    renderHook(() => useSSE({ onEvent, eventTypes: ['new-order'] }));

    act(() => {
      MockEventSource.instances[0].simulateOpen();
      MockEventSource.instances[0].simulateEvent('delivery-updated', { deliveryId: '456' });
    });

    expect(onEvent).not.toHaveBeenCalled();
  });

  it('should listen to all known event types when no filter is specified', () => {
    const onEvent = vi.fn();
    renderHook(() => useSSE({ onEvent }));

    act(() => {
      MockEventSource.instances[0].simulateOpen();
      MockEventSource.instances[0].simulateEvent('new-order', { orderId: '1' });
      MockEventSource.instances[0].simulateEvent('order-updated', { orderId: '2' });
      MockEventSource.instances[0].simulateEvent('delivery-updated', { deliveryId: '3' });
      MockEventSource.instances[0].simulateEvent('new-reservation', { reservationId: '4' });
    });

    expect(onEvent).toHaveBeenCalledTimes(4);
  });

  it('should close EventSource on unmount', () => {
    const { unmount } = renderHook(() => useSSE());
    const es = MockEventSource.instances[0];

    unmount();

    expect(es.readyState).toBe(2); // CLOSED
  });

  it('should reconnect with exponential backoff on error', () => {
    renderHook(() => useSSE());

    expect(MockEventSource.instances).toHaveLength(1);

    // Simulate error
    act(() => {
      MockEventSource.instances[0].simulateError();
    });

    // Should not reconnect immediately
    expect(MockEventSource.instances).toHaveLength(1);

    // Advance past initial delay (500ms)
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(MockEventSource.instances).toHaveLength(2);

    // Simulate another error
    act(() => {
      MockEventSource.instances[1].simulateError();
    });

    // Should wait 1000ms this time (doubled)
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(MockEventSource.instances).toHaveLength(2);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(MockEventSource.instances).toHaveLength(3);
  });

  it('should reset reconnect delay on successful connection', () => {
    renderHook(() => useSSE());

    // Simulate error and reconnect
    act(() => {
      MockEventSource.instances[0].simulateError();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Successful reconnection
    act(() => {
      MockEventSource.instances[1].simulateOpen();
    });

    // Simulate another error
    act(() => {
      MockEventSource.instances[1].simulateError();
    });

    // Should use initial delay again (1000ms), not doubled
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(MockEventSource.instances).toHaveLength(3);
  });

  it('should set connected to false on error', () => {
    const { result } = renderHook(() => useSSE());

    act(() => {
      MockEventSource.instances[0].simulateOpen();
    });
    expect(result.current.connected).toBe(true);

    act(() => {
      MockEventSource.instances[0].simulateError();
    });
    expect(result.current.connected).toBe(false);
  });

  it('should handle SSR gracefully when EventSource is not available', () => {
    delete (global as any).EventSource;

    const { result } = renderHook(() => useSSE());

    expect(result.current.connected).toBe(false);
    expect(MockEventSource.instances).toHaveLength(0);
  });
});
