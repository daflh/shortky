<template>
  <div class="min-h-screen flex flex-col">
    <header class="fixed top-0 w-full z-50 bg-surface/70 backdrop-blur-xl">
      <div class="flex justify-between items-center px-6 py-4 max-w-4xl mx-auto">
        <NuxtLink to="/" class="text-xl font-bold tracking-tighter text-primary">
          Shortky
        </NuxtLink>
      </div>
    </header>

    <main class="flex-grow pt-28 pb-16 px-6 max-w-4xl mx-auto w-full">
      <slot />
    </main>

    <footer class="w-full py-6 mt-auto border-t border-slate-800/50">
      <div class="px-6 max-w-4xl mx-auto text-center">
        <span class="text-xs font-medium uppercase tracking-widest text-slate-500">
          © {{ new Date().getFullYear() }} Shortky
        </span>
      </div>
    </footer>
  </div>
</template>
