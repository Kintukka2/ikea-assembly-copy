import type { Family } from "./family";
import type { CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";
import { rotate } from "../math";

/**
 * Kmart's Ally Side Table, read from its assembly manuals (keycode 43533466, Black, and 43711307, Walnut: the two are
 * the same page, the same parts, hardware and step, only the title differs). It comes as two parts: a slatted
 * drum base (A) that arrives made up, a ring at the floor and a round plate at the top with the slats between them,
 * a little wider at the floor, and a round top (B). In the one step the top lies face down, the base stands on it
 * upside down, and three screws (C) go through the base's plate into the top with the hex key (D); then it turns
 * over (its FINISH picture, a step of its own here). Kmart's hardware: 3 screws C and a hex key D. The manual prints
 * no sizes, so the drum is drawn as its finished picture shows it, about 0.8 of the top across at its plate and 0.85
 * at the floor, and the screws, turned with the hex key, as 6 x 35 mm bolts.
 *
 * The manual letters its parts and its hardware in one run (A to D), so the guide does too.
 */

type XZ = [number, number];
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Points round a circle in plan, from angle a0 to a1 (radians, from +x towards +z), both ends included. */
function arc(r: number, a0: number, a1: number, n: number): XZ[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [r1(r * Math.cos(a)), r1(r * Math.sin(a))];
  });
}
/** Half a flat ring lying level, between radii r0 and r1, from height y0 to y1. */
const halfRing = (r0: number, r1_: number, a0: number, y0: number, y1: number): PartPiece => ({
  shape: "slab",
  outline: [...arc(r1_, a0, a0 + Math.PI, 16), ...arc(r0, a0 + Math.PI, a0, 16)],
  size: [0, y1 - y0, 0],
  pos: [0, (y0 + y1) / 2, 0],
});

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

const SCREW_C = { kind: "bolt", len: 35, dia: 6, name: "Screw" } as const;

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug !== "kmart-ally-side-table") return null;
  const W = s.size.w * 10, H = s.size.h * 10;
  const TT = 18; // the top
  const yT = H - TT; // its underside
  const PT = 18; // the base's plate
  const ST = 14, SW = 26, N = 24; // slats
  const rTo = Math.round(W * 0.39); // slats' outside at the plate
  const rBo = Math.round(W * 0.425); // and at the floor
  const rTi = rTo - ST, rBi = rBo - ST;
  const lean = Math.atan2(rBi - rTi, yT);
  const len = Math.hypot(rBi - rTi, yT) - 2;
  const rm = (rTi + rBi) / 2 + ST / 2;
  const slats = Array.from({ length: N }, (_, i): PartPiece => {
    const a = ((i + 0.5) * 2 * Math.PI) / N;
    return { shape: "box", size: [ST, r1(len), SW], pos: [r1(rm * Math.cos(a)), r1(yT / 2), r1(rm * Math.sin(a))], rot: [0, -a, lean] };
  });
  const base = part("A", "A", "Slatted base", [
    ...slats,
    { shape: "cyl", size: [2 * rTi, PT, 2 * rTi], pos: [0, yT - PT / 2, 0] },
    halfRing(rBi - 30, rBi, 0, 0, 18),
    halfRing(rBi - 30, rBi, Math.PI, 0, 18),
  ], "wood");
  const top: CustomPart = { id: "B", label: "B", name: "Round top", size: [W, TT, W], pos: [0, yT + TT / 2, 0], shape: "cyl", material: "board" };
  const screws: Vec3[] = [90, 210, 330].map((d): Vec3 => {
    const a = (d * Math.PI) / 180;
    return [r1(70 * Math.cos(a)), yT - PT, r1(70 * Math.sin(a))];
  });

  const steps: CustomStep[] = [
    {
      title: "Screw the base to the top",
      detail: "Lay the top (B) face down on a rug. Stand the base (A) on it upside down, its round plate on the top, and turn the three screws (C) through the plate into the top with the hex key (D).",
      add: ["B", "A"],
      fix: [{ ...SCREW_C, count: screws.length, at: screws, dir: [0, 1, 0], on: "A", mate: "B" }],
      from: { A: [0, -300, 0] },
      tools: ["allen"],
      pose: "-y",
      warnings: ["floor"],
    },
    {
      title: "Turn it over",
      detail: "Stand it on its base. The top takes up to 10 kg.",
      pose: "+y",
    },
  ];
  return { parts: [top, base], steps };
}

const family: Family = { names: ["KMART:ALLY"], recipe };
export default family;
