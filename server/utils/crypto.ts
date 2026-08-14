import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const SALT_LENGTH = 16
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const PBKDF2_ITERATIONS = 100_000

function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256')
}

export function encryptData(data: Buffer | string, password: string) {
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = deriveKey(password, salt)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(typeof data === 'string' ? Buffer.from(data, 'utf8') : data),
    cipher.final()
  ])
  const authTag = cipher.getAuthTag()

  return {
    // auth tag prepended so decryptData only needs the one buffer back
    encryptedBuffer: Buffer.concat([authTag, encrypted]),
    saltHex: salt.toString('hex'),
    ivHex: iv.toString('hex')
  }
}

export function decryptData(encryptedWithAuthTag: Buffer, password: string, saltHex: string, ivHex: string): Buffer {
  const salt = Buffer.from(saltHex, 'hex')
  const iv = Buffer.from(ivHex, 'hex')
  const key = deriveKey(password, salt)

  const authTag = encryptedWithAuthTag.subarray(0, AUTH_TAG_LENGTH)
  const encrypted = encryptedWithAuthTag.subarray(AUTH_TAG_LENGTH)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(encrypted), decipher.final()])
}
