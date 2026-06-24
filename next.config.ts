import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: false,
    clientsClaim: true,
    importScripts: ["/pwa-background-sync.js"],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          },
        },
      },
      {
        urlPattern: /\.(?:js|css|woff2?)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-assets",
          expiration: {
            maxEntries: 80,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
      {
        urlPattern: /^https:\/\/i\.ytimg\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "youtube-thumbnails",
          expiration: {
            maxEntries: 300,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /^https:\/\/img\.youtube\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "youtube-img",
          expiration: {
            maxEntries: 150,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "supabase-rest",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 60 * 5,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /\/api\/(history|chat)\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "app-api-cache",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 3,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "supabase-storage",
          expiration: {
            maxEntries: 120,
            maxAgeSeconds: 60 * 60 * 24 * 14,
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
};

export default withPWA(nextConfig);
