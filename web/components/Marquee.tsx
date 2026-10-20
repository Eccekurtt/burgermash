"use client";

import { useT } from "@/lib/i18n";

export function Marquee() {
  const { t } = useT();
  const WORDS = t("marquee.words").split("|");
  const row = [...WORDS, ...WORDS];
  return (
    <div className="-rotate-2 overflow-hidden bg-mustard py-4 text-ink" aria-hidden>
      <div className="marquee-track flex w-max whitespace-nowrap">
        {[0, 1].map((k) => (
          <div key={k} className="flex">
            {row.map((w, i) => (
              <span key={i} className="mx-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
                {w} <span className="text-ketchup">✺</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
