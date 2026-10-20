"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { en } from "./dict/en";
import { tr, type Key } from "./dict/tr";
import { useLocal } from "./useLocal";

export type Lang = "tr" | "en";
export type { Key };

const DICTS: Record<Lang, Record<Key, string>> = { tr, en };

type Vars = Record<string, string | number>;
type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Anahtardan metin; {ad} biçimindeki yer tutucular vars ile doldurulur */
  t: (key: Key, vars?: Vars) => string;
};

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang, ready] = useLocal<Lang>("bm-lang", "tr");

  // Daha önce dil seçilmiş mi? useLocal ilk değeri yazmadan önce, mount anında okunur.
  const hadStored = useRef(true);
  useEffect(() => {
    try {
      hadStored.current = localStorage.getItem("bm-lang") !== null;
    } catch {
      hadStored.current = true;
    }
  }, []);

  // İlk ziyarette tarayıcı dili Türkçe değilse İngilizce'ye geç
  useEffect(() => {
    if (ready && !hadStored.current && !navigator.language.toLowerCase().startsWith("tr")) setLang("en");
  }, [ready, setLang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key: Key, vars?: Vars) => {
      let s = DICTS[lang][key] ?? tr[key];
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
      return s;
    },
    [lang],
  );

  const value = useMemo<Ctx>(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useT() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useT must be used inside I18nProvider");
  return c;
}
