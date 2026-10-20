export type Category = "burger" | "yan" | "tatli" | "icecek";

export type MenuItem = {
  id: string;
  name: string;
  desc: string;
  price: number;
  category: Category;
  img: string;
  tag?: string;
  ingredients?: string[];
  /** yaklaşık kcal */
  calories?: number;
  /** gluten, milk, egg, sesame, soy, mustard, nuts */
  allergens?: string[];
  /** vegan, vegetarian, spicy */
  dietary?: string[];
};

const img = (slug: string) => `/menu/${slug}.jpg`;

export const MENU: MenuItem[] = [
  // Burgerler
  {
    id: "klasik",
    name: "Klasik Smash",
    desc: "Tek ezilmiş köfte, cheddar, marul, domates, özel sos.",
    price: 189,
    category: "burger",
    img: img("klasik"),
    tag: "Çok satan",
  },
  {
    id: "cifte",
    name: "Çifte Cheddar",
    desc: "İki ezilmiş köfte, çift cheddar, karamelize soğan, turşu.",
    price: 239,
    category: "burger",
    img: img("cifte"),
  },
  {
    id: "bacon",
    name: "Dev Bacon",
    desc: "Çıtır bacon, cheddar, iki köfte, dumanlı sos.",
    price: 259,
    category: "burger",
    img: img("bacon"),
    tag: "Aç gelin",
  },
  {
    id: "bbq",
    name: "BBQ Smokehouse",
    desc: "Barbekü soslu çifte köfte, bacon, çıtır soğan, cheddar.",
    price: 269,
    category: "burger",
    img: img("bbq"),
  },
  {
    id: "jalapeno",
    name: "Acılı Jalapeño",
    desc: "Jalapeño, pepper jack peyniri, kırmızı soğan turşusu, acı mayonez.",
    price: 219,
    category: "burger",
    img: img("jalapeno"),
    tag: "Acılı",
  },
  {
    id: "mantar",
    name: "Mantarlı Swiss",
    desc: "Tereyağında sotelenmiş mantar, Swiss peyniri, trüf mayonez.",
    price: 229,
    category: "burger",
    img: img("mantar"),
  },
  {
    id: "tavuk",
    name: "Çıtır Tavuk",
    desc: "Baharatlı galeta unlu tavuk göğsü, turşu, ranch sos.",
    price: 199,
    category: "burger",
    img: img("tavuk"),
  },
  {
    id: "acili-tavuk",
    name: "Acılı Tavuk",
    desc: "Nashville usulü acı soslu tavuk, coleslaw, turşu.",
    price: 209,
    category: "burger",
    img: img("acili-tavuk"),
    tag: "Acılı",
  },
  {
    id: "garden",
    name: "Bahçe Burger",
    desc: "Nohut-mercimek köfte, avokado, domates, hardallı sos.",
    price: 199,
    category: "burger",
    img: img("garden"),
    tag: "Vegan",
  },
  {
    id: "slider",
    name: "Slider Üçlü",
    desc: "Üç mini smash burger. Paylaşmak için (ya da paylaşmamak için).",
    price: 249,
    category: "burger",
    img: img("slider"),
  },

  // Yan ürünler
  {
    id: "patates",
    name: "Klasik Patates",
    desc: "Çıtır, tuzlu, ev yapımı ketçapla.",
    price: 69,
    category: "yan",
    img: img("patates"),
  },
  {
    id: "baharatli",
    name: "Baharatlı Patates",
    desc: "Özel baharat karışımı ve taze otlarla.",
    price: 79,
    category: "yan",
    img: img("baharatli"),
  },
  {
    id: "halka",
    name: "Soğan Halkası",
    desc: "Bira hamurlu, dışı çıtır içi yumuşak.",
    price: 89,
    category: "yan",
    img: img("halka"),
  },
  {
    id: "tenders",
    name: "Çıtır Tavuk Parçaları",
    desc: "Altı parça tenders, iki sos seçeneğiyle.",
    price: 119,
    category: "yan",
    img: img("tenders"),
    tag: "Paylaşımlık",
  },
  {
    id: "mozzarella",
    name: "Mozzarella Çubukları",
    desc: "Kızarmış, uzayan mozzarella, domates sos.",
    price: 99,
    category: "yan",
    img: img("mozzarella"),
  },
  {
    id: "coleslaw",
    name: "Coleslaw",
    desc: "Lahana, havuç ve hafif kremalı sos.",
    price: 49,
    category: "yan",
    img: img("coleslaw"),
  },

  // Tatlılar
  {
    id: "milkshake",
    name: "Çikolatalı Milkshake",
    desc: "Yoğun çikolata sosu ve krema ile.",
    price: 109,
    category: "tatli",
    img: img("milkshake"),
    tag: "Favori",
  },
  {
    id: "brownie",
    name: "Sıcak Brownie",
    desc: "Bol çikolatalı, sıcak servis edilir.",
    price: 95,
    category: "tatli",
    img: img("brownie"),
  },
  {
    id: "cheesecake",
    name: "Yaban Mersinli Cheesecake",
    desc: "Kremsi, bisküvi tabanlı, yaban mersini soslu.",
    price: 105,
    category: "tatli",
    img: img("cheesecake"),
  },
  {
    id: "sundae",
    name: "Sundae",
    desc: "Vanilyalı dondurma, çikolata sosu, gofret.",
    price: 99,
    category: "tatli",
    img: img("sundae"),
  },
  {
    id: "churros",
    name: "Churros",
    desc: "Tarçınlı şekerli, yanında çikolata sosu.",
    price: 89,
    category: "tatli",
    img: img("churros"),
  },

  // İçecekler
  {
    id: "limonata",
    name: "Ev Yapımı Limonata",
    desc: "Taze sıkılmış limon, buz.",
    price: 55,
    category: "icecek",
    img: img("limonata"),
  },
  {
    id: "nane",
    name: "Nane Limonata",
    desc: "Taze nane yaprakları ve limon.",
    price: 59,
    category: "icecek",
    img: img("nane"),
  },
  {
    id: "soguk-cay",
    name: "Şeftalili Soğuk Çay",
    desc: "Demlenmiş çay, şeftali aroması, limon dilimi.",
    price: 55,
    category: "icecek",
    img: img("soguk-cay"),
  },
  {
    id: "kola",
    name: "Kola",
    desc: "Buzlu, 330 ml.",
    price: 45,
    category: "icecek",
    img: img("kola"),
  },
  {
    id: "portakal",
    name: "Taze Portakal Suyu",
    desc: "Siparişle sıkılır, şekersiz.",
    price: 69,
    category: "icecek",
    img: img("portakal"),
  },
  {
    id: "kahve",
    name: "Buzlu Kahve",
    desc: "Soğuk demleme, süt ile.",
    price: 75,
    category: "icecek",
    img: img("kahve"),
  },
  {
    id: "ayran",
    name: "Köpüklü Ayran",
    desc: "Bol köpüklü, nane serpilmiş.",
    price: 35,
    category: "icecek",
    img: img("ayran"),
  },
  {
    id: "soda",
    name: "Limonlu Soda",
    desc: "Maden suyu, limon dilimi.",
    price: 35,
    category: "icecek",
    img: img("soda"),
  },
];

export type Filter = Category | "hepsi" | "menu" | "fav";

export const CATEGORIES: { id: Filter; label: string }[] = [
  { id: "hepsi", label: "Hepsi" },
  { id: "menu", label: "Menüler" },
  { id: "burger", label: "Burgerler" },
  { id: "yan", label: "Yan Ürünler" },
  { id: "tatli", label: "Tatlılar" },
  { id: "icecek", label: "İçecekler" },
  { id: "fav", label: "♥ Favoriler" },
];

export const itemById = (id: string) => MENU.find((m) => m.id === id)!;

/** Üründen çıkarılabilen malzemeler. */
export const INGREDIENTS: Record<string, string[]> = {
  klasik: ["Cheddar", "Marul", "Domates", "Turşu", "Özel sos"],
  cifte: ["Cheddar", "Karamelize soğan", "Turşu", "Özel sos"],
  bacon: ["Bacon", "Cheddar", "Dumanlı sos", "Turşu"],
  bbq: ["Bacon", "Çıtır soğan", "Cheddar", "BBQ sos"],
  jalapeno: ["Jalapeño", "Pepper jack", "Soğan turşusu", "Acı mayonez"],
  mantar: ["Mantar", "Swiss peyniri", "Trüf mayonez"],
  tavuk: ["Marul", "Turşu", "Ranch sos"],
  "acili-tavuk": ["Coleslaw", "Turşu", "Acı sos"],
  garden: ["Avokado", "Domates", "Marul", "Hardallı sos"],
  slider: ["Cheddar", "Turşu", "Özel sos"],
  limonata: ["Buz"],
  nane: ["Buz", "Nane"],
  "soguk-cay": ["Buz", "Limon"],
  kola: ["Buz"],
  portakal: ["Buz"],
  kahve: ["Buz", "Süt"],
  ayran: ["Nane"],
  soda: ["Buz", "Limon"],
};

export type Option = { id: string; name: string; price: number };

/** Burgerlere eklenebilen ekstra malzemeler. */
export const EXTRAS: Option[] = [
  { id: "x-kofte", name: "Ekstra köfte", price: 70 },
  { id: "x-bacon", name: "Bacon", price: 35 },
  { id: "x-cheddar", name: "Cheddar", price: 20 },
  { id: "x-avokado", name: "Avokado", price: 25 },
  { id: "x-mantar", name: "Mantar", price: 20 },
  { id: "x-yumurta", name: "Sahanda yumurta", price: 20 },
  { id: "x-halka", name: "Soğan halkası", price: 15 },
  { id: "x-jalapeno", name: "Jalapeño", price: 10 },
  { id: "x-tursu", name: "Turşu", price: 5 },
];

export type Sauce = Option & { color: string };

export const SAUCES: Sauce[] = [
  { id: "s-ketcap", name: "Ketçap", price: 10, color: "#d62b1f" },
  { id: "s-mayo", name: "Mayonez", price: 10, color: "#f5ecd0" },
  { id: "s-aci", name: "Acı Mayo", price: 10, color: "#ff6a2b" },
  { id: "s-bbq", name: "BBQ Sos", price: 10, color: "#6b2a12" },
  { id: "s-ranch", name: "Ranch", price: 10, color: "#e9efe3" },
  { id: "s-hardal", name: "Bal Hardal", price: 10, color: "#e8b923" },
  { id: "s-truf", name: "Trüf Mayo", price: 15, color: "#c9b48a" },
  { id: "s-sarimsak", name: "Sarımsaklı Yoğurt", price: 10, color: "#f2f0e6" },
  { id: "s-cheddar", name: "Cheddar Sos", price: 15, color: "#ffb81c" },
];

/** Menü = burger + yan ürün + içecek. */
export const MENU_BASE_ADD = 70;
export const MENU_SIDES = [
  { id: "patates", delta: 0 },
  { id: "baharatli", delta: 10 },
  { id: "halka", delta: 20 },
  { id: "mozzarella", delta: 30 },
  { id: "coleslaw", delta: 0 },
];
export const MENU_DRINKS = [
  { id: "kola", delta: 0 },
  { id: "limonata", delta: 0 },
  { id: "soguk-cay", delta: 0 },
  { id: "ayran", delta: 0 },
  { id: "soda", delta: 0 },
  { id: "nane", delta: 5 },
  { id: "portakal", delta: 15 },
  { id: "kahve", delta: 25 },
];
export const DEFAULT_SIDE = "patates";
export const DEFAULT_DRINK = "kola";

export const PROMOS: Record<string, number> = { SMASH10: 0.1 };

export function lineId(p: {
  itemId: string;
  mode: "tek" | "menu";
  side?: string;
  drink?: string;
  removed?: string[];
  extras?: string[];
  sauces?: string[];
  note?: string;
}) {
  return [
    p.itemId,
    p.mode,
    p.mode === "menu" ? `${p.side}+${p.drink}` : "",
    [...(p.removed ?? [])].sort().join(","),
    [...(p.extras ?? [])].sort().join(","),
    [...(p.sauces ?? [])].sort().join(","),
    p.note ?? "",
  ].join("|");
}

export const fmt = (n: number) => `${Math.round(n)} ₺`;
