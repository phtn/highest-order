import {Infer, v} from 'convex/values'

export const llmMessageAudioSchema = v.object({
  ownerId: v.string(),
  conversationId: v.string(),
  messageId: v.string(),
  storageId: v.id('_storage'),
  contentType: v.string(),
  voice: v.optional(v.string()),
  provider: v.optional(v.string()),
  textHash: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})

export type LlmMessageAudioDoc = Infer<typeof llmMessageAudioSchema>

