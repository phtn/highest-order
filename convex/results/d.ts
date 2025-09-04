import { v, Infer } from "convex/values";

export const GameResultDataSchema = v.object({
  roundId: v.optional(v.number()),
  profit: v.optional(v.string()),
  win: v.optional(v.boolean()),
  active: v.optional(v.boolean()),
  custom: v.optional(v.string()),
});

export type GameResultData = Infer<typeof GameResultDataSchema>;

export const GameResultSchema = v.object({
  timestamp: v.number(),
  result: v.union(v.literal("win"), v.literal("win")),
  roundId: v.optional(v.number()),
  amount: v.optional(v.number()),
  gameType: v.optional(v.string()),
  multiplier: v.optional(v.number()),
  winningChance: v.optional(v.number()),
  active: v.optional(v.boolean()),
  url: v.optional(v.string()),
  gameData: GameResultDataSchema,
});

export type GameResult = Infer<typeof GameResultSchema>;
