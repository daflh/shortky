import fs from 'node:fs';
import { eq } from 'drizzle-orm';
import { db } from '../../db/db';
import { shortlinks } from '../../db/schema';
import { decryptData } from '../../utils/crypto';

export default defineEventHandler(async (event) => {
  const alias = getRouterParam(event, 'alias');
  if (!alias) throw createError({ statusCode: 400, statusMessage: 'Missing alias' });

  const body = await readBody(event).catch(() => ({}));
  const password = body.password || '';

  const records = await db.select().from(shortlinks).where(eq(shortlinks.alias, alias)).limit(1).catch(() => []);
  const record = records[0];

  if (!record) {
    throw createError({ statusCode: 404, statusMessage: 'Link not found' });
  }

  if (record.expiresAt && new Date() > record.expiresAt) {
    throw createError({ statusCode: 410, statusMessage: 'Link has expired' });
  }

  if (record.isEncrypted && !password) {
    throw createError({ statusCode: 401, statusMessage: 'Password required' });
  }

  try {
    if (record.type === 'text') {
      if (record.isEncrypted) {
        const encryptedBuffer = Buffer.from(record.content!, 'base64');
        const decrypted = decryptData(encryptedBuffer, password, record.encryptionSalt!, record.encryptionIv!);
        return { success: true, content: decrypted.toString('utf8') };
      }
      return { success: true, content: record.content };
    }

    if (record.type === 'file') {
      let fileBuffer = fs.readFileSync(record.filePath!);
      if (record.isEncrypted) {
        fileBuffer = decryptData(fileBuffer, password, record.encryptionSalt!, record.encryptionIv!);
      }

      setResponseHeader(event, 'Content-Type', record.fileMime || 'application/octet-stream');
      setResponseHeader(event, 'Content-Disposition', `attachment; filename="${record.fileName}"`);
      return fileBuffer;
    }

    // For URL there is nothing to decrypt
    return { success: false, message: 'Invalid operation on URL type' };

  } catch (error: any) {
    throw createError({ statusCode: 401, statusMessage: 'Decryption failed. Incorrect password?' });
  }
});
