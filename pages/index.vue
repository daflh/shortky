<template>
  <div>
    <div class="mb-10 text-center md:text-left">
      <h1 class="text-4xl md:text-5xl font-extrabold tracking-tighter mb-4">
        Create a <span class="text-transparent bg-clip-text bg-gradient-to-tr from-primary to-primary-container">Shortky Link</span>
      </h1>
      <p class="text-slate-400 font-medium max-w-md">
        Share a URL, a bit of text, or a file behind one short link
      </p>
    </div>

    <UCard :ui="{ background: 'bg-surface-high', ring: 'ring-0', divide: 'divide-y divide-slate-800/60', body: { padding: 'p-6 sm:p-8' } }">
      <!-- Success state -->
      <div v-if="createdAlias" class="flex flex-col items-center text-center py-6 space-y-6">
        <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <UIcon name="i-lucide-check" class="w-7 h-7" />
        </div>
        <h2 class="text-xl font-bold">Your link is ready</h2>

        <div class="bg-surface-low px-5 py-4 rounded-lg flex items-center justify-between gap-4 w-full max-w-sm">
          <span class="text-primary font-mono text-sm truncate select-all">{{ shareUrl }}</span>
          <UButton :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'" color="gray" variant="ghost" size="sm" @click="copyLink" />
        </div>

        <UButton variant="link" color="primary" @click="resetForm">Create another link</UButton>
      </div>

      <!-- Create form -->
      <template v-else>
        <UTabs v-model="activeIndex" :items="tabs" :ui="{ list: { rounded: '' } }">
          <template #item="{ item }">
            <div class="pt-8 space-y-6">
              <UFormGroup v-if="item.key === 'url'" label="Destination URL">
                <UInput v-model="form.url" type="url" size="lg" icon="i-lucide-globe" placeholder="https://your-long-destination-url.com/..." />
              </UFormGroup>

              <UFormGroup v-if="item.key === 'text'" label="Content">
                <UTextarea v-model="form.content" :rows="7" placeholder="Type or paste your text here..." />
              </UFormGroup>

              <UFormGroup v-if="item.key === 'file'" label="File">
                <input
                  type="file"
                  class="block w-full text-sm text-slate-300 rounded-lg bg-surface-low p-3 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-on-primary hover:file:brightness-110 cursor-pointer"
                  @change="handleFileChange"
                >
              </UFormGroup>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormGroup label="Custom alias (optional)">
                  <UInput v-model="form.alias" placeholder="my-custom-alias" />
                </UFormGroup>

                <UFormGroup v-if="item.key !== 'url'" label="Password (optional)">
                  <UInput v-model="form.password" type="password" placeholder="Protects with AES-256" />
                </UFormGroup>

                <UFormGroup label="Expiration">
                  <USelect v-model="form.expiresIn" :options="expirationOptions" option-attribute="label" value-attribute="value" />
                </UFormGroup>

                <UFormGroup v-if="item.key === 'url'" label="Auto-redirect">
                  <div class="flex items-center gap-3 h-8">
                    <UToggle v-model="form.autoRedirect" />
                    <span class="text-sm text-slate-400">Skip the preview page</span>
                  </div>
                </UFormGroup>

                <UFormGroup v-if="item.key === 'file'" label="Media preview">
                  <div class="flex items-center gap-3 h-8">
                    <UToggle v-model="form.previewEnabled" />
                    <span class="text-sm text-slate-400">Show image/video inline</span>
                  </div>
                </UFormGroup>
              </div>

              <UAlert v-if="errorMessage" color="red" variant="soft" :title="errorMessage" />

              <UButton block size="lg" color="primary" :loading="isLoading" icon="i-lucide-zap" @click="submit">
                {{ isLoading ? 'Generating...' : 'Generate Link' }}
              </UButton>
            </div>
          </template>
        </UTabs>
      </template>
    </UCard>

    <div class="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div v-for="feature in features" :key="feature.title" class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          <UIcon :name="feature.icon" class="w-5 h-5" />
        </div>
        <div>
          <h4 class="text-xs font-bold uppercase tracking-widest">{{ feature.title }}</h4>
          <p class="text-xs text-slate-400 mt-0.5">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const tabs = [
  { key: 'url', label: 'URL', icon: 'i-lucide-link' },
  { key: 'text', label: 'Text', icon: 'i-lucide-file-text' },
  { key: 'file', label: 'File', icon: 'i-lucide-upload' }
]

const features = [
  { title: 'Simple', description: 'No sign-up, free forever', icon: 'i-lucide-sparkles' },
  { title: 'Encrypted', description: 'Optional AES-256 protection', icon: 'i-lucide-shield-check' },
  { title: 'Ephemeral', description: 'Expires or burns on read', icon: 'i-lucide-timer' }
]

const expirationOptions = [
  { label: '5 minutes', value: '5m' },
  { label: '30 minutes', value: '30m' },
  { label: '1 hour', value: '1h' },
  { label: '1 day', value: '1d' },
  { label: '1 week', value: '1w' },
  { label: '1 month', value: '1mo' },
  { label: 'Never', value: 'never' },
  { label: 'Burn after reading', value: 'burn' }
]

const MAX_FILE_SIZE = 25 * 1024 * 1024

const activeIndex = ref(0)
const activeTab = computed(() => tabs[activeIndex.value].key)

const isLoading = ref(false)
const errorMessage = ref('')
const createdAlias = ref<string | null>(null)
const copied = ref(false)

const form = ref({
  url: '',
  content: '',
  file: null as File | null,
  alias: '',
  password: '',
  expiresIn: '1d',
  autoRedirect: true,
  previewEnabled: false
})

const shareUrl = computed(() => {
  if (typeof window === 'undefined' || !createdAlias.value) return ''
  return `${window.location.origin}/${createdAlias.value}`
})

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (file.size > MAX_FILE_SIZE) {
    errorMessage.value = 'File exceeds the 25MB limit.'
    target.value = ''
    form.value.file = null
    return
  }
  errorMessage.value = ''
  form.value.file = file
}

async function submit() {
  errorMessage.value = ''

  if (activeTab.value === 'url' && !form.value.url) return (errorMessage.value = 'Destination URL is required.')
  if (activeTab.value === 'text' && !form.value.content) return (errorMessage.value = 'Text content is required.')
  if (activeTab.value === 'file' && !form.value.file) return (errorMessage.value = 'A file is required.')

  isLoading.value = true

  try {
    const body = new FormData()
    body.append('type', activeTab.value)
    if (form.value.alias) body.append('alias', form.value.alias)
    body.append('expiresIn', form.value.expiresIn)

    if (activeTab.value === 'url') {
      body.append('url', form.value.url)
      body.append('autoRedirect', String(form.value.autoRedirect))
    } else if (activeTab.value === 'text') {
      body.append('content', form.value.content)
      if (form.value.password) body.append('password', form.value.password)
    } else if (activeTab.value === 'file') {
      body.append('file', form.value.file as File)
      if (form.value.password) body.append('password', form.value.password)
      body.append('previewEnabled', String(form.value.previewEnabled))
    }

    const data = await $fetch<{ alias: string }>('/api/links', { method: 'POST', body })
    createdAlias.value = data.alias
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || 'Something went wrong. Please try again.'
  } finally {
    isLoading.value = false
  }
}

function copyLink() {
  navigator.clipboard.writeText(shareUrl.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

function resetForm() {
  createdAlias.value = null
  form.value = {
    url: '',
    content: '',
    file: null,
    alias: '',
    password: '',
    expiresIn: '1d',
    autoRedirect: true,
    previewEnabled: false
  }
}
</script>
