<template>
  <div class="max-w-2xl mx-auto w-full">
    <div v-if="pending" class="flex flex-col items-center py-24 text-slate-400">
      <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary mb-4" />
      <p class="text-sm font-medium">Loading...</p>
    </div>

    <div v-else-if="error" class="bg-surface-high rounded-lg p-10 text-center">
      <div class="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mx-auto mb-4">
        <UIcon name="i-lucide-alert-triangle" class="w-6 h-6" />
      </div>
      <h2 class="text-xl font-bold mb-2">Link unavailable</h2>
      <p class="text-slate-400 text-sm">{{ error.data?.statusMessage || 'This link was not found or has expired.' }}</p>
      <UButton to="/" variant="link" color="primary" class="mt-6">Create a new link</UButton>
    </div>

    <template v-else-if="link">
      <UCard :ui="{ background: 'bg-surface-high', ring: 'ring-0' }">
        <!-- Password gate -->
        <div v-if="link.isEncrypted && !unlocked" class="space-y-6">
          <div class="flex items-center gap-3 text-violet-300">
            <UIcon name="i-lucide-lock" class="w-5 h-5" />
            <h2 class="text-lg font-bold">Password protected</h2>
          </div>
          <p class="text-sm text-slate-400">
            This {{ link.type }} is secured with AES-256 encryption. Enter the password to view it.
          </p>
          <UInput v-model="password" type="password" size="lg" placeholder="Enter password..." @keydown.enter="unlock" />
          <UAlert v-if="unlockError" color="red" variant="soft" :title="unlockError" />
          <UButton block size="lg" color="primary" icon="i-lucide-key" :loading="isUnlocking" @click="unlock">
            Unlock
          </UButton>
        </div>

        <!-- URL preview (only reached when auto-redirect is off) -->
        <div v-else-if="link.type === 'url'" class="text-center space-y-6 py-4">
          <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
            <UIcon name="i-lucide-globe" class="w-6 h-6" />
          </div>
          <h2 class="text-xl font-bold">Redirecting to an external site</h2>
          <div class="bg-surface-low p-4 rounded-lg break-all">
            <span class="text-sm text-primary font-mono select-all">{{ link.content }}</span>
          </div>
          <p class="text-sm text-slate-400">
            Continuing automatically in <span class="text-primary font-semibold">{{ redirectCountdown }}s</span>
          </p>
          <UButton :to="link.content" color="primary">Continue now</UButton>
        </div>

        <!-- Text preview -->
        <div v-else-if="link.type === 'text'" class="space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold flex items-center gap-2">
              <UIcon name="i-lucide-file-text" class="text-primary w-5 h-5" /> Text
            </h2>
            <div class="flex gap-2">
              <UButton :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'" color="gray" variant="ghost" size="sm" @click="copyText">
                Copy
              </UButton>
              <UButton icon="i-lucide-download" color="gray" variant="ghost" size="sm" @click="downloadText">
                Download
              </UButton>
            </div>
          </div>
          <div class="bg-surface-low rounded-lg p-5 max-h-[60vh] overflow-y-auto">
            <pre class="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{{ textContent }}</pre>
          </div>
        </div>

        <!-- File preview -->
        <div v-else-if="link.type === 'file'" class="space-y-6">
          <div v-if="link.previewEnabled && (isImage || isVideo) && mediaLoading" class="flex items-center justify-center aspect-video rounded-lg bg-surface-low">
            <UIcon name="i-lucide-loader-circle" class="w-6 h-6 animate-spin text-primary" />
          </div>
          <div v-else-if="link.previewEnabled && isImage" class="rounded-lg overflow-hidden bg-surface-low">
            <img :src="mediaUrl!" :alt="link.fileName ?? ''" class="w-full max-h-[60vh] object-contain">
          </div>
          <div v-else-if="link.previewEnabled && isVideo" class="rounded-lg overflow-hidden bg-surface-low">
            <video :src="mediaUrl!" controls class="w-full max-h-[60vh]" />
          </div>
          <div v-else class="flex flex-col items-center p-10 border border-dashed border-slate-700 rounded-lg bg-surface-low">
            <UIcon name="i-lucide-file" class="w-12 h-12 text-primary opacity-80 mb-3" />
          </div>

          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-bold truncate max-w-xs" :title="link.fileName">{{ link.fileName }}</h3>
              <p class="text-sm text-slate-400">{{ formatBytes(link.fileSize) }} · {{ link.fileMime }}</p>
            </div>
            <UButton icon="i-lucide-download" color="primary" :loading="mediaLoading" :disabled="mediaLoading" @click="downloadFile">Download</UButton>
          </div>
        </div>

        <!-- Footer metadata -->
        <div class="mt-8 pt-6 border-t border-slate-800/60 flex justify-between items-center text-sm text-slate-500 font-medium">
          <span class="flex items-center gap-1.5"><UIcon name="i-lucide-key-round" class="w-3.5 h-3.5" /> {{ link.alias }}</span>
          <span class="flex items-center gap-1.5">
            <UIcon name="i-lucide-timer" class="w-3.5 h-3.5" />
            {{ expirationLabel }}
          </span>
        </div>
      </UCard>
    </template>
  </div>
</template>

<script setup lang="ts">
interface LinkMeta {
  type: 'url' | 'text' | 'file'
  alias: string
  expiresAt: string | null
  burnAfterRead: boolean
  isEncrypted: boolean
  autoRedirect: boolean
  previewEnabled: boolean
  fileName: string | null
  fileMime: string | null
  fileSize: number | null
  content: string | null
}

const route = useRoute()
let alias = route.params.alias as string

if (alias === '_') {
  const recent = await $fetch<{ alias: string } | null>('/api/links/recent').catch(() => null)
  if (recent?.alias) alias = recent.alias
}

const { data, pending, error } = await useFetch<LinkMeta>(`/api/links/${alias}`)
const link = computed(() => data.value)

if (link.value?.type === 'url' && link.value.autoRedirect) {
  await navigateTo(link.value.content!, { external: true, redirectCode: 302 })
}

const password = ref('')
const isUnlocking = ref(false)
const unlockError = ref('')
const unlocked = ref(false)
const copied = ref(false)

// Content decrypted via a password (text) or fetched once as a blob (see mediaUrl below).
const decryptedText = ref('')
const decryptedMediaUrl = ref<string | null>(null)

const redirectCountdown = ref(10)

// Unencrypted text already arrives in the same SSR-fetched payload as the rest of the
// page, so it's available from the very first render — no post-mount pop-in.
const textContent = computed(() => {
  if (!link.value || link.value.type !== 'text') return ''
  return link.value.isEncrypted ? decryptedText.value : (link.value.content ?? '')
})

// Same idea for files: an unencrypted, non-burn file's URL is known synchronously, so
// <img>/<video> can start loading immediately.
const mediaUrl = computed(() => {
  if (!link.value || link.value.type !== 'file') return null
  if (!link.value.isEncrypted && !link.value.burnAfterRead) {
    return `/api/links/${alias}/file`
  }
  return decryptedMediaUrl.value
})

const mediaLoading = computed(() => {
  if (!link.value || link.value.type !== 'file' || link.value.isEncrypted) return false
  return link.value.burnAfterRead && !decryptedMediaUrl.value
})

onMounted(() => {
  if (link.value?.type === 'url' && !link.value.autoRedirect) {
    const timer = setInterval(() => {
      redirectCountdown.value--
      if (redirectCountdown.value <= 0) {
        clearInterval(timer)
        window.location.href = link.value!.content!
      }
    }, 1000)
  }

  if (link.value?.type === 'file' && !link.value.isEncrypted && link.value.burnAfterRead) {
    loadBurnAfterReadFile()
  }
})

async function loadBurnAfterReadFile() {
  const blob = await $fetch<Blob>(`/api/links/${alias}/file`, { responseType: 'blob' })
  decryptedMediaUrl.value = URL.createObjectURL(blob)
}

onUnmounted(() => {
  if (decryptedMediaUrl.value) URL.revokeObjectURL(decryptedMediaUrl.value)
})

const isImage = computed(() => link.value?.fileMime?.startsWith('image/'))
const isVideo = computed(() => link.value?.fileMime?.startsWith('video/'))

const expirationLabel = computed(() => {
  if (!link.value) return ''
  if (link.value.burnAfterRead) return 'Burned after this view'
  if (!link.value.expiresAt) return 'Never expires'
  return `Expires ${formatDate(link.value.expiresAt)}`
})

async function unlock() {
  if (!password.value || !link.value) return
  isUnlocking.value = true
  unlockError.value = ''

  try {
    if (link.value.type === 'text') {
      const res = await $fetch<{ content: string }>(`/api/links/${alias}/unlock`, {
        method: 'POST',
        body: { password: password.value }
      })
      decryptedText.value = res.content
    } else {
      const blob = await $fetch<Blob>(`/api/links/${alias}/unlock`, {
        method: 'POST',
        body: { password: password.value },
        responseType: 'blob'
      })
      decryptedMediaUrl.value = URL.createObjectURL(blob)
    }
    unlocked.value = true
  } catch (err: any) {
    unlockError.value = err?.data?.statusMessage || 'Decryption failed. Incorrect password?'
  } finally {
    isUnlocking.value = false
  }
}

function copyText() {
  navigator.clipboard.writeText(textContent.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

function downloadText() {
  const blob = new Blob([textContent.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  triggerDownload(url, `${alias}.txt`)
  URL.revokeObjectURL(url)
}

function downloadFile() {
  if (!mediaUrl.value || !link.value) return
  triggerDownload(mediaUrl.value, link.value.fileName || alias)
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function formatBytes(bytes: number | null) {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>
