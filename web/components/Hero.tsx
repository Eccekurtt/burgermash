"use client";

import { useRef } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import { INTRO } from "@/lib/brand";
import { useT } from "@/lib/i18n";
import { useMenu } from "./MenuProvider";
import { scrollToId } from "./SmoothScroll";

function Magnetic({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });
  const y = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });

  return (
    <motion.button
      ref={ref}
      style={{ x, y }}
      onClick={onClick}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * 0.35);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.35);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      whileTap={{ scale: 0.94 }}
      className="rounded-full bg-mustard px-8 py-4 text-lg font-extrabold text-ink"
    >
      {children}
    </motion.button>
  );
}

export function Hero() {
  const { t } = useT();
  const { itemById } = useMenu();
  const LINES = [t("hero.l1"), t("hero.l2"), t("hero.l3")];
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const burgerY = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const rot = useTransform(scrollYProgress, [0, 1], [0, 18]);

  const mx = useSpring(useMotionValue(0), { stiffness: 80, damping: 15 });
  const my = useSpring(useMotionValue(0), { stiffness: 80, damping: 15 });
  const tiltX = useTransform(my, [-1, 1], [8, -8]);
  const tiltY = useTransform(mx, [-1, 1], [-12, 12]);

  return (
    <section
      ref={ref}
      onMouseMove={(e) => {
        mx.set((e.clientX / window.innerWidth) * 2 - 1);
        my.set((e.clientY / window.innerHeight) * 2 - 1);
      }}
      className="relative flex min-h-screen items-center overflow-hidden px-5 pt-24 sm:px-8"
    >
      <motion.div
        aria-hidden
        className="absolute -right-40 top-10 h-[34rem] w-[34rem] rounded-full bg-ketchup/30 blur-3xl"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -left-40 bottom-0 h-[28rem] w-[28rem] rounded-full bg-mustard/20 blur-3xl"
        animate={{ scale: [1.1, 1, 1.1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-8 lg:grid-cols-2">
        <motion.div style={{ y: textY }}>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: INTRO + 0.1 }}
            className="mb-4 inline-block rounded-full border border-cream/20 px-4 py-1 text-sm"
          >
            {t("hero.badge")}
          </motion.p>

          <h1 className="text-[clamp(3.5rem,11vw,9rem)] font-extrabold leading-[0.9] tracking-tighter">
            {LINES.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-2">
                <motion.span
                  className={`block ${i === 2 ? "text-mustard" : ""}`}
                  initial={{ y: "110%", rotate: 4 }}
                  animate={{ y: 0, rotate: 0 }}
                  transition={{ delay: INTRO + i * 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: INTRO + 0.5, duration: 0.7 }}
            className="mt-6 max-w-md text-lg text-cream/70"
          >
            {t("hero.sub")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: INTRO + 0.7, duration: 0.7 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <Magnetic onClick={() => scrollToId("menu")}>{t("hero.cta1")}</Magnetic>
            <button
              onClick={() => scrollToId("tasarla")}
              className="group flex items-center gap-2 font-bold"
            >
              {t("hero.cta2")}
              <span className="transition-transform group-hover:translate-x-1.5">→</span>
            </button>
          </motion.div>
        </motion.div>

        <motion.div
          style={{ y: burgerY, rotate: rot, rotateX: tiltX, rotateY: tiltY, perspective: 900 }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: INTRO + 0.1, type: "spring", stiffness: 80, damping: 12 }}
          className="mx-auto w-full max-w-md"
        >
          <div className="floaty relative aspect-square drop-shadow-[0_40px_50px_rgba(0,0,0,0.55)]">
            <div className="absolute inset-0 overflow-hidden rounded-[45%_55%_50%_50%/55%_45%_55%_45%] ring-4 ring-mustard/80">
              <Image
                src="/menu/cifte.jpg"
                alt={itemById("cifte").name}
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
              />
            </div>
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: -10 }}
              transition={{ delay: INTRO + 0.6, type: "spring", stiffness: 200, damping: 12 }}
              className="absolute -left-2 bottom-8 grid h-24 w-24 place-items-center rounded-full bg-ketchup-deep text-center text-sm font-extrabold leading-tight shadow-xl sm:h-28 sm:w-28"
            >
              239 ₺<br />
              <span className="text-xs font-bold">{itemById("cifte").name}</span>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: INTRO + 1.2 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs text-cream/50 sm:flex"
      >
        {t("hero.scroll")}
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="block h-8 w-px bg-cream/40"
        />
      </motion.div>
    </section>
  );
}
