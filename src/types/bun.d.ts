declare global {
  interface BunFileLike {
    stream?: () => ReadableStream;
    arrayBuffer?: () => Promise<ArrayBuffer>;
    size?: number;
  }

  // interface

  const Bun:
    | {
        file?: (path: string) => BunFileLike;
      }
    | undefined;
}

export {};
