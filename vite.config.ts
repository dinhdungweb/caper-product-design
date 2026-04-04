import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin()],
  build: {
    outDir: 'caper-app/extensions/hat-designer/assets',
    emptyOutDir: false, // Don't wipe the assets folder if other things are there
    lib: {
        entry: 'src/main.tsx',
        name: 'ProductDesigner',
        fileName: () => `designer-bundle.iife.js`,
        formats: ['iife']
    },
    rollupOptions: {
        output: {
            extend: true,
        }
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
})
