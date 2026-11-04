import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's plain white tier bookshelves, read from their assembly manuals. Both are 15 mm board held with screws
 * through the outside, a hardboard back nailed on and caps over the screw heads, with a small bracket for the wall.
 * The manuals print no keycode on their pages; each row's keycode is the one Kmart files the manual under.
 *
 * - 3 Tier Bookshelf (42633327, 30 x 79.5 cm): two sides (1), two shelves (2), a top and a bottom that are the same
 *   board (4) and one back (3). The shelves are screwed to one side and then the other, the bottom goes on under the
 *   sides and the top over them, two screws at each corner. Kmart's bag: A 16 screws 4 x 35, B 16 caps, C 14 nails
 *   2 x 16, D one bracket screw 4 x 12, E the wall bracket, F the wall plug and screw (one set, drawn here as a plug
 *   and a screw). The manual's step 3 is only an exploded view, so the guide's 7 steps are its steps 4 to 10.
 * - 4 Tier Bookshelf (42633945, 60 x 147 cm): built as two halves of two shelves each. The upper half is sides 1 and
 *   2 on a shelf (6), the top (5) and the middle board (7) under it; the lower half is sides 3 and 4 on the other
 *   shelf (6), the bottom shelf (10) and the plinth (8) under its front edge. The halves join on board 7 with four
 *   cam bolts and cam locks, then two backs (9) are nailed on, one per half. Kmart's bag: a 22 screws 4 x 35,
 *   b 20 dowels 6 x 30, c 4 long dowels 6 x 50, d 4 cam bolts, e 4 cam locks, f the wall bracket, g its screw,
 *   h a wall plug, i a wall screw, j 18 caps, k 36 nails 2 x 16 and l 3 wide-headed pins.
 *
 * Readings chosen for the 4 Tier, where the paper doesn't add up on its own:
 * - Its step 6 labels two pegs at each end of board 7 "b", but every b is already used by then (4 in the plinth,
 *   4 in the upper shelf, 4 under the top, 8 in the lower shelf and the bottom shelf: the 20 in the bag). The pegs
 *   sit where the long c dowels of step 4 went in, and a 50 mm dowel in a side's edge goes right through the 15 mm
 *   board, so the guide reads them as the ends of the c dowels and adds no dowels in step 6.
 * - 4 of the 22 screws (those through board 7 into the upper sides) end up between the halves, which is why the bag
 *   has 18 caps: the guide caps the other 18.
 * - Its step 8 presses the caps on (only in its drawing) and fixes the bracket and the wall screw: two jobs, so the
 *   guide splits it into a cap step and a wall step, 9 steps for its 8.
 * - The 36 nails are shared evenly, 18 a back: along its outer end, along the joint over board 7, three up each side
 *   and four across its shelf; the three pins go along the joint where the two backs meet.
 *
 * Part numbers are Kmart's own labels; fittings have plain names and the manual's letters are in the step text.
 */

type Def = { kind: CustomFix["kind"]; len: number; dia: number; name?: string; included?: boolean };
const fx = (def: Def, at: Vec3[], dir: Vec3, on?: string, mate?: string): CustomFix => ({
  ...def,
  count: at.length,
  at,
  dir,
  ...(on ? { on } : {}),
  ...(mate ? { mate } : {}),
});

const T = 15; // every board
const BACK = 3; // hardboard

/* ---------- 3 Tier Bookshelf ---------- */

const SCREW_A: Def = { kind: "screw", len: 35, dia: 4, name: "Screw" }; // A
const CAP_B: Def = { kind: "cap", len: 1, dia: 15 }; // B
const NAIL_C: Def = { kind: "nail", len: 16, dia: 2 }; // C
const SCREW_D: Def = { kind: "screw", len: 12, dia: 4, name: "Bracket screw" }; // D
const BRACKET_E: Def = { kind: "angle", len: 28, dia: 24, name: "Wall bracket" }; // E
const PLUG_F: Def = { kind: "plug", len: 30, dia: 6, included: true }; // F, with the wall screw
const WALL_F: Def = { kind: "screw", len: 35, dia: 4, name: "Wall screw", included: true }; // F

function threeTier(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const DC = D - BACK; // the boards stop at the back, which is nailed on behind them
  const zc = BACK / 2; // middle of the boards' depth
  const zk = -D / 2 + BACK / 2; // the back
  const xs = W / 2 - T / 2; // middle of a side
  const L = H - 2 * T; // a side stands between the bottom and the top
  const tier = (L - 2 * T) / 3;
  const yS = [T + tier + T / 2, T + 2 * tier + T + T / 2]; // the two shelves
  const zA = [zc - (DC / 2 - 40), zc + (DC / 2 - 40)]; // two screws at every joint, 40 mm in from the edges

  const parts: CustomPart[] = [
    { id: "S1R", label: "1", name: "Side panel", size: [T, L, DC], pos: [xs, H / 2, zc] },
    { id: "S1L", label: "1", name: "Side panel", size: [T, L, DC], pos: [-xs, H / 2, zc] },
    { id: "P2a", label: "2", name: "Shelf", size: [W - 2 * T, T, DC], pos: [0, yS[0], zc] },
    { id: "P2b", label: "2", name: "Shelf", size: [W - 2 * T, T, DC], pos: [0, yS[1], zc] },
    { id: "P4b", label: "4", name: "Top and bottom", size: [W, T, DC], pos: [0, T / 2, zc] },
    { id: "P4t", label: "4", name: "Top and bottom", size: [W, T, DC], pos: [0, H - T / 2, zc] },
    { id: "P3", label: "3", name: "Back panel", size: [W, H, BACK], pos: [0, H / 2, zk], material: "fiber" },
  ];

  const sideScrews = (sx: 1 | -1, on: string) => ["P2a", "P2b"].map((id, i) => fx(SCREW_A, zA.map((z): Vec3 => [sx * (W / 2), yS[i], z]), [-sx, 0, 0], on, id));
  const endScrews = (y: number, dir: 1 | -1, on: string) => [1, -1].map((sx) => fx(SCREW_A, zA.map((z): Vec3 => [sx * xs, y, z]), [0, dir, 0], on, sx > 0 ? "S1R" : "S1L"));

  // 14 nails: a corner and the middle of the top and bottom edges, four up each side
  const zn = -D / 2;
  const nails: Vec3[] = [
    ...[-1, 0, 1].flatMap((k): Vec3[] => [
      [k * (W / 2 - 22), H - T / 2, zn],
      [k * (W / 2 - 22), T / 2, zn],
    ]),
    ...[-1, 1].flatMap((sx) => [1, 2, 3, 4].map((k): Vec3 => [sx * xs, T + (L * k) / 5, zn])),
  ];

  const yW = H + 14; // the wall screw goes through the bracket's upright leg, above the top
  const zw = -D / 2; // the wall
  const steps: CustomStep[] = [
    {
      title: "Screw both shelves to one side",
      detail: "Stand a side panel 1 on its edge, hold the two shelves 2 against its holes and drive two screws (A) through the side into each shelf.",
      add: ["S1R", "P2a", "P2b"],
      from: { P2a: [-360, 0, 0], P2b: [-360, 0, 0] },
      fix: sideScrews(1, "S1R"),
    },
    {
      title: "Screw on the other side",
      detail: "Set the second side against the free ends of the shelves and screw it on the same way, two screws (A) a shelf.",
      add: ["S1L"],
      from: { S1L: [-360, 0, 0] },
      fix: sideScrews(-1, "S1L"),
    },
    {
      title: "Screw on the bottom",
      detail: "Fit one of the two end boards 4 under the sides and drive two screws (A) up through it into each side.",
      add: ["P4b"],
      from: { P4b: [0, -320, 0] },
      fix: endScrews(0, 1, "P4b"),
    },
    {
      title: "Screw on the top",
      detail: "Lay the other end board 4 over the tops of the sides and drive two screws (A) down into each one.",
      add: ["P4t"],
      from: { P4t: [0, 320, 0] },
      fix: endScrews(H, -1, "P4t"),
      check: "square",
    },
    {
      title: "Nail on the back",
      detail: "Lay it on its front on a rug, square it up and lay back panel 3 over it. Tap in a nail (C) at each corner, one in the middle of the top and bottom edges and four up each side: 14 in all.",
      add: ["P3"],
      from: { P3: [0, 0, -320] },
      fix: [fx(NAIL_C, nails, [0, 0, 1], "P3")],
      pose: "-z",
      warnings: ["floor"],
    },
    {
      title: "Stand it up and cap the screws",
      detail: "Press a cap (B) onto every screw head on the outside: four on each side, four on the top and four underneath.",
      fix: [
        fx(CAP_B, yS.flatMap((y) => zA.map((z): Vec3 => [W / 2, y, z])), [-1, 0, 0], "S1R"),
        fx(CAP_B, yS.flatMap((y) => zA.map((z): Vec3 => [-W / 2, y, z])), [1, 0, 0], "S1L"),
        fx(CAP_B, [1, -1].flatMap((sx) => zA.map((z): Vec3 => [sx * xs, H, z])), [0, -1, 0], "P4t"),
        fx(CAP_B, [1, -1].flatMap((sx) => zA.map((z): Vec3 => [sx * xs, 0, z])), [0, 1, 0], "P4b"),
      ],
      pose: "+y",
    },
    {
      title: "Fix it to the wall",
      detail: "Screw the small bracket (E) onto the top at the back with the short screw (D), its upright leg against the wall. Mark through it, drill, push in the plug and screw the leg to the wall with the long screw (F). Check the wall for pipes and cables first.",
      fix: [
        fx(BRACKET_E, [[0, H, zw + BACK + 14]], [0, -1, 0], "P4t"),
        fx(SCREW_D, [[0, H, zw + BACK + 22]], [0, -1, 0], "P4t"),
        fx(PLUG_F, [[0, yW, zw - 30]], [0, 0, -1]),
        fx(WALL_F, [[0, yW, zw + 2]], [0, 0, -1]),
      ],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

/* ---------- 4 Tier Bookshelf ---------- */

const SCREW_a: Def = { kind: "screw", len: 35, dia: 4, name: "Screw" }; // a
const DOWEL_b: Def = { kind: "dowel", len: 30, dia: 6 }; // b
const DOWEL_c: Def = { kind: "dowel", len: 50, dia: 6, name: "Long dowel" }; // c
const BOLT_d: Def = { kind: "camScrew", len: 35, dia: 6 }; // d
const CAM_e: Def = { kind: "cam", len: 9.5, dia: 15 }; // e
const BRACKET_f: Def = { kind: "angle", len: 28, dia: 28, name: "Wall bracket" }; // f
const SCREW_g: Def = { kind: "screw", len: 12, dia: 4, name: "Bracket screw" }; // g
const PLUG_h: Def = { kind: "plug", len: 30, dia: 6, included: true }; // h
const WALL_i: Def = { kind: "screw", len: 35, dia: 4, name: "Wall screw", included: true }; // i
const CAP_j: Def = { kind: "cap", len: 1, dia: 15 }; // j
const NAIL_k: Def = { kind: "nail", len: 16, dia: 2 }; // k
const PIN_l: Def = { kind: "cap", len: 2, dia: 12, name: "Wide-head pin" }; // l: a flat round head on a short spike, no size printed

function fourTier(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const DC = D - BACK;
  const zc = BACK / 2;
  const zk = -D / 2 + BACK / 2;
  const xs = W / 2 - T / 2; // middle of a side
  const xi = W / 2 - T; // inner face of a side
  const PL = 50; // the plinth's height, under the bottom shelf
  const yJ = (H + PL) / 2; // middle of board 7, where the two backs meet: they are the same size
  const y7 = yJ - T / 2; // underside of board 7, the top of the lower sides
  const yU = yJ + T / 2; // top of board 7, the foot of the upper sides
  const LU = H - T - yU; // an upper side
  const yS = { up: (yU + H - T) / 2, lo: (PL + T + y7) / 2, bot: PL + T / 2 }; // upper shelf, lower shelf, bottom shelf
  const z8 = D / 2 - T / 2; // the plinth, flush with the front
  const HB = H - yJ; // each back's height
  const z = (dz: number) => zc + dz;
  const pm = (dz: number) => [z(-dz), z(dz)];

  const parts: CustomPart[] = [
    { id: "S1", label: "1", name: "Upper left side", size: [T, LU, DC], pos: [-xs, yU + LU / 2, zc] },
    { id: "S2", label: "2", name: "Upper right side", size: [T, LU, DC], pos: [xs, yU + LU / 2, zc] },
    { id: "P6u", label: "6", name: "Shelf", size: [W - 2 * T, T, DC], pos: [0, yS.up, zc] },
    { id: "P5", label: "5", name: "Top", size: [W, T, DC], pos: [0, H - T / 2, zc] },
    { id: "P7", label: "7", name: "Middle board", size: [W, T, DC], pos: [0, yJ, zc] },
    { id: "S3", label: "3", name: "Lower left side", size: [T, y7, DC], pos: [-xs, y7 / 2, zc] },
    { id: "S4", label: "4", name: "Lower right side", size: [T, y7, DC], pos: [xs, y7 / 2, zc] },
    { id: "P6l", label: "6", name: "Shelf", size: [W - 2 * T, T, DC], pos: [0, yS.lo, zc] },
    { id: "P10", label: "10", name: "Bottom shelf", size: [W - 2 * T, T, DC], pos: [0, yS.bot, zc] },
    { id: "P8", label: "8", name: "Plinth", size: [W - 2 * T, PL, T], pos: [0, PL / 2, z8] },
    { id: "K9u", label: "9", name: "Back panel", size: [W, HB, BACK], pos: [0, yJ + HB / 2, zk], material: "fiber" },
    { id: "K9l", label: "9", name: "Back panel", size: [W, HB, BACK], pos: [0, PL + HB / 2, zk], material: "fiber" },
  ];
  const upper = (sx: number) => (sx < 0 ? "S1" : "S2");
  const lower = (sx: number) => (sx < 0 ? "S3" : "S4");
  const SX = [-1, 1] as const;

  // a board between two sides: two dowels in each end, two screws through each side into it
  const endDowels = (id: string, y: number, side: (sx: number) => string) => SX.map((sx) => fx(DOWEL_b, pm(60).map((zz): Vec3 => [sx * xi, y, zz]), [-sx, 0, 0], id, side(sx)));
  const sideScrews = (id: string, y: number, side: (sx: number) => string) => SX.map((sx) => fx(SCREW_a, pm(98).map((zz): Vec3 => [sx * (W / 2), y, zz]), [-sx, 0, 0], side(sx), id));
  // the lower half waits beside the upper one until step 6 slides it on
  const LOW: Vec3 = [W * 0.75, 0, 0];
  const lowParts = ["S3", "S4", "P6l", "P10", "P8"];
  const lowFrom = Object.fromEntries(lowParts.map((id) => [id, LOW]));

  // 18 nails a back, and the three pins along the joint
  const zn = -D / 2;
  const xr4 = [-270, -90, 90, 270].map((x) => Math.round((x * W) / 600));
  const xs4 = [-190, -65, 65, 190].map((x) => Math.round((x * W) / 600));
  const backNails = (y0: number, yEnd: number, yJoint: number, yShelf: number, jx: number[]): Vec3[] => [
    ...xr4.map((x): Vec3 => [x, yEnd, zn]),
    ...jx.map((x): Vec3 => [x, yJoint, zn]),
    ...SX.flatMap((sx) => [0.25, 0.5, 0.75].map((k): Vec3 => [sx * xs, y0 + HB * k, zn])),
    ...xs4.map((x): Vec3 => [x, yShelf, zn]),
  ];
  const jxU = [-280, -100, 100, 280].map((x) => Math.round((x * W) / 600));
  const jxL = [-240, -50, 50, 240].map((x) => Math.round((x * W) / 600));
  const pins: Vec3[] = [-200, 0, 200].map((x): Vec3 => [Math.round((x * W) / 600), yJ, zn]);

  const yW = H + 14;
  const zw = -D / 2;
  const steps: CustomStep[] = [
    {
      title: "Push dowels into the plinth",
      detail: "One dowel (b) into each end of plinth 8 and two into its long top edge, where it goes under the front of bottom shelf 10.",
      wait: ["P8", "P10"],
      from: { P8: LOW, P10: LOW },
      fix: [
        ...SX.map((sx) => fx(DOWEL_b, [[sx * xi, PL / 2, z8]], [-sx, 0, 0], "P8", lower(sx))),
        fx(DOWEL_b, [-1, 1].map((k): Vec3 => [Math.round((k * W) / 4), PL, z8]), [0, -1, 0], "P8", "P10"),
      ],
      pose: "+z",
    },
    {
      title: "Screw the upper sides to a shelf",
      detail: "Lay sides 1 and 2 on their back edges, push two dowels (b) into each end of a shelf 6 and press the sides onto them. Drive two screws (a) through each side into the shelf.",
      add: ["P6u", "S1", "S2"],
      from: { P6u: [0, 0, 320], S1: [-360, 0, 0], S2: [360, 0, 0] },
      fix: [...endDowels("P6u", yS.up, upper), ...sideScrews("P6u", yS.up, upper)],
      pose: "+z",
      warnings: ["floor"],
    },
    {
      title: "Screw on the top",
      detail: "Two dowels (b) into the top edge of each side, then press top 5 onto them and drive two screws (a) through it into each side.",
      add: ["P5"],
      from: { P5: [0, 360, 0] },
      fix: [
        ...SX.map((sx) => fx(DOWEL_b, pm(60).map((zz): Vec3 => [sx * xs, H - T, zz]), [0, -1, 0], upper(sx), "P5")),
        ...SX.map((sx) => fx(SCREW_a, pm(98).map((zz): Vec3 => [sx * xs, H, zz]), [0, -1, 0], "P5", upper(sx))),
      ],
      pose: "+z",
    },
    {
      title: "Screw board 7 onto the other end",
      detail: "Push two long dowels (c) into the open end of each side, press board 7 over them so they come through, and drive two screws (a) through it into each side.",
      add: ["P7"],
      from: { P7: [0, -360, 0] },
      fix: [
        ...SX.map((sx) => fx(DOWEL_c, pm(45).map((zz): Vec3 => [sx * xs, yU, zz]), [0, 1, 0], upper(sx), "P7")),
        ...SX.map((sx) => fx(SCREW_a, pm(85).map((zz): Vec3 => [sx * xs, y7, zz]), [0, 1, 0], "P7", upper(sx))),
      ],
      pose: "+z",
    },
    {
      title: "Build the lower half",
      detail: "Beside it, push two dowels (b) into each end of the other shelf 6 and of bottom shelf 10, with the plinth pressed under the front of 10. Set sides 3 and 4 against them and drive five screws (a) through each side: two into the shelf, two into the bottom shelf and one into the plinth.",
      wait: lowParts,
      from: lowFrom,
      fix: [
        ...endDowels("P6l", yS.lo, lower),
        ...endDowels("P10", yS.bot, lower),
        ...sideScrews("P6l", yS.lo, lower),
        ...sideScrews("P10", yS.bot, lower),
        ...SX.map((sx) => fx(SCREW_a, [[sx * (W / 2), PL / 2, z8]], [-sx, 0, 0], lower(sx), "P8")),
      ],
      pose: "+z",
    },
    {
      title: "Join the two halves",
      detail: "Drop a cam lock (e) into the round holes near the top of sides 3 and 4, and turn four cam bolts (d) into the open face of board 7. Push the halves together so the bolts and the long dowels go into the lower sides, then turn each cam lock until it pulls tight.",
      add: lowParts,
      fix: [
        ...SX.map((sx) => fx(BOLT_d, pm(118).map((zz): Vec3 => [sx * xs, y7, zz]), [0, 1, 0], "P7", lower(sx))),
        ...SX.map((sx) => fx(CAM_e, pm(118).map((zz): Vec3 => [sx * xi, y7 - 25, zz]), [sx, 0, 0], lower(sx))),
      ],
      tools: ["screwdriver"],
      pose: "+z",
      check: "square",
    },
    {
      title: "Turn it over and nail on the backs",
      detail: "Roll it onto its front on a rug. Lay one back 9 over each half, square them so they meet over board 7, and nail them on (k) all round and across the shelves, 18 nails a back. Tap the three wide-headed pins (l) in along the joint.",
      add: ["K9u", "K9l"],
      from: { K9u: [0, 0, -320], K9l: [0, 0, -320] },
      fix: [
        fx(NAIL_k, backNails(yJ, H - T / 2, yJ + 4, yS.up, jxU), [0, 0, 1], "K9u"),
        fx(NAIL_k, backNails(PL, yS.bot, yJ - 4, yS.lo, jxL), [0, 0, 1], "K9l"),
        fx(PIN_l, pins, [0, 0, 1], "K9u"),
      ],
      pose: "-z",
      warnings: ["floor"],
    },
    {
      title: "Stand it up and cap the screws",
      detail: "Stand it upright and press a cap (j) onto every screw head that shows: four on the top, two on each upper side and five on each lower side.",
      fix: [
        fx(CAP_j, SX.flatMap((sx) => pm(98).map((zz): Vec3 => [sx * xs, H, zz])), [0, -1, 0], "P5"),
        ...SX.map((sx) => fx(CAP_j, pm(98).map((zz): Vec3 => [sx * (W / 2), yS.up, zz]), [-sx, 0, 0], upper(sx))),
        ...SX.map((sx) =>
          fx(CAP_j, [...pm(98).map((zz): Vec3 => [sx * (W / 2), yS.lo, zz]), ...pm(98).map((zz): Vec3 => [sx * (W / 2), yS.bot, zz]), [sx * (W / 2), PL / 2, z8]], [-sx, 0, 0], lower(sx)),
        ),
      ],
      pose: "+y",
    },
    {
      title: "Fix it to the wall",
      detail: "Screw the bracket (f) onto the top at the back with the short screw (g), its upright leg against the wall. Mark through it, drill, push in the plug (h) and screw the leg to the wall (i). Check the wall for pipes and cables first.",
      fix: [
        fx(BRACKET_f, [[0, H, zw + BACK + 14]], [0, -1, 0], "P5"),
        fx(SCREW_g, [[0, H, zw + BACK + 22]], [0, -1, 0], "P5"),
        fx(PLUG_h, [[0, yW, zw - 30]], [0, 0, -1]),
        fx(WALL_i, [[0, yW, zw + 2]], [0, 0, -1]),
      ],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-3-tier-bookshelf-30-x-79-5") return threeTier(s);
  if (s.slug === "kmart-4-tier-bookshelf") return fourTier(s);
  return null;
}

const family: Family = { names: ["KMART:TIER BOOKSHELF"], recipe };
export default family;
