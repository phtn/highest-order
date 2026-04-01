import {fetchAccessToken} from 'hume'
import 'server-only'

export type EviConfig = {configId: string; accessToken: string}

/**
 * Fetches EVI config (configId + accessToken) for client-side connection.
 * Requires HUME_API_KEY, HUME_SECRET_KEY, NEXT_PUBLIC_HUME_CONFIG_ID.
 */
export async function getEviConfig(): Promise<EviConfig> {
  const configId = process.env.HUME_CONFIG_ID
  const apiKey = process.env.HUME_API_KEY
  const secretKey = process.env.HUME_SECRET_KEY

  if (!configId || !apiKey || !secretKey) {
    throw new Error(
      'EVI not configured. Set HUME_API_KEY, HUME_SECRET_KEY, and NEXT_PUBLIC_HUME_CONFIG_ID.',
    )
  }

  const accessToken = await fetchAccessToken({apiKey, secretKey})

  return {configId, accessToken}
}
