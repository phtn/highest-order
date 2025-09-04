import { create } from "zustand";

export type VoiceEngine = "lmnt";
export type OutputMode = "text-stream";
export type Voices = "ellie" | "sakura" | "moody" | "kendall";

interface VoiceSettingsState {
  voiceEngine: VoiceEngine;
  outputMode: OutputMode;
  voice: Voices;
  setVoiceEngine: (engine: VoiceEngine) => void;
  setOutputMode: (mode: OutputMode) => void;
  setVoice: (voice: Voices) => void;
}

export const useVoiceSettings = create<VoiceSettingsState>((set) => ({
  voiceEngine: "lmnt",
  outputMode: "text-stream",
  voice: "kendall",
  setVoiceEngine: (voiceEngine) => set({ voiceEngine }),
  setOutputMode: (outputMode) => set({ outputMode }),
  setVoice: (voice) => set({ voice }),
}));
