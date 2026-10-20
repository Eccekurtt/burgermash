import type { OrderItemPayload } from "./api";
import type { Key } from "./i18n";
import type { MenuItem, Option, Sauce } from "./data";

type Menu = {
  itemById: (id: string) => MenuItem;
  ingLabel: (key: string) => string;
  extras: Option[];
  sauces: Sauce[];
};
type T = (key: Key, vars?: Record<string, string | number>) => string;

const CUSTOM_KEYS = {
  cheese: "custom.cheese",
  bacon: "custom.bacon",
  tomato: "custom.tomato",
  lettuce: "custom.lettuce",
  onion: "custom.onion",
} as const;

/**
 * Sipariş kaleminin ham seçimlerinden, SEÇİLİ DİLDE ad ve detay satırlarını üretir.
 * Sepet, takip ve sipariş geçmişi bunu kullanır; böylece dil değişince metinler de değişir.
 */
export function describeOrderItem(cfg: OrderItemPayload, menu: Menu, t: T) {
  const menuMode = cfg.mode === "menu";
  const details: string[] = [];
  let name: string;
  let img: string | undefined;

  if (menuMode) {
    details.push(
      t("detail.menu", {
        side: menu.itemById(cfg.side ?? "patates").name,
        drink: menu.itemById(cfg.drink ?? "kola").name,
      }),
    );
  }

  if (cfg.custom) {
    name = t(menuMode ? "item.customMenu" : "item.custom");
    const labels = cfg.custom.extras.map((e) => t(CUSTOM_KEYS[e as keyof typeof CUSTOM_KEYS] ?? "custom.cheese"));
    details.unshift(`${t("detail.patties", { n: cfg.custom.patties })}${labels.length ? ": " + labels.join(", ") : ""}`);
  } else {
    const p = menu.itemById(cfg.productId ?? "");
    name = menuMode ? t("item.menuOf", { name: p.name }) : p.name;
    img = p.img || undefined;
    if (cfg.removed?.length) details.push(`${t("detail.remove")}: ${cfg.removed.map(menu.ingLabel).join(", ")}`);
    const ex = (cfg.extras ?? []).map((id) => menu.extras.find((e) => e.id === id)?.name ?? id);
    if (ex.length) details.push(`${t("detail.extra")}: ${ex.join(", ")}`);
  }

  const sa = (cfg.sauces ?? []).map((id) => menu.sauces.find((s) => s.id === id)?.name ?? id);
  if (sa.length) details.push(`${t("detail.sauce")}: ${sa.join(", ")}`);
  if (cfg.note?.trim()) details.push(`${t("detail.note")}: ${cfg.note.trim()}`);

  return { name, details, img };
}
