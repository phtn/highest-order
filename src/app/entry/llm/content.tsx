'use client'

import {AssistantMessageAudio} from '@/components/ai-elements/assistant-message-audio'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {Loader} from '@/components/ai-elements/loader'
import {Message, MessageContent} from '@/components/ai-elements/message'
import {
  PromptInput,
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
import {SettingsPanelTrigger} from '@/components/settings-panel'
import {useConversations} from '@/ctx/chat/conversations'
import {useChatSettings} from '@/ctx/chat/store'
import {useVoiceSettings} from '@/ctx/voice/store'
import {extractLeadingReactions} from '@/lib/chat/reactions'
import {useChat} from '@ai-sdk/react'
import {
  startTransition,
  SubmitEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {Wrapper} from '@/components/wrapper'
import {useSpeechToText} from '@/hooks/use-speech-to-text'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'

type Part = {type: string; [key: string]: unknown}

const isPart = (p: unknown): p is Part =>
  typeof p === 'object' && p !== null && 'type' in p

const isTextPart = (p: unknown): p is Part & {type: 'text'; text: string} =>
  isPart(p) &&
  p.type === 'text' &&
  typeof (p as {text?: unknown}).text === 'string'

const isReasoningPart = (
  p: unknown,
): p is Part & {type: 'reasoning'; text: string} =>
  isPart(p) &&
  p.type === 'reasoning' &&
  typeof (p as {text?: unknown}).text === 'string'

export const Content = () => {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const {
    model,
    webSearch,
    speechEnabled,
    instructionsPreset,
    customInstructions,
  } = useChatSettings()
  const {voice} = useVoiceSettings()
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

  const assistantLabel = useCallback((alias: string) => {
    switch (alias.toLowerCase()) {
      case 'nzhu':
        return 'Nicole'
      case 'joss':
        return 'Joss'
      case 'sakura':
        return 'Sakura'
      case 'ellie':
        return 'Ellie'
      case 'moody':
        return 'Moody'
      case 'kendall':
        return 'Kendall'
      case 'natalie':
        return 'Natalie'
      default:
        return 'Ellie'
    }
  }, [])

  const extractTextFromParts = (parts: ReadonlyArray<unknown>) => {
    let text = ''
    for (const p of parts) {
      if (isTextPart(p)) {
        text += extractLeadingReactions(p.text).text
      }
    }
    return text
  }

  const hydratingRef = useRef<boolean>(true)
  const prevCountRef = useRef<number>(0)
  const persistTimerRef = useRef<number | null>(null)
  const [autoplayMessageId, setAutoplayMessageId] = useState<string | null>(
    null,
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (persistTimerRef.current) {
        window.clearTimeout(persistTimerRef.current)
        persistTimerRef.current = null
      }
    }
  }, [])

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
      const name = assistantLabel(voice)
      createConversation(name)
      // lift hydrating gate even on early return so other effects resume
      hydratingRef.current = false
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const saved = await loadConversationMessages(currentId)
        if (cancelled) return
        startTransition(() => {
          setAutoplayMessageId(null)
          setMessages(saved as Parameters<typeof setMessages>[0])
        })
        prevCountRef.current = saved.length
      } catch {
        // ignore
      } finally {
        if (!cancelled) hydratingRef.current = false
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    currentId,
    bootstrapped,
    voice,
    assistantLabel,
    createConversation,
    loadConversationMessages,
    setMessages,
  ])

  // Mark the latest assistant message for autoplay when streaming is finished.
  useEffect(() => {
    if (!speechEnabled || hydratingRef.current) return
    if (status === 'streaming') return
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === 'assistant')
    if (!lastAssistant) return
    const fullText = extractTextFromParts(lastAssistant.parts)
    if (fullText.trim().length === 0) return
    startTransition(() => setAutoplayMessageId(lastAssistant.id))
  }, [messages, status, speechEnabled])

  // persist chat messages to current conversation
  useEffect(() => {
    if (hydratingRef.current) return
    // Avoid spamming persistence while streaming; we'll save when it settles.
    if (status === 'streaming') return
    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current)
      persistTimerRef.current = null
    }
    persistTimerRef.current = window.setTimeout(() => {
      try {
        setCurrentMessages(messages)
      } catch {
        // ignore
      }
    }, 350)
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
    }
    prevCountRef.current = curr
  }, [messages, currentId, renameConversation])

  const handleSubmit = async (e: SubmitEvent) => {
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

  const {
    isSupported,
    isListening,
    error,
    start,
    stop: stopListening,
  } = useSpeechToText({
    onFinal: (text) => {
      startTransition(() => {
        setInput((prev) => {
          const next = prev.trimEnd()
          return next.length > 0 ? `${next} ${text}` : text
        })
      })
      // re-focus the textarea after speech inserts text
      requestAnimationFrame(() => textareaRef.current?.focus())
    },
  })

  useEffect(() => {
    console.log('status:', status, `& ${isSupported}`)
  }, [isSupported, status])

  let latestAssistantMessageId: string | null = null
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === 'assistant') {
      latestAssistantMessageId = messages[i].id
      break
    }
  }

  return (
    <Wrapper>
      <div className='max-w-6xl mx-auto p-6 relative size-full'>
        <div className='flex flex-col h-full'>
          <Conversation className='h-full'>
            <ConversationContent className='vt-conversation'>
              {messages.map((message) => (
                <div key={message.id}>
                  <Message from={message.role}>
                    <MessageContent>
                      {message.parts.map((part, i) => {
                        if (isTextPart(part)) {
                          const extracted = extractLeadingReactions(part.text)
                          const cleanText = extracted.text
                          const reactions = extracted.reactions
                          return (
                            <div
                              key={`${message.id}-${i}`}
                              className={cn(
                                'px-4 pt-3 pb-2 flex flex-col gap-2',
                                {'py-3': message.role === 'user'},
                              )}>
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
                        if (isReasoningPart(part)) {
                          return (
                            <Reasoning
                              key={`${message.id}-${i}`}
                              className='w-full'
                              isStreaming={status === 'streaming'}>
                              <ReasoningTrigger />
                              <ReasoningContent>{part.text}</ReasoningContent>
                            </Reasoning>
                          )
                        }
                        return null
                      })}
                      {message.role === 'assistant' &&
                        (extractTextFromParts(message.parts).trim().length >
                        0 ? (
                          <AssistantMessageAudio
                            conversationId={currentId || 'default'}
                            messageId={message.id}
                            text={extractTextFromParts(message.parts)}
                            voice={voice}
                            autoplay={autoplayMessageId === message.id}
                            isLastMessage={
                              latestAssistantMessageId === message.id
                            }
                          />
                        ) : null)}
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
                <SettingsPanelTrigger />
              </PromptInputTools>
              <PromptInputSubmit
                type={input.trim() ? 'submit' : 'button'}
                disabled={
                  input.trim()
                    ? status === 'streaming'
                    : !isSupported || status === 'streaming'
                }
                aria-label={
                  input.trim()
                    ? 'Send message'
                    : isListening
                      ? 'Stop dictation'
                      : 'Start dictation'
                }
                onClick={
                  input.trim()
                    ? undefined
                    : () => {
                        if (isListening) stopListening()
                        else start()
                      }
                }
                status={status}>
                {input.trim() ? (
                  <Icon name='px-arrow-up' className='size-5' />
                ) : (
                  <Icon
                    name={isListening ? 'spinners-voice' : 'voice'}
                    className='size-5'
                  />
                )}
              </PromptInputSubmit>
            </PromptInputToolbar>
            {error && (
              <p className='px-4 pb-2 text-xs text-foreground/60'>{error}</p>
            )}
          </PromptInput>
        </div>
      </div>
    </Wrapper>
  )
}
