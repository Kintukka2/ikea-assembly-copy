import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";
import { rotate } from "../math";

/**
 * Kmart's ASKER line, read from its three assembly manuals. Every one is an upholstered back shell (A) and a padded
 * seat (B) on two steel side frames (C and D) that slide into slots on the outside of the shell's sides. All of it is
 * done upside down on a rug, with an Allen key, and nothing is tightened until every bolt is in.
 *
 * - Dining Chair (43641383) and Chenille Lounge Chair (43641369): each side frame is two tubes crossed under the seat,
 *   the long one running on up the side of the back, with a bracket plate where they cross. D slides into one slot,
 *   C into the other, a flat-head bolt (F) through each frame's lug holds it to the shell, then the seat goes on
 *   with eight bolts (E), each with a spring washer (H) and a washer (G), four through each bracket. Stood up, the
 *   foot pads turn to stop it rocking. Kmart's hardware: 8 bolts E (M6 x 40 on the dining chair, M6 x 45 on the
 *   lounge chair), 2 flat-head bolts F (M6 x 20), 8 washers G (M6 x 18), 8 spring washers H, the hex key I.
 * - Bar Stool (43641413): each side frame is a tall back leg (it slides into the shell's slot) and a front leg joined
 *   by a bar under the seat. C goes in first, then D, the H-shaped footrest (E) sits on the studs on the four legs,
 *   the seat goes on with four bolts (F), each with a spring washer (J) and a washer (I), then four short flat-head
 *   bolts (G) hold the footrest's ends to the studs and two flat-head bolts (H) hold the frames to the shell. Kmart's
 *   hardware: 4 bolts F (M6 x 40), 4 flat-head bolts G (M6 x 13), 2 flat-head bolts H (M6 x 20), 4 washers I
 *   (M6 x 18), 4 spring washers J, the hex key K.
 *
 * The side frames are mirror images, lettered C and D. The manuals don't say which side each goes on (the letter is
 * on the frame), so the guide names them by the order they go in: the first and the second side frame. Drawn from
 * behind and upside down, the second frame shows on the left of the picture each time, so it is drawn on your left
 * as you face the chair (-x), the first on your right.
 * The last page of each manual only shows the finished chair, so it isn't a step.
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

const FRAME_BOLT = { kind: "bolt", len: 20, dia: 6, name: "Frame bolt" } as const; // F (H on the bar stool)
const FOOT_BOLT = { kind: "bolt", len: 13, dia: 6, name: "Footrest bolt" } as const; // G on the bar stool
const WASHER = { kind: "washer", len: 1.5, dia: 18 } as const; // G (I on the bar stool)
const SPRING = { kind: "washer", len: 2, dia: 10, name: "Spring washer" } as const; // H (J on the bar stool)
const seatBolt = (len: number) => ({ kind: "bolt", len, dia: 6, name: "Seat bolt" }) as const; // E (F on the bar stool)

const TD = 22; // the side frames' tube
const SHELL = 35; // how thick the back shell is

/** A straight tube from a to b. */
function tube(a: Vec3, b: Vec3, dia = TD): PartPiece {
  const d: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  return {
    shape: "cyl",
    size: [dia, Math.hypot(...d), dia],
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

/** Points round the back of an outline from above: half an ellipse from the right side (+x) to the left. */
const arc = (rx: number, rz: number, zc: number, n = 10): [number, number][] =>
  Array.from({ length: n - 1 }, (_, i) => {
    const t = (Math.PI * (i + 1)) / n;
    return [rx * Math.cos(t), zc - rz * Math.sin(t)] as [number, number];
  });

/**
 * The back shell from above: straight sides from their front tips (zS) back to zc, round across the back, as one
 * upholstered board standing from y0 to y1. The side frames' tubes run in slots on the outside of the straight sides.
 */
function shell(xo: number, zS: number, zc: number, rb: number, y0: number, y1: number): PartPiece {
  const xi = xo - SHELL;
  const outline: [number, number][] = [[xo, zS], [xo, zc], ...arc(xo, rb, zc), [-xo, zc], [-xo, zS], [-xi, zS], [-xi, zc], ...arc(xi, rb - SHELL, zc).reverse(), [xi, zc], [xi, zS]];
  return { shape: "slab", outline, round: 16, size: [2 * xo, y1 - y0, zS - zc + rb], pos: [0, (y0 + y1) / 2, 0], material: "soft" };
}

/** The seat from above: square at the front, its back following the inside of the shell. */
function seat(xs: number, zF: number, zc: number, rb: number, y0: number, y1: number): PartPiece {
  const outline: [number, number][] = [[xs, zF], [xs, zc], ...arc(xs, rb, zc), [-xs, zc], [-xs, zF]];
  return { shape: "slab", outline, round: 50, size: [2 * xs, y1 - y0, zF - zc + rb], pos: [0, (y0 + y1) / 2, 0], material: "soft" };
}

/* ---------- Dining Chair and Chenille Lounge Chair ---------- */

interface Crossed {
  seatBot: number; // underside of the seat, mm
  seatTop: number;
  bolt: number; // length of the seat bolts E
  rb: number; // how far the shell curves round at the back
}

function crossed(s: ProductSpec, o: Crossed): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xt = W / 2 - TD / 2; // the side frames' tubes
  const xo = xt - TD / 2, xi = xo - SHELL; // outside and inside of the shell's sides
  const zB = -D / 2 + 12; // back of the shell
  const zc = zB + o.rb; // where its sides start to curve round
  const yA0 = o.seatBot + 25; // foot of the shell, beside the back of the seat
  // the long tube: from the front foot, leaning back, up the side of the shell to its top
  const zF = D / 2 - TD / 2 - 6, yTop = H - 20, zTop = zc + 15;
  const zLong = (y: number) => zF + ((zTop - zF) * y) / yTop;
  const zS = zLong(yA0) + 15; // the shell's sides reach just past where the tube goes into the slot
  // the short tube: from the back foot, leaning forward, up to the bracket plate where it meets the long one
  const zR = -D / 2 + TD / 2 + 30;
  const yX = o.seatBot - 6, zX = zLong(yX);
  const xs = xi - 4; // the seat fits inside the shell's sides
  const plate = { x0: xs - 45, x1: xt, len: 270 };

  const frame = (id: string, label: string, name: string, sx: -1 | 1) =>
    compound(
      id,
      label,
      name,
      [
        tube([sx * xt, 0, zF], [sx * xt, yTop, zTop]),
        tube([sx * xt, 0, zR], [sx * xt, yX, zX]),
        { shape: "box", size: [plate.x1 - plate.x0, 6, plate.len], pos: [(sx * (plate.x0 + plate.x1)) / 2, o.seatBot - 3, zX] },
      ],
      "metal",
    );
  const parts: CustomPart[] = [
    compound("A", "A", "Back shell", [shell(xo, zS, zc, o.rb, yA0, H)], "soft"),
    compound("B", "B", "Seat", [seat(xs, D / 2 - 15, zc, o.rb - SHELL - 4, o.seatBot, o.seatTop)], "soft"),
    frame("FD", "D", "First side frame", 1),
    frame("FC", "C", "Second side frame", -1),
  ];

  // a side frame slides into its slot along its long tube
  const len = Math.hypot(yTop, zTop - zF);
  const slide: Vec3 = [0, Math.round((-300 * yTop) / len), Math.round((-300 * (zTop - zF)) / len)];
  // a frame bolt up through each frame's lug into the foot of the shell, by the slot
  const frameBolt = (sx: -1 | 1, on: string) => fx(FRAME_BOLT, [[sx * (xo - SHELL / 2), yA0, zS - 22]], [0, 1, 0], on, "A");
  // four seat bolts up through each bracket plate into the seat: two holes at each end of the plate
  const holes = (sx: -1 | 1): Vec3[] => [-125, -95, 95, 125].map((dz): Vec3 => [sx * (xs - 25), o.seatBot - 6, zX + dz]);
  const seatFix = (sx: -1 | 1, on: string): CustomFix[] => [
    fx(SPRING, holes(sx), [0, 1, 0], on, "B"),
    fx(WASHER, holes(sx), [0, 1, 0], on, "B"),
    fx(seatBolt(o.bolt), holes(sx), [0, 1, 0], on, "B"),
  ];

  const steps: CustomStep[] = [
    {
      title: "Slide the first side frame into the back",
      detail: "Lay the back shell (A) upside down on a rug. Push the long tube of side frame D into the slot on one side of the shell, bracket inwards, until it stops.",
      add: ["A", "FD"],
      from: { A: [0, -260, 0], FD: slide },
      pose: "-y",
      warnings: ["floor"],
    },
    {
      title: "Slide the second side frame in",
      detail: "Side frame C into the slot on the other side the same way, its bracket facing the first one.",
      add: ["FC"],
      from: { FC: slide },
      pose: "-y",
    },
    {
      title: "Bolt the frames to the back",
      detail: "One flat-head bolt (F) through the lug on each frame into the shell, by the slot. Turn them in with the Allen key but leave them loose for now.",
      fix: [frameBolt(1, "FD"), frameBolt(-1, "FC")],
      tools: ["allen"],
      pose: "-y",
      warnings: ["loose"],
    },
    {
      title: "Bolt the seat onto the brackets",
      detail: "Slide the seat (B) in upside down under the two brackets and line its holes up with theirs. Eight bolts (E), each with a spring washer (H) and a washer (G), four through each bracket. Once all eight are in, tighten them and the two frame bolts.",
      add: ["B"],
      from: { B: [0, 0, 420] },
      fix: [...seatFix(1, "FD"), ...seatFix(-1, "FC")],
      tools: ["allen"],
      kind: "bolts",
      pose: "-y",
    },
    {
      title: "Stand it up and level it",
      detail: "Turn the chair onto its feet. If it rocks, turn the foot pad under the short leg until all four sit on the floor.",
      pose: "+y",
    },
  ];
  return { parts, steps };
}

/* ---------- Bar Stool ---------- */

function barStool(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const seatTop = Math.round(0.716 * H), seatBot = seatTop - 80; // 68 cm to the top of the seat
  const xt = W / 2 - TD / 2;
  const xo = xt - TD / 2, xi = xo - SHELL;
  const rb = 100;
  const zc = -D / 2 + 10 + rb;
  const yA0 = seatBot + 25;
  // the back legs lean forward a little as they rise, in the slots on the outside of the shell's sides
  const zBF = -D / 2 + TD / 2 + 5;
  const lean = (zc + 10 - zBF) / yA0;
  const zBack = (y: number) => zBF + lean * y;
  const yTop = H - 20;
  const zS = zBack(yTop) + 15;
  // the front legs lean back a little, up to the bar under the front of the seat
  const yBar = seatBot - 6;
  const zFF = D / 2 - TD / 2 - 5, zFT = D / 2 - 90;
  const zFront = (y: number) => zFF + ((zFT - zFF) * y) / yBar;
  const xs = xi - 4;
  const yF = Math.round(0.32 * H); // the footrest
  const RAIL = 16;

  const frame = (id: string, label: string, name: string, sx: -1 | 1) => {
    const zb = zBack(yBar);
    return compound(
      id,
      label,
      name,
      [
        tube([sx * xt, 0, zBF], [sx * xt, yTop, zBack(yTop)]),
        tube([sx * xt, 0, zFF], [sx * xt, yBar, zFT]),
        // the bar under the seat, from the top of the front leg back to the back leg
        { shape: "box", size: [xt - (xs - 45), 6, zFT - zb], pos: [(sx * (xt + xs - 45)) / 2, seatBot - 3, (zFT + zb) / 2] },
      ],
      "metal",
    );
  };
  const zf = zFront(yF), zb = zBack(yF), xr = xt - TD / 2;
  const footrest = compound(
    "E",
    "E",
    "Footrest",
    [
      tube([-xr, yF, zf], [xr, yF, zf], RAIL),
      tube([-xr, yF, zb], [xr, yF, zb], RAIL),
      tube([0, yF, zb], [0, yF, zf], RAIL),
    ],
    "metal",
  );
  const parts: CustomPart[] = [
    compound("A", "A", "Back shell", [shell(xo, zS, zc, rb, yA0, H)], "soft"),
    compound("B", "B", "Seat", [seat(xs, D / 2 - 20, zc, rb - SHELL - 4, seatBot, seatTop)], "soft"),
    frame("FC", "C", "First side frame", 1),
    frame("FD", "D", "Second side frame", -1),
    footrest,
  ];

  const len = Math.hypot(yTop, zBack(yTop) - zBF);
  const slide: Vec3 = [0, Math.round((-300 * yTop) / len), Math.round((-300 * (zBack(yTop) - zBF)) / len)];
  // two seat bolts up through each bar: one by the front leg, one by the back leg
  const holes = (sx: -1 | 1): Vec3[] => [zBack(yBar) + 35, zFT - 35].map((z): Vec3 => [sx * (xs - 25), seatBot - 6, z]);
  const seatFix = (sx: -1 | 1, on: string): CustomFix[] => [
    fx(SPRING, holes(sx), [0, 1, 0], on, "B"),
    fx(WASHER, holes(sx), [0, 1, 0], on, "B"),
    fx(seatBolt(40), holes(sx), [0, 1, 0], on, "B"),
  ];
  // a footrest bolt through each end of the footrest into the stud on its leg
  const footBolts = (sx: -1 | 1, mate: string) => fx(FOOT_BOLT, [zf, zb].map((z): Vec3 => [sx * (xr - 6), yF, z]), [sx, 0, 0], "E", mate);
  const frameBolt = (sx: -1 | 1, on: string) => fx(FRAME_BOLT, [[sx * (xo - SHELL / 2), yA0, zBack(yA0) + 20]], [0, 1, 0], on, "A");

  const steps: CustomStep[] = [
    {
      title: "Slide the first side frame into the back",
      detail: "Lay the back shell (A) upside down on a rug. Push the tall back leg of side frame C into the slot on one side of the shell, bar inwards, until it stops.",
      add: ["A", "FC"],
      from: { A: [0, -260, 0], FC: slide },
      pose: "-y",
      warnings: ["floor"],
    },
    {
      title: "Slide the second side frame in",
      detail: "Side frame D into the slot on the other side the same way, its bar facing the first one.",
      add: ["FD"],
      from: { FD: slide },
      pose: "-y",
    },
    {
      title: "Fit the footrest between the legs",
      detail: "Ease the legs apart a little and sit the ends of the footrest (E) over the studs on the four legs.",
      add: ["E"],
      from: { E: [0, -260, 0] },
      pose: "-y",
    },
    {
      title: "Bolt the seat onto the frames",
      detail: "Slide the seat (B) in upside down under the two bars and line up the holes. Four bolts (F), each with a spring washer (J) and a washer (I), two through each bar. Leave them loose for now.",
      add: ["B"],
      from: { B: [0, 0, 420] },
      fix: [...seatFix(1, "FC"), ...seatFix(-1, "FD")],
      tools: ["allen"],
      kind: "bolts",
      pose: "-y",
      warnings: ["loose"],
    },
    {
      title: "Bolt the footrest and the frames tight",
      detail: "Four short flat-head bolts (G) through the ends of the footrest into the studs, and a flat-head bolt (H) through each frame into the foot of the shell. Once they are all in, tighten every bolt.",
      fix: [footBolts(1, "FC"), footBolts(-1, "FD"), frameBolt(1, "FC"), frameBolt(-1, "FD")],
      tools: ["allen"],
      pose: "-y",
    },
    {
      title: "Stand it up and level it",
      detail: "Turn the stool onto its feet. If it rocks, turn the foot pad under the short leg until all four sit on the floor.",
      pose: "+y",
    },
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-asker-dining-chair") return crossed(s, { seatBot: 400, seatTop: 470, bolt: 40, rb: 140 });
  if (s.slug === "kmart-asker-chenille-lounge-chair") return crossed(s, { seatBot: 330, seatTop: 420, bolt: 45, rb: 150 });
  if (s.slug === "kmart-asker-bar-stool") return barStool(s);
  return null;
}

const family: Family = { names: ["KMART:ASKER"], recipe };
export default family;
