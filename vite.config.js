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
    // Work around a Firefox runtime error in the minified bundle:
    // "can't access lexical declaration before initialization".
    minify: false,
  },
})
