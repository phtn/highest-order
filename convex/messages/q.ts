import {v} from 'convex/values'
import {query} from '../_generated/server'

// Check if two users are connected (either follows the other)
export const areConnected = query({
  args: {
    assistantId: v.string(), // Second user's proId (Firebase UID)
  },
  handler: async (ctx, {assistantId}) => {
    // Get both users by proId
    const user = 'user'

    const assistant = await ctx.db
      .query('assistants')
      .withIndex('by_assistantId', (q) => q.eq('assistantId', assistantId))
      .first()

    if (!user || !assistant) {
      return false
    }
    return true

    // Users are connected if either follows the other
  },
})

// Search conversations and users
export const searchConversations = query({
  args: {
    userProId: v.string(), // Current user's proId (Firebase UID)
    searchQuery: v.string(), // Search term
  },
  handler: async (ctx, args) => {
    if (!args.searchQuery.trim()) {
      return []
    }

    const searchLower = args.searchQuery.toLowerCase().trim()

    // Get the user by proId
    const user = 'user'

    // Get all connected user IDs
    // Get conversations with matching messages
    const sentMessages = await ctx.db
      .query('messages')
      .withIndex('by_sender', (q) => q.eq('senderId', user))
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    const receivedMessages = await ctx.db
      .query('messages')
      .withIndex('by_receiver', (q) => q.eq('receiverId', user))
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    const allMessages = [...sentMessages, ...receivedMessages]
    const matchingMessageUserIds = new Set<string>()

    for (const message of allMessages) {
      if (message.content.toLowerCase().includes(searchLower)) {
        if (message.senderId === user) {
          matchingMessageUserIds.add(message.receiverId as string)
        } else {
          matchingMessageUserIds.add(message.senderId as string)
        }
      }
    }
  },
})

// Get messages between two users
export const getMessages = query({
  args: {
    user: v.string(), // Current user's proId (Firebase UID)
    assistantId: v.string(), // Other user's proId (Firebase UID)
  },
  handler: async (ctx, args) => {
    // Get both users by proId
    const currentUser = 'user'

    const otherUser = await ctx.db
      .query('assistants')
      .withIndex('by_assistantId', (q) => q.eq('assistantId', args.assistantId))
      .first()

    if (!currentUser || !otherUser) {
      return []
    }

    // Get messages where current user is sender and other user is receiver
    const sentMessages = await ctx.db
      .query('messages')
      .withIndex('by_sender_receiver', (q) =>
        q.eq('senderId', 'user').eq('receiverId', otherUser._id),
      )
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    // Get messages where other user is sender and current user is receiver
    const receivedMessages = await ctx.db
      .query('messages')
      .withIndex('by_sender_receiver', (q) =>
        q.eq('senderId', otherUser._id).eq('receiverId', 'user'),
      )
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    // Combine and sort by creation time
    const allMessages = [...sentMessages, ...receivedMessages]
    allMessages.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )

    // Get storage URLs for attachments
    const messagesWithUrls = await Promise.all(
      allMessages.map(async (message) => {
        if (message.attachments && message.attachments.length > 0) {
          const attachmentsWithUrls = await Promise.all(
            message.attachments.map(async (attachment) => {
              const url = await ctx.storage.getUrl(attachment.storageId)
              return {
                ...attachment,
                url,
              }
            }),
          )
          return {
            ...message,
            attachments: attachmentsWithUrls,
          }
        }
        return message
      }),
    )

    return messagesWithUrls
  },
})
