'use client'

import {
  DEFAULT_OWNER_ID,
  getStoredOwnerId,
  isAllowedOwnerId,
  setStoredOwnerId,
} from '@/ctx/chat/owner'
import {create} from 'zustand'

type OwnerState = {
  ownerId: string
  setOwnerId: (ownerId: string) => void
}

export const useOwnerId = create<OwnerState>((set) => ({
  ownerId: getStoredOwnerId() || DEFAULT_OWNER_ID,
  setOwnerId: (ownerId: string) => {
    if (!isAllowedOwnerId(ownerId)) return
    setStoredOwnerId(ownerId)
    set({ownerId})
  },
}))


