"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import { useCart } from "./CartProvider";

export function Toast() {
  const { toast, setOpen } = useCart();
  const { t } = useT();
  return (
    <AnimatePresence>
      {toast && (
        <motion.button
          key={toast.id}
          onClick={() => setOpen(true)}
          initial={{ y: 80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="fixed bottom-24 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-3 rounded-full bg-cream px-5 py-3 text-sm font-bold text-ink shadow-2xl sm:bottom-6"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full bg-leaf text-white">✓</span>
          {toast.text}
          <span className="underline">{t("toast.goToCart")}</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
