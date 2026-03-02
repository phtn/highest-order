import 'server-only'
import {fetchAccessToken} from 'hume'

export type EviConfig = {configId: string; accessToken?: string}

/**
 * Fetches EVI config (configId + accessToken) for client-side connection.
 * Requires HUME_API_KEY, HUME_SECRET_KEY, NEXT_PUBLIC_HUME_CONFIG_ID.
 */
export async function getEviConfig(): Promise<EviConfig> {
  const configId = process.env.NEXT_PUBLIC_HUME_CONFIG_ID
  const apiKey = process.env.HUME_API_KEY
  const secretKey = process.env.HUME_SECRET_KEY

  if (!configId || !apiKey) {
    throw new Error(
      'EVI config (NEXT_PUBLIC_HUME_CONFIG_ID, HUME_API_KEY) not configured',
    )
  }

  const payload: EviConfig = {configId}

  if (secretKey) {
    const token = await fetchAccessToken({apiKey, secretKey})
    payload.accessToken = token
  }

  return payload
}
