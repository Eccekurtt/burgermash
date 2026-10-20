import { expect, test } from "@playwright/test";
import { API, KITCHEN, apiLogin, openHome, openProduct, uniqueName } from "./helpers";

test("burger menüsü özelleştir, sipariş ver, mutfak ilerletsin, takip canlı güncellensin", async ({
  page,
  request,
}) => {
  await openHome(page);

  // --- Ürün detay penceresi ---
  await openProduct(page, "bacon", "Dev Bacon");
  const dialog = page.getByRole("dialog", { name: "Dev Bacon" });
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: /^Menü ·/ }).click();
  await dialog.getByRole("button", { name: /Baharatlı Patates/ }).click();
  await dialog.getByRole("button", { name: /Ev Yapımı Limonata/ }).click();
  await dialog.getByRole("button", { name: "Turşu", exact: true }).click(); // malzeme çıkar
  await dialog.getByRole("button", { name: /Ekstra köfte/ }).click();
  await dialog.getByRole("button", { name: /^Ranch/ }).click();

  // 259 + 70 (menü) + 10 (baharatlı) + 70 (ekstra köfte) + 10 (ranch)
  await expect(dialog.getByRole("button", { name: /Sepete ekle/ })).toContainText("419 ₺");
  await dialog.getByRole("button", { name: /Sepete ekle/ }).click();
  await expect(page.getByText("Dev Bacon Menü sepete eklendi")).toBeVisible();

  // --- Sepet, promosyon, teslimat ---
  // (Sayfa aşağıdayken üst menü gizli olduğundan bildirimdeki bağlantı kullanılır)
  await page.getByRole("button", { name: /Sepete git/ }).click();
  const cart = page.locator("aside");
  await expect(cart).toContainText("Çıkar: Turşu");
  await cart.getByPlaceholder(/Promosyon kodu/).fill("mash10");
  await cart.getByRole("button", { name: "Uygula" }).click();
  await expect(cart).toContainText("MASH10 uygulandı");
  await expect(cart).toContainText("377 ₺"); // 419 - %10 (42)

  await cart.getByRole("button", { name: "Siparişe devam et" }).click();
  const name = uniqueName("Playwright");
  await cart.getByLabel("Ad soyad").fill(name);
  await cart.getByLabel("Telefon").fill("05550000000");
  await cart.getByLabel("Adres").fill("Test Mah. Burger Sok. 5/2");
  await cart.getByRole("button", { name: /Siparişi onayla/ }).click();

  // --- Canlı takip ---
  await expect(cart.getByText("Siparişin hazırlanıyor")).toBeVisible();
  await expect(cart.getByText("● canlı")).toBeVisible(); // WebSocket bağlandı
  await expect(cart).toContainText("1× Dev Bacon Menü");
  await expect(cart).toContainText("377 ₺");

  const orderId = JSON.parse((await page.evaluate(() => localStorage.getItem("bm-order")))!) as string;

  // Mutfak siparişi ilerletir; müşterinin ekranı sayfa yenilenmeden güncellenir
  const token = await apiLogin(request, KITCHEN);
  const move = (status: string) =>
    request.patch(`${API}/orders/${orderId}/status`, {
      headers: { authorization: `Bearer ${token}` },
      data: { status },
    });
  expect((await move("PREPARING")).ok()).toBeTruthy();
  expect((await move("ON_THE_WAY")).ok()).toBeTruthy();
  expect((await move("DELIVERED")).ok()).toBeTruthy();
  await expect(cart.getByText("Afiyet olsun!")).toBeVisible();

  // Sepet temizlendi
  await cart.getByRole("button", { name: "Tamam" }).click();
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem("bm-cart")))!)).toEqual([]);
});

test("sunucu fiyatı doğrular: tarayıcıdan manipüle edilen fiyat kabul edilmez", async ({ request }) => {
  const res = await request.post(`${API}/orders`, {
    data: { items: [{ productId: "bacon", mode: "tek", qty: 1, price: 1 }], customerName: "x", fulfillment: "pickup" },
  });
  expect(res.status()).toBe(400);
});

test("özel burger tasarla ve sepete ekle", async ({ page }) => {
  await openHome(page);
  await page.locator("#tasarla").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "3x" }).click();
  await page.getByRole("button", { name: /Menü yap/ }).click();
  await page.getByRole("button", { name: "Sepete Ekle" }).click();

  // Aşağı kaydırınca üst menü gizlenir; bildirimdeki "Sepete git" ile açılır
  await page.getByRole("button", { name: /Sepete git/ }).click();
  const cart = page.locator("aside");
  await expect(cart).toContainText("Özel Burger Menü");
  await expect(cart).toContainText("3 köfte");
  // 150 + 140 (2 ekstra köfte) + 60 (3x cheddar) + 8 (marul) + 70 (menü) = 428
  await expect(cart).toContainText("428 ₺");
});
