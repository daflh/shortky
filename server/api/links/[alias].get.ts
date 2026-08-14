import { eq } from 'drizzle-orm'
import { getRouterParam, createError, defineEventHandler } from 'h3'
import { db } from '../../db/client'
import { links } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const alias = getRouterParam(event, 'alias')
  if (!alias) throw createError({ statusCode: 400, statusMessage: 'Missing alias' })

  const [record] = await db.select().from(links).where(eq(links.alias, alias)).limit(1)
  if (!record) throw createError({ statusCode: 404, statusMessage: 'Link not found' })

  if (record.expiresAt && new Date() > record.expiresAt) {
    throw createError({ statusCode: 410, statusMessage: 'This link has expired' })
  }

  const deliversContentHere = record.type === 'url' || (record.type === 'text' && !record.isEncrypted)

  const response = {
    type: record.type,
    alias: record.alias,
    expiresAt: record.expiresAt,
    burnAfterRead: record.burnAfterRead,
    isEncrypted: record.isEncrypted,
    autoRedirect: record.autoRedirect,
    previewEnabled: record.previewEnabled,
    fileName: record.fileName,
    fileMime: record.fileMime,
    fileSize: record.fileSize,
    content: deliversContentHere ? record.content : null
  }

  if (record.burnAfterRead && deliversContentHere) {
    await db.delete(links).where(eq(links.id, record.id))
  }

  return response
})
