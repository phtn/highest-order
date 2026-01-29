import {v} from 'convex/values'
import {query} from '../_generated/server'

export const listConversations = query({
  args: {
    ownerId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, {ownerId, limit}) => {
    const lim = typeof limit === 'number' ? Math.max(1, Math.min(limit, 200)) : 50
    const docs = await ctx.db
      .query('llmConversations')
      .withIndex('by_owner_updatedAt', (q) => q.eq('ownerId', ownerId))
      .order('desc')
      .take(lim)

    return docs.map((d) => ({
      conversationId: d.conversationId,
      assistantName: d.assistantName,
      title: d.title,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }))
  },
})

export const getConversationMessages = query({
  args: {
    ownerId: v.string(),
    conversationId: v.string(),
  },
  handler: async (ctx, {ownerId, conversationId}) => {
    const doc = await ctx.db
      .query('llmConversations')
      .withIndex('by_owner_conversationId', (q) =>
        q.eq('ownerId', ownerId).eq('conversationId', conversationId),
      )
      .first()

    return doc?.messagesJson ?? null
  },
})


