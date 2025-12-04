import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const pdfjsDistPath = resolve(require.resolve('pdfjs-dist/package.json'), '..')
const cMapsDir = resolve(pdfjsDistPath, 'cmaps')
const standardFontsDir = resolve(pdfjsDistPath, 'standard_fonts')
const pdfWorkerPath = resolve(pdfjsDistPath, 'build/pdf.worker.min.mjs')

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          { src: cMapsDir, dest: '' },
          { src: standardFontsDir, dest: '' },
          { src: pdfWorkerPath, dest: '' }
        ]
      })
    ],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html')
        }
      }
    }
  }
})

