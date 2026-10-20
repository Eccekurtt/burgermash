"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Gate, PageShell } from "@/components/Gate";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { api, type OrderStatus, type OrderView } from "@/lib/api";
import { fmt } from "@/lib/data";
import { describeOrderItem } from "@/lib/describe";
import { useT } from "@/lib/i18n";
import { useMenu } from "@/components/MenuProvider";

const badge: Record<OrderStatus, string> = {
  RECEIVED: "bg-mustard/20 text-mustard",
  PREPARING: "bg-mustard/20 text-mustard",
  ON_THE_WAY: "bg-mustard/20 text-mustard",
  DELIVERED: "bg-leaf/20 text-leaf",
  CANCELLED: "bg-ketchup/20 text-ketchup",
};

function Orders() {
  const { token } = useAuth();
  const { add, setOpen, setActiveOrder } = useCart();
  const { t, lang } = useT();
  const menuCtx = useMenu();
  const [orders, setOrders] = useState<OrderView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api<OrderView[]>("/orders/mine", { token })
      .then((o) => !cancelled && setOrders(o))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [token]);

  const reorder = (o: OrderView) => {
    for (const i of o.items) {
      if (!i.config) continue;
      add({ id: `r|${JSON.stringify(i.config)}`, price: i.unitPrice, order: i.config }, i.qty);
    }
    setOpen(true);
  };

  if (error) return <p className="text-cream/70">{error}</p>;
  if (!orders) return <p className="text-cream/50">{t("common.loading")}</p>;
  if (orders.length === 0) {
    return (
      <div className="py-16 text-center text-cream/60">
        <p className="text-6xl">🍔</p>
        <p className="mt-4">{t("orders.empty")}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((o, idx) => {
        const active = !["DELIVERED", "CANCELLED"].includes(o.status);
        return (
          <motion.li
            key={o.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-3xl bg-[#241810] p-5 ring-1 ring-cream/10"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-sm text-cream/50">
                  #{o.id.slice(-8).toUpperCase()} · {new Date(o.createdAt).toLocaleString(lang === "tr" ? "tr-TR" : "en-US")}
                </p>
                <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${badge[o.status]}`}>
                  {t(`status.${o.status}`)}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-mustard">{fmt(o.total)}</p>
            </div>

            <ul className="mt-4 space-y-3">
              {o.items.map((i) => {
                const d = i.config ? describeOrderItem(i.config, menuCtx, t) : { name: i.name, details: i.details, img: undefined };
                const img = d.img ?? i.imageUrl ?? undefined;
                return (
                  <li key={i.id} className="flex items-center gap-3">
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-cream/10">
                      {img ? (
                        <Image src={img} alt="" fill sizes="48px" className="object-cover" />
                      ) : (
                        <span className="grid h-full place-items-center">🍔</span>
                      )}
                    </span>
                    <span className="text-sm">
                      <span className="font-bold">
                        {i.qty}× {d.name}
                      </span>
                      {d.details.length > 0 && (
                        <span className="block text-xs text-cream/50">{d.details.join(" · ")}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 flex flex-wrap gap-2">
              {active && (
                <button
                  onClick={() => {
                    setActiveOrder(o.id);
                    setOpen(true);
                  }}
                  className="rounded-full bg-mustard px-5 py-2 text-sm font-bold text-ink"
                >
                  {t("orders.track")}
                </button>
              )}
              <button
                onClick={() => reorder(o)}
                className="rounded-full bg-cream/10 px-5 py-2 text-sm font-bold hover:bg-cream/20"
              >
                {t("orders.reorder")}
              </button>
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}

export default function MyOrdersPage() {
  const { t } = useT();
  return (
    <PageShell title={t("orders.title")} subtitle={t("orders.subtitle")}>
      <Gate>
        <Orders />
      </Gate>
    </PageShell>
  );
}
