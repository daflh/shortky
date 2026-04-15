import { pgTable, varchar, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const shortlinks = pgTable('shortlinks', {
  id: text('id').primaryKey(),
  alias: text('alias').unique().notNull(),
  type: text('type').notNull(), // 'url', 'text', 'file'
  content: text('content'), // destination url or text content
  fileName: text('file_name'),
  fileMime: text('file_mime'),
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
