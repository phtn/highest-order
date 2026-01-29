import {v} from 'convex/values'

export const messageSchema = v.object({
  senderId: v.string(), // The user who sent the message
  receiverId: v.string(), // The user who receives the message
  content: v.string(), // The message content
  createdAt: v.string(), // ISO timestamp
  readAt: v.union(v.string(), v.null()), // ISO timestamp when message was read, null if unread
  visible: v.boolean(), // Visibility flag
  // Media attachments
  attachments: v.optional(
    v.array(
      v.object({
        storageId: v.id('_storage'), // Convex storage ID
        fileName: v.string(), // Original file name
        fileType: v.string(), // MIME type (e.g., 'image/png', 'application/pdf')
        fileSize: v.number(), // File size in bytes
        url: v.union(v.string(), v.null()), // URL to access the file (can be null initially)
      }),
    ),
  ),
  // Likes
  likes: v.optional(
    v.array(
      v.object({
        userId: v.string(), // User who liked the message (app-level id)
        likedAt: v.string(), // ISO timestamp
      }),
    ),
  ),
})
