import fs from 'node:fs'
import { eq } from 'drizzle-orm'
import { getRouterParam, readBody, createError, setResponseHeader, defineEventHandler } from 'h3'
import { db } from '../../../db/client'
import { links } from '../../../db/schema'
import { decryptData } from '../../../utils/crypto'

export default defineEventHandler(async (event) => {
  const alias = getRouterParam(event, 'alias')
  if (!alias) throw createError({ statusCode: 400, statusMessage: 'Missing alias' })

  const body = await readBody(event).catch(() => ({}))
  const password = body?.password || ''

  const [record] = await db.select().from(links).where(eq(links.alias, alias)).limit(1)
  if (!record) throw createError({ statusCode: 404, statusMessage: 'Link not found' })

  if (record.expiresAt && new Date() > record.expiresAt) {
    throw createError({ statusCode: 410, statusMessage: 'This link has expired' })
  }

  if (record.type === 'url') {
    throw createError({ statusCode: 400, statusMessage: 'Nothing to unlock for a URL link' })
  }

  if (!record.isEncrypted) {
    throw createError({ statusCode: 400, statusMessage: 'This link is not password protected' })
  }

  if (!password) {
    throw createError({ statusCode: 401, statusMessage: 'Password required' })
  }

  try {
    if (record.type === 'text') {
      const encryptedBuffer = Buffer.from(record.content!, 'base64')
      const decrypted = decryptData(encryptedBuffer, password, record.encryptionSalt!, record.encryptionIv!)

      if (record.burnAfterRead) {
        await db.delete(links).where(eq(links.id, record.id))
      }

      return { content: decrypted.toString('utf8') }
    }

    // file
    const encryptedBuffer = fs.readFileSync(record.filePath!)
    const decrypted = decryptData(encryptedBuffer, password, record.encryptionSalt!, record.encryptionIv!)
    setResponseHeader(event, 'Content-Type', record.fileMime || 'application/octet-stream')

    if (record.burnAfterRead) {
      await db.delete(links).where(eq(links.id, record.id))
      fs.unlink(record.filePath!, () => {})
    }

    return decrypted
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 401, statusMessage: 'Decryption failed. Incorrect password?' })
  }
})
