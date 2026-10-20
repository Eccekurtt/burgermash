import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { AuthProvider } from "@/components/AuthProvider";
import { CartProvider } from "@/components/CartProvider";
import { MenuProvider } from "@/components/MenuProvider";
import { I18nProvider } from "@/lib/i18n";
import { Nav } from "@/components/Nav";
import { Overlays } from "@/components/Overlays";
import { PWARegister } from "@/components/PWARegister";
import { SmoothScroll } from "@/components/SmoothScroll";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: `${BRAND.name} — Elle Ezilen Burger`,
  description:
    `${BRAND.name}: elle ezilen köfte, brioche ekmek ve kendi burgerini tasarlama deneyimi.`,
};

export const viewport: Viewport = {
  themeColor: "#150e09",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${bricolage.variable} h-full antialiased`}>
      <body className="grain min-h-full flex flex-col">
        <I18nProvider>
          <MenuProvider>
            <AuthProvider>
              <CartProvider>
                <SmoothScroll />
                <PWARegister />
                <Nav />
                <Overlays />
                {children}
              </CartProvider>
            </AuthProvider>
          </MenuProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
