import {create} from 'zustand'

export type VoiceEngine = 'lmnt' | 'hume'
export type OutputMode = 'text-stream'
export type Voices = 'ellie' | 'sakura' | 'moody' | 'kendall' | 'natalie'

interface VoiceSettingsState {
  voiceEngine: VoiceEngine
  outputMode: OutputMode
  voice: Voices
  setVoiceEngine: (engine: VoiceEngine) => void
  setOutputMode: (mode: OutputMode) => void
  setVoice: (voice: Voices) => void
}

export const useVoiceSettings = create<VoiceSettingsState>((set) => ({
  voiceEngine: 'lmnt',
  outputMode: 'text-stream',
  voice: 'natalie',
  setVoiceEngine: (voiceEngine) => set({voiceEngine}),
  setOutputMode: (outputMode) => set({outputMode}),
  setVoice: (voice) => set({voice}),
}))

export const useHumeVoiceSettings = create<VoiceSettingsState>((set) => ({
  voiceEngine: 'hume',
  outputMode: 'text-stream',
  voice: 'kendall',
  setVoiceEngine: (voiceEngine) => set({voiceEngine}),
  setOutputMode: (outputMode) => set({outputMode}),
  setVoice: (voice) => set({voice}),
}))
