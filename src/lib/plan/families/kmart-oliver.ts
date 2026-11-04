import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartMaterial, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's Oliver range (sold under Anko), read from its assembly manuals. Every piece stands on two side frames that
 * come made up: two square legs, a panel between them and a rail low down. The panels, shelves and rails between the
 * frames go on cam bolts (turned into the frames) and cam locks, with dowels where the manual has them; the build lies
 * on one frame, the other goes on top, it is stood up, the top back panel slides down the grooves and the top (a board
 * with a deep edge underneath) goes on cam bolts and dowels. Plastic corner blocks hold the back panels in.
 *
 * - Bedside Table (keycode 43707386): runners and four cam bolts in each frame; the drawer shelf (3) and the bottom
 *   shelf (4), its two rails (5) screwed underneath, stand on frame 1 and frame 2 goes on top, felt pads under the
 *   legs. The drawer: front (8) on cam bolts, sides (9, 10), bottom (11) slid in, back (12) screwed, runners and the
 *   knob. Stood up, the back panel (6) slides in, the top (7) goes on, four corner blocks, the drawer, a wall strap.
 *   Hardware: 16 cam bolts (A), 16 cam locks (B), 12 dowels (C), 12 small screws (D) for the runners, the knob (F)
 *   and its screw (E), 4 long screws (G) for the rails, 4 screws (H) for the drawer back, 4 felt pads (I), 4 corner
 *   blocks (K) and their screws (J), a left and a right cabinet runner (CL, CR) and drawer runner (DL, DR), and a
 *   wall kit (L: strap, small screw, wall screw and plug).
 * - Bookshelf (43707409): dowels in the two shelves (3) and the bottom shelf (4), its two rails (5) screwed on; nine
 *   cam bolts in each frame; the top rail (5), the shelves and the bottom stand on frame 2, the two lower back panels
 *   (6) slide in, frame 1 goes on top with the felt pads, and the top (8) takes its cam bolts and wall brackets. Stood
 *   up, the top back panel (7) slides in and the top goes on. Twelve corner blocks and two brackets to the wall.
 *   Hardware: 22 cam bolts (A), 22 cam locks (B), 22 dowels (C), 6 long screws (D), 4 felt pads (E), 12 corner blocks
 *   (G) and screws (F), two wall kits (H: bracket, small screw, wall screw and plug).
 * - 3 Drawer Chest (43707393): three cabinet runners and eleven cam bolts in each frame; the back rail (6), the top
 *   rail (5) and the two front rails (8) stand on frame 3, then the bottom (4) with its rails (5) screwed underneath;
 *   the lower back panel (7) slides in and frame 2 goes on top. Stood up, the upper back panel (15) slides in and the
 *   top (1), with its cam bolts and wall brackets, goes on. Three drawers: front (9) with five cam bolts, sides (10,
 *   11) and a brace (13) locked on, bottom (14) slid in, back (12) screwed, runners and a knob. Corner blocks, the
 *   wall, the drawers. Hardware: 14 dowels (A), 6 long screws (B), 15 screws (C) for the drawer backs, 41 cam bolts
 *   (D), 41 cam locks (E), 42 small screws (F) for the runners, 3 knobs (H) and screws (G), 8 corner blocks (J) and
 *   screws (I), 4 felt pads (K), three of each runner (CL, CR, DL, DR), two wall kits (L).
 *   Its parts list prints one of part 5 and three of part 7, but its drawings use three rails 5 (the top rail and the
 *   two under the bottom, as the bookshelf's) and one lower back panel 7: the two counts look swapped, so the guide
 *   follows the drawings. Its step 11 (backs, then runners and knobs, on all three drawers) is two guide steps, as one
 *   guide step holds no more than 24 groups of fittings: the guide has 15 steps for its 14.
 * - 2 Door Cabinet with Drawer (43707454): built as the bookshelf, with a flat rail (6) under the drawer and a shelf
 *   (3) halfway down the cupboard; the lower back (7) slides in lying, the upper back (8) standing. One drawer as the
 *   chest's (front 10, sides 11 and 12, brace 13, bottom 14, back 15, two knobs) and two doors (16) on four cup hinges,
 *   with a knob each and a door stop inside. Hardware: 27 cam bolts (A), 27 cam locks (B), 18 dowels (C), 14 small
 *   screws (D) for the runners, 6 long screws (E), 2 door stops and screws (F), 4 hinges (G), 2 door knob screws
 *   (H), 2 drawer knob screws (I), 4 knobs (J), 8 corner block screws (K), 8 corner blocks (L), 5 screws (M) for the
 *   drawer back, 4 felt pads (N), two wall kits (O), the runners and 24 hinge screws (P).
 *   Its steps are numbered 1 to 4, 6 to 10 and 12 to 14: there is no step 5 or 11. Its step 8 (the top's bolts and
 *   brackets fitted upside down, then the top put on) and step 12 (hinges and knobs on the doors, then the doors
 *   hung) each do two jobs and are two guide steps each, so the guide has 14 steps for its 12.
 *
 * The bedside and bookshelf manuals print a second number after the keycode (72429310, 72429327): it isn't a Kmart
 * keycode. None of the manuals prints a measurement, so the outer size is Kmart's listing and the rest is sized from
 * the drawings. Part numbers and hardware letters are Kmart's own, so the guide reads against the paper.
 */

const L = 40; // the legs, square
const PT = 22; // the side frames' panels, flush with the legs inside
const RT = 20; // the side frames' bottom rails
const T = 16; // shelves and panels
const TT = 30; // the top, with its deep edge
const LIP = 14; // how deep the top's edge hangs below its board
const EDGE = 50; // how wide that edge is
const OV = 15; // the top overhangs the frames all round
const BK = 3; // hardboard
const FT = 18; // drawer fronts and doors
const ST = 15; // drawer sides and backs
const RH = 50; // the rails (5), on edge
const RD = 18; // their thickness
const FLAT = 80; // the flat front rails, front to back
const Y5 = 100; // the rails under the bottom stand this far off the floor
const OUT = 450; // drawers and doors are built this far in front

type Def = { kind: CustomFix["kind"]; len: number; dia: number; name?: string; included?: boolean };
const CAM_BOLT: Def = { kind: "camScrew", len: 35, dia: 6, name: "Cam bolt" };
const CAM: Def = { kind: "cam", len: 10, dia: 15, name: "Cam lock" };
const DOWEL: Def = { kind: "dowel", len: 30, dia: 6 };
const PAD: Def = { kind: "glide", len: 3, dia: 20, name: "Felt pad" };
const BLOCK: Def = { kind: "angle", len: 16, dia: 20, name: "Corner block" };
const BLOCK_SCREW: Def = { kind: "screw", len: 14, dia: 3, name: "Corner block screw" };
const KNOB: Def = { kind: "knob", len: 25, dia: 30, name: "Knob" };
const SCREW_40: Def = { kind: "screw", len: 40, dia: 4 };
const SCREW_30: Def = { kind: "screw", len: 30, dia: 4 };
const SCREW_25: Def = { kind: "screw", len: 25, dia: 4 };
const KNOB_SCREW: Def = { kind: "screw", len: 16, dia: 4, name: "Knob screw" };
const KNOB_SCREW_SHORT: Def = { kind: "screw", len: 10, dia: 4, name: "Knob screw" };
const RUNNER_SCREW_12: Def = { kind: "screw", len: 12, dia: 3.5, name: "Runner screw" };
const RUNNER_SCREW_10: Def = { kind: "screw", len: 10, dia: 3.5, name: "Runner screw" };
const BRACKET: Def = { kind: "angle", len: 50, dia: 20, name: "Wall bracket" };
const BRACKET_SCREW: Def = { kind: "screw", len: 12, dia: 4, name: "Bracket screw" };
const STRAP: Def = { kind: "strap", len: 110, dia: 20, name: "Wall strap" };
const STRAP_SCREW: Def = { kind: "screw", len: 12, dia: 4, name: "Strap screw" };
const WALL_SCREW: Def = { kind: "screw", len: 40, dia: 4, name: "Wall screw", included: true };
const WALL_PLUG: Def = { kind: "plug", len: 30, dia: 6, included: true };
const HINGE: Def = { kind: "hinge", len: 50, dia: 35, name: "Hinge" };
const HINGE_SCREW: Def = { kind: "screw", len: 12, dia: 4, name: "Hinge screw" };
const STOP: Def = { kind: "cap", len: 8, dia: 18, name: "Door stop" };
const STOP_SCREW: Def = { kind: "screw", len: 12, dia: 3, name: "Door stop screw" };
const runner = (len: number, name: string): Def => ({ kind: "runner", len, dia: 30, name });

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

const SX = [-1, 1] as const;
const offset = (ids: string[], v: Vec3) => Object.fromEntries(ids.map((id) => [id, v] as [string, Vec3]));

class Parts {
  list: CustomPart[] = [];
  add(id: string, label: string, name: string, size: Vec3, pos: Vec3, material: PartMaterial = "board", pieces?: PartPiece[]) {
    this.list.push({ id, label, name, size, pos, material, ...(pieces ? { pieces } : {}) });
    return id;
  }
}

/** A board with notches cut out of it: drawn as the boxes that are left, given in the product's frame. */
function notched(boxes: { min: Vec3; max: Vec3 }[]): { size: Vec3; pos: Vec3; pieces: PartPiece[] } {
  const lo = [0, 1, 2].map((k) => Math.min(...boxes.map((b) => b.min[k]))) as Vec3;
  const hi = [0, 1, 2].map((k) => Math.max(...boxes.map((b) => b.max[k]))) as Vec3;
  const pos = [0, 1, 2].map((k) => (lo[k] + hi[k]) / 2) as Vec3;
  const size = [0, 1, 2].map((k) => hi[k] - lo[k]) as Vec3;
  const pieces: PartPiece[] = boxes.map((b) => ({
    shape: "box",
    size: [0, 1, 2].map((k) => b.max[k] - b.min[k]) as Vec3,
    pos: [0, 1, 2].map((k) => (b.min[k] + b.max[k]) / 2 - pos[k]) as Vec3,
  }));
  return { size, pos, pieces };
}

/* ---------- what every piece shares: the frames, the top, the joints between the frames ---------- */

interface G {
  W: number;
  H: number;
  D: number;
  HL: number; // the legs' tops, under the top
  xo: number; // the frames' outside faces
  xi: number; // their inside faces: legs and panels
  zf: number; // the front legs' front faces
  zb: number; // the back legs' back faces
  zp0: number; // the frames' panels run between the legs, from here
  zp1: number; // to here
  zk: number; // the back panels' back faces, in grooves just in front of the back legs
}

function geom(s: ProductSpec): G {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xo = W / 2 - OV, zf = D / 2 - OV;
  return { W, H, D, HL: H - TT, xo, xi: xo - L, zf, zb: -zf, zp0: -zf + L, zp1: zf - L, zk: -zf + L + 8 };
}

/** A side frame as it comes: two legs, a panel between them (from `panel[0]` up to the top) and a rail low down. */
function sideFrame(g: G, sx: -1 | 1, id: string, label: string, name: string, panel: [number, number]): CustomPart {
  const cy = g.HL / 2, span = g.zp1 - g.zp0, zm = (g.zp0 + g.zp1) / 2;
  const pieces: PartPiece[] = [
    { shape: "box", size: [L, g.HL, L], pos: [0, 0, g.zf - L / 2] },
    { shape: "box", size: [L, g.HL, L], pos: [0, 0, g.zb + L / 2] },
    { shape: "box", size: [PT, panel[1] - panel[0], span], pos: [sx * (PT / 2 - L / 2), (panel[0] + panel[1]) / 2 - cy, zm] },
    { shape: "box", size: [RT, RH, span], pos: [sx * (RT / 2 - L / 2), Y5 + RH / 2 - cy, zm] },
  ];
  return { id, label, name, size: [L, g.HL, g.zf - g.zb], pos: [sx * (g.xo - L / 2), cy, 0], material: "board", pieces };
}

/** The top: a board with a deep edge round its underside, as the manuals draw it. */
function topPart(g: G, id: string, label: string): CustomPart {
  const { W, D } = g;
  const ly = -TT / 2 + LIP / 2;
  const pieces: PartPiece[] = [
    { shape: "box", size: [W, TT - LIP, D], pos: [0, LIP / 2, 0] },
    { shape: "box", size: [W, LIP, EDGE], pos: [0, ly, D / 2 - EDGE / 2] },
    { shape: "box", size: [W, LIP, EDGE], pos: [0, ly, -(D / 2 - EDGE / 2)] },
    { shape: "box", size: [EDGE, LIP, D - 2 * EDGE], pos: [-(W / 2 - EDGE / 2), ly, 0] },
    { shape: "box", size: [EDGE, LIP, D - 2 * EDGE], pos: [W / 2 - EDGE / 2, ly, 0] },
  ];
  return { id, label, name: "Top", size: [W, TT, D], pos: [0, g.H - TT / 2, 0], material: "board", pieces };
}

/** A part held between the frames: the cam bolts turned into each frame for it, its dowels, and the face its cam locks are in. */
interface Joint {
  id: string;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
  bolts: [number, number][]; // y, z on a frame's inside face
  dowels: [number, number][];
  cams: "under" | "over" | "back" | "front";
}

/** A shelf or panel lying flat: two cam bolts and (when it has them) two dowels at each end, cam locks underneath. */
const panelJoint = (id: string, y0: number, z0: number, z1: number, dowels = true): Joint => {
  const d = z1 - z0, y = y0 + T / 2;
  return {
    id,
    y0,
    y1: y0 + T,
    z0,
    z1,
    bolts: [
      [y, z0 + 0.2 * d],
      [y, z1 - 0.2 * d],
    ],
    dowels: dowels
      ? [
          [y, z0 + 0.4 * d],
          [y, z1 - 0.4 * d],
        ]
      : [],
    cams: "under",
  };
};
/** A rail on edge: one cam bolt at each end (two for a tall one), its cam locks in the face that looks into the piece. */
const railJoint = (id: string, y0: number, y1: number, z0: number, z1: number, front: boolean, n = 1): Joint => {
  const ym = (y0 + y1) / 2, zm = (z0 + z1) / 2;
  const bolts: [number, number][] = n === 1 ? [[ym, zm]] : [ym - 15, ym + 15].map((y): [number, number] => [y, zm]);
  return { id, y0, y1, z0, z1, bolts, dowels: [], cams: front ? "back" : "front" };
};
/** A flat front rail: two cam bolts at each end, its cam locks on top. */
const flatJoint = (id: string, y0: number, z0: number, z1: number): Joint => ({
  id,
  y0,
  y1: y0 + T,
  z0,
  z1,
  bolts: [
    [y0 + T / 2, z1 - 20],
    [y0 + T / 2, z0 + 20],
  ],
  dowels: [],
  cams: "over",
});

const CAM_DIR: Record<Joint["cams"], Vec3> = { under: [0, 1, 0], over: [0, -1, 0], back: [0, 0, 1], front: [0, 0, -1] };
function camAt(g: G, j: Joint, sx: number, y: number, z: number): Vec3 {
  const x = sx * (g.xi - 25);
  if (j.cams === "under") return [x, j.y0, z];
  if (j.cams === "over") return [x, j.y1, z];
  return [x, y, j.cams === "back" ? j.z0 : j.z1];
}
const frameBolts = (g: G, sx: number, frame: string, js: Joint[]) => fx(CAM_BOLT, js.flatMap((j) => j.bolts.map(([y, z]): Vec3 => [sx * g.xi, y, z])), [sx, 0, 0], frame);
const jointCams = (g: G, sx: number, js: Joint[]) => js.map((j) => fx(CAM, j.bolts.map(([y, z]) => camAt(g, j, sx, y, z)), CAM_DIR[j.cams], j.id));
const jointDowels = (g: G, sx: number, frame: string, js: Joint[]) =>
  js.filter((j) => j.dowels.length).map((j) => fx(DOWEL, j.dowels.map(([y, z]): Vec3 => [sx * g.xi, y, z]), [-sx, 0, 0], j.id, frame));
const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
/** How many cam bolts a frame takes, in words. */
const countBolts = (js: Joint[]) => {
  const n = js.reduce((a, j) => a + j.bolts.length, 0);
  return WORDS[n] ?? String(n);
};

/** The two rails (5) under the bottom shelf: two dowels and two long screws each, the shelf lying upside down on them. */
function railsUnder(g: G, shelf: string, rails: { id: string; z: number }[], screw: Def): CustomFix[] {
  const w = 2 * g.xi;
  return [
    ...rails.map((r) => fx(DOWEL, [-0.2 * w, 0.2 * w].map((x): Vec3 => [x, Y5 + RH, r.z]), [0, 1, 0], shelf, r.id)),
    ...rails.map((r) => fx(screw, [-0.38 * w, 0.38 * w].map((x): Vec3 => [x, Y5, r.z]), [0, 1, 0], r.id, shelf)),
  ];
}

/** The top's cam bolts and dowels: two of each over every frame, the bolts locked by cams inside the frames. */
function topJoints(g: G, top: string, frames: [string, string]) {
  const span = g.zp1 - g.zp0, xt = g.xi + PT / 2;
  const zb = [g.zp0 + 0.15 * span, g.zp1 - 0.15 * span], zd = [g.zp0 + 0.35 * span, g.zp1 - 0.35 * span];
  return {
    bolts: SX.map((sx, i) => fx(CAM_BOLT, zb.map((z): Vec3 => [sx * xt, g.HL, z]), [0, 1, 0], top, frames[i])),
    dowels: SX.map((sx, i) => fx(DOWEL, zd.map((z): Vec3 => [sx * xt, g.HL, z]), [0, -1, 0], frames[i], top)),
    cams: SX.map((sx, i) => fx(CAM, zb.map((z): Vec3 => [sx * g.xi, g.HL - 25, z]), [sx, 0, 0], frames[i])),
  };
}
/** The top rail (5) under the front of the top: two dowels in its top edge, two long screws up through it. */
const topRailDowels = (g: G, rail: string, top: string) => fx(DOWEL, [-g.W / 4, g.W / 4].map((x): Vec3 => [x, g.HL, g.zf - RD / 2]), [0, -1, 0], rail, top);
const topRailScrews = (g: G, rail: string, top: string, screw: Def) => fx(screw, [-g.W / 4 - 60, g.W / 4 + 60].map((x): Vec3 => [x, g.HL - RH, g.zf - RD / 2]), [0, 1, 0], rail, top);

/** A corner block behind each corner of every back panel, screwed to the frame beside it. */
function cornerBlocks(g: G, backs: { id: string; y0: number; y1: number }[], frames: [string, string], screw: Def): CustomFix[] {
  return [
    ...backs.map((b) => fx(BLOCK, SX.flatMap((sx) => [b.y0 + 15, b.y1 - 15].map((y): Vec3 => [sx * (g.xi - 10), y, g.zk])), [0, 0, 1], b.id)),
    ...SX.map((sx, i) => fx(screw, backs.flatMap((b) => [b.y0 + 40, b.y1 - 40].map((y): Vec3 => [sx * g.xi, y, g.zk - 9])), [sx, 0, 0], frames[i])),
  ];
}
/** A felt pad under every leg. */
const pads = (g: G, frames: [string, string]) => SX.map((sx, i) => fx(PAD, [g.zf - L / 2, g.zb + L / 2].map((z): Vec3 => [sx * (g.xo - L / 2), 0, z]), [0, 1, 0], frames[i]));
/** Two wall brackets under the top at the back, a small screw each. */
const wallXs = (g: G) => [-0.3 * g.W, 0.3 * g.W];
const brackets = (g: G, top: string) => [fx(BRACKET, wallXs(g).map((x): Vec3 => [x, g.HL, -g.D / 2 + 25]), [0, 1, 0], top), fx(BRACKET_SCREW, wallXs(g).map((x): Vec3 => [x, g.HL, -g.D / 2 + 49]), [0, 1, 0], top)];
const bracketsToWall = (g: G, top: string) => [
  fx(WALL_PLUG, wallXs(g).map((x): Vec3 => [x, g.HL - 18, -g.D / 2 - 25]), [0, 0, -1]),
  fx(WALL_SCREW, wallXs(g).map((x): Vec3 => [x, g.HL - 18, -g.D / 2 + 8]), [0, 0, -1], top),
];
const WALL_DETAIL = "Push it against the wall and mark through the two brackets, then drill, push in the plugs and drive the wall screws from the box. Check the wall for pipes and cables first.";

/* ---------- drawers ---------- */

interface DrawerGeo {
  y0: number; // the opening
  y1: number;
  xb: number; // the box's sides' outside faces, clear of the runners
  yb: number; // the box's underside
  sh: number; // its sides' height
  DD: number; // its depth
  zbk: number; // its back's back face
  RL: number; // runner length
  zr: number; // runners' centres
  yc: number; // the cabinet runners
  yd: number; // the drawer runners, along the sides' bottom edges
  fy: number; // the front's middle
}
function drawerGeo(g: G, y0: number, y1: number, zlim: number): DrawerGeo {
  const yb = y0 + 14, DD = Math.floor(g.zf - FT - (zlim + 8));
  const RL = Math.min(450, Math.floor((DD - 10) / 50) * 50);
  return { y0, y1, xb: g.xi - 12.5, yb, sh: y1 - 15 - yb, DD, zbk: g.zf - FT - DD, RL, zr: g.zf - FT - 5 - RL / 2, yc: yb + 30, yd: yb + 10, fy: (y0 + y1) / 2 };
}
interface DrawerIds {
  f: string;
  l: string;
  r: string;
  bk: string;
  bt: string;
  br?: string;
}
type DrawerLabels = { front: string; left: string; right: string; back: string; bottom: string; brace?: string };
const idsOf = (d: DrawerIds) => [d.f, d.l, d.r, d.bt, d.bk, ...(d.br ? [d.br] : [])];

function drawerParts(p: Parts, g: G, d: DrawerGeo, tag: string, N: DrawerLabels): DrawerIds {
  const ids: DrawerIds = { f: `D${tag}f`, l: `D${tag}l`, r: `D${tag}r`, bk: `D${tag}k`, bt: `D${tag}b`, ...(N.brace ? { br: `D${tag}c` } : {}) };
  const zc = g.zf - FT - d.DD / 2, iw = 2 * (d.xb - ST);
  p.add(ids.f, N.front, "Drawer front", [2 * g.xi - 4, d.y1 - d.y0 - 4, FT], [0, d.fy, g.zf - FT / 2]);
  p.add(ids.l, N.left, "Drawer side, left", [ST, d.sh, d.DD], [-(d.xb - ST / 2), d.yb + d.sh / 2, zc]);
  p.add(ids.r, N.right, "Drawer side, right", [ST, d.sh, d.DD], [d.xb - ST / 2, d.yb + d.sh / 2, zc]);
  p.add(ids.bk, N.back, "Drawer back", [iw, d.sh, ST], [0, d.yb + d.sh / 2, d.zbk + ST / 2]);
  // the bottom slides along grooves in the sides into the front; a brace, where there is one, runs under it front to back
  const by = d.yb + (N.brace ? T : 10), bl = d.DD - ST + 6;
  p.add(ids.bt, N.bottom, "Drawer bottom", [iw + 12, BK, bl], [0, by + BK / 2, d.zbk + ST + bl / 2], "fiber");
  if (ids.br) p.add(ids.br, N.brace!, "Drawer brace", [60, T, d.DD - ST], [0, d.yb + T / 2, d.zbk + ST + (d.DD - ST) / 2]);
  return ids;
}

/** A drawer's fittings, in the order the manuals fit them: the box on its front, the back, the runners, the knobs. */
function drawerFits(g: G, d: DrawerGeo, ids: DrawerIds, o: { backScrew: Def; runScrew: Def; runScrews: number; knobs: number[]; knobScrew: Def }) {
  const yCam = [d.yb + 0.4 * d.sh, d.yb + 0.8 * d.sh], yScr = [d.yb + 0.3 * d.sh, d.yb + 0.7 * d.sh];
  const side = (sx: number) => (sx < 0 ? ids.l : ids.r);
  const zf = g.zf - FT; // the front's back face
  const box: CustomFix[] = [
    ...SX.map((sx) => fx(CAM_BOLT, yCam.map((y): Vec3 => [sx * (d.xb - ST / 2), y, zf]), [0, 0, 1], ids.f, side(sx))),
    ...(ids.br ? [fx(CAM_BOLT, [[0, d.yb + T / 2, zf]], [0, 0, 1], ids.f, ids.br)] : []),
    ...SX.map((sx) => fx(CAM, yCam.map((y): Vec3 => [sx * d.xb, y, zf - 25]), [-sx, 0, 0], side(sx))),
    ...(ids.br ? [fx(CAM, [[0, d.yb, zf - 25]], [0, 1, 0], ids.br)] : []),
  ];
  const back: CustomFix[] = [
    ...SX.map((sx) => fx(o.backScrew, yScr.map((y): Vec3 => [sx * d.xb, y, d.zbk + ST / 2]), [-sx, 0, 0], side(sx), ids.bk)),
    ...(ids.br ? [fx(o.backScrew, [[0, d.yb + T / 2, d.zbk]], [0, 0, 1], ids.bk, ids.br)] : []),
  ];
  const ks = o.runScrews === 2 ? [-0.6, 0.6] : [-0.75, 0.25, 0.8];
  const runners: CustomFix[] = SX.flatMap((sx) => [
    fx(runner(d.RL, sx < 0 ? "Drawer runner, left" : "Drawer runner, right"), [[sx * d.xb, d.yd, d.zr]], [-sx, 0, 0], side(sx)),
    fx(o.runScrew, ks.map((k): Vec3 => [sx * d.xb, d.yd, d.zr + (k * d.RL) / 2]), [-sx, 0, 0], side(sx)),
  ]);
  const knobs: CustomFix[] = [fx(KNOB, o.knobs.map((x): Vec3 => [x, d.fy, g.zf + 4]), [0, 0, -1], ids.f), fx(o.knobScrew, o.knobs.map((x): Vec3 => [x, d.fy, zf - 4]), [0, 0, 1], ids.f)];
  return { box, back, runners, knobs };
}

/** The cabinet runners for a frame: one per drawer, wheel to the front, four small screws each. */
function cabRunners(g: G, sx: number, frame: string, ds: DrawerGeo[], screw: Def): CustomFix[] {
  return [
    fx(runner(ds[0].RL, sx < 0 ? "Cabinet runner, left" : "Cabinet runner, right"), ds.map((d): Vec3 => [sx * g.xi, d.yc, d.zr]), [sx, 0, 0], frame),
    fx(screw, ds.flatMap((d) => [-0.85, -0.35, 0.35, 0.85].map((k): Vec3 => [sx * g.xi, d.yc, d.zr + (k * d.RL) / 2])), [sx, 0, 0], frame),
  ];
}

/* ---------- the bedside table ---------- */

function bedside(s: ProductSpec): CustomParams {
  const g = geom(s);
  const { W, D, HL, xi, zf, zp0, zp1, zk } = g;
  const y3 = HL - 165; // the drawer shelf's underside: the frames' upper panels reach down to it
  const yB = Y5 + RH; // the bottom shelf, on the rails
  const p = new Parts();
  const frames: [string, string] = ["F1", "F2"];
  p.list.push(sideFrame(g, -1, "F1", "1", "Left side frame", [y3, HL]), sideFrame(g, 1, "F2", "2", "Right side frame", [y3, HL]));
  p.add("P3", "3", "Drawer shelf", [2 * xi, T, zf - zp0], [0, y3 + T / 2, (zf + zp0) / 2]);
  // the bottom shelf is notched round the front legs, its ends resting on the frames' bottom rails
  const sh = notched([
    { min: [-xi, yB, zp0], max: [xi, yB + T, zf] },
    { min: [-xi - RT, yB, zp0], max: [-xi, yB + T, zp1] },
    { min: [xi, yB, zp0], max: [xi + RT, yB + T, zp1] },
  ]);
  p.add("P4", "4", "Bottom shelf", sh.size, sh.pos, "board", sh.pieces);
  p.add("R5f", "5", "Rail", [2 * xi, RH, RD], [0, Y5 + RH / 2, zf - RD / 2]);
  p.add("R5b", "5", "Rail", [2 * xi, RH, RD], [0, Y5 + RH / 2, zp0 + RD / 2]);
  const k0 = y3 + T - 6; // the back panel stands in the drawer shelf's groove
  p.add("K6", "6", "Back panel", [2 * (xi + 8), HL - k0, BK], [0, (HL + k0) / 2, zk + BK / 2], "fiber");
  p.list.push(topPart(g, "T7", "7"));
  const d = drawerGeo(g, y3 + T, HL, zk + BK);
  const dr = drawerParts(p, g, d, "", { front: "8", left: "9", right: "10", bottom: "11", back: "12" });
  const dIds = idsOf(dr);

  const js = [panelJoint("P3", y3, zp0, zf), railJoint("R5f", Y5, yB, zf - RD, zf, true), railJoint("R5b", Y5, yB, zp0, zp0 + RD, false)];
  const top = topJoints(g, "T7", frames);
  const df = drawerFits(g, d, dr, { backScrew: SCREW_30, runScrew: RUNNER_SCREW_12, runScrews: 2, knobs: [0], knobScrew: KNOB_SCREW });
  const lie = "+x" as const; // lying on frame 1, the left one
  const fOff: Vec3 = [0, 0, -(D + 300)]; // frame 2 waits behind until it goes on
  const pOff: Vec3 = [0, 0, D + 300]; // the shelves are got ready in front
  const dOff: Vec3 = [0, 0, OUT];
  const tOff: Vec3 = [W, 0, 0];
  const shelves = ["P3", "P4", "R5f", "R5b"];
  const steps: CustomStep[] = [
    {
      title: "Fit the runners and cam bolts on the side frames",
      detail: `Lay both frames inside face up on a rug. Screw the left runner (CL) onto frame 1 and the right runner (CR) onto frame 2, wheel to the front, four small screws (D) each. Then turn ${countBolts(js)} cam bolts (A) into each frame until they stop.`,
      add: ["F1"],
      wait: ["F2"],
      from: { F2: fOff },
      fix: [...cabRunners(g, -1, "F1", [d], RUNNER_SCREW_12), ...cabRunners(g, 1, "F2", [d], RUNNER_SCREW_12), frameBolts(g, -1, "F1", js), frameBolts(g, 1, "F2", js)],
      pose: lie,
      tools: ["screwdriver"],
      kind: "runners",
      warnings: ["floor"],
    },
    {
      title: "Push in the dowels and screw the rails under the bottom shelf",
      detail: "Two dowels (C) into each end of the drawer shelf (3). Turn the bottom shelf (4) upside down, push in four dowels, press the two rails (5) onto them and drive two long screws (G) through each rail.",
      fix: [...jointDowels(g, -1, "F1", js), ...jointDowels(g, 1, "F2", js), ...railsUnder(g, "P4", [{ id: "R5f", z: zf - RD / 2 }, { id: "R5b", z: zp0 + RD / 2 }], SCREW_40)],
      wait: shelves,
      from: offset(shelves, pOff),
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Stand the two shelves on frame 1",
      detail: "Push the drawer shelf onto the upper cam bolts and the rails of the bottom shelf onto the lower ones, then turn the four cam locks (B) to pull them tight.",
      add: shelves,
      fix: jointCams(g, -1, js),
      from: offset(shelves, pOff),
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Lay frame 2 on top and stick on the felt pads",
      detail: "Lower frame 2 onto the dowels and cam bolts and turn its four cam locks (B). Stick a felt pad (I) under each leg.",
      add: ["F2"],
      from: { F2: fOff },
      fix: [...jointCams(g, 1, js), ...pads(g, frames)],
      pose: lie,
      tools: ["screwdriver"],
      check: "square",
    },
    {
      title: "Build the drawer",
      detail:
        "Stand the table up. Turn four cam bolts (A) into the back of the drawer front (8), press the sides (9 and 10) onto them and lock two cam locks (B) in each. Slide the bottom (11) down the grooves, put the back (12) on with two screws (H) through each side, screw the runners along the bottom edges (DL left, DR right, wheel at the back, two small screws D each) and fix the knob (F) with its screw (E) from inside.",
      wait: dIds,
      from: offset(dIds, dOff),
      fix: [...df.box, ...df.back, ...df.runners, ...df.knobs],
      pose: "+y",
      tools: ["screwdriver"],
      kind: "drawer",
      warnings: ["floor"],
    },
    {
      title: "Slide in the back panel and get the top ready",
      detail: "Slide the back panel (6), notch at the top, down the grooves at the back of the frames until it sits in the drawer shelf. Push two dowels (C) into the top of each frame, and turn four cam bolts (A) into the underside of the top (7).",
      add: ["K6"],
      wait: ["T7"],
      from: { K6: [0, 450, 0], T7: tOff },
      fix: [...top.dowels, ...top.bolts],
      tools: ["screwdriver"],
    },
    {
      title: "Fix the top on and fit the corner blocks",
      detail: "Lower the top onto the dowels and bolts and turn the four cam locks (B) inside the frames. From the back, press a corner block (K) into each corner of the back panel and screw it to the frame (J).",
      add: ["T7"],
      from: { T7: tOff },
      fix: [...top.cams, ...cornerBlocks(g, [{ id: "K6", y0: y3 + T, y1: HL }], frames, BLOCK_SCREW)],
      tools: ["screwdriver"],
    },
    {
      title: "Slide the drawer in",
      detail: "Rest the drawer's runners on the ones in the table and push it home.",
      add: dIds,
      from: offset(dIds, dOff),
      kind: "drawer",
    },
    {
      title: "Fix it to the wall",
      detail: "Screw the strap (L) under the top at the back with the small screw. Push the table against the wall, mark, drill and push in the plug, then screw the strap to the wall. Check the wall for pipes and cables first.",
      fix: [
        fx(STRAP, [[0, HL, -D / 2 + 20]], [0, 1, 0], "T7"),
        fx(STRAP_SCREW, [[0, HL, -D / 2 + 44]], [0, 1, 0], "T7"),
        fx(WALL_PLUG, [[0, HL + 15, -D / 2 - 30]], [0, 0, -1]),
        fx(WALL_SCREW, [[0, HL + 15, -D / 2 - 4]], [0, 0, -1], "T7"),
      ],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts: p.list, steps };
}

/* ---------- the bookshelf ---------- */

function bookshelf(s: ProductSpec): CustomParams {
  const g = geom(s);
  const { D, HL, xi, zf, zp0, zk } = g;
  const yB = Y5 + RH;
  const bay = (HL - (yB + T) - 2 * T) / 3; // three bays alike: the bottom, two shelves, the top
  const yS = [yB + T + bay, yB + 2 * T + 2 * bay];
  const p = new Parts();
  const frames: [string, string] = ["F1", "F2"];
  p.list.push(sideFrame(g, -1, "F1", "1", "Left side frame", [yB, HL]), sideFrame(g, 1, "F2", "2", "Right side frame", [yB, HL]));
  p.add("S3a", "3", "Shelf", [2 * xi, T, zf - 2 - zp0], [0, yS[0] + T / 2, (zf - 2 + zp0) / 2]);
  p.add("S3b", "3", "Shelf", [2 * xi, T, zf - 2 - zp0], [0, yS[1] + T / 2, (zf - 2 + zp0) / 2]);
  p.add("P4", "4", "Bottom shelf", [2 * xi, T, zf - zp0], [0, yB + T / 2, (zf + zp0) / 2]);
  p.add("R5t", "5", "Rail", [2 * xi, RH, RD], [0, HL - RH / 2, zf - RD / 2]);
  p.add("R5f", "5", "Rail", [2 * xi, RH, RD], [0, Y5 + RH / 2, zf - RD / 2]);
  p.add("R5b", "5", "Rail", [2 * xi, RH, RD], [0, Y5 + RH / 2, zp0 + RD / 2]);
  // the back panels stand in grooves in the shelves: the two lower ones are alike, the top one has the brackets' notches
  const backs = [
    { id: "K6a", y0: yB + T, y1: yS[0] },
    { id: "K6b", y0: yS[0] + T, y1: yS[1] },
    { id: "K7", y0: yS[1] + T, y1: HL },
  ];
  for (const b of backs) {
    const y0 = b.y0 - 6, y1 = b.id === "K7" ? HL : b.y1 + 6;
    p.add(b.id, b.id === "K7" ? "7" : "6", b.id === "K7" ? "Top back panel" : "Back panel", [2 * (xi + 8), y1 - y0, BK], [0, (y0 + y1) / 2, zk + BK / 2], "fiber");
  }
  p.list.push(topPart(g, "T8", "8"));

  const js = [
    railJoint("R5t", HL - RH, HL, zf - RD, zf, true),
    panelJoint("S3a", yS[0], zp0, zf - 2),
    panelJoint("S3b", yS[1], zp0, zf - 2),
    panelJoint("P4", yB, zp0, zf),
    railJoint("R5f", Y5, yB, zf - RD, zf, true),
    railJoint("R5b", Y5, yB, zp0, zp0 + RD, false),
  ];
  const top = topJoints(g, "T8", frames);
  const lie = "-x" as const; // lying on frame 2, the right one
  const fOff: Vec3 = [0, 0, -(D + 300)];
  const pOff: Vec3 = [0, 0, D + 300];
  const tOff: Vec3 = [0, 0, D + 300];
  const prepared = ["S3a", "S3b", "P4", "R5f", "R5b"];
  const steps: CustomStep[] = [
    {
      title: "Push dowels into the shelves and screw the rails under the bottom shelf",
      detail: "Two dowels (C) into each end of both shelves (3) and of the bottom shelf (4). Turn the bottom shelf upside down, push four more dowels into it, press the two rails (5) on and drive two long screws (D) through each.",
      fix: [...jointDowels(g, -1, "F1", js), ...jointDowels(g, 1, "F2", js), ...railsUnder(g, "P4", [{ id: "R5f", z: zf - RD / 2 }, { id: "R5b", z: zp0 + RD / 2 }], SCREW_40)],
      wait: prepared,
      from: offset(prepared, pOff),
      tools: ["screwdriver"],
      warnings: ["floor"],
    },
    {
      title: "Turn the cam bolts into the side frames",
      detail: `Lay both frames inside face up on a rug and turn ${countBolts(js)} cam bolts (A) into each until they stop.`,
      add: ["F2"],
      wait: ["F1"],
      from: { F1: fOff },
      fix: [frameBolts(g, -1, "F1", js), frameBolts(g, 1, "F2", js)],
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Stand the rails and shelves on frame 2",
      detail: "The top rail (5) at the top end, the two shelves (3) and the bottom shelf with its rails at the foot, each on its cam bolts. Turn the nine cam locks (B) to pull them tight.",
      add: ["R5t", ...prepared],
      fix: jointCams(g, 1, js),
      from: { R5t: [-500, 0, 0], ...offset(prepared, pOff) },
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Slide in the two lower back panels",
      detail: "Smooth side in, along the grooves in the shelves into frame 2: one under each shelf.",
      add: ["K6a", "K6b"],
      from: offset(["K6a", "K6b"], [-700, 0, 0]),
      pose: lie,
    },
    {
      title: "Lay frame 1 on top and get the top ready",
      detail: "Lower frame 1 onto the dowels and cam bolts and turn its nine cam locks (B). Stick a felt pad (E) under each leg. Turn four cam bolts (A) into the underside of the top (8) and screw the two wall brackets (H) on at its back edge.",
      add: ["F1"],
      wait: ["T8"],
      from: { F1: fOff, T8: tOff },
      fix: [...jointCams(g, -1, js), ...pads(g, frames), ...top.bolts, ...brackets(g, "T8")],
      pose: lie,
      tools: ["screwdriver"],
      check: "square",
    },
    {
      title: "Stand it up, slide in the top back panel and push in the dowels",
      detail: "Slide the top back panel (7), notches at the top, down the grooves onto the upper shelf. Two dowels (C) into the top of each frame and two into the top rail.",
      add: ["K7"],
      from: { K7: [0, 500, 0] },
      fix: [...top.dowels, topRailDowels(g, "R5t", "T8")],
      pose: "+y",
    },
    {
      title: "Fix the top on",
      detail: "Lower the top onto the dowels and bolts, turn the four cam locks (B) inside the frames and drive two long screws (D) up through the top rail into the top.",
      add: ["T8"],
      from: { T8: tOff },
      fix: [...top.cams, topRailScrews(g, "R5t", "T8", SCREW_40)],
      tools: ["screwdriver"],
    },
    {
      title: "Fit the corner blocks and fix it to the wall",
      detail: `From the back, press a corner block (G) into each corner of the three back panels and screw it to the frame (F). ${WALL_DETAIL}`,
      fix: [...cornerBlocks(g, backs, frames, BLOCK_SCREW), ...bracketsToWall(g, "T8")],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts: p.list, steps };
}

/* ---------- the 3 drawer chest ---------- */

function chest(s: ProductSpec): CustomParams {
  const g = geom(s);
  const { W, D, HL, xi, zf, zp0, zk } = g;
  const yB = Y5 + RH, yT = HL - RH; // the bottom's underside; the top rail's underside
  const open = (yT - (yB + T) - 2 * T) / 3; // three drawers alike
  const y0s = [0, 1, 2].map((i) => yT - (i + 1) * open - i * T); // the openings' bottoms, the top drawer's first
  const y8 = [y0s[0] - T, y0s[1] - T]; // the front rails' undersides
  const y6 = Math.round(HL * 0.64) - 30; // the back rail, between the two back panels
  const p = new Parts();
  const frames: [string, string] = ["F2", "F3"];
  p.list.push(topPart(g, "T1", "1"));
  p.list.push(sideFrame(g, -1, "F2", "2", "Left side frame", [yB, HL]), sideFrame(g, 1, "F3", "3", "Right side frame", [yB, HL]));
  p.add("P4", "4", "Bottom", [2 * xi, T, zf - zp0], [0, yB + T / 2, (zf + zp0) / 2]);
  p.add("R5t", "5", "Rail", [2 * xi, RH, RD], [0, HL - RH / 2, zf - RD / 2]);
  p.add("R5f", "5", "Rail", [2 * xi, RH, RD], [0, Y5 + RH / 2, zf - RD / 2]);
  p.add("R5b", "5", "Rail", [2 * xi, RH, RD], [0, Y5 + RH / 2, zp0 + RD / 2]);
  p.add("R6", "6", "Back rail", [2 * xi, 60, RD], [0, y6 + 30, zp0 + RD / 2]);
  const backs = [
    { id: "K7", y0: yB + T, y1: y6 },
    { id: "K15", y0: y6 + 60, y1: HL },
  ];
  p.add("K7", "7", "Lower back panel", [2 * (xi + 8), y6 + 6 - (yB + T - 6), BK], [0, (y6 + 6 + yB + T - 6) / 2, zk + BK / 2], "fiber");
  p.add("R8a", "8", "Front rail", [2 * xi, T, FLAT], [0, y8[0] + T / 2, zf - FLAT / 2]);
  p.add("R8b", "8", "Front rail", [2 * xi, T, FLAT], [0, y8[1] + T / 2, zf - FLAT / 2]);
  p.add("K15", "15", "Upper back panel", [2 * (xi + 8), HL - (y6 + 54), BK], [0, (HL + y6 + 54) / 2, zk + BK / 2], "fiber");
  const ds = y0s.map((y0) => drawerGeo(g, y0, y0 + open, zp0 + RD));
  const drs = ds.map((d, i) => drawerParts(p, g, d, String(i), { front: "9", left: "10", right: "11", back: "12", brace: "13", bottom: "14" }));
  const dfs = ds.map((d, i) => drawerFits(g, d, drs[i], { backScrew: SCREW_30, runScrew: RUNNER_SCREW_10, runScrews: 3, knobs: [0], knobScrew: KNOB_SCREW }));

  const upper = [railJoint("R6", y6, y6 + 60, zp0, zp0 + RD, false, 2), railJoint("R5t", yT, HL, zf - RD, zf, true), flatJoint("R8a", y8[0], zf - FLAT, zf), flatJoint("R8b", y8[1], zf - FLAT, zf)];
  const lower = [panelJoint("P4", yB, zp0, zf), railJoint("R5f", Y5, yB, zf - RD, zf, true), railJoint("R5b", Y5, yB, zp0, zp0 + RD, false)];
  const js = [...upper, ...lower];
  const top = topJoints(g, "T1", frames);
  const lie = "-x" as const; // lying on frame 3, the right one
  const fOff: Vec3 = [0, 0, -(D + 300)];
  const pOff: Vec3 = [0, 0, D + 300];
  const dOff: Vec3 = [0, 0, OUT];
  const tOff: Vec3 = [W, 0, 0];
  const bottom = ["P4", "R5f", "R5b"];
  const boxIds = drs.flatMap((d) => [d.f, d.l, d.r, d.br!, d.bt]);
  const dIds = drs.flatMap(idsOf);
  const steps: CustomStep[] = [
    {
      title: "Fit the runners and cam bolts on the side frames",
      detail: `Lay both frames inside face up on a rug. Three left runners (CL) on frame 2 and three right runners (CR) on frame 3, wheel to the front, four small screws (F) each. Then turn ${countBolts(js)} cam bolts (D) into each frame until they stop.`,
      add: ["F3"],
      wait: ["F2"],
      from: { F2: fOff },
      fix: [...cabRunners(g, -1, "F2", ds, RUNNER_SCREW_10), ...cabRunners(g, 1, "F3", ds, RUNNER_SCREW_10), frameBolts(g, -1, "F2", js), frameBolts(g, 1, "F3", js)],
      pose: lie,
      tools: ["screwdriver"],
      kind: "runners",
      warnings: ["floor"],
    },
    {
      title: "Stand the rails on frame 3",
      detail: "The back rail (6) halfway up the back, the top rail (5) at the top end and the two front rails (8) under the top two runners, each on its cam bolts. Turn the seven cam locks (E) to pull them tight.",
      add: ["R6", "R5t", "R8a", "R8b"],
      fix: jointCams(g, 1, upper),
      from: offset(["R6", "R5t", "R8a", "R8b"], [-500, 0, 0]),
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Screw the rails under the bottom",
      detail: "Lay the bottom (4) on a rug, push in four dowels (A), press the two rails (5) on and drive two long screws (B) through each.",
      fix: railsUnder(g, "P4", [{ id: "R5f", z: zf - RD / 2 }, { id: "R5b", z: zp0 + RD / 2 }], SCREW_40),
      wait: bottom,
      from: offset(bottom, pOff),
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Stand the bottom on frame 3",
      detail: "Two dowels (A) into its end, then push it and its rails onto the lowest cam bolts and turn the four cam locks (E).",
      add: bottom,
      fix: [...jointDowels(g, 1, "F3", lower), ...jointCams(g, 1, lower)],
      from: offset(bottom, pOff),
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Slide in the lower back panel",
      detail: "Smooth side in, along the grooves in the bottom and the back rail into frame 3.",
      add: ["K7"],
      from: { K7: [-700, 0, 0] },
      pose: lie,
    },
    {
      title: "Lay frame 2 on top and stick on the felt pads",
      detail: "Two dowels (A) into the other end of the bottom. Lower frame 2 onto the dowels and cam bolts, turn its eleven cam locks (E) and stick a felt pad (K) under each leg.",
      add: ["F2"],
      from: { F2: fOff },
      fix: [...jointDowels(g, -1, "F2", lower), ...jointCams(g, -1, js), ...pads(g, frames)],
      pose: lie,
      tools: ["screwdriver"],
      check: "square",
    },
    {
      title: "Stand it up and slide in the upper back panel",
      detail: "Notches at the top, down the grooves until it sits in the back rail.",
      add: ["K15"],
      from: { K15: [0, 450, 0] },
      pose: "+y",
    },
    {
      title: "Turn cam bolts into the top and fit the wall brackets",
      detail: "Lay the top (1) upside down. Four cam bolts (D) into it, and the two wall brackets (L) at its back edge with a small screw each.",
      fix: [...top.bolts, ...brackets(g, "T1")],
      wait: ["T1"],
      from: { T1: tOff },
      tools: ["screwdriver"],
    },
    {
      title: "Fix the top on",
      detail: "Two dowels (A) into the top of each frame and two into the top rail. Lower the top onto them, turn the four cam locks (E) and drive two long screws (B) up through the top rail.",
      add: ["T1"],
      from: { T1: tOff },
      fix: [...top.dowels, topRailDowels(g, "R5t", "T1"), ...top.cams, topRailScrews(g, "R5t", "T1", SCREW_40)],
      tools: ["screwdriver"],
    },
    {
      title: "Build the drawer boxes",
      detail: "For each of the three drawer fronts (9): lay it face down on a rug, turn in five cam bolts (D), press the sides (10 and 11) and the brace (13) onto them and lock the five cam locks (E). Slide the bottom (14) down the grooves.",
      fix: dfs.flatMap((f) => f.box),
      wait: boxIds,
      from: offset(dIds, dOff),
      tools: ["screwdriver"],
      kind: "drawer",
      warnings: ["floor"],
    },
    // the manual's step 11 closes each box with its back, then fits its runners and knob: 27 groups of fittings for
    // three drawers, more than one guide step holds, so it is two guide steps
    {
      title: "Screw the backs on",
      detail: "On each drawer, put the back (12) on between the sides and drive five screws (C): two through each side and one through the back into the brace.",
      fix: dfs.flatMap((f) => f.back),
      wait: drs.map((d) => d.bk),
      from: offset(dIds, dOff),
      tools: ["screwdriver"],
      kind: "drawer",
    },
    {
      title: "Screw on the runners and knobs",
      detail: "On each drawer: the runners along the bottom edges (DL left, DR right, wheel at the back, three small screws F each), and the knob (H) with its screw (G) from inside.",
      fix: dfs.flatMap((f) => [...f.runners, ...f.knobs]),
      tools: ["screwdriver"],
      kind: "runners",
    },
    {
      title: "Fit the corner blocks",
      detail: "From the back, press a corner block (J) into each corner of both back panels and screw it to the frame (I).",
      fix: cornerBlocks(g, backs, frames, BLOCK_SCREW),
      tools: ["screwdriver"],
    },
    {
      title: "Fix it to the wall",
      detail: WALL_DETAIL,
      fix: bracketsToWall(g, "T1"),
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
    {
      title: "Slide all three drawers in",
      detail: "Rest each drawer's runners on the ones in the chest and push it home. Open only one drawer at a time.",
      add: dIds,
      from: offset(dIds, dOff),
      kind: "drawer",
      warnings: ["tip"],
    },
  ];
  return { parts: p.list, steps };
}

/* ---------- the 2 door cabinet with drawer ---------- */

function cabinet(s: ProductSpec): CustomParams {
  const g = geom(s);
  const { W, D, HL, xi, zf, zp0, zk } = g;
  const yB = Y5 + RH, yT = HL - RH;
  const y6 = yT - 134 - T; // the flat rail under the drawer
  const y3 = Math.round((yB + T + y6) / 2 - T / 2); // the shelf, halfway down the cupboard
  const dy0 = yB + T + 2, dy1 = y6 - 2; // the doors, between the bottom and the rail
  const p = new Parts();
  const frames: [string, string] = ["F1", "F2"];
  p.list.push(sideFrame(g, -1, "F1", "1", "Left side frame", [yB, HL]), sideFrame(g, 1, "F2", "2", "Right side frame", [yB, HL]));
  const s3z = zf - FT - 4; // the shelf stops behind the doors
  p.add("S3", "3", "Shelf", [2 * xi, T, s3z - zp0], [0, y3 + T / 2, (s3z + zp0) / 2]);
  p.add("P4", "4", "Bottom", [2 * xi, T, zf - zp0], [0, yB + T / 2, (zf + zp0) / 2]);
  p.add("R5t", "5", "Rail", [2 * xi, RH, RD], [0, HL - RH / 2, zf - RD / 2]);
  p.add("R5f", "5", "Rail", [2 * xi, RH, RD], [0, Y5 + RH / 2, zf - RD / 2]);
  p.add("R5b", "5", "Rail", [2 * xi, RH, RD], [0, Y5 + RH / 2, zp0 + RD / 2]);
  p.add("R6", "6", "Front rail", [2 * xi, T, FLAT], [0, y6 + T / 2, zf - FLAT / 2]);
  const backs = [
    { id: "K7", y0: yB + T, y1: y3 },
    { id: "K8", y0: y3 + T, y1: HL },
  ];
  p.add("K7", "7", "Lower back panel", [2 * (xi + 8), y3 + 6 - (yB + T - 6), BK], [0, (y3 + 6 + yB + T - 6) / 2, zk + BK / 2], "fiber");
  p.add("K8", "8", "Upper back panel", [2 * (xi + 8), HL - (y3 + T - 6), BK], [0, (HL + y3 + T - 6) / 2, zk + BK / 2], "fiber");
  p.list.push(topPart(g, "T9", "9"));
  const d = drawerGeo(g, y6 + T, yT, zk + BK);
  const dr = drawerParts(p, g, d, "", { front: "10", left: "11", right: "12", brace: "13", bottom: "14", back: "15" });
  const dIds = idsOf(dr);
  const dw = xi - 3;
  p.add("DL", "16", "Door", [dw, dy1 - dy0, FT], [-(dw / 2 + 1), (dy0 + dy1) / 2, zf - FT / 2]);
  p.add("DR", "16", "Door", [dw, dy1 - dy0, FT], [dw / 2 + 1, (dy0 + dy1) / 2, zf - FT / 2]);

  const js = [
    railJoint("R5t", yT, HL, zf - RD, zf, true),
    flatJoint("R6", y6, zf - FLAT, zf),
    panelJoint("S3", y3, zp0, s3z),
    panelJoint("P4", yB, zp0, zf),
    railJoint("R5f", Y5, yB, zf - RD, zf, true),
    railJoint("R5b", Y5, yB, zp0, zp0 + RD, false),
  ];
  const top = topJoints(g, "T9", frames);
  const df = drawerFits(g, d, dr, { backScrew: SCREW_25, runScrew: RUNNER_SCREW_10, runScrews: 3, knobs: [-W / 4, W / 4], knobScrew: KNOB_SCREW_SHORT });
  // the doors: two cup hinges each on the frame beside it, a knob by the middle, a stop inside near the top
  const hy = [dy0 + 80, dy1 - 80];
  const zdb = zf - FT; // the doors' back faces
  const doors = [
    { id: "DL", g: 1, edge: -xi + 2, frame: "F1", sx: -1, free: -1 },
    { id: "DR", g: -1, edge: xi - 2, frame: "F2", sx: 1, free: 1 },
  ];
  const cup = (o: (typeof doors)[number]) => o.edge + o.g * 22;
  const ky = dy1 - 0.4 * (dy1 - dy0);
  const lie = "+x" as const; // lying on frame 1, the left one
  const fOff: Vec3 = [0, 0, -(D + 300)];
  const pOff: Vec3 = [0, 0, D + 300];
  const dOff: Vec3 = [-W, 0, 0]; // the drawer waits to the left, out of the doors' way
  const oOff: Vec3 = [0, 0, OUT]; // the doors in front
  const tOff: Vec3 = [W, 0, 0];
  const prepared = ["S3", "P4", "R5f", "R5b"];
  const doorIds = doors.map((o) => o.id);
  const steps: CustomStep[] = [
    {
      title: "Fit the runners and cam bolts on the side frames",
      detail: `Lay both frames inside face up on a rug. Screw the left runner (CL) onto frame 1 and the right runner (CR) onto frame 2, wheel to the front, four small screws (D) each. Then turn ${countBolts(js)} cam bolts (A) into each frame until they stop.`,
      add: ["F1"],
      wait: ["F2"],
      from: { F2: fOff },
      fix: [...cabRunners(g, -1, "F1", [d], RUNNER_SCREW_10), ...cabRunners(g, 1, "F2", [d], RUNNER_SCREW_10), frameBolts(g, -1, "F1", js), frameBolts(g, 1, "F2", js)],
      pose: lie,
      tools: ["screwdriver"],
      kind: "runners",
      warnings: ["floor"],
    },
    {
      title: "Push in the dowels and screw the rails under the bottom",
      detail: "Two dowels (C) into each end of the shelf (3) and of the bottom (4). Turn the bottom upside down, push in four more dowels, press the two rails (5) on and drive two long screws (E) through each.",
      fix: [...jointDowels(g, -1, "F1", js), ...jointDowels(g, 1, "F2", js), ...railsUnder(g, "P4", [{ id: "R5f", z: zf - RD / 2 }, { id: "R5b", z: zp0 + RD / 2 }], SCREW_40)],
      wait: prepared,
      from: offset(prepared, pOff),
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Stand the rails, the shelf and the bottom on frame 1",
      detail: "The top rail (5) at the top end, the flat rail (6) under the runner, then the shelf and the bottom with its rails, each on its cam bolts. Turn the nine cam locks (B) to pull them tight.",
      add: ["R5t", "R6", ...prepared],
      fix: jointCams(g, -1, js),
      from: { R5t: [500, 0, 0], R6: [500, 0, 0], ...offset(prepared, pOff) },
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Slide in the lower back panel",
      detail: "Smooth side in, along the grooves in the bottom and the shelf into frame 1.",
      add: ["K7"],
      from: { K7: [700, 0, 0] },
      pose: lie,
    },
    {
      // the manual's step 6: it has no step 5
      title: "Lay frame 2 on top and stick on the felt pads",
      detail: "Lower frame 2 onto the dowels and cam bolts, turn its nine cam locks (B) and stick a felt pad (N) under each leg.",
      add: ["F2"],
      from: { F2: fOff },
      fix: [...jointCams(g, 1, js), ...pads(g, frames)],
      pose: lie,
      tools: ["screwdriver"],
      check: "square",
    },
    {
      title: "Stand it up, slide in the upper back panel and push in the dowels",
      detail: "Slide the upper back panel (8), notches at the top, down the grooves onto the shelf. Two dowels (C) into the top of each frame and two into the top rail.",
      add: ["K8"],
      from: { K8: [0, 500, 0] },
      fix: [...top.dowels, topRailDowels(g, "R5t", "T9")],
      pose: "+y",
    },
    {
      // the manual's step 8 fits the top's bolts and brackets upside down, then puts the top on: two guide steps
      title: "Turn cam bolts into the top and fit the wall brackets",
      detail: "Lay the top (9) upside down. Four cam bolts (A) into it, and the two wall brackets (O) at its back edge with a small screw each.",
      fix: [...top.bolts, ...brackets(g, "T9")],
      wait: ["T9"],
      from: { T9: tOff },
      tools: ["screwdriver"],
    },
    {
      title: "Fix the top on",
      detail: "Lower the top onto the dowels and bolts, turn the four cam locks (B) inside the frames and drive two long screws (E) up through the top rail.",
      add: ["T9"],
      from: { T9: tOff },
      fix: [...top.cams, topRailScrews(g, "R5t", "T9", SCREW_40)],
      tools: ["screwdriver"],
    },
    {
      title: "Fit the corner blocks",
      detail: "From the back, press a corner block (L) into each corner of both back panels and screw it to the frame (K).",
      fix: cornerBlocks(g, backs, frames, BLOCK_SCREW),
      tools: ["screwdriver"],
    },
    {
      title: "Build the drawer",
      detail:
        "Lay the drawer front (10) face down on a rug and turn in five cam bolts (A). Press the sides (11 and 12) and the brace (13) onto them and lock the five cam locks (B), slide the bottom (14) down the grooves and screw on the back (15) with five screws (M). Screw the runners along the bottom edges (DL left, DR right, wheel at the back, three small screws D each) and fix the two knobs (J) with their screws (I) from inside.",
      fix: [...df.box, ...df.back, ...df.runners, ...df.knobs],
      wait: dIds,
      from: offset(dIds, dOff),
      tools: ["screwdriver"],
      kind: "drawer",
      warnings: ["floor"],
    },
    {
      // the manual's step 12 (it has no step 11) fits the hinges and knobs, then hangs the doors: two guide steps
      title: "Screw the hinges and knobs onto the doors",
      detail: "Lay each door (16) face down. Press a hinge (G) into each cup hole, two screws (P) each, and fix a knob (J) by the door's inner edge with its screw (H) from behind.",
      fix: doors.flatMap((o) => [
        fx(HINGE, hy.map((y): Vec3 => [cup(o), y, zdb]), [0, 0, 1], o.id, undefined, o.g < 0 ? { twist: Math.PI } : {}),
        fx(HINGE_SCREW, hy.flatMap((y) => [-12, 12].map((k): Vec3 => [cup(o) + o.g * 24, y + k, zdb])), [0, 0, 1], o.id),
        fx(KNOB, [[o.free * 40, ky, zf + 4]], [0, 0, -1], o.id),
        fx(KNOB_SCREW, [[o.free * 40, ky, zdb - 4]], [0, 0, 1], o.id),
      ]),
      wait: doorIds,
      from: offset(doorIds, oOff),
      tools: ["screwdriver"],
      kind: "doors",
      warnings: ["floor"],
    },
    {
      title: "Hang the doors",
      detail: "Hold each door in its opening and screw its hinge plates to the frame beside it, four screws (P) each: the left door on frame 1, the right door on frame 2.",
      add: doorIds,
      fix: doors.map((o) => fx(HINGE_SCREW, hy.flatMap((y) => [-16, 16].flatMap((k) => [zdb - 20, zdb - 52].map((z): Vec3 => [o.sx * xi, y + k, z]))), [o.sx, 0, 0], o.frame, o.id)),
      from: offset(doorIds, oOff),
      tools: ["screwdriver"],
      kind: "hinges",
    },
    {
      title: "Fix it to the wall and fit the door stops",
      detail: `${WALL_DETAIL} Then screw a door stop (F) inside each door, near the top of its inner edge.`,
      fix: [
        ...bracketsToWall(g, "T9"),
        ...doors.flatMap((o) => [fx(STOP_SCREW, [[o.free * 30, dy1 - 20, zdb]], [0, 0, 1], o.id), fx(STOP, [[o.free * 30, dy1 - 20, zdb]], [0, 0, 1], o.id)]),
      ],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
    {
      title: "Slide the drawer in",
      detail: "Rest the drawer's runners on the ones in the cabinet and push it home. If a door rubs or sits crooked, loosen its hinge screws a little, line it up and tighten them again.",
      add: dIds,
      from: offset(dIds, dOff),
      kind: "drawer",
    },
  ];
  return { parts: p.list, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  switch (s.slug) {
    case "kmart-oliver-bedside-table":
      return bedside(s);
    case "kmart-oliver-bookshelf":
      return bookshelf(s);
    case "kmart-oliver-3-drawer-chest":
      return chest(s);
    case "kmart-oliver-2-door-cabinet-with-drawer":
      return cabinet(s);
    default:
      return null;
  }
}

const family: Family = { names: ["KMART:OLIVER"], recipe };
export default family;
