export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: {
        class: 'dark'
      },
      link: [
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap' }
      ],
      title: 'Shortky | Universal Link Sharing'
    }
  },
  ui: {
    global: true
  },
  tailwindcss: {
    cssPath: '~/assets/css/main.css'
  },
  colorMode: {
    preference: 'dark'
  },
  devtools: { enabled: true },
  compatibilityDate: '2024-11-01',
})
