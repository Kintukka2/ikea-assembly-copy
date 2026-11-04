import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's Wave Book Storage (43746880), read from its assembly manual. Two tall sides (1, 2) arched at the top front
 * hold a book rack over two open cubbies, with a drawer on castors under each cubby's shelf.
 *
 * - The book rack: its bottom (7) carries a back board (6) and two wave-topped boards (5, 4) standing on it, each on
 *   dowels with two screws up through the bottom, and a low wave board (3) across its front edge on cam bolts.
 * - The cubbies: a divider (8) under the rack from the floor up, a shelf each side of it (12 on dowels and screws,
 *   11 on cam bolts) at drawer height, and a lip (10) along the front of each shelf. Below the shelves the divider
 *   carries on to the floor between the drawers.
 * - Lying on its back, the rack and the cubbies are joined and side 2 goes on. Lying on side 2, the back rail (13)
 *   goes on, the hardboard back (9) slides down its grooves, and side 1 goes on top. Four pads go under the sides.
 * - Each drawer: sides (15, 16) screwed to the back (17), two battens (19) screwed through the back along the
 *   bottom, the bottom (18) slid into its grooves, the front (14) cam-locked onto the sides and battens, and four
 *   castors screwed under the battens, the two with brakes at the back.
 * - Two straps tie the back board to the wall, then the drawers roll in.
 *
 * Kmart's hardware list, every count used by the steps: 38 cam bolts (a), 38 cam locks (b), 44 dowels 6 x 30 (c),
 * 3 dowels 6 x 50 (d), 20 screws 4 x 35 (e), 4 castors with brakes (g), 4 castors (h), 34 screws 4 x 12 (i),
 * 4 washers (j), 2 wall straps (k), 2 wall screws 4 x 30 (l), 2 wall plugs (m) and 4 floor pads (n).
 * Part numbers are Kmart's own (1 to 19), so the guide reads against the paper.
 *
 * Readings chosen: the manual's drawer steps (25 to 30) say "x 2" and their count boxes give the total for both
 * drawers (step 30's 32 screws are 16 a drawer, four for each castor), so each guide step builds both drawers.
 * The manual has no step for standing the unit up; the guide does it at step 25, where the drawers begin.
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

const CAM_BOLT_A: Def = { kind: "camScrew", len: 35, dia: 6 };
const CAM_B: Def = { kind: "cam", len: 12, dia: 15 };
const DOWEL_C: Def = { kind: "dowel", len: 30, dia: 6 };
const DOWEL_D: Def = { kind: "dowel", len: 50, dia: 6 };
const SCREW_E: Def = { kind: "screw", len: 35, dia: 4 };
const CASTOR_G: Def = { kind: "castor", len: 40, dia: 40, name: "Castor with brake" };
const CASTOR_H: Def = { kind: "castor", len: 40, dia: 40 };
const SCREW_I: Def = { kind: "screw", len: 12, dia: 4, name: "Small screw" };
const WASHER_J: Def = { kind: "washer", len: 1.5, dia: 12 };
const STRAP_K: Def = { kind: "strap", len: 90, dia: 20, name: "Wall strap" };
const WALL_SCREW_L: Def = { kind: "screw", len: 30, dia: 4, name: "Wall screw", included: true };
const PLUG_M: Def = { kind: "plug", len: 30, dia: 6, included: true };
const PAD_N: Def = { kind: "glide", len: 2, dia: 25, name: "Floor pad" };

const T = 15; // every board
const BK = 3; // the hardboard back and the drawer bottoms

/** A board standing in the x-y plane, cut to an outline of [x, y] points (mm from its middle), `t` thick. */
const upright = (outline: [number, number][], t: number, w: number, h: number): PartPiece => ({ shape: "slab", outline, size: [w, t, h], pos: [0, 0, 0], rot: [-Math.PI / 2, 0, 0] });

/** A board with a wavy top edge: straight along the bottom, `waves` crests across, troughs `amp` below the crests. */
function waveBoard(len: number, h: number, waves: number, amp: number): PartPiece {
  const n = 48;
  const top = Array.from({ length: n + 1 }, (_, i): [number, number] => {
    const x = -len / 2 + (len * i) / n;
    const y = h / 2 - (amp / 2) * (1 - Math.cos((2 * Math.PI * waves * i) / n));
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
  });
  return upright([[-len / 2, -h / 2], [len / 2, -h / 2], ...top.reverse()], T, len, h);
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug !== "kmart-wave-book-storage") return null;
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xs = W / 2 - T / 2, xi = W / 2 - T; // the sides' middles and inside faces
  const L = 2 * xi; // everything between the sides
  const zB = -D / 2, zF = D / 2;
  const yArc = 600; // where the front edge of a side starts to curve back over the top

  // a side: straight at the back, bottom and front, then a quarter ellipse from the front over to the back top
  const arc = Array.from({ length: 13 }, (_, i): [number, number] => {
    const t = (Math.PI / 2) * (1 - i / 12);
    return [yArc + (H - yArc) * Math.cos(t) - H / 2, zB + D * Math.sin(t)];
  });
  const sideOutline: [number, number][] = [[-H / 2, zB], [-H / 2, zF], ...arc];
  const side: PartPiece[] = [{ shape: "slab", outline: sideOutline, size: [H, T, D], pos: [0, 0, 0], rot: [0, 0, Math.PI / 2] }];

  // the book rack
  const y7 = 555; // underside of the rack's bottom
  const yr = y7 + T; // its top, where the boards stand
  const z7 = [zB, zF - T] as const; // the bottom reaches from the back to behind the front wave board
  const rack = {
    P6: { y0: yr, y1: H - 15, z: zB + T / 2 },
    P5: { y0: yr, y1: 745, z: -60 },
    P4: { y0: yr, y1: 690, z: 30 },
    P3: { y0: y7, y1: 625, z: zF - T / 2 },
  };
  const box = (k: keyof typeof rack) => ({ h: rack[k].y1 - rack[k].y0, y: (rack[k].y0 + rack[k].y1) / 2, z: rack[k].z });

  // the cubbies
  const ys = 205; // underside of the shelves
  const LIP = 50; // the lips and the back rail
  const zD = zB + T; // the divider and the shelves stop at the back rail
  const shelfW = xi - T / 2; // a shelf, from the side to the divider
  const cx = (sx: number) => sx * (T / 2 + shelfW / 2); // middle of a cubby
  const zK = zB + 8 + BK / 2; // the hardboard back, in grooves 8 mm in

  const parts: CustomPart[] = [
    { id: "S1", label: "1", name: "Left side", size: [T, H, D], pos: [-xs, H / 2, 0], material: "board", pieces: side },
    { id: "S2", label: "2", name: "Right side", size: [T, H, D], pos: [xs, H / 2, 0], material: "board", pieces: side },
    { id: "P7", label: "7", name: "Rack bottom", size: [L, T, z7[1] - z7[0]], pos: [0, y7 + T / 2, (z7[0] + z7[1]) / 2], material: "board" },
    { id: "P6", label: "6", name: "Back board", size: [L, box("P6").h, T], pos: [0, box("P6").y, box("P6").z], material: "board" },
    { id: "P5", label: "5", name: "Back wave board", size: [L, box("P5").h, T], pos: [0, box("P5").y, box("P5").z], material: "board", pieces: [waveBoard(L, box("P5").h, 3.5, 25)] },
    { id: "P4", label: "4", name: "Middle wave board", size: [L, box("P4").h, T], pos: [0, box("P4").y, box("P4").z], material: "board", pieces: [waveBoard(L, box("P4").h, 3.5, 25)] },
    { id: "P3", label: "3", name: "Front wave board", size: [L, box("P3").h, T], pos: [0, box("P3").y, box("P3").z], material: "board", pieces: [waveBoard(L, box("P3").h, 3.5, 25)] },
    { id: "P8", label: "8", name: "Divider", size: [T, y7, zF - zD], pos: [0, y7 / 2, (zF + zD) / 2], material: "board" },
    { id: "P11", label: "11", name: "Left shelf", size: [shelfW, T, zF - T - zD], pos: [cx(-1), ys + T / 2, (zF - T + zD) / 2], material: "board" },
    { id: "P12", label: "12", name: "Right shelf", size: [shelfW, T, zF - T - zD], pos: [cx(1), ys + T / 2, (zF - T + zD) / 2], material: "board" },
    ...SX.map((sx): CustomPart => ({ id: `P10${sx < 0 ? "L" : "R"}`, label: "10", name: "Shelf lip", size: [shelfW, LIP, T], pos: [cx(sx), ys + LIP / 2, zF - T / 2], material: "board" })),
    { id: "P13", label: "13", name: "Back rail", size: [L, LIP, T], pos: [0, ys + LIP / 2, zB + T / 2], material: "board" },
    { id: "P9", label: "9", name: "Back panel", size: [L + 10, y7 + 8 - (ys + LIP - 8), BK], pos: [0, (y7 + 8 + ys + LIP - 8) / 2, zK], material: "fiber" },
  ];

  // the drawers, one in each cubby
  const DW = 380, CH = 40, FH = 155, SH = 140; // front width, castors, front and side heights
  const zf0 = zF - T, zk1 = -120 + T; // the front's back face, the drawer back's front face
  const dz0 = -120; // back of the drawer
  const BW = 50; // a batten
  const notch: [number, number][] = (() => {
    // the front, with a round finger pull cut down from the middle of its top edge
    const r = 45, pts: [number, number][] = [[-DW / 2, -FH / 2], [DW / 2, -FH / 2], [DW / 2, FH / 2], [r, FH / 2]];
    for (let i = 1; i < 12; i++) {
      const a = (Math.PI * i) / 12;
      pts.push([Math.round(r * Math.cos(a) * 10) / 10, Math.round((FH / 2 - r * 0.55 * Math.sin(a)) * 10) / 10]);
    }
    pts.push([-r, FH / 2], [-DW / 2, FH / 2]);
    return pts;
  })();
  const drawers = SX.map((sx) => {
    const k = sx < 0 ? "L" : "R";
    const c = cx(sx);
    return { sx, k, c, f: `F14${k}`, l: `S15${k}`, r: `S16${k}`, b: `B17${k}`, bt: `D18${k}`, bl: `T19${k}l`, br: `T19${k}r` };
  });
  type Dr = (typeof drawers)[number];
  for (const d of drawers) {
    parts.push(
      { id: d.f, label: "14", name: "Drawer front", size: [DW, FH, T], pos: [d.c, CH + FH / 2, zF - T / 2], material: "board", pieces: [upright(notch, T, DW, FH)] },
      { id: d.l, label: "15", name: "Left drawer side", size: [T, SH, zf0 - dz0], pos: [d.c - DW / 2 + T / 2, CH + SH / 2, (zf0 + dz0) / 2], material: "board" },
      { id: d.r, label: "16", name: "Right drawer side", size: [T, SH, zf0 - dz0], pos: [d.c + DW / 2 - T / 2, CH + SH / 2, (zf0 + dz0) / 2], material: "board" },
      { id: d.b, label: "17", name: "Drawer back", size: [DW - 2 * T, SH, T], pos: [d.c, CH + SH / 2, dz0 + T / 2], material: "board" },
      { id: d.bl, label: "19", name: "Castor batten", size: [BW, T, zf0 - zk1], pos: [d.c - DW / 2 + T + BW / 2, CH + T / 2, (zf0 + zk1) / 2], material: "board" },
      { id: d.br, label: "19", name: "Castor batten", size: [BW, T, zf0 - zk1], pos: [d.c + DW / 2 - T - BW / 2, CH + T / 2, (zf0 + zk1) / 2], material: "board" },
      { id: d.bt, label: "18", name: "Drawer bottom", size: [DW - 2 * T + 10, BK, zf0 - zk1 + 10], pos: [d.c, CH + T + BK / 2, (zf0 + zk1) / 2], material: "fiber" },
    );
  }
  const drawerIds = (d: Dr) => [d.f, d.l, d.r, d.b, d.bl, d.br, d.bt];
  const allDrawers = drawers.flatMap(drawerIds);

  // where the boards meet a side: dowels and cam bolts, as [y, z] points on the side's inside face
  const yc = (k: keyof typeof rack) => box(k);
  const shelfZ = (z: number) => (zF - T + zD) / 2 + z; // from the middle of a shelf, front to back
  const ends = {
    P6: { dowels: [600, 750].map((y): [number, number] => [y, yc("P6").z]), bolts: [650, 715].map((y): [number, number] => [y, yc("P6").z]) },
    P5: { dowels: [610, 700].map((y): [number, number] => [y, yc("P5").z]), bolts: [] as [number, number][] },
    P4: { dowels: [600, 655].map((y): [number, number] => [y, yc("P4").z]), bolts: [] as [number, number][] },
    P3: { dowels: [566, 592].map((y): [number, number] => [y, yc("P3").z]), bolts: [] as [number, number][] },
    P7: { dowels: [-110, 100].map((z): [number, number] => [y7 + T / 2, z]), bolts: [-40, 40].map((z): [number, number] => [y7 + T / 2, z]) },
    shelf: { dowels: [-90, 90].map((z): [number, number] => [ys + T / 2, z]), bolts: [-30, 30].map((z): [number, number] => [ys + T / 2, z]) },
    P13: { bolts: [ys + 13, ys + LIP - 13].map((y): [number, number] => [y, zB + T / 2]) },
  };
  const sideOf = (sx: number) => (sx < 0 ? "S1" : "S2");
  const at = (sx: number, pts: [number, number][], inset = 0): Vec3[] => pts.map(([y, z]): Vec3 => [sx * (xi - inset), y, z]);
  // dowels in a board's end, going into the side
  const endDowels = (id: string, pts: [number, number][]) => SX.map((sx) => fx(DOWEL_C, at(sx, pts), [-sx, 0, 0], id, sideOf(sx)));
  // a board's dowels standing on the rack bottom, and the screws up through it
  const footX = [-250, 0, 250];
  const footDowels = (id: keyof typeof rack) => fx(DOWEL_C, footX.map((x): Vec3 => [x, yr, rack[id].z]), [0, 1, 0], id, "P7");
  const footScrews = (id: keyof typeof rack) => fx(SCREW_E, [-150, 150].map((x): Vec3 => [x, y7, rack[id].z]), [0, 1, 0], "P7", id);
  // cam bolts in a side's inside face, for the board that meets it there
  const sideBolts = (sx: number): CustomFix[] => [
    fx(CAM_BOLT_A, at(sx, ends.P7.bolts), [sx, 0, 0], sideOf(sx), "P7"),
    fx(CAM_BOLT_A, at(sx, ends.shelf.bolts.map(([y, z]) => [y, shelfZ(z)])), [sx, 0, 0], sideOf(sx), sx < 0 ? "P11" : "P12"),
    fx(CAM_BOLT_A, at(sx, ends.P6.bolts), [sx, 0, 0], sideOf(sx), "P6"),
    fx(CAM_BOLT_A, at(sx, ends.P13.bolts), [sx, 0, 0], sideOf(sx), "P13"),
  ];
  // cams in each board, near its ends, for a side's cam bolts
  const sideCams = (sx: number): CustomFix[] => [
    fx(CAM_B, ends.P7.bolts.map(([, z]): Vec3 => [sx * (xi - 25), y7, z]), [0, 1, 0], "P7"),
    fx(CAM_B, ends.shelf.bolts.map(([, z]): Vec3 => [sx * (xi - 25), ys + T, shelfZ(z)]), [0, -1, 0], sx < 0 ? "P11" : "P12"),
    fx(CAM_B, ends.P6.bolts.map(([y]): Vec3 => [sx * (xi - 25), y, zB + T]), [0, 0, -1], "P6"),
    fx(CAM_B, ends.P13.bolts.map(([y]): Vec3 => [sx * (xi - 25), y, zB + T]), [0, 0, -1], "P13"),
  ];
  const shelfIds = ["P8", "P11", "P12", "P10L", "P10R"];
  const right: Vec3 = [700, 0, 0]; // the rack waits to the right of the build
  const left: Vec3 = [-700, 0, 0]; // the cubbies to the left
  const offs = (ids: string[], v: Vec3) => Object.fromEntries(ids.map((id) => [id, v] as [string, Vec3]));
  const lip = (sx: number) => `P10${sx < 0 ? "L" : "R"}`;
  const shelf = (sx: number) => (sx < 0 ? "P11" : "P12");
  const lipBolts = (sx: number) => [cx(sx) - 100, cx(sx) + 100];
  const lipDowels = (sx: number) => [cx(sx) - 150, cx(sx) + 150];
  const yS = ys + T / 2;
  // the divider's joints with the two shelves, on its faces
  const divA = [-70, 70].map(shelfZ), divC = [-115, 115].map(shelfZ), divE = [-25, 25].map(shelfZ), divD = [-95, 0, 95].map(shelfZ);
  const rackBolts = [-95, 95]; // the rack bottom's cam bolts for the divider
  const frontBolts = [-170, 170], frontDowels = [-300, 0, 300]; // the front wave board on the rack bottom's front edge

  const lie = "+z" as const; // on its back
  const onSide2 = "-x" as const;
  const steps: CustomStep[] = [
    {
      title: "Push dowels into the back board",
      detail: "Seven dowels (c) into back board 6: two into each end and three along its bottom edge.",
      fix: [...endDowels("P6", ends.P6.dowels), footDowels("P6")],
      wait: ["P6"],
      from: { P6: right },
      pose: lie,
    },
    {
      title: "Fit cam bolts and dowels to the rack bottom",
      detail: "Screw two cam bolts (a) into the underside of rack bottom 7, by hand until only the neck shows, then seven dowels (c): two into each end and three along its front edge.",
      fix: [
        fx(CAM_BOLT_A, rackBolts.map((z): Vec3 => [0, y7, z]), [0, 1, 0], "P7", "P8"),
        ...endDowels("P7", ends.P7.dowels),
        fx(DOWEL_C, frontDowels.map((x): Vec3 => [x, y7 + T / 2, z7[1]]), [0, 0, -1], "P7", "P3"),
      ],
      wait: ["P7"],
      from: { P7: right },
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Screw the back board onto the rack bottom",
      detail: "Stand the back board's dowels in the holes along the back of the rack bottom and drive two screws (e) up through the bottom into it.",
      add: ["P7", "P6"],
      fix: [footScrews("P6")],
      from: offs(["P7", "P6"], right),
      pose: lie,
      tools: ["screwdriver"],
      warnings: ["loose"],
    },
    { title: "Push dowels into wave board 5", detail: "Seven dowels (c): two into each end and three along its straight edge.", fix: [...endDowels("P5", ends.P5.dowels), footDowels("P5")], wait: ["P5"], from: { P5: right }, pose: lie },
    {
      title: "Screw wave board 5 onto the rack bottom",
      detail: "In front of the back board, wavy edge up, with two screws (e) up through the bottom.",
      add: ["P5"],
      fix: [footScrews("P5")],
      from: { P5: right },
      pose: lie,
      tools: ["screwdriver"],
    },
    { title: "Push dowels into wave board 4", detail: "Seven dowels (c), as before.", fix: [...endDowels("P4", ends.P4.dowels), footDowels("P4")], wait: ["P4"], from: { P4: right }, pose: lie },
    {
      title: "Screw wave board 4 onto the rack bottom",
      detail: "In front of board 5, with two screws (e) up through the bottom.",
      add: ["P4"],
      fix: [footScrews("P4")],
      from: { P4: right },
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Fit cam bolts and dowels to wave board 3",
      detail: "Two cam bolts (a) into the back face of the low front board 3, near its straight edge, and two dowels (c) into each end.",
      fix: [fx(CAM_BOLT_A, frontBolts.map((x): Vec3 => [x, y7 + T / 2, z7[1]]), [0, 0, 1], "P3", "P7"), ...endDowels("P3", ends.P3.dowels)],
      wait: ["P3"],
      from: { P3: right },
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Lock wave board 3 onto the front edge",
      detail: "Press it onto the dowels and cam bolts along the rack bottom's front edge, then drop two cams (b) into the bottom's underside, arrows to the edge, and turn them until they pull tight.",
      add: ["P3"],
      fix: [fx(CAM_B, frontBolts.map((x): Vec3 => [x, y7, z7[1] - 25]), [0, 1, 0], "P7")],
      from: { P3: right },
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Fit cam bolts into the shelf lips",
      detail: "Two cam bolts (a) into the back face of each lip 10.",
      fix: SX.map((sx) => fx(CAM_BOLT_A, lipBolts(sx).map((x): Vec3 => [x, yS, zF - T]), [0, 0, 1], lip(sx), shelf(sx))),
      wait: ["P10L", "P10R"],
      from: offs(["P10L", "P10R"], left),
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Push dowels into shelf 12",
      detail: "Two dowels (c) into its outer end and two into its front edge.",
      fix: [fx(DOWEL_C, at(1, ends.shelf.dowels.map(([y, z]) => [y, shelfZ(z)])), [-1, 0, 0], "P12", "S2"), fx(DOWEL_C, lipDowels(1).map((x): Vec3 => [x, yS, zF - T]), [0, 0, -1], "P12", "P10R")],
      wait: ["P12"],
      from: { P12: left },
      pose: lie,
    },
    {
      title: "Lock a lip onto shelf 12",
      detail: "Press a lip onto the front edge of shelf 12 and lock it with two cams (b) in the shelf. Push one dowel (c) into the lip's outer end.",
      fix: [fx(CAM_B, lipBolts(1).map((x): Vec3 => [x, ys + T, zF - T - 25]), [0, -1, 0], "P12"), fx(DOWEL_C, [[xi, ys + LIP - 15, zF - T / 2]], [-1, 0, 0], "P10R", "S2")],
      wait: ["P12", "P10R"],
      from: offs(["P12", "P10R"], left),
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Fit cam bolts and dowels to the divider",
      detail: "On divider 8's left face, at shelf height: two cam bolts (a) and two dowels (c).",
      fix: [fx(CAM_BOLT_A, divA.map((z): Vec3 => [-T / 2, yS, z]), [1, 0, 0], "P8", "P11"), fx(DOWEL_C, divC.map((z): Vec3 => [-T / 2, yS, z]), [1, 0, 0], "P8", "P11")],
      wait: ["P8"],
      from: { P8: left },
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Join shelf 12 to the divider",
      detail: "Three long dowels (d) into the divider's right face, then press shelf 12's inner end onto them and drive two screws (e) through the divider into it.",
      fix: [fx(DOWEL_D, divD.map((z): Vec3 => [T / 2, yS, z]), [-1, 0, 0], "P8", "P12"), fx(SCREW_E, divE.map((z): Vec3 => [-T / 2, yS, z]), [1, 0, 0], "P8", "P12")],
      wait: ["P8", "P12", "P10R"],
      from: offs(["P8", "P12", "P10R"], left),
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Push dowels into shelf 11",
      detail: "Two dowels (c) into its outer end and two into its front edge.",
      fix: [fx(DOWEL_C, at(-1, ends.shelf.dowels.map(([y, z]) => [y, shelfZ(z)])), [1, 0, 0], "P11", "S1"), fx(DOWEL_C, lipDowels(-1).map((x): Vec3 => [x, yS, zF - T]), [0, 0, -1], "P11", "P10L")],
      wait: ["P11"],
      from: { P11: left },
      pose: lie,
    },
    {
      title: "Lock the other lip onto shelf 11",
      detail: "Two cams (b) in the shelf, and one dowel (c) into the lip's outer end.",
      fix: [fx(CAM_B, lipBolts(-1).map((x): Vec3 => [x, ys + T, zF - T - 25]), [0, -1, 0], "P11"), fx(DOWEL_C, [[-xi, ys + LIP - 15, zF - T / 2]], [1, 0, 0], "P10L", "S1")],
      wait: ["P11", "P10L"],
      from: offs(["P11", "P10L"], left),
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Lock shelf 11 to the divider",
      detail: "Press shelf 11 onto the cam bolts and dowels in the divider's left face and turn its two cams (b).",
      fix: [fx(CAM_B, divA.map((z): Vec3 => [-T / 2 - 25, ys + T, z]), [0, -1, 0], "P11")],
      wait: shelfIds,
      from: offs(shelfIds, left),
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Join the cubbies to the book rack",
      detail: "Fit the top edge of the divider onto the two cam bolts under the rack bottom and lock them with two cams (b) in the divider.",
      add: shelfIds,
      fix: [fx(CAM_B, rackBolts.map((z): Vec3 => [T / 2, y7 - 25, z]), [-1, 0, 0], "P8")],
      from: offs(shelfIds, left),
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Screw the cam bolts into side 2",
      detail: "Eight cam bolts (a) into the inside face of side 2: two each for the rack bottom, the shelf, the back board and the back rail.",
      fix: sideBolts(1),
      wait: ["S2"],
      from: { S2: right },
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Fix side 2 on",
      detail: "Fit side 2 onto all the dowels and cam bolts at the right-hand end, then lock four cams (b): two in the rack bottom and two in shelf 12.",
      add: ["S2"],
      fix: sideCams(1).slice(0, 2),
      from: { S2: right },
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Fit the back rail and slide in the back",
      detail: "Lay it on side 2. Fit back rail 13 onto its cam bolts behind the shelves, slide the hardboard back 9 down the grooves until it sits in the rail, then lock four cams (b): two in the back board, two in the rail.",
      add: ["P13", "P9"],
      fix: sideCams(1).slice(2),
      from: { P13: [0, 0, -300], P9: [-700, 0, 0] },
      pose: onSide2,
      tools: ["screwdriver"],
    },
    {
      title: "Screw the cam bolts into side 1",
      detail: "Eight cam bolts (a) into side 1's inside face, the same as side 2.",
      fix: sideBolts(-1),
      wait: ["S1"],
      from: { S1: [0, 0, 600] },
      pose: onSide2,
      tools: ["screwdriver"],
    },
    {
      title: "Fix side 1 on top",
      detail: "Lower side 1 onto all the dowels and cam bolts at once and lock its eight cams (b): in the back board, the rack bottom, the back rail and shelf 11.",
      add: ["S1"],
      fix: sideCams(-1),
      from: { S1: [-500, 0, 0] },
      pose: onSide2,
      tools: ["screwdriver"],
    },
    {
      title: "Stick on the floor pads",
      detail: "One pad (n) at the front and one at the back of the bottom edge of each side.",
      fix: SX.map((sx) => fx(PAD_N, [zB + 25, zF - 25].map((z): Vec3 => [sx * xs, 0, z]), [0, 1, 0], sideOf(sx))),
      pose: onSide2,
    },
    {
      title: "Screw the drawer sides to the backs",
      detail: "Stand the unit up. For each of the two drawers, two screws (e) through each side (15, 16) into the ends of the back (17).",
      fix: drawers.flatMap((d) => [
        fx(SCREW_E, [CH + 40, CH + SH - 40].map((y): Vec3 => [d.c - DW / 2, y, dz0 + T / 2]), [1, 0, 0], d.l, d.b),
        fx(SCREW_E, [CH + 40, CH + SH - 40].map((y): Vec3 => [d.c + DW / 2, y, dz0 + T / 2]), [-1, 0, 0], d.r, d.b),
      ]),
      wait: drawers.flatMap((d) => [d.l, d.r, d.b]),
      from: offs(allDrawers, [0, 0, 600]),
      pose: "+y",
      tools: ["screwdriver"],
    },
    {
      title: "Screw in the castor battens",
      detail: "A batten (19) along the bottom of each drawer side, one screw (e) through the back into the end of each.",
      fix: drawers.map((d) => fx(SCREW_E, [d.bl, d.br].map((id): Vec3 => [id === d.bl ? d.c - DW / 2 + T + BW / 2 : d.c + DW / 2 - T - BW / 2, CH + T / 2, dz0]), [0, 0, 1], d.b)),
      wait: drawers.flatMap((d) => [d.bl, d.br]),
      from: offs(allDrawers, [0, 0, 600]),
      tools: ["screwdriver"],
    },
    {
      title: "Slide in the drawer bottoms",
      detail: "From the open front, slide each bottom (18) along the grooves in the sides and back, over the battens.",
      wait: drawers.map((d) => d.bt),
      from: offs(allDrawers, [0, 0, 600]),
    },
    {
      title: "Screw the cam bolts into the drawer fronts",
      detail: "Six cam bolts (a) into the back face of each front (14): two for each side and one for each batten.",
      fix: drawers.flatMap((d) => [
        fx(CAM_BOLT_A, [CH + 40, CH + SH - 40].map((y): Vec3 => [d.c - DW / 2 + T / 2, y, zf0]), [0, 0, 1], d.f, d.l),
        fx(CAM_BOLT_A, [CH + 40, CH + SH - 40].map((y): Vec3 => [d.c + DW / 2 - T / 2, y, zf0]), [0, 0, 1], d.f, d.r),
        fx(CAM_BOLT_A, [[d.c - DW / 2 + T + BW / 2, CH + T / 2, zf0]], [0, 0, 1], d.f, d.bl),
        fx(CAM_BOLT_A, [[d.c + DW / 2 - T - BW / 2, CH + T / 2, zf0]], [0, 0, 1], d.f, d.br),
      ]),
      wait: drawers.map((d) => d.f),
      from: offs(allDrawers, [0, 0, 600]),
      tools: ["screwdriver"],
    },
    {
      title: "Lock the fronts on",
      detail: "Press each front onto its drawer and turn six cams (b): two in each side, one in each batten.",
      fix: drawers.flatMap((d) => [
        fx(CAM_B, [CH + 40, CH + SH - 40].map((y): Vec3 => [d.c - DW / 2 + T, y, zf0 - 25]), [-1, 0, 0], d.l),
        fx(CAM_B, [CH + 40, CH + SH - 40].map((y): Vec3 => [d.c + DW / 2 - T, y, zf0 - 25]), [1, 0, 0], d.r),
        fx(CAM_B, [[d.c - DW / 2 + T + BW, CH + T / 2, zf0 - 25]], [-1, 0, 0], d.bl),
        fx(CAM_B, [[d.c + DW / 2 - T - BW, CH + T / 2, zf0 - 25]], [1, 0, 0], d.br),
      ]),
      wait: allDrawers,
      from: offs(allDrawers, [0, 0, 600]),
      tools: ["screwdriver"],
    },
    {
      title: "Screw the castors under the drawers",
      detail: "Turn each drawer over. A castor with a brake (g) at the back of each batten and a plain one (h) at the front, four small screws (i) each.",
      fix: drawers.flatMap((d) => {
        const bx = [d.c - DW / 2 + T + BW / 2, d.c + DW / 2 - T - BW / 2];
        const zs = [zk1 + 45, zf0 - 70];
        const plate = (x: number, z: number): Vec3[] => [-1, 1].flatMap((a) => [-1, 1].map((b): Vec3 => [x + a * 16, CH, z + b * 16]));
        return bx.flatMap((x, i) => [
          fx(CASTOR_G, [[x, CH, zs[0]]], [0, 1, 0], i ? d.br : d.bl),
          fx(CASTOR_H, [[x, CH, zs[1]]], [0, 1, 0], i ? d.br : d.bl),
          fx(SCREW_I, zs.flatMap((z) => plate(x, z)), [0, 1, 0], i ? d.br : d.bl),
        ]);
      }),
      wait: allDrawers,
      from: offs(allDrawers, [0, 0, 600]),
      tools: ["screwdriver"],
    },
    {
      title: "Fix it to the wall",
      detail: "Screw a strap (k) to the back of the back board near each end, a small screw (i) and a washer (j) each. Push it against the wall, mark, drill, push in the plugs (m) and screw the straps on with the wall screws (l) and washers. Check the wall for pipes and cables first.",
      fix: [
        fx(STRAP_K, [-250, 250].map((x): Vec3 => [x, H - 60, zB]), [0, 0, 1], "P6"),
        fx(WASHER_J, [-250, 250].map((x): Vec3 => [x, H - 90, zB]), [0, 0, 1], "P6"),
        fx(SCREW_I, [-250, 250].map((x): Vec3 => [x, H - 90, zB - 1.5]), [0, 0, 1], "P6"),
        fx(PLUG_M, [-250, 250].map((x): Vec3 => [x, H - 20, zB - 30]), [0, 0, -1]),
        fx(WASHER_J, [-250, 250].map((x): Vec3 => [x, H - 20, zB - 1]), [0, 0, -1]),
        fx(WALL_SCREW_L, [-250, 250].map((x): Vec3 => [x, H - 20, zB - 2.5]), [0, 0, -1]),
      ],
      wait: allDrawers,
      from: offs(allDrawers, [0, 0, 600]),
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
    {
      title: "Roll the drawers in",
      detail: "Push a drawer into each space under the shelves.",
      add: allDrawers,
      from: offs(allDrawers, [0, 0, 600]),
      kind: "drawer",
    },
  ];
  return { parts, steps };
}

const family: Family = { names: ["KMART:WAVE"], recipe };
export default family;
