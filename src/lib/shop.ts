import { BRANDS, BRAND_IDS, type BrandId } from "./brands";

/**
 * Which shop's range someone is looking through: one pick for the whole site, remembered on this device.
 * While a shop is picked, <html data-shop="..."> dresses the site pages (anything with a .site frame) in
 * that shop's colours; guides keep Dowel's own style. The head script sets it on every load (the CSS only
 * applies it under a .site), and each site page's header keeps it while that page is on screen. This module
 * is safe on the server; the hook that changes the pick lives in useShop.ts.
 */
export type Shop = BrandId | "all";

/** Where the pick is kept: the same key getPref("shop") reads. */
export const SHOP_KEY = "dowel:pref:shop";

export const isShop = (v: unknown): v is Shop => v === "all" || (typeof v === "string" && (BRAND_IDS as string[]).includes(v));

/** CSS custom property for a theme key: accentSoft is --accent-soft, ink2 is --ink-2. */
const cssVar = (k: string) => "--" + k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()).replace(/(\D)(\d)$/, "$1-$2");

/** Every shop's colours as CSS, from BRANDS: a shop added there gets its look with nothing else to write. */
export const SHOP_THEME_CSS = BRAND_IDS.map(
  (id) =>
    `:root[data-shop="${id}"]:has(.site){${Object.entries(BRANDS[id].theme)
      .map(([k, v]) => `${cssVar(k)}:${v}`)
      .join(";")}}`,
).join("\n");

/** Runs in <head> before the first paint, so a page opens in the picked shop's colours without a flash. */
export const SHOP_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(SHOP_KEY)})||"null");if(${JSON.stringify(BRAND_IDS)}.indexOf(s)>-1)document.documentElement.setAttribute("data-shop",s)}catch(e){}})()`;
