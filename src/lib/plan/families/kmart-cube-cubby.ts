import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's 3 Cube Storage Unit with Cubby (43746781), read from its assembly manual ("3 Cube with Cubby Storage").
 * Three open cubes on the left; on the right two cubby bins, each with a front board (7) that leans out at the top,
 * so the right side (4) and the divider (5) have a zigzag front edge. All of it goes together with cam bolts, cam
 * locks and wooden dowels, built lying on the right side:
 *
 * - Cam bolts into the left side (3), the right side (4) and both faces of the divider (5).
 * - On side 4: the cubby shelf (8) and the two cubby fronts (7), then the divider on top of them, then the two
 *   shelves (6) on the divider and the left side on top of those. Then the top (1) on its cam bolts.
 * - The two hardboard backs (9 and 10) slide down the grooves from the open bottom end, and the bottom (2) closes it
 *   with dowels and screws. Stood up, eight corner blocks hold the backs, a strap bracket goes on the top, caps
 *   cover the cam locks that show, and the bracket is screwed to the wall.
 *
 * Kmart's bag: A 26 cam bolts, B 26 cam locks, C 28 dowels 6 x 30, D 7 screws 4 x 35 (six through the bottom, one
 * into the wall), E 8 corner blocks, F their 8 screws 3 x 16, G the wall bracket, H its 2 screws 4 x 12, I a wall
 * plug, J 14 caps. Every step's count box adds up to the list, so there was nothing to choose between.
 * The manual prints no size; the unit is Kmart's listed 70 x 92 x 35 cm, 35 cm being the depth at the cubby fronts.
 * Where the caps go is read from the drawing of step 12: over the cam locks inside the cubby fronts and the six
 * under the top. Part numbers are Kmart's own labels; fittings have plain names and the letters are in the step text.
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

const BOLT_A: Def = { kind: "camScrew", len: 35, dia: 6 }; // A
const CAM_B: Def = { kind: "cam", len: 9, dia: 15 }; // B
const DOWEL_C: Def = { kind: "dowel", len: 30, dia: 6 }; // C
const SCREW_D: Def = { kind: "screw", len: 35, dia: 4, name: "Screw" }; // D
const BLOCK_E: Def = { kind: "angle", len: 16, dia: 20, name: "Corner block" }; // E
const SCREW_F: Def = { kind: "screw", len: 16, dia: 3, name: "Corner block screw" }; // F
const BRACKET_G: Def = { kind: "angle", len: 60, dia: 20, name: "Wall bracket" }; // G
const SCREW_H: Def = { kind: "screw", len: 12, dia: 4, name: "Bracket screw" }; // H
const PLUG_I: Def = { kind: "plug", len: 30, dia: 6, included: true }; // I
const CAP_J: Def = { kind: "cap", len: 1, dia: 15 }; // J

const T = 15; // every board
const BACK = 3; // hardboard

function cubby(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const NOSE = 60; // how far the cubby fronts lean out past the cubes
  const DC = D - NOSE; // the cubes' depth
  const zb = -D / 2; // the back edge of every board
  const zf = zb + DC; // the front of the cubes
  const zm = (zb + zf) / 2;
  const LS = H - 2 * T; // the sides and divider stand between the bottom and the top
  const CW = (W - 3 * T) / 2; // each column, inside
  const xL = -(T / 2 + CW / 2), xR = -xL; // middle of the left (cubes) and right (cubbies) columns
  const x3 = -(W / 2 - T / 2), x4 = -x3; // the sides
  const i3 = -(W / 2 - T), i4 = -i3; // their inner faces
  const f5 = T / 2; // the divider's faces, at -f5 and f5
  const cube = (LS - 2 * T) / 3;
  const y6 = [T + cube + T / 2, T + 2 * cube + T + T / 2]; // the two shelves
  const y8 = H / 2; // the cubby shelf, halfway up
  const bin = y8 - T / 2 - T; // each cubby bin's height
  const RISE = Math.round(bin * 0.31); // a cubby front's height, from the drawings
  const L7 = Math.hypot(RISE, NOSE);
  const tilt = Math.atan2(NOSE, RISE);
  const yN = [T, y8 + T / 2]; // where each cubby front's lower edge sits: on the bottom, and on the cubby shelf

  // the zigzag side: back edge straight, the front leaning out to each cubby front's top edge and back again
  const yc = H / 2;
  const zig: PartPiece[] = [
    {
      shape: "slab",
      outline: [
        [T - yc, zb],
        [T - yc, zf],
        [yN[0] + RISE - yc, D / 2],
        [yN[1] - yc, zf],
        [yN[1] + RISE - yc, D / 2],
        [H - T - yc, zf],
        [H - T - yc, zb],
      ],
      size: [LS, T, D],
      pos: [0, 0, 0],
      rot: [0, 0, Math.PI / 2],
    },
  ];

  // a cubby front: its outer face runs from its lower edge at the front of the cubes up to the nose
  const along: [number, number] = [RISE / L7, NOSE / L7]; // (y, z) up its face
  const back: [number, number] = [NOSE / L7, -RISE / L7]; // (y, z) from its outer face towards the inside
  const front7 = (k: number) => ({ y: yN[k] + RISE / 2 + (T / 2) * back[0], z: zf + NOSE / 2 + (T / 2) * back[1] });
  const at7 = (k: number, x: number, t: number, face = 0): Vec3 => {
    const c = front7(k);
    return [x, c.y + t * along[0] + face * back[0], c.z + t * along[1] + face * back[1]];
  };

  const zBack = zb + 15 + BACK / 2; // the backs, in grooves 15 mm in from the back edges
  const z6 = zBack + BACK / 2 + 1; // shelves stop just in front of the backs
  const d6 = zf - z6, d8 = zf - 15 - z6;
  const parts: CustomPart[] = [
    { id: "P1", label: "1", name: "Top", size: [W, T, DC], pos: [0, H - T / 2, zm] },
    { id: "P2", label: "2", name: "Bottom", size: [W, T, DC], pos: [0, T / 2, zm] },
    { id: "P3", label: "3", name: "Left side", size: [T, LS, DC], pos: [x3, yc, zm] },
    { id: "P4", label: "4", name: "Right side", size: [T, LS, D], pos: [x4, yc, 0], pieces: zig },
    { id: "P5", label: "5", name: "Divider", size: [T, LS, D], pos: [0, yc, 0], pieces: zig },
    { id: "P6a", label: "6", name: "Shelf", size: [CW, T, d6], pos: [xL, y6[0], z6 + d6 / 2] },
    { id: "P6b", label: "6", name: "Shelf", size: [CW, T, d6], pos: [xL, y6[1], z6 + d6 / 2] },
    { id: "P8", label: "8", name: "Cubby shelf", size: [CW, T, d8], pos: [xR, y8, z6 + d8 / 2] },
    ...[0, 1].map((k): CustomPart => {
      const c = front7(k);
      return { id: k ? "P7u" : "P7l", label: "7", name: "Cubby front", size: [CW, L7, T], pos: [xR, c.y, c.z], rot: [tilt, 0, 0] };
    }),
    { id: "K9", label: "9", name: "Left back panel", size: [CW + 12, LS + 12, BACK], pos: [xL, yc, zBack], material: "fiber" },
    { id: "K10", label: "10", name: "Right back panel", size: [CW + 12, LS + 12, BACK], pos: [xR, yc, zBack], material: "fiber" },
  ];

  // two cam bolts and their cams at each end of a board, dowels outside them
  const zz = (z0: number, z1: number) => ({ bolt: [z0 + 50, z1 - 50], dowel: [z0 + 25, z1 - 25] });
  const s6 = zz(z6, zf), s8 = zz(z6, zf - 15), sT = zz(zb, zf);
  const shelfBolts = (x: number, dir: 1 | -1, on: string, ids: string[], ys: number[], zs: number[]) => ids.map((id, i) => fx(BOLT_A, zs.map((z): Vec3 => [x, ys[i], z]), [dir, 0, 0], on, id));
  const shelfCams = (x: number, id: string, y: number, zs: number[]) => fx(CAM_B, zs.map((z): Vec3 => [x, y - T / 2, z]), [0, 1, 0], id);
  const ID7 = ["P7l", "P7u"];
  const bolts7 = (x: number, dir: 1 | -1, on: string) => [0, 1].map((k) => fx(BOLT_A, [-45, 45].map((t) => at7(k, x, t)), [dir, 0, 0], on, ID7[k]));
  const cams7 = (x: number) => [0, 1].map((k) => fx(CAM_B, [-45, 45].map((t) => at7(k, x, t, T / 2)), [0, -back[0], -back[1]], ID7[k]));
  const caps7 = (x: number) => [0, 1].map((k) => fx(CAP_J, [-45, 45].map((t) => at7(k, x, t, T / 2)), [0, -back[0], -back[1]], ID7[k]));
  // the top's cams, in the faces of 3, 5 and 4 just under it: 3's and 4's inner faces, the divider's left face
  const topCam = [
    { id: "P3", x: i3, dir: [-1, 0, 0] as Vec3 },
    { id: "P5", x: -f5, dir: [1, 0, 0] as Vec3 },
    { id: "P4", x: i4, dir: [1, 0, 0] as Vec3 },
  ];
  const uprights = [
    { id: "P3", x: x3 },
    { id: "P5", x: 0 },
    { id: "P4", x: x4 },
  ];
  // corner blocks behind each back, on the bottom and under the top
  const zE = zb + 8;
  const blockX = [i3 + 20, -f5 - 20, f5 + 20, i4 - 20];
  const blocks = (def: Def) => [fx(def, blockX.map((x): Vec3 => [x, T, zE]), [0, -1, 0], "P2"), fx(def, blockX.map((x): Vec3 => [x, H - T, zE]), [0, 1, 0], "P1")];
  const SIDE: Vec3 = [0, 0, 520]; // loose panels wait in front of it

  const steps: CustomStep[] = [
    {
      title: "Screw cam bolts into both sides",
      detail: "Turn four cam bolts (A) into the inside face of left side 3 and six into right side 4, by hand, until only the neck shows. Lay side 4 flat, bolts up.",
      wait: ["P3"],
      from: { P3: SIDE },
      fix: [...shelfBolts(i3, -1, "P3", ["P6a", "P6b"], y6, s6.bolt), ...shelfBolts(i4, 1, "P4", ["P8"], [y8], s8.bolt), ...bolts7(i4, 1, "P4")],
      tools: ["screwdriver"],
      pose: "-x",
    },
    {
      title: "Screw cam bolts into the divider",
      detail: "Four cam bolts (A) into one face of divider 5, for the shelves; turn it over and six into the other face, for the cubbies.",
      wait: ["P5"],
      from: { P5: SIDE },
      fix: [...shelfBolts(-f5, 1, "P5", ["P6a", "P6b"], y6, s6.bolt), ...shelfBolts(f5, -1, "P5", ["P8"], [y8], s8.bolt), ...bolts7(f5, -1, "P5")],
      tools: ["screwdriver"],
      pose: "-x",
    },
    {
      title: "Fit the cubby shelf and fronts to side 4",
      detail: "Push dowels (C) into side 4: two for cubby shelf 8 and one for each cubby front 7. Press them onto the dowels and bolts, then drop a cam lock (B) into each round hole, six in all, arrow to the edge, and turn it until it catches.",
      add: ["P8", "P7u", "P7l"],
      fix: [
        fx(DOWEL_C, s8.dowel.map((z): Vec3 => [i4, y8, z]), [1, 0, 0], "P4", "P8"),
        ...[0, 1].map((k) => fx(DOWEL_C, [at7(k, i4, 0)], [1, 0, 0], "P4", ID7[k])),
        shelfCams(i4 - 25, "P8", y8, s8.bolt),
        ...cams7(i4 - 25),
      ],
      tools: ["screwdriver"],
      pose: "-x",
      warnings: ["loose"],
    },
    {
      title: "Fix the divider on top",
      detail: "Push four dowels (C) into the free ends of the cubby shelf and fronts, lower divider 5 onto them, cubby side down, and lock the six cam locks (B).",
      add: ["P5"],
      fix: [
        fx(DOWEL_C, s8.dowel.map((z): Vec3 => [f5, y8, z]), [1, 0, 0], "P8", "P5"),
        ...[0, 1].map((k) => fx(DOWEL_C, [at7(k, f5, 0)], [1, 0, 0], ID7[k], "P5")),
        shelfCams(f5 + 25, "P8", y8, s8.bolt),
        ...cams7(f5 + 25),
      ],
      tools: ["screwdriver"],
      pose: "-x",
    },
    {
      title: "Fit the two shelves to the divider",
      detail: "Push two dowels (C) into the divider for each shelf 6, press the shelves on and lock each with two cam locks (B).",
      add: ["P6a", "P6b"],
      fix: [
        ...["P6a", "P6b"].map((id, i) => fx(DOWEL_C, s6.dowel.map((z): Vec3 => [-f5, y6[i], z]), [1, 0, 0], "P5", id)),
        ...["P6a", "P6b"].map((id, i) => shelfCams(-f5 - 25, id, y6[i], s6.bolt)),
      ],
      tools: ["screwdriver"],
      pose: "-x",
    },
    {
      title: "Fix the left side on",
      detail: "Two dowels (C) into the free end of each shelf, then lower side 3 onto them, bolts down, and lock the four cam locks (B).",
      add: ["P3"],
      fix: [
        ...["P6a", "P6b"].map((id, i) => fx(DOWEL_C, s6.dowel.map((z): Vec3 => [i3, y6[i], z]), [1, 0, 0], id, "P3")),
        ...["P6a", "P6b"].map((id, i) => shelfCams(i3 + 25, id, y6[i], s6.bolt)),
      ],
      tools: ["screwdriver"],
      pose: "-x",
      check: "square",
    },
    {
      title: "Screw cam bolts into the top",
      detail: "Six cam bolts (A), into the holes along both ends and the middle of top 1, by hand.",
      wait: ["P1"],
      from: { P1: SIDE },
      fix: uprights.map((u) => fx(BOLT_A, sT.bolt.map((z): Vec3 => [u.x, H - T, z]), [0, 1, 0], "P1", u.id)),
      tools: ["screwdriver"],
      pose: "-x",
    },
    {
      title: "Fix the top on",
      detail: "Push two dowels (C) into the top end of each side and the divider, press the top onto them and the bolts, and lock its six cam locks (B) from inside.",
      add: ["P1"],
      fix: [
        ...uprights.map((u) => fx(DOWEL_C, sT.dowel.map((z): Vec3 => [u.x, H - T, z]), [0, -1, 0], u.id, "P1")),
        ...topCam.map((c) => fx(CAM_B, sT.bolt.map((z): Vec3 => [c.x, H - T - 25, z]), c.dir, c.id)),
      ],
      tools: ["screwdriver"],
      pose: "-x",
    },
    {
      title: "Slide in the backs",
      detail: "From the open bottom end, slide back 9 down the grooves behind the cubes and back 10 behind the cubbies, all the way to the top.",
      add: ["K9", "K10"],
      from: { K9: [0, -720, 0], K10: [0, -720, 0] },
      pose: "-x",
    },
    {
      title: "Screw on the bottom",
      detail: "Two dowels (C) into the bottom end of each side and the divider, then press bottom 2 on and drive two screws (D) through it into each one.",
      add: ["P2"],
      from: { P2: [0, -360, 0] },
      fix: [
        ...uprights.map((u) => fx(DOWEL_C, sT.dowel.map((z): Vec3 => [u.x, T, z]), [0, 1, 0], u.id, "P2")),
        ...uprights.map((u) => fx(SCREW_D, sT.bolt.map((z): Vec3 => [u.x, 0, z]), [0, 1, 0], "P2", u.id)),
      ],
      tools: ["screwdriver"],
      pose: "-x",
    },
    {
      title: "Stand it up and fit the corner blocks",
      detail: "Stand it upright with its back to you. Press a corner block (E) into each corner behind the two backs and screw it to the top or bottom (F). Screw the strap bracket (G) onto the top at the back with two short screws (H), its tab up at the wall side.",
      fix: [...blocks(BLOCK_E), ...blocks(SCREW_F), fx(BRACKET_G, [[0, H, zb + 30]], [0, -1, 0], "P1"), fx(SCREW_H, [0, 1].map((k): Vec3 => [0, H, zb + 40 + 30 * k]), [0, -1, 0], "P1")],
      tools: ["screwdriver"],
      pose: "+y",
    },
    {
      title: "Cap the cam locks",
      detail: "Press a cap (J) over each cam lock that shows: four inside each cubby front and the six just under the top.",
      fix: [...caps7(i4 - 25), ...caps7(f5 + 25), ...topCam.map((c) => fx(CAP_J, sT.bolt.map((z): Vec3 => [c.x, H - T - 25, z]), c.dir, c.id))],
    },
    {
      title: "Fix it to the wall",
      detail: "Mark through the bracket's tab, drill, push in the plug (I) and drive the last long screw (D) through the tab into it. Check the wall for pipes and cables first.",
      fix: [fx(PLUG_I, [[0, H + 12, zb - 30]], [0, 0, -1]), fx(SCREW_D, [[0, H + 12, zb + 2]], [0, 0, -1])],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-3-cube-storage-unit-with-cubby") return cubby(s);
  return null;
}

const family: Family = { names: ["KMART:CUBE CUBBY"], recipe };
export default family;
