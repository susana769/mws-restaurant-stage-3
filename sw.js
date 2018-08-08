const cacheName = 'v1';
const filesToCache = [
     'https://fonts.googleapis.com/css?family=Open+Sans:300,600',
      '/',
      '/index.html',
      '/restaurant.html',
      '/css/styles.css',
      '/js/idb.js',
      '/js/dbhelper.js',
      '/js/main.js',
      '/js/restaurant_info.js',
      '/images_src/missionchinesefood.jpg',
      '/images_src/missionchinesefood_medium.jpg',
      '/images_src/emily.jpg',
      '/images_src/emily_medium.jpg',
      '/images_src/casaenrique.jpg',
      '/images_src/casaenrique_medium.jpg',
      '/images_src/hometownbbq.jpg',
      '/images_src/hometownbbq_medium.jpg',
      '/images_src/kanghodongbaekjeong.jpg',
      '/images_src/kanghodongbaekjeong_medium.jpg',
      '/images_src/katzsdelicatessen.jpg',
      '/images_src/katzsdelicatessen_medium.jpg',
      '/images_src/missionchinesefood.jpg',
      '/images_src/missionchinesefood_medium.jpg',
      '/images_src/muramen.jpg',
      '/images_src/muramen_medium.jpg',
      '/images_src/muramen_medium.jpg',
      '/images_src/robertaspizza.jpg',
      '/images_src/robertaspizza_medium.jpg',
      '/images_src/superiorityburger.jpg',
      '/images_src/superiorityburger_medium.jpg',
      '/images_src/thedutch.jpg',
      '/images_src/thedutch_medium.jpg',
      '/images_src/fixed/logo.svg', 
      '/404.html'
];

self.addEventListener("install", function (event) {
    // Perform install steps
    console.log("[Servicework] Install");
    event.waitUntil(
        caches.open(cacheName).then(function (cache) {
            console.log("[ServiceWorker] Caching app shell");
            return cache.addAll(filesToCache);
        })
    );
});

self.addEventListener("activate", function (event) {
    console.log("[Servicework] Activate");
    event.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                if (key !== cacheName) {
                    console.log("[ServiceWorker] Removing old cache shell", key);
                    return caches.delete(key);
                }
            }));
        })
    );
});

self.addEventListener("fetch", (event) => {
    console.log("[ServiceWorker] Fetch");
    
    const requestUrl = new URL(event.request.url);
    if (requestUrl.pathname.startsWith('/restaurant.html')) {
        event.respondWith(caches.match('/restaurant.html'));
        return;
    }
    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        })
    );
});

/*these tutorials helped me the most: https://developers.google.com/web/ilt/pwa/caching-files-with-service-worker-slides and https://www.youtube.com/watch?v=BfL3pprhnms
    https://github.com/GoogleChromeLabs/sw-toolbox/issues/227
*/