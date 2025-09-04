import { NextResponse } from "next/server";
import { clientCount, getLastMessageTime } from "@/lib/webhook-sse";

/**
 * GET /api/webhooks/status
 * Returns lightweight diagnostics for the SSE system so you can confirm:
 * - how many SSE clients are currently connected
 * - timestamp of the last broadcast
 */
export function GET() {
  const count = clientCount();
  const last = getLastMessageTime();
  return NextResponse.json({
    ok: true,
    clients: count,
    lastBroadcastAt: last ? new Date(last).toISOString() : null,
  });
}