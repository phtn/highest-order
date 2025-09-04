/**
 * minimal typescript ambient declarations for the `bun:ffi` virtual module.
 *
 * these types avoid using `any` (use `unknown` instead) to respect the
 * project's "no any" rule while providing useful typings for dlopen/ffi usage.
 *
 * extend this file if you need more precise types for additional ffi symbols.
 */

declare module "bun:ffi" {
  /**
   * the platform-specific shared library suffix used by bun (e.g. "dylib", "so", "dll").
   */
  // export const suffix: string;

  /**
   * a small description of an ffi symbol when opening a dynamic library.
   * - args: tuple of argument types (opaque here as `unknown`)
   * - returns: return type descriptor (opaque `unknown`)
   */
  export type ffisymboldescriptor = {
    args: unknown[]; // argument type descriptors (opaque)
    returns: unknown; // return type descriptor (opaque)
  };

  /**
   * the object returned by `dlopen`.
   * `symbols` maps symbol names to callable functions; each function returns unknown.
   */
  // export type dlopenresult = {
  //   symbols: record<string, (...args: unknown[]) => unknown>;
  // };

  /**
   * ffitype provides helpers to refer to common c types when declaring symbol signatures.
   * we keep the shapes minimal and avoid `any`.
   */
  export const ffitype: {
    cstring: unknown;
    // add other types you need here (e.g., i32, f64) as `unknown`
    // i32?: unknown;
    // f64?: unknown;
  };

  /**
   * open a shared library and declare the symbols you want to use.
   * the `spec` parameter maps exported symbol names to their descriptors.
   */
  // export function dlopen(path: string, spec: record<string, ffisymboldescriptor>): dlopenresult;
}
