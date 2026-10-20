"use client";

import { AnimatePresence, motion } from "framer-motion";

export type PartType =
  | "topBun"
  | "bottomBun"
  | "patty"
  | "cheese"
  | "tomato"
  | "lettuce"
  | "onion"
  | "bacon";

export const PART_H: Record<PartType, number> = {
  topBun: 70,
  bottomBun: 40,
  patty: 34,
  cheese: 22,
  tomato: 16,
  lettuce: 20,
  onion: 12,
  bacon: 12,
};

const SEEDS: [number, number, number][] = [
  [90, 20, -20],
  [135, 12, 5],
  [180, 18, 20],
  [215, 30, 35],
  [110, 38, -10],
  [160, 36, 10],
  [70, 42, -35],
];

/** Her parça kendi sol-üst köşesinden (0,0) çizilir; genişlik 300. */
export function Part({ type }: { type: PartType }) {
  switch (type) {
    case "topBun":
      return (
        <g>
          <path
            d="M30 62 C30 14 80 0 150 0 C220 0 270 14 270 62 Q270 70 255 70 L45 70 Q30 70 30 62Z"
            fill="#d98a2b"
          />
          <path
            d="M52 40 C60 22 95 12 130 10"
            stroke="#f2b25a"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />
          {SEEDS.map(([x, y, r], i) => (
            <ellipse
              key={i}
              cx={x}
              cy={y}
              rx="7"
              ry="3.5"
              fill="#fff1d6"
              transform={`rotate(${r} ${x} ${y})`}
            />
          ))}
        </g>
      );
    case "bottomBun":
      return (
        <path
          d="M40 0 L260 0 Q265 0 265 8 Q265 40 230 40 L70 40 Q35 40 35 8 Q35 0 40 0Z"
          fill="#c97a1f"
        />
      );
    case "patty":
      return (
        <g>
          <rect x="26" y="0" width="248" height="34" rx="17" fill="#4a2a1a" />
          <rect x="26" y="0" width="248" height="10" rx="5" fill="#6a3d26" opacity="0.7" />
          {[60, 100, 140, 190, 230].map((x, i) => (
            <circle key={x} cx={x} cy={14 + (i % 2) * 8} r="2" fill="#2c180d" />
          ))}
        </g>
      );
    case "cheese":
      return <path d="M24 0 H276 L264 8 H222 L206 22 L192 8 H36 Z" fill="#ffc21a" />;
    case "tomato":
      return <rect x="36" y="0" width="228" height="16" rx="8" fill="#e03a2c" />;
    case "lettuce":
      return (
        <path
          d="M22 10 Q44 -6 66 8 T110 8 T154 8 T198 8 T242 8 T278 10 Q278 22 258 20 L44 20 Q22 22 22 10Z"
          fill="#6bbf3a"
        />
      );
    case "onion":
      return (
        <g>
          <rect x="42" y="0" width="216" height="12" rx="6" fill="#ead3f2" />
          <rect x="42" y="3" width="216" height="3" rx="1.5" fill="#c9a6d8" opacity="0.7" />
        </g>
      );
    case "bacon":
      return (
        <path
          d="M28 5 Q50 -2 72 5 T116 5 T160 5 T204 5 T248 5 L272 5 L272 12 Q250 18 228 12 T184 12 T140 12 T96 12 T52 12 L28 12Z"
          fill="#a8321f"
        />
      );
  }
}

export type StackPart = { id: string; type: PartType };

export function BurgerStack({
  parts,
  animated = false,
  stagger = 0,
  className,
  viewH,
}: {
  parts: StackPart[];
  animated?: boolean;
  stagger?: number;
  className?: string;
  viewH?: number;
}) {
  const total = parts.reduce((s, p) => s + PART_H[p.type], 0);
  const H = viewH ?? total + 24;
  const placed = parts.map((p, i) => {
    const upTo = parts.slice(0, i + 1).reduce((s, q) => s + PART_H[q.type], 0);
    return { ...p, y: H - 10 - upTo };
  });

  return (
    <svg viewBox={`0 0 300 ${H}`} className={className} aria-hidden>
      <AnimatePresence>
        {placed.map((p, i) => (
          <motion.g
            key={p.id}
            initial={animated ? { y: -360, opacity: 0 } : false}
            animate={{ y: p.y, opacity: 1 }}
            exit={{ x: 340, opacity: 0, transition: { duration: 0.3 } }}
            transition={{
              type: "spring",
              stiffness: 170,
              damping: 17,
              delay: i * stagger,
            }}
          >
            <Part type={p.type} />
          </motion.g>
        ))}
      </AnimatePresence>
    </svg>
  );
}

export const toStack = (types: PartType[], prefix = "p"): StackPart[] =>
  types.map((type, i) => ({ id: `${prefix}-${i}-${type}`, type }));
