//@ts-ignore
let cacheName:string = 'pwa-v-##VERSION##';

if ('serviceWorker' in navigator) {
    // Register a service worker hosted at the root of the
    // site using the default scope.
    const path = `./serviceWorker.js`;
    navigator.serviceWorker.register(path);
}

let appShell = [
    './index.html',
    './style.css',
    './img/pwa/pwalogo@512.png',
    './img/pwa/pwalogo@192.png',
    './img/pwa/pwalogo@180.png',
    './img/pwa/pwalogo@168.png',
    './img/pwa/pwalogo@144.png',
    './img/pwa/pwalogo@96.png',
    './img/pwa/pwalogo@72.png',
    './img/pwa/pwalogo@48.png',
    './img/pwa/pwalogo@1k.png',
    './js/main.js',
];

let blacklistFiles = [
    './version',
    './serviceWorker.js'
]

let contentToCache = appShell;//appShell.concat(moreArrays);

self.addEventListener('install', (e: any) => {
    console.log('[Service Worker] Installed');

    e.waitUntil(
        caches.open(cacheName).then((cache) => {
            console.log('[Service Worker] Caching all: app shell and content');
            return cache.addAll(contentToCache);
        })
    );
})

self.addEventListener('fetch', (e: any) => {
    e.respondWith(
        caches.match(e.request).then((r) => {
            console.log('[Service Worker] Fetching resource: ' + e.request.url);
            return r || fetch(e.request).then((response) => {
                return caches.open(cacheName).then((cache) => {
                    let splitUrl = e.request.url.split('/');
                    if (blacklistFiles.indexOf(splitUrl[splitUrl.length - 1]) == -1) {
                        console.log('[Service Worker] Caching new resource: ' + e.request.url);
                        cache.put(e.request, response.clone());
                    } else {
                        console.log('[Service Worker] Skipping blacklisted resource: ' + e.request.url);
                    }
                    return response;
                })
            });
        })
    );
});

self.addEventListener('activate', (e: any) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key != cacheName) {
                    return caches.delete(key);
                }
            }));
        })
    );
});