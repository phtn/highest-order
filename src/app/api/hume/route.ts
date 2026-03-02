import {hume} from '@/lib/hume'
import type {VoiceProvider} from 'hume/api/resources/tts'
import {Readable} from 'stream'
import {NextRequest, NextResponse} from 'next/server'

export const runtime = 'nodejs'

type HumeTtsBody = {
  text: string
  voiceName?: string
  voiceProvider?: VoiceProvider
  instant?: boolean
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.HUME_API_KEY) {
      return NextResponse.json(
        {error: 'Hume API key not configured'},
        {status: 500},
      )
    }

    const body = (await req.json()) as HumeTtsBody
    const {
      text,
      voiceName = '',
      voiceProvider = 'HUME_AI',
      instant = false,
    } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        {error: 'Text is required'},
        {status: 400},
      )
    }

    const utterances = [
      {
        text: text.trim(),
        ...(voiceName && voiceProvider
          ? {
              voice: {name: voiceName, provider: voiceProvider} as const,
            }
          : {}),
      },
    ]

    const request = {
      format: {type: 'mp3' as const},
      numGenerations: 1,
      utterances,
      instantMode: instant,
    }

    const method = instant ? 'synthesizeFileStreaming' : 'synthesizeFile'
    const stream = (await hume.tts[method](request, {
      abortSignal: req.signal,
    })) as Readable
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    const audioBuffer = Buffer.concat(chunks)

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    if ((error as {name?: string})?.name === 'AbortError') {
      return new NextResponse(null, {status: 499})
    }
    console.error('[Hume TTS] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate speech',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500},
    )
  }
}
