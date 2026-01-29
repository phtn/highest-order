import {create} from 'zustand'

export type ModelOption = {name: string; value: string}

export const MODELS: ReadonlyArray<ModelOption> = [
  {name: 'command-a-03-2025', value: 'cohere/command-a-03'},
] as const

type ChatSettingsValues = {
  model: string
  webSearch: boolean
  speechEnabled: boolean
  instructionsPreset: InstructionsPreset
  customInstructions: string
}

interface ChatSettingsState extends ChatSettingsValues {
  setModel: (model: string) => void
  setWebSearch: (webSearch: boolean) => void
  setSpeechEnabled: (speechEnabled: boolean) => void
  setInstructionsPreset: (preset: InstructionsPreset) => void
  setCustomInstructions: (customInstructions: string) => void
}

export type InstructionsPreset =
  | 'general'
  | 'extreme'
  | 'ultra'
  | 'hyper'
  | 'custom'

export const INSTRUCTION_PRESETS: ReadonlyArray<{
  value: InstructionsPreset
  name: string
}> = [
  {value: 'general', name: 'Generic'},
  {value: 'extreme', name: 'XXXtreme'},
  {value: 'ultra', name: 'Ultra'},
  {value: 'hyper', name: 'Hyper'},
  {value: 'custom', name: 'Custom'},
] as const

export const isInstructionsPreset = (
  value: string,
): value is InstructionsPreset =>
  INSTRUCTION_PRESETS.some((p) => p.value === value)

const STORAGE_KEY = 'app:chat-settings:v2'

const defaults: ChatSettingsValues = {
  model: MODELS[0].value,
  webSearch: false,
  speechEnabled: true,
  instructionsPreset: 'general',
  customInstructions: '',
}

const safeParse = (raw: string): ChatSettingsValues | null => {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed === 'object' && parsed !== null) {
      const obj = parsed as Record<string, unknown>
      const model = typeof obj.model === 'string' ? obj.model : defaults.model
      const webSearch =
        typeof obj.webSearch === 'boolean' ? obj.webSearch : defaults.webSearch
      const speechEnabled =
        typeof obj.speechEnabled === 'boolean'
          ? obj.speechEnabled
          : defaults.speechEnabled
      const instructionsPreset =
        typeof obj.instructionsPreset === 'string' &&
        INSTRUCTION_PRESETS.some((p) => p.value === obj.instructionsPreset)
          ? (obj.instructionsPreset as InstructionsPreset)
          : defaults.instructionsPreset
      const customInstructions =
        typeof obj.customInstructions === 'string'
          ? obj.customInstructions
          : defaults.customInstructions
      return {
        model,
        webSearch,
        speechEnabled,
        instructionsPreset,
        customInstructions,
      }
    }
  } catch {
    // ignore
  }
  return null
}

const loadInitial = (): ChatSettingsValues => {
  if (typeof window === 'undefined') return defaults
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return defaults
  return safeParse(raw) ?? defaults
}

const persist = (values: ChatSettingsValues): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values))
  } catch {
    // ignore
  }
}

export const useChatSettings = create<ChatSettingsState>((set, get) => {
  const initial = loadInitial()

  return {
    ...initial,
    setModel: (model: string) => {
      const {webSearch, speechEnabled, instructionsPreset, customInstructions} =
        get()
      set({model})
      persist({
        model,
        webSearch,
        speechEnabled,
        instructionsPreset,
        customInstructions,
      })
    },
    setWebSearch: (webSearch: boolean) => {
      const {model, speechEnabled, instructionsPreset, customInstructions} =
        get()
      set({webSearch})
      persist({
        model,
        webSearch,
        speechEnabled,
        instructionsPreset,
        customInstructions,
      })
    },
    setSpeechEnabled: (speechEnabled: boolean) => {
      const {model, webSearch, instructionsPreset, customInstructions} = get()
      set({speechEnabled})
      persist({
        model,
        webSearch,
        speechEnabled,
        instructionsPreset,
        customInstructions,
      })
    },
    setInstructionsPreset: (instructionsPreset: InstructionsPreset) => {
      const {model, webSearch, speechEnabled, customInstructions} = get()
      set({instructionsPreset})
      persist({
        model,
        webSearch,
        speechEnabled,
        instructionsPreset,
        customInstructions,
      })
    },
    setCustomInstructions: (customInstructions: string) => {
      const {model, webSearch, speechEnabled, instructionsPreset} = get()
      set({customInstructions})
      persist({
        model,
        webSearch,
        speechEnabled,
        instructionsPreset,
        customInstructions,
      })
    },
  }
})
