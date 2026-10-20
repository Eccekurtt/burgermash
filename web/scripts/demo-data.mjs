/**
 * Ekran görüntüleri için YEREL ortamda uydurma demo siparişleri oluşturur.
 *   node scripts/demo-data.mjs            (API: http://localhost:4000, mutfak demo hesabı)
 * Yayındaki veritabanına dokunmaz; yalnızca yerel API'ye karşı çalıştırın.
 */
const API = process.env.API_URL ?? "http://localhost:4000";
if (!API.includes("localhost")) throw new Error("Bu betik yalnızca yerel API için tasarlandı.");

const post = (path, body, token) =>
  fetch(API + path, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  }).then((r) => r.json());
const patch = (path, body, token) =>
  fetch(API + path, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  }).then((r) => r.json());

const kitchen = await post("/auth/login", { email: "mutfak@burgermash.dev", password: "mutfak12345" });
const token = kitchen.accessToken;

const orders = [
  {
    who: "Elif Yılmaz",
    fulfillment: "delivery",
    address: "Moda Cad. 24/5, Kadıköy",
    items: [
      { productId: "bacon", mode: "menu", side: "baharatli", drink: "limonata", removed: ["Turşu"], extras: ["x-kofte"], sauces: ["s-ranch"], qty: 1 },
      { productId: "cifte", mode: "tek", qty: 1 },
    ],
    status: ["PREPARING"],
  },
  {
    who: "Mert Kaya",
    fulfillment: "pickup",
    items: [
      { productId: "klasik", mode: "tek", qty: 2 },
      { productId: "milkshake", mode: "tek", qty: 1 },
    ],
    note: "Soğansız olsun",
    status: [],
  },
  {
    who: "Zeynep Arslan",
    fulfillment: "delivery",
    address: "Bagdat Cad. 112/8, Maltepe",
    items: [{ custom: { patties: 2, extras: ["cheese", "bacon", "lettuce"] }, mode: "menu", sauces: ["s-bbq", "s-ketcap"], qty: 1 }],
    status: [],
  },
  {
    who: "Can Demir",
    fulfillment: "delivery",
    address: "Atatürk Mah. Gül Sk. 7/3, Ataşehir",
    items: [
      { productId: "acili-tavuk", mode: "menu", side: "halka", drink: "kola", qty: 1 },
      { productId: "brownie", mode: "tek", qty: 1 },
    ],
    status: ["PREPARING", "ON_THE_WAY"],
  },
  {
    who: "Selin Aydın",
    fulfillment: "delivery",
    address: "Cumhuriyet Cad. 45/2, Beşiktaş",
    items: [{ productId: "garden", mode: "menu", side: "patates", drink: "nane", qty: 1 }],
    status: ["PREPARING", "ON_THE_WAY", "DELIVERED"],
  },
  {
    who: "Burak Şahin",
    fulfillment: "pickup",
    items: [{ productId: "slider", mode: "tek", qty: 1 }, { productId: "churros", mode: "tek", qty: 1 }],
    status: ["PREPARING", "ON_THE_WAY", "DELIVERED"],
  },
];

const ids = {};
for (const o of orders) {
  const created = await post("/orders", {
    items: o.items,
    customerName: o.who,
    fulfillment: o.fulfillment,
    address: o.address,
    note: o.note,
    promo: o.who === "Elif Yılmaz" ? "MASH10" : undefined,
  });
  if (!created.id) throw new Error(JSON.stringify(created));
  for (const s of o.status) await patch(`/orders/${created.id}/status`, { status: s }, token);
  ids[o.who] = created.id;
}
// Demo müşteri hesabı: "siparişlerim" ve canlı takip ekranları için
let session = await post("/auth/register", { email: "aysu@example.com", name: "Aysu Ece Kurt", password: "demo12345" });
if (!session.accessToken) session = await post("/auth/login", { email: "aysu@example.com", password: "demo12345" });
const mine = [
  { items: [{ productId: "cifte", mode: "menu", side: "halka", drink: "kola", sauces: ["s-bbq"], qty: 1 }, { productId: "cheesecake", mode: "tek", qty: 1 }], status: ["PREPARING", "ON_THE_WAY", "DELIVERED"] },
  { items: [{ productId: "klasik", mode: "tek", removed: ["Turşu"], qty: 2 }, { productId: "patates", mode: "tek", sauces: ["s-ranch"], qty: 1 }], status: ["PREPARING", "ON_THE_WAY", "DELIVERED"] },
  { items: [{ productId: "mantar", mode: "menu", side: "baharatli", drink: "limonata", extras: ["x-avokado"], qty: 1 }], status: ["PREPARING", "ON_THE_WAY"] },
];
for (const [i, o] of mine.entries()) {
  const created = await post("/orders", { items: o.items, customerName: "Aysu Ece Kurt", fulfillment: "delivery", address: "Örnek Mah. Demo Sk. 1/1, İstanbul" }, session.accessToken);
  if (!created.id) throw new Error(JSON.stringify(created));
  for (const s of o.status) await patch(`/orders/${created.id}/status`, { status: s }, token);
  if (i === mine.length - 1) ids["aktif-takip"] = created.id;
}
console.log(JSON.stringify(ids));
