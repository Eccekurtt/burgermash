"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  EXTRAS as LOCAL_EXTRAS,
  INGREDIENTS,
  MENU as LOCAL_MENU,
  MENU_BASE_ADD,
  MENU_DRINKS,
  MENU_SIDES,
  SAUCES as LOCAL_SAUCES,
  type MenuItem,
  type Option,
  type Sauce,
} from "@/lib/data";
import { useT } from "@/lib/i18n";
import { EXTRAS_EN, INGREDIENTS_EN, PRODUCTS_EN, SAUCES_EN, TAGS_EN } from "@/lib/menu-en";
import nutrition from "@/lib/nutrition.json";

export type CustomConfig = {
  base: number;
  pattyPrice: number;
  perPatty: Record<string, number>;
  flat: Record<string, number>;
};

export type MenuData = {
  products: MenuItem[];
  extras: Option[];
  sauces: Sauce[];
  menu: {
    baseAdd: number;
    sides: { id: string; delta: number }[];
    drinks: { id: string; delta: number }[];
  };
  custom: CustomConfig;
  /** "api": menü sunucudan geldi, "local": sunucuya ulaşılamadı, yerleşik menü gösteriliyor */
  source: "api" | "local";
};

const NUTRITION = nutrition as Record<string, { calories: number; allergens: string[]; dietary: string[] }>;

const LOCAL: MenuData = {
  products: LOCAL_MENU.map((m) => ({ ...m, ingredients: INGREDIENTS[m.id] ?? [], ...NUTRITION[m.id] })),
  extras: LOCAL_EXTRAS,
  sauces: LOCAL_SAUCES,
  menu: { baseAdd: MENU_BASE_ADD, sides: MENU_SIDES, drinks: MENU_DRINKS },
  custom: {
    base: 150,
    pattyPrice: 70,
    perPatty: { cheese: 20, bacon: 35 },
    flat: { tomato: 8, lettuce: 8, onion: 8 },
  },
  source: "local",
};

type Ctx = MenuData & {
  /** Seçili dile çevrilmiş ürün */
  itemById: (id: string) => MenuItem;
  /** Üründen çıkarılabilen malzemenin (kanonik Türkçe ad) seçili dildeki karşılığı */
  ingLabel: (key: string) => string;
};
const MenuCtx = createContext<Ctx | null>(null);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useT();
  const [data, setData] = useState<MenuData>(LOCAL);

  useEffect(() => {
    let cancelled = false;
    api<Omit<MenuData, "source">>("/menu")
      .then((m) => {
        if (!cancelled) setData({ ...m, source: "api" });
      })
      .catch(() => {
        // Sunucu kapalı/uyuyor olabilir: yerleşik menüyle devam
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Ürün adı/açıklaması/etiketi seçili dile çevrilir; çevirisi olmayan (yeni eklenen) ürünler Türkçe kalır
  const localized = useMemo<MenuData>(() => {
    if (lang === "tr") return data;
    return {
      ...data,
      products: data.products.map((p) => ({
        ...p,
        name: PRODUCTS_EN[p.id]?.name ?? p.name,
        desc: PRODUCTS_EN[p.id]?.desc ?? p.desc,
        tag: p.tag ? (TAGS_EN[p.tag] ?? p.tag) : undefined,
      })),
      extras: data.extras.map((e) => ({ ...e, name: EXTRAS_EN[e.id] ?? e.name })),
      sauces: data.sauces.map((s) => ({ ...s, name: SAUCES_EN[s.id] ?? s.name })),
    };
  }, [data, lang]);

  const itemById = useCallback(
    (id: string) =>
      localized.products.find((p) => p.id === id) ??
      LOCAL.products.find((p) => p.id === id) ??
      ({ id, name: id, desc: "", price: 0, category: "burger", img: "" } as MenuItem),
    [localized.products],
  );

  const ingLabel = useCallback(
    (key: string) => (lang === "en" ? (INGREDIENTS_EN[key] ?? key) : key),
    [lang],
  );

  const value = useMemo<Ctx>(() => ({ ...localized, itemById, ingLabel }), [localized, itemById, ingLabel]);
  return <MenuCtx.Provider value={value}>{children}</MenuCtx.Provider>;
}

export function useMenu() {
  const c = useContext(MenuCtx);
  if (!c) throw new Error("useMenu must be used inside MenuProvider");
  return c;
}
