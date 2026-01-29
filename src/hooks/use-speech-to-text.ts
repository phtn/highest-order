import {useEffect, useMemo, useRef, useState} from 'react'

type SpeechRecognitionAlternativeLike = {
  transcript: string
  confidence: number
}

type SpeechRecognitionResultLike = {
  readonly isFinal: boolean
  readonly length: number
  item: (index: number) => SpeechRecognitionAlternativeLike
  [index: number]: SpeechRecognitionAlternativeLike
}

type SpeechRecognitionResultListLike = {
  readonly length: number
  item: (index: number) => SpeechRecognitionResultLike
  [index: number]: SpeechRecognitionResultLike
}

type SpeechRecognitionEventLike = {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultListLike
}

type SpeechRecognitionErrorEventLike = {
  readonly error: string
  readonly message?: string
}

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  onaudiostart: (() => void) | null
  onaudioend: (() => void) | null
  onspeechstart: (() => void) | null
  onspeechend: (() => void) | null
  onstart: (() => void) | null
}

type SpeechRecognitionConstructorLike = new () => SpeechRecognitionLike

const getSpeechRecognitionConstructor = (): SpeechRecognitionConstructorLike | null => {
  if (typeof window === 'undefined') return null

  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructorLike
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike
  }

  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export type UseSpeechToTextOptions = {
  lang?: string
  continuous?: boolean
  onFinal: (text: string) => void
  onInterim?: (text: string) => void
}

export type UseSpeechToTextResult = {
  isSupported: boolean
  isListening: boolean
  error: string | null
  start: () => void
  stop: () => void
}

export function useSpeechToText(
  options: UseSpeechToTextOptions,
): UseSpeechToTextResult {
  const {lang = 'en-US', continuous = false, onFinal, onInterim} = options
  const Recognition = useMemo(getSpeechRecognitionConstructor, [])

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSupported = Recognition !== null

  const stop = () => {
    const rec = recognitionRef.current
    if (!rec) return
    try {
      rec.stop()
    } catch {
      // ignore
    }
  }

  const start = () => {
    setError(null)
    if (!Recognition) {
      setError('Speech recognition is not supported in this browser.')
      return
    }

    if (!recognitionRef.current) {
      const rec = new Recognition()
      rec.lang = lang
      rec.continuous = continuous
      rec.interimResults = true
      rec.maxAlternatives = 1

      rec.onresult = (event) => {
        let interim = ''
        let finalText = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results.item(i)
          const alt = result.item(0)
          const transcript = alt?.transcript ?? ''
          if (result.isFinal) finalText += transcript
          else interim += transcript
        }

        const cleanFinal = finalText.trim()
        const cleanInterim = interim.trim()

        if (cleanInterim.length > 0) onInterim?.(cleanInterim)
        if (cleanFinal.length > 0) onFinal(cleanFinal)
      }

      rec.onerror = (e) => {
        setError(e.message ?? e.error ?? 'Speech recognition error')
        setIsListening(false)
      }

      rec.onend = () => {
        setIsListening(false)
      }

      rec.onstart = () => {
        setIsListening(true)
      }

      recognitionRef.current = rec
    } else {
      // keep settings in sync
      recognitionRef.current.lang = lang
      recognitionRef.current.continuous = continuous
      recognitionRef.current.interimResults = true
      recognitionRef.current.maxAlternatives = 1
    }

    try {
      recognitionRef.current.start()
    } catch (e) {
      // Some browsers throw if start() is called while already started.
      const message =
        e instanceof Error ? e.message : 'Could not start speech recognition'
      setError(message)
    }
  }

  useEffect(() => {
    return () => {
      const rec = recognitionRef.current
      if (!rec) return
      try {
        rec.abort()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }
  }, [])

  return {isSupported, isListening, error, start, stop}
}
