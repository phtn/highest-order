import { Effect, pipe, Schedule, Console, Duration } from "effect";

// Custom error types for better error handling
class FunctionExecutionError {
  readonly _tag = "FunctionExecutionError";
  constructor(
    readonly cause: unknown,
    readonly functionName: string,
    readonly attempt: number,
    readonly args: unknown[],
  ) {}
}

class CustomHandlerError {
  readonly _tag = "CustomHandlerError";
  constructor(
    readonly cause: unknown,
    readonly originalError: unknown,
  ) {}
}

class LoggerError {
  readonly _tag = "LoggerError";
  constructor(readonly cause: unknown) {}
}

// Types
type EffectFn<TArgs extends unknown[], TResult, TError = never> = (
  ...args: TArgs
) => Effect.Effect<TResult, TError>;

interface EffectHandlerOptions<TArgs extends unknown[]> {
  /** Number of retry attempts (default: 0) */
  retries?: number;
  /** Custom error handler */
  onError?: (
    error: FunctionExecutionError,
    context: { args: TArgs },
  ) => Effect.Effect<void>;
  /** Whether to include original errors in failure (default: false) */
  preserveOriginalError?: boolean;
  /** Custom logger effect */
  logger?: (
    message: string,
    meta?: Record<string, unknown>,
  ) => Effect.Effect<void>;
  /** Explicit function name override for logging */
  functionName?: string;
  /** Backoff schedule for retries */
  schedule?: Schedule.Schedule<unknown, unknown>;
}

/**
 * Enhanced function name extraction for Effect functions
 */
function getFunctionName(fn: () => void): string {
  if (fn.name) return fn.name;

  const fnString = fn.toString();
  const assignmentMatch = fnString.match(/(?:const|let|var)\s+(\w+)\s*=/);
  if (assignmentMatch) return assignmentMatch[1];

  const methodMatch = fnString.match(/(\w+):\s*(?:async\s+)?\(/);
  if (methodMatch) return methodMatch[1];

  return "anonymous";
}

/**
 * Format errors into a consistent structure for logging
 */
function formatError(error: unknown): Record<string, unknown> {
  if (typeof error === "string") return { message: error };
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  if (error && typeof error === "object" && "_tag" in error) {
    return { tag: error._tag, ...error };
  }
  return { message: "Unknown error", raw: error };
}

/**
 * Create a default exponential backoff schedule
 */
const createBackoffSchedule = (
  baseDelayMs: number = 100,
  maxRetries: number = 3,
) =>
  pipe(
    Schedule.exponential(Duration.millis(baseDelayMs)),
    Schedule.intersect(Schedule.recurs(maxRetries)),
  );

/**
 * An Effect-based async function wrapper with built-in error handling, retry logic, and structured responses.
 *
 * This utility wraps your Effect-returning function with comprehensive error handling,
 * retry logic, logging, and structured error reporting using Effect's powerful composition.
 *
 * @template TArgs - The argument tuple type of the original function.
 * @template TResult - The success type of the original Effect.
 * @template TError - The error type of the original Effect.
 *
 * @param fn - The function to wrap that returns an Effect.
 * @param options - Optional configuration:
 * - `retries`: number of retry attempts (default: 0)
 * - `onError`: custom Effect for handling errors
 * - `preserveOriginalError`: include original error details in failure
 * - `logger`: custom logger Effect
 * - `functionName`: explicit function name for logging
 * - `schedule`: custom retry schedule (overrides retries)
 *
 * @returns An Effect that either succeeds with TResult or fails with structured error information.
 *
 * @example
 * ```ts
 * import { Effect, pipe } from "effect";
 *
 * const fetchUser = (id: number) =>
 *   Effect.tryPromise({
 *     try: () => fetch(`/api/user/${id}`).then(res => {
 *       if (!res.ok) throw new Error("Failed to fetch user");
 *       return res.json();
 *     }),
 *     catch: (cause) => new FetchError(cause)
 *   });
 *
 * const handledFetchUser = handleEffect(fetchUser, {
 *   retries: 2,
 *   functionName: 'fetchUser',
 *   onError: (error) => Console.error(`Custom handling: ${error.cause}`)
 * });
 *
 * // Usage
 * const program = pipe(
 *   handledFetchUser(1),
 *   Effect.match({
 *     onFailure: (error) => `Failed: ${error.cause}`,
 *     onSuccess: (user) => `Success: ${user.name}`
 *   })
 * );
 * ```
 */
export function handleEffect<TArgs extends unknown[], TResult, TError = never>(
  fn: EffectFn<TArgs, TResult, TError>,
  options: EffectHandlerOptions<TArgs> = {},
): (...args: TArgs) => Effect.Effect<TResult, FunctionExecutionError> {
  const {
    retries = 0,
    onError,
    preserveOriginalError = false,
    logger,
    functionName,
    schedule,
  } = options;

  const resolvedFunctionName =
    functionName ?? getFunctionName(fn) ?? "anonymous";

  // Create default logger if none provided
  const defaultLogger = (message: string, meta?: Record<string, unknown>) =>
    Console.error(message, meta);

  const effectiveLogger = logger || defaultLogger;

  // Create retry schedule
  const retrySchedule = schedule || createBackoffSchedule(100, retries);

  return (...args: TArgs): Effect.Effect<TResult, FunctionExecutionError> => {
    let attemptCount = 0;

    const attemptExecution = Effect.gen(function* () {
      attemptCount++;

      const result = yield* Effect.catchAll(fn(...args), (cause: TError) =>
        Effect.gen(function* () {
          const executionError = new FunctionExecutionError(
            cause,
            resolvedFunctionName,
            attemptCount,
            args,
          );

          // Log the error (fork it so it doesn't block)
          yield* pipe(
            effectiveLogger(
              `Error in ${resolvedFunctionName} [Attempt ${attemptCount}]`,
              {
                error: formatError(cause),
                args,
                attempt: attemptCount,
                functionName: resolvedFunctionName,
              },
            ),
            Effect.catchAll((logError) =>
              Effect.fail(new LoggerError(logError)),
            ),
            Effect.catchAll((loggerError) =>
              Console.error("Logger failed:", formatError(loggerError.cause)),
            ),
            Effect.fork,
          );

          // Execute custom error handler if provided
          if (onError) {
            yield* pipe(
              onError(executionError, { args }),
              Effect.catchAll((handlerError) =>
                Effect.fail(new CustomHandlerError(handlerError, cause)),
              ),
              Effect.catchAll((customHandlerError) =>
                pipe(
                  effectiveLogger("Custom error handler failed", {
                    handlerError: formatError(customHandlerError.cause),
                    originalError: formatError(
                      customHandlerError.originalError,
                    ),
                  }),
                  Effect.catchAll(() => Effect.void),
                ),
              ),
              Effect.fork,
            );
          }

          return yield* Effect.fail(executionError);
        }),
      );
      return result;
    });

    // Apply retry logic
    const withRetries = pipe(attemptExecution, Effect.retry(retrySchedule));

    // Handle final failure
    return pipe(
      withRetries,
      Effect.catchAll((error: FunctionExecutionError) => {
        if (preserveOriginalError) {
          return Effect.fail(error);
        }

        // Create a clean error without exposing internal details
        return Effect.fail(
          new FunctionExecutionError(
            `Function ${resolvedFunctionName} failed after ${attemptCount} attempts`,
            resolvedFunctionName,
            attemptCount,
            args,
          ),
        );
      }),
    );
  };
}

/**
 * Utility function to convert the Effect result to a Promise with { data, error } structure
 * for compatibility with the original async handler API
 */
export function effectToAsync<TResult>(
  effect: Effect.Effect<TResult, FunctionExecutionError>,
): Promise<{ data?: TResult; error?: unknown }> {
  return Effect.runPromise(
    pipe(
      effect,
      Effect.match({
        onFailure: (error) => ({ error: formatError(error) }),
        onSuccess: (data) => ({ data }),
      }),
    ),
  );
}

/**
 * Higher-order function that creates an async version of handleEffect
 * that returns Promise<{ data?, error? }> for easier migration
 */
export function handleEffectAsync<
  TArgs extends unknown[],
  TResult,
  TError = never,
>(
  fn: EffectFn<TArgs, TResult, TError>,
  options: EffectHandlerOptions<TArgs> = {},
): (...args: TArgs) => Promise<{ data?: TResult; error?: unknown }> {
  const effectHandler = handleEffect(fn, options);

  return async (...args: TArgs) => {
    return effectToAsync(effectHandler(...args));
  };
}

/**
 * Utility to convert a Promise-based function to an Effect-based function
 */
export function promiseToEffect<
  TArgs extends unknown[],
  TResult,
  TError = unknown,
>(
  fn: (...args: TArgs) => Promise<TResult>,
  mapError?: (cause: unknown) => TError,
): EffectFn<TArgs, TResult, TError> {
  return (...args: TArgs) =>
    Effect.tryPromise({
      try: () => fn(...args),
      catch: mapError || ((cause) => cause as TError),
    });
}

// Re-export commonly used Effect utilities
export { Effect, pipe, Schedule, Console, Duration };
