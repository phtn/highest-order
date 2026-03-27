'use client'

import {Button} from '@/components/ui/button'
import {useOwnerId} from '@/ctx/chat/owner-store'
import {useChatSettings} from '@/ctx/chat/store'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {useMutation, useQuery} from 'convex/react'
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  ViewTransition,
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
  isLastMessage?: boolean
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
  isLastMessage = false,
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
  const [hasPlayed, setHasPlayed] = useState(false)

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

  const hasPlayableAudio = !!audioInfo?.url
  const needsRegeneration =
    isLastMessage &&
    hasPlayableAudio &&
    textHash !== null &&
    audioInfo?.textHash !== null &&
    audioInfo.textHash !== textHash

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
    if (isGenerating) return
    // Only generate audio for the last message in the conversation when speech is enabled
    // or when the voice changes.
    if (!isLastMessage) return
    if (hasPlayableAudio && !needsRegeneration) return
    void generateAndStore()
  }, [
    autoplay,
    canGenerate,
    generateAndStore,
    hasPlayableAudio,
    isGenerating,
    isLastMessage,
    needsRegeneration,
  ])

  // Autoplay once we have a playable URL.
  useEffect(() => {
    if (!autoplay) return
    if (!hasPlayableAudio) return
    if (needsRegeneration) return
    const el = audioRef.current
    if (!el || !audioInfo?.url) return
    // Reset to the start for deterministic autoplay.
    el.currentTime = 0
    void el.play().catch(() => {
      // autoplay may be blocked; ignore
    })
  }, [autoplay, audioInfo?.url, hasPlayableAudio, needsRegeneration])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onPlay = () => {
      setIsPlaying(true)
      if (!hasPlayed) setHasPlayed(true)
    }
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
  }, [hasPlayed])

  if (!speechEnabled && !hasPlayableAudio) return null

  return (
    <div className='flex flex-col bg-background/40'>
      <div className='flex items-center gap-2'>
        <ViewTransition>
          {!isGenerating && (
            <Button
              size='sm'
              type='button'
              variant='ghost'
              className={cn('h-8 px-2.5 rounded-none hover:bg-secondary/50!')}
              disabled={!hasPlayableAudio}
              onClick={() => {
                const el = audioRef.current
                if (!el) return
                if (el.paused) void el.play().catch(() => {})
                else el.pause()
              }}>
              <Icon
                name={isPlaying ? 'spinners-voice' : 'px-forward'}
                className='size-3.5 dark:text-orange-300'
              />
              <span className='sr-only'>{isPlaying ? 'Pause' : 'Play'}</span>
            </Button>
          )}
        </ViewTransition>

        <ViewTransition>
          {(!hasPlayableAudio || needsRegeneration) && (
            <Button
              type='button'
              size='sm'
              variant='secondary'
              className={cn('h-8 px-2.5')}
              disabled={!canGenerate || isGenerating}
              onClick={() => void generateAndStore()}>
              <Icon name='spinners-3-dots-move' className='size-3.5' />
              <span className='ml-2 text-xs'>
                {isGenerating ? 'Generating…' : 'Generate audio'}
              </span>
            </Button>
          )}
        </ViewTransition>
      </div>
      <audio
        ref={audioRef}
        controls
        preload='none'
        src={hasPlayableAudio ? (audioInfo?.url ?? undefined) : undefined}
        className='hidden'
      />

      {error && <p className='text-xs text-foreground/60'>{error}</p>}
    </div>
  )
}
