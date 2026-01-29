import {v} from 'convex/values'
import {query} from '../_generated/server'

export const getMessageAudio = query({
  args: {
    ownerId: v.string(),
    conversationId: v.string(),
    messageId: v.string(),
  },
  handler: async (ctx, {ownerId, conversationId, messageId}) => {
    const doc = await ctx.db
      .query('llmMessageAudio')
      .withIndex('by_owner_conversation_message', (q) =>
        q
          .eq('ownerId', ownerId)
          .eq('conversationId', conversationId)
          .eq('messageId', messageId),
      )
      .first()

    if (!doc) return null

    const url = await ctx.storage.getUrl(doc.storageId)

    return {
      url,
      contentType: doc.contentType,
      voice: doc.voice ?? null,
      provider: doc.provider ?? null,
      textHash: doc.textHash ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }
  },
})

