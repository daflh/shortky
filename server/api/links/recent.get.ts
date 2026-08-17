import { desc } from 'drizzle-orm'
import { defineEventHandler } from 'h3'
import { db } from '../../db/client'
import { links } from '../../db/schema'

const RECENT_WINDOW_MS = 5 * 60 * 1000

export default defineEventHandler(async () => {
  const [record] = await db
    .select({ alias: links.alias, createdAt: links.createdAt })
    .from(links)
    .orderBy(desc(links.createdAt))
    .limit(1)

  if (!record || Date.now() - record.createdAt.getTime() > RECENT_WINDOW_MS) {
    return null
  }

  return { alias: record.alias }
})
