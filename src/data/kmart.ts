import type { Kind, X } from "@/lib/products";
import type { TipKey } from "@/lib/types";

/**
 * Kmart Australia's flat packs, written by hand from what Kmart publishes about each product (name, keycode,
 * size, what it has) and, for the ones with a recipe in src/lib/plan/families/kmart-*.ts, its assembly manual.
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
 * Featured rows come first; the rest are by product line. Left out for now: four products Kmart lists without a size,
 * a gas-lift bar stool, two fabric covered wardrobes and one listing we couldn't confirm.
 */
export const KMART_ROWS: KmartRow[] = [
  { name: "Charlie 6 Drawer Chest", variant: "Chest of drawers, 120 × 79 cm", line: "charlie", kind: "chest", category: "Chest of drawers", size: [120, 79, 39], keycodes: { White: "43633685" }, x: { rows: 3, cols: 2 }, featured: true, keywords: "dresser" },
  { name: "Confetti Table and Chair Set", variant: "Kids table and chairs, 75 × 49 cm", line: "confetti", kind: "kidstable", category: "Kids table and chairs", size: [75, 49, 54], keycodes: { Standard: "43639816" }, featured: true, keywords: "kids children activity" },
  { name: "4 Cube Storage Unit", variant: "Cube storage, 60 × 60 cm", line: "cube storage", kind: "cube", category: "Cube storage", size: [60, 60, 29], keycodes: { White: "42633310", "Oak Look": "42633181", "Walnut Look": "43707355", Black: "42864103" }, x: { rows: 2 }, material: "Particle board", featured: true, checked: true },
  { name: "8 Cube Storage Unit", variant: "Cube storage, 60 × 122 cm", line: "cube storage", kind: "cube", category: "Cube storage", size: [60, 122, 29], keycodes: { White: "42633297", "Oak Look": "42633280", "Walnut Look": "43707348", Black: "43333462" }, x: { rows: 4 }, material: "Particle board", featured: true, checked: true },
  { name: "Hamptons Bedside Table", variant: "Bedside table, 40 × 55 cm", line: "hamptons", kind: "nightstand", category: "Bedside table", size: [40, 55, 29], keycodes: { White: "43707379", "White, with drawer": "43516278", "White, NZ": "43242030" }, x: { rows: 1 }, featured: true, keywords: "nightstand" },
  { name: "4 Tier Ladder Shelf", variant: "Ladder shelf, 63 × 150 cm", line: "ladder shelf", kind: "bookcase", category: "Ladder shelf", size: [63, 150, 39], keycodes: { White: "42561941" }, x: { shelves: 4 }, material: "Laminated particle board and MDF (manual); listing says MDF", featured: true, keywords: "ladder leaning" },
  { name: "Nate Coffee Table", variant: "Coffee table, 60 × 35 cm", line: "nate", kind: "coffee", category: "Coffee table", size: [60, 35, 60], keycodes: { Black: "43531875", Oak: "43711222", "Other version": "43465866" }, x: { round: true, shelf: false }, featured: true },
  { name: "Wharf Student Desk", variant: "Desk, 110 × 76 cm", line: "wharf", kind: "desk", category: "Desk", size: [110, 76, 50], keycodes: { "Oak Look": "43633050" }, x: { legs: "square" }, material: "Particle board, metal", featured: true, keywords: "study student" },
  { name: "3 Piece Multi Functional Activity Table", variant: "Kids table and chairs, 100 × 49 cm", line: "activity table", kind: "kidstable", category: "Kids table and chairs", size: [100, 49, 55], keycodes: { Standard: "43387991" }, keywords: "kids children activity" },
  { name: "Ally Side Table", variant: "Side table, 40 × 47 cm", line: "ally", kind: "side", category: "Side table", size: [40, 47, 40], keycodes: { Walnut: "43711307", "Other version": "43533466" }, x: { round: true }, material: "MDF" },
  { name: "Alma 6 Drawer Chest", variant: "Chest of drawers, 120 × 76 cm", line: "alma", kind: "chest", category: "Chest of drawers", size: [120, 76, 40], keycodes: { White: "43682775" }, x: { rows: 3, cols: 2 }, material: "Particle board, MDF, metal", keywords: "dresser" },
  { name: "Alma Bedside Table", variant: "Bedside table, 40 × 55 cm", line: "alma", kind: "nightstand", category: "Bedside table", size: [40, 55, 30], keycodes: { Standard: "43516124", "Other version": "43682768" }, x: { rows: 2 }, keywords: "nightstand" },
  { name: "Archie Barstool", variant: "Bar stool, 50 × 89 cm", line: "archie", kind: "chair", category: "Bar stool", size: [50, 89, 52], keycodes: { Green: "43702237", Grey: "43702091" }, x: { seatH: 65 }, keywords: "barstool counter stool" },
  { name: "Atlas Bedside Table", variant: "Bedside table, 40 × 55 cm", line: "atlas", kind: "nightstand", category: "Bedside table", size: [40, 55, 29], keycodes: { Standard: "43471386" }, x: { rows: 1 }, keywords: "nightstand" },
  { name: "Blake 3 Tier Long Bookshelf", variant: "Bookcase, 143 × 82 cm", line: "blake", kind: "bookcase", category: "Bookcase", size: [143, 82, 30], keycodes: { Standard: "43270620" }, x: { shelves: 3 }, keywords: "bookshelf long" },
  { name: "Blake 5 Tier Bookshelf", variant: "Bookcase, 43 × 160 cm", line: "blake", kind: "bookcase", category: "Bookcase", size: [43, 160, 30], keycodes: { Standard: "43270637" }, x: { shelves: 5 }, material: "Particle board with melamine, iron/steel tube", keywords: "bookshelf tall" },
  { name: "Blake Ladder Bookshelf", variant: "Ladder shelf, 60 × 160 cm", line: "blake", kind: "bookcase", category: "Ladder shelf", size: [60, 160, 49], keycodes: { Standard: "43109029" }, x: { shelves: 4 }, keywords: "ladder bookshelf" },
  { name: "Burleigh Chest of Drawers", variant: "Chest of drawers, 79 × 74 cm", line: "burleigh", kind: "chest", category: "Chest of drawers", size: [79, 74, 40], keycodes: { Standard: "43554072" }, x: { rows: 3 } },
  { name: "Camille 2 Drawer Desk", variant: "Desk, 115 × 76 cm", line: "camille", kind: "deskdraw", category: "Desk", size: [115, 76, 60], keycodes: { Standard: "43651993" }, x: { rows: 2 }, keywords: "study drawers" },
  { name: "Camille 6 Drawer Chest", variant: "Chest of drawers, 120 × 80 cm", line: "camille", kind: "chest", category: "Chest of drawers", size: [120, 80, 39], keycodes: { Sage: "43636181", "Other version": "43683321" }, x: { rows: 3, cols: 2 }, keywords: "dresser" },
  { name: "Charlie 2 Door Storage Cabinet", variant: "Storage cabinet, 60 × 80 cm", line: "charlie", kind: "cabinet", category: "Storage cabinet", size: [60, 80, 29], keycodes: { "Washed Oak": "43705535" }, x: { doors: 2 }, keywords: "cupboard" },
  { name: "Charlie 2 Drawer Bedside Table", variant: "Bedside table, 45 × 55 cm", line: "charlie", kind: "nightstand", category: "Bedside table", size: [45, 55, 29], keycodes: { White: "43633081" }, x: { rows: 2 }, keywords: "nightstand" },
  { name: "Charlie 2 Tier Shoe Cabinet", variant: "Shoe cabinet, 60 × 81 cm", line: "charlie", kind: "shoe", category: "Shoe cabinet", size: [60, 81, 24], keycodes: { Standard: "43705559" }, x: { c: 2 }, keywords: "shoe storage" },
  { name: "Charlie Entertainment Unit", variant: "Entertainment unit, 110 × 48 cm", line: "charlie", kind: "tv", category: "Entertainment unit", size: [110, 48, 39], keycodes: { White: "43635474" }, x: { doors: 2 }, material: "Particleboard, MDF", keywords: "tv unit tv bench" },
  { name: "Charlie Side Table", variant: "Side table, 40 × 45 cm", line: "charlie", kind: "side", category: "Side table", size: [40, 45, 40], keycodes: { White: "43635603" }, x: { round: true }, material: "MDF" },
  { name: "Claire 3 Drawer Chest", variant: "Chest of drawers, 80 × 78 cm", line: "claire", kind: "chest", category: "Chest of drawers", size: [80, 78, 40], keycodes: { Oak: "43633746", Walnut: "43635788", Black: "43635818" }, x: { rows: 3 }, material: "Particle board, MDF" },
  { name: "Claire Bedside Table", variant: "Bedside table, 48 × 55 cm", line: "claire", kind: "nightstand", category: "Bedside table", size: [48, 55, 35], keycodes: { Oak: "43633722", Black: "43635764", Walnut: "43746842", "Other version": "43633739" }, x: { rows: 1 }, keywords: "nightstand" },
  { name: "Single Bed Collette Bed Frame", variant: "Bed frame, 91 × 89.5 cm", line: "collette", kind: "bed", category: "Bed frame", size: [91, 89.5, 191.5], keycodes: { Standard: "43139101", "Other version": "43139118" }, x: { l: 187 }, material: "Timber frame, steel centre rail and feet, flat timber slats, polyester fabric", keywords: "single kids" },
  { name: "3 Cube Storage Unit with Cubby", variant: "Cube storage, 70 × 92 cm", line: "cube cubby", kind: "cube", category: "Cube storage", size: [70, 92, 35], keycodes: { White: "43746781", "3 Cube With Cubby Storage": "43643462" } },
  { name: "8 Drawer Chest", variant: "Chest of drawers, 86 × 98 cm", line: "drawer chest", kind: "chest", category: "Chest of drawers", size: [86, 98, 30], keycodes: { Grey: "43465958" }, x: { rows: 4, cols: 2 }, keywords: "fabric drawers tallboy" },
  { name: "6 Drawer Dresser", variant: "Chest of drawers, 120 × 75.5 cm", line: "dresser", kind: "chest", category: "Chest of drawers", size: [120, 75.5, 39.5], keycodes: { White: "42941941" }, x: { rows: 3, cols: 2 }, keywords: "dresser" },
  { name: "Elliot Storage Bench", variant: "Storage bench, 100 × 45 cm", line: "elliot", kind: "lidbox", category: "Storage bench", size: [100, 45, 40], keycodes: { Standard: "43704668" }, keywords: "ottoman blanket box" },
  { name: "Queen Bed Evalyn Timber Bed Frame", variant: "Bed frame, 163 × 90 cm", line: "evalyn", kind: "bed", category: "Bed frame", size: [163, 90, 208], keycodes: { Standard: "43348831", "Other version": "43348985" }, x: { m: 153, l: 203 }, material: "Bamboo timber frame, steel centre rail and support feet, flat plywood slats", keywords: "queen timber" },
  { name: "Heavy Duty Garment Rack", variant: "Garment rack, 130 × 170 cm", line: "garment rack", kind: "clothesrack", category: "Garment rack", size: [130, 170, 55.5], keycodes: { Standard: "43691005" }, material: "Metal", keywords: "clothes rail heavy duty" },
  { name: "Henry Upholstered Bar Stool", variant: "Bar stool, 50 × 93 cm", line: "henry", kind: "chair", category: "Bar stool", size: [50, 93, 49.5], keycodes: { Green: "43641482", Grey: "43706303" }, x: { seatH: 66 }, material: "Polyester cover, PU foam, plywood and steel frame", keywords: "barstool counter stool upholstered" },
  { name: "Kids Bookcase with Storage", variant: "Kids bookcase, 62 × 76 cm", line: "kids storage", kind: "bookcase", category: "Kids bookcase", size: [62, 76, 30], keycodes: { Standard: "43517947" }, x: { shelves: 3 }, keywords: "kids book display" },
  { name: "Kids Storage Unit with 3 Tubs", variant: "Kids storage unit, 45.5 × 95 cm", line: "kids storage", kind: "open", category: "Kids storage unit", size: [45.5, 95, 30], keycodes: { "Oak Look": "43028153", Oak: "43644674", "Other version": "43517923" }, x: { shelves: 2 }, keywords: "kids tubs toy storage" },
  { name: "Kids Storage Unit with 6 Tubs", variant: "Kids storage unit, 97 × 55.5 cm", line: "kids storage", kind: "open", category: "Kids storage unit", size: [97, 55.5, 44], keycodes: { White: "43109814", "Oak Look": "43109838" }, x: { shelves: 0 }, keywords: "kids tubs toy storage" },
  { name: "Kirby 2 Door Cabinet", variant: "Storage cabinet, 118 × 76 cm", line: "kirby", kind: "cabinet", category: "Storage cabinet", size: [118, 76, 43], keycodes: { Oak: "43709090" }, x: { doors: 2 }, keywords: "cupboard sideboard buffet" },
  { name: "Kirby Entertainment Unit", variant: "Entertainment unit, 160 × 45 cm", line: "kirby", kind: "tv", category: "Entertainment unit", size: [160, 45, 43], keycodes: { Standard: "43708963" }, x: { doors: 2 }, keywords: "tv unit tv bench" },
  { name: "Leon Bedside Table", variant: "Bedside table, 40 × 55 cm", line: "leon", kind: "nightstand", category: "Bedside table", size: [40, 55, 29.5], keycodes: { Standard: "43541416" }, x: { rows: 1 }, keywords: "nightstand" },
  { name: "Linear 1 Drawer Bedside Table", variant: "Bedside table, 40 × 53 cm", line: "linear", kind: "nightstand", category: "Bedside table", size: [40, 53, 30], keycodes: { Standard: "43410002" }, x: { rows: 1 }, keywords: "nightstand" },
  { name: "Linen Look 8 Drawer Chest", variant: "Chest of drawers, 86 × 99 cm", line: "linen look", kind: "chest", category: "Chest of drawers", size: [86, 99, 30], keycodes: { Beige: "43706297" }, x: { rows: 4, cols: 2 }, keywords: "fabric drawers tallboy" },
  { name: "5 Tier Lozenge Bookshelf", variant: "Bookcase, 110 × 132 cm", line: "lozenge", kind: "bookcase", category: "Bookcase", size: [110, 132, 29.5], keycodes: { Black: "43541522", "Oak Look": "43541621" }, x: { shelves: 5 }, material: "Particle board", keywords: "bookshelf" },
  { name: "Double Bed Mali Bedframe", variant: "Bed frame, 159 × 96 cm", line: "mali", kind: "bed", category: "Bed frame", size: [159, 96, 220], keycodes: { Standard: "43712137", "Other version": "43701414" }, x: { m: 138, l: 188 }, material: "Upholstered, metal base", keywords: "double metal" },
  { name: "Metal and Walnut Look Shoe Rack", variant: "Shoe rack, 100 × 65 cm", line: "metal and walnut look", kind: "shoerack", category: "Shoe rack", size: [100, 65, 36], keycodes: { "Walnut Look": "43691050" }, material: "Metal, walnut-look board", keywords: "shoe storage metal" },
  { name: "Miles 2 Drawer Bedside Table", variant: "Bedside table, 48 × 52 cm", line: "miles", kind: "nightstand", category: "Bedside table", size: [48, 52, 40], keycodes: { Walnut: "43709304", "Light Oak": "43709243" }, x: { rows: 2 }, material: "Particle board, MDF", keywords: "nightstand" },
  { name: "Miles 3 Drawer Chest", variant: "Chest of drawers, 80 × 76 cm", line: "miles", kind: "chest", category: "Chest of drawers", size: [80, 76, 40], keycodes: { "Light Oak": "43709229", Walnut: "43709298" }, x: { rows: 3 } },
  { name: "Miles 6 Drawer Chest", variant: "Chest of drawers, 120 × 76 cm", line: "miles", kind: "chest", category: "Chest of drawers", size: [120, 76, 40], keycodes: { "Light Oak": "43709106", Walnut: "43709267" }, x: { rows: 3, cols: 2 }, people: 2, keywords: "dresser" },
  { name: "Miles Entertainment Unit", variant: "Entertainment unit, 120 × 48 cm", line: "miles", kind: "tv", category: "Entertainment unit", size: [120, 48, 40], keycodes: { Walnut: "43709281", "Light Oak": "43709137" }, x: { doors: 2 }, keywords: "tv unit tv bench" },
  { name: "Oliver Bookshelf", variant: "Bookcase, 80 × 120 cm", line: "oliver", kind: "bookcase", category: "Bookcase", size: [80, 120, 29], keycodes: { Standard: "43707409" }, x: { shelves: 3 }, keywords: "bookshelf" },
  { name: "Ryan Ribbed Coffee Table", variant: "Coffee table, 70 × 37 cm", line: "ryan", kind: "coffee", category: "Coffee table", size: [70, 37, 70], keycodes: { Walnut: "43636594", Black: "43636600", Oak: "43636549" }, x: { round: true, shelf: false }, material: "MDF" },
  { name: "5 Tier Scandi Bookshelf", variant: "Bookcase, 80 × 163 cm", line: "scandi", kind: "bookcase", category: "Bookcase", size: [80, 163, 32], keycodes: { Standard: "43538263" }, x: { shelves: 5 }, keywords: "bookshelf" },
  { name: "Scandi Desk", variant: "Desk, 110 × 75 cm", line: "scandi", kind: "desk", category: "Desk", size: [110, 75, 50], keycodes: { Standard: "43318308" }, x: { legs: "round" }, keywords: "study" },
  { name: "Stevie 2 Drawer Desk", variant: "Desk, 115 × 76 cm", line: "stevie", kind: "deskdraw", category: "Desk", size: [115, 76, 60], keycodes: { Sage: "43684298" }, x: { rows: 2 }, keywords: "study drawers" },
  { name: "Stevie 4 Drawer Chest", variant: "Chest of drawers, 60 × 90 cm", line: "stevie", kind: "chest", category: "Chest of drawers", size: [60, 90, 40], keycodes: { White: "43484201", Blue: "43633814", Sage: "43633807", Black: "43484218" }, x: { rows: 4 }, keywords: "tallboy" },
  { name: "Desk with Storage", variant: "Desk, 120 × 75.5 cm", line: "storage desk", kind: "deskdraw", category: "Desk", size: [120, 75.5, 60], keycodes: { Oak: "42942504" }, x: { rows: 2 }, keywords: "study drawers cabinet" },
  { name: "Thorne 4 Drawer Chest", variant: "Chest of drawers, 60 × 91 cm", line: "thorne", kind: "chest", category: "Chest of drawers", size: [60, 91, 40], keycodes: { Walnut: "43683406", Other: "42950851" }, x: { rows: 4 }, keywords: "tallboy" },
  { name: "Thorne Bookshelf", variant: "Bookcase, 80 × 138 cm", line: "thorne", kind: "bookcase", category: "Bookcase", size: [80, 138, 30], keycodes: { Standard: "43114627", Walnut: "43683390", Black: "43266999" }, x: { shelves: 4 }, keywords: "bookshelf" },
  { name: "3 Tier Bookshelf", variant: "Bookcase, 110 × 67.5 cm", line: "tier bookshelf", kind: "bookcase", category: "Bookcase", size: [110, 67.5, 29.5], keycodes: { Oak: "43541744", Black: "43541652" }, x: { shelves: 3 }, material: "Particle board", keywords: "bookshelf low" },
  { name: "White 3 Tier Trolley", variant: "Trolley, 44 × 77.5 cm", line: "trolley", kind: "trolley", category: "Trolley", size: [44, 77.5, 31.5], keycodes: { White: "43476046" }, keywords: "cart utility" },
  { name: "12 Tub Storage Unit", variant: "Tub storage unit, 54.5 × 54 cm", line: "tub storage", kind: "open", category: "Tub storage unit", size: [54.5, 54, 54.5], keycodes: { Standard: "43706389" }, x: { shelves: 2 }, material: "Polypropylene, particle board", keywords: "tubs tub organiser" },
  { name: "6 Tub Tiered Unit", variant: "Tub storage unit, 96 × 95 cm", line: "tub storage", kind: "open", category: "Tub storage unit", size: [96, 95, 44], keycodes: { White: "43067138" }, x: { shelves: 2 }, material: "Particle board, polypropylene", keywords: "tubs tiered organiser" },
  { name: "9 Tub Storage Unit", variant: "Tub storage unit, 63 × 60 cm", line: "tub storage", kind: "open", category: "Tub storage unit", size: [63, 60, 30], keycodes: { Oak: "43644667" }, x: { shelves: 2 }, material: "Particle board, metal tube, polypropylene", keywords: "tubs tub organiser" },
  { name: "3 Drawer Walnut Look Chest", variant: "Chest of drawers, 45 × 75 cm", line: "walnut look", kind: "chest", category: "Chest of drawers", size: [45, 75, 30], keycodes: { "Walnut Look": "43705726" }, x: { rows: 3 }, material: "MDF, particle board, polyester", keywords: "tallboy narrow" },
  { name: "8 Drawer Walnut Look Chest", variant: "Chest of drawers, 80 × 95 cm", line: "walnut look", kind: "chest", category: "Chest of drawers", size: [80, 95, 30], keycodes: { "Walnut Look": "43705733" }, x: { rows: 4, cols: 2 }, keywords: "tallboy" },
  { name: "Walnut Look Garment Rack", variant: "Garment rack, 72 × 170 cm", line: "walnut look", kind: "clothesrack", category: "Garment rack", size: [72, 170, 44], keycodes: { "Walnut Look": "43691043" }, keywords: "clothes rail" },
  { name: "Walnut Look Shoe Bench", variant: "Shoe bench, 80 × 47 cm", line: "walnut look", kind: "shelfbench", category: "Shoe bench", size: [80, 47, 34], keycodes: { "Walnut Look": "43691135" }, keywords: "shoe storage seat" },
  { name: "Walnut Look Shoe Cabinet", variant: "Shoe cabinet, 80 × 88 cm", line: "walnut look", kind: "shoe", category: "Shoe cabinet", size: [80, 88, 40], keycodes: { "Walnut Look": "43705689" }, x: { c: 2 }, keywords: "shoe storage" },
  { name: "Wave Bookshelf", variant: "Bookcase, 62 × 88 cm", line: "wave", kind: "bookcase", category: "Bookcase", size: [62, 88, 30], keycodes: { Standard: "43637706", Oak: "43746897" }, x: { shelves: 2 }, keywords: "bookshelf" },
  { name: "Wharf 5 Tier Bookshelf", variant: "Bookcase, 120 × 153 cm", line: "wharf", people: 1, kind: "bookcase", category: "Bookcase", size: [120, 153, 33], keycodes: { Standard: "43635405" }, x: { shelves: 5 }, material: "Particleboard and metal", keywords: "bookshelf" },
  { name: "Wharf 6 Drawer Chest", variant: "Chest of drawers, 120 × 75 cm", line: "wharf", kind: "chest", category: "Chest of drawers", size: [120, 75, 40], keycodes: { Standard: "43643431" }, x: { rows: 3, cols: 2 }, keywords: "dresser" },
];
