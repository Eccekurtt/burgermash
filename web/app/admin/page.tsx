"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Gate, PageShell } from "@/components/Gate";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  available: boolean;
};
type Option = { id: string; kind: "EXTRA" | "SAUCE"; name: string; price: number; available: boolean };

const CATEGORY: Record<string, string> = { BURGER: "Burger", YAN: "Yan ürün", TATLI: "Tatlı", ICECEK: "İçecek" };

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-leaf" : "bg-cream/20"}`}
    >
      <span
        className="absolute top-1 h-5 w-5 rounded-full bg-cream transition-all"
        style={{ left: on ? 24 : 4 }}
      />
    </button>
  );
}

/** Fiyat alanı: Enter ya da odak kaybında kaydeder. */
function PriceInput({ value, onSave }: { value: number; onSave: (v: number) => Promise<void> }) {
  const [draft, setDraft] = useState(String(value));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const commit = async () => {
    const n = Number(draft);
    if (!Number.isInteger(n) || n < 0) {
      setDraft(String(value));
      return;
    }
    if (n === value) return;
    setState("saving");
    try {
      await onSave(n);
      setState("saved");
      setTimeout(() => setState("idle"), 1200);
    } catch {
      setState("error");
      setDraft(String(value));
    }
  };

  return (
    <span className="flex items-center gap-2">
      <input
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        aria-label="Fiyat"
        className="w-20 rounded-xl bg-cream/10 px-3 py-2 text-right text-sm font-bold outline-none ring-2 ring-transparent focus:ring-mustard"
      />
      <span className="w-14 text-xs">
        {state === "saving" && <span className="text-cream/50">kaydediliyor</span>}
        {state === "saved" && <span className="text-leaf">kaydedildi ✓</span>}
        {state === "error" && <span className="text-ketchup">hata</span>}
      </span>
    </span>
  );
}

function Panel() {
  const { token } = useAuth();
  const [tab, setTab] = useState<"products" | "options">("products");
  const [products, setProducts] = useState<Product[] | null>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    Promise.all([
      api<Product[]>("/admin/products", { token }),
      api<Option[]>("/admin/options", { token }),
    ])
      .then(([p, o]) => {
        if (cancelled) return;
        setProducts(p);
        setOptions(o);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [token]);

  const patchProduct = async (id: string, body: Partial<Product>) => {
    const updated = await api<Product>(`/admin/products/${id}`, { method: "PATCH", token, body });
    setProducts((prev) => prev?.map((p) => (p.id === id ? { ...p, ...updated } : p)) ?? prev);
  };
  const patchOption = async (id: string, body: Partial<Option>) => {
    const updated = await api<Option>(`/admin/options/${id}`, { method: "PATCH", token, body });
    setOptions((prev) => prev?.map((o) => (o.id === id ? { ...o, ...updated } : o)) ?? prev);
  };

  if (error) return <p className="text-ketchup">{error}</p>;
  if (!products || !options) return <p className="text-cream/50">Yükleniyor…</p>;

  return (
    <>
      <div className="mb-6 flex w-fit gap-1 rounded-full bg-cream/10 p-1 text-sm font-bold">
        {(
          [
            ["products", `Ürünler (${products.length})`],
            ["options", `Ekstra ve soslar (${options.length})`],
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

      <ul className="divide-y divide-cream/10 overflow-hidden rounded-3xl bg-cream/5">
        {tab === "products"
          ? products.map((p) => (
              <li key={p.id} className={`flex flex-wrap items-center gap-4 px-4 py-3 ${p.available ? "" : "opacity-50"}`}>
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-cream/10">
                  <Image src={p.imageUrl} alt="" fill sizes="48px" className="object-cover" />
                </span>
                <span className="min-w-40 flex-1">
                  <span className="block font-bold">{p.name}</span>
                  <span className="text-xs text-cream/50">{CATEGORY[p.category] ?? p.category}</span>
                </span>
                <PriceInput value={p.price} onSave={(price) => patchProduct(p.id, { price })} />
                <span className="flex items-center gap-2 text-xs text-cream/60">
                  {p.available ? "Satışta" : "Tükendi"}
                  <Toggle on={p.available} label={`${p.name} satışta`} onChange={(available) => patchProduct(p.id, { available })} />
                </span>
              </li>
            ))
          : options.map((o) => (
              <li key={o.id} className={`flex flex-wrap items-center gap-4 px-4 py-3 ${o.available ? "" : "opacity-50"}`}>
                <span className="min-w-40 flex-1">
                  <span className="block font-bold">{o.name}</span>
                  <span className="text-xs text-cream/50">{o.kind === "SAUCE" ? "Sos" : "Ekstra malzeme"}</span>
                </span>
                <PriceInput value={o.price} onSave={(price) => patchOption(o.id, { price })} />
                <Toggle on={o.available} label={`${o.name} satışta`} onChange={(available) => patchOption(o.id, { available })} />
              </li>
            ))}
      </ul>
    </>
  );
}

export default function AdminPage() {
  return (
    <PageShell title="Admin paneli" subtitle="Fiyat ve stok değişiklikleri anında menüye yansır.">
      <Gate roles={["ADMIN"]}>
        <Panel />
      </Gate>
    </PageShell>
  );
}
