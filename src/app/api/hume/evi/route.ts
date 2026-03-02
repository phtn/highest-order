import {fetchAccessToken} from 'hume'
import {NextResponse} from 'next/server'

export const runtime = 'nodejs'

/** Returns EVI config for client-side WebSocket connection. */
export async function GET() {
  try {
    const configId = process.env.NEXT_PUBLIC_HUME_CONFIG_ID
    const apiKey = process.env.HUME_API_KEY
    const secretKey = process.env.HUME_SECRET_KEY

    if (!configId || !apiKey) {
      return NextResponse.json(
        {error: 'EVI config (NEXT_PUBLIC_HUME_CONFIG_ID, HUME_API_KEY) not configured'},
        {status: 500},
      )
    }

    const payload: {configId: string; accessToken?: string} = {configId}

    // If secret key is set, fetch a short-lived token for secure client auth
    if (secretKey) {
      try {
        const token = await fetchAccessToken({apiKey, secretKey})
        payload.accessToken = token
      } catch (err) {
        console.error('[Hume EVI] Token fetch failed:', err)
        return NextResponse.json(
          {error: 'Failed to obtain EVI access token'},
          {status: 500},
        )
      }
    }

    return NextResponse.json(payload, {
      headers: {'Cache-Control': 'no-store'},
    })
  } catch (error) {
    console.error('[Hume EVI] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get EVI config',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500},
    )
  }
}
