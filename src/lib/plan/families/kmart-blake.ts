import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's BLAKE line, read from its assembly manuals: boards on black steel ladder frames.
 *
 * - Blake 3 Tier Long Bookshelf (43270620): two bays side by side on three frames, the end frames (3) and the middle
 *   frame (4), each two posts with a rung under every level and small tabs on the rungs for the screws. Four top
 *   rails (5) run front and back between the frames under the two tops (1); each bay has two shelves (2).
 *   The manual starts with the middle frame upside down and bolts the rails to it (a bolt through each pair of rails
 *   and the post, with a nut), then lays it on its back: the shelves go onto the middle frame's tabs, the end frames
 *   bolt onto the shelves' ends and the rails, the two tops are joined with dowels and screwed up through the rails,
 *   and the shelves and tops are screwed to the remaining tabs. Stood up, two straps round the back posts hold it to
 *   the wall. It says not to tighten anything fully until the end.
 *
 * Kmart's bag: A 8 bolts M5 x 40, B 6 bolts M6 x 35, C 2 nuts M6, D 20 screws 4 x 12, E 8 screws 4 x 25, G 2 wall
 * screws, H 2 wall plugs, I 2 wall straps, L 2 dowels 6 x 30, and three tools: F and K Allen keys and J a spanner.
 * Every count box adds up to the list. The manual prints no size; the unit is Kmart's listed 143 x 82 x 30 cm.
 * Which side of each rung has tabs is read from the screws: the end frames only under the shelves, inside; the
 * middle frame under the shelves and the tops on both sides. Part numbers are Kmart's own labels; fittings have
 * plain names and the manual's letters are in the step text.
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

const BOLT_A: Def = { kind: "bolt", len: 40, dia: 5 }; // A
const BOLT_B: Def = { kind: "bolt", len: 35, dia: 6 }; // B
const NUT_C: Def = { kind: "nut", len: 5, dia: 6 }; // C
const SCREW_D: Def = { kind: "screw", len: 12, dia: 4, name: "Short screw" }; // D
const SCREW_E: Def = { kind: "screw", len: 25, dia: 4, name: "Rail screw" }; // E
const WALL_G: Def = { kind: "screw", len: 35, dia: 4, name: "Wall screw", included: true }; // G
const PLUG_H: Def = { kind: "plug", len: 30, dia: 6, included: true }; // H
const STRAP_I: Def = { kind: "strap", len: 40, dia: 12, name: "Wall strap" }; // I
const DOWEL_L: Def = { kind: "dowel", len: 30, dia: 6 }; // L

function longBookshelf(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const T = 15; // boards
  const P = 20; // square tube
  const TAB = 25; // a tab sticks out this far from its rung
  const FH = H - T; // the frames; the tops lie on them
  const zp = D / 2 - P / 2; // middle of a post
  const rungY = [50, 410, FH - P / 2]; // middle of each rung: bottom shelf, middle shelf, top
  const yShelf = [rungY[0] + P / 2 + T / 2, rungY[1] + P / 2 + T / 2];
  const xE = W / 2 - P / 2; // middle of an end frame's tube
  const BW = xE - P / 2 - P / 2; // a bay, between the middle frame and an end frame
  const bayX = [-1, 1].map((sx) => sx * (P / 2 + BW / 2));
  const zt = [-100, 100].map((k) => Math.round((k * D) / 300)); // the two tabs on a rung

  // a frame: posts and rungs, and tabs where screws go up through them, as pieces around its own middle
  const frame = (cx: number, tabs: { side: 1 | -1; rung: number }[]): PartPiece[] => {
    const y = (yy: number) => yy - FH / 2;
    return [
      ...[-1, 1].map((sz): PartPiece => ({ shape: "box", size: [P, FH, P], pos: [cx, 0, sz * zp] })),
      ...rungY.map((yr): PartPiece => ({ shape: "box", size: [P, P, D - 2 * P], pos: [cx, y(yr), 0] })),
      ...tabs.flatMap((t) => zt.map((z): PartPiece => ({ shape: "box", size: [TAB, 3, 30], pos: [cx + t.side * (P / 2 + TAB / 2), y(rungY[t.rung] + P / 2 - 1.5), z] }))),
    ];
  };
  // an end frame's box reaches from its tube to the tips of its tabs, inside; the right one is the left turned round
  const endW = P + TAB;
  const endX = W / 2 - endW / 2;
  const endPieces = frame(-(endW / 2 - P / 2), [
    { side: 1, rung: 0 },
    { side: 1, rung: 1 },
  ]);
  const midPieces = frame(0, [0, 1, 2].flatMap((rung) => [{ side: -1 as const, rung }, { side: 1 as const, rung }]));

  const parts: CustomPart[] = [
    { id: "M", label: "4", name: "Middle frame", size: [P + 2 * TAB, FH, D], pos: [0, FH / 2, 0], material: "metal", pieces: midPieces },
    { id: "FL", label: "3", name: "End frame", size: [endW, FH, D], pos: [-endX, FH / 2, 0], material: "metal", pieces: endPieces },
    { id: "FR", label: "3", name: "End frame", size: [endW, FH, D], pos: [endX, FH / 2, 0], rot: [0, Math.PI, 0], material: "metal", pieces: endPieces },
  ];
  // rails: left front, right front, left back, right back
  const RAILS = [
    { id: "R1", sx: -1, sz: 1 },
    { id: "R2", sx: 1, sz: 1 },
    { id: "R3", sx: -1, sz: -1 },
    { id: "R4", sx: 1, sz: -1 },
  ] as const;
  for (const r of RAILS) parts.push({ id: r.id, label: "5", name: "Top rail", size: [BW, P, P], pos: [bayX[r.sx < 0 ? 0 : 1], rungY[2], r.sz * zp], material: "metal" });
  // shelves: left bottom, right bottom, left middle, right middle
  const SHELVES = [
    { id: "S1", sx: -1, lv: 0 },
    { id: "S2", sx: 1, lv: 0 },
    { id: "S3", sx: -1, lv: 1 },
    { id: "S4", sx: 1, lv: 1 },
  ] as const;
  for (const sh of SHELVES) parts.push({ id: sh.id, label: "2", name: "Shelf", size: [BW, T, D], pos: [bayX[sh.sx < 0 ? 0 : 1], yShelf[sh.lv], 0] });
  parts.push({ id: "T1", label: "1", name: "Top", size: [W / 2, T, D], pos: [-W / 4, H - T / 2, 0] });
  parts.push({ id: "T2", label: "1", name: "Top", size: [W / 2, T, D], pos: [W / 4, H - T / 2, 0] });

  const yRail = rungY[2];
  const tabX = P / 2 + TAB / 2; // a tab's middle, from its frame's tube
  // a shelf's end onto a tab: a short screw up through each of the rung's two tabs
  const tabScrews = (x: number, y: number, on: string, mate: string) => fx(SCREW_D, zt.map((z): Vec3 => [x, y, z]), [0, 1, 0], on, mate);
  const shelvesOn = (sx: -1 | 1) => SHELVES.filter((sh) => sh.sx === sx);
  // an end frame on the shelves and rails: two A bolts through the posts into each shelf end, a B bolt into each rail
  const endBolts = (sx: -1 | 1, on: string): CustomFix[] => [
    ...shelvesOn(sx).map((sh) => fx(BOLT_A, [-1, 1].map((sz): Vec3 => [sx * (W / 2), yShelf[sh.lv], sz * (zp - 5)]), [-sx, 0, 0], on, sh.id)),
    ...RAILS.filter((r) => r.sx === sx).map((r) => fx(BOLT_B, [[sx * (W / 2), yRail, r.sz * zp]], [-sx, 0, 0], on, r.id)),
  ];

  const toL: Vec3 = [-420, 0, 0], toR: Vec3 = [420, 0, 0];
  const steps: CustomStep[] = [
    {
      title: "Bolt the top rails to the middle frame",
      detail: "Stand middle frame 4 on its top end. Hold a rail 5 to each side of a post at the top, put a bolt (B) through the left rail, the post and the right rail, and run a nut (C) onto it with the spanner. The same at the other post. Keep them loose for now.",
      add: ["M", "R1", "R2", "R3", "R4"],
      from: { R1: toL, R3: toL, R2: toR, R4: toR },
      fix: [
        fx(BOLT_B, [[-P / 2, yRail, zp]], [1, 0, 0], "R1", "M"),
        fx(BOLT_B, [[-P / 2, yRail, -zp]], [1, 0, 0], "R3", "M"),
        fx(NUT_C, [[P / 2, yRail, zp]], [1, 0, 0], "R2"),
        fx(NUT_C, [[P / 2, yRail, -zp]], [1, 0, 0], "R4"),
      ],
      tools: ["allen", "wrench"],
      pose: "-y",
      warnings: ["loose"],
    },
    {
      title: "Screw the shelves onto the middle frame",
      detail: "Lay it on its back on a rug. Rest the four shelves 2 on the middle frame's lower two rungs, two each side, and drive a short screw (D) up through each tab into them: eight in all.",
      add: ["S1", "S2", "S3", "S4"],
      from: { S1: toL, S3: toL, S2: toR, S4: toR },
      fix: SHELVES.map((sh) => tabScrews(sh.sx * tabX, rungY[sh.lv] + P / 2 - 3, "M", sh.id)),
      pose: "+z",
      warnings: ["floor"],
    },
    {
      title: "Bolt on the left end frame",
      detail: "Set an end frame 3 against the left ends of the shelves and rails. Two bolts (A) through its posts into each shelf end, and a bolt (B) into the end of each rail, still loose.",
      add: ["FL"],
      from: { FL: toL },
      fix: endBolts(-1, "FL"),
      pose: "+z",
      warnings: ["loose"],
    },
    {
      title: "Bolt on the right end frame",
      detail: "The other end frame onto the right ends the same way: four bolts (A) into the shelves and two (B) into the rails.",
      add: ["FR"],
      from: { FR: toR },
      fix: endBolts(1, "FR"),
      pose: "+z",
      warnings: ["loose"],
    },
    {
      title: "Fit the two tops",
      detail: "Push the two dowels (L) into the edge of one top 1, press the other top onto them, and lay the pair over the frames and rails.",
      add: ["T1", "T2"],
      from: { T1: [0, 400, 0], T2: [0, 400, 0] },
      fix: [fx(DOWEL_L, [-1, 1].map((k): Vec3 => [0, H - T / 2, Math.round((k * D) / 4)]), [-1, 0, 0], "T1", "T2")],
      pose: "+z",
    },
    {
      title: "Screw the tops to the rails",
      detail: "Drive two of the longer screws (E) up through each rail into the tops: eight in all.",
      fix: RAILS.map((r) => fx(SCREW_E, [-1, 1].map((k): Vec3 => [bayX[r.sx < 0 ? 0 : 1] + k * Math.round(BW * 0.3), yRail - P / 2, r.sz * zp]), [0, 1, 0], r.id, r.sx < 0 ? "T1" : "T2")),
      pose: "+z",
    },
    {
      title: "Screw the shelves and tops to the tabs",
      detail: "Drive a short screw (D) up through each tab on the end frames into the shelves, and through the tabs on the middle frame's top rung into the tops: twelve in all.",
      fix: [
        ...SHELVES.map((sh) => tabScrews(sh.sx * (W / 2 - P - TAB / 2), rungY[sh.lv] + P / 2 - 3, sh.sx < 0 ? "FL" : "FR", sh.id)),
        ...[-1, 1].map((sx) => tabScrews(sx * tabX, rungY[2] + P / 2 - 3, "M", sx < 0 ? "T1" : "T2")),
      ],
      pose: "+z",
    },
    {
      title: "Stand it up and fix it to the wall",
      detail: "Stand it upright where it will go and tighten every bolt and screw. Fit a wall strap (I) round the back post at the top of each end frame, mark through it, drill, push in a plug (H) and screw the strap to the wall (G). Check the wall for pipes and cables first.",
      // the strap loops round the back post; the screw goes through its free end, just inside the post, into the wall
      fix: [-1, 1].flatMap((sx) => [
        fx(STRAP_I, [[sx * xE, FH - 40, -D / 2]], [0, 0, -1], sx < 0 ? "FL" : "FR"),
        fx(PLUG_H, [[sx * (xE - 28), FH - 40, -D / 2 - 30]], [0, 0, -1]),
        fx(WALL_G, [[sx * (xE - 28), FH - 40, -D / 2 + 2]], [0, 0, -1]),
      ]),
      tools: ["allen", "drill", "screwdriver", "pencil"],
      pose: "+y",
      wall: true,
      check: "square",
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-blake-3-tier-long-bookshelf") return longBookshelf(s);
  return null;
}

const family: Family = { names: ["KMART:BLAKE"], recipe };
export default family;
