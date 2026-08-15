import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { readMultipartFormData, createError, defineEventHandler } from 'h3'
import { db } from '../db/client'
import { links, type NewLink } from '../db/schema'
import { encryptData } from '../utils/crypto'
import { generateRandomAlias, validateCustomAlias } from '../utils/alias'

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
const UPLOAD_DIR = path.join(process.cwd(), '.data', 'uploads')
const MAX_ALIAS_RETRIES = 5

const EXPIRATION_MS: Record<string, number> = {
  '5m': 5 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '1mo': 30 * 24 * 60 * 60 * 1000
}

function resolveExpiration(expiresIn: string | undefined): { expiresAt: Date | null; burnAfterRead: boolean } {
  if (expiresIn === 'burn') return { expiresAt: null, burnAfterRead: true }
  if (!expiresIn || expiresIn === 'never') return { expiresAt: null, burnAfterRead: false }
  const ms = EXPIRATION_MS[expiresIn]
  if (!ms) throw createError({ statusCode: 400, statusMessage: 'Invalid expiration preset' })
  return { expiresAt: new Date(Date.now() + ms), burnAfterRead: false }
}

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request' })
  }

  const fields: Record<string, string> = {}
  let file: { data: Buffer; filename: string; mime: string } | null = null

  for (const part of formData) {
    if (part.name === 'file' && part.filename) {
      file = { data: part.data, filename: part.filename, mime: part.type || 'application/octet-stream' }
    } else if (part.name) {
      fields[part.name] = part.data.toString('utf8')
    }
  }

  const { type, alias: customAlias, expiresIn, password } = fields

  if (!type || !['url', 'text', 'file'].includes(type)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid type' })
  }

  let alias: string
  if (customAlias) {
    const validationError = validateCustomAlias(customAlias)
    if (validationError) throw createError({ statusCode: 400, statusMessage: validationError })
    alias = customAlias
  } else {
    alias = generateRandomAlias()
  }

  const { expiresAt, burnAfterRead } = resolveExpiration(expiresIn)

  const payload: NewLink = {
    id: crypto.randomUUID(),
    alias,
    type: type as 'url' | 'text' | 'file',
    expiresAt,
    burnAfterRead,
    isEncrypted: false,
    autoRedirect: true,
    previewEnabled: false
  }

  if (type === 'url') {
    const url = fields.url
    if (!url) throw createError({ statusCode: 400, statusMessage: 'Destination URL is required' })
    payload.content = url
    payload.autoRedirect = fields.autoRedirect !== 'false'
  } else if (type === 'text') {
    const content = fields.content
    if (!content) throw createError({ statusCode: 400, statusMessage: 'Text content is required' })
    if (password) {
      const encrypted = encryptData(content, password)
      payload.content = encrypted.encryptedBuffer.toString('base64')
      payload.encryptionSalt = encrypted.saltHex
      payload.encryptionIv = encrypted.ivHex
      payload.isEncrypted = true
    } else {
      payload.content = content
    }
  } else {
    if (!file) throw createError({ statusCode: 400, statusMessage: 'File is required' })
    if (file.data.length > MAX_FILE_SIZE) {
      throw createError({ statusCode: 413, statusMessage: 'File exceeds the 25MB limit' })
    }

    payload.fileName = file.filename
    payload.fileMime = file.mime
    payload.fileSize = file.data.length
    payload.previewEnabled = fields.previewEnabled === 'true'

    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
    const storedName = `${payload.id}_${file.filename}`
    const filePath = path.join(UPLOAD_DIR, storedName)

    if (password) {
      const encrypted = encryptData(file.data, password)
      fs.writeFileSync(filePath, encrypted.encryptedBuffer)
      payload.encryptionSalt = encrypted.saltHex
      payload.encryptionIv = encrypted.ivHex
      payload.isEncrypted = true
    } else {
      fs.writeFileSync(filePath, file.data)
    }
    payload.filePath = filePath
  }

  for (let attempt = 0; attempt < MAX_ALIAS_RETRIES; attempt++) {
    try {
      await db.insert(links).values(payload)
      return { alias: payload.alias }
    } catch (error: any) {
      if (error.code === '23505') {
        if (customAlias) {
          throw createError({ statusCode: 409, statusMessage: 'Alias already in use' })
        }
        // extremely unlikely random collision
        payload.alias = generateRandomAlias()
        continue
      }
      throw createError({ statusCode: 500, statusMessage: error.message || 'Internal Server Error' })
    }
  }

  throw createError({ statusCode: 500, statusMessage: 'Could not generate a unique alias, please try again' })
})
