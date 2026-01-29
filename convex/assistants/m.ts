import {v} from 'convex/values'
import {mutation} from '../_generated/server'

/**
 * Send a message to/from the assistant.
 * This bypasses the follow requirement since the assistant is available to everyone.
 */
export const sendAssistantMessage = mutation({
  args: {
    assistantId: v.string(),
    content: v.string(), // The message content
    isFromAssistant: v.boolean(), // true if message is from assistant, false if from user
  },
  handler: async (ctx, {assistantId, content, isFromAssistant}) => {
    if (!content.trim()) {
      throw new Error('Message content cannot be empty')
    }

    // Get the assistant
    const assistant = await ctx.db
      .query('assistants')
      .withIndex('by_assistantId', (q) => q.eq('assistantId', assistantId))
      .first()

    if (!assistant) {
      throw new Error('Assistant not found. Please run seedAssistant first.')
    }

    // Determine sender and receiver based on isFromAssistant
    const senderId = isFromAssistant ? assistant._id : 'user'
    const receiverId = isFromAssistant ? 'user' : assistant._id

    // Create the message
    const messageId = await ctx.db.insert('messages', {
      senderId,
      receiverId,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      readAt: isFromAssistant ? null : new Date().toISOString(), // User messages are auto-read by assistant
      visible: true,
      likes: [],
    })

    return messageId
  },
})

/**
 * Clear all messages between user and assistant
 */
export const clearAssistantMessages = mutation({
  args: {
    assistantId: v.string(),
  },
  handler: async (ctx, {assistantId}) => {
    // Get all messages between user and assistant
    const sentMessages = await ctx.db
      .query('messages')
      .withIndex('by_sender_receiver', (q) =>
        q.eq('senderId', 'user').eq('receiverId', assistantId),
      )
      .collect()

    const receivedMessages = await ctx.db
      .query('messages')
      .withIndex('by_sender_receiver', (q) =>
        q.eq('senderId', assistantId).eq('receiverId', 'user'),
      )
      .collect()

    // Soft delete all messages
    const allMessages = [...sentMessages, ...receivedMessages]
    for (const message of allMessages) {
      await ctx.db.patch(message._id, {visible: false})
    }

    return allMessages.length
  },
})
