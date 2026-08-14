import fs from 'node:fs'
import { eq } from 'drizzle-orm'
import { getRouterParam, createError, setResponseHeader, defineEventHandler } from 'h3'
import { db } from '../../../db/client'
import { links } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const alias = getRouterParam(event, 'alias')
  if (!alias) throw createError({ statusCode: 400, statusMessage: 'Missing alias' })

  const [record] = await db.select().from(links).where(eq(links.alias, alias)).limit(1)
  if (!record || record.type !== 'file') throw createError({ statusCode: 404, statusMessage: 'File not found' })

  if (record.expiresAt && new Date() > record.expiresAt) {
    throw createError({ statusCode: 410, statusMessage: 'This link has expired' })
  }

  if (record.isEncrypted) {
    throw createError({ statusCode: 403, statusMessage: 'This file is password protected, use the unlock endpoint' })
  }

  const buffer = fs.readFileSync(record.filePath!)
  setResponseHeader(event, 'Content-Type', record.fileMime || 'application/octet-stream')

  if (record.burnAfterRead) {
    await db.delete(links).where(eq(links.id, record.id))
    fs.unlink(record.filePath!, () => {})
  }

  return buffer
})
