import type { Kind, X } from "@/lib/products";
import type { TipKey } from "@/lib/types";

/**
 * Kmart Australia's flat packs, written by hand from what Kmart publishes about each product (name, keycode,
 * size, what it has). Every row has a recipe in src/lib/plan/families/kmart-*.ts read from its own assembly manual:
 * a row without one would fall back to a kind builder, whose parts and fittings are made up from the size, so
 * `npm run kmart:check` fails on it. Add the recipe first, then the row.
 * Kmart's website turns away scripts, so there is no fetcher like scripts/ikea: rows are added here, checked
 * against the product page, and `npm run kmart:check` builds every one of them.
 *
 * Sizes are in cm, as width, height, depth (Kmart prints W x D x H: mind the order).
 */
export interface KmartRow {
  /** as Kmart lists it, without the colour */
  name: string;
  /** what tells it apart from others in its line: its size or layout */
  variant: string;
  /** the product line: products that share it are sizes of one another, and a family recipe keys on it */
  line: string;
  kind: Kind;
  /** w, h, d in cm */
  size: [number, number, number];
  x?: X;
  /** colour to keycode, every colour sold */
  keycodes: Record<string, string>;
  category?: string;
  minutes?: number;
  people?: 1 | 2;
  difficulty?: 1 | 2 | 3;
  material?: string;
  keywords?: string;
  tips?: Partial<Record<TipKey, string>>;
  featured?: boolean;
  /** size and counts checked against Kmart's own listing */
  checked?: boolean;
  /** pin a slug when the name changes, so saved progress keeps working */
  slug?: string;
}

/**
 * Researched from Kmart's own listings and manuals (kmart.com.au/instruction-manuals, keycode_Manual.pdf), October 2026.
 * Featured rows come first; the rest are by product line. Only the products whose manual a recipe follows are listed;
 * the 56 others once drawn by the kind builders were taken out in November 2026 until their manuals are read.
 */
export const KMART_ROWS: KmartRow[] = [
  { name: "Charlie 6 Drawer Chest", variant: "Chest of drawers, 120 × 79 cm", line: "charlie", kind: "chest", category: "Chest of drawers", size: [120, 79, 39], keycodes: { White: "43633685" }, x: { rows: 3, cols: 2 }, featured: true, keywords: "dresser" },
  { name: "4 Cube Storage Unit", variant: "Cube storage, 60 × 60 cm", line: "cube storage", kind: "cube", category: "Cube storage", size: [60, 60, 29], keycodes: { White: "42633310", "Oak Look": "42633181", "Walnut Look": "43707355", Black: "42864103" }, x: { rows: 2 }, material: "Particle board", featured: true, checked: true },
  { name: "8 Cube Storage Unit", variant: "Cube storage, 60 × 122 cm", line: "cube storage", kind: "cube", category: "Cube storage", size: [60, 122, 29], keycodes: { White: "42633297", "Oak Look": "42633280", "Walnut Look": "43707348", Black: "43333462" }, x: { rows: 4 }, material: "Particle board", featured: true, checked: true },
  { name: "4 Tier Ladder Shelf", variant: "Ladder shelf, 63 × 150 cm", line: "ladder shelf", kind: "bookcase", category: "Ladder shelf", size: [63, 150, 39], keycodes: { White: "42561941" }, x: { shelves: 4 }, material: "Laminated particle board and MDF (manual); listing says MDF", featured: true, keywords: "ladder leaning" },
  { name: "Wharf Student Desk", variant: "Desk, 110 × 76 cm", line: "wharf", kind: "desk", category: "Desk", size: [110, 76, 50], keycodes: { "Oak Look": "43633050" }, x: { legs: "square" }, material: "Particle board, metal", featured: true, keywords: "study student" },
  { name: "Charlie 2 Drawer Bedside Table", variant: "Bedside table, 45 × 55 cm", line: "charlie", kind: "nightstand", category: "Bedside table", size: [45, 55, 29], keycodes: { White: "43633081" }, x: { rows: 2 }, keywords: "nightstand" },
  { name: "Charlie 2 Tier Shoe Cabinet", variant: "Shoe cabinet, 60 × 81 cm", line: "charlie", kind: "shoe", category: "Shoe cabinet", size: [60, 81, 24], keycodes: { Standard: "43705559" }, x: { c: 2 }, keywords: "shoe storage" },
  { name: "Charlie Entertainment Unit", variant: "Entertainment unit, 110 × 48 cm", line: "charlie", kind: "tv", category: "Entertainment unit", size: [110, 48, 39], keycodes: { White: "43635474" }, material: "Particleboard, MDF", keywords: "tv unit tv bench" },
  { name: "Kids Bookcase with Storage", variant: "Kids bookcase, 62 × 76 cm", line: "kids storage", kind: "bookcase", category: "Kids bookcase", size: [62, 76, 30], keycodes: { Standard: "43517947" }, x: { shelves: 3 }, keywords: "kids book display" },
  { name: "Kids Storage Unit with 6 Tubs", variant: "Kids storage unit, 97 × 55.5 cm", line: "kids storage", kind: "open", category: "Kids storage unit", size: [97, 55.5, 44], keycodes: { White: "43109814", "Oak Look": "43109838" }, x: { shelves: 0 }, keywords: "kids tubs toy storage" },
  { name: "Linear 1 Drawer Bedside Table", variant: "Bedside table, 40 × 53 cm", line: "linear", kind: "nightstand", category: "Bedside table", size: [40, 53, 30], keycodes: { Standard: "43410002" }, x: { rows: 1 }, keywords: "nightstand" },
  { name: "Miles 6 Drawer Chest", variant: "Chest of drawers, 120 × 76 cm", line: "miles", kind: "chest", category: "Chest of drawers", size: [120, 76, 40], keycodes: { "Light Oak": "43709106", Walnut: "43709267" }, x: { rows: 3, cols: 2 }, people: 2, keywords: "dresser" },
  { name: "Miles Entertainment Unit", variant: "Entertainment unit, 120 × 48 cm", line: "miles", kind: "tv", category: "Entertainment unit", size: [120, 48, 40], keycodes: { Walnut: "43709281", "Light Oak": "43709137" }, keywords: "tv unit tv bench" },
  { name: "Stevie 4 Drawer Chest", variant: "Chest of drawers, 60 × 90 cm", line: "stevie", kind: "chest", category: "Chest of drawers", size: [60, 90, 40], keycodes: { White: "43484201", Blue: "43633814", Sage: "43633807", Black: "43484218" }, x: { rows: 4 }, keywords: "tallboy" },
  { name: "White 3 Tier Trolley", variant: "Trolley, 44 × 77.5 cm", line: "trolley", kind: "trolley", category: "Trolley", size: [44, 77.5, 31.5], keycodes: { White: "43476046" }, keywords: "cart utility" },
  { name: "Wharf 5 Tier Bookshelf", variant: "Bookcase, 120 × 153 cm", line: "wharf", people: 1, kind: "bookcase", category: "Bookcase", size: [120, 153, 33], keycodes: { Standard: "43635405" }, x: { shelves: 5 }, material: "Particleboard and metal", keywords: "bookshelf" },
];
