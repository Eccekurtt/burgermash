import { BadRequestException } from '@nestjs/common';

/**
 * Sipariş fiyatlandırması SUNUCUDA hesaplanır; istemciden gelen fiyata asla güvenilmez.
 * Saf fonksiyonlar olduğu için veritabanı olmadan test edilebilir.
 */

export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  category: 'BURGER' | 'YAN' | 'TATLI' | 'ICECEK';
  imageUrl: string;
  available: boolean;
  ingredients: string[];
  menuSideDelta: number | null;
  menuDrinkDelta: number | null;
}

export interface CatalogOption {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export interface Catalog {
  products: Map<string, CatalogProduct>;
  extras: Map<string, CatalogOption>;
  sauces: Map<string, CatalogOption>;
  settings: {
    menuBaseAdd: number;
    promos: Record<string, number>;
    custom: {
      base: number;
      pattyPrice: number;
      perPatty: Record<string, number>;
      flat: Record<string, number>;
    };
  };
}

export interface OrderItemInput {
  productId?: string;
  custom?: { patties: number; extras: string[] };
  mode: 'tek' | 'menu';
  side?: string;
  drink?: string;
  removed?: string[];
  extras?: string[];
  sauces?: string[];
  note?: string;
  qty: number;
}

export interface PricedLine {
  productId: string | null;
  name: string;
  unitPrice: number;
  qty: number;
  details: string[];
  imageUrl: string | null;
}

export const DEFAULT_SIDE = 'patates';
export const DEFAULT_DRINK = 'kola';

export const CUSTOM_LABELS: Record<string, string> = {
  cheese: 'Cheddar',
  bacon: 'Bacon',
  tomato: 'Domates',
  lettuce: 'Marul',
  onion: 'Soğan',
};

const bad = (msg: string) => new BadRequestException(msg);
const uniq = <T>(a: T[] = []) => [...new Set(a)];

function pickOptions(ids: string[] | undefined, map: Map<string, CatalogOption>, label: string) {
  return uniq(ids).map((id) => {
    const o = map.get(id);
    if (!o || !o.available) throw bad(`Geçersiz ${label}: ${id}`);
    return o;
  });
}

function menuParts(item: OrderItemInput, c: Catalog) {
  const sideId = item.side ?? DEFAULT_SIDE;
  const drinkId = item.drink ?? DEFAULT_DRINK;
  const side = c.products.get(sideId);
  const drink = c.products.get(drinkId);
  if (!side || !side.available || side.menuSideDelta === null) throw bad(`Menüde yan ürün olarak seçilemez: ${sideId}`);
  if (!drink || !drink.available || drink.menuDrinkDelta === null) throw bad(`Menüde içecek olarak seçilemez: ${drinkId}`);
  return {
    add: c.settings.menuBaseAdd + side.menuSideDelta + drink.menuDrinkDelta,
    text: `Menü: ${side.name} + ${drink.name}`,
  };
}

export function priceItem(item: OrderItemInput, c: Catalog): PricedLine {
  const sauces = pickOptions(item.sauces, c.sauces, 'sos');
  const saucePrice = sauces.reduce((s, o) => s + o.price, 0);
  const menu = item.mode === 'menu' ? menuParts(item, c) : null;
  const note = item.note?.trim();

  // --- Kendin tasarla ---
  if (item.custom) {
    if (item.productId) throw bad('Ürün ya da özel burger gönderin, ikisini birden değil');
    const { patties } = item.custom;
    const extras = uniq(item.custom.extras);
    const cfg = c.settings.custom;
    let unit = cfg.base + (patties - 1) * cfg.pattyPrice;
    for (const e of extras) {
      if (!(e in CUSTOM_LABELS)) throw bad(`Geçersiz malzeme: ${e}`);
      unit += e in cfg.perPatty ? cfg.perPatty[e] * patties : (cfg.flat[e] ?? 0);
    }
    unit += saucePrice + (menu?.add ?? 0);

    const names = extras.map((e) => CUSTOM_LABELS[e]);
    const details = [`${patties} köfte${names.length ? ': ' + names.join(', ') : ''}`];
    if (sauces.length) details.push(`Sos: ${sauces.map((s) => s.name).join(', ')}`);
    if (menu) details.push(menu.text);
    if (note) details.push(`Not: ${note}`);

    return {
      productId: null,
      name: menu ? 'Özel Burger Menü' : 'Özel Burger',
      unitPrice: unit,
      qty: item.qty,
      details,
      imageUrl: null,
    };
  }

  // --- Menüdeki ürün ---
  if (!item.productId) throw bad('productId gerekli');
  const p = c.products.get(item.productId);
  if (!p || !p.available) throw bad(`Ürün bulunamadı ya da tükendi: ${item.productId}`);

  const isBurger = p.category === 'BURGER';
  if (menu && !isBurger) throw bad('Sadece burgerler menü olarak sipariş edilebilir');
  if (item.extras?.length && !isBurger) throw bad('Ekstra malzeme sadece burgerlerde seçilebilir');
  if (sauces.length && !(isBurger || p.category === 'YAN')) throw bad('Bu ürüne sos eklenemez');

  const removed = uniq(item.removed);
  for (const r of removed) if (!p.ingredients.includes(r)) throw bad(`Üründe olmayan malzeme: ${r}`);

  const extras = pickOptions(item.extras, c.extras, 'ekstra');
  const unit =
    p.price + (menu?.add ?? 0) + extras.reduce((s, o) => s + o.price, 0) + saucePrice;

  const details: string[] = [];
  if (menu) details.push(menu.text);
  if (removed.length) details.push(`Çıkar: ${removed.join(', ')}`);
  if (extras.length) details.push(`Ekstra: ${extras.map((e) => e.name).join(', ')}`);
  if (sauces.length) details.push(`Sos: ${sauces.map((s) => s.name).join(', ')}`);
  if (note) details.push(`Not: ${note}`);

  return {
    productId: p.id,
    name: menu ? `${p.name} Menü` : p.name,
    unitPrice: unit,
    qty: item.qty,
    details,
    imageUrl: p.imageUrl,
  };
}

export function applyPromo(subtotal: number, code: string | undefined, promos: Record<string, number>) {
  if (!code?.trim()) return { code: null, discount: 0 };
  const key = code.trim().toUpperCase();
  const rate = promos[key];
  if (rate === undefined) throw bad('Geçersiz promosyon kodu');
  return { code: key, discount: Math.round(subtotal * rate) };
}
