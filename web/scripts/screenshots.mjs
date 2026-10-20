/**
 * README için ekran görüntülerini üretir:  node scripts/screenshots.mjs [grup...]
 *
 *   public  → canlı siteden (SITE_URL, varsayılan https://burgermash.vercel.app): ana sayfa, menü, sepet, mobil...
 *   intro   → canlı sitede açılış animasyonunun kareleri
 *   staff   → YEREL ortamdan (LOCAL_URL + API): mutfak, admin, siparişlerim, canlı takip
 *             Önce:  node scripts/demo-data.mjs   (uydurma demo siparişleri oluşturur)
 *
 * Çıktı: ../docs/screenshots/*.jpg
 * Canlı veritabanına sipariş vermez; gerçek kullanıcı bilgisi kullanmaz.
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const SITE = process.env.SITE_URL ?? "https://burgermash.vercel.app";
const LOCAL = process.env.LOCAL_URL ?? "http://localhost:3000";
const LOCAL_API = process.env.LOCAL_API_URL ?? "http://localhost:4000";
const OUT = fileURLToPath(new URL("../../docs/screenshots/", import.meta.url));
mkdirSync(OUT, { recursive: true });

const groups = new Set(process.argv.slice(2).length ? process.argv.slice(2) : ["public", "intro", "staff"]);
const browser = await chromium.launch({ channel: process.env.CI ? undefined : "msedge" });

const shot = async (page, name) => {
  await page.screenshot({ path: join(OUT, `${name}.jpg`), type: "jpeg", quality: 82 });
  console.log("yazıldı:", name);
};
const introGone = (page) =>
  page.waitForFunction(() => !document.querySelector('div[class*="z-[100]"]'), null, { timeout: 120000 });
const newPage = async (opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "tr-TR", ...opts });
  return { ctx, page: await ctx.newPage() };
};
const scrollToSection = (page, id, offset = 0) =>
  page.evaluate(([i, o]) => window.scrollTo({ top: document.getElementById(i).getBoundingClientRect().top + scrollY + o, behavior: "instant" }), [id, offset]);

// ---------------------------------------------------------------- canlı site
if (groups.has("public")) {
  const { ctx, page } = await newPage();
  await page.goto(SITE, { waitUntil: "domcontentloaded" });
  await introGone(page);
  await page.waitForTimeout(3500);
  await shot(page, "01-ana-sayfa");

  await scrollToSection(page, "parcala", 1500);
  await page.waitForTimeout(2500);
  await shot(page, "02-burger-parcalaniyor");

  await scrollToSection(page, "menu", 0);
  await page.waitForTimeout(2000);
  await shot(page, "03-menu");

  // Ürün penceresi: menü + özelleştirme
  await page.locator('#menu [data-product="bacon"]').getByRole("button", { name: "Dev Bacon", exact: true }).click();
  const dlg = page.getByRole("dialog", { name: "Dev Bacon" });
  await dlg.getByRole("button", { name: /^Menü ·/ }).click();
  await dlg.getByRole("button", { name: /Baharatlı Patates/ }).click();
  await dlg.getByRole("button", { name: /Ev Yapımı Limonata/ }).click();
  await dlg.getByRole("button", { name: "Turşu", exact: true }).click();
  await page.waitForTimeout(800);
  await dlg.locator("[data-lenis-prevent]").evaluate((el) => (el.scrollTop = 0));
  await page.waitForTimeout(500);
  await shot(page, "04-urun-ozellestirme");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);

  // Kendin tasarla
  await scrollToSection(page, "tasarla", 0);
  await page.getByRole("button", { name: "3x" }).click();
  await page.getByRole("button", { name: /🥓 Bacon/ }).click();
  await page.getByRole("button", { name: "Ranch" }).click();
  await scrollToSection(page, "tasarla", 0); // tıklamalar sayfayı kaydırdı; başlık görünsün
  await page.waitForTimeout(2200);
  await shot(page, "05-kendin-tasarla");

  // Sepet + "yanına ekle"
  await scrollToSection(page, "menu", 0);
  await page.locator('#menu [data-product="cifte"]').getByRole("button", { name: "Ekle +" }).click();
  await page.getByRole("button", { name: /Sepete git/ }).click();
  await page.waitForTimeout(1800);
  await shot(page, "06-sepet");
  await ctx.close();

  // İngilizce
  {
    const { ctx: c, page: p } = await newPage({ locale: "en-US" });
    await p.goto(SITE, { waitUntil: "domcontentloaded" });
    await introGone(p);
    await scrollToSection(p, "menu", 0);
    await p.waitForTimeout(2000);
    await shot(p, "07-menu-ingilizce");
    await c.close();
  }

  // Mobil
  {
    const { ctx: c, page: p } = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await p.goto(SITE, { waitUntil: "domcontentloaded" });
    await introGone(p);
    await p.waitForTimeout(3500);
    await shot(p, "08-mobil-ana-sayfa");
    await scrollToSection(p, "menu", 120);
    await p.waitForTimeout(2000);
    await shot(p, "09-mobil-menu");
    await c.close();
  }
}

// ------------------------------------------------------------ açılış animasyonu
if (groups.has("intro")) {
  const { ctx, page } = await newPage({ viewport: { width: 1280, height: 760 } });
  await page.goto(SITE, { waitUntil: "domcontentloaded" });
  // 1) sayaç sırasında küçük burger düşüyor
  await page.waitForFunction(() => Number(document.querySelector("span.tabular-nums")?.textContent) >= 45, null, { timeout: 60000 });
  await shot(page, "intro-1-sayac");
  // 2) devasa burger katman katman çakılıyor (kare, çakılma ortasında alınır)
  // (devasa sahnenin SVG'si baştan DOM'da; bu yüzden sayacın 100'e varmasını bekleyip çakılma anını yakalarız)
  await page.waitForFunction(() => Number(document.querySelector("span.tabular-nums")?.textContent) >= 100, null, { timeout: 60000 });
  await page.waitForTimeout(620);
  await shot(page, "intro-2-dev-burger");
  // 3) dönüş: katmanlar ayrılıp toplanıyor, dev yazı yükseliyor
  await page.waitForTimeout(820);
  await shot(page, "intro-3-donus");
  await ctx.close();
}

// ----------------------------------------------------- personel ve takip (yerel)
if (groups.has("staff")) {
  const login = async (email, password) =>
    (await (await fetch(`${LOCAL_API}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    })).json());
  const asUser = async (session, opts) => {
    const { ctx, page } = await newPage(opts);
    await ctx.addInitScript((s) => localStorage.setItem("bm-auth", JSON.stringify(s)), { token: session.accessToken, user: session.user });
    return { ctx, page };
  };

  // Mutfak ekranı
  {
    const { ctx, page } = await asUser(await login("mutfak@burgermash.dev", "mutfak12345"), { viewport: { width: 1440, height: 1000 } });
    await page.goto(`${LOCAL}/mutfak`, { waitUntil: "domcontentloaded" });
    await page.getByText("● Canlı bağlantı").waitFor({ timeout: 60000 });
    await page.waitForTimeout(2500);
    await shot(page, "10-mutfak-ekrani");
    await ctx.close();
  }
  // Admin paneli
  {
    const { ctx, page } = await asUser(await login("admin@burgermash.dev", "admin12345"), { viewport: { width: 1440, height: 1000 } });
    await page.goto(`${LOCAL}/admin`, { waitUntil: "domcontentloaded" });
    await page.getByText("Klasik Smash").first().waitFor({ timeout: 60000 });
    await page.waitForTimeout(1500);
    await shot(page, "11-admin-paneli");
    await ctx.close();
  }
  // Müşteri: siparişlerim ve canlı takip
  {
    const session = await login("aysu@example.com", "demo12345");
    const { ctx, page } = await asUser(session, { viewport: { width: 1440, height: 1000 } });
    await page.goto(`${LOCAL}/siparislerim`, { waitUntil: "domcontentloaded" });
    await page.getByText("Tekrar sipariş ver").first().waitFor({ timeout: 60000 });
    await page.waitForTimeout(2000);
    await shot(page, "12-siparislerim");

    await page.getByRole("button", { name: "Canlı takip et" }).first().click();
    await page.getByText("● canlı").waitFor({ timeout: 30000 });
    await page.waitForTimeout(2500);
    await shot(page, "13-canli-takip");
    await ctx.close();
  }
}

await browser.close();
