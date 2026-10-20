/**
 * Menü içeriğinin İngilizce karşılıkları. Anahtarlar veritabanındaki kimliklerdir; Türkçe metin
 * (veritabanındaki) kanonik kaynaktır ve eşleşme yoksa olduğu gibi gösterilir. Yeni eklenen bir
 * ürünün çevirisi yoksa Türkçe adıyla görünür.
 */
export const PRODUCTS_EN: Record<string, { name: string; desc: string }> = {
  klasik: { name: "Classic Smash", desc: "Single smashed patty, cheddar, lettuce, tomato, house sauce." },
  cifte: { name: "Double Cheddar", desc: "Two smashed patties, double cheddar, caramelized onion, pickles." },
  bacon: { name: "Big Bacon", desc: "Crispy bacon, cheddar, two patties, smoky sauce." },
  bbq: { name: "BBQ Smokehouse", desc: "Double patty with BBQ sauce, bacon, crispy onion and cheddar." },
  jalapeno: { name: "Spicy Jalapeño", desc: "Jalapeño, pepper jack cheese, pickled red onion, hot mayo." },
  mantar: { name: "Mushroom Swiss", desc: "Butter-sautéed mushrooms, Swiss cheese, truffle mayo." },
  tavuk: { name: "Crispy Chicken", desc: "Spiced breaded chicken breast, pickles, ranch sauce." },
  "acili-tavuk": { name: "Hot Chicken", desc: "Nashville-style hot chicken, coleslaw, pickles." },
  garden: { name: "Garden Burger", desc: "Chickpea-lentil patty, avocado, tomato, mustard sauce." },
  slider: { name: "Slider Trio", desc: "Three mini smash burgers. For sharing (or not)." },
  patates: { name: "Classic Fries", desc: "Crispy, salted, with house-made ketchup." },
  baharatli: { name: "Seasoned Fries", desc: "Our spice blend and fresh herbs." },
  halka: { name: "Onion Rings", desc: "Beer-battered, crispy outside, soft inside." },
  tenders: { name: "Crispy Chicken Tenders", desc: "Six tenders with two dipping sauces." },
  mozzarella: { name: "Mozzarella Sticks", desc: "Fried, stretchy mozzarella with tomato sauce." },
  coleslaw: { name: "Coleslaw", desc: "Cabbage, carrot and a light creamy dressing." },
  milkshake: { name: "Chocolate Milkshake", desc: "Rich chocolate sauce and whipped cream." },
  brownie: { name: "Warm Brownie", desc: "Extra chocolatey, served warm." },
  cheesecake: { name: "Blueberry Cheesecake", desc: "Creamy, biscuit base, blueberry sauce." },
  sundae: { name: "Sundae", desc: "Vanilla ice cream, chocolate sauce, wafer." },
  churros: { name: "Churros", desc: "Cinnamon sugar, with chocolate sauce on the side." },
  limonata: { name: "Homemade Lemonade", desc: "Freshly squeezed lemon, ice." },
  nane: { name: "Mint Lemonade", desc: "Fresh mint leaves and lemon." },
  "soguk-cay": { name: "Peach Iced Tea", desc: "Brewed tea, peach flavor, lemon slice." },
  kola: { name: "Cola", desc: "Iced, 330 ml." },
  portakal: { name: "Fresh Orange Juice", desc: "Squeezed to order, no added sugar." },
  kahve: { name: "Iced Coffee", desc: "Cold brew with milk." },
  ayran: { name: "Frothy Ayran", desc: "Salted yogurt drink, topped with mint." },
  soda: { name: "Lemon Soda", desc: "Sparkling water with a lemon slice." },
};

export const TAGS_EN: Record<string, string> = {
  "Çok satan": "Best seller",
  "Aç gelin": "Come hungry",
  Acılı: "Spicy",
  Vegan: "Vegan",
  Paylaşımlık: "To share",
  Favori: "Favorite",
};

/** Üründen çıkarılabilen malzemeler (kanonik Türkçe ad -> İngilizce) */
export const INGREDIENTS_EN: Record<string, string> = {
  Cheddar: "Cheddar",
  Marul: "Lettuce",
  Domates: "Tomato",
  Turşu: "Pickles",
  "Özel sos": "House sauce",
  "Karamelize soğan": "Caramelized onion",
  Bacon: "Bacon",
  "Dumanlı sos": "Smoky sauce",
  "Çıtır soğan": "Crispy onion",
  "BBQ sos": "BBQ sauce",
  Jalapeño: "Jalapeño",
  "Pepper jack": "Pepper jack",
  "Soğan turşusu": "Pickled onion",
  "Acı mayonez": "Hot mayo",
  Mantar: "Mushroom",
  "Swiss peyniri": "Swiss cheese",
  "Trüf mayonez": "Truffle mayo",
  "Ranch sos": "Ranch sauce",
  Coleslaw: "Coleslaw",
  "Acı sos": "Hot sauce",
  Avokado: "Avocado",
  "Hardallı sos": "Mustard sauce",
  Buz: "Ice",
  Nane: "Mint",
  Limon: "Lemon",
  Süt: "Milk",
};

export const EXTRAS_EN: Record<string, string> = {
  "x-kofte": "Extra patty",
  "x-bacon": "Bacon",
  "x-cheddar": "Cheddar",
  "x-avokado": "Avocado",
  "x-mantar": "Mushroom",
  "x-yumurta": "Fried egg",
  "x-halka": "Onion ring",
  "x-jalapeno": "Jalapeño",
  "x-tursu": "Pickles",
};

export const SAUCES_EN: Record<string, string> = {
  "s-ketcap": "Ketchup",
  "s-mayo": "Mayonnaise",
  "s-aci": "Hot Mayo",
  "s-bbq": "BBQ Sauce",
  "s-ranch": "Ranch",
  "s-hardal": "Honey Mustard",
  "s-truf": "Truffle Mayo",
  "s-sarimsak": "Garlic Yogurt",
  "s-cheddar": "Cheddar Sauce",
};
