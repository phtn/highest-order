import {v} from 'convex/values'
import {mutation} from '../_generated/server'

// Send a message to another user
export const sendMessage = mutation({
  args: {
    receiverProId: v.string(), // App-level receiver id
    senderProId: v.string(), // App-level sender id
    content: v.string(), // The message content
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id('_storage'),
          fileName: v.string(),
          fileType: v.string(),
          fileSize: v.number(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Validate content or attachments
    if (!args.content.trim() && (!args.attachments || args.attachments.length === 0)) {
      throw new Error('Message must have content or attachments')
    }

    // Prevent self-messaging
    if (args.senderProId === args.receiverProId) {
      throw new Error('Cannot send message to yourself')
    }

    // Get URLs for attachments
    const attachmentsWithUrls = args.attachments
      ? await Promise.all(
          args.attachments.map(async (attachment) => {
            const url = await ctx.storage.getUrl(attachment.storageId)
            return {
              ...attachment,
              url,
            }
          }),
        )
      : undefined

    // Create the message
    const messageId = await ctx.db.insert('messages', {
      senderId: args.senderProId,
      receiverId: args.receiverProId,
      content: args.content.trim() || '',
      createdAt: new Date().toISOString(),
      readAt: null,
      visible: true,
      attachments: attachmentsWithUrls,
      likes: [],
    })

    return messageId
  },
})

// Like a message
export const likeMessage = mutation({
  args: {
    messageId: v.id('messages'),
    userProId: v.string(), // App-level user id
  },
  handler: async (ctx, args) => {
    // Get the message
    const message = await ctx.db.get(args.messageId)

    if (!message) {
      throw new Error('Message not found')
    }

    // Check if already liked
    const existingLikes = message.likes || []
    const alreadyLiked = existingLikes.some((like) => like.userId === args.userProId)

    if (alreadyLiked) {
      // Unlike: remove the like
      const updatedLikes = existingLikes.filter((like) => like.userId !== args.userProId)
      await ctx.db.patch(args.messageId, {
        likes: updatedLikes,
      })
      return {liked: false, likesCount: updatedLikes.length}
    } else {
      // Like: add the like
      const updatedLikes = [
        ...existingLikes,
        {
          userId: args.userProId,
          likedAt: new Date().toISOString(),
        },
      ]
      await ctx.db.patch(args.messageId, {
        likes: updatedLikes,
      })
      return {liked: true, likesCount: updatedLikes.length}
    }
  },
})

// Mark messages as read
export const markAsRead = mutation({
  args: {
    senderProId: v.string(), // Sender id
    receiverProId: v.string(), // Receiver id
  },
  handler: async (ctx, args) => {
    // Get all unread messages from sender to receiver
    const unreadMessages = await ctx.db
      .query('messages')
      .withIndex('by_sender_receiver', (q) =>
        q.eq('senderId', args.senderProId).eq('receiverId', args.receiverProId),
      )
      .filter((q) => q.and(q.eq(q.field('visible'), true), q.eq(q.field('readAt'), null)))
      .collect()

    // Mark all as read
    const readAt = new Date().toISOString()
    for (const message of unreadMessages) {
      await ctx.db.patch(message._id, {
        readAt,
      })
    }

    return unreadMessages.length
  },
})

// Delete a message (soft delete by setting visible to false)
export const deleteMessage = mutation({
  args: {
    messageId: v.id('messages'),
    userProId: v.string(), // App-level user id to verify ownership
  },
  handler: async (ctx, args) => {
    // Get the message
    const message = await ctx.db.get(args.messageId)

    if (!message) {
      throw new Error('Message not found')
    }

    // Only sender or receiver can delete the message
    if (message.senderId !== args.userProId && message.receiverId !== args.userProId) {
      throw new Error('Unauthorized to delete this message')
    }

    // Soft delete by setting visible to false
    await ctx.db.patch(args.messageId, {
      visible: false,
    })

    return args.messageId
  },
})
