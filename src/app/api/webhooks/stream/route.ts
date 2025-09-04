import { NextRequest, NextResponse } from "next/server";
import { addClient } from "@/lib/webhook-sse";

/**
 * GET /api/webhooks/stream
 * Establish an SSE connection and keep it open. Each connection gets a ReadableStream
 * whose controller is registered with addClient so the server can broadcast messages.
 */
export function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      // Add client and keep the stream open
      const { close } = addClient(controller);

      // Ensure client is removed when stream is cancelled/closed.
      req.signal.addEventListener("abort", () => {
        try {
          close();
        } catch {
          // no-op
        }
      });
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
