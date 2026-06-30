'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { SSEEvent } from '@/types';

interface UseSSEOptions {
  /** Callback invoked when an event is received */
  onEvent?: (event: SSEEvent) => void;
  /** Filter to only listen for specific event types */
  eventTypes?: string[];
}

interface UseSSEReturn {
  connected: boolean;
}

const MAX_RECONNECT_DELAY = 10000;
const INITIAL_RECONNECT_DELAY = 500;
const HEARTBEAT_TIMEOUT = 45000; // If no message in 45s, reconnect

/**
 * Hook for subscribing to real-time Server-Sent Events from /api/events.
 * Handles automatic reconnection with exponential backoff, heartbeat monitoring,
 * and visibility-based reconnection.
 */
export function useSSE(options: UseSSEOptions = {}): UseSSEReturn {
  const { onEvent, eventTypes } = options;
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const onEventRef = useRef(onEvent);
  const eventTypesRef = useRef(eventTypes);

  // Keep refs in sync with latest props to avoid stale closures
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    eventTypesRef.current = eventTypes;
  }, [eventTypes]);

  const resetHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }
    heartbeatTimeoutRef.current = setTimeout(() => {
      // No message received in 45s — connection is likely dead, reconnect
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setConnected(false);
      connect();
    }, HEARTBEAT_TIMEOUT);
  }, []);

  const connect = useCallback(() => {
    // Guard against SSR
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return;
    }

    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource('/api/events');
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
      resetHeartbeat();
    };

    // Handle all incoming messages (including heartbeats) to reset the heartbeat timer
    const handleMessage = () => {
      resetHeartbeat();
    };

    es.onmessage = (messageEvent) => {
      handleMessage();
      if (!onEventRef.current) return;

      try {
        const data = JSON.parse(messageEvent.data);
        const sseEvent: SSEEvent = {
          type: 'message',
          data,
          timestamp: new Date().toISOString(),
        };

        if (eventTypesRef.current && eventTypesRef.current.length > 0) {
          if (!eventTypesRef.current.includes(sseEvent.type)) return;
        }

        onEventRef.current(sseEvent);
      } catch {
        // Ignore malformed messages
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      eventSourceRef.current = null;

      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
      }

      // Reconnect with exponential backoff
      const delay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    // Listen for named event types
    const typesToListen = (eventTypesRef.current && eventTypesRef.current.length > 0)
      ? eventTypesRef.current
      : ['new-order', 'order-updated', 'delivery-updated', 'new-reservation'];

    typesToListen.forEach((eventType) => {
      es.addEventListener(eventType, (messageEvent) => {
        handleMessage(); // Reset heartbeat on any named event too
        if (!onEventRef.current) return;

        try {
          const data = JSON.parse(messageEvent.data);
          const sseEvent: SSEEvent = {
            type: eventType,
            data,
            timestamp: new Date().toISOString(),
          };
          onEventRef.current(sseEvent);
        } catch {
          // Ignore malformed messages
        }
      });
    });

    // Also listen for the 'connected' event
    es.addEventListener('connected', () => {
      handleMessage();
      setConnected(true);
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
    });
  }, [resetHeartbeat]);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
        heartbeatTimeoutRef.current = null;
      }
    };
  }, [connect]);

  // Reconnect when tab becomes visible (connection may have died while hidden)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        // Force reconnect if not connected
        if (!eventSourceRef.current || eventSourceRef.current.readyState === EventSource.CLOSED) {
          connect();
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [connect]);

  return { connected };
}
