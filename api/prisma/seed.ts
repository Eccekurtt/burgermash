import 'dotenv/config';
import { readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Category } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type P = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  tag?: string;
  ingredients?: string[];
  menuSideDelta?: number;
  menuDrinkDelta?: number;
};

// Yaklaşık kalori, alerjen ve diyet bilgisi (id -> bilgi)
const nutrition: Record<string, { calories: number; allergens: string[]; dietary: string[] }> = JSON.parse(
  readFileSync(new URL('./nutrition.json', import.meta.url), 'utf8'),
);

const products: P[] = [
  // Burgerler
  { id: 'klasik', name: 'Klasik Smash', description: 'Tek ezilmiş köfte, cheddar, marul, domates, özel sos.', price: 189, category: 'BURGER', tag: 'Çok satan', ingredients: ['Cheddar', 'Marul', 'Domates', 'Turşu', 'Özel sos'] },
  { id: 'cifte', name: 'Çifte Cheddar', description: 'İki ezilmiş köfte, çift cheddar, karamelize soğan, turşu.', price: 239, category: 'BURGER', ingredients: ['Cheddar', 'Karamelize soğan', 'Turşu', 'Özel sos'] },
  { id: 'bacon', name: 'Dev Bacon', description: 'Çıtır bacon, cheddar, iki köfte, dumanlı sos.', price: 259, category: 'BURGER', tag: 'Aç gelin', ingredients: ['Bacon', 'Cheddar', 'Dumanlı sos', 'Turşu'] },
  { id: 'bbq', name: 'BBQ Smokehouse', description: 'Barbekü soslu çifte köfte, bacon, çıtır soğan, cheddar.', price: 269, category: 'BURGER', ingredients: ['Bacon', 'Çıtır soğan', 'Cheddar', 'BBQ sos'] },
  { id: 'jalapeno', name: 'Acılı Jalapeño', description: 'Jalapeño, pepper jack peyniri, kırmızı soğan turşusu, acı mayonez.', price: 219, category: 'BURGER', tag: 'Acılı', ingredients: ['Jalapeño', 'Pepper jack', 'Soğan turşusu', 'Acı mayonez'] },
  { id: 'mantar', name: 'Mantarlı Swiss', description: 'Tereyağında sotelenmiş mantar, Swiss peyniri, trüf mayonez.', price: 229, category: 'BURGER', ingredients: ['Mantar', 'Swiss peyniri', 'Trüf mayonez'] },
  { id: 'tavuk', name: 'Çıtır Tavuk', description: 'Baharatlı galeta unlu tavuk göğsü, turşu, ranch sos.', price: 199, category: 'BURGER', ingredients: ['Marul', 'Turşu', 'Ranch sos'] },
  { id: 'acili-tavuk', name: 'Acılı Tavuk', description: 'Nashville usulü acı soslu tavuk, coleslaw, turşu.', price: 209, category: 'BURGER', tag: 'Acılı', ingredients: ['Coleslaw', 'Turşu', 'Acı sos'] },
  { id: 'garden', name: 'Bahçe Burger', description: 'Nohut-mercimek köfte, avokado, domates, hardallı sos.', price: 199, category: 'BURGER', tag: 'Vegan', ingredients: ['Avokado', 'Domates', 'Marul', 'Hardallı sos'] },
  { id: 'slider', name: 'Slider Üçlü', description: 'Üç mini smash burger. Paylaşmak için (ya da paylaşmamak için).', price: 249, category: 'BURGER', ingredients: ['Cheddar', 'Turşu', 'Özel sos'] },

  // Yan ürünler (menüde yan ürün olarak seçilebilenlerin menuSideDelta değeri var)
  { id: 'patates', name: 'Klasik Patates', description: 'Çıtır, tuzlu, ev yapımı ketçapla.', price: 69, category: 'YAN', menuSideDelta: 0 },
  { id: 'baharatli', name: 'Baharatlı Patates', description: 'Özel baharat karışımı ve taze otlarla.', price: 79, category: 'YAN', menuSideDelta: 10 },
  { id: 'halka', name: 'Soğan Halkası', description: 'Bira hamurlu, dışı çıtır içi yumuşak.', price: 89, category: 'YAN', menuSideDelta: 20 },
  { id: 'tenders', name: 'Çıtır Tavuk Parçaları', description: 'Altı parça tenders, iki sos seçeneğiyle.', price: 119, category: 'YAN', tag: 'Paylaşımlık' },
  { id: 'mozzarella', name: 'Mozzarella Çubukları', description: 'Kızarmış, uzayan mozzarella, domates sos.', price: 99, category: 'YAN', menuSideDelta: 30 },
  { id: 'coleslaw', name: 'Coleslaw', description: 'Lahana, havuç ve hafif kremalı sos.', price: 49, category: 'YAN', menuSideDelta: 0 },

  // Tatlılar
  { id: 'milkshake', name: 'Çikolatalı Milkshake', description: 'Yoğun çikolata sosu ve krema ile.', price: 109, category: 'TATLI', tag: 'Favori' },
  { id: 'brownie', name: 'Sıcak Brownie', description: 'Bol çikolatalı, sıcak servis edilir.', price: 95, category: 'TATLI' },
  { id: 'cheesecake', name: 'Yaban Mersinli Cheesecake', description: 'Kremsi, bisküvi tabanlı, yaban mersini soslu.', price: 105, category: 'TATLI' },
  { id: 'sundae', name: 'Sundae', description: 'Vanilyalı dondurma, çikolata sosu, gofret.', price: 99, category: 'TATLI' },
  { id: 'churros', name: 'Churros', description: 'Tarçınlı şekerli, yanında çikolata sosu.', price: 89, category: 'TATLI' },

  // İçecekler
  { id: 'limonata', name: 'Ev Yapımı Limonata', description: 'Taze sıkılmış limon, buz.', price: 55, category: 'ICECEK', ingredients: ['Buz'], menuDrinkDelta: 0 },
  { id: 'nane', name: 'Nane Limonata', description: 'Taze nane yaprakları ve limon.', price: 59, category: 'ICECEK', ingredients: ['Buz', 'Nane'], menuDrinkDelta: 5 },
  { id: 'soguk-cay', name: 'Şeftalili Soğuk Çay', description: 'Demlenmiş çay, şeftali aroması, limon dilimi.', price: 55, category: 'ICECEK', ingredients: ['Buz', 'Limon'], menuDrinkDelta: 0 },
  { id: 'kola', name: 'Kola', description: 'Buzlu, 330 ml.', price: 45, category: 'ICECEK', ingredients: ['Buz'], menuDrinkDelta: 0 },
  { id: 'portakal', name: 'Taze Portakal Suyu', description: 'Siparişle sıkılır, şekersiz.', price: 69, category: 'ICECEK', ingredients: ['Buz'], menuDrinkDelta: 15 },
  { id: 'kahve', name: 'Buzlu Kahve', description: 'Soğuk demleme, süt ile.', price: 75, category: 'ICECEK', ingredients: ['Buz', 'Süt'], menuDrinkDelta: 25 },
  { id: 'ayran', name: 'Köpüklü Ayran', description: 'Bol köpüklü, nane serpilmiş.', price: 35, category: 'ICECEK', ingredients: ['Nane'], menuDrinkDelta: 0 },
  { id: 'soda', name: 'Limonlu Soda', description: 'Maden suyu, limon dilimi.', price: 35, category: 'ICECEK', ingredients: ['Buz', 'Limon'], menuDrinkDelta: 0 },
];

const extras = [
  { id: 'x-kofte', name: 'Ekstra köfte', price: 70 },
  { id: 'x-bacon', name: 'Bacon', price: 35 },
  { id: 'x-cheddar', name: 'Cheddar', price: 20 },
  { id: 'x-avokado', name: 'Avokado', price: 25 },
  { id: 'x-mantar', name: 'Mantar', price: 20 },
  { id: 'x-yumurta', name: 'Sahanda yumurta', price: 20 },
  { id: 'x-halka', name: 'Soğan halkası', price: 15 },
  { id: 'x-jalapeno', name: 'Jalapeño', price: 10 },
  { id: 'x-tursu', name: 'Turşu', price: 5 },
];

const sauces = [
  { id: 's-ketcap', name: 'Ketçap', price: 10, color: '#d62b1f' },
  { id: 's-mayo', name: 'Mayonez', price: 10, color: '#f5ecd0' },
  { id: 's-aci', name: 'Acı Mayo', price: 10, color: '#ff6a2b' },
  { id: 's-bbq', name: 'BBQ Sos', price: 10, color: '#6b2a12' },
  { id: 's-ranch', name: 'Ranch', price: 10, color: '#e9efe3' },
  { id: 's-hardal', name: 'Bal Hardal', price: 10, color: '#e8b923' },
  { id: 's-truf', name: 'Trüf Mayo', price: 15, color: '#c9b48a' },
  { id: 's-sarimsak', name: 'Sarımsaklı Yoğurt', price: 10, color: '#f2f0e6' },
  { id: 's-cheddar', name: 'Cheddar Sos', price: 15, color: '#ffb81c' },
];

async function main() {
  // Yeniden başlatmalarda (Docker, Render) adminin yaptığı fiyat değişiklikleri ezilmesin:
  // menü doluysa seed atlanır. Zorlamak için: npm run db:seed:force
  const force = process.argv.includes('--force');
  if (!force && (await prisma.product.count()) > 0) {
    console.log('Seed atlandı: veritabanında zaten ürün var (zorlamak için --force).');
    return;
  }

  for (const [i, p] of products.entries()) {
    const data = {
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
      imageUrl: `/menu/${p.id}.jpg`,
      tag: p.tag ?? null,
      ingredients: p.ingredients ?? [],
      calories: nutrition[p.id]?.calories ?? null,
      allergens: nutrition[p.id]?.allergens ?? [],
      dietary: nutrition[p.id]?.dietary ?? [],
      menuSideDelta: p.menuSideDelta ?? null,
      menuDrinkDelta: p.menuDrinkDelta ?? null,
      sortOrder: i,
    };
    await prisma.product.upsert({ where: { id: p.id }, update: data, create: { id: p.id, ...data } });
  }

  for (const [i, e] of extras.entries()) {
    const data = { kind: 'EXTRA' as const, name: e.name, price: e.price, sortOrder: i };
    await prisma.option.upsert({ where: { id: e.id }, update: data, create: { id: e.id, ...data } });
  }
  for (const [i, s] of sauces.entries()) {
    const data = { kind: 'SAUCE' as const, name: s.name, price: s.price, color: s.color, sortOrder: i };
    await prisma.option.upsert({ where: { id: s.id }, update: data, create: { id: s.id, ...data } });
  }

  const settings: Record<string, unknown> = {
    menuBaseAdd: 70,
    promos: { MASH10: 0.1 },
    // "Kendin tasarla" fiyatlandırması
    custom: {
      base: 150,
      pattyPrice: 70,
      perPatty: { cheese: 20, bacon: 35 },
      flat: { tomato: 8, lettuce: 8, onion: 8 },
    },
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: value as object },
      create: { key, value: value as object },
    });
  }

  const accounts = [
    { email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD, name: 'Admin', role: 'ADMIN' as const },
    { email: process.env.SEED_KITCHEN_EMAIL, password: process.env.SEED_KITCHEN_PASSWORD, name: 'Mutfak', role: 'KITCHEN' as const },
  ];
  for (const a of accounts) {
    if (!a.email || !a.password) continue;
    const passwordHash = await bcrypt.hash(a.password, 10);
    await prisma.user.upsert({
      where: { email: a.email },
      update: { role: a.role },
      create: { email: a.email, name: a.name, role: a.role, passwordHash },
    });
  }

  console.log(`Seed tamam: ${products.length} ürün, ${extras.length} ekstra, ${sauces.length} sos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
