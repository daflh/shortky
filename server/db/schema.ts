import { pgTable, varchar, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const shortlinks = pgTable('shortlinks', {
  id: varchar('id', { length: 21 }).primaryKey(),
  alias: varchar('alias', { length: 255 }).unique().notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'url', 'text', 'file'
  content: text('content'), // destination url or text content
  fileName: varchar('file_name', { length: 255 }),
  fileMime: varchar('file_mime', { length: 255 }),
  fileSize: integer('file_size'),
  filePath: text('file_path'),
  encryptionSalt: text('encryption_salt'), // used for PBKDF2 salt
  encryptionIv: text('encryption_iv'), // used for AES IV
  isEncrypted: boolean('is_encrypted').default(false),
  autoRedirect: boolean('auto_redirect').default(true),
  previewEnabled: boolean('preview_enabled').default(false),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
