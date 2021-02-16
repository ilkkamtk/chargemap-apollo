'use strict';
const cacheName = 'csa-pwa';
const filesToCache = [
  '/',
  '/manifest.json',
  '/index.html',
  '/css/style.css',
  '/js/example.js',
  '/img/logo.svg',
  '/modules/leaflet/dist/leaflet.css',
  '/modules/esri-leaflet-geocoder/dist/esri-leaflet-geocoder.css',
  '/modules/leaflet/dist/leaflet.js',
  '/modules/esri-leaflet/dist/esri-leaflet.js',
  '/modules/esri-leaflet-geocoder/dist/esri-leaflet-geocoder.js',
  '/modules/@fortawesome/fontawesome-free/css/all.min.css',
  '/modules/@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff2',
  '/modules/leaflet/dist/images/marker-icon.png',
  '/modules/leaflet/dist/images/marker-shadow.png',

];

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', (e) => {
  e.waitUntil(
      caches.open(cacheName).then(function(cache) {
        return cache.addAll(filesToCache);
      }),
  );
});

/* Serve cached content when offline */
self.addEventListener('fetch', (e) => {
  e.respondWith(
      caches.match(e.request).then(function(response) {
        return response || fetch(e.request);
      }),
  );
});
