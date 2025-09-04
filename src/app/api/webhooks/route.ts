import { NextRequest, NextResponse } from "next/server";
import { broadcast } from "@/lib/webhook-sse";
import { verifySignature } from "@/lib/svix";

/**
 * Main webhook handler
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const id = req.headers.get("svix-id") ?? "";
    const timestamp = req.headers.get("svix-timestamp") ?? "";
    const signature = req.headers.get("svix-signature") ?? "";

    const body = await req.text();

    let msg: unknown;

    try {
      msg = await verifySignature(id, body, signature, timestamp);
    } catch (err) {
      console.error("SVIX verification failed:", err);
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Verified payload available in `msg`
    // Broadcast the verified payload to any connected SSE clients.
    // Wrap in try/catch to avoid crashing the webhook endpoint on broadcast errors.
    try {
      broadcast(JSON.stringify(msg));
    } catch (err) {
      console.error("Failed to broadcast webhook payload to SSE clients:", err);
    }

    // Get the raw body as text for signature verification
    // const rawBody = await request.text();
    // console.log(rawBody);

    // Get signature from headers (adjust header name based on your webhook provider)
    // const signature =
    //   request.headers.get("x-webhook-signature") ||
    //   request.headers.get("x-hub-signature-256");

    // if (!signature) {
    //   console.error("No signature provided");
    //   return NextResponse.json(
    //     { error: "No signature provided" },
    //     { status: 401 },
    //   );
    // }
    // Signature header received (do not log secrets)
    // console.log("Signature header received");

    // Verify the webhook signature
    // if (!verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET!)) {
    //   console.error("Invalid signature");
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    // Parse the JSON payload with type safety
    // let payload: WebhookPayload;
    // try {
    //   payload = JSON.parse(rawBody) as WebhookPayload;
    // } catch (parseError) {
    //   console.error("Invalid JSON payload:", parseError);
    //   return NextResponse.json(
    //     { error: "Invalid JSON payload" },
    //     { status: 400 },
    //   );
    // }

    // Validate required fields
    // if (!payload.id || !payload.event || !payload.timestamp) {
    //   console.error("Missing required fields in payload");
    //   return NextResponse.json(
    //     { error: "Missing required fields" },
    //     { status: 400 },
    //   );
    // }

    // Log the webhook for debugging (remove in production or be careful with sensitive data)
    // console.log(`Received webhook: ${payload.event} (ID: ${payload.id})`);

    // Process the webhook event
    // await processWebhookEvent(payload);

    // Return success response with the verified payload
    // `msg` comes from svix.verify and should be safe to return after verification.
    return NextResponse.json(
      {
        success: true,
        message: "Webhook processed successfully",
        data: msg,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Webhook processing error:", error);

    // Return error response
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Optional: Handle other HTTP methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
