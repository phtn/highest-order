"use client";

import { useEffect, useRef } from "react";
import type * as monaco from "monaco-editor";

export default function MonacoWithVim() {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const statusNodeRef = useRef<HTMLDivElement>(null);
  const vimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let editor: monaco.editor.IStandaloneCodeEditor | null = null;

    const initEditor = async () => {
      const monaco = await import("monaco-editor");
      // @ts-expect-error dynamic import
      const { initVimMode } = await import("monaco-vim");

      if (vimRef.current && !editorRef.current) {
        editor = monaco.editor.create(vimRef.current, {
          value: "const pi = Math.PI;",
          language: "typescript",
          theme: "chrome-devtools",
          automaticLayout: true,
          minimap: {
            enabled: false,
          },
        });

        editorRef.current = editor;

        // Attach Vim
        if (statusNodeRef.current) {
          initVimMode(editor, statusNodeRef.current);
        }
      }
    };

    initEditor();

    return () => {
      if (editor) {
        editor.dispose();
      }
    };
  }, []);

  return (
    <div style={{ height: "40vh", display: "flex", flexDirection: "column" }}>
      <div
        ref={vimRef}
        id="editor"
        style={{ flex: 1, border: "1px solid #ccc" }}
      />
      <div
        ref={statusNodeRef}
        style={{
          padding: "4px",
          background: "#222",
          color: "#fff",
          fontSize: "12px",
        }}
      />
    </div>
  );
}
