"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useT } from "@/lib/i18n";
import { PART_H, Part, type PartType } from "./Burger";

type Layer = { type: PartType; spread: number };

// Üstten alta; spread = patlayınca kayma miktarı (svg birimi)
const LAYERS: Layer[] = [
  { type: "topBun", spread: -210 },
  { type: "lettuce", spread: -140 },
  { type: "tomato", spread: -85 },
  { type: "cheese", spread: -30 },
  { type: "patty", spread: 25 },
  { type: "bacon", spread: 80 },
  { type: "bottomBun", spread: 150 },
];

const TOTAL = LAYERS.reduce((s, l) => s + PART_H[l.type], 0);
const TOP = 190;


function ExplodedLayer({
  layer,
  y0,
  progress,
}: {
  layer: Layer;
  y0: number;
  progress: MotionValue<number>;
}) {
  const y = useTransform(progress, [0, 1], [y0, y0 + layer.spread]);
  return (
    <motion.g style={{ y }}>
      <Part type={layer.type} />
    </motion.g>
  );
}

export function Explode() {
  const { t } = useT();
  const FACTS = [1, 2, 3, 4, 5].map((n) => ({
    title: t(`fact.${n}.t` as never),
    body: t(`fact.${n}.b` as never),
  }));
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [stage, setStage] = useState(0);

  const explode = useSpring(
    useTransform(scrollYProgress, [0.08, 0.7], [0, 1], { clamp: true }),
    { stiffness: 90, damping: 22 },
  );
  const rotate = useTransform(scrollYProgress, [0, 1], [-6, 8]);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const s = p < 0.1 ? 0 : p < 0.3 ? 1 : p < 0.48 ? 2 : p < 0.66 ? 3 : 4;
    setStage(s);
  });

  const placed = LAYERS.map((l, i) => ({
    layer: l,
    y0: TOP + LAYERS.slice(0, i).reduce((s, q) => s + PART_H[q.type], 0),
  }));

  const fact = FACTS[stage];

  return (
    <section id="parcala" ref={ref} className="relative h-[420vh]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden px-5 pt-16 sm:px-8 md:pt-0">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-6 md:grid-cols-2">
          <div className="relative z-10 min-h-40 md:min-h-64">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-mustard">
              {t("fact.label")} — {stage + 1}/{FACTS.length}
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={stage}
                initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -40, filter: "blur(8px)" }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-4xl font-extrabold leading-none tracking-tight sm:text-7xl">
                  {fact.title}
                </h2>
                <p className="mt-5 max-w-md text-lg text-cream/70">{fact.body}</p>
              </motion.div>
            </AnimatePresence>
            <div className="mt-8 flex gap-2">
              {FACTS.map((_, i) => (
                <motion.span
                  key={i}
                  animate={{
                    width: i === stage ? 40 : 12,
                    backgroundColor: i === stage ? "#ffb81c" : "rgba(255,241,214,0.25)",
                  }}
                  className="h-1.5 rounded-full"
                />
              ))}
            </div>
          </div>

          <motion.svg
            viewBox={`0 0 300 ${TOP + TOTAL + 170}`}
            style={{ rotate }}
            className="mx-auto max-h-[46vh] w-full max-w-md md:max-h-[78vh] drop-shadow-[0_40px_50px_rgba(0,0,0,0.5)]"
            aria-hidden
          >
            {placed.map(({ layer, y0 }) => (
              <ExplodedLayer key={layer.type} layer={layer} y0={y0} progress={explode} />
            ))}
          </motion.svg>
        </div>
      </div>
    </section>
  );
}
