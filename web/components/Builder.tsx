"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BurgerStack, type PartType, type StackPart } from "./Burger";
import { useCart } from "./CartProvider";
import { DEFAULT_DRINK, DEFAULT_SIDE, fmt } from "@/lib/data";
import { useT } from "@/lib/i18n";
import { useMenu } from "./MenuProvider";

type Extra = "cheese" | "bacon" | "tomato" | "lettuce" | "onion";

const EXTRAS: { id: Extra; emoji: string }[] = [
  { id: "cheese", emoji: "🧀" },
  { id: "bacon", emoji: "🥓" },
  { id: "tomato", emoji: "🍅" },
  { id: "lettuce", emoji: "🥬" },
  { id: "onion", emoji: "🧅" },
];

export function Builder() {
  const { add } = useCart();
  const { t } = useT();
  const { sauces: SAUCES, menu: menuCfg, custom } = useMenu();
  const MENU_BASE_ADD = menuCfg.baseAdd;
  // Malzeme fiyatı: köfte başına ya da sabit (sunucudaki fiyat ayarlarından)
  const extraPrice = (e: Extra, n: number) =>
    e in custom.perPatty ? custom.perPatty[e] * n : (custom.flat[e] ?? 0);
  const [patties, setPatties] = useState(1);
  const [extras, setExtras] = useState<Set<Extra>>(new Set(["cheese", "lettuce"]));
  const [sauces, setSauces] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState(false);

  const toggleSauce = (id: string) =>
    setSauces((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const toggle = (e: Extra) =>
    setExtras((prev) => {
      const n = new Set(prev);
      if (n.has(e)) n.delete(e);
      else n.add(e);
      return n;
    });

  const parts = useMemo<StackPart[]>(() => {
    const out: StackPart[] = [{ id: "bottom", type: "bottomBun" }];
    for (let i = 0; i < patties; i++) {
      out.push({ id: `patty-${i}`, type: "patty" });
      if (extras.has("cheese")) out.push({ id: `cheese-${i}`, type: "cheese" });
      if (extras.has("bacon")) out.push({ id: `bacon-${i}`, type: "bacon" });
    }
    (["onion", "tomato", "lettuce"] as Extra[]).forEach((e) => {
      if (extras.has(e)) out.push({ id: e, type: e as PartType });
    });
    out.push({ id: "top", type: "topBun" });
    return out;
  }, [patties, extras]);

  const saucePrice = SAUCES.filter((x) => sauces.has(x.id)).reduce((t, x) => t + x.price, 0);
  const price =
    saucePrice +
    (menu ? MENU_BASE_ADD : 0) +
    custom.base +
    (patties - 1) * custom.pattyPrice +
    EXTRAS.filter((e) => extras.has(e.id)).reduce((s, e) => s + extraPrice(e.id, patties), 0);

  const stackH = 70 + 40 + patties * 34 + 4 * 24 + patties * 40 + 40;

  return (
    <section id="tasarla" className="relative overflow-hidden px-5 py-28 sm:px-8">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-[#2a1409] to-transparent" />
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden">
          <motion.h2
            initial={{ y: "110%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="text-6xl font-extrabold leading-[0.95] tracking-tighter sm:text-8xl"
          >
            {t("build.title1")} <span className="text-mustard">{t("build.title2")}</span>
          </motion.h2>
        </div>

        <div className="mt-14 grid items-center gap-12 lg:grid-cols-2">
          <div className="relative mx-auto grid h-[26rem] w-full max-w-md place-items-end sm:h-[32rem]">
            <motion.div
              aria-hidden
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute inset-x-6 bottom-0 top-8 rounded-full bg-mustard/15"
            />
            <BurgerStack
              parts={parts}
              viewH={Math.max(stackH, 330)}
              animated
              className="relative h-full w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.5)]"
            />
          </div>

          <div className="space-y-8">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-widest text-cream/60">
                {t("build.patties")}
              </p>
              <div className="flex gap-3">
                {[1, 2, 3].map((n) => (
                  <motion.button
                    key={n}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setPatties(n)}
                    className={`h-16 w-20 rounded-2xl text-2xl font-extrabold transition-colors ${
                      patties === n ? "bg-mustard text-ink" : "bg-cream/10 hover:bg-cream/20"
                    }`}
                  >
                    {n}x
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-widest text-cream/60">
                {t("build.ingredients")}
              </p>
              <div className="flex flex-wrap gap-3">
                {EXTRAS.map((e) => {
                  const on = extras.has(e.id);
                  return (
                    <motion.button
                      key={e.id}
                      layout
                      whileTap={{ scale: 0.92 }}
                      onClick={() => toggle(e.id)}
                      animate={{
                        backgroundColor: on ? "#ffb81c" : "rgba(255,241,214,0.1)",
                        color: on ? "#150e09" : "#fff1d6",
                      }}
                      className="rounded-full px-5 py-3 font-bold"
                    >
                      {e.emoji} {t(`custom.${e.id}`)}{" "}
                      <span className="text-sm opacity-80">+{extraPrice(e.id, patties)}₺</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-widest text-cream/60">
                {t("modal.sauces")}
              </p>
              <div className="flex flex-wrap gap-2">
                {SAUCES.map((x) => {
                  const on = sauces.has(x.id);
                  return (
                    <motion.button
                      key={x.id}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => toggleSauce(x.id)}
                      animate={{
                        backgroundColor: on ? "#ffb81c" : "rgba(255,241,214,0.1)",
                        color: on ? "#150e09" : "#fff1d6",
                      }}
                      className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full ring-1 ring-black/30"
                        style={{ background: x.color }}
                      />
                      {x.name}
                      <span className="text-xs opacity-80">{x.price}₺</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setMenu((m) => !m)}
              aria-pressed={menu}
              className={`flex w-full items-center justify-between rounded-2xl p-4 text-left ring-2 transition-colors ${
                menu ? "bg-mustard/10 ring-mustard" : "bg-cream/5 ring-transparent hover:bg-cream/10"
              }`}
            >
              <span>
                <span className="block font-extrabold">{t("build.makeMenu", { price: MENU_BASE_ADD })}</span>
                <span className="text-sm text-cream/60">{t("build.menuNote")}</span>
              </span>
              <motion.span
                animate={{ backgroundColor: menu ? "#ffb81c" : "rgba(255,241,214,0.15)" }}
                className="relative h-7 w-12 rounded-full"
              >
                <motion.span
                  animate={{ x: menu ? 22 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 h-5 w-5 rounded-full bg-ink"
                  style={{ background: menu ? "#150e09" : "#fff1d6" }}
                />
              </motion.span>
            </button>

            <div className="flex items-center justify-between rounded-3xl bg-cream/5 p-6 ring-1 ring-cream/10">
              <div>
                <p className="text-sm text-cream/60">{t("common.total")}</p>
                <motion.p
                  key={price}
                  initial={{ y: -12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-4xl font-extrabold"
                >
                  {fmt(price)}
                </motion.p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => {
                  add(
                    {
                      id: `custom-${patties}-${[...extras].sort().join("")}-${[...sauces].sort().join("")}-${menu}`,
                      price,
                      order: {
                        custom: { patties, extras: [...extras] },
                        mode: menu ? "menu" : "tek",
                        ...(menu ? { side: DEFAULT_SIDE, drink: DEFAULT_DRINK } : {}),
                        sauces: [...sauces],
                      },
                    },
                    1,
                    t("toast.added", { name: t(menu ? "item.customMenu" : "item.custom") }),
                  );
                }}
                className="rounded-full bg-ketchup-deep px-7 py-4 text-lg font-extrabold"
              >
                {t("build.add")}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
