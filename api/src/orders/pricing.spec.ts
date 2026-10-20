import { BadRequestException } from '@nestjs/common';
import { applyPromo, priceItem, type Catalog, type CatalogProduct } from './pricing.js';

const product = (p: Partial<CatalogProduct> & Pick<CatalogProduct, 'id' | 'name' | 'price' | 'category'>): CatalogProduct => ({
  imageUrl: `/menu/${p.id}.jpg`,
  available: true,
  ingredients: [],
  menuSideDelta: null,
  menuDrinkDelta: null,
  ...p,
});

const catalog: Catalog = {
  products: new Map(
    [
      product({ id: 'bacon', name: 'Dev Bacon', price: 259, category: 'BURGER', ingredients: ['Bacon', 'Turşu'] }),
      product({ id: 'tukendi', name: 'Tükendi Burger', price: 100, category: 'BURGER', available: false }),
      product({ id: 'patates', name: 'Klasik Patates', price: 69, category: 'YAN', menuSideDelta: 0 }),
      product({ id: 'halka', name: 'Soğan Halkası', price: 89, category: 'YAN', menuSideDelta: 20 }),
      product({ id: 'kola', name: 'Kola', price: 45, category: 'ICECEK', menuDrinkDelta: 0 }),
      product({ id: 'brownie', name: 'Brownie', price: 95, category: 'TATLI' }),
    ].map((p) => [p.id, p]),
  ),
  extras: new Map([['x-kofte', { id: 'x-kofte', name: 'Ekstra köfte', price: 70, available: true }]]),
  sauces: new Map([
    ['s-ranch', { id: 's-ranch', name: 'Ranch', price: 10, available: true }],
    ['s-bbq', { id: 's-bbq', name: 'BBQ Sos', price: 10, available: true }],
  ]),
  settings: {
    menuBaseAdd: 70,
    promos: { MASH10: 0.1 },
    custom: {
      base: 150,
      pattyPrice: 70,
      perPatty: { cheese: 20, bacon: 35 },
      flat: { tomato: 8, lettuce: 8, onion: 8 },
    },
  },
};

describe('priceItem', () => {
  it('tek burger: taban fiyat', () => {
    const l = priceItem({ productId: 'bacon', mode: 'tek', qty: 2 }, catalog);
    expect(l).toMatchObject({ name: 'Dev Bacon', unitPrice: 259, qty: 2, details: [] });
  });

  it('menü: burger + 70 + yan ürün farkı + içecek farkı', () => {
    const l = priceItem({ productId: 'bacon', mode: 'menu', side: 'halka', drink: 'kola', qty: 1 }, catalog);
    expect(l.unitPrice).toBe(259 + 70 + 20);
    expect(l.name).toBe('Dev Bacon Menü');
    expect(l.details[0]).toBe('Menü: Soğan Halkası + Kola');
  });

  it('menüde varsayılan yan ürün ve içecek: patates + kola', () => {
    const l = priceItem({ productId: 'bacon', mode: 'menu', qty: 1 }, catalog);
    expect(l.unitPrice).toBe(329);
    expect(l.details[0]).toBe('Menü: Klasik Patates + Kola');
  });

  it('ekstra, sos ve çıkarılan malzeme toplanır', () => {
    const l = priceItem(
      { productId: 'bacon', mode: 'tek', removed: ['Turşu'], extras: ['x-kofte'], sauces: ['s-ranch', 's-bbq'], qty: 1 },
      catalog,
    );
    expect(l.unitPrice).toBe(259 + 70 + 20);
    expect(l.details).toEqual(['Çıkar: Turşu', 'Ekstra: Ekstra köfte', 'Sos: Ranch, BBQ Sos']);
  });

  it('aynı sosu iki kez göndermek iki kez ücretlendirilmez', () => {
    const l = priceItem({ productId: 'bacon', mode: 'tek', sauces: ['s-ranch', 's-ranch'], qty: 1 }, catalog);
    expect(l.unitPrice).toBe(269);
  });

  it('özel burger: köfte sayısı ve malzemeler', () => {
    const l = priceItem({ custom: { patties: 2, extras: ['cheese', 'lettuce'] }, mode: 'tek', qty: 1 }, catalog);
    // 150 + 70 (2. köfte) + 20*2 (cheddar) + 8 (marul)
    expect(l.unitPrice).toBe(268);
    expect(l.productId).toBeNull();
  });

  it('özel burger menü + sos', () => {
    const l = priceItem({ custom: { patties: 1, extras: [] }, mode: 'menu', sauces: ['s-ranch'], qty: 1 }, catalog);
    expect(l.unitPrice).toBe(150 + 10 + 70);
    expect(l.name).toBe('Özel Burger Menü');
  });

  it.each([
    ['tükenen ürün', { productId: 'tukendi', mode: 'tek', qty: 1 }],
    ['olmayan ürün', { productId: 'yok', mode: 'tek', qty: 1 }],
    ['üründe olmayan malzemeyi çıkarmak', { productId: 'bacon', mode: 'tek', removed: ['Marul'], qty: 1 }],
    ['tatlıyı menü yapmak', { productId: 'brownie', mode: 'menu', qty: 1 }],
    ['tatlıya sos eklemek', { productId: 'brownie', mode: 'tek', sauces: ['s-ranch'], qty: 1 }],
    ['yan ürüne ekstra malzeme', { productId: 'patates', mode: 'tek', extras: ['x-kofte'], qty: 1 }],
    ['menüde yan ürün olarak seçilemeyen ürün', { productId: 'bacon', mode: 'menu', side: 'brownie', qty: 1 }],
    ['geçersiz sos', { productId: 'bacon', mode: 'tek', sauces: ['s-yok'], qty: 1 }],
    ['hem ürün hem özel burger', { productId: 'bacon', custom: { patties: 1, extras: [] }, mode: 'tek', qty: 1 }],
    ['geçersiz özel malzeme', { custom: { patties: 1, extras: ['elmas'] }, mode: 'tek', qty: 1 }],
    ['ürün kimliği olmayan sipariş', { mode: 'tek', qty: 1 }],
  ] as const)('reddeder: %s', (_name, input) => {
    expect(() => priceItem(input as never, catalog)).toThrow(BadRequestException);
  });
});

describe('applyPromo', () => {
  it('kodu büyük/küçük harf fark etmeden uygular ve yuvarlar', () => {
    expect(applyPromo(429, 'mash10', catalog.settings.promos)).toEqual({ code: 'MASH10', discount: 43 });
  });
  it('kod yoksa indirim yok', () => {
    expect(applyPromo(429, undefined, catalog.settings.promos)).toEqual({ code: null, discount: 0 });
    expect(applyPromo(429, '  ', catalog.settings.promos)).toEqual({ code: null, discount: 0 });
  });
  it('geçersiz kodu reddeder', () => {
    expect(() => applyPromo(100, 'SAHTE', catalog.settings.promos)).toThrow(BadRequestException);
  });
});
