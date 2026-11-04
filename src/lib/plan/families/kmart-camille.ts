import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartMaterial, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's Camille range, read from its assembly manuals. Every piece stands on its sides: a 15 mm panel between two
 * square posts that run down to the floor as the legs. Two rails are screwed under the bottom, the bottom and the rails
 * cam-lock to the sides, a divider stands on the bottom, the backs slide down grooves, a thick top goes on with cam
 * bolts, and the doors (with an X on the front) hang on cup hinges. Corner blocks hold the backs and it is fixed to the
 * wall.
 *
 * - Storage Unit with Adjustable Shelves (keycode 43266906, 16 steps): a two door cabinet with an open hutch on its top.
 *   The cabinet is built on its front, stood up for its two backs (10). The hutch is built on its back: cam bolts in its
 *   sides (11, 12) and top (13), the two shelves (14) between the sides with a back (15) slid in between them, then the
 *   top and the other two backs. Four connector screws (l) fix it to the cabinet's top (5), and the top with the hutch
 *   is cam-locked onto the cabinet. Hardware: 26 cam bolts (a), 26 cam locks (b), 24 small screws (c), 32 dowels 8 x 30
 *   (d), 6 long screws (e), 4 hinges (f), 8 shelf supports (g), 2 knobs (h) with their screws (i), 12 corner blocks with
 *   screws (t), 2 wall straps with a washer and screw (j), 2 wall plugs with a washer and screw (k), 4 connector screws
 *   M5 x 50 (l), an Allen key (m) and 4 felt pads (n).
 * - 4 Door Sideboard (keycode 43636990, Sage, 11 steps, two people): two bays of two doors. A middle foot (12) with a
 *   leveller (Q) goes under the bottom with the rails, the divider (10) is screwed on with connector screws (O), a third
 *   rail runs under the top at the front, and the inner doors (11) hang on cranked hinges on the divider. Hardware: 16
 *   cam bolts (A), 16 cam locks (B), 48 hinge screws 3.5 x 12 (C), 21 dowels (D), 18 long screws (E), 4 knobs (F), 4
 *   hinges (G), 4 cranked hinges (H), 16 small screws 3 x 14 (I), 8 shelf supports (J), 2 wall kits of a bracket, a
 *   bracket screw, a wall screw and a plug (K), 2 door stops (L), 12 corner blocks (M), 4 felt pads (N), 3 connector
 *   screws 7 x 40 (O), an Allen key (P) and the leveller (Q).
 * - Sideboard (keycode 43266845, 13 steps): the same carcass as the 4 door sideboard, but its manual builds it another
 *   way, so it is a guide of its own: no dowels under the rails, the middle foot (10) and the divider (3) go on with long
 *   screws (e) and the foot takes a felt pad, the top takes six dowels in the sides and divider (none in the top rail),
 *   the hinges go on the doors before the shelves and the doors hang after them. Hardware: 16 cam bolts (a), 16 cam
 *   locks (b), 52 screws M4 x 12 (c), 12 dowels (d), 21 long screws (e), 4 knobs (f), 4 hinges (g), 4 cranked hinges
 *   (h), 12 corner blocks with screws (i), 8 shelf supports (j), 2 wall straps with a washer and screw (k), 2 wall plugs
 *   with a washer and screw (m), 5 felt pads (n) and 2 door stops (r). Its manual prints "step 12" twice: the second,
 *   on its own page, fixes it to the wall and is step 13 here.
 * - Cabinet with Shelves (keycode 43639922, 11 steps): open shelves on the left, a door on the right. The two fixed
 *   shelves (6) cam-lock to the divider (3) before it goes onto the bottom, then the right side and the left side, which
 *   holds the shelves' other ends. Hardware: 22 cam bolts (A), 22 cam locks (B), 24 dowels (C), 2 screws 4 x 35 (D), 4
 *   long screws (E), 12 hinge screws (F), 2 hinges (G), a knob (H), a door stop (I), 4 shelf supports (J), 10 small
 *   screws 3 x 14 (K), 8 corner blocks (L), 2 wall kits (M) and 4 felt pads (N). Its parts list prints 4 bottoms (4)
 *   and 1 rail (5), but every drawing has one bottom and two rails under it: the guide follows the drawings.
 *
 * Part numbers are Kmart's own, so the guide reads against the paper. Kmart's count boxes sometimes give a total for
 * all the doors and sometimes a count per door with "x2" beside it; the guide follows the hardware list's totals,
 * which every count here matches. Parts built away from the carcass (the sides with their cam bolts, the hutch, the
 * doors) wait beside it until the step that joins them.
 */

const T = 15; // carcass panels
const TT = 25; // the tops of the cabinets
const BK = 3; // hardboard backs
const FT = 18; // doors
const P = 40; // the square posts at the front and back of each side
const RS = 25; // rails: square sticks under the bottom (and under the sideboards' top at the front)
const LEG = 105; // clear height under the rails
const OV = 10; // the top overhangs the sides and the front by this much
const GR = 6; // the backs run in grooves this far in from the back edges

type Def = { kind: CustomFix["kind"]; len: number; dia: number; name?: string; included?: boolean };

const CAM_BOLT: Def = { kind: "camScrew", len: 35, dia: 6, name: "Cam bolt" };
const CAM: Def = { kind: "cam", len: 10, dia: 15, name: "Cam lock" };
const DOWEL: Def = { kind: "dowel", len: 30, dia: 6 };
const LONG_SCREW: Def = { kind: "screw", len: 40, dia: 4 };
const SMALL_SCREW: Def = { kind: "screw", len: 14, dia: 3 };
const HINGE: Def = { kind: "hinge", len: 50, dia: 35, name: "Hinge" };
const CRANKED: Def = { kind: "hinge", len: 52, dia: 35, name: "Cranked hinge" };
const SUPPORT: Def = { kind: "pin", len: 16, dia: 5, name: "Shelf support" };
const KNOB: Def = { kind: "knob", len: 25, dia: 30, name: "Knob" };
const KNOB_SCREW: Def = { kind: "screw", len: 25, dia: 4, name: "Knob screw" };
const BLOCK: Def = { kind: "angle", len: 16, dia: 20, name: "Corner block" };
const PAD: Def = { kind: "glide", len: 3, dia: 20, name: "Felt pad" };
const DOOR_STOP: Def = { kind: "clip", len: 10, dia: 30, name: "Door stop" };
const STRAP: Def = { kind: "strap", len: 110, dia: 20, name: "Wall strap" };
const STRAP_SCREW: Def = { kind: "screw", len: 12, dia: 4, name: "Strap screw" };
const WASHER: Def = { kind: "washer", len: 1.5, dia: 12 };
const WALL_BRACKET: Def = { kind: "angle", len: 30, dia: 20, name: "Wall bracket" };
const BRACKET_SCREW: Def = { kind: "screw", len: 16, dia: 4, name: "Bracket screw" };
const WALL_SCREW: Def = { kind: "screw", len: 40, dia: 4, name: "Wall screw", included: true };
const WALL_PLUG: Def = { kind: "plug", len: 30, dia: 6, included: true };

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

/** A part drawn as the boxes it is made of, given in the product's frame. */
function fromBoxes(boxes: { min: Vec3; max: Vec3 }[]): { size: Vec3; pos: Vec3; pieces: PartPiece[] } {
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

const SX = [-1, 1] as const;
const offset = (ids: string[], v: Vec3) => Object.fromEntries(ids.map((id) => [id, v] as [string, Vec3]));

/* ---------- the carcass every Camille piece shares ---------- */

interface Geo {
  W: number;
  D: number;
  Ht: number; // top of the top
  xo: number; // outside of the posts
  xi: number; // inside faces of the sides (posts and panel)
  zB: number; // back of the sides
  zF: number; // front of the posts
  y1: number; // underside of the top
  yr0: number; // rails: underside
  yr1: number; // rails: top, the bottom's underside
  yb1: number; // the bottom's top face
  zk: number; // the backs' back face
  zbk: number; // the backs' front face, the back of the bottom
  zf: number; // the front of the bottom, rails and divider
  zd0: number; // doors: back face
  zd1: number; // doors: front face
  zc: number; // the bottom's centre, front to back
  dB: number; // the bottom's depth
  yd0: number; // doors: bottom edge
  yd1: number; // doors: top edge
}

function geo(W: number, D: number, Ht: number): Geo {
  const xo = W / 2 - OV, xi = xo - P;
  const zB = -D / 2, zF = D / 2 - OV;
  const zk = zB + P + GR, zbk = zk + BK;
  const zd1 = zF - 2, zd0 = zd1 - FT, zf = zd0 - 2;
  const yr0 = LEG, yr1 = LEG + RS, yb1 = yr1 + T, y1 = Ht - TT;
  return { W, D, Ht, xo, xi, zB, zF, y1, yr0, yr1, yb1, zk, zbk, zf, zd0, zd1, zc: (zbk + zf) / 2, dB: zf - zbk, yd0: yr1 + 2, yd1: y1 - 2 };
}

/** A point t of the way from the back of the bottom to its front. */
const along = (g: Geo, t: number) => g.zbk + t * g.dB;
const zBolt = (g: Geo) => [along(g, 0.12), along(g, 0.88)]; // cam bolts along a depth
const zDowel = (g: Geo) => [along(g, 0.32), along(g, 0.68)]; // dowels along a depth
const zRailF = (g: Geo) => g.zf - RS / 2; // centre of the front rail
const zRailB = (g: Geo) => g.zk - 16 + RS / 2; // centre of the back rail, which reaches behind the backs

interface Names {
  left: string;
  right: string;
  bottom: string;
  rail: string;
  divider: string;
  top: string;
  backL: [string, string]; // label, name
  backR: [string, string];
}

/**
 * Sides (SL, SR), the bottom (BOT), its front and back rails (RF, RB), the divider (DIV), the top (TOP) and a back
 * panel either side of the divider (BKL, BKR); with `topRail` a third rail under the top at the front (RT), and the
 * divider notched round it.
 */
function carcass(p: Parts, g: Geo, n: Names, topRail: boolean) {
  for (const sx of SX) {
    const [x0, x1] = sx < 0 ? [-g.xo, -g.xi] : [g.xi, g.xo];
    const [p0, p1] = sx < 0 ? [-g.xi - T, -g.xi] : [g.xi, g.xi + T];
    const m = fromBoxes([
      { min: [x0, 0, g.zB], max: [x1, g.y1, g.zB + P] },
      { min: [x0, 0, g.zF - P], max: [x1, g.y1, g.zF] },
      { min: [p0, LEG, g.zB + P], max: [p1, g.y1, g.zF - P] },
    ]);
    p.add(sx < 0 ? "SL" : "SR", sx < 0 ? n.left : n.right, sx < 0 ? "Left side" : "Right side", m.size, m.pos, "board", m.pieces);
  }
  p.add("BOT", n.bottom, "Bottom", [2 * g.xi, T, g.dB], [0, g.yr1 + T / 2, g.zc]);
  p.add("RF", n.rail, "Rail", [2 * g.xi, RS, RS], [0, g.yr0 + RS / 2, zRailF(g)]);
  p.add("RB", n.rail, "Rail", [2 * g.xi, RS, RS], [0, g.yr0 + RS / 2, zRailB(g)]);
  if (topRail) p.add("RT", n.rail, "Rail", [2 * g.xi, RS, RS], [0, g.y1 - RS / 2, zRailF(g)]);
  const z0 = g.zk - GR; // the divider reaches back past the backs, which run in its grooves
  const div = fromBoxes(
    topRail
      ? [
          { min: [-T / 2, g.yb1, z0], max: [T / 2, g.y1 - RS, g.zf] },
          { min: [-T / 2, g.y1 - RS, z0], max: [T / 2, g.y1, g.zf - RS] },
        ]
      : [{ min: [-T / 2, g.yb1, z0], max: [T / 2, g.y1, g.zf] }],
  );
  p.add("DIV", n.divider, "Divider", div.size, div.pos, "board", topRail ? div.pieces : undefined);
  p.add("TOP", n.top, "Top", [g.W, TT, g.D], [0, g.Ht - TT / 2, 0]);
  const bw = g.xi + GR - (T / 2 - GR);
  const bx = (g.xi + GR + (T / 2 - GR)) / 2;
  p.add("BKL", n.backL[0], n.backL[1], [bw, g.y1 - g.yr1, BK], [-bx, (g.yr1 + g.y1) / 2, g.zk + BK / 2], "fiber");
  p.add("BKR", n.backR[0], n.backR[1], [bw, g.y1 - g.yr1, BK], [bx, (g.yr1 + g.y1) / 2, g.zk + BK / 2], "fiber");
}

const sideId = (sx: number) => (sx < 0 ? "SL" : "SR");

/** Cam bolts in a side's inside face: two for the bottom, one for each rail, one for the top rail if there is one. */
const sideBolts = (g: Geo, sx: number, topRail: boolean, more: Vec3[] = []): CustomFix =>
  fx(
    CAM_BOLT,
    [
      ...zBolt(g).map((z): Vec3 => [sx * g.xi, g.yr1 + T / 2, z]),
      [sx * g.xi, g.yr0 + RS / 2, zRailF(g)],
      [sx * g.xi, g.yr0 + RS / 2, zRailB(g)],
      ...(topRail ? [[sx * g.xi, g.y1 - RS / 2, zRailF(g)] as Vec3] : []),
      ...more,
    ],
    [sx, 0, 0],
    sideId(sx),
  );

/** A felt pad under each leg. */
const legPads = (g: Geo): CustomFix[] =>
  SX.map((sx) => fx(PAD, [g.zB + P / 2, g.zF - P / 2].map((z): Vec3 => [sx * (g.xi + P / 2), 0, z]), [0, 1, 0], sideId(sx)));

/** The two rails under the bottom: dowels in the bottom's underside at `dx`, screws up through the rails at `sx`. */
const railFix = (g: Geo, dx: number[], sxs: number[], screw: Def): CustomFix[] => [
  ...(dx.length ? (["RF", "RB"] as const).map((r) => fx(DOWEL, dx.map((x): Vec3 => [x, g.yr1, r === "RF" ? zRailF(g) : zRailB(g)]), [0, 1, 0], "BOT", r)) : []),
  ...(["RF", "RB"] as const).map((r) => fx(screw, sxs.map((x): Vec3 => [x, g.yr0, r === "RF" ? zRailF(g) : zRailB(g)]), [0, 1, 0], r, "BOT")),
];

/** The divider onto the bottom: two dowels in the bottom's top face, two screws up through the bottom. */
const dividerFix = (g: Geo, screw: Def): CustomFix[] => [
  fx(DOWEL, zDowel(g).map((z): Vec3 => [0, g.yb1, z]), [0, -1, 0], "BOT", "DIV"),
  fx(screw, [along(g, 0.16), along(g, 0.84)].map((z): Vec3 => [0, g.yr1, z]), [0, 1, 0], "BOT", "DIV"),
];

/** A side onto the bottom and rails: two dowels in the bottom's end, cam locks in the bottom and each rail end. */
const sideOnFix = (g: Geo, sx: number, topRail: boolean): CustomFix[] => {
  const xc = sx * (g.xi - 25);
  return [
    fx(DOWEL, zDowel(g).map((z): Vec3 => [sx * g.xi, g.yr1 + T / 2, z]), [-sx, 0, 0], "BOT", sideId(sx)),
    fx(CAM, zBolt(g).map((z): Vec3 => [xc, g.yb1, z]), [0, -1, 0], "BOT"),
    fx(CAM, [[xc, g.yr0 + RS / 2, g.zf - RS]], [0, 0, 1], "RF"),
    fx(CAM, [[xc, g.yr0 + RS / 2, g.zk + 9]], [0, 0, -1], "RB"),
    ...(topRail ? [fx(CAM, [[xc, g.y1 - RS / 2, g.zf - RS]], [0, 0, 1], "RT")] : []),
  ];
};

/** The uprights the top sits on: the side panels and the divider. */
const uprights = (g: Geo) => [
  { id: "SL", x: -(g.xi + T / 2), face: -g.xi, dir: [-1, 0, 0] as Vec3 },
  { id: "DIV", x: 0, face: -T / 2, dir: [1, 0, 0] as Vec3 },
  { id: "SR", x: g.xi + T / 2, face: g.xi, dir: [1, 0, 0] as Vec3 },
];
const topBolts = (g: Geo): CustomFix => fx(CAM_BOLT, uprights(g).flatMap((u) => zBolt(g).map((z): Vec3 => [u.x, g.y1, z])), [0, 1, 0], "TOP");
const topDowels = (g: Geo): CustomFix[] => uprights(g).map((u) => fx(DOWEL, zDowel(g).map((z): Vec3 => [u.x, g.y1, z]), [0, -1, 0], u.id, "TOP"));
const topCams = (g: Geo): CustomFix[] => uprights(g).map((u) => fx(CAM, zBolt(g).map((z): Vec3 => [u.face, g.y1 - 25, z]), u.dir, u.id));

/** Two wall brackets under the top at the back, each with its screw; then plugs and wall screws. */
const bracketX = (g: Geo) => [-g.W / 4, g.W / 4];
const wallBrackets = (g: Geo): CustomFix[] => [
  fx(WALL_BRACKET, bracketX(g).map((x): Vec3 => [x, g.y1, g.zB + 14]), [0, 1, 0], "TOP"),
  fx(BRACKET_SCREW, bracketX(g).map((x): Vec3 => [x, g.y1, g.zB + 36]), [0, 1, 0], "TOP"),
];
const bracketsToWall = (g: Geo): CustomFix[] => [
  fx(WALL_PLUG, bracketX(g).map((x): Vec3 => [x, g.y1 - 18, g.zB - 1]), [0, 0, -1]),
  fx(WALL_SCREW, bracketX(g).map((x): Vec3 => [x, g.y1 - 18, g.zB + 2]), [0, 0, -1]),
];

/** Two wall straps screwed to the back edge of a top, a washer under each screw; then plugs, washers and screws. */
const strapX = (W: number) => [-W / 4, W / 4];
const straps = (W: number, y: number, z: number, on: string): CustomFix[] => [
  fx(STRAP, strapX(W).map((x): Vec3 => [x, y, z]), [0, 0, 1], on),
  fx(WASHER, strapX(W).map((x): Vec3 => [x, y, z - 1]), [0, 0, 1], on),
  fx(STRAP_SCREW, strapX(W).map((x): Vec3 => [x, y, z - 2.5]), [0, 0, 1], on),
];
const strapsToWall = (W: number, y: number, z: number): CustomFix[] => [
  fx(WALL_PLUG, strapX(W).map((x): Vec3 => [x, y, z - 1]), [0, 0, -1]),
  fx(WASHER, strapX(W).map((x): Vec3 => [x, y, z + 4]), [0, 0, -1]),
  fx(WALL_SCREW, strapX(W).map((x): Vec3 => [x, y, z + 5.5]), [0, 0, -1]),
];

/** Shelf supports for a shelf resting on two faces, front and back on each. */
interface Face {
  id: string;
  x: number;
  dir: Vec3;
}
const supports = (g: Geo, faces: Face[], y: number): CustomFix[] => faces.map((f) => fx(SUPPORT, [g.zbk + 40, g.zf - 40].map((z): Vec3 => [f.x, y - 3, z]), f.dir, f.id));
const bayFaces = (g: Geo, sx: number): Face[] =>
  sx < 0
    ? [
        { id: "SL", x: -g.xi, dir: [-1, 0, 0] },
        { id: "DIV", x: -T / 2, dir: [1, 0, 0] },
      ]
    : [
        { id: "DIV", x: T / 2, dir: [-1, 0, 0] },
        { id: "SR", x: g.xi, dir: [1, 0, 0] },
      ];

/** A door: where it is, which edge hangs, the face its hinge plates screw to. */
interface Door {
  id: string;
  x0: number;
  x1: number;
  hinge: "L" | "R";
  on: string;
  face: number;
  fdir: Vec3;
  def: Def;
}
const hingeY = (g: Geo) => [g.yd0 + 90, g.yd1 - 90];
const cupX = (d: Door) => (d.hinge === "L" ? d.x0 + 22 : d.x1 - 22);
const knobX = (d: Door) => (d.hinge === "L" ? d.x1 - 35 : d.x0 + 35);
const knobY = (g: Geo) => g.yd0 + 0.55 * (g.yd1 - g.yd0);
/** Hinge cups into the door's back, two screws each, and the knob with its screw from behind. */
const doorFix = (g: Geo, d: Door): CustomFix[] => [
  fx(d.def, hingeY(g).map((y): Vec3 => [cupX(d), y, g.zd0]), [0, 0, 1], d.id, undefined, d.hinge === "R" ? { twist: Math.PI } : {}),
  fx(
    { kind: "screw", len: 12, dia: 3.5 },
    hingeY(g).flatMap((y) => [-12, 12].map((k): Vec3 => [cupX(d) + (d.hinge === "L" ? 24 : -24), y + k, g.zd0])),
    [0, 0, 1],
    d.id,
  ),
  fx(KNOB, [[knobX(d), knobY(g), g.zd1]], [0, 0, -1], d.id),
  fx(KNOB_SCREW, [[knobX(d), knobY(g), g.zd0]], [0, 0, 1], d.id),
];
/** Four screws through each hinge plate into the side or divider. */
const plateFix = (g: Geo, d: Door, screw: Def): CustomFix =>
  fx(
    screw,
    hingeY(g).flatMap((y) => [-16, 16].flatMap((k) => [g.zf - 20, g.zf - 52].map((z): Vec3 => [d.face, y + k, z]))),
    d.fdir,
    d.on,
    d.id,
  );
/** The same with the hinge screws named by the manual's size. */
const withScrew = (fixes: CustomFix[], screw: Def): CustomFix[] => fixes.map((f) => (f.kind === "screw" && f.name === undefined ? { ...f, len: screw.len, dia: screw.dia } : f));

const doorPart = (p: Parts, g: Geo, d: Door, label: string, name: string) => p.add(d.id, label, name, [d.x1 - d.x0, g.yd1 - g.yd0, FT], [(d.x0 + d.x1) / 2, (g.yd0 + g.yd1) / 2, (g.zd0 + g.zd1) / 2]);

/** Corner blocks behind the backs, screwed to the sides and divider (and, `mid`, to the top and the back rail). */
const blockFix = (g: Geo, mid: boolean, screw: Def): CustomFix[] => {
  const zb = g.zk - 4;
  const ys = [g.y1 - 12, g.yr1 + 12];
  const edges = [
    { back: "BKL", x: -g.xi, dir: [-1, 0, 0] as Vec3, on: "SL" },
    { back: "BKL", x: -T / 2, dir: [1, 0, 0] as Vec3, on: "DIV" },
    { back: "BKR", x: T / 2, dir: [-1, 0, 0] as Vec3, on: "DIV" },
    { back: "BKR", x: g.xi, dir: [1, 0, 0] as Vec3, on: "SR" },
  ];
  const mids = mid ? [-1, 1].map((sx) => ({ back: sx < 0 ? "BKL" : "BKR", x: (sx * (g.xi + T / 2)) / 2 })) : [];
  return [
    ...edges.map((e) => fx(BLOCK, ys.map((y): Vec3 => [e.x - e.dir[0] * 10, y, zb]), [0, 0, 1], e.back)),
    ...edges.map((e) => fx(screw, ys.map((y, j): Vec3 => [e.x, y + (j ? -6 : 6), zb]), e.dir, e.on)),
    ...mids.map((m) => fx(BLOCK, ys.map((y): Vec3 => [m.x, y, zb]), [0, 0, 1], m.back)),
    ...mids.flatMap((m) => [fx(screw, [[m.x, g.y1, zb]], [0, 1, 0], "TOP"), fx(screw, [[m.x, g.yr1, zb]], [0, -1, 0], "RB")]),
  ];
};

const lie = "-z" as const; // on its front edges
const sideFrom = { SL: [-300, 0, 0] as Vec3, SR: [300, 0, 0] as Vec3 };
const DOOR_OUT: Vec3 = [0, 0, 420];

/* ---------- the sideboards: two bays of two doors, a top rail and a middle foot ---------- */

interface SideboardOpts {
  four: boolean; // the 4 Door Sideboard's manual (43636990); otherwise the Sideboard's (43266845)
}

function sideboardParts(p: Parts, g: Geo, four: boolean) {
  const N = four
    ? { top: "1", backL: ["2", "Left back panel"], backR: ["3", "Right back panel"], right: "4", shelf: "5", bottom: "6", outer: "7", left: "8", rail: "9", divider: "10", inner: "11", foot: "12" }
    : { top: "1", backL: ["2", "Back panel"], backR: ["2", "Back panel"], divider: "3", right: "4", shelf: "5", bottom: "6", outer: "7", left: "8", rail: "9", foot: "10", inner: "11" };
  carcass(p, g, { left: N.left, right: N.right, bottom: N.bottom, rail: N.rail, divider: N.divider, top: N.top, backL: N.backL as [string, string], backR: N.backR as [string, string] }, true);
  // the middle foot under the bottom, on a leveller (4 door) or a felt pad
  const fy0 = four ? 10 : 3;
  p.add("FOOT", N.foot, "Middle foot", [40, g.yr1 - fy0, 40], [0, (fy0 + g.yr1) / 2, g.zc]);
  // a shelf in each bay, halfway up
  const ys = Math.round((g.yb1 + g.y1) / 2);
  const sw = g.xi - T / 2 - 2;
  for (const sx of SX) p.add(sx < 0 ? "SHL" : "SHR", N.shelf, "Shelf", [sw, T, g.dB - 7], [sx * (T / 2 + 1 + sw / 2), ys + T / 2, g.zbk + 2 + (g.dB - 7) / 2]);
  // two doors in each bay: the outer ones hang on the sides, the inner ones on the divider
  const mid = (g.xi + T / 2) / 2;
  const doors: (Door & { outer: boolean })[] = [
    { id: "DOL", x0: -g.xi + 2, x1: -mid - 1.5, hinge: "L", on: "SL", face: -g.xi, fdir: [-1, 0, 0], def: HINGE, outer: true },
    { id: "DIL", x0: -mid + 1.5, x1: -T / 2 - 2, hinge: "R", on: "DIV", face: -T / 2, fdir: [1, 0, 0], def: CRANKED, outer: false },
    { id: "DIR", x0: T / 2 + 2, x1: mid - 1.5, hinge: "L", on: "DIV", face: T / 2, fdir: [-1, 0, 0], def: CRANKED, outer: false },
    { id: "DOR", x0: mid + 1.5, x1: g.xi - 2, hinge: "R", on: "SR", face: g.xi, fdir: [1, 0, 0], def: HINGE, outer: true },
  ];
  for (const d of doors) doorPart(p, g, d, d.outer ? N.outer : N.inner, d.outer ? "Outer door" : "Inner door");
  return { doors, ys, mid };
}

function sideboard(s: ProductSpec, o: SideboardOpts): CustomParams {
  const g = geo(s.size.w * 10, s.size.d * 10, s.size.h * 10);
  const p = new Parts();
  const { doors, ys, mid } = sideboardParts(p, g, o.four);
  const doorIds = doors.map((d) => d.id);
  const screw12 = o.four ? { kind: "screw" as const, len: 12, dia: 3.5 } : { kind: "screw" as const, len: 12, dia: 4 }; // C / c
  const railScrewX = [-625, -375, -125, 125, 375, 625].map((x) => (x * g.xi) / 750);
  const stops = (screw: Def): CustomFix[] => [
    fx(DOOR_STOP, SX.map((sx): Vec3 => [sx * mid, g.yb1, g.zf - 15]), [0, -1, 0], "BOT"),
    fx(screw, SX.flatMap((sx) => [-12, 12].map((k): Vec3 => [sx * mid + k, g.yb1, g.zf - 15])), [0, -1, 0], "BOT"),
  ];
  const railTopScrews = fx(LONG_SCREW, railScrewX.map((x): Vec3 => [x, g.y1 - RS, zRailF(g)]), [0, 1, 0], "RT", "TOP");

  const steps: CustomStep[] = [];
  steps.push({
    title: "Turn cam bolts into the sides and stick on the felt pads",
    detail: `Lay both sides (4, 8) inside face up. Five cam bolts (${o.four ? "A" : "a"}) into each, four by the legs and one at the top front, and a felt pad (${o.four ? "N" : "n"}) under each leg.`,
    fix: [sideBolts(g, -1, true), sideBolts(g, 1, true), ...legPads(g)],
    wait: ["SL", "SR"],
    from: sideFrom,
    tools: ["screwdriver"],
  });
  if (o.four) {
    steps.push({
      title: "Screw the rails and the middle foot under the bottom",
      detail: "With a helper, lay the bottom (6) upside down. Six dowels (D) and twelve long screws (E) fix the two rails (9) along its front and back edges. Push a dowel into the middle foot (12), set it in the middle, drive a connector screw (O) through the bottom into it with the Allen key (P) and screw the leveller (Q) into its end.",
      add: ["BOT", "RF", "RB", "FOOT"],
      fix: [
        ...railFix(g, [-500, 0, 500].map((x) => (x * g.xi) / 750), railScrewX, LONG_SCREW),
        fx(DOWEL, [[0, g.yr1, g.zc - 10]], [0, -1, 0], "FOOT", "BOT"),
        fx({ kind: "screw", len: 40, dia: 7, name: "Connector screw" }, [[0, g.yb1, g.zc + 10]], [0, -1, 0], "BOT", "FOOT"),
        fx({ kind: "foot", len: 10, dia: 24, name: "Leveller" }, [[0, 0, g.zc]], [0, 1, 0], "FOOT"),
      ],
      pose: "-y",
      people: 2,
      tools: ["screwdriver", "allen"],
      warnings: ["floor"],
    });
    steps.push({
      title: "Fix the divider onto the bottom",
      detail: "Two dowels (D) into the bottom, push the divider (10) on and drive two connector screws (O) up through the bottom into it with the Allen key.",
      add: ["DIV"],
      fix: dividerFix(g, { kind: "screw", len: 40, dia: 7, name: "Connector screw" }),
      pose: lie,
      tools: ["allen"],
    });
  } else {
    steps.push({
      title: "Screw the rails and the middle foot under the bottom",
      detail: "Lay the bottom (6) upside down. Twelve long screws (e) fix the two rails (9) along its front and back edges, and one more goes through the bottom into the middle foot (10).",
      add: ["BOT", "RF", "RB", "FOOT"],
      fix: [...railFix(g, [], railScrewX, LONG_SCREW), fx(LONG_SCREW, [[0, g.yb1, g.zc]], [0, -1, 0], "BOT", "FOOT")],
      pose: "-y",
      tools: ["screwdriver"],
      warnings: ["floor"],
    });
    steps.push({
      title: "Fix the divider onto the bottom",
      detail: "Two dowels (d) into the bottom, push the divider (3) on and drive two long screws (e) up through the bottom into it. Stick a felt pad (n) under the middle foot.",
      add: ["DIV"],
      fix: [...dividerFix(g, LONG_SCREW), fx(PAD, [[0, 0, g.zc]], [0, 1, 0], "FOOT")],
      pose: lie,
      tools: ["screwdriver"],
    });
  }
  const B = o.four ? "B" : "b", Dw = o.four ? "D" : "d";
  steps.push({
    title: "Fit the left side and the top rail",
    detail: `With the parts on their front edges, push two dowels (${Dw}) into the end of the bottom, set the third rail (9) at the top front and press the left side (8) on. Turn five cam locks (${B}): two in the bottom, one in each bottom rail and one in the top rail.`,
    add: ["RT", "SL"],
    fix: sideOnFix(g, -1, true),
    from: { RT: [0, 400, 0] },
    pose: lie,
    tools: ["screwdriver"],
    warnings: ["floor"],
  });
  steps.push({
    title: "Fit the right side",
    detail: `Two dowels (${Dw}) into the other end of the bottom, press the right side (4) onto the bottom and the three rails, and turn five cam locks (${B}).`,
    add: ["SR"],
    fix: sideOnFix(g, 1, true),
    pose: lie,
    tools: ["screwdriver"],
  });
  const backs = ["BKL", "BKR"];
  if (o.four) {
    steps.push({
      title: "Stand it up, slide in the backs and fit the door stops",
      detail: "Lower the back panels (2, 3) down the grooves either side of the divider. Push eight dowels (D) into the top edges of the sides, the divider and the top rail, and screw a door stop (L) to the bottom at the front of each bay with two small screws (I).",
      add: backs,
      fix: [...topDowels(g), fx(DOWEL, [-mid, mid].map((x): Vec3 => [x, g.y1, zRailF(g)]), [0, -1, 0], "RT", "TOP"), ...stops(SMALL_SCREW)],
      from: offset(backs, [0, 600, 0]),
      pose: "+y",
      tools: ["screwdriver"],
    });
    steps.push({
      title: "Fix the top on",
      detail: "Turn six cam bolts (A) into the underside of the top (1) and screw the two wall brackets (K) to it at the back. Lower it onto the dowels, turn six cam locks (B) and drive six long screws (E) up through the top rail into it.",
      add: ["TOP"],
      fix: [topBolts(g), ...wallBrackets(g), ...topCams(g), railTopScrews],
      from: { TOP: [0, 400, 0] },
      tools: ["screwdriver"],
    });
    steps.push({
      title: "Put in the shelf supports and shelves",
      detail: "Eight shelf supports (J), four in each bay at the height you want, then rest a shelf (5) on each set.",
      add: ["SHL", "SHR"],
      fix: [...supports(g, bayFaces(g, -1), ys), ...supports(g, bayFaces(g, 1), ys)],
      from: offset(["SHL", "SHR"], [0, 0, 450]),
      kind: "shelves",
    });
    steps.push({
      title: "Fit the hinges and knobs, then hang the doors",
      detail: "Lay the doors face down on a rug: two hinges (G) on each outer door (7) and two cranked hinges (H) on each inner door (11), two screws (C) per hinge, and a knob (F) on each. Hang the outer doors on the sides and the inner doors on the divider, four screws (C) through each hinge plate.",
      add: doorIds,
      fix: doors.flatMap((d) => [...withScrew(doorFix(g, d), screw12), plateFix(g, d, screw12)]),
      from: offset(doorIds, DOOR_OUT),
      tools: ["screwdriver"],
      kind: "doors",
      warnings: ["floor"],
    });
    steps.push({
      title: "Hold the backs in with the corner blocks",
      detail: "Turn it round. Twelve corner blocks (M) along the edges of the two back panels, each with a small screw (I).",
      fix: blockFix(g, true, SMALL_SCREW),
      tools: ["screwdriver"],
    });
    steps.push({
      title: "Fix it to the wall",
      detail: "Push it against the wall and mark through the two brackets, then drill, push in the plugs and drive the wall screws (K) through the brackets. Check the wall for pipes and cables first.",
      fix: bracketsToWall(g),
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    });
  } else {
    steps.push({
      title: "Stand it up, slide in the backs and fit the door stops",
      detail: "Lower the two back panels (2) down the grooves either side of the divider, then screw a door stop (r) to the bottom at the front of each bay with two screws (c).",
      add: backs,
      fix: stops(screw12),
      from: offset(backs, [0, 600, 0]),
      pose: "+y",
      tools: ["screwdriver"],
    });
    steps.push({
      title: "Turn cam bolts into the top",
      detail: "Lay the top (1) upside down on a rug and turn six cam bolts (a) into it: two over each side and two over the divider.",
      fix: [topBolts(g)],
      wait: ["TOP"],
      from: { TOP: [0, 0, 400] },
      tools: ["screwdriver"],
      warnings: ["floor"],
    });
    steps.push({
      title: "Fix the top on",
      detail: "Six dowels (d) into the top edges of the sides and the divider. Lower the top onto them, turn six cam locks (b) and drive six long screws (e) up through the top rail into it.",
      add: ["TOP"],
      fix: [...topDowels(g), ...topCams(g), railTopScrews],
      from: { TOP: [0, 400, 0] },
      tools: ["screwdriver"],
    });
    steps.push({
      title: "Screw the hinges and knobs onto the doors",
      detail: "Lay the doors face down on a rug: two hinges (g) on each outer door (7) and two cranked hinges (h) on each inner door (11), two screws (c) per hinge, and a knob (f) on each.",
      fix: doors.flatMap((d) => withScrew(doorFix(g, d), screw12)),
      wait: doorIds,
      from: offset(doorIds, DOOR_OUT),
      tools: ["screwdriver"],
      kind: "doors",
      warnings: ["floor"],
    });
    steps.push({
      title: "Put in the shelf supports and shelves",
      detail: "Eight shelf supports (j), four in each bay at the height you want, then rest a shelf (5) on each set.",
      add: ["SHL", "SHR"],
      fix: [...supports(g, bayFaces(g, -1), ys), ...supports(g, bayFaces(g, 1), ys)],
      from: offset(["SHL", "SHR"], [0, 0, 450]),
      kind: "shelves",
    });
    steps.push({
      title: "Hang the doors",
      detail: "Hold each door in place and drive four screws (c) through each hinge plate: the outer doors (7) on the sides, the inner doors (11) on the divider.",
      add: doorIds,
      fix: doors.map((d) => plateFix(g, d, screw12)),
      from: offset(doorIds, DOOR_OUT),
      tools: ["screwdriver"],
      kind: "doors",
    });
    steps.push({
      title: "Fit the corner blocks and the wall straps",
      detail: "Turn it round. Twelve corner blocks (i) along the edges of the two back panels, each with its screw, then screw the two wall straps (k) to the back edge of the top with a washer under each screw.",
      fix: [...blockFix(g, true, SMALL_SCREW), ...straps(g.W, g.Ht - TT / 2, g.zB, "TOP")],
      tools: ["screwdriver"],
    });
    steps.push({
      title: "Fix it to the wall",
      detail: "Push it against the wall and mark through the straps, then drill, push in the plugs (m) and screw the straps to the wall with a washer under each screw. Check the wall for pipes and cables first.",
      fix: strapsToWall(g.W, g.Ht + 40, g.zB),
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    });
  }
  return { parts: p.list, steps };
}

/* ---------- the storage unit: a two door cabinet with a hutch on top ---------- */

const LOWER = 770; // the cabinet's height, to the top of its top (5); the hutch stands on it
const HUTCH_D = 210; // the hutch's depth, at the back of the top

function storageUnit(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const g = geo(W, D, LOWER);
  const p = new Parts();
  carcass(p, g, { left: "1", divider: "2", right: "3", top: "5", bottom: "6", rail: "9", backL: ["10", "Back panel"], backR: ["10", "Back panel"] }, false);
  const ys = Math.round((g.yb1 + g.y1) / 2);
  const sw = g.xi - T / 2 - 2;
  for (const sx of SX) p.add(sx < 0 ? "SHL" : "SHR", "4", "Shelf", [sw, T, g.dB - 7], [sx * (T / 2 + 1 + sw / 2), ys + T / 2, g.zbk + 2 + (g.dB - 7) / 2]);
  const doors: Door[] = [
    { id: "D7", x0: -g.xi + 2, x1: -T / 2 - 2, hinge: "L", on: "SL", face: -g.xi, fdir: [-1, 0, 0], def: HINGE },
    { id: "D8", x0: T / 2 + 2, x1: g.xi - 2, hinge: "R", on: "SR", face: g.xi, fdir: [1, 0, 0], def: HINGE },
  ];
  doorPart(p, g, doors[0], "7", "Left door");
  doorPart(p, g, doors[1], "8", "Right door");

  // the hutch: two sides on the top, a top over them, two fixed shelves and three backs, one to each opening
  const hz0 = -D / 2, hz1 = hz0 + HUTCH_D, hzc = (hz0 + hz1) / 2;
  const hxi = W / 2 - T;
  const hy0 = LOWER, hy1 = H - T;
  const hzk = hz0 + GR; // the hutch backs' back face
  const open = (hy1 - hy0 - 2 * T) / 3;
  const shelfY = [hy0 + open, hy0 + 2 * open + T]; // undersides of the two shelves
  const hb = (hy1 - hy0) / 3; // each back covers a third, meeting behind the shelves
  const hsd = hz1 - 2 - (hzk + BK);
  for (const sx of SX) p.add(sx < 0 ? "H11" : "H12", sx < 0 ? "11" : "12", sx < 0 ? "Hutch left side" : "Hutch right side", [T, hy1 - hy0, HUTCH_D], [sx * (hxi + T / 2), (hy0 + hy1) / 2, hzc]);
  p.add("H13", "13", "Hutch top", [W, T, HUTCH_D], [0, H - T / 2, hzc]);
  shelfY.forEach((y, i) => p.add(`H14-${i}`, "14", "Hutch shelf", [2 * hxi, T, hsd], [0, y + T / 2, hzk + BK + hsd / 2]));
  [0, 1, 2].forEach((i) => p.add(`H15-${i}`, "15", "Hutch back panel", [2 * (hxi + GR), hb, BK], [0, hy0 + hb * (i + 0.5), hzk + BK / 2], "fiber"));
  const hutch = ["H11", "H12", "H13", "H14-0", "H14-1", "H15-0", "H15-1", "H15-2"];
  // the hutch and the top are built beside the cabinet, to its right (staged parts are drawn 1.6 times their offset away)
  const HOFF: Vec3 = [(W + 250) / 1.6, 0, 0];
  const hFrom = offset([...hutch, "TOP"], HOFF);
  const hSide = (sx: number) => (sx < 0 ? "H11" : "H12");
  const hzBolt = [hzk + BK + 0.15 * hsd, hz1 - 2 - 0.15 * hsd];
  const hzDowel = [hzk + BK + 0.38 * hsd, hz1 - 2 - 0.38 * hsd];
  const shelfFix = (sx: number): CustomFix[] => [
    fx(DOWEL, shelfY.flatMap((y) => hzDowel.map((z): Vec3 => [sx * hxi, y + T / 2, z])), [sx, 0, 0], hSide(sx)),
    ...shelfY.map((y, i) => fx(CAM, hzBolt.map((z): Vec3 => [sx * (hxi - 25), y + T, z]), [0, -1, 0], `H14-${i}`)),
  ];
  const hutchZ = [hz0 + 0.15 * HUTCH_D, hz1 - 0.15 * HUTCH_D];
  const hutchZd = [hz0 + 0.38 * HUTCH_D, hz1 - 0.38 * HUTCH_D];

  // d: the dowels in this one are 8 x 30
  const D8: Def = { ...DOWEL, dia: 8 };
  const d8 = (fixes: CustomFix[]) => fixes.map((f) => (f.kind === "dowel" ? { ...f, dia: 8 } : f));
  const screw35: Def = { kind: "screw", len: 12, dia: 3.5 }; // c
  const back = { kind: "screw" as const, len: 14, dia: 3 }; // the corner blocks' screws (t)
  const steps: CustomStep[] = [
    {
      title: "Turn cam bolts into the sides and screw the rails under the bottom",
      detail: "Lay both sides inside face up, turn four cam bolts (a) into each by the legs and stick a felt pad (n) under each leg. Lay the bottom (6) upside down and fix the two rails (9) along its front and back edges with four dowels (d) and four long screws (e).",
      add: ["BOT", "RF", "RB"],
      fix: [sideBolts(g, -1, false), sideBolts(g, 1, false), ...legPads(g), ...d8(railFix(g, [-g.xi * 0.43, g.xi * 0.43], [-g.xi * 0.83, g.xi * 0.83], LONG_SCREW))],
      wait: ["SL", "SR"],
      from: sideFrom,
      pose: "-y",
      tools: ["screwdriver"],
      warnings: ["floor"],
    },
    {
      title: "Fix the divider onto the bottom",
      detail: "Two dowels (d) into the bottom, push the divider (2) on and drive two long screws (e) up through the bottom into it.",
      add: ["DIV"],
      fix: d8(dividerFix(g, LONG_SCREW)),
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Fit the left side",
      detail: "With the parts on their front edges, push two dowels (d) into the end of the bottom, press the left side (1) on and turn four cam locks (b): two in the bottom and one in each rail.",
      add: ["SL"],
      fix: d8(sideOnFix(g, -1, false)),
      pose: lie,
      tools: ["screwdriver"],
      warnings: ["floor"],
    },
    {
      title: "Fit the right side",
      detail: "Two dowels (d) into the other end of the bottom, press the right side (3) on and turn four cam locks (b).",
      add: ["SR"],
      fix: d8(sideOnFix(g, 1, false)),
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Stand it up and slide in the back panels",
      detail: "Lower the two back panels (10) down the grooves, one each side of the divider, smooth side in.",
      add: ["BKL", "BKR"],
      from: offset(["BKL", "BKR"], [0, 600, 0]),
      pose: "+y",
    },
    {
      title: "Turn cam bolts into the hutch top and sides",
      detail: "Twelve cam bolts (a): two into each end of the hutch top (13), and four into each hutch side (11, 12) for the shelves.",
      fix: [
        fx(CAM_BOLT, SX.flatMap((sx) => hutchZ.map((z): Vec3 => [sx * (hxi + T / 2), hy1, z])), [0, 1, 0], "H13"),
        ...SX.map((sx) => fx(CAM_BOLT, shelfY.flatMap((y) => hzBolt.map((z): Vec3 => [sx * hxi, y + T / 2, z])), [sx, 0, 0], hSide(sx))),
      ],
      wait: ["H11", "H12", "H13"],
      from: hFrom,
      tools: ["screwdriver"],
      warnings: ["floor"],
    },
    {
      title: "Fit the shelves to the right hutch side",
      detail: "The hutch is built lying on its back. Push four dowels (d) into the right hutch side (12), press both hutch shelves (14) on and turn four cam locks (b), then slide a back panel (15) along the grooves between the two shelves.",
      fix: d8(shelfFix(1)),
      wait: ["H14-0", "H14-1", "H15-1"],
      from: hFrom,
      pose: "+z",
      tools: ["screwdriver"],
      warnings: ["floor"],
    },
    {
      title: "Fit the left hutch side",
      detail: "Four dowels (d) into the left hutch side (11), press it onto the other ends of the shelves and turn four cam locks (b).",
      fix: d8(shelfFix(-1)),
      pose: "+z",
      tools: ["screwdriver"],
    },
    {
      title: "Close the hutch and turn cam bolts into the top",
      detail: "Slide the other two back panels (15) into the top and bottom openings. Four dowels (d) into the top edges of the hutch sides, press the hutch top (13) on and turn four cam locks (b). Then turn six cam bolts (a) into the underside of the top (5): two over each side and two over the divider.",
      fix: [
        ...SX.map((sx) => fx(D8, hutchZd.map((z): Vec3 => [sx * (hxi + T / 2), hy1, z]), [0, -1, 0], hSide(sx), "H13")),
        ...SX.map((sx) => fx(CAM, hutchZ.map((z): Vec3 => [sx * hxi, hy1 - 25, z]), [sx, 0, 0], hSide(sx))),
        topBolts(g),
      ],
      wait: ["H15-0", "H15-2", "TOP"],
      from: hFrom,
      pose: "+z",
      tools: ["screwdriver"],
    },
    {
      title: "Fix the hutch onto the top",
      detail: "Four dowels (d) into the bottom edges of the hutch sides. Set the top (5) against them and drive four connector screws (l) through it into the sides with the Allen key (m).",
      fix: [
        ...SX.map((sx) => fx(D8, hutchZd.map((z): Vec3 => [sx * (hxi + T / 2), hy0, z]), [0, 1, 0], hSide(sx), "TOP")),
        ...SX.map((sx) => fx({ kind: "screw", len: 50, dia: 5, name: "Connector screw" }, hutchZ.map((z): Vec3 => [sx * (hxi + T / 2), g.y1, z]), [0, 1, 0], "TOP", hSide(sx))),
      ],
      pose: "+z",
      tools: ["allen"],
    },
    {
      title: "Fix the top and the hutch onto the cabinet",
      detail: "With the cabinet on its back too, push six dowels (d) into the top edges of its sides and divider, press the top (5) with the hutch onto them and turn six cam locks (b).",
      add: ["TOP", ...hutch],
      fix: [...d8(topDowels(g)), ...topCams(g)],
      from: offset(["TOP", ...hutch], [0, 450, 0]),
      pose: "+z",
      tools: ["screwdriver"],
      warnings: ["floor"],
    },
    {
      title: "Screw the hinges and knobs onto the doors",
      detail: "Stand the unit up. Lay each door (7, 8) face down on a rug, press two hinges (f) into its cup holes with two screws (c) each, and fix a knob (h) with its screw (i) through the door from behind.",
      fix: doors.flatMap((d) => doorFix(g, d)),
      wait: doors.map((d) => d.id),
      from: offset(
        doors.map((d) => d.id),
        DOOR_OUT,
      ),
      pose: "+y",
      tools: ["screwdriver"],
      kind: "doors",
      warnings: ["floor"],
    },
    {
      title: "Put in the shelf supports and shelves",
      detail: "Eight shelf supports (g), four in each bay at the height you want, then rest a shelf (4) on each set.",
      add: ["SHL", "SHR"],
      fix: [...supports(g, bayFaces(g, -1), ys), ...supports(g, bayFaces(g, 1), ys)],
      from: offset(["SHL", "SHR"], [0, 0, 450]),
      kind: "shelves",
    },
    {
      title: "Hang the doors",
      detail: "Hold each door in place and drive four screws (c) through each hinge plate: door 7 on the left side, door 8 on the right.",
      add: doors.map((d) => d.id),
      fix: doors.map((d) => plateFix(g, d, screw35)),
      from: offset(
        doors.map((d) => d.id),
        DOOR_OUT,
      ),
      tools: ["screwdriver"],
      kind: "doors",
    },
    {
      title: "Fit the corner blocks and the wall straps",
      detail: "Turn it round. A corner block (t) against the backs at each corner, eight on the cabinet and four on the hutch, each with its screw. Screw the two wall straps (j) to the back edge of the hutch top, a washer under each screw.",
      fix: [
        ...blockFix(g, false, back),
        // on the hutch: at the top of the top back and the bottom of the bottom back, screwed to the sides
        ...SX.flatMap((sx) => [fx(BLOCK, [[sx * (hxi - 10), hy1 - 12, hzk - 3]], [0, 0, 1], "H15-2"), fx(BLOCK, [[sx * (hxi - 10), hy0 + 12, hzk - 3]], [0, 0, 1], "H15-0")]),
        ...SX.map((sx) => fx(back, [hy1 - 18, hy0 + 18].map((y): Vec3 => [sx * hxi, y, hzk - 3]), [sx, 0, 0], hSide(sx))),
        ...straps(W, H - T / 2, hz0, "H13"),
      ],
      tools: ["screwdriver"],
    },
    {
      title: "Fix it to the wall",
      detail: "Push it against the wall and mark through the straps, then drill, push in the plugs (k) and screw the straps to the wall with a washer under each screw. Check the wall for pipes and cables first.",
      fix: strapsToWall(W, H + 40, hz0),
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts: p.list, steps };
}

/* ---------- the cabinet with shelves: open shelves on the left, a door on the right ---------- */

function cabinet(s: ProductSpec): CustomParams {
  const g = geo(s.size.w * 10, s.size.d * 10, s.size.h * 10);
  const p = new Parts();
  carcass(p, g, { left: "1", right: "2", divider: "3", bottom: "4", rail: "5", top: "7", backL: ["8", "Back panel"], backR: ["8", "Back panel"] }, false);
  // the two fixed shelves split the left bay into three; the loose shelf sits halfway up the door bay
  const open = (g.y1 - g.yb1 - 2 * T) / 3;
  const fixedY = [g.yb1 + open, g.yb1 + 2 * open + T]; // undersides
  fixedY.forEach((y, i) => p.add(`F6-${i}`, "6", "Fixed shelf", [g.xi - T / 2, T, g.dB], [-(g.xi + T / 2) / 2, y + T / 2, g.zc]));
  const ys = Math.round((g.yb1 + g.y1) / 2);
  const sw = g.xi - T / 2 - 2;
  p.add("S10", "10", "Shelf", [sw, T, g.dB - 7], [T / 2 + 1 + sw / 2, ys + T / 2, g.zbk + 2 + (g.dB - 7) / 2]);
  const door: Door = { id: "D9", x0: T / 2 + 2, x1: g.xi - 2, hinge: "R", on: "SR", face: g.xi, fdir: [1, 0, 0], def: HINGE };
  doorPart(p, g, door, "9", "Door");
  const shelves = ["F6-0", "F6-1"];
  const zb = zBolt(g), zd = zDowel(g);
  const xs = -(T / 2 + 25), xl = -(g.xi - 25); // shelf cam locks: by the divider, by the left side
  const F: Def = { kind: "screw", len: 12, dia: 3.5 };
  const steps: CustomStep[] = [
    {
      title: "Turn cam bolts into the sides and screw the rails under the bottom",
      detail: "Lay the sides inside face up: eight cam bolts (A) into the left side (1), four of them for the shelves, and four into the right side (2) by its legs. Lay the bottom (4) upside down and fix the two rails (5) along its front and back edges with four dowels (C) and four long screws (E).",
      add: ["BOT", "RF", "RB"],
      fix: [
        sideBolts(
          g,
          -1,
          false,
          fixedY.flatMap((y) => zb.map((z): Vec3 => [-g.xi, y + T / 2, z])),
        ),
        sideBolts(g, 1, false),
        ...railFix(g, [-g.xi * 0.4, g.xi * 0.4], [-g.xi * 0.8, g.xi * 0.8], LONG_SCREW),
      ],
      wait: ["SL", "SR"],
      from: sideFrom,
      pose: "-y",
      tools: ["screwdriver"],
      warnings: ["floor"],
    },
    {
      title: "Fix the shelves to the divider",
      detail: "Four cam bolts (A) into the divider (3), then four dowels (C). Press the two fixed shelves (6) onto them and turn four cam locks (B).",
      fix: [
        fx(CAM_BOLT, fixedY.flatMap((y) => zb.map((z): Vec3 => [-T / 2, y + T / 2, z])), [1, 0, 0], "DIV"),
        fx(DOWEL, fixedY.flatMap((y) => zd.map((z): Vec3 => [-T / 2, y + T / 2, z])), [1, 0, 0], "DIV"),
        ...fixedY.map((y, i) => fx(CAM, zb.map((z): Vec3 => [xs, y + T, z]), [0, -1, 0], shelves[i])),
      ],
      wait: ["DIV", ...shelves],
      from: offset(["DIV", ...shelves], [0, 0, 400]),
      tools: ["screwdriver"],
      warnings: ["floor"],
    },
    {
      title: "Fix the divider onto the bottom",
      detail: "Two dowels (C) into the bottom, set the divider with its shelves on and drive two screws (D) up through the bottom into it.",
      add: ["DIV", ...shelves],
      fix: dividerFix(g, { kind: "screw", len: 35, dia: 4 }),
      from: offset(["DIV", ...shelves], [0, 400, 0]),
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Fit the right side",
      detail: "With the parts on their front edges, two dowels (C) into the end of the bottom, press the right side (2) on and turn four cam locks (B): two in the bottom and one in each rail.",
      add: ["SR"],
      fix: sideOnFix(g, 1, false),
      pose: lie,
      tools: ["screwdriver"],
      warnings: ["floor"],
    },
    {
      title: "Fit the left side",
      detail: "Six dowels (C) into the ends of the bottom and the two shelves, press the left side (1) on and turn eight cam locks (B). Stick a felt pad (N) under each leg.",
      add: ["SL"],
      fix: [
        ...sideOnFix(g, -1, false),
        ...fixedY.map((y, i) => fx(DOWEL, zd.map((z): Vec3 => [-g.xi, y + T / 2, z]), [1, 0, 0], shelves[i], "SL")),
        ...fixedY.map((y, i) => fx(CAM, zb.map((z): Vec3 => [xl, y + T, z]), [0, -1, 0], shelves[i])),
        ...legPads(g),
      ],
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Stand it up and slide in the backs",
      detail: "Lower the two back panels (8) down the grooves either side of the divider, then push six dowels (C) into the top edges of the sides and the divider.",
      add: ["BKL", "BKR"],
      fix: topDowels(g),
      from: offset(["BKL", "BKR"], [0, 600, 0]),
      pose: "+y",
    },
    {
      title: "Fix the top on",
      detail: "Six cam bolts (A) into the underside of the top (7), the two wall brackets (M) at its back edge and the door stop (I) under its front with two small screws (K). Lower it onto the dowels and turn six cam locks (B).",
      add: ["TOP"],
      fix: [
        topBolts(g),
        ...wallBrackets(g),
        fx(DOOR_STOP, [[T / 2 + 22, g.y1, g.zf - 15]], [0, 1, 0], "TOP"),
        fx(SMALL_SCREW, [-12, 12].map((k): Vec3 => [T / 2 + 22 + k, g.y1, g.zf - 15]), [0, 1, 0], "TOP"),
        ...topCams(g),
      ],
      from: { TOP: [0, 400, 0] },
      tools: ["screwdriver"],
    },
    {
      title: "Fit the hinges and knob, then hang the door",
      detail: "Lay the door (9) face down on a rug, press two hinges (G) into its cup holes with two screws (F) each and fix the knob (H). Hang it on the right side with four screws (F) through each hinge plate.",
      add: ["D9"],
      fix: [...doorFix(g, door), plateFix(g, door, F)],
      from: { D9: DOOR_OUT },
      tools: ["screwdriver"],
      kind: "doors",
    },
    {
      title: "Put in the shelf supports and the shelf",
      detail: "Four shelf supports (J) in the door bay at the height you want, then rest the shelf (10) on them.",
      add: ["S10"],
      fix: supports(g, bayFaces(g, 1), ys),
      from: { S10: [0, 0, 450] },
      kind: "shelves",
    },
    {
      title: "Hold the backs in with the corner blocks",
      detail: "Turn it round. Eight corner blocks (L) at the corners of the two back panels, each with a small screw (K).",
      fix: blockFix(g, false, SMALL_SCREW),
      tools: ["screwdriver"],
    },
    {
      title: "Fix it to the wall",
      detail: "Push it against the wall and mark through the two brackets, then drill, push in the plugs and drive the wall screws (M) through the brackets. Check the wall for pipes and cables first.",
      fix: bracketsToWall(g),
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts: p.list, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  switch (s.slug) {
    case "kmart-camille-storage-unit-with-adjustable-shelves":
      return storageUnit(s);
    case "kmart-camille-4-door-sideboard":
      return sideboard(s, { four: true });
    case "kmart-camille-sideboard":
      return sideboard(s, { four: false });
    case "kmart-camille-cabinet-with-shelves":
      return cabinet(s);
    default:
      return null;
  }
}

const family: Family = { names: ["KMART:CAMILLE"], recipe };
export default family;
