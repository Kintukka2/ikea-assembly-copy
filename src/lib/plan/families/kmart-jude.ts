import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartMaterial, PartPiece, ProductSpec, Vec3 } from "../../types";
import { rotate } from "../math";

/**
 * Kmart's Jude range, read from its assembly manuals: boards with thick rounded edges that read as fluted columns.
 *
 * - Hall Table (43700547): each leg is a wide end panel (4) with a narrower fin (3) standing out from its outer face,
 *   a T seen from above. Lying down, the rail (5) is screwed between the two end panels with a long connector screw
 *   through each, then the fins go on with two dowels and two connector screws from inside each panel. Stood up, a
 *   five sided plate (2) is screwed down onto each leg. The frame is turned over onto the top (1), lying face down:
 *   two dowels and two screws through the rail and four bolts with washers through each plate. Still upside down,
 *   felt pads go under the legs, caps over the four screw heads inside the panels and two wall brackets under the
 *   back edge of the top; stood up, the brackets are screwed to the wall. Kmart's hardware list: six dowels (A),
 *   twelve M7 x 70 connector screws (D), two 4 x 50 screws (E), eight bolts with washers (F), six caps (G), two wall
 *   brackets with their screws (O), two wall plugs with screws (P), six felt pads (Q) and a hex key.
 * - Set of 2 Coffee Tables (43700752): a large table (top 1 on panels 2 and 3) and a small one (top 4 on panels 5
 *   and 6). Each base is two slotted panels pushed together into a cross. The manual builds both at once: four cam
 *   bolts into each top, the panels slid together, the top lowered onto the cross with four dowels and locked with
 *   four cams, then upside down four angle brackets (two screws each) and four felt pads per table. Kmart's hardware
 *   list: eight dowels (A), eight cam bolts (B), eight cam locks (C), eight angle brackets (D), sixteen 4 x 12 screws
 *   (E) and eight felt pads (Q).
 *
 * Part numbers are Kmart's own, so the guide reads against the paper; hardware letters are in each step's text.
 * Readings chosen:
 * - Hall table caps: the list has six caps (G), but step 5's box and drawing fit four, one over each connector screw
 *   head left showing on the inside of the end panels (the two from step 1 hide under the fins). The guide fits four;
 *   two are spare.
 * - Kmart sells sets of two (wall bracket and its screw, wall plug and its screw, bolt and its washer) under one
 *   letter. The guide counts each piece, so two O give two brackets and two bracket screws.
 * - Coffee tables: the set has one row. Its size holds both tables side by side as the guide stands them, the large
 *   one (60 cm across, 40 cm high) on the left and the small one (40 cm across, 48 cm high) 10 cm to its right.
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
const SX = [-1, 1] as const;

/** A part drawn as pieces given where they sit in the finished product: centred on their bounding box. */
function compound(id: string, label: string, name: string, abs: PartPiece[], material: PartMaterial, rot?: Vec3): CustomPart {
  const lo: Vec3 = [Infinity, Infinity, Infinity], hi: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const p of abs)
    for (const a of [-1, 1])
      for (const b of [-1, 1])
        for (const c of [-1, 1]) {
          const corner: Vec3 = [(a * p.size[0]) / 2, (b * p.size[1]) / 2, (c * p.size[2]) / 2];
          const v = p.rot ? rotate(corner, p.rot) : corner;
          for (let k = 0; k < 3; k++) {
            lo[k] = Math.min(lo[k], p.pos[k] + v[k]);
            hi[k] = Math.max(hi[k], p.pos[k] + v[k]);
          }
        }
  const pos: Vec3 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
  const size: Vec3 = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
  const pieces = abs.map((p) => ({ ...p, pos: [p.pos[0] - pos[0], p.pos[1] - pos[1], p.pos[2] - pos[2]] as Vec3 }));
  return { id, label, name, size, pos, material, pieces, ...(rot ? { rot } : {}) };
}

/* ---------- Hall Table ---------- */

const DOWEL_A: Def = { kind: "dowel", len: 30, dia: 6 };
const CONNECTOR_D: Def = { kind: "bolt", len: 70, dia: 7, name: "Connector screw" }; // turned with the hex key
const SCREW_E: Def = { kind: "screw", len: 50, dia: 4 };
const BOLT_F: Def = { kind: "bolt", len: 20, dia: 6 };
const WASHER_F: Def = { kind: "washer", len: 1.5, dia: 14 };
const CAP_G: Def = { kind: "cap", len: 2, dia: 12 };
const BRACKET_O: Def = { kind: "angle", len: 60, dia: 20, name: "Wall bracket" };
const BRACKET_SCREW_O: Def = { kind: "screw", len: 12, dia: 3.5, name: "Bracket screw" };
const PLUG_P: Def = { kind: "plug", len: 30, dia: 6, included: true };
const WALL_SCREW_P: Def = { kind: "screw", len: 35, dia: 4, name: "Wall screw", included: true };
const PAD_Q: Def = { kind: "glide", len: 3, dia: 50 };

function hallTable(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const TT = 25, PT = 12; // the top, the plates
  const yT = H - TT; // underside of the top
  const yP = yT - PT; // top of the legs, under the plates
  const RE = 36; // the rounded edges of the panels and fins
  const xo = W / 2 - 110; // outer end of a fin
  const LF = 103; // a fin, from the panel's face to the end of its round edge
  const C4 = 30; // an end panel's flat middle, between its rounded edges
  const x4 = xo - LF - C4 / 2; // middle of an end panel
  const xin = x4 - C4 / 2; // an end panel's inside face
  const W4 = 240; // an end panel, front to back
  const RH = 90; // the rail
  const yR = yT - RH / 2;

  const panel: PartPiece[] = [
    { shape: "box", size: [C4, yP, W4 - RE], pos: [0, 0, 0] },
    ...SX.map((sz): PartPiece => ({ shape: "cyl", size: [RE, yP, RE], pos: [0, 0, sz * (W4 / 2 - RE / 2)] })),
  ];
  // a fin, built for the right leg (round end outwards) and turned round for the left one
  const f0 = x4 + C4 / 2, fr = xo - RE / 2;
  const fin: PartPiece[] = [
    { shape: "box", size: [fr - f0, yP, 22], pos: [(f0 + fr) / 2, yP / 2, 0] },
    { shape: "cyl", size: [RE, yP, RE], pos: [fr, yP / 2, 0] },
  ];
  // a plate over the T of a leg: square over the end panel, narrowing to a point past the fin
  const px0 = xin, px1 = xo + 15, pxm = x4 + 58, pz = 130;
  const pcx = (px0 + px1) / 2;
  const plate: PartPiece[] = [
    {
      shape: "slab",
      outline: [
        [px0 - pcx, -pz],
        [px0 - pcx, pz],
        [pxm - pcx, pz],
        [px1 - pcx, 40],
        [px1 - pcx, -40],
        [pxm - pcx, -pz],
      ],
      size: [px1 - px0, PT, 2 * pz],
      pos: [0, 0, 0],
    },
  ];
  const top: PartPiece = {
    shape: "slab",
    outline: [
      [-W / 2, -D / 2],
      [W / 2, -D / 2],
      [W / 2, D / 2],
      [-W / 2, D / 2],
    ],
    round: 110,
    size: [W, TT, D],
    pos: [0, 0, 0],
  };
  const turn: Vec3 = [0, Math.PI, 0];
  const leg = (sx: number) => (sx < 0 ? "L" : "R");
  const parts: CustomPart[] = [
    ...SX.map((sx): CustomPart => ({ id: `P4${leg(sx)}`, label: "4", name: "End panel", size: [RE, yP, W4], pos: [sx * x4, yP / 2, 0], material: "board", pieces: panel })),
    { id: "R5", label: "5", name: "Rail", size: [2 * xin, RH, 18], pos: [0, yR, 0], material: "board" },
    ...SX.map((sx) => {
      const p = compound(`F3${leg(sx)}`, "3", "Fin", fin, "board", sx < 0 ? turn : undefined);
      return { ...p, pos: [sx * p.pos[0], p.pos[1], p.pos[2]] as Vec3 };
    }),
    ...SX.map((sx): CustomPart => ({ id: `PL2${leg(sx)}`, label: "2", name: "Top plate", size: [px1 - px0, PT, 2 * pz], pos: [sx * pcx, yP + PT / 2, 0], material: "board", pieces: plate, ...(sx < 0 ? { rot: turn } : {}) })),
    { id: "T1", label: "1", name: "Top", size: [W, TT, D], pos: [0, yT + TT / 2, 0], material: "board", pieces: [top] },
  ];

  const capY = [113, yP - 113];
  const fPts = (sx: number): Vec3[] => [
    [sx * (x4 + 38), yP, -85],
    [sx * (x4 + 38), yP, 85],
    [sx * (x4 + 93), yP, -45],
    [sx * (x4 + 93), yP, 45],
  ];
  const wallX = [-250, 250];
  const zw = -D / 2;
  const steps: CustomStep[] = [
    {
      title: "Screw the rail between the end panels",
      detail: "Lay both end panels on a long edge, on a rug, with the rail (5) between them near their top ends. Drive a long connector screw (D) through each panel into the end of the rail with the hex key.",
      add: ["P4L", "P4R", "R5"],
      fix: SX.map((sx) => fx(CONNECTOR_D, [[sx * (x4 + RE / 2), yR, 0]], [-sx, 0, 0], `P4${leg(sx)}`, "R5")),
      pose: "+z",
      tools: ["allen"],
      warnings: ["floor"],
    },
    {
      title: "Fix a fin to each end panel",
      detail: "Push two dowels (A) into the outside face of each panel and press a fin (3) onto them, round edge outwards. Then drive two connector screws (D) from inside each panel into its fin.",
      add: ["F3L", "F3R"],
      fix: [
        ...SX.map((sx) => fx(DOWEL_A, [250, 450].map((y): Vec3 => [sx * f0, y, 0]), [-sx, 0, 0], `P4${leg(sx)}`, `F3${leg(sx)}`)),
        ...SX.map((sx) => fx(CONNECTOR_D, capY.map((y): Vec3 => [sx * xin, y, 0]), [sx, 0, 0], `P4${leg(sx)}`, `F3${leg(sx)}`)),
      ],
      from: { F3L: [-300, 0, 0], F3R: [300, 0, 0] },
      pose: "+z",
      tools: ["allen"],
    },
    {
      title: "Stand it up and screw on the top plates",
      detail: "Stand the frame on its feet. Lay a plate (2) on each leg, its point over the fin, and drive three connector screws (D) down through it: two into the end panel, one into the fin.",
      add: ["PL2L", "PL2R"],
      fix: SX.map((sx) =>
        fx(
          CONNECTOR_D,
          [
            [sx * x4, yP + PT, -80],
            [sx * x4, yP + PT, 80],
            [sx * (fr - 22), yP + PT, 0],
          ],
          [0, -1, 0],
          `PL2${leg(sx)}`,
        ),
      ),
      pose: "+y",
      tools: ["allen"],
    },
    {
      title: "Fix the frame to the top",
      detail: "Lay the top (1) face down on a rug and turn the frame over onto it. Two dowels (A) go between the rail and the top, two screws (E) through the rail, and four bolts (F) with a washer each through every plate.",
      add: ["T1"],
      fix: [
        fx(DOWEL_A, [-150, 150].map((x): Vec3 => [x, yT, 0]), [0, -1, 0], "R5", "T1"),
        fx(SCREW_E, [-240, 240].map((x): Vec3 => [x, yT - RH, 0]), [0, 1, 0], "R5", "T1"),
        ...SX.map((sx) => fx(WASHER_F, fPts(sx), [0, 1, 0], `PL2${leg(sx)}`)),
        ...SX.map((sx) => fx(BOLT_F, fPts(sx), [0, 1, 0], `PL2${leg(sx)}`, "T1")),
      ],
      from: { T1: [0, 0, 520] },
      pose: "-y",
      tools: ["allen", "screwdriver"],
      warnings: ["floor"],
    },
    {
      title: "Fit the felt pads, caps and wall brackets",
      detail: "Still upside down: three felt pads (Q) on the end of each leg, a cap (G) over each screw head inside the end panels, and the two wall brackets (O) under the back edge of the top, a small screw each.",
      fix: [
        ...SX.map((sx) => fx(PAD_Q, [-95, 95].map((z): Vec3 => [sx * x4, 0, z]), [0, 1, 0], `P4${leg(sx)}`)),
        ...SX.map((sx) => fx(PAD_Q, [[sx * (fr - 4), 0, 0]], [0, 1, 0], `F3${leg(sx)}`)),
        ...SX.map((sx) => fx(CAP_G, capY.map((y): Vec3 => [sx * xin, y, 0]), [sx, 0, 0], `P4${leg(sx)}`)),
        fx(BRACKET_O, wallX.map((x): Vec3 => [x, yT, zw + 15]), [0, 1, 0], "T1"),
        fx(BRACKET_SCREW_O, wallX.map((x): Vec3 => [x, yT, zw + 45]), [0, 1, 0], "T1"),
      ],
      pose: "-y",
      tools: ["screwdriver"],
    },
    {
      title: "Stand it up and fix it to the wall",
      detail: "Stand it against the wall and mark through the two brackets. Drill, push in the plugs (P) and screw the brackets to the wall. Check the wall for pipes and cables first.",
      fix: [fx(PLUG_P, wallX.map((x): Vec3 => [x, yT - 25, zw - 25]), [0, 0, -1]), fx(WALL_SCREW_P, wallX.map((x): Vec3 => [x, yT - 25, zw + 2]), [0, 0, -1], "T1")],
      pose: "+y",
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

/* ---------- Set of 2 Coffee Tables ---------- */

const DOWEL_CA: Def = { kind: "dowel", len: 30, dia: 6 };
const CAM_BOLT_B: Def = { kind: "camScrew", len: 35, dia: 6 };
const CAM_C: Def = { kind: "cam", len: 10, dia: 15 };
const BRACKET_D: Def = { kind: "angle", len: 30, dia: 24 };
const SCREW_CE: Def = { kind: "screw", len: 12, dia: 4 };
const PAD_CQ: Def = { kind: "glide", len: 3, dia: 50 };

interface Table {
  key: string;
  x: number; // middle of its footprint
  dia: number;
  h: number;
  span: number; // a leg panel, end to end
  top: string; // part numbers
  lower: string; // slot from below, slides down
  upper: string; // slot from above
  size: string;
}

function coffeeTables(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const TT = 25; // both tops
  const PT = 25; // the leg panels' flat middles
  const R = 20; // their rounded ends
  // the large table is as deep as the row and stands at its left; the small one at its right, as tall as the row
  const tables: Table[] = [
    { key: "L", x: -W / 2 + D / 2, dia: D, h: 400, span: 470, top: "1", lower: "2", upper: "3", size: "Large" },
    { key: "S", x: W / 2 - 200, dia: 400, h: H, span: 360, top: "4", lower: "5", upper: "6", size: "Small" },
  ];
  const parts: CustomPart[] = [];
  for (const t of tables) {
    const yL = t.h - TT;
    const arm = t.span / 2 - R - PT / 2; // flat part of an arm, beside the slot
    const am = PT / 2 + arm / 2;
    // the panel along x has its slot from the top: two full arms and the lower half between them
    const upper: PartPiece[] = [
      ...SX.map((sx): PartPiece => ({ shape: "box", size: [arm, yL, PT], pos: [sx * am, 0, 0] })),
      ...SX.map((sx): PartPiece => ({ shape: "cyl", size: [2 * R, yL, 2 * R], pos: [sx * (t.span / 2 - R), 0, 0] })),
      { shape: "box", size: [PT, yL / 2, PT], pos: [0, -yL / 4, 0] },
    ];
    // the panel along z has its slot from below: two full arms and the upper half between them
    const lower: PartPiece[] = [
      ...SX.map((sz): PartPiece => ({ shape: "box", size: [PT, yL, arm], pos: [0, 0, sz * am] })),
      ...SX.map((sz): PartPiece => ({ shape: "cyl", size: [2 * R, yL, 2 * R], pos: [0, 0, sz * (t.span / 2 - R)] })),
      { shape: "box", size: [PT, yL / 2, PT], pos: [0, yL / 4, 0] },
    ];
    parts.push(
      { id: `T${t.key}`, label: t.top, name: `${t.size} top`, size: [t.dia, TT, t.dia], pos: [t.x, t.h - TT / 2, 0], shape: "cyl", material: "board" },
      { id: `U${t.key}`, label: t.upper, name: `${t.size} leg, slot from above`, size: [t.span, yL, 2 * R], pos: [t.x, yL / 2, 0], material: "board", pieces: upper },
      { id: `W${t.key}`, label: t.lower, name: `${t.size} leg, slot from below`, size: [2 * R, yL, t.span], pos: [t.x, yL / 2, 0], material: "board", pieces: lower },
    );
  }
  const yL = (t: Table) => t.h - TT;
  const rb = (t: Table) => t.span / 2 - 70; // cam bolts and cams, out along each arm
  const rq = (t: Table) => (t.key === "L" ? 100 : 75); // angle brackets
  const aside: Vec3 = [0, 0, -500];

  const steps: CustomStep[] = [
    {
      title: "Turn the cam bolts into both tops",
      detail: "Lay the large top (1) and the small top (4) face down on a rug and screw four cam bolts (B) into each, by hand until only the neck shows.",
      fix: tables.flatMap((t) => [
        fx(CAM_BOLT_B, SX.map((sx): Vec3 => [t.x + sx * rb(t), yL(t), 0]), [0, 1, 0], `T${t.key}`, `U${t.key}`),
        fx(CAM_BOLT_B, SX.map((sz): Vec3 => [t.x, yL(t), sz * rb(t)]), [0, 1, 0], `T${t.key}`, `W${t.key}`),
      ]),
      wait: ["TL", "TS"],
      from: { TL: aside, TS: aside },
      pose: "-y",
      tools: ["screwdriver"],
      warnings: ["floor"],
    },
    {
      title: "Slide the leg panels together",
      detail: "Stand panel 3 on its feet and slide panel 2 down over it, slot into slot, to make a cross. Do the same with panels 6 and 5 for the small table.",
      add: ["UL", "WL", "US", "WS"],
      from: { WL: [0, 380, 0], WS: [0, 380, 0] },
      pose: "+y",
    },
    {
      title: "Put the tops on and lock the cams",
      detail: "Push two dowels (A) into the top edge of each panel. Lower each top onto its cross, the cam bolts into the holes, then drop a cam (C) into each round hole in the panels and turn it until it pulls tight.",
      add: ["TL", "TS"],
      fix: tables.flatMap((t) => [
        fx(DOWEL_CA, SX.map((sx): Vec3 => [t.x + sx * 60, yL(t), 0]), [0, -1, 0], `U${t.key}`, `T${t.key}`),
        fx(DOWEL_CA, SX.map((sz): Vec3 => [t.x, yL(t), sz * 60]), [0, -1, 0], `W${t.key}`, `T${t.key}`),
        fx(CAM_C, SX.map((sx): Vec3 => [t.x + sx * rb(t), yL(t) - 25, PT / 2]), [0, 0, -1], `U${t.key}`),
        fx(CAM_C, SX.map((sz): Vec3 => [t.x + PT / 2, yL(t) - 25, sz * rb(t)]), [-1, 0, 0], `W${t.key}`),
      ]),
      tools: ["screwdriver"],
    },
    {
      title: "Fit the angle brackets and felt pads",
      detail: "Turn both tables upside down. Screw an angle bracket (D) into each of the four corners where the panels meet the top, one screw (E) into the top and one into the panel, then stick a felt pad (Q) on the end of each arm.",
      fix: tables.flatMap((t) => {
        const y = yL(t), q = rq(t), o = PT / 2;
        const corners: { at: Vec3; top: Vec3; side: Vec3; dir: Vec3; on: string }[] = [
          // the screws 25 mm from the bracket's corner: a fitting closer than 22 mm to another is moved aside
          { at: [t.x + q, y, o + 15], top: [t.x + q, y, o + 40], side: [t.x + q, y - 22, o], dir: [0, 0, -1], on: `U${t.key}` },
          { at: [t.x - o - 15, y, q], top: [t.x - o - 40, y, q], side: [t.x - o, y - 22, q], dir: [1, 0, 0], on: `W${t.key}` },
          { at: [t.x - q, y, -o - 15], top: [t.x - q, y, -o - 40], side: [t.x - q, y - 22, -o], dir: [0, 0, 1], on: `U${t.key}` },
          { at: [t.x + o + 15, y, -q], top: [t.x + o + 40, y, -q], side: [t.x + o, y - 22, -q], dir: [-1, 0, 0], on: `W${t.key}` },
        ];
        const ends = t.span / 2 - R;
        return [
          fx(BRACKET_D, corners.map((c) => c.at), [0, 1, 0], `T${t.key}`),
          fx(SCREW_CE, corners.map((c) => c.top), [0, 1, 0], `T${t.key}`),
          ...corners.map((c) => fx(SCREW_CE, [c.side], c.dir, c.on)),
          fx(PAD_CQ, SX.map((sx): Vec3 => [t.x + sx * ends, 0, 0]), [0, 1, 0], `U${t.key}`),
          fx(PAD_CQ, SX.map((sz): Vec3 => [t.x, 0, sz * ends]), [0, 1, 0], `W${t.key}`),
        ];
      }),
      pose: "-y",
      tools: ["screwdriver"],
    },
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-jude-hall-table") return hallTable(s);
  if (s.slug === "kmart-set-of-2-jude-coffee-tables") return coffeeTables(s);
  return null;
}

const family: Family = { names: ["KMART:JUDE"], recipe };
export default family;
