"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { BRAND } from "@/lib/brand";
import { useT } from "@/lib/i18n";
import { useAuth } from "./AuthProvider";
import { useCart } from "./CartProvider";
import { scrollToId, scrollToTop } from "./SmoothScroll";

const LINKS = [
  { id: "parcala", key: "nav.inside" },
  { id: "menu", key: "nav.menu" },
  { id: "tasarla", key: "nav.build" },
] as const;

function LangSwitch() {
  const { lang, setLang, t } = useT();
  return (
    <div role="group" aria-label={t("nav.language")} className="flex rounded-full bg-cream/10 p-0.5 text-xs font-extrabold">
      {(["tr", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-2.5 py-1 uppercase transition-colors ${
            lang === l ? "bg-mustard text-ink" : "text-cream/70 hover:text-cream"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function UserMenu() {
  const { user, openAuth, logout } = useAuth();
  const { t } = useT();
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <button onClick={openAuth} className="rounded-full px-4 py-2 text-sm font-bold hover:bg-cream/10">
        {t("nav.login")}
      </button>
    );
  }

  const items = [
    { href: "/siparislerim", label: t("nav.orders"), show: true },
    { href: "/mutfak", label: t("nav.kitchen"), show: user.role !== "CUSTOMER" },
    { href: "/admin", label: t("nav.admin"), show: user.role === "ADMIN" },
  ].filter((i) => i.show);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full bg-cream/10 py-1.5 pl-1.5 pr-3 text-sm font-bold hover:bg-cream/20"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-mustard text-ink">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden max-w-24 truncate sm:block">{user.name}</span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl bg-[#1f140d] p-1.5 shadow-2xl ring-1 ring-cream/10"
            >
              <p className="truncate px-3 py-2 text-xs text-cream/50">{user.email}</p>
              {items.map((i) => (
                <Link
                  key={i.href}
                  href={i.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-cream/10"
                >
                  {i.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-ketchup hover:bg-cream/10"
              >
                {t("nav.logout")}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Nav() {
  const { count, setOpen } = useCart();
  const { t } = useT();
  const { scrollY } = useScroll();
  const pathname = usePathname();
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const home = pathname === "/";

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 200);
    setSolid(y > 40);
  });

  return (
    <>
      <motion.header
      animate={{ y: hidden ? "-110%" : 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid || !home ? "bg-ink/80 backdrop-blur-md" : ""
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <button
          onClick={() => (home ? scrollToTop() : router.push("/"))}
          className="text-xl font-extrabold tracking-tight"
        >
          {BRAND.short}
          <span className="text-mustard">{BRAND.accent}</span>
        </button>

        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <li key={l.id}>
              <button
                onClick={() => (home ? scrollToId(l.id) : router.push(`/#${l.id}`))}
                className="group relative py-1 text-sm font-medium"
              >
                {t(l.key)}
                <span className="absolute inset-x-0 -bottom-0.5 h-0.5 origin-left scale-x-0 bg-mustard transition-transform duration-300 group-hover:scale-x-100" />
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <LangSwitch />
          <UserMenu />
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-full bg-mustard px-4 py-2 text-sm font-bold text-ink transition-transform hover:scale-105 active:scale-95"
            aria-label={`${t("nav.cart")} ${count}`}
          >
            <span className="hidden sm:inline">{t("nav.cart")}</span>
            <motion.span
              key={count}
              initial={{ scale: 1.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="grid h-6 min-w-6 place-items-center rounded-full bg-ink px-1.5 text-xs text-mustard"
            >
              {count}
            </motion.span>
          </button>
        </div>
      </nav>
      </motion.header>

      {/* Üst menü gizliyken sepete ulaşmak için yüzen düğme */}
      <AnimatePresence>
        {hidden && (
          <motion.button
            key="fab"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            onClick={() => setOpen(true)}
            aria-label={`${t("nav.showCart")} ${count}`}
            className="fixed bottom-5 right-5 z-50 flex h-14 items-center gap-2 rounded-full bg-mustard px-5 font-extrabold text-ink shadow-2xl"
          >
            <span aria-hidden>🛒</span>
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-ink px-1.5 text-xs text-mustard">
              {count}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
