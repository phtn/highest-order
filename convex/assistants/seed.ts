import {v} from 'convex/values'
import {mutation} from '../_generated/server'
import {
  ASSISTANT_AVATAR,
  ASSISTANT_ID,
  ASSISTANT_NAME,
  ASSISTANT_USERNAME,
  ASSISTANT_VOICE_ID,
} from './d'

/**
 * Seed the assistant user and profile.
 * This should be called once to create the Protap Assistant user.
 * Safe to call multiple times - will not duplicate.
 */
export const seedAssistant = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if assistant already exists

    // Check profile exists
    const existingProfile = await ctx.db
      .query('assistants')
      .withIndex('by_assistantId', (q) => q.eq('assistantId', ASSISTANT_ID))
      .first()

    if (existingProfile) {
      // Update profile if needed
      await ctx.db.patch(existingProfile._id, {
        avatarUrl: ASSISTANT_AVATAR,
        name: ASSISTANT_USERNAME,
        updatedAt: Date.now(),
      })
    }

    // Create the assistant user
    await ctx.db.insert('assistants', {
      assistantId: ASSISTANT_ID,
      voiceId: ASSISTANT_VOICE_ID,
      name: ASSISTANT_NAME,
      avatarUrl: ASSISTANT_AVATAR,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

/**
 * Get the assistant user
 */
export const getAssistant = mutation({
  args: {assistantId: v.string()},
  handler: async (ctx, {assistantId}) => {
    const assistant = await ctx.db
      .query('assistants')
      .withIndex('by_assistantId', (q) => q.eq('assistantId', assistantId))
      .first()

    return assistant
  },
})
