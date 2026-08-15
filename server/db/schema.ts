import { pgTable, pgEnum, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core'

export const linkType = pgEnum('link_type', ['url', 'text', 'file'])

export const links = pgTable('links', {
  id: text('id').primaryKey(),
  alias: text('alias').unique().notNull(),
  type: linkType('type').notNull(),

  // url: destination URL / text: plaintext or base64 ciphertext / file: unused
  content: text('content'),

  // file only
  fileName: text('file_name'),
  fileMime: text('file_mime'),
  fileSize: integer('file_size'),
  filePath: text('file_path'),

  // text/file, when a password was supplied
  isEncrypted: boolean('is_encrypted').notNull().default(false),
  encryptionSalt: text('encryption_salt'),
  encryptionIv: text('encryption_iv'),

  autoRedirect: boolean('auto_redirect').notNull().default(true), // url only
  previewEnabled: boolean('preview_enabled').notNull().default(false), // file only

  expiresAt: timestamp('expires_at', { withTimezone: true }),
  burnAfterRead: boolean('burn_after_read').notNull().default(false),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export type Link = typeof links.$inferSelect
export type NewLink = typeof links.$inferInsert
