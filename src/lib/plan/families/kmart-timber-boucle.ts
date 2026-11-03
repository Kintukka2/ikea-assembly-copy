import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's Timber Boucle Chair (43270866), read from its assembly manual. An armchair on two timber side frames, each an
 * armrest on a straight front leg and a sloping back leg with a rail between them. The padded back (A) bolts to the
 * back of the seat (B) first. The left side frame (D) bolts to the side of the seat and, at the top of its back leg,
 * to the side of the back; four barrel nuts (K) drop into the front rail (C), which bolts to D's front leg. The right
 * side frame (E) goes on the same way, into the seat, the back and the other end of the rail, and last of all every
 * bolt is tightened. Kmart's hardware: 6 bolts F (M8 x 60), 12 spring washers G, 10 washers H (M8, 14 mm), 6 bolts I
 * (M8 x 50), the hex key J, 4 barrel nuts K and 2 large washers L (M8, 22 mm). Every bolt takes a spring washer and a
 * washer: the two holding the back to the seat take the large ones.
 *
 * D is the left side frame as you face the chair (left and right as in every recipe here: -x is your left looking at
 * the front): the manual's front view labels the leg on the viewer's left D, and its side view shows D on the near side
 * with the chair facing right. The last page shows the finished chair, after the tightening.
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

const LONG_F = { kind: "bolt", len: 60, dia: 8, name: "Long bolt" } as const; // F
const SPRING_G = { kind: "washer", len: 2, dia: 13, name: "Spring washer" } as const; // G
const WASHER_H = { kind: "washer", len: 1.5, dia: 14 } as const; // H
const BOLT_I = { kind: "bolt", len: 50, dia: 8, name: "Bolt" } as const; // I
const NUT_K = { kind: "nut", len: 14, dia: 10, name: "Barrel nut" } as const; // K
const LARGE_L = { kind: "washer", len: 1.5, dia: 22, name: "Large washer" } as const; // L

const P = 40; // the side frames' timber

/** A box from a to b, `w` square, for a sloping leg. */
function bar(a: Vec3, b: Vec3, w = P): PartPiece {
  const d: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  return { shape: "box", size: [w, Math.hypot(...d), w], pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], rot: [Math.atan2(d[2], d[1]), 0, 0] };
}

/** A part from pieces placed where they sit in the finished chair, none of them turned but the sloping ones given in `lo` and `hi`. */
function part(id: string, label: string, name: string, abs: PartPiece[], lo: Vec3, hi: Vec3, material: CustomPart["material"]): CustomPart {
  const c: Vec3 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
  return { id, label, name, size: [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]], pos: c, material, pieces: abs.map((p) => ({ ...p, pos: [p.pos[0] - c[0], p.pos[1] - c[1], p.pos[2] - c[2]] as Vec3 })) };
}

function chair(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xs = W / 2 - 30; // middle of a side frame, under the middle of its armrest
  const xo = xs + P / 2, xin = xs - P / 2; // its outside and inside faces
  const armTop = Math.round(0.82 * H), armT = 25; // 64 cm to the top of the armrests
  const legTop = armTop - armT;
  const zFL = D / 2 - 70; // front legs
  const zBF = -D / 2 + 25, zBT = zBF + 100; // the back legs' feet, and their tops under the back of the armrests
  const zBack = (y: number) => zBF + ((zBT - zBF) * y) / legTop;
  const yR = 300, hR = 45; // the side rails, beside the seat's frame
  const seat = { y0: 300, y1: Math.round(0.565 * H), z0: -125, z1: D / 2 - 20, frame: 50, rail: 25 }; // 44 cm to the top of the seat
  const yC = 240, hC = 40, dC = 50; // the front rail

  const side = (id: string, label: string, name: string, sx: -1 | 1): CustomPart => {
    const x = sx * xs;
    const zr0 = zBack(yR + hR / 2);
    return part(
      id,
      label,
      name,
      [
        { shape: "box", size: [60, armT, D / 2 - 10 - (zBT - 30)], pos: [x, legTop + armT / 2, (D / 2 - 10 + zBT - 30) / 2] },
        { shape: "box", size: [P, legTop, P], pos: [x, legTop / 2, zFL] },
        bar([x, 0, zBF], [x, legTop, zBT]),
        { shape: "box", size: [P, hR, zFL - zr0], pos: [x, yR + hR / 2, (zFL + zr0) / 2] },
      ],
      [Math.min(x - 30, x - P / 2), 0, zBF - P / 2],
      [Math.max(x + 30, x + P / 2), armTop, D / 2 - 10],
      "wood",
    );
  };

  // the seat: an open timber frame under the cushion
  const sw = 2 * xin, sd = seat.z1 - seat.z0, sz = (seat.z0 + seat.z1) / 2, fy = seat.y0 + seat.frame / 2;
  const seatPart = part(
    "B",
    "B",
    "Seat",
    [
      { shape: "box", size: [sw, seat.frame, seat.rail], pos: [0, fy, seat.z0 + seat.rail / 2], material: "wood" },
      { shape: "box", size: [sw, seat.frame, seat.rail], pos: [0, fy, seat.z1 - seat.rail / 2], material: "wood" },
      ...[-1, 1].map((g): PartPiece => ({ shape: "box", size: [seat.rail, seat.frame, sd - 2 * seat.rail], pos: [g * (xin - seat.rail / 2), fy, sz], material: "wood" })),
      { shape: "box", size: [sw, seat.y1 - seat.y0 - seat.frame, sd], pos: [0, (seat.y0 + seat.frame + seat.y1) / 2, sz] },
    ],
    [-xin, seat.y0, seat.z0],
    [xin, seat.y1, seat.z1],
    "soft",
  );

  // the back: a timber rail at its foot, behind the seat, and the cushion leaning back from it
  const railZ = seat.z0 - 15, bt = 90;
  const b0: Vec3 = [0, 400, seat.z0 - bt / 2], b1: Vec3 = [0, H - 15, seat.z0 - bt / 2 - 120];
  const cushion = bar(b0, b1, bt);
  const backPart = part(
    "A",
    "A",
    "Back",
    [{ shape: "box", size: [sw, 100, 30], pos: [0, 350, railZ], material: "wood" }, { ...cushion, size: [sw, cushion.size[1], bt] }],
    [-xin, seat.y0, b1[2] - bt / 2 - 10],
    [xin, H, seat.z0],
    "soft",
  );

  const parts: CustomPart[] = [
    backPart,
    seatPart,
    part("C", "C", "Front rail", [{ shape: "box", size: [2 * xin, hC, dC], pos: [0, yC, zFL] }], [-xin, yC - hC / 2, zFL - dC / 2], [xin, yC + hC / 2, zFL + dC / 2], "wood"),
    side("D", "D", "Left side frame", -1),
    side("E", "E", "Right side frame", 1),
  ];

  // a bolt with its spring washer and washer, all going in the same way at the same points
  const bolted = (bolt: Def, washer: Def, at: Vec3[], dir: Vec3, on: string, mate: string): CustomFix[] => [fx(washer, at, dir, on, mate), fx(SPRING_G, at, dir, on, mate), fx(bolt, at, dir, on, mate)];
  const ySeatBolt = yR + hR / 2;
  const toSeat = (sx: -1 | 1, on: string) => bolted(BOLT_I, WASHER_H, [-40, 200].map((z): Vec3 => [sx * xo, ySeatBolt, z]), [-sx, 0, 0], on, "B");
  const toBack = (sx: -1 | 1, on: string) => bolted(LONG_F, WASHER_H, [[sx * xo, legTop - 25, zBack(legTop - 25)]], [-sx, 0, 0], on, "A");
  const toRail = (sx: -1 | 1, on: string) => bolted(LONG_F, WASHER_H, [-12, 12].map((dz): Vec3 => [sx * xo, yC, zFL + dz]), [-sx, 0, 0], on, "C");

  const steps: CustomStep[] = [
    {
      title: "Bolt the back to the seat",
      detail: "Lay the back (A) on a rug, face up, and stand the seat (B) on its back edge against the back's foot rail. Two bolts (I), each with a spring washer (G) and a large washer (L), through the seat's back rail into the foot of the back.",
      add: ["A", "B"],
      from: { A: [0, 0, 300], B: [0, 0, 320] },
      fix: bolted(BOLT_I, LARGE_L, [-150, 150].map((x): Vec3 => [x, seat.y0 + 25, seat.z0 + seat.rail]), [0, 0, -1], "B", "A"),
      tools: ["allen"],
      kind: "bolts",
      pose: "+z",
      warnings: ["floor", "loose"],
    },
    {
      title: "Bolt the left side frame to the seat",
      detail: "Stand the seat and back upright. Hold the left side frame (D), the one on your left as you face the front of the seat, against the seat and turn two bolts (I), each with a spring washer (G) and a washer (H), through its rail into the side of the seat.",
      add: ["D"],
      from: { D: [-320, 0, 0] },
      fix: toSeat(-1, "D"),
      tools: ["allen"],
      kind: "bolts",
      pose: "+y",
      warnings: ["loose"],
    },
    {
      title: "Bolt the frame to the back",
      detail: "One long bolt (F), with a spring washer (G) and a washer (H), through the top of the back leg into the side of the back.",
      fix: toBack(-1, "D"),
      tools: ["allen"],
      kind: "bolts",
    },
    {
      title: "Push the barrel nuts into the front rail",
      detail: "Four barrel nuts (K) into the holes in the top of the front rail (C), two at each end, each turned so its hole lines up with the holes in the rail's end.",
      wait: ["C"],
      from: { C: [0, 0, 340] },
      // sunk into their holes, just showing at the top
      fix: [fx(NUT_K, [-1, 1].flatMap((sx) => [-12, 12].map((dz): Vec3 => [sx * (xin - 22), yC + hC / 2 - NUT_K.len + 2, zFL + dz])), [0, -1, 0], "C")],
    },
    {
      title: "Bolt the front rail to the left side frame",
      detail: "Hold the rail between the front legs, nuts facing up. Two long bolts (F), each with a spring washer (G) and a washer (H), through the front leg into the barrel nuts at its end.",
      add: ["C"],
      from: { C: [0, 0, 340] },
      fix: toRail(-1, "D"),
      tools: ["allen"],
      kind: "bolts",
    },
    {
      title: "Bolt the right side frame to the seat",
      detail: "Hold the right side frame (E) against the other side of the seat and turn two bolts (I), each with a spring washer and a washer, through its rail into the seat.",
      add: ["E"],
      from: { E: [320, 0, 0] },
      fix: toSeat(1, "E"),
      tools: ["allen"],
      kind: "bolts",
    },
    {
      title: "Bolt it to the back and the rail",
      detail: "Three long bolts (F), each with a spring washer and a washer: one through the top of the back leg into the back, two through the front leg into the barrel nuts at the rail's other end.",
      fix: [...toBack(1, "E"), ...toRail(1, "E")],
      tools: ["allen"],
      kind: "bolts",
    },
    {
      title: "Tighten every bolt",
      detail: "Stand the chair on a flat floor and go round all twelve bolts with the Allen key until each one is firm.",
      tools: ["allen"],
      check: "square",
    },
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-timber-boucle-chair") return chair(s);
  return null;
}

const family: Family = { names: ["KMART:TIMBER BOUCLE"], recipe };
export default family;
