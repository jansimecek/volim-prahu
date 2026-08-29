import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // Testy sahají na zkompilovaný obsah stejně jako aplikace — jinak by se
      // moratorium a průzkumy daly ověřit jen ručně v prohlížeči.
      '#content': fileURLToPath(new URL('./.velite/index.js', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
