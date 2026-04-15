<template>
  <div class="max-w-2xl mx-auto w-full">
    <div v-if="pending" class="flex flex-col items-center py-20 text-slate-400">
      <span class="material-symbols-outlined animate-spin text-4xl mb-4 text-blue-500 opacity-80">rotate_right</span>
      <p class="font-medium tracking-wide text-sm">Decoding Vault Structure...</p>
    </div>
    
    <div v-else-if="error" class="bg-slate-900 rounded-xl p-10 text-center shadow-2xl">
      <div class="w-16 h-16 rounded-full bg-red-900/30/20 flex flex-col items-center justify-center text-red-400 mx-auto mb-4">
        <span class="material-symbols-outlined text-3xl">error</span>
      </div>
      <h2 class="text-xl font-bold text-slate-100 mb-2">Vault Inaccessible</h2>
      <p class="text-slate-400 text-sm">{{ error.data?.statusMessage || 'Link not found or expired.' }}</p>
      <NuxtLink to="/" class="mt-8 inline-block text-blue-500 text-sm font-semibold hover:text-blue-400 transition-colors">
        Return to Hub
      </NuxtLink>
    </div>

    <div v-else class="bg-slate-900 rounded-xl shadow-2xl overflow-hidden transition-all duration-500 relative">
      <!-- Decorator line at top -->
      <div class="h-1 w-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-[0_0_15px_rgba(142,213,255,0.4)]"></div>
      
      <!-- Authentication Check -->
      <div v-if="linkMeta?.isEncrypted && !decryptedContent && !decryptedUrl" class="p-8">
        <div class="flex items-center gap-3 text-indigo-400 mb-6">
          <span class="material-symbols-outlined">lock</span>
          <h2 class="text-xl font-bold font-headline select-none">Encrypted Payload</h2>
        </div>
        <p class="text-sm text-slate-400 mb-6 font-medium">This {{ linkMeta.type }} is secured with AES-256 encryption. Enter the passphrase to unlock.</p>
        
        <div class="space-y-4">
          <div class="bg-slate-900 p-4 rounded-xl flex items-center justify-between group focus-within:bg-slate-800 transition-colors">
            <input v-model="password" type="password" @keydown.enter="unlock" class="w-full bg-transparent border-none p-0 text-lg font-medium text-slate-100 focus:ring-0 placeholder:text-slate-500" placeholder="Enter password...">
          </div>
          
          <div v-if="unlockError" class="text-red-400 text-sm font-medium px-2">{{ unlockError }}</div>
          
          <button @click="unlock" :disabled="isUnlocking" class="w-full mt-4 bg-gradient-to-br from-indigo-900 to-[#bda2ff]/80 text-[#520fbb] py-4 rounded-xl font-bold tracking-wide shadow-lg hover:shadow-[0_4px_20px_rgba(189,162,255,0.15)] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <span v-if="isUnlocking" class="material-symbols-outlined animate-spin">progress_activity</span>
            <span v-else class="material-symbols-outlined">key</span>
            Unlock Vault
          </button>
        </div>
      </div>
      
      <!-- Content Viewer -->
      <div v-else class="p-0">
        <!-- URL Notice -->
        <div v-if="linkMeta.type === 'url'" class="p-8 text-center space-y-6">
          <div class="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mx-auto">
            <span class="material-symbols-outlined text-3xl">public</span>
          </div>
          <h2 class="text-xl font-bold">External Redirect</h2>
          <div class="bg-slate-900 p-4 rounded-xl break-all">
            <span class="text-sm text-blue-500 font-medium select-all">{{ linkMeta.content }}</span>
          </div>
          <div class="text-sm text-slate-400 font-medium">Redirecting automatically... <span class="bg-slate-800est px-2 py-0.5 rounded ml-1 animate-pulse">{{ redirectCountdown }}s</span></div>
          <a :href="linkMeta.content" class="text-sm text-[#8ed5ff] font-semibold tracking-wide hover:underline block mt-4">Go now</a>
        </div>
        
        <!-- Text Notice -->
        <div v-else-if="linkMeta.type === 'text'" class="p-8">
           <div class="flex items-center justify-between mb-6">
            <div class="flex flex-col">
               <h2 class="text-xl font-bold text-slate-100 flex items-center gap-2">
                 <span class="material-symbols-outlined text-blue-500 text-xl">subject</span> Secure Document
               </h2>
               <span class="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">
                 {{ linkMeta.isEncrypted ? 'AES-256 Decrypted' : 'Plain Text' }}
               </span>
            </div>
            <button @click="copyContent" class="text-blue-500 hover:bg-blue-500/10 transition-colors p-2 rounded-xl active:scale-95">
              <span class="material-symbols-outlined">{{ copied ? 'check' : 'content_copy' }}</span>
            </button>
           </div>
           
           <div class="bg-slate-900 border border-slate-800/20 rounded-xl p-5 overflow-x-auto max-h-[60vh] overflow-y-auto w-full scrollbar-thin">
              <pre class="text-sm text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">{{ linkMeta.isEncrypted ? decryptedContent : linkMeta.content }}</pre>
           </div>
        </div>
        
        <!-- File Notice -->
        <div v-else-if="linkMeta.type === 'file'" class="p-8">
           <div class="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-800/30 rounded-xl bg-slate-950">
              <span class="material-symbols-outlined text-6xl text-blue-500 opacity-80 mb-4">description</span>
              <h3 class="text-lg font-bold text-slate-100 truncate w-full flex justify-center">{{ linkMeta.fileName }}</h3>
              <p class="text-sm text-slate-400 mt-2 mb-8">{{ formatBytes(linkMeta.fileSize) }} • {{ linkMeta.fileMime }}</p>
              
              <button @click="downloadFile" class="bg-gradient-to-br from-blue-500 to-blue-600 text-slate-950 px-8 py-4 rounded-xl font-bold tracking-tight shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2">
                <span class="material-symbols-outlined">download</span> Download File
              </button>
           </div>
        </div>
      </div>
      
      <!-- Footer Metadata -->
      <div v-if="linkMeta && !(!linkMeta.isEncrypted && linkMeta.type === 'url' && linkMeta.autoRedirect)" class="bg-slate-800 py-3 px-6 flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-slate-400/60">
        <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm">key</span> ID: {{ alias }}</span>
        <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm">timer</span>  {{ linkMeta.expiresAt ? new Date(linkMeta.expiresAt).toLocaleString() : 'Never expires' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

const route = useRoute();
const alias = route.params.alias;

const password = ref('');
const isUnlocking = ref(false);
const unlockError = ref('');
const decryptedContent = ref('');
const decryptedUrl = ref(''); // for blobs
const copied = ref(false);

const redirectCountdown = ref(10);
let redirectTimer = null;

const { data, pending, error } = await useFetch(`/api/resolve/${alias}`);
const linkMeta = computed(() => data.value?.data);

onMounted(() => {
  if (linkMeta.value && linkMeta.value.type === 'url') {
    if (linkMeta.value.autoRedirect) {
      window.location.replace(linkMeta.value.content);
    } else {
      startCountdown();
    }
  }
});

watch(data, (newVal) => {
  if (newVal?.data?.type === 'url' && newVal?.data?.autoRedirect) {
     if (typeof window !== 'undefined') window.location.replace(newVal.data.content);
  }
});

function startCountdown() {
  redirectTimer = setInterval(() => {
    if (redirectCountdown.value > 1) {
      redirectCountdown.value--;
    } else {
      clearInterval(redirectTimer);
      window.location.replace(linkMeta.value.content);
    }
  }, 1000);
}

async function unlock() {
  if (!password.value) return;
  isUnlocking.value = true;
  unlockError.value = '';
  
  try {
    if (linkMeta.value.type === 'text') {
      const response = await $fetch(`/api/decrypt/${alias}`, {
        method: 'POST',
        body: { password: password.value }
      });
      decryptedContent.value = response.content;
    } else if (linkMeta.value.type === 'file') {
      const blob = await $fetch(`/api/decrypt/${alias}`, {
        method: 'POST',
        responseType: 'blob',
        body: { password: password.value }
      });
      decryptedUrl.value = URL.createObjectURL(blob);
    }
  } catch (err) {
    unlockError.value = err.data?.statusMessage || 'Decryption failed. Incorrect password.';
  } finally {
    isUnlocking.value = false;
  }
}

function downloadFile() {
  if (linkMeta.value.isEncrypted && decryptedUrl.value) {
    const a = document.createElement('a');
    a.href = decryptedUrl.value;
    a.download = linkMeta.value.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else if (!linkMeta.value.isEncrypted) {
    const a = document.createElement('a');
    a.href = `/api/decrypt/${alias}`; // It will stream naturally since password isn't needed
    a.download = linkMeta.value.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

function copyContent() {
  const text = linkMeta.value.isEncrypted ? decryptedContent.value : linkMeta.value.content;
  navigator.clipboard.writeText(text);
  copied.value = true;
  setTimeout(() => copied.value = false, 2000);
}

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
</script>
