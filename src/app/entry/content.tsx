'use client'

import Chat from '@/components/chat'
import {EviVoiceProvider} from '@/components/evi-voice-provider'
import {Wrapper} from '@/components/wrapper'
import {useEviDebug} from '@/ctx/evi-debug'
import {useEviVoice} from '@/hooks/use-evi-voice'

type EviConfig = {configId: string; accessToken?: string} | null

function EviChatInner({
  config,
}: {
  config: {configId: string; accessToken: string}
}) {
  const evi = useEviVoice()
  return (
    <Chat
      evi={{
        eviMessages: evi.eviMessages,
        isEviActive: evi.isEviActive,
        isEviConnecting: evi.isEviConnecting,
        eviError: evi.eviError,
        micPermission: evi.micPermission,
        onEviToggle: () => void evi.toggle(config),
      }}
      configError={false}
    />
  )
}

export const Content = ({config}: {config: EviConfig}) => {
  const {log} = useEviDebug()
  const hasToken = Boolean(config?.accessToken)

  if (hasToken) {
    return (
      <Wrapper>
        <EviVoiceProvider onLogAction={log}>
          <EviChatInner
            config={config as {configId: string; accessToken: string}}
          />
        </EviVoiceProvider>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <Chat evi={undefined} configError={true} />
    </Wrapper>
  )
}
