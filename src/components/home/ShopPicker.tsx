"use client";

import { motion } from "motion/react";
import { BRANDS, BRAND_IDS } from "@/lib/brands";
import type { Shop } from "@/lib/shop";
import { pickShop, useShop } from "@/lib/useShop";

/**
 * All shops, IKEA, Kmart: whose range to look through. Every switch on the page shares the pick, and the page
 * takes on the picked shop's colours, spreading out from the button.
 */
export default function ShopPicker({ label, pill, className, onPick }: { label: string; pill: string; className?: string; onPick?: (shop: Shop) => void }) {
  const shop = useShop();
  return (
    <div className={"shops" + (className ? " " + className : "")} role="radiogroup" aria-label={label}>
      {(["all", ...BRAND_IDS] as const).map((b) => (
        <button
          key={b}
          type="button"
          role="radio"
          aria-checked={shop === b}
          className={"shop" + (shop === b ? " on" : "")}
          onClick={(e) => {
            pickShop(b, e.currentTarget);
            onPick?.(b);
          }}
        >
          {shop === b && <motion.span layoutId={pill} className="shop-pill" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
          <span className="shop-label">{b === "all" ? "All shops" : BRANDS[b].name}</span>
        </button>
      ))}
    </div>
  );
}
