import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

function appShellPlugin(): Plugin {
  return {
    name: 'aac-app-shell-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const assets = Object.values(bundle)
        .map((entry) => `/${entry.fileName}`)
        .filter((fileName) => !fileName.endsWith('.map') && fileName !== '/sw.js')
      const precache = [...new Set(['/index.html', '/manifest.webmanifest', '/icon.svg', ...assets])].sort()
      let hash = 2166136261
      for (const character of precache.join('|')) {
        hash ^= character.charCodeAt(0)
        hash = Math.imul(hash, 16777619)
      }
      const cacheName = `aac-app-shell-${(hash >>> 0).toString(16)}`
      const source = `const CACHE_NAME=${JSON.stringify(cacheName)};
const CACHE_PREFIX='aac-app-shell-';
const PRECACHE=${JSON.stringify(precache)};
self.addEventListener('install',(event)=>{event.waitUntil(caches.open(CACHE_NAME).then((cache)=>cache.addAll(PRECACHE)));});
self.addEventListener('activate',(event)=>{event.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((key)=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map((key)=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('message',(event)=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',(event)=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then((response)=>response.ok?response:Promise.reject()).catch(()=>caches.match('/index.html')));
    return;
  }
  if(!PRECACHE.includes(url.pathname))return;
  event.respondWith(caches.match(url.pathname).then((cached)=>cached||fetch(request)));
});`
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

export default defineConfig({
  plugins: [react(), appShellPlugin()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    exclude: [...configDefaults.exclude, 'tests/a11y/**', 'tests/e2e/**', 'tests/pwa/**'],
  },
})
