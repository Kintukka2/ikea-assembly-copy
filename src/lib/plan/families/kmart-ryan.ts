import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";
import { rotate } from "../math";

/**
 * Kmart's RYAN line, read from its assembly manuals.
 *
 * - Ribbed Console Table (43643486; the manual also names 43395569 and 43423859): an oval top (1) on two ribbed
 *   half round legs (2), open on their inner side, each with a half round plate at its top, and a back rail (3) whose
 *   stepped ends tuck under the legs' plates. Upside down on the top, each leg is bolted on with four bolts (A)
 *   through its plate; the rail goes between them with four long bolts (B), the two at its ends through the leg
 *   plates as well. Felt pads (G) go on the legs' ends, and stood up two wall brackets (D) are screwed (C) under the
 *   back of the top and fixed to the wall (screws E, plugs F). Kmart's hardware: 8 A (M6 x 25 mm), 4 B (M6 x 55
 *   mm), 2 C (M4 x 12 mm), 2 D, 2 E (M4 x 35 mm), 2 F, 6 G and a hex key H. The manual prints no sizes: the legs are
 *   drawn as round as the top's ends, the rail at the back, where the brackets go.
 *
 * Part numbers and hardware letters are Kmart's own, so the guide reads against the paper.
 */

type XZ = [number, number];
type Fx = Omit<CustomFix, "count" | "at"> & { at: Vec3[] };
const fx = (f: Fx): CustomFix => ({ ...f, count: f.at.length });
const deg = (d: number) => (d * Math.PI) / 180;
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Points round an arc in plan, about (cx, 0), from angle a0 to a1 (radians, from +x towards +z), both ends included. */
function arc(cx: number, r: number, a0: number, a1: number, n: number): XZ[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [r1(cx + r * Math.cos(a)), r1(r * Math.sin(a))];
  });
}
/** A board lying level, cut to a plan outline (x, z as they sit in the product), from height y0 to y1. */
const flat = (outline: XZ[], y0: number, y1: number): PartPiece => ({ shape: "slab", outline, size: [0, y1 - y0, 0], pos: [0, (y0 + y1) / 2, 0] });
const at = (cx: number, r: number, a: number, y: number): Vec3 => [r1(cx + r * Math.cos(a)), y, r1(r * Math.sin(a))];

/** Pieces drawn where they sit in the finished product, made into one part centred on their bounding box. */
function part(id: string, label: string, name: string, abs: PartPiece[], material: CustomPart["material"]): CustomPart {
  const lo: Vec3 = [Infinity, Infinity, Infinity], hi: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const q of abs) {
    const corners: Vec3[] =
      q.shape === "slab" && q.outline
        ? q.outline.flatMap(([x, z]) => [-1, 1].map((s): Vec3 => [x, (s * q.size[1]) / 2, z]))
        : [-1, 1].flatMap((a) => [-1, 1].flatMap((b) => [-1, 1].map((c): Vec3 => [(a * q.size[0]) / 2, (b * q.size[1]) / 2, (c * q.size[2]) / 2])));
    for (const c of corners) {
      const v = rotate(c, q.rot ?? [0, 0, 0]);
      for (let k = 0; k < 3; k++) {
        lo[k] = Math.min(lo[k], q.pos[k] + v[k]);
        hi[k] = Math.max(hi[k], q.pos[k] + v[k]);
      }
    }
  }
  const pos: Vec3 = [r1((lo[0] + hi[0]) / 2), r1((lo[1] + hi[1]) / 2), r1((lo[2] + hi[2]) / 2)];
  const size: Vec3 = [r1(hi[0] - lo[0]), r1(hi[1] - lo[1]), r1(hi[2] - lo[2])];
  return { id, label, name, size, pos, material, pieces: abs.map((q) => ({ ...q, pos: [r1(q.pos[0] - pos[0]), r1(q.pos[1] - pos[1]), r1(q.pos[2] - pos[2])] as Vec3 })) };
}

/* ---------- Ribbed Console Table ---------- */

const BOLT_A = { kind: "bolt", len: 25, dia: 6, name: "Bolt" } as const;
const BOLT_B = { kind: "bolt", len: 55, dia: 6, name: "Long bolt" } as const;
const SCREW_C = { kind: "screw", len: 12, dia: 4, name: "Screw" } as const;
const BRACKET_D = { kind: "angle", len: 30, dia: 20, name: "Wall bracket" } as const;
const SCREW_E = { kind: "screw", len: 35, dia: 4, name: "Wall screw", included: true } as const;
const PLUG_F = { kind: "plug", len: 30, dia: 6, name: "Wall plug", included: true } as const;
const PAD_G = { kind: "glide", len: 4, dia: 20, name: "Felt pad" } as const;

function consoleTable(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const TT = 25; // the top
  const yT = H - TT; // its underside
  const R = D / 2; // the legs' outside, as round as the top's ends
  const cx = W / 2 - R; // middles of the round ends
  const RD = 24, NR = 20; // ribs round each leg
  const rr = R - RD / 2;
  const PT = 18; // each leg's plate
  const rp = R - RD; // the plate, inside the ribs
  const RH = 40, RTk = 30; // the rail: height and thickness
  const zr = -R + 35 + RTk / 2; // the rail, along the back
  const reach = 55; // how far its stepped ends go in under the plates
  const yR = yT - RH; // its underside

  const ribs = Array.from({ length: NR }, (_, i): PartPiece => {
    const a = -Math.PI / 2 + ((i + 0.5) * Math.PI) / NR;
    return { shape: "cyl", size: [RD, yT, RD], pos: [r1(cx + rr * Math.cos(a)), yT / 2, r1(rr * Math.sin(a))] };
  });
  const legR = part("LR", "2", "Ribbed leg", [...ribs, flat(arc(cx, rp, -Math.PI / 2, Math.PI / 2, 16), yT - PT, yT)], "wood");
  const legL: CustomPart = { ...legR, id: "LL", pos: rotate(legR.pos, [0, Math.PI, 0]).map(r1) as Vec3, rot: [0, Math.PI, 0] };
  const oval = [...arc(cx, R, -Math.PI / 2, Math.PI / 2, 16), ...arc(-cx, R, Math.PI / 2, (3 * Math.PI) / 2, 16)];
  const top = part("T1", "1", "Top", [flat(oval, yT, H)], "board");
  const rail = part("R3", "3", "Back rail", [
    { shape: "box", size: [2 * cx, RH, RTk], pos: [0, yR + RH / 2, zr] },
    ...[-1, 1].map((sx): PartPiece => ({ shape: "box", size: [reach, RH - PT, RTk], pos: [sx * (cx + reach / 2), yR + (RH - PT) / 2, zr] })),
  ], "board");
  const parts: CustomPart[] = [top, legL, legR, rail];

  const ends = [-1, 1] as const;
  const leg = (sx: number) => (sx < 0 ? "LL" : "LR");
  // four bolts through each leg's plate into the top
  const legBolts = ends.map((sx) => fx({ ...BOLT_A, at: [-45, -15, 15, 45].map((d) => at(sx * cx, 100, (sx < 0 ? Math.PI : 0) + deg(d), yT - PT)), dir: [0, 1, 0], on: leg(sx), mate: "T1" }));
  // the rail: a long bolt up through each stepped end and two through its middle
  const railBolts = fx({ ...BOLT_B, at: [-(cx + 30), -130, 130, cx + 30].map((x): Vec3 => [x, yR, zr]), dir: [0, 1, 0], on: "R3", mate: "T1" });
  const pads = ends.map((sx) => fx({ ...PAD_G, at: [-60, 0, 60].map((d) => at(sx * cx, rr, (sx < 0 ? Math.PI : 0) + deg(d), 0)), dir: [0, 1, 0], on: leg(sx) }));
  // the wall brackets under the back of the top, their tabs hanging at its back edge
  const xb = cx - 70;
  const zb = -R + 15;
  const brackets: CustomFix[] = [
    fx({ ...BRACKET_D, at: ends.map((sx): Vec3 => [sx * xb, yT, zb]), dir: [0, 1, 0], on: "T1" }),
    fx({ ...SCREW_C, at: ends.map((sx): Vec3 => [sx * (xb - 25), yT, zb]), dir: [0, 1, 0], on: "T1" }),
  ];
  const wall: CustomFix[] = [
    fx({ ...PLUG_F, at: ends.map((sx): Vec3 => [sx * xb, yT - 18, -R - 30]), dir: [0, 0, -1] }),
    fx({ ...SCREW_E, at: ends.map((sx): Vec3 => [sx * xb, yT - 18, -R + 2]), dir: [0, 0, -1], on: "T1" }),
  ];

  const steps: CustomStep[] = [
    {
      title: "Bolt the legs to the top",
      detail: "Lay the top (1) face down on a rug. Stand a leg (2) upside down on each end, its plate on the top and its open side facing the middle, and turn four bolts (A) through each plate into the top with the hex key (H). Leave them loose.",
      add: ["T1", "LL", "LR"],
      fix: legBolts,
      from: { LL: [0, -350, 0], LR: [0, -350, 0] },
      tools: ["allen"],
      pose: "-y",
      warnings: ["floor", "loose"],
    },
    {
      title: "Bolt in the back rail",
      detail: "Lay the rail (3) along the back of the top, its stepped ends tucked over the legs' plates, and turn the four long bolts (B) through it into the top: one through each end and two through the middle.",
      add: ["R3"],
      fix: [railBolts],
      from: { R3: [0, -300, 0] },
      tools: ["allen"],
      pose: "-y",
      warnings: ["loose"],
    },
    {
      title: "Stick on the felt pads",
      detail: "Tighten all twelve bolts, then press three felt pads (G) onto the end of each leg.",
      fix: pads,
      tools: ["allen"],
      pose: "-y",
    },
    {
      title: "Stand it up and fit the wall brackets",
      detail: "Turn it over. Screw a wall bracket (D) under the back of the top near each leg with a screw (C), its tab hanging down at the back edge.",
      fix: brackets,
      tools: ["screwdriver"],
      pose: "+y",
    },
    {
      title: "Fix it to the wall",
      detail: "Stand it against the wall, mark through the two tabs, drill, push in the wall plugs (F) and drive the wall screws (E) through the tabs into them. Check the wall for pipes and cables first. The top takes up to 15 kg.",
      fix: wall,
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-ryan-ribbed-console-table") return consoleTable(s);
  return null; // the Ribbed Coffee Table is still to be read
}

const family: Family = { names: ["KMART:RYAN"], recipe };
export default family;
