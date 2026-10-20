"use client";

import { useEffect } from "react";

/** Servis çalışanını yalnızca üretim derlemesinde kaydeder (geliştirmede önbellek kafa karıştırır). */
export function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // kayıt başarısızsa site normal çalışmaya devam eder
    });
  }, []);
  return null;
}
