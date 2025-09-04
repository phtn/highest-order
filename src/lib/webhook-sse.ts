const encoder = new TextEncoder();

type SendFn = (data: string) => void;

const clients = new Map<number, SendFn>();
let nextClientId = 1;
let lastMessageTime: number | null = null;

/**
 * Register a new SSE client by providing the ReadableStreamDefaultController.
 * Returns an object with client id and a close() function to remove the client.
 *
 * Improvements:
 * - Sends an initial comment line so some proxies won't close the connection immediately.
 * - Starts a keep-alive interval (20s) sending comment pings to prevent timeouts.
 */
export function addClient(controller: ReadableStreamDefaultController) {
  const id = nextClientId++;
  const send: SendFn = (data: string) => {
    try {
      // SSE format: "data: <json>\n\n"
      controller.enqueue(encoder.encode(`data: ${data}\n\n`));
    } catch (err) {
      console.log(err ? 1 : 0);
      // enqueue can throw if the stream is closed — ignore per-client failures
    }
  };

  clients.set(id, send);
  // Log connection for diagnostics
  try {
    console.log(`[SSE] client connected: ${id} (clients=${clients.size})`);
  } catch {}

  // Initial comment to establish the stream and help intermediaries keep it open
  try {
    controller.enqueue(encoder.encode(": connected\n\n"));
  } catch {
    // ignore
  }

  // Keep-alive ping every 20 seconds (send as SSE comment)
  const keepAlive = setInterval(() => {
    try {
      controller.enqueue(encoder.encode(": ping\n\n"));
    } catch {
      // ignore enqueue errors
    }
  }, 20_000);

  const close = () => {
    clients.delete(id);
    clearInterval(keepAlive);
    try {
      controller.close();
    } catch {
      // no-op
    }
    try {
      console.log(`[SSE] client disconnected: ${id} (clients=${clients.size})`);
    } catch {}
  };

  return { id, close, send };
}

/**
 * Broadcast a message to all connected SSE clients.
 * `data` should already be a string (typically JSON.stringify(payload)).
 */
export function broadcast(data: string) {
  lastMessageTime = Date.now();
  try {
    console.log(
      `[SSE] broadcasting to ${clients.size} client(s) at ${new Date(
        lastMessageTime,
      ).toISOString()}`,
    );
  } catch {}
  for (const send of Array.from(clients.values())) {
    try {
      send(data);
    } catch {
      // ignore per-client failures
    }
  }
}

/**
 * Utility to get current client count (useful for monitoring / debugging).
 */
export function clientCount() {
  return clients.size;
}

/**
 * Return the timestamp (ms) of the last broadcast, or null if none.
 */
export function getLastMessageTime(): number | null {
  return lastMessageTime;
}
