import { defineSchema, defineTable } from "convex/server";
import { GameResultSchema } from "./results/d";

export default defineSchema({
  /// == RESULTS ==
  results: defineTable(GameResultSchema).index("by_roundId", ["roundId"]),
});
