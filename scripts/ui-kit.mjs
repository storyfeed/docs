import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const repo = fileURLToPath(new URL('../', import.meta.url))
// Use the same source for Vite imports, Tailwind discovery and the SSR tests.
export const uiPath = resolve(repo, process.env.STORYFEED_UI_PATH ?? '../storyfeed-ui/resources/js/vue')
export const uiResolve = {
  alias: { '@storyfeed/ui': uiPath },
  dedupe: ['vue', 'lucide-vue-next', 'markdown-it', 'sanitize-html'],
}
export const uiSource = {
  name: 'storyfeed-ui-source',
  enforce: 'pre',
  transform(code, id) {
    if (id.split('?')[0].endsWith('/theme/tailwind.css')) {
      return code.replace('@source "@storyfeed/ui";', `@source ${JSON.stringify(uiPath)};`)
    }
  },
}
