"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { api, type OrderItemPayload } from "@/lib/api";
import { useLocal } from "@/lib/useLocal";

/**
 * Sepet kalemi yalnızca ham seçimleri tutar. Ad ve detaylar gösterim sırasında seçili dilde
 * üretilir (lib/describe.ts); kesin fiyatı sunucu hesaplar, `price` yalnızca tahmindir.
 */
export type Line = {
  id: string;
  price: number;
  qty: number;
  order: OrderItemPayload;
};

type Toast = { id: number; text: string } | null;
type Promo = { code: string; rate: number } | null;

type Cart = {
  lines: Line[];
  count: number;
  subtotal: number;
  discount: number;
  total: number;
  promo: Promo;
  open: boolean;
  toast: Toast;
  /** Teslim edilmemiş son siparişin kimliği (takip için) */
  activeOrder: string | null;
  setActiveOrder: (id: string | null) => void;
  setOpen: (v: boolean) => void;
  add: (item: Omit<Line, "qty">, qty?: number, toastText?: string) => void;
  change: (id: string, delta: number) => void;
  clear: () => void;
  applyPromo: (code: string) => Promise<boolean>;
  removePromo: () => void;
};

const Ctx = createContext<Cart | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useLocal<Line[]>("bm-cart", []);
  const [promo, setPromo] = useLocal<Promo>("bm-promo", null);
  const [activeOrder, setActiveOrder] = useLocal<string | null>("bm-order", null);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const add = useCallback(
    (item: Omit<Line, "qty">, qty = 1, toastText?: string) => {
      setLines((prev) => {
        const found = prev.find((l) => l.id === item.id);
        if (found) return prev.map((l) => (l.id === item.id ? { ...l, qty: l.qty + qty } : l));
        return [...prev, { ...item, qty }];
      });
      const id = Date.now();
      setToast({ id, text: toastText ?? "✓" });
      setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2200);
    },
    [setLines],
  );

  const change = useCallback(
    (id: string, delta: number) => {
      setLines((prev) =>
        prev
          .map((l) => (l.id === id ? { ...l, qty: l.qty + delta } : l))
          .filter((l) => l.qty > 0),
      );
    },
    [setLines],
  );

  const clear = useCallback(() => {
    setLines([]);
    setPromo(null);
  }, [setLines, setPromo]);

  const applyPromo = useCallback(
    async (code: string) => {
      try {
        const p = await api<{ code: string; rate: number }>("/promo/validate", { body: { code } });
        setPromo(p);
        return true;
      } catch {
        return false;
      }
    },
    [setPromo],
  );

  const removePromo = useCallback(() => setPromo(null), [setPromo]);

  const value = useMemo<Cart>(() => {
    const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
    const discount = Math.round(subtotal * (promo?.rate ?? 0));
    return {
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      subtotal,
      discount,
      total: subtotal - discount,
      promo,
      open,
      toast,
      activeOrder,
      setActiveOrder,
      setOpen,
      add,
      change,
      clear,
      applyPromo,
      removePromo,
    };
  }, [lines, promo, open, toast, activeOrder, setActiveOrder, add, change, clear, applyPromo, removePromo]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
