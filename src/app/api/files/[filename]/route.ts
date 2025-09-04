import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { getContentType } from "@/lib/files/fetch";

/**
 * Dynamic file route:
 * - If the incoming dynamic param is a full URL (https?://...) we fetch it and stream the response back to the client.
 * - Otherwise we treat it as a local filename and return the file using Bun.file() when available (fast path).
 *
 * Security notes:
 * - We reject filenames containing `..` to avoid path traversal.
 * - Local files are served from the `public/files` directory under the project root. Change the base directory as needed.
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
): Promise<NextResponse> {
  const { filename } = await params;

  // If it's a full URL, fetch and stream it back
  if (/^https?:\/\//i.test(filename)) {
    try {
      const upstream = await fetch(filename);
      const headers = new Headers();
      // copy a few safe headers (avoid Set-Cookie or other sensitive headers)
      upstream.headers.forEach((v, k) => {
        // allow content-type and cache-control and similar
        if (
          k === "content-type" ||
          k === "cache-control" ||
          k === "content-length" ||
          k === "last-modified"
        ) {
          headers.set(k, v);
        }
      });

      return new NextResponse(upstream.body, {
        status: upstream.status,
        headers,
      });
    } catch (err) {
      console.error("Error fetching remote URL:", err);
      return NextResponse.json(
        { error: "Failed to fetch remote URL" },
        { status: 502 },
      );
    }
  }

  // Sanitize filename - reject traversal attempts
  if (filename.includes("..") || filename.includes("\0")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  // Resolve local file path inside project/public/files
  const baseDir = path.join(process.cwd(), "public", "files");
  const localPath = path.join(baseDir, filename);

  try {
    // If Bun is available and Bun.file is present, use it to stream the file (fast)
    // Wrap in try/catch to remain compatible with Node runtimes
    const maybeBun = (globalThis as unknown as { Bun?: unknown }).Bun;
    if (typeof maybeBun !== "undefined" && maybeBun !== null) {
      const bun = maybeBun as { file?: (p: string) => unknown };
      if (typeof bun.file === "function") {
        try {
          const file = bun.file(localPath) as
            | {
              stream?: () => ReadableStream;
              arrayBuffer?: () => Promise<ArrayBuffer>;
            }
            | undefined;
          // Some runtimes allow streaming directly from the File object
          if (file && typeof file.stream === "function") {
            const stream = file.stream();
            return new NextResponse(stream, {
              headers: {
                "Content-Type": await getContentType(filename),
              },
            });
          }
          // Fallback: read ArrayBuffer then return as Uint8Array (avoid Node-only Buffer)
          if (file && typeof file.arrayBuffer === "function") {
            const ab = await file.arrayBuffer();
            const uint = new Uint8Array(ab);
            return new NextResponse(uint, {
              headers: {
                "Content-Type": await getContentType(filename),
              },
            });
          }
        } catch (bunErr) {
          // If Bun.file fails (missing file), fall through to fs fallback
          console.warn("Bun.file failed, falling back to fs:", bunErr);
        }
      }
    }

    // Node fallback - read and return
    const data = await fs.readFile(localPath);
    // Ensure we pass a Uint8Array / ArrayBuffer-compatible body to NextResponse
    const uint = new Uint8Array(data);
    return new NextResponse(uint, {
      headers: { "Content-Type": await getContentType(filename) },
    });
  } catch (err) {
    console.error("Local file read error:", err);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
