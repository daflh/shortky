import crypto from 'node:crypto'

const RANDOM_ALIAS_LENGTH = 5
const BASE62_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

const CUSTOM_ALIAS_PATTERN = /^[a-zA-Z0-9_-]+$/
const CUSTOM_ALIAS_MIN_LENGTH = 3
const CUSTOM_ALIAS_MAX_LENGTH = 32
const RESERVED_ALIASES = new Set(['api', '_nuxt', 'favicon.ico', 'robots.txt', '_', 'recent'])

export function generateRandomAlias(): string {
  const bytes = crypto.randomBytes(RANDOM_ALIAS_LENGTH)
  let alias = ''
  for (let i = 0; i < RANDOM_ALIAS_LENGTH; i++) {
    alias += BASE62_CHARS[bytes[i] % BASE62_CHARS.length]
  }
  return alias
}

export function validateCustomAlias(alias: string): string | null {
  if (alias.length < CUSTOM_ALIAS_MIN_LENGTH || alias.length > CUSTOM_ALIAS_MAX_LENGTH) {
    return `Custom alias must be between ${CUSTOM_ALIAS_MIN_LENGTH} and ${CUSTOM_ALIAS_MAX_LENGTH} characters`
  }
  if (!CUSTOM_ALIAS_PATTERN.test(alias)) {
    return 'Custom alias can only contain letters, numbers, hyphens, and underscores'
  }
  if (RESERVED_ALIASES.has(alias.toLowerCase())) {
    return 'This alias is reserved, please choose another'
  }
  return null
}
