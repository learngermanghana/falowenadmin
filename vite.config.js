import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const falowenApiProxyTarget = process.env.VITE_FALOWEN_API_PROXY_TARGET
  || 'https://us-central1-falowen-examiner-trainer.cloudfunctions.net'

const falowenAdminBuildSha = process.env.VERCEL_GIT_COMMIT_SHA
  || process.env.GITHUB_SHA
  || process.env.COMMIT_SHA
  || 'dev'
const falowenAdminBuildEnv = process.env.VERCEL_ENV
  || process.env.NODE_ENV
  || 'local'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_FALOWEN_BUILD_SHA': JSON.stringify(falowenAdminBuildSha),
    'import.meta.env.VITE_FALOWEN_BUILD_ENV': JSON.stringify(falowenAdminBuildEnv),
  },
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
