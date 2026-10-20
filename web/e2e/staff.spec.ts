import { expect, test } from "@playwright/test";
import { ADMIN, API, KITCHEN, apiLogin, loginAs, uniqueName } from "./helpers";

test.describe("kimlik doğrulama", () => {
  test("kayıt ol, giriş durumu görünür, çıkış yap", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("div.z-\\[100\\]")).toHaveCount(0, { timeout: 30_000 });

    await page.getByRole("button", { name: "Giriş", exact: true }).click();
    const modal = page.getByRole("dialog", { name: "Giriş" });
    await modal.getByRole("button", { name: "Kayıt ol" }).click();
    await modal.getByPlaceholder("Ad soyad").fill("Playwright Kullanıcı");
    await modal.getByPlaceholder("E-posta").fill(`pw-${Date.now()}@example.com`);
    await modal.getByPlaceholder(/^Şifre/).fill("sifre12345");
    await modal.getByRole("button", { name: "Hesap oluştur" }).click();

    const userButton = page.getByRole("button", { name: /Playwright Kullanıcı/ });
    await expect(userButton).toBeVisible();
    await userButton.click();
    await expect(page.getByRole("link", { name: "Siparişlerim" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Admin paneli" })).toHaveCount(0); // müşteri admin göremez
    await page.getByRole("button", { name: "Çıkış yap" }).click();
    await expect(page.getByRole("button", { name: "Giriş", exact: true })).toBeVisible();
  });

  test("yanlış şifre hata gösterir", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("div.z-\\[100\\]")).toHaveCount(0, { timeout: 30_000 });
    await page.getByRole("button", { name: "Giriş", exact: true }).click();
    const modal = page.getByRole("dialog", { name: "Giriş" });
    await modal.getByPlaceholder("E-posta").fill(KITCHEN.email);
    await modal.getByPlaceholder("Şifre").fill("yanlis-sifre");
    await modal.getByRole("button", { name: "Giriş yap" }).last().click();
    await expect(modal.getByText("E-posta ya da şifre hatalı")).toBeVisible();
  });

  test("giriş yapılmamış kullanıcı korumalı sayfalarda giriş istenir", async ({ page }) => {
    await page.goto("/mutfak");
    await expect(page.getByText("Giriş gerekli")).toBeVisible();
    await page.goto("/siparislerim");
    await expect(page.getByText("Giriş gerekli")).toBeVisible();
  });

  test("müşteri hesabı mutfak ve admin sayfalarına giremez", async ({ page, request }) => {
    const res = await request.post(`${API}/auth/register`, {
      data: { email: `musteri-${Date.now()}@example.com`, name: "Müşteri", password: "sifre12345" },
    });
    const body = await res.json();
    await page.addInitScript((s) => localStorage.setItem("bm-auth", JSON.stringify(s)), {
      token: body.accessToken,
      user: body.user,
    });
    await page.goto("/admin");
    await expect(page.getByText("Bu sayfa için yetkin yok")).toBeVisible();
    await page.goto("/mutfak");
    await expect(page.getByText("Bu sayfa için yetkin yok")).toBeVisible();
  });
});

test("mutfak ekranı: yeni sipariş anında düşer, düğmeyle ilerletilir", async ({ page, request }) => {
  await loginAs(page, request, KITCHEN);
  await page.goto("/mutfak");
  await expect(page.getByText("● Canlı bağlantı")).toBeVisible();

  const customer = uniqueName("Canlı");
  const res = await request.post(`${API}/orders`, {
    data: {
      items: [{ productId: "klasik", mode: "tek", qty: 2 }],
      customerName: customer,
      fulfillment: "delivery",
      address: "Mutfak Test Cad. 1",
    },
  });
  expect(res.status()).toBe(201);
  const order = await res.json();

  // Sayfa yenilenmeden mutfağa düşer
  const ticket = page.locator("li", { hasText: customer });
  await expect(ticket).toBeVisible();
  await expect(ticket).toContainText("2× Klasik Smash");

  await ticket.getByRole("button", { name: "Hazırlamaya başla" }).click();
  await expect(page.locator("section", { hasText: "Hazırlanıyor" }).locator("li", { hasText: customer })).toBeVisible();

  const status = await request.get(`${API}/orders/${order.id}`);
  expect((await status.json()).status).toBe("PREPARING");
});

test("admin paneli: fiyat değişikliği menüye yansır, tükenen ürün satılmaz", async ({ page, request }) => {
  await loginAs(page, request, ADMIN);
  await page.goto("/admin");
  const row = page.locator("li", { hasText: "Churros" });
  const price = row.getByLabel("Fiyat");
  await expect(price).toHaveValue("89");

  await price.fill("95");
  await price.blur();
  await expect(row.getByText("kaydedildi")).toBeVisible();
  const menu = await (await request.get(`${API}/menu`)).json();
  expect(menu.products.find((p: { id: string }) => p.id === "churros").price).toBe(95);

  // Tükendi yap
  await row.getByRole("switch").click();
  await expect(row).toContainText("Tükendi");
  const after = await (await request.get(`${API}/menu`)).json();
  expect(after.products.find((p: { id: string }) => p.id === "churros")).toBeUndefined();
  const order = await request.post(`${API}/orders`, {
    data: { items: [{ productId: "churros", mode: "tek", qty: 1 }], customerName: "x", fulfillment: "pickup" },
  });
  expect(order.status()).toBe(400);

  // Eski haline getir
  const token = await apiLogin(request, ADMIN);
  await request.patch(`${API}/admin/products/churros`, {
    headers: { authorization: `Bearer ${token}` },
    data: { price: 89, available: true },
  });
});
