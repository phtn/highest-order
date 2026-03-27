import {
  getSpeechRecognitionConstructor,
  type SpeechRecognitionLike,
} from '@/hooks/use-speech-to-text'

let speechRecognition: SpeechRecognitionLike | null = null

/**
 * Returns a singleton instance of the browser's Speech Recognition API
 * (SpeechRecognition or webkitSpeechRecognition). Use this when you need
 * a shared recognition instance outside of React (e.g. in entry/llm).
 * Returns null if the API is not supported (e.g. in non‑Chrome/Safari or SSR).
 */
export const speechRecorder = () => {
  if (speechRecognition !== null) return speechRecognition
  const Ctor = getSpeechRecognitionConstructor()
  if (!Ctor) return null
  speechRecognition = new Ctor()
  return speechRecognition
}
