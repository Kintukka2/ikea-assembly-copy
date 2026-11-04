import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartMaterial, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's Sadie 6 Drawer Chest, read from its assembly manual (keycode 43633777). A carcass of 15 mm board in two
 * columns of three drawers on runners, standing on two U-shaped base frames and a centre foot, held with cam bolts (A),
 * cam locks (B) and dowels (C):
 *
 * - runners go inside both sides (3, 4) and on both faces of the middle panel (5), with cam bolts in the sides. Lying
 *   on its front, the left side, the middle panel, the back rail (7) and two front rails (6) go together, the front rails
 *   on a double cam bolt (L) and a long dowel (M) through the middle panel; then the right side and the other two
 *   front rails, the back rail screwed to the middle panel with two screws (D).
 * - the top (1) takes six cam bolts and the two wall brackets (G, screws H). Each base frame is two legs (9, 10) and a
 *   rail (11) on cam bolts; both frames and the centre foot (12) are bolted under the bottom (2) with nine bolts (J) and
 *   the Allen key (I), a dowel (O) under the foot. The lower back panel (8) slides in, the bottom with its base goes on
 *   with dowels and six screws, and stood up the upper back (19) slides down and the top goes on.
 * - eight corner blocks (E, screws F) hold the backs, two screws through the brackets go into the wall plugs (N), then
 *   six drawers: cam bolts and dowels in the front (13 on the left, 14 on the right), the sides (16, 15) locked on, the
 *   bottom (18) down the grooves, the brace (20) and the back (17) screwed on, the runners (DL, DR) under the sides.
 *
 * Kmart's hardware list: 48 cam bolts M6 x 35 (A), 52 cam locks 15 x 9 (B), 38 dowels 6 x 30 (C), 46 screws M4 x 35 (D,
 * two of them into the wall), 8 corner blocks (E) with 8 screws M3 x 16 (F), 2 wall brackets (G) with 2 screws M4 x 12
 * (H), 9 bolts M7 x 40 (J), 84 screws M3.5 x 12 (K) for the runners, 2 double cam bolts M7 x 70 (L), 2 long dowels
 * 6 x 50 (M), 2 wall plugs (N), one dowel 8 x 30 (O) and six each of the four runners (CL, CR, DL, DR). Every step's
 * count box adds up to those totals. The guide follows the manual's steps one for one: its drawers are built three at a
 * time, the left column's in steps 15 to 17 and the right column's in steps 18 to 20.
 */

const T = 15; // board
const BK = 3; // hardboard backs and drawer bottoms
const FT = 18; // drawer fronts
const BH = 150; // the base frames, floor to bottom
const LT = 45; // the base legs' square
const RL = 300; // runner length

type Def = Omit<CustomFix, "count" | "at" | "dir" | "on" | "mate">;
const CAM_BOLT: Def = { kind: "camScrew", len: 35, dia: 6, name: "Cam bolt" }; // A
const CAM: Def = { kind: "cam", len: 9, dia: 15, name: "Cam lock" }; // B
const DOWEL: Def = { kind: "dowel", len: 30, dia: 6 }; // C
const SCREW: Def = { kind: "screw", len: 35, dia: 4 }; // D
const BLOCK: Def = { kind: "angle", len: 16, dia: 20, name: "Corner block" }; // E
const BLOCK_SCREW: Def = { kind: "screw", len: 16, dia: 3, name: "Corner block screw" }; // F
const WALL_BRACKET: Def = { kind: "angle", len: 30, dia: 20, name: "Wall bracket" }; // G
const BRACKET_SCREW: Def = { kind: "screw", len: 12, dia: 4, name: "Bracket screw" }; // H
const BASE_BOLT: Def = { kind: "bolt", len: 40, dia: 7, name: "Base bolt" }; // J
const RUNNER_SCREW: Def = { kind: "screw", len: 12, dia: 3.5, name: "Runner screw" }; // K
const DOUBLE_BOLT: Def = { kind: "camScrew", len: 70, dia: 7, name: "Double cam bolt" }; // L
const LONG_DOWEL: Def = { kind: "dowel", len: 50, dia: 6 }; // M
const PLUG: Def = { kind: "plug", len: 30, dia: 6, included: true }; // N
const FOOT_DOWEL: Def = { kind: "dowel", len: 30, dia: 8 }; // O
const runner = (name: string): Def => ({ kind: "runner", len: RL, dia: 20, name }); // CL, CR, DL, DR

/** Fittings at exact points: what, where, the way they go in, the part they sit in and the part their other end meets. */
const fx = (def: Def, at: Vec3[], dir: Vec3, on?: string, mate?: string): CustomFix => ({ ...def, count: at.length, at, dir, ...(on ? { on } : {}), ...(mate ? { mate } : {}) });
const SX = [-1, 1] as const;
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const offset = (ids: string[], v: Vec3) => Object.fromEntries(ids.map((id) => [id, v] as [string, Vec3]));

class Parts {
  list: CustomPart[] = [];
  add(id: string, label: string, name: string, size: Vec3, pos: Vec3, material: PartMaterial = "board") {
    this.list.push({ id, label, name, size, pos, material });
    return id;
  }
}

function chest(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xo = W / 2, xi = W / 2 - T;
  const zB = -D / 2, zF = D / 2;
  const zf = zF - FT; // the rails' and the middle panel's front edges, behind the drawer fronts
  const zk = zB + 10; // the back panels' back face, in grooves 10 mm in from the back edge
  const ys0 = BH + T, ys1 = H - T; // the sides stand on the bottom, under the top
  const ROWS = 3;
  const open = (ys1 - ys0 - (ROWS - 1) * T) / ROWS; // a drawer opening's height, between the rails
  const yr = (i: number) => ys0 + i * (open + T); // the floor of row i, counted from the bottom
  const RD = 80; // the front rails lie flat, this deep
  const zRail = zf - RD / 2;
  const zRailBolt = zf - 20, zRailDowel = zf - 60;
  const y8 = Math.round((ys0 + ys1) / 2), RH = 60; // the back rail, on edge across the middle of the back
  const z7 = zk + T / 2; // its back face is the back panels' back face; they sit in grooves along its edges
  const zMid0 = zk + T; // the middle panel stops in front of the back rail
  const bay = xi - T / 2;
  const cxs = [-(T / 2 + bay / 2), T / 2 + bay / 2];
  // drawers
  const xs = bay / 2 - 12.5 - T / 2; // drawer side centres from the opening's centre, clear of the runners
  const DD = Math.min(330, Math.floor(zf - zMid0 - 6)); // drawer box depth
  const zb = zf - DD;
  const sh = Math.min(120, Math.round(open - 60));
  const ybox = (i: number) => yr(i) + 20;
  const fh = (ys1 - ys0 - (ROWS - 1) * 3) / ROWS; // the fronts cover the rails, 3 mm apart
  const fy0 = (i: number) => ys0 + i * (fh + 3);
  const zrun = zf - 5 - RL / 2;
  const zdr = zrun - 0.15 * (RL / 2); // the drawer runner, beside the cabinet one
  // base
  const lx = xo - 8 - LT / 2, lz = zF - 8 - LT / 2;

  const p = new Parts();
  p.add("T1", "1", "Top", [W, T, D], [0, H - T / 2, 0]);
  p.add("B2", "2", "Bottom", [W, T, D], [0, BH + T / 2, 0]);
  p.add("S3", "3", "Left side", [T, ys1 - ys0, D], [-(xo - T / 2), (ys0 + ys1) / 2, 0]);
  p.add("S4", "4", "Right side", [T, ys1 - ys0, D], [xo - T / 2, (ys0 + ys1) / 2, 0]);
  p.add("M5", "5", "Middle panel", [T, ys1 - ys0, zf - zMid0], [0, (ys0 + ys1) / 2, (zf + zMid0) / 2]);
  const rails: { id: string; c: number; k: number; y: number }[] = [];
  for (let c = 0; c < 2; c++)
    for (let k = 1; k < ROWS; k++) {
      const id = `R6-${c}-${k}`, y = yr(k) - T / 2;
      p.add(id, "6", "Front rail", [bay, T, RD], [cxs[c], y, zRail]);
      rails.push({ id, c, k, y });
    }
  p.add("R7", "7", "Back rail", [2 * xi, RH, T], [0, y8, z7]);
  p.add("K8", "8", "Lower back panel", [2 * xi + 16, y8 - RH / 2 + 5 - (ys0 - 5), BK], [0, (ys0 - 5 + y8 - RH / 2 + 5) / 2, zk + BK / 2], "fiber");
  p.add("K19", "19", "Upper back panel", [2 * xi + 16, ys1 + 5 - (y8 + RH / 2 - 5), BK], [0, (y8 + RH / 2 - 5 + ys1 + 5) / 2, zk + BK / 2], "fiber");
  // the base: two frames, each a leg at the front and the back and a rail along the floor between them. Seen from
  // outside, leg 9 is on the left and leg 10 on the right, so 9 is at the back on the left end and at the front on the right.
  const legs = SX.flatMap((sx) => SX.map((sz) => ({ sx, sz, id: `G${sx < 0 ? "L" : "R"}${sz < 0 ? "B" : "F"}`, nine: sx * sz < 0 })));
  for (const l of legs) p.add(l.id, l.nine ? "9" : "10", l.nine ? "Base leg, left hand" : "Base leg, right hand", [LT, BH, LT], [l.sx * lx, BH / 2, l.sz * lz], "wood");
  const barId = (sx: number) => `G11${sx < 0 ? "L" : "R"}`;
  for (const sx of SX) p.add(barId(sx), "11", "Base rail", [LT, 40, 2 * lz - LT], [sx * lx, 20, 0], "wood");
  p.add("C12", "12", "Centre foot", [40, BH, 40], [0, BH / 2, 0], "wood");
  const base = [...legs.map((l) => l.id), ...SX.map(barId), "C12", "B2"];

  interface Drawer {
    c: number;
    i: number;
    cx: number;
    y: number;
    front: string;
    sl: string;
    sr: string;
    back: string;
    brace: string;
    bottom: string;
  }
  const drawers: Drawer[] = [];
  for (let c = 0; c < 2; c++)
    for (let i = 0; i < ROWS; i++) {
      const cx = cxs[c], y = ybox(i), tag = `${c}${i}`;
      drawers.push({
        c,
        i,
        cx,
        y,
        front: p.add(`F${tag}`, c ? "14" : "13", c ? "Right drawer front" : "Left drawer front", [xi - 3, fh, FT], [(c ? 1 : -1) * (xi / 2), fy0(i) + fh / 2, zF - FT / 2]),
        sl: p.add(`DL${tag}`, "16", "Drawer side, left", [T, sh, DD], [cx - xs, y + sh / 2, zf - DD / 2]),
        sr: p.add(`DR${tag}`, "15", "Drawer side, right", [T, sh, DD], [cx + xs, y + sh / 2, zf - DD / 2]),
        back: p.add(`DB${tag}`, "17", "Drawer back", [2 * xs - T, sh, T], [cx, y + sh / 2, zb + T / 2]),
        bottom: p.add(`DT${tag}`, "18", "Drawer bottom", [2 * xs - T + 16, BK, DD - 8], [cx, y + 12, (zf - 1 + zb + 7) / 2], "fiber"),
        brace: p.add(`DC${tag}`, "20", "Drawer brace", [60, T, DD - T], [cx, y + 13.5 + T / 2, (zf + zb + T) / 2]),
      });
    }

  /* ---- fittings ---- */
  const side = (sx: number) => (sx < 0 ? "S3" : "S4");
  const wallOf = (c: number, g: number) => (c === 0 ? (g < 0 ? "S3" : "M5") : g < 0 ? "M5" : "S4");
  const faceX = (c: number, g: number) => (c === 0 ? (g < 0 ? -xi : -T / 2) : g < 0 ? T / 2 : xi);
  const cabRunners = (c: number, g: number): CustomFix[] => {
    const x = faceX(c, g), on = wallOf(c, g), dir: Vec3 = [g, 0, 0];
    return [
      fx(runner(g < 0 ? "Cabinet runner, left" : "Cabinet runner, right"), range(ROWS).map((i): Vec3 => [x, ybox(i) - 6, zrun]), dir, on),
      fx(RUNNER_SCREW, range(ROWS).flatMap((i) => [0.87, 0.3, -0.3, -0.87].map((k): Vec3 => [x, ybox(i) - 6, zrun + Math.round(k * (RL / 2))])), dir, on),
    ];
  };
  const railsOf = (c: number) => rails.filter((r) => r.c === c);
  const y7 = [y8 - 15, y8 + 15];
  const sideBolts = (sx: number) =>
    fx(CAM_BOLT, [...railsOf(sx < 0 ? 0 : 1).map((r): Vec3 => [sx * xi, r.y, zRailBolt]), ...y7.map((y): Vec3 => [sx * xi, y, z7])], [sx, 0, 0], side(sx));
  // a front rail's side end: a dowel in the side and a cam lock in the rail's top face over the side's cam bolt
  const railSideEnd = (c: number): CustomFix[] => {
    const sx = c === 0 ? -1 : 1;
    return railsOf(c).flatMap((r) => [fx(DOWEL, [[sx * xi, r.y, zRailDowel]], [sx, 0, 0], side(sx), r.id), fx(CAM, [[sx * (xi - 25), r.y + T / 2, zRailBolt]], [0, -1, 0], r.id)]);
  };
  // its middle end: the double cam bolt and the long dowel go through the middle panel, a cam lock in each rail
  const railMidCam = (c: number) => railsOf(c).map((r) => fx(CAM, [[(c === 0 ? -1 : 1) * (T / 2 + 25), r.y + T / 2, zRailBolt]], [0, -1, 0], r.id));
  const backRailCams = (sx: number) => fx(CAM, y7.map((y): Vec3 => [sx * (xi - 30), y, z7 + T / 2]), [0, 0, -1], "R7");
  const uprights = [
    { id: "S3", x: -(xo - T / 2), z0: 0 },
    { id: "M5", x: 0, z0: (zf + zMid0) / 2 },
    { id: "S4", x: xo - T / 2, z0: 0 },
  ];
  const zTopBolt = [-100, 100], zTopDowel = [-150, 150], zBotScrew = [-60, 60];
  const camFace = (u: (typeof uprights)[number]): { x: number; dir: Vec3 } => (u.id === "S3" ? { x: -xi, dir: [-1, 0, 0] } : u.id === "S4" ? { x: xi, dir: [1, 0, 0] } : { x: -T / 2, dir: [1, 0, 0] });
  const wallX = [-300, 300];
  const zg = zk + 2;
  // base: each leg's cam bolt and dowel low on its inner face, the rail's cam locks in its inner face
  const legFace = (l: (typeof legs)[number]) => l.sz * (lz - LT / 2);
  const backs = [
    { id: "K8", ys: [ys0 + 25, y8 - RH / 2 - 25] },
    { id: "K19", ys: [y8 + RH / 2 + 25, ys1 - 30] },
  ];
  // drawers
  const dFix = (list: Drawer[], what: "box" | "back" | "runners"): CustomFix[] =>
    list.flatMap((d) => {
      const ys = [d.y + 35, d.y + sh - 35];
      const per = (fn: (g: number, sd: string) => CustomFix[]) => [...fn(-1, d.sl), ...fn(1, d.sr)];
      if (what === "box")
        // two cam bolts and a dowel in the front for each side, a cam bolt and a dowel for the brace, cam locks in the sides
        return [
          ...per((g, sd) => [fx(CAM_BOLT, ys.map((y): Vec3 => [d.cx + g * xs, y, zf]), [0, 0, 1], d.front, sd), fx(DOWEL, [[d.cx + g * xs, d.y + sh / 2, zf]], [0, 0, 1], d.front, sd)]),
          fx(CAM_BOLT, [[d.cx - 14, d.y + 21, zf]], [0, 0, 1], d.front, d.brace),
          fx(DOWEL, [[d.cx + 14, d.y + 21, zf]], [0, 0, 1], d.front, d.brace),
          ...per((g, sd) => [fx(CAM, ys.map((y): Vec3 => [d.cx + g * (xs - T / 2), y, zf - 25]), [g, 0, 0], sd)]),
        ];
      if (what === "back")
        return [
          fx(CAM, [[d.cx - 14, d.y + 13.5 + T, zf - 25]], [0, -1, 0], d.brace),
          ...per((g, sd) => [fx(SCREW, ys.map((y): Vec3 => [d.cx + g * (xs + T / 2), y, zb + T / 2]), [-g, 0, 0], sd, d.back)]),
          fx(SCREW, [-15, 15].map((x): Vec3 => [d.cx + x, d.y + 21, zb]), [0, 0, 1], d.back, d.brace),
        ];
      return per((g, sd) => [
        fx(runner(g < 0 ? "Drawer runner, left" : "Drawer runner, right"), [[d.cx + g * xs, d.y, zdr]], [0, 1, 0], sd),
        fx(RUNNER_SCREW, [0.65, 0.15, -0.6].map((k): Vec3 => [d.cx + g * (xs + T / 2), d.y + 8, zrun + Math.round(k * (RL / 2))]), [-g, 0, 0], sd),
      ]);
    });
  const dOff: Vec3 = [0, 0, 420];
  const idsOf = (d: Drawer) => [d.front, d.sl, d.sr, d.bottom, d.brace, d.back];

  const lie = "-z" as const; // on its front
  const fromAbove = (ids: string[]) => offset(ids, [0, 0, -400]); // lying on its front, "above" is behind it
  const pOff: Vec3 = [(W + 150) / 1.6, 0, 0]; // the base waits to the right (staged parts are drawn 1.6 times as far)
  const tOff: Vec3 = [-(W + 150) / 1.6, 0, 0]; // the top to the left
  const steps: CustomStep[] = [
    {
      title: "Screw the runners and cam bolts onto the sides",
      detail: "Lay both sides inside face up. Three left runners (CL) on the left side (3) and three right runners (CR) on the right side (4), wheel to the front, four screws (K) each. Then four cam bolts (A) into each side.",
      fix: [...cabRunners(0, -1), ...cabRunners(1, 1), sideBolts(-1), sideBolts(1)],
      wait: ["S3", "S4"],
      from: { S3: [-300, 0, 0], S4: [300, 0, 0] },
      tools: ["screwdriver"],
      kind: "runners",
      warnings: ["floor"],
    },
    {
      title: "Screw runners onto both faces of the middle panel",
      detail: "Three left runners (CL) on one face of the middle panel (5), four screws (K) each, then turn it over and screw three right runners (CR) on the other face.",
      fix: [...cabRunners(1, -1), ...cabRunners(0, 1)],
      wait: ["M5"],
      from: { M5: [-200, 0, 0] },
      tools: ["screwdriver"],
      kind: "runners",
    },
    {
      title: "Join the left side, the middle panel and the rails",
      detail: "With the parts on their front edges, push the back rail (7) and two front rails (6) onto the left side's cam bolts, each front rail on a dowel (C), and lock them with cam locks (B). At the middle panel each front rail takes a double cam bolt (L) and a long dowel (M) through the panel, and a cam lock.",
      add: ["S3", "M5", "R7", ...railsOf(0).map((r) => r.id)],
      fix: [
        ...railSideEnd(0),
        backRailCams(-1),
        ...railsOf(0).flatMap((r) => [fx(DOUBLE_BOLT, [[-T / 2, r.y, zRailBolt]], [1, 0, 0], "M5", r.id), fx(LONG_DOWEL, [[-T / 2, r.y, zRailDowel]], [1, 0, 0], "M5", r.id)]),
        ...railMidCam(0),
      ],
      from: fromAbove(["R7", ...railsOf(0).map((r) => r.id)]),
      pose: lie,
      tools: ["screwdriver"],
      warnings: ["floor"],
    },
    {
      title: "Fit the right side and the other two front rails",
      detail: "Rest the middle panel on a spare drawer back to keep it level. Push the two right front rails onto the double cam bolts and lock them (B), then press the right side (4) onto the rails' ends, two dowels (C) in, and lock the four cams. Two screws (D) through the back rail into the middle panel.",
      add: [...railsOf(1).map((r) => r.id), "S4"],
      fix: [...railMidCam(1), ...railSideEnd(1), backRailCams(1), fx(SCREW, y7.map((y): Vec3 => [0, y, zk]), [0, 0, 1], "R7", "M5")],
      from: { ...fromAbove(railsOf(1).map((r) => r.id)), S4: [400, 0, 0] },
      pose: lie,
      tools: ["screwdriver"],
      check: "square",
    },
    {
      title: "Turn cam bolts into the top and fit the wall brackets",
      detail: "Lay the top (1) face down. Six cam bolts (A) into its underside, two over each side and the middle panel, then screw the two wall brackets (G) on at the back edge, one screw (H) each.",
      fix: [
        fx(CAM_BOLT, uprights.flatMap((u) => zTopBolt.map((z): Vec3 => [u.x, ys1, u.z0 + z])), [0, 1, 0], "T1"),
        fx(WALL_BRACKET, wallX.map((x): Vec3 => [x, ys1, zg]), [0, 1, 0], "T1"),
        fx(BRACKET_SCREW, wallX.map((x): Vec3 => [x, ys1, zg + 25]), [0, 1, 0], "T1"),
      ],
      wait: ["T1"],
      from: { T1: tOff },
      tools: ["screwdriver"],
    },
    {
      title: "Turn a cam bolt into each base leg",
      detail: "One cam bolt (A) into the inside face of each of the four legs (9 and 10), near its foot.",
      fix: legs.map((l) => fx(CAM_BOLT, [[l.sx * lx - 10, 20, legFace(l)]], [0, 0, l.sz], l.id)),
      wait: legs.map((l) => l.id),
      from: offset(base, pOff),
      tools: ["screwdriver"],
    },
    {
      title: "Join the base frames",
      detail: "For each frame: a dowel (C) into each leg, push a rail (11) onto the dowels and bolts between a leg 9 and a leg 10, and turn its two cam locks (B).",
      fix: [
        ...legs.map((l) => fx(DOWEL, [[l.sx * lx + 10, 20, legFace(l)]], [0, 0, l.sz], l.id, barId(l.sx))),
        ...SX.map((sx) => fx(CAM, SX.map((sz): Vec3 => [sx * (lx - LT / 2), 20, sz * (lz - LT / 2 - 25)]), [sx, 0, 0], barId(sx))),
      ],
      wait: SX.map(barId),
      from: offset(base, pOff),
      tools: ["screwdriver"],
    },
    {
      title: "Bolt the base frames and the foot under the bottom",
      detail: "Set the bottom (2) on the two frames and the centre foot (12), a dowel (O) in the foot's top. Drive two bolts (J) down through the bottom into each leg and one into the foot, with the Allen key (I).",
      fix: [
        fx(FOOT_DOWEL, [[0, BH, 10]], [0, -1, 0], "C12", "B2"),
        ...legs.map((l) => fx(BASE_BOLT, [-10, 10].map((k): Vec3 => [l.sx * lx + k, ys0, l.sz * lz]), [0, -1, 0], "B2", l.id)),
        fx(BASE_BOLT, [[0, ys0, -8]], [0, -1, 0], "B2", "C12"),
      ],
      wait: ["C12", "B2"],
      from: offset(base, pOff),
      tools: ["allen"],
    },
    {
      title: "Slide in the lower back panel",
      detail: "Smooth side in, along the grooves from the open bottom end until it meets the back rail.",
      add: ["K8"],
      from: { K8: [0, -500, 0] },
      pose: lie,
    },
    {
      title: "Fix the bottom and base on",
      detail: "Two dowels (C) into the bottom edge of each side and the middle panel. Push the bottom with its base onto them and drive six screws (D) through the bottom, two into each.",
      add: base,
      fix: [
        ...uprights.map((u) => fx(DOWEL, zTopDowel.map((z): Vec3 => [u.x, ys0, u.z0 + z]), [0, 1, 0], u.id, "B2")),
        ...uprights.map((u) => fx(SCREW, zBotScrew.map((z): Vec3 => [u.x, BH, u.z0 + z]), [0, 1, 0], "B2", u.id)),
      ],
      from: offset(base, pOff),
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Stand it up and slide in the upper back panel",
      detail: "Lower it down the grooves from the open top until it sits in the back rail.",
      add: ["K19"],
      from: { K19: [0, 500, 0] },
      pose: "+y",
    },
    {
      title: "Fix the top on",
      detail: "Two dowels (C) into the top edge of each side and the middle panel. Lower the top onto them and lock the six cams (B).",
      add: ["T1"],
      fix: [...uprights.map((u) => fx(DOWEL, zTopDowel.map((z): Vec3 => [u.x, ys1, u.z0 + z]), [0, -1, 0], u.id, "T1")), ...uprights.map((u) => fx(CAM, zTopBolt.map((z): Vec3 => [camFace(u).x, ys1 - 25, u.z0 + z]), camFace(u).dir, u.id))],
      from: { T1: [0, 400, 0] },
      tools: ["screwdriver"],
    },
    {
      title: "Hold the backs in with the corner blocks",
      detail: "Turn it round. Press a block (E) into each corner behind both back panels and fix it to the side with a screw (F).",
      fix: [
        ...backs.flatMap((b) => SX.map((sx) => fx(BLOCK, b.ys.map((y): Vec3 => [sx * (xi - 11), y, zk]), [0, 0, 1], b.id))),
        ...backs.flatMap((b) => SX.map((sx) => fx(BLOCK_SCREW, b.ys.map((y, j): Vec3 => [sx * xi, y + (j ? -22 : 22), zk - 5]), [sx, 0, 0], side(sx)))),
      ],
      tools: ["screwdriver"],
    },
    {
      title: "Fix it to the wall",
      detail: "Push it against the wall and mark through the two brackets. Check the wall for pipes and cables, drill, push in the plugs (N) and drive a screw (D) through each bracket.",
      fix: [fx(PLUG, wallX.map((x): Vec3 => [x, ys1 - 20, zB - 1]), [0, 0, -1]), fx(SCREW, wallX.map((x): Vec3 => [x, ys1 - 20, zg - 6]), [0, 0, -1], "T1")],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  for (let c = 0; c < 2; c++) {
    const list = drawers.filter((d) => d.c === c);
    const ids = list.flatMap(idsOf);
    const front = c ? "14" : "13";
    steps.push(
      {
        title: `Build the ${c ? "right" : "left"} drawer boxes`,
        detail: `For each of the three fronts marked ${front}: lay it face down on a rug, turn in five cam bolts (A) and push in three dowels (C), press the left side (16) and the right side (15) on and turn their cam locks (B), then slide the bottom (18) down the grooves.`,
        fix: dFix(list, "box"),
        wait: list.flatMap((d) => [d.front, d.sl, d.sr, d.bottom]),
        from: offset(ids, dOff),
        tools: ["screwdriver"],
        kind: "drawer",
        warnings: ["floor"],
      },
      {
        title: "Fit the braces and backs",
        detail: "Stand a brace (20) on each front's middle bolt and dowel and turn its cam lock (B). Put the back (17) on between the sides and drive six screws (D): two through each side and two through the back into the brace.",
        fix: dFix(list, "back"),
        wait: list.flatMap((d) => [d.brace, d.back]),
        from: offset(ids, dOff),
        tools: ["screwdriver"],
        kind: "drawer",
      },
      {
        title: "Screw the runners onto the drawers",
        detail: "A left runner (DL) along the bottom of each left side and a right runner (DR) on each right side, three screws (K) each.",
        fix: dFix(list, "runners"),
        tools: ["screwdriver"],
        kind: "runners",
      },
    );
  }
  steps.push({
    title: "Slide all six drawers in",
    detail: "Fronts marked 13 go in the left column and 14 in the right. Rest each drawer's runners on the ones in the chest and push it home. Open only one drawer at a time.",
    add: drawers.flatMap(idsOf),
    from: offset(drawers.flatMap(idsOf), dOff),
    kind: "drawer",
    warnings: ["tip"],
  });
  return { parts: p.list, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-sadie-6-drawer-chest") return chest(s);
  return null;
}

const family: Family = { names: ["KMART:SADIE"], recipe };
export default family;
