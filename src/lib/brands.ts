import { fold } from "./fold";

/**
 * The retailers whose flat packs we draw. Everything brand specific lives here: what the shop is called,
 * how it numbers its products, where its own manual lives and what we say about not being them.
 * Adding a brand means adding it here, giving it catalog rows (src/data) and, for the products that
 * deserve it, family recipes (src/lib/plan/families) keyed as "<BRAND>:<LINE>".
 */
export type BrandId = "ikea" | "kmart";

export interface Brand {
  id: BrandId;
  /** as people say it */
  name: string;
  /** who owns the marks, for the disclaimer */
  owner: string;
  /** where the range we draw is sold */
  market: string;
  /** what the shop calls the number printed on the box */
  numberName: string;
  /** an example of that number, as printed */
  numberExample: string;
  /** a short, plain hint for the search box */
  hint: string;
  /** the shop's own site, for the "find the manual" link */
  site: string;
  /** where the official manual for a product is found */
  manualUrl: (name: string, number?: string) => string;
  /** how product names are written: IKEA prints one word in capitals, Kmart writes a description */
  caps: boolean;
  /** what the search box types out when this shop is picked */
  examples: string[];
  /** the colours the site pages take on while this shop is picked (src/lib/shop.ts) */
  theme: BrandTheme;
}

/**
 * A shop's look for the site pages, in our own words: its colours on Dowel's layout, never its logo, type or
 * pictures. Each key is a CSS custom property (accentSoft is --accent-soft, ink2 is --ink-2), and globals.css
 * holds Dowel's own values for every one of them. Guides keep Dowel's drawing style whatever is picked.
 */
export interface BrandTheme {
  /** behind the cards, the sunk tracks and the hairlines */
  page: string;
  sunk: string;
  line: string;
  line2: string;
  /** text, strongest to softest */
  ink: string;
  ink2: string;
  ink3: string;
  /** the marker colour: selections, lit pins, the logo's dowel, and what sits on it */
  accent: string;
  accentSoft: string;
  onAccent: string;
  /** the main buttons: search, Build this, Try it */
  primary: string;
  primaryHover: string;
  onPrimary: string;
  /** the picked shop in the shop switch */
  pill: string;
  onPill: string;
  /** the hero headline */
  title: string;
  /** the header band and what sits on it */
  headBg: string;
  headInk: string;
  headInk2: string;
  headLine: string;
  headActive: string;
  headChip: string;
  headMark: string;
  headDowel: string;
}

export const BRANDS: Record<BrandId, Brand> = {
  ikea: {
    id: "ikea",
    name: "IKEA",
    owner: "Inter IKEA Systems B.V.",
    market: "UK and US",
    numberName: "Article number",
    numberExample: "802.758.87",
    hint: "the big word on the box label, like KALLAX",
    site: "ikea.com",
    manualUrl: (name) => `https://www.ikea.com/search/?q=${encodeURIComponent(name)}`,
    caps: true,
    examples: ["KALLAX", "MALM 3 drawers", "802.758.87", "BILLY bookcase"],
    // blue and yellow, on cool greys
    theme: {
      page: "#f2f5f9",
      sunk: "#e8edf3",
      line: "#dfe5ed",
      line2: "#c8d2de",
      ink: "#111111",
      ink2: "#484848",
      ink3: "#676767",
      accent: "#ffdb00",
      accentSoft: "#fff1a6",
      onAccent: "#0058a3",
      primary: "#0058a3",
      primaryHover: "#004a8c",
      onPrimary: "#ffffff",
      pill: "#ffdb00",
      onPill: "#0058a3",
      title: "#0058a3",
      headBg: "#0058a3",
      headInk: "#ffffff",
      headInk2: "rgba(255, 255, 255, 0.84)",
      headLine: "rgba(255, 255, 255, 0.4)",
      headActive: "#ffdb00",
      headChip: "rgba(255, 255, 255, 0.2)",
      headMark: "#ffdb00",
      headDowel: "#0058a3",
    },
  },
  kmart: {
    id: "kmart",
    name: "Kmart",
    owner: "Kmart Australia Limited",
    market: "Australia and New Zealand",
    numberName: "Keycode",
    numberExample: "42633297",
    hint: "the product name on the box, like 8 Cube Storage Unit, or its 8 digit keycode",
    site: "kmart.com.au",
    // Kmart's search takes a keycode as well as a name, and the product page links its assembly instructions
    manualUrl: (name, number) => `https://www.kmart.com.au/search/?searchTerm=${encodeURIComponent(number ?? name)}`,
    caps: false,
    examples: ["8 Cube Storage Unit", "Charlie 6 Drawer Chest", "42633297", "Ladder Shelf", "Kids Bookcase"],
    // red and white, on neutral greys
    theme: {
      page: "#f4f4f4",
      sunk: "#ececec",
      line: "#e2e2e2",
      line2: "#cfcfcf",
      ink: "#141414",
      ink2: "#4a4a4a",
      ink3: "#696969",
      accent: "#e4002b",
      accentSoft: "#ffdde3",
      onAccent: "#ffffff",
      primary: "#e4002b",
      primaryHover: "#c20025",
      onPrimary: "#ffffff",
      pill: "#e4002b",
      onPill: "#ffffff",
      title: "#e4002b",
      headBg: "#e4002b",
      headInk: "#ffffff",
      headInk2: "#ffffff",
      headLine: "rgba(255, 255, 255, 0.45)",
      headActive: "#ffffff",
      headChip: "rgba(255, 255, 255, 0.24)",
      headMark: "#ffffff",
      headDowel: "#e4002b",
    },
  },
};

export const BRAND_IDS = Object.keys(BRANDS) as BrandId[];

/** The brand of a product or spec; anything without one is IKEA, as every guide was before brands. */
export function brandOf(x: { brand?: string } | null | undefined): BrandId {
  return x?.brand && x.brand in BRANDS ? (x.brand as BrandId) : "ikea";
}

export function brand(x: { brand?: string } | null | undefined): Brand {
  return BRANDS[brandOf(x)];
}

/** "The shops we draw", for copy: "IKEA and Kmart". */
export const BRAND_LIST = BRAND_IDS.map((b) => BRANDS[b].name).join(" and ");

/** Words people put in front of a product name that aren't part of it. */
const LEAD = new Set(["the", "a", "an", "my", "our", "your", "this", "that", "from", "at"]);
const BRAND_WORDS: Record<string, BrandId> = { ikea: "ikea", kmart: "kmart", "k mart": "kmart" };

/**
 * Takes the brand out of a query and the little words around it: "IKEA KALLAX" is KALLAX at IKEA,
 * "my kmart bookcase" is a bookcase at Kmart, "the billy" is BILLY. "IKEA PS cabinet" keeps IKEA,
 * since nothing would be left to search for otherwise.
 */
export function leadBrand(q: string): { brand: BrandId | null; rest: string } {
  let words = q.trim().split(/\s+/).filter(Boolean);
  let found: BrandId | null = null;
  for (let guard = 0; guard < 4 && words.length > 1; guard++) {
    const w = fold(words[0]);
    const two = words.length > 2 ? fold(words[0] + " " + words[1]) : "";
    if (BRAND_WORDS[two] && !found) {
      found = BRAND_WORDS[two];
      words = words.slice(2);
    } else if (BRAND_WORDS[w] && !found) {
      // IKEA PS is a real IKEA name: keep the word when the next one is a short code like PS
      if (w === "ikea" && /^ps$/i.test(words[1] ?? "")) break;
      found = BRAND_WORDS[w];
      words = words.slice(1);
    } else if (LEAD.has(w)) words = words.slice(1);
    else break;
  }
  // "bookcase from kmart", "kallax ikea": a brand at the end too
  if (!found && words.length > 1) {
    const last = fold(words[words.length - 1]);
    if (BRAND_WORDS[last]) {
      found = BRAND_WORDS[last];
      words = words.slice(0, -1);
      if (words.length > 1 && LEAD.has(fold(words[words.length - 1]))) words = words.slice(0, -1);
    }
  }
  return { brand: found, rest: words.join(" ") || q.trim() };
}

/** The not-affiliated line for one brand, or for all of them. */
export function disclaimer(b?: BrandId) {
  const list = b ? [BRANDS[b]] : BRAND_IDS.map((id) => BRANDS[id]);
  const names = list.map((x) => x.name).join(" or ");
  const owners = list.map((x) => x.owner).join(" or ");
  return `Dowel is an independent, unofficial project. It is not affiliated with, sponsored or endorsed by ${owners}, or by any ${names} company. ${list.map((x) => x.name).join(" and ")} product names are trademarks of their owners.`;
}

/** What a product's family is called in copy: IKEA's is its name (KALLAX); Kmart's is the range ("Charlie"). */
export function familyName(s: { brand?: string; name: string; line?: string }) {
  if (brandOf(s) === "ikea" || !s.line) return s.name;
  return s.line.replace(/\b\w/g, (c) => c.toUpperCase());
}
