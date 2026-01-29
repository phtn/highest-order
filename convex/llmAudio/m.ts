import {v} from 'convex/values'
import {mutation} from '../_generated/server'

const nowMs = (): number => Date.now()

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

export const upsertMessageAudio = mutation({
  args: {
    ownerId: v.string(),
    conversationId: v.string(),
    messageId: v.string(),
    storageId: v.id('_storage'),
    contentType: v.string(),
    voice: v.optional(v.string()),
    provider: v.optional(v.string()),
    textHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('llmMessageAudio')
      .withIndex('by_owner_conversation_message', (q) =>
        q
          .eq('ownerId', args.ownerId)
          .eq('conversationId', args.conversationId)
          .eq('messageId', args.messageId),
      )
      .first()

    const updatedAt = nowMs()

    if (existing) {
      const prevStorageId = existing.storageId
      await ctx.db.patch(existing._id, {
        storageId: args.storageId,
        contentType: args.contentType,
        voice: args.voice,
        provider: args.provider,
        textHash: args.textHash,
        updatedAt,
      })

      // If we replaced the stored file, clean up the old one.
      if (prevStorageId !== args.storageId) {
        await ctx.storage.delete(prevStorageId)
      }

      return existing._id
    }

    const id = await ctx.db.insert('llmMessageAudio', {
      ownerId: args.ownerId,
      conversationId: args.conversationId,
      messageId: args.messageId,
      storageId: args.storageId,
      contentType: args.contentType,
      voice: args.voice,
      provider: args.provider,
      textHash: args.textHash,
      createdAt: updatedAt,
      updatedAt,
    })

    return id
  },
})

export const deleteConversationAudio = mutation({
  args: {
    ownerId: v.string(),
    conversationId: v.string(),
  },
  handler: async (ctx, {ownerId, conversationId}) => {
    const docs = await ctx.db
      .query('llmMessageAudio')
      .withIndex('by_owner_conversation', (q) =>
        q.eq('ownerId', ownerId).eq('conversationId', conversationId),
      )
      .collect()

    for (const d of docs) {
      await ctx.db.delete(d._id)
      await ctx.storage.delete(d.storageId)
    }

    return docs.length
  },
})

