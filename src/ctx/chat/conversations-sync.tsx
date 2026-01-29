'use client'

import {useConversations} from '@/ctx/chat/conversations'
import {useOwnerId} from '@/ctx/chat/owner-store'
import {useConvex} from 'convex/react'
import {useEffect} from 'react'

export const ConversationsSync = () => {
  const convex = useConvex()
  const {ownerId} = useOwnerId()
  const {connectConvex, bootstrapFromConvex} = useConversations()

  useEffect(() => {
    connectConvex(convex, ownerId)
    void bootstrapFromConvex()
  }, [convex, ownerId, connectConvex, bootstrapFromConvex])

  return null
}


