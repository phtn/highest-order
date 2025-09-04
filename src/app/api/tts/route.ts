import { lmnt } from "@/lib/lmnt/index";
import { NextRequest, NextResponse } from "next/server";

type LmntResponse =
  | { blob: () => Promise<Blob> }
  | ArrayBuffer
  | Uint8Array
  | Buffer
  | { audio: ArrayBuffer | Uint8Array | Buffer };

export async function POST(request: NextRequest) {
  try {
    const { content, voice = process.env.NEXT_PUBLIC_ELLIE_ID } =
      await request.json();

    console.log("[LMNT TTS] Request:", {
      content: content?.substring(0, 100),
      voice,
    });

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    if (!process.env.LMNT_API_KEY) {
      console.error("[LMNT TTS] API key not found");
      return NextResponse.json(
        { error: "LMNT API key not configured" },
        { status: 500 },
      );
    }

    console.log("[LMNT TTS] Calling LMNT API...");

    // Voice resolution with robust fallbacks
    const DEFAULT_VOICE_ID = "6d6d7cb3-6ee9-4510-9bb8-22ae005c1e35";
    const looksLikeUuid = (s: string): boolean =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        s,
      );

    const resolveVoiceId = (v?: string): string => {
      const input = (v ?? "").trim();
      const envEllie = process.env.NEXT_PUBLIC_ELLIE_ID ?? "";
      const envSakura = process.env.NEXT_PUBLIC_SAKURA_ID ?? "";
      const envMoody = process.env.NEXT_PUBLIC_MOODY_ID ?? "";
      const envKendall = process.env.NEXT_PUBLIC_KENDALL_ID ?? "";

      if (!input) {
        // Prefer explicit envs, then default known-working id
        return (
          envMoody || envEllie || envSakura || envKendall || DEFAULT_VOICE_ID
        );
      }

      const lower = input.toLowerCase();
      if (lower === "ellie") return envEllie || DEFAULT_VOICE_ID;
      if (lower === "sakura") return envSakura || DEFAULT_VOICE_ID;
      if (lower === "moody") return envMoody || DEFAULT_VOICE_ID;
      if (lower === "kendall") return envKendall || DEFAULT_VOICE_ID;

      // Direct id
      if (looksLikeUuid(input)) return input;

      // Unknown alias string -> pick best available or default
      return (
        envMoody || envEllie || envSakura || envKendall || DEFAULT_VOICE_ID
      );
    };

    const chosenVoice = resolveVoiceId(voice);

    if (!chosenVoice) {
      console.error("[LMNT TTS] No voice configured or provided");
      return NextResponse.json(
        { error: "LMNT voice not configured" },
        { status: 500 },
      );
    }

    console.log("[LMNT TTS] Using voice:", chosenVoice);

    const response = await lmnt.speech.generate({
      text: content,
      voice: chosenVoice,
    });

    console.log("[LMNT TTS] Response received:", {
      type: typeof response,
      keys: Object.keys(response || {}),
      hasBlob: typeof response?.blob === "function",
    });

    // LMNT returns a Response object with audio data
    let audioBuffer: ArrayBuffer;
    let contentType = "audio/wav"; // Default fallback

    if (typeof (response as { blob?: unknown }).blob === "function") {
      // Standard case: Response object with blob method
      const audioBlob = await (response as { blob: () => Promise<Blob> }).blob();
      console.log("[LMNT TTS] Blob created:", {
        size: audioBlob.size,
        type: audioBlob.type,
      });
      contentType = audioBlob.type || contentType;
      audioBuffer = await audioBlob.arrayBuffer();
    } else if (response instanceof ArrayBuffer) {
      // If response is directly the audio buffer
      audioBuffer = response;
    } else if (response instanceof Uint8Array || response instanceof Buffer) {
      // If response is a buffer-like object
      audioBuffer = response.buffer.slice(response.byteOffset, response.byteOffset + response.byteLength);
    } else if ("audio" in response && response.audio) {
      // Fallback: if response has audio property (like in streaming)
      const audioData = response.audio;
      if (audioData instanceof ArrayBuffer) {
        audioBuffer = audioData;
      } else if (audioData instanceof Uint8Array || audioData instanceof Buffer) {
        audioBuffer = audioData.buffer.slice(audioData.byteOffset, audioData.byteOffset + audioData.byteLength);
      } else {
        throw new Error("Unexpected audio data type");
      }
    } else {
      throw new Error("Unexpected response format from LMNT API");
    }
    console.log("[LMNT TTS] Buffer created:", {
      byteLength: audioBuffer.byteLength,
    });

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("[LMNT TTS] Detailed error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error,
    });

    return NextResponse.json(
      {
        error: "Failed to generate speech",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
