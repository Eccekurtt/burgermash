"use client";

import { BRAND } from "@/lib/brand";
import { useT } from "@/lib/i18n";

export function Footer() {
  const { t } = useT();
  return (
    <footer className="px-5 pb-10 pt-24 text-center sm:px-8">
      {/* Dekoratif dev yazı: sözde öğe olarak çizilir, böylece ekran okuyucu ve kontrast denetimi dışında kalır */}
      <p
        aria-hidden
        data-text={BRAND.name}
        className="text-[clamp(3rem,14vw,12rem)] font-extrabold leading-none tracking-tighter text-cream/10 before:content-[attr(data-text)]"
      />
      <p className="mt-6 text-sm text-cream/50">{t("footer.fiction")}</p>
      <p className="mt-2 text-xs text-cream/60">
        {t("footer.photos")}{" "}
        <a href="https://unsplash.com" className="underline" target="_blank" rel="noreferrer">
          Unsplash
        </a>{" "}
        {t("footer.license")}
      </p>
    </footer>
  );
}
