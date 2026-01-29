'use client'

import {Button} from '@/components/ui/button'
import {useOwnerId} from '@/ctx/chat/owner-store'
import {useChatSettings} from '@/ctx/chat/store'
import {cn} from '@/lib/utils'
import {useMutation, useQuery} from 'convex/react'
import {Pause, Play, Volume2} from 'lucide-react'
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {api} from '../../../convex/_generated/api'
import type {Id} from '../../../convex/_generated/dataModel'

const hashStringSha256Hex = async (value: string): Promise<string> => {
  const enc = new TextEncoder()
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(value))
  const bytes = new Uint8Array(digest)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

type AssistantMessageAudioProps = {
  conversationId: string
  messageId: string
  text: string
  voice?: string
  autoplay?: boolean
}

type UploadResponse = {storageId: string}

const isUploadResponse = (value: unknown): value is UploadResponse => {
  if (typeof value !== 'object' || value === null) return false
  if (!('storageId' in value)) return false
  return typeof (value as {storageId?: unknown}).storageId === 'string'
}

export const AssistantMessageAudio = ({
  conversationId,
  messageId,
  text,
  voice,
  autoplay = false,
}: AssistantMessageAudioProps) => {
  const {ownerId} = useOwnerId()
  const {speechEnabled} = useChatSettings()

  const audioInfo = useQuery(api.llmAudio.q.getMessageAudio, {
    ownerId,
    conversationId,
    messageId,
  })

  const generateUploadUrl = useMutation(api.llmAudio.m.generateUploadUrl)
  const upsertMessageAudio = useMutation(api.llmAudio.m.upsertMessageAudio)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [textHash, setTextHash] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const normalizedText = useMemo(() => text.trim(), [text])

  useEffect(() => {
    let cancelled = false
    const toHash = `${voice ?? ''}\n${normalizedText}`
    if (toHash.trim().length === 0) {
      setTextHash(null)
      return
    }
    void (async () => {
      try {
        const next = await hashStringSha256Hex(toHash)
        if (!cancelled) setTextHash(next)
      } catch {
        if (!cancelled) setTextHash(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [normalizedText, voice])

  const hasValidAudio =
    !!audioInfo?.url &&
    (textHash === null ||
      audioInfo?.textHash === null ||
      audioInfo.textHash === textHash)

  const canGenerate = speechEnabled && normalizedText.length > 0

  const generateAndStore = useCallback(async (): Promise<string | null> => {
    if (!canGenerate) return null
    if (isGenerating) return null

    startTransition(() => {
      setIsGenerating(true)
      setError(null)
    })

    try {
      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({content: normalizedText, voice}),
      })

      if (!ttsRes.ok) {
        startTransition(() => setError(`TTS failed (${ttsRes.status})`))
        return null
      }

      const contentType = ttsRes.headers.get('Content-Type') || 'audio/mpeg'
      const audioArr = await ttsRes.arrayBuffer()

      const uploadUrl = await generateUploadUrl()
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {'Content-Type': contentType},
        body: new Blob([audioArr], {type: contentType}),
      })

      if (!uploadRes.ok) {
        startTransition(() => setError(`Upload failed (${uploadRes.status})`))
        return null
      }

      const uploadJson: unknown = await uploadRes.json()
      if (!isUploadResponse(uploadJson)) {
        startTransition(() => setError('Upload response malformed'))
        return null
      }

      const storageId = uploadJson.storageId as Id<'_storage'>

      await upsertMessageAudio({
        ownerId,
        conversationId,
        messageId,
        storageId,
        contentType,
        voice,
        provider: 'lmnt',
        textHash: textHash ?? undefined,
      })

      return storageId
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      startTransition(() => setError(msg))
      return null
    } finally {
      startTransition(() => setIsGenerating(false))
    }
  }, [
    canGenerate,
    conversationId,
    generateUploadUrl,
    isGenerating,
    messageId,
    normalizedText,
    ownerId,
    textHash,
    upsertMessageAudio,
    voice,
  ])

  // Autogenerate for the latest assistant message when speech is enabled.
  useEffect(() => {
    if (!autoplay) return
    if (!canGenerate) return
    if (hasValidAudio) return
    if (isGenerating) return
    void generateAndStore()
  }, [autoplay, canGenerate, generateAndStore, hasValidAudio, isGenerating])

  // Autoplay once we have a playable URL.
  useEffect(() => {
    if (!autoplay) return
    if (!hasValidAudio) return
    const el = audioRef.current
    if (!el || !audioInfo?.url) return
    // Reset to the start for deterministic autoplay.
    el.currentTime = 0
    void el.play().catch(() => {
      // autoplay may be blocked; ignore
    })
  }, [autoplay, audioInfo?.url, hasValidAudio])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => setIsPlaying(false)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('ended', onEnded)
    return () => {
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('ended', onEnded)
    }
  }, [])

  if (!speechEnabled && !hasValidAudio) return null

  return (
    <div className='mt-2 flex flex-col gap-2'>
      <div className='flex items-center gap-2'>
        <Button
          type='button'
          size='sm'
          variant='outline'
          className={cn('h-8 px-2.5')}
          disabled={!hasValidAudio}
          onClick={() => {
            const el = audioRef.current
            if (!el) return
            if (el.paused) void el.play().catch(() => {})
            else el.pause()
          }}>
          {isPlaying ? (
            <Pause className='size-3.5' />
          ) : (
            <Play className='size-3.5' />
          )}
          <span className='sr-only'>{isPlaying ? 'Pause' : 'Play'}</span>
        </Button>

        {!hasValidAudio && (
          <Button
            type='button'
            size='sm'
            variant='secondary'
            className={cn('h-8 px-2.5')}
            disabled={!canGenerate || isGenerating}
            onClick={() => void generateAndStore()}>
            <Volume2 className='size-3.5' />
            <span className='ml-2 text-xs'>
              {isGenerating ? 'Generating…' : 'Generate audio'}
            </span>
          </Button>
        )}
      </div>

      <audio
        ref={audioRef}
        controls
        preload='none'
        src={hasValidAudio ? (audioInfo?.url ?? undefined) : undefined}
        className='hidden'
      />

      {error && <p className='text-xs text-foreground/60'>{error}</p>}
    </div>
  )
}
