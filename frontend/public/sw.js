/**
 * Placeholder service worker — stops /sw.js 404 noise in dev and production.
 * Browsers and extensions sometimes probe for a service worker at the site root.
 * This file intentionally does not cache or intercept requests.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
