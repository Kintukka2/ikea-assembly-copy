import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's Adrian range, read from its assembly manuals: 15 mm board on cam bolts, cam locks and dowels, panelled
 * fronts that sit inside the carcass, and four steel tube legs bolted under the bottom. Each one is fixed to the
 * wall with straps on the top.
 *
 * - Adrian Cabinet (keycode 43593859, 13 steps): lying on its right side (3), the fixed shelf (6) and a rail (5)
 *   under the top stand on it and the left side (2) goes on; the upper back panel slides down the grooves, the top (1)
 *   with its two door catches goes on and three long screws pull the rail up to it. Upside down, the lower back panel
 *   slides in, the bottom (7) is screwed on and the legs (9) bolted under it. The two doors (8) hang on four cup hinges.
 *   Kmart's list: 14 dowels (A), 8 cam bolts (B), 8 cam locks (C), 4 screws 7 x 35 (D), 8 leg bolts (E), 5 screws
 *   4 x 40 (F, two of them for the wall), 2 door catches (G), 30 small screws 3 x 12 (H), 4 hinges (I), the hex key
 *   (J), 2 wall plugs (K), 8 corner blocks (L), 4 washers (M), 2 wall straps (N) and 8 screws 3 x 14 (O).
 * - Adrian Bedside Table (keycode 43516391, 13 steps): runners on both sides, a rail (6) between them for the two
 *   drawers, the top (1), the back (5) slid in from below, the bottom (4) on four screws 5 x 40 and the legs (7). Each
 *   drawer is screwed together (9, 10, 11, 12) and its front (8) cam-locked on. Kmart's list: 10 dowels (A), 4 screws
 *   5 x 40 (B), 8 screws 4 x 30 (C), 14 cam bolts (D), 14 cam locks (E), 1 wall screw (F), 8 leg bolts (G), two hex
 *   keys (H, S), 1 wall plug (I), cabinet runners left (J) and right (K), drawer runners right (L) and left (M), two of
 *   each, 29 small screws (N), 4 screws 3 x 14 (O), 4 corner blocks (P), 1 wall strap (Q) and 2 washers (R).
 * - Adrian Chest of Drawers (keycode 43517985, 14 steps): the same build with three drawers: two front rails (8)
 *   between them, a rail under the top (7) on large dowels and a back rail (5) halfway up, where the two back panels (6)
 *   meet. Each drawer has a brace (15) down the middle of its bottom. Kmart's list: 14 dowels (A), 4 screws 7 x 50 (B),
 *   15 screws 4 x 30 (C), 25 cam bolts (D), 25 cam locks (E), 4 washers (F), 8 leg bolts (G), 5 screws 4 x 40 (H, two
 *   for the wall), 2 wall plugs (I), three each of the cabinet runners (J, K) and drawer runners (L, M), 44 small
 *   screws (N), the hex key (O), 8 corner blocks (P), 8 screws 3 x 14 (Q), 2 wall straps (R) and 2 dowels 8 x 30 (S).
 *
 * Every count box in these three manuals adds up to its hardware list. Two readings had to be chosen:
 * - Two back panels, two steps that slide one in: the cabinet's manual draws the second one going in from the open
 *   bottom end when it turns the carcass over (its step 7); the chest's only shows the upper one (step 4), and the
 *   lower one has to go in from the open bottom end before the bottom closes it, so its step 7 does both.
 * - The legs aren't measured on the paper; the drawings put them at about 13 cm on all three, and the rail under the
 *   top sits well back from the front, behind the door catches and over the top drawer.
 *
 * Part numbers and hardware letters are Kmart's own, so the guide reads against the paper.
 */

const T = 15; // every panel
const FT = 18; // the door and drawer fronts, inside the carcass and flush with it
const BK = 3; // hardboard backs and drawer bottoms
const LEG = 130; // the steel legs, plate included
const GV = 16; // the back panels run in grooves this far in from the back edge
const OUT = 450; // parts built away from the carcass wait this far in front of it

type Fx = Omit<CustomFix, "count" | "at"> & { at: Vec3[] };
const fx = (f: Fx): CustomFix => ({ ...f, count: f.at.length });
const SX = [-1, 1] as const;
const offset = (ids: string[], v: Vec3 = [0, 0, OUT]) => Object.fromEntries(ids.map((id) => [id, v] as [string, Vec3]));

// fittings every Adrian manual has, whatever letter it gives them
const DOWEL = { kind: "dowel", len: 30, dia: 6 } as const;
const CAM_BOLT = { kind: "camScrew", len: 35, dia: 6 } as const;
const CAM = { kind: "cam", len: 10, dia: 15 } as const;
const LEG_BOLT = { kind: "bolt", len: 12, dia: 6, name: "Leg bolt" } as const;
const SMALL = { kind: "screw", len: 12, dia: 3 } as const;
const BLOCK_SCREW = { kind: "screw", len: 14, dia: 3 } as const;
const LONG = { kind: "screw", len: 40, dia: 4 } as const;
const BOX_SCREW = { kind: "screw", len: 30, dia: 4 } as const;
const BLOCK = { kind: "angle", len: 16, dia: 20, name: "Corner block" } as const;
const STRAP = { kind: "angle", len: 40, dia: 20, name: "Wall strap" } as const;
const WASHER = { kind: "washer", len: 1.5, dia: 12 } as const;
const PLUG = { kind: "plug", len: 30, dia: 6, included: true } as const;
const CAB_RUNNER_L = { kind: "runner", len: 250, dia: 30, name: "Cabinet runner, left" } as const;
const CAB_RUNNER_R = { kind: "runner", len: 250, dia: 30, name: "Cabinet runner, right" } as const;
const DR_RUNNER_L = { kind: "runner", len: 250, dia: 30, name: "Drawer runner, left" } as const;
const DR_RUNNER_R = { kind: "runner", len: 250, dia: 30, name: "Drawer runner, right" } as const;

/** A steel leg: a plate screwed under the bottom and a tube to the floor. */
function legs(label: string, W: number, D: number, bottom: string) {
  const at: [number, number][] = [
    [-(W / 2 - 55), D / 2 - 55],
    [W / 2 - 55, D / 2 - 55],
    [W / 2 - 55, -(D / 2 - 55)],
    [-(W / 2 - 55), -(D / 2 - 55)],
  ];
  const parts: CustomPart[] = at.map(([x, z], i) => ({
    id: `LG${i}`,
    label,
    name: "Leg",
    size: [70, LEG, 70],
    pos: [x, LEG / 2, z],
    material: "metal",
    pieces: [
      { shape: "box", size: [70, 3, 70], pos: [0, LEG / 2 - 1.5, 0] },
      { shape: "cyl", size: [32, LEG - 3, 32], pos: [0, -1.5, 0] },
    ],
  }));
  // two bolts through each plate, corner to corner
  const bolts = at.map(([x, z], i) => fx({ ...LEG_BOLT, at: [-1, 1].map((k): Vec3 => [x + k * 22, LEG - 3, z - k * 22]), dir: [0, 1, 0], on: `LG${i}`, mate: bottom }));
  return { parts, ids: parts.map((p) => p.id), bolts };
}

/** Corner blocks behind a back panel, one at each corner, screwed to the side beside it. */
function blocks(back: string, ys: number[], xi: number, zk: number, side: (sx: number) => string): CustomFix[] {
  return [
    ...SX.map((sx) => fx({ ...BLOCK, at: ys.map((y): Vec3 => [sx * (xi - 11), y, zk]), dir: [0, 0, 1], on: back })),
    ...SX.map((sx) => fx({ ...BLOCK_SCREW, at: ys.map((y, j): Vec3 => [sx * xi, y + (j % 2 ? -22 : 22), zk - 8]), dir: [sx, 0, 0], on: side(sx) })),
  ];
}

/* ---------- the cabinet ---------- */

function cabinet(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xo = W / 2, xi = xo - T;
  const y0 = LEG + T, y1 = H - T; // the sides stand between the bottom and the top
  const ys = (y0 + y1) / 2; // the fixed shelf, halfway up
  const zB = -D / 2, zF = D / 2, zk = zB + GV, zD = zF - FT;
  const RH = 30, zR = zF - 60 - T / 2; // the rail under the top, on edge, behind the door catches
  const bh = y1 + 5 - (ys + T / 2); // each back panel, from the shelf into the top's (or bottom's) groove
  const dw = xi - 2 - 1.5, dh = y1 - y0 - 4;
  const L = legs("9", W, D, "B7");
  const parts: CustomPart[] = [
    { id: "S2", label: "2", name: "Left side", size: [T, y1 - y0, D], pos: [-xo + T / 2, (y0 + y1) / 2, 0] },
    { id: "S3", label: "3", name: "Right side", size: [T, y1 - y0, D], pos: [xo - T / 2, (y0 + y1) / 2, 0] },
    { id: "SH", label: "6", name: "Shelf", size: [2 * xi, T, zD - 2 - (zk + BK)], pos: [0, ys, (zD - 2 + zk + BK) / 2] },
    { id: "R5", label: "5", name: "Rail", size: [2 * xi, RH, T], pos: [0, y1 - RH / 2, zR] },
    { id: "BKU", label: "4", name: "Back panel", size: [2 * xi + 16, bh, BK], pos: [0, ys + T / 2 + bh / 2, zk + BK / 2], material: "fiber" },
    { id: "T1", label: "1", name: "Top", size: [W, T, D], pos: [0, H - T / 2, 0] },
    { id: "BKL", label: "4", name: "Back panel", size: [2 * xi + 16, bh, BK], pos: [0, ys - T / 2 - bh / 2, zk + BK / 2], material: "fiber" },
    { id: "B7", label: "7", name: "Bottom", size: [W, T, D], pos: [0, LEG + T / 2, 0] },
    ...L.parts,
    { id: "DL", label: "8", name: "Door", size: [dw, dh, FT], pos: [-(1.5 + dw / 2), y0 + 2 + dh / 2, zF - FT / 2] },
    { id: "DR", label: "8", name: "Door", size: [dw, dh, FT], pos: [1.5 + dw / 2, y0 + 2 + dh / 2, zF - FT / 2] },
  ];

  const CONNECTOR = { kind: "screw", len: 35, dia: 7 } as const; // D
  const CATCH = { kind: "clip", len: 40, dia: 20, name: "Door catch" } as const; // G
  const HINGE = { kind: "hinge", len: 50, dia: 35 } as const; // I
  const side = (sx: number) => (sx < 0 ? "S2" : "S3");
  const zSh = [-120, 110], zShD = [-60, 50]; // the shelf's cam bolts and dowels
  const zTop = [-150, 150], zTopD = [-70, 70]; // the top's and the bottom's
  // the doors: a hinge cup 22 mm in from the outer edge, 90 mm from the top and bottom; plates on the sides
  const hy = [y0 + 2 + 90, y1 - 2 - 90];
  const doors = [
    { id: "DL", g: 1, cx: -(xi - 2) + 22, on: "S2", sx: -1 },
    { id: "DR", g: -1, cx: xi - 2 - 22, on: "S3", sx: 1 },
  ];
  const wx = [-W / 4, W / 4]; // the wall straps
  const lie = "-x" as const; // on its right side, as the manual lays it

  const steps: CustomStep[] = [
    {
      title: "Turn the cam bolts into the sides",
      detail: "Lay both sides flat, inside face up, and turn two cam bolts (B) into each, halfway up, for the shelf.",
      add: ["S3"],
      wait: ["S2"],
      from: { S2: [0, 0, OUT] },
      fix: SX.map((sx) => fx({ ...CAM_BOLT, at: zSh.map((z): Vec3 => [sx * xi, ys, z]), dir: [sx, 0, 0], on: side(sx), mate: "SH" })),
      pose: lie,
      warnings: ["floor"],
    },
    {
      title: "Stand the shelf and the rail on the right side",
      detail: "Push six dowels (A) into the ends of the shelf (6) and the rail (5). Stand both on the right side (3), the shelf over its cam bolts and the rail at the top end, set back from the front, then turn two cam locks (C) in the shelf.",
      add: ["SH", "R5"],
      fix: [
        ...SX.map((sx) => fx({ ...DOWEL, at: zShD.map((z): Vec3 => [sx * xi, ys, z]), dir: [-sx, 0, 0], on: "SH", mate: side(sx) })),
        ...SX.map((sx) => fx({ ...DOWEL, at: [[sx * xi, y1 - RH / 2, zR]], dir: [-sx, 0, 0], on: "R5", mate: side(sx) })),
        fx({ ...CAM, at: zSh.map((z): Vec3 => [xi - 25, ys - T / 2, z]), dir: [0, 1, 0], on: "SH" }),
      ],
      from: offset(["SH", "R5"], [-400, 0, 0]),
      pose: lie,
    },
    {
      title: "Lay the left side on top",
      detail: "Press the left side (2) onto the shelf and the rail and turn two more cam locks (C) in the shelf. Then push two dowels (A) into the top end of each side.",
      add: ["S2"],
      fix: [
        fx({ ...CAM, at: zSh.map((z): Vec3 => [-(xi - 25), ys - T / 2, z]), dir: [0, 1, 0], on: "SH" }),
        ...SX.map((sx) => fx({ ...DOWEL, at: zTopD.map((z): Vec3 => [sx * (xo - T / 2), y1, z]), dir: [0, -1, 0], on: side(sx), mate: "T1" })),
      ],
      from: { S2: [-450, 0, 0] },
      pose: lie,
      check: "square",
    },
    {
      title: "Slide in the upper back panel",
      detail: "Smooth side in, along the grooves from the open top end until it meets the shelf.",
      add: ["BKU"],
      from: { BKU: [0, 600, 0] },
      pose: lie,
    },
    {
      title: "Fit the top's cam bolts and door catches",
      detail: "Lay the top (1) face down. Turn four cam bolts (B) in near its ends, then screw the two door catches (G) on at the middle of the front edge, two small screws (H) each.",
      wait: ["T1"],
      from: { T1: [0, 0, OUT] },
      fix: [
        fx({ ...CAM_BOLT, at: SX.flatMap((sx) => zTop.map((z): Vec3 => [sx * (xo - T / 2), y1, z])), dir: [0, 1, 0], on: "T1" }),
        fx({ ...CATCH, at: SX.map((sx): Vec3 => [sx * 45, y1, zD - 20]), dir: [0, 1, 0], on: "T1" }),
        fx({ ...SMALL, at: SX.flatMap((sx) => [-1, 1].map((k): Vec3 => [sx * 45 + k * 22, y1, zD - 20])), dir: [0, 1, 0], on: "T1" }),
      ],
      pose: lie,
    },
    {
      title: "Fix the top on",
      detail: "Press the top onto the dowels at the open end and lock its bolts with four cam locks (C) in the sides. Then drive three long screws (F) up through the rail into the top.",
      add: ["T1"],
      fix: [
        ...SX.map((sx) => fx({ ...CAM, at: zTop.map((z): Vec3 => [sx * xi, y1 - 25, z]), dir: [sx, 0, 0], on: side(sx) })),
        fx({ ...LONG, at: [-250, 0, 250].map((x): Vec3 => [x, y1 - RH, zR]), dir: [0, 1, 0], on: "R5", mate: "T1" }),
      ],
      from: { T1: [0, 450, 0] },
      pose: lie,
    },
    {
      title: "Turn it over and slide in the lower back panel",
      detail: "Stand it on its top. Slide the other back panel (4) along the grooves from the open end until it meets the shelf, then push two dowels (A) into the edge of each side.",
      add: ["BKL"],
      fix: SX.map((sx) => fx({ ...DOWEL, at: zTopD.map((z): Vec3 => [sx * (xo - T / 2), y0, z]), dir: [0, 1, 0], on: side(sx), mate: "B7" })),
      from: { BKL: [0, -600, 0] },
      pose: "-y",
    },
    {
      title: "Screw the bottom on",
      detail: "Lay the bottom (7) on the dowels and drive two screws (D) through it into each side.",
      add: ["B7"],
      fix: SX.map((sx) => fx({ ...CONNECTOR, at: zTop.map((z): Vec3 => [sx * (xo - T / 2), LEG, z]), dir: [0, 1, 0], on: "B7", mate: side(sx) })),
      from: { B7: [0, -400, 0] },
      pose: "-y",
    },
    {
      title: "Bolt on the legs",
      detail: "Two leg bolts (E) through each leg's plate (9) into the bottom, done up with the hex key (J).",
      add: L.ids,
      fix: L.bolts,
      from: offset(L.ids, [0, -300, 0]),
      tools: ["allen"],
      pose: "-y",
      kind: "legs",
    },
    {
      title: "Screw the hinges onto the doors",
      detail: "Stand the cabinet up. Lay both doors (8) face down on a rug and press a hinge (I) into each cup hole, two small screws (H) each.",
      wait: ["DL", "DR"],
      from: offset(["DL", "DR"]),
      fix: doors.flatMap((d) => [
        fx({ ...HINGE, at: hy.map((y): Vec3 => [d.cx, y, zD]), dir: [0, 0, 1], on: d.id, ...(d.g < 0 ? { twist: Math.PI } : {}) }),
        fx({ ...SMALL, at: hy.flatMap((y) => [-12, 12].map((k): Vec3 => [d.cx + d.g * 24, y + k, zD])), dir: [0, 0, 1], on: d.id }),
      ]),
      pose: "+y",
      warnings: ["floor"],
      kind: "hinges",
    },
    {
      title: "Hang the doors",
      detail: "Hold each door in its opening and screw its hinge plates to the side, four small screws (H) each.",
      add: ["DL", "DR"],
      fix: doors.map((d) => fx({ ...SMALL, at: hy.flatMap((y) => [-16, 16].flatMap((k) => [zD - 22, zD - 54].map((z): Vec3 => [d.sx * xi, y + k, z]))), dir: [d.sx, 0, 0], on: d.on, mate: d.id })),
      from: offset(["DL", "DR"]),
      kind: "doors",
    },
    {
      title: "Fit the corner blocks and the wall straps",
      detail: "Turn it round. Press a corner block (L) into each corner behind both back panels and fix it to the side with a screw (O). Screw the two wall straps (N) onto the top at its back edge, a washer (M) under each small screw (H).",
      fix: [
        ...blocks("BKU", [ys + T / 2 + 25, y1 - 25], xi, zk, side),
        ...blocks("BKL", [y0 + 25, ys - T / 2 - 25], xi, zk, side),
        fx({ ...STRAP, at: wx.map((x): Vec3 => [x, H, zB + 30]), dir: [0, -1, 0], on: "T1" }),
        fx({ ...WASHER, at: wx.map((x): Vec3 => [x, H, zB + 60]), dir: [0, -1, 0], on: "T1" }),
        fx({ ...SMALL, at: wx.map((x): Vec3 => [x, H + 1.5, zB + 60]), dir: [0, -1, 0], on: "T1" }),
      ],
      tools: ["screwdriver"],
      wall: false,
    },
    {
      title: "Fix it to the wall",
      detail: "Push it against the wall and mark through the straps, then drill, push in the wall plugs (K) and screw each strap to the wall with a long screw (F) and a washer (M). Check the wall for pipes and cables first.",
      fix: [
        fx({ ...PLUG, at: wx.map((x): Vec3 => [x, H + 25, zB - 1]), dir: [0, 0, -1] }),
        fx({ ...WASHER, at: wx.map((x): Vec3 => [x, H + 25, zB + 2]), dir: [0, 0, -1], on: "T1" }),
        fx({ ...LONG, included: true, at: wx.map((x): Vec3 => [x, H + 25, zB + 3.5]), dir: [0, 0, -1], on: "T1" }),
      ],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

/* ---------- drawers: the bedside table and the chest ---------- */

interface Drawer {
  i: number;
  y: number; // underside of the box
  front: string;
  sl: string;
  sr: string;
  back: string;
  bottom: string;
  brace?: string;
}

/**
 * The drawers of both: a front inside the carcass, sides cam-locked to it, a back screwed between the sides and a
 * hardboard bottom slid in from the front; the chest's have a brace down the middle as well. They run on runners at
 * the foot of each opening: the cabinet part on the side, the drawer part on the drawer side.
 */
function drawerParts(n: number, o: { xi: number; zF: number; ob: (i: number) => number; fy: (i: number) => number; fh: number; DD: number; sh: number; N: Record<string, string>; brace?: boolean }) {
  const { xi, zF, DD, sh, N } = o;
  const zD = zF - FT, zb = zD - DD, zc = zD - DD / 2;
  const xs = xi - 12.5 - T / 2; // drawer sides' centres, clear of the runners
  const parts: CustomPart[] = [];
  const drawers: Drawer[] = [];
  for (let i = 0; i < n; i++) {
    const y = o.ob(i) + 15;
    const d: Drawer = { i, y, front: `F${i}`, sl: `DSL${i}`, sr: `DSR${i}`, back: `DB${i}`, bottom: `DT${i}` };
    parts.push(
      { id: d.front, label: N.front, name: "Drawer front", size: [2 * xi - 4, o.fh, FT], pos: [0, o.fy(i) + o.fh / 2, zF - FT / 2] },
      { id: d.sl, label: N.sideL, name: "Left drawer side", size: [T, sh, DD], pos: [-xs, y + sh / 2, zc] },
      { id: d.sr, label: N.sideR, name: "Right drawer side", size: [T, sh, DD], pos: [xs, y + sh / 2, zc] },
      { id: d.back, label: N.back, name: "Drawer back", size: [2 * xs - T, sh, T], pos: [0, y + sh / 2, zb + T / 2] },
      { id: d.bottom, label: N.bottom, name: "Drawer bottom", size: [2 * xs - T + 16, BK, DD - 1], pos: [0, y + 12, (zb + 7 + zD + 6) / 2], material: "fiber" },
    );
    if (o.brace) {
      d.brace = `DC${i}`;
      parts.push({ id: d.brace, label: N.brace, name: "Drawer brace", size: [60, T, DD - T], pos: [0, y + 13.5 + T / 2, (zD + zb + T) / 2] });
    }
    drawers.push(d);
  }
  const idsOf = (d: Drawer) => [d.front, d.sl, d.sr, d.back, d.bottom, ...(d.brace ? [d.brace] : [])];
  const ys = (d: Drawer) => [d.y + 30, d.y + sh - 30];
  const per = (d: Drawer, fn: (g: number, sd: string) => CustomFix[]) => [...fn(-1, d.sl), ...fn(1, d.sr)];
  const RL = 250, zRun = zD - 5 - RL / 2;
  const f = {
    // screws through each side into the back (and one through the back into the brace)
    box: (d: Drawer): CustomFix[] => [
      ...per(d, (g, sd) => [fx({ ...BOX_SCREW, at: ys(d).map((y): Vec3 => [g * (xs + T / 2), y, zb + T / 2]), dir: [-g, 0, 0], on: sd, mate: d.back })]),
      ...(d.brace ? [fx({ ...BOX_SCREW, at: [[0, d.y + 13.5 + T / 2, zb]], dir: [0, 0, 1], on: d.back, mate: d.brace })] : []),
    ],
    // cam bolts in the front for each side (and the brace), cam locks in the sides (and the brace)
    front: (d: Drawer): CustomFix[] => [
      ...per(d, (g, sd) => [fx({ ...CAM_BOLT, at: ys(d).map((y): Vec3 => [g * xs, y, zD]), dir: [0, 0, 1], on: d.front, mate: sd })]),
      ...(d.brace ? [fx({ ...CAM_BOLT, at: [[0, d.y + 13.5 + T / 2, zD]], dir: [0, 0, 1], on: d.front, mate: d.brace })] : []),
      ...per(d, (g, sd) => [fx({ ...CAM, at: ys(d).map((y): Vec3 => [g * (xs - T / 2), y, zD - 25]), dir: [g, 0, 0], on: sd })]),
      ...(d.brace ? [fx({ ...CAM, at: [[0, d.y + 13.5 + T, zD - 25]], dir: [0, -1, 0], on: d.brace })] : []),
    ],
    // drawer runners on the outside of the drawer sides, three screws each
    runners: (d: Drawer): CustomFix[] =>
      per(d, (g, sd) => [
        fx({ ...(g < 0 ? DR_RUNNER_L : DR_RUNNER_R), at: [[g * (xs + T / 2), d.y + 12, zc]], dir: [-g, 0, 0], on: sd }),
        fx({ ...SMALL, at: [-95, 15, 95].map((k): Vec3 => [g * (xs + T / 2), d.y + 12, zc + k]), dir: [-g, 0, 0], on: sd }),
      ]),
    // cabinet runners inside the carcass sides, four screws each
    cabinet: (sx: number, on: string): CustomFix[] => [
      fx({ ...(sx < 0 ? CAB_RUNNER_L : CAB_RUNNER_R), at: drawers.map((d): Vec3 => [sx * xi, d.y + 12, zRun]), dir: [sx, 0, 0], on }),
      fx({ ...SMALL, at: drawers.flatMap((d) => [-100, -35, 35, 100].map((k): Vec3 => [sx * xi, d.y + 12, zRun + k])), dir: [sx, 0, 0], on }),
    ],
  };
  const boxIds = drawers.flatMap((d) => [d.sl, d.sr, d.back, d.bottom, ...(d.brace ? [d.brace] : [])]);
  return { parts, drawers, ids: drawers.flatMap(idsOf), boxIds, fronts: drawers.map((d) => d.front), f };
}

function bedside(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xo = W / 2, xi = xo - T;
  const y0 = LEG + T, y1 = H - T;
  const zB = -D / 2, zF = D / 2, zk = zB + GV, zD = zF - FT;
  const ym = (y0 + y1) / 2, RD = 60, zRl = zD - RD / 2; // the rail between the drawers, lying flat behind the fronts
  const fh = (y1 - y0 - 4 - 3) / 2;
  const L = legs("7", W, D, "B4");
  const dr = drawerParts(2, {
    xi,
    zF,
    ob: (i) => (i === 0 ? y0 : ym + T / 2),
    fy: (i) => y0 + 2 + i * (fh + 3),
    fh,
    DD: 250,
    sh: 120,
    N: { front: "8", sideR: "9", sideL: "10", back: "11", bottom: "12" },
  });
  const parts: CustomPart[] = [
    { id: "S2", label: "2", name: "Left side", size: [T, y1 - y0, D], pos: [-xo + T / 2, (y0 + y1) / 2, 0] },
    { id: "S3", label: "3", name: "Right side", size: [T, y1 - y0, D], pos: [xo - T / 2, (y0 + y1) / 2, 0] },
    { id: "R6", label: "6", name: "Rail", size: [2 * xi, T, RD], pos: [0, ym, zRl] },
    { id: "T1", label: "1", name: "Top", size: [W, T, D], pos: [0, H - T / 2, 0] },
    { id: "BK", label: "5", name: "Back panel", size: [2 * xi + 16, y1 + 5 - y0, BK], pos: [0, (y0 + y1 + 5) / 2, zk + BK / 2], material: "fiber" },
    { id: "B4", label: "4", name: "Bottom", size: [W, T, D], pos: [0, LEG + T / 2, 0] },
    ...L.parts,
    ...dr.parts,
  ];

  const SCREW_5 = { kind: "screw", len: 40, dia: 5 } as const; // B
  const side = (sx: number) => (sx < 0 ? "S2" : "S3");
  const zTop = [-(D / 2 - 50), D / 2 - 50], zTopD = [-40, 40];
  const railBolt = (sx: number) => fx({ ...CAM_BOLT, at: [[sx * xi, ym, zD - 15]], dir: [sx, 0, 0], on: side(sx), mate: "R6" });
  const railJoint = (sx: number): CustomFix[] => [
    fx({ ...DOWEL, at: [[sx * xi, ym, zD - 45]], dir: [sx, 0, 0], on: side(sx), mate: "R6" }),
    fx({ ...CAM, at: [[sx * (xi - 25), ym + T / 2, zD - 15]], dir: [0, -1, 0], on: "R6" }),
  ];
  const lie = "+x" as const; // on its left side
  const steps: CustomStep[] = [
    {
      title: "Screw the runners inside the sides",
      detail: "Lay both sides flat, inside face up. Two left runners (J) go on the left side (2) and two right runners (K) on the right side (3), wheel to the front, four small screws (N) each.",
      add: ["S2"],
      wait: ["S3"],
      from: { S3: [0, 0, OUT] },
      fix: [...dr.f.cabinet(-1, "S2"), ...dr.f.cabinet(1, "S3")],
      pose: lie,
      warnings: ["floor"],
      kind: "runners",
    },
    { title: "Turn in the rail's cam bolts", detail: "One cam bolt (D) into each side, at the front between the runners.", fix: [railBolt(-1), railBolt(1)], pose: lie },
    {
      title: "Stand the rail on the left side",
      detail: "Push a dowel (A) into the left side beside its cam bolt, stand the rail (6) on them and turn a cam lock (E) in the rail.",
      add: ["R6"],
      fix: railJoint(-1),
      from: { R6: [400, 0, 0] },
      pose: lie,
    },
    {
      title: "Fit the right side",
      detail: "A dowel (A) into the right side, then press it onto the rail's other end and turn the second cam lock (E).",
      add: ["S3"],
      fix: railJoint(1),
      from: { S3: [400, 0, 0] },
      pose: lie,
    },
    {
      title: "Fix the top on",
      detail: "Turn four cam bolts (D) into the top (1) and push two dowels (A) into the top edge of each side. Press the top on and lock it with four cam locks (E) in the sides.",
      add: ["T1"],
      fix: [
        ...SX.map((sx) => fx({ ...CAM_BOLT, at: zTop.map((z): Vec3 => [sx * (xo - T / 2), y1, z]), dir: [0, 1, 0], on: "T1", mate: side(sx) })),
        ...SX.map((sx) => fx({ ...DOWEL, at: zTopD.map((z): Vec3 => [sx * (xo - T / 2), y1, z]), dir: [0, -1, 0], on: side(sx), mate: "T1" })),
        ...SX.map((sx) => fx({ ...CAM, at: zTop.map((z): Vec3 => [sx * xi, y1 - 25, z]), dir: [sx, 0, 0], on: side(sx) })),
      ],
      from: { T1: [0, 400, 0] },
      pose: "-z",
      check: "square",
    },
    {
      title: "Slide in the back panel",
      detail: "Lay it on its front. Smooth side in, slide the back (5) along the grooves from the open bottom end until it reaches the top.",
      add: ["BK"],
      from: { BK: [0, -600, 0] },
      pose: "-z",
    },
    {
      title: "Screw the bottom on",
      detail: "Turn it on its side. Push two dowels (A) into the bottom edge of each side, lay the bottom (4) on and drive four screws (B) through it with the small hex key (H).",
      add: ["B4"],
      fix: [
        ...SX.map((sx) => fx({ ...DOWEL, at: zTopD.map((z): Vec3 => [sx * (xo - T / 2), y0, z]), dir: [0, 1, 0], on: side(sx), mate: "B4" })),
        ...SX.map((sx) => fx({ ...SCREW_5, at: zTop.map((z): Vec3 => [sx * (xo - T / 2), LEG, z]), dir: [0, 1, 0], on: "B4", mate: side(sx) })),
      ],
      from: { B4: [0, -400, 0] },
      tools: ["allen", "screwdriver"],
      pose: lie,
    },
    {
      title: "Bolt on the legs",
      detail: "Two leg bolts (G) through each leg's plate (7) into the bottom, done up with the larger hex key (S).",
      add: L.ids,
      fix: L.bolts,
      from: offset(L.ids, [0, -300, 0]),
      tools: ["allen"],
      pose: lie,
      kind: "legs",
    },
    {
      title: "Screw the drawer boxes together",
      detail: "Stand the table up. For each drawer: two screws (C) through each side (9 and 10) into the back (11), then slide the bottom (12) along the grooves from the open front.",
      fix: dr.drawers.flatMap(dr.f.box),
      wait: dr.boxIds,
      from: offset(dr.ids),
      pose: "+y",
      kind: "drawer",
    },
    {
      title: "Fix the fronts and the runners",
      detail: "Four cam bolts (D) into the back of each front (8). Push the box onto them and turn four cam locks (E) in its sides, then screw the left runner (M) and the right runner (L) along the bottom of its sides, three small screws (N) each.",
      fix: dr.drawers.flatMap((d) => [...dr.f.front(d), ...dr.f.runners(d)]),
      wait: dr.fronts,
      from: offset(dr.ids),
      kind: "drawer",
    },
    {
      title: "Slide the drawers in",
      detail: "Rest each drawer's runners on the ones in the table and push it home until it clicks over the stops.",
      add: dr.ids,
      from: offset(dr.ids),
      kind: "drawer",
      warnings: ["tip"],
    },
    {
      title: "Fit the corner blocks and the wall strap",
      detail: "Turn it round. Press a corner block (P) into each corner behind the back and fix it to the side with a screw (O). Screw the wall strap (Q) onto the top at its back edge, a washer (R) under a small screw (N).",
      fix: [
        ...blocks("BK", [y0 + 25, y1 - 25], xi, zk, side),
        fx({ ...STRAP, at: [[0, H, zB + 30]], dir: [0, -1, 0], on: "T1" }),
        fx({ ...WASHER, at: [[0, H, zB + 60]], dir: [0, -1, 0], on: "T1" }),
        fx({ ...SMALL, at: [[0, H + 1.5, zB + 60]], dir: [0, -1, 0], on: "T1" }),
      ],
      tools: ["screwdriver"],
      wall: false,
    },
    {
      title: "Fix it to the wall",
      detail: "Push it against the wall and mark through the strap, then drill, push in the wall plug (I) and screw the strap to the wall with the long screw (F) and a washer (R). Check the wall for pipes and cables first.",
      fix: [
        fx({ ...PLUG, at: [[0, H + 25, zB - 1]], dir: [0, 0, -1] }),
        fx({ ...WASHER, at: [[0, H + 25, zB + 2]], dir: [0, 0, -1], on: "T1" }),
        fx({ ...LONG, included: true, at: [[0, H + 25, zB + 3.5]], dir: [0, 0, -1], on: "T1" }),
      ],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

function chest(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xo = W / 2, xi = xo - T;
  const y0 = LEG + T, y1 = H - T;
  const zB = -D / 2, zF = D / 2, zk = zB + GV, zD = zF - FT;
  const o = (y1 - y0 - 2 * T) / 3; // each drawer opening
  const ob = (i: number) => y0 + i * (o + T);
  const RD = 60, zR8 = zD - RD / 2; // the two front rails, flat behind the fronts
  const R7H = 30, zR7 = zF - 90 - T / 2; // the rail under the top, on edge, set back over the top drawer
  const ym = (y0 + y1) / 2, R5H = 60, zR5 = zB + 10 + T / 2; // the back rail, where the back panels meet
  const bh = y1 + 5 - (ym + R5H / 2 - 8);
  const fh = (y1 - y0 - 4 - 6) / 3;
  const L = legs("9", W, D, "B4");
  const dr = drawerParts(3, {
    xi,
    zF,
    ob,
    fy: (i) => y0 + 2 + i * (fh + 3),
    fh,
    DD: 300,
    sh: 120,
    brace: true,
    N: { front: "10", sideR: "11", sideL: "12", back: "13", bottom: "14", brace: "15" },
  });
  const y8 = [ob(1) - T / 2, ob(2) - T / 2];
  const parts: CustomPart[] = [
    { id: "S2", label: "2", name: "Left side", size: [T, y1 - y0, D], pos: [-xo + T / 2, (y0 + y1) / 2, 0] },
    { id: "S3", label: "3", name: "Right side", size: [T, y1 - y0, D], pos: [xo - T / 2, (y0 + y1) / 2, 0] },
    { id: "R7", label: "7", name: "Top rail", size: [2 * xi, R7H, T], pos: [0, y1 - R7H / 2, zR7] },
    { id: "R8a", label: "8", name: "Front rail", size: [2 * xi, T, RD], pos: [0, y8[0], zR8] },
    { id: "R8b", label: "8", name: "Front rail", size: [2 * xi, T, RD], pos: [0, y8[1], zR8] },
    { id: "R5", label: "5", name: "Back rail", size: [2 * xi, R5H, T], pos: [0, ym, zR5] },
    { id: "BKU", label: "6", name: "Back panel", size: [2 * xi + 16, bh, BK], pos: [0, y1 + 5 - bh / 2, zk + BK / 2], material: "fiber" },
    { id: "T1", label: "1", name: "Top", size: [W, T, D], pos: [0, H - T / 2, 0] },
    { id: "BKL", label: "6", name: "Back panel", size: [2 * xi + 16, bh, BK], pos: [0, y0 - 5 + bh / 2, zk + BK / 2], material: "fiber" },
    { id: "B4", label: "4", name: "Bottom", size: [W, T, D], pos: [0, LEG + T / 2, 0] },
    ...L.parts,
    ...dr.parts,
  ];

  const SCREW_7 = { kind: "screw", len: 50, dia: 7 } as const; // B
  const BIG_DOWEL = { kind: "dowel", len: 30, dia: 8 } as const; // S
  const side = (sx: number) => (sx < 0 ? "S2" : "S3");
  const zTop = [-150, 150], zTopD = [-70, 70];
  const rails = [
    { id: "R8a", y: y8[0] },
    { id: "R8b", y: y8[1] },
  ];
  const sideBolts = (sx: number) =>
    fx({ ...CAM_BOLT, at: [...rails.map((r): Vec3 => [sx * xi, r.y, zD - 15]), [sx * xi, ym + 15, zR5]], dir: [sx, 0, 0], on: side(sx) });
  const railJoints = (sx: number): CustomFix[] => [
    ...rails.map((r) => fx({ ...DOWEL, at: [[sx * xi, r.y, zD - 45]], dir: [sx, 0, 0], on: side(sx), mate: r.id })),
    fx({ ...DOWEL, at: [[sx * xi, ym - 15, zR5]], dir: [sx, 0, 0], on: side(sx), mate: "R5" }),
    ...rails.map((r) => fx({ ...CAM, at: [[sx * (xi - 25), r.y + T / 2, zD - 15]], dir: [0, -1, 0], on: r.id })),
    fx({ ...CAM, at: [[sx * (xi - 25), ym + 15, zR5 + T / 2]], dir: [0, 0, -1], on: "R5" }),
    fx({ ...BIG_DOWEL, at: [[sx * xi, y1 - R7H / 2, zR7]], dir: [sx, 0, 0], on: side(sx), mate: "R7" }),
  ];
  const wx = [-W / 4, W / 4];
  const lie = "+x" as const; // on its left side
  const steps: CustomStep[] = [
    {
      title: "Screw the runners inside the sides",
      detail: "Lay both sides flat, inside face up. Three left runners (J) go on the left side (2) and three right runners (K) on the right side (3), wheel to the front, four small screws (N) each.",
      add: ["S2"],
      wait: ["S3"],
      from: { S3: [0, 0, OUT] },
      fix: [...dr.f.cabinet(-1, "S2"), ...dr.f.cabinet(1, "S3")],
      pose: lie,
      warnings: ["floor"],
      kind: "runners",
    },
    {
      title: "Turn in the cam bolts",
      detail: "Three cam bolts (D) into each side: two at the front for the front rails, one at the back halfway up for the back rail.",
      fix: [sideBolts(-1), sideBolts(1)],
      pose: lie,
    },
    {
      title: "Join the sides with the four rails",
      detail: "Push dowels (A) into the left side beside its cam bolts and the two large dowels (S) into the ends of the top rail (7). Stand the top rail, the two front rails (8) and the back rail (5) on the left side, lay the right side on top and turn the six cam locks (E).",
      add: ["R7", "R8a", "R8b", "R5", "S3"],
      fix: [...railJoints(-1), ...railJoints(1)],
      from: { ...offset(["R7", "R8a", "R8b", "R5"], [400, 0, 0]), S3: [600, 0, 0] },
      pose: lie,
      check: "square",
    },
    {
      title: "Slide in the upper back panel",
      detail: "Smooth side in, along the grooves from the open top end until it meets the back rail.",
      add: ["BKU"],
      from: { BKU: [0, 600, 0] },
      pose: lie,
    },
    {
      title: "Fix the top on",
      detail: "Turn four cam bolts (D) into the top (1) and push two dowels (A) into the top edge of each side. Press the top on and lock it with four cam locks (E) in the sides.",
      add: ["T1"],
      fix: [
        ...SX.map((sx) => fx({ ...CAM_BOLT, at: zTop.map((z): Vec3 => [sx * (xo - T / 2), y1, z]), dir: [0, 1, 0], on: "T1", mate: side(sx) })),
        ...SX.map((sx) => fx({ ...DOWEL, at: zTopD.map((z): Vec3 => [sx * (xo - T / 2), y1, z]), dir: [0, -1, 0], on: side(sx), mate: "T1" })),
        ...SX.map((sx) => fx({ ...CAM, at: zTop.map((z): Vec3 => [sx * xi, y1 - 25, z]), dir: [sx, 0, 0], on: side(sx) })),
      ],
      from: { T1: [0, 400, 0] },
      pose: lie,
    },
    {
      title: "Screw the top rail to the top",
      detail: "Three long screws (H) up through the top rail into the top.",
      fix: [fx({ ...LONG, at: [-250, 0, 250].map((x): Vec3 => [x, y1 - R7H, zR7]), dir: [0, 1, 0], on: "R7", mate: "T1" })],
      pose: lie,
    },
    {
      // the manual draws only the bottom here; the lower back panel has to slide in before it closes the end
      title: "Slide in the lower back panel and screw the bottom on",
      detail: "Slide the other back panel (6) along the grooves from the open bottom end until it meets the back rail. Push two dowels (A) into the bottom edge of each side, lay the bottom (4) on and drive four screws (B) through it into the sides.",
      add: ["BKL", "B4"],
      fix: [
        ...SX.map((sx) => fx({ ...DOWEL, at: zTopD.map((z): Vec3 => [sx * (xo - T / 2), y0, z]), dir: [0, 1, 0], on: side(sx), mate: "B4" })),
        ...SX.map((sx) => fx({ ...SCREW_7, at: zTop.map((z): Vec3 => [sx * (xo - T / 2), LEG, z]), dir: [0, 1, 0], on: "B4", mate: side(sx) })),
      ],
      from: { BKL: [0, -600, 0], B4: [0, -400, 0] },
      pose: lie,
    },
    {
      title: "Bolt on the legs",
      detail: "Two leg bolts (G) through each leg's plate (9) into the bottom, done up with the hex key (O).",
      add: L.ids,
      fix: L.bolts,
      from: offset(L.ids, [0, -300, 0]),
      tools: ["allen"],
      pose: lie,
      kind: "legs",
    },
    {
      title: "Screw the drawer boxes together",
      detail: "Stand the chest up. For each of the three drawers: two screws (C) through each side (11 and 12) into the back (13), the bottom (14) slid along the grooves from the open front, and the brace (15) laid down its middle with one screw (C) through the back.",
      fix: dr.drawers.flatMap(dr.f.box),
      wait: dr.boxIds,
      from: offset(dr.ids),
      pose: "+y",
      kind: "drawer",
    },
    {
      title: "Fix the drawer fronts",
      detail: "Five cam bolts (D) into the back of each front (10): two for each side and one for the brace. Push the box onto them and turn the five cam locks (E).",
      fix: dr.drawers.flatMap(dr.f.front),
      wait: dr.fronts,
      from: offset(dr.ids),
      kind: "drawer",
    },
    {
      title: "Screw the runners onto the drawers",
      detail: "A left runner (M) along the bottom of each left side and a right runner (L) on each right side, three small screws (N) each.",
      fix: dr.drawers.flatMap(dr.f.runners),
      kind: "runners",
    },
    {
      title: "Slide the drawers in",
      detail: "Rest each drawer's runners on the ones in the chest and push it home until it clicks over the stops. Open only one drawer at a time.",
      add: dr.ids,
      from: offset(dr.ids),
      kind: "drawer",
      warnings: ["tip"],
    },
    {
      title: "Fit the corner blocks and the wall straps",
      detail: "Turn it round. Press a corner block (P) into each corner behind both back panels and fix it to the side with a screw (Q). Screw the two wall straps (R) onto the top at its back edge, a washer (F) under each small screw (N).",
      fix: [
        ...blocks("BKU", [ym + R5H / 2 + 25, y1 - 25], xi, zk, side),
        ...blocks("BKL", [y0 + 25, ym - R5H / 2 - 25], xi, zk, side),
        fx({ ...STRAP, at: wx.map((x): Vec3 => [x, H, zB + 30]), dir: [0, -1, 0], on: "T1" }),
        fx({ ...WASHER, at: wx.map((x): Vec3 => [x, H, zB + 60]), dir: [0, -1, 0], on: "T1" }),
        fx({ ...SMALL, at: wx.map((x): Vec3 => [x, H + 1.5, zB + 60]), dir: [0, -1, 0], on: "T1" }),
      ],
      tools: ["screwdriver"],
      wall: false,
    },
    {
      title: "Fix it to the wall",
      detail: "Push it against the wall and mark through the straps, then drill, push in the wall plugs (I) and screw each strap to the wall with a long screw (H) and a washer (F). Check the wall for pipes and cables first.",
      fix: [
        fx({ ...PLUG, at: wx.map((x): Vec3 => [x, H + 25, zB - 1]), dir: [0, 0, -1] }),
        fx({ ...WASHER, at: wx.map((x): Vec3 => [x, H + 25, zB + 2]), dir: [0, 0, -1], on: "T1" }),
        fx({ ...LONG, included: true, at: wx.map((x): Vec3 => [x, H + 25, zB + 3.5]), dir: [0, 0, -1], on: "T1" }),
      ],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  switch (s.slug) {
    case "kmart-adrian-cabinet":
      return cabinet(s);
    case "kmart-adrian-bedside-table":
      return bedside(s);
    case "kmart-adrian-chest-of-drawers":
      return chest(s);
    default:
      return null;
  }
}

const family: Family = { names: ["KMART:ADRIAN"], recipe };
export default family;
