import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { readMultipartFormData } from 'h3';
import { db } from '../db/db';
import { shortlinks } from '../db/schema';
import { encryptData } from '../utils/crypto';

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
  }

  // Parse fields
  const fields: Record<string, any> = {};
  let fileData: Buffer | null = null;
  let fileOriginalName = '';
  let fileMimeType = '';
  
  for (const part of formData) {
    if (part.name === 'file' && part.filename) {
      fileData = part.data;
      fileOriginalName = part.filename;
      fileMimeType = part.type || 'application/octet-stream';
    } else if (part.name) {
      fields[part.name] = part.data.toString('utf8');
    }
  }

  const { type, alias, expiresAt, password, autoRedirect, previewEnabled, url, content } = fields;

  if (!type || !['url', 'text', 'file'].includes(type)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid type' });
  }

  const finalAlias = alias ? alias.trim() : crypto.randomBytes(3).toString('hex').slice(0, 5);
  let expirationDate: Date | null = null;
  if (expiresAt && expiresAt !== 'never') {
    // Expected format: hours, days, etc. For simplicity, expect minutes or ISO string.
    // If we handle simple parsing:
    if (expiresAt.endsWith('m')) expirationDate = new Date(Date.now() + parseInt(expiresAt) * 60 * 1000);
    else if (expiresAt.endsWith('h')) expirationDate = new Date(Date.now() + parseInt(expiresAt) * 60 * 60 * 1000);
    else if (expiresAt.endsWith('d')) expirationDate = new Date(Date.now() + parseInt(expiresAt) * 24 * 60 * 60 * 1000);
    else expirationDate = new Date(expiresAt); // fallback
  }

  const dbPayload: any = {
    id: crypto.randomUUID(),
    alias: finalAlias,
    type,
    autoRedirect: autoRedirect === 'true',
    previewEnabled: previewEnabled === 'true',
    expiresAt: expirationDate,
    isEncrypted: !!password,
  };

  try {
    if (type === 'url') {
      if (!url) throw createError({ statusCode: 400, statusMessage: 'URL is required' });
      dbPayload.content = url;

    } else if (type === 'text') {
      if (!content) throw createError({ statusCode: 400, statusMessage: 'Text content is required' });
      if (password) {
        const encrypted = encryptData(content, password);
        dbPayload.content = encrypted.encryptedBuffer.toString('base64');
        dbPayload.encryptionSalt = encrypted.saltHex;
        dbPayload.encryptionIv = encrypted.ivHex;
      } else {
        dbPayload.content = content;
      }
      
    } else if (type === 'file') {
      if (!fileData) throw createError({ statusCode: 400, statusMessage: 'File is required' });
      
      const MAX_SIZE = 25 * 1024 * 1024; // 25MB
      if (fileData.length > MAX_SIZE) {
        throw createError({ statusCode: 413, statusMessage: 'File size exceeds 25MB limit' });
      }

      dbPayload.fileName = fileOriginalName;
      dbPayload.fileMime = fileMimeType;
      dbPayload.fileSize = fileData.length;

      const uploadDir = path.join(process.cwd(), '.data', 'uploads');
      fs.mkdirSync(uploadDir, { recursive: true });
      
      const filePath = path.join(uploadDir, `${dbPayload.id}_${fileOriginalName}`);
      dbPayload.filePath = filePath;

      if (password) {
        const encrypted = encryptData(fileData, password);
        fs.writeFileSync(filePath, encrypted.encryptedBuffer);
        dbPayload.encryptionSalt = encrypted.saltHex;
        dbPayload.encryptionIv = encrypted.ivHex;
      } else {
        fs.writeFileSync(filePath, fileData);
      }
    }

    // Insert into DB
    await db.insert(shortlinks).values(dbPayload);

    return { success: true, alias: finalAlias };
  } catch (error: any) {
    if (error.code === '23505') { // Postgres unique constraint violation
      throw createError({ statusCode: 409, statusMessage: 'Alias already in use' });
    }
    throw createError({ statusCode: 500, statusMessage: error.message || 'Internal Server Error' });
  }
});
