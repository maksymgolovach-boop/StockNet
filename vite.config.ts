import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'
import { fileURLToPath, URL } from 'node:url'

/** BASE_PATH is the folder the app is served from, e.g. /StockNet/ on GitHub Pages. Defaults to the site root. */
const base = process.env.BASE_PATH ?? '/'

/**
 * src/main.tsx loads the app (src/boot.tsx) with a dynamic import so it can show a fallback if start-up fails.
 * Without help the browser would only discover the app's files after running main; these preload hints let it
 * fetch them straight away, in parallel.
 */
function preloadApp(): Plugin {
  return {
    name: 'stocknet:preload-app',
    transformIndexHtml: {
      order: 'post',
      handler(html, { bundle }) {
        const chunks = Object.values(bundle ?? {}).filter((item) => item.type === 'chunk')
        const boot = chunks.find((chunk) => chunk.isDynamicEntry && chunk.facadeModuleId?.endsWith('/src/boot.tsx'))
        if (!boot) return []
        const files = new Set<string>()
        const collect = (file: string) => {
          if (files.has(file)) return
          files.add(file)
          chunks.find((chunk) => chunk.fileName === file)?.imports.forEach(collect)
        }
        collect(boot.fileName)
        const hinted = [...files].filter((file) => !html.includes(base + file))
        return hinted.map((file): HtmlTagDescriptor => ({
          tag: 'link',
          attrs: { rel: 'modulepreload', crossorigin: true, href: base + file },
          injectTo: 'head',
        }))
      },
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), preloadApp()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
