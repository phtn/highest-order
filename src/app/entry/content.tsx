'use client'

import Chat from '@/components/chat'
import {EviVoiceProvider} from '@/components/evi-voice-provider'
import {Wrapper} from '@/components/wrapper'
import {useEviDebug} from '@/ctx/evi-debug'
import {useEviVoice} from '@/hooks/use-evi-voice'
import {useCallback, useEffect, useState} from 'react'

type EviConfig = {configId: string; accessToken: string}

const isEviConfig = (value: unknown): value is EviConfig => {
  if (typeof value !== 'object' || value === null) return false
  if (!('configId' in value) || !('accessToken' in value)) return false
  return (
    typeof (value as {configId?: unknown}).configId === 'string' &&
    typeof (value as {accessToken?: unknown}).accessToken === 'string'
  )
}

const isErrorResponse = (value: unknown): value is {error: string} => {
  if (typeof value !== 'object' || value === null) return false
  if (!('error' in value)) return false
  return typeof (value as {error?: unknown}).error === 'string'
}

const fetchEviConfig = async (signal?: AbortSignal): Promise<EviConfig> => {
  const res = await fetch('/api/hume/evi', {
    cache: 'no-store',
    signal,
  })
  const payload: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    if (isErrorResponse(payload)) throw new Error(payload.error)
    throw new Error(`Failed to load Hume EVI config (${res.status})`)
  }

  if (!isEviConfig(payload)) {
    throw new Error('Malformed Hume EVI config response')
  }

  return payload
}

function EviChatInner({
  configError,
  isConfigLoading,
  loadConfig,
}: {
  configError: string | null
  isConfigLoading: boolean
  loadConfig: () => Promise<EviConfig | null>
}) {
  const evi = useEviVoice()

  const handleToggle = useCallback(async () => {
    if (evi.isEviActive || evi.isEviConnecting) {
      await evi.disconnect()
      return
    }

    const config = await loadConfig()
    if (!config) return

    await evi.connect(config)
  }, [evi, loadConfig])

  return (
    <Chat
      evi={{
        eviMessages: evi.eviMessages,
        isEviActive: evi.isEviActive,
        isEviConnecting: evi.isEviConnecting,
        eviError: evi.eviError,
        micPermission: evi.micPermission,
        onEviToggle: () => void handleToggle(),
      }}
      configError={configError}
      isConfigLoading={isConfigLoading}
    />
  )
}

export const Content = () => {
  const {log} = useEviDebug()
  const [configError, setConfigError] = useState<string | null>(null)
  const [isConfigLoading, setIsConfigLoading] = useState(true)

  const loadConfig = useCallback(
    async (signal?: AbortSignal): Promise<EviConfig | null> => {
      setIsConfigLoading(true)
      setConfigError(null)

      try {
        return await fetchEviConfig(signal)
      } catch (error) {
        if (signal?.aborted) return null
        setConfigError(
          error instanceof Error ? error.message : 'Failed to load EVI config',
        )
        return null
      } finally {
        if (!signal?.aborted) setIsConfigLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    const controller = new AbortController()
    void loadConfig(controller.signal)
    return () => controller.abort()
  }, [loadConfig])

  return (
    <Wrapper>
      <EviVoiceProvider onLogAction={log}>
        <EviChatInner
          configError={configError}
          isConfigLoading={isConfigLoading}
          loadConfig={() => loadConfig()}
        />
      </EviVoiceProvider>
    </Wrapper>
  )
}
