import { subscribeToEvents } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to SSE' })}\n\n`)
      );

      // Subscribe to global events
      const unsubscribe = subscribeToEvents((event) => {
        try {
          const message = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch {
          // Stream may be closed; clean up handled below
        }
      });

      // Heartbeat to keep connection alive (every 15 seconds)
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`: heartbeat ${new Date().toISOString()}\n\n`)
          );
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      // Store cleanup in closure for cancel to access
      cleanup = () => {
        clearInterval(heartbeatInterval);
        unsubscribe();
      };
    },
    cancel() {
      if (cleanup) {
        cleanup();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
