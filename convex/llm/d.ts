import {Infer, v} from 'convex/values'

export const llmConversationSchema = v.object({
  ownerId: v.string(),
  conversationId: v.string(), // stable client-generated id
  assistantName: v.string(),
  title: v.string(),
  messagesJson: v.string(), // serialized UIMessage[]
  createdAt: v.number(), // ms
  updatedAt: v.number(), // ms
})

export type LlmConversationDoc = Infer<typeof llmConversationSchema>

export type LlmConversationMeta = {
  conversationId: string
  assistantName: string
  title: string
  createdAt: number
  updatedAt: number
}

