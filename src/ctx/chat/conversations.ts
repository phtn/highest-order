import { create } from "zustand";
import type { UIMessage } from "ai";

export type ConversationMeta = {
  id: string;
  assistantName: string;
  title: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

type ConversationsState = {
  metas: ReadonlyArray<ConversationMeta>;
  currentId: string | null;

  // Queries
  getMeta: (id: string) => ConversationMeta | undefined;
  getCurrentMessages: () => UIMessage[];
  getMessages: (id: string) => UIMessage[];

  // Commands
  createConversation: (assistantName: string, title?: string) => string;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  setCurrentMessages: (messages: UIMessage[]) => void;
};

const METAS_KEY = "app:conv:metas:v1";
const CURRENT_KEY = "app:conv:current:v1";
const MSGS_KEY_PREFIX = "app:conv:messages:";

const nowIso = (): string => new Date().toISOString();

const safeJSONParse = <T,>(raw: string): T | null => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed as T;
  } catch {
    return null;
  }
};

const loadMetas = (): ConversationMeta[] => {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(METAS_KEY);
  if (!raw) return [];
  const parsed = safeJSONParse<ConversationMeta[]>(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (m) =>
      m &&
      typeof m.id === "string" &&
      typeof m.assistantName === "string" &&
      typeof m.title === "string" &&
      typeof m.createdAt === "string" &&
      typeof m.updatedAt === "string",
  );
};

const saveMetas = (metas: ReadonlyArray<ConversationMeta>): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(METAS_KEY, JSON.stringify(metas));
  } catch {
    // ignore
  }
};

const msgsKey = (id: string): string => `${MSGS_KEY_PREFIX}${id}`;

const loadMessages = (id: string): UIMessage[] => {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(msgsKey(id));
  if (!raw) return [];
  const parsed = safeJSONParse<unknown>(raw);
  if (!Array.isArray(parsed)) return [];
  // Best-effort validation: id/role/parts
  return (parsed as UIMessage[]).filter(
    (m) => typeof m?.id === "string" && typeof m?.role === "string" && Array.isArray(m?.parts),
  );
};

const saveMessages = (id: string, messages: UIMessage[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(msgsKey(id), JSON.stringify(messages));
  } catch {
    // ignore
  }
};

const loadCurrentId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_KEY);
};

const saveCurrentId = (id: string): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CURRENT_KEY, id);
  } catch {
    // ignore
  }
};

const uuid = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback
  return `conv_${Math.random().toString(36).slice(2)}_${Date.now()}`;
};

export const useConversations = create<ConversationsState>((set, get) => {
  const metas = loadMetas();
  const currentId = loadCurrentId();

  const getMeta = (id: string): ConversationMeta | undefined => {
    return get().metas.find((m) => m.id === id);
  };

  const getMessages = (id: string): UIMessage[] => {
    return loadMessages(id);
  };

  const getCurrentMessages = (): UIMessage[] => {
    const id = get().currentId;
    if (!id) return [];
    return loadMessages(id);
  };

  const createConversation = (assistantName: string, title?: string): string => {
    const id = uuid();
    const meta: ConversationMeta = {
      id,
      assistantName,
      title: title ?? "New conversation",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const nextMetas = [meta, ...get().metas];
    saveMetas(nextMetas);
    saveMessages(id, []);
    saveCurrentId(id);
    set({ metas: nextMetas, currentId: id });
    return id;
  };

  const selectConversation = (id: string): void => {
    const meta = getMeta(id);
    if (!meta) return;
    saveCurrentId(id);
    set({ currentId: id });
  };

  const deleteConversation = (id: string): void => {
    const nextMetas = get().metas.filter((m) => m.id !== id);
    saveMetas(nextMetas);
    // Remove messages
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(msgsKey(id));
      } catch {
        // ignore
      }
    }
    let nextCurrent: string | null = get().currentId;
    if (nextCurrent === id) {
      nextCurrent = nextMetas.length > 0 ? nextMetas[0].id : null;
      if (nextCurrent) saveCurrentId(nextCurrent);
      else if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(CURRENT_KEY);
        } catch {
          // ignore
        }
      }
    }
    set({ metas: nextMetas, currentId: nextCurrent });
  };

  const renameConversation = (id: string, title: string): void => {
    const list = get().metas.slice();
    const idx = list.findIndex((m) => m.id === id);
    if (idx === -1) return;
    const meta = { ...list[idx], title, updatedAt: nowIso() };
    list[idx] = meta;
    saveMetas(list);
    set({ metas: list });
  };

  const setCurrentMessages = (messages: UIMessage[]): void => {
    const id = get().currentId;
    if (!id) return;
    saveMessages(id, messages);
    // also update updatedAt for the meta
    const list = get().metas.slice();
    const idx = list.findIndex((m) => m.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], updatedAt: nowIso() };
      saveMetas(list);
      set({ metas: list });
    }
  };

  return {
    metas,
    currentId: metas.find((m) => m.id === currentId)?.id ?? (metas[0]?.id ?? null),

    getMeta,
    getCurrentMessages,
    getMessages,

    createConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    setCurrentMessages,
  };
});