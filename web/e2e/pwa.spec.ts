import { expect, test } from "@playwright/test";
import { openHome, waitForIntro } from "./helpers";

test("PWA: manifest geçerli, servis çalışanı etkin, çevrimdışıyken önbellek ve çevrimdışı sayfası çalışır", async ({
  page,
  context,
}) => {
  await openHome(page);

  // Manifest
  const res = await page.request.get("/manifest.webmanifest");
  expect(res.ok()).toBeTruthy();
  const manifest = await res.json();
  expect(manifest).toMatchObject({ display: "standalone", start_url: "/", name: "BurgerMash" });
  const purposes = manifest.icons.map((i: { purpose: string }) => i.purpose);
  expect(purposes).toContain("maskable");
  for (const icon of manifest.icons) {
    expect((await page.request.get(icon.src)).ok()).toBeTruthy();
  }

  // Servis çalışanı etkinleşir
  const state = await page.evaluate(async () => (await navigator.serviceWorker.ready).active?.state);
  expect(state).toBe("activated");
  // Ziyaret edilen sayfa önbelleğe alınmış olmalı; yeniden yükleyip denetimin devraldığından emin ol
  await page.reload();
  await waitForIntro(page);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  // Çevrimdışı: önbellekteki ana sayfa açılır
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Menü." })).toBeAttached();

  // Daha önce açılmamış bir sayfa: çevrimdışı sayfası
  await page.goto("/mutfak").catch(() => {});
  await expect(page.getByText("İnternet bağlantısı yok")).toBeVisible();

  await context.setOffline(false);
});

test("API istekleri servis çalışanı tarafından önbelleğe alınmaz", async ({ page, request }) => {
  await openHome(page);
  await page.evaluate(async () => (await navigator.serviceWorker.ready).active?.state);
  const keys = await page.evaluate(async () => {
    const out: string[] = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const req of await cache.keys()) out.push(req.url);
    }
    return out;
  });
  expect(keys.length).toBeGreaterThan(0);
  expect(keys.some((u) => u.includes(":4100"))).toBe(false); // API adresi hiç önbellekte yok
  void request;
});
