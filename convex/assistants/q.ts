import {v} from 'convex/values'
import {query} from '../_generated/server'

/**
 * Get all messages between the user and the assistant
 */
export const getAssistantMessages = query({
  args: {
    assistantId: v.string(),
  },
  handler: async (ctx, {assistantId}) => {
    // const assistant = await ctx.db
    //   .query('assistants')
    //   .withIndex('by_assistantId', (q) => q.eq('assistantId', assistantId))
    //   .first()

    // Get messages sent by user to assistant
    const sentMessages = await ctx.db
      .query('messages')
      .withIndex('by_sender_receiver', (q) =>
        q.eq('senderId', 'user').eq('receiverId', assistantId),
      )
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    // Get messages sent by assistant to user
    const receivedMessages = await ctx.db
      .query('messages')
      .withIndex('by_sender_receiver', (q) =>
        q.eq('senderId', assistantId).eq('receiverId', 'user'),
      )
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    // Combine and sort by creation time
    const allMessages = [...sentMessages, ...receivedMessages]
    allMessages.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )

    // Transform to a simpler format with role
    return allMessages.map((msg) => ({
      id: msg._id,
      role:
        msg.senderId === assistantId
          ? ('assistant' as const)
          : ('user' as const),
      content: msg.content,
      createdAt: msg.createdAt,
    }))
  },
})

/**
 * Get the assistant's profile including isPublic and bio fields
 */
export const getAssistantProfile = query({
  args: {assistantId: v.string()},
  handler: async (ctx, {assistantId}) => {
    const assistant = await ctx.db
      .query('assistants')
      .withIndex('by_assistantId', (q) => q.eq('assistantId', assistantId))
      .first()

    return assistant
  },
})

/**
 * Get the last message with the assistant for preview
 */
export const getLastAssistantMessage = query({
  args: {
    assistantId: v.string(),
  },
  handler: async (ctx, {assistantId}) => {
    // Get the assistant
    const assistant = await ctx.db
      .query('assistants')
      .withIndex('by_assistantId', (q) => q.eq('assistantId', assistantId))
      .first()

    if (!assistant) {
      return null
    }

    // Get all messages between user and assistant
    const sentMessages = await ctx.db
      .query('messages')
      .withIndex('by_sender_receiver', (q) =>
        q.eq('senderId', 'user').eq('receiverId', assistant._id),
      )
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    const receivedMessages = await ctx.db
      .query('messages')
      .withIndex('by_sender_receiver', (q) =>
        q.eq('senderId', assistant._id).eq('receiverId', 'user'),
      )
      .filter((q) => q.eq(q.field('visible'), true))
      .collect()

    // Get the most recent message
    const allMessages = [...sentMessages, ...receivedMessages]
    if (allMessages.length === 0) {
      return null
    }

    allMessages.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    const lastMessage = allMessages[0]
    return {
      content: lastMessage.content,
      createdAt: lastMessage.createdAt,
      isFromAssistant: lastMessage.senderId === assistant._id,
    }
  },
})
