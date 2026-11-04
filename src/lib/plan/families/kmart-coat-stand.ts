import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";
import { rotate } from "../math";

/**
 * Kmart's Marble Base Coat Stand (43380800), read from its one page assembly manual. A round marble base (D) and a
 * pole in three lengths that screw together: the plain bottom length (C), a middle length with three hooks (B) and
 * a top length with three more hooks and a ball on top (A). Four curved felt pads (a) stick under the base, the
 * bottom length is bolted to the base from underneath with the bolt (b) and the hex key (c), then the middle and top
 * lengths screw on by hand. The last picture only shows it finished, so it isn't a step.
 *
 * Letters are Kmart's own: capitals for the parts, small letters for the hardware.
 */

type Def = { kind: CustomFix["kind"]; len: number; dia: number; name?: string };
const fx = (def: Def, at: Vec3[], dir: Vec3, on?: string, mate?: string): CustomFix => ({
  ...def,
  count: at.length,
  at,
  dir,
  ...(on ? { on } : {}),
  ...(mate ? { mate } : {}),
});

const PAD_A: Def = { kind: "glide", len: 3, dia: 40 };
const BOLT_B: Def = { kind: "bolt", len: 40, dia: 8 };

const PD = 25; // the pole
const HD = 10; // the hooks' rod

/** A round rod from one point to another, as a piece (a cylinder stands along y until it is turned). */
function rod(a: Vec3, b: Vec3, dia: number): PartPiece {
  const d: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len = Math.hypot(...d);
  const u = d.map((v) => v / len);
  const tilt = Math.acos(Math.max(-1, Math.min(1, u[1])));
  const spin = Math.abs(Math.sin(tilt)) < 1e-6 ? 0 : Math.atan2(u[2], -u[0]);
  return { shape: "cyl", size: [dia, len, dia], pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], rot: [0, spin, tilt], material: "metal" };
}

/** A hook leaving the pole at height y, pointing out at angle `az` round the pole: an arm out and up, then an upturned tip with a ball. */
function hook(y: number, az: number): PartPiece[] {
  const out: Vec3 = [Math.cos(az), 0, Math.sin(az)];
  const at = (r: number, h: number): Vec3 => [out[0] * r, h, out[2] * r];
  const p0 = at(PD / 2 - 2, y), p1 = at(PD / 2 + 60, y + 55), p2 = at(PD / 2 + 60, y + 100);
  return [rod(p0, p1, HD), rod(p1, p2, HD), { shape: "cyl", size: [16, 16, 16], pos: p2, material: "metal" }];
}

/** A length of pole with its hooks, given where its pieces sit in the finished stand: centred on their bounding box. */
function pole(id: string, label: string, name: string, y0: number, y1: number, hooks: [number, number][], ball: boolean): CustomPart {
  const abs: PartPiece[] = [{ shape: "cyl", size: [PD, y1 - y0, PD], pos: [0, (y0 + y1) / 2, 0], material: "metal" }, ...hooks.flatMap(([f, az]) => hook(y0 + f * (y1 - y0), az))];
  if (ball) abs.push({ shape: "cyl", size: [30, 30, 30], pos: [0, y1 + 15, 0], material: "metal" });
  const lo: Vec3 = [Infinity, Infinity, Infinity], hi: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const p of abs)
    for (const a of [-1, 1])
      for (const b of [-1, 1])
        for (const c of [-1, 1]) {
          const corner: Vec3 = [(a * p.size[0]) / 2, (b * p.size[1]) / 2, (c * p.size[2]) / 2];
          const v = p.rot ? rotate(corner, p.rot) : corner;
          for (let k = 0; k < 3; k++) {
            lo[k] = Math.min(lo[k], p.pos[k] + v[k]);
            hi[k] = Math.max(hi[k], p.pos[k] + v[k]);
          }
        }
  const pos: Vec3 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
  const size: Vec3 = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
  return { id, label, name, size, pos, material: "metal", pieces: abs.map((p) => ({ ...p, pos: [p.pos[0] - pos[0], p.pos[1] - pos[1], p.pos[2] - pos[2]] as Vec3 })) };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug !== "kmart-marble-base-coat-stand") return null;
  const W = s.size.w * 10, H = s.size.h * 10;
  const BT = 30; // the marble base
  const top = H - 30; // top of the pole, under its ball
  const yC = BT + 540, yB = yC + 560; // where the lengths meet
  const third = (2 * Math.PI) / 3;
  const parts: CustomPart[] = [
    // marble: drawn in the pale stone tint, apart from the metal pole
    { id: "D", label: "D", name: "Marble base", size: [W, BT, W], pos: [0, BT / 2, 0], shape: "cyl", material: "glass" },
    { id: "C", label: "C", name: "Bottom pole", size: [PD, yC - BT, PD], pos: [0, (BT + yC) / 2, 0], shape: "cyl", material: "metal" },
    pole(
      "B",
      "B",
      "Middle pole with hooks",
      yC,
      yB,
      [
        [0.41, 0],
        [0.69, third],
        [0.87, 2 * third],
      ],
      false,
    ),
    pole(
      "A",
      "A",
      "Top pole with hooks",
      yB,
      top,
      [
        [0.28, third / 2],
        [0.63, third / 2 + third],
        [0.82, third / 2 + 2 * third],
      ],
      true,
    ),
  ];
  const r = W / 2 - 40;
  const pads = [1, 3, 5, 7].map((k): Vec3 => [r * Math.cos((k * Math.PI) / 4), 0, r * Math.sin((k * Math.PI) / 4)]);
  const steps: CustomStep[] = [
    {
      title: "Stick the felt pads under the base",
      detail: "Turn the marble base (D) over on a rug and stick the four curved pads (a) round the edge of its underside.",
      add: ["D"],
      fix: [fx(PAD_A, pads, [0, 1, 0], "D")],
      pose: "-y",
      warnings: ["floor"],
    },
    {
      title: "Bolt the bottom pole to the base",
      detail: "Turn the base back over and stand the plain pole (C) on its centre hole. Push the bolt (b) up through the base into the pole and tighten it with the hex key (c).",
      add: ["C"],
      fix: [fx(BOLT_B, [[0, 0, 0]], [0, 1, 0], "D", "C")],
      pose: "+y",
      tools: ["allen"],
    },
    {
      title: "Screw on the middle pole",
      detail: "Screw the middle length with hooks (B) onto the top of the bottom pole by hand until it is tight.",
      add: ["B"],
      from: { B: [0, 300, 0] },
    },
    {
      title: "Screw on the top pole",
      detail: "Screw the top length (A), the one with the ball, onto the middle pole by hand until it is tight.",
      add: ["A"],
      from: { A: [0, 300, 0] },
    },
  ];
  return { parts, steps };
}

const family: Family = { names: ["KMART:COAT STAND"], recipe };
export default family;
