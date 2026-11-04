"use client";

import Link from "next/link";
import type { Shop } from "@/lib/shop";
import { useShop } from "@/lib/useShop";
import Search from "./Search";
import { useAiStatus } from "./Sections";

export function HeroSearch() {
  const ai = useAiStatus();
  return <Search ai={ai} />;
}

/** Five quick picks under the search, per shop: short names, so they fit one row on a phone. */
const QUICK: Record<Shop, { slug: string; label: string }[]> = {
  all: [
    { slug: "kallax-2x2", label: "KALLAX" },
    { slug: "kmart-8-cube-storage-unit", label: "8 Cube Unit" },
    { slug: "malm-3-drawers", label: "MALM" },
    { slug: "kmart-4-tier-ladder-shelf", label: "Ladder Shelf" },
    { slug: "billy-80x202", label: "BILLY" },
  ],
  ikea: [
    { slug: "kallax-2x2", label: "KALLAX" },
    { slug: "malm-3-drawers", label: "MALM" },
    { slug: "billy-80x202", label: "BILLY" },
    { slug: "lack-side-table", label: "LACK" },
    { slug: "hemnes-3-drawers", label: "HEMNES" },
  ],
  kmart: [
    { slug: "kmart-8-cube-storage-unit", label: "8 Cube" },
    { slug: "kmart-4-tier-ladder-shelf", label: "Ladder" },
    { slug: "kmart-charlie-6-drawer-chest", label: "Charlie" },
    { slug: "kmart-wharf-student-desk", label: "Wharf" },
    { slug: "kmart-thorne-bookshelf", label: "Thorne" },
  ],
};

/** The picked shop's quick picks, or a mix of both while all shops are picked. */
export function QuickPicks() {
  const shop = useShop();
  return (
    <div className="quick">
      <span>Try</span>
      {QUICK[shop].map((q) => (
        <Link key={q.slug} href={`/build/${q.slug}`} className="chip">
          {q.label}
        </Link>
      ))}
    </div>
  );
}
