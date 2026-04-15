<template>
  <div class="bg-slate-950 text-slate-100 font-body min-h-screen flex flex-col selection:bg-blue-500 selection:text-slate-950">
    <!-- TopNavBar -->
    <header class="fixed top-0 w-full z-50 bg-[#081425]/60 backdrop-blur-3xl shadow-[0_40px_0_0_rgba(42,53,72,0.06)]">
      <div class="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <NuxtLink to="/" class="text-2xl font-bold tracking-tighter text-[#8ed5ff] font-['Inter'] antialiased">
          Shortky
        </NuxtLink>
        <div class="flex items-center gap-4 text-[#8ed5ff]">
          <button class="hover:bg-[#152031] transition-all duration-300 p-2 rounded-xl active:scale-95">
            <span class="material-symbols-outlined">help_outline</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Canvas -->
    <main class="flex-grow pt-32 pb-16 px-6 max-w-4xl mx-auto w-full">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="w-full py-8 mt-auto border-t border-[#3e484f]/15 bg-[#040e1f]">
      <div class="flex flex-col md:flex-row justify-between items-center px-8 gap-4 max-w-7xl mx-auto">
        <span class="text-xs font-medium uppercase tracking-widest font-['Inter'] text-[#bdc8d1]/60">
          © 2024 Shortky.
        </span>
        <div class="flex gap-8">
          <a class="text-xs font-medium uppercase tracking-widest font-['Inter'] text-[#bdc8d1]/60 hover:text-[#8ed5ff] transition-colors cursor-pointer" href="#">Privacy</a>
          <a class="text-xs font-medium uppercase tracking-widest font-['Inter'] text-[#bdc8d1]/60 hover:text-[#8ed5ff] transition-colors cursor-pointer" href="#">Terms</a>
          <a class="text-xs font-medium uppercase tracking-widest font-['Inter'] text-[#bdc8d1]/60 hover:text-[#8ed5ff] transition-colors cursor-pointer" href="#">API</a>
        </div>
      </div>
    </footer>
  </div>
</template>
