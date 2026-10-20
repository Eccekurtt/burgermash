export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  opts: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method: opts.method ?? (opts.body ? "POST" : "GET"),
      headers: {
        ...(opts.body ? { "content-type": "application/json" } : {}),
        ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Sunucuya ulaşılamadı. Biraz sonra tekrar dene.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const m = data?.message;
    throw new ApiError(res.status, Array.isArray(m) ? m.join(", ") : (m ?? "Bir hata oluştu"));
  }
  return data as T;
}

export type OrderStatus = "RECEIVED" | "PREPARING" | "ON_THE_WAY" | "DELIVERED" | "CANCELLED";

/** Sipariş kaleminin ham seçimleri; sunucu fiyatı bunlardan yeniden hesaplar. */
export type OrderItemPayload = {
  productId?: string;
  custom?: { patties: number; extras: string[] };
  mode: "tek" | "menu";
  side?: string;
  drink?: string;
  removed?: string[];
  extras?: string[];
  sauces?: string[];
  note?: string;
};

export interface OrderItemView {
  id: string;
  name: string;
  unitPrice: number;
  qty: number;
  details: string[];
  imageUrl: string | null;
  config?: OrderItemPayload;
}

export interface OrderView {
  id: string;
  status: OrderStatus;
  fulfillment: "delivery" | "pickup";
  subtotal: number;
  discount: number;
  total: number;
  promo: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemView[];
  customerName?: string;
  phone?: string | null;
  address?: string | null;
  note?: string | null;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  RECEIVED: "Sipariş alındı",
  PREPARING: "Mutfakta",
  ON_THE_WAY: "Yolda",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal edildi",
};

export const STATUS_STEP: Record<Exclude<OrderStatus, "CANCELLED">, number> = {
  RECEIVED: 0,
  PREPARING: 1,
  ON_THE_WAY: 2,
  DELIVERED: 3,
};
