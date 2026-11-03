import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's Logan Lounge Chair (43709618, an anko product), read from its assembly manual. Three pieces: the back (1),
 * the seat with its two arms (2) and a steel leg frame (3), four legs under a square of rails with five tabs. With the
 * seat upside down, the frame goes on legs up and a bolt with a spring washer and a washer goes through each tab into
 * the seat: two on each side rail and one in the middle of the front one. Stood up, the back drops in between the arms
 * at the back, the brackets on its sides sliding down into the brackets inside the arms. Kmart's hardware: 5 bolts A
 * (M8 x 30), the hex key B, 5 spring washers C and 5 washers D (22 mm). The parts are numbered 1 to 3 and the
 * hardware lettered A to D, as in the manual. Its last page only shows the finished chair.
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

const BOLT_A = { kind: "bolt", len: 30, dia: 8, name: "Bolt" } as const; // A
const SPRING_C = { kind: "washer", len: 2, dia: 13, name: "Spring washer" } as const; // C
const WASHER_D = { kind: "washer", len: 1.5, dia: 22 } as const; // D

/** Pieces given where they sit in the finished chair, centred on the box from lo to hi. */
function part(id: string, label: string, name: string, abs: PartPiece[], lo: Vec3, hi: Vec3, material: CustomPart["material"]): CustomPart {
  const c: Vec3 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
  return { id, label, name, size: [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]], pos: c, material, pieces: abs.map((p) => ({ ...p, pos: [p.pos[0] - c[0], p.pos[1] - c[1], p.pos[2] - c[2]] as Vec3 })) };
}

function chair(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const legH = 180; // room under the seat
  const LEG = 22, RAIL = 20;
  const lx = W / 2 - 80, lz = D / 2 - 60; // the legs
  const armW = 150, armTop = Math.round(0.84 * H); // 64 cm to the top of the arms
  const xa = W / 2 - armW; // inside faces of the arms
  const baseTop = 360, seatTop = Math.round(0.59 * H); // 45 cm to the top of the seat cushion
  const backD = 215; // the back, from the back of the seat forward
  const z0 = -D / 2 + 5, z1 = D / 2 - 10;

  const frame = part(
    "F",
    "3",
    "Leg frame",
    [
      ...[-1, 1].flatMap((sx) => [-1, 1].map((sz): PartPiece => ({ shape: "cyl", size: [LEG, legH, LEG], pos: [sx * lx, legH / 2, sz * lz] }))),
      ...[-1, 1].map((sz): PartPiece => ({ shape: "box", size: [2 * lx, RAIL, RAIL], pos: [0, legH - RAIL / 2, sz * lz] })),
      ...[-1, 1].map((sx): PartPiece => ({ shape: "box", size: [RAIL, RAIL, 2 * lz], pos: [sx * lx, legH - RAIL / 2, 0] })),
    ],
    [-lx - LEG / 2, 0, -lz - LEG / 2],
    [lx + LEG / 2, legH, lz + LEG / 2],
    "metal",
  );
  const seat = part(
    "S",
    "2",
    "Seat with arms",
    [
      { shape: "box", size: [2 * xa, baseTop - legH, z1 - z0], pos: [0, (legH + baseTop) / 2, (z0 + z1) / 2] },
      { shape: "box", size: [2 * xa, seatTop - baseTop, z1 - (z0 + backD)], pos: [0, (baseTop + seatTop) / 2, (z0 + backD + z1) / 2] },
      ...[-1, 1].map((sx): PartPiece => ({ shape: "box", size: [armW, armTop - legH, z1 - z0], pos: [sx * (xa + armW / 2), (legH + armTop) / 2, (z0 + z1) / 2] })),
    ],
    [-W / 2, legH, z0],
    [W / 2, armTop, z1],
    "soft",
  );
  const back: CustomPart = { id: "K", label: "1", name: "Back", size: [2 * xa, H - baseTop, backD], pos: [0, (baseTop + H) / 2, z0 + backD / 2], material: "soft" };

  // five bolts up through the frame's tabs into the seat: two on each side rail, one in the middle of the front rail
  const yTab = legH - 3;
  const tabs: Vec3[] = [...[-1, 1].flatMap((sx) => [-160, 160].map((z): Vec3 => [sx * (lx - 20), yTab, z])), [0, yTab, lz - 20]];
  const steps: CustomStep[] = [
    {
      title: "Bolt the leg frame under the seat",
      detail: "Lay the seat (2) upside down on a rug and set the leg frame (3) on it, legs up, its tabs over the holes. A bolt (A) with a spring washer (C) and a washer (D) through each of the five tabs, two each side and one at the front. Tighten them with the hex key (B) once all five are in.",
      add: ["S", "F"],
      from: { S: [0, -260, 0], F: [0, -280, 0] },
      fix: [fx(SPRING_C, tabs, [0, 1, 0], "F", "S"), fx(WASHER_D, tabs, [0, 1, 0], "F", "S"), fx(BOLT_A, tabs, [0, 1, 0], "F", "S")],
      tools: ["allen"],
      kind: "bolts",
      pose: "-y",
      warnings: ["floor"],
    },
    {
      title: "Turn it over and drop the back in",
      detail: "Stand the chair on its legs. Lower the back (1) between the arms at the back, so the brackets on its sides slide down into the brackets inside the arms, and push it down until it sits on the seat.",
      add: ["K"],
      from: { K: [0, 340, 0] },
      pose: "+y",
    },
  ];
  return { parts: [seat, frame, back], steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-logan-lounge-chair") return chair(s);
  return null;
}

const family: Family = { names: ["KMART:LOGAN"], recipe };
export default family;
