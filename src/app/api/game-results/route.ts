import { type GameResultData } from "convex/results/d";
import { NextResponse } from "next/server";

export interface IncomingGameResult {
  timestamp: number;
  result: "win" | "loss";
  roundId?: number;
  amount?: number;
  gameType?: string;
  multiplier?: number;
  winningChance?: number;
  active?: boolean;
  url: string;
  gameData?: GameResultData;

  // added by the extension
  meta: {
    ext: string; // e.g. "watchful-wind"
    ts: number; // unix ms
  };
  storedAt: string; // ISO timestamp string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as IncomingGameResult;

    // Basic runtime validation (adjust as needed)
    if (
      !body ||
      typeof body.url !== "string" ||
      typeof body.timestamp !== "number"
    ) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    // Persist to DB / write file / enqueue - example returns id
    // const id = await saveResultToYourStore(body); // implement

    return NextResponse.json({ ok: true, id: "" }, { status: 200 });
  } catch (err) {
    console.error("API /game-results POST error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 },
    );
  }
}
