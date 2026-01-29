import {Infer, v} from 'convex/values'

// Assistant constants - must match frontend
export const ASSISTANT_ID = 'natalie-1'
export const ASSISTANT_VOICE_ID = 'natalie'
export const ASSISTANT_EMAIL = 'support@w-creator.ph'
export const ASSISTANT_NAME = 'Natalie'
export const ASSISTANT_AVATAR = '/nat_2.webp'
export const ASSISTANT_USERNAME = 'natalie-assistant'

export const assistantSchema = v.object({
  assistantId: v.optional(v.string()),
  voiceId: v.optional(v.string()),
  name: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
  bio: v.optional(v.string()),
  isActive: v.optional(v.boolean()),
  visible: v.optional(v.boolean()),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
})

export type Assistant = Infer<typeof assistantSchema>
