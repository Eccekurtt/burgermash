"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ApiError } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { useAuth } from "./AuthProvider";

const field =
  "w-full rounded-2xl bg-cream/10 px-4 py-3 text-sm outline-none ring-2 ring-transparent transition focus:ring-mustard placeholder:text-cream/30";

function Form({ onDone }: { onDone: () => void }) {
  const { login, register } = useAuth();
  const { t } = useT();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, name, password);
      onDone();
    } catch (err) {
      // Bilinen yanıtlar seçili dilde; diğer hatalar sunucunun mesajıyla gösterilir
      const status = err instanceof ApiError ? err.status : 0;
      setError(
        status === 401 ? t("auth.invalid") : status === 409 ? t("auth.exists") : (err as Error).message,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-full bg-cream/10 p-1 text-sm font-bold">
        {(
          [
            ["login", t("auth.login")],
            ["register", t("auth.register")],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded-full py-2 transition-colors ${
              mode === m ? "bg-mustard text-ink" : "text-cream/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "register" && (
        <input
          required
          minLength={2}
          autoComplete="name"
          placeholder={t("auth.name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={field}
        />
      )}
      <input
        required
        type="email"
        autoComplete="email"
        placeholder={t("auth.email")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={field}
      />
      <input
        required
        type="password"
        minLength={mode === "register" ? 8 : 1}
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        placeholder={mode === "register" ? t("auth.passwordNew") : t("auth.password")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={field}
      />

      {error && <p className="rounded-xl bg-ketchup/15 px-4 py-2 text-sm text-ketchup">{error}</p>}

      <button
        disabled={busy}
        className="w-full rounded-full bg-ketchup-deep py-3.5 font-extrabold transition-transform active:scale-95 disabled:opacity-60"
      >
        {busy ? t("auth.wait") : mode === "login" ? t("auth.login") : t("auth.create")}
      </button>
    </form>
  );
}

export function AuthModal() {
  const { authOpen, closeAuth } = useAuth();
  const { t } = useT();

  return (
    <AnimatePresence>
      {authOpen && (
        <div className="fixed inset-0 z-[85] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={t("auth.dialog")}>
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuth}
          />
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative w-full max-w-sm rounded-3xl bg-[#1f140d] p-6 shadow-2xl ring-1 ring-cream/10"
          >
            <button
              onClick={closeAuth}
              aria-label={t("common.close")}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-cream/10 hover:bg-cream/20"
            >
              ✕
            </button>
            <h2 className="mb-5 text-2xl font-extrabold">{t("auth.welcome")}</h2>
            <Form onDone={closeAuth} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
