"use client";

import { useT } from "@/lib/i18n";
import { useAuth, type Role } from "./AuthProvider";

/** Sayfa içeriğini giriş ve rol kontrolünden geçirir. */
export function Gate({ roles, children }: { roles?: Role[]; children: React.ReactNode }) {
  const { user, ready, openAuth } = useAuth();
  const { t } = useT();

  if (!ready) return <p className="py-24 text-center text-cream/50">{t("common.loading")}</p>;

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="text-6xl">🔒</p>
        <h2 className="mt-4 text-2xl font-extrabold">{t("gate.loginTitle")}</h2>
        <p className="mt-2 text-cream/60">{t("gate.loginBody")}</p>
        <button onClick={openAuth} className="mt-6 rounded-full bg-mustard px-8 py-3 font-extrabold text-ink">
          {t("auth.login")}
        </button>
      </div>
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="text-6xl">⛔</p>
        <h2 className="mt-4 text-2xl font-extrabold">{t("gate.noAccess")}</h2>
        <p className="mt-2 text-cream/60">{t("gate.noAccessBody", { role: user.role.toLowerCase() })}</p>
      </div>
    );
  }

  return <>{children}</>;
}

export function PageShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">{title}</h1>
      {subtitle && <p className="mt-2 text-cream/60">{subtitle}</p>}
      <div className="mt-10">{children}</div>
    </main>
  );
}
