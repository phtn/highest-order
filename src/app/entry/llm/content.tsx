'use client'

import {AssistantMessageAudio} from '@/components/ai-elements/assistant-message-audio'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {Loader} from '@/components/ai-elements/loader'
import {
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import {Response} from '@/components/ai-elements/response'
import {SettingsPanelTrigger} from '@/components/settings-panel'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {useConversations} from '@/ctx/chat/conversations'
import {useChatSettings} from '@/ctx/chat/store'
import {useVoiceSettings} from '@/ctx/voice/store'
import {extractLeadingReactions} from '@/lib/chat/reactions'
import {useChat} from '@ai-sdk/react'
import {startTransition, SubmitEvent, useEffect, useRef, useState} from 'react'

import {Wrapper} from '@/components/wrapper'
import {useSpeechToText} from '@/hooks/use-speech-to-text'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'

type Part = {type: string; [key: string]: unknown}
type ChatPortrait = {
  label: string
  initials: string
  src: string
  fallbackClassName: string
}

const USER_PORTRAIT: ChatPortrait = {
  label: 'User',
  initials: 'XX',
  src: 'https://res.cloudinary.com/dx0heqhhe/image/upload/v1774905803/Screenshot_2026-03-31_at_5.21.44_AM_qvkbub.png',
  fallbackClassName:
    'bg-[linear-gradient(135deg,#4e433d_0%,#1e1b18_100%)] text-white',
}

const ASSISTANT_PORTRAITS: Record<string, ChatPortrait> = {
  nzhu: {
    label: 'Nicole',
    initials: 'NC',
    src: 'https://res.cloudinary.com/dx0heqhhe/image/upload/v1774905272/Screenshot_2026-03-31_at_5.11.57_AM_qfngtc.png',
    fallbackClassName:
      'bg-[linear-gradient(135deg,#8a98b7_0%,#56657f_100%)] text-white',
  },
  joss: {
    label: 'Joss',
    initials: 'JS',
    src: 'https://res.cloudinary.com/dx0heqhhe/image/upload/v1771173981/cale-pfp_x22wwp.png',
    fallbackClassName:
      'bg-[linear-gradient(135deg,#9d7b63_0%,#6e5441_100%)] text-white',
  },
  sakura: {
    label: 'Sakura',
    initials: 'SK',
    src: 'https://res.cloudinary.com/dx0heqhhe/image/upload/v1769860816/69052629_jswm67.webp',
    fallbackClassName:
      'bg-[linear-gradient(135deg,#c18492_0%,#8f5c68_100%)] text-white',
  },
  ellie: {
    label: 'Ellie',
    initials: 'EL',
    src: 'https://res.cloudinary.com/dx0heqhhe/image/upload/v1774905763/sleep_1_ctmhmd.png',
    fallbackClassName:
      'bg-[linear-gradient(135deg,#92a0bc_0%,#5d6a84_100%)] text-white',
  },
  moody: {
    label: 'Moody',
    initials: 'MD',
    src: 'https://res.cloudinary.com/dx0heqhhe/image/upload/v1774905763/sleep_1_ctmhmd.png',
    fallbackClassName:
      'bg-[linear-gradient(135deg,#767a89_0%,#474d5a_100%)] text-white',
  },
  kendall: {
    label: 'Kendall',
    initials: 'KD',
    src: 'https://res.cloudinary.com/dx0heqhhe/image/upload/v1774905448/kendall_stqnsw.jpg',
    fallbackClassName:
      'bg-[linear-gradient(135deg,#b98c62_0%,#6b513d_100%)] text-white',
  },
  natalie: {
    label: 'Natalie',
    initials: 'NT',
    src: 'https://res.cloudinary.com/dx0heqhhe/image/upload/v1774905430/natalie_w3qt8a.png',
    fallbackClassName:
      'bg-[linear-gradient(135deg,#c59a77_0%,#8a6242_100%)] text-white',
  },
}

const PREVIEW_MESSAGES = [
  {
    id: 'preview-team-updates',
    role: 'assistant' as const,
    text: 'Team updates flow seamlessly',
    portrait: ASSISTANT_PORTRAITS.ellie,
  },
  {
    id: 'preview-hi-everyone',
    role: 'user' as const,
    text: 'Hi everyone',
    portrait: USER_PORTRAIT,
  },
  {
    id: 'preview-how-about',
    role: 'assistant' as const,
    text: 'How about this instead?',
    portrait: ASSISTANT_PORTRAITS.kendall,
  },
] as const

const getAssistantPortrait = (alias: string) =>
  ASSISTANT_PORTRAITS[alias.toLowerCase()] ?? ASSISTANT_PORTRAITS.ellie

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

const ChatAvatar = ({portrait}: {portrait: ChatPortrait}) => (
  <Avatar
    className={cn(
      'size-10 md:size-36 shrink-0 bg-white/70 shadow-[0_18px_40px_-28px_rgba(15,15,15,0.9)] ring-2 ring-white/80',
      {'size-8 md:size-10': portrait.initials === 'XX'},
    )}>
    <AvatarImage
      alt={`${portrait.label} avatar`}
      className='object-cover'
      src={portrait.src}
    />
    <AvatarFallback
      className={cn(
        'text-[0.68rem] font-semibold tracking-[-0.06em] md:text-xs',
        portrait.fallbackClassName,
      )}>
      {portrait.initials}
    </AvatarFallback>
  </Avatar>
)

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
  const activeAssistant = getAssistantPortrait(voice)

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
      createConversation(activeAssistant.label)
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
    activeAssistant.label,
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

  const hasMessages = messages.length > 0

  return (
    <Wrapper>
      <div className='relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),transparent_42%),linear-gradient(180deg,#fcfaf7_0%,#f5efe8_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_38%),linear-gradient(180deg,#1a1a1f_0%,#0f1013_100%)]'>
        <div className='pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-white/60 to-transparent dark:from-white/6' />
        <Conversation className='min-h-0 flex-1 px-4 pt-6 md:px-8 md:pt-8'>
          <ConversationContent className='vt-conversation mx-auto flex max-w-5xl flex-col gap-8 p-0 pb-8 md:gap-10'>
            {hasMessages
              ? messages.map((message) => {
                  const isUser = message.role === 'user'
                  const portrait = isUser ? USER_PORTRAIT : activeAssistant
                  const messageText = extractTextFromParts(message.parts)

                  return (
                    <article
                      key={message.id}
                      className={cn(
                        'flex w-full items-end gap-3 md:gap-4 animate-enter',
                        isUser ? 'justify-end' : 'justify-start',
                      )}>
                      {!isUser && <ChatAvatar portrait={portrait} />}

                      <div
                        className={cn(
                          'flex max-w-[min(78vw,42rem)] flex-col gap-3',
                          isUser ? 'items-end' : 'items-start',
                        )}>
                        {message.parts.map((part, i) => {
                          if (isTextPart(part)) {
                            const extracted = extractLeadingReactions(part.text)
                            const cleanText = extracted.text
                            const reactions = extracted.reactions

                            if (cleanText.trim().length === 0) {
                              return reactions.length > 0 ? (
                                <div
                                  key={`${message.id}-${i}`}
                                  className={cn(
                                    'flex flex-wrap gap-1.5 px-2',
                                    isUser ? 'justify-end' : 'justify-start',
                                  )}>
                                  {reactions.map((reaction, idx) => (
                                    <span
                                      key={`${message.id}-${i}-reaction-${idx}`}
                                      aria-label={`Reaction: ${reaction}`}
                                      className={cn(
                                        'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium tracking-[-0.03em] shadow-[0_16px_30px_-24px_rgba(15,15,15,0.7)]',
                                        isUser
                                          ? 'bg-primary/12 text-primary'
                                          : 'bg-white/78 text-foreground/65',
                                      )}>
                                      {reaction}
                                    </span>
                                  ))}
                                </div>
                              ) : null
                            }

                            return (
                              <div
                                key={`${message.id}-${i}`}
                                className='flex flex-col gap-2'>
                                {reactions.length > 0 && (
                                  <div
                                    className={cn(
                                      'flex flex-wrap gap-1.5 px-2',
                                      isUser ? 'justify-end' : 'justify-start',
                                    )}>
                                    {reactions.map((reaction, idx) => (
                                      <span
                                        key={`${message.id}-${i}-reaction-${idx}`}
                                        aria-label={`Reaction: ${reaction}`}
                                        className={cn(
                                          'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[-0.03em] shadow-[0_16px_30px_-24px_rgba(15,15,15,0.7)]',
                                          isUser
                                            ? 'bg-primary/12 text-primary'
                                            : 'bg-white/10 dark:text-orange-300 text-pink-500',
                                        )}>
                                        {reaction}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <div
                                  className={cn(
                                    'overflow-hidden rounded-4xl px-5 py-4 shadow-[0_24px_60px_-42px_rgba(15,15,15,0.65)] backdrop-blur-xl md:px-6 md:py-4',
                                    isUser
                                      ? 'rounded-br-[1.3rem] bg-primary text-primary-foreground'
                                      : 'rounded-bl-[1.3rem] border border-foreground/6 bg-white/82 text-foreground dark:bg-white/8',
                                  )}>
                                  <Response
                                    className={cn(
                                      'w-full text-pretty',
                                      '[&_p]:m-0 [&_p]:text-sm md:[&_p]:text-base [&_p]:font-medium [&_p]:tracking-normal [&_p]:leading-5',
                                      '[&_a]:underline [&_a]:underline-offset-4',
                                      '[&_ul]:my-3 [&_ul]:ml-5 [&_ul]:list-disc [&_ol]:my-3 [&_ol]:ml-5 [&_li]:my-1',
                                      '[&_pre]:mt-3 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-[1.4rem] [&_pre]:border [&_pre]:border-foreground/10 [&_pre]:bg-black/90 [&_pre]:p-4 [&_pre]:text-sm',
                                      '[&_code:not(pre_*)]:rounded-md [&_code:not(pre_*)]:bg-black/6 [&_code:not(pre_*)]:px-1.5 [&_code:not(pre_*)]:py-0.5 [&_code:not(pre_*)]:text-[0.9em]',
                                      isUser &&
                                        '[&_code:not(pre_*)]:bg-white/14 [&_pre]:border-white/10',
                                    )}>
                                    {cleanText}
                                  </Response>
                                </div>
                              </div>
                            )
                          }

                          if (isReasoningPart(part)) {
                            return (
                              <Reasoning
                                key={`${message.id}-${i}`}
                                className={cn(
                                  'mb-0 w-full rounded-[1.65rem] border px-4 py-3 shadow-[0_24px_60px_-42px_rgba(15,15,15,0.65)] backdrop-blur-xl',
                                  isUser
                                    ? 'border-primary/12 bg-primary/8'
                                    : 'border-foreground/6 bg-white/64 dark:bg-white/8',
                                )}
                                isStreaming={status === 'streaming'}>
                                <ReasoningTrigger className='text-xs font-medium tracking-[-0.03em] text-foreground/60' />
                                <ReasoningContent className='mt-3 text-sm text-foreground/80'>
                                  {part.text}
                                </ReasoningContent>
                              </Reasoning>
                            )
                          }

                          return null
                        })}

                        {message.role === 'assistant' &&
                          messageText.trim().length > 0 && (
                            <div className='px-1 h-8'>
                              <AssistantMessageAudio
                                conversationId={currentId || 'default'}
                                messageId={message.id}
                                text={messageText}
                                voice={voice}
                                autoplay={autoplayMessageId === message.id}
                                isLastMessage={
                                  latestAssistantMessageId === message.id
                                }
                              />
                            </div>
                          )}
                      </div>

                      {isUser && <ChatAvatar portrait={portrait} />}
                    </article>
                  )
                })
              : PREVIEW_MESSAGES.map((message) => {
                  const isUser = message.role === 'user'

                  return (
                    <article
                      key={message.id}
                      className={cn(
                        'hidden _flex w-full items-end gap-3 md:gap-4 animate-enter',
                        isUser ? 'justify-end' : 'justify-start',
                      )}>
                      {!isUser && <ChatAvatar portrait={message.portrait} />}

                      <div
                        className={cn(
                          'max-w-[min(78vw,36rem)] rounded-4xl px-5 py-4 shadow-[0_24px_60px_-42px_rgba(15,15,15,0.65)] md:px-6 md:py-4',
                          isUser
                            ? 'rounded-br-[1.3rem] bg-primary text-primary-foreground'
                            : 'rounded-bl-[1.3rem] border border-foreground/6 bg-white/82 text-foreground dark:bg-white/8',
                        )}>
                        <p className='m-0 text-[clamp(1em,0.54rem+0.95vw,1.25rem)] leading-[1.12] font-medium tracking-[-0.05em]'>
                          {message.text}
                        </p>
                      </div>

                      {isUser && <ChatAvatar portrait={message.portrait} />}
                    </article>
                  )
                })}

            {status === 'submitted' && (
              <article className='flex w-full items-end gap-3 md:gap-4 animate-enter'>
                <ChatAvatar portrait={activeAssistant} />
                <div className='rounded-4xl rounded-bl-[1.3rem] border border-foreground/6 bg-white/82 px-5 py-4 text-foreground/70 shadow-[0_24px_60px_-42px_rgba(15,15,15,0.65)] backdrop-blur-xl dark:bg-white/8'>
                  <Loader size={18} />
                </div>
              </article>
            )}
          </ConversationContent>
          <ConversationScrollButton className='border border-foreground/8 bg-white/92 text-foreground shadow-[0_18px_40px_-24px_rgba(15,15,15,0.35)] backdrop-blur-xl hover:bg-white dark:bg-black/50 dark:hover:bg-black/60' />
        </Conversation>

        <form
          onSubmit={handleSubmit}
          className='relative px-4 pb-6 pt-2 md:px-8 md:pb-8'>
          <div className='mx-auto flex max-w-4xl items-center gap-3 md:gap-4'>
            <div className='shrink-0 md:hidden'>
              <SettingsPanelTrigger />
            </div>

            <div className='flex-1 rounded-full border border-foreground/10 bg-white/95 px-5 shadow-[0_26px_70px_-42px_rgba(15,15,15,0.55)] backdrop-blur-xl dark:bg-black/40'>
              <PromptInputTextarea
                onChange={(e) => setInput(e.target.value)}
                value={input}
                ref={textareaRef}
                rows={1}
                placeholder={
                  hasMessages ? 'Write a message' : 'Great work, everyone!'
                }
                className='h-16 min-h-16 bg-transparent px-0 py-4 text-[clamp(1rem,0.84rem+0.95vw,1.75rem)] font-medium leading-[1.1] tracking-[-0.05em] placeholder:text-foreground/35'
              />
            </div>

            <PromptInputSubmit
              type={input.trim() ? 'submit' : 'button'}
              variant='ghost'
              className='size-16 rounded-full border-none bg-primary text-primary-foreground shadow-[0_26px_60px_-30px_rgba(15,15,15,0.8)] hover:bg-primary/95'
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
                <Icon name='px-arrow-up' className='size-6' />
              ) : (
                <Icon
                  name={isListening ? 'spinners-voice' : 'voice'}
                  className='size-5'
                />
              )}
            </PromptInputSubmit>
          </div>

          {error && (
            <p className='mx-auto mt-3 max-w-4xl px-2 text-xs text-foreground/60'>
              {error}
            </p>
          )}
        </form>
      </div>
    </Wrapper>
  )
}
