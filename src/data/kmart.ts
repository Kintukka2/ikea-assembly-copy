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
  { name: "4 Cube Storage Unit", variant: "Cube storage, 60 × 60 cm", line: "cube storage", kind: "cube", category: "Cube storage", size: [60, 60, 29], keycodes: { White: "42633310" }, x: { rows: 2 }, material: "Particle board", featured: true, checked: true },
  { name: "8 Cube Storage Unit", variant: "Cube storage, 60 × 122 cm", line: "cube storage", kind: "cube", category: "Cube storage", size: [60, 122, 29], keycodes: { White: "42633297", "Oak Look": "42633280", "Walnut Look": "43707348" }, x: { rows: 4 }, material: "Particle board", featured: true, checked: true },
  { name: "4 Tier Ladder Shelf", variant: "Ladder shelf, 63 × 150 cm", line: "ladder shelf", kind: "bookcase", category: "Ladder shelf", size: [63, 150, 39], keycodes: { White: "42561941" }, x: { shelves: 4 }, material: "Laminated particle board and MDF (manual); listing says MDF", featured: true, keywords: "ladder leaning" },
  { name: "Nate Coffee Table", variant: "Coffee table, 60 × 35 cm", line: "nate", kind: "coffee", category: "Coffee table", size: [60, 35, 60], keycodes: { Oak: "43711222" }, x: { round: true, shelf: false }, featured: true },
  { name: "Wharf Student Desk", variant: "Desk, 110 × 76 cm", line: "wharf", kind: "desk", category: "Desk", size: [110, 76, 50], keycodes: { "Oak Look": "43633050" }, x: { legs: "square" }, material: "Particle board, metal", featured: true, keywords: "study student" },
{ name: "Ally Side Table", variant: "Side table, 40 × 47 cm", line: "ally", kind: "side", category: "Side table", size: [40, 47, 40], keycodes: { Black: "43533466", Walnut: "43711307" }, x: { round: true }, material: "MDF" },
  { name: "Asker Bar Stool", variant: "Bar stool, 52 × 95 cm", line: "asker", kind: "stool", category: "Bar stool", size: [52, 95, 55], keycodes: { Cream: "43641413" }, minutes: 25, keywords: "barstool kitchen counter upholstered" },
  { name: "Asker Chenille Lounge Chair", variant: "Lounge chair, 72 × 76 cm", line: "asker", kind: "lounge", category: "Lounge chair", size: [72, 76, 70], keycodes: { Standard: "43641369" }, minutes: 20, keywords: "armchair accent upholstered" },
  { name: "Asker Dining Chair", variant: "Dining chair, 55 × 83 cm", line: "asker", kind: "chair", category: "Dining chair", size: [55, 83, 60], keycodes: { Standard: "43641383" }, minutes: 20, keywords: "dining upholstered" },
{ name: "Blake 3 Tier Long Bookshelf", variant: "Bookcase, 143 × 82 cm", line: "blake", kind: "bookcase", category: "Bookcase", size: [143, 82, 30], keycodes: { Standard: "43270620" }, x: { shelves: 3 }, keywords: "bookshelf long" },
{ name: "Camille 4 Door Sideboard", variant: "Sideboard, 160 × 77 cm", line: "camille", kind: "sideboard", category: "Sideboard", size: [160, 77, 39], keycodes: { Sage: "43636990" }, people: 2, keywords: "buffet credenza" },
  { name: "Camille Cabinet with Shelves", variant: "Cabinet, 60 × 81 cm", line: "camille", kind: "cabinet", category: "Cabinet", size: [60, 81, 30], keycodes: { Standard: "43639922" }, keywords: "cupboard" },
  { name: "Camille Sideboard", variant: "Sideboard, 160 × 77 cm", line: "camille", kind: "sideboard", category: "Sideboard", size: [160, 77, 40], keycodes: { Standard: "43266845" }, people: 1, keywords: "buffet credenza" },
  { name: "Camille Storage Unit with Adjustable Shelves", variant: "Storage unit, 80 × 160 cm", line: "camille", kind: "cabinet", category: "Storage unit", size: [80, 160, 40], keycodes: { Standard: "43266906" }, people: 1, keywords: "hutch buffet pantry" },
  { name: "Charlie 2 Drawer Bedside Table", variant: "Bedside table, 45 × 55 cm", line: "charlie", kind: "nightstand", category: "Bedside table", size: [45, 55, 29], keycodes: { White: "43633081" }, x: { rows: 2 }, keywords: "nightstand" },
  { name: "Charlie 2 Tier Shoe Cabinet", variant: "Shoe cabinet, 60 × 81 cm", line: "charlie", kind: "shoe", category: "Shoe cabinet", size: [60, 81, 24], keycodes: { Standard: "43705559" }, x: { c: 2 }, keywords: "shoe storage" },
  { name: "Charlie Entertainment Unit", variant: "Entertainment unit, 110 × 48 cm", line: "charlie", kind: "tv", category: "Entertainment unit", size: [110, 48, 39], keycodes: { White: "43635474" }, material: "Particleboard, MDF", keywords: "tv unit tv bench" },
  { name: "Claire 3 Drawer Chest", variant: "Chest of drawers, 80 × 78 cm", line: "claire", kind: "chest", category: "Chest of drawers", size: [80, 78, 40], keycodes: { Walnut: "43635788", Black: "43635818" }, x: { rows: 3 }, material: "Particle board, MDF" },
  { name: "Claire Bedside Table", variant: "Bedside table, 48 × 55 cm", line: "claire", kind: "nightstand", category: "Bedside table", size: [48, 55, 35], keycodes: { Walnut: "43746842", Black: "43635764" }, x: { rows: 1 }, keywords: "nightstand" },
{ name: "Marble Base Coat Stand", variant: "Coat stand, 29 × 170 cm", line: "coat stand", kind: "coatstand", category: "Coat stand", size: [29, 170, 29], keycodes: { Black: "43380800" }, minutes: 10, keywords: "hat coat rack hooks hall" },
  { name: "3 Cube Storage Unit with Cubby", variant: "Cube storage, 70 × 92 cm", line: "cube cubby", kind: "cube", category: "Cube storage", size: [70, 92, 35], keycodes: { White: "43746781" } },
  { name: "6 Drawer Dresser", variant: "Chest of drawers, 120 × 75.5 cm", line: "dresser", kind: "chest", category: "Chest of drawers", size: [120, 75.5, 39.5], keycodes: { White: "42941941" }, x: { rows: 3, cols: 2 }, keywords: "dresser" },
{ name: "Hazel Entertainment Unit", variant: "Entertainment unit, 129 × 48 cm", line: "hazel", kind: "tv", category: "Entertainment unit", size: [129, 48, 40], keycodes: { Standard: "43636112" }, keywords: "tv unit tv bench" },
{ name: "Isla 2 Drawer Bedside Table", variant: "Bedside table, 40 × 52 cm", line: "isla", kind: "nightstand", category: "Bedside table", size: [40, 52, 40], keycodes: { Standard: "43397785" }, x: { rows: 2 }, minutes: 60, keywords: "nightstand" },
  { name: "Isla 3 Drawer Chest", variant: "Chest of drawers, 72 × 69 cm", line: "isla", kind: "chest", category: "Chest of drawers", size: [72, 69, 40], keycodes: { Standard: "43151202" }, x: { rows: 3 }, minutes: 90, keywords: "dresser" },
  { name: "Isla Bookcase Storage", variant: "Bookcase, 80 × 180 cm", line: "isla", kind: "bookcase", category: "Bookcase", size: [80, 180, 40], keycodes: { Standard: "43333424" }, x: { shelves: 3 }, minutes: 90, people: 1, keywords: "bookshelf cabinet" },
  { name: "Isla Buffet Unit with Adjustable Shelf", variant: "Buffet, 80 × 72 cm", line: "isla", kind: "sideboard", category: "Buffet", size: [80, 72, 40], keycodes: { Standard: "43151219" }, minutes: 60, keywords: "sideboard cabinet" },
  { name: "Isla Desk", variant: "Desk, 115 × 76 cm", line: "isla", kind: "desk", category: "Desk", size: [115, 76, 60], keycodes: { Standard: "43333752" }, x: { legs: "square" }, minutes: 75, keywords: "study" },
  { name: "Jude Hall Table", variant: "Hall table, 110 × 73 cm", line: "jude", kind: "console", category: "Hall table", size: [110, 73, 32], keycodes: { Standard: "43700547" }, minutes: 30, keywords: "console entry hallway" },
  { name: "Set of 2 Jude Coffee Tables", variant: "Set of 2 coffee tables, 60 × 40 and 40 × 48 cm", line: "jude", kind: "coffee", category: "Coffee table", size: [110, 48, 60], keycodes: { Standard: "43700752" }, minutes: 30, keywords: "nesting round side table" },
  { name: "Jumi Lounge Chair", variant: "Lounge chair, 79 × 67 cm", line: "jumi", kind: "lounge", category: "Lounge chair", size: [79, 67, 69], keycodes: { Green: "43692422" }, minutes: 30, keywords: "armchair accent upholstered" },
  { name: "Kids Bookcase with Storage", variant: "Kids bookcase, 62 × 76 cm", line: "kids storage", kind: "bookcase", category: "Kids bookcase", size: [62, 76, 30], keycodes: { Standard: "43517947" }, x: { shelves: 3 }, keywords: "kids book display" },
  { name: "Kids Storage Unit with 6 Tubs", variant: "Kids storage unit, 97 × 55.5 cm", line: "kids storage", kind: "open", category: "Kids storage unit", size: [97, 55.5, 44], keycodes: { White: "43109814", "Oak Look": "43109838" }, x: { shelves: 0 }, keywords: "kids tubs toy storage" },
  { name: "Leon Bedside Table", variant: "Bedside table, 40 × 55 cm", line: "leon", kind: "nightstand", category: "Bedside table", size: [40, 55, 29.5], keycodes: { Standard: "43541416" }, x: { rows: 1 }, keywords: "nightstand" },
  { name: "Linear 1 Drawer Bedside Table", variant: "Bedside table, 40 × 53 cm", line: "linear", kind: "nightstand", category: "Bedside table", size: [40, 53, 30], keycodes: { Standard: "43410002" }, x: { rows: 1 }, keywords: "nightstand" },
{ name: "Linen Look 5 Drawer Chest", variant: "Chest of drawers, 100 × 54 cm", line: "linen look", kind: "chest", category: "Chest of drawers", size: [100, 54, 30], keycodes: { Beige: "43705788" }, minutes: 35, difficulty: 2, material: "Steel frame, fabric drawers", keywords: "fabric drawers dresser" },
  { name: "Linen Look 8 Drawer Chest", variant: "Chest of drawers, 99 × 86 cm", line: "linen look", kind: "chest", category: "Chest of drawers", size: [99, 86, 30], keycodes: { Beige: "43706297" }, x: { rows: 4, cols: 2 }, minutes: 45, difficulty: 2, material: "Steel frame, fabric drawers", keywords: "fabric drawers dresser" },
  { name: "Logan Lounge Chair", variant: "Lounge chair, 83 × 76 cm", line: "logan", kind: "lounge", category: "Lounge chair", size: [83, 76, 74], keycodes: { Green: "43709618" }, minutes: 15, keywords: "armchair accent upholstered" },
  { name: "Luna 2 Drawer Bedside Table", variant: "Bedside table, 48 × 52 cm", line: "luna", kind: "nightstand", category: "Bedside table", size: [48, 52, 40], keycodes: { White: "43633975" }, x: { rows: 2 }, keywords: "nightstand" },
{ name: "Miles 3 Drawer Chest", variant: "Chest of drawers, 80 × 76 cm", line: "miles", kind: "chest", category: "Chest of drawers", size: [80, 76, 40], keycodes: { "Light Oak": "43709229", Walnut: "43709298" }, x: { rows: 3 } },
  { name: "Miles 6 Drawer Chest", variant: "Chest of drawers, 120 × 76 cm", line: "miles", kind: "chest", category: "Chest of drawers", size: [120, 76, 40], keycodes: { "Light Oak": "43709106", Walnut: "43709267" }, x: { rows: 3, cols: 2 }, people: 2, keywords: "dresser" },
  { name: "Miles Entertainment Unit", variant: "Entertainment unit, 120 × 48 cm", line: "miles", kind: "tv", category: "Entertainment unit", size: [120, 48, 40], keycodes: { Walnut: "43709281", "Light Oak": "43709137" }, keywords: "tv unit tv bench" },
  { name: "Nate Bedside Table", variant: "Bedside table, 40 × 48 cm", line: "nate", kind: "nightstand", category: "Bedside table", size: [40, 48, 37.5], keycodes: { Standard: "43465736" }, minutes: 20, keywords: "nightstand round ribbed" },
  { name: "Nate Hall Table", variant: "Hall table, 100 × 76 cm", line: "nate", kind: "console", category: "Hall table", size: [100, 76, 35], keycodes: { Standard: "43495207" }, minutes: 45, keywords: "console entry ribbed" },
{ name: "Oliver 2 Door Cabinet with Drawer", variant: "Cabinet, 80 × 80 cm", line: "oliver", kind: "cabinet", category: "Cabinet", size: [80, 80, 39], keycodes: { Standard: "43707454" }, keywords: "cupboard sideboard" },
  { name: "Oliver 3 Drawer Chest", variant: "Chest of drawers, 80 × 80 cm", line: "oliver", kind: "chest", category: "Chest of drawers", size: [80, 80, 39], keycodes: { Green: "43707393" }, x: { rows: 3 }, keywords: "dresser" },
  { name: "Oliver Bedside Table", variant: "Bedside table, 40 × 55 cm", line: "oliver", kind: "nightstand", category: "Bedside table", size: [40, 55, 29], keycodes: { "Olive Green": "43707386" }, x: { rows: 1 }, keywords: "nightstand" },
  { name: "Oliver Bookshelf", variant: "Bookcase, 80 × 120 cm", line: "oliver", kind: "bookcase", category: "Bookcase", size: [80, 120, 29], keycodes: { Standard: "43707409" }, x: { shelves: 3 }, keywords: "bookshelf" },
  { name: "2 Tier Panelled Shoe Cabinet", variant: "Shoe cabinet, 60 × 80 cm", line: "panelled", kind: "shoe", category: "Shoe cabinet", size: [60, 80, 24], keycodes: { Standard: "43273225" }, minutes: 60, people: 2, keywords: "shoe storage flip" },
  { name: "Round Marble Look Side Table", variant: "Side table, 40 × 50 cm", line: "round marble look", kind: "side", category: "Side table", size: [40, 50, 40], keycodes: { Red: "43746866" }, x: { round: true }, minutes: 20, keywords: "marble pedestal round" },
{ name: "Ryan Ribbed Coffee Table", variant: "Coffee table, 70 × 37 cm", line: "ryan", kind: "coffee", category: "Coffee table", size: [70, 37, 70], keycodes: { Walnut: "43741038", Black: "43636600", Oak: "43636549" }, x: { round: true, shelf: false }, material: "MDF", minutes: 30 },
  { name: "Ryan Ribbed Console Table", variant: "Console table, 110 × 73 cm", line: "ryan", kind: "console", category: "Console table", size: [110, 73, 32], keycodes: { Standard: "43643486", "Ribbed Console Table": "43395569", "Other version": "43423859" }, minutes: 25, keywords: "hall entry ribbed fluted" },
  { name: "Sadie 6 Drawer Chest", variant: "Chest of drawers, 120 × 75 cm", line: "sadie", kind: "chest", category: "Chest of drawers", size: [120, 75, 39], keycodes: { "Light Oak": "43633777" }, x: { rows: 3, cols: 2 }, keywords: "dresser" },
  { name: "Stevie 4 Drawer Chest", variant: "Chest of drawers, 60 × 90 cm", line: "stevie", kind: "chest", category: "Chest of drawers", size: [60, 90, 40], keycodes: { White: "43484201", Blue: "43633814", Sage: "43633807", Black: "43484218" }, x: { rows: 4 }, keywords: "tallboy" },
  { name: "Stevie Bedside Table", variant: "Bedside table, 40 × 55 cm", line: "stevie", kind: "nightstand", category: "Bedside table", size: [40, 55, 30], keycodes: { Standard: "43515028" }, x: { rows: 2 }, keywords: "nightstand" },
  { name: "Stevie Entertainment Unit", variant: "Entertainment unit, 120 × 45 cm", line: "stevie", kind: "tv", category: "Entertainment unit", size: [120, 45, 40], keycodes: { Standard: "43504404", Black: "43504398" }, keywords: "tv unit tv bench" },
  { name: "4 Drawer Storage Unit on Wheels", variant: "Storage drawers, 31.5 × 70 cm", line: "storage unit on wheels", kind: "chest", category: "Storage drawers", size: [31.5, 70, 43.5], keycodes: { Standard: "42873327" }, minutes: 10, difficulty: 1, material: "Plastic", keywords: "plastic drawers castors" },
  { name: "Thorne 4 Drawer Chest", variant: "Chest of drawers, 60 × 91 cm", line: "thorne", kind: "chest", category: "Chest of drawers", size: [60, 91, 40], keycodes: { Walnut: "43683406" }, x: { rows: 4 }, keywords: "tallboy" },
  { name: "Thorne Bookshelf", variant: "Bookcase, 80 × 138 cm", line: "thorne", kind: "bookcase", category: "Bookcase", size: [80, 138, 30], keycodes: { Walnut: "43683390" }, x: { shelves: 4 }, keywords: "bookshelf" },
  { name: "Thorne Buffet Unit", variant: "Buffet, 120 × 75 cm", line: "thorne", kind: "sideboard", category: "Buffet", size: [120, 75, 39.8], keycodes: { Standard: "42942115" }, x: { doors: 2 }, keywords: "sideboard drawers" },
  { name: "Thorne Coffee Table", variant: "Coffee table, 108 × 42 cm", line: "thorne", kind: "coffee", category: "Coffee table", size: [108, 42, 59], keycodes: { Walnut: "43683369" }, x: { legs: "round" }, keywords: "lounge" },
  { name: "3 Tier Bookshelf", variant: "Bookcase, 30 × 79.5 cm", line: "tier bookshelf", kind: "bookcase", category: "Bookcase", size: [30, 79.5, 23.5], keycodes: { White: "42633327" }, x: { shelves: 3 }, keywords: "bookshelf narrow", slug: "kmart-3-tier-bookshelf-30-x-79-5" },
  { name: "4 Tier Bookshelf", variant: "Bookcase, 60 × 147 cm", line: "tier bookshelf", kind: "bookcase", category: "Bookcase", size: [60, 147, 28], keycodes: { White: "42633945" }, x: { shelves: 4 }, keywords: "bookshelf tall" },
  { name: "Timber Boucle Chair", variant: "Armchair, 64 × 78 cm", line: "timber boucle", kind: "armchair", category: "Armchair", size: [64, 78, 71], keycodes: { Standard: "43270866" }, minutes: 30, keywords: "armchair accent boucle timber" },
  { name: "White 3 Tier Trolley", variant: "Trolley, 44 × 77.5 cm", line: "trolley", kind: "trolley", category: "Trolley", size: [44, 77.5, 31.5], keycodes: { White: "43476046" }, keywords: "cart utility" },
  { name: "Underbed Shoe Drawer on Wheels", variant: "Underbed storage, 69.5 × 16 cm", line: "underbed shoe drawer", kind: "shoerack", category: "Underbed storage", size: [69.5, 16, 62], keycodes: { Standard: "43632671" }, minutes: 15, difficulty: 1, material: "Steel tube, mesh cloth", keywords: "shoe storage under bed mesh castors" },
  { name: "Wave Book Storage", variant: "Book storage, 82 × 80 cm", line: "wave", kind: "bookcase", category: "Book storage", size: [82, 80, 29], keycodes: { Standard: "43746880" }, minutes: 120, keywords: "kids book display drawers castors" },
  { name: "Wharf 4 Door Sideboard", variant: "Sideboard, 120 × 76 cm", line: "wharf", kind: "sideboard", category: "Sideboard", size: [120, 76, 40], keycodes: { Oak: "43712120" }, material: "Particleboard and metal", keywords: "buffet cabinet" },
  { name: "Wharf 5 Tier Bookshelf", variant: "Bookcase, 120 × 153 cm", line: "wharf", people: 1, kind: "bookcase", category: "Bookcase", size: [120, 153, 33], keycodes: { Standard: "43635405" }, x: { shelves: 5 }, material: "Particleboard and metal", keywords: "bookshelf" },
  { name: "Wharf 6 Drawer Chest", variant: "Chest of drawers, 120 × 75 cm", line: "wharf", kind: "chest", category: "Chest of drawers", size: [120, 75, 40], keycodes: { Standard: "43643431" }, x: { rows: 3, cols: 2 }, keywords: "dresser" },
{ name: "Willow 2 Tier Shoe Cabinet", variant: "Shoe cabinet, 60 × 81 cm", line: "willow", kind: "shoe", category: "Shoe cabinet", size: [60, 81, 24], keycodes: { Walnut: "43705368" }, x: { c: 2 }, keywords: "shoe storage" },
  { name: "Willow 3 Door Sideboard", variant: "Sideboard, 110 × 76 cm", line: "willow", kind: "sideboard", category: "Sideboard", size: [110, 76, 39], keycodes: { Walnut: "43635702" }, keywords: "buffet cabinet" },
  { name: "Willow 3 Drawer Chest", variant: "Chest of drawers, 80 × 75 cm", line: "willow", kind: "chest", category: "Chest of drawers", size: [80, 75, 39], keycodes: { Standard: "43633715" }, x: { rows: 3 }, keywords: "dresser" },
  { name: "Willow Bedside Table", variant: "Bedside table, 40 × 55 cm", line: "willow", kind: "nightstand", category: "Bedside table", size: [40, 55, 29], keycodes: { Standard: "43633708" }, x: { rows: 1 }, keywords: "nightstand" },
  { name: "Willow Entertainment Unit", variant: "Entertainment unit, 110 × 45 cm", line: "willow", kind: "tv", category: "Entertainment unit", size: [110, 45, 39], keycodes: { Walnut: "43717156" }, keywords: "tv unit tv bench" },
];
