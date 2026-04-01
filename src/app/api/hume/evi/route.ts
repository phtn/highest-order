import {getEviConfig} from '@/lib/hume/get-evi-config'
import {NextResponse} from 'next/server'

export const runtime = 'nodejs'

/** Returns EVI config for client-side WebSocket connection. */
export async function GET() {
  try {
    const payload = await getEviConfig()
    return NextResponse.json(payload, {
      headers: {'Cache-Control': 'no-store'},
    })
  } catch (error) {
    console.error('[Hume EVI] Error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to get EVI config',
      },
      {status: 500},
    )
  }
}
