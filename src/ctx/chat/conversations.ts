import { create } from "zustand";
import type { UIMessage } from "ai";
import type { ConvexReactClient } from "convex/react";
import { api } from "../../../convex/_generated/api";

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
  bootstrapped: boolean;

  // Convex integration
  connectConvex: (client: ConvexReactClient, ownerId: string) => void;
  bootstrapFromConvex: () => Promise<void>;
  loadConversationMessages: (id: string) => Promise<UIMessage[]>;

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
const nowMs = (): number => Date.now();

let activeOwnerId: string = "default";

const ownerKey = (base: string): string => `${base}:${activeOwnerId}`;

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
  const raw = localStorage.getItem(ownerKey(METAS_KEY));
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
    localStorage.setItem(ownerKey(METAS_KEY), JSON.stringify(metas));
  } catch {
    // ignore
  }
};

const msgsKey = (id: string): string => `${MSGS_KEY_PREFIX}${id}`;

const loadMessages = (id: string): UIMessage[] => {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(ownerKey(msgsKey(id)));
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
    localStorage.setItem(ownerKey(msgsKey(id)), JSON.stringify(messages));
  } catch {
    // ignore
  }
};

const loadCurrentId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ownerKey(CURRENT_KEY));
};

const saveCurrentId = (id: string): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ownerKey(CURRENT_KEY), id);
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

  // runtime-only Convex connection (do not store in Zustand state)
  let convex: ConvexReactClient | null = null;
  let convexOwnerId: string | null = null;

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

  const connectConvex = (client: ConvexReactClient, ownerId: string): void => {
    convex = client;
    convexOwnerId = ownerId;
    activeOwnerId = ownerId;
    // swap local cache immediately to the new owner namespace
    const nextMetas = loadMetas();
    const nextCurrentId = loadCurrentId();
    set({
      metas: nextMetas,
      currentId:
        nextMetas.find((m) => m.id === nextCurrentId)?.id ??
        (nextMetas[0]?.id ?? null),
      bootstrapped: false,
    });
  };

  const upsertConvexConversation = (meta: ConversationMeta): void => {
    if (!convex || !convexOwnerId) return;
    const localMessages = loadMessages(meta.id);
    const payload = {
      ownerId: convexOwnerId,
      conversationId: meta.id,
      assistantName: meta.assistantName,
      title: meta.title,
      messagesJson: JSON.stringify(localMessages),
      createdAt: new Date(meta.createdAt).getTime() || nowMs(),
      updatedAt: new Date(meta.updatedAt).getTime() || nowMs(),
    };
    void convex.mutation(api.llm.m.upsertConversation, payload);
  };

  const setConvexMessages = (conversationId: string, messages: UIMessage[]): void => {
    if (!convex || !convexOwnerId) return;
    const payload = {
      ownerId: convexOwnerId,
      conversationId,
      messagesJson: JSON.stringify(messages),
    };
    void convex.mutation(api.llm.m.setConversationMessages, payload);
  };

  const bootstrapFromConvex = async (): Promise<void> => {
    if (!convex || !convexOwnerId) return;
    try {
      const raw = await convex.query(api.llm.q.listConversations, {
        ownerId: convexOwnerId,
        limit: 100,
      });
      const list = Array.isArray(raw) ? raw : [];
      const metasFromConvex: ConversationMeta[] = list
        .map((x) => {
          const obj = x as Record<string, unknown>;
          const id = typeof obj.conversationId === "string" ? obj.conversationId : null;
          const assistantName =
            typeof obj.assistantName === "string" ? obj.assistantName : null;
          const title = typeof obj.title === "string" ? obj.title : null;
          const createdAtMs = typeof obj.createdAt === "number" ? obj.createdAt : null;
          const updatedAtMs = typeof obj.updatedAt === "number" ? obj.updatedAt : null;
          if (!id || !assistantName || !title || !createdAtMs || !updatedAtMs) return null;
          return {
            id,
            assistantName,
            title,
            createdAt: new Date(createdAtMs).toISOString(),
            updatedAt: new Date(updatedAtMs).toISOString(),
          } satisfies ConversationMeta;
        })
        .filter((m): m is ConversationMeta => m !== null);

      // If Convex is empty but local has data, push local up so you don't "lose" history.
      if (metasFromConvex.length === 0 && get().metas.length > 0) {
        for (const m of get().metas) upsertConvexConversation(m);
        return;
      }

      if (metasFromConvex.length > 0) {
        saveMetas(metasFromConvex);
        set({
          metas: metasFromConvex,
          currentId:
            metasFromConvex.find((m) => m.id === get().currentId)?.id ??
            (metasFromConvex[0]?.id ?? null),
          bootstrapped: true,
        });
      }
    } catch {
      // ignore
    } finally {
      set({bootstrapped: true});
    }
  };

  const loadConversationMessages = async (id: string): Promise<UIMessage[]> => {
    // Prefer local cache first
    const cached = loadMessages(id);
    if (cached.length > 0) return cached;
    if (!convex || !convexOwnerId) return cached;

    try {
      const raw = await convex.query(api.llm.q.getConversationMessages, {
        ownerId: convexOwnerId,
        conversationId: id,
      });
      if (typeof raw !== "string") return cached;
      const parsed = safeJSONParse<unknown>(raw);
      if (!Array.isArray(parsed)) return cached;
      const msgs = (parsed as UIMessage[]).filter(
        (m) =>
          typeof m?.id === "string" &&
          typeof m?.role === "string" &&
          Array.isArray(m?.parts),
      );
      saveMessages(id, msgs);
      return msgs;
    } catch {
      return cached;
    }
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
    upsertConvexConversation(meta);
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
        localStorage.removeItem(ownerKey(msgsKey(id)));
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
          localStorage.removeItem(ownerKey(CURRENT_KEY));
        } catch {
          // ignore
        }
      }
    }
    set({ metas: nextMetas, currentId: nextCurrent });

    if (convex && convexOwnerId) {
      void convex.mutation(api.llmAudio.m.deleteConversationAudio, {
        ownerId: convexOwnerId,
        conversationId: id,
      });
      void convex.mutation(api.llm.m.deleteConversation, {
        ownerId: convexOwnerId,
        conversationId: id,
      });
    }
  };

  const renameConversation = (id: string, title: string): void => {
    const list = get().metas.slice();
    const idx = list.findIndex((m) => m.id === id);
    if (idx === -1) return;
    const meta = { ...list[idx], title, updatedAt: nowIso() };
    list[idx] = meta;
    saveMetas(list);
    set({ metas: list });
    if (convex && convexOwnerId) {
      void convex.mutation(api.llm.m.renameConversation, {
        ownerId: convexOwnerId,
        conversationId: id,
        title,
      });
    }
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
    setConvexMessages(id, messages);
  };

  return {
    metas,
    currentId: metas.find((m) => m.id === currentId)?.id ?? (metas[0]?.id ?? null),
    bootstrapped: metas.length > 0,

    connectConvex,
    bootstrapFromConvex,
    loadConversationMessages,

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