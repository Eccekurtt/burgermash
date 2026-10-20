"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import { API_URL, STATUS_STEP, api, type OrderView } from "@/lib/api";
import { fmt } from "@/lib/data";
import { describeOrderItem } from "@/lib/describe";
import { useT } from "@/lib/i18n";
import { useMenu } from "./MenuProvider";

const STEPS = ["RECEIVED", "PREPARING", "ON_THE_WAY", "DELIVERED"] as const;

/**
 * Siparişi WebSocket ile canlı izler. Bağlantı kopsa bile 15 saniyede bir yoklama yapar.
 */
export function OrderTracker({ orderId, onDone }: { orderId: string; onDone?: () => void }) {
  const { t } = useT();
  const menuCtx = useMenu();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      api<OrderView>(`/orders/${orderId}`)
        .then((o) => !cancelled && (setOrder(o), setError(null)))
        .catch((e: Error) => !cancelled && setError(e.message));
    load();

    const socket = io(API_URL, { transports: ["websocket"] });
    socket.on("connect", () => {
      setLive(true);
      socket.emit("track", { orderId });
    });
    socket.on("disconnect", () => setLive(false));
    socket.on("order:updated", (o: OrderView) => {
      if (o.id === orderId) setOrder(o);
    });
    const poll = setInterval(load, 15000);

    return () => {
      cancelled = true;
      socket.close();
      clearInterval(poll);
    };
  }, [orderId]);

  if (error && !order) {
    return <p className="px-6 text-cream/70">{error}</p>;
  }
  if (!order) return <p className="px-6 text-cream/50">{t("track.loading")}</p>;

  const cancelled = order.status === "CANCELLED";
  const step = order.status === "CANCELLED" ? -1 : STATUS_STEP[order.status];
  const done = order.status === "DELIVERED" || cancelled;

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pb-6" data-lenis-prevent>
      <div>
        <h3 className="text-2xl font-extrabold">
          {cancelled ? t("track.cancelled") : done ? t("track.done") : t("track.preparing")}
        </h3>
        <p className="mt-1 text-sm text-cream/60">
          {t("track.orderNo")} <span className="font-mono">{order.id.slice(-8).toUpperCase()}</span>
          {" · "}
          <span className={live ? "text-leaf" : "text-cream/40"}>{live ? t("track.live") : t("track.connecting")}</span>
        </p>
      </div>

      {!cancelled && (
        <ol className="relative space-y-6 pl-8">
          <span className="absolute left-[11px] top-2 h-[calc(100%-1rem)] w-0.5 bg-cream/15" />
          <motion.span
            className="absolute left-[11px] top-2 w-0.5 bg-mustard"
            animate={{ height: `${(step / (STEPS.length - 1)) * 100}%` }}
            style={{ maxHeight: "calc(100% - 1rem)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
          {STEPS.map((s, i) => (
            <li key={s} className="relative">
              <motion.span
                initial={{ backgroundColor: "#3a2a1f" }}
                animate={{
                  scale: i === step && !done ? [1, 1.35, 1] : 1,
                  backgroundColor: i <= step ? "#ffb81c" : "#3a2a1f",
                }}
                // Yalnızca boyut nabız atar; renk bir kez geçiş yapıp sabit kalır (aksi halde nokta yanıp söner)
                transition={{
                  scale: { duration: 0.9, repeat: i === step && !done ? Infinity : 0 },
                  backgroundColor: { duration: 0.4 },
                }}
                className="absolute -left-8 top-0.5 h-6 w-6 rounded-full"
              />
              <span className={i <= step ? "font-bold" : "text-cream/40"}>{t(`status.${s}`)}</span>
            </li>
          ))}
        </ol>
      )}

      <ul className="space-y-2 rounded-2xl bg-cream/5 p-4 text-sm">
        {order.items.map((i) => {
          // Ham seçimlerden seçili dilde yeniden üret; eski siparişlerde sunucudaki metne dön
          const d = i.config ? describeOrderItem(i.config, menuCtx, t) : { name: i.name, details: i.details };
          return (
          <li key={i.id} className="flex justify-between gap-3">
            <span>
              {i.qty}× {d.name}
              {d.details.length > 0 && (
                <span className="block text-xs text-cream/50">{d.details.join(" · ")}</span>
              )}
            </span>
            <span className="shrink-0 text-cream/70">{fmt(i.unitPrice * i.qty)}</span>
          </li>
          );
        })}
        {order.discount > 0 && (
          <li className="flex justify-between text-leaf">
            <span>{t("cart.discount")} ({order.promo})</span>
            <span>−{fmt(order.discount)}</span>
          </li>
        )}
        <li className="flex justify-between border-t border-cream/10 pt-2 text-base font-extrabold">
          <span>{t("common.total")}</span>
          <span>{fmt(order.total)}</span>
        </li>
      </ul>

      {done && onDone && (
        <button onClick={onDone} className="rounded-full bg-mustard py-3 font-bold text-ink">
          {t("common.ok")}
        </button>
      )}
    </div>
  );
}
