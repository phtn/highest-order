import {defineSchema, defineTable} from 'convex/server'
import {assistantSchema} from './assistants/d'
import {messageSchema} from './messages/d'
import {llmConversationSchema} from './llm/d'
import {llmMessageAudioSchema} from './llmAudio/d'
import {GameResultSchema} from './results/d'

export default defineSchema({
  /// == RESULTS ==
  results: defineTable(GameResultSchema).index('by_roundId', ['roundId']),

  messages: defineTable(messageSchema)
    .index('by_sender', ['senderId']) // All messages sent by a user
    .index('by_receiver', ['receiverId']) // All messages received by a user
    .index('by_sender_receiver', ['senderId', 'receiverId']) // Messages between two specific users
    .index('by_receiver_sender', ['receiverId', 'senderId']), // Messages between two specific users (reverse)
  assistants: defineTable(assistantSchema).index('by_assistantId', [
    'assistantId',
  ]),

  /// == LLM ==
  llmConversations: defineTable(llmConversationSchema)
    .index('by_owner_updatedAt', ['ownerId', 'updatedAt'])
    .index('by_owner_conversationId', ['ownerId', 'conversationId']),

  llmMessageAudio: defineTable(llmMessageAudioSchema)
    .index('by_owner_conversation_message', [
      'ownerId',
      'conversationId',
      'messageId',
    ])
    .index('by_owner_conversation', ['ownerId', 'conversationId']),
})
