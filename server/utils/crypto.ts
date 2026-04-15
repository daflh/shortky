import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 16;

/**
 * Derives a key using PBKDF2
 */
export function deriveKey(password: string, saltHex: string): Buffer {
  const salt = Buffer.from(saltHex, 'hex');
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypts a buffer/text with a password
 */
export function encryptData(data: Buffer | string, password: string) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(typeof data === 'string' ? Buffer.from(data, 'utf8') : data),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedBuffer: Buffer.concat([authTag, encrypted]), // prepend auth tag
    saltHex: salt.toString('hex'),
    ivHex: iv.toString('hex')
  };
}

/**
 * Decrypts a buffer using a password
 */
export function decryptData(encryptedWithAuth: Buffer, password: string, saltHex: string, ivHex: string): Buffer {
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');

  // Since we prepended 16-byte authTag
  const authTag = encryptedWithAuth.subarray(0, 16);
  const encrypted = encryptedWithAuth.subarray(16);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
