"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { DEFAULT_DRINK, DEFAULT_SIDE, fmt, lineId, type MenuItem } from "@/lib/data";
import { useT, type Key } from "@/lib/i18n";
import { useCart } from "./CartProvider";
import { useMenu } from "./MenuProvider";

export type Mode = "tek" | "menu";

function toggle(set: Set<string>, id: string) {
  const n = new Set(set);
  if (n.has(id)) n.delete(id);
  else n.add(id);
  return n;
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-cream/60">{title}</h3>
        {hint && <span className="text-xs text-cream/40">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      animate={{
        backgroundColor: on ? "#ffb81c" : "rgba(255,241,214,0.1)",
        color: on ? "#150e09" : "#fff1d6",
      }}
      className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
    >
      {children}
    </motion.button>
  );
}

function Tile({
  item,
  delta,
  selected,
  onClick,
  tIncluded,
}: {
  item: MenuItem;
  delta: number;
  selected: boolean;
  onClick: () => void;
  tIncluded: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl p-2 pr-3 text-left ring-2 transition-colors ${
        selected ? "bg-mustard/10 ring-mustard" : "bg-cream/5 ring-transparent hover:bg-cream/10"
      }`}
    >
      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
        <Image src={item.img} alt="" fill sizes="48px" className="object-cover" />
      </span>
      <span className="text-sm font-bold leading-tight">
        {item.name}
        <span className="block text-xs font-medium text-cream/50">
          {delta ? `+${delta} ₺` : tIncluded}
        </span>
      </span>
    </motion.button>
  );
}

export function ProductModal({
  item,
  initialMode,
  onClose,
}: {
  item: MenuItem;
  initialMode: Mode;
  onClose: () => void;
}) {
  const { add } = useCart();
  const { extras: EXTRAS, sauces: SAUCES, menu, itemById, ingLabel } = useMenu();
  const { t } = useT();
  const MENU_SIDES = menu.sides;
  const MENU_DRINKS = menu.drinks;
  const MENU_BASE_ADD = menu.baseAdd;
  const isBurger = item.category === "burger";
  const hasSauce = item.category === "burger" || item.category === "yan";
  const ingredients = item.ingredients ?? [];

  const [mode, setMode] = useState<Mode>(isBurger ? initialMode : "tek");
  const [side, setSide] = useState(DEFAULT_SIDE);
  const [drink, setDrink] = useState(DEFAULT_DRINK);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [extras, setExtras] = useState<Set<string>>(new Set());
  const [sauces, setSauces] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.documentElement.classList.add("lenis-stopped");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("lenis-stopped");
    };
  }, [onClose]);

  const sideDelta = MENU_SIDES.find((s) => s.id === side)?.delta ?? 0;
  const drinkDelta = MENU_DRINKS.find((d) => d.id === drink)?.delta ?? 0;
  const menuAdd = MENU_BASE_ADD + sideDelta + drinkDelta;
  const saving = itemById(side).price + itemById(drink).price - menuAdd;

  const unit = useMemo(() => {
    const ex = EXTRAS.filter((e) => extras.has(e.id)).reduce((s, e) => s + e.price, 0);
    const sa = SAUCES.filter((e) => sauces.has(e.id)).reduce((s, e) => s + e.price, 0);
    return item.price + (mode === "menu" ? menuAdd : 0) + ex + sa;
  }, [item.price, mode, menuAdd, extras, sauces, EXTRAS, SAUCES]);

  const handleAdd = () => {
    add(
      {
        id: lineId({
          itemId: item.id,
          mode,
          side,
          drink,
          removed: [...removed],
          extras: [...extras],
          sauces: [...sauces],
          note: note.trim(),
        }),
        price: unit,
        order: {
          productId: item.id,
          mode,
          ...(mode === "menu" ? { side, drink } : {}),
          removed: [...removed],
          extras: [...extras],
          sauces: [...sauces],
          ...(note.trim() ? { note: note.trim() } : {}),
        },
      },
      qty,
      t("toast.added", {
        name: `${qty > 1 ? qty + "× " : ""}${mode === "menu" ? t("item.menuOf", { name: item.name }) : item.name}`,
      }),
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center md:items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
    >
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        className="relative grid max-h-[94vh] w-full max-w-5xl grid-rows-[auto_1fr] overflow-hidden rounded-t-3xl bg-[#1f140d] shadow-2xl ring-1 ring-cream/10 md:max-h-[88vh] md:grid-cols-[0.9fr_1.1fr] md:grid-rows-1 md:rounded-3xl"
      >
        <button
          onClick={onClose}
          aria-label={t("common.close")}
          className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-black/50 backdrop-blur transition hover:rotate-90 hover:bg-black/70"
        >
          ✕
        </button>

        <motion.div
          layoutId={`img-${item.id}`}
          className="relative h-48 w-full md:h-full"
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        >
          <Image
            src={item.img}
            alt={item.name}
            fill
            sizes="(min-width: 768px) 45vw, 100vw"
            className="object-cover"
            priority
          />
        </motion.div>

        <div className="flex min-h-0 flex-col">
          <div data-lenis-prevent className="flex-1 space-y-7 overflow-y-auto p-6 pb-4 md:p-8">
            <header>
              {item.tag && (
                <span className="mb-2 inline-block rounded-full bg-ketchup-deep px-3 py-1 text-xs font-bold">
                  {item.tag}
                </span>
              )}
              <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">{item.name}</h2>
              <p className="mt-2 text-cream/70">{item.desc}</p>
            </header>

            {isBurger && (
              <div className="relative grid grid-cols-2 rounded-full bg-cream/10 p-1">
                {(["tek", "menu"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className="relative z-10 rounded-full py-3 text-sm font-extrabold"
                  >
                    {mode === m && (
                      <motion.span
                        layoutId="mode-pill"
                        className="absolute inset-0 -z-10 rounded-full bg-mustard"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className={mode === m ? "text-ink" : "text-cream/70"}>
                      {m === "tek" ? t("modal.single", { price: fmt(item.price) }) : t("modal.menu", { price: fmt(item.price + MENU_BASE_ADD) })}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {isBurger && mode === "menu" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-6 overflow-hidden"
              >
                <Section title={t("modal.side")} hint={t("modal.sideHint")}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {MENU_SIDES.map((s) => (
                      <Tile
                        key={s.id}
                        item={itemById(s.id)}
                        delta={s.delta}
                        selected={side === s.id}
                        onClick={() => setSide(s.id)}
                        tIncluded={t("modal.included")}
                      />
                    ))}
                  </div>
                </Section>
                <Section title={t("modal.drink")}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {MENU_DRINKS.map((d) => (
                      <Tile
                        key={d.id}
                        item={itemById(d.id)}
                        delta={d.delta}
                        selected={drink === d.id}
                        onClick={() => setDrink(d.id)}
                        tIncluded={t("modal.included")}
                      />
                    ))}
                  </div>
                </Section>
                {saving > 0 && (
                  <p className="rounded-2xl bg-leaf/15 px-4 py-3 text-sm font-bold text-leaf">
                    {t("modal.saving", { separate: fmt(itemById(side).price + itemById(drink).price), saved: fmt(saving) })}
                  </p>
                )}
              </motion.div>
            )}

            {ingredients.length > 0 && (
              <Section title={t("modal.remove")} hint={t("modal.removeHint")}>
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ing) => {
                    const off = removed.has(ing);
                    return (
                      <motion.button
                        key={ing}
                        type="button"
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setRemoved((r) => toggle(r, ing))}
                        animate={{
                          backgroundColor: off ? "#e8392b" : "rgba(255,241,214,0.1)",
                        }}
                        className="rounded-full px-4 py-2 text-sm font-bold"
                      >
                        <span className={off ? "line-through opacity-80" : ""}>{ingLabel(ing)}</span>
                        {off && <span className="ml-1.5">✕</span>}
                      </motion.button>
                    );
                  })}
                </div>
              </Section>
            )}

            {isBurger && (
              <Section title={t("modal.extras")}>
                <div className="flex flex-wrap gap-2">
                  {EXTRAS.map((e) => (
                    <Chip key={e.id} on={extras.has(e.id)} onClick={() => setExtras((x) => toggle(x, e.id))}>
                      {extras.has(e.id) ? "✓" : "+"} {e.name}
                      <span className="text-xs opacity-80">{e.price} ₺</span>
                    </Chip>
                  ))}
                </div>
              </Section>
            )}

            {hasSauce && (
              <Section title={t("modal.sauces")}>
                <div className="flex flex-wrap gap-2">
                  {SAUCES.map((s) => (
                    <Chip key={s.id} on={sauces.has(s.id)} onClick={() => setSauces((x) => toggle(x, s.id))}>
                      <span
                        className="h-3.5 w-3.5 rounded-full ring-1 ring-black/30"
                        style={{ background: s.color }}
                      />
                      {s.name}
                      <span className="text-xs opacity-80">{s.price} ₺</span>
                    </Chip>
                  ))}
                </div>
              </Section>
            )}

            {(item.calories || item.allergens?.length) && (
              <Section title={t("modal.nutrition")}>
                <div className="flex flex-wrap gap-2 text-sm">
                  {item.calories ? (
                    <span className="rounded-full bg-cream/10 px-3 py-1.5 font-bold">{item.calories} kcal</span>
                  ) : null}
                  {item.dietary?.includes("vegan") && (
                    <span className="rounded-full bg-leaf/20 px-3 py-1.5 font-bold text-leaf">🌱 {t("diet.vegan")}</span>
                  )}
                  {item.dietary?.includes("spicy") && (
                    <span className="rounded-full bg-ketchup/20 px-3 py-1.5 font-bold text-ketchup">🌶 {t("diet.spicy")}</span>
                  )}
                  {item.allergens?.map((a) => (
                    <span key={a} className="rounded-full bg-mustard/15 px-3 py-1.5 text-mustard">
                      {t(`allergen.${a}` as Key)}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-cream/40">{t("modal.nutritionNote")}</p>
              </Section>
            )}

            <Section title={t("modal.note")}>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={120}
                placeholder={t("modal.notePlaceholder")}
                className="w-full rounded-2xl bg-cream/10 px-4 py-3 text-sm outline-none ring-2 ring-transparent transition focus:ring-mustard placeholder:text-cream/30"
              />
            </Section>
          </div>

          <div className="flex items-center gap-3 border-t border-cream/10 bg-[#1f140d] p-4 md:p-5">
            <div className="flex items-center gap-2 rounded-full bg-cream/10 p-1">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="h-10 w-10 rounded-full text-lg hover:bg-cream/10"
                aria-label={t("common.decrease")}
              >
                −
              </button>
              <span className="w-6 text-center font-extrabold tabular-nums">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(20, q + 1))}
                className="h-10 w-10 rounded-full bg-mustard text-lg text-ink"
                aria-label={t("common.increase")}
              >
                +
              </button>
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleAdd}
              className="flex flex-1 items-center justify-between rounded-full bg-ketchup-deep px-6 py-3.5 text-lg font-extrabold"
            >
              <span>{t("modal.addToCart")}</span>
              <motion.span key={unit * qty} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                {fmt(unit * qty)}
              </motion.span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
