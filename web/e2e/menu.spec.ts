import { expect, test } from "@playwright/test";
import { allCards, card, openHome } from "./helpers";

test.describe("menü", () => {
  test("menü API'den gelir; kategori filtresi ve arama çalışır", async ({ page }) => {
    await openHome(page);
    const cards = allCards(page);

    await expect(cards).toHaveCount(29);
    await expect(page.getByText("örnek menü gösteriliyor")).toHaveCount(0); // yerleşik menüye düşmedi

    await page.getByRole("button", { name: "Tatlılar" }).click();
    await expect(cards).toHaveCount(5);

    await page.getByRole("button", { name: "Hepsi" }).click();
    await page.getByPlaceholder("Menüde ara…").fill("limon");
    await expect(cards).toHaveCount(4); // limonata, nane limonata, soğuk çay, soda
    await page.getByPlaceholder("Menüde ara…").fill("yokboyleurun");
    await expect(page.getByText("Aradığın ürünü bulamadık.")).toBeVisible();
  });

  test("Menüler sekmesi burgerleri menü fiyatıyla gösterir", async ({ page }) => {
    await openHome(page);
    await page.getByRole("button", { name: "Menüler" }).click();
    // Geçiş animasyonu sırasında eski kart da kısa süre DOM'da kalır; menü fiyatlı olanı seç
    const klasik = card(page, "klasik").filter({ hasText: "259 ₺" }); // 189 + 70
    await expect(klasik).toHaveCount(1);
    await expect(klasik).toContainText("Tek burger 189 ₺");
  });

  test("favoriler kalıcıdır", async ({ page }) => {
    await openHome(page);
    await card(page, "klasik").getByRole("button", { name: "Favorilere ekle" }).click();
    await page.reload();
    await expect(page.locator("div.z-\\[100\\]")).toHaveCount(0, { timeout: 30_000 });
    await page.getByRole("button", { name: /^♥ Favoriler/ }).click();
    await expect(allCards(page)).toHaveCount(1);
  });
});
