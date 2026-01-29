'use client'

import {Button} from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {cn} from '@/lib/utils'
import type {ChatStatus} from 'ai'
import {Loader2Icon, SendIcon, SquareIcon, XIcon} from 'lucide-react'
import type {ComponentProps, HTMLAttributes, KeyboardEventHandler} from 'react'
import {Children, forwardRef} from 'react'

export type PromptInputProps = HTMLAttributes<HTMLFormElement>

export const PromptInput = ({className, ...props}: PromptInputProps) => (
  <form
    className={cn(
      'sticky bottom-0 pt-4 md:pt-8 z-50 w-full divide-y overflow-hidden',
      className,
    )}
    {...props}>
    <div className='max-w-3xl mx-auto rounded-2xl pb-4 md:pb-8 px-4'>
      <div
        className={cn(
          'relative rounded-[1.25rem] bg-fade border-[0.33px] border-foreground/20 dark:border-foreground/15 transition-colors focus-within:shadow-xl focus-within:bg-fade/50 backdrop-blur-xl focus-within:border-foreground/10 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 [&:has(input:is(:disabled))_*]:pointer-events-none',
          'backdrop-blur-lg',
        )}>
        {props.children}
      </div>
    </div>
  </form>
)

export type PromptInputTextareaProps = ComponentProps<'textarea'> & {
  minHeight?: number
  maxHeight?: number
}

export const PromptInputTextarea = forwardRef<
  HTMLTextAreaElement,
  PromptInputTextareaProps
>(
  (
    {
      onChange,
      className,
      placeholder = 'Ask me anything',
      // minHeight = 48,
      // maxHeight = 164,
      ...props
    },
    ref,
  ) => {
  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter') {
      // Don't submit if IME composition is in progress
      if (e.nativeEvent.isComposing) {
        return
      }

      if (e.shiftKey) {
        // Allow newline
        return
      }

      // Submit on Enter (without Shift)
      e.preventDefault()
      const form = e.currentTarget.form
      if (form) {
        form.requestSubmit()
      }
    }
  }

  return (
    <textarea
      ref={ref}
      // className={cn(
      //   "w-full resize-none rounded-none border-none p-3 shadow-none outline-none ring-0",
      //   "field-sizing-content max-h-[6lh] bg-transparent dark:bg-transparent",
      //   "focus-visible:ring-0",
      //   className,
      // )}
      className={cn(
        'flex h-16 w-full bg-transparent px-4 py-3 leading-relaxed text-foreground placeholder:text-slate-500 dark:placeholder:text-zinc-400 font-light focus-visible:outline-none [resize:none] tracking-tight',
        // 'border-none flex h-16 w-full bg-transparent px-4 py-3 leading-relaxed text-foreground placeholder:text-foreground outline-0 ring-0 font-light focus-within:ring-0 focus-within:border-foreground focus-visible:outline-none [resize:none] tracking-tight',
        className,
      )}
      name='message'
      onChange={(e) => {
        onChange?.(e)
      }}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      {...props}
    />
  )
  },
)
PromptInputTextarea.displayName = 'PromptInputTextarea'

export type PromptInputToolbarProps = HTMLAttributes<HTMLDivElement>

export const PromptInputToolbar = ({
  className,
  ...props
}: PromptInputToolbarProps) => (
  <div
    className={cn(
      'flex items-center justify-between gap-2 pb-2.5 px-3',
      className,
    )}
    {...props}
  />
)

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>

export const PromptInputTools = ({
  className,
  ...props
}: PromptInputToolsProps) => (
  <div
    className={cn(
      'flex items-center gap-2.5',
      '[&_button:first-child]:rounded-bl-xl',
      className,
    )}
    {...props}>
    <div className='flex items-center justify-between gap-2 pb-2.5 px-3'>
      {/* Left buttons */}
      <div className='flex items-center gap-2.5'>{props.children}</div>
    </div>
  </div>
)

export type PromptInputButtonProps = ComponentProps<typeof Button>

export const PromptInputButton = ({
  variant = 'ghost',
  className,
  size,
  ...props
}: PromptInputButtonProps) => {
  const newSize =
    (size ?? Children.count(props.children) > 1) ? 'default' : 'icon'

  return (
    <Button
      size={newSize}
      type='button'
      variant={variant}
      {...props}
      className={cn(
        'rounded-md bg-background h-9 w-fit border-[0.5px] border-foreground/40 text-foreground hover:border-foreground/40 hover:shadow-xs transition-[box-shadow]',
        className,
      )}>
      {props.children}
    </Button>
  )
}

export type PromptInputSubmitProps = ComponentProps<typeof Button> & {
  status?: ChatStatus
}

export const PromptInputSubmit = ({
  className,
  variant = 'default',
  size = 'icon',
  status,
  children,
  ...props
}: PromptInputSubmitProps) => {
  let Icn = <SendIcon className='size-4' />

  if (status === 'submitted') {
    Icn = <Loader2Icon className='size-4 animate-spin' />
  } else if (status === 'streaming') {
    Icn = <SquareIcon className='size-4' />
  } else if (status === 'error') {
    Icn = <XIcon className='size-4' />
  }

  return (
    <Button
      className={cn(
        'rounded-lg size-8 border-[0.8px] border-foreground/15 hover:border-foreground/25 text-foreground hover:shadow-sm transition-all',
        'bg-fade hover:bg-fade/70 dark:bg-background/50',
        'relative after:rounded-[inherit] after:absolute after:inset-0 after:shadow-[0_0_1px_0_rgb(0_0_0/.05),inset_0.2px_0.3px_0.0px_0.0_rgb(255_255_255/.20)] after:pointer-events-none',
        'active:scale-95',
        className,
      )}
      size={size}
      type='submit'
      variant={variant}
      {...props}>
      {children ?? Icn}
    </Button>
  )
}

export type PromptInputModelSelectProps = ComponentProps<typeof Select>

export const PromptInputModelSelect = (props: PromptInputModelSelectProps) => (
  <Select {...props} />
)

export type PromptInputModelSelectTriggerProps = ComponentProps<
  typeof SelectTrigger
>

export const PromptInputModelSelectTrigger = ({
  className,
  ...props
}: PromptInputModelSelectTriggerProps) => (
  <SelectTrigger
    className={cn(
      'border-none bg-transparent font-medium text-muted-foreground shadow-none transition-colors',
      'hover:bg-accent hover:text-foreground [&[aria-expanded="true"]]:bg-accent [&[aria-expanded="true"]]:text-foreground',
      className,
    )}
    {...props}
  />
)

export type PromptInputModelSelectContentProps = ComponentProps<
  typeof SelectContent
>

export const PromptInputModelSelectContent = ({
  className,
  ...props
}: PromptInputModelSelectContentProps) => (
  <SelectContent className={cn(className)} {...props} />
)

export type PromptInputModelSelectItemProps = ComponentProps<typeof SelectItem>

export const PromptInputModelSelectItem = ({
  className,
  ...props
}: PromptInputModelSelectItemProps) => (
  <SelectItem className={cn(className)} {...props} />
)

export type PromptInputModelSelectValueProps = ComponentProps<
  typeof SelectValue
>

export const PromptInputModelSelectValue = ({
  className,
  ...props
}: PromptInputModelSelectValueProps) => (
  <SelectValue className={cn(className)} {...props} />
)
