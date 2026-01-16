// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'Ceará de Valores - Quiz de Revisão',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Teste os seus conhecimentos sobre a Trilha 2 do Ceará de Valores.' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: 'https://cearadevalores.com.br/wp-content/uploads/2025/09/cropped-estrela-e1756834379223-32x32.png', sizes: '32x32' },
        { rel: 'icon', type: 'image/png', href: 'https://cearadevalores.com.br/wp-content/uploads/2025/09/cropped-estrela-e1756834379223-192x192.png', sizes: '192x192' },
        { rel: 'apple-touch-icon', href: 'https://cearadevalores.com.br/wp-content/uploads/2025/09/cropped-estrela-e1756834379223-180x180.png' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      maintenanceMode: process.env.MAINTENANCE_MODE || 'false',
      flowiseApiUrl: process.env.FLOWISE_API_URL, 
    }
  },
  ssr: true,
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
  ],
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    redirect: false,
    types: undefined, // Geralmente útil colocar false para não barrar usuários antes do login
  }
})