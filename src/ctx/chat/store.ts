import { create } from "zustand";

export type ModelOption = { name: string; value: string };

export const MODELS: ReadonlyArray<ModelOption> = [
  { name: "command-a-03-2025", value: "cohere/command-a-03" },
] as const;

type ChatSettingsValues = {
  model: string;
  webSearch: boolean;
  speechEnabled: boolean;
};

interface ChatSettingsState extends ChatSettingsValues {
  setModel: (model: string) => void;
  setWebSearch: (webSearch: boolean) => void;
  setSpeechEnabled: (speechEnabled: boolean) => void;
}

const STORAGE_KEY = "app:chat-settings:v1";

const defaults: ChatSettingsValues = {
  model: MODELS[0].value,
  webSearch: false,
  speechEnabled: true,
};

const safeParse = (raw: string): ChatSettingsValues | null => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === "object" && parsed !== null) {
      const obj = parsed as Record<string, unknown>;
      const model =
        typeof obj.model === "string" ? obj.model : defaults.model;
      const webSearch =
        typeof obj.webSearch === "boolean" ? obj.webSearch : defaults.webSearch;
      const speechEnabled =
        typeof obj.speechEnabled === "boolean"
          ? obj.speechEnabled
          : defaults.speechEnabled;
      return { model, webSearch, speechEnabled };
    }
  } catch {
    // ignore
  }
  return null;
};

const loadInitial = (): ChatSettingsValues => {
  if (typeof window === "undefined") return defaults;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaults;
  return safeParse(raw) ?? defaults;
};

const persist = (values: ChatSettingsValues): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    // ignore
  }
};

export const useChatSettings = create<ChatSettingsState>((set, get) => {
  const initial = loadInitial();

  return {
    ...initial,
    setModel: (model: string) => {
      const { webSearch, speechEnabled } = get();
      set({ model });
      persist({ model, webSearch, speechEnabled });
    },
    setWebSearch: (webSearch: boolean) => {
      const { model, speechEnabled } = get();
      set({ webSearch });
      persist({ model, webSearch, speechEnabled });
    },
    setSpeechEnabled: (speechEnabled: boolean) => {
      const { model, webSearch } = get();
      set({ speechEnabled });
      persist({ model, webSearch, speechEnabled });
    },
  };
});