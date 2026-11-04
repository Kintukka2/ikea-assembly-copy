import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";
import { rotate } from "../math";

/**
 * Kmart's NATE line, read from its assembly manuals: round and oval tops held by ribbed ends made of slats on curved
 * ledges, all of it bolted with the hex key that comes in the box.
 *
 * - Bedside Table (43465736): two slatted half drums (2) and three round boards (1). Lying on its side, one half
 *   drum takes the three boards, one on each of its three ledges, with three bolts (A) up through each ledge into its
 *   board; the other half drum goes on top the same way (9 + 9 = 18). Paper covers (C, 12) go over the bolt heads
 *   under the middle and top boards and felt pads (D, 6) over the six under the bottom one, then it stands up.
 *   Kmart's hardware: 18 bolts A (6 x 18 mm), a hex key B, 12 paper covers C, 6 felt pads D. The manual's third
 *   panel covers the bolts and then stands it up, so it is two steps here.
 * - Coffee Table (43711222, Oak): a round top (1) on a flared base of four ribbed quarters (2). Upside down on the
 *   top, two quarters stand on it, two bolts (C) with washers (F) through each one's narrow ring into the top; then
 *   the other two. A plate (A) goes across each of the four joints at the wide end with four screws (B), an EVA pad
 *   (D) on each quarter, and it turns over. Kmart's hardware: 4 plates A, 16 screws B (4 x 14 mm), 8 bolts C
 *   (6 x 25 mm), 4 EVA pads D, a hex key E, 8 washers F. The manual's third panel does three jobs (plates, pads,
 *   turning over), so it is three steps here.
 * - Hall Table (43495207): an oval top (1) and shelf (7) inside two round ends, each end a back quarter and a front
 *   quarter of slats on three ledges (2 and 3 at the left, 4 and 5 at the right). Lying on its back, the back
 *   quarters take the top and shelf with twelve bolts (A); the front quarters go on with twelve more. Upside down on
 *   its top, a floor bar (6) joins the back ends with straight plates (E) and the quarters of each end are joined by
 *   a curved plate (D), four bolts (C) in every plate. Two posts (8) are screwed up the back with six screws (F)
 *   each, then felt pads (G), paper covers over the 24 bolt heads (H) and a wall bracket (J, screw I), and stood up
 *   it is fixed to the wall (plug K, screw L). Kmart's hardware: 24 A (6 x 18 mm), hex key B, 16 C (6 x 10 mm),
 *   2 D, 2 E, 12 F (4 x 16 mm), 6 G, 24 H, 1 I (4 x 14 mm), 1 J, 1 K, 1 L (4 x 35 mm). Its second and third panels
 *   each do two jobs (in two positions for the second), so the guide has six steps for the manual's four panels.
 *
 * Readings we had to choose, since the manuals print no sizes:
 * - The bedside table's ledges are curved rails inside the slats; its boards rest on them and the bolts go up
 *   through them, which is why the six under the bottom board, on its floor face, take felt pads (the inset shows a
 *   pad going over a bolt head) and the twelve higher up take paper covers.
 * - The hall table's posts (8) and floor bar (6) are both at the back: the upside down drawings show them on the same
 *   side, and the finished one shows the bar behind the open front. The boards' edges marked BACK hold the posts'
 *   screws, so the posts' tabs are drawn screwed into the floor bar, the shelf and the top. The shelf sits about
 *   15 cm under the top, as the finished picture shows.
 * - The coffee table's base is narrower at the top than at the floor, about 0.7 and 0.9 of the top across, as drawn.
 *
 * Part numbers and hardware letters are Kmart's own, so the guide reads against the paper.
 */

type XZ = [number, number];
type Fx = Omit<CustomFix, "count" | "at"> & { at: Vec3[] };
const fx = (f: Fx): CustomFix => ({ ...f, count: f.at.length });
const deg = (d: number) => (d * Math.PI) / 180;
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Points round an arc in plan, about (cx, cz), from angle a0 to a1 (radians, from +x towards +z), both ends included. */
function arc(cx: number, cz: number, r: number, a0: number, a1: number, n: number): XZ[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [r1(cx + r * Math.cos(a)), r1(cz + r * Math.sin(a))];
  });
}
/** A curved ledge in plan: the ring between radii r0 and r1, from angle a0 to a1. */
const sector = (cx: number, cz: number, r0: number, r1_: number, a0: number, a1: number, n = 10): XZ[] => [...arc(cx, cz, r1_, a0, a1, n), ...arc(cx, cz, r0, a1, a0, n)];
/** A board lying level, cut to a plan outline (x, z as they sit in the product), from height y0 to y1. */
const flat = (outline: XZ[], y0: number, y1: number): PartPiece => ({ shape: "slab", outline, size: [0, y1 - y0, 0], pos: [0, (y0 + y1) / 2, 0] });
/** A point at radius r and angle a about (cx, 0), at height y. */
const at = (cx: number, r: number, a: number, y: number): Vec3 => [r1(cx + r * Math.cos(a)), y, r1(r * Math.sin(a))];

/** Pieces drawn where they sit in the finished product, made into one part centred on their bounding box. */
function gather(abs: PartPiece[]): { pos: Vec3; size: Vec3; pieces: PartPiece[] } {
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
  return { pos, size, pieces: abs.map((q) => ({ ...q, pos: [r1(q.pos[0] - pos[0]), r1(q.pos[1] - pos[1]), r1(q.pos[2] - pos[2])] as Vec3 })) };
}

/** One part from pieces in place. */
function part(id: string, label: string, name: string, abs: PartPiece[], material: CustomPart["material"]): CustomPart {
  const g = gather(abs);
  return { id, label, name, size: g.size, pos: g.pos, material, pieces: g.pieces };
}

/** The same part again, turned by `turn` about the upright through the product's middle (it shares its letter). */
function turned(p: CustomPart, id: string, turn: number): CustomPart {
  return { ...p, id, pos: rotate(p.pos, [0, turn, 0]).map(r1) as Vec3, rot: [0, turn, 0] };
}

/** Slats standing round an arc, centred at radius rm about (cx, 0): `n` of them from angle a0 to a1. */
function slats(cx: number, rm: number, a0: number, a1: number, n: number, t: number, h: number, gap = 5): PartPiece[] {
  const pitch = (a1 - a0) / n;
  const w = r1(pitch * rm - gap);
  return Array.from({ length: n }, (_, i): PartPiece => {
    const a = a0 + (i + 0.5) * pitch;
    return { shape: "box", size: [t, h, w], pos: [r1(cx + rm * Math.cos(a)), h / 2, r1(rm * Math.sin(a))], rot: [0, -a, 0] };
  });
}

/* ---------- Bedside Table ---------- */

const BOLT_A6 = { kind: "bolt", len: 18, dia: 6, name: "Bolt" } as const;

function bedside(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const R = D / 2; // the round boards, and the inside of the slats
  const ST = W / 2 - R; // slats
  const RW = 40, RT = 18, BT = 15; // ledges (width, thickness), boards
  const A = deg(62); // each half drum reaches this far either side of its middle
  const yLedge = [0, Math.round(H * 0.45), H - 6 - BT - RT]; // undersides of the three ledges
  const rail = yLedge.map((y) => flat(sector(0, 0, R - RW, R, -A + 0.02, A - 0.02), y, y + RT));
  const right = part("R", "2", "Slatted side", [...slats(0, R + ST / 2, -A, A, 11, ST, H), ...rail], "wood");
  const left = turned(right, "L", Math.PI);
  const boards = yLedge.map((y, i): CustomPart => ({ id: `B${i}`, label: "1", name: "Round board", size: [D, BT, D], pos: [0, y + RT + BT / 2, 0], shape: "cyl", material: "board" }));
  const parts: CustomPart[] = [left, ...boards, right];

  // three bolts up through each ledge into the board on it
  const rb = R - RW / 2;
  const pts = (sx: 1 | -1, i: number) => [-40, 0, 40].map((d) => at(0, rb, (sx > 0 ? 0 : Math.PI) + deg(d), yLedge[i]));
  const bolts = (sx: 1 | -1) => [0, 1, 2].map((i) => fx({ ...BOLT_A6, at: pts(sx, i), dir: [0, 1, 0], on: sx > 0 ? "R" : "L", mate: `B${i}` }));
  const covers = (sx: 1 | -1, levels: number[], name: string, dia: number) => levels.map((i) => fx({ kind: "cap", len: 1, dia, name, at: pts(sx, i), dir: [0, 1, 0], on: sx > 0 ? "R" : "L" }));
  const drop = { B0: [400, 0, 0], B1: [400, 0, 0], B2: [400, 0, 0] } as Record<string, Vec3>;

  const steps: CustomStep[] = [
    {
      title: "Bolt the three boards into one side",
      detail: "Lay one slatted side (2) on a rug, curved face down. Stand a round board (1) on each of its three ledges and turn three bolts (A) through each ledge into its board with the hex key (B). Leave them a little loose.",
      add: ["L", "B0", "B1", "B2"],
      fix: bolts(-1),
      from: drop,
      tools: ["allen"],
      pose: "+x",
      warnings: ["floor", "loose"],
    },
    {
      title: "Bolt on the other side",
      detail: "Lay the second slatted side (2) over the other edge of the boards, a ledge beside each board, and turn three bolts through each ledge the same way. Now tighten all eighteen bolts.",
      add: ["R"],
      fix: bolts(1),
      from: { R: [400, 0, 0] },
      tools: ["allen"],
      pose: "+x",
    },
    {
      title: "Cover the bolt heads",
      detail: "Press a paper cover (C) over each bolt head under the middle and top boards, twelve in all, and stick a felt pad (D) over each of the six under the bottom board: they are its feet.",
      fix: [...covers(-1, [1, 2], "Paper cover", 14), ...covers(1, [1, 2], "Paper cover", 14), ...covers(-1, [0], "Felt pad", 20), ...covers(1, [0], "Felt pad", 20)],
      pose: "+x",
    },
    {
      title: "Stand it up",
      detail: "Turn it upright onto its felt pads. Each board takes up to 5 kg.",
      pose: "+y",
    },
  ];
  return { parts, steps };
}

/* ---------- Coffee Table ---------- */

const PLATE_A = { kind: "connector", len: 110, dia: 22, name: "Joining plate" } as const;
const SCREW_B = { kind: "screw", len: 14, dia: 4, name: "Screw" } as const;
const BOLT_C25 = { kind: "bolt", len: 25, dia: 6, name: "Bolt" } as const;
const EVA_D = { kind: "glide", len: 3, dia: 30, name: "EVA pad" } as const;
const WASHER_F = { kind: "washer", len: 1.5, dia: 16, name: "Washer" } as const;

function coffee(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10;
  const TT = 18; // top
  const yT = H - TT; // underside of the top
  const ST = 16, SW = 24, N = 10; // slats in each quarter
  const RW = 35, RT = 22; // the rings at each end of a quarter
  const rT = Math.round(W * 0.34); // inside of the slats under the top
  const rB = Math.round(W * 0.42); // and at the floor
  const lean = Math.atan2(rB - rT, yT);
  const len = Math.hypot(rB - rT, yT) - 3;
  const rm = (rT + rB) / 2 + ST / 2;
  const q = Math.PI / 2;
  const slat = (i: number): PartPiece => {
    const a = (i + 0.5) * (q / N);
    return { shape: "box", size: [ST, r1(len), SW], pos: [r1(rm * Math.cos(a)), r1(yT / 2), r1(rm * Math.sin(a))], rot: [0, -a, lean] };
  };
  const quarter = part("Q0", "2", "Ribbed base quarter", [
    ...Array.from({ length: N }, (_, i) => slat(i)),
    flat(sector(0, 0, rT - RW, rT, 0.01, q - 0.01), yT - RT, yT),
    flat(sector(0, 0, rB - RW, rB, 0.01, q - 0.01), 0, RT),
  ], "wood");
  // quarter k covers k to k + 1 right angles round from the right-hand side towards the front
  const Q = [quarter, ...[1, 2, 3].map((k) => turned(quarter, `Q${k}`, -k * q))];
  const top: CustomPart = { id: "T1", label: "1", name: "Round top", size: [W, TT, W], pos: [0, yT + TT / 2, 0], shape: "cyl", material: "board" };
  const parts: CustomPart[] = [top, ...Q];

  // two bolts with washers through each quarter's narrow ring into the top
  const rTm = rT - RW / 2;
  const boltPts = (k: number) => [25, 65].map((d) => at(0, rTm, k * q + deg(d), yT - RT));
  const bolt = (k: number): CustomFix[] => [fx({ ...WASHER_F, at: boltPts(k), dir: [0, 1, 0], on: `Q${k}` }), fx({ ...BOLT_C25, at: boltPts(k), dir: [0, 1, 0], on: `Q${k}`, mate: "T1" })];
  // a plate over each joint of the wide rings, two screws either side of it
  const rBm = rB - RW / 2;
  const plates: CustomFix[] = [0, 1, 2, 3].flatMap((j) => {
    const aj = j * q;
    const off = [-48, -24.5, 24.5, 48].map((d) => d / rBm);
    return [
      fx({ ...PLATE_A, at: [at(0, rBm, aj, 0)], dir: [0, 1, 0], on: `Q${j}`, twist: -(aj + q) }),
      fx({ ...SCREW_B, at: off.filter((o) => o < 0).map((o) => at(0, rBm, aj + o, 0)), dir: [0, 1, 0], on: `Q${(j + 3) % 4}` }),
      fx({ ...SCREW_B, at: off.filter((o) => o > 0).map((o) => at(0, rBm, aj + o, 0)), dir: [0, 1, 0], on: `Q${j}` }),
    ];
  });
  const drop = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, [0, -300, 0] as Vec3]));

  const steps: CustomStep[] = [
    {
      title: "Bolt two base quarters to the top",
      detail: "Lay the top (1) face down on a rug. Stand two ribbed quarters (2) on it side by side, narrow end down, and turn two bolts (C) with a washer (F) through each one's ring into the top with the hex key (E). Leave them loose.",
      add: ["T1", "Q2", "Q3"],
      fix: [...bolt(2), ...bolt(3)],
      from: drop(["Q2", "Q3"]),
      tools: ["allen"],
      pose: "-y",
      warnings: ["floor", "loose"],
    },
    {
      title: "Bolt on the other two quarters",
      detail: "Close the ring with the last two quarters, two bolts and washers in each, still loose.",
      add: ["Q0", "Q1"],
      fix: [...bolt(0), ...bolt(1)],
      from: drop(["Q0", "Q1"]),
      tools: ["allen"],
      pose: "-y",
      warnings: ["loose"],
    },
    {
      title: "Screw a plate across each joint",
      detail: "On the wide rings, now on top, lay a plate (A) across each of the four joints and drive two screws (B) into each side of it with a screwdriver. Then tighten all eight bolts.",
      fix: plates,
      tools: ["screwdriver", "allen"],
      pose: "-y",
    },
    {
      title: "Stick on the EVA pads",
      detail: "Peel the backing off the four EVA pads (D) and press one onto the middle of each wide ring.",
      fix: [0, 1, 2, 3].map((k) => fx({ ...EVA_D, at: [at(0, rBm, k * q + q / 2, 0)], dir: [0, 1, 0], on: `Q${k}` })),
      pose: "-y",
    },
    {
      title: "Turn it over",
      detail: "Turn the table onto its pads. The top takes up to 10 kg.",
      pose: "+y",
    },
  ];
  return { parts, steps };
}

/* ---------- Hall Table ---------- */

const BOLT_C10 = { kind: "bolt", len: 10, dia: 6, name: "Short bolt" } as const;
const CURVED_D = { kind: "connector", len: 110, dia: 22, name: "Curved plate" } as const;
const STRAIGHT_E = { kind: "connector", len: 110, dia: 22, name: "Straight plate" } as const;
const SCREW_F = { kind: "screw", len: 16, dia: 4, name: "Screw" } as const;
const PAD_G = { kind: "glide", len: 4, dia: 20, name: "Felt pad" } as const;
const COVER_H = { kind: "cap", len: 1, dia: 14, name: "Paper cover" } as const;
const SCREW_I = { kind: "screw", len: 14, dia: 4, name: "Bracket screw" } as const;
const BRACKET_J = { kind: "angle", len: 50, dia: 20, name: "Wall bracket" } as const;
const PLUG_K = { kind: "plug", len: 30, dia: 6, name: "Wall plug", included: true } as const;
const SCREW_L = { kind: "screw", len: 35, dia: 4, name: "Wall screw", included: true } as const;

function hall(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const R = D / 2; // the round ends' outside
  const ST = 15; // slats
  const RI = R - ST; // inside of the slats: the top's and shelf's round ends
  const RW = 40, RT = 18, BT = 18; // ledges (width, thickness), boards
  const cx = W / 2 - R; // middles of the round ends
  const yTop = H - BT; // underside of the top
  const yShelf = yTop - 168; // underside of the shelf, just under the top as drawn
  const ledges = [0, yShelf - RT, yTop - RT]; // undersides of the floor, shelf and top ledges
  const q = Math.PI / 2;

  // the four quarters: [id, label, name, centre x, from angle]
  const quarters: [string, string, string, number, number][] = [
    ["P2", "2", "Back left end panel", -cx, Math.PI],
    ["P3", "3", "Front left end panel", -cx, q],
    ["P4", "4", "Back right end panel", cx, -q],
    ["P5", "5", "Front right end panel", cx, 0],
  ];
  const quarterParts = quarters.map(([id, label, name, x, a0]) =>
    part(id, label, name, [...slats(x, RI + ST / 2, a0, a0 + q, 7, ST, H), ...ledges.map((y) => flat(sector(x, 0, RI - RW, RI, a0 + 0.02, a0 + q - 0.02, 8), y, y + RT))], "wood"),
  );
  const oval = [...arc(cx, 0, RI, -q, q, 16), ...arc(-cx, 0, RI, q, 3 * q, 16)];
  const top = part("T1", "1", "Top", [flat(oval, yTop, H)], "board");
  const shelf = part("S7", "7", "Shelf", [flat(oval, yShelf, yShelf + BT)], "board");
  const zBar = -(RI - RW / 2);
  const bar: CustomPart = { id: "B6", label: "6", name: "Floor bar", size: [2 * cx, 30, RW], pos: [0, 15, zBar], material: "wood" };
  // the back posts: a strip up the back beside each end, with a pair of tabs at the floor bar, the shelf and the top
  const xPost = cx - 32;
  const yTabs = [15, yShelf + BT / 2, yTop + BT / 2];
  const zPost = -(RI + ST / 2);
  const post = part("B8R", "8", "Back post", [
    { shape: "box", size: [30, H, ST], pos: [xPost, H / 2, zPost] },
    ...yTabs.flatMap((y) => [-1, 1].map((sx): PartPiece => ({ shape: "box", size: [16, 18, 3], pos: [xPost + sx * 23, y, -RI - 1.5], material: "metal" }))),
  ], "wood");
  const postL: CustomPart = { ...post, id: "B8L", pos: [-post.pos[0], post.pos[1], post.pos[2]] };
  const parts: CustomPart[] = [...quarterParts, top, shelf, bar, post, postL];

  // three bolts up through each ledge into the top and the shelf, in every quarter
  const rb = RI - RW / 2;
  const boltPts = (i: number, y: number) => {
    const [, , , x, a0] = quarters[i];
    return [-30, 0, 30].map((d) => at(x, rb, a0 + q / 2 + deg(d), y));
  };
  const intoBoards = (i: number): CustomFix[] => [
    fx({ ...BOLT_A6, at: boltPts(i, ledges[2]), dir: [0, 1, 0], on: quarters[i][0], mate: "T1" }),
    fx({ ...BOLT_A6, at: boltPts(i, ledges[1]), dir: [0, 1, 0], on: quarters[i][0], mate: "S7" }),
  ];
  const covers = [0, 1, 2, 3].flatMap((i) => [ledges[2], ledges[1]].map((y) => fx({ ...COVER_H, at: boltPts(i, y), dir: [0, 1, 0], on: quarters[i][0] })));

  // under the floor: a straight plate over each joint of the bar and a back ledge, a curved one round each end
  const ends = [-1, 1] as const;
  const back = (sx: number) => (sx < 0 ? "P2" : "P4");
  const front = (sx: number) => (sx < 0 ? "P3" : "P5");
  const plates: CustomFix[] = ends.flatMap((sx) => {
    const x = sx * cx;
    const apex = sx < 0 ? Math.PI : 0;
    const offs = [-48, -24.5, 24.5, 48];
    return [
      fx({ ...STRAIGHT_E, at: [[x, 0, zBar]], dir: [0, 1, 0], on: "B6" }),
      fx({ ...BOLT_C10, at: offs.filter((o) => o * sx < 0).map((o): Vec3 => [x + o, 0, zBar]), dir: [0, 1, 0], on: "B6" }),
      fx({ ...BOLT_C10, at: offs.filter((o) => o * sx > 0).map((o): Vec3 => [x + o, 0, zBar]), dir: [0, 1, 0], on: back(sx) }),
      fx({ ...CURVED_D, at: [at(x, rb, apex, 0)], dir: [0, 1, 0], on: back(sx), twist: q }),
      fx({ ...BOLT_C10, at: offs.filter((o) => o < 0).map((o) => at(x, rb, apex + (sx * o) / rb, 0)), dir: [0, 1, 0], on: back(sx) }),
      fx({ ...BOLT_C10, at: offs.filter((o) => o > 0).map((o) => at(x, rb, apex + (sx * o) / rb, 0)), dir: [0, 1, 0], on: front(sx) }),
    ];
  });
  // each post's tabs: a screw either side, from the back into the floor bar, the shelf and the top
  const mates = ["B6", "S7", "T1"];
  const postScrews: CustomFix[] = ends.flatMap((sx) =>
    yTabs.map((y, i) => fx({ ...SCREW_F, at: [-1, 1].map((d): Vec3 => [sx * xPost + d * 23, y, -RI - 3]), dir: [0, 0, 1], on: sx < 0 ? "B8L" : "B8R", mate: mates[i] })),
  );
  // three felt pads under each end, clear of the plates
  const pads = ends.flatMap((sx) => [-55, 35, 80].map((d) => fx({ ...PAD_G, at: [at(sx * cx, rb, sx < 0 ? Math.PI - deg(d) : deg(d), 0)], dir: [0, 1, 0], on: d < 0 ? back(sx) : front(sx) })));
  const zJ = -R + 27; // the bracket's upright tab hangs at the back, against the wall

  const steps: CustomStep[] = [
    {
      title: "Fit the top and shelf into the back panels",
      detail: "Lay the two back end panels (2 and 4) on a rug, ledges up. Stand the top (1) and the shelf (7) in them on their edges marked BACK, each end on its ledge, and turn three bolts (A) through each ledge into the board with the hex key (B): twelve in all. Leave them loose.",
      add: ["P2", "P4", "T1", "S7"],
      fix: [...intoBoards(0), ...intoBoards(2)],
      from: { T1: [0, 0, 400], S7: [0, 0, 400] },
      tools: ["allen"],
      pose: "+z",
      warnings: ["floor", "loose"],
    },
    {
      title: "Bolt on the front panels",
      detail: "Lay the front end panels (3 at the left, 5 at the right) over the boards and turn three bolts through each ledge the same way, twelve more.",
      add: ["P3", "P5"],
      fix: [...intoBoards(1), ...intoBoards(3)],
      from: { P3: [0, 0, 400], P5: [0, 0, 400] },
      tools: ["allen"],
      pose: "+z",
      warnings: ["loose"],
    },
    {
      title: "Join the ends with the floor bar and plates",
      detail: "Stand it upside down on its top. Lay the floor bar (6) between the back ends of the floor ledges, its holes to the back, and bolt a straight plate (E) over each joint with four short bolts (C). Bolt a curved plate (D) round each end, across its two panels, with four more.",
      add: ["B6"],
      fix: plates,
      from: { B6: [0, -300, 0] },
      tools: ["allen"],
      pose: "-y",
    },
    {
      title: "Screw on the back posts",
      detail: "Hold a post (8) up the back beside each end and drive two screws (F) through each of its three pairs of tabs: into the floor bar, the shelf and the top. Twelve in all.",
      add: ["B8L", "B8R"],
      fix: postScrews,
      from: { B8L: [0, 0, -300], B8R: [0, 0, -300] },
      tools: ["screwdriver"],
      pose: "-y",
    },
    {
      title: "Pads, covers and the wall bracket",
      detail: "Tighten every bolt. Stick three felt pads (G) under each end and press a paper cover (H) over each of the 24 bolt heads under the top and shelf. Screw the wall bracket (J) under the middle of the top's back edge with the small screw (I).",
      fix: [
        ...pads,
        ...covers,
        fx({ ...BRACKET_J, at: [[0, yTop, zJ]], dir: [0, 1, 0], on: "T1" }),
        fx({ ...SCREW_I, at: [[0, yTop, zJ + 24]], dir: [0, 1, 0], on: "T1" }),
      ],
      tools: ["allen", "screwdriver"],
      pose: "-y",
    },
    {
      title: "Stand it up and fix it to the wall",
      detail: "Turn it over and stand it against the wall. Mark through the bracket's tab, drill, push in the wall plug (K) and drive the long screw (L) through the tab into it. Check the wall for pipes and cables first. The top takes up to 20 kg, the shelf 10 kg.",
      fix: [fx({ ...PLUG_K, at: [[0, yTop - 30, -R - 30]], dir: [0, 0, -1] }), fx({ ...SCREW_L, at: [[0, yTop - 30, -R + 2]], dir: [0, 0, -1], on: "T1" })],
      tools: ["drill", "screwdriver", "pencil"],
      pose: "+y",
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-nate-bedside-table") return bedside(s);
  if (s.slug === "kmart-nate-coffee-table") return coffee(s);
  if (s.slug === "kmart-nate-hall-table") return hall(s);
  return null;
}

const family: Family = { names: ["KMART:NATE"], recipe };
export default family;
