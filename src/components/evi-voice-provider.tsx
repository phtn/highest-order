'use client'

import {VoiceProvider} from '@humeai/voice-react'

export type EviConfig = {configId: string; accessToken?: string}

type EviVoiceProviderProps = {
  onLogAction?: (msg: string) => void
  children: React.ReactNode
}

export function EviVoiceProvider({
  onLogAction,
  children,
}: EviVoiceProviderProps) {
  const log = onLogAction ?? (() => {})

  return (
    <VoiceProvider
      onError={(err) => {
        const msg = err.message ?? JSON.stringify(err)
        log(`EVI: error ${msg}`)
      }}
      onOpen={() => log('EVI: connected')}
      onClose={() => log('EVI: closed')}
      onMessage={(m) => {
        const type = 'type' in m ? String(m.type) : ''
        if (type === 'user_message' && 'message' in m && m.message) {
          const content = (m.message as {content?: string}).content
          if (content)
            log(
              `EVI: user_message "${content.slice(0, 50)}${content.length > 50 ? '…' : ''}"`,
            )
        } else if (
          type === 'assistant_message' &&
          'message' in m &&
          m.message
        ) {
          const content = (m.message as {content?: string}).content
          if (content)
            log(
              `EVI: assistant_message "${content.slice(0, 50)}${content.length > 50 ? '…' : ''}"`,
            )
        } else {
          log(`EVI: ${type}`)
        }
      }}>
      {children}
    </VoiceProvider>
  )
}
