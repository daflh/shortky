import { eq } from 'drizzle-orm';
import { db } from '../../db/db';
import { shortlinks } from '../../db/schema';

export default defineEventHandler(async (event) => {
  const alias = getRouterParam(event, 'alias');
  if (!alias) throw createError({ statusCode: 400, statusMessage: 'Missing alias' });

  // Use raw array, fallback empty if undefined to prevent crashing
  const records = await db.select().from(shortlinks).where(eq(shortlinks.alias, alias)).limit(1).catch(() => []);
  const record = records[0];

  if (!record) {
    throw createError({ statusCode: 404, statusMessage: 'Link not found' });
  }

  if (record.expiresAt && new Date() > record.expiresAt) {
    throw createError({ statusCode: 410, statusMessage: 'Link has expired' });
  }

  // Hide the salt, IV, and physical file path
  // If encrypted, we don't serve the content directly from this endpoint
  return {
    success: true,
    data: {
      type: record.type,
      alias: record.alias,
      autoRedirect: record.autoRedirect,
      previewEnabled: record.previewEnabled,
      expiresAt: record.expiresAt,
      isEncrypted: record.isEncrypted,
      fileName: record.fileName,
      fileSize: record.fileSize,
      fileMime: record.fileMime,
      // only send raw content if it is NOT encrypted
      content: record.isEncrypted ? null : record.type === 'url' || record.type === 'text' ? record.content : null
    }
  };
});
