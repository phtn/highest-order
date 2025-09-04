import type * as MonacoType from "monaco-editor-core";
import type React from "react";

/**
 * Lazy initialize Shiki + Monaco and expose a createEditor helper that
 * works in browser-only environments. This avoids top-level await and
 * keeps the module safe to import on the server.
 */

let initialized = false;
let monacoInstance: typeof MonacoType | null = null;

export async function initShikiAndMonaco() {
  if (initialized) return;
  // Dynamic imports keep this code server-safe and ensure the modules
  // are only loaded in the browser.
  const [{ shikiToMonaco }, monacoModule, { createHighlighter }] =
    await Promise.all([
      import("@shikijs/monaco"),
      import("monaco-editor-core"),
      import("shiki"),
    ]);

  const highlighter = await createHighlighter({
    themes: [
      "vitesse-dark",
      "vitesse-light",
      "dracula-soft",
      "catppuccin-frappe",
      "rose-pine-moon",
      "slack-ochin",
      "kanagawa-dragon",
      "snazzy-light",
      "one-light",
    ],
    langs: ["javascript", "typescript", "json"],
  });

  // Register the language IDs that will be used.
  monacoModule.languages.register({ id: "typescript" });
  monacoModule.languages.register({ id: "javascript" });
  monacoModule.languages.register({ id: "json" });

  // Push Shiki themes/syntax into Monaco
  shikiToMonaco(highlighter, monacoModule);

  monacoInstance = monacoModule;
  initialized = true;
}

/**
 * Create a Monaco editor inside the given ref.
 * Returns the editor instance (typed) or null if the ref is not ready.
 */
export async function createEditor(
  value: string,
  language: string,
  ref: React.RefObject<HTMLDivElement | null>,
  theme = "one-light",
): Promise<MonacoType.editor.IStandaloneCodeEditor | null> {
  if (!ref.current) return null;
  await initShikiAndMonaco();
  if (!monacoInstance) return null;

  const editor = monacoInstance.editor.create(ref.current, {
    ...p,
    value,
    language,
    theme,
  });

  return editor;
}

const p: MonacoType.editor.IEditorOptions = {
  automaticLayout: true,
  minimap: { enabled: false },
  fontSize: 12,
  fontFamily: "JetBrains Mono NL, monospace",
  lineNumbersMinChars: 2,
  overviewRulerBorder: false,
  letterSpacing: 0.5,
  padding: {
    top: 10,
    bottom: 10,
  },
  renderLineHighlight: "none",
  smoothScrolling: true,
  scrollBeyondLastLine: false,
  scrollbar: {
    vertical: "hidden",
    horizontal: "hidden",
  },
  stickyScroll: {
    enabled: false,
  },
  fastScrollSensitivity: 12,
  mouseWheelScrollSensitivity: 12,
  wordWrap: "on",
};
