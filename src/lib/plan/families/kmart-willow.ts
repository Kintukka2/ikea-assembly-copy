import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, HwKind, PartMaterial, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's Willow range, read from its assembly manuals. All of it is 15 mm board held with cam bolts and cam locks,
 * wooden dowels and screws, with hardboard backs in grooves, and every drawer front and door has two raised strips a
 * third of the way in from each edge:
 *
 * - Bedside Table (keycode 43633708): a drawer case on a stand. The drawer is built first (front, sides, bottom, back,
 *   runners). The stand is a shelf with a rail screwed under its front and back edges, set between two ready-made leg
 *   frames, then a front rail and the shelf rails bolted through the frames with long Allen bolts. The sides take their
 *   runners and are screwed onto the case bottom, the case is dowelled, bolted and screwed onto the stand, the back
 *   slides down, the top goes on with cam bolts, corner blocks hold the back and one strap fixes it to the wall.
 *   Hardware: 8 cam bolts (A), 8 cam locks (B), 22 dowels 6 x 30 (C), 19 screws 4 x 12 (D), 23 screws 4 x 35 (E),
 *   4 bolts 7 x 70 (F), 4 felt pads (G), an Allen key (H), 4 corner blocks (I), a wall plug (J), a wall strap (K) and
 *   6 bolts 7 x 50 (L).
 * - 3 Drawer Chest (43633715): runners and cam bolts in both sides, then with it lying on its right side the four rails
 *   (a top front rail, two flat rails between the drawers and a back rail half way up) stand on the right side and the
 *   left side goes on top. The upper back slides down from the top end and the top goes on; four legs are bolted under
 *   the bottom, the lower back slides in from the bottom end and the bottom is screwed on. Three drawers, each with a
 *   support under its bottom. Hardware: 29 cam bolts (A), 29 cam locks (B), 14 dowels 6 x 30 (C), 52 screws 4 x 12 (D),
 *   26 screws 4 x 35 (E), 4 bolts 7 x 50 (F), 4 dowels 8 x 30 (G), an Allen key (H), 8 corner blocks (I), 2 wall plugs
 *   (J), 2 wall straps (K) and 4 felt pads (L).
 * - 2 Tier Shoe Cabinet (43705368): two sides joined by three back rails, the top on cam bolts and the bottom with four
 *   legs screwed under them. Each flip down door takes its two strips, a pair of flip fittings and a shoe tray, and
 *   pivots on bushes in the sides; a second tray panel goes in once it is hung. No back: the top back rail is screwed
 *   to the wall. Hardware: 18 cam bolts (A), 18 cam locks (B), 12 dowels 6 x 30 (C), 6 screws 4 x 35 (D), two pairs of
 *   flip fittings (E, F), 4 stop blocks (G), 4 pivot bushes (H), 4 pivot caps (I), 4 felt pads (J), 12 screws 4 x 18
 *   (K), 16 screws 3.5 x 14 (L), 2 wall plugs (M), an Allen key (N), 4 bolts 7 x 40 (O), 4 dowels 8 x 30 (P), 8 screws
 *   4 x 25 (Q), 8 dowels 6 x 15 (R), 2 wall screws 4 x 40 (S) and 8 screws 3 x 16 (T).
 * - 3 Door Sideboard (43635702): legs under the bottom first. With it lying on its back the fixed shelf joins the left
 *   side and the divider, the top front rail goes on, the upper left back slides down, then the right side and the top.
 *   The lower left back and the right back slide in from the bottom end and the bottom closes it. Stood up, the right
 *   bay takes a shelf on four supports, the three doors hang on cup hinges (the middle one on cranked hinges on the
 *   divider), twelve corner blocks hold the backs and two straps fix it to the wall. Hardware: 12 cam bolts (A), 12 cam
 *   locks (B), 18 dowels 6 x 30 (C), 50 screws 4 x 12 (D), 11 screws 4 x 35 (E), an adjustable foot (F), 5 bolts 7 x 50
 *   (G), 5 dowels 8 x 30 (H), 4 shelf supports (I), 4 hinges (J), 12 corner blocks (K), 2 wall plugs (L), 2 wall straps
 *   (M), 4 felt pads (N), an Allen key (O) and 2 cranked hinges (P).
 * - Entertainment Unit (43717156): the same build in three equal bays with one back behind both dividers: legs under
 *   the bottom, the top front rail between the sides, the top, then upside down the dividers and the back, and the
 *   bottom. A shelf in the middle bay, three doors as on the sideboard, four corner blocks and two straps. Hardware:
 *   10 cam bolts (A), 10 cam locks (B), 18 dowels (C), 42 screws 4 x 12 (D), 13 screws 4 x 35 (E), an adjustable foot
 *   (F), 5 bolts 7 x 50 (G), 5 dowels 8 x 30 (H), 4 shelf supports (I), 4 hinges (J), 4 corner blocks (K), 2 wall plugs
 *   (L), 2 wall straps (M), 4 felt pads (N), an Allen key (O) and 2 cranked hinges (P).
 *
 * Part numbers are Kmart's own and each step's detail gives the manual's hardware letters, so the guide reads against
 * the paper; the drawer runners are numbered parts in the manuals (16 to 19) and are fitted as runners here, their
 * numbers given in the steps.
 * Parts built away from the carcass (the drawers, the stand's shelf, the case, the legs under a bottom, the doors) wait
 * beside it until the step that joins them, and a top waits beside it for one step so its cam bolts go into it there.
 * Readings chosen where the drawings leave it open: the stand's rails and the frames' rails stand on edge, the wall
 * straps sit under the top at its back edge with their tab hanging down behind (the wall screw goes through the tab),
 * and the middle leg under the sideboard and the entertainment unit stands a little in from the front. Panel
 * thicknesses, leg heights and drawer heights are not printed in these manuals; they are read off the drawings.
 */

const T = 15; // every board
const BK = 3; // hardboard: backs and drawer bottoms
const FT = 15; // drawer fronts and doors
const RIB = 8; // the raised strips on the fronts and doors stand out this far
const RIBW = 24; // and are this wide
const FTT = FT + RIB;
const LG = 38; // the square legs under the chest, the sideboard and the entertainment unit

// fittings are named plainly (the voice counts them by name); each step's detail gives the manual's letters
type Def = { kind: HwKind; len: number; dia: number; name: string; included?: boolean };
const hw = (name: string, kind: HwKind, len: number, dia: number, included = false): Def => ({ kind, len, dia, name, ...(included ? { included } : {}) });
const CAM_BOLT = hw("Cam bolt", "camScrew", 35, 6);
const CAM_LOCK = hw("Cam lock", "cam", 9, 15);
const dowel = (dia = 6, len = 30) => hw("Dowel", "dowel", len, dia);
const screw = (len: number, dia = 4) => hw("Screw", "screw", len, dia);
const bolt = (len: number) => hw("Allen bolt", "bolt", len, 7);
const FELT = hw("Felt pad", "glide", 4, 30);
const BLOCK = hw("Corner block", "angle", 16, 20);
const STRAP = hw("Wall strap", "angle", 30, 20);
const PLUG = hw("Wall plug", "plug", 30, 6, true);
const runner = (len: number, name: string): Def => ({ kind: "runner", len, dia: 20, name });

/** Fittings at exact points: what, where, the way they go in, the part they sit in and the part their other end meets. */
const fx = (def: Def, at: Vec3[], dir: Vec3, on?: string, mate?: string, extra: Partial<CustomFix> = {}): CustomFix => ({
  ...def,
  count: at.length,
  at,
  dir,
  ...(on ? { on } : {}),
  ...(mate ? { mate } : {}),
  ...extra,
});

class Parts {
  list: CustomPart[] = [];
  add(id: string, label: string, name: string, size: Vec3, pos: Vec3, material: PartMaterial = "board", pieces?: PartPiece[]) {
    this.list.push({ id, label, name, size, pos, material, ...(pieces ? { pieces } : {}) });
    return id;
  }
}

/** A drawer front or a door: the board, and the two raised strips on its face a third of the way in from each edge. */
const ribbed = (w: number, h: number): PartPiece[] => [
  { shape: "box", size: [w, h, FT], pos: [0, 0, -RIB / 2] },
  ...[-1, 1].map((g): PartPiece => ({ shape: "box", size: [RIBW, h, RIB], pos: [(g * w) / 6, 0, FT / 2] })),
];

/** A panel with a notch cut out of one corner: drawn as the boxes that are left, given in the product's frame. */
function notched(boxes: { min: Vec3; max: Vec3 }[]): { size: Vec3; pos: Vec3; pieces: PartPiece[] } {
  const lo: Vec3 = [0, 1, 2].map((k) => Math.min(...boxes.map((b) => b.min[k]))) as Vec3;
  const hi: Vec3 = [0, 1, 2].map((k) => Math.max(...boxes.map((b) => b.max[k]))) as Vec3;
  const pos: Vec3 = [0, 1, 2].map((k) => (lo[k] + hi[k]) / 2) as Vec3;
  const size: Vec3 = [0, 1, 2].map((k) => hi[k] - lo[k]) as Vec3;
  const pieces: PartPiece[] = boxes.map((b) => ({
    shape: "box",
    size: [0, 1, 2].map((k) => b.max[k] - b.min[k]) as Vec3,
    pos: [0, 1, 2].map((k) => (b.min[k] + b.max[k]) / 2 - pos[k]) as Vec3,
  }));
  return { size, pos, pieces };
}

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const num = (n: number, cap = false) => {
  const w = WORDS[n] ?? String(n);
  return cap ? w[0].toUpperCase() + w.slice(1) : w;
};
const offset = (ids: string[], v: Vec3) => Object.fromEntries(ids.map((id) => [id, v] as [string, Vec3]));
const SX = [-1, 1] as const;
const CORNERS: [number, number][] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

/* ---------- drawers: the bedside table's one and the chest's three ---------- */

interface DrawerSet {
  N: { front: string; left: string; right: string; back: string; bottom: string; support?: string };
  xi: number; // the carcass sides' inside faces
  zf: number; // the boxes' fronts, behind the drawer fronts
  DD: number; // box depth
  RL: number; // runner length
  sh: number; // side height
  lift: number; // box underside above the floor of its opening
}
interface Drawer {
  y: number; // underside of the box
  front: string;
  sl: string;
  sr: string;
  back: string;
  bottom: string;
  support?: string;
}
const xsOf = (o: DrawerSet) => o.xi - 12.5 - T / 2; // drawer sides' centres, clear of the runners
const zrunOf = (o: DrawerSet) => o.zf - 5 - o.RL / 2; // a cabinet runner's centre
const zdrOf = (o: DrawerSet) => zrunOf(o) - 0.1 * o.RL; // a drawer runner's, a little behind it so the screws stay apart

function drawerParts(p: Parts, o: DrawerSet, tag: string, y0: number, h: number, D: number): Drawer {
  const { N, zf, DD, sh } = o;
  const xs = xsOf(o), zb = zf - DD, y = y0 + o.lift;
  const fw = 2 * o.xi - 3, fh = h - 3;
  const d: Drawer = {
    y,
    front: p.add(`F${tag}`, N.front, "Drawer front", [fw, fh, FTT], [0, y0 + h / 2, D / 2 - FTT / 2], "board", ribbed(fw, fh)),
    sl: p.add(`DL${tag}`, N.left, "Left drawer side", [T, sh, DD], [-xs, y + sh / 2, zf - DD / 2]),
    sr: p.add(`DR${tag}`, N.right, "Right drawer side", [T, sh, DD], [xs, y + sh / 2, zf - DD / 2]),
    back: p.add(`DB${tag}`, N.back, "Drawer back", [2 * xs - T, sh, T], [0, y + sh / 2, zb + T / 2]),
    // in grooves in the sides and the back, over the support when there is one
    bottom: p.add(`DT${tag}`, N.bottom, "Drawer bottom", [2 * xs - T + 16, BK, DD - T / 2 - 1], [0, N.support ? y + T + 1.5 : y + 12, (zf - 1 + zb + T / 2) / 2], "fiber"),
  };
  if (N.support) d.support = p.add(`DS${tag}`, N.support, "Drawer support", [60, T, DD - T], [0, y + T / 2, (zf + zb + T) / 2]);
  return d;
}
const drawerIds = (d: Drawer) => [d.front, d.sl, d.sr, d.bottom, d.back, ...(d.support ? [d.support] : [])];
const sideYs = (o: DrawerSet, d: Drawer) => [d.y + 35, d.y + o.sh - 35];

/** Cam bolts in the front for each side (and one for the support), cam locks in the sides. */
const drawerBolts = (o: DrawerSet, d: Drawer, A: Def): CustomFix[] => [
  ...SX.map((g) => fx(A, sideYs(o, d).map((y): Vec3 => [g * xsOf(o), y, o.zf]), [0, 0, 1], d.front, g < 0 ? d.sl : d.sr)),
  ...(d.support ? [fx(A, [[0, d.y + T / 2, o.zf]], [0, 0, 1], d.front, d.support)] : []),
];
const drawerLocks = (o: DrawerSet, d: Drawer, B: Def): CustomFix[] => SX.map((g) => fx(B, sideYs(o, d).map((y): Vec3 => [g * (xsOf(o) - T / 2), y, o.zf - 25]), [g, 0, 0], g < 0 ? d.sl : d.sr));
/** Two screws through each side into the back, and two through the back into the support. */
const drawerBackScrews = (o: DrawerSet, d: Drawer, E: Def): CustomFix[] => {
  const zb = o.zf - o.DD;
  return [
    ...SX.map((g) => fx(E, sideYs(o, d).map((y): Vec3 => [g * (xsOf(o) + T / 2), y, zb + T / 2]), [-g, 0, 0], g < 0 ? d.sl : d.sr, d.back)),
    ...(d.support ? [fx(E, [-15, 15].map((x): Vec3 => [x, d.y + T / 2, zb]), [0, 0, 1], d.back, d.support)] : []),
  ];
};
/** The drawer runners along the sides' bottom edges, three screws each, clear of the cabinet runners' screws. */
const drawerRunners = (o: DrawerSet, d: Drawer, D: Def, left: string, right: string): CustomFix[] =>
  SX.flatMap((g) => [
    fx(runner(o.RL, g < 0 ? left : right), [[g * xsOf(o), d.y, zdrOf(o)]], [0, 1, 0], g < 0 ? d.sl : d.sr),
    fx(D, [0.65, 0.4, -0.6].map((k): Vec3 => [g * (xsOf(o) + T / 2), d.y + 8, zrunOf(o) + (k * o.RL) / 2]), [-g, 0, 0], g < 0 ? d.sl : d.sr),
  ]);
/** The cabinet runners on one carcass side, one for each drawer, four screws each. */
const cabinetRunners = (o: DrawerSet, g: number, on: string, list: Drawer[], name: string, D: Def): CustomFix[] => [
  fx(runner(o.RL, name), list.map((d): Vec3 => [g * o.xi, d.y - 6, zrunOf(o)]), [g, 0, 0], on),
  fx(D, list.flatMap((d) => [0.85, 0.25, -0.35, -0.85].map((k): Vec3 => [g * o.xi, d.y - 6, zrunOf(o) + (k * o.RL) / 2])), [g, 0, 0], on),
];

/* ---------- the bedside table ---------- */

function bedside(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const H_ = {
    A: CAM_BOLT,
    B: CAM_LOCK,
    C: dowel(),
    D: screw(12),
    E: screw(35),
    F: bolt(70),
    G: FELT,
    I: BLOCK,
    J: PLUG,
    K: STRAP,
    L: bolt(50),
  };
  const HS = 300; // the stand: its legs, the frames' top rails and the front rail all end here
  const LB = 36; // its legs, square
  const FR = 18; // the frames' rails and the front rail, on edge
  const RH = 40; // and their height
  const ySh = 120; // top of the shelf
  const hk = W / 2 - LB / 2, zl = D / 2 - LB / 2; // leg centres
  const y0 = HS + T, y1 = H - T; // inside the drawer case
  const xi = W / 2 - T;
  const zk = -D / 2 + 18; // the back's outside face, in grooves 18 mm in from the back edge
  const zR8 = D / 2 - LB - FR / 2; // the front rail, behind the front legs between the frames' top rails
  const yR15 = ySh - T - 18; // the shelf rails' centre, under the shelf in line with the legs

  const p = new Parts();
  p.add("T1", "1", "Top", [W, T, D], [0, H - T / 2, 0]);
  p.add("P2", "2", "Case bottom", [W, T, D], [0, HS + T / 2, 0]);
  p.add("S3", "3", "Left side", [T, y1 - y0, D], [-(W / 2 - T / 2), (y0 + y1) / 2, 0]);
  p.add("S4", "4", "Right side", [T, y1 - y0, D], [W / 2 - T / 2, (y0 + y1) / 2, 0]);
  p.add("K5", "5", "Back panel", [2 * xi + 16, y1 - y0 + 8, BK], [0, (y0 - 8 + y1) / 2, zk + BK / 2], "fiber");
  // a leg frame: two legs with a top rail and a lower rail between them, flush with the legs' outside faces
  const frame = (g: number): PartPiece[] => [
    ...SX.map((sz): PartPiece => ({ shape: "box", size: [LB, HS, LB], pos: [0, 0, sz * zl] })),
    { shape: "box", size: [FR, RH, D - 2 * LB], pos: [(g * (LB - FR)) / 2, HS / 2 - RH / 2, 0] },
    { shape: "box", size: [FR, RH, D - 2 * LB], pos: [(g * (LB - FR)) / 2, ySh - RH / 2 - HS / 2, 0] },
  ];
  SX.forEach((g) => p.add(g < 0 ? "F6" : "F7", g < 0 ? "6" : "7", g < 0 ? "Left leg frame" : "Right leg frame", [LB, HS, D], [g * hk, HS / 2, 0], "board", frame(g)));
  p.add("R8", "8", "Front rail", [W - 2 * FR, RH, FR], [0, HS - RH / 2, zR8]);
  // the shelf runs between the frames' lower rails, notched round the four legs
  const xa = W / 2 - FR, xb = W / 2 - LB, za = D / 2 - 9, zb = D / 2 - LB;
  const outline: [number, number][] = [
    [-xb, za],
    [xb, za],
    [xb, zb],
    [xa, zb],
    [xa, -zb],
    [xb, -zb],
    [xb, -za],
    [-xb, -za],
    [-xb, -zb],
    [-xa, -zb],
    [-xa, zb],
    [-xb, zb],
  ];
  p.add("S9", "9", "Shelf", [2 * xa, T, 2 * za], [0, ySh - T / 2, 0], "board", [{ shape: "slab", outline, size: [2 * xa, T, 2 * za], pos: [0, 0, 0] }]);
  p.add("R15f", "15", "Shelf rail", [W - 2 * LB, 36, FR], [0, yR15, zl]);
  p.add("R15b", "15", "Shelf rail", [W - 2 * LB, 36, FR], [0, yR15, -zl]);
  const zf = D / 2 - FTT;
  const DD = Math.floor((zf - (zk + BK) - 10) / 10) * 10;
  const o: DrawerSet = { N: { front: "10", left: "11", right: "12", back: "13", bottom: "14" }, xi, zf, DD, RL: Math.floor((DD - 30) / 50) * 50, sh: Math.min(150, y1 - y0 - 70), lift: 22 };
  const dr = drawerParts(p, o, "0", y0, y1 - y0, D);
  const dIds = drawerIds(dr);

  const steps: CustomStep[] = [];
  const dOff: Vec3 = [0, 0, 420]; // the drawer waits in front, the shelf to the left, the case and the top to the right
  const shelfIds = ["S9", "R15f", "R15b"];
  const caseIds = ["P2", "S3", "S4"];
  const rightOff: Vec3 = [(W + 200) / 1.6, 0, 0];
  const lie = "+z" as const; // on its back

  steps.push({
    title: "Build the drawer",
    detail: "Lay the front (10) face down on a rug and turn in its four cam bolts (A). Press the sides (11 on the left, 12 on the right) onto them and lock the four cam locks (B), slide the bottom (14) down the grooves, put the back (13) on and drive two long screws (E) through each side into it. Turn it over and screw a runner along each side's bottom edge, 19 on the left and 17 on the right, three small screws (D) each.",
    fix: [...drawerBolts(o, dr, H_.A), ...drawerLocks(o, dr, H_.B), ...drawerBackScrews(o, dr, H_.E), ...drawerRunners(o, dr, H_.D, "Drawer runner, left", "Drawer runner, right")],
    wait: dIds,
    from: offset(dIds, dOff),
    tools: ["screwdriver"],
    kind: "drawer",
    warnings: ["floor"],
  });
  steps.push({
    title: "Screw the rails under the shelf",
    detail: "Lay the shelf (9) upside down. Two dowels (C) in each rail (15), set one along the front edge and one along the back, and drive two long screws (E) through each rail into the shelf.",
    fix: [
      ...["R15f", "R15b"].map((id, i) => fx(H_.C, [-1, 1].map((g): Vec3 => [g * xb * 0.55, ySh - T, (i ? -1 : 1) * zl]), [0, -1, 0], id, "S9")),
      ...["R15f", "R15b"].map((id, i) => fx(H_.E, [-1, 1].map((g): Vec3 => [g * xb * 0.8, yR15 - 18, (i ? -1 : 1) * zl]), [0, 1, 0], id, "S9")),
    ],
    wait: shelfIds,
    from: offset(shelfIds, [-(W + 200) / 1.6, 0, 0]),
    tools: ["screwdriver"],
  });
  const shelfEndZ = [-(zb - 30), zb - 30], shelfScrewZ = [-30, 30];
  steps.push({
    title: "Set the shelf between the leg frames",
    detail: "Lay the frames on their back edges either side of it, the left one (6) and the right one (7). Two dowels (C) in each end of the shelf, push the frames onto them and drive two long screws (E) through each frame's lower rail into the shelf.",
    add: [...shelfIds, "F6", "F7"],
    fix: [
      ...SX.map((g) => fx(H_.C, shelfEndZ.map((z): Vec3 => [g * xa, ySh - T / 2, z]), [-g, 0, 0], "S9", g < 0 ? "F6" : "F7")),
      ...SX.map((g) => fx(H_.E, shelfScrewZ.map((z): Vec3 => [g * (W / 2), ySh - T / 2, z]), [-g, 0, 0], g < 0 ? "F6" : "F7", "S9")),
    ],
    from: { F6: [-300, 0, 0], F7: [300, 0, 0] },
    pose: lie,
    tools: ["screwdriver"],
    warnings: ["floor"],
  });
  steps.push({
    title: "Bolt the frames to the rails",
    detail: "Put the front rail (8) between the tops of the frames. With the Allen key, a long bolt (F) through each leg into the ends of the shelf rails and a shorter one (L) through each frame's top rail into the front rail.",
    add: ["R8"],
    fix: [
      ...SX.flatMap((g) => ["R15f", "R15b"].map((id, i) => fx(H_.F, [[g * (W / 2), yR15, (i ? -1 : 1) * zl]], [-g, 0, 0], g < 0 ? "F6" : "F7", id))),
      ...SX.map((g) => fx(H_.L, [[g * (W / 2), HS - RH / 2, zR8]], [-g, 0, 0], g < 0 ? "F6" : "F7", "R8")),
    ],
    from: { R8: [0, 0, 400] },
    pose: lie,
    tools: ["allen"],
  });
  steps.push({
    title: "Screw the runners into the sides",
    detail: "Lay the sides inside face up: runner 18 on the left side (3) and runner 16 on the right side (4), wheel to the front, four small screws (D) each.",
    fix: [...cabinetRunners(o, -1, "S3", [dr], "Cabinet runner, left", H_.D), ...cabinetRunners(o, 1, "S4", [dr], "Cabinet runner, right", H_.D)],
    wait: ["S3", "S4"],
    from: offset(["S3", "S4"], rightOff),
    tools: ["screwdriver"],
    kind: "runners",
  });
  // (spaced to clear the runner screws above them, the bolts into the legs and the frames' dowels below)
  const sideDowelZ = [-(D / 2 - 60), D / 2 - 60], sideScrewZ = [-30, 30];
  steps.push({
    title: "Screw the sides onto the case bottom",
    detail: "Two dowels (C) in the bottom edge of each side, press the case bottom (2) onto them and drive two long screws (E) through it into each side.",
    fix: [
      ...SX.map((g) => fx(H_.C, sideDowelZ.map((z): Vec3 => [g * (W / 2 - T / 2), y0, z]), [0, 1, 0], g < 0 ? "S3" : "S4", "P2")),
      ...SX.map((g) => fx(H_.E, sideScrewZ.map((z): Vec3 => [g * (W / 2 - T / 2), HS, z]), [0, 1, 0], "P2", g < 0 ? "S3" : "S4")),
    ],
    wait: ["P2"],
    from: offset(caseIds, rightOff),
    tools: ["screwdriver"],
  });
  const topRailZ = [-65, 65];
  steps.push({
    title: "Fit the case onto the stand",
    detail: "Six dowels (C) in the tops of the frames and the front rail. Push the case on, drive a bolt (L) down through the case bottom into the top of each leg, and stick a felt pad (G) under each foot.",
    add: caseIds,
    fix: [
      ...SX.map((g) => fx(H_.C, topRailZ.map((z): Vec3 => [g * (W / 2 - FR / 2), HS, z]), [0, -1, 0], g < 0 ? "F6" : "F7", "P2")),
      fx(H_.C, [-W / 4, W / 4].map((x): Vec3 => [x, HS, zR8]), [0, -1, 0], "R8", "P2"),
      ...SX.map((g) => fx(H_.L, [-zl, zl].map((z): Vec3 => [g * (hk - 3), y0, z]), [0, -1, 0], "P2", g < 0 ? "F6" : "F7")),
      ...SX.map((g) => fx(H_.G, [-zl, zl].map((z): Vec3 => [g * hk, 0, z]), [0, 1, 0], g < 0 ? "F6" : "F7")),
    ],
    pose: lie,
    tools: ["allen"],
  });
  steps.push({
    title: "Screw the stand to the case bottom",
    detail: "Six long screws (E) up through the frames' top rails and the front rail into the case bottom.",
    fix: [
      ...SX.map((g) => fx(H_.E, [-25, 25].map((z): Vec3 => [g * (W / 2 - FR / 2), HS - RH, z]), [0, 1, 0], g < 0 ? "F6" : "F7", "P2")),
      fx(H_.E, [-(W / 4 + 40), W / 4 + 40].map((x): Vec3 => [x, HS - RH, zR8]), [0, 1, 0], "R8", "P2"),
    ],
    pose: lie,
    tools: ["screwdriver"],
  });
  steps.push({
    title: "Stand it up and slide in the back",
    detail: "Smooth side in, down the grooves in the sides from the open top. Lay the top (1) face down beside it.",
    add: ["K5"],
    wait: ["T1"],
    from: { K5: [0, 600, 0], T1: rightOff },
    pose: "+y",
  });
  const topBoltZ = [-(D / 2 - 60), D / 2 - 60];
  steps.push({
    title: "Fix the top on",
    detail: "Four cam bolts (A) into the underside of the top and two dowels (C) into the top edge of each side. Lower the top on and lock the four cam locks (B).",
    add: ["T1"],
    fix: [
      fx(H_.A, SX.flatMap((g) => topBoltZ.map((z): Vec3 => [g * (W / 2 - T / 2), y1, z])), [0, 1, 0], "T1"),
      ...SX.map((g) => fx(H_.C, [-(D / 2 - 30), D / 2 - 30].map((z): Vec3 => [g * (W / 2 - T / 2), y1, z]), [0, -1, 0], g < 0 ? "S3" : "S4", "T1")),
      ...SX.map((g) => fx(H_.B, topBoltZ.map((z): Vec3 => [g * xi, y1 - 25, z]), [g, 0, 0], g < 0 ? "S3" : "S4")),
    ],
    tools: ["screwdriver"],
  });
  const blockYs = [y0 + 25, y1 - 30];
  steps.push({
    title: "Fit the corner blocks and the wall strap",
    detail: "Turn it round. Press a corner block (I) into each corner behind the back and fix it to the side with a small screw (D), then screw the wall strap (K) under the back edge of the top with another, its tab hanging down behind.",
    fix: [
      ...SX.map((g) => fx(H_.I, blockYs.map((y): Vec3 => [g * (xi - 11), y, zk]), [0, 0, 1], "K5")),
      ...SX.map((g) => fx(H_.D, blockYs.map((y, j): Vec3 => [g * xi, y + (j ? -22 : 22), zk - 9]), [g, 0, 0], g < 0 ? "S3" : "S4")),
      fx(H_.K, [[0, y1, -D / 2 + 15]], [0, 1, 0], "T1"),
      fx(H_.D, [[0, y1, -D / 2 + 40]], [0, 1, 0], "T1"),
    ],
    tools: ["screwdriver"],
  });
  steps.push({
    title: "Slide the drawer in",
    detail: "Rest its runners on the ones in the case and push it home.",
    add: dIds,
    from: offset(dIds, dOff),
    kind: "drawer",
  });
  const wy = y1 - 20; // through the strap's tab
  steps.push({
    title: "Fix it to the wall",
    detail: "Push it against the wall, mark through the strap's tab, drill, push in the plug (J) and drive a long screw (E) through the strap into it. Check for pipes and cables first.",
    fix: [fx(H_.J, [[0, wy, -D / 2 - 25]], [0, 0, -1]), fx(H_.E, [[0, wy, -D / 2]], [0, 0, -1], "T1")],
    tools: ["drill", "screwdriver", "pencil"],
    wall: true,
    warnings: ["wall", "tip"],
  });
  return { parts: p.list, steps };
}

/* ---------- the 3 drawer chest ---------- */

function chest(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const H_ = {
    A: CAM_BOLT,
    B: CAM_LOCK,
    C: dowel(),
    D: screw(12),
    E: screw(35),
    F: bolt(50),
    G: dowel(8),
    I: BLOCK,
    J: PLUG,
    K: STRAP,
    L: FELT,
  };
  const LH = 100; // legs
  const y0 = LH + T, y1 = H - T; // the sides stand on the bottom, the top on them
  const xi = W / 2 - T;
  const hr = (y1 - y0) / 3;
  const yb = (k: number) => y0 + k * hr; // where the drawer openings meet
  const zf = D / 2 - FTT; // back of the fronts
  const zk = -D / 2 + 18; // the backs' outside face
  const R14 = 40; // the top front rail, on edge
  const yR = (y0 + y1) / 2; // the back rail, half way up, in front of the backs
  const zR = zk + BK + T / 2;
  const RD = 70; // the flat rails between the drawers
  const zR15 = zf - RD / 2;
  const lx = W / 2 - 40, lz = D / 2 - 40; // leg centres

  const p = new Parts();
  p.add("T1", "1", "Top", [W, T, D], [0, H - T / 2, 0]);
  p.add("S2", "2", "Left side", [T, y1 - y0, D], [-(W / 2 - T / 2), (y0 + y1) / 2, 0]);
  p.add("S4", "4", "Right side", [T, y1 - y0, D], [W / 2 - T / 2, (y0 + y1) / 2, 0]);
  p.add("R14", "14", "Top front rail", [2 * xi, R14, T], [0, y1 - R14 / 2, zf - T / 2]);
  p.add("R3", "3", "Back rail", [2 * xi, 80, T], [0, yR, zR]);
  p.add("R15a", "15", "Front rail", [2 * xi, T, RD], [0, yb(1), zR15]);
  p.add("R15b", "15", "Front rail", [2 * xi, T, RD], [0, yb(2), zR15]);
  p.add("K5u", "5", "Back panel", [2 * xi + 16, y1 + 5 - (yR + 40), BK], [0, (y1 + 5 + yR + 40) / 2, zk + BK / 2], "fiber");
  p.add("K5l", "5", "Back panel", [2 * xi + 16, yR - 40 - (y0 - 5), BK], [0, (yR - 40 + y0 - 5) / 2, zk + BK / 2], "fiber");
  p.add("B6", "6", "Bottom", [W, T, D], [0, LH + T / 2, 0]);
  const legIds = CORNERS.map(([sx, sz], i) => p.add(`L13-${i}`, "13", "Leg", [LG, LH, LG], [sx * lx, LH / 2, sz * lz]));
  const DD = Math.floor((zf - (zR + T / 2) - 10) / 10) * 10;
  const o: DrawerSet = { N: { front: "7", left: "8", right: "9", back: "10", bottom: "11", support: "12" }, xi, zf, DD, RL: Math.floor((DD - 30) / 50) * 50, sh: 130, lift: 28 };
  const drawers = [0, 1, 2].map((i) => drawerParts(p, o, String(i), yb(i), hr, D));
  const dIds = drawers.flatMap(drawerIds);

  const steps: CustomStep[] = [];
  const lie = "-x" as const; // on its right side
  const dOff: Vec3 = [0, 0, 420];
  steps.push({
    title: "Screw the runners into the sides",
    detail: "Lay both sides inside face up: three runners 18 on the left side (2) and three runners 16 on the right side (4), wheel to the front, four small screws (D) each.",
    fix: [...cabinetRunners(o, -1, "S2", drawers, "Cabinet runner, left", H_.D), ...cabinetRunners(o, 1, "S4", drawers, "Cabinet runner, right", H_.D)],
    wait: ["S2", "S4"],
    from: { S2: [-300, 0, 0], S4: [300, 0, 0] },
    tools: ["screwdriver"],
    kind: "runners",
  });
  // in each side: one for the top front rail, one for each flat rail, two for the back rail
  const sideBolts = (g: number): Vec3[] => [[g * xi, y1 - R14 / 2, zf - T / 2], ...[1, 2].map((k): Vec3 => [g * xi, yb(k), zf - 45]), [g * xi, yR - 20, zR], [g * xi, yR + 20, zR]];
  steps.push({
    title: "Turn cam bolts into the sides",
    detail: "Five cam bolts (A) into each side's inside face, by hand until they stop.",
    fix: SX.map((g) => fx(H_.A, sideBolts(g), [g, 0, 0], g < 0 ? "S2" : "S4")),
    tools: ["screwdriver"],
  });
  const rails = ["R14", "R3", "R15a", "R15b"];
  const railJoint = (g: number): { dowels: CustomFix[]; cams: CustomFix[] } => ({
    dowels: [1, 2].map((k) => fx(H_.C, [[g * xi, yb(k), zf - 15]], [g, 0, 0], g < 0 ? "S2" : "S4", k === 1 ? "R15a" : "R15b")),
    cams: [
      fx(H_.B, [[g * (xi - 25), y1 - R14 / 2, zf - T]], [0, 0, 1], "R14"),
      fx(H_.B, [yR - 20, yR + 20].map((y): Vec3 => [g * (xi - 30), y, zR + T / 2]), [0, 0, -1], "R3"),
      ...[1, 2].map((k) => fx(H_.B, [[g * (xi - 25), yb(k) + T / 2, zf - 45]], [0, -1, 0], k === 1 ? "R15a" : "R15b")),
    ],
  });
  steps.push({
    title: "Stand the rails on the right side",
    detail: "Lay the right side (4) down, inside face up. A dowel (C) at the end of each flat rail (15), then stand the top front rail (14), the back rail (3) and the two flat rails on its cam bolts and lock the five cam locks (B).",
    add: ["S4", ...rails],
    fix: [...railJoint(1).dowels, ...railJoint(1).cams],
    from: offset(rails, [-350, 0, 0]),
    pose: lie,
    tools: ["screwdriver"],
    warnings: ["floor"],
  });
  steps.push({
    title: "Fit the left side on top",
    detail: "Two dowels (C) in the flat rails' other ends, lower the left side (2) onto the rails and lock its five cam locks (B).",
    add: ["S2"],
    fix: [...railJoint(-1).dowels, ...railJoint(-1).cams],
    pose: lie,
    tools: ["screwdriver"],
  });
  steps.push({
    title: "Slide in the upper back panel",
    detail: "Smooth side in, down the grooves from the open top end until it meets the back rail. Lay the top (1) face down beside it.",
    add: ["K5u"],
    wait: ["T1"],
    from: { K5u: [0, 500, 0], T1: [0, 0, 450] },
    pose: lie,
  });
  const topBoltZ = [-(D / 2 - 95), D / 2 - 95];
  steps.push({
    title: "Fix the top on",
    detail: "Four cam bolts (A) into the top. Six dowels (C) into the top edges of the sides and the top front rail, push the top on and lock the four cam locks (B), then drive two long screws (E) through the top front rail into the top.",
    add: ["T1"],
    fix: [
      fx(H_.A, SX.flatMap((g) => topBoltZ.map((z): Vec3 => [g * (W / 2 - T / 2), y1, z])), [0, 1, 0], "T1"),
      ...SX.map((g) => fx(H_.C, [-(D / 2 - 45), D / 2 - 45].map((z): Vec3 => [g * (W / 2 - T / 2), y1, z]), [0, -1, 0], g < 0 ? "S2" : "S4", "T1")),
      fx(H_.C, [-W / 4, W / 4].map((x): Vec3 => [x, y1, zf - T / 2]), [0, -1, 0], "R14", "T1"),
      ...SX.map((g) => fx(H_.B, topBoltZ.map((z): Vec3 => [g * xi, y1 - 25, z]), [g, 0, 0], g < 0 ? "S2" : "S4")),
      fx(H_.E, [-(W / 4 + 60), W / 4 + 60].map((x): Vec3 => [x, y1 - R14, zf - T / 2]), [0, 1, 0], "R14", "T1"),
    ],
    pose: lie,
    tools: ["screwdriver"],
  });
  const baseIds = ["B6", ...legIds];
  const baseOff: Vec3 = [0, 0, 450];
  steps.push({
    title: "Bolt the legs under the bottom",
    detail: "A thick dowel (G) in the top of each leg (13), set the bottom (6) on them and drive a bolt (F) down through it into each leg with the Allen key. Stick a felt pad (L) under each leg.",
    fix: [
      ...CORNERS.map(([sx, sz], i) => fx(H_.G, [[sx * lx - sx * 12, LH, sz * lz - sz * 12]], [0, -1, 0], legIds[i], "B6")),
      ...CORNERS.map(([sx, sz], i) => fx(H_.F, [[sx * lx, LH + T, sz * lz]], [0, -1, 0], "B6", legIds[i])),
      ...CORNERS.map(([sx, sz], i) => fx(H_.L, [[sx * lx, 0, sz * lz]], [0, 1, 0], legIds[i])),
    ],
    wait: baseIds,
    from: offset(baseIds, baseOff),
    pose: lie,
    tools: ["allen"],
    kind: "legs",
  });
  steps.push({
    title: "Slide in the lower back and fix the bottom on",
    detail: "The lower back panel goes up the grooves from the open bottom end to the back rail. Four dowels (C) into the bottom edges of the sides, push the bottom and its legs on and drive two long screws (E) through it into each side.",
    add: ["K5l", ...baseIds],
    fix: [
      ...SX.map((g) => fx(H_.C, [-(D / 2 - 45), D / 2 - 45].map((z): Vec3 => [g * (W / 2 - T / 2), y0, z]), [0, 1, 0], g < 0 ? "S2" : "S4", "B6")),
      ...SX.map((g) => fx(H_.E, [-(D / 2 - 100), D / 2 - 100].map((z): Vec3 => [g * (W / 2 - T / 2), LH, z]), [0, 1, 0], "B6", g < 0 ? "S2" : "S4")),
    ],
    from: { K5l: [0, -500, 0], ...offset(baseIds, baseOff) },
    pose: lie,
    tools: ["screwdriver"],
  });
  const backs = [
    { id: "K5u", ys: [yR + 40 + 25, y1 - 30] },
    { id: "K5l", ys: [y0 + 25, yR - 40 - 25] },
  ];
  const strapX = [-W / 4, W / 4];
  steps.push({
    title: "Stand it up, fit the corner blocks and the wall straps",
    detail: "Turn it round. Press a corner block (I) into each corner behind both back panels and fix each to the side with a small screw (D), then screw the two wall straps (K) under the back edge of the top, one screw (D) each, their tabs hanging down behind.",
    fix: [
      ...backs.flatMap((b) => SX.map((g) => fx(H_.I, b.ys.map((y): Vec3 => [g * (xi - 11), y, zk]), [0, 0, 1], b.id))),
      ...backs.flatMap((b) => SX.map((g) => fx(H_.D, b.ys.map((y, j): Vec3 => [g * xi, y + (j ? -22 : 22), zk - 9]), [g, 0, 0], g < 0 ? "S2" : "S4"))),
      fx(H_.K, strapX.map((x): Vec3 => [x, y1, -D / 2 + 15]), [0, 1, 0], "T1"),
      fx(H_.D, strapX.map((x): Vec3 => [x, y1, -D / 2 + 40]), [0, 1, 0], "T1"),
    ],
    pose: "+y",
    tools: ["screwdriver"],
  });
  steps.push({
    title: "Build the three drawer boxes",
    detail: "For each front (7): lay it face down on a rug, turn in its five cam bolts (A), press the left side (8) and the right side (9) onto them and lock the four cam locks (B), then slide the bottom (11) down the grooves.",
    fix: drawers.flatMap((d) => [...drawerBolts(o, d, H_.A), ...drawerLocks(o, d, H_.B)]),
    wait: drawers.flatMap((d) => [d.front, d.sl, d.sr, d.bottom]),
    from: offset(dIds, dOff),
    tools: ["screwdriver"],
    kind: "drawer",
    warnings: ["floor"],
  });
  steps.push({
    title: "Fit the supports and the backs",
    detail: "Stand a support (12) on each front's middle cam bolt under the bottom and lock its cam lock (B). Put the back (10) on and drive six long screws (E): two through each side and two through the back into the support.",
    fix: drawers.flatMap((d) => [fx(H_.B, [[0, d.y, zf - 25]], [0, 1, 0], d.support!), ...drawerBackScrews(o, d, H_.E)]),
    wait: drawers.flatMap((d) => [d.support!, d.back]),
    from: offset(dIds, dOff),
    tools: ["screwdriver"],
    kind: "drawer",
  });
  steps.push({
    title: "Screw the runners onto the drawers",
    detail: "Runner 19 along the bottom edge of each left side and runner 17 along each right side, three small screws (D) each.",
    fix: drawers.flatMap((d) => drawerRunners(o, d, H_.D, "Drawer runner, left", "Drawer runner, right")),
    tools: ["screwdriver"],
    kind: "runners",
  });
  steps.push({
    title: "Slide the three drawers in",
    detail: "Rest each drawer's runners on the ones in the chest and push it home. Open only one drawer at a time.",
    add: dIds,
    from: offset(dIds, dOff),
    kind: "drawer",
    warnings: ["tip"],
  });
  const wy = y1 - 20; // through the strap's tab
  steps.push({
    title: "Fix it to the wall",
    detail: "Push it against the wall, mark through the two straps, drill, push in the plugs (J) and drive a long screw (E) through each strap. Check for pipes and cables first.",
    fix: [fx(H_.J, strapX.map((x): Vec3 => [x, wy, -D / 2 - 25]), [0, 0, -1]), fx(H_.E, strapX.map((x): Vec3 => [x, wy, -D / 2]), [0, 0, -1], "T1")],
    tools: ["drill", "screwdriver", "pencil"],
    wall: true,
    warnings: ["wall", "tip"],
  });
  return { parts: p.list, steps };
}

/* ---------- the 2 tier shoe cabinet ---------- */

function shoeCabinet(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const H_ = {
    A: hw("Cam bolt", "camScrew", 35, 6),
    B: CAM_LOCK,
    C: dowel(),
    D: screw(35),
    E: hw("Flip fitting, right", "connector", 160, 120),
    F: hw("Flip fitting, left", "connector", 160, 120),
    G: hw("Stop block", "clip", 12, 26),
    H: hw("Pivot bush", "cap", 3, 20),
    I: hw("Pivot cap", "washer", 2, 18),
    J: FELT,
    K: screw(18),
    L: screw(14, 3.5),
    M: PLUG,
    O: bolt(40),
    P: dowel(8),
    Q: screw(25),
    R: dowel(6, 15),
    S: { ...screw(40), name: "Wall screw" },
    T: screw(16, 3),
  };
  const LH = 60, LS = 40; // the legs
  const y0 = LH + T, y1 = H - T;
  const xi = W / 2 - T;
  const RH = 80; // the back rails
  const zb = -D / 2 + T / 2;
  const lx = W / 2 - 40, lz = D / 2 - 40;
  const p = new Parts();
  p.add("T1", "1", "Top", [W, T, D], [0, H - T / 2, 0]);
  p.add("B2", "2", "Bottom", [W, T, D], [0, LH + T / 2, 0]);
  p.add("S3", "3", "Left side", [T, y1 - y0, D], [-(W / 2 - T / 2), (y0 + y1) / 2, 0]);
  p.add("S4", "4", "Right side", [T, y1 - y0, D], [W / 2 - T / 2, (y0 + y1) / 2, 0]);
  const rails = [
    { id: "R5", label: "5", name: "Top back rail", y: y1 - RH / 2 },
    { id: "R6", label: "6", name: "Middle back rail", y: (y0 + y1) / 2 },
    { id: "R7", label: "7", name: "Bottom back rail", y: y0 + RH / 2 },
  ];
  for (const r of rails) p.add(r.id, r.label, r.name, [2 * xi, RH, T], [0, r.y, zb]);
  const legIds = CORNERS.map(([sx, sz], i) => p.add(`L8-${i}`, "8", "Leg", [LS, LH, LS], [sx * lx, LH / 2, sz * lz]));
  // the doors, set in between the sides from the bottom to the top, each with its strips and what it carries
  const dw = 2 * xi - 4, dh = (y1 - y0 - 6) / 2;
  const zdb = D / 2 - RIB - T; // the doors' back face
  const tl = 2 * xi - 16; // tray boards run between the fittings
  const doors = [0, 1].map((i) => {
    const yc = y0 + 2 + dh / 2 + i * (dh + 2);
    return { i, yc, id: `D9-${i}`, k: [`K12a-${i}`, `K12b-${i}`], t10: `T10a-${i}`, t11: `T11-${i}`, t10b: `T10b-${i}` };
  });
  for (const d of doors) {
    p.add(d.id, "9", "Door", [dw, dh, T], [0, d.yc, zdb + T / 2]);
    SX.forEach((g, j) => p.add(d.k[j], "12", "Door strip", [RIBW, dh, RIB], [(g * dw) / 6, d.yc, D / 2 - RIB / 2]));
    p.add(d.t10, "10", "Tray panel", [tl, 100, 12], [0, d.yc + 80, 30]);
    p.add(d.t11, "11", "Tray strip", [tl, 12, 50], [0, d.yc - dh / 2 + 26, zdb - 25]);
    p.add(d.t10b, "10", "Tray panel", [tl, 100, 12], [0, d.yc - 40, -10]);
  }
  const sides = [
    { id: "S3", g: -1 },
    { id: "S4", g: 1 },
  ];
  const pivot = (d: (typeof doors)[number]) => ({ y: d.yc - 120, z: 65 });
  const stop = (d: (typeof doors)[number]) => ({ y: d.yc + 120, z: 80 });
  const topZ = [-(D / 2 - 50), D / 2 - 50];
  const railX = [-W / 6, W / 6];
  const steps: CustomStep[] = [];
  const lie = "-z" as const, onSide = "+x" as const;
  steps.push({
    title: "Turn in the cam bolts and fit the stop blocks and bushes",
    detail: "Lay the top and both sides inside face up. Six cam bolts (A) go into the top and six into each side, then screw two stop blocks (G) onto each side, two small screws (T) each, and tap in the two round bushes (H).",
    fix: [
      fx(H_.A, [...SX.flatMap((g) => topZ.map((z): Vec3 => [g * (W / 2 - T / 2), y1, z])), ...railX.map((x): Vec3 => [x, y1, zb])], [0, 1, 0], "T1"),
      ...sides.map((sd) => fx(H_.A, rails.flatMap((r) => [-18, 18].map((k): Vec3 => [sd.g * xi, r.y + k, zb])), [sd.g, 0, 0], sd.id)),
      ...sides.map((sd) => fx(H_.G, doors.map((d): Vec3 => [sd.g * xi, stop(d).y, stop(d).z]), [sd.g, 0, 0], sd.id)),
      ...sides.map((sd) => fx(H_.T, doors.flatMap((d) => [-24, 24].map((k): Vec3 => [sd.g * xi, stop(d).y, stop(d).z + k])), [sd.g, 0, 0], sd.id)),
      ...sides.map((sd) => fx(H_.H, doors.map((d): Vec3 => [sd.g * xi, pivot(d).y, pivot(d).z]), [sd.g, 0, 0], sd.id)),
    ],
    wait: ["T1", "S3", "S4"],
    from: { S3: [-250, 0, 0], S4: [250, 0, 0], T1: [(W + 250 * 1.6 + 120) / 1.6, 0, 0] },
    pose: lie,
    tools: ["screwdriver", "hammer"],
    warnings: ["floor"],
  });
  const baseIds = ["B2", ...legIds];
  const baseOff: Vec3 = [0, 0, -(D + 250) / 1.6];
  steps.push({
    title: "Bolt the legs onto the bottom",
    detail: "A thick dowel (P) in the top of each leg (8), then a bolt (O) through the bottom (2) into each one with the Allen key, and a felt pad under each leg.",
    fix: [
      ...CORNERS.map(([sx, sz], i) => fx(H_.P, [[sx * lx - sx * 14, LH, sz * lz - sz * 14]], [0, -1, 0], legIds[i], "B2")),
      ...CORNERS.map(([sx, sz], i) => fx(H_.O, [[sx * lx, LH + T, sz * lz]], [0, -1, 0], "B2", legIds[i])),
      ...CORNERS.map(([sx, sz], i) => fx(H_.J, [[sx * lx, 0, sz * lz]], [0, 1, 0], legIds[i])),
    ],
    wait: baseIds,
    from: offset(baseIds, baseOff),
    pose: lie,
    tools: ["allen"],
    kind: "legs",
  });
  steps.push({
    title: "Join the sides with the three back rails",
    detail: "With the sides on their front edges, push the top, middle and bottom back rails (5, 6, 7) onto the cam bolts and lock the twelve cam locks (B).",
    add: ["S3", "S4", ...rails.map((r) => r.id)],
    fix: rails.flatMap((r) => SX.map((g) => fx(H_.B, [-18, 18].map((k): Vec3 => [g * (xi - 25), r.y + k, zb + T / 2]), [0, 0, -1], r.id))),
    from: offset(
      rails.map((r) => r.id),
      [0, 0, -400],
    ),
    pose: lie,
    tools: ["screwdriver"],
  });
  steps.push({
    title: "Fix the top on",
    detail: "Six dowels (C) into the top edges of the sides and the top back rail, then push the top onto them and lock its six cam locks (B).",
    add: ["T1"],
    fix: [
      ...sides.map((sd) => fx(H_.C, [-20, 20].map((z): Vec3 => [sd.g * (W / 2 - T / 2), y1, z]), [0, -1, 0], sd.id, "T1")),
      fx(H_.C, railX.map((x): Vec3 => [x + Math.sign(x) * 60, y1, zb]), [0, -1, 0], "R5", "T1"),
      ...sides.map((sd) => fx(H_.B, topZ.map((z): Vec3 => [sd.g * xi, y1 - 25, z]), [sd.g, 0, 0], sd.id)),
      fx(H_.B, railX.map((x): Vec3 => [x, y1 - 25, zb + T / 2]), [0, 0, -1], "R5"),
    ],
    pose: lie,
    tools: ["screwdriver"],
  });
  steps.push({
    title: "Fix the bottom and legs on",
    detail: "Six dowels (C) into the bottom edges of the sides and the bottom back rail, push the bottom on and drive two long screws (D) through it into each side and into the rail.",
    add: baseIds,
    fix: [
      ...sides.map((sd) => fx(H_.C, [-20, 20].map((z): Vec3 => [sd.g * (W / 2 - T / 2), y0, z]), [0, 1, 0], sd.id, "B2")),
      fx(H_.C, railX.map((x): Vec3 => [x, y0, zb]), [0, 1, 0], "R7", "B2"),
      ...sides.map((sd) => fx(H_.D, topZ.map((z): Vec3 => [sd.g * (W / 2 - T / 2), LH, z]), [0, 1, 0], "B2", sd.id)),
      fx(H_.D, railX.map((x): Vec3 => [x + Math.sign(x) * 60, LH, zb]), [0, 1, 0], "B2", "R7"),
    ],
    from: offset(baseIds, baseOff),
    pose: lie,
    tools: ["screwdriver"],
  });
  const dOff: Vec3 = [0, 0, 400];
  const dIds = doors.flatMap((d) => [d.id, ...d.k, d.t10, d.t11]);
  steps.push({
    title: "Fix the strips onto the doors",
    detail: "Tip the cabinet onto its left side, ready for the doors. Two short dowels (R) in each strip (12), press two strips onto the face of each door (9) and drive two screws (Q) through the door into each strip from behind.",
    fix: doors.flatMap((d) => [
      ...SX.map((g, j) => fx(H_.R, [-1, 1].map((k): Vec3 => [(g * dw) / 6, d.yc + (k * dh) / 4, D / 2 - RIB]), [0, 0, -1], d.id, d.k[j])),
      ...SX.map((g, j) => fx(H_.Q, [-1, 1].map((k): Vec3 => [(g * dw) / 6, d.yc + k * (dh / 2 - 40), zdb]), [0, 0, 1], d.id, d.k[j])),
    ]),
    wait: doors.flatMap((d) => [d.id, ...d.k]),
    from: offset(dIds, dOff),
    pose: onSide,
    tools: ["screwdriver"],
    warnings: ["floor"],
  });
  const fitX = xi - 6; // the fittings stand just inside the sides
  steps.push({
    title: "Screw the flip fittings onto the doors",
    detail: "Lay each door face down: one fitting (E) at one end and the other (F) at the other, three small screws (L) each.",
    fix: doors.flatMap((d) => [
      fx(H_.F, [[-fitX, d.yc - 60, zdb - 60]], [-1, 0, 0], d.id),
      fx(H_.E, [[fitX, d.yc - 60, zdb - 60]], [1, 0, 0], d.id),
      fx(H_.L, SX.flatMap((g) => [-50, 0, 50].map((k): Vec3 => [g * (xi - 12), d.yc - 60 + k, zdb])), [0, 0, 1], d.id),
    ]),
    from: offset(dIds, dOff),
    pose: onSide,
    tools: ["screwdriver"],
    kind: "doors",
  });
  const ends = (id: string, y: number, z: number): CustomFix[] => SX.map((g) => fx(H_.K, [[g * (tl / 2), y, z]], [-g, 0, 0], id));
  steps.push({
    title: "Screw a shoe tray onto each door",
    detail: "A tray panel (10) across the top of the fittings and the tray strip (11) across the bottom, one screw (K) through the fitting into each end.",
    fix: doors.flatMap((d) => [...ends(d.t10, d.yc + 80, 30), ...ends(d.t11, d.yc - dh / 2 + 26, zdb - 25)]),
    wait: doors.flatMap((d) => [d.t10, d.t11]),
    from: offset(dIds, dOff),
    pose: onSide,
    tools: ["screwdriver"],
  });
  steps.push({
    title: "Fit the doors into the cabinet",
    detail: "Set each door's pivots against the round bushes in the sides, then fix each pivot with a cap (I) and a small screw (L).",
    add: dIds,
    kind: "doors",
    fix: [
      ...sides.map((sd) => fx(H_.I, doors.map((d): Vec3 => [sd.g * xi, pivot(d).y, pivot(d).z]), [sd.g, 0, 0], sd.id)),
      ...sides.map((sd) => fx(H_.L, doors.map((d): Vec3 => [sd.g * xi, pivot(d).y, pivot(d).z]), [sd.g, 0, 0], sd.id)),
    ],
    from: offset(dIds, dOff),
    pose: onSide,
    tools: ["screwdriver"],
  });
  const wallX = [-W / 4, W / 4];
  const wy = y1 - RH / 2;
  steps.push({
    title: "Stand it up and fix it to the wall",
    detail: "Push it against the wall and mark through the two holes in the top back rail, then drill, push in the plugs (M) and drive the two wall screws (S) through the rail. Check for pipes and cables first.",
    fix: [fx(H_.M, wallX.map((x): Vec3 => [x, wy, -D / 2 - 25]), [0, 0, -1]), fx(H_.S, wallX.map((x): Vec3 => [x, wy, zb + T / 2]), [0, 0, -1], "R5")],
    pose: "+y",
    tools: ["drill", "screwdriver", "pencil"],
    wall: true,
    warnings: ["wall", "tip"],
  });
  steps.push({
    title: "Screw in the second tray panels",
    detail: "Tip each door open and screw the other tray panel (10) between its fittings, one screw (K) at each end.",
    add: doors.map((d) => d.t10b),
    fix: doors.flatMap((d) => ends(d.t10b, d.yc - 40, -10)),
    from: offset(
      doors.map((d) => d.t10b),
      [0, 0, 300],
    ),
    tools: ["screwdriver"],
  });
  return { parts: p.list, steps };
}

/* ---------- the sideboard and the entertainment unit ---------- */

/**
 * Both stand on four legs and a middle leg under the bottom, have a top front rail between the sides under the top, and
 * three doors of a third of the width each on cup hinges: the left one on the left side, the middle one on cranked
 * hinges on the divider to its right (that divider's edge is shared with the right door), the right one on the right
 * side. The sideboard has one divider, a third in from the right, and a fixed shelf half way up its wide left bay with a
 * back above and below it; the entertainment unit has two dividers and one back behind them, with a cable hole.
 */
function cabinet(s: ProductSpec, kind: "sideboard" | "tv"): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const H_ = {
    A: CAM_BOLT,
    B: CAM_LOCK,
    C: dowel(),
    D: screw(12),
    E: screw(35),
    F: hw("Adjustable foot", "glide", 10, 22),
    G: bolt(50),
    H: dowel(8),
    I: hw("Shelf support", "pin", 16, 5),
    J: hw("Hinge", "hinge", 50, 35),
    K: BLOCK,
    L: PLUG,
    M: STRAP,
    N: FELT,
    P: hw("Cranked hinge", "hinge", 52, 35),
  };
  const tv = kind === "tv";
  const LH = 100; // legs; the middle one is shorter and stands on its adjustable foot
  const zfc = D / 2 - FTT; // the carcass's front, behind the doors
  const zbk = -D / 2;
  const zc = (zfc + zbk) / 2, Dc = zfc - zbk;
  const xi = W / 2 - T;
  const y0 = LH + T, y1 = H - T;
  const RH = 50; // the top front rail
  const zk = zbk + 18; // the backs' outside face
  const xd = W / 6; // divider centres: the sideboard's one at +xd, the unit's two at -xd and +xd
  const ySh = Math.round((y0 + y1) / 2);
  const p = new Parts();
  const N = tv
    ? { left: "2", right: "5", top: "1", bottom: "6", rail: "12", door: "8", shelf: "9", legs: "10", mid: "11" }
    : { left: "2", right: "5", top: "1", bottom: "6", rail: "13", door: "8", shelf: "9", legs: "10", mid: "11" };
  p.add("T1", N.top, "Top", [W, T, D], [0, H - T / 2, 0]);
  p.add("B6", N.bottom, "Bottom", [W, T, Dc], [0, LH + T / 2, zc]);
  p.add("S2", N.left, "Left side", [T, y1 - y0, Dc], [-(W / 2 - T / 2), (y0 + y1) / 2, zc]);
  p.add("S5", N.right, "Right side", [T, y1 - y0, Dc], [W / 2 - T / 2, (y0 + y1) / 2, zc]);
  // dividers, notched at the top front for the rail: the sideboard's in the backs' grooves, the unit's in front of its back
  const zdv0 = tv ? zk + BK : zbk;
  const divider = (id: string, label: string, name: string, x: number) => {
    const m = notched([
      { min: [x - T / 2, y0, zdv0], max: [x + T / 2, y1 - RH, zfc] },
      { min: [x - T / 2, y1 - RH, zdv0], max: [x + T / 2, y1, zfc - T] },
    ]);
    p.add(id, label, name, m.size, m.pos, "board", m.pieces);
  };
  const divs = tv
    ? [
        { id: "V3", x: -xd },
        { id: "V4", x: xd },
      ]
    : [{ id: "V4", x: xd }];
  if (tv) {
    divider("V3", "3", "Left divider", -xd);
    divider("V4", "4", "Right divider", xd);
  } else divider("V4", "4", "Divider", xd);
  p.add("R13", N.rail, "Top front rail", [2 * xi, RH, T], [0, y1 - RH / 2, zfc - T / 2]);
  const shelfD = zfc - (zk + BK);
  const zShelf = (zfc + zk + BK) / 2;
  if (!tv) p.add("SH3", "3", "Fixed shelf", [xd - T / 2 + xi, T, shelfD], [(xd - T / 2 - xi) / 2, ySh, zShelf]);
  // backs, in grooves 18 mm in from the back edge
  const back = (id: string, label: string, name: string, a: number, b: number, ya: number, yb: number) => p.add(id, label, name, [b - a + 16, yb - ya, BK], [(a + b) / 2, (ya + yb) / 2, zk + BK / 2], "fiber");
  const backs: { id: string; a: number; b: number; ys: number[] }[] = [];
  if (tv) {
    back("K7", "7", "Back panel", -xi, xi, y0 - 5, y1 + 5);
    backs.push({ id: "K7", a: -xi, b: xi, ys: [y0 + 25, y1 - 30] });
  } else {
    back("K7u", "7", "Left back panel", -xi, xd - T / 2, ySh, y1 + 5);
    back("K7l", "7", "Left back panel", -xi, xd - T / 2, y0 - 5, ySh);
    back("K12", "12", "Right back panel", xd + T / 2, xi, y0 - 5, y1 + 5);
    backs.push({ id: "K7u", a: -xi, b: xd - T / 2, ys: [ySh + 25, y1 - 30] }, { id: "K7l", a: -xi, b: xd - T / 2, ys: [y0 + 25, ySh - 25] }, { id: "K12", a: xd + T / 2, b: xi, ys: [y0 + 25, y1 - 30] });
  }
  // the loose shelf: the sideboard's in its right bay, the unit's in the middle one
  const bay: [number, number] = tv ? [-xd + T / 2, xd - T / 2] : [xd + T / 2, xi];
  const sh9D = shelfD - 10;
  p.add("SH9", N.shelf, "Shelf", [bay[1] - bay[0] - 2, T, sh9D], [(bay[0] + bay[1]) / 2, ySh, zfc - 5 - sh9D / 2]);
  // legs under the bottom
  const lx = W / 2 - 45, lz = Dc / 2 - 45;
  const legAt: [number, number][] = CORNERS.map(([sx, sz]) => [sx * lx, zc + sz * lz]);
  const legIds = legAt.map(([x, z], i) => p.add(`L10-${i}`, N.legs, "Leg", [LG, LH, LG], [x, LH / 2, z]));
  const zMid = zc + Dc / 2 - 90;
  p.add("L11", N.mid, "Middle leg", [LG, LH - 10, LG], [0, LH / 2 + 5, zMid]);
  const allLegs: { id: string; x: number; z: number; top: number }[] = [...legAt.map(([x, z], i) => ({ id: legIds[i], x, z, top: LH })), { id: "L11", x: 0, z: zMid, top: LH }];
  // doors
  const dw = (W - 4) / 3, dh = y1 - 2 - (LH + 2);
  const dx = [-(dw + 2), 0, dw + 2];
  const doorIds = ["D8a", "D8b", "D8c"];
  doorIds.forEach((id, i) => p.add(id, N.door, "Door", [dw, dh, FTT], [dx[i], LH + 2 + dh / 2, D / 2 - FTT / 2], "board", ribbed(dw, dh)));

  const ups = [{ x: -(W / 2 - T / 2), id: "S2" }, ...divs.map((d) => ({ x: d.x, id: d.id })), { x: W / 2 - T / 2, id: "S5" }];
  const isDiv = (id: string) => id.startsWith("V");
  const zMidOf = (id: string) => (isDiv(id) ? (zdv0 + zfc - T) / 2 : zc);
  const halfOf = (id: string) => (isDiv(id) ? (zfc - T - zdv0) / 2 : Dc / 2);
  const zBolt = (id: string) => [zMidOf(id) - (halfOf(id) - 70), zMidOf(id) + (halfOf(id) - 70)]; // cam bolts along the top edges
  const zDowel = (id: string) => [zMidOf(id) - (halfOf(id) - 30), zMidOf(id) + (halfOf(id) - 30)];
  const zScrew = (id: string) => [zMidOf(id) - (halfOf(id) - 110), zMidOf(id) + (halfOf(id) - 110)];
  // a cam lock in the face of an upright: the sides' inside faces, a divider's left face
  const camFace = (u: (typeof ups)[number]): { x: number; dir: Vec3 } => (u.id === "S2" ? { x: -xi, dir: [-1, 0, 0] } : u.id === "S5" ? { x: xi, dir: [1, 0, 0] } : { x: u.x - T / 2, dir: [1, 0, 0] });
  const yRail = y1 - RH / 2;
  const steps: CustomStep[] = [];
  const back_ = "+z" as const, flip = "-y" as const;

  const baseIds = ["B6", ...allLegs.map((l) => l.id)];
  const baseOff: Vec3 = [0, 0, 450];
  steps.push({
    title: "Bolt the legs under the bottom",
    detail: "A thick dowel (H) in the top of each leg, set the bottom (6) on them and drive a bolt (G) through it into each leg with the Allen key. A felt pad (N) under each of the four corner legs and the adjustable foot (F) screwed into the middle leg (11).",
    fix: [
      ...allLegs.map((l) => fx(H_.H, [[l.x + 12, l.top, l.z + 12]], [0, -1, 0], l.id, "B6")),
      ...allLegs.map((l) => fx(H_.G, [[l.x, LH + T, l.z]], [0, -1, 0], "B6", l.id)),
      ...allLegs.slice(0, 4).map((l) => fx(H_.N, [[l.x, 0, l.z]], [0, 1, 0], l.id)),
      fx(H_.F, [[0, 10, zMid]], [0, 1, 0], "L11"),
    ],
    wait: baseIds,
    from: offset(baseIds, baseOff),
    tools: ["allen"],
    kind: "legs",
  });
  const topBolts = ups.flatMap((u) => zBolt(u.id).map((z): Vec3 => [u.x, y1, z]));
  const sideOff: Record<string, Vec3> = { S2: [-250, 0, 0], S5: [250, 0, 0], T1: [(W - T + 250 * 1.6 + 120) / 1.6, 0, 0], V4: [0, 0, -300], V3: [0, 0, -300] };
  const railBolt = (g: number): Vec3 => [g * xi, yRail, zfc - T / 2];
  const shelfZ = [zShelf - (shelfD / 2 - 60), zShelf + (shelfD / 2 - 60)];
  if (!tv) {
    steps.push({
      title: "Turn cam bolts into the sides, the divider and the top",
      detail: "Cam bolts (A): three into the left side (2), two into the divider (4) for the fixed shelf, one into the right side (5) for the front rail and six into the underside of the top, by hand until they stop.",
      fix: [
        fx(H_.A, [railBolt(-1), ...shelfZ.map((z): Vec3 => [-xi, ySh, z])], [-1, 0, 0], "S2"),
        fx(H_.A, shelfZ.map((z): Vec3 => [xd - T / 2, ySh, z]), [1, 0, 0], "V4"),
        fx(H_.A, [railBolt(1)], [1, 0, 0], "S5"),
        fx(H_.A, topBolts, [0, 1, 0], "T1"),
      ],
      wait: ["S2", "V4", "S5", "T1"],
      from: sideOff,
      tools: ["screwdriver"],
    });
    steps.push({
      title: "Join the left side and the divider with the fixed shelf",
      detail: "Lay them on their back edges. Two dowels (C) in the left side and two in the divider, push the fixed shelf (3) onto them and the cam bolts, and lock its four cam locks (B).",
      add: ["S2", "V4", "SH3"],
      fix: [
        fx(H_.C, shelfZ.map((z): Vec3 => [-xi, ySh, (z + zShelf) / 2]), [-1, 0, 0], "S2", "SH3"),
        fx(H_.C, shelfZ.map((z): Vec3 => [xd - T / 2, ySh, (z + zShelf) / 2]), [1, 0, 0], "V4", "SH3"),
        fx(H_.B, shelfZ.map((z): Vec3 => [-xi + 25, ySh + T / 2, z]), [0, -1, 0], "SH3"),
        fx(H_.B, shelfZ.map((z): Vec3 => [xd - T / 2 - 25, ySh + T / 2, z]), [0, -1, 0], "SH3"),
      ],
      from: { SH3: [0, 0, 400] },
      pose: back_,
      tools: ["screwdriver"],
      warnings: ["floor"],
    });
    steps.push({
      title: "Fit the top front rail",
      detail: "Rest the rail (13) in the divider's notch, push it onto the left side's cam bolt and put a cam lock (B) in each end: lock the left one now, the right one when the right side is on.",
      add: ["R13"],
      fix: SX.map((g) => fx(H_.B, [[g * (xi - 25), yRail, zfc - T]], [0, 0, 1], "R13")),
      from: { R13: [0, 0, 400] },
      pose: back_,
      tools: ["screwdriver"],
    });
    steps.push({
      title: "Slide in the upper left back panel",
      detail: "Smooth side in, along the grooves from the open top end until it reaches the fixed shelf.",
      add: ["K7u"],
      from: { K7u: [0, 500, 0] },
      pose: back_,
    });
    steps.push({
      title: "Fit the right side and the top",
      detail: "Push the right side (5) onto the rail's end and lock the rail's right cam lock. Two dowels (C) into the top edges of each side, the divider and the rail, push the top on and lock its six cam locks (B), then drive three long screws (E) through the rail into the top.",
      add: ["S5", "T1"],
      fix: [
        ...ups.map((u) => fx(H_.C, zDowel(u.id).map((z): Vec3 => [u.x, y1, z]), [0, -1, 0], u.id, "T1")),
        fx(H_.C, [-W / 4, W / 4].map((x): Vec3 => [x, y1, zfc - T / 2]), [0, -1, 0], "R13", "T1"),
        ...ups.map((u) => fx(H_.B, zBolt(u.id).map((z): Vec3 => [camFace(u).x, y1 - 25, z]), camFace(u).dir, u.id)),
        fx(H_.E, [-W / 3, 0, W / 3].map((x): Vec3 => [x, y1 - RH, zfc - T / 2]), [0, 1, 0], "R13", "T1"),
      ],
      pose: back_,
      tools: ["screwdriver"],
    });
    steps.push({
      title: "Slide in the lower left and right back panels",
      detail: "Smooth side in, along the grooves from the open bottom end: the second left panel (7) up to the fixed shelf and the right one (12) all the way up.",
      add: ["K7l", "K12"],
      from: { K7l: [0, -500, 0], K12: [0, -500, 0] },
      pose: back_,
    });
  } else {
    steps.push({
      title: "Turn cam bolts into the sides and the top",
      detail: "Cam bolts (A): one into each side (2, 5) for the front rail and eight into the underside of the top, by hand until they stop.",
      fix: [fx(H_.A, [railBolt(-1)], [-1, 0, 0], "S2"), fx(H_.A, [railBolt(1)], [1, 0, 0], "S5"), fx(H_.A, topBolts, [0, 1, 0], "T1")],
      wait: ["S2", "S5", "T1"],
      from: sideOff,
      tools: ["screwdriver"],
    });
    steps.push({
      title: "Join the sides with the top front rail",
      detail: "Lay the sides on their back edges, push the rail (12) onto their cam bolts and lock a cam lock (B) at each end.",
      add: ["S2", "S5", "R13"],
      fix: SX.map((g) => fx(H_.B, [[g * (xi - 25), yRail, zfc - T]], [0, 0, 1], "R13")),
      from: { R13: [0, 0, 400] },
      pose: back_,
      tools: ["screwdriver"],
      warnings: ["floor"],
    });
    const sideUps = ups.filter((u) => !isDiv(u.id));
    steps.push({
      title: "Fix the top on",
      detail: "Two dowels (C) into the top edge of each side and two into the rail, push the top on, lock the four cam locks (B) and drive three long screws (E) through the rail into the top.",
      add: ["T1"],
      fix: [
        ...sideUps.map((u) => fx(H_.C, zDowel(u.id).map((z): Vec3 => [u.x, y1, z]), [0, -1, 0], u.id, "T1")),
        fx(H_.C, [-W / 4, W / 4].map((x): Vec3 => [x, y1, zfc - T / 2]), [0, -1, 0], "R13", "T1"),
        ...sideUps.map((u) => fx(H_.B, zBolt(u.id).map((z): Vec3 => [camFace(u).x, y1 - 25, z]), camFace(u).dir, u.id)),
        fx(H_.E, [-W / 3, 0, W / 3].map((x): Vec3 => [x, y1 - RH, zfc - T / 2]), [0, 1, 0], "R13", "T1"),
      ],
      pose: back_,
      tools: ["screwdriver"],
    });
    const divUps = ups.filter((u) => isDiv(u.id));
    steps.push({
      title: "Turn it upside down, fit the dividers and the back",
      detail: "Two dowels (C) into the top for each divider (3, 4), stand them on the top's cam bolts and lock two cam locks (B) in each. Then slide the back (7) down the grooves from the open bottom, the cable hole in the middle bay.",
      add: ["V3", "V4", "K7"],
      fix: [...divUps.map((u) => fx(H_.C, zDowel(u.id).map((z): Vec3 => [u.x, y1, z]), [0, 1, 0], "T1", u.id)), ...divUps.map((u) => fx(H_.B, zBolt(u.id).map((z): Vec3 => [camFace(u).x, y1 - 25, z]), camFace(u).dir, u.id))],
      from: { V3: [0, -400, 0], V4: [0, -400, 0], K7: [0, -600, 0] },
      pose: flip,
      tools: ["screwdriver"],
    });
  }
  steps.push({
    title: "Fix the bottom and legs on",
    detail: `Two dowels (C) into the bottom edge of each side and ${tv ? "divider" : "the divider"}, push the bottom and its legs on and drive two long screws (E) through it into each.`,
    add: baseIds,
    fix: [...ups.map((u) => fx(H_.C, zDowel(u.id).map((z): Vec3 => [u.x, y0, z]), [0, 1, 0], u.id, "B6")), ...ups.map((u) => fx(H_.E, zScrew(u.id).map((z): Vec3 => [u.x, LH, z]), [0, 1, 0], "B6", u.id))],
    from: offset(baseIds, baseOff),
    pose: tv ? flip : back_,
    tools: ["screwdriver"],
  });
  // the loose shelf on four supports
  const sz = [zfc - 5 - 80, zfc - 5 - sh9D + 80]; // (clear of the fixed shelf's cam bolts on the divider's other face)
  const supFaces: { x: number; dir: Vec3; id: string }[] = tv
    ? [
        { x: -xd + T / 2, dir: [-1, 0, 0], id: "V3" },
        { x: xd - T / 2, dir: [1, 0, 0], id: "V4" },
      ]
    : [
        { x: xd + T / 2, dir: [-1, 0, 0], id: "V4" },
        { x: xi, dir: [1, 0, 0], id: "S5" },
      ];
  steps.push({
    title: "Stand it up and fit the shelf",
    detail: `Push two shelf supports (I) into each side of the ${tv ? "middle" : "right"} bay at the height you want, then rest the shelf (9) on them.`,
    add: ["SH9"],
    fix: supFaces.map((f) => fx(H_.I, sz.map((z): Vec3 => [f.x, ySh - T / 2 - 3, z]), f.dir, f.id)),
    from: { SH9: [0, 0, 450] },
    pose: "+y",
  });
  // doors: hinge cups 80 mm from the top and bottom, 22 mm in from the hinge edge
  const hy = [LH + 2 + 80, LH + 2 + dh - 80];
  const doors = [
    { id: "D8a", edge: dx[0] - dw / 2, g: 1, def: H_.J, face: -xi, fdir: [-1, 0, 0] as Vec3, on: "S2" },
    { id: "D8b", edge: dx[1] + dw / 2, g: -1, def: H_.P, face: xd - T / 2, fdir: [1, 0, 0] as Vec3, on: "V4" },
    { id: "D8c", edge: dx[2] + dw / 2, g: -1, def: H_.J, face: xi, fdir: [1, 0, 0] as Vec3, on: "S5" },
  ];
  const cupX = (d: (typeof doors)[number]) => d.edge + d.g * 22;
  const dOff: Vec3 = [0, 0, 400];
  steps.push({
    title: "Screw the hinges onto the doors",
    detail: "Lay the doors face down on a rug and press a hinge into each cup hole, two small screws (D) each: straight hinges (J) on two doors, the cranked ones (P) on the door that hangs on the divider.",
    fix: doors.flatMap((d) => [
      fx(d.def, hy.map((y): Vec3 => [cupX(d), y, zfc]), [0, 0, 1], d.id, undefined, d.g < 0 ? { twist: Math.PI } : {}),
      fx(H_.D, hy.flatMap((y) => [-12, 12].map((k): Vec3 => [cupX(d) + d.g * 24, y + k, zfc])), [0, 0, 1], d.id),
    ]),
    wait: doorIds,
    from: offset(doorIds, dOff),
    tools: ["screwdriver"],
    warnings: ["floor"],
  });
  steps.push({
    title: "Hang the doors",
    detail: `Hold each door in place and screw its hinge plates on, four small screws (D) each: the left door on the left side, the door with the cranked hinges on the ${tv ? "right divider" : "divider"} next to it, the right door on the right side.`,
    add: doorIds,
    fix: doors.map((d) => fx(H_.D, hy.flatMap((y) => [-16, 16].flatMap((k) => [zfc - 20, zfc - 52].map((z): Vec3 => [d.face, y + k, z]))), d.fdir, d.on, d.id)),
    from: offset(doorIds, dOff),
    tools: ["screwdriver"],
    kind: "doors",
  });
  // corner blocks: one at each corner of each back, screwed to the side or divider beside it
  const faceAt = (x: number, inward: 1 | -1): { x: number; dir: Vec3; id: string } => {
    const id = x <= -xi + 1 ? "S2" : x >= xi - 1 ? "S5" : x < 0 ? "V3" : "V4";
    return { x, dir: [-inward, 0, 0], id };
  };
  const strapX = [-(W / 2 - 200), W / 2 - 200];
  const nBlocks = backs.length * 4;
  steps.push({
    title: "Fit the corner blocks and the wall straps",
    detail: `Turn it round. Press a block (K) into each corner behind ${backs.length > 1 ? `the ${num(backs.length)} back panels` : "the back"} and fix it with a small screw (D), ${num(nBlocks)} in all, then screw the two wall straps (M) under the back edge of the top, one screw (D) each, their tabs hanging down behind.`,
    fix: [
      // (the blocks either side of the divider are staggered, so their screws stay apart)
      ...backs.flatMap((b) =>
        [faceAt(b.a, 1), faceAt(b.b, -1)].map((f) => fx(H_.K, b.ys.map((y, j): Vec3 => [f.x - f.dir[0] * 11, y + (f.dir[0] < 0 && isDiv(f.id) ? (j ? -22 : 22) : 0), zk]), [0, 0, 1], b.id)),
      ),
      ...backs.flatMap((b) => [faceAt(b.a, 1), faceAt(b.b, -1)].map((f) => fx(H_.D, b.ys.map((y, j): Vec3 => [f.x, y + (j ? -22 : 22) * (f.dir[0] < 0 && isDiv(f.id) ? 2 : 1), zk - 9]), f.dir, f.id))),
      fx(H_.M, strapX.map((x): Vec3 => [x, y1, -D / 2 + 15]), [0, 1, 0], "T1"),
      fx(H_.D, strapX.map((x): Vec3 => [x, y1, -D / 2 + 40]), [0, 1, 0], "T1"),
    ],
    tools: ["screwdriver"],
  });
  const wy = y1 - 20; // through the strap's tab
  steps.push({
    title: "Fix it to the wall",
    detail: `Push it against the wall, mark through the two straps, drill, push in the plugs (L) and drive a long screw (E) through each strap. Check for pipes and cables first${tv ? ", and fix the TV to the wall too" : ""}.`,
    fix: [fx(H_.L, strapX.map((x): Vec3 => [x, wy, -D / 2 - 25]), [0, 0, -1]), fx(H_.E, strapX.map((x): Vec3 => [x, wy, -D / 2]), [0, 0, -1], "T1")],
    tools: ["drill", "screwdriver", "pencil"],
    wall: true,
    warnings: ["wall", "tip"],
  });
  return { parts: p.list, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  switch (s.slug) {
    case "kmart-willow-bedside-table":
      return bedside(s);
    case "kmart-willow-3-drawer-chest":
      return chest(s);
    case "kmart-willow-2-tier-shoe-cabinet":
      return shoeCabinet(s);
    case "kmart-willow-3-door-sideboard":
      return cabinet(s, "sideboard");
    case "kmart-willow-entertainment-unit":
      return cabinet(s, "tv");
    default:
      return null;
  }
}

const family: Family = { names: ["KMART:WILLOW"], recipe };
export default family;
