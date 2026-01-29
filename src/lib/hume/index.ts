// index.ts
import { createHume } from "@ai-sdk/hume";
import dotenv from "dotenv";
import { HumeClient } from "hume";

dotenv.config();

export const hume = new HumeClient({
  apiKey: process.env.HUME_API_KEY!,
});

export const humeSDK = createHume({
  apiKey: process.env.HUME_API_KEY!,
});
