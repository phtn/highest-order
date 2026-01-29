'use client'

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {Loader} from '@/components/ai-elements/loader'
import {Message, MessageContent} from '@/components/ai-elements/message'
import {
  PromptInput,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import {Response} from '@/components/ai-elements/response'
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/source'
import {SettingsPanelTrigger} from '@/components/settings-panel'
import {useConversations} from '@/ctx/chat/conversations'
import {useChatSettings} from '@/ctx/chat/store'
import {useChat} from '@ai-sdk/react'
import {startTransition, useCallback, useEffect, useRef, useState} from 'react'
import {Mic, Square} from 'lucide-react'

import {useVoiceSettings} from '@/ctx/hume'
import {useSpeechToText} from '@/hooks/use-speech-to-text'
import {extractLeadingReactions} from '@/lib/chat/reactions'

import {Wrapper} from '@/components/wrapper'

export const WithHumeContent = () => {
  const {instant, voice, voiceProvider} = useVoiceSettings()
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const {model, webSearch, speechEnabled, instructionsPreset, customInstructions} =
    useChatSettings()

  const {
    currentId,
    bootstrapped,
    setCurrentMessages,
    createConversation,
    renameConversation,
    loadConversationMessages,
  } = useConversations()

  const {messages, sendMessage, status, setMessages} = useChat({
    id: currentId || 'default',
  })

  const assistantLabel = useCallback(
    (alias: string) => (alias.toLowerCase() === 'sakura' ? 'Sakura' : 'Ellie'),
    [],
  )
  const {isSupported, isListening, error, start, stop: stopListening} =
    useSpeechToText({
      onFinal: (text) => {
        startTransition(() => {
          setInput((prev) => {
            const next = prev.trimEnd()
            return next.length > 0 ? `${next} ${text}` : text
          })
        })
        requestAnimationFrame(() => textareaRef.current?.focus())
      },
    })

  const extractTextFromParts = (parts: unknown[]) => {
    let text = ''
    for (const p of parts) {
      const part = p as unknown as {type: string; text?: string}
      if (part.type === 'text' && typeof part.text === 'string') {
        text += extractLeadingReactions(part.text).text
      }
    }
    return text
  }

  // Simple speech synthesis
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentAudioUrlRef = useRef<string | null>(null)
  const fetchAbortRef = useRef<AbortController | null>(null)
  const assistantTextRef = useRef<string>('')
  const lastPlayedMessageIdRef = useRef<string | null>(null)
  const hydratingRef = useRef<boolean>(true)
  const prevCountRef = useRef<number>(0)

  const playAudio = useCallback(
    async (text: string) => {
      if (!speechEnabled || !text || text.trim().length === 0) return

      // Abort any in-flight TTS request before starting a new one
      if (fetchAbortRef.current) {
        fetchAbortRef.current.abort()
        fetchAbortRef.current = null
      }
      const controller = new AbortController()
      fetchAbortRef.current = controller
      const {signal} = controller

      try {
        const cleaned = extractLeadingReactions(text).text
        const res = await fetch('/api/hume', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            text: cleaned,
            voiceName: voice?.name ?? '',
            voiceProvider: voice?.provider ?? voiceProvider,
            instant,
          }),
          signal,
        })

        if (!res.ok) return

        const contentType = res.headers.get('Content-Type') || 'audio/mpeg'
        const arr = await res.arrayBuffer()

        // Clean up previous audio
        if (currentAudioUrlRef.current) {
          URL.revokeObjectURL(currentAudioUrlRef.current)
          currentAudioUrlRef.current = null
        }
        const audio = audioRef.current
        if (audio) {
          audio.pause()
          audio.removeAttribute('src')
        }

        const blob = new Blob([arr], {type: contentType})
        const url = URL.createObjectURL(blob)
        currentAudioUrlRef.current = url

        if (audio) {
          audio.src = url
          audio.preload = 'auto'
          audio.volume = 1
          audio.muted = false

          audio.oncanplay = () => {
            void audio.play().catch(() => {
              // Autoplay may be blocked; ignore error
            })
          }

          const cleanupUrl = () => {
            if (currentAudioUrlRef.current === url) {
              URL.revokeObjectURL(url)
              currentAudioUrlRef.current = null
            }
          }

          audio.onended = cleanupUrl
          audio.onerror = cleanupUrl
        }
      } catch (error) {
        if ((error as {name?: string} | undefined)?.name !== 'AbortError') {
          console.error(error)
        }
      } finally {
        if (fetchAbortRef.current === controller) {
          fetchAbortRef.current = null
        }
      }
    },
    [voice, voiceProvider, instant, speechEnabled],
  )

  // Stop audio and abort in-flight TTS when speech is disabled
  useEffect(() => {
    if (!speechEnabled) {
      if (fetchAbortRef.current) {
        fetchAbortRef.current.abort()
        fetchAbortRef.current = null
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeAttribute('src')
      }
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current)
        currentAudioUrlRef.current = null
      }
    }
  }, [speechEnabled])

  // Hydrate from conversation store and on conversation change without replaying TTS
  useEffect(() => {
    // gate side-effects during conversation selection hydration.
    hydratingRef.current = true
    // create a conversation if none exists yet
    if (!currentId) {
      if (!bootstrapped) {
        hydratingRef.current = false
        return
      }
      const voiceName = voice?.name ?? 'Ellie'
      const name = assistantLabel(voiceName)
      createConversation(name)
      // lift hydrating gate even on early return so other effects resume
      hydratingRef.current = false
      return
    }
    ;(async () => {
      try {
        const saved = await loadConversationMessages(currentId)
        assistantTextRef.current = ''
        lastPlayedMessageIdRef.current = null
        startTransition(() => setMessages(saved))
        prevCountRef.current = saved.length
      } catch {
        // ignore
      } finally {
        hydratingRef.current = false
      }
    })()
  }, [
    currentId,
    bootstrapped,
    voice,
    assistantLabel,
    createConversation,
    loadConversationMessages,
    setMessages,
  ])

  // Play TTS when assistant message is complete
  useEffect(() => {
    if (!speechEnabled || hydratingRef.current) return

    // Find the latest assistant message
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === 'assistant')
    if (!lastAssistant) {
      assistantTextRef.current = ''
      lastPlayedMessageIdRef.current = null
      return
    }

    // Concatenate all text parts from the assistant message
    const fullText = extractTextFromParts(lastAssistant.parts)

    // Check if this is a new message we haven't played yet
    const isNewMessage = lastAssistant.id !== lastPlayedMessageIdRef.current
    const hasTextChanged = fullText !== assistantTextRef.current

    // Play TTS if it's a new message or if the text has changed significantly
    if (isNewMessage || (hasTextChanged && fullText.trim().length > 0)) {
      assistantTextRef.current = fullText

      // Only play when streaming is finished to avoid interrupting
      if (status !== 'streaming' && fullText.trim().length > 0) {
        lastPlayedMessageIdRef.current = lastAssistant.id
        void playAudio(fullText)
      }
    }
  }, [messages, status, speechEnabled, playAudio])

  // persist chat messages to current conversation
  useEffect(() => {
    if (hydratingRef.current) return
    if (status === 'streaming') return
    try {
      setCurrentMessages(messages)
    } catch {
      // ignore
    }
  }, [messages, setCurrentMessages, status])

  // Derive a conversation title from the first user message when a conversation starts
  useEffect(() => {
    if (!currentId || hydratingRef.current) return
    const prev = prevCountRef.current
    const curr = messages.length
    // If conversation had no messages before and now has some, derive a title
    if (prev === 0 && curr > 0) {
      const firstUser = messages.find((m) => m.role === 'user')
      if (firstUser) {
        const text = extractTextFromParts(firstUser.parts)
        const title = (text.trim().slice(0, 50) || 'New conversation').replace(
          /\s+/g,
          ' ',
        )
        try {
          renameConversation(currentId, title)
        } catch {
          // ignore
        }
      }
      // Cleanup on unmount to stop audio and free resources
      const audioEl = audioRef.current
      return () => {
        if (fetchAbortRef.current) {
          fetchAbortRef.current.abort()
          fetchAbortRef.current = null
        }
        if (audioEl) {
          audioEl.pause()
          audioEl.removeAttribute('src')
        }
        if (currentAudioUrlRef.current) {
          URL.revokeObjectURL(currentAudioUrlRef.current)
          currentAudioUrlRef.current = null
        }
      }
    }
    prevCountRef.current = curr
  }, [messages, currentId, renameConversation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (input.trim()) {
      if (isListening) stopListening()
      sendMessage(
        {text: input},
        {
          body: {
            model,
            webSearch,
            instructionsPreset,
            customInstructions,
          },
        },
      )
      setInput('')
    }
  }

  return (
    <Wrapper>
      <div className='max-w-4xl mx-auto p-6 relative size-full'>
        <div className='flex flex-col h-full'>
          <Conversation className='h-full'>
            <ConversationContent>
              {messages.map((message) => (
                <div key={message.id}>
                  {message.role === 'assistant' && (
                    <Sources>
                      <SourcesTrigger
                        count={
                          message.parts.filter(
                            (part) => part.type === 'source-url',
                          ).length
                        }
                      />
                      {message.parts
                        .filter((part) => part.type === 'source-url')
                        .map((part, i) => (
                          <SourcesContent key={`${message.id}-${i}`}>
                            <Source href={part.url} title={part.url} />
                          </SourcesContent>
                        ))}
                    </Sources>
                  )}
                  <Message from={message.role} key={message.id}>
                    <MessageContent>
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case 'text':
                            {
                              const extracted = extractLeadingReactions(part.text)
                              const cleanText = extracted.text
                              const reactions = extracted.reactions
                            return (
                              <div
                                key={`${message.id}-${i}`}
                                className='flex flex-col gap-2'>
                                {reactions.length > 0 && (
                                  <div className='flex flex-wrap gap-1.5'>
                                    {reactions.map((r, idx) => (
                                      <span
                                        key={`${message.id}-${i}-reaction-${idx}`}
                                        className='inline-flex items-center rounded-full border border-foreground/15 bg-background/40 px-2 py-0.5 text-[11px] leading-none text-foreground/70 shadow-xs transition-opacity duration-200 animate-in fade-in'
                                        aria-label={`Reaction: ${r}`}>
                                        {r}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {cleanText.trim().length > 0 && (
                                  <Response>{cleanText}</Response>
                                )}
                              </div>
                            )
                            }
                          case 'reasoning':
                            return (
                              <Reasoning
                                key={`${message.id}-${i}`}
                                className='w-full'
                                isStreaming={status === 'streaming'}>
                                <ReasoningTrigger />
                                <ReasoningContent>{part.text}</ReasoningContent>
                              </Reasoning>
                            )
                          default:
                            return null
                        }
                      })}
                    </MessageContent>
                  </Message>
                </div>
              ))}
              {status === 'submitted' && <Loader />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
          <PromptInput onSubmit={handleSubmit} className='mt-4'>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
              ref={textareaRef}
            />
            <PromptInputToolbar>
              <PromptInputTools>
                <PromptInputButton
                  aria-label={isListening ? 'Stop dictation' : 'Start dictation'}
                  disabled={!isSupported || status === 'streaming'}
                  onClick={() => {
                    if (isListening) stopListening()
                    else start()
                  }}>
                  {isListening ? (
                    <Square className='size-3.5' />
                  ) : (
                    <Mic className='size-3.5' />
                  )}
                </PromptInputButton>
                <SettingsPanelTrigger />
              </PromptInputTools>
              <PromptInputSubmit disabled={!input} status={status} />
            </PromptInputToolbar>
            {error && (
              <p className='px-4 pb-2 text-xs text-foreground/60'>{error}</p>
            )}
          </PromptInput>

          {/* Hidden audio element for queued playback */}
          <audio ref={audioRef} className='absolute opacity-0 w-0 h-0' />
        </div>
      </div>
    </Wrapper>
  )
}
