export const OWNER_ID_KEY = 'app:owner-id:v2'

const parseUsers = (raw: string | undefined): string[] =>
  (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

export const ALLOWED_OWNER_IDS: ReadonlyArray<string> = parseUsers(
  process.env.NEXT_PUBLIC_USERS,
)

export const DEFAULT_OWNER_ID: string = ALLOWED_OWNER_IDS[0] ?? 'Cane'

export const isAllowedOwnerId = (value: string): boolean =>
  ALLOWED_OWNER_IDS.length === 0 ? true : ALLOWED_OWNER_IDS.includes(value)

export const getStoredOwnerId = (): string => {
  if (typeof window === 'undefined') return DEFAULT_OWNER_ID
  const raw = window.localStorage.getItem(OWNER_ID_KEY)
  if (raw && isAllowedOwnerId(raw)) return raw
  try {
    window.localStorage.setItem(OWNER_ID_KEY, DEFAULT_OWNER_ID)
  } catch {
    // ignore
  }
  return DEFAULT_OWNER_ID
}

export const setStoredOwnerId = (ownerId: string): void => {
  if (typeof window === 'undefined') return
  if (!isAllowedOwnerId(ownerId)) return
  try {
    window.localStorage.setItem(OWNER_ID_KEY, ownerId)
  } catch {
    // ignore
  }
}


