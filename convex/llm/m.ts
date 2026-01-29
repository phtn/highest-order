import {v} from 'convex/values'
import {mutation} from '../_generated/server'

const nowMs = (): number => Date.now()

export const upsertConversation = mutation({
  args: {
    ownerId: v.string(),
    conversationId: v.string(),
    assistantName: v.string(),
    title: v.string(),
    messagesJson: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('llmConversations')
      .withIndex('by_owner_conversationId', (q) =>
        q.eq('ownerId', args.ownerId).eq('conversationId', args.conversationId),
      )
      .first()

    const createdAt = args.createdAt ?? existing?.createdAt ?? nowMs()
    const updatedAt = args.updatedAt ?? nowMs()
    const messagesJson = args.messagesJson ?? existing?.messagesJson ?? '[]'

    if (existing) {
      await ctx.db.patch(existing._id, {
        assistantName: args.assistantName,
        title: args.title,
        messagesJson,
        createdAt,
        updatedAt,
      })
      return existing._id
    }

    const id = await ctx.db.insert('llmConversations', {
      ownerId: args.ownerId,
      conversationId: args.conversationId,
      assistantName: args.assistantName,
      title: args.title,
      messagesJson,
      createdAt,
      updatedAt,
    })
    return id
  },
})

export const renameConversation = mutation({
  args: {
    ownerId: v.string(),
    conversationId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, {ownerId, conversationId, title}) => {
    const existing = await ctx.db
      .query('llmConversations')
      .withIndex('by_owner_conversationId', (q) =>
        q.eq('ownerId', ownerId).eq('conversationId', conversationId),
      )
      .first()

    if (!existing) return null

    await ctx.db.patch(existing._id, {
      title,
      updatedAt: nowMs(),
    })
    return null
  },
})

export const setConversationMessages = mutation({
  args: {
    ownerId: v.string(),
    conversationId: v.string(),
    messagesJson: v.string(),
  },
  handler: async (ctx, {ownerId, conversationId, messagesJson}) => {
    const existing = await ctx.db
      .query('llmConversations')
      .withIndex('by_owner_conversationId', (q) =>
        q.eq('ownerId', ownerId).eq('conversationId', conversationId),
      )
      .first()

    if (!existing) return null

    await ctx.db.patch(existing._id, {
      messagesJson,
      updatedAt: nowMs(),
    })

    return null
  },
})

export const deleteConversation = mutation({
  args: {
    ownerId: v.string(),
    conversationId: v.string(),
  },
  handler: async (ctx, {ownerId, conversationId}) => {
    const existing = await ctx.db
      .query('llmConversations')
      .withIndex('by_owner_conversationId', (q) =>
        q.eq('ownerId', ownerId).eq('conversationId', conversationId),
      )
      .first()

    if (!existing) return null
    await ctx.db.delete(existing._id)
    return null
  },
})


