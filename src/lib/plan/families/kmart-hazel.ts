import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's Hazel Entertainment Unit, read from its assembly manual (keycode 43636112). A long low cupboard between two
 * thick end panels (2, 3) with a wavy outer face, three bays behind three doors, on the end panels and a foot (12)
 * under the middle of the bottom. It goes together with dowels (A), cam bolts (B) and cam locks (C):
 *
 * - cam bolts go into both end panels for the bottom (7) and into the two dividers (4, 5) for the shelf (6); the shelf
 *   is locked between the dividers, and the bottom between the end panels with the foot bolted under it (H).
 * - lying on its back, the dividers with their shelf stand on the bottom, held by dowels and four screws (D) up
 *   through it, and four felt pads (Q) go under the end panels. Stood up, the back panel (8) slides down the grooves.
 * - the top (1) takes eight cam bolts and the two wall brackets (O) and goes on with dowels and cam locks.
 * - the doors take their hinges: straight ones (L) on the left and right doors (9, 11), which hang on the end panels,
 *   cranked ones (M) on the middle door (10), which hangs on the right divider (5) whose front edge it shares with the
 *   right door. Each door takes a handle (J), eight brackets (K) hold the back panel and two wall fixings (P) go
 *   through the brackets into the wall.
 *
 * Kmart's hardware list: 20 dowels 6 x 30 (A), 16 cam bolts 6 x 35 (B), 16 cam locks 15 x 10 (C), 4 screws 4 x 35 (D),
 * 6 screws 3 x 12 (E), 36 screws 4 x 12 (F), 8 screws 3 x 15 (G), one bolt M7 x 50 (H) and the Allen key for it,
 * 3 handles (J), 8 back panel brackets (K), 4 straight hinges (L), 2 cranked hinges (M), 2 wall brackets with their
 * screws (O), the wall plugs and screws (P, two of each by step 13) and 4 felt pads (Q). Every step's count box adds up
 * to those totals. The parts list prints "2PC" against door 9, but every step shows three doors, one each of 9, 10 and
 * 11: the guide has three. Step 11's drawing shows each door opened on its hinged edge: the left door on the left end,
 * the middle door on the right divider and the right door on the right end, as the hinge holes in the panels say.
 */

const T = 15; // board
const BK = 3; // the back panel
const FT = 18; // doors
const EMAX = 55; // the end panels at their thickest, the front bulge of the wave
const YB = 70; // the bottom's underside, over the foot
const OUT = 520; // parts built away from the unit wait this far from it

type Def = Omit<CustomFix, "count" | "at" | "dir" | "on" | "mate">;
const DOWEL: Def = { kind: "dowel", len: 30, dia: 6 }; // A
const CAM_BOLT: Def = { kind: "camScrew", len: 35, dia: 6, name: "Cam bolt" }; // B
const CAM: Def = { kind: "cam", len: 10, dia: 15, name: "Cam lock" }; // C
const SCREW: Def = { kind: "screw", len: 35, dia: 4 }; // D
const HANDLE_SCREW: Def = { kind: "screw", len: 12, dia: 3, name: "Handle screw" }; // E
const HINGE_SCREW: Def = { kind: "screw", len: 12, dia: 4, name: "Hinge screw" }; // F
const BRACKET_SCREW: Def = { kind: "screw", len: 15, dia: 3, name: "Bracket screw" }; // G
const FOOT_BOLT: Def = { kind: "bolt", len: 50, dia: 7, name: "Foot bolt" }; // H
const HANDLE: Def = { kind: "handle", len: 80, dia: 12, name: "Handle" }; // J
const BACK_BRACKET: Def = { kind: "clamp", len: 16, dia: 14, name: "Back panel bracket" }; // K
const HINGE: Def = { kind: "hinge", len: 50, dia: 35, name: "Hinge" }; // L
const CRANKED: Def = { kind: "hinge", len: 52, dia: 35, name: "Cranked hinge" }; // M
const WALL_BRACKET: Def = { kind: "angle", len: 30, dia: 20, name: "Wall bracket" }; // O
const WALL_BRACKET_SCREW: Def = { kind: "screw", len: 12, dia: 4, name: "Wall bracket screw" }; // O
const PLUG: Def = { kind: "plug", len: 30, dia: 6, included: true }; // P
const WALL_SCREW: Def = { kind: "screw", len: 40, dia: 4, name: "Wall screw", included: true }; // P
const PAD: Def = { kind: "glide", len: 3, dia: 20, name: "Felt pad" }; // Q

const fx = (def: Def, at: Vec3[], dir: Vec3, on?: string, mate?: string, extra: Partial<CustomFix> = {}): CustomFix => ({ ...def, count: at.length, at, dir, ...(on ? { on } : {}), ...(mate ? { mate } : {}), ...extra });
const SX = [-1, 1] as const;
const offset = (ids: string[], v: Vec3) => Object.fromEntries(ids.map((id) => [id, v] as [string, Vec3]));

/** How thick an end panel is from back (-D/2) to front (D/2), as a share of its thickest: a bulge, a hollow, a bigger bulge. */
const WAVE: [number, number][] = [
  [-1, 0.62],
  [-0.88, 0.76],
  [-0.7, 0.84],
  [-0.5, 0.76],
  [-0.3, 0.6],
  [-0.1, 0.47],
  [0.1, 0.45],
  [0.3, 0.55],
  [0.5, 0.76],
  [0.7, 0.96],
  [0.85, 1],
  [0.95, 0.9],
  [1, 0.72],
];

/** A part cut to an outline seen from above ([x, z] points in the finished unit), standing from y0 to y1. */
function planPart(id: string, label: string, name: string, outline: [number, number][], y0: number, y1: number): CustomPart {
  const xs = outline.map((q) => q[0]), zs = outline.map((q) => q[1]);
  const lo = [Math.min(...xs), Math.min(...zs)], hi = [Math.max(...xs), Math.max(...zs)];
  const c = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2];
  const size: Vec3 = [hi[0] - lo[0], y1 - y0, hi[1] - lo[1]];
  const piece: PartPiece = { shape: "slab", outline: outline.map(([x, z]) => [x - c[0], z - c[1]] as [number, number]), round: 6, size, pos: [0, 0, 0] };
  return { id, label, name, size, pos: [c[0], (y0 + y1) / 2, c[1]], pieces: [piece] };
}

function tvUnit(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xe = W / 2 - EMAX; // the end panels' inner faces
  const zB = -D / 2, zF = D / 2;
  const zf = zF - FT; // the carcass's front edges, behind the doors
  const zk = zB + 12; // the back panel's back face, in grooves 12 mm in from the back edge
  const yb1 = YB + T, yT = H - T; // top of the bottom, underside of the top
  const xd = xe / 3; // the dividers' centres: three equal bays
  const yS = Math.round((yb1 + yT) / 2); // the shelf, in the middle bay
  const zc = (zf + zk + BK) / 2, Dc = zf - (zk + BK); // the dividers, from the back panel to the front
  const thick = (z: number) => {
    const u = (2 * z) / D;
    for (let i = 1; i < WAVE.length; i++) {
      const [u0, t0] = WAVE[i - 1], [u1, t1] = WAVE[i];
      if (u <= u1) return EMAX * (t0 + ((t1 - t0) * (u - u0)) / (u1 - u0));
    }
    return EMAX * WAVE[WAVE.length - 1][1];
  };
  const zs = WAVE.map(([u]) => (u * D) / 2);
  const endOutline = (sx: number): [number, number][] => [[sx * xe, zB], [sx * xe, zF], ...[...zs].reverse().map((z): [number, number] => [sx * (xe + thick(z)), z])];
  // the top follows the end panels' wave: the left end from back to front, then the right end from front to back
  const topOutline: [number, number][] = [...zs.map((z): [number, number] => [-(xe + thick(z)), z]), ...[...zs].reverse().map((z): [number, number] => [xe + thick(z), z])];
  // doors: three equal ones between the end panels
  const gap = 3;
  const dw = (2 * xe - 2 - 2 * gap) / 3;
  const dx = [-(dw + gap), 0, dw + gap];
  const dy0 = YB, dy1 = yT - 2, dh = dy1 - dy0;

  const parts: CustomPart[] = [
    planPart("E2", "2", "Left end panel", endOutline(-1), 0, yT),
    planPart("E3", "3", "Right end panel", endOutline(1), 0, yT),
    { id: "B7", label: "7", name: "Bottom", size: [2 * xe, T, zf - zB], pos: [0, YB + T / 2, (zf + zB) / 2] },
    { id: "F12", label: "12", name: "Foot", size: [40, YB, 40], pos: [0, YB / 2, 0], shape: "cyl", material: "wood" },
    { id: "V4", label: "4", name: "Left divider", size: [T, yT - yb1, Dc], pos: [-xd, (yb1 + yT) / 2, zc] },
    { id: "V5", label: "5", name: "Right divider", size: [T, yT - yb1, Dc], pos: [xd, (yb1 + yT) / 2, zc] },
    { id: "S6", label: "6", name: "Shelf", size: [2 * (xd - T / 2), T, Dc - 10], pos: [0, yS, zc - 5] },
    { id: "K8", label: "8", name: "Back panel", size: [2 * xe + 16, yT + 6 - (YB + 7), BK], pos: [0, (YB + 7 + yT + 6) / 2, zk + BK / 2], material: "fiber" },
    planPart("T1", "1", "Top", topOutline, yT, H),
    ...["D9", "D10", "D11"].map((id, i): CustomPart => ({ id, label: id.slice(1), name: ["Left door", "Middle door", "Right door"][i], size: [dw, dh, FT], pos: [dx[i], (dy0 + dy1) / 2, zF - FT / 2] })),
  ];
  const doorIds = ["D9", "D10", "D11"];
  const divIds = ["V4", "V5", "S6"];

  /* ---- fittings ---- */
  const end = (sx: number) => (sx < 0 ? "E2" : "E3");
  const div = (sx: number) => (sx < 0 ? "V4" : "V5");
  const zcB = (zf + zB) / 2;
  const zBottomBolt = [zcB - 120, zcB + 120], zBottomDowel = [zcB - 60, zcB + 60];
  const zShelfBolt = [zc - 5 - 110, zc - 5 + 110], zShelfDowel = [zc - 5 - 50, zc - 5 + 50];
  const zUpBolt = [zc - 120, zc + 120], zUpDowel = [zc - 60, zc + 60];
  const xEndTop = xe + 12; // cam bolts and dowels go into the end panels' top edges this far out
  const xBr = [-(xe - 150), xe - 150]; // the wall brackets, behind the end bays
  const xBack = [-(xe - 40), -xd + 60, xd - 60, xe - 40]; // the back panel brackets, along its top and bottom edges
  // hinges: cups 80 mm from the doors' top and bottom, 22 mm in from the hinged edge
  const hy = [dy0 + 80, dy1 - 80];
  const doors = [
    { id: "D9", edge: dx[0] - dw / 2, g: 1, def: HINGE, face: -xe, fdir: [-1, 0, 0] as Vec3, on: "E2" },
    { id: "D10", edge: dx[1] + dw / 2, g: -1, def: CRANKED, face: xd - T / 2, fdir: [1, 0, 0] as Vec3, on: "V5" },
    { id: "D11", edge: dx[2] + dw / 2, g: -1, def: HINGE, face: xe, fdir: [1, 0, 0] as Vec3, on: "E3" },
  ];
  const cupX = (d: (typeof doors)[number]) => d.edge + d.g * 22;
  const doorFix = (d: (typeof doors)[number]): CustomFix[] => [
    fx(d.def, hy.map((y): Vec3 => [cupX(d), y, zf]), [0, 0, 1], d.id, undefined, d.g < 0 ? { twist: Math.PI } : {}),
    fx(HINGE_SCREW, hy.flatMap((y) => [-12, 12].map((k): Vec3 => [cupX(d) + d.g * 24, y + k, zf])), [0, 0, 1], d.id),
  ];
  const handleY = dy1 - 12;
  const lie = "+z" as const; // on its back, as the manual has it from step 1 to step 6
  // the dividers and their shelf wait off to the right and towards its bottom end (on the floor while it lies on its back)
  const aside: Vec3 = [OUT * 1.1, -OUT * 0.9, 0];

  const steps: CustomStep[] = [
    {
      title: "Turn the cam bolts into the right end panel",
      detail: "Lay the right end panel (3) on a rug, inside face up. Two cam bolts (B) near its bottom end, by hand until they stop.",
      fix: [fx(CAM_BOLT, zBottomBolt.map((z): Vec3 => [xe, YB + T / 2, z]), [1, 0, 0], "E3")],
      wait: ["E3"],
      from: { E3: [OUT, 0, 0] },
      pose: lie,
      tools: ["screwdriver"],
      warnings: ["floor"],
    },
    {
      title: "Turn the cam bolts into the left end panel",
      detail: "The same on the left end panel (2): two cam bolts (B) near its bottom end.",
      fix: [fx(CAM_BOLT, zBottomBolt.map((z): Vec3 => [-xe, YB + T / 2, z]), [-1, 0, 0], "E2")],
      wait: ["E2"],
      from: { E2: [-OUT, 0, 0] },
      tools: ["screwdriver"],
    },
    {
      title: "Turn the cam bolts into the dividers",
      detail: "Two cam bolts (B) into each divider (4 and 5), in the face that meets the shelf.",
      fix: SX.map((sx) => fx(CAM_BOLT, zShelfBolt.map((z): Vec3 => [sx * (xd - T / 2), yS, z]), [-sx, 0, 0], div(sx))),
      wait: ["V4", "V5"],
      from: offset(divIds, aside),
      tools: ["screwdriver"],
    },
    {
      title: "Join the dividers with the shelf",
      detail: "Two dowels (A) into each divider. Push the shelf (6) onto the dowels and bolts between them and turn its four cam locks (C).",
      fix: [
        ...SX.map((sx) => fx(DOWEL, zShelfDowel.map((z): Vec3 => [sx * (xd - T / 2), yS, z]), [-sx, 0, 0], div(sx), "S6")),
        fx(CAM, SX.flatMap((sx) => zShelfBolt.map((z): Vec3 => [sx * (xd - T / 2 - 25), yS - T / 2, z])), [0, 1, 0], "S6"),
      ],
      wait: ["S6"],
      from: offset(divIds, aside),
      tools: ["screwdriver"],
    },
    {
      title: "Join the end panels with the bottom",
      detail: "Lay the end panels on their back edges. Two dowels (A) into each, then push the bottom (7) onto the dowels and bolts and turn its four cam locks (C). Bolt the foot (12) under the middle of the bottom with the long bolt (H) and the Allen key.",
      add: ["E2", "E3", "B7", "F12"],
      fix: [
        ...SX.map((sx) => fx(DOWEL, zBottomDowel.map((z): Vec3 => [sx * xe, YB + T / 2, z]), [sx, 0, 0], end(sx), "B7")),
        fx(CAM, SX.flatMap((sx) => zBottomBolt.map((z): Vec3 => [sx * (xe - 25), yb1, z])), [0, -1, 0], "B7"),
        fx(FOOT_BOLT, [[0, yb1, 0]], [0, -1, 0], "B7", "F12"),
      ],
      from: { B7: [0, 300, 0], F12: [0, -260, 0] },
      tools: ["screwdriver", "allen"],
      warnings: ["floor"],
    },
    {
      title: "Fix the dividers onto the bottom",
      detail: "Two dowels (A) into the bottom edge of each divider. Stand the dividers with their shelf on the bottom and drive four screws (D) through the bottom into them. Stick two felt pads (Q) under each end panel.",
      add: divIds,
      fix: [
        ...SX.map((sx) => fx(DOWEL, zUpDowel.map((z): Vec3 => [sx * xd, yb1, z]), [0, 1, 0], div(sx), "B7")),
        ...SX.map((sx) => fx(SCREW, zUpBolt.map((z): Vec3 => [sx * xd, YB, z]), [0, 1, 0], "B7", div(sx))),
        ...SX.map((sx) => fx(PAD, [zB + 50, zF - 50].map((z): Vec3 => [sx * (xe + 22), 0, z]), [0, 1, 0], end(sx))),
      ],
      from: offset(divIds, [0, 350, 0]),
      tools: ["screwdriver"],
    },
    {
      title: "Stand it up and slide in the back panel",
      detail: "Smooth side in, down the grooves in the end panels, with the cable hole in the middle bay and the two notches at the top.",
      add: ["K8"],
      from: { K8: [0, 500, 0] },
      pose: "+y",
    },
    {
      title: "Turn the cam bolts into the top and fit the wall brackets",
      detail: "Lay the top (1) face down on a rug. Eight cam bolts (B) into its underside, two over each end panel and divider, then screw the two wall brackets (O) on at the back edge.",
      fix: [
        fx(CAM_BOLT, [...SX.flatMap((sx) => zBottomBolt.map((z): Vec3 => [sx * xEndTop, yT, z])), ...SX.flatMap((sx) => zUpBolt.map((z): Vec3 => [sx * xd, yT, z]))], [0, 1, 0], "T1"),
        fx(WALL_BRACKET, xBr.map((x): Vec3 => [x, yT, zB + 6]), [0, 1, 0], "T1"),
        fx(WALL_BRACKET_SCREW, xBr.map((x): Vec3 => [x, yT, zB + 30]), [0, 1, 0], "T1"),
      ],
      wait: ["T1"],
      from: { T1: [0, 0, OUT] },
      tools: ["screwdriver"],
      warnings: ["floor"],
    },
    {
      title: "Fix the top on",
      detail: "Two dowels (A) into the top edge of each end panel and divider. Lower the top onto them and turn the eight cam locks (C).",
      add: ["T1"],
      fix: [
        ...SX.map((sx) => fx(DOWEL, zBottomDowel.map((z): Vec3 => [sx * xEndTop, yT, z]), [0, -1, 0], end(sx), "T1")),
        ...SX.map((sx) => fx(DOWEL, zUpDowel.map((z): Vec3 => [sx * xd, yT, z]), [0, -1, 0], div(sx), "T1")),
        ...SX.map((sx) => fx(CAM, zBottomBolt.map((z): Vec3 => [sx * xe, yT - 25, z]), [sx, 0, 0], end(sx))),
        ...SX.map((sx) => fx(CAM, zUpBolt.map((z): Vec3 => [sx * xd - T / 2, yT - 25, z]), [1, 0, 0], div(sx))),
      ],
      from: { T1: [0, 400, 0] },
      tools: ["screwdriver"],
    },
    {
      title: "Screw the hinges onto the doors",
      detail: "Lay the doors face down on a rug. Two straight hinges (L) on the left and right doors (9 and 11), two cranked hinges (M) on the middle door (10), each pressed into its cup hole with two screws (F).",
      fix: doors.flatMap(doorFix),
      wait: doorIds,
      from: offset(doorIds, [0, 0, OUT]),
      tools: ["screwdriver"],
      kind: "hinges",
      warnings: ["floor"],
    },
    {
      title: "Hang the doors and fit the handles",
      detail: "Screw each hinge's plate on with four screws (F): the left door to the left end panel, the middle door to the right divider and the right door to the right end panel. Then a handle (J) on the top edge of each door, two screws (E) from behind.",
      add: doorIds,
      fix: [
        ...doors.map((d) => fx(HINGE_SCREW, hy.flatMap((y) => [-16, 16].flatMap((k) => [zf - 20, zf - 52].map((z): Vec3 => [d.face, y + k, z]))), d.fdir, d.on, d.id)),
        ...doorIds.map((id, i) => fx(HANDLE, [[dx[i], handleY, zF]], [0, 0, -1], id)),
        ...doorIds.map((id, i) => fx(HANDLE_SCREW, [-25, 25].map((k): Vec3 => [dx[i] + k, handleY, zf]), [0, 0, 1], id)),
      ],
      from: offset(doorIds, [0, 0, 400]),
      tools: ["screwdriver"],
      kind: "doors",
    },
    {
      title: "Fit the back panel brackets",
      detail: "Turn it round. Four brackets (K) along the top edge of the back panel and four along its bottom edge, each with a screw (G) into the top or the bottom.",
      fix: [
        fx(BACK_BRACKET, [...xBack.map((x): Vec3 => [x, yT - 8, zk]), ...xBack.map((x): Vec3 => [x, yb1 + 8, zk])], [0, 0, 1], "K8"),
        fx(BRACKET_SCREW, xBack.map((x): Vec3 => [x, yT, zk - 5]), [0, 1, 0], "T1"),
        fx(BRACKET_SCREW, xBack.map((x): Vec3 => [x, yb1, zk - 5]), [0, -1, 0], "B7"),
      ],
      tools: ["screwdriver"],
    },
    {
      title: "Fix it to the wall",
      detail: "Push it against the wall and mark through the two brackets. Check the wall for pipes and cables, drill, push in the plugs (P) and screw through each bracket. Fix the TV to the wall too.",
      fix: [fx(PLUG, xBr.map((x): Vec3 => [x, yT - 20, zB - 1]), [0, 0, -1]), fx(WALL_SCREW, xBr.map((x): Vec3 => [x, yT - 20, zB + 4]), [0, 0, -1], "T1")],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-hazel-entertainment-unit") return tvUnit(s);
  return null;
}

const family: Family = { names: ["KMART:HAZEL"], recipe };
export default family;
