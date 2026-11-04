"use client";

import { useShopColours } from "@/lib/useShop";

/** In every site page's header: the page wears the picked shop's colours while it is on screen. */
export default function ShopColours() {
  useShopColours();
  return null;
}
