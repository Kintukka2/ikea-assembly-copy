import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartMaterial, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's Leon Bedside Table, read from its assembly manual (K: 43541416). A box of 15 mm board on four round legs,
 * one drawer with a fluted front at the top and an open shelf below, held with cam bolts (A), cam locks (B) and
 * dowels (C). The manual builds it lying on its left side:
 *
 * - cam bolts go into both sides (3, 4) for the shelf (5); the shelf stands on the left side, then the top rail (6)
 *   and the right side go on, and the upper back panel (7) slides along the grooves from the open top end.
 * - the top (1) takes four cam bolts and goes on over the sides with dowels, the rail screwed up into it with two
 *   screws (D). Upside down, the lower back panel (8) slides in, the bottom (2) is screwed on with dowels, four leg
 *   plates (F) take four screws (G) each and the legs (14) screw into them.
 * - on its front, eight corner blocks (H) with a screw (I) each hold the back panels, and the wall strap (J) is screwed
 *   to the top's back edge. The drawer is its front (9) with cam bolts, the sides (10, 11) cam-locked on, the bottom
 *   (13) slid down the grooves and the back (12) screwed on. It slides in on the shelf: there are no runners.
 *
 * Kmart's hardware list: 12 cam bolts M6 x 35 (A), 12 cam locks 15 x 9 (B), 18 dowels 6 x 30 (C), 10 screws
 * M4 x 35 (D), one wall fixing (E: a plug, a washer and a screw), 4 leg plates (F), 16 screws M4 x 12 (G), 8 corner
 * blocks (H), 8 screws M3 x 16 (I) and one wall strap (J: the strap, a washer and a screw). Every step's count box adds
 * up to those totals. The manual gives no sizes, so the rail, the shelf height and the drawer are drawn to the
 * product's 40 x 55 x 29.5 cm in the proportions its drawings show: the rail stands on edge under the top, set back by
 * the drawer front's thickness, and the drawer front covers it and the shelf's front edge.
 */

const T = 15; // board
const BK = 3; // hardboard backs and drawer bottom
const FT = 20; // the fluted drawer front
const DT = 12; // drawer sides and back
const LEG = 125; // the legs, floor to plate
const PLATE = 5; // leg plates
const OUT = 420; // parts built away from the table wait this far in front of it

type Def = Omit<CustomFix, "count" | "at" | "dir" | "on" | "mate">;
const CAM_BOLT: Def = { kind: "camScrew", len: 35, dia: 6, name: "Cam bolt" }; // A
const CAM: Def = { kind: "cam", len: 9, dia: 15, name: "Cam lock" }; // B
const DOWEL: Def = { kind: "dowel", len: 30, dia: 6 }; // C
const SCREW: Def = { kind: "screw", len: 35, dia: 4 }; // D
const PLUG: Def = { kind: "plug", len: 30, dia: 6, included: true }; // E
const WASHER: Def = { kind: "washer", len: 1.5, dia: 12 }; // E and J
const WALL_SCREW: Def = { kind: "screw", len: 40, dia: 4, name: "Wall screw", included: true }; // E
const LEG_PLATE: Def = { kind: "plate", len: 4, dia: 60, name: "Leg plate" }; // F
const PLATE_SCREW: Def = { kind: "screw", len: 12, dia: 4, name: "Plate screw" }; // G
const BLOCK: Def = { kind: "angle", len: 16, dia: 20, name: "Corner block" }; // H
const BLOCK_SCREW: Def = { kind: "screw", len: 16, dia: 3, name: "Corner block screw" }; // I
const STRAP: Def = { kind: "strap", len: 110, dia: 20, name: "Wall strap" }; // J
const STRAP_SCREW: Def = { kind: "screw", len: 12, dia: 3.5, name: "Strap screw" }; // J

/** Fittings at exact points: what, where, the way they go in, the part they sit in and the part their other end meets. */
const fx = (def: Def, at: Vec3[], dir: Vec3, on?: string, mate?: string): CustomFix => ({ ...def, count: at.length, at, dir, ...(on ? { on } : {}), ...(mate ? { mate } : {}) });
const SX = [-1, 1] as const;
const offset = (ids: string[], v: Vec3) => Object.fromEntries(ids.map((id) => [id, v] as [string, Vec3]));

function bedside(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xo = W / 2, xi = W / 2 - T; // the sides' outer and inner faces
  const zB = -D / 2, zF = D / 2;
  const zf = zF - FT; // the shelf's and the rail's front edges, behind the drawer front
  const zk = zB + 10; // the back panels' back face, in grooves 10 mm in from the back edge
  const yB0 = LEG + PLATE, ys0 = yB0 + T, ys1 = H - T; // the bottom's underside, the sides between the bottom and the top
  const fy0 = Math.round(ys1 - (ys1 - ys0) * 0.4); // the drawer front's lower edge: the drawer takes the top two fifths
  const y5 = fy0 - 1; // the shelf's underside, behind the drawer front's lower edge
  const y5c = y5 + T / 2, y5t = y5 + T;
  const RH = 45; // the rail, on edge under the top
  const yr = ys1 - RH / 2, zr = zf - T / 2;
  const yMeet = y5c; // where the two back panels meet, behind the shelf
  // the drawer
  const xd = xi - 8; // its sides' outer faces
  const xdc = xd - DT / 2; // their centres
  const dy0 = y5t + 2, sh = Math.min(95, ys1 - RH - 3 - dy0), dyc = dy0 + sh / 2;
  const DD = 230; // the sides' length
  const dzb = zf - DD; // the sides' back ends; the back covers them
  const p = new Parts();
  p.add("T1", "1", "Top", [W, T, D], [0, H - T / 2, 0]);
  p.add("B2", "2", "Bottom", [W, T, D], [0, yB0 + T / 2, 0]);
  p.add("S3", "3", "Left side", [T, ys1 - ys0, D], [-(xo - T / 2), (ys0 + ys1) / 2, 0]);
  p.add("S4", "4", "Right side", [T, ys1 - ys0, D], [xo - T / 2, (ys0 + ys1) / 2, 0]);
  p.add("S5", "5", "Shelf", [2 * xi, T, zf - (zk + BK)], [0, y5c, (zf + zk + BK) / 2]);
  p.add("R6", "6", "Top rail", [2 * xi, RH, T], [0, yr, zr]);
  p.add("K7", "7", "Upper back panel", [2 * xi + 16, ys1 + 5 - yMeet, BK], [0, (yMeet + ys1 + 5) / 2, zk + BK / 2], "fiber");
  p.add("K8", "8", "Lower back panel", [2 * xi + 16, yMeet - (ys0 - 5), BK], [0, (ys0 - 5 + yMeet) / 2, zk + BK / 2], "fiber");
  p.add("F9", "9", "Drawer front", [2 * xi - 4, ys1 - 2 - fy0, FT], [0, (fy0 + ys1 - 2) / 2, zF - FT / 2]);
  p.add("D10", "10", "Drawer side, left", [DT, sh, DD], [-xdc, dyc, zf - DD / 2]);
  p.add("D11", "11", "Drawer side, right", [DT, sh, DD], [xdc, dyc, zf - DD / 2]);
  p.add("D12", "12", "Drawer back", [2 * xd, sh, DT], [0, dyc, dzb - DT / 2]);
  p.add("D13", "13", "Drawer bottom", [2 * (xd - DT) + 12, BK, zf + 6 - dzb], [0, dy0 + 10, (zf + 6 + dzb) / 2], "fiber");
  const legX = xo - 45, legZ = zF - 45;
  const legs = SX.flatMap((sx) => SX.map((sz) => ({ id: `L${sx < 0 ? "L" : "R"}${sz < 0 ? "B" : "F"}`, x: sx * legX, z: sz * legZ })));
  for (const l of legs) p.list.push({ id: l.id, label: "14", name: "Leg", size: [38, LEG, 38], pos: [l.x, LEG / 2, l.z], shape: "cyl", material: "wood" });
  const drawer = ["F9", "D10", "D11", "D13", "D12"];

  /* ---- fittings ---- */
  const side = (sx: number) => (sx < 0 ? "S3" : "S4");
  const dSide = (sx: number) => (sx < 0 ? "D10" : "D11");
  const z5 = (zf + zk + BK) / 2;
  const zShelfBolt = [z5 - 85, z5 + 85], zShelfDowel = [z5 - 40, z5 + 40];
  const shelfBolts = SX.map((sx) => fx(CAM_BOLT, zShelfBolt.map((z): Vec3 => [sx * xi, y5c, z]), [sx, 0, 0], side(sx)));
  const shelfCams = (sx: number) => fx(CAM, zShelfBolt.map((z): Vec3 => [sx * (xi - 25), y5t, z]), [0, -1, 0], "S5");
  const zTopBolt = [-97, 97], zTopDowel = [-60, 60];
  const xRailDowel = [-80, 80], xRailScrew = [-115, 115];
  const lowCorner = [ys0 + 25, yMeet - 30], highCorner = [yMeet + 30, ys1 - 25];
  const strapY = H - T / 2, wallY = H + 45;
  const dys = [dy0 + 25, dy0 + sh - 25];

  const lie = "+x" as const; // on its left side
  const steps: CustomStep[] = [
    {
      title: "Turn the cam bolts into the sides",
      detail: "Lay both sides (3 and 4) flat, inside face up. Two cam bolts (A) into each, at the shelf's holes, by hand until they stop.",
      fix: shelfBolts,
      wait: ["S3", "S4"],
      from: offset(["S3", "S4"], [0, 0, OUT]),
      tools: ["screwdriver"],
    },
    {
      title: "Stand the shelf on the left side",
      detail: "Lay the left side (3) on a rug, inside up. Push two dowels (C) into it, press the shelf (5) onto the dowels and bolts and turn its two cam locks (B).",
      add: ["S3", "S5"],
      fix: [fx(DOWEL, zShelfDowel.map((z): Vec3 => [-xi, y5c, z]), [-1, 0, 0], "S3", "S5"), shelfCams(-1)],
      from: { S5: [300, 0, 0] }, // lying on its left side, "above" is to the right
      pose: lie,
      tools: ["screwdriver"],
      warnings: ["floor"],
    },
    {
      title: "Fit the top rail and the right side",
      detail: "A dowel (C) into each end of the top rail (6) and two into the free end of the shelf. Stand the rail on the left side at the open top end, lower the right side (4) onto the rail and the shelf, and turn the shelf's other two cam locks (B).",
      add: ["R6", "S4"],
      fix: [
        ...SX.map((sx) => fx(DOWEL, [[sx * xi, yr, zr]], [-sx, 0, 0], "R6", side(sx))),
        fx(DOWEL, zShelfDowel.map((z): Vec3 => [xi, y5c, z]), [-1, 0, 0], "S5", "S4"),
        shelfCams(1),
      ],
      from: { R6: [300, 0, 0], S4: [400, 0, 0] },
      tools: ["screwdriver"],
      check: "square",
    },
    {
      title: "Slide in the upper back panel",
      detail: "Smooth side in, along the grooves from the open top end until it reaches the shelf.",
      add: ["K7"],
      from: { K7: [0, 400, 0] },
    },
    {
      title: "Turn the cam bolts into the top",
      detail: "Lay the top (1) face down. Four cam bolts (A) into its underside, one near each corner.",
      fix: [fx(CAM_BOLT, SX.flatMap((sx) => zTopBolt.map((z): Vec3 => [sx * (xo - T / 2), ys1, z])), [0, 1, 0], "T1")],
      wait: ["T1"],
      from: { T1: [0, 0, OUT] },
      tools: ["screwdriver"],
    },
    {
      title: "Fix the top on",
      detail: "Two dowels (C) into the top edge of each side and two into the rail. Push the top onto them, turn the four cam locks (B) inside the sides and drive two screws (D) up through the rail into the top.",
      add: ["T1"],
      fix: [
        ...SX.map((sx) => fx(DOWEL, zTopDowel.map((z): Vec3 => [sx * (xo - T / 2), ys1, z]), [0, -1, 0], side(sx), "T1")),
        fx(DOWEL, xRailDowel.map((x): Vec3 => [x, ys1, zr]), [0, -1, 0], "R6", "T1"),
        ...SX.map((sx) => fx(CAM, zTopBolt.map((z): Vec3 => [sx * xi, ys1 - 25, z]), [sx, 0, 0], side(sx))),
        fx(SCREW, xRailScrew.map((x): Vec3 => [x, ys1 - RH, zr]), [0, 1, 0], "R6", "T1"),
      ],
      from: { T1: [0, 400, 0] },
      tools: ["screwdriver"],
    },
    {
      title: "Turn it upside down and slide in the lower back panel",
      detail: "Stand it on its top. Slide the lower back panel (8) down the grooves from the open end until it reaches the shelf.",
      add: ["K8"],
      from: { K8: [0, -400, 0] },
      pose: "-y",
    },
    {
      title: "Screw on the bottom",
      detail: "Two dowels (C) into the end of each side. Press the bottom (2) on and drive four screws (D) through it into the sides.",
      add: ["B2"],
      fix: [
        ...SX.map((sx) => fx(DOWEL, zTopDowel.map((z): Vec3 => [sx * (xo - T / 2), ys0, z]), [0, 1, 0], side(sx), "B2")),
        ...SX.map((sx) => fx(SCREW, zTopBolt.map((z): Vec3 => [sx * (xo - T / 2), yB0, z]), [0, 1, 0], "B2", side(sx))),
      ],
      from: { B2: [0, -400, 0] },
      tools: ["screwdriver"],
    },
    {
      title: "Screw the leg plates on",
      detail: "A plate (F) near each corner of the bottom, four small screws (G) each.",
      fix: [
        fx(LEG_PLATE, legs.map((l): Vec3 => [l.x, yB0, l.z]), [0, 1, 0], "B2"),
        fx(
          PLATE_SCREW,
          legs.flatMap((l) => SX.flatMap((a) => SX.map((b): Vec3 => [l.x + a * 21, yB0 - 4, l.z + b * 21]))),
          [0, 1, 0],
          "B2",
        ),
      ],
      tools: ["screwdriver"],
      kind: "legs",
    },
    {
      title: "Screw in the legs",
      detail: "Turn each leg (14) into its plate by hand until it is tight.",
      add: legs.map((l) => l.id),
      from: offset(
        legs.map((l) => l.id),
        [0, -300, 0],
      ),
      kind: "legs",
    },
    {
      title: "Fit the corner blocks and the wall strap",
      detail: "Lay it on its front. Push a block (H) into each corner behind both back panels and fix each with a screw (I) into the side. Screw the strap (J) to the middle of the top's back edge, its washer under the screw.",
      fix: [
        ...SX.map((sx) => fx(BLOCK, highCorner.map((y): Vec3 => [sx * (xi - 11), y, zk]), [0, 0, 1], "K7")),
        ...SX.map((sx) => fx(BLOCK, lowCorner.map((y): Vec3 => [sx * (xi - 11), y, zk]), [0, 0, 1], "K8")),
        ...SX.map((sx) => fx(BLOCK_SCREW, [...lowCorner, ...highCorner].map((y): Vec3 => [sx * xi, y, zk - 5]), [sx, 0, 0], side(sx))),
        fx(STRAP, [[0, strapY, zB - 1]], [0, 0, 1], "T1"),
        fx(WASHER, [[0, strapY, zB]], [0, 0, 1], "T1"),
        fx(STRAP_SCREW, [[0, strapY, zB - 1.5]], [0, 0, 1], "T1"),
      ],
      pose: "-z",
      tools: ["screwdriver"],
    },
    {
      title: "Turn the cam bolts into the drawer front",
      detail: "Stand the table up. Lay the drawer front (9) face down on a rug and turn four cam bolts (A) into its back, two near each end.",
      fix: [fx(CAM_BOLT, SX.flatMap((sx) => dys.map((y): Vec3 => [sx * xdc, y, zf])), [0, 0, 1], "F9")],
      wait: ["F9"],
      from: offset(drawer, [0, 0, OUT]),
      pose: "+y",
      tools: ["screwdriver"],
      kind: "drawer",
      warnings: ["floor"],
    },
    {
      title: "Fit the drawer sides",
      detail: "A dowel (C) into the front for each side. Press the left side (10) and the right side (11) onto the bolts, grooves facing in, and turn the four cam locks (B).",
      fix: [
        ...SX.map((sx) => fx(DOWEL, [[sx * xdc, dyc, zf]], [0, 0, 1], "F9", dSide(sx))),
        ...SX.map((sx) => fx(CAM, dys.map((y): Vec3 => [sx * (xd - DT), y, zf - 25]), [sx, 0, 0], dSide(sx))),
      ],
      wait: ["D10", "D11"],
      from: offset(drawer, [0, 0, OUT]),
      tools: ["screwdriver"],
      kind: "drawer",
    },
    {
      title: "Slide in the drawer bottom",
      detail: "Down the grooves in the sides and the front, smooth side up.",
      wait: ["D13"],
      from: offset(drawer, [0, 0, OUT]),
      kind: "drawer",
    },
    {
      title: "Screw on the drawer back",
      detail: "Lay the back (12) across the ends of the sides and drive two screws (D) through it into each side.",
      fix: SX.map((sx) => fx(SCREW, dys.map((y): Vec3 => [sx * xdc, y, dzb - DT]), [0, 0, 1], "D12", dSide(sx))),
      wait: ["D12"],
      from: offset(drawer, [0, 0, OUT]),
      tools: ["screwdriver"],
      kind: "drawer",
    },
    {
      title: "Slide the drawer in",
      detail: "Rest it on the shelf and push it home. It runs on the shelf, without runners.",
      add: drawer,
      from: offset(drawer, [0, 0, OUT]),
      kind: "drawer",
    },
    {
      title: "Fix it to the wall",
      detail: "Push the table against the wall and mark where the strap meets it. Check the wall for pipes and cables, drill, push in the plug (E) and screw the strap to the wall through its washer.",
      fix: [fx(PLUG, [[0, wallY, zB - 1]], [0, 0, -1]), fx(WASHER, [[0, wallY, zB + 2]], [0, 0, -1], "T1"), fx(WALL_SCREW, [[0, wallY, zB + 3.5]], [0, 0, -1], "T1")],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts: p.list, steps };
}

class Parts {
  list: CustomPart[] = [];
  add(id: string, label: string, name: string, size: Vec3, pos: Vec3, material: PartMaterial = "board") {
    this.list.push({ id, label, name, size, pos, material });
    return id;
  }
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-leon-bedside-table") return bedside(s);
  return null;
}

const family: Family = { names: ["KMART:LEON"], recipe };
export default family;
