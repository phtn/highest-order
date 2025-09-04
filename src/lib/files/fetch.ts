"use server";
import { request } from "undici";
import { handleAsync } from "@/utils/handle-async";
import path from "path";
import { lookup } from "mime-types";

export const fetchFileMetadata = handleAsync(
  async (
    filename: string,
    baseUrl: string,
  ): Promise<{ size: number; mimeType: string }> => {
    const fileUrl = `${baseUrl}/public/${filename}`;

    const { statusCode, headers } = await request(fileUrl, {
      method: "HEAD", // Only get headers
      throwOnError: false,
    });

    if (statusCode !== 200) {
      throw new Error(`File metadata unavailable: HTTP ${statusCode}`);
    }

    return {
      size: parseInt((headers["content-length"] as string) || "0", 10),
      mimeType: (headers["content-type"] as string) || getMimeType(filename),
    };
  },
  {
    retries: 1,
    functionName: "fetchFileMetadata",
    backoffMs: 100,
    logger: (message, meta) => {
      console.info(`[METADATA] ${message}`, meta);
    },
  },
);

// Bulk file operations
export const fetchMultipleFiles = handleAsync(
  async (
    filenames: string[],
    baseUrl: string,
  ): Promise<
    Array<{
      filename: string;
      success: boolean;
      data?: { buffer: Buffer; contentType: string };
      error?: string;
    }>
  > => {
    const results = await Promise.allSettled(
      filenames.map(async (filename) => {
        const result = await fetchPublicFile(filename, baseUrl);
        if (result.error) {
          throw new Error(
            `Failed to fetch ${filename}: ${JSON.stringify(result.error)}`,
          );
        }
        return {
          filename,
          success: true,
          data: {
            buffer: result.data!.buffer,
            contentType: result.data!.contentType,
          },
        };
      }),
    );

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      }
      return {
        filename: filenames[index],
        success: false,
        error: result.reason.message,
      };
    });
  },
  {
    retries: 0, // Don't retry bulk operations
    functionName: "fetchMultipleFiles",
    onError: (error, { args }) => {
      console.error("Bulk file operation failed:", {
        filenames: args[0],
        error: error instanceof Error ? error.message : error,
      });
    },
  },
);

export async function getContentType(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".json":
      return "application/json";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".html":
      return "text/html; charset=utf-8";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".svg":
      return "image/svg+xml";
    case ".pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}
class FileNotFoundError extends Error {
  constructor(filename: string) {
    super(`File not found: ${filename}`);
    this.name = "FileNotFoundError";
  }
}
class InvalidFilenameError extends Error {
  constructor(filename: string) {
    super(`Invalid filename: ${filename}`);
    this.name = "InvalidFilenameError";
  }
}

class FetchError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "FetchError";
  }
}

/**
 * Validates filename to prevent path traversal attacks
 */
function validateFilename(filename: string): boolean {
  // Check for path traversal attempts
  if (
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    return false;
  }

  // Check for hidden files
  if (filename.startsWith(".")) {
    return false;
  }

  // Basic filename validation
  const validFilenameRegex = /^[a-zA-Z0-9._-]+$/;
  return validFilenameRegex.test(filename);
}

/**
 * Get MIME type for file extension
 */
function getMimeType(filename: string): string {
  const mimeType = lookup(filename);
  return mimeType || "application/octet-stream";
}

export const fetchPublicFile = handleAsync(
  async (
    filename: string,
    baseUrl: string,
  ): Promise<{
    buffer: Buffer;
    contentType: string;
    contentLength: number;
  }> => {
    if (!validateFilename(filename)) {
      throw new InvalidFilenameError(filename);
    }

    const fileUrl = `${baseUrl}/public/${filename}`;

    const { statusCode, headers, body } = await request(fileUrl, {
      method: "GET",
      throwOnError: false, // We'll handle errors manually
    });

    if (statusCode === 404) {
      throw new FileNotFoundError(filename);
    }

    if (statusCode !== 200) {
      throw new FetchError(
        `Failed to fetch file: HTTP ${statusCode}`,
        statusCode,
      );
    }

    // Read the response body
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const contentType =
      (headers["content-type"] as string) || getMimeType(filename);
    const contentLength =
      parseInt((headers["content-length"] as string) || "0", 10) ||
      buffer.length;

    return {
      buffer,
      contentType,
      contentLength,
    };
  },
  {
    retries: 2,
    functionName: "fetchPublicFile",
    backoffMs: 200,
    rethrowInDev: true,
    onError: (error, { args }) => {
      console.error(`Failed to fetch file ${args[0]} from ${args[1]}:`, {
        error: error instanceof Error ? error.message : error,
        filename: args[0],
        baseUrl: args[1],
        timestamp: new Date().toISOString(),
      });
    },
    logger: (message, meta) => {
      console.warn(`[FILE_FETCH] ${message}`, {
        ...meta,
        timestamp: new Date().toISOString(),
        service: "file-api",
      });
    },
  },
);
