"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { api, type OrderView } from "@/lib/api";
import { describeOrderItem } from "@/lib/describe";
import { fmt, lineId } from "@/lib/data";
import { useT } from "@/lib/i18n";
import { useAuth } from "./AuthProvider";
import { useCart } from "./CartProvider";
import { useMenu } from "./MenuProvider";
// socket.io-client ağır olduğu için takip ekranı yalnızca gerektiğinde yüklenir
const OrderTracker = dynamic(() => import("./OrderTracker").then((m) => m.OrderTracker), { ssr: false });

type View = "cart" | "checkout" | "track";

function AnimatedPrice({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => fmt(v));
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.5, ease: "easeOut" });
    return () => c.stop();
  }, [value, mv]);
  return <motion.span>{text}</motion.span>;
}

function Promo() {
  const { promo, applyPromo, removePromo } = useCart();
  const { t } = useT();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  if (promo) {
    return (
      <div className="flex items-center justify-between rounded-2xl bg-leaf/15 px-4 py-3 text-sm font-bold text-leaf">
        <span>🎟 {t("cart.promoApplied", { code: promo.code })}</span>
        <button onClick={removePromo} className="text-xs underline">
          {t("cart.promoRemove")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!code.trim()) return;
          setBusy(true);
          setError(!(await applyPromo(code)));
          setBusy(false);
        }}
        className="flex gap-2"
      >
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(false);
          }}
          aria-label={t("cart.promoPlaceholder")}
          placeholder={t("cart.promoPlaceholder")}
          className="min-w-0 flex-1 rounded-full bg-cream/10 px-4 py-2.5 text-sm uppercase outline-none ring-2 ring-transparent transition focus:ring-mustard placeholder:normal-case placeholder:text-cream/30"
        />
        <button
          disabled={busy}
          className="rounded-full bg-cream/15 px-4 text-sm font-bold hover:bg-cream/25 disabled:opacity-50"
        >
          {t("cart.promoApply")}
        </button>
      </form>
      {error && <p className="mt-1.5 pl-2 text-xs text-ketchup">{t("cart.promoInvalid")}</p>}
    </div>
  );
}

/** Sepete uygun, henüz eklenmemiş ürünleri önerir (burgerin yanına patates, içecek, tatlı). */
function Upsell() {
  const { lines, add } = useCart();
  const { products, itemById } = useMenu();
  const { t } = useT();

  const inCart = new Set(lines.map((l) => l.order.productId).filter(Boolean));
  const burgers = lines.filter((l) => l.order.custom || itemById(l.order.productId ?? "").category === "burger");
  if (burgers.length === 0) return null;

  // Menü seçili burgerde patates ve içecek zaten var; yalnızca tatlı öner
  const allMenu = burgers.every((l) => l.order.mode === "menu");
  const pool = allMenu ? ["brownie", "milkshake", "churros"] : ["patates", "kola", "brownie", "limonata", "milkshake"];
  const picks = pool
    .filter((id) => !inCart.has(id))
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .slice(0, 3);
  if (picks.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-cream/50">{t("cart.upsell")}</p>
      <ul className="grid grid-cols-3 gap-2">
        {picks.map((p) => (
          <li key={p.id}>
            <button
              onClick={() =>
                add(
                  { id: lineId({ itemId: p.id, mode: "tek" }), price: p.price, order: { productId: p.id, mode: "tek" } },
                  1,
                  t("toast.added", { name: p.name }),
                )
              }
              className="group flex w-full flex-col items-center gap-1 rounded-2xl bg-cream/5 p-2 text-center transition hover:bg-cream/10"
              aria-label={t("cart.addItem", { name: p.name, price: fmt(p.price) })}
            >
              <span className="relative h-12 w-12 overflow-hidden rounded-xl">
                <Image src={p.img} alt="" fill sizes="48px" className="object-cover" />
              </span>
              <span className="line-clamp-1 text-xs font-bold">{p.name}</span>
              <span className="text-xs text-mustard">+ {fmt(p.price)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const field =
  "w-full rounded-2xl bg-cream/10 px-4 py-3 text-sm outline-none ring-2 ring-transparent transition focus:ring-mustard placeholder:text-cream/30";

function Checkout({ onBack, onPlaced }: { onBack: () => void; onPlaced: (id: string) => void }) {
  const { lines, promo, total, clear } = useCart();
  const { user, token, openAuth } = useAuth();
  const { t } = useT();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const order = await api<OrderView>("/orders", {
        token,
        body: {
          items: lines.map((l) => ({ ...l.order, qty: l.qty })),
          customerName: name.trim(),
          phone: phone.trim() || undefined,
          fulfillment,
          address: fulfillment === "delivery" ? address.trim() : undefined,
          note: note.trim() || undefined,
          promo: promo?.code,
        },
      });
      clear();
      onPlaced(order.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const label = "mb-1 block text-xs font-bold uppercase tracking-widest text-cream/60";
  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div data-lenis-prevent className="flex-1 space-y-4 overflow-y-auto px-6">
        <button type="button" onClick={onBack} className="text-sm text-cream/60 hover:text-cream">
          {t("checkout.back")}
        </button>

        {!user && (
          <button
            type="button"
            onClick={openAuth}
            className="w-full rounded-2xl bg-mustard/10 px-4 py-3 text-left text-sm ring-1 ring-mustard/40"
          >
            {t("checkout.loginHint")} <span className="font-bold underline">{t("auth.login")}</span>
          </button>
        )}

        <label className="block">
          <span className={label}>{t("checkout.name")}</span>
          <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </label>
        <label className="block">
          <span className={label}>{t("checkout.phone")}</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05xx xxx xx xx"
            className={field}
          />
        </label>

        <div className="grid grid-cols-2 gap-2 rounded-full bg-cream/10 p-1">
          {(
            [
              ["delivery", t("checkout.delivery")],
              ["pickup", t("checkout.pickup")],
            ] as const
          ).map(([v, text]) => (
            <button
              key={v}
              type="button"
              onClick={() => setFulfillment(v)}
              aria-pressed={fulfillment === v}
              className={`rounded-full py-2.5 text-sm font-bold transition-colors ${
                fulfillment === v ? "bg-mustard text-ink" : "text-cream/70"
              }`}
            >
              {text}
            </button>
          ))}
        </div>

        {fulfillment === "delivery" && (
          <label className="block">
            <span className={label}>{t("checkout.address")}</span>
            <textarea
              required
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("checkout.addressPlaceholder")}
              className={field}
            />
          </label>
        )}

        <label className="block">
          <span className={label}>{t("modal.note")}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className={field} />
        </label>

        <p className="rounded-2xl bg-cream/5 p-3 text-xs text-cream/50">{t("checkout.demoNote")}</p>
      </div>

      <div className="space-y-3 border-t border-cream/10 p-6">
        {error && <p role="alert" className="rounded-xl bg-ketchup/15 px-4 py-2 text-sm text-ketchup">{error}</p>}
        <button
          disabled={busy}
          className="flex w-full items-center justify-between rounded-full bg-ketchup-deep px-6 py-4 text-lg font-extrabold transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
        >
          <span>{busy ? t("checkout.sending") : t("checkout.confirm")}</span>
          <span>{fmt(total)}</span>
        </button>
      </div>
    </form>
  );
}

export function CartDrawer() {
  const { lines, subtotal, discount, total, open, setOpen, change, activeOrder, setActiveOrder } = useCart();
  const menuCtx = useMenu();
  const { t } = useT();
  // Kullanıcı bir sekme seçmediyse: sepet boşken aktif sipariş varsa takibi, yoksa sepeti göster
  const [picked, setView] = useState<View | null>(null);
  const view: View = picked ?? (lines.length === 0 && activeOrder ? "track" : "cart");

  const close = () => {
    setOpen(false);
    setView(null);
  };
  const tab = activeOrder ? view : view === "track" ? "cart" : view;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="bd"
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            key="panel"
            aria-label={t("cart.title")}
            className="fixed right-0 top-0 z-[71] flex h-full w-full max-w-md flex-col bg-[#1f140d] shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
          >
            <div className="flex items-center justify-between p-6 pb-3">
              <h2 className="text-2xl font-extrabold">
                {tab === "track" ? t("cart.titleTrack") : tab === "checkout" ? t("cart.titleCheckout") : t("cart.title")}
              </h2>
              <button
                onClick={close}
                className="grid h-10 w-10 place-items-center rounded-full bg-cream/10 transition hover:rotate-90 hover:bg-cream/20"
                aria-label={t("common.close")}
              >
                ✕
              </button>
            </div>

            {activeOrder && tab !== "checkout" && (
              <div className="mx-6 mb-3 grid grid-cols-2 gap-1 rounded-full bg-cream/10 p-1 text-sm font-bold">
                {(
                  [
                    ["cart", t("cart.tabCart")],
                    ["track", t("cart.tabActive")],
                  ] as const
                ).map(([v, text]) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`rounded-full py-2 transition-colors ${
                      tab === v ? "bg-mustard text-ink" : "text-cream/70"
                    }`}
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}

            {tab === "track" && activeOrder ? (
              <OrderTracker
                orderId={activeOrder}
                onDone={() => {
                  setActiveOrder(null);
                  close();
                }}
              />
            ) : tab === "checkout" ? (
              <Checkout
                onBack={() => setView("cart")}
                onPlaced={(id) => {
                  setActiveOrder(id);
                  setView("track");
                }}
              />
            ) : lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-cream/60">
                <span className="text-6xl">🥲</span>
                <p>{t("cart.empty")}</p>
              </div>
            ) : (
              <>
                <ul data-lenis-prevent className="flex-1 space-y-3 overflow-y-auto px-6">
                  <AnimatePresence initial={false}>
                    {lines.map((l) => {
                      const d = describeOrderItem(l.order, menuCtx, t);
                      return (
                        <motion.li
                          key={l.id}
                          layout
                          initial={{ opacity: 0, x: 40 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -60 }}
                          className="flex items-start gap-3 rounded-2xl bg-cream/5 p-3"
                        >
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream/10">
                            {d.img ? (
                              <Image src={d.img} alt="" fill sizes="64px" className="object-cover" />
                            ) : (
                              <span className="grid h-full place-items-center text-2xl">🍔</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold leading-tight">{d.name}</p>
                            {d.details.map((line) => (
                              <p key={line} className="mt-0.5 text-xs leading-snug text-cream/55">
                                {line}
                              </p>
                            ))}
                            <p className="mt-1.5 text-sm font-bold text-mustard">{fmt(l.price * l.qty)}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => change(l.id, -1)}
                              className="h-8 w-8 rounded-full bg-cream/10 hover:bg-cream/20"
                              aria-label={t("common.decrease")}
                            >
                              −
                            </button>
                            <span className="w-5 text-center font-bold tabular-nums">{l.qty}</span>
                            <button
                              onClick={() => change(l.id, 1)}
                              className="h-8 w-8 rounded-full bg-mustard text-ink"
                              aria-label={t("common.increase")}
                            >
                              +
                            </button>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
                <div className="space-y-4 border-t border-cream/10 p-6">
                  <Upsell />
                  <Promo />
                  {discount > 0 && (
                    <div className="space-y-1 text-sm text-cream/60">
                      <div className="flex justify-between">
                        <span>{t("cart.subtotal")}</span>
                        <span>{fmt(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-leaf">
                        <span>{t("cart.discount")}</span>
                        <span>−{fmt(discount)}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-end justify-between">
                    <span className="text-cream/60">{t("common.total")}</span>
                    <span className="text-3xl font-extrabold">
                      <AnimatedPrice value={total} />
                    </span>
                  </div>
                  <button
                    onClick={() => setView("checkout")}
                    className="w-full rounded-full bg-ketchup-deep py-4 text-lg font-extrabold transition-transform hover:scale-[1.02] active:scale-95"
                  >
                    {t("cart.continue")}
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
