import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";
import { rotate } from "../math";

/**
 * Kmart's Jumi Lounge Chair (43692422), read from its assembly manual. The back (A) is a padded roll that runs round
 * the back and both sides and rests on the tops of four steel legs; the oval seat (B) sits on a square frame between
 * the legs. The legs come in two leg frames (C and D), each a pair of legs joined by a rail, with a plate on the top
 * of every leg. It is built upside down, the legs standing on their plates: two rails (E) screw onto the brackets of
 * leg frame C, two flat-head bolts at each joint with the arrows on rail and bracket pointing the same way, then leg
 * frame D onto their other ends. The seat goes under the frame with four bolts, each with a spring washer and a
 * washer, two through each rail. The back is laid under the legs and each leg's plate takes two flat-head bolts into
 * it, two legs at a time from either side, and only then is everything tightened. Kmart's hardware: 16 flat-head
 * bolts F (M6 x 20), 4 bolts G (M6 x 60), 4 spring washers H, 4 washers I (M6 x 18) and the hex key J.
 *
 * The leg frames are mirror images, lettered C and D; the guide names them by the order they go on. Steps 4 and 5 draw
 * the two pairs of legs from opposite sides without saying which pair is first, so the guide says the pair nearest
 * you, then the other. The last page shows the finished chair the right way up, so standing it up is part of step 6.
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

const SHORT_F = { kind: "bolt", len: 20, dia: 6, name: "Flat-head bolt" } as const; // F
const BOLT_G = { kind: "bolt", len: 60, dia: 6, name: "Seat bolt" } as const; // G
const SPRING_H = { kind: "washer", len: 2, dia: 10, name: "Spring washer" } as const; // H
const WASHER_I = { kind: "washer", len: 1.5, dia: 18 } as const; // I

const LEG = 44; // the legs' tube
const ROLL = 200; // how thick the back's roll is

/** A straight cylinder from a to b, reaching `over` past each end so the segments of a bend overlap. */
function tube(a: Vec3, b: Vec3, dia: number, over = 0): PartPiece {
  const d: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  return {
    shape: "cyl",
    size: [dia, Math.hypot(...d) + 2 * over, dia],
    pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2],
    rot: [Math.atan2(d[2], d[1]), 0, -Math.atan2(d[0], Math.hypot(d[1], d[2]))],
  };
}

/** A part drawn as pieces given where they sit in the finished chair: centred on their bounding box. */
function compound(id: string, label: string, name: string, abs: PartPiece[], material: CustomPart["material"]): CustomPart {
  const lo: Vec3 = [Infinity, Infinity, Infinity], hi: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const p of abs) {
    const h = p.size.map((v) => v / 2);
    const corners: Vec3[] =
      p.shape === "slab" && p.outline
        ? p.outline.flatMap(([x, z]): Vec3[] => [
            [x, -h[1], z],
            [x, h[1], z],
          ])
        : [-1, 1].flatMap((a) => [-1, 1].flatMap((b) => [-1, 1].map((c): Vec3 => [a * h[0], b * h[1], c * h[2]])));
    for (const c of corners) {
      const v = rotate(c, p.rot ?? [0, 0, 0]);
      for (let k = 0; k < 3; k++) {
        lo[k] = Math.min(lo[k], p.pos[k] + v[k]);
        hi[k] = Math.max(hi[k], p.pos[k] + v[k]);
      }
    }
  }
  const pos: Vec3 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
  const size: Vec3 = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
  return { id, label, name, size, pos, material, pieces: abs.map((p) => ({ ...p, pos: [p.pos[0] - pos[0], p.pos[1] - pos[1], p.pos[2] - pos[2]] as Vec3 })) };
}

function chair(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  // the back's roll, by its centre line: straight along each side, round at the back corners, straight across the back
  const yA = H - ROLL / 2;
  const xa = W / 2 - ROLL / 2, zBackRun = -D / 2 + ROLL / 2, rc = 150, zCorner = zBackRun + rc, zEnd = D / 2 - ROLL / 2 - 20;
  const roll: PartPiece[] = [
    ...[-1, 1].map((sx) => tube([sx * xa, yA, zCorner], [sx * xa, yA, zEnd], ROLL, 0)),
    tube([-(xa - rc), yA, zBackRun], [xa - rc, yA, zBackRun], ROLL, 10),
    ...[-1, 1].flatMap((sx) =>
      Array.from({ length: 4 }, (_, i) => {
        const p = (k: number): Vec3 => [sx * (xa - rc + rc * Math.cos((Math.PI * k) / 8)), yA, zCorner - rc * Math.sin((Math.PI * k) / 8)];
        return tube(p(i), p(i + 1), ROLL, 14);
      }),
    ),
  ];
  // the legs stand under the roll: the front ones under its sides, the back ones under its back corners
  const xl = xa - 30;
  const zLF = zEnd - 35;
  const zLB = zCorner - rc * Math.sqrt(1 - ((xl - (xa - rc)) / rc) ** 2);
  const yP = yA - ROLL / 2 + 2; // top of the legs' plates
  const yR0 = Math.round(0.4 * H), RH = 30; // the frame's rails, under the seat
  const yRm = yR0 + RH / 2;
  const seat = { y0: yR0 + RH, y1: Math.round(0.64 * H), rx: xl + 35, rz: (zLF - zLB) / 2 + 50, zc: (zLF + zLB) / 2 };

  const legFrame = (id: string, label: string, name: string, sx: -1 | 1) =>
    compound(
      id,
      label,
      name,
      [
        ...[zLF, zLB].map((z): PartPiece => ({ shape: "cyl", size: [LEG, yP - 5, LEG], pos: [sx * xl, (yP - 5) / 2, z] })),
        ...[zLF, zLB].map((z): PartPiece => ({ shape: "box", size: [90, 5, 40], pos: [sx * xl, yP - 2.5, z] })),
        { shape: "box", size: [25, RH, zLF - zLB - LEG], pos: [sx * xl, yRm, (zLF + zLB) / 2] },
      ],
      "metal",
    );
  const rail = (id: string, z: number): CustomPart => ({ id, label: "E", name: "Rail", size: [2 * (xl - LEG / 2), RH, 25], pos: [0, yRm, z], material: "metal" });
  const outline = Array.from({ length: 28 }, (_, i): [number, number] => {
    const t = (2 * Math.PI * i) / 28;
    return [seat.rx * Math.cos(t), seat.zc + seat.rz * Math.sin(t)];
  });
  const parts: CustomPart[] = [
    legFrame("C", "C", "First leg frame", -1),
    rail("E1", zLF),
    rail("E2", zLB),
    legFrame("D", "D", "Second leg frame", 1),
    compound("B", "B", "Seat", [{ shape: "slab", outline, size: [2 * seat.rx, seat.y1 - seat.y0, 2 * seat.rz], pos: [0, (seat.y0 + seat.y1) / 2, 0] }], "soft"),
    compound("A", "A", "Back", roll, "soft"),
  ];

  // two flat-head bolts through the plate on each rail's end into the leg frame's bracket
  const railEnds = (sx: -1 | 1, mate: string): CustomFix[] =>
    (
      [
        ["E1", zLF],
        ["E2", zLB],
      ] as const
    ).map(([id, z]) => fx(SHORT_F, [-8, 8].map((dy): Vec3 => [sx * (xl - LEG / 2 - 4), yRm + dy, z]), [sx, 0, 0], id, mate));
  // two seat bolts up through each rail into the seat, each with a spring washer and a washer
  const seatBolts = (id: string, z: number): CustomFix[] => {
    const at = [-110, 110].map((x): Vec3 => [x, yR0, z]);
    return [fx(SPRING_H, at, [0, 1, 0], id, "B"), fx(WASHER_I, at, [0, 1, 0], id, "B"), fx(BOLT_G, at, [0, 1, 0], id, "B")];
  };
  // two flat-head bolts up through each leg's plate into the back
  const plates = (z: number): CustomFix[] => [fx(SHORT_F, [-30, 30].map((dx): Vec3 => [-xl + dx, yP, z]), [0, 1, 0], "C", "A"), fx(SHORT_F, [-30, 30].map((dx): Vec3 => [xl + dx, yP, z]), [0, 1, 0], "D", "A")];

  const steps: CustomStep[] = [
    {
      title: "Bolt the two rails to the first leg frame",
      detail: "Stand leg frame C upside down on a rug, on the plates at the tops of its legs. Two flat-head bolts (F) through the end of each rail (E) into the frame's brackets, the arrows on the rail and the bracket pointing the same way. Leave them loose.",
      add: ["C", "E1", "E2"],
      from: { C: [0, -260, 0], E1: [320, 0, 0], E2: [320, 0, 0] },
      fix: railEnds(-1, "C"),
      tools: ["allen"],
      pose: "-y",
      warnings: ["floor", "loose"],
    },
    {
      title: "Bolt on the second leg frame",
      detail: "Leg frame D onto the other ends of the rails, upside down too, arrows the same way. Two flat-head bolts at each joint, still loose.",
      add: ["D"],
      from: { D: [320, 0, 0] },
      fix: railEnds(1, "D"),
      tools: ["allen"],
      pose: "-y",
      warnings: ["loose"],
    },
    {
      title: "Bolt the seat under the frame",
      detail: "Lay the seat (B) upside down under the frame, between the legs. Four bolts (G), each with a spring washer (H) and a washer (I), two through each rail into the seat.",
      add: ["B"],
      from: { B: [0, 0, 460] },
      fix: [...seatBolts("E1", zLF), ...seatBolts("E2", zLB)],
      tools: ["allen"],
      kind: "bolts",
      pose: "-y",
      warnings: ["loose"],
    },
    {
      title: "Bolt two legs to the back",
      detail: "Lay the back (A) upside down on the rug and stand the chair on it, each leg's plate on the back. Two flat-head bolts (F) through the plate of each of the two legs nearest you.",
      add: ["A"],
      from: { A: [0, 0, -460] },
      fix: plates(zLB),
      tools: ["allen"],
      pose: "-y",
      warnings: ["loose"],
    },
    {
      title: "Bolt the other two legs to the back",
      detail: "Turn the chair round on the rug and do the same for the other two legs: two flat-head bolts through each plate.",
      fix: plates(zLF),
      tools: ["allen"],
      pose: "-y",
    },
    {
      title: "Tighten everything and stand it up",
      detail: "Once all the bolts are in, go round every one with the hex key (J) until it is firm, then turn the chair over onto its feet.",
      tools: ["allen"],
      pose: "+y",
    },
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-jumi-lounge-chair") return chair(s);
  return null;
}

const family: Family = { names: ["KMART:JUMI"], recipe };
export default family;
