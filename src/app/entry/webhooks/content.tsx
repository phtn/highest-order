"use client";

import React, { useState, useEffect } from "react";
import { Wrapper } from "@/components/wrapper";
import { CodeBlock } from "@/components/ai-elements/code-block";

export const Content = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Local state that will be updated from the server via SSE.
  const [clientWebhookData, setClientWebhookData] = useState<
    Record<string, unknown>
  >({});

  // Connect to SSE stream and update clientWebhookData on incoming messages.
  useEffect(() => {
    const es = new EventSource("/api/webhooks/stream");

    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        console.log("PARSED:", parsed);
        // Update local state with the verified payload
        setClientWebhookData(parsed);
      } catch (err) {
        // If it's not JSON, ignore
        console.error("Failed to parse SSE message:", err);
      }
    };

    es.onerror = (err) => {
      // You could add reconnection/backoff logic here.
      console.warn("SSE connection error:", err);
      es.close();
    };

    return () => {
      es.close();
    };
  }, []);

  return (
    <Wrapper>
      <div>
        <div className="flex items-center rounded-t-lg justify-between p-3 bg-gray-50 dark:bg-gray-300/30">
          <div className="flex items-center space-x-4 px-2">
            <h3 className="text-xl tracking-tight font-bold text-gray-900 dark:text-gray-100">
              Webhooks
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            {/* Search input */}
            <input
              type="text"
              placeholder="Search in JSON..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 text-sm h-10 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {/* Theme toggle */}

        <div
          className="overflow-auto p-2 "
          style={{ maxHeight: "calc(100vh - 400px) text-sm" }}
        >
          <CodeBlock
            code={JSON.stringify(clientWebhookData, null, 2)}
            language="json"
          />
          {/*<JsonView
            value={clientWebhookData || {}}
            style={lightTheme}
            // quotesOnKeys={quotesOnKeys}
            // sortKeys={sortKeys}
          />
          <pre>{JSON.stringify(clientWebhookData, null, 2)}</pre>*/}
        </div>
      </div>
    </Wrapper>
  );
};
