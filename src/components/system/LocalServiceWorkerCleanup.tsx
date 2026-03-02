"use client";

import { useEffect } from "react";

const isLocalhost = (hostname: string): boolean =>
  hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

export default function LocalServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (!isLocalhost(window.location.hostname.toLowerCase())) {
      return;
    }

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister()))
      )
      .catch(() => {
        // Ignore cleanup errors in local environment.
      });

    if ("caches" in window) {
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.toLowerCase().includes("workbox"))
              .map((key) => caches.delete(key))
          )
        )
        .catch(() => {
          // Ignore cleanup errors in local environment.
        });
    }
  }, []);

  return null;
}
