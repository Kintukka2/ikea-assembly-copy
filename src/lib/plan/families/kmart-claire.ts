import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's Claire range, read from its assembly manuals: the 3 Drawer Chest (its manual is printed for keycode 43635818
 * and Kmart serves the same file for 43635788) and the Bedside Table (keycodes 43746842 and 43635764). Both have thick
 * fluted sides rounded at the front corner, a top and a bottom with rounded corners and a low plinth frame, and both go
 * together with cam bolts (A), cam locks (B), dowels (C) and screws:
 *
 * - 3 Drawer Chest: runners (CR, CL) and cam bolts go on both sides. Lying on the right side (4), the back rail (11)
 *   and the two front rails (5) stand on it and the left side (3) goes on top. The lower back (7) slides in from the
 *   open bottom end and the bottom (2) is screwed on with four long screws (D). The plinth frame (rails 8, ends 9 and a
 *   middle 10) is put together, screwed under the bottom with ten screws (F), braced with four angle brackets (G) and
 *   given four felt pads (K). The top (1) takes four cam bolts and two wall brackets (L), the upper back (6) slides in
 *   from the top end and the top is locked on. Standing, eight brackets (J) hold the backs. Each drawer: five cam
 *   bolts in the front (12), the sides (14, 13) locked onto it, the bottom (15) down the grooves, a batten (16) under
 *   it, the back (17) screwed on, then the runners (DL, DR) and a handle (I) on the top edge. Two screws (M) and plugs
 *   (N) fix the wall brackets, and the drawers slide in.
 * - Bedside Table: the same build with one drawer over a fixed shelf (6) instead of rails. The shelf joins the left side
 *   (3) and then the right (4); standing, the upper back (5) slides down to the shelf and the top goes on; upside down,
 *   the lower back (7) slides in and the bottom and the plinth (rails 8, ends 9) follow.
 *
 * Kmart's hardware for the chest: 37 cam bolts (A, 6 x 35 mm), 37 cam locks (B, 15 x 10 mm), 18 dowels (C, 8 x 30 mm),
 * 4 screws (D, 7 x 38 mm), 66 screws (E, 3.5 x 14 mm), 10 screws (F, 4 x 48 mm), 4 angle brackets (G), the 4 mm hex key
 * (H), 3 handles (I), 8 back brackets (J), 4 felt pads (K, 25 x 15 x 3 mm), 2 wall brackets (L), 17 screws (M, 4 x 35
 * mm, two of them for the wall) and 2 wall plugs (N, 6 x 30 mm), with three of each runner part (CR, CL in the chest,
 * DR, DL on the drawers). The bedside table's list has the same letters: 16 A, 16 B, 20 C, 4 D, 33 E, 8 F, 4 G, 1 I,
 * 8 J, 4 K, 1 L, 5 M, 1 N and one of each runner part. Every count box in both manuals agrees with its list.
 *
 * The manuals' drawer steps show one drawer and say "x3"; the chest's guide does each of those steps for all three
 * drawers at once, so its counts match the manual's boxes (A x15 and so on). The last step of each manual only shows the
 * finished piece, so the guides end with the drawers going in. Part numbers and letters are Kmart's own.
 */

const ST = 40; // the fluted sides
const RS = 34; // the sides' rounded front corner
const TB = 18; // the top, the bottom and the bedside table's shelf
const RT = 60; // the top's and the bottom's rounded corners
const T = 15; // rails, plinth and drawer boxes
const FT = 18; // drawer fronts
const BK = 3; // back panels
const P = 40; // the plinth frame's height
const PI = 30; // the plinth stands in this far from the bottom's edges
const SET = 5; // the sides stand in this far from the top's and the bottom's edges
const OUT = 520; // parts built away from the carcass wait this far in front of it

type Def = { kind: CustomFix["kind"]; len: number; dia: number; name: string; included?: boolean };
const A: Def = { kind: "camScrew", len: 35, dia: 6, name: "Cam bolt" };
const B: Def = { kind: "cam", len: 10, dia: 15, name: "Cam lock" };
const C: Def = { kind: "dowel", len: 30, dia: 8, name: "Dowel" };
const D7: Def = { kind: "screw", len: 38, dia: 7, name: "Connector screw" };
const E: Def = { kind: "screw", len: 14, dia: 3.5, name: "Small screw" };
const F: Def = { kind: "screw", len: 48, dia: 4, name: "Long screw" };
const G: Def = { kind: "angle", len: 19, dia: 19, name: "Angle bracket" };
const I: Def = { kind: "handle", len: 60, dia: 10, name: "Handle" };
const J: Def = { kind: "clamp", len: 16, dia: 12, name: "Back bracket" };
const K: Def = { kind: "glide", len: 3, dia: 25, name: "Felt pad" };
const L: Def = { kind: "angle", len: 45, dia: 20, name: "Wall bracket" };
const M: Def = { kind: "screw", len: 35, dia: 4, name: "Screw" };
const N: Def = { kind: "plug", len: 30, dia: 6, name: "Wall plug", included: true };
const runner = (len: number, name: string): Def => ({ kind: "runner", len, dia: 30, name });

/** Fittings at exact points: what, where, the way they go in, the part they sit in and the part their other end meets. */
const fx = (def: Def, at: Vec3[], dir: Vec3, on?: string, mate?: string): CustomFix => ({ ...def, count: at.length, at, dir, ...(on ? { on } : {}), ...(mate ? { mate } : {}) });
const SX = [-1, 1] as const;
const offset = (ids: string[], v: Vec3) => Object.fromEntries(ids.map((id) => [id, v] as [string, Vec3]));

/** A board lying flat, cut to a plan outline of [x, z] points from its centre, `t` thick. */
const flat = (outline: [number, number][], t: number, round = 0): PartPiece => ({ shape: "slab", outline, round, size: [0, t, 0], pos: [0, 0, 0] });
const rect = (w: number, d: number): [number, number][] => [
  [-w / 2, -d / 2],
  [w / 2, -d / 2],
  [w / 2, d / 2],
  [-w / 2, d / 2],
];

/** A side seen from above: ST thick and `d` deep, its front outside corner rounded. sx is -1 for the left side. */
function sidePlan(sx: number, d: number): [number, number][] {
  const o = (sx * ST) / 2, i = (-sx * ST) / 2;
  const cx = o - sx * RS, cz = d / 2 - RS;
  const arc = Array.from({ length: 9 }, (_, k) => {
    const a = (Math.PI / 2) * (1 - k / 8); // from the outside face round to the front edge
    return [cx + sx * RS * Math.sin(a), cz + RS * Math.cos(a)] as [number, number];
  });
  return [[i, -d / 2], [o, -d / 2], ...arc, [i, d / 2]];
}
const sidePart = (id: string, label: string, sx: number, h: number, d: number, y: number, x: number): CustomPart => ({
  id,
  label,
  name: sx < 0 ? "Left side" : "Right side",
  size: [ST, h, d],
  pos: [x, y, 0],
  pieces: [flat(sidePlan(sx, d), h)],
});
const roundBoard = (id: string, label: string, name: string, W: number, D: number, y: number): CustomPart => ({ id, label, name, size: [W, TB, D], pos: [0, y, 0], pieces: [flat(rect(W, D), TB, RT)] });

/** The plinth frame: a rail along the front and the back, an end at each side and, under the chest, a middle. */
function plinth(W: number, D: number, middle: boolean) {
  const px = W / 2 - PI, pz = D / 2 - PI;
  const pxi = px - T, pzi = pz - T; // its inside faces
  const parts: CustomPart[] = [
    { id: "P8f", label: "8", name: "Plinth rail", size: [2 * px, P, T], pos: [0, P / 2, pz - T / 2] },
    { id: "P8b", label: "8", name: "Plinth rail", size: [2 * px, P, T], pos: [0, P / 2, -(pz - T / 2)] },
    { id: "P9l", label: "9", name: "Plinth end", size: [T, P, 2 * pzi], pos: [-(px - T / 2), P / 2, 0] },
    { id: "P9r", label: "9", name: "Plinth end", size: [T, P, 2 * pzi], pos: [px - T / 2, P / 2, 0] },
  ];
  if (middle) parts.push({ id: "P10", label: "10", name: "Plinth middle", size: [T, P, 2 * pzi], pos: [0, P / 2, 0] });
  const ids = parts.map((p) => p.id);
  const y = P / 2;
  const boltX = [-(px - T / 2), ...(middle ? [0] : []), px - T / 2];
  const lockZ = [-(pzi - 25), pzi - 25];
  // cam bolts in the long rails' inside faces, cam locks in the ends (and the middle)
  const bolts = [fx(A, boltX.map((x): Vec3 => [x, y, pzi]), [0, 0, 1], "P8f"), fx(A, boltX.map((x): Vec3 => [x, y, -pzi]), [0, 0, -1], "P8b")];
  const locks = [
    fx(B, lockZ.map((z): Vec3 => [-pxi, y, z]), [-1, 0, 0], "P9l"),
    fx(B, lockZ.map((z): Vec3 => [pxi, y, z]), [1, 0, 0], "P9r"),
    ...(middle ? [fx(B, lockZ.map((z): Vec3 => [T / 2, y, z]), [-1, 0, 0], "P10")] : []),
  ];
  // screws up through the frame into the bottom, dowels in its top edge: three of each along a rail, one in an end
  const railF = middle ? [-240, 40, 240] : [-150, 0, 150];
  const railC = middle ? [-300, -40, 300] : [-110, 40, 110];
  const pts = (xs: number[], zs: number[], yy: number) => ({
    f8: [
      { id: "P8f", at: xs.map((x): Vec3 => [x, yy, pz - T / 2]) },
      { id: "P8b", at: xs.map((x): Vec3 => [x, yy, -(pz - T / 2)]) },
    ],
    ends: [
      { id: "P9l", at: zs.map((z): Vec3 => [-(px - T / 2), yy, z]) },
      { id: "P9r", at: zs.map((z): Vec3 => [px - T / 2, yy, z]) },
    ],
  });
  const fPts = pts(railF, [-60], 0), cPts = pts(railC, [60], P);
  const fixToBottom = [
    ...[...fPts.f8, ...fPts.ends].map((q) => fx(F, q.at, [0, 1, 0], q.id, "B2")),
    ...[...cPts.f8, ...cPts.ends].map((q) => fx(C, q.at, [0, -1, 0], q.id, "B2")),
    ...(middle ? [fx(F, [-110, 110].map((z): Vec3 => [0, 0, z]), [0, 1, 0], "P10", "B2"), fx(C, [-50, 50].map((z): Vec3 => [0, P, z]), [0, -1, 0], "P10", "B2")] : []),
  ];
  const corners: [number, number][] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  const gy = P / 2;
  const brackets = [
    ...corners.map(([sx, sz]) => fx(G, [[sx * pxi, gy, sz * pzi]], [0, 0, sz], sz > 0 ? "P8f" : "P8b")),
    ...corners.map(([sx, sz]) => fx(E, [[sx * (pxi - 24), gy, sz * pzi]], [0, 0, sz], sz > 0 ? "P8f" : "P8b")),
    ...corners.map(([sx, sz]) => fx(E, [[sx * pxi, gy, sz * (pzi - 24)]], [sx, 0, 0], sx < 0 ? "P9l" : "P9r")),
  ];
  const pads = corners.map(([sx, sz]) => fx(K, [[sx * (px - 30), 0, sz * (pz - T / 2)]], [0, 1, 0], sz > 0 ? "P8f" : "P8b"));
  return { parts, ids, bolts, locks, fixToBottom, brackets, pads };
}

/* ---------- the 3 drawer chest ---------- */

function chest(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xo = W / 2 - SET, xi = xo - ST, xs = xo - ST / 2; // the sides: outside faces, inside faces, centres
  const zB = -D / 2 + SET, zF = D / 2 - SET, Dc = zF - zB;
  const y0 = P + TB, y1 = H - TB; // the sides stand between the bottom and the top
  const hr = (y1 - y0) / 3;
  const yd = (k: number) => y0 + k * hr; // where the drawer openings meet
  const zk = zB + 14; // the back panels, in grooves near the back edge
  const y11 = (y0 + y1) / 2; // the back rail, where the two backs meet
  const zr = zF - FT - 30; // the front rails, behind the fronts
  // drawers
  const zf = zF - FT; // fronts' inside face
  const DD = 340, zb = zf - DD; // box depth and its back
  const dx = xi - 12.5 - T / 2; // drawer side centres, clear of the runners
  const sh = 150;
  const yb = (i: number) => yd(i) + 30; // underside of a drawer box
  const fh = hr - 3;
  const fy0 = (i: number) => yd(i) + 1.5;
  const RL = 300, zrun = zf - 5 - RL / 2;

  const pl = plinth(W, D, true);
  const parts: CustomPart[] = [
    sidePart("S4", "4", 1, y1 - y0, Dc, (y0 + y1) / 2, xs),
    { id: "R11", label: "11", name: "Back rail", size: [2 * xi, 80, T], pos: [0, y11, zk] },
    { id: "R5a", label: "5", name: "Front rail", size: [2 * xi, T, 60], pos: [0, yd(1), zr] },
    { id: "R5b", label: "5", name: "Front rail", size: [2 * xi, T, 60], pos: [0, yd(2), zr] },
    sidePart("S3", "3", -1, y1 - y0, Dc, (y0 + y1) / 2, -xs),
    { id: "K7", label: "7", name: "Lower back panel", size: [2 * xi + 16, y11 - 32 - (y0 + 1), BK], pos: [0, (y0 + 1 + y11 - 32) / 2, zk], material: "fiber" },
    roundBoard("B2", "2", "Bottom", W, D, P + TB / 2),
    ...pl.parts,
    { id: "K6", label: "6", name: "Upper back panel", size: [2 * xi + 16, y1 - 1 - (y11 + 32), BK], pos: [0, (y11 + 32 + y1 - 1) / 2, zk], material: "fiber" },
    roundBoard("T1", "1", "Top", W, D, H - TB / 2),
  ];
  const dr = (i: number) => ({ f: `F${i}`, l: `DL${i}`, r: `DR${i}`, bt: `BT${i}`, bat: `BA${i}`, bk: `BK${i}` });
  for (let i = 0; i < 3; i++) {
    const k = dr(i), y = yb(i);
    parts.push(
      { id: k.f, label: "12", name: "Drawer front", size: [2 * xi - 4, fh, FT], pos: [0, fy0(i) + fh / 2, zF - FT / 2] },
      { id: k.l, label: "14", name: "Left drawer side", size: [T, sh, DD], pos: [-dx, y + sh / 2, zb + DD / 2] },
      { id: k.r, label: "13", name: "Right drawer side", size: [T, sh, DD], pos: [dx, y + sh / 2, zb + DD / 2] },
      { id: k.bt, label: "15", name: "Drawer bottom", size: [2 * dx - T + 16, BK, DD + 1], pos: [0, y + 18, (zb + 7 + zf + 8) / 2], material: "fiber" },
      { id: k.bat, label: "16", name: "Drawer batten", size: [60, T, DD - T], pos: [0, y + T / 2, (zb + T + zf) / 2] },
      { id: k.bk, label: "17", name: "Drawer back", size: [2 * dx - T, sh, T], pos: [0, y + sh / 2, zb + T / 2] },
    );
  }
  const ids = (i: number) => Object.values(dr(i));
  const all = [0, 1, 2];
  const allIds = all.flatMap(ids);

  /* ---- fittings ---- */
  const side = (sx: number) => (sx < 0 ? "S3" : "S4");
  const cabRunners = SX.flatMap((sx) => [
    fx(runner(RL, sx < 0 ? "Cabinet runner, left" : "Cabinet runner, right"), all.map((i): Vec3 => [sx * xi, yb(i) + 12, zrun]), [sx, 0, 0], side(sx)),
    fx(E, all.flatMap((i) => [-130, -45, 45, 130].map((dz): Vec3 => [sx * xi, yb(i) + 12, zrun + dz])), [sx, 0, 0], side(sx)),
  ]);
  const railZ = [zr - 15, zr + 15];
  const sideBolts = SX.map((sx) =>
    fx(
      A,
      [...[yd(1), yd(2)].flatMap((y) => railZ.map((z): Vec3 => [sx * xi, y, z])), ...[y11 - 20, y11 + 20].map((y): Vec3 => [sx * xi, y, zk])],
      [sx, 0, 0],
      side(sx),
    ),
  );
  const railLocks = (sx: number) => [
    fx(B, railZ.map((z): Vec3 => [sx * (xi - 25), yd(1) + T / 2, z]), [0, -1, 0], "R5a"),
    fx(B, railZ.map((z): Vec3 => [sx * (xi - 25), yd(2) + T / 2, z]), [0, -1, 0], "R5b"),
    fx(B, [y11 - 20, y11 + 20].map((y): Vec3 => [sx * (xi - 25), y, zk + T / 2]), [0, 0, -1], "R11"),
  ];
  const bottomFix = [
    ...SX.map((sx) => fx(C, [-70, 70].map((z): Vec3 => [sx * xs, y0, z]), [0, 1, 0], side(sx), "B2")),
    ...SX.map((sx) => fx(D7, [-130, 130].map((z): Vec3 => [sx * xs, P, z]), [0, 1, 0], "B2", side(sx))),
  ];
  const wallX = [-(W / 2 - 180), W / 2 - 180];
  const topZ = [-120, 120];
  const topPrep = [
    fx(A, SX.flatMap((sx) => topZ.map((z): Vec3 => [sx * xs, y1, z])), [0, 1, 0], "T1"),
    fx(L, wallX.map((x): Vec3 => [x, y1, zB + 6]), [0, 1, 0], "T1"),
    fx(E, wallX.map((x): Vec3 => [x, y1, zB + 32]), [0, 1, 0], "T1"),
  ];
  const topOn = [
    ...SX.map((sx) => fx(C, [-60, 60].map((z): Vec3 => [sx * xs, y1, z]), [0, -1, 0], side(sx), "T1")),
    ...SX.map((sx) => fx(B, topZ.map((z): Vec3 => [sx * xi, y1 - 25, z]), [sx, 0, 0], side(sx))),
  ];
  const jY = [y1 - 20, y11 + 60, y11 - 60, y0 + 20];
  const backBrackets = [...SX.map((sx) => fx(J, jY.map((y): Vec3 => [sx * xi, y, zk - 8]), [sx, 0, 0], side(sx))), ...SX.map((sx) => fx(E, jY.map((y): Vec3 => [sx * xi, y, zk - 8]), [sx, 0, 0], side(sx)))];
  // a drawer: two cam bolts for each side and one for the batten in the front, cam locks in the sides and the batten
  const dys = (i: number) => [yb(i) + 40, yb(i) + sh - 40];
  const dSide = (i: number, sx: number) => (sx < 0 ? dr(i).l : dr(i).r);
  const frontBolts = (i: number) => [...SX.map((sx) => fx(A, dys(i).map((y): Vec3 => [sx * dx, y, zf]), [0, 0, 1], dr(i).f, dSide(i, sx))), fx(A, [[0, yb(i) + T / 2, zf]], [0, 0, 1], dr(i).f, dr(i).bat)];
  const sideLocks = (i: number) => SX.map((sx) => fx(B, dys(i).map((y): Vec3 => [sx * (dx - T / 2), y, zf - 25]), [sx, 0, 0], dSide(i, sx)));
  const battenLock = (i: number) => fx(B, [[0, yb(i), zf - 25]], [0, 1, 0], dr(i).bat);
  const backScrews = (i: number) => [
    ...SX.map((sx) => fx(M, dys(i).map((y): Vec3 => [sx * (dx + T / 2), y, zb + T / 2]), [-sx, 0, 0], dSide(i, sx), dr(i).bk)),
    fx(M, [[0, yb(i) + T / 2, zb]], [0, 0, 1], dr(i).bk, dr(i).bat),
  ];
  const drawerRunners = (i: number) =>
    SX.flatMap((sx) => [
      fx(runner(RL, sx < 0 ? "Drawer runner, left" : "Drawer runner, right"), [[sx * (dx + T / 2), yb(i) + 12, zrun]], [-sx, 0, 0], dSide(i, sx)),
      fx(E, [-110, 15, 110].map((dz): Vec3 => [sx * (dx + T / 2), yb(i) + 12, zrun + dz]), [-sx, 0, 0], dSide(i, sx)),
    ]);
  const handle = (i: number) => [fx(I, [[0, fy0(i) + fh - 14, zF]], [0, 0, -1], dr(i).f), fx(E, [-24, 24].map((x): Vec3 => [x, fy0(i) + fh - 30, zf]), [0, 0, 1], dr(i).f)];

  const lie = "-x" as const; // on the right side
  const out = (list: string[]) => offset(list, [0, 0, OUT]);
  const steps: CustomStep[] = [
    {
      title: "Screw the runners inside the sides",
      detail: "Lay both sides flat, inside up. Three runners on each, the CR ones on the right side (4) and the CL ones on the left side (3), four small screws (E) each.",
      add: ["S4"],
      wait: ["S3"],
      from: { S3: [0, 0, OUT] },
      fix: cabRunners,
      pose: lie,
      kind: "runners",
      warnings: ["floor"],
    },
    { title: "Turn the cam bolts into the sides", detail: "Six cam bolts (A) into each side, in pairs, until they stop.", fix: sideBolts },
    {
      title: "Stand the rails on the right side",
      detail: "With the right side (4) on a rug, push the back rail (11) and the two front rails (5) onto its cam bolts and turn their six cam locks (B).",
      add: ["R11", "R5a", "R5b"],
      fix: railLocks(1),
    },
    { title: "Lay the left side on top", detail: "Lower the left side (3) onto the other ends of the rails and turn the six cam locks (B).", add: ["S3"], fix: railLocks(-1), check: "square" },
    { title: "Slide in the lower back panel", detail: "Along the grooves from the open bottom end, until it sits in the back rail.", add: ["K7"], from: { K7: [0, -500, 0] } },
    {
      title: "Fix the bottom",
      detail: "Four dowels (C) into the bottom ends of the sides, then push the bottom (2) on and drive the four connector screws (D) through it with the hex key (H).",
      add: ["B2"],
      fix: bottomFix,
      tools: ["allen"],
    },
    {
      title: "Put the plinth frame together",
      detail: "Three cam bolts (A) into each plinth rail (8), then join the rails with the two ends (9) and the middle (10) and turn the six cam locks (B).",
      fix: [...pl.bolts, ...pl.locks],
      wait: pl.ids,
      from: out(pl.ids),
    },
    {
      title: "Screw the plinth under the bottom",
      detail: "Ten dowels (C) into the frame's top edge, set it on the bottom and drive the ten long screws (F) through it.",
      add: pl.ids,
      fix: pl.fixToBottom,
      from: offset(pl.ids, [0, -300, 0]),
    },
    {
      title: "Fit the angle brackets and felt pads",
      detail: "An angle bracket (G) in each inside corner of the plinth, two small screws (E) each, and a felt pad (K) under each corner.",
      fix: [...pl.brackets, ...pl.pads],
    },
    {
      title: "Prepare the top",
      detail: "Lay the top (1) upside down. Four cam bolts (A) into its underside, and the two wall brackets (L) at the back edge, one small screw (E) each.",
      fix: topPrep,
      wait: ["T1"],
      from: { T1: [0, 0, OUT] },
    },
    { title: "Slide in the upper back panel", detail: "Along the grooves from the open top end, notches first, until it sits in the back rail.", add: ["K6"], from: { K6: [0, 500, 0] } },
    { title: "Fix the top", detail: "Four dowels (C) into the top ends of the sides, then press the top onto them and the cam bolts and turn the four cam locks (B).", add: ["T1"], fix: topOn },
    {
      title: "Stand it up and hold the backs in",
      detail: "Turn it round. Eight back brackets (J), four down each side: at the top and bottom of each back panel, one small screw (E) each.",
      fix: backBrackets,
      pose: "+y",
    },
    {
      title: "Turn cam bolts into the drawer fronts",
      detail: "Lay the three fronts (12) face down on a rug. Five cam bolts (A) into each: two at each end and one in the middle.",
      fix: all.flatMap(frontBolts),
      wait: all.map((i) => dr(i).f),
      from: out(allIds),
      kind: "drawer",
      warnings: ["floor"],
    },
    {
      title: "Lock the sides onto the fronts",
      detail: "Push a left side (14) and a right side (13) onto the bolts of each front, grooves facing in, and turn the twelve cam locks (B).",
      fix: all.flatMap(sideLocks),
      wait: all.flatMap((i) => [dr(i).l, dr(i).r]),
      from: out(allIds),
      kind: "drawer",
    },
    { title: "Slide in the drawer bottoms", detail: "Each bottom (15) goes down the grooves in the sides until it sits in the front.", wait: all.map((i) => dr(i).bt), from: out(allIds), kind: "drawer" },
    {
      title: "Fit the battens",
      detail: "Stand a batten (16) on the middle bolt of each front, under the bottom, and lock it with a cam lock (B).",
      fix: all.map(battenLock),
      wait: all.map((i) => dr(i).bat),
      from: out(allIds),
      kind: "drawer",
    },
    {
      title: "Screw on the drawer backs",
      detail: "Put a back (17) on each drawer and drive five screws (M): two through each side and one through the back into the batten.",
      fix: all.flatMap(backScrews),
      wait: all.map((i) => dr(i).bk),
      from: out(allIds),
      kind: "drawer",
    },
    { title: "Screw the runners onto the drawers", detail: "A DL runner on each left side and a DR on each right side, along the bottom edge, three small screws (E) each.", fix: all.flatMap(drawerRunners), kind: "runners" },
    { title: "Fit the handles", detail: "A handle (I) over the middle of each front's top edge, two small screws (E) from behind.", fix: all.flatMap(handle) },
    {
      title: "Fix it to the wall",
      detail: "Push it against the wall and mark through the two brackets, drill 6 mm holes, push in the plugs (N) and screw the brackets to the wall with the screws (M). Check for pipes and cables first.",
      fix: [fx(N, wallX.map((x): Vec3 => [x, y1 - 12, -D / 2 - 25]), [0, 0, -1]), fx({ ...M, included: true }, wallX.map((x): Vec3 => [x, y1 - 12, zB + 2]), [0, 0, -1], "T1")],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
    {
      title: "Slide the drawers in",
      detail: "Pull each pair of runners in the chest out, rest the drawer's runners on them and push it home. Open only one drawer at a time.",
      add: [2, 1, 0].flatMap(ids),
      from: offset(allIds, [0, 0, 420]),
      kind: "drawer",
      warnings: ["tip"],
    },
  ];
  return { parts, steps };
}

/* ---------- the bedside table ---------- */

function bedside(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xo = W / 2 - SET, xi = xo - ST, xs = xo - ST / 2;
  const zB = -D / 2 + SET, zF = D / 2 - SET, Dc = zF - zB;
  const y0 = P + TB, y1 = H - TB;
  const ys = y1 - 230; // top of the shelf, under the drawer
  const zk = zB + 14;
  const zf = zF - FT;
  const DD = 300, zb = zf - DD;
  const dx = xi - 12.5 - T / 2;
  const sh = 150, yb = ys + 18;
  const fy0 = ys + 2, fh = y1 - 2 - fy0;
  const RL = 250, zrun = zf - 5 - RL / 2;

  const pl = plinth(W, D, false);
  const parts: CustomPart[] = [
    sidePart("S3", "3", -1, y1 - y0, Dc, (y0 + y1) / 2, -xs),
    { id: "SH", label: "6", name: "Shelf", size: [2 * xi, TB, Dc], pos: [0, ys - TB / 2, 0] },
    sidePart("S4", "4", 1, y1 - y0, Dc, (y0 + y1) / 2, xs),
    { id: "K5", label: "5", name: "Upper back panel", size: [2 * xi + 16, y1 - 1 - (ys - 8), BK], pos: [0, (ys - 8 + y1 - 1) / 2, zk], material: "fiber" },
    roundBoard("T1", "1", "Top", W, D, H - TB / 2),
    { id: "K7", label: "7", name: "Lower back panel", size: [2 * xi + 16, ys - TB + 8 - (y0 + 1), BK], pos: [0, (y0 + 1 + ys - TB + 8) / 2, zk], material: "fiber" },
    roundBoard("B2", "2", "Bottom", W, D, P + TB / 2),
    ...pl.parts,
    { id: "DF", label: "10", name: "Drawer front", size: [2 * xi - 4, fh, FT], pos: [0, fy0 + fh / 2, zF - FT / 2] },
    { id: "DL", label: "12", name: "Left drawer side", size: [T, sh, DD], pos: [-dx, yb + sh / 2, zb + DD / 2] },
    { id: "DR", label: "11", name: "Right drawer side", size: [T, sh, DD], pos: [dx, yb + sh / 2, zb + DD / 2] },
    { id: "DT", label: "14", name: "Drawer bottom", size: [2 * dx - T + 16, BK, DD + 1], pos: [0, yb + 12, (zb + 7 + zf + 8) / 2], material: "fiber" },
    { id: "DB", label: "13", name: "Drawer back", size: [2 * dx - T, sh, T], pos: [0, yb + sh / 2, zb + T / 2] },
  ];
  const drawer = ["DF", "DL", "DR", "DT", "DB"];

  /* ---- fittings ---- */
  const side = (sx: number) => (sx < 0 ? "S3" : "S4");
  const cabRunners = SX.flatMap((sx) => [
    fx(runner(RL, sx < 0 ? "Cabinet runner, left" : "Cabinet runner, right"), [[sx * xi, yb + 12, zrun]], [sx, 0, 0], side(sx)),
    fx(E, [-110, -40, 40, 110].map((dz): Vec3 => [sx * xi, yb + 12, zrun + dz]), [sx, 0, 0], side(sx)),
  ]);
  const shelfZ = [-90, 90];
  const shelfY = ys - TB / 2;
  const sideBolts = SX.map((sx) => fx(A, shelfZ.map((z): Vec3 => [sx * xi, shelfY, z]), [sx, 0, 0], side(sx)));
  const shelfJoint = (sx: number) => [fx(C, [-30, 30].map((z): Vec3 => [sx * xi, shelfY, z]), [sx, 0, 0], side(sx), "SH"), fx(B, shelfZ.map((z): Vec3 => [sx * (xi - 25), ys - TB, z]), [0, 1, 0], "SH")];
  const topZ = [-110, 110];
  const topPrep = [fx(A, SX.flatMap((sx) => topZ.map((z): Vec3 => [sx * xs, y1, z])), [0, 1, 0], "T1"), fx(L, [[0, y1, zB + 6]], [0, 1, 0], "T1"), fx(E, [[0, y1, zB + 32]], [0, 1, 0], "T1")];
  const topOn = [
    ...SX.map((sx) => fx(C, [-50, 50].map((z): Vec3 => [sx * xs, y1, z]), [0, -1, 0], side(sx), "T1")),
    ...SX.map((sx) => fx(B, topZ.map((z): Vec3 => [sx * xi, y1 - 25, z]), [sx, 0, 0], side(sx))),
  ];
  const bottomFix = [
    ...SX.map((sx) => fx(C, [-60, 60].map((z): Vec3 => [sx * xs, y0, z]), [0, 1, 0], side(sx), "B2")),
    ...SX.map((sx) => fx(D7, [-120, 120].map((z): Vec3 => [sx * xs, P, z]), [0, 1, 0], "B2", side(sx))),
  ];
  const jY = [y1 - 20, ys + 25, ys - TB - 25, y0 + 20];
  const backBrackets = [...SX.map((sx) => fx(J, jY.map((y): Vec3 => [sx * xi, y, zk - 8]), [sx, 0, 0], side(sx))), ...SX.map((sx) => fx(E, jY.map((y): Vec3 => [sx * xi, y, zk - 8]), [sx, 0, 0], side(sx)))];
  const dys = [yb + 40, yb + sh - 40];
  const dSide = (sx: number) => (sx < 0 ? "DL" : "DR");

  const lie = "-z" as const; // on its front edges
  const out = (list: string[]) => offset(list, [0, 0, OUT]);
  const steps: CustomStep[] = [
    {
      title: "Screw the runners inside the sides",
      detail: "Lay both sides flat, inside up. The CR runner on the right side (4) and the CL runner on the left side (3), near the top, four small screws (E) each.",
      fix: cabRunners,
      wait: ["S3", "S4"],
      from: { S3: [-OUT, 0, 0], S4: [OUT, 0, 0] },
      kind: "runners",
      warnings: ["floor"],
    },
    { title: "Turn the cam bolts into the sides", detail: "Two cam bolts (A) into each side, just under the runner, until they stop.", fix: sideBolts },
    {
      title: "Fix the shelf to the left side",
      detail: "Stand the left side (3) on its front edge. Push two dowels (C) into it, press the shelf (6) onto them and the cam bolts and turn its two cam locks (B).",
      add: ["S3", "SH"],
      fix: shelfJoint(-1),
      pose: lie,
    },
    { title: "Fit the right side", detail: "Two dowels (C) into the right side (4), press it onto the other end of the shelf and turn the two cam locks (B).", add: ["S4"], fix: shelfJoint(1), check: "square" },
    { title: "Stand it up and slide in the upper back panel", detail: "Notch at the top, down the grooves from the open top until it sits on the shelf.", add: ["K5"], from: { K5: [0, 500, 0] }, pose: "+y" },
    {
      title: "Prepare the top",
      detail: "Lay the top (1) upside down. Four cam bolts (A) into its underside, and the wall bracket (L) in the middle of the back edge with one small screw (E).",
      fix: topPrep,
      wait: ["T1"],
      from: { T1: [0, 0, OUT] },
    },
    { title: "Fix the top", detail: "Four dowels (C) into the top ends of the sides, lower the top onto them and the cam bolts and turn the four cam locks (B).", add: ["T1"], fix: topOn },
    { title: "Turn it over and slide in the lower back panel", detail: "Upside down on a rug, slide it along the grooves from the open bottom end until it sits in the shelf.", add: ["K7"], from: { K7: [0, -500, 0] }, pose: "-y", warnings: ["floor"] },
    {
      title: "Fix the bottom",
      detail: "Four dowels (C) into the bottom ends of the sides, then push the bottom (2) on and drive the four connector screws (D) through it with the hex key (H).",
      add: ["B2"],
      fix: bottomFix,
      tools: ["allen"],
    },
    {
      title: "Put the plinth frame together",
      detail: "Two cam bolts (A) into each plinth rail (8), then join the rails with the two ends (9) and turn the four cam locks (B).",
      fix: [...pl.bolts, ...pl.locks],
      wait: pl.ids,
      from: out(pl.ids),
    },
    {
      title: "Screw the plinth onto the bottom",
      detail: "Eight dowels (C) into the frame's edge, set it on the bottom and drive the eight long screws (F) through it.",
      add: pl.ids,
      fix: pl.fixToBottom,
      from: offset(pl.ids, [0, -300, 0]),
    },
    { title: "Fit the angle brackets", detail: "An angle bracket (G) in each inside corner of the plinth, two small screws (E) each.", fix: pl.brackets },
    { title: "Stick on the felt pads", detail: "A felt pad (K) on each corner of the plinth.", fix: pl.pads },
    {
      title: "Stand it up and hold the backs in",
      detail: "Turn it round. Eight back brackets (J), four down each side: at the top and bottom of each back panel, one small screw (E) each.",
      fix: backBrackets,
      pose: "+y",
    },
    {
      title: "Turn cam bolts into the drawer front",
      detail: "Lay the front (10) face down on a rug and turn in four cam bolts (A), two at each end.",
      fix: SX.map((sx) => fx(A, dys.map((y): Vec3 => [sx * dx, y, zf]), [0, 0, 1], "DF", dSide(sx))),
      wait: ["DF"],
      from: out(drawer),
      kind: "drawer",
      warnings: ["floor"],
    },
    {
      title: "Lock the sides onto the front",
      detail: "Push the drawer sides (11 and 12) onto the bolts, grooves facing in, and turn the four cam locks (B).",
      fix: SX.map((sx) => fx(B, dys.map((y): Vec3 => [sx * (dx - T / 2), y, zf - 25]), [sx, 0, 0], dSide(sx))),
      wait: ["DL", "DR"],
      from: out(drawer),
      kind: "drawer",
    },
    { title: "Slide in the drawer bottom", detail: "Down the grooves in the sides until it sits in the front.", wait: ["DT"], from: out(drawer), kind: "drawer" },
    {
      title: "Screw on the drawer back",
      detail: "Put the back (13) on and drive two screws (M) through each side into it.",
      fix: SX.map((sx) => fx(M, dys.map((y): Vec3 => [sx * (dx + T / 2), y, zb + T / 2]), [-sx, 0, 0], dSide(sx), "DB")),
      wait: ["DB"],
      from: out(drawer),
      kind: "drawer",
    },
    {
      title: "Screw the runners onto the drawer",
      detail: "The DL runner on the left side and the DR runner on the right, along the bottom edge, three small screws (E) each.",
      fix: SX.flatMap((sx) => [
        fx(runner(RL, sx < 0 ? "Drawer runner, left" : "Drawer runner, right"), [[sx * (dx + T / 2), yb + 12, zrun]], [-sx, 0, 0], dSide(sx)),
        fx(E, [-95, 15, 95].map((dz): Vec3 => [sx * (dx + T / 2), yb + 12, zrun + dz]), [-sx, 0, 0], dSide(sx)),
      ]),
      kind: "runners",
    },
    {
      title: "Fit the handle",
      detail: "The handle (I) over the middle of the front's top edge, two small screws (E) from behind.",
      fix: [fx(I, [[0, fy0 + fh - 14, zF]], [0, 0, -1], "DF"), fx(E, [-24, 24].map((x): Vec3 => [x, fy0 + fh - 30, zf]), [0, 0, 1], "DF")],
    },
    {
      title: "Fix it to the wall",
      detail: "Push it against the wall and mark through the bracket, drill a 6 mm hole, push in the plug (N) and screw the bracket to the wall with a screw (M). Check for pipes and cables first.",
      fix: [fx(N, [[0, y1 - 12, -D / 2 - 25]], [0, 0, -1]), fx({ ...M, included: true }, [[0, y1 - 12, zB + 2]], [0, 0, -1], "T1")],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
    {
      title: "Slide the drawer in",
      detail: "Pull the runners in the table out, rest the drawer's runners on them and push it home.",
      add: drawer,
      from: offset(drawer, [0, 0, 400]),
      kind: "drawer",
    },
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-claire-3-drawer-chest") return chest(s);
  if (s.slug === "kmart-claire-bedside-table") return bedside(s);
  return null;
}

const family: Family = { names: ["KMART:CLAIRE"], recipe };
export default family;
