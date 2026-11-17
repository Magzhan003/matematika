import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// `vite build --mode single` builds a version where every asset (KaTeX fonts too)
// is inlined, so scripts/make-single-html.mjs can pack it into one .html file.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: './',
  build:
    mode === 'single'
      ? { outDir: 'dist-single', assetsInlineLimit: Number.MAX_SAFE_INTEGER, chunkSizeWarningLimit: 5000 }
      : { chunkSizeWarningLimit: 2000 },
}))
