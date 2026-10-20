"use client";

import dynamic from "next/dynamic";
import { Toast } from "./Toast";

// Sepet çekmecesi ve giriş penceresi ilk boyamayı engellemesin: hydration sonrası yüklenir
const CartDrawer = dynamic(() => import("./CartDrawer").then((m) => m.CartDrawer), { ssr: false });
const AuthModal = dynamic(() => import("./AuthModal").then((m) => m.AuthModal), { ssr: false });

export function Overlays() {
  return (
    <>
      <CartDrawer />
      <Toast />
      <AuthModal />
    </>
  );
}
