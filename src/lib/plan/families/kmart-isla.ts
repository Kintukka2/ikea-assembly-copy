import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartMaterial, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's Isla range, read from its assembly manuals. Each manual's title names the one keycode it covers: 43151202
 * (3 Drawer Chest), 43151219 (Buffet Unit), 43333424 (Bookcase), 43333752 (Desk) and 43397785 (2 Drawer Bedside
 * Table). All of it is board on cam bolts, cam locks and dowels, standing on square metal tube.
 *
 * - 3 Drawer Chest: the three drawers come first: each box is screwed together (sides 8 and 9 to the back 10, a brace
 *   12 under the bottom 11 that slides in from the front), its front (7) is cam-locked on with a handle on its top
 *   edge, and the runners go underneath. Then runners inside the sides (2, 4), a back rail (3) across them on cam
 *   bolts, and upside down the sides stand on the top (1) and the bottom (6) is screwed on. A stand of two leg frames
 *   (14) and two rails (13) is bolted together and onto the bottom; stood up, the drawers go in, two back panels (5)
 *   are nailed on and two straps hold it to the wall. Kmart's bag: 23 cam bolts (A), 23 cam locks (B), 8 dowels (C),
 *   42 small screws (D), 21 long screws (E), 8 frame bolts (F), 4 leg bolts (G), 3 handles (H), 20 nails (I), 8 short
 *   screws (J), 2 wall plugs (K), 2 wall straps (L) and the Allen key (M).
 * - 2 Drawer Bedside Table: the same build with two drawers and no back rail or brace. Its one back panel (4) slides
 *   down grooves as the sides go onto the top, four brackets hold it at the corners, and it has no wall fixing.
 *   Kmart's bag: 12 cam bolts (A), 12 cam locks (B), 8 dowels (C), 32 small screws (D), 12 long screws (E), 8 frame
 *   bolts (F), 4 leg bolts (G), 2 handles (H), 4 back brackets (I), 4 short screws (J) and the Allen key (K).
 * - Buffet Unit: the chest's carcass and stand (letters 9 and 10 for the rails and frames), then a shelf (8) on four
 *   supports and two doors (7) on cup hinges, each with an edge handle and a stick-on pad, the backs nailed on and two
 *   wall straps. Kmart's bag: 8 cam bolts (A), 8 cam locks (B), 8 dowels (C), 24 hinge screws (D), 6 long screws (E),
 *   8 frame bolts (F), 4 leg bolts (G), 2 handles (H), 4 shelf supports (I), 6 short screws (J), 20 nails (K),
 *   4 hinges (L), 2 wall plugs (M), 2 wall straps (N), 2 pads (O) and the Allen key (P).
 * - Bookcase: a cabinet with two fluted doors at the bottom and three shelves above it, between two side frames of
 *   tube. The doors (11) get their hinges and handles first; the cabinet is built upside down on its top (6): sides
 *   (8, 9), the back (7) down its grooves, the bottom (10), two door stops and two base rails (3). Each shelf (5) gets
 *   a back rail (4) along its back edge, and each side frame is a lower half (2) pushed into an upper half (1). Lying
 *   on its back, the frames are bolted to the shelves, the cabinet top and the base rails; stood up, the doors hang,
 *   four brackets hold the cabinet's back and two straps fix it to the wall. Kmart's bag: 8 dowels (A), 4 cam bolts
 *   (B), 4 cam locks (C), 16 connector bolts (D), 28 small screws (E), 4 handle screws (F), 2 wall plugs (G), the
 *   Allen key (H), 2 wall straps (I), 4 hinges (J), 2 handles (K), 15 long screws (L), 4 rail bolts (M), 8 frame
 *   bolts (N), 4 base bolts (O), 2 door stops (P), 6 thick dowels (Q) and 4 back brackets (R).
 * - Desk: built upside down on its top (1): cam bolts into it, the ends (3, 4) and the divider (5) with their runners,
 *   the back panel (13), the bottom panel (2), then a modesty panel (6) and a front rail (15) under the bottom, and the
 *   two leg frames (14) with the low back rail (16). Two drawers: fronts (7, 8) with cam bolts and handles, boxes of
 *   sides (9, 10), backs (11) and bottoms (12), runners underneath. Kmart's bag: 20 cam bolts (A), 20 cam locks (B),
 *   12 dowels (C), 17 long screws (D), 2 handles (E), 4 handle screws (F), 28 small screws (G), 4 long bolts (H),
 *   7 short bolts (I), 4 connector bolts (J), the Allen key (K), 2 thick dowels (L) and four pairs of 300 mm runners
 *   (CL, CR, DL, DR).
 *
 * Readings I had to choose, as the manuals print no sizes:
 * - The chest's and the buffet's rail (3) stands at the back at half height: the upside down drawings show it behind
 *   the drawer runners, and the backs are nailed over it.
 * - Step 1 of the chest and of the bedside table builds every drawer in four drawings (box, bottom, front and handle,
 *   runners), so it is three guide steps here: the box and its bottom, the front, the runners.
 * - The desk's modesty panel (6) hangs under the bottom panel at the back, between the back legs: its cam bolts go
 *   into the bottom's back edge and the four connector bolts (J) through the back legs into its ends.
 * - The bookcase's straps (I) sit on the back posts under the top shelf, as step 12 draws them, with one screw and one
 *   plug each. The buffet's pads (O) go inside each door beside its handle, as drawn; the manual doesn't say why.
 * - Leg heights, panel thicknesses, shelf heights and drawer and runner sizes are worked out from the drawings and the
 *   listed outer sizes.
 *
 * Part numbers are Kmart's own, so the guide reads against the paper; the hardware letters are in each step's text.
 */

const T = 15; // carcass board
const BK = 3; // back panels and drawer bottoms
const FT = 15; // plain drawer fronts and doors
const TB = 25; // square tube
const LH = 160; // the stand under the chests and the buffet: floor to the underside of the carcass
const LI = 20; // the stand sits this far in from the carcass's edges
const OUT = 420; // drawers and doors are built this far in front (staged parts are drawn 1.6 times as far)

type Def = { kind: CustomFix["kind"]; len: number; dia: number; name?: string; included?: boolean };
const CAM_BOLT: Def = { kind: "camScrew", len: 35, dia: 6 };
const CAM: Def = { kind: "cam", len: 10, dia: 15 };
const DOWEL: Def = { kind: "dowel", len: 30, dia: 6 };
const DOWEL8: Def = { kind: "dowel", len: 30, dia: 8 };
const SMALL: Def = { kind: "screw", len: 12, dia: 3.5 };
const SCREW: Def = { kind: "screw", len: 35, dia: 4 };
const SHORT: Def = { kind: "screw", len: 12, dia: 4 };
const BOLT12: Def = { kind: "bolt", len: 12, dia: 6 };
const BOLT28: Def = { kind: "bolt", len: 28, dia: 6 };
const BOLT40: Def = { kind: "bolt", len: 40, dia: 6 };
const NAIL: Def = { kind: "nail", len: 16, dia: 2 };
const PLUG: Def = { kind: "plug", len: 30, dia: 6, included: true };
const WALL_SCREW: Def = { ...SCREW, included: true };
const STRAP: Def = { kind: "strap", len: 90, dia: 18, name: "Wall strap" };
const HANDLE: Def = { kind: "handle", len: 64, dia: 10 };
const HINGE: Def = { kind: "hinge", len: 50, dia: 35 };
const BRACKET: Def = { kind: "clamp", len: 16, dia: 12, name: "Back panel bracket" };
const SUPPORT: Def = { kind: "pin", len: 16, dia: 5, name: "Shelf support" };
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

const SX = [-1, 1] as const;
const WORDS = ["no", "one", "two", "three", "four", "five", "six"];
const num = (n: number) => WORDS[n] ?? String(n);
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const offset = (ids: string[], v: Vec3) => Object.fromEntries(ids.map((id) => [id, v] as [string, Vec3]));
const out = (ids: string[]) => offset(ids, [0, 0, OUT]);

/* ---------- the carcass of the chest, the bedside table and the buffet ---------- */

/**
 * Two sides between a top and a bottom that both cover them, on a stand of tube. The chest and the buffet have two
 * back panels nailed over the back edges (so the boards stop 3 mm short of the back) and a rail between the sides at
 * the back; the bedside table has one back panel in grooves 10 mm in from the back edge.
 */
function carcass(p: Parts, s: ProductSpec, N: Record<string, string>, nailed: boolean, rail: boolean) {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const zb = nailed ? -D / 2 + BK : -D / 2; // the boards' back edges
  const Dc = D / 2 - zb, zc = (zb + D / 2) / 2;
  const xi = W / 2 - T, xo = W / 2 - T / 2; // the sides' inner faces and centres
  const y0 = LH + T, y1 = H - T; // the sides, between the bottom and the top
  const RH = 80, yr = Math.round((y0 + y1) / 2); // the back rail
  const zg = -D / 2 + 10 + BK / 2; // a grooved back panel
  p.add("T1", N.top, "Top", [W, T, Dc], [0, H - T / 2, zc]);
  p.add("SL", N.left, "Left side", [T, y1 - y0, Dc], [-xo, (y0 + y1) / 2, zc]);
  p.add("SR", N.right, "Right side", [T, y1 - y0, Dc], [xo, (y0 + y1) / 2, zc]);
  if (rail) p.add("R3", N.rail, "Back rail", [2 * xi, RH, T], [0, yr, zb + T / 2]);
  p.add("B6", N.bottom, "Bottom", [W, T, Dc], [0, LH + T / 2, zc]);
  const backs = nailed ? ["K-L", "K-R"] : ["K"];
  if (nailed) SX.forEach((g, i) => p.add(backs[i], N.back, "Back panel", [W / 2, H - LH, BK], [(g * W) / 4, (LH + H) / 2, -D / 2 + BK / 2], "fiber"));
  else p.add("K", N.back, "Back panel", [2 * xi + 16, y1 - y0 + 16, BK], [0, (y0 + y1) / 2, zg], "fiber");

  // the stand: two leg frames (a leg at each end of a bar) and two rails between their tops, front and back
  const xf = W / 2 - LI - TB / 2, Df = Dc - 2 * LI, zl = Df / 2 - TB / 2;
  const frame: PartPiece[] = [
    ...SX.map((sz): PartPiece => ({ shape: "box", size: [TB, LH, TB], pos: [0, 0, sz * zl] })),
    { shape: "box", size: [TB, TB, Df - 2 * TB], pos: [0, LH / 2 - TB / 2, 0] },
  ];
  p.add("LF-L", N.frame, "Leg frame", [TB, LH, Df], [-xf, LH / 2, zc], "metal", frame);
  p.add("LF-R", N.frame, "Leg frame", [TB, LH, Df], [xf, LH / 2, zc], "metal", frame);
  p.add("LR-B", N.legRail, "Leg rail", [2 * xf - TB, TB, TB], [0, LH - TB / 2, zc - zl], "metal");
  p.add("LR-F", N.legRail, "Leg rail", [2 * xf - TB, TB, TB], [0, LH - TB / 2, zc + zl], "metal");
  const standIds = ["LF-L", "LR-B", "LR-F", "LF-R"];
  const legOf = (g: number) => (g < 0 ? "LF-L" : "LF-R");
  const railOf = (sz: number) => (sz < 0 ? "LR-B" : "LR-F");
  const sideOf = (g: number) => (g < 0 ? "SL" : "SR");

  const zA = [zc - (Dc / 2 - 40), zc + (Dc / 2 - 40)]; // cam bolts, cam locks and screws along the sides' ends
  const zC = [zc - (Dc / 2 - 75), zc + (Dc / 2 - 75)]; // dowels
  const fix = {
    // two cam bolts into each side, two cam locks in each end of the rail
    rail: [
      ...SX.map((g) => fx(CAM_BOLT, [yr - 20, yr + 20].map((y): Vec3 => [g * xi, y, zb + T / 2]), [g, 0, 0], sideOf(g), "R3")),
      fx(CAM, SX.flatMap((g) => [yr - 20, yr + 20].map((y): Vec3 => [g * (xi - 25), y, zb + T])), [0, 0, -1], "R3"),
    ],
    // cam bolts and dowels in the top under each side, cam locks in the sides
    top: [
      ...SX.map((g) => fx(CAM_BOLT, zA.map((z): Vec3 => [g * xo, y1, z]), [0, 1, 0], "T1", sideOf(g))),
      ...SX.map((g) => fx(DOWEL, zC.map((z): Vec3 => [g * xo, y1, z]), [0, 1, 0], "T1", sideOf(g))),
      ...SX.map((g) => fx(CAM, zA.map((z): Vec3 => [g * xi, y1 - 25, z]), [g, 0, 0], sideOf(g))),
    ],
    // dowels in the sides' bottom ends, screws up through the bottom
    bottom: [
      ...SX.map((g) => fx(DOWEL, zC.map((z): Vec3 => [g * xo, y0, z]), [0, 1, 0], sideOf(g), "B6")),
      ...SX.map((g) => fx(SCREW, zA.map((z): Vec3 => [g * xo, LH, z]), [0, 1, 0], "B6", sideOf(g))),
    ],
    // a bolt through each leg's top into a rail's end
    stand: SX.flatMap((g) => SX.map((sz) => fx(BOLT40, [[g * (xf + TB / 2), LH - TB / 2, zc + sz * zl]], [-g, 0, 0], legOf(g), railOf(sz)))),
    // two bolts up through each frame's bar and each rail into the bottom
    under: [
      ...SX.map((g) => fx(BOLT28, SX.map((k): Vec3 => [g * xf, LH - TB, zc + k * (zl - 45)]), [0, 1, 0], legOf(g), "B6")),
      ...SX.map((sz) => fx(BOLT28, SX.map((k): Vec3 => [k * Math.round(xf * 0.5), LH - TB, zc + sz * zl]), [0, 1, 0], railOf(sz), "B6")),
    ],
    // ten nails round each back panel: three into the top, three into the bottom, four into the side
    nails: backs.flatMap((id, i) => {
      const g = SX[i], cx = (g * W) / 4;
      return [
        fx(NAIL, [-120, 0, 120].map((dx): Vec3 => [cx + dx, H - T / 2, -D / 2]), [0, 0, 1], id, "T1"),
        fx(NAIL, [-120, 0, 120].map((dx): Vec3 => [cx + dx, LH + T / 2, -D / 2]), [0, 0, 1], id, "B6"),
        fx(NAIL, [0.12, 0.37, 0.63, 0.88].map((k): Vec3 => [g * xo, Math.round(y0 + k * (y1 - y0)), -D / 2]), [0, 0, 1], id, sideOf(g)),
      ];
    }),
    // a strap screwed to the back of the top near each end, then a plug and a screw into the wall
    wall: [
      fx(STRAP, [-W / 4, W / 4].map((x): Vec3 => [x, H + 25, -D / 2]), [0, 0, 1], "T1"),
      fx(SHORT, [-W / 4, W / 4].map((x): Vec3 => [x, H - 10, -D / 2]), [0, 0, 1], "T1"),
      fx(PLUG, [-W / 4, W / 4].map((x): Vec3 => [x, H + 55, -D / 2 - 30]), [0, 0, -1]),
      fx(WALL_SCREW, [-W / 4, W / 4].map((x): Vec3 => [x, H + 55, -D / 2 + 1.4]), [0, 0, -1], "T1"),
    ],
    // a bracket at each corner of a grooved back panel, screwed to the side behind it
    brackets: [
      ...SX.map((g) => fx(BRACKET, [y0 + 15, y1 - 15].map((y): Vec3 => [g * xi, y, -D / 2 + 4]), [g, 0, 0], sideOf(g))),
      ...SX.map((g) => fx(SMALL, [y0 + 15, y1 - 15].map((y): Vec3 => [g * xi, y, -D / 2 + 4]), [g, 0, 0], sideOf(g))),
    ],
  };
  return { W, H, D, zb, Dc, zc, xi, xo, y0, y1, yr, RH, backs, standIds, fix };
}

/* ---------- the 3 drawer chest and the 2 drawer bedside table ---------- */

interface ChestOpts {
  rows: number;
  N: Record<string, string>;
  chest: boolean; // the chest: a back rail, a brace under each drawer, two nailed backs, wall straps
}

function chest(s: ProductSpec, o: ChestOpts): CustomParams {
  const { rows, N } = o;
  const p = new Parts();
  const c = carcass(p, s, N, o.chest, o.chest);
  const { D, xi, y0, y1 } = c;
  const hr = (y1 - y0) / rows; // the drawer fronts fill the opening, 4 mm apart
  const fy = (i: number) => y0 + (i + 0.5) * hr; // drawer 0 at the bottom
  const zf = D / 2 - FT; // the fronts' back faces
  const DT = 12, DD = 350, SH = 115; // drawer sides: thickness, depth, height
  const xs = xi - 12.5; // the drawer boxes' outer faces, clear of the runners
  const zk = zf - DD; // the drawer backs' back faces
  const zr = zf - DD / 2; // the runners
  const ybox = (i: number) => y0 + i * hr + 22; // a drawer box's underside
  const all = range(rows);
  const ids = (i: number) => ({ f: `F${i}`, l: `DL${i}`, r: `DR${i}`, bk: `DB${i}`, bt: `DT${i}`, br: `DC${i}` });
  for (const i of all) {
    const d = ids(i), y = ybox(i);
    p.add(d.f, N.front, "Drawer front", [2 * xi - 4, hr - 4, FT], [0, fy(i), D / 2 - FT / 2]);
    p.add(d.l, N.sideL, "Left drawer side", [DT, SH, DD], [-(xs - DT / 2), y + SH / 2, zr]);
    p.add(d.r, N.sideR, "Right drawer side", [DT, SH, DD], [xs - DT / 2, y + SH / 2, zr]);
    p.add(d.bk, N.dBack, "Drawer back", [2 * (xs - DT), SH, DT], [0, y + SH / 2, zk + DT / 2]);
    // the bottom runs in grooves, from just behind the front into the back; the chest's brace runs under it
    p.add(d.bt, N.dBottom, "Drawer bottom", [2 * (xs - DT) + 12, BK, DD - DT + 5], [0, y + (o.chest ? 15 : 10), (zf - 1 + zk + DT - 6) / 2], "fiber");
    if (o.chest) p.add(d.br, N.brace, "Drawer brace", [60, 12, DD - DT - 1], [0, y + 7.5, (zf - 1 + zk + DT) / 2]);
  }
  const side = (i: number, g: number) => (g < 0 ? ids(i).l : ids(i).r);
  const dys = (i: number) => [ybox(i) + 30, ybox(i) + SH - 30];
  const yHandle = (i: number) => fy(i) + hr / 2 - 16;
  const boxFix = (i: number): CustomFix[] => [
    ...SX.map((g) => fx(SCREW, dys(i).map((y): Vec3 => [g * xs, y, zk + DT / 2]), [-g, 0, 0], side(i, g), ids(i).bk)),
    ...(o.chest ? [fx(SCREW, [[0, ybox(i) + 7.5, zk]], [0, 0, 1], ids(i).bk, ids(i).br)] : []),
  ];
  const frontFix = (i: number): CustomFix[] => [
    ...SX.map((g) => fx(CAM_BOLT, dys(i).map((y): Vec3 => [g * (xs - DT / 2), y, zf]), [0, 0, 1], ids(i).f, side(i, g))),
    ...(o.chest ? [fx(CAM_BOLT, [[0, ybox(i) + 7.5, zf]], [0, 0, 1], ids(i).f, ids(i).br)] : []),
    ...SX.map((g) => fx(CAM, dys(i).map((y): Vec3 => [g * (xs - DT), y, zf - 25]), [g, 0, 0], side(i, g))),
    ...(o.chest ? [fx(CAM, [[0, ybox(i) + 1.5, zf - 25]], [0, 1, 0], ids(i).br)] : []),
    fx(HANDLE, [[0, yHandle(i), D / 2]], [0, 0, -1], ids(i).f),
    fx(SHORT, [-32, 32].map((x): Vec3 => [x, yHandle(i), zf]), [0, 0, 1], ids(i).f),
  ];
  const RL = 350;
  const right = N.runR, left = N.runL; // the manual's runner pairs: -1 goes in the carcass, -2 on the drawer
  const drawerRun = (i: number): CustomFix[] =>
    SX.flatMap((g) => [
      fx(runner(RL, g < 0 ? "Drawer runner, left" : "Drawer runner, right"), [[g * (xs - DT / 2), ybox(i), zr]], [0, 1, 0], side(i, g)),
      fx(SMALL, [-150, -40, 120].map((dz): Vec3 => [g * (xs - DT / 2), ybox(i), zr + dz]), [0, 1, 0], side(i, g)),
    ]);
  const cabRun = (g: number): CustomFix[] => [
    fx(runner(RL, g < 0 ? "Cabinet runner, left" : "Cabinet runner, right"), all.map((i): Vec3 => [g * xi, ybox(i) - 2, zr - 5]), [g, 0, 0], g < 0 ? "SL" : "SR"),
    fx(SMALL, all.flatMap((i) => [-150, -60, 60, 150].map((dz): Vec3 => [g * xi, ybox(i) - 2, zr - 5 + dz])), [g, 0, 0], g < 0 ? "SL" : "SR"),
  ];
  const boxIds = all.flatMap((i) => [ids(i).l, ids(i).r, ids(i).bk, ids(i).bt, ...(o.chest ? [ids(i).br] : [])]);
  const fronts = all.map((i) => ids(i).f);
  const drawerIds = [...boxIds, ...fronts];
  const n = num(rows);
  const lie = "-y" as const;

  const steps: CustomStep[] = [
    {
      title: "Screw the drawer boxes together",
      detail: o.chest
        ? `For each of the ${n} drawers: two long screws (E) through each side (${N.sideL} and ${N.sideR}) into the back (${N.dBack}) and one through the back into the brace (${N.brace}), then slide the bottom (${N.dBottom}) along the grooves from the front, over the brace.`
        : `For each drawer: two long screws (E) through each side (${N.sideR} and ${N.sideL}) into the back (${N.dBack}), then slide the bottom (${N.dBottom}) along the grooves from the front.`,
      fix: all.flatMap(boxFix),
      wait: boxIds,
      from: out(boxIds),
      tools: ["screwdriver"],
      kind: "drawer",
      warnings: ["floor"],
    },
    {
      title: "Fix the fronts and handles",
      detail: o.chest
        ? `Turn five cam bolts (A) into the back of each front (${N.front}), push it onto the sides and the brace and lock the five cam locks (B). Screw a handle (H) onto the top edge with two short screws (J) from behind.`
        : `Turn four cam bolts (A) into the back of each front (${N.front}), push it onto the sides and lock the four cam locks (B). Screw a handle (H) onto the top edge with two short screws (J) from behind.`,
      fix: all.flatMap(frontFix),
      wait: fronts,
      from: out(fronts),
      tools: ["screwdriver"],
      kind: "drawer",
    },
    {
      title: "Screw the runners under the drawers",
      detail: `Turn each drawer over: the right runner (${right}-2) along the bottom edge of the right side and the left runner (${left}-2) along the left, wheel at the back, three small screws (D) each.`,
      fix: all.flatMap(drawerRun),
      tools: ["screwdriver"],
      kind: "runners",
    },
    {
      title: "Screw the runners inside the sides",
      detail: `Lay the sides flat, inside face up: ${n} left runners (${left}-1) on the left side (${N.left}) and ${n} right runners (${right}-1) on the right side (${N.right}), wheel to the front, four small screws (D) each.`,
      fix: [...cabRun(-1), ...cabRun(1)],
      wait: ["SL", "SR"],
      from: { SL: [-300, 0, 0], SR: [300, 0, 0] },
      tools: ["screwdriver"],
      kind: "runners",
      warnings: ["floor"],
    },
  ];
  if (o.chest)
    steps.push({
      title: "Join the sides with the back rail",
      detail: `Stand the sides on their top ends, runners facing in. Two cam bolts (A) into each side near the back, push the back rail (${N.rail}) onto them and lock its four cam locks (B).`,
      add: ["SL", "SR", "R3"],
      fix: c.fix.rail,
      from: { SL: [-300, 0, 0], SR: [300, 0, 0], R3: [0, 0, -400] },
      pose: lie,
      tools: ["screwdriver"],
    });
  steps.push({
    title: o.chest ? "Fix the sides onto the top" : "Fix the sides onto the top and slide in the back",
    detail:
      `Lay the top (${N.top}) face down on a rug. Two cam bolts (A) and two dowels (C) into it under each end, stand the sides on them and lock the four cam locks (B).` +
      (o.chest ? "" : ` Slide the back panel (${N.back}) down the grooves in the sides.`),
    add: o.chest ? ["T1"] : ["T1", "SL", "SR", "K"],
    fix: c.fix.top,
    from: { T1: [c.W * 0.8, 0, 0], SL: [-300, 0, 0], SR: [300, 0, 0], K: [0, -450, 0] },
    pose: lie,
    tools: ["screwdriver"],
    warnings: ["floor"],
  });
  steps.push({
    title: "Screw on the bottom",
    detail: `Two dowels (C) into the end of each side, lay the bottom (${N.bottom}) on and drive two long screws (E) through it into each side.`,
    add: ["B6"],
    fix: c.fix.bottom,
    pose: lie,
    tools: ["screwdriver"],
  });
  steps.push({
    title: "Bolt the leg frame together",
    detail: `Stand the two leg frames (${N.frame}) apart and put the two rails (${N.legRail}) between the tops of their legs. One bolt (G) through each leg into the end of a rail, with the Allen key.`,
    fix: c.fix.stand,
    wait: c.standIds,
    from: offset(c.standIds, [(c.W + 200) / 1.6, 0, 0]),
    pose: lie,
    tools: ["allen"],
  });
  steps.push({
    title: "Bolt the frame onto the bottom",
    detail: "Turn the frame over onto the bottom, legs up, and drive eight bolts (F) through it into the bottom: two through each frame and two through each rail.",
    add: c.standIds,
    fix: c.fix.under,
    from: offset(c.standIds, [(c.W + 200) / 1.6, 0, 0]),
    pose: lie,
    tools: ["allen"],
  });
  steps.push({
    title: rows > 2 ? `Stand it up and slide the ${n} drawers in` : "Stand it up and slide both drawers in",
    detail: `Turn it onto its legs. Rest each drawer's runners on the ones in the ${o.chest ? "chest" : "table"} and push it home.`,
    add: drawerIds,
    from: out(drawerIds),
    pose: "+y",
    kind: "drawer",
  });
  if (o.chest) {
    steps.push({
      title: "Nail on the back panels",
      detail: `Turn it round. Lay the two back panels (${N.back}) side by side over the back, the right way out, and tap in twenty nails (I) round their edges: into the top, the bottom and the sides.`,
      add: c.backs,
      fix: c.fix.nails,
      from: offset(c.backs, [0, 0, -400]),
      tools: ["hammer"],
      kind: "nails",
    });
    steps.push({
      title: "Fix it to the wall",
      detail: "Screw the two wall straps (L) to the back edge of the top with a short screw (J) each. Push the chest against the wall, mark through the straps, drill, push in the plugs (K) and screw each strap to the wall with a long screw (E). Check for pipes and cables first.",
      fix: c.fix.wall,
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    });
  } else
    steps.push({
      title: "Fit the back panel brackets",
      detail: "Turn it round. Press a bracket (I) into each corner behind the back panel and fix it with a small screw (D).",
      fix: c.fix.brackets,
      tools: ["screwdriver"],
    });
  return { parts: p.list, steps };
}

/* ---------- the buffet ---------- */

/** The chest's carcass with an adjustable shelf and two inset doors on cup hinges, each hung on its side. */
function buffet(s: ProductSpec): CustomParams {
  const N = { top: "1", left: "2", rail: "3", right: "4", back: "5", bottom: "6", door: "7", shelf: "8", legRail: "9", frame: "10" };
  const p = new Parts();
  const c = carcass(p, s, N, true, true);
  const { D, xi, y0, y1, yr, RH, zb } = c;
  // the shelf rests on four supports just under the back rail and reaches back under it
  const zfd = D / 2 - FT; // the doors' back faces
  const shTop = yr - RH / 2 - 1, sd = zfd - 2 - zb;
  p.add("SH", N.shelf, "Shelf", [2 * xi - 2, T, sd], [0, shTop - T / 2, (zfd - 2 + zb) / 2]);
  const dw = xi - 3, dh = y1 - y0 - 4, dyc = (y0 + y1) / 2;
  const doors = [
    { id: "D7L", g: -1, on: "SL" },
    { id: "D7R", g: 1, on: "SR" },
  ];
  for (const d of doors) p.add(d.id, N.door, "Door", [dw, dh, FT], [d.g * (dw / 2 + 1.5), dyc, D / 2 - FT / 2]);
  const doorIds = doors.map((d) => d.id);
  const hy = [y0 + 2 + 90, y1 - 2 - 90];
  const cupX = (g: number) => g * (xi - 1.5 - 22); // 22 mm in from the hinge edge
  const zs = [zfd - 2 - 40, zb + 40];
  const xh = (g: number) => g * 16.5; // the handles, on the doors' inner edges

  const lie = "-y" as const;
  const off = (c.W + 200) / 1.6;
  const steps: CustomStep[] = [
    {
      title: "Join the sides with the back rail",
      detail: `Stand the sides (${N.left} and ${N.right}) on their top ends. Two cam bolts (A) into each side near the back, push the back rail (${N.rail}) onto them and lock its four cam locks (B).`,
      add: ["SL", "SR", "R3"],
      fix: c.fix.rail,
      from: { SL: [-300, 0, 0], SR: [300, 0, 0], R3: [0, 0, -400] },
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Fix the sides onto the top",
      detail: `Lay the top (${N.top}) face down on a rug. Two cam bolts (A) and two dowels (C) into it under each end, stand the sides on them and lock the four cam locks (B).`,
      add: ["T1"],
      fix: c.fix.top,
      from: { T1: [c.W * 0.8, 0, 0] },
      pose: lie,
      tools: ["screwdriver"],
      warnings: ["floor"],
    },
    {
      title: "Screw on the bottom",
      detail: `Two dowels (C) into the end of each side, lay the bottom (${N.bottom}) on and drive two long screws (E) through it into each side.`,
      add: ["B6"],
      fix: c.fix.bottom,
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Bolt the leg frame together",
      detail: `Stand the two leg frames (${N.frame}) apart and put the two rails (${N.legRail}) between the tops of their legs. One bolt (G) through each leg into the end of a rail, with the Allen key.`,
      fix: c.fix.stand,
      wait: c.standIds,
      from: offset(c.standIds, [off, 0, 0]),
      pose: lie,
      tools: ["allen"],
    },
    {
      title: "Bolt the frame onto the bottom",
      detail: "Turn the frame over onto the bottom, legs up, and drive eight bolts (F) through it into the bottom: two through each frame and two through each rail.",
      add: c.standIds,
      fix: c.fix.under,
      from: offset(c.standIds, [off, 0, 0]),
      pose: lie,
      tools: ["allen"],
    },
    {
      title: "Stand it up and fit the shelf",
      detail: `Turn it onto its legs. Push four shelf supports (I) into the holes in the sides at the height you want, two in each side, then slide the shelf (${N.shelf}) in on them.`,
      fix: SX.map((g) => fx(SUPPORT, zs.map((z): Vec3 => [g * xi, shTop - T - 3, z]), [g, 0, 0], g < 0 ? "SL" : "SR")),
      add: ["SH"],
      from: { SH: [0, 0, 450] },
      pose: "+y",
      kind: "shelves",
    },
    {
      title: "Hang the doors and fit the handles",
      detail: `Each door (${N.door}) hangs on two hinges (L): two small screws (D) into the door and four into the side for each hinge, 24 in all. Screw a handle (H) onto each door's inner edge with two short screws (J) from behind, peel a pad (O) and stick it inside the door beside the handle. Turn the hinge screws until the doors meet evenly.`,
      add: doorIds,
      fix: doors.flatMap((d) => [
        fx(HINGE, hy.map((y): Vec3 => [cupX(d.g), y, zfd]), [0, 0, 1], d.id, undefined, d.g > 0 ? { twist: Math.PI } : {}),
        fx(SMALL, hy.flatMap((y) => [-12, 12].map((k): Vec3 => [cupX(d.g) - d.g * 24, y + k, zfd])), [0, 0, 1], d.id),
        fx(SMALL, hy.flatMap((y) => [-16, 16].flatMap((k) => [zfd - 20, zfd - 52].map((z): Vec3 => [d.g * xi, y + k, z]))), [d.g, 0, 0], d.on, d.id),
        fx(HANDLE, [[xh(d.g), dyc, D / 2]], [0, 0, -1], d.id, undefined, { twist: Math.PI / 2 }),
        fx(SHORT, [dyc - 32, dyc + 32].map((y): Vec3 => [xh(d.g), y, zfd]), [0, 0, 1], d.id),
        fx({ kind: "glide", len: 2, dia: 15, name: "Stick-on pad" }, [[d.g * 45, dyc, zfd]], [0, 0, 1], d.id),
      ]),
      from: out(doorIds),
      tools: ["screwdriver"],
      kind: "doors",
    },
    {
      title: "Nail on the back panels",
      detail: `Turn it round. Lay the two back panels (${N.back}) side by side over the back, the right way out, and tap in twenty nails (K) round their edges: into the top, the bottom and the sides.`,
      add: c.backs,
      fix: c.fix.nails,
      from: offset(c.backs, [0, 0, -400]),
      tools: ["hammer"],
      kind: "nails",
    },
    {
      title: "Fix it to the wall",
      detail: "Screw the two wall straps (N) to the back edge of the top with a short screw (J) each. Push the buffet against the wall, mark through the straps, drill, push in the plugs (M) and screw each strap to the wall with a long screw (E). Check for pipes and cables first.",
      fix: c.fix.wall,
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts: p.list, steps };
}

/* ---------- the bookcase ---------- */

/**
 * Two side frames of 25 mm tube, each a lower half (2: two posts with a bar at the base rails and one at the cabinet
 * top) pushed into an upper half (1: two posts and a top bar). Between them three shelves (5), each with a back rail
 * (4) on its back edge, and a cabinet of 16 mm board: top (6), sides (8, 9), back (7), bottom (10) on two base rails
 * (3), behind two fluted doors (11) that cover the sides' front edges.
 */
function bookcase(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const P = 25, BT = 16, DF = 18; // tube, board, fluted doors
  const xo = W / 2 - P / 2, xin = W / 2 - P; // the frames' centres and inner faces
  const zp = D / 2 - P / 2; // posts, front and back
  const YJ = 820; // where the lower halves meet the upper ones
  const yRail = 107.5; // the base rails' centre
  const y10 = yRail + P / 2; // the cabinet bottom's underside
  const y6 = 455; // the cabinet top's centre
  const ys0 = y10 + BT, ys1 = y6 - BT / 2; // the cabinet sides, between its bottom and top
  const pitch = Math.round((H - 100 - y6) / 3);
  const shelfY = [1, 2, 3].map((k) => y6 + k * pitch); // the shelves' centres, the top one 100 mm under the frame tops
  const xsd = xin - BT / 2; // the cabinet sides' centres
  const zfd = D / 2 - DF; // the doors' back faces and the sides' front edges
  const zsc = (zfd - D / 2) / 2, hd = (zfd + D / 2) / 2; // the sides' centre and half depth
  const dw = xin - 3, dh = ys1 - ys0 - 4, dyc = (ys0 + ys1) / 2;

  const p = new Parts();
  const lower: PartPiece[] = [
    ...SX.map((sz): PartPiece => ({ shape: "box", size: [P, YJ, P], pos: [0, 0, sz * zp] })),
    ...[yRail, y6].map((y): PartPiece => ({ shape: "box", size: [P, P, D - 2 * P], pos: [0, y - YJ / 2, 0] })),
  ];
  const upper: PartPiece[] = [
    ...SX.map((sz): PartPiece => ({ shape: "box", size: [P, H - YJ, P], pos: [0, 0, sz * zp] })),
    { shape: "box", size: [P, P, D - 2 * P], pos: [0, (H - YJ) / 2 - P / 2, 0] },
  ];
  p.add("D11L", "11", "Door", [dw, dh, DF], [-(dw / 2 + 1.5), dyc, D / 2 - DF / 2]);
  p.add("D11R", "11", "Door", [dw, dh, DF], [dw / 2 + 1.5, dyc, D / 2 - DF / 2]);
  p.add("C6", "6", "Cabinet top", [2 * xin, BT, D], [0, y6, 0]);
  p.add("S8", "8", "Left cabinet side", [BT, ys1 - ys0, zfd + D / 2], [-xsd, (ys0 + ys1) / 2, zsc]);
  p.add("S9", "9", "Right cabinet side", [BT, ys1 - ys0, zfd + D / 2], [xsd, (ys0 + ys1) / 2, zsc]);
  p.add("K7", "7", "Cabinet back", [2 * (xin - BT) + 16, ys1 - ys0 + 8, BK], [0, (ys0 + ys1 + 8) / 2, -D / 2 + 10 + BK / 2], "fiber");
  p.add("C10", "10", "Cabinet bottom", [2 * xin, BT, D], [0, y10 + BT / 2, 0]);
  p.add("R3B", "3", "Base rail", [2 * xin, P, P], [0, yRail, -zp], "metal");
  p.add("R3F", "3", "Base rail", [2 * xin, P, P], [0, yRail, zp], "metal");
  const shelves = shelfY.map((_, k) => `S5-${k}`), backRails = shelfY.map((_, k) => `R4-${k}`);
  shelfY.forEach((y, k) => {
    p.add(shelves[k], "5", "Shelf", [2 * xin, BT, D], [0, y, 0]);
    p.add(backRails[k], "4", "Shelf back rail", [2 * xin, 45, BT], [0, y + BT / 2 + 22.5, -D / 2 + BT / 2]);
  });
  p.add("F2L", "2", "Lower side frame", [P, YJ, D], [-xo, YJ / 2, 0], "metal", lower);
  p.add("F2R", "2", "Lower side frame", [P, YJ, D], [xo, YJ / 2, 0], "metal", lower);
  p.add("F1L", "1", "Upper side frame", [P, H - YJ, D], [-xo, (YJ + H) / 2, 0], "metal", upper);
  p.add("F1R", "1", "Upper side frame", [P, H - YJ, D], [xo, (YJ + H) / 2, 0], "metal", upper);

  const doors = [
    { id: "D11L", g: -1, on: "S8" },
    { id: "D11R", g: 1, on: "S9" },
  ];
  const hy = [ys0 + 2 + 70, ys1 - 2 - 70];
  const cupX = (g: number) => g * (xin - 1.5 - 22);
  const sideOf = (g: number) => (g < 0 ? "S8" : "S9");
  const zB = [zsc - (hd - 40), zsc + (hd - 40)], zD = [zsc - (hd - 75), zsc + (hd - 75)];
  const frameOf = (g: number, upperHalf: boolean) => (upperHalf ? (g < 0 ? "F1L" : "F1R") : g < 0 ? "F2L" : "F2R");
  const frames = ["F2L", "F1L", "F2R", "F1R"];
  const frameOff: Record<string, Vec3> = { F2L: [-420, 0, 0], F1L: [-420, 0, 0], F2R: [420, 0, 0], F1R: [420, 0, 0] };
  const boards = [{ id: "C6", y: y6, up: false }, ...shelfY.map((y, k) => ({ id: shelves[k], y, up: true }))];
  const lie = "-y" as const;
  const yW = shelfY[2] - BT / 2 - 50; // the wall straps, under the top shelf

  const steps: CustomStep[] = [
    {
      title: "Fit the hinges and handles to the doors",
      detail: "Lay both doors (11) face down on a rug. Press two hinges (J) into the cup holes of each and fix each with two small screws (E), then screw a handle (K) onto each door's inner edge with two short screws (F) from behind.",
      fix: doors.flatMap((d) => [
        fx(HINGE, hy.map((y): Vec3 => [cupX(d.g), y, zfd]), [0, 0, 1], d.id, undefined, d.g > 0 ? { twist: Math.PI } : {}),
        fx(SMALL, hy.flatMap((y) => [-12, 12].map((k): Vec3 => [cupX(d.g) - d.g * 24, y + k, zfd])), [0, 0, 1], d.id),
        fx(HANDLE, [[d.g * 16.5, dyc, D / 2]], [0, 0, -1], d.id, undefined, { twist: Math.PI / 2 }),
        fx(SHORT, [dyc - 32, dyc + 32].map((y): Vec3 => [d.g * 16.5, y, zfd]), [0, 0, 1], d.id),
      ]),
      wait: ["D11L", "D11R"],
      from: out(["D11L", "D11R"]),
      tools: ["screwdriver"],
      kind: "hinges",
      warnings: ["floor"],
    },
    {
      title: "Stand the cabinet sides on its top",
      detail: "Lay the cabinet top (6) face down. Two cam bolts (B) and two dowels (A) into it under each end, stand the left side (8) and the right side (9) on them and lock the four cam locks (C).",
      add: ["C6", "S8", "S9"],
      fix: [
        ...SX.map((g) => fx(CAM_BOLT, zB.map((z): Vec3 => [g * xsd, ys1, z]), [0, 1, 0], "C6", sideOf(g))),
        ...SX.map((g) => fx(DOWEL, zD.map((z): Vec3 => [g * xsd, ys1, z]), [0, 1, 0], "C6", sideOf(g))),
        ...SX.map((g) => fx(CAM, zB.map((z): Vec3 => [g * (xin - BT), ys1 - 25, z]), [g, 0, 0], sideOf(g))),
      ],
      from: { S8: [-300, 0, 0], S9: [300, 0, 0] },
      pose: lie,
      tools: ["screwdriver"],
      warnings: ["floor"],
    },
    {
      title: "Slide in the cabinet back",
      detail: "Slide the back panel (7) down the grooves in the sides until it sits in the top.",
      add: ["K7"],
      from: { K7: [0, -450, 0] },
      pose: lie,
    },
    {
      title: "Screw on the cabinet bottom",
      detail: "Two dowels (A) into the end of each side, lay the bottom (10) on and drive two long screws (L) through it into each side.",
      add: ["C10"],
      fix: [
        ...SX.map((g) => fx(DOWEL, zD.map((z): Vec3 => [g * xsd, ys0, z]), [0, 1, 0], sideOf(g), "C10")),
        ...SX.map((g) => fx(SCREW, zB.map((z): Vec3 => [g * xsd, y10, z]), [0, 1, 0], "C10", sideOf(g))),
      ],
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Push in the door stops",
      detail: "Press a door stop (P) into the hole at the front of the bottom and one into the hole at the front of the top.",
      fix: [
        fx({ kind: "clip", len: 10, dia: 16, name: "Door stop" }, [[0, ys1, zfd - 12]], [0, 1, 0], "C6"),
        fx({ kind: "clip", len: 10, dia: 16, name: "Door stop" }, [[0, ys0, zfd - 12]], [0, -1, 0], "C10"),
      ],
      pose: lie,
    },
    {
      title: "Bolt the base rails onto the bottom",
      detail: "Lay the two base rails (3) along the front and back edges of the bottom and fix each with two bolts (M), using the Allen key (H).",
      add: ["R3B", "R3F"],
      fix: SX.map((sz) => fx(BOLT28, SX.map((k): Vec3 => [k * (xin - 60), yRail - P / 2, sz * zp]), [0, 1, 0], sz < 0 ? "R3B" : "R3F", "C10")),
      pose: lie,
      tools: ["allen"],
      warnings: ["loose"],
    },
    {
      title: "Fix a back rail to each shelf",
      detail: "For each of the three shelves (5): two thick dowels (Q) into the edge of a back rail (4), set it along the shelf's back edge and drive three long screws (L) up through the shelf into it.",
      fix: shelfY.flatMap((y, k) => [
        fx(DOWEL8, [-200, 200].map((x): Vec3 => [x, y + BT / 2, -D / 2 + BT / 2]), [0, 1, 0], backRails[k], shelves[k]),
        fx(SCREW, [-300, 0, 300].map((x): Vec3 => [x, y - BT / 2, -D / 2 + BT / 2]), [0, 1, 0], shelves[k], backRails[k]),
      ]),
      wait: [...shelves, ...backRails],
      from: offset([...shelves, ...backRails], [(W + 300) / 1.6, 0, 0]),
      pose: "+y",
      tools: ["screwdriver"],
      kind: "shelves",
    },
    {
      title: "Join the halves of each side frame",
      detail: "Push the posts of a lower frame (2) into the posts of an upper frame (1) and fix each joint with two bolts (N). Make the second side frame the same way.",
      fix: SX.flatMap((g) => SX.map((sz) => fx(BOLT12, [YJ + 15, YJ + 40].map((y): Vec3 => [(g * W) / 2, y, sz * zp]), [-g, 0, 0], frameOf(g, true), frameOf(g, false)))),
      wait: frames,
      from: frameOff,
      tools: ["allen"],
      warnings: ["loose"],
    },
    {
      title: "Bolt the frames to the shelves and the cabinet",
      detail: "Lay it all out on its back on a rug: the two side frames on their back edges, the three shelves (back rails down) and the cabinet between them. Two bolts (D) through the posts into each end of each shelf and of the cabinet top, and four bolts (O) through the lower posts into the base rails. Keep them loose for now.",
      add: ["F2L", "F1L", ...shelves, ...backRails, "F2R", "F1R"],
      fix: [
        ...SX.flatMap((g) => boards.map((b) => fx({ kind: "bolt", len: 48, dia: 7 }, SX.map((sz): Vec3 => [(g * W) / 2, b.y, sz * zp]), [-g, 0, 0], frameOf(g, b.up), b.id))),
        ...SX.flatMap((g) => SX.map((sz) => fx(BOLT40, [[(g * W) / 2, yRail, sz * zp]], [-g, 0, 0], frameOf(g, false), sz < 0 ? "R3B" : "R3F"))),
      ],
      from: { ...frameOff, ...offset([...shelves, ...backRails], [(W + 300) / 1.6, 0, 0]) },
      pose: "+z",
      tools: ["allen"],
      warnings: ["floor", "loose"],
    },
    {
      title: "Stand it up and hang the doors",
      detail: "Stand the bookcase up. Hold each door in place and screw its two hinge plates to the cabinet side with four small screws (E) each.",
      add: ["D11L", "D11R"],
      fix: doors.map((d) => fx(SMALL, hy.flatMap((y) => [-16, 16].flatMap((k) => [zfd - 20, zfd - 52].map((z): Vec3 => [d.g * (xin - BT), y + k, z]))), [d.g, 0, 0], d.on, d.id)),
      from: out(["D11L", "D11R"]),
      pose: "+y",
      tools: ["screwdriver"],
      kind: "doors",
    },
    {
      title: "Fit the brackets behind the cabinet back",
      detail: "Turn it round. A bracket (R) goes at each corner of the cabinet's back panel, each with a small screw (E).",
      fix: [
        ...SX.map((g) => fx(BRACKET, [ys0 + 15, ys1 - 15].map((y): Vec3 => [g * (xin - BT), y, -D / 2 + 4]), [g, 0, 0], sideOf(g))),
        ...SX.map((g) => fx(SMALL, [ys0 + 15, ys1 - 15].map((y): Vec3 => [g * (xin - BT), y, -D / 2 + 4]), [g, 0, 0], sideOf(g))),
      ],
      tools: ["screwdriver"],
    },
    {
      title: "Fix it to the wall",
      detail: "Fit a wall strap (I) to each back post just under the top shelf. Push the bookcase against the wall, mark through the straps, drill, push in the plugs (G) and screw each strap to the wall with a long screw (L). Check for pipes and cables first, then tighten every bolt.",
      fix: [
        ...SX.map((g) => fx({ ...STRAP, len: 70, dia: 16 }, [[g * (xin - 30), yW, -D / 2]], [0, 0, 1], frameOf(g, true), undefined, { twist: Math.PI / 2 })),
        fx(PLUG, SX.map((g): Vec3 => [g * (xin - 55), yW, -D / 2 - 30]), [0, 0, -1]),
        fx(WALL_SCREW, SX.map((g): Vec3 => [g * (xin - 55), yW, -D / 2 + 1.4]), [0, 0, -1], backRails[2]),
      ],
      tools: ["drill", "screwdriver", "pencil", "allen"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts: p.list, steps };
}

/* ---------- the desk ---------- */

/**
 * An 18 mm top over a box of two drawer bays: ends (3, 4) and a divider (5) between the top and a bottom panel (2),
 * closed at the back (13). Under the bottom panel hang a modesty panel (6) at the back and a tube rail (15) at the
 * front, between the two leg frames (14): rectangles of 25 mm tube under the box's ends, joined low at the back by
 * another rail (16). The fluted drawer fronts (7, 8) sit between the top and the bottom panel.
 */
function desk(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const TT = 18, DF = 18, DT = 12; // the top, the fluted fronts, drawer sides
  const yT = H - TT; // the top's underside
  const BH = 80; // the ends and the divider
  const y2 = yT - BH, yF = y2 - T; // the bottom panel's top face and underside (the leg frames' tops)
  const xe = W / 2 - T / 2, xi = W / 2 - T; // the ends' centres and inner faces
  const zF = D / 2 - DF; // the fronts' back faces
  const zK = -D / 2 + T; // the back panel's front face
  const xf = W / 2 - TB / 2, zp = D / 2 - TB / 2; // the leg frames and their posts
  const span = 2 * (xf - TB / 2); // between the leg frames
  const AH = 100; // the modesty panel
  const bay = xi - T / 2; // a drawer bay's width
  const cx = [-(T / 2 + bay / 2), T / 2 + bay / 2];
  const fw = (2 * xi - 9) / 2, fxs = [-(fw / 2 + 1.5), fw / 2 + 1.5]; // fronts, 3 mm apart
  const xs = bay / 2 - 12.5; // a drawer box's outer half width, clear of the runners
  const DD = 300, SH = 60; // drawer sides: depth (the 300 mm runners), height
  const yb = y2 + 6; // the drawer boxes' undersides
  const zk = zF - DD, zr = zF - DD / 2;
  const fyc = yT - BH / 2;

  const p = new Parts();
  p.add("T1", "1", "Desk top", [W, TT, D], [0, H - TT / 2, 0]);
  p.add("P3", "3", "Left end", [T, BH, D], [-xe, yT - BH / 2, 0]);
  p.add("P4", "4", "Right end", [T, BH, D], [xe, yT - BH / 2, 0]);
  p.add("P5", "5", "Divider", [T, BH, zF - zK], [0, yT - BH / 2, (zF + zK) / 2]);
  p.add("K13", "13", "Back panel", [2 * xi, BH, T], [0, yT - BH / 2, -D / 2 + T / 2]);
  p.add("B2", "2", "Bottom panel", [W, T, D], [0, y2 - T / 2, 0]);
  p.add("A6", "6", "Modesty panel", [span, AH, T], [0, yF - AH / 2, -zp]);
  p.add("R15", "15", "Front rail", [span, TB, TB], [0, yF - TB / 2, zp], "metal");
  const frame: PartPiece[] = [
    ...SX.map((sz): PartPiece => ({ shape: "box", size: [TB, yF, TB], pos: [0, 0, sz * zp] })),
    ...SX.map((sy): PartPiece => ({ shape: "box", size: [TB, TB, D - 2 * TB], pos: [0, sy * (yF / 2 - TB / 2), 0] })),
  ];
  p.add("F14L", "14", "Leg frame", [TB, yF, D], [-xf, yF / 2, 0], "metal", frame);
  p.add("F14R", "14", "Leg frame", [TB, yF, D], [xf, yF / 2, 0], "metal", frame);
  p.add("R16", "16", "Back rail", [span, TB, TB], [0, TB / 2, -zp], "metal");
  const dr = (k: number) => ({ f: k ? "F8" : "F7", l: `D9-${k}`, r: `D10-${k}`, bk: `D11-${k}`, bt: `D12-${k}` });
  for (const k of [0, 1]) {
    const d = dr(k);
    p.add(d.f, k ? "8" : "7", k ? "Right drawer front" : "Left drawer front", [fw, BH - 4, DF], [fxs[k], fyc, D / 2 - DF / 2]);
    p.add(d.l, "9", "Left drawer side", [DT, SH, DD], [cx[k] - (xs - DT / 2), yb + SH / 2, zr]);
    p.add(d.r, "10", "Right drawer side", [DT, SH, DD], [cx[k] + (xs - DT / 2), yb + SH / 2, zr]);
    p.add(d.bk, "11", "Drawer back", [2 * (xs - DT), SH, DT], [cx[k], yb + SH / 2, zk + DT / 2]);
    p.add(d.bt, "12", "Drawer bottom", [2 * (xs - DT) + 12, BK, DD - DT + 5], [cx[k], yb + 10, (zF - 1 + zk + DT - 6) / 2], "fiber");
  }

  // the three upright panels: where they stand, the face their cam locks go in, and three points along each
  const panels = [
    { id: "P3", x: -xe, face: -xi, dir: -1, zs: [-D / 2 + 60, 0, D / 2 - 60], zd: [-160, 160] },
    { id: "P5", x: 0, face: T / 2, dir: -1, zs: [zK + 60, (zF + zK) / 2, zF - 60], zd: [-120, 160] },
    { id: "P4", x: xe, face: xi, dir: 1, zs: [-D / 2 + 60, 0, D / 2 - 60], zd: [-160, 160] },
  ];
  const ycr = yb - 2;
  const cabRun = (x: number, g: number, on: string, name: string): CustomFix[] => [
    fx(runner(300, name), [[x, ycr, zr - 5]], [g, 0, 0], on),
    fx(SMALL, [-130, -50, 50, 130].map((dz): Vec3 => [x, ycr, zr - 5 + dz]), [g, 0, 0], on),
  ];
  const sideOf = (k: number, g: number) => (g < 0 ? dr(k).l : dr(k).r);
  const dys = [yb + 15, yb + SH - 15];
  const drawerIds = [0, 1].flatMap((k) => Object.values(dr(k)));
  const boxIds = [0, 1].flatMap((k) => [dr(k).l, dr(k).r, dr(k).bk, dr(k).bt]);
  const fronts = ["F7", "F8"];
  const lie = "-y" as const;
  const ax = [-Math.round(span * 0.35), 0, Math.round(span * 0.35)];

  const steps: CustomStep[] = [
    {
      title: "Turn the cam bolts into the top",
      detail: "Lay the top (1) face down on a rug and turn nine cam bolts (A) into its underside: three where each end goes and three down the middle for the divider.",
      fix: panels.map((q) => fx(CAM_BOLT, q.zs.map((z): Vec3 => [q.x, yT, z]), [0, 1, 0], "T1", q.id)),
      pose: lie,
      tools: ["screwdriver"],
      warnings: ["floor"],
    },
    {
      title: "Screw the runners onto the ends",
      detail: "Screw the left cabinet runner (CL) inside the left end (3) and the right one (CR) inside the right end (4), wheel to the front, four small screws (G) each.",
      fix: [...cabRun(-xi, -1, "P3", "Cabinet runner, left"), ...cabRun(xi, 1, "P4", "Cabinet runner, right")],
      wait: ["P3", "P4"],
      from: { P3: [-300, 0, 0], P4: [300, 0, 0] },
      pose: lie,
      tools: ["screwdriver"],
      kind: "runners",
    },
    {
      title: "Screw runners onto both faces of the divider",
      detail: "A left cabinet runner (CL) on one face of the divider (5) for the right bay, then turn it over and screw a right one (CR) on the other face for the left bay, four small screws (G) each.",
      fix: [...cabRun(-T / 2, 1, "P5", "Cabinet runner, right"), ...cabRun(T / 2, -1, "P5", "Cabinet runner, left")],
      wait: ["P5"],
      from: { P5: [0, 0, -500] },
      pose: lie,
      tools: ["screwdriver"],
      kind: "runners",
    },
    {
      title: "Stand the ends and the divider on the top",
      detail: "Two dowels (C) into the edge of each panel, stand the left end, the divider and the right end on the top's cam bolts, runner wheels to the front, and lock three cam locks (B) in each.",
      add: ["P3", "P5", "P4"],
      fix: [
        ...panels.map((q) => fx(DOWEL, q.zd.map((z): Vec3 => [q.x, yT, z]), [0, -1, 0], q.id, "T1")),
        ...panels.map((q) => fx(CAM, q.zs.map((z): Vec3 => [q.face, yT - 25, z]), [q.dir, 0, 0], q.id)),
      ],
      from: { P3: [-300, 0, 0], P4: [300, 0, 0], P5: [0, 0, -500] },
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Slide in the back panel",
      detail: "Drop the back panel (13) into the grooves at the back of the two ends, behind the divider.",
      add: ["K13"],
      from: { K13: [0, -400, 0] },
      pose: lie,
    },
    {
      title: "Screw on the bottom panel",
      detail: "Two dowels (C) into the edge of each upright panel, lay the bottom panel (2) on and drive nine long screws (D) through it: three into each end and three into the divider.",
      add: ["B2"],
      fix: [
        ...panels.map((q) => fx(DOWEL, q.zd.map((z): Vec3 => [q.x, y2, z]), [0, 1, 0], q.id, "B2")),
        ...panels.map((q) => fx(SCREW, q.zs.map((z): Vec3 => [q.x, yF, z]), [0, 1, 0], "B2", q.id)),
      ],
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Turn cam bolts into the bottom panel",
      detail: "Three cam bolts (A) into the bottom panel along its back edge, for the modesty panel.",
      fix: [fx(CAM_BOLT, ax.map((x): Vec3 => [x, yF, -zp]), [0, 1, 0], "B2", "A6")],
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Fit the modesty panel and the front rail",
      detail: "Two thick dowels (L) into the edge of the modesty panel (6), push it onto the cam bolts and lock its three cam locks (B). Lay the front rail (15) along the front edge and fix it with three bolts (I), using the Allen key (K).",
      add: ["A6", "R15"],
      fix: [
        fx(DOWEL8, [-260, 260].map((x): Vec3 => [x, yF, -zp]), [0, -1, 0], "A6", "B2"),
        fx(CAM, ax.map((x): Vec3 => [x, yF - 25, -zp + T / 2]), [0, 0, -1], "A6"),
        fx(BOLT28, ax.map((x): Vec3 => [x, yF - TB, zp]), [0, 1, 0], "R15", "B2"),
      ],
      from: { A6: [0, -300, 0], R15: [0, -300, 0] },
      pose: lie,
      tools: ["screwdriver", "allen"],
      warnings: ["loose"],
    },
    {
      title: "Bolt on the leg frames",
      detail: "Stand a leg frame (14) over each end, legs up, with the back rail (16) between their far ends. Two bolts (I) through each frame into the bottom panel, two long bolts (H) through the frames into the ends of the front rail and two into the back rail, and four connector bolts (J) through the back legs into the modesty panel. Keep them loose for now.",
      add: ["F14L", "F14R", "R16"],
      fix: [
        ...SX.map((g) => fx(BOLT28, SX.map((k): Vec3 => [g * xf, yF - TB, k * 150]), [0, 1, 0], g < 0 ? "F14L" : "F14R", "B2")),
        ...SX.map((g) => fx(BOLT40, [[(g * W) / 2, yF - TB / 2, zp]], [-g, 0, 0], g < 0 ? "F14L" : "F14R", "R15")),
        ...SX.map((g) => fx(BOLT40, [[(g * W) / 2, TB / 2, -zp]], [-g, 0, 0], g < 0 ? "F14L" : "F14R", "R16")),
        ...SX.map((g) => fx({ kind: "bolt", len: 50, dia: 7 }, [-25, 25].map((dy): Vec3 => [(g * W) / 2, yF - AH / 2 + dy, -zp]), [-g, 0, 0], g < 0 ? "F14L" : "F14R", "A6")),
      ],
      from: { F14L: [-300, 0, 0], F14R: [300, 0, 0], R16: [0, -400, 0] },
      pose: lie,
      tools: ["allen"],
      warnings: ["loose"],
    },
    {
      title: "Prepare the drawer fronts",
      detail: "Lay the fronts (7 and 8) face down. Four cam bolts (A) into the back of each, then a handle (E) on the top edge with two short screws (F).",
      fix: [0, 1].flatMap((k) => [
        ...SX.map((g) => fx(CAM_BOLT, dys.map((y): Vec3 => [cx[k] + g * (xs - DT / 2), y, zF]), [0, 0, 1], dr(k).f, sideOf(k, g))),
        fx(HANDLE, [[fxs[k], yT - 16, D / 2]], [0, 0, -1], dr(k).f),
        fx(SHORT, [-32, 32].map((x): Vec3 => [fxs[k] + x, yT - 16, zF]), [0, 0, 1], dr(k).f),
      ]),
      wait: fronts,
      from: out(fronts),
      pose: lie,
      tools: ["screwdriver"],
      kind: "drawer",
    },
    {
      title: "Screw the drawer boxes together",
      detail: "For each drawer: two long screws (D) through each side (9 and 10) into the back (11), then slide the bottom (12) down the grooves.",
      fix: [0, 1].flatMap((k) => SX.map((g) => fx(SCREW, dys.map((y): Vec3 => [cx[k] + g * xs, y, zk + DT / 2]), [-g, 0, 0], sideOf(k, g), dr(k).bk))),
      wait: boxIds,
      from: out(boxIds),
      pose: lie,
      tools: ["screwdriver"],
      kind: "drawer",
    },
    {
      title: "Fix the fronts onto the boxes",
      detail: "Push front 7 onto one box and front 8 onto the other, over the cam bolts, and lock four cam locks (B) in each.",
      fix: [0, 1].flatMap((k) => SX.map((g) => fx(CAM, dys.map((y): Vec3 => [cx[k] + g * (xs - DT), y, zF - 25]), [g, 0, 0], sideOf(k, g)))),
      pose: lie,
      tools: ["screwdriver"],
      kind: "drawer",
    },
    {
      title: "Screw the runners under the drawers",
      detail: "Turn each drawer over: a left drawer runner (DL) along the left side and a right one (DR) along the right, three small screws (G) each.",
      fix: [0, 1].flatMap((k) =>
        SX.flatMap((g) => [
          fx(runner(300, g < 0 ? "Drawer runner, left" : "Drawer runner, right"), [[cx[k] + g * (xs - DT / 2), yb, zr]], [0, 1, 0], sideOf(k, g)),
          fx(SMALL, [-120, -40, 110].map((dz): Vec3 => [cx[k] + g * (xs - DT / 2), yb, zr + dz]), [0, 1, 0], sideOf(k, g)),
        ]),
      ),
      pose: lie,
      tools: ["screwdriver"],
      kind: "runners",
    },
    {
      title: "Turn the desk over and slide the drawers in",
      detail: "Turn the desk onto its legs and tighten every bolt. Slide the drawer with front 7 into the left bay and the one with front 8 into the right, resting their runners on the ones in the desk.",
      add: drawerIds,
      from: out(drawerIds),
      pose: "+y",
      tools: ["allen"],
      kind: "drawer",
    },
  ];
  return { parts: p.list, steps };
}

const CHEST3 = { top: "1", left: "2", rail: "3", right: "4", back: "5", bottom: "6", front: "7", sideL: "8", sideR: "9", dBack: "10", dBottom: "11", brace: "12", legRail: "13", frame: "14", runR: "15", runL: "16" };
const BEDSIDE2 = { top: "1", left: "2", right: "3", back: "4", bottom: "5", front: "6", sideR: "7", sideL: "8", dBack: "9", dBottom: "10", frame: "11", legRail: "12", runR: "13", runL: "14" };

function recipe(s: ProductSpec): CustomParams | null {
  switch (s.slug) {
    case "kmart-isla-3-drawer-chest":
      return chest(s, { rows: 3, N: CHEST3, chest: true });
    case "kmart-isla-2-drawer-bedside-table":
      return chest(s, { rows: 2, N: BEDSIDE2, chest: false });
    case "kmart-isla-buffet-unit-with-adjustable-shelf":
      return buffet(s);
    case "kmart-isla-bookcase-storage":
      return bookcase(s);
    case "kmart-isla-desk":
      return desk(s);
    default:
      return null;
  }
}

const family: Family = { names: ["KMART:ISLA"], recipe };
export default family;
