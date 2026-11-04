"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { getPref, setPref } from "./store";
import { SHOP_KEY, isShop, type Shop } from "./shop";

const listeners = new Set<() => void>();
let current: Shop | null = null;

function read(): Shop {
  if (current === null) {
    const v = getPref<unknown>("shop", "all");
    current = isShop(v) ? v : "all";
  }
  return current;
}

/** Puts the shop's colours on the page: SHOP_THEME_CSS and home.css read data-shop on <html>. */
function paint(shop: Shop) {
  const root = document.documentElement;
  if (shop === "all") root.removeAttribute("data-shop");
  else root.setAttribute("data-shop", shop);
}

function set(shop: Shop) {
  current = shop;
  setPref("shop", shop);
  paint(shop);
  listeners.forEach((f) => f());
}

function subscribe(f: () => void) {
  listeners.add(f);
  // a pick made in another tab carries over to this one
  const onStorage = (e: StorageEvent) => {
    if (e.key !== SHOP_KEY) return;
    current = null;
    f();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(f);
    window.removeEventListener("storage", onStorage);
  };
}

/** The picked shop, the same in every switch on the page. "all" while prerendering and hydrating. */
export function useShop(): Shop {
  return useSyncExternalStore(subscribe, read, () => "all");
}

/**
 * Keeps the picked shop's colours on while a site page is on screen. Next keeps a page it navigates away from
 * mounted but hidden, with its effects cleaned up, so a guide opened from the home page drops the colours here
 * rather than matching the hidden page's .site. A layout effect, so the change lands before the next paint.
 */
export function useShopColours() {
  useLayoutEffect(() => {
    // the pick itself, not the hook's "all" while hydrating: the head script already painted it
    const sync = () => paint(read());
    sync();
    const stop = subscribe(sync);
    return () => {
      stop();
      paint("all");
    };
  }, []);
}

/** How long the new shop's colours take to spread across the page. */
const REVEAL_MS = 700;

/**
 * Picks a shop. The page changes colours like a light and dark switch: the new look grows as a circle out of
 * the button that was tapped, over a still picture of the old one (the View Transitions API). Browsers without
 * it, and anyone who asked their system for less motion, get the new colours at once.
 */
export function pickShop(shop: Shop, from?: Element | null) {
  if (shop === read()) return;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (still || typeof document.startViewTransition !== "function") {
    set(shop);
    return;
  }
  const box = from?.getBoundingClientRect();
  const x = box ? box.left + box.width / 2 : window.innerWidth / 2;
  const y = box ? box.top + box.height / 2 : 0;
  // far enough to reach the furthest corner of the screen
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const t = document.startViewTransition(() => flushSync(() => set(shop)));
  t.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: REVEAL_MS, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    })
    .catch(() => {
      /* skipped: the colours are already in place */
    });
}
