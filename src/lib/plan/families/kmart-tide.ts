import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's Tide range (sold as anko), read from its assembly manuals. Each end is a frame: a front and a back leg,
 * boards 80 mm wide and 22 mm thick that run to the floor, with a 16 mm panel between them set in from the outside,
 * all on cam bolts and dowels. A 25 mm top sits on the four legs on 8 mm dowels.
 *
 * - Tide 2 Door Cabinet (keycode 43708918, 15 steps): the top takes its cam bolts, a rail (9) under its front and two
 *   wall brackets; each leg takes two cam bolts. The side panels (4, 14) go between their legs (5 and 7, 6 and 8) and a
 *   square post (10) is screwed behind each front leg, where the hinges go. On the left frame the shelf (2) and the
 *   bottom (3), notched round the posts, stand on cam bolts, the lower back (13) slides down the back legs' grooves and
 *   the right frame goes on. Angle brackets hold the bottom at each leg and felt pads go under them; stood up, the
 *   upper back (15) slides down, the top goes on and the two doors (11, 12) hang on four cup hinges.
 *   Kmart's list: 20 cam bolts (A), 20 cam locks (B), 22 dowels 6 x 30 (C), 4 screws 4 x 35 (D, two of them for the
 *   wall), 12 dowels 8 x 30 (E), 4 hinges (F), 24 hinge screws 4 x 14 (G), 8 corner blocks (H), 8 screws 3 x 16 (I),
 *   6 screws 4 x 55 (J), 4 angle brackets (K), 10 screws 4 x 12 (L), 2 wall brackets (M), 2 wall plugs (N) and 4 felt
 *   pads (O).
 * - Tide 2 Drawer Hall Table (keycode 43708895, 16 steps): the end frames carry an end panel (6, 7) at the top, with a
 *   block on its inside for the runners, and an end rail (14) low down. The drawer section (bottom 2, back 4 and
 *   divider 8) is built on its own, bolted to the right frame through the back leg with long bolts into barrel nuts,
 *   then the left frame goes on with the two long rails (13) between the legs; the shelf (3) drops in between the
 *   rails. Angle brackets hold the end rails, the top goes on and two drawers (15 to 20) run on side runners.
 *   Kmart's list: 32 cam bolts (A), 32 cam locks (B), 34 dowels 6 x 30 (C), 24 screws 4 x 35 (D, two of them for the
 *   wall), 8 dowels 8 x 30 (E), 24 small screws 3 x 12 (F), 8 bolts 7 x 100 (G), 8 barrel nuts (H), the hex key (I),
 *   4 angle brackets (J), 10 screws 4 x 12 (K), 2 wall brackets (L), 2 wall plugs (M), 4 felt pads (N), cabinet runners
 *   left (CL) and right (CR) and drawer runners left (DL) and right (DR), two of each.
 *
 * Every count box in both manuals adds up to its hardware list. Sizes come from the drawings: the 80 x 22 mm legs, the
 * end panels about 2 cm in from the outside, the hall table's drawer section 145 mm deep under the top and its shelf
 * about 15 cm off the floor. Where the paper only shows a bracket (the cabinet's corner blocks and angle brackets,
 * both products' wall brackets), it goes in the nearest corner the drawing points to.
 *
 * Part numbers and hardware letters are Kmart's own, so the guide reads against the paper.
 */

const TT = 25; // the top
const T = 16; // panels
const PX = 80, PZ = 22; // each leg: a board 80 mm across the end and 22 mm deep
const DF = 18; // doors and drawer fronts
const OUT = 450; // parts built away from the carcass wait this far in front of it (or behind it)

type Fx = Omit<CustomFix, "count" | "at"> & { at: Vec3[] };
const fx = (f: Fx): CustomFix => ({ ...f, count: f.at.length });
const SX = [-1, 1] as const;
const offset = (ids: string[], v: Vec3 = [0, 0, OUT]) => Object.fromEntries(ids.map((id) => [id, v] as [string, Vec3]));

/** A panel drawn as the boxes that make it up (notched corners, a block on its face), given in the product's frame. */
function boxes(list: { min: Vec3; max: Vec3 }[]): { size: Vec3; pos: Vec3; pieces: PartPiece[] } {
  const lo = [0, 1, 2].map((k) => Math.min(...list.map((b) => b.min[k]))) as Vec3;
  const hi = [0, 1, 2].map((k) => Math.max(...list.map((b) => b.max[k]))) as Vec3;
  const pos = [0, 1, 2].map((k) => (lo[k] + hi[k]) / 2) as Vec3;
  const size = [0, 1, 2].map((k) => hi[k] - lo[k]) as Vec3;
  const pieces: PartPiece[] = list.map((b) => ({
    shape: "box",
    size: [0, 1, 2].map((k) => b.max[k] - b.min[k]) as Vec3,
    pos: [0, 1, 2].map((k) => (b.min[k] + b.max[k]) / 2 - pos[k]) as Vec3,
  }));
  return { size, pos, pieces };
}

const CAM_BOLT = { kind: "camScrew", len: 35, dia: 6 } as const;
const CAM = { kind: "cam", len: 9, dia: 15 } as const;
const DOWEL = { kind: "dowel", len: 30, dia: 6 } as const;
const BIG_DOWEL = { kind: "dowel", len: 30, dia: 8 } as const;
const SCREW_35 = { kind: "screw", len: 35, dia: 4 } as const;
const SCREW_12 = { kind: "screw", len: 12, dia: 4 } as const;
const ANGLE = { kind: "angle", len: 30, dia: 24 } as const;
const WALL_BRACKET = { kind: "angle", len: 50, dia: 20, name: "Wall bracket" } as const;
const PLUG = { kind: "plug", len: 30, dia: 6, included: true } as const;
const PAD = { kind: "glide", len: 3, dia: 20 } as const;

/* ---------- the 2 door cabinet ---------- */

function cabinet(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xo = W / 2, yT = H - TT; // the legs stand to the underside of the top
  const BAR = 43; // the square posts behind the front legs
  const YB = 130; // the side panels, the posts and the bottom stop this far off the floor
  const xpi = xo - PX; // the legs' inside edges
  const xsi = xpi + BAR, xs = xsi + T / 2; // the side panels' inside faces and centres, flush inside with the posts
  const zpf = D / 2 - PZ; // the front legs' back faces (the back legs' front faces at -zpf)
  const zbar = zpf - BAR; // the posts' back faces
  const zDb = D / 2 - 2 - DF; // the doors' back faces; the doors sit between the front legs
  const zk = -D / 2 + 8; // the back panels' back faces, in grooves in the back legs
  const ysh = Math.round((YB + T + yT) / 2); // the fixed shelf
  const dw = xpi - 2 - 1.5, dh = yT - 2 - (YB + 2);
  const notched = (y: number) =>
    boxes([
      { min: [-xsi, y - T / 2, -zpf], max: [xsi, y + T / 2, zbar] },
      { min: [-xpi, y - T / 2, zbar], max: [xpi, y + T / 2, zpf] },
    ]);
  const sh = notched(ysh), bt = notched(YB + T / 2);
  const leg = (id: string, label: string, name: string, sx: number, sz: number): CustomPart => ({ id, label, name, size: [PX, yT, PZ], pos: [sx * (xo - PX / 2), yT / 2, sz * (zpf + PZ / 2)] });
  const parts: CustomPart[] = [
    leg("P5", "5", "Front left leg", -1, 1),
    leg("P7", "7", "Back left leg", -1, -1),
    { id: "S4", label: "4", name: "Left side panel", size: [T, yT - YB, 2 * zpf], pos: [-xs, (YB + yT) / 2, 0] },
    { id: "P10L", label: "10", name: "Post", size: [BAR, yT - YB, BAR], pos: [-(xpi + BAR / 2), (YB + yT) / 2, zpf - BAR / 2] },
    { id: "SH2", label: "2", name: "Shelf", ...sh },
    { id: "BT3", label: "3", name: "Bottom", ...bt },
    { id: "BK13", label: "13", name: "Lower back panel", size: [2 * xpi + 10, ysh - YB, 3], pos: [0, (YB + ysh) / 2, zk + 1.5], material: "fiber" },
    leg("P6", "6", "Front right leg", 1, 1),
    leg("P8", "8", "Back right leg", 1, -1),
    { id: "S14", label: "14", name: "Right side panel", size: [T, yT - YB, 2 * zpf], pos: [xs, (YB + yT) / 2, 0] },
    { id: "P10R", label: "10", name: "Post", size: [BAR, yT - YB, BAR], pos: [xpi + BAR / 2, (YB + yT) / 2, zpf - BAR / 2] },
    { id: "BK15", label: "15", name: "Upper back panel", size: [2 * xpi + 10, yT + 5 - ysh, 3], pos: [0, (ysh + yT + 5) / 2, zk + 1.5], material: "fiber" },
    { id: "T1", label: "1", name: "Top", size: [W, TT, D], pos: [0, H - TT / 2, 0] },
    { id: "R9", label: "9", name: "Rail", size: [2 * xpi - 4, 30, T], pos: [0, yT - 15, zDb - 2 - T / 2] },
    { id: "D11", label: "11", name: "Left door", size: [dw, dh, DF], pos: [-(1.5 + dw / 2), YB + 2 + dh / 2, zDb + DF / 2] },
    { id: "D12", label: "12", name: "Right door", size: [dw, dh, DF], pos: [1.5 + dw / 2, YB + 2 + dh / 2, zDb + DF / 2] },
  ];

  const HINGE = { kind: "hinge", len: 50, dia: 35 } as const; // F
  const HINGE_SCREW = { kind: "screw", len: 14, dia: 4 } as const; // G
  const BLOCK = { kind: "angle", len: 16, dia: 20, name: "Corner block" } as const; // H
  const BLOCK_SCREW = { kind: "screw", len: 16, dia: 3 } as const; // I
  const POST_SCREW = { kind: "screw", len: 55, dia: 4 } as const; // J
  const panel = (sx: number) => (sx < 0 ? "S4" : "S14");
  const post = (sx: number) => (sx < 0 ? "P10L" : "P10R");
  const front = (sx: number) => (sx < 0 ? "P5" : "P6");
  const back = (sx: number) => (sx < 0 ? "P7" : "P8");
  const yLeg = [YB + 70, yT - 70]; // cam bolts in the legs for the side panels; their dowels between
  const yLegD = [YB + 190, yT - 190];
  const zIn = [-130, 90]; // cam bolts for the shelf and the bottom, clear of the notches
  const zInD = [-60, 40];
  const zTop = [-110, 110];
  const bracketX = [-W / 4 - 20, W / 4 + 20];
  const legX = (sx: number) => sx * (xo - PX / 2);
  const right = ["P6", "P8", "S14", "P10R"];
  const lie = "+x" as const; // on its left side
  // the shelf and the bottom: cam locks near their ends, dowels in their end edges
  const inCams = (sx: number): CustomFix[] => [
    fx({ ...CAM, at: zIn.map((z): Vec3 => [sx * (xsi - 25), YB + T, z]), dir: [0, -1, 0], on: "BT3" }),
    fx({ ...CAM, at: zIn.map((z): Vec3 => [sx * (xsi - 25), ysh - T / 2, z]), dir: [0, 1, 0], on: "SH2" }),
  ];
  const inDowels = (sx: number): CustomFix[] => [
    fx({ ...DOWEL, at: zInD.map((z): Vec3 => [sx * xsi, YB + T / 2, z]), dir: [-sx, 0, 0], on: "BT3", mate: panel(sx) }),
    fx({ ...DOWEL, at: zInD.map((z): Vec3 => [sx * xsi, ysh, z]), dir: [-sx, 0, 0], on: "SH2", mate: panel(sx) }),
  ];
  const hy = [YB + 2 + 100, yT - 2 - 100];
  const doors = [
    { id: "D11", sx: -1, cx: -(xpi - 2) + 22 },
    { id: "D12", sx: 1, cx: xpi - 2 - 22 },
  ];
  const steps: CustomStep[] = [
    {
      title: "Fit the top's rail and cam bolts, and the legs' cam bolts",
      detail: "Lay the top (1) face down. Two dowels (C) and two screws (D) fix the rail (9) along its front edge, four cam bolts (A) go in over the side panels and the two wall brackets (M) at the back edge, one screw (L) each. Turn two cam bolts (A) into each leg (5 to 8).",
      wait: ["T1", "R9", "P5", "P6", "P7", "P8"],
      from: { ...offset(["T1", "R9"], [0, 0, -OUT]), ...offset(["P5", "P6", "P7", "P8"]) },
      fix: [
        fx({ ...DOWEL, at: [-150, 150].map((x): Vec3 => [x, yT, zDb - 2 - T / 2]), dir: [0, -1, 0], on: "R9", mate: "T1" }),
        fx({ ...SCREW_35, at: [-280, 280].map((x): Vec3 => [x, yT - 30, zDb - 2 - T / 2]), dir: [0, 1, 0], on: "R9", mate: "T1" }),
        fx({ ...CAM_BOLT, at: SX.flatMap((sx) => zTop.map((z): Vec3 => [sx * xs, yT, z])), dir: [0, 1, 0], on: "T1" }),
        fx({ ...WALL_BRACKET, at: bracketX.map((x): Vec3 => [x, yT, zk + 12]), dir: [0, 1, 0], on: "T1" }),
        fx({ ...SCREW_12, at: bracketX.map((x): Vec3 => [x, yT, zk + 40]), dir: [0, 1, 0], on: "T1" }),
        ...SX.flatMap((sx) => [
          fx({ ...CAM_BOLT, at: yLeg.map((y): Vec3 => [sx * xs, y, zpf]), dir: [0, 0, 1], on: front(sx), mate: panel(sx) }),
          fx({ ...CAM_BOLT, at: yLeg.map((y): Vec3 => [sx * xs, y, -zpf]), dir: [0, 0, -1], on: back(sx), mate: panel(sx) }),
        ]),
      ],
      pose: lie,
      warnings: ["floor"],
    },
    {
      title: "Join each side panel to its legs",
      detail: "Two dowels (C) into each edge of the side panels (4 and 14). Push the left panel between its front leg (5) and back leg (7), the right one between legs 6 and 8, and turn four cam locks (B) in each panel.",
      add: ["P5", "P7", "S4"],
      wait: ["S14"],
      from: { ...offset(["P5", "P7", "S4"], [400, 0, 0]), S14: [0, 0, OUT] },
      fix: SX.flatMap((sx) => [
        fx({ ...DOWEL, at: yLegD.map((y): Vec3 => [sx * xs, y, zpf]), dir: [0, 0, -1], on: panel(sx), mate: front(sx) }),
        fx({ ...DOWEL, at: yLegD.map((y): Vec3 => [sx * xs, y, -zpf]), dir: [0, 0, 1], on: panel(sx), mate: back(sx) }),
        fx({ ...CAM, at: yLeg.flatMap((y) => [-1, 1].map((sz): Vec3 => [sx * xsi, y, sz * (zpf - 25)])), dir: [sx, 0, 0], on: panel(sx) }),
      ]),
      pose: lie,
    },
    {
      title: "Screw a post behind each front leg",
      detail: "Two large dowels (E) into the front leg, then lay the post (10) against it, inside the side panel, and drive three long screws (J) through the post into the leg.",
      add: ["P10L"],
      wait: ["P10R"],
      from: { P10L: [400, 0, 0], P10R: [0, 0, OUT] },
      fix: SX.flatMap((sx) => [
        fx({ ...BIG_DOWEL, at: [YB + 120, yT - 120].map((y): Vec3 => [sx * (xpi + BAR / 2), y, zpf]), dir: [0, 0, 1], on: front(sx), mate: post(sx) }),
        fx({ ...POST_SCREW, at: [YB + 50, ysh, yT - 50].map((y): Vec3 => [sx * (xpi + BAR / 2), y, zbar]), dir: [0, 0, 1], on: post(sx), mate: front(sx) }),
      ]),
      pose: lie,
    },
    {
      title: "Turn in the cam bolts for the shelf and the bottom",
      detail: "Four cam bolts (A) into the inside of each side panel: two near its lower edge for the bottom, two halfway up for the shelf.",
      fix: SX.flatMap((sx) => [
        fx({ ...CAM_BOLT, at: zIn.map((z): Vec3 => [sx * xsi, YB + T / 2, z]), dir: [sx, 0, 0], on: panel(sx), mate: "BT3" }),
        fx({ ...CAM_BOLT, at: zIn.map((z): Vec3 => [sx * xsi, ysh, z]), dir: [sx, 0, 0], on: panel(sx), mate: "SH2" }),
      ]),
      pose: lie,
    },
    {
      title: "Stand the shelf and the bottom on the left frame",
      detail: "Lay the left frame down, inside up. Push two dowels (C) into the end of the shelf (2) and of the bottom (3), stand them on the side panel, notches to the front, and turn two cam locks (B) in each.",
      add: ["SH2", "BT3"],
      fix: [...inDowels(-1), ...inCams(-1)],
      from: offset(["SH2", "BT3"], [400, 0, 0]),
      pose: lie,
    },
    {
      title: "Slide in the lower back panel",
      detail: "Smooth side in, down the groove in the back leg, between the bottom and the shelf.",
      add: ["BK13"],
      from: { BK13: [500, 0, 0] },
      pose: lie,
    },
    {
      title: "Lay the right frame on top",
      detail: "Two dowels (C) into the other ends of the shelf and the bottom. Lower the right frame onto them, the back panel in its back leg's groove, and turn the four cam locks (B).",
      add: right,
      fix: [...inDowels(1), ...inCams(1)],
      from: offset(right, [500, 0, 0]),
      pose: lie,
      check: "square",
    },
    {
      title: "Fit the angle brackets and the felt pads",
      detail: "An angle bracket (K) in the corner at each leg, under the bottom, two screws (L) each: one into the leg, one up into the panel above it. Stick a felt pad (O) under each leg.",
      fix: [
        fx({ ...ANGLE, at: SX.map((sx): Vec3 => [sx * (xpi + BAR / 2), YB, -(zpf - 12)]), dir: [0, 1, 0], on: "BT3" }),
        fx({ ...ANGLE, at: SX.map((sx): Vec3 => [sx * (xpi + BAR / 2), YB, zpf - 12]), dir: [0, 1, 0], on: "P10L" }),
        fx({ ...SCREW_12, at: SX.map((sx): Vec3 => [sx * (xpi + BAR / 2), YB, -(zpf - 28)]), dir: [0, 1, 0], on: "BT3" }),
        ...SX.map((sx) => fx({ ...SCREW_12, at: [[sx * (xpi + BAR / 2), YB, zpf - 28]], dir: [0, 1, 0], on: post(sx) })),
        ...SX.map((sx) => fx({ ...SCREW_12, at: [[sx * (xpi + BAR / 2), YB - 16, -zpf]], dir: [0, 0, -1], on: back(sx) })),
        ...SX.map((sx) => fx({ ...SCREW_12, at: [[sx * (xpi + BAR / 2), YB - 16, zpf]], dir: [0, 0, 1], on: front(sx) })),
        ...SX.flatMap((sx) => [front(sx), back(sx)].map((id, j) => fx({ ...PAD, at: [[legX(sx), 0, (j ? -1 : 1) * (zpf + PZ / 2)]], dir: [0, 1, 0], on: id }))),
      ],
      pose: lie,
    },
    {
      title: "Stand it up and slide in the upper back panel",
      detail: "Smooth side in, down the grooves in the back legs until it sits on the lower panel.",
      add: ["BK15"],
      from: { BK15: [0, 600, 0] },
      pose: "+y",
    },
    {
      title: "Lower the top on",
      detail: "Two dowels (C) into the top edge of each side panel and two large dowels (E) into the top of each leg, then lower the top onto them.",
      add: ["T1", "R9"],
      fix: [
        ...SX.map((sx) => fx({ ...DOWEL, at: [-40, 40].map((z): Vec3 => [sx * xs, yT, z]), dir: [0, -1, 0], on: panel(sx), mate: "T1" })),
        ...SX.flatMap((sx) => [front(sx), back(sx)].map((id, j) => fx({ ...BIG_DOWEL, at: [-20, 20].map((k): Vec3 => [legX(sx) + k, yT, (j ? -1 : 1) * (zpf + PZ / 2)]), dir: [0, -1, 0], on: id, mate: "T1" }))),
      ],
      from: offset(["T1", "R9"], [0, 400, 0]),
    },
    {
      title: "Lock the top",
      detail: "Turn four cam locks (B) in the side panels, under the top's cam bolts.",
      fix: SX.map((sx) => fx({ ...CAM, at: zTop.map((z): Vec3 => [sx * xsi, yT - 25, z]), dir: [sx, 0, 0], on: panel(sx) })),
    },
    {
      title: "Hold the back panels with the corner blocks",
      detail: "Push a corner block (H) into each corner of both back panels, against the back leg, and fix it with a screw (I).",
      fix: [
        ...[
          { id: "BK13", ys: [YB + T + 25, ysh - 25] },
          { id: "BK15", ys: [ysh + 25, yT - 25] },
        ].flatMap((b) => [
          ...SX.map((sx) => fx({ ...BLOCK, at: b.ys.map((y): Vec3 => [sx * (xpi - 12), y, zk + 13]), dir: [0, 0, -1], on: b.id })),
          ...SX.map((sx) => fx({ ...BLOCK_SCREW, at: b.ys.map((y): Vec3 => [sx * xpi, y, zk + 7]), dir: [sx, 0, 0], on: back(sx) })),
        ]),
      ],
    },
    {
      title: "Screw the hinges onto the doors",
      detail: "Lay both doors (11 and 12) face down on a rug and press a hinge (F) into each cup hole, two screws (G) each.",
      wait: ["D11", "D12"],
      from: offset(["D11", "D12"]),
      fix: doors.flatMap((d) => [
        fx({ ...HINGE, at: hy.map((y): Vec3 => [d.cx, y, zDb]), dir: [0, 0, 1], on: d.id, ...(d.sx > 0 ? { twist: Math.PI } : {}) }),
        fx({ ...HINGE_SCREW, at: hy.flatMap((y) => [-12, 12].map((k): Vec3 => [d.cx - d.sx * 24, y + k, zDb])), dir: [0, 0, 1], on: d.id }),
      ]),
      warnings: ["floor"],
      kind: "hinges",
    },
    {
      title: "Hang the doors",
      detail: "Hold each door between the front legs and screw its hinge plates to the post behind the leg, four screws (G) each: the left door (11) on the left, the right door (12) on the right.",
      add: ["D11", "D12"],
      fix: doors.map((d) => fx({ ...HINGE_SCREW, at: hy.flatMap((y) => [-16, 16].flatMap((k) => [zDb - 20, zDb - 37].map((z): Vec3 => [d.sx * xpi, y + k, z]))), dir: [d.sx, 0, 0], on: post(d.sx), mate: d.id })),
      from: offset(["D11", "D12"]),
      kind: "doors",
    },
    {
      title: "Fix it to the wall",
      detail: "Push it against the wall and mark through the two wall brackets, then drill, push in the wall plugs (N) and drive a screw (D) through each bracket into its plug. Check the wall for pipes and cables first.",
      fix: [
        fx({ ...PLUG, at: bracketX.map((x): Vec3 => [x, yT - 30, -D / 2 - 1]), dir: [0, 0, -1] }),
        fx({ ...SCREW_35, included: true, at: bracketX.map((x): Vec3 => [x, yT - 30, zk + 3]), dir: [0, 0, -1], on: "BK15" }),
      ],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

/* ---------- the 2 drawer hall table ---------- */

function hallTable(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xo = W / 2, yT = H - TT;
  const xpi = xo - PX; // the legs' inside edges, in line with the runner blocks
  const REC = 22; // the end panels and end rails sit this far in from the outside
  const xei = xo - REC - T, xe = xei + T / 2; // their inside faces and centres
  const zpf = D / 2 - PZ;
  const yH = yT - 145, yHt = yH + T; // the drawer section's bottom
  const BLK = 40; // the runner blocks on the end panels
  const zk4 = -D / 2 + 3; // the drawer section's back, between the back legs
  const zFb = D / 2 - DF; // the drawer fronts' back faces; the fronts sit between the front legs
  const yR = [105, 145]; // the low rails; the shelf's top is flush with theirs
  const zRun = zFb - 5 - 125; // runners' centres
  const yRun = yHt + BLK / 2;
  const leg = (id: string, label: string, name: string, sx: number, sz: number): CustomPart => ({ id, label, name, size: [PX, yT, PZ], pos: [sx * (xo - PX / 2), yT / 2, sz * (zpf + PZ / 2)] });
  const endPanel = (sx: number) =>
    boxes([
      { min: [sx < 0 ? -(xei + T) : xei, yH, -zpf], max: [sx < 0 ? -xei : xei + T, yT, zpf] },
      { min: [sx < 0 ? -xei : xpi, yHt, -zpf], max: [sx < 0 ? -xpi : xei, yHt + BLK, zpf] },
    ]);
  const plus = (y0: number, y1: number, zIn: number, zMid: [number, number]) =>
    boxes([
      { min: [-xei, y0, -zIn], max: [xei, y1, zIn] },
      { min: [-xpi, y0, zMid[0]], max: [xpi, y1, zMid[1]] },
    ]);
  const dh = (zFb - (zk4 + T));
  // the drawers: a bay either side of the divider
  const bayX = [-(xpi + T / 2) / 2, (xpi + T / 2) / 2];
  const DD = 240, shD = 85, dy = yHt + 8;
  const xs = (xpi - T / 2) / 2 - 12.5 - 7.5; // drawer sides' centres from the bay's middle
  const zb = zFb - DD, zc = zFb - DD / 2;
  const fw = xpi - 2 - 1.5, fh = yT - 2 - (yH + 2);
  const dr = [0, 1].map((i) => ({ i, cx: bayX[i], f: `F${15 + i}`, sl: `DL${i}`, sr: `DR${i}`, bk: `DB${i}`, bt: `DT${i}` }));
  const drawerIds = (d: (typeof dr)[number]) => [d.f, d.sl, d.sr, d.bk, d.bt];

  const parts: CustomPart[] = [
    leg("P10", "10", "Front right leg", 1, 1),
    leg("P12", "12", "Back right leg", 1, -1),
    { id: "E7", label: "7", name: "Right end panel", ...endPanel(1) },
    { id: "N14R", label: "14", name: "End rail", size: [T, yR[1] - yR[0], 2 * zpf], pos: [xe, (yR[0] + yR[1]) / 2, 0] },
    { id: "H2", label: "2", name: "Drawer section bottom", ...plus(yH, yHt, zpf, [zk4, zFb]) },
    { id: "H4", label: "4", name: "Drawer section back", size: [2 * xpi, yT - yHt, T], pos: [0, (yHt + yT) / 2, zk4 + T / 2] },
    { id: "H8", label: "8", name: "Divider", size: [T, yT - yHt, dh], pos: [0, (yHt + yT) / 2, zk4 + T + dh / 2] },
    leg("P9", "9", "Front left leg", -1, 1),
    leg("P11", "11", "Back left leg", -1, -1),
    { id: "E6", label: "6", name: "Left end panel", ...endPanel(-1) },
    { id: "N14L", label: "14", name: "End rail", size: [T, yR[1] - yR[0], 2 * zpf], pos: [-xe, (yR[0] + yR[1]) / 2, 0] },
    { id: "R13F", label: "13", name: "Long rail", size: [2 * xpi, yR[1] - yR[0], T], pos: [0, (yR[0] + yR[1]) / 2, D / 2 - T / 2] },
    { id: "R13B", label: "13", name: "Long rail", size: [2 * xpi, yR[1] - yR[0], T], pos: [0, (yR[0] + yR[1]) / 2, -(D / 2 - T / 2)] },
    { id: "SH3", label: "3", name: "Shelf", ...plus(yR[1] - T, yR[1], zpf, [-(D / 2 - T), D / 2 - T]) },
    { id: "T1", label: "1", name: "Top", size: [W, TT, D], pos: [0, H - TT / 2, 0] },
    { id: "R5", label: "5", name: "Rail", size: [2 * xpi - 4, 30, T], pos: [0, yT - 15, zFb - 2 - T / 2] },
    ...dr.flatMap((d): CustomPart[] => [
      { id: d.f, label: String(15 + d.i), name: d.i ? "Right drawer front" : "Left drawer front", size: [fw, fh, DF], pos: [(d.i ? 1 : -1) * (1.5 + fw / 2), yH + 2 + fh / 2, zFb + DF / 2] },
      { id: d.sl, label: "17", name: "Left drawer side", size: [15, shD, DD], pos: [d.cx - xs, dy + shD / 2, zc] },
      { id: d.sr, label: "18", name: "Right drawer side", size: [15, shD, DD], pos: [d.cx + xs, dy + shD / 2, zc] },
      { id: d.bk, label: "19", name: "Drawer back", size: [2 * xs - 15, shD, 15], pos: [d.cx, dy + shD / 2, zb + 7.5] },
      { id: d.bt, label: "20", name: "Drawer bottom", size: [2 * xs - 15 + 16, 3, DD - 1], pos: [d.cx, dy + 10, (zb + 7 + zFb + 6) / 2], material: "fiber" },
    ]),
  ];

  const SMALL = { kind: "screw", len: 12, dia: 3 } as const; // F
  const LONG_BOLT = { kind: "bolt", len: 100, dia: 7 } as const; // G
  const NUT = { kind: "nut", len: 10, dia: 10, name: "Barrel nut" } as const; // H
  const runner = (name: string) => ({ kind: "runner", len: 250, dia: 30, name }) as const;
  const CL = runner("Cabinet runner, left"), CR = runner("Cabinet runner, right");
  const DL = runner("Drawer runner, left"), DR = runner("Drawer runner, right");
  const end = (sx: number) => (sx < 0 ? "E6" : "E7");
  const endRail = (sx: number) => (sx < 0 ? "N14L" : "N14R");
  const front = (sx: number) => (sx < 0 ? "P9" : "P10");
  const back = (sx: number) => (sx < 0 ? "P11" : "P12");
  const legX = (sx: number) => sx * (xo - PX / 2);
  const yEnd = [yT - 75, yT - 25]; // the end panels' cam bolts, above the runner block
  const runScrews = [-95, 15, 95];
  const zTopEnd = [-40, 40]; // the top's cam bolts over the end panels
  const xBack = [-250, 250]; // ... and over the back
  const yBolt = [yHt + 50, yHt + 80]; // the long bolts through the back legs into the back
  const wallX = bayX;
  const leftFrame = ["P9", "P11", "E6", "N14L"];
  const rightFrame = ["P10", "P12", "E7", "N14R"];
  const section = ["H2", "H4", "H8"];
  const lie = "-x" as const; // on its right side, as the manual lays it
  const up: Vec3 = [-400, 0, 0]; // from above, lying that way

  // the drawer section's end: cam locks in the bottom for the end panel's bolts, dowels into the leg and the end panel,
  // and long bolts through the back leg into barrel nuts in the back
  const sectionEnd = (sx: number): CustomFix[] => [
    fx({ ...CAM, at: [-70, 70].map((z): Vec3 => [sx * (xei - 25), yHt, z]), dir: [0, -1, 0], on: "H2" }),
    fx({ ...DOWEL, at: [yHt + 20, yT - 20].map((y): Vec3 => [sx * xpi, y, zk4 + T / 2]), dir: [-sx, 0, 0], on: "H4", mate: back(sx) }),
    fx({ ...DOWEL, at: [-20, 20].map((z): Vec3 => [sx * xei, yH + T / 2, z]), dir: [-sx, 0, 0], on: "H2", mate: end(sx) }),
    fx({ ...LONG_BOLT, at: yBolt.map((y): Vec3 => [sx * xo, y, zk4 + T / 2]), dir: [-sx, 0, 0], on: back(sx), mate: "H4" }),
    fx({ ...NUT, at: yBolt.map((y): Vec3 => [sx * (xpi - 20), y, zk4 + T]), dir: [0, 0, -1], on: "H4" }),
  ];
  const railEnds = (sx: number): CustomFix[] =>
    [1, -1].flatMap((sz) => [
      fx({ ...LONG_BOLT, at: [[sx * xo, (yR[0] + yR[1]) / 2, sz * (D / 2 - T / 2)]], dir: [-sx, 0, 0], on: sz > 0 ? front(sx) : back(sx), mate: sz > 0 ? "R13F" : "R13B" }),
      fx({ ...NUT, at: [[sx * (xpi - 20), yR[1], sz * (D / 2 - T / 2)]], dir: [0, -1, 0], on: sz > 0 ? "R13F" : "R13B" }),
    ]);
  const ys = [dy + 22, dy + shD - 22]; // the drawers' cam bolts and back screws
  const drawerFront = (d: (typeof dr)[number]): CustomFix[] => [
    fx({ ...CAM_BOLT, at: [-1, 1].flatMap((g) => ys.map((y): Vec3 => [d.cx + g * xs, y, zFb])), dir: [0, 0, 1], on: d.f }),
    ...[-1, 1].map((g) => fx({ ...CAM, at: ys.map((y): Vec3 => [d.cx + g * (xs - 7.5), y, zFb - 25]), dir: [g, 0, 0], on: g < 0 ? d.sl : d.sr })),
  ];
  const drawerBack = (d: (typeof dr)[number]): CustomFix[] => [
    ...[-1, 1].map((g) => fx({ ...SCREW_35, at: ys.map((y): Vec3 => [d.cx + g * (xs + 7.5), y, zb + 7.5]), dir: [-g, 0, 0], on: g < 0 ? d.sl : d.sr, mate: d.bk })),
    ...[-1, 1].flatMap((g) => [
      fx({ ...(g < 0 ? DL : DR), at: [[d.cx + g * (xs + 7.5), yRun, zc]], dir: [-g, 0, 0], on: g < 0 ? d.sl : d.sr }),
      fx({ ...SMALL, at: runScrews.map((k): Vec3 => [d.cx + g * (xs + 7.5), yRun, zc + k]), dir: [-g, 0, 0], on: g < 0 ? d.sl : d.sr }),
    ]),
  ];
  const cabRunner = (def: typeof CL, x: number, dir: number, on: string): CustomFix[] => [
    fx({ ...def, at: [[x, yRun, zRun]], dir: [dir, 0, 0], on }),
    fx({ ...SMALL, at: runScrews.map((k): Vec3 => [x, yRun, zRun + k]), dir: [dir, 0, 0], on }),
  ];

  const steps: CustomStep[] = [
    {
      title: "Fit the top's rail and cam bolts, and the legs' cam bolts",
      detail: "Lay the top (1) face down. Two dowels (C) and two screws (D) fix the rail (5) along its front edge, then turn in eight cam bolts (A): two over each end panel, the divider and the back. Three cam bolts (A) go into each leg (9 to 12).",
      wait: ["T1", "R5", "P9", "P10", "P11", "P12"],
      from: { ...offset(["T1", "R5"], [0, 0, -OUT]), ...offset(["P9", "P10", "P11", "P12"]) },
      fix: [
        fx({ ...DOWEL, at: [-150, 150].map((x): Vec3 => [x, yT, zFb - 2 - T / 2]), dir: [0, -1, 0], on: "R5", mate: "T1" }),
        fx({ ...SCREW_35, at: [-300, 300].map((x): Vec3 => [x, yT - 30, zFb - 2 - T / 2]), dir: [0, 1, 0], on: "R5", mate: "T1" }),
        fx({
          ...CAM_BOLT,
          at: [...SX.flatMap((sx) => zTopEnd.map((z): Vec3 => [sx * xe, yT, z])), ...[-60, 60].map((z): Vec3 => [0, yT, z]), ...xBack.map((x): Vec3 => [x, yT, zk4 + T / 2])],
          dir: [0, 1, 0],
          on: "T1",
        }),
        ...SX.flatMap((sx) => [
          fx({ ...CAM_BOLT, at: [...yEnd.map((y): Vec3 => [sx * xe, y, zpf]), [sx * xe, (yR[0] + yR[1]) / 2, zpf]], dir: [0, 0, 1], on: front(sx) }),
          fx({ ...CAM_BOLT, at: [...yEnd.map((y): Vec3 => [sx * xe, y, -zpf]), [sx * xe, (yR[0] + yR[1]) / 2, -zpf]], dir: [0, 0, -1], on: back(sx) }),
        ]),
      ],
      pose: lie,
      warnings: ["floor"],
    },
    {
      title: "Screw on the runners",
      detail: "A left cabinet runner (CL) on the block of the left end panel (6) and a right one (CR) on the right end panel (7), with two cam bolts (A) in each panel under its block. On the divider (8), a right runner (CR) on one face, then turn it over for a left runner (CL) on the other. Three small screws (F) each.",
      wait: ["E6", "E7", "H8"],
      from: { ...offset(["E6", "E7"]), H8: [0, 0, 1.6 * OUT] },
      fix: [
        ...SX.map((sx) => fx({ ...CAM_BOLT, at: [-70, 70].map((z): Vec3 => [sx * xei, yH + T / 2, z]), dir: [sx, 0, 0], on: end(sx), mate: "H2" })),
        ...cabRunner(CL, -xpi, -1, "E6"),
        ...cabRunner(CR, xpi, 1, "E7"),
        ...cabRunner(CR, -T / 2, 1, "H8"),
        ...cabRunner(CL, T / 2, -1, "H8"),
      ],
      pose: lie,
      kind: "runners",
    },
    {
      title: "Build the two end frames",
      detail: "Push a dowel (C) into each edge of the end panels. Fit the left end panel (6) and an end rail (14) between legs 9 and 11, the right ones between legs 10 and 12, and turn the cam locks (B): two at each end of a panel, one at each end of a rail.",
      add: rightFrame,
      wait: ["E6", "N14L"],
      from: { ...offset(rightFrame, up), N14L: [0, 0, OUT] },
      fix: SX.flatMap((sx) => [
        ...[1, -1].map((sz) => fx({ ...DOWEL, at: [[sx * xe, (yEnd[0] + yEnd[1]) / 2, sz * zpf]], dir: [0, 0, -sz], on: end(sx), mate: sz > 0 ? front(sx) : back(sx) })),
        fx({ ...CAM, at: yEnd.flatMap((y) => [-1, 1].map((sz): Vec3 => [sx * xei, y, sz * (zpf - 25)])), dir: [sx, 0, 0], on: end(sx) }),
        fx({ ...CAM, at: [-1, 1].map((sz): Vec3 => [sx * xei, (yR[0] + yR[1]) / 2, sz * (zpf - 25)]), dir: [sx, 0, 0], on: endRail(sx) }),
      ]),
      pose: lie,
    },
    {
      title: "Build the drawer section",
      detail: "Lay the back (4) down and stand the divider (8) on it, two dowels (C) each where they meet the bottom (2). Put the bottom on and drive four screws (D) through it: two into the divider, two into the back.",
      wait: ["H2", "H4"],
      from: { ...offset(["H2", "H4"], [0, 0, 1.6 * OUT]) },
      fix: [
        fx({ ...DOWEL, at: [-60, 60].map((z): Vec3 => [0, yHt, z]), dir: [0, 1, 0], on: "H8", mate: "H2" }),
        fx({ ...DOWEL, at: [-200, 200].map((x): Vec3 => [x, yHt, zk4 + T / 2]), dir: [0, 1, 0], on: "H4", mate: "H2" }),
        fx({ ...SCREW_35, at: [-100, 100].map((z): Vec3 => [0, yH, z]), dir: [0, 1, 0], on: "H2", mate: "H8" }),
        fx({ ...SCREW_35, at: [-320, 320].map((x): Vec3 => [x, yH, zk4 + T / 2]), dir: [0, 1, 0], on: "H2", mate: "H4" }),
      ],
      pose: lie,
    },
    {
      title: "Bolt the drawer section to the right frame",
      detail: "Two dowels (C) into the right end of the back and two into the bottom, and two barrel nuts (H) into the back. Set the section on the right frame, turn two cam locks (B) in the bottom and drive two long bolts (G) through the back leg into the nuts with the hex key (I).",
      add: section,
      fix: sectionEnd(1),
      from: offset(section, up),
      tools: ["allen"],
      pose: lie,
    },
    {
      title: "Fit the left frame and the long rails",
      detail: "The same at the left end: dowels (C), barrel nuts (H) and cam locks (B), with the left frame laid on. Put a barrel nut (H) into each end of the two long rails (13), hold them between the legs at the bottom and bolt all four ends through the legs (G).",
      add: [...leftFrame, "R13F", "R13B"],
      fix: [...sectionEnd(-1), ...railEnds(1), ...railEnds(-1)],
      from: { ...offset(leftFrame, up), R13F: [0, 0, 300], R13B: [0, 0, -300] },
      tools: ["allen"],
      pose: lie,
      check: "square",
    },
    {
      title: "Fit the shelf",
      detail: "Push four dowels (C) into each long edge of the shelf (3), set it between the long rails, notches round the legs, and drive four screws (D) through each rail into it.",
      add: ["SH3"],
      fix: [1, -1].flatMap((sz) => [
        fx({ ...DOWEL, at: [-360, -120, 120, 360].map((x): Vec3 => [x, yR[1] - T / 2, sz * (D / 2 - T)]), dir: [0, 0, -sz], on: "SH3", mate: sz > 0 ? "R13F" : "R13B" }),
        fx({ ...SCREW_35, at: [-300, -60, 60, 300].map((x): Vec3 => [x, yR[1] - T / 2, sz * D / 2]), dir: [0, 0, -sz], on: sz > 0 ? "R13F" : "R13B", mate: "SH3" }),
      ]),
      from: { SH3: [0, -300, 0] },
      pose: lie,
    },
    {
      title: "Fit the angle brackets, wall brackets and felt pads",
      detail: "An angle bracket (J) where each end rail meets a leg, two screws (K) each. Screw a wall bracket (L) inside the back of each drawer bay with one screw (K), and stick a felt pad (N) under each leg.",
      fix: [
        ...SX.flatMap((sx) => [1, -1].flatMap((sz) => [
          fx({ ...ANGLE, at: [[sx * (xei - 10), yR[0] + 10, sz * (zpf - 10)]], dir: [0, 0, sz], on: endRail(sx) }),
          fx({ ...SCREW_12, at: [[sx * xei, yR[0] + 10, sz * (zpf - 22)]], dir: [sx, 0, 0], on: endRail(sx) }),
          fx({ ...SCREW_12, at: [[sx * (xei - 22), yR[0] + 10, sz * zpf]], dir: [0, 0, sz], on: sz > 0 ? front(sx) : back(sx) }),
        ])),
        fx({ ...WALL_BRACKET, at: wallX.map((x): Vec3 => [x, yT - 30, zk4 + T]), dir: [0, 0, -1], on: "H4" }),
        fx({ ...SCREW_12, at: wallX.map((x): Vec3 => [x, yT - 12, zk4 + T]), dir: [0, 0, -1], on: "H4" }),
        ...SX.flatMap((sx) => [front(sx), back(sx)].map((id, j) => fx({ ...PAD, at: [[legX(sx), 0, (j ? -1 : 1) * (zpf + PZ / 2)]], dir: [0, 1, 0], on: id }))),
      ],
      pose: lie,
    },
    {
      title: "Stand it up and lower the top on",
      detail: "Two dowels (C) into the top edges of each end panel, the divider and the back, and two large dowels (E) into the top of each leg, then lower the top onto them.",
      add: ["T1", "R5"],
      fix: [
        ...SX.map((sx) => fx({ ...DOWEL, at: [-90, 90].map((z): Vec3 => [sx * xe, yT, z]), dir: [0, -1, 0], on: end(sx), mate: "T1" })),
        fx({ ...DOWEL, at: [-110, 110].map((z): Vec3 => [0, yT, z]), dir: [0, -1, 0], on: "H8", mate: "T1" }),
        fx({ ...DOWEL, at: [-150, 150].map((x): Vec3 => [x, yT, zk4 + T / 2]), dir: [0, -1, 0], on: "H4", mate: "T1" }),
        ...SX.flatMap((sx) => [front(sx), back(sx)].map((id, j) => fx({ ...BIG_DOWEL, at: [-20, 20].map((k): Vec3 => [legX(sx) + k, yT, (j ? -1 : 1) * (zpf + PZ / 2)]), dir: [0, -1, 0], on: id, mate: "T1" }))),
      ],
      from: offset(["T1", "R5"], [0, 400, 0]),
      pose: "+y",
    },
    {
      title: "Lock the top",
      detail: "Turn eight cam locks (B) under the top's cam bolts: two in each end panel, the divider and the back.",
      fix: [
        ...SX.map((sx) => fx({ ...CAM, at: zTopEnd.map((z): Vec3 => [sx * xei, yT - 25, z]), dir: [sx, 0, 0], on: end(sx) })),
        fx({ ...CAM, at: [-60, 60].map((z): Vec3 => [-T / 2, yT - 25, z]), dir: [1, 0, 0], on: "H8" }),
        fx({ ...CAM, at: xBack.map((x): Vec3 => [x, yT - 25, zk4 + T]), dir: [0, 0, -1], on: "H4" }),
      ],
    },
    ...dr.flatMap((d): CustomStep[] => [
      {
        title: `Fix the sides to the ${d.i ? "right" : "left"} drawer front`,
        detail: `Lay the front (${15 + d.i}) face down and turn four cam bolts (A) into it. Push the sides (17 and 18) onto them and turn four cam locks (B), then slide the bottom (20) along the grooves.`,
        fix: drawerFront(d),
        wait: [d.f, d.sl, d.sr, d.bt],
        from: offset(drawerIds(d)),
        kind: "drawer",
        warnings: ["floor"],
      },
      {
        title: "Screw on the back and the runners",
        detail: "Two screws (D) through each side into the back (19). Then the left runner (DL) along the bottom of the left side and the right runner (DR) on the right side, three small screws (F) each.",
        fix: drawerBack(d),
        wait: [d.bk],
        from: offset(drawerIds(d)),
        kind: "drawer",
      },
    ]),
    {
      title: "Fix it to the wall",
      detail: "Push it against the wall and mark through the two wall brackets, then drill, push in the wall plugs (M) and drive a screw (D) through each bracket and the back into its plug. Check the wall for pipes and cables first.",
      fix: [
        fx({ ...PLUG, at: wallX.map((x): Vec3 => [x, yT - 45, -D / 2 - 1]), dir: [0, 0, -1] }),
        fx({ ...SCREW_35, included: true, at: wallX.map((x): Vec3 => [x, yT - 45, zk4 + T]), dir: [0, 0, -1], on: "H4" }),
      ],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
    {
      title: "Slide the drawers in",
      detail: "The front marked 15 goes on the left, 16 on the right. Rest each drawer's runners on the ones in the table and push it home.",
      add: dr.flatMap(drawerIds),
      from: offset(dr.flatMap(drawerIds)),
      kind: "drawer",
    },
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  switch (s.slug) {
    case "kmart-tide-2-door-cabinet":
      return cabinet(s);
    case "kmart-tide-2-drawer-hall-table":
      return hallTable(s);
    default:
      return null;
  }
}

const family: Family = { names: ["KMART:TIDE"], recipe };
export default family;
