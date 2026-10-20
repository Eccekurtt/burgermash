"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { CATEGORIES, DEFAULT_DRINK, DEFAULT_SIDE, fmt, lineId, type Filter, type MenuItem } from "@/lib/data";
import { useT } from "@/lib/i18n";
import { useLocal } from "@/lib/useLocal";
import { useCart } from "./CartProvider";
import { useMenu } from "./MenuProvider";
import type { Mode } from "./ProductModal";

// Ürün penceresi yalnızca bir karta tıklanınca gerekir; ilk yüklemeden ayrı parçaya alınır
const ProductModal = dynamic(() => import("./ProductModal").then((m) => m.ProductModal), { ssr: false });

const DIETS = ["vegan", "vegetarian", "spicy"] as const;
type Diet = (typeof DIETS)[number];
const DIET_ICON: Record<Diet, string> = { vegan: "🌱", vegetarian: "🥗", spicy: "🌶" };

function Card({
  item,
  menuMode,
  fav,
  onFav,
  onOpen,
}: {
  item: MenuItem;
  menuMode: boolean;
  fav: boolean;
  onFav: () => void;
  onOpen: () => void;
}) {
  const { add } = useCart();
  const { menu } = useMenu();
  const { t } = useT();
  const MENU_BASE_ADD = menu.baseAdd;
  const ref = useRef<HTMLDivElement>(null);
  const [added, setAdded] = useState(false);
  const isBurger = item.category === "burger";

  const mx = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const my = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const rotateX = useTransform(my, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(mx, [-0.5, 0.5], [-8, 8]);

  const quickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (menuMode) {
      add(
        {
          id: lineId({ itemId: item.id, mode: "menu", side: DEFAULT_SIDE, drink: DEFAULT_DRINK }),
          price: item.price + MENU_BASE_ADD,
          order: { productId: item.id, mode: "menu", side: DEFAULT_SIDE, drink: DEFAULT_DRINK },
        },
        1,
        t("toast.added", { name: t("item.menuOf", { name: item.name }) }),
      );
    } else {
      add(
        {
          id: lineId({ itemId: item.id, mode: "tek" }),
          price: item.price,
          order: { productId: item.id, mode: "tek" },
        },
        1,
        t("toast.added", { name: item.name }),
      );
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1100);
  };

  const dietary = (item.dietary ?? []).filter((d): d is Diet => d === "vegan" || d === "spicy");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      style={{ perspective: 800 }}
    >
      <motion.div
        ref={ref}
        data-product={item.id}
        // Fare ile kartın her yerine tıklamak da açar; klavye/ekran okuyucu için başlıktaki düğme kullanılır
        onClick={onOpen}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={(e) => {
          const r = ref.current!.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width - 0.5);
          my.set((e.clientY - r.top) / r.height - 0.5);
        }}
        onMouseLeave={() => {
          mx.set(0);
          my.set(0);
        }}
        className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl bg-[#241810] p-5 ring-1 ring-cream/10 transition-colors hover:ring-mustard/60 focus-visible:ring-mustard"
      >
        <div className="relative -mx-2 -mt-2 aspect-square overflow-hidden rounded-2xl">
          <motion.div layoutId={`img-${item.id}`} className="absolute inset-0">
            <Image
              src={item.img}
              alt={item.name}
              fill
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          </motion.div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {item.tag && (
            <span className="absolute right-3 top-3 z-10 rounded-full bg-ketchup-deep px-3 py-1 text-xs font-bold">
              {item.tag}
            </span>
          )}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => {
              e.stopPropagation();
              onFav();
            }}
            aria-label={fav ? t("menu.unfav") : t("menu.fav")}
            aria-pressed={fav}
            className="absolute left-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/50 backdrop-blur"
          >
            <motion.span
              key={String(fav)}
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 12 }}
              className={fav ? "text-ketchup" : "text-cream/80"}
            >
              {fav ? "♥" : "♡"}
            </motion.span>
          </motion.button>
        </div>

        <div className="mt-5 flex-1">
          <h3 className="text-xl font-extrabold">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
              aria-haspopup="dialog"
              className="rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-mustard"
            >
              {item.name}
            </button>
          </h3>
          <p className="mt-1 text-sm text-cream/60">{item.desc}</p>
          {(item.calories || dietary.length > 0) && (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-cream/70">
              {item.calories ? <span>{item.calories} kcal</span> : null}
              {dietary.map((d) => (
                <span key={d} className="rounded-full bg-cream/10 px-2 py-0.5">
                  {DIET_ICON[d]} {t(`diet.${d}`)}
                </span>
              ))}
            </p>
          )}
        </div>

        <div className="mt-5 flex items-end justify-between gap-2">
          <div>
            <span className="text-2xl font-extrabold text-mustard">
              {fmt(menuMode ? item.price + MENU_BASE_ADD : item.price)}
            </span>
            {isBurger && (
              <span className="block text-xs text-cream/50">
                {menuMode
                  ? t("menu.singleFrom", { price: fmt(item.price) })
                  : t("menu.menuFrom", { price: fmt(item.price + MENU_BASE_ADD) })}
              </span>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={quickAdd}
            className="relative h-11 shrink-0 overflow-hidden rounded-full bg-cream px-5 font-bold text-ink"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={added ? "ok" : "add"}
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -24, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="block"
              >
                {added ? t("menu.added") : t("menu.add")}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Menu() {
  const { products: MENU, source } = useMenu();
  const { t, lang } = useT();
  const [cat, setCat] = useState<Filter>("hepsi");
  const [query, setQuery] = useState("");
  const [diet, setDiet] = useState<Set<Diet>>(new Set());
  const [favs, setFavs] = useLocal<string[]>("bm-favs", []);
  const [selected, setSelected] = useState<{ item: MenuItem; mode: Mode } | null>(null);

  const norm = (s: string) => s.toLocaleLowerCase(lang === "tr" ? "tr" : "en");
  const q = norm(query.trim());
  const items = MENU.filter((m) => {
    if (cat === "menu" && m.category !== "burger") return false;
    if (cat === "fav" && !favs.includes(m.id)) return false;
    if (cat !== "hepsi" && cat !== "menu" && cat !== "fav" && m.category !== cat) return false;
    for (const d of diet) if (!m.dietary?.includes(d)) return false;
    if (q && !norm(`${m.name} ${m.desc}`).includes(q)) return false;
    return true;
  });

  const toggleFav = (id: string) =>
    setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  const toggleDiet = (d: Diet) =>
    setDiet((prev) => {
      const n = new Set(prev);
      if (n.has(d)) n.delete(d);
      else n.add(d);
      return n;
    });

  return (
    <section id="menu" className="px-5 py-28 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden">
          <motion.h2
            initial={{ y: "110%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="text-6xl font-extrabold tracking-tighter sm:text-8xl"
          >
            {t("menu.title")}
            <span className="text-ketchup">.</span>
          </motion.h2>
        </div>
        <p className="mt-3 text-cream/60">{t("menu.hint")}</p>
        {source === "local" && <p className="mt-2 text-sm text-mustard/80">{t("menu.offline")}</p>}

        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className="relative rounded-full px-5 py-2 text-sm font-bold"
              >
                {cat === c.id && (
                  <motion.span
                    layoutId="cat-pill"
                    className="absolute inset-0 rounded-full bg-mustard"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className={`relative ${cat === c.id ? "text-ink" : "text-cream/70"}`}>
                  {t(`cat.${c.id}`)}
                  {c.id === "fav" && favs.length > 0 && ` ${favs.length}`}
                </span>
              </button>
            ))}
          </div>

          <label className="relative block lg:w-72">
            <span className="sr-only">{t("menu.search")}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("menu.search")}
              className="w-full rounded-full bg-cream/10 py-2.5 pl-11 pr-4 text-sm outline-none ring-2 ring-transparent transition focus:ring-mustard placeholder:text-cream/40"
            />
            <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cream/50">
              ⌕
            </span>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label={t("menu.dietFilter")}>
          <span className="text-xs font-bold uppercase tracking-widest text-cream/60">{t("menu.dietFilter")}</span>
          {DIETS.map((d) => (
            <button
              key={d}
              onClick={() => toggleDiet(d)}
              aria-pressed={diet.has(d)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition-colors ${
                diet.has(d) ? "bg-leaf text-ink ring-leaf" : "text-cream/70 ring-cream/20 hover:ring-cream/40"
              }`}
            >
              {DIET_ICON[d]} {t(`diet.${d}`)}
            </button>
          ))}
        </div>

        <motion.div layout className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <Card
                key={`${cat === "menu" ? "m" : "s"}-${item.id}`}
                item={item}
                menuMode={cat === "menu"}
                fav={favs.includes(item.id)}
                onFav={() => toggleFav(item.id)}
                onOpen={() => setSelected({ item, mode: cat === "menu" ? "menu" : "tek" })}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {items.length === 0 && (
          <p className="mt-16 text-center text-cream/50">
            {cat === "fav" ? t("menu.noFavs") : t("menu.noResults")}
          </p>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <ProductModal
            key={selected.item.id}
            item={selected.item}
            initialMode={selected.mode}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
