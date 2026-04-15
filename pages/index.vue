<template>
  <div>
    <!-- Hero Branding -->
    <div class="mb-12 text-center md:text-left">
      <h1 class="text-4xl md:text-5xl font-extrabold tracking-tighter mb-4 text-on-surface">
        Create <span class="text-transparent bg-clip-text bg-gradient-to-tr from-primary to-primary-container">Secure Link</span>
      </h1>
      <p class="text-on-surface-variant font-medium max-w-md">An ephemeral gateway for your digital assets. Encrypted by default, destroyed by design.</p>
    </div>

    <!-- Utility Tabs Container -->
    <div class="bg-surface-container rounded-xl overflow-hidden shadow-2xl transition-all duration-500">
      <!-- Tabs Header -->
      <div class="flex border-b border-outline-variant/15">
        <button 
          @click="activeTab = 'url'"
          :class="[
            'flex-1 py-4 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all',
            activeTab === 'url' ? 'bg-surface-bright text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
          ]"
        >
          <span class="material-symbols-outlined text-sm">link</span> URL
        </button>
        <button 
          @click="activeTab = 'text'"
          :class="[
            'flex-1 py-4 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all',
            activeTab === 'text' ? 'bg-surface-bright text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
          ]"
        >
          <span class="material-symbols-outlined text-sm">subject</span> Text
        </button>
        <button 
          @click="activeTab = 'file'"
          :class="[
            'flex-1 py-4 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all',
            activeTab === 'file' ? 'bg-surface-bright text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
          ]"
        >
          <span class="material-symbols-outlined text-sm">upload_file</span> File/Media
        </button>
      </div>

      <!-- Result Screen -->
      <div v-if="createdAlias" class="p-8 flex flex-col items-center justify-center space-y-6">
        <div class="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-2 shadow-[0_0_40px_rgba(142,213,255,0.2)]">
          <span class="material-symbols-outlined text-3xl">check_circle</span>
        </div>
        <h2 class="text-xl font-bold text-on-surface">Vault Generated</h2>
        
        <div class="bg-tertiary-container/10 border border-tertiary/20 px-6 py-4 rounded-xl flex items-center justify-between shadow-[0_0_15px_rgba(189,162,255,0.1)] w-full max-w-sm">
          <span class="text-tertiary font-medium tracking-wide select-all">{{ shareUrl }}</span>
          <button @click="copyToClipboard" class="text-on-surface-variant hover:text-primary transition-colors ml-4 p-2 rounded-md hover:bg-surface-bright">
            <span class="material-symbols-outlined text-sm">content_copy</span>
          </button>
        </div>
        
        <button @click="resetForm" class="text-sm font-medium text-primary hover:text-primary-container transition-colors mt-4">
          Create another link
        </button>
      </div>

      <!-- Tab Content -->
      <div v-else class="p-8 space-y-8">
        <!-- Input Section Based on Tab -->
        <div class="space-y-3">
          <label class="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1 border-none focus:outline-none">
            {{ activeTab === 'url' ? 'Destination Target' : activeTab === 'text' ? 'Secure Output' : 'File Upload' }}
          </label>
          
          <div class="relative group" v-if="activeTab === 'url'">
            <div class="absolute inset-y-0 left-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
              <span class="material-symbols-outlined">public</span>
            </div>
            <input v-model="form.url" type="url" class="w-full bg-surface-container-high border-none rounded-xl py-5 pl-14 pr-6 text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-highest transition-all placeholder:text-on-surface-variant/40" placeholder="https://your-long-destination-url.com/...">
          </div>

          <div class="relative group" v-if="activeTab === 'text'">
            <textarea v-model="form.content" rows="6" class="w-full bg-surface-container-high border-none rounded-xl p-5 text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-highest transition-all placeholder:text-on-surface-variant/40 resize-none font-mono text-sm leading-relaxed" placeholder="Type your secure information here..."></textarea>
          </div>

          <div class="relative group" v-if="activeTab === 'file'">
            <input type="file" @change="handleFileUpload" class="w-full bg-surface-container-high border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-highest transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-surface file:text-primary hover:file:bg-surface-container-lowest cursor-pointer text-sm">
          </div>
        </div>

        <div class="space-y-3">
          <label class="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">Options</label>
        
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
             <!-- Custom Alias -->
            <div class="bg-surface-container-low p-5 rounded-xl flex items-center justify-between group focus-within:bg-surface-container-high transition-colors">
              <input v-model="form.alias" type="text" class="w-full bg-transparent border-none p-0 text-sm font-medium text-on-surface focus:ring-0 placeholder:text-on-surface-variant" placeholder="Custom Alias (e.g. secret-vault)">
            </div>
            
            <!-- Password (Text/File) -->
            <div v-if="activeTab !== 'url'" class="bg-surface-container-low p-5 rounded-xl flex items-center justify-between group focus-within:bg-surface-container-high transition-colors">
              <input v-model="form.password" type="password" class="w-full bg-transparent border-none p-0 text-sm font-medium text-on-surface focus:ring-0 placeholder:text-outline" placeholder="AES-256 Password (Unlock Key)">
            </div>
            
             <!-- Expiration Dropdown -->
            <div class="bg-surface-container-low p-5 rounded-xl flex items-center justify-between group hover:bg-surface-container-high transition-colors">
              <div class="flex flex-col">
                <span class="text-sm font-semibold text-on-surface">Expiration</span>
              </div>
              <select v-model="form.expiresAt" class="bg-transparent border-none text-primary text-sm font-bold focus:ring-0 cursor-pointer text-right appearance-none pr-0">
                <option value="5m" class="bg-surface-container">5 mins</option>
                <option value="1h" class="bg-surface-container">1 hour</option>
                <option value="1d" class="bg-surface-container">1 day</option>
                <option value="1w" class="bg-surface-container">1 week</option>
                <option value="never" class="bg-surface-container">Never</option>
              </select>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Toggle: Auto-redirect (URL only) -->
            <div v-if="activeTab === 'url'" class="bg-surface-container-low p-5 rounded-xl flex items-center justify-between group hover:bg-surface-container-high cursor-pointer transition-colors" @click="form.autoRedirect = !form.autoRedirect">
              <div class="flex flex-col">
                <span class="text-sm font-semibold text-on-surface">Auto-redirect</span>
              </div>
              <button :class="['w-12 h-6 rounded-full relative transition-colors', form.autoRedirect ? 'bg-primary' : 'bg-surface-container-highest']">
                <div :class="['absolute top-1 w-4 h-4 rounded-full shadow-sm transition-all', form.autoRedirect ? 'right-1 bg-on-primary' : 'left-1 bg-outline']"></div>
              </button>
            </div>
            
            <!-- Toggle: Preview Enabled (File only) -->
            <div v-if="activeTab === 'file'" class="bg-surface-container-low p-5 rounded-xl flex items-center justify-between group hover:bg-surface-container-high cursor-pointer transition-colors" @click="form.previewEnabled = !form.previewEnabled">
              <div class="flex flex-col">
                <span class="text-sm font-semibold text-on-surface">Media Preview</span>
              </div>
              <button :class="['w-12 h-6 rounded-full relative transition-colors', form.previewEnabled ? 'bg-primary' : 'bg-surface-container-highest']">
                <div :class="['absolute top-1 w-4 h-4 rounded-full shadow-sm transition-all', form.previewEnabled ? 'right-1 bg-on-primary' : 'left-1 bg-outline']"></div>
              </button>
            </div>
          </div>
        </div>

        <div v-if="errorMessage" class="bg-error-container text-on-error-container p-4 rounded-xl text-sm font-medium">
          {{ errorMessage }}
        </div>

        <!-- Action Bar -->
        <div class="pt-4">
          <button @click="submit" :disabled="isLoading" class="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-5 rounded-xl font-bold tracking-tight text-lg shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
            <span v-if="isLoading" class="material-symbols-outlined animate-spin text-xl">progress_activity</span>
            <span v-else class="material-symbols-outlined">bolt</span>
            {{ isLoading ? 'Encrypting...' : 'Generate Secure Link' }}
          </button>
          <p class="text-center mt-6 text-xs text-on-surface-variant/60 font-medium tracking-wide italic">
             By clicking generate, you agree to our ephemeral data retention policy.
          </p>
        </div>
      </div>
    </div>
    
    <!-- Secondary Information / Visual Decoration -->
    <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-80">
        <div class="flex items-center gap-4 p-4">
            <div class="w-10 h-10 rounded-full bg-tertiary-container/10 flex items-center justify-center text-tertiary">
                <span class="material-symbols-outlined text-lg" data-weight="fill">shield_lock</span>
            </div>
            <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-on-surface">Encrypted</h4>
                <p class="text-[10px] text-on-surface-variant leading-tight">AES-256 vault security</p>
            </div>
        </div>
        <div class="flex items-center gap-4 p-4">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span class="material-symbols-outlined text-lg">history_toggle_off</span>
            </div>
            <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-on-surface">Ephemeral</h4>
                <p class="text-[10px] text-on-surface-variant leading-tight">Logs wiped after expiry</p>
            </div>
        </div>
        <div class="flex items-center gap-4 p-4">
            <div class="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <span class="material-symbols-outlined text-lg">speed</span>
            </div>
            <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-on-surface">Instant</h4>
                <p class="text-[10px] text-on-surface-variant leading-tight">Optimized CDN delivery</p>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const activeTab = ref('url');
const isLoading = ref(false);
const errorMessage = ref('');
const createdAlias = ref(null);

const form = ref({
  url: '',
  content: '',
  file: null,
  alias: '',
  password: '',
  expiresAt: '1d',
  autoRedirect: true,
  previewEnabled: false
});

const shareUrl = computed(() => {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/${createdAlias.value}`;
});

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 25 * 1024 * 1024) {
      errorMessage.value = 'File exceeds maximum size of 25MB limits.';
      event.target.value = '';
      form.value.file = null;
    } else {
      form.value.file = file;
      errorMessage.value = '';
    }
  }
}

async function submit() {
  errorMessage.value = '';
  
  if (activeTab.value === 'url' && !form.value.url) return errorMessage.value = 'Target URL is required.';
  if (activeTab.value === 'text' && !form.value.content) return errorMessage.value = 'Text content is required.';
  if (activeTab.value === 'file' && !form.value.file) return errorMessage.value = 'File is required.';
  
  isLoading.value = true;
  
  try {
    const formData = new FormData();
    formData.append('type', activeTab.value);
    
    if (form.value.alias) formData.append('alias', form.value.alias);
    if (form.value.password && activeTab.value !== 'url') formData.append('password', form.value.password);
    formData.append('expiresAt', form.value.expiresAt);
    
    if (activeTab.value === 'url') {
      formData.append('url', form.value.url);
      formData.append('autoRedirect', form.value.autoRedirect ? 'true' : 'false');
    } else if (activeTab.value === 'text') {
      formData.append('content', form.value.content);
    } else if (activeTab.value === 'file') {
      formData.append('file', form.value.file);
      formData.append('previewEnabled', form.value.previewEnabled ? 'true' : 'false');
    }

    const { data, error } = await useFetch('/api/shorten', {
      method: 'POST',
      body: formData
    });

    if (error.value) {
      throw new Error(error.value.data?.statusMessage || 'Failed to create secure link');
    }

    createdAlias.value = data.value.alias;
  } catch (err) {
    errorMessage.value = err.message || 'An unexpected error occurred.';
  } finally {
    isLoading.value = false;
  }
}

function copyToClipboard() {
  navigator.clipboard.writeText(shareUrl.value);
}

function resetForm() {
  createdAlias.value = null;
  form.value = {
    url: '',
    content: '',
    file: null,
    alias: '',
    password: '',
    expiresAt: '1d',
    autoRedirect: true,
    previewEnabled: false
  };
}
</script>
