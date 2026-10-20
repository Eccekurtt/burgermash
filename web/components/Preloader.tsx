"use client";

import { useEffect, useState } from "react";
import {
  animate,
  motion,
  useAnimationControls,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { BRAND } from "@/lib/brand";
import { BurgerStack, PART_H, Part, toStack, type PartType } from "./Burger";

/** Sayaç sırasında düşen küçük burger (ilk hâli). */
const SMALL = toStack(["bottomBun", "patty", "cheese", "tomato", "lettuce", "topBun"], "pre");

/** Sayaçtan sonra ekranı dolduran devasa burger (alttan üste). */
const GIANT: PartType[] = [
  "bottomBun",
  "patty",
  "bacon",
  "cheese",
  "patty",
  "cheese",
  "onion",
  "tomato",
  "lettuce",
  "topBun",
];
const GH = 310;
const GIANT_LAYERS = GIANT.map((type, i) => ({
  type,
  y: GH - 10 - GIANT.slice(0, i + 1).reduce((s, t) => s + PART_H[t], 0),
  spread: (i - (GIANT.length - 1) / 2) * 20,
}));

const TITLE = `${BRAND.short}${BRAND.accent}`.split("");

type Phase = "count" | "stack" | "spin" | "exit" | "done";

export function Preloader() {
  const [phase, setPhase] = useState<Phase>("count");
  const progress = useMotionValue(0);
  const label = useTransform(progress, (v) => `${Math.round(v)}`.padStart(2, "0"));
  const shake = useAnimationControls();

  useEffect(() => {
    document.documentElement.classList.add("lenis-stopped");
    const timers: ReturnType<typeof setTimeout>[] = [];
    const controls = animate(progress, 100, {
      duration: 2,
      ease: [0.65, 0, 0.35, 1],
      onComplete: () => {
        timers.push(setTimeout(() => setPhase("stack"), 150));
        timers.push(setTimeout(() => setPhase("spin"), 150 + 1350));
        timers.push(setTimeout(() => setPhase("exit"), 150 + 1350 + 1000));
        timers.push(setTimeout(() => setPhase("done"), 150 + 1350 + 1000 + 900));
      },
    });
    return () => {
      controls.stop();
      timers.forEach(clearTimeout);
    };
  }, [progress]);

  useEffect(() => {
    if (phase === "done") document.documentElement.classList.remove("lenis-stopped");
  }, [phase]);

  if (phase === "done") return null;

  const counting = phase === "count";
  const giantOn = phase !== "count";
  const spinning = phase === "spin";

  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 z-[100] overflow-hidden bg-mustard text-ink"
      animate={phase === "exit" ? { y: "-100%" } : { y: 0 }}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
    >
      {/* 1) Sayaç: küçük burger düşer, 100'e kadar sayar */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        animate={{ opacity: counting ? 1 : 0, scale: counting ? 1 : 1.15 }}
        transition={{ duration: 0.3 }}
      >
        <BurgerStack parts={SMALL} animated stagger={0.28} className="w-44 sm:w-56" viewH={260} />
        <div className="mt-6 overflow-hidden">
          <motion.h1
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl font-extrabold tracking-tight sm:text-4xl"
          >
            {BRAND.short}
            <span className="text-ketchup">{BRAND.accent}</span>
          </motion.h1>
        </div>
        <motion.span className="absolute bottom-6 right-6 text-7xl font-extrabold tabular-nums sm:text-9xl">
          {label}
        </motion.span>
      </motion.div>

      {/* 2) Devasa burger gösterisi: karanlık sahne ortadan açılır */}
      <motion.div
        className="absolute inset-0 bg-ink"
        initial={{ clipPath: "circle(0% at 50% 50%)" }}
        animate={{ clipPath: giantOn ? "circle(150% at 50% 50%)" : "circle(0% at 50% 50%)" }}
        transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
      >
        {/* arkadan vuran ışık */}
        <motion.div
          className="absolute left-1/2 top-1/2 h-[120vmax] w-[120vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,184,28,0.45), rgba(232,57,43,0.18) 45%, transparent 70%)",
          }}
          animate={{ scale: spinning ? [1, 1.25, 1] : 1, opacity: giantOn ? 1 : 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />

        {/* dev yazı */}
        <div className="absolute inset-x-0 bottom-[6vh] flex justify-center overflow-hidden px-4">
          <div className="flex text-[clamp(3rem,13vw,11rem)] font-extrabold leading-none tracking-tighter text-cream">
            {TITLE.map((c, i) => (
              <motion.span
                key={i}
                className={i >= BRAND.short.length ? "text-mustard" : ""}
                initial={{ y: "110%" }}
                animate={{ y: spinning || phase === "exit" ? 0 : "110%" }}
                transition={{ delay: i * 0.04, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                {c}
              </motion.span>
            ))}
          </div>
        </div>

        {/* burger */}
        <motion.div
          animate={shake}
          className="absolute inset-x-0 top-0 bottom-[22vh] flex items-center justify-center"
          style={{ perspective: 1400 }}
        >
          <motion.div
            animate={spinning ? { rotateY: 360 } : { rotateY: 0 }}
            transition={{ duration: 1, ease: [0.45, 0, 0.2, 1] }}
            style={{ transformStyle: "preserve-3d", width: "min(88vw, calc(60vh * 0.968))" }}
          >
            <svg viewBox={`0 0 300 ${GH}`} className="w-full overflow-visible drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)]">
              {giantOn &&
                GIANT_LAYERS.map((l, i) => (
                  <motion.g
                    key={i}
                    initial={{ y: -900 }}
                    animate={
                      spinning
                        ? { y: [l.y, l.y + l.spread, l.y] }
                        : { y: l.y }
                    }
                    transition={
                      spinning
                        ? { duration: 1, times: [0, 0.5, 1], ease: "easeInOut" }
                        : { type: "spring", stiffness: 240, damping: 13, delay: i * 0.08 }
                    }
                    onAnimationComplete={() => {
                      if (phase === "stack")
                        shake.start({ y: [0, 14, -7, 4, 0], transition: { duration: 0.28 } });
                    }}
                  >
                    <Part type={l.type} />
                  </motion.g>
                ))}
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
