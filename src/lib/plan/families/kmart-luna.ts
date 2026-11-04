import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's Luna 2 Drawer Bedside Table, read from its assembly manual (keycode 43633975). The top (1) is one bent board
 * that curls down at both ends onto the sides, a fluted frame (9) runs round the front like an arch, and two drawers
 * with fluted fronts sit inside it. It is built lying on its left side:
 *
 * - two runner strips (4) go inside the left side (2) on dowels (T) and screws (F), the runners (M) on them, then five
 *   cam bolts (A) and two dowels (C). The bottom (10), the front rail (7) and the back rail (5) stand on it with their
 *   dowels and cam locks (B), and the lower back (16) slides down between the bottom and the back rail.
 * - the right side (3) gets its strips (6), runners (J), bolts and dowels the same way and is laid on top; the upper back
 *   (8) slides in from the top end. The top takes four cam bolts and goes on, six dowels go into the front edges and
 *   the front frame takes eight cam bolts and is locked on.
 * - stood up, four brackets (H) hold the backs. Each drawer: the sides (13, 11) screwed to the back (12), the bottom
 *   (15) down the grooves, the front (14 above, 17 below) with four cam bolts and a handle (G) locked on, then the
 *   runners (K, L). Two caps (O) cover the lowest cam locks and a strap (R) fixes it to the wall.
 *
 * Kmart's hardware list: 30 cam bolts (A), 30 cam locks (B), 16 dowels (C, 6 x 30 mm), 20 screws (D, 3 x 12 mm), 16
 * screws (F, 4 x 25 mm), 2 handles (G), 4 back brackets (H) and their 4 screws (I, 3 x 14 mm), two cabinet runners for
 * the right side (J) and two for the left (M), two drawer runners of each hand (K, L), 4 handle screws (N, 4 x 18 mm), 2
 * caps (O), the wall strap (R) with its screws (P, 4 x 12 mm and Q, 4 x 30 mm) and plug (S), and 8 dowels (T, 6 x 20
 * mm). Every count box agrees with the list. The manual's last step only shows the finished table, so the guide ends
 * with the wall strap. Part numbers and letters are Kmart's own.
 */

const T = 15; // board
const RO = 70; // outside radius of the top's curls and the frame's corners
const FW = 32; // the front frame's face
const FZ = 20; // the front frame, front to back
const FT = 18; // drawer fronts
const BK = 3; // back panels
const LEG = 60; // the bottom's underside: the sides and the frame stand on the floor below it
const OUT = 560; // parts built away from the table wait this far in front of it

type Def = { kind: CustomFix["kind"]; len: number; dia: number; name: string; included?: boolean };
const A: Def = { kind: "camScrew", len: 30, dia: 6, name: "Cam bolt" };
const B: Def = { kind: "cam", len: 10, dia: 15, name: "Cam lock" };
const C: Def = { kind: "dowel", len: 30, dia: 6, name: "Dowel" };
const Dd: Def = { kind: "screw", len: 12, dia: 3, name: "Small screw" };
const F: Def = { kind: "screw", len: 25, dia: 4, name: "Screw" };
const G: Def = { kind: "handle", len: 128, dia: 12, name: "Handle" };
const H: Def = { kind: "clamp", len: 16, dia: 12, name: "Back bracket" };
const I: Def = { kind: "screw", len: 14, dia: 3, name: "Bracket screw" };
const N: Def = { kind: "screw", len: 18, dia: 4, name: "Handle screw" };
const O: Def = { kind: "cap", len: 1, dia: 15, name: "Cap" };
const Ps: Def = { kind: "screw", len: 12, dia: 4, name: "Strap screw" };
const Q: Def = { kind: "screw", len: 30, dia: 4, name: "Wall screw", included: true };
const R: Def = { kind: "strap", len: 110, dia: 20, name: "Wall strap" };
const S: Def = { kind: "plug", len: 30, dia: 6, name: "Wall plug", included: true };
const Td: Def = { kind: "dowel", len: 20, dia: 6, name: "Short dowel" };
const RL = 280; // runner length
const runner = (name: string): Def => ({ kind: "runner", len: RL, dia: 30, name });

const fx = (def: Def, at: Vec3[], dir: Vec3, on?: string, mate?: string): CustomFix => ({ ...def, count: at.length, at, dir, ...(on ? { on } : {}), ...(mate ? { mate } : {}) });
const SX = [-1, 1] as const;
const offset = (ids: string[], v: Vec3) => Object.fromEntries(ids.map((id) => [id, v] as [string, Vec3]));

/** Points round an arc (centre, radius, from and to angles from +x towards +y), both ends included. */
function arc(cx: number, cy: number, r: number, a0: number, a1: number, n = 8): [number, number][] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
  });
}

/** A board standing in the x/y plane, cut to an outline of [x, y] points (from its centre), `t` thick front to back. */
const upright = (outline: [number, number][], t: number): PartPiece => ({ shape: "slab", outline, size: [0, t, 0], pos: [0, 0, 0], rot: [-Math.PI / 2, 0, 0] });

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug !== "kmart-luna-2-drawer-bedside-table") return null;
  const W = s.size.w * 10, Ht = s.size.h * 10, D = s.size.d * 10;
  const xi = W / 2 - T, xc = W / 2 - T / 2; // sides' inside faces and centres
  const zB = -D / 2, zF = D / 2 - FZ; // the carcass; the frame stands in front of it
  const zc = (zB + zF) / 2, Dc = zF - zB;
  const yS = Ht - RO; // tops of the sides, where the top's curls end
  const cxA = W / 2 - RO; // the curls' centres, either side
  const zk = zB + 12; // back panels and the back rail
  const yb0 = LEG + T; // top of the bottom
  const yr = 282.5; // the front and back rails, between the drawers
  const xr = xi - T; // runner strips' inside faces
  const xd = xr - 12.5; // drawer boxes' outside faces
  const zf = D / 2 - FT; // drawer fronts' inside face
  const DD = 300, zb = zf - DD; // drawer box depth and back
  const sh = 120;
  const ybox = [yb0 + 15, yr + T / 2 + 15]; // undersides of the lower and upper drawer boxes
  const yst = ybox.map((y) => y + 20); // runner strips and runners
  const zs = 5, SL = 330; // runner strips' centre and length
  const zrun = zf - 5 - RL / 2;
  const fx0 = W / 2 - FW - 2; // fronts' half width, inside the frame
  const fyTop = Ht - FW - 2;
  const fronts = [
    { y0: yb0 + 2, y1: yr - 2.5 },
    { y0: yr + 1, y1: fyTop },
  ];

  // the top: an upside down U of bent board, its curls ending on the sides
  const ty = (yS + Ht) / 2;
  const topProfile: [number, number][] = [
    ...arc(-cxA, yS, RO, Math.PI, Math.PI / 2),
    ...arc(cxA, yS, RO, Math.PI / 2, 0),
    ...arc(cxA, yS, RO - T, 0, Math.PI / 2),
    ...arc(-cxA, yS, RO - T, Math.PI / 2, Math.PI),
  ].map(([x, y]) => [x, y - ty] as [number, number]);
  // the front frame: an arch round the front, its legs to the floor
  const fy = Ht / 2;
  const frame: [number, number][] = [
    [-W / 2, 0],
    ...arc(-cxA, yS, RO, Math.PI, Math.PI / 2),
    ...arc(cxA, yS, RO, Math.PI / 2, 0),
    [W / 2, 0],
    [W / 2 - FW, 0],
    ...arc(cxA, yS, RO - FW, 0, Math.PI / 2),
    ...arc(-cxA, yS, RO - FW, Math.PI / 2, Math.PI),
    [-W / 2 + FW, 0],
  ].map(([x, y]) => [x, y - fy] as [number, number]);
  // the upper back: from the back rail up into the curls
  const by0 = yr + 40 - 8, by1 = Ht - T - 1, byc = (by0 + by1) / 2;
  const upperBack: [number, number][] = [
    [-xi - 8, by0],
    [xi + 8, by0],
    [xi + 8, yS],
    [xi - 1, yS],
    ...arc(cxA, yS, RO - T - 1, 0, Math.PI / 2),
    ...arc(-cxA, yS, RO - T - 1, Math.PI / 2, Math.PI),
    [-xi + 1, yS],
    [-xi - 8, yS],
  ].map(([x, y]) => [x, y - byc] as [number, number]);
  // the upper drawer front, its top corners rounded to clear the frame's
  const uf = fronts[1], ufc = (uf.y0 + uf.y1) / 2, rf = RO - FW - 2;
  const upperFront: [number, number][] = [[-fx0, uf.y0], [fx0, uf.y0], ...arc(cxA, yS, rf, 0, Math.PI / 2), ...arc(-cxA, yS, rf, Math.PI / 2, Math.PI)].map(([x, y]) => [x, y - ufc] as [number, number]);

  const lb0 = yb0 - 8, lb1 = yr - 40 + 8;
  const parts: CustomPart[] = [
    { id: "S2", label: "2", name: "Left side", size: [T, yS, Dc], pos: [-xc, yS / 2, zc] },
    { id: "R4a", label: "4", name: "Left runner strip", size: [T, 40, SL], pos: [-(xi - T / 2), yst[0], zs] },
    { id: "R4b", label: "4", name: "Left runner strip", size: [T, 40, SL], pos: [-(xi - T / 2), yst[1], zs] },
    { id: "B10", label: "10", name: "Bottom", size: [2 * xi, T, Dc], pos: [0, LEG + T / 2, zc] },
    { id: "R7", label: "7", name: "Front rail", size: [2 * xi, T, 60], pos: [0, yr, zF - 30] },
    { id: "R5", label: "5", name: "Back rail", size: [2 * xi, 80, T], pos: [0, yr, zk] },
    { id: "K16", label: "16", name: "Lower back panel", size: [2 * xi + 16, lb1 - lb0, BK], pos: [0, (lb0 + lb1) / 2, zk], material: "fiber" },
    { id: "S3", label: "3", name: "Right side", size: [T, yS, Dc], pos: [xc, yS / 2, zc] },
    { id: "R6a", label: "6", name: "Right runner strip", size: [T, 40, SL], pos: [xi - T / 2, yst[0], zs] },
    { id: "R6b", label: "6", name: "Right runner strip", size: [T, 40, SL], pos: [xi - T / 2, yst[1], zs] },
    { id: "K8", label: "8", name: "Upper back panel", size: [2 * xi + 16, by1 - by0, BK], pos: [0, byc, zk], material: "fiber", pieces: [{ ...upright(upperBack, BK), material: "fiber" }] },
    { id: "TOP", label: "1", name: "Top", size: [W, Ht - yS, Dc], pos: [0, ty, zc], pieces: [upright(topProfile, Dc)] },
    { id: "F9", label: "9", name: "Front frame", size: [W, Ht, FZ], pos: [0, fy, D / 2 - FZ / 2], pieces: [upright(frame, FZ)] },
  ];
  const dr = (j: number) => ({ f: `F${j}`, l: `DL${j}`, r: `DR${j}`, bk: `DB${j}`, bt: `DT${j}` });
  for (let j = 0; j < 2; j++) {
    const k = dr(j), y = ybox[j], fr = fronts[j];
    parts.push(
      { id: k.l, label: "13", name: "Left drawer side", size: [T, sh, DD], pos: [-(xd - T / 2), y + sh / 2, zb + DD / 2] },
      { id: k.r, label: "11", name: "Right drawer side", size: [T, sh, DD], pos: [xd - T / 2, y + sh / 2, zb + DD / 2] },
      { id: k.bk, label: "12", name: "Drawer back", size: [2 * xd - 2 * T, sh, T], pos: [0, y + sh / 2, zb + T / 2] },
      { id: k.bt, label: "15", name: "Drawer bottom", size: [2 * xd - 2 * T + 16, BK, DD + 1], pos: [0, y + 12, (zb + 7 + zf + 8) / 2], material: "fiber" },
      j === 1
        ? { id: k.f, label: "14", name: "Upper drawer front", size: [2 * fx0, fr.y1 - fr.y0, FT], pos: [0, (fr.y0 + fr.y1) / 2, D / 2 - FT / 2], pieces: [upright(upperFront, FT)] }
        : { id: k.f, label: "17", name: "Lower drawer front", size: [2 * fx0, fr.y1 - fr.y0, FT], pos: [0, (fr.y0 + fr.y1) / 2, D / 2 - FT / 2] },
    );
  }
  const ids = (j: number) => Object.values(dr(j));
  const both = [0, 1];
  const drawerIds = both.flatMap(ids);
  const out = (list: string[]) => offset(list, [0, 0, OUT]);

  /* ---- fittings ---- */
  const side = (sx: number) => (sx < 0 ? "S2" : "S3");
  const strips = (sx: number) => (sx < 0 ? ["R4a", "R4b"] : ["R6a", "R6b"]);
  // the strips: two dowels (T) into the side, two screws (F) through the strip
  const stripFix = (sx: number) =>
    strips(sx).flatMap((id, j) => [
      fx(Td, [-100, 110].map((dz): Vec3 => [sx * xi, yst[j], zs + dz]), [sx, 0, 0], side(sx), id),
      fx(F, [-140, 157].map((dz): Vec3 => [sx * xr, yst[j], zs + dz]), [sx, 0, 0], id, side(sx)),
    ]);
  // cam bolts in a side: two for the bottom, one for the front rail, two for the back rail; two dowels in its top edge
  const zBot = [zB + 60, zF - 60];
  const sideBolts = (sx: number) => fx(A, [...zBot.map((z): Vec3 => [sx * xi, LEG + T / 2, z]), [sx * xi, yr, zF - 18], [sx * xi, yr - 20, zk], [sx * xi, yr + 20, zk]], [sx, 0, 0], side(sx));
  const topZ = [zc - 120, zc + 120];
  const topDowels = (sx: number) => fx(C, [zc - 60, zc + 60].map((z): Vec3 => [sx * xc, yS, z]), [0, -1, 0], side(sx), "TOP");
  const runners = (sx: number) =>
    strips(sx).flatMap((id, j) => [
      fx(runner(sx < 0 ? "Cabinet runner, left" : "Cabinet runner, right"), [[sx * xr, yst[j], zrun]], [sx, 0, 0], id),
      fx(Dd, [-100, 0, 100].map((dz): Vec3 => [sx * xr, yst[j], zrun + dz]), [sx, 0, 0], id),
    ]);
  const sidePrep = (sx: number) => [sideBolts(sx), topDowels(sx), ...runners(sx)];
  const bottomDowels = SX.map((sx) => fx(C, [zc - 70, zc + 70].map((z): Vec3 => [sx * xi, LEG + T / 2, z]), [-sx, 0, 0], "B10", side(sx)));
  const bottomLocks = (sx: number) => fx(B, zBot.map((z): Vec3 => [sx * (xi - 25), yb0, z]), [0, -1, 0], "B10");
  const railDowels = SX.map((sx) => fx(C, [[sx * xi, yr, zF - 42]], [-sx, 0, 0], "R7", side(sx)));
  const frontRailLock = (sx: number) => fx(B, [[sx * (xi - 25), yr + T / 2, zF - 18]], [0, -1, 0], "R7");
  const backRailLocks = (sx: number) => fx(B, [yr - 20, yr + 20].map((y): Vec3 => [sx * (xi - 25), y, zk + T / 2]), [0, 0, -1], "R5");
  // the frame: two cam bolts across the top into the top, three down each leg into the sides
  const legY = [yS - 30, 240, 30];
  const frameBolts = fx(A, [...SX.map((sx): Vec3 => [sx * 100, Ht - T / 2, zF]), ...SX.flatMap((sx) => legY.map((y): Vec3 => [sx * xc, y, zF]))], [0, 0, 1], "F9");
  const frameLocks = [fx(B, SX.map((sx): Vec3 => [sx * 100, Ht - T, zF - 25]), [0, 1, 0], "TOP"), ...SX.map((sx) => fx(B, legY.map((y): Vec3 => [sx * xi, y, zF - 25]), [sx, 0, 0], side(sx)))];
  const frontDowels = [fx(C, SX.map((sx): Vec3 => [sx * 150, Ht - T / 2, zF]), [0, 0, -1], "TOP", "F9"), ...SX.map((sx) => fx(C, [330, 140].map((y): Vec3 => [sx * xc, y, zF]), [0, 0, -1], side(sx), "F9"))];
  // back brackets: two across each back panel, corner to corner
  const brackets: [number, number][] = [
    [1, yS - 20],
    [-1, by0 + 25],
    [1, yr - 40 - 15],
    [-1, yb0 + 15],
  ];
  // the drawers
  const dys = (j: number) => [ybox[j] + 30, ybox[j] + sh - 30];
  const dSide = (j: number, sx: number) => (sx < 0 ? dr(j).l : dr(j).r);
  const boxScrews = (j: number) => SX.map((sx) => fx(F, dys(j).map((y): Vec3 => [sx * xd, y, zb + T / 2]), [-sx, 0, 0], dSide(j, sx), dr(j).bk));
  const fyc = (j: number) => (fronts[j].y0 + fronts[j].y1) / 2;
  const frontPrep = (j: number) => [
    ...SX.map((sx) => fx(A, dys(j).map((y): Vec3 => [sx * (xd - T / 2), y, zf]), [0, 0, 1], dr(j).f, dSide(j, sx))),
    fx(G, [[0, fyc(j), D / 2]], [0, 0, -1], dr(j).f),
    fx(N, [-64, 64].map((x): Vec3 => [x, fyc(j), zf]), [0, 0, 1], dr(j).f),
  ];
  const frontLocks = (j: number) => SX.map((sx) => fx(B, dys(j).map((y): Vec3 => [sx * (xd - T), y, zf - 25]), [sx, 0, 0], dSide(j, sx)));
  const drawerRunners = (j: number) =>
    SX.flatMap((sx) => [
      fx(runner(sx < 0 ? "Drawer runner, left" : "Drawer runner, right"), [[sx * xd, yst[j], zrun]], [-sx, 0, 0], dSide(j, sx)),
      fx(Dd, [-50, 50].map((dz): Vec3 => [sx * xd, yst[j], zrun + dz]), [-sx, 0, 0], dSide(j, sx)),
    ]);

  const lie = "+x" as const; // on the left side
  const rightSide = ["S3", "R6a", "R6b"];
  const steps: CustomStep[] = [
    {
      title: "Fix the runner strips inside the left side",
      detail: "Lay the left side (2) flat, inside up. Push in four short dowels (T), set the two strips (4) on them and drive two screws (F) through each.",
      add: ["S2", "R4a", "R4b"],
      fix: stripFix(-1),
      pose: lie,
      warnings: ["floor"],
    },
    {
      title: "Fit the runners, bolts and dowels",
      detail: "A runner (M) on each strip, wheel to the front, three small screws (D) each. Turn the five cam bolts (A) into the side and push two dowels (C) into its top edge.",
      fix: sidePrep(-1),
      kind: "runners",
    },
    { title: "Push dowels into the bottom", detail: "Two dowels (C) into each end of the bottom (10).", fix: bottomDowels, wait: ["B10"], from: out(["B10"]) },
    { title: "Stand the bottom on the side", detail: "Near the lower end, on its dowels and bolts. Turn its two cam locks (B).", add: ["B10"], fix: [bottomLocks(-1)] },
    { title: "Push dowels into the front rail", detail: "One dowel (C) into each end of the front rail (7).", fix: railDowels, wait: ["R7"], from: out(["R7"]) },
    { title: "Stand the front rail on the side", detail: "At the front, between the two runners. Turn its cam lock (B).", add: ["R7"], fix: [frontRailLock(-1)] },
    { title: "Stand the back rail on the side", detail: "At the back, level with the front rail, grooves up and down. Turn its two cam locks (B).", add: ["R5"], fix: [backRailLocks(-1)] },
    { title: "Slide in the lower back panel", detail: "Down into the grooves of the bottom and the back rail.", add: ["K16"], from: { K16: [500, 0, 0] } },
    {
      title: "Fix the runner strips inside the right side",
      detail: "Lay the right side (3) flat, inside up: four short dowels (T), the two strips (6) and two screws (F) through each.",
      fix: stripFix(1),
      wait: rightSide,
      from: out(rightSide),
    },
    {
      title: "Fit its runners, bolts and dowels",
      detail: "The same as the left side: a runner (J) on each strip with three small screws (D), five cam bolts (A) and two dowels (C) in the top edge.",
      fix: sidePrep(1),
      kind: "runners",
    },
    {
      title: "Lay the right side on",
      detail: "Lower it onto the bottom and the rails so every bolt and dowel finds its hole, then turn the five cam locks (B).",
      add: rightSide,
      fix: [bottomLocks(1), frontRailLock(1), backRailLocks(1)],
      check: "square",
    },
    { title: "Slide in the upper back panel", detail: "Rounded end last, along the grooves from the open top end until it sits in the back rail.", add: ["K8"], from: { K8: [0, 420, 0] } },
    {
      title: "Turn cam bolts into the top",
      detail: "Two cam bolts (A) into the end of each curl of the top (1).",
      fix: [fx(A, SX.flatMap((sx) => topZ.map((z): Vec3 => [sx * xc, yS, z])), [0, 1, 0], "TOP")],
      wait: ["TOP"],
      from: out(["TOP"]),
    },
    {
      title: "Fit the top",
      detail: "Push its curls onto the top ends of the sides, over the dowels and bolts, and turn the four cam locks (B).",
      add: ["TOP"],
      fix: SX.map((sx) => fx(B, topZ.map((z): Vec3 => [sx * xi, yS - 25, z]), [sx, 0, 0], side(sx))),
    },
    { title: "Push dowels into the front edges", detail: "Six dowels (C): two into the front edge of the top and two into each side.", fix: frontDowels },
    { title: "Turn cam bolts into the front frame", detail: "Eight cam bolts (A) into the back of the frame (9): two across the top and three down each leg.", fix: [frameBolts], wait: ["F9"], from: out(["F9"]) },
    { title: "Fit the front frame", detail: "Press it onto the front edges, over the dowels and bolts, and turn the eight cam locks (B).", add: ["F9"], fix: frameLocks },
    {
      title: "Stand it up and hold the backs in",
      detail: "Four back brackets (H), two across each back panel at opposite corners, one small screw (I) each into the side.",
      fix: [
        ...brackets.map(([sx, y]) => fx(H, [[sx * xi, y, zk - 8]], [sx, 0, 0], side(sx))),
        ...brackets.map(([sx, y]) => fx(I, [[sx * xi, y, zk - 8]], [sx, 0, 0], side(sx))),
      ],
      pose: "+y",
    },
    {
      title: "Screw the drawer boxes together",
      detail: "For both drawers: two screws (F) through each side (13 and 11) into the ends of the back (12), grooves facing in.",
      fix: both.flatMap(boxScrews),
      wait: both.flatMap((j) => [dr(j).l, dr(j).r, dr(j).bk]),
      from: out(drawerIds),
      kind: "drawer",
    },
    { title: "Slide in the drawer bottoms", detail: "Each bottom (15) along the grooves in the sides, into the back.", wait: both.map((j) => dr(j).bt), from: out(drawerIds), kind: "drawer" },
    {
      title: "Prepare the drawer fronts",
      detail: "Four cam bolts (A) into the back of each front (14 and 17), then a handle (G) on each with two screws (N) from behind.",
      fix: both.flatMap(frontPrep),
      wait: both.map((j) => dr(j).f),
      from: out(drawerIds),
      kind: "drawer",
    },
    { title: "Lock the fronts onto the drawers", detail: "Press each front onto the front ends of its sides and turn the four cam locks (B).", fix: both.flatMap(frontLocks), kind: "drawer" },
    { title: "Screw the runners onto the drawers", detail: "A runner (K) on each left side and one (L) on each right side, along the bottom edge, two small screws (D) each.", fix: both.flatMap(drawerRunners), kind: "runners" },
    {
      title: "Slide the drawers in and cap the cam locks",
      detail: "Front 14 goes on top and 17 below. Rest each drawer's runners on the ones in the table and push it home, then press the two caps (O) over the lowest cam locks.",
      add: [1, 0].flatMap(ids),
      from: offset(drawerIds, [0, 0, 420]),
      fix: SX.map((sx) => fx(O, [[sx * xi, legY[2], zF - 25]], [sx, 0, 0], side(sx))),
      kind: "drawer",
    },
    {
      title: "Fix it to the wall",
      detail: "Screw the strap (R) to the back of the top with the short screw (P). Mark the wall through it, drill, push in the plug (S) and drive the long screw (Q) through the strap. Check for pipes and cables first.",
      fix: [
        fx(R, [[0, Ht, zB + 30]], [0, -1, 0], "TOP"),
        fx(Ps, [[0, Ht, zB + 55]], [0, -1, 0], "TOP"),
        fx(S, [[0, Ht - 25, zB - 1]], [0, 0, -1]),
        fx(Q, [[0, Ht - 25, zB + 23]], [0, 0, -1], "TOP"),
      ],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

const family: Family = { names: ["KMART:LUNA"], recipe };
export default family;
