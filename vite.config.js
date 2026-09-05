import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const falowenApiProxyTarget = process.env.VITE_FALOWEN_API_PROXY_TARGET
  || 'https://us-central1-falowen-examiner-trainer.cloudfunctions.net'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: falowenApiProxyTarget,
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    // Vite 7 defaults to newer Safari versions. Lower the production target
    // so older iPads on Safari/iPadOS 14+ receive syntax they can execute.
    // Safari 14 still supports the native ESM features Vite requires.
    target: 'safari14',
    // Work around a Firefox runtime error in the minified bundle:
    // "can't access lexical declaration before initialization".
    minify: false,
  },
})
