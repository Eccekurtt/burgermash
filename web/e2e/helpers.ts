import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const API = "http://localhost:4100";
export const KITCHEN = { email: "kitchen@test.dev", password: "kitchen-pass-123" };
export const ADMIN = { email: "admin@test.dev", password: "admin-pass-123" };

/** Açılış ekranı (z-[100]) kalkana kadar tıklamalar engellenir; kalkmasını bekler. */
export async function waitForIntro(page: Page) {
  await expect(page.locator("div.z-\\[100\\]")).toHaveCount(0, { timeout: 30_000 });
}

/** Açılış animasyonu (~5 sn) bitip menü görünene kadar bekler. */
export async function openHome(page: Page) {
  await page.goto("/");
  await waitForIntro(page);
}

/** Menü kartı (ürün kimliğiyle). Kartın başlığı ürünü açan gerçek bir düğmedir. */
export const card = (page: Page, id: string) => page.locator(`#menu [data-product="${id}"]`);
export const allCards = (page: Page) => page.locator("#menu [data-product]");
export const openProduct = (page: Page, id: string, name: string) =>
  card(page, id).getByRole("button", { name, exact: true }).click();

export async function apiLogin(request: APIRequestContext, creds: { email: string; password: string }) {
  const res = await request.post(`${API}/auth/login`, { data: creds });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).accessToken as string;
}

/** Tarayıcıda oturum açmış gibi başlat (arayüzden giriş ayrıca test edilir). */
export async function loginAs(page: Page, request: APIRequestContext, creds: { email: string; password: string }) {
  const res = await request.post(`${API}/auth/login`, { data: creds });
  const body = await res.json();
  await page.addInitScript(
    (s) => localStorage.setItem("bm-auth", JSON.stringify(s)),
    { token: body.accessToken, user: body.user },
  );
}

export function uniqueName(prefix: string) {
  return `${prefix} ${Date.now().toString(36)}`;
}
