'use client'

import {useVoice} from '@humeai/voice-react'
import {useCallback, useMemo} from 'react'

export type MicPermissionStatus = 'prompt' | 'granted' | 'denied' | null

export type EviMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  interim?: boolean
}

type MessageLike = {type?: string; message?: {content?: string}; id?: string; interim?: boolean}

function toEviMessages(messages: MessageLike[]): EviMessage[] {
  const out: EviMessage[] = []
  for (const m of messages) {
    const type = m.type
    const msg = m.message
    const content = msg?.content
    if (!content || (type !== 'user_message' && type !== 'assistant_message'))
      continue
    out.push({
      id: (m.id ?? `${type}-${Date.now()}-${out.length}`) as string,
      role: type === 'user_message' ? 'user' : 'assistant',
      content,
      interim: 'interim' in m ? Boolean(m.interim) : false,
    })
  }
  return out
}

export function useEviVoice() {
  const voice = useVoice()
  const eviMessages = useMemo(
    () => toEviMessages(voice.messages as MessageLike[]),
    [voice.messages],
  )
  const isEviActive = voice.status.value === 'connected'
  const isEviConnecting = voice.status.value === 'connecting'
  const eviError =
    voice.status.value === 'error' && voice.status.reason
      ? voice.status.reason
      : voice.error
        ? voice.error.message
        : null

  const connect = useCallback(
    async (config: {configId: string; accessToken: string}) => {
      await voice.connect({
        auth: {type: 'accessToken', value: config.accessToken},
        configId: config.configId,
      })
    },
    [voice],
  )

  const toggle = useCallback(
    async (config: {configId: string; accessToken: string}) => {
      if (isEviActive || isEviConnecting) {
        await voice.disconnect()
      } else {
        await connect(config)
      }
    },
    [isEviActive, isEviConnecting, connect, voice],
  )

  return {
    eviMessages,
    isEviActive,
    isEviConnecting,
    eviError,
    connect,
    disconnect: voice.disconnect,
    toggle,
    micPermission: null as MicPermissionStatus,
  }
}
