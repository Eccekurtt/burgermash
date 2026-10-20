import { expect, test } from "@playwright/test";
import { allCards, card, openHome, openProduct } from "./helpers";

test.describe("dil desteği", () => {
  test("Türkçe/İngilizce geçişi menüyü, sepeti ve tercihi çevirir", async ({ page }) => {
    await openHome(page);

    // Varsayılan Türkçe
    await expect(page.getByRole("heading", { name: "Menü." })).toBeAttached();
    await card(page, "klasik").getByRole("button", { name: "Ekle +" }).click();

    // Sayfa aşağıdayken üst menü gizli; dil düğmesi için en üste dön
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    // İngilizce'ye geç: kart adları, kategoriler ve arayüz çevrilir
    await page.getByRole("group", { name: "Dil" }).getByRole("button", { name: "en" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { name: "Menu." })).toBeAttached();
    await expect(card(page, "klasik").getByRole("button", { name: "Classic Smash", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Desserts" })).toBeVisible();

    // Sepet kalemi ham seçimlerden yeniden üretilir: şimdi İngilizce ad
    await page.getByRole("button", { name: /^(Cart|Show cart) \d+$/ }).first().click();
    const cart = page.locator("aside");
    await expect(cart).toContainText("Classic Smash");
    await expect(cart).toContainText("Your cart");

    // Tercih kalıcıdır ve Türkçe'ye dönünce sepet de Türkçe olur
    await page.reload();
    await expect(page.locator("div.z-\\[100\\]")).toHaveCount(0, { timeout: 30_000 });
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.getByRole("group", { name: "Language" }).getByRole("button", { name: "tr" }).click();
    await expect(page.getByRole("heading", { name: "Menü." })).toBeAttached();
  });

  test("İngilizce siparişin detayları ham seçimlerden İngilizce üretilir", async ({ page }) => {
    await openHome(page);
    await page.getByRole("group", { name: "Dil" }).getByRole("button", { name: "en" }).click();

    await openProduct(page, "bacon", "Big Bacon");
    const dialog = page.getByRole("dialog", { name: "Big Bacon" });
    await dialog.getByRole("button", { name: /^Combo ·/ }).click();
    await dialog.getByRole("button", { name: "Pickles", exact: true }).click();
    await dialog.getByRole("button", { name: /Extra patty/ }).click();
    await dialog.getByRole("button", { name: /Add to cart/ }).click();

    await page.getByRole("button", { name: /Go to cart/ }).click();
    const cart = page.locator("aside");
    await expect(cart).toContainText("Big Bacon Combo");
    await expect(cart).toContainText("Remove: Pickles");
    await expect(cart).toContainText("Extras: Extra patty");
    await expect(cart).toContainText("Combo: Classic Fries + Cola");
  });
});

test.describe("diyet bilgisi", () => {
  test("vegan ve acılı filtreleri doğru ürünleri gösterir", async ({ page }) => {
    await openHome(page);
    const cards = allCards(page);

    await page.getByRole("button", { name: /🌱 Vegan/ }).click();
    await expect(cards).toHaveCount(9); // bahçe burger, 2 patates, 6 içecek
    await page.getByRole("button", { name: /🌱 Vegan/ }).click();

    await page.getByRole("button", { name: /🌶 Acılı/ }).click();
    await expect(cards).toHaveCount(2); // jalapeño, acılı tavuk
  });

  test("ürün penceresi kalori ve alerjen bilgisini gösterir", async ({ page }) => {
    await openHome(page);
    await openProduct(page, "jalapeno", "Acılı Jalapeño");
    const dialog = page.getByRole("dialog", { name: "Acılı Jalapeño" });
    await expect(dialog).toContainText("780 kcal");
    await expect(dialog).toContainText("Gluten");
    await expect(dialog).toContainText("Süt");
    await expect(dialog).toContainText("Değerler yaklaşıktır");
  });
});

test("sepette burgerin yanına eklenebilecek ürünler önerilir", async ({ page }) => {
  await openHome(page);
  await card(page, "klasik").getByRole("button", { name: "Ekle +" }).click();
  await page.getByRole("button", { name: /Sepete git/ }).click();

  const cart = page.locator("aside");
  await expect(cart.getByText("Yanına ekle")).toBeVisible();
  await cart.getByRole("button", { name: /Klasik Patates ekle/ }).click();
  await expect(cart).toContainText("Klasik Patates");
  // eklenen ürün artık önerilmez
  await expect(cart.getByRole("button", { name: /Klasik Patates ekle/ })).toHaveCount(0);
});

test.describe("tarayıcı dili", () => {
  test.use({ locale: "en-US" });

  test("tarayıcı dili Türkçe değilse site ilk ziyarette İngilizce açılır", async ({ page }) => {
    await openHome(page);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { name: "Menu." })).toBeAttached();
  });
});
