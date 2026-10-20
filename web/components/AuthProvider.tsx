"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useLocal } from "@/lib/useLocal";

export type Role = "CUSTOMER" | "KITCHEN" | "ADMIN";
export type User = { id: string; email: string; name: string; role: Role };
type Session = { token: string; user: User } | null;

type Auth = {
  user: User | null;
  token: string | null;
  /** localStorage okunana kadar false */
  ready: boolean;
  authOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession, ready] = useLocal<Session>("bm-auth", null);
  const [authOpen, setAuthOpen] = useState(false);
  const token = session?.token ?? null;

  // Kayıtlı token hâlâ geçerli mi? Süresi dolduysa oturumu kapat.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api<User>("/auth/me", { token }).catch((e) => {
      if (!cancelled && e instanceof ApiError && e.status === 401) setSession(null);
    });
    return () => {
      cancelled = true;
    };
  }, [token, setSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const s = await api<{ accessToken: string; user: User }>("/auth/login", {
        body: { email, password },
      });
      setSession({ token: s.accessToken, user: s.user });
    },
    [setSession],
  );

  const register = useCallback(
    async (email: string, name: string, password: string) => {
      const s = await api<{ accessToken: string; user: User }>("/auth/register", {
        body: { email, name, password },
      });
      setSession({ token: s.accessToken, user: s.user });
    },
    [setSession],
  );

  const value = useMemo<Auth>(
    () => ({
      user: session?.user ?? null,
      token,
      ready,
      authOpen,
      openAuth: () => setAuthOpen(true),
      closeAuth: () => setAuthOpen(false),
      login,
      register,
      logout: () => setSession(null),
    }),
    [session, token, ready, authOpen, login, register, setSession],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
