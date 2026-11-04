import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's WHARF line, read from its assembly manuals: particle board on welded metal frames, bolted together
 * with an Allen key. Both manuals say to leave the bolts loose until the end and tighten them all at once.
 *
 * - 5 Tier Bookshelf (43635405): two ladder frames (3) with a rail under each shelf. Lying on its back, the five
 *   shelves (four 1 and the middle one 2, which has the wall holes) go between the frames, two bolts up through the
 *   rail into each shelf end, 20 in all, and a levelling foot into each post. Stood up, two angle brackets on the
 *   middle shelf hold it to the wall.
 * - Student Desk (43633050): upside down on its top (1), the back beam (4) goes on with three long bolts and the slim
 *   front bar (3) with three short ones; the two leg frames (2) bolt onto their ends, then down onto the top, the feet
 *   screw into the frames, and the cross brace (5) bolts across the back legs with screws and nuts.
 * - 6 Drawer Chest (43643431) and 4 Door Sideboard (43712120): particle board carcasses on cam locks and dowels, on
 *   welded frames; see their own notes further down.
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

/* ---------- 5 Tier Bookshelf ---------- */

const BOLT_A = { kind: "bolt", len: 30, dia: 6 } as const; // A
const WALL_B = { kind: "screw", len: 35, dia: 4, name: "Wall screw", included: true } as const; // B
const PLUG_C = { kind: "plug", len: 30, dia: 6, included: true } as const; // C
const BRACKET_D = { kind: "angle", len: 50, dia: 20, name: "Wall bracket" } as const; // D
const SCREW_E = { kind: "screw", len: 12, dia: 4, name: "Bracket screw" } as const; // E
const FOOT_F = { kind: "foot", len: 10, dia: 22, name: "Levelling foot" } as const; // F

function bookshelf(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const T = 16; // shelf board
  const P = 30; // square post
  const RAIL = 20; // the rail under each shelf
  const FOOT = 10;
  const over = 80; // each shelf reaches past the frames this much
  const xf = W / 2 - over - P / 2; // middle of a frame
  const zp = D / 2 - P / 2; // middle of a post
  const sd = D - 2 * P; // a shelf fits between the posts
  const levels = 5;
  const topY = H - 20; // the top shelf sits just under the post tops
  const gap = (topY - 110) / (levels - 1);
  const shelfTop = Array.from({ length: levels }, (_, i) => Math.round(110 + i * gap));

  // a side frame: front and back post, a rail under every shelf
  const fy = (FOOT + H) / 2;
  const frame: PartPiece[] = [
    ...[-1, 1].map((sz): PartPiece => ({ shape: "box", size: [P, H - FOOT, P], pos: [0, 0, sz * zp] })),
    ...shelfTop.map((y): PartPiece => ({ shape: "box", size: [P, RAIL, sd], pos: [0, y - T - RAIL / 2 - fy, 0] })),
  ];
  const parts: CustomPart[] = [
    { id: "L", label: "3", name: "Side frame", size: [P, H - FOOT, D], pos: [-xf, fy, 0], material: "metal", pieces: frame },
    { id: "R", label: "3", name: "Side frame", size: [P, H - FOOT, D], pos: [xf, fy, 0], material: "metal", pieces: frame },
  ];
  const mid = Math.floor(levels / 2);
  shelfTop.forEach((y, i) => parts.push({ id: `S${i}`, label: i === mid ? "2" : "1", name: i === mid ? "Middle shelf" : "Shelf", size: [W, T, sd], pos: [0, y - T / 2, 0], material: "board" }));
  const shelves = shelfTop.map((_, i) => `S${i}`);

  // two bolts up through the rail into each end of each shelf, near the front and back posts
  const bolts = (sx: -1 | 1, on: string) => shelfTop.map((y, i) => fx(BOLT_A, [-1, 1].map((sz): Vec3 => [sx * xf, y - T - RAIL, sz * (sd / 2 - 40)]), [0, 1, 0], on, `S${i}`));
  const feet = (sx: -1 | 1, on: string) => fx(FOOT_F, [-1, 1].map((sz): Vec3 => [sx * xf, FOOT, sz * zp]), [0, 1, 0], on);

  const y2 = shelfTop[mid];
  const bx = [-xf + 120, xf - 120].map(Math.round);
  const zw = -D / 2; // the wall, against the back posts
  const steps: CustomStep[] = [
    {
      title: "Bolt the shelves to one frame",
      detail: "Lay a frame on its back edge, on a rug. Rest the five shelves on its rails, the one with the extra holes in the middle, and turn two bolts up through the rail into each shelf. Keep them loose for now.",
      add: ["L", ...shelves],
      fix: bolts(-1, "L"),
      tools: ["allen"],
      pose: "+z",
      warnings: ["floor", "loose"],
    },
    {
      title: "Bolt on the other frame",
      detail: "Set the second frame against the other ends of the shelves and turn two bolts up through each rail, still loose.",
      add: ["R"],
      fix: bolts(1, "R"),
      tools: ["allen"],
      pose: "+z",
      warnings: ["loose"],
    },
    {
      title: "Screw in the levelling feet",
      detail: "Turn a foot into the bottom of each of the four posts by hand.",
      fix: [feet(-1, "L"), feet(1, "R")],
      pose: "+z",
    },
    {
      title: "Stand it up and tighten every bolt",
      detail: "Lift it upright, check it stands square, then go round and tighten all twenty bolts with the Allen key. Turn the feet to stop it rocking.",
      pose: "+y",
      tools: ["allen"],
      check: "square",
    },
    {
      title: "Fix it to the wall",
      detail: "Screw the two brackets onto the middle shelf at the back, upright legs against the wall. Mark, drill, push in the plugs and screw through the brackets. Check the wall for pipes and cables first.",
      fix: [
        fx(BRACKET_D, bx.map((x): Vec3 => [x, y2, zw + 25]), [0, -1, 0], `S${mid}`),
        fx(SCREW_E, bx.map((x): Vec3 => [x, y2, zw + 48]), [0, -1, 0], `S${mid}`),
        fx(PLUG_C, bx.map((x): Vec3 => [x, y2 + 30, zw - 30]), [0, 0, -1]),
        fx(WALL_B, bx.map((x): Vec3 => [x, y2 + 30, zw + 2]), [0, 0, -1], `S${mid}`),
      ],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

/* ---------- Student Desk ---------- */

const BOLT_SA = { kind: "bolt", len: 30, dia: 6 } as const; // A
const BOLT_LB = { kind: "bolt", len: 60, dia: 6 } as const; // B
const SCREW_C = { kind: "screw", len: 22, dia: 4, name: "Brace screw" } as const; // C
const NUT_D = { kind: "nut", len: 3, dia: 4 } as const; // D
const FOOT_E = { kind: "foot", len: 10, dia: 22, name: "Levelling foot" } as const; // E

function desk(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const T = 18; // top
  const TU = 25; // square tube
  const FOOT = 10;
  const yT = H - T; // underside of the top
  const xf = W / 2 - 30 - TU / 2; // middle of a leg frame
  const fd = D - 40; // depth of a leg frame
  const zp = fd / 2 - TU / 2; // middle of its posts
  const fh = yT - FOOT;
  const fy = FOOT + fh / 2;
  const legFrame: PartPiece[] = [
    ...[-1, 1].map((sz): PartPiece => ({ shape: "box", size: [TU, fh, TU], pos: [0, 0, sz * zp] })),
    ...[-1, 1].map((sy): PartPiece => ({ shape: "box", size: [TU, TU, fd - 2 * TU], pos: [0, sy * (fh / 2 - TU / 2), 0] })),
  ];
  const span = 2 * (xf - TU / 2); // between the frames
  const BH = 50; // back beam height
  const yb = [yT - BH, yT]; // the back beam
  const yBar = yT - 10; // the front bar, 20 high
  // the cross brace: two flat bars from each back post's top to the other's bottom
  const yHi = Math.round(FOOT + fh * 0.78), yLo = Math.round(FOOT + fh * 0.28);
  const bdx = 2 * xf, bdy = yHi - yLo, blen = Math.hypot(bdx, bdy), ang = Math.atan2(bdx, bdy);
  const zBr = -fd / 2 - 4;
  const brace: PartPiece[] = [
    { shape: "cyl", size: [8, blen, 8], pos: [0, 0, 0], rot: [0, 0, ang], material: "metal" },
    { shape: "cyl", size: [8, blen, 8], pos: [0, 0, 0], rot: [0, 0, -ang], material: "metal" },
  ];
  const parts: CustomPart[] = [
    { id: "T", label: "1", name: "Desk top", size: [W, T, D], pos: [0, yT + T / 2, 0], material: "board" },
    { id: "FL", label: "2", name: "Leg frame", size: [TU, fh, fd], pos: [-xf, fy, 0], material: "metal", pieces: legFrame },
    { id: "FR", label: "2", name: "Leg frame", size: [TU, fh, fd], pos: [xf, fy, 0], material: "metal", pieces: legFrame },
    { id: "BAR", label: "3", name: "Front bar", size: [span, 20, 20], pos: [0, yBar, zp], material: "metal" },
    { id: "BEAM", label: "4", name: "Back beam", size: [span, BH, TU], pos: [0, (yb[0] + yb[1]) / 2, -zp], material: "metal" },
    { id: "X", label: "5", name: "Cross brace", size: [bdx, bdy, 8], pos: [0, (yHi + yLo) / 2, zBr], material: "metal", pieces: brace },
  ];
  const xr = [-span / 3, 0, span / 3].map(Math.round);
  const ends = [-1, 1] as const;
  const steps: CustomStep[] = [
    {
      title: "Bolt the beam and the bar to the top",
      detail: "Lay the top face down on a rug. Put the deep back beam along one long edge and the slim front bar along the other, then turn three long bolts through the beam and three short ones through the bar into the top. Leave them loose.",
      add: ["T", "BEAM", "BAR"],
      fix: [fx(BOLT_LB, xr.map((x): Vec3 => [x, yb[0], -zp]), [0, 1, 0], "BEAM", "T"), fx(BOLT_SA, xr.map((x): Vec3 => [x, yBar - 10, zp]), [0, 1, 0], "BAR", "T")],
      tools: ["allen"],
      pose: "-y",
      warnings: ["floor", "loose"],
    },
    {
      title: "Bolt the leg frames onto the ends",
      detail: "Stand a frame at each end, its top rail on the top, and turn three long bolts through it: two into the end of the beam and one into the end of the bar.",
      add: ["FL", "FR"],
      fix: ends.flatMap((sx) => [
        fx(BOLT_LB, [yT - 13, yT - 38].map((y): Vec3 => [sx * (xf + TU / 2), y, -zp]), [-sx, 0, 0], sx < 0 ? "FL" : "FR", "BEAM"),
        fx(BOLT_LB, [[sx * (xf + TU / 2), yBar, zp]], [-sx, 0, 0], sx < 0 ? "FL" : "FR", "BAR"),
      ]),
      tools: ["allen"],
      pose: "-y",
      warnings: ["loose"],
    },
    {
      title: "Bolt the frames to the top and fit the feet",
      detail: "Turn two short bolts through each frame's top rail into the top, then screw a levelling foot into each corner of the frames by hand.",
      fix: [
        ...ends.map((sx) => fx(BOLT_SA, [-1, 1].map((sz): Vec3 => [sx * xf, yT - TU, sz * (zp - 90)]), [0, 1, 0], sx < 0 ? "FL" : "FR", "T")),
        ...ends.map((sx) => fx(FOOT_E, [-1, 1].map((sz): Vec3 => [sx * xf, FOOT, sz * zp]), [0, 1, 0], sx < 0 ? "FL" : "FR")),
      ],
      tools: ["allen"],
      pose: "-y",
    },
    {
      title: "Bolt the cross brace across the back legs",
      detail: "Hold the brace against the back legs, the ends of one bar high on one side and low on the other. Put a screw through each end and the leg and tighten a nut on it with the spanner.",
      add: ["X"],
      fix: [
        fx(SCREW_C, [-1, 1].flatMap((sx) => [yHi, yLo].map((y): Vec3 => [sx * xf, y, zBr - 4])), [0, 0, 1], "X"),
        ...ends.map((sx) => fx(NUT_D, [yHi, yLo].map((y): Vec3 => [sx * xf, y, -zp + TU / 2]), [0, 0, -1], sx < 0 ? "FL" : "FR")),
      ],
      tools: ["screwdriver", "wrench"],
      pose: "-y",
    },
    {
      title: "Turn it over and tighten everything",
      detail: "Turn the desk onto its feet, check it stands square, then tighten every bolt and screw. Turn the feet to stop it rocking.",
      pose: "+y",
      tools: ["allen", "wrench"],
      check: "square",
    },
  ];
  return { parts, steps };
}

/* ---------- 6 Drawer Chest ---------- */

const CH_CAM_BOLT = { kind: "camScrew", len: 28, dia: 6 } as const; // A
const CH_CAM = { kind: "cam", len: 10, dia: 15 } as const; // B
const CH_DOWEL = { kind: "dowel", len: 30, dia: 6 } as const; // C
const CH_SMALL = { kind: "screw", len: 12, dia: 4 } as const; // D
const CH_SCREW = { kind: "screw", len: 35, dia: 4 } as const; // E
const CH_LEG_BOLT = { kind: "bolt", len: 25, dia: 6 } as const; // F
const CH_HANDLE = { kind: "handle", len: 100, dia: 16, name: "Edge handle" } as const; // H
const CH_BRACKET = { kind: "clamp", len: 16, dia: 12, name: "Back panel bracket" } as const; // I
const CH_PLUG = { kind: "plug", len: 30, dia: 6, included: true } as const; // K
const CH_WALL = { kind: "angle", len: 28, dia: 28, name: "Wall bracket" } as const; // L
const CH_MID_BOLT = { kind: "bolt", len: 10, dia: 6 } as const; // M
const CH_DOUBLE = { kind: "camScrew", len: 67, dia: 6, name: "Double cam bolt" } as const; // N
const CH_LONG_DOWEL = { kind: "dowel", len: 50, dia: 6 } as const; // O
const CH_MID_FOOT = { kind: "foot", len: 10, dia: 22, name: "Middle leg foot" } as const; // P
const runnerDef = (name: string) => ({ kind: "runner", len: 300, dia: 30, name }) as const;

/**
 * 6 Drawer Chest (43643431). Two columns of three drawers in a carcass of 16 mm board on two welded leg frames and a
 * middle leg. Built lying on its right side:
 *
 * - runners go on both sides and both faces of the middle panel (16 on the left wall of each column, 15 on the right),
 *   cam bolts into the sides and the top (1).
 * - the right column's two front rails (3) and back rail (19) stand on the right side (4); double cam bolts and long
 *   dowels in their ends carry the middle panel (20), the left column's rails stand on that, and the left side (2) goes
 *   on top. The upper back panels (5) slide in from the top end and the top goes on with dowels and cam locks, two wall
 *   brackets under it; the lower back panels (22) slide in from the bottom end and the bottom (6) is screwed on.
 * - upside down, a leg frame (14) is bolted under each end, the middle leg (13) under the middle, and the feet screwed in.
 *   Standing, sixteen brackets hold the back panels.
 * - each drawer: the front (7 in the left column, 21 in the right) face down with five cam bolts, the sides (8 left,
 *   9 right) locked onto it, the bottom (11) slid in, the support (12) locked on and the back (10) screwed over them,
 *   then the runners (18 left, 17 right) and an edge handle (H) on the top edge of the front.
 *
 * Kmart's hardware list: 44 cam bolts (A), 52 cam locks (B), 16 dowels (C), 114 small screws (D, 4 x 12), 44 screws
 * (E, 4 x 35, two of them for the wall), 6 leg bolts (F), 4 levelling feet (G), 6 handles (H), 16 back panel brackets
 * (I), the Allen key (J), 2 wall plugs (K), 2 wall brackets (L), 2 bolts for the middle leg (M), 4 double cam bolts (N),
 * 2 long dowels (O) and the middle leg's foot (P). Every step's count box adds up to that list. The runners are parts
 * 15 to 18 in Kmart's parts list; the guide draws them as fittings, named for the side they go on.
 * The manual's step 14 does two jobs, the runners and the handles: the guide splits it in two, so 16 steps become 17.
 * The manual doesn't say which column takes which front; the guide puts the 7s on the left, as its exploded view does.
 */
function chest(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const T = 16, FT = 16;
  const LEG = 180; // the carcass stands this high on its legs
  const FOOT = 10;
  const LW = 50, LT = 25; // a leg frame's flat bar
  const xo = W / 2, xi = W / 2 - T;
  const ys0 = LEG + T, ys1 = H - T; // the sides and the middle panel stand between the bottom and the top
  const colW = xi - T / 2, colX = (sx: number) => sx * (T / 2 + colW / 2);
  const zB = -D / 2, zIn = D / 2 - FT; // the fronts sit in the openings, flush with the front
  const fh = (ys1 - ys0 - 10) / 3, fy0 = (i: number) => ys0 + 2 + i * (fh + 3);
  const yR3 = (i: number) => fy0(i) - 1.5, zR3 = zIn - 30; // front rails behind the gaps (i = 1, 2)
  const R19 = 70, y19 = (ys0 + ys1) / 2, z19 = zB + 2 + T / 2; // the back rail, half way up
  // drawers
  const bw = colW - 25, dh = 130, dd = 330;
  const dz0 = zIn - dd, dzc = (zIn + dz0) / 2;
  const boxY = (i: number) => fy0(i) + 14;
  const yRun = (i: number) => boxY(i) + 30, zRun = zIn - 8 - 150;
  const col = (sx: number) => (sx < 0 ? "L" : "R");
  const ups = [
    { id: "S2", x: -xo + T / 2 },
    { id: "P20", x: 0 },
    { id: "S4", x: xo - T / 2 },
  ];
  const rail3 = (sx: number, i: number) => `R3${col(sx)}${i}`;
  const rail19 = (sx: number) => `R19${col(sx)}`;

  const parts: CustomPart[] = [
    { id: "S4", label: "4", name: "Right side", size: [T, ys1 - ys0, D], pos: [xo - T / 2, (ys0 + ys1) / 2, 0] },
    { id: "S2", label: "2", name: "Left side", size: [T, ys1 - ys0, D], pos: [-xo + T / 2, (ys0 + ys1) / 2, 0] },
    { id: "P20", label: "20", name: "Middle panel", size: [T, ys1 - ys0, D], pos: [0, (ys0 + ys1) / 2, 0] },
    { id: "TOP", label: "1", name: "Top", size: [W, T, D], pos: [0, H - T / 2, 0] },
  ];
  for (const sx of [1, -1]) {
    parts.push(
      ...[1, 2].map((i): CustomPart => ({ id: rail3(sx, i), label: "3", name: "Front rail", size: [colW, T, 60], pos: [colX(sx), yR3(i), zR3] })),
      { id: rail19(sx), label: "19", name: "Back rail", size: [colW, R19, T], pos: [colX(sx), y19, z19] },
    );
  }
  for (const sx of SX)
    parts.push(
      { id: `K5${col(sx)}`, label: "5", name: "Upper back panel", size: [colW + 14, ys1 - (y19 + R19 / 2), 3], pos: [colX(sx), (ys1 + y19 + R19 / 2) / 2, z19], material: "fiber" },
      { id: `K22${col(sx)}`, label: "22", name: "Lower back panel", size: [colW + 14, y19 - R19 / 2 - ys0, 3], pos: [colX(sx), (ys0 + y19 - R19 / 2) / 2, z19], material: "fiber" },
    );
  parts.push({ id: "BOT", label: "6", name: "Bottom", size: [W, T, D], pos: [0, LEG + T / 2, 0] });
  // legs: a welded loop of flat bar under each end (a bar under the bottom, one on the floor, a post front and back)
  const Dl = D - 20, lh = LEG - FOOT, xl = W / 2 - 10 - LW / 2;
  const loop: PartPiece[] = [
    { shape: "box", size: [LW, LT, Dl], pos: [0, lh / 2 - LT / 2, 0] },
    { shape: "box", size: [LW, LT, Dl], pos: [0, -lh / 2 + LT / 2, 0] },
    ...[-1, 1].map((sz): PartPiece => ({ shape: "box", size: [LW, lh - 2 * LT, LT], pos: [0, 0, sz * (Dl / 2 - LT / 2)] })),
  ];
  const z13 = D / 2 - 80;
  parts.push(
    ...SX.map((sx): CustomPart => ({ id: `L14${col(sx)}`, label: "14", name: "Leg frame", size: [LW, lh, Dl], pos: [sx * xl, FOOT + lh / 2, 0], material: "metal", pieces: loop })),
    {
      id: "L13",
      label: "13",
      name: "Middle leg",
      size: [70, lh, 50],
      pos: [0, FOOT + lh / 2, z13],
      material: "metal",
      pieces: [
        { shape: "box", size: [30, lh - 4, 30], pos: [0, -2, 0] },
        { shape: "box", size: [70, 4, 50], pos: [0, lh / 2 - 2, 0] },
      ],
    },
  );
  const legs = ["L14L", "L14R", "L13"];
  // the drawers, three in each column, the bottom one first
  const dr = (sx: number, i: number) => {
    const c = col(sx);
    return { f: `F${c}${i}`, a: `A${c}${i}`, b: `B${c}${i}`, bt: `M${c}${i}`, st: `T${c}${i}`, bk: `K${c}${i}` };
  };
  const dx = (sx: number, k: -1 | 1) => colX(sx) + k * (bw / 2 - T / 2);
  for (const sx of SX)
    for (let i = 0; i < 3; i++) {
      const k = dr(sx, i), y0 = boxY(i), yc = y0 + dh / 2;
      parts.push(
        sx < 0
          ? { id: k.f, label: "7", name: "Left drawer front", size: [colW - 4, fh, FT], pos: [colX(sx), fy0(i) + fh / 2, D / 2 - FT / 2] }
          : { id: k.f, label: "21", name: "Right drawer front", size: [colW - 4, fh, FT], pos: [colX(sx), fy0(i) + fh / 2, D / 2 - FT / 2] },
        { id: k.a, label: "8", name: "Left drawer side", size: [T, dh, dd], pos: [dx(sx, -1), yc, dzc] },
        { id: k.b, label: "9", name: "Right drawer side", size: [T, dh, dd], pos: [dx(sx, 1), yc, dzc] },
        { id: k.bt, label: "11", name: "Drawer bottom", size: [bw - 2 * T + 16, 3, dd - 10], pos: [colX(sx), y0 + T + 1.5, dzc + 5], material: "fiber" },
        { id: k.st, label: "12", name: "Drawer support", size: [60, T, dd], pos: [colX(sx), y0 + T / 2, dzc] },
        { id: k.bk, label: "10", name: "Drawer back", size: [bw, dh, T], pos: [colX(sx), yc, dz0 - T / 2] },
      );
    }
  const all6 = SX.flatMap((sx) => [0, 1, 2].map((i) => dr(sx, i)));
  const OUT = 520;
  const outFrom = (list: string[], v: Vec3 = [0, 0, OUT]) => Object.fromEntries(list.map((id) => [id, v]));

  /* ---- fittings ---- */
  // cabinet runners: 16 on the left wall of each column, 15 on the right; the middle panel's right face a little back,
  // so its runners and screws stay clear of the left face's
  const walls = [
    { on: "S2", x: -xi, dir: [-1, 0, 0] as Vec3, left: true, dz: 0 },
    { on: "P20", x: -T / 2, dir: [1, 0, 0] as Vec3, left: false, dz: 0 },
    { on: "P20", x: T / 2, dir: [-1, 0, 0] as Vec3, left: true, dz: 24 },
    { on: "S4", x: xi, dir: [1, 0, 0] as Vec3, left: false, dz: 0 },
  ];
  const runners = walls.map((w) => fx(runnerDef(w.left ? "Cabinet runner, left" : "Cabinet runner, right"), [0, 1, 2].map((i): Vec3 => [w.x, yRun(i), zRun + w.dz]), w.dir, w.on));
  const runScrews = walls.map((w) => fx(CH_SMALL, [0, 1, 2].flatMap((i) => [-120, -40, 40, 120].map((z): Vec3 => [w.x, yRun(i), zRun + w.dz + z])), w.dir, w.on));
  // the rails' joints: a front rail takes a cam bolt and a dowel at each end, the back rail two cam bolts
  const y3Bolt = zR3 + 15, z3Dowel = zR3 - 17;
  const sideBolts = (sx: number) =>
    fx(CH_CAM_BOLT, [...[1, 2].map((i): Vec3 => [sx * xi, yR3(i), y3Bolt]), ...[-15, 15].map((k): Vec3 => [sx * xi, y19 + k, z19])], [sx, 0, 0], sx < 0 ? "S2" : "S4");
  const railCams = (sx: number, x: number) => [
    ...[1, 2].map((i) => fx(CH_CAM, [[x, yR3(i) + T / 2, y3Bolt]], [0, -1, 0], rail3(sx, i))),
    fx(CH_CAM, [-15, 15].map((k): Vec3 => [x, y19 + k, z19 + T / 2]), [0, 0, -1], rail19(sx)),
  ];
  const railDowels = (sx: number, x: number, into: number, mate: string) => [1, 2].map((i) => fx(CH_DOWEL, [[x, yR3(i), z3Dowel]], [into, 0, 0], rail3(sx, i), mate));
  const zTB = [-130, 130], zTD = [-80, 80];
  const camFace = (id: string): { x: number; dir: Vec3 } => (id === "S2" ? { x: -xi, dir: [-1, 0, 0] } : id === "S4" ? { x: xi, dir: [1, 0, 0] } : { x: -T / 2, dir: [1, 0, 0] });
  const xBr = [-300, 300];
  // back panel brackets at the corners of the four back panels, on the sides and the middle panel
  const yI = [ys1 - 20, y19 + R19 / 2 + 20, y19 - R19 / 2 - 20, ys0 + 20];
  const yIr = [ys1 - 50, y19 + R19 / 2 + 50, y19 - R19 / 2 - 50, ys0 + 50]; // the middle panel's right face, clear of its left
  const bracketWalls = [
    { on: "S2", x: -xi, dir: [-1, 0, 0] as Vec3, ys: yI },
    { on: "P20", x: -T / 2, dir: [1, 0, 0] as Vec3, ys: yI },
    { on: "P20", x: T / 2, dir: [-1, 0, 0] as Vec3, ys: yIr },
    { on: "S4", x: xi, dir: [1, 0, 0] as Vec3, ys: yI },
  ];
  // the drawers
  const dys = (i: number) => [boxY(i) + dh / 2 - 40, boxY(i) + dh / 2 + 40];
  const ySup = (i: number) => boxY(i) + T / 2;
  const frontFix = (sx: number, i: number) => {
    const k = dr(sx, i), xa = dx(sx, -1), xb = dx(sx, 1);
    return [
      fx(CH_CAM_BOLT, [...[xa, xb].flatMap((x) => dys(i).map((y): Vec3 => [x, y, zIn])), [colX(sx), ySup(i), zIn]], [0, 0, 1], k.f),
      fx(CH_CAM, dys(i).map((y): Vec3 => [xa + T / 2, y, zIn - 25]), [-1, 0, 0], k.a),
      fx(CH_CAM, dys(i).map((y): Vec3 => [xb - T / 2, y, zIn - 25]), [1, 0, 0], k.b),
    ];
  };
  const backFix = (sx: number, i: number) => {
    const k = dr(sx, i), xa = dx(sx, -1), xb = dx(sx, 1), xc = colX(sx);
    return [
      fx(CH_CAM, [[xc, boxY(i), zIn - 25]], [0, 1, 0], k.st),
      fx(CH_SCREW, [...[xa, xb].flatMap((x) => dys(i).map((y): Vec3 => [x, y, dz0 - T])), [xc - 15, ySup(i), dz0 - T], [xc + 15, ySup(i), dz0 - T]], [0, 0, 1], k.bk),
    ];
  };
  // drawer runners along the bottom of the sides, below the cabinet runners' line
  const runFix = (sx: number, i: number) => {
    const k = dr(sx, i), xa = dx(sx, -1) - T / 2, xb = dx(sx, 1) + T / 2, y = boxY(i) + 6;
    return [
      fx(runnerDef("Drawer runner, left"), [[xa, y, zRun]], [1, 0, 0], k.a),
      fx(runnerDef("Drawer runner, right"), [[xb, y, zRun]], [-1, 0, 0], k.b),
      fx(CH_SMALL, [-110, 40, 110].map((z): Vec3 => [xa, y, zRun + z]), [1, 0, 0], k.a),
      fx(CH_SMALL, [-110, 40, 110].map((z): Vec3 => [xb, y, zRun + z]), [-1, 0, 0], k.b),
    ];
  };
  const handleFix = (sx: number, i: number) => {
    const k = dr(sx, i), y = fy0(i) + fh - 6;
    return [fx(CH_HANDLE, [[colX(sx), y, D / 2]], [0, 0, -1], k.f), fx(CH_SMALL, [-30, 30].map((x): Vec3 => [colX(sx) + x, y, zIn]), [0, 0, 1], k.f)];
  };
  const drawers = (pick: (k: ReturnType<typeof dr>) => string[]) => all6.flatMap(pick);

  const lie = "-x" as const;
  const steps: CustomStep[] = [
    {
      title: "Screw the runners onto the sides and the middle panel",
      detail: "Lay the two sides (2, 4) and the middle panel (20) flat on a rug. Three runners on each side and on each face of the middle panel, wheel end to the front, four small screws (D) each: the 16s on the left side and the panel's right face, the 15s on the right side and the panel's left face.",
      add: ["S4"],
      fix: [...runners, ...runScrews],
      wait: ["S2", "P20"],
      from: outFrom(["S2", "P20"]),
      pose: lie,
      warnings: ["floor"],
    },
    {
      title: "Turn the cam bolts into the sides and the top",
      detail: "Four cam bolts (A) into the inside of each side, for the rails, and six into the top (1), two where each side and the middle panel will meet it.",
      fix: [sideBolts(-1), sideBolts(1), ...ups.map((u) => fx(CH_CAM_BOLT, zTB.map((z): Vec3 => [u.x, ys1, z]), [0, 1, 0], "TOP", u.id))],
      wait: ["TOP"],
      from: { TOP: [0, 0, OUT] },
      pose: lie,
    },
    {
      title: "Stand the right column's rails on the right side",
      detail: "With the right side (4) on the rug, push a dowel (C) into the end of each front rail (3), stand the two front rails and the back rail (19) on the side and turn their four cam locks (B).",
      add: [rail3(1, 1), rail3(1, 2), rail19(1)],
      fix: [...railDowels(1, xi, -1, "S4"), ...railCams(1, xi - 25)],
      pose: lie,
    },
    {
      title: "Fit the middle panel",
      detail: "Push the four double cam bolts (N) and the two long dowels (O) into the free ends of the rails, lower the middle panel (20) over them, runners the right way, and turn a cam lock (B) in each rail end below it.",
      add: ["P20"],
      fix: [
        ...[1, 2].map((i) => fx(CH_DOUBLE, [[T / 2, yR3(i), y3Bolt]], [1, 0, 0], rail3(1, i), "P20")),
        fx(CH_DOUBLE, [-15, 15].map((k): Vec3 => [T / 2, y19 + k, z19]), [1, 0, 0], rail19(1), "P20"),
        ...[1, 2].map((i) => fx(CH_LONG_DOWEL, [[T / 2, yR3(i), z3Dowel]], [1, 0, 0], rail3(1, i), "P20")),
        ...railCams(1, T / 2 + 25),
      ],
      from: { P20: [-300, 0, 0] },
      pose: lie,
    },
    {
      title: "Fit the left column's rails and the left side",
      detail: "Stand the other two front rails (3) and back rail (19) on the double cam bolts and turn their four cam locks (B). A dowel (C) into the top end of each front rail, then lower the left side (2) on and turn the last four locks.",
      add: [rail3(-1, 1), rail3(-1, 2), rail19(-1), "S2"],
      fix: [...railCams(-1, -T / 2 - 25), ...railDowels(-1, -xi, 1, "S2"), ...railCams(-1, -xi + 25)],
      from: { ...outFrom([rail3(-1, 1), rail3(-1, 2), rail19(-1)], [-300, 0, 0]), S2: [-300, 0, 0] },
      pose: lie,
      check: "square",
    },
    { title: "Slide in the upper back panels", detail: "The two upper back panels (5) go in from the top end, down the grooves until they meet the back rails.", add: ["K5L", "K5R"], from: outFrom(["K5L", "K5R"], [0, 300, 0]), pose: lie },
    {
      title: "Fix the top",
      detail: "Six dowels (C) into the top ends of the sides and the middle panel. Push the top (1) on and turn the six cam locks (B), then screw the two wall brackets (L) under its back edge, a small screw (D) each.",
      add: ["TOP"],
      fix: [
        ...ups.map((u) => fx(CH_DOWEL, zTD.map((z): Vec3 => [u.x, ys1, z]), [0, -1, 0], u.id, "TOP")),
        ...ups.map((u) => fx(CH_CAM, zTB.map((z): Vec3 => [camFace(u.id).x, ys1 - 25, z]), camFace(u.id).dir, u.id)),
        fx(CH_WALL, xBr.map((x): Vec3 => [x, ys1, zB + 14]), [0, 1, 0], "TOP"),
        fx(CH_SMALL, xBr.map((x): Vec3 => [x, ys1, zB + 50]), [0, 1, 0], "TOP"),
      ],
      from: { TOP: [0, 300, 0] },
      pose: lie,
    },
    { title: "Slide in the lower back panels", detail: "The two lower back panels (22) go in from the bottom end until they meet the back rails.", add: ["K22L", "K22R"], from: outFrom(["K22L", "K22R"], [0, -300, 0]), pose: lie },
    {
      title: "Screw on the bottom",
      detail: "Six dowels (C) into the bottom ends of the sides and the middle panel. Press the bottom (6) on and drive six screws (E) through it, two into each.",
      add: ["BOT"],
      fix: [...ups.map((u) => fx(CH_DOWEL, zTD.map((z): Vec3 => [u.x, ys0, z]), [0, 1, 0], u.id, "BOT")), ...ups.map((u) => fx(CH_SCREW, zTB.map((z): Vec3 => [u.x, LEG, z]), [0, 1, 0], "BOT", u.id))],
      from: { BOT: [0, -300, 0] },
      pose: lie,
    },
    {
      title: "Bolt on the legs",
      detail: "Turn the chest upside down on a rug. Bolt a leg frame (14) under each end with three bolts (F) and the Allen key (J), and the middle leg (13) under the middle of the front with two short bolts (M). Screw in the levelling feet: two in each frame (G), one in the middle leg (P).",
      add: legs,
      fix: [
        ...SX.map((sx) => fx(CH_LEG_BOLT, [-120, 0, 120].map((z): Vec3 => [sx * xl, LEG - LT, z]), [0, 1, 0], `L14${col(sx)}`, "BOT")),
        ...SX.map((sx) => fx(FOOT_F, [-1, 1].map((sz): Vec3 => [sx * xl, FOOT, sz * (Dl / 2 - 30)]), [0, 1, 0], `L14${col(sx)}`)),
        fx(CH_MID_BOLT, [-22, 22].map((x): Vec3 => [x, LEG - 4, z13]), [0, 1, 0], "L13", "BOT"),
        fx(CH_MID_FOOT, [[0, FOOT, z13]], [0, 1, 0], "L13"),
      ],
      from: outFrom(legs, [0, -300, 0]),
      tools: ["allen"],
      pose: "-y",
      warnings: ["floor"],
    },
    {
      title: "Fit the back panel brackets",
      detail: "Stand it on its legs. Sixteen brackets (I) hold the four back panels at their corners, each with a small screw (D) into the side or the middle panel.",
      fix: [...bracketWalls.map((b) => fx(CH_BRACKET, b.ys.map((y): Vec3 => [b.x, y, zB + 4]), b.dir, b.on)), ...bracketWalls.map((b) => fx(CH_SMALL, b.ys.map((y): Vec3 => [b.x, y, zB + 4]), b.dir, b.on))],
      pose: "+y",
    },
    {
      title: "Lock the sides onto the drawer fronts",
      detail: "For each of the six drawers: lay the front face down (7 for the left column, 21 for the right) and turn in its five cam bolts (A). Stand the sides on it, 8 on the left and 9 on the right, turn their four cam locks (B) and slide the bottom (11) down their grooves.",
      fix: all6.flatMap((_, n) => frontFix(n < 3 ? -1 : 1, n % 3)),
      wait: drawers((k) => [k.f, k.a, k.b, k.bt]),
      from: outFrom(drawers((k) => [k.f, k.a, k.b, k.bt])),
      repeat: 6,
    },
    {
      title: "Fit the supports and the backs",
      detail: "Stand the support (12) under the middle of the bottom on the front's fifth bolt and turn its cam lock (B). Lay the back (10) on and drive six screws (E) through it: two into each side, two into the support.",
      fix: all6.flatMap((_, n) => backFix(n < 3 ? -1 : 1, n % 3)),
      wait: drawers((k) => [k.st, k.bk]),
      from: outFrom(drawers((k) => [k.st, k.bk])),
      repeat: 6,
    },
    {
      title: "Screw the runners onto the drawers",
      detail: "A runner along the bottom of each side, three small screws (D) each: 18 on the left side (8), 17 on the right (9).",
      fix: all6.flatMap((_, n) => runFix(n < 3 ? -1 : 1, n % 3)),
      repeat: 6,
    },
    {
      title: "Screw on the handles",
      detail: "An edge handle (H) on the top edge of each front, two small screws (D) each.",
      fix: all6.flatMap((_, n) => handleFix(n < 3 ? -1 : 1, n % 3)),
      repeat: 6,
    },
    {
      title: "Slide the drawers in",
      detail: "The 7 fronts in the left column, the 21 fronts in the right. Rest each drawer's runners on the ones in the chest and push it home.",
      add: SX.flatMap((sx) => [2, 1, 0].flatMap((i) => Object.values(dr(sx, i)))),
      from: outFrom(
        all6.flatMap((k) => Object.values(k)),
        [0, 0, 420],
      ),
    },
    {
      title: "Fix it to the wall",
      detail: "Mark through the two wall brackets, drill and push in the wall plugs (K), then screw the brackets to the wall with two screws (E). Check the wall for pipes and cables first.",
      fix: [fx(CH_PLUG, xBr.map((x): Vec3 => [x, ys1 - 14, zB - 1]), [0, 0, -1]), fx(CH_SCREW, xBr.map((x): Vec3 => [x, ys1 - 14, zB + 32]), [0, 0, -1])],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

/* ---------- 4 Door Sideboard ---------- */

const SB_CAM_BOLT = { kind: "camScrew", len: 35, dia: 6 } as const; // A
const SB_CAM = { kind: "cam", len: 10, dia: 15 } as const; // B
const SB_DOWEL = { kind: "dowel", len: 30, dia: 6 } as const; // C
const SB_SMALL = { kind: "screw", len: 12, dia: 4 } as const; // D
const SB_SCREW = { kind: "screw", len: 35, dia: 4 } as const; // E
const SB_LONG_BOLT = { kind: "bolt", len: 60, dia: 6 } as const; // G
const SB_BOLT = { kind: "bolt", len: 30, dia: 6 } as const; // H
const SB_SUPPORT = { kind: "pin", len: 16, dia: 5, name: "Shelf support" } as const; // I
const SB_CRANKED = { kind: "hinge", len: 50, dia: 35, name: "Cranked hinge" } as const; // J
const SB_BRACKET = { kind: "clamp", len: 16, dia: 12, name: "Back panel bracket" } as const; // K
const SB_PLUG = { kind: "plug", len: 30, dia: 6, included: true } as const; // L
const SB_WALL = { kind: "angle", len: 28, dia: 28, name: "Wall bracket" } as const; // M
const SB_TOP_BOLT = { kind: "bolt", len: 40, dia: 5 } as const; // N
const SB_WASHER = { kind: "washer", len: 1.5, dia: 12 } as const; // O
const SB_HINGE = { kind: "hinge", len: 50, dia: 35, name: "Hinge" } as const; // P

/**
 * 4 Door Sideboard (43712120). A cabinet of three bays (one door at each end, two in the middle) held up in two welded
 * loops of square tube that wrap round it at the partitions, with a floating top (14) on the loops:
 *
 * - cam bolts go into the four uprights (sides 2 and 5, partitions 3 and 4) and the cabinet's top (1); an end shelf (16)
 *   is locked between each side and its partition, and the two pairs stand upside down on the top. The backs (7, 15, 7)
 *   slide down their grooves and the bottom (6) is screwed on.
 * - on its front, the right frame (11) slides on over the right end and is bolted to the bottom through its inner bar;
 *   two rails (12) are bolted to it with long bolts, the left frame (10) slides on and takes the rails' other ends, and
 *   the rails are bolted up into the bottom. The feet go into the frames' lower bars. The floating top is bolted onto the
 *   frames' top bars, each frame is bolted through its back post into the back edge of the cabinet's top, and two wall
 *   brackets go under the floating top.
 * - standing, the middle shelf (9) sits on four supports; the end doors (8, 13) hang on straight hinges (P) on the sides
 *   and the middle ones (17, 18) on cranked hinges (J) on the partitions; brackets hold the backs.
 *
 * Kmart's hardware list: 16 cam bolts (A), 16 cam locks (B), 24 dowels (C), 60 small screws (D, 4 x 12), 10 screws
 * (E, 4 x 35, two of them for the wall), 4 levelling feet (F), 4 long bolts (G, 6 x 60), 16 bolts (H, 6 x 30), 4 shelf
 * supports (I), 4 cranked hinges (J), 8 back panel brackets (K), 2 wall plugs (L), 2 wall brackets (M), 4 bolts (N,
 * 5 x 40) with 4 washers (O), 4 hinges (P) and two Allen keys (Q, R). The steps use 58 of the 60 small screws (2 + 16 +
 * 32 + 8): the guide follows the steps. Every other count box adds up to the list.
 * The loops' front posts stand in front of the partitions, between the doors; the depth Kmart lists takes them in.
 */
function sideboard(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const T = 16, FT = 16;
  const P = 30; // the frames' square tube
  const TT = 25; // the floating top
  const FOOT = 10;
  const yC0 = 120, yC1 = 620; // the cabinet, held up in the frames
  const zB = -D / 2 + P, zF = D / 2 - P; // between the frames' back and front posts
  const Dc = zF - zB;
  const xs = W / 2 - T / 2, xi = W / 2 - T;
  const xp = (W / 2 - T) / 2; // the partitions, where the frames go
  const ys0 = yC0 + T, ys1 = yC1 - T, yS = (ys0 + ys1) / 2;
  const endW = xi - (xp + T / 2), endX = (xi + xp + T / 2) / 2; // an end bay
  const midW = 2 * (xp - T / 2);
  const ups = [
    { id: "S2", x: -xs },
    { id: "P3", x: -xp },
    { id: "P4", x: xp },
    { id: "S5", x: xs },
  ];
  const parts: CustomPart[] = [
    { id: "T1", label: "1", name: "Cabinet top", size: [W, T, Dc], pos: [0, yC1 - T / 2, 0] },
    { id: "S2", label: "2", name: "Left side", size: [T, ys1 - ys0, Dc], pos: [-xs, (ys0 + ys1) / 2, 0] },
    { id: "P3", label: "3", name: "Left partition", size: [T, ys1 - ys0, Dc], pos: [-xp, (ys0 + ys1) / 2, 0] },
    { id: "SH16L", label: "16", name: "End shelf", size: [endW, T, Dc - 12], pos: [-endX, yS, 6] }, // in front of the back
    { id: "P4", label: "4", name: "Right partition", size: [T, ys1 - ys0, Dc], pos: [xp, (ys0 + ys1) / 2, 0] },
    { id: "S5", label: "5", name: "Right side", size: [T, ys1 - ys0, Dc], pos: [xs, (ys0 + ys1) / 2, 0] },
    { id: "SH16R", label: "16", name: "End shelf", size: [endW, T, Dc - 12], pos: [endX, yS, 6] }, // in front of the back
    ...[-1, 1].map((sx): CustomPart => ({ id: sx < 0 ? "K7L" : "K7R", label: "7", name: "End back panel", size: [endW + 14, ys1 - ys0, 3], pos: [sx * endX, (ys0 + ys1) / 2, zB + 10], material: "fiber" })),
    { id: "K15", label: "15", name: "Middle back panel", size: [midW + 14, ys1 - ys0, 3], pos: [0, (ys0 + ys1) / 2, zB + 10], material: "fiber" },
    { id: "B6", label: "6", name: "Bottom", size: [W, T, Dc], pos: [0, yC0 + T / 2, 0] },
  ];
  // a frame: posts front and back, a bar along the top and one on the floor, and an inner bar the bottom rests on
  const fy0 = FOOT, fy1 = H - TT, fh = fy1 - fy0, fyc = (fy0 + fy1) / 2;
  const yLedge = yC0 - P / 2;
  const loop: PartPiece[] = [
    ...[-1, 1].map((sz): PartPiece => ({ shape: "box", size: [P, fh, P], pos: [0, 0, sz * (D / 2 - P / 2)] })),
    ...[fy1 - P / 2, fy0 + P / 2, yLedge].map((y): PartPiece => ({ shape: "box", size: [P, P, D - 2 * P], pos: [0, y - fyc, 0] })),
  ];
  const frame = (sx: number) => (sx < 0 ? "F10" : "F11");
  const zr = Dc / 2 - 40; // the rails under the bottom, front and back
  const rail = (k: number) => (k < 0 ? "R12B" : "R12F");
  parts.push(
    { id: "F11", label: "11", name: "Right frame", size: [P, fh, D], pos: [xp, fyc, 0], material: "metal", pieces: loop },
    ...[1, -1].map((k): CustomPart => ({ id: rail(k), label: "12", name: "Rail", size: [2 * xp - P, 20, 20], pos: [0, yC0 - 10, k * zr], material: "metal" })),
    { id: "F10", label: "10", name: "Left frame", size: [P, fh, D], pos: [-xp, fyc, 0], material: "metal", pieces: loop },
    { id: "T14", label: "14", name: "Top", size: [W, TT, D], pos: [0, H - TT / 2, 0] },
    { id: "SH9", label: "9", name: "Middle shelf", size: [midW - 2, T, Dc - 40], pos: [0, yS, 0] },
  );
  // doors over the front, the end doors to the posts, the middle ones from the posts to the middle
  const dy0 = yC0 + 2, dy1 = yC1 - 2, dyc = (dy0 + dy1) / 2;
  const doors = [
    { id: "D8", label: "8", name: "Left door", x0: -W / 2, x1: -xp - P / 2 - 2, edge: -W / 2, g: 1, def: SB_HINGE, face: -xi, fdir: [-1, 0, 0] as Vec3, on: "S2" },
    { id: "D17", label: "17", name: "Middle left door", x0: -xp + P / 2 + 2, x1: -1.5, edge: -xp + P / 2 + 2, g: 1, def: SB_CRANKED, face: -xp + T / 2, fdir: [-1, 0, 0] as Vec3, on: "P3" },
    { id: "D18", label: "18", name: "Middle right door", x0: 1.5, x1: xp - P / 2 - 2, edge: xp - P / 2 - 2, g: -1, def: SB_CRANKED, face: xp - T / 2, fdir: [1, 0, 0] as Vec3, on: "P4" },
    { id: "D13", label: "13", name: "Right door", x0: xp + P / 2 + 2, x1: W / 2, edge: W / 2, g: -1, def: SB_HINGE, face: xi, fdir: [1, 0, 0] as Vec3, on: "S5" },
  ];
  for (const d of doors) parts.push({ id: d.id, label: d.label, name: d.name, size: [d.x1 - d.x0, dy1 - dy0, FT], pos: [(d.x0 + d.x1) / 2, dyc, zF + FT / 2] });
  const doorIds = doors.map((d) => d.id);
  const OUT = 520;
  const outFrom = (list: string[], v: Vec3 = [0, 0, OUT]) => Object.fromEntries(list.map((id) => [id, v]));

  /* ---- fittings ---- */
  const zA = [-120, 120], zC = [-60, 60];
  // the end shelves' joints: two cam bolts in the face of the side or partition, two dowels in the shelf's end
  const shelfFaces = [
    { up: "S2", sh: "SH16L", x: -xi, dir: [-1, 0, 0] as Vec3 },
    { up: "P3", sh: "SH16L", x: -xp - T / 2, dir: [1, 0, 0] as Vec3 },
    { up: "P4", sh: "SH16R", x: xp + T / 2, dir: [-1, 0, 0] as Vec3 },
    { up: "S5", sh: "SH16R", x: xi, dir: [1, 0, 0] as Vec3 },
  ];
  const camFace = shelfFaces.map((f) => ({ id: f.up, x: f.x, dir: f.dir }));
  const yBack = [ys1 - 20, ys0 + 20];
  const backBrackets = [
    { on: "S2", x: -xi, dir: [-1, 0, 0] as Vec3 },
    { on: "P3", x: -xp + T / 2, dir: [-1, 0, 0] as Vec3 },
    { on: "P4", x: xp - T / 2, dir: [1, 0, 0] as Vec3 },
    { on: "S5", x: xi, dir: [1, 0, 0] as Vec3 },
  ];
  const hy = [dy0 + 80, dy1 - 80];
  const xM = [-250, 250];
  const zH = [-110, 0, 110];
  const flip = "-y" as const, front = "-z" as const;
  const uprights = ["S2", "P3", "P4", "S5"];
  const steps: CustomStep[] = [
    {
      title: "Turn the cam bolts into the panels and the top",
      detail: "Two cam bolts (A) into each side (2, 5) and partition (3, 4) for the end shelves. Lay the cabinet's top (1) face down on a rug and turn in its eight, two where each of those four panels will stand.",
      add: ["T1"],
      fix: [
        ...shelfFaces.map((f) => fx(SB_CAM_BOLT, zA.map((z): Vec3 => [f.x, yS, z]), f.dir, f.up, f.sh)),
        ...ups.map((u) => fx(SB_CAM_BOLT, zA.map((z): Vec3 => [u.x, ys1, z]), [0, 1, 0], "T1", u.id)),
      ],
      wait: uprights,
      from: outFrom(uprights),
      pose: flip,
      warnings: ["floor"],
    },
    {
      title: "Lock the end shelves between the panels",
      detail: "Two dowels (C) into each end of the two end shelves (16). Join one between the left side and the left partition and the other between the right partition and the right side, and turn the shelves' eight cam locks (B).",
      fix: [
        ...shelfFaces.map((f) => fx(SB_DOWEL, zC.map((z): Vec3 => [f.x, yS, z]), [-f.dir[0], 0, 0], f.sh, f.up)),
        ...shelfFaces.map((f) => fx(SB_CAM, zA.map((z): Vec3 => [f.x - f.dir[0] * 25, yS + T / 2, z]), [0, -1, 0], f.sh)),
      ],
      wait: ["SH16L", "SH16R"],
      from: outFrom(["SH16L", "SH16R"]),
      pose: flip,
    },
    {
      title: "Stand the two pairs on the top",
      detail: "Two dowels (C) into the top end of each side and partition. Stand both pairs on the cabinet's top, over its bolts, and turn the eight cam locks (B), two in each panel.",
      add: ["S2", "SH16L", "P3", "P4", "SH16R", "S5"],
      fix: [
        ...ups.map((u) => fx(SB_DOWEL, zC.map((z): Vec3 => [u.x, ys1, z]), [0, -1, 0], u.id, "T1")),
        ...camFace.map((c) => fx(SB_CAM, zA.map((z): Vec3 => [c.x, ys1 - 25, z]), c.dir, c.id)),
      ],
      from: outFrom(["S2", "SH16L", "P3", "P4", "SH16R", "S5"], [0, -300, 0]),
      pose: flip,
    },
    {
      title: "Slide in the backs and screw on the bottom",
      detail: "The three back panels go down the grooves, the wide one (15) in the middle and an end one (7) at each end. Two dowels (C) into each side and partition, then lay the bottom (6) on and drive eight screws (E) through it, two into each.",
      add: ["K7L", "K15", "K7R", "B6"],
      fix: [...ups.map((u) => fx(SB_DOWEL, zC.map((z): Vec3 => [u.x, ys0, z]), [0, 1, 0], u.id, "B6")), ...ups.map((u) => fx(SB_SCREW, zA.map((z): Vec3 => [u.x, yC0, z]), [0, 1, 0], "B6", u.id))],
      from: outFrom(["K7L", "K15", "K7R", "B6"], [0, -300, 0]),
      pose: flip,
    },
    {
      title: "Slide the right frame on",
      detail: "Turn the cabinet onto its front on a rug. Slide the right frame (11) on over the right-hand end until it sits at the right partition, its inner bar under the bottom, and bolt it to the bottom with three bolts (H) and the Allen key (R).",
      add: ["F11"],
      fix: [fx(SB_BOLT, zH.map((z): Vec3 => [xp, yC0 - P, z]), [0, 1, 0], "F11", "B6")],
      from: { F11: [700, 0, 0] },
      tools: ["allen"],
      pose: front,
      warnings: ["floor", "loose"],
    },
    {
      title: "Bolt the rails to the right frame",
      detail: "Lay the two rails (12) along the bottom, one near the front and one near the back, and fix each to the right frame's inner bar with a long bolt (G) into its end.",
      add: ["R12F", "R12B"],
      fix: [1, -1].map((k) => fx(SB_LONG_BOLT, [[xp + P / 2, yC0 - 10, k * zr]], [-1, 0, 0], "F11", rail(k))),
      from: outFrom(["R12F", "R12B"], [0, -200, 0]),
      tools: ["allen"],
      pose: front,
    },
    {
      title: "Slide the left frame on and fit the feet",
      detail: "Slide the left frame (10) on over the other end to the left partition and bolt it to the bottom with three bolts (H). Fix the rails' other ends with a long bolt (G) each, then two bolts (H) up through each rail into the bottom. Screw a levelling foot (F) into each end of both frames' floor bars.",
      add: ["F10"],
      fix: [
        fx(SB_BOLT, zH.map((z): Vec3 => [-xp, yC0 - P, z]), [0, 1, 0], "F10", "B6"),
        ...[1, -1].map((k) => fx(SB_LONG_BOLT, [[-xp - P / 2, yC0 - 10, k * zr]], [1, 0, 0], "F10", rail(k))),
        ...[1, -1].map((k) => fx(SB_BOLT, [-(xp - 100), xp - 100].map((x): Vec3 => [x, yC0 - 20, k * zr]), [0, 1, 0], rail(k), "B6")),
        ...SX.map((sx) => fx(FOOT_F, [-1, 1].map((sz): Vec3 => [sx * xp, FOOT, sz * (D / 2 - P / 2)]), [0, 1, 0], frame(sx))),
      ],
      from: { F10: [-700, 0, 0] },
      tools: ["allen"],
      pose: front,
      warnings: ["loose"],
    },
    {
      title: "Bolt on the top",
      detail: "Set the top (14) against the frames' top bars and bolt it on, three bolts (H) through each bar. Two bolts (N) with washers (O) through each frame's back post into the back edge of the cabinet's top, with the Allen keys (Q, R). Screw the two wall brackets (M) under the top's back edge, a small screw (D) each.",
      add: ["T14"],
      fix: [
        ...SX.map((sx) => fx(SB_BOLT, zH.map((z): Vec3 => [sx * xp, fy1 - P, z]), [0, 1, 0], frame(sx), "T14")),
        ...SX.map((sx) => fx(SB_TOP_BOLT, [-12, 12].map((k): Vec3 => [sx * xp + k, yC1 - T / 2, -D / 2]), [0, 0, 1], frame(sx), "T1")),
        ...SX.map((sx) => fx(SB_WASHER, [-12, 12].map((k): Vec3 => [sx * xp + k, yC1 - T / 2, -D / 2]), [0, 0, 1], frame(sx))),
        fx(SB_WALL, xM.map((x): Vec3 => [x, H - TT, -D / 2 + 14]), [0, 1, 0], "T14"),
        fx(SB_SMALL, xM.map((x): Vec3 => [x, H - TT, -D / 2 + 50]), [0, 1, 0], "T14"),
      ],
      from: { T14: [0, 300, 0] },
      tools: ["allen"],
      pose: front,
    },
    {
      title: "Stand it up and fit the middle shelf",
      detail: "Stand the sideboard on its feet and tighten every bolt. Push four shelf supports (I) into the partitions inside the middle bay, at the height you want, and slide the middle shelf (9) onto them.",
      add: ["SH9"],
      fix: [fx(SB_SUPPORT, [-1, 1].map((sz): Vec3 => [-xp + T / 2, yS - T / 2 - 3, sz * (Dc / 2 - 50)]), [-1, 0, 0], "P3"), fx(SB_SUPPORT, [-1, 1].map((sz): Vec3 => [xp - T / 2, yS - T / 2 - 3, sz * (Dc / 2 - 50)]), [1, 0, 0], "P4")],
      from: { SH9: [0, 0, 450] },
      tools: ["allen"],
      pose: "+y",
      check: "square",
    },
    {
      title: "Screw the hinges onto the doors",
      detail: "Lay the doors face down. The straight hinges (P) go on the end doors (8, 13), the cranked hinges (J) on the middle doors (17, 18): press each into its cup hole and fix it with two small screws (D).",
      fix: doors.flatMap((d) => [
        { ...fx(d.def, hy.map((y): Vec3 => [d.edge + d.g * 22, y, zF]), [0, 0, 1], d.id), ...(d.g < 0 ? { twist: Math.PI } : {}) },
        fx(SB_SMALL, hy.flatMap((y) => [-12, 12].map((k): Vec3 => [d.edge + d.g * 46, y + k, zF])), [0, 0, 1], d.id),
      ]),
      wait: doorIds,
      from: outFrom(doorIds),
      warnings: ["floor"],
    },
    {
      title: "Hang the doors",
      detail: "Hold each door in place and screw its hinge plates on, four small screws (D) each: 8 to the left side, 17 to the left partition, 18 to the right partition and 13 to the right side.",
      add: doorIds,
      fix: doors.map((d) => fx(SB_SMALL, hy.flatMap((y) => [-16, 16].flatMap((k) => [zF - 20, zF - 52].map((z): Vec3 => [d.face, y + k, z]))), d.fdir, d.on, d.id)),
      from: outFrom(doorIds, [0, 0, 400]),
    },
    {
      title: "Fit the back panel brackets",
      detail: "Eight brackets (K) hold the backs, a small screw (D) each: at the top and bottom of each side, and of each partition inside the middle bay.",
      fix: [...backBrackets.map((b) => fx(SB_BRACKET, yBack.map((y): Vec3 => [b.x, y, zB + 4]), b.dir, b.on)), ...backBrackets.map((b) => fx(SB_SMALL, yBack.map((y): Vec3 => [b.x, y, zB + 4]), b.dir, b.on))],
    },
    {
      title: "Fix it to the wall",
      detail: "Push it against the wall and mark through the two brackets under the top, then drill, push in the wall plugs (L) and screw the brackets to the wall with two screws (E). Check the wall for pipes and cables first.",
      fix: [fx(SB_PLUG, xM.map((x): Vec3 => [x, H - TT - 14, -D / 2 - 1]), [0, 0, -1]), fx(SB_SCREW, xM.map((x): Vec3 => [x, H - TT - 14, -D / 2 + 22]), [0, 0, -1])],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-wharf-5-tier-bookshelf") return bookshelf(s);
  if (s.slug === "kmart-wharf-student-desk") return desk(s);
  if (s.slug === "kmart-wharf-6-drawer-chest") return chest(s);
  if (s.slug === "kmart-wharf-4-door-sideboard") return sideboard(s);
  return null;
}

const family: Family = { names: ["KMART:WHARF"], recipe };
export default family;
