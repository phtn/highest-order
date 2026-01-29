/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as assistants_d from "../assistants/d.js";
import type * as assistants_m from "../assistants/m.js";
import type * as assistants_q from "../assistants/q.js";
import type * as assistants_seed from "../assistants/seed.js";
import type * as llm_d from "../llm/d.js";
import type * as llm_m from "../llm/m.js";
import type * as llm_q from "../llm/q.js";
import type * as llmAudio_d from "../llmAudio/d.js";
import type * as llmAudio_m from "../llmAudio/m.js";
import type * as llmAudio_q from "../llmAudio/q.js";
import type * as messages_d from "../messages/d.js";
import type * as messages_m from "../messages/m.js";
import type * as messages_q from "../messages/q.js";
import type * as results_d from "../results/d.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "assistants/d": typeof assistants_d;
  "assistants/m": typeof assistants_m;
  "assistants/q": typeof assistants_q;
  "assistants/seed": typeof assistants_seed;
  "llm/d": typeof llm_d;
  "llm/m": typeof llm_m;
  "llm/q": typeof llm_q;
  "llmAudio/d": typeof llmAudio_d;
  "llmAudio/m": typeof llmAudio_m;
  "llmAudio/q": typeof llmAudio_q;
  "messages/d": typeof messages_d;
  "messages/m": typeof messages_m;
  "messages/q": typeof messages_q;
  "results/d": typeof results_d;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
