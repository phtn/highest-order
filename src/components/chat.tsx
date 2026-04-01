'use client'

import {
  SettingsPanelTrigger,
  useSettingsPanel,
} from '@/components/settings-panel'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
} from '@/components/ui/breadcrumb'
import {Button} from '@/components/ui/button'
import type {EviMessage} from '@/hooks/use-evi-voice'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Square} from 'lucide-react'
import {useEffect, useRef} from 'react'
import {ChatMessage} from './chat-message'

export type ChatEviProps = {
  eviMessages: EviMessage[]
  isEviActive: boolean
  isEviConnecting: boolean
  eviError: string | null
  micPermission: import('@/hooks/use-evi-voice').MicPermissionStatus
  onEviToggle: () => void
}

type ChatProps = {
  evi?: ChatEviProps
  configError?: string | null
  isConfigLoading?: boolean
}

export default function Chat({
  evi,
  configError = null,
  isConfigLoading = false,
}: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const {state} = useSettingsPanel()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }, [state, evi?.eviMessages])

  return (
    <div className='flex size-full min-h-0 min-w-0 flex-1 flex-col'>
      {/* Header */}
      <div className='shrink-0 bg-background before:absolute before:inset-x-0 before:bottom-0 before:h-[0.5px] before:bg-linear-to-r before:from-foreground/15 before:via-foreground/10 before:to-foreground/15 relative z-20'>
        <div className='py-5 px-4 md:px-6 lg:px-6 flex bg-fade/30 items-center justify-between gap-2'>
          <Breadcrumb>
            <BreadcrumbList className='sm:gap-1.5'>
              <BreadcrumbItem>
                <p className='text-foreground/55 font-light tracking-wider text-base'>
                  EVI
                </p>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div
            className={cn(
              'flex items-center gap-2 -my-2 -me-2',
              'transition-transform duration-200 translate-x-0 ease-in',
              {
                '-translate-x-10': state === 'collapsed',
              },
            )}>
            <Button
              variant='ghost'
              className='text-base font-light tracking-tight text-foreground'>
              <span className='max-sm:sr-only'>Start</span>
            </Button>
            <SettingsPanelTrigger />
          </div>
        </div>
      </div>
      {/* Chat - scrollable messages */}
      <div className='min-h-0 flex-1 overflow-y-auto'>
        <div className='max-w-3xl mx-auto mt-6 space-y-6 portrait:px-4'>
          <div className='text-center my-8'>
            <div className='inline-flex items-center rounded-full border border-foreground/20 shadow-xs text-xs font-medium py-1.5 px-3 text-foreground/80 dark:bg-background bg-white'>
              <Icon
                name='px-clock'
                className='me-1.5 text-foreground/50 -ms-1'
              />
              Today
            </div>
          </div>
          {evi && evi.eviMessages.length > 0 ? (
            evi.eviMessages
              .filter((m) => !m.interim)
              .map((m) => (
                <ChatMessage key={m.id} isUser={m.role === 'user'}>
                  <p>{m.content}</p>
                </ChatMessage>
              ))
          ) : evi ? (
            <div className='flex flex-col items-center justify-center py-16 gap-4'>
              {configError && (
                <p className='max-w-md text-center text-foreground/55 text-sm'>
                  {configError}
                </p>
              )}
              <Button
                variant='ghost'
                size='lg'
                onClick={evi.onEviToggle}
                disabled={
                  isConfigLoading || evi.isEviActive || evi.isEviConnecting
                }
                className='rounded-full bg-radial _via-indigo-300/20 from-slate-300/50 to-indigo-200/40'>
                {isConfigLoading
                  ? 'Loading voice…'
                  : configError
                    ? 'Retry voice'
                    : 'O'}
              </Button>
            </div>
          ) : null}
          {evi?.eviError && (
            <p className='text-destructive text-sm px-4'>{evi.eviError}</p>
          )}
          <div ref={messagesEndRef} className='h-full flex flex-col' />
        </div>
      </div>
      {/* Footer - pinned to bottom */}
      <div className='shrink-0 pt-4 md:pt-8 z-50'>
        <div className='max-w-3xl mx-auto rounded-2xl pb-4 md:pb-8 px-4 '>
          <div className='relative rounded-[1.25rem] bg-vibe/5 border-[0.5px] dark:border-foreground/25 transition-colors focus-within:shadow-xl focus-within:bg-fade/40 backdrop-blur-xl focus-within:border-foreground/10 has-disabled:cursor-not-allowed has-disabled:opacity-50 [&:has(input:is(:disabled))_*]:pointer-events-none'>
            <textarea
              className='flex h-16 w-full bg-transparent px-4 py-3 leading-relaxed text-foreground placeholder:text-foreground/55 font-light focus-visible:outline-none resize-none tracking-tight'
              placeholder='Ask anything'
            />
            {/* Textarea buttons */}
            <div className='flex items-center justify-between gap-2 pb-2.5 px-3'>
              {/* Left buttons */}
              <div className='flex items-center gap-2.5'>
                <Button
                  size='icon'
                  variant='outline'
                  className={cn(
                    'rounded-lg size-8 border-[0.8px] border-foreground/15 hover:border-foreground/25 bg-background/90 hover:shadow-xs transition-shadow',
                  )}>
                  <Icon name='plus' className='text-foreground size-3.5' />
                  <span className='sr-only'>Attach</span>
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  disabled={isConfigLoading || evi?.isEviConnecting}
                  onClick={evi?.onEviToggle}
                  className={cn(
                    'rounded-lg size-8 border-[0.8px] hover:bg-background bg-background/90 hover:shadow-xs transition-shadow',
                    evi?.isEviActive
                      ? 'border-destructive/50 text-destructive hover:border-destructive'
                      : 'border-foreground/15 hover:border-foreground/25',
                  )}>
                  {evi?.isEviActive || evi?.isEviConnecting ? (
                    <Square className='text-foreground size-3.5' />
                  ) : (
                    <Icon name='voice' className='size-5' />
                  )}
                  <span className='sr-only'>
                    {evi?.isEviActive || evi?.isEviConnecting
                      ? 'Stop voice'
                      : 'Start voice'}
                  </span>
                </Button>
              </div>
              {/* Right buttons */}
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='icon'
                  className='rounded-2xl size-8 border-none hover:bg-background hover:shadow-md transition-shadow'>
                  <span className='sr-only'>Generate</span>
                </Button>
                <Button
                  className={cn(
                    'rounded-lg size-8 border-[0.8px] border-foreground/15 hover:border-foreground/25 text-foreground hover:shadow-sm transition-all',
                    'bg-fade hover:bg-fade/70 dark:bg-background/50',
                    'relative after:rounded-[inherit] after:absolute after:inset-0 after:shadow-[0_0_1px_0_rgb(0_0_0/.05),inset_0.2px_0.3px_0.0px_0.0_rgb(255_255_255/.20)] after:pointer-events-none',
                    'active:scale-95',
                  )}>
                  <Icon
                    name='px-arrow-up'
                    className='size-5 dark:text-vibe/70'
                  />
                </Button>
                {/*
                 */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
