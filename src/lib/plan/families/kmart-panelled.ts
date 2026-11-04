import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's 2 Tier Panelled Shoe Cabinet (43273225), read from its assembly manual. Two sides (2, 3) joined by a back
 * and a front bottom rail (7) and a top (1), with two panelled flip down doors (4) that each carry a pair of flip
 * fittings and a shoe tray, and a folding hardboard back (8) nailed on.
 *
 * - Each door: a left and a right flip fitting with three screws each and a knob, then a tray strip (6) and a shoe
 *   board (5) screwed between the fittings.
 * - Two stop blocks and two pivot bushes go inside each side. Lying on side 2, the rails stand on it with a cam bolt
 *   and a dowel each, the doors' pivots drop onto its bushes, and side 3 goes on top; each pivot is held with a cap
 *   and a screw.
 * - Stood up, the top goes on with cam bolts, dowels and cams; a second shoe board goes into each door (its height
 *   can be set to suit the shoes, or it can be left out) and two straps go on the top. The back is nailed on with
 *   four screws into the back rail, and the straps are screwed to the wall.
 *
 * Kmart's hardware list: 8 cam bolts (a), 8 cam locks (b), 8 dowels (c), 4 stop blocks with two screws each (d),
 * 4 pivot bushes (e), 2 left (g) and 2 right (f) flip fittings, 12 fitting screws M4 x 12 (h), 4 pivot caps (i),
 * 16 nails (j), 12 tray screws M4 x 25 (k), 2 wall straps with a screw and washer each (l), 2 wall plugs with a
 * screw and washer each (m), 4 pivot screws M4 x 13 (n), 2 knobs with their screws (o) and 4 back screws M4 x 12 (p).
 * Part numbers are Kmart's own, so the guide reads against the paper; Kmart's sets (d, l, m, o) count each piece.
 *
 * Readings chosen: the manual's step 1 draws two jobs joined by an arrow (fittings and knobs, then the tray boards),
 * so the guide gives each its own step. Which flip fitting is left: the door lies face down with its top edge
 * nearest, fitting g at the left end. The manual recommends two people for the whole build but marks no step.
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

const CAM_BOLT_A: Def = { kind: "camScrew", len: 35, dia: 6 };
const CAM_B: Def = { kind: "cam", len: 9.5, dia: 15 };
const DOWEL_C: Def = { kind: "dowel", len: 30, dia: 6 };
const STOP_D: Def = { kind: "clip", len: 12, dia: 26, name: "Stop block" };
const STOP_SCREW_D: Def = { kind: "screw", len: 14, dia: 3, name: "Stop block screw" };
const BUSH_E: Def = { kind: "cap", len: 3, dia: 20, name: "Pivot bush" };
const FLIP_R: Def = { kind: "connector", len: 160, dia: 120, name: "Right flip fitting" }; // f
const FLIP_L: Def = { kind: "connector", len: 160, dia: 120, name: "Left flip fitting" }; // g
const SCREW_H: Def = { kind: "screw", len: 12, dia: 4, name: "Fitting screw" };
const CAP_I: Def = { kind: "washer", len: 3, dia: 18, name: "Pivot cap" };
const NAIL_J: Def = { kind: "nail", len: 20, dia: 1.6 };
const SCREW_K: Def = { kind: "screw", len: 25, dia: 4, name: "Tray screw" };
const STRAP_L: Def = { kind: "strap", len: 150, dia: 20, name: "Wall strap" };
const STRAP_SCREW_L: Def = { kind: "screw", len: 12, dia: 3.5, name: "Strap screw" };
const WASHER: Def = { kind: "washer", len: 1.5, dia: 12 };
const PLUG_M: Def = { kind: "plug", len: 30, dia: 6, included: true };
const WALL_SCREW_M: Def = { kind: "screw", len: 35, dia: 4, name: "Wall screw", included: true };
const SCREW_N: Def = { kind: "screw", len: 13, dia: 4, name: "Pivot screw" };
const KNOB_O: Def = { kind: "knob", len: 25, dia: 30 };
const KNOB_SCREW_O: Def = { kind: "screw", len: 25, dia: 4, name: "Knob screw" };
const SCREW_P: Def = { kind: "screw", len: 12, dia: 4, name: "Back screw" };

const T = 15; // the carcass boards and the doors
const BK = 3; // the back

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug !== "kmart-2-tier-panelled-shoe-cabinet") return null;
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xs = W / 2 - T / 2, xi = W / 2 - T;
  const y1 = H - T; // underside of the top
  const zB = -D / 2, zk = zB + BK, zF = D / 2; // the back, the carcass's back edges, the front
  const Dc = zF - zk, zc = (zF + zk) / 2;
  const RH = 60; // the bottom rails
  const zr = { back: zk + T / 2, front: zF - T / 2 };

  // the doors, inside the sides between the front rail and the top
  const DW = 2 * xi - 4;
  const dh = (y1 - RH - 2 - 2 - 3) / 2;
  const doors = [0, 1].map((i) => {
    const y0 = RH + 2 + i * (dh + 3);
    return { i, y0, yc: y0 + dh / 2, id: `D4-${i}`, strip: `T6-${i}`, board: `T5a-${i}`, second: `T5b-${i}` };
  });
  type Door = (typeof doors)[number];
  // a panelled door: a frame standing proud of a field of seven boards side by side
  const FR = 55, fieldH = dh - 2 * FR, fieldW = DW - 2 * FR, slat = fieldW / 7;
  const door: PartPiece[] = [
    { shape: "box", size: [DW, dh, T - 3], pos: [0, 0, -1.5] },
    ...SX.map((sy): PartPiece => ({ shape: "box", size: [DW, FR, 3], pos: [0, sy * (dh / 2 - FR / 2), T / 2 - 1.5] })),
    ...SX.map((sx): PartPiece => ({ shape: "box", size: [FR, fieldH, 3], pos: [sx * (DW / 2 - FR / 2), 0, T / 2 - 1.5] })),
    ...[0, 1, 2, 3, 4, 5, 6].map((k): PartPiece => ({ shape: "box", size: [slat, fieldH, 1.5], pos: [-fieldW / 2 + slat / 2 + k * slat, 0, T / 2 - 3 + 0.75] })),
  ];
  const zdb = zF - T; // the doors' back face
  const tl = 2 * xi - 16; // the tray boards run between the fittings

  const parts: CustomPart[] = [
    { id: "T1", label: "1", name: "Top", size: [W, T, Dc], pos: [0, H - T / 2, zc], material: "board" },
    { id: "S2", label: "2", name: "Left side", size: [T, y1, Dc], pos: [-xs, y1 / 2, zc], material: "board" },
    { id: "S3", label: "3", name: "Right side", size: [T, y1, Dc], pos: [xs, y1 / 2, zc], material: "board" },
    { id: "R7b", label: "7", name: "Bottom rail", size: [2 * xi, RH, T], pos: [0, RH / 2, zr.back], material: "board" },
    { id: "R7f", label: "7", name: "Bottom rail", size: [2 * xi, RH, T], pos: [0, RH / 2, zr.front], material: "board" },
    {
      id: "B8",
      label: "8",
      name: "Back panel",
      size: [W, H, BK],
      pos: [0, H / 2, zB + BK / 2],
      material: "fiber",
      // it folds down the middle
      pieces: SX.map((sx): PartPiece => ({ shape: "box", size: [W / 2 - 1, H, BK], pos: [sx * (W / 4 + 0.5), 0, 0] })),
    },
  ];
  for (const d of doors) {
    parts.push(
      { id: d.id, label: "4", name: "Door", size: [DW, dh, T], pos: [0, d.yc, zF - T / 2], material: "board", pieces: door },
      { id: d.strip, label: "6", name: "Tray strip", size: [tl, 12, 60], pos: [0, d.y0 + 26, zdb - 30], material: "board" },
      { id: d.board, label: "5", name: "Shoe board", size: [tl, 110, 12], pos: [0, d.yc + 70, 25], material: "board" },
      { id: d.second, label: "5", name: "Shoe board", size: [tl, 110, 12], pos: [0, d.yc - 50, -15], material: "board" },
    );
  }

  const pivot = (d: Door) => ({ y: d.y0 + 60, z: 60 });
  const stop = (d: Door) => ({ y: d.yc + 120, z: 80 });
  const sides = [
    { id: "S2", g: -1 },
    { id: "S3", g: 1 },
  ] as const;
  const fitX = xi - 6; // the fittings stand just inside the sides
  const knobY = (d: Door) => d.y0 + dh - 45;
  const trayEnds = (id: string, y: number, z: number): CustomFix[] => SX.map((g) => fx(SCREW_K, [[g * (tl / 2), y, z]], [-g, 0, 0], id));
  // a bottom rail meets a side: a cam bolt in the side low down, a dowel above it, a cam in the rail's inside face
  const railBolt = (g: number) => [
    fx(CAM_BOLT_A, [[g * xi, 18, zr.back]], [g, 0, 0], g < 0 ? "S2" : "S3", "R7b"),
    fx(CAM_BOLT_A, [[g * xi, 18, zr.front]], [g, 0, 0], g < 0 ? "S2" : "S3", "R7f"),
  ];
  // side 2's dowels stand in the side, ready for the rails; for side 3 they go into the rails' other ends
  const railDowels = (g: number) =>
    (["R7b", "R7f"] as const).map((id) => {
      const at: Vec3[] = [[g * xi, 42, id === "R7b" ? zr.back : zr.front]];
      const side = g < 0 ? "S2" : "S3";
      return g < 0 ? fx(DOWEL_C, at, [g, 0, 0], side, id) : fx(DOWEL_C, at, [-g, 0, 0], id, side);
    });
  const railCams = (g: number) => [fx(CAM_B, [[g * (xi - 25), 18, zk + T]], [0, 0, -1], "R7b"), fx(CAM_B, [[g * (xi - 25), 18, zdb]], [0, 0, 1], "R7f")];
  const doorIds = doors.flatMap((d) => [d.id, d.strip, d.board, d.second]);
  const out: Vec3 = [0, 0, 700]; // the doors wait in front of the build
  const offs = (ids: string[], v: Vec3) => Object.fromEntries(ids.map((id) => [id, v] as [string, Vec3]));
  const topZ = [zc - 60, zc + 60], topDowelZ = [zc - 95, zc + 95];
  const lie = "+x" as const; // on side 2

  const steps: CustomStep[] = [
    {
      title: "Screw the flip fittings and knobs onto the doors",
      detail: "Lay each door face down on a rug. Screw the left fitting (g) on at its left end and the right fitting (f) at its right end, three screws (h) each, then the knob (o) on the front with its screw from behind.",
      fix: doors.flatMap((d) => [
        fx(FLIP_L, [[-fitX, d.yc - 60, zdb - 60]], [-1, 0, 0], d.id),
        fx(FLIP_R, [[fitX, d.yc - 60, zdb - 60]], [1, 0, 0], d.id),
        fx(SCREW_H, SX.flatMap((g) => [-50, 0, 50].map((k): Vec3 => [g * (xi - 14), d.yc - 60 + k, zdb])), [0, 0, 1], d.id),
        fx(KNOB_O, [[0, knobY(d), zF]], [0, 0, -1], d.id),
        // its head stands off the back a little: a fitting closer than 22 mm to another is moved aside
        fx(KNOB_SCREW_O, [[0, knobY(d), zdb - 8]], [0, 0, 1], d.id),
      ]),
      wait: doors.map((d) => d.id),
      from: offs(doorIds, out),
      pose: lie,
      tools: ["screwdriver"],
      kind: "doors",
      warnings: ["floor"],
    },
    {
      title: "Screw a tray strip and a shoe board onto each door",
      detail: "Between the two fittings: the tray strip (6) low down by the door and a shoe board (5) above it, a screw (k) through each fitting into each end.",
      fix: doors.flatMap((d) => [...trayEnds(d.strip, d.y0 + 26, zdb - 30), ...trayEnds(d.board, d.yc + 70, 25)]),
      wait: doors.flatMap((d) => [d.strip, d.board]),
      from: offs(doorIds, out),
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Fit the stop blocks and pivot bushes to the sides",
      detail: "Lay both sides inside face up. Screw two stop blocks (d) onto each, two small screws apiece, and press in its two round pivot bushes (e).",
      add: ["S2"],
      fix: [
        ...sides.map((sd) => fx(STOP_D, doors.map((d): Vec3 => [sd.g * xi, stop(d).y, stop(d).z]), [sd.g, 0, 0], sd.id)),
        ...sides.map((sd) => fx(STOP_SCREW_D, doors.flatMap((d) => [-24, 24].map((k): Vec3 => [sd.g * xi, stop(d).y, stop(d).z + k])), [sd.g, 0, 0], sd.id)),
        ...sides.map((sd) => fx(BUSH_E, doors.map((d): Vec3 => [sd.g * xi, pivot(d).y, pivot(d).z]), [sd.g, 0, 0], sd.id)),
      ],
      wait: ["S3"],
      from: { S2: [300, 0, 0], S3: [0, 0, 380] },
      pose: lie,
      tools: ["screwdriver", "hammer"],
    },
    {
      title: "Stand the bottom rails on side 2",
      detail: "Screw a cam bolt (a) into side 2 for each rail and push in a dowel (c), then stand the two rails (7) on them, front and back, and lock a cam (b) in each.",
      add: ["R7b", "R7f"],
      fix: [...railBolt(-1), ...railDowels(-1), ...railCams(-1)],
      from: { R7b: [400, 0, 0], R7f: [400, 0, 0] },
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Fit the doors and side 3",
      detail: "Drop each door's pivots onto the bushes in side 2. Push a dowel (c) into the free end of each rail and screw two cam bolts (a) into side 3, lower it on and lock the rails' cams (b). Fix each pivot with a cap (i) and a screw (n).",
      add: [...doorIds.filter((id) => !id.startsWith("T5b")), "S3"],
      fix: [
        ...railBolt(1),
        ...railDowels(1),
        ...railCams(1),
        ...sides.map((sd) => fx(CAP_I, doors.map((d): Vec3 => [sd.g * xi, pivot(d).y, pivot(d).z]), [sd.g, 0, 0], sd.id)),
        ...sides.map((sd) => fx(SCREW_N, doors.map((d): Vec3 => [sd.g * xi, pivot(d).y, pivot(d).z]), [sd.g, 0, 0], sd.id)),
      ],
      from: { ...offs(doorIds, [0, 0, 400]), S3: [400, 0, 0] },
      pose: lie,
      tools: ["screwdriver"],
      kind: "doors",
    },
    {
      title: "Stand it up and fix the top on",
      detail: "Stand it on its feet. Four cam bolts (a) into the underside of the top and two dowels (c) into the top edge of each side; lower the top on and lock the four cams (b) inside the sides.",
      add: ["T1"],
      fix: [
        ...sides.map((sd) => fx(CAM_BOLT_A, topZ.map((z): Vec3 => [sd.g * xs, y1, z]), [0, 1, 0], "T1", sd.id)),
        ...sides.map((sd) => fx(DOWEL_C, topDowelZ.map((z): Vec3 => [sd.g * xs, y1, z]), [0, -1, 0], sd.id, "T1")),
        ...sides.map((sd) => fx(CAM_B, topZ.map((z): Vec3 => [sd.g * xi, y1 - 25, z]), [sd.g, 0, 0], sd.id)),
      ],
      pose: "+y",
      tools: ["screwdriver"],
    },
    {
      title: "Fit the second shoe boards and the wall straps",
      detail: "Tip each door open and screw in the second shoe board (5), a screw (k) through each fitting: high, low or left out, to suit the shoes. Screw the two straps (l) onto the top at the back, a washer under each screw.",
      add: doors.map((d) => d.second),
      fix: [
        ...doors.flatMap((d) => trayEnds(d.second, d.yc - 50, -15)),
        fx(STRAP_L, [-200, 200].map((x): Vec3 => [x, H, zk + 30]), [0, -1, 0], "T1"),
        fx(WASHER, [-200, 200].map((x): Vec3 => [x, H, zk + 60]), [0, -1, 0], "T1"),
        fx(STRAP_SCREW_L, [-200, 200].map((x): Vec3 => [x, H + 1.5, zk + 60]), [0, -1, 0], "T1"),
      ],
      from: offs(
        doors.map((d) => d.second),
        [0, 0, 300],
      ),
      tools: ["screwdriver"],
    },
    {
      title: "Nail the back on",
      detail: "Turn it round. Unfold the back (8), lay it over the back edges and nail it on: four nails (j) along the top and six down each side. Then four screws (p) along the bottom into the back rail.",
      add: ["B8"],
      fix: [
        fx(NAIL_J, [-225, -75, 75, 225].map((x): Vec3 => [x, H - T / 2, zB]), [0, 0, 1], "B8", "T1"),
        ...sides.map((sd) => fx(NAIL_J, [100, 220, 340, 460, 580, 700].map((y): Vec3 => [sd.g * xs, y, zB]), [0, 0, 1], "B8", sd.id)),
        fx(SCREW_P, [-225, -75, 75, 225].map((x): Vec3 => [x, RH / 2, zB]), [0, 0, 1], "B8", "R7b"),
      ],
      from: { B8: [0, 0, -400] },
      tools: ["hammer", "screwdriver"],
    },
    {
      title: "Fix it to the wall",
      detail: "Push it against the wall and mark through the two straps. Drill, push in the plugs (m) and screw each strap to the wall with a washer. Check the wall for pipes and cables first.",
      fix: [
        fx(PLUG_M, [-200, 200].map((x): Vec3 => [x, H - 25, zB - 1]), [0, 0, -1]),
        fx(WASHER, [-200, 200].map((x): Vec3 => [x, H - 25, zk + 23]), [0, 0, -1], "T1"),
        fx(WALL_SCREW_M, [-200, 200].map((x): Vec3 => [x, H - 25, zk + 23]), [0, 0, -1]),
      ],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

const family: Family = { names: ["KMART:PANELLED"], recipe };
export default family;
