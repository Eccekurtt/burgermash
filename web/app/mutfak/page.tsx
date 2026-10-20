"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { io } from "socket.io-client";
import { Gate, PageShell } from "@/components/Gate";
import { useAuth } from "@/components/AuthProvider";
import { API_URL, STATUS_LABEL, api, type OrderStatus, type OrderView } from "@/lib/api";
import { fmt } from "@/lib/data";

const COLUMNS: { status: OrderStatus; title: string; next: OrderStatus; action: string }[] = [
  { status: "RECEIVED", title: "Yeni", next: "PREPARING", action: "Hazırlamaya başla" },
  { status: "PREPARING", title: "Hazırlanıyor", next: "ON_THE_WAY", action: "Yola çıkar / hazır" },
  { status: "ON_THE_WAY", title: "Yolda", next: "DELIVERED", action: "Teslim edildi" },
];

function beep() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    o.start();
    o.stop(ctx.currentTime + 0.4);
  } catch {
    // ses izni yoksa sessiz devam
  }
}

function useNow(ms = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

function minutesAgo(iso: string, now: number) {
  const m = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
  return m < 1 ? "şimdi" : `${m} dk önce`;
}

function Ticket({
  order,
  col,
  now,
  busy,
  onMove,
}: {
  order: OrderView;
  col: (typeof COLUMNS)[number];
  now: number;
  busy: boolean;
  onMove: (id: string, status: OrderStatus) => void;
}) {
  const late = (now - new Date(order.createdAt).getTime()) / 60000 > 15;
  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.9, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`rounded-2xl bg-[#2a1c12] p-4 ring-2 ${late ? "ring-ketchup/60" : "ring-cream/10"}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-bold">#{order.id.slice(-6).toUpperCase()}</span>
        <span className={`text-xs ${late ? "font-bold text-ketchup" : "text-cream/50"}`}>
          {minutesAgo(order.createdAt, now)}
        </span>
      </div>
      <p className="mt-1 text-sm text-cream/70">
        {order.customerName} · {order.fulfillment === "pickup" ? "Gel-al" : "Teslimat"}
      </p>
      {order.fulfillment === "delivery" && order.address && (
        <p className="text-xs text-cream/50">{order.address}</p>
      )}

      <ul className="mt-3 space-y-2 border-t border-cream/10 pt-3">
        {order.items.map((i) => (
          <li key={i.id} className="text-sm">
            <span className="font-bold">
              {i.qty}× {i.name}
            </span>
            {i.details.map((d) => (
              <span key={d} className="block text-xs text-mustard/80">
                {d}
              </span>
            ))}
          </li>
        ))}
      </ul>
      {order.note && <p className="mt-3 rounded-lg bg-mustard/10 px-3 py-2 text-xs text-mustard">Not: {order.note}</p>}

      <div className="mt-4 flex items-center gap-2">
        <button
          disabled={busy}
          onClick={() => onMove(order.id, col.next)}
          className="flex-1 rounded-full bg-mustard py-2 text-sm font-extrabold text-ink disabled:opacity-50"
        >
          {col.action}
        </button>
        {order.status !== "ON_THE_WAY" && (
          <button
            disabled={busy}
            onClick={() => {
              if (confirm("Siparişi iptal etmek istiyor musun?")) onMove(order.id, "CANCELLED");
            }}
            className="rounded-full bg-ketchup/20 px-3 py-2 text-xs font-bold text-ketchup disabled:opacity-50"
            aria-label="İptal et"
          >
            İptal
          </button>
        )}
      </div>
      <p className="mt-2 text-right text-xs text-cream/40">{fmt(order.total)}</p>
    </motion.li>
  );
}

function Board() {
  const { token } = useAuth();
  const now = useNow();
  const [tab, setTab] = useState<"live" | "history">("live");
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [history, setHistory] = useState<OrderView[] | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api<OrderView[]>("/kitchen/orders", { token })
      .then((o) => !cancelled && setOrders(o))
      .catch((e: Error) => !cancelled && setError(e.message));

    const socket = io(API_URL, { auth: { token }, transports: ["websocket"] });
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("order:new", (o: OrderView) => {
      setOrders((prev) => (prev.some((x) => x.id === o.id) ? prev : [...prev, o]));
      beep();
    });
    socket.on("order:updated", (o: OrderView) => {
      setOrders((prev) => {
        const done = o.status === "DELIVERED" || o.status === "CANCELLED";
        if (done) return prev.filter((x) => x.id !== o.id);
        return prev.some((x) => x.id === o.id) ? prev.map((x) => (x.id === o.id ? o : x)) : [...prev, o];
      });
    });
    return () => {
      cancelled = true;
      socket.close();
    };
  }, [token]);

  useEffect(() => {
    if (tab !== "history" || !token) return;
    let cancelled = false;
    api<OrderView[]>("/kitchen/orders?history=true", { token })
      .then((o) => !cancelled && setHistory(o))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [tab, token]);

  const move = useCallback(
    async (id: string, status: OrderStatus) => {
      setBusyId(id);
      setError(null);
      try {
        await api(`/orders/${id}/status`, { method: "PATCH", token, body: { status } });
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusyId(null);
      }
    },
    [token],
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-cream/10 p-1 text-sm font-bold">
          {(
            [
              ["live", `Canlı (${orders.length})`],
              ["history", "Geçmiş"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`rounded-full px-5 py-2 transition-colors ${tab === v ? "bg-mustard text-ink" : "text-cream/70"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className={`text-sm font-bold ${connected ? "text-leaf" : "text-cream/40"}`}>
          {connected ? "● Canlı bağlantı" : "○ Bağlanıyor…"}
        </span>
      </div>

      {error && <p className="mb-4 rounded-xl bg-ketchup/15 px-4 py-2 text-sm text-ketchup">{error}</p>}

      {tab === "live" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {COLUMNS.map((col) => {
            const list = orders.filter((o) => o.status === col.status);
            return (
              <section key={col.status} className="rounded-3xl bg-cream/5 p-4">
                <h2 className="mb-4 flex items-center justify-between px-1 text-lg font-extrabold">
                  {col.title}
                  <span className="rounded-full bg-cream/10 px-3 py-0.5 text-sm">{list.length}</span>
                </h2>
                <ul className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {list.map((o) => (
                      <Ticket key={o.id} order={o} col={col} now={now} busy={busyId === o.id} onMove={move} />
                    ))}
                  </AnimatePresence>
                </ul>
                {list.length === 0 && <p className="py-8 text-center text-sm text-cream/30">Sipariş yok</p>}
              </section>
            );
          })}
        </div>
      ) : (
        <ul className="space-y-2">
          {(history ?? []).map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-cream/5 px-4 py-3 text-sm">
              <span className="font-mono">#{o.id.slice(-6).toUpperCase()}</span>
              <span className="text-cream/60">{o.customerName}</span>
              <span className="text-cream/60">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</span>
              <span className={o.status === "DELIVERED" ? "text-leaf" : "text-ketchup"}>{STATUS_LABEL[o.status]}</span>
              <span className="font-bold">{fmt(o.total)}</span>
            </li>
          ))}
          {history && history.length === 0 && <p className="py-8 text-center text-cream/40">Geçmiş sipariş yok.</p>}
        </ul>
      )}
    </>
  );
}

export default function KitchenPage() {
  return (
    <PageShell title="Mutfak ekranı" subtitle="Yeni siparişler anında düşer. Durumu değiştirince müşterinin ekranı canlı güncellenir.">
      <Gate roles={["KITCHEN", "ADMIN"]}>
        <Board />
      </Gate>
    </PageShell>
  );
}
