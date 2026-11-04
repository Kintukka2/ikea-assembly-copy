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
 * - Ribbed Coffee Table (43741038, 43636600, 43636549): a round top (1) on a ribbed drum. Inside the drum is a core
 *   shaped like an H from above: a middle panel (3) between two side panels (4), on dowels (D) with screws (C), with a
 *   middle disc (5) slid down over it onto four little brackets (E, two screws B each). A top plate (2) and a bottom
 *   plate (6) go on its ends with dowels and screws; the top comes bolted to its plate, and the four bolts (A) taken
 *   out to part them hold the core to the top. Upside down on the top, the ribbed wrap (7) is screwed at its start
 *   and pulled round the plates and the disc, then screwed all round, and four felt pads (G) go on the bottom plate.
 *   Kmart's hardware: 4 A (M6 x 20 mm), 8 B (M4 x 12 mm), 26 C (M3.5 x 30 mm), 12 D, 4 E, a hex key F and 4 G.
 *   Its step 1 (dowels into the middle panel, then the side panels), step 2 (brackets, then the disc) and step 3
 *   (the top plate, then turned over for the bottom one) each do two jobs, so each is two steps here, and a last
 *   step turns it over: eleven steps for its seven. The middle disc sits 0.4 of the way up the core, as drawn; the
 *   drum is drawn 0.54 of the top across, its wrap's start at the back.
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

/* ---------- Ribbed Coffee Table ---------- */

const CT_BOLT = { kind: "bolt", len: 20, dia: 6, name: "Bolt" } as const; // A
const CT_SMALL = { kind: "screw", len: 12, dia: 4, name: "Small screw" } as const; // B
const CT_SCREW = { kind: "screw", len: 30, dia: 3.5, name: "Screw" } as const; // C
const CT_DOWEL = { kind: "dowel", len: 30, dia: 8, name: "Dowel" } as const; // D
const CT_BRACKET = { kind: "angle", len: 26, dia: 20, name: "Bracket" } as const; // E
const CT_PAD = { kind: "glide", len: 4, dia: 24, name: "Felt pad" } as const; // G

function coffeeTable(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10;
  const TT = 25; // the top
  const yT = H - TT; // its underside
  const PT = 18; // plates, disc and core panels
  const RD = Math.round(W * 0.27); // the drum's outside
  const RB = 24; // ribs
  const rr = RD - RB / 2;
  const rp = RD - RB; // the plates and disc, inside the wrap
  const y0 = PT, y1 = yT - PT; // the core, between the bottom and top plates
  const ch = y1 - y0;
  const yc = (y0 + y1) / 2;
  const gx = 95; // inner faces of the side panels
  const fx4 = gx + PT / 2; // middles of the side panels
  const fd = 200; // the side panels, front to back
  const y5 = Math.round(y0 + 0.4 * ch - PT / 2); // underside of the middle disc
  const disc = (y: number): PartPiece => ({ shape: "cyl", size: [2 * rp, PT, 2 * rp], pos: [0, y + PT / 2, 0] });
  // the middle disc: two halves of a disc, the H shaped hole for the core between them
  const half = (sz: 1 | -1): PartPiece => {
    const o = gx + PT;
    const notch: XZ[] = [[-rp, 0], [-o, 0], [-o, fd / 2], [-gx, fd / 2], [-gx, PT / 2], [gx, PT / 2], [gx, fd / 2], [o, fd / 2], [o, 0], [rp, 0]];
    const rim = arc(0, rp, 0, Math.PI, 24).slice(1, -1);
    return flat([...notch, ...rim].map(([x, z]): XZ => [x, sz * z]), y5, y5 + PT);
  };
  const NR = Math.floor((2 * Math.PI * rr) / RB);
  const ribs = Array.from({ length: NR }, (_, i): PartPiece => {
    const a = (i * 2 * Math.PI) / NR;
    return { shape: "cyl", size: [RB, yT, RB], pos: [r1(rr * Math.cos(a)), yT / 2, r1(rr * Math.sin(a))] };
  });
  const sidePanel = (sx: number): CustomPart => ({ id: sx < 0 ? "P4L" : "P4R", label: "4", name: "Side panel", size: [PT, ch, fd], pos: [sx * fx4, yc, 0], material: "board" });
  const parts: CustomPart[] = [
    { id: "P3", label: "3", name: "Middle panel", size: [2 * gx, ch, PT], pos: [0, yc, 0], material: "board" },
    sidePanel(-1),
    sidePanel(1),
    part("P5", "5", "Middle disc", [half(1), half(-1)], "board"),
    part("P2", "2", "Top plate", [disc(y1)], "board"),
    part("P6", "6", "Bottom plate", [disc(0)], "board"),
    { id: "T1", label: "1", name: "Round top", size: [W, TT, W], pos: [0, yT + TT / 2, 0], shape: "cyl", material: "board" },
    part("P7", "7", "Ribbed wrap", ribs, "wood"),
  ];

  const ends = [-1, 1] as const;
  const side = (sx: number) => (sx < 0 ? "P4L" : "P4R");
  const third = [0.35, 0.65].map((t) => Math.round(y0 + t * ch));
  const sixth = [0.15, 0.85].map((t) => Math.round(y0 + t * ch));
  // dowels into the ends of the side panels, screws through the plate into the side panels and the middle panel
  const plate = (id: string, y: number, down: boolean): { dowels: CustomFix[]; screws: CustomFix[] } => {
    const dir: Vec3 = [0, down ? -1 : 1, 0];
    const edge = down ? y1 : y0;
    return {
      dowels: ends.map((sx) => fx({ ...CT_DOWEL, at: [-60, 60].map((z): Vec3 => [sx * fx4, edge, z]), dir, on: side(sx), mate: id })),
      screws: [
        ...ends.map((sx) => fx({ ...CT_SCREW, at: [-20, 20].map((z): Vec3 => [sx * fx4, y, z]), dir, on: id, mate: side(sx) })),
        fx({ ...CT_SCREW, at: [-50, 50].map((x): Vec3 => [x, y, 0]), dir, on: id, mate: "P3" }),
      ],
    };
  };
  const top = plate("P2", yT, true);
  const bottom = plate("P6", 0, false);
  // the brackets: under the middle disc against each side panel, either side of the middle panel
  const corners = ends.flatMap((sx) => [-55, 55].map((z) => ({ sx, z })));
  const bx = gx - 13;
  // the wrap: its start at the back, a screw through the bottom plate's rim into it and one through it into the top plate
  const a0 = -Math.PI / 2;
  const rim = (a: number): Vec3 => [r1((rp - 6) * Math.cos(a)), 0, r1((rp - 6) * Math.sin(a))];
  // angled out from the rim into the rib
  const out = (a: number): Vec3 => [r1(0.51 * Math.cos(a)), 0.86, r1(0.51 * Math.sin(a))];
  const through = (a: number, y: number, mate: string) => fx({ ...CT_SCREW, at: [at(0, RD, a, y)], dir: [r1(-Math.cos(a)), 0, r1(-Math.sin(a))], on: "P7", mate });
  const down = (a: number) => fx({ ...CT_SCREW, at: [rim(a)], dir: out(a), on: "P6", mate: "P7" });
  const yP2 = y1 + PT / 2;

  const steps: CustomStep[] = [
    {
      title: "Push the dowels into the middle panel",
      detail: "First, the top (1) and the top plate (2) come bolted together: undo the four bolts (A) with the hex key (F) and keep them for later. Then push two dowels (D) into each long edge of the middle panel (3).",
      fix: ends.map((sx) => fx({ ...CT_DOWEL, at: third.map((y): Vec3 => [sx * gx, y, 0]), dir: [-sx, 0, 0], on: "P3", mate: side(sx) })),
      tools: ["allen"],
    },
    {
      title: "Screw the side panels on",
      detail: "Set a side panel (4) on each edge of the middle panel, over its dowels, and drive two screws (C) through each into the edge. Leave them a little loose.",
      add: ["P4L", "P4R"],
      fix: ends.map((sx) => fx({ ...CT_SCREW, at: sixth.map((y): Vec3 => [sx * (gx + PT), y, 0]), dir: [-sx, 0, 0], on: side(sx), mate: "P3" })),
      from: { P4L: [-350, 0, 0], P4R: [350, 0, 0] },
      tools: ["screwdriver"],
      warnings: ["loose"],
    },
    {
      title: "Screw the brackets inside the side panels",
      detail: "Screw a bracket (E) to the inside of each side panel, either side of the middle panel, with a small screw (B) each, its flat tab level and facing up.",
      fix: [
        ...corners.map(({ sx, z }) => fx({ ...CT_BRACKET, at: [[sx * bx, y5, z]], dir: [0, 1, 0], on: side(sx), twist: (-sx * Math.PI) / 2 })),
        ...corners.map(({ sx, z }) => fx({ ...CT_SMALL, at: [[sx * gx, y5 - 20, z]], dir: [sx, 0, 0], on: side(sx) })),
      ],
      tools: ["screwdriver"],
    },
    {
      title: "Slide the middle disc down onto the brackets",
      detail: "Lower the middle disc (5) over the panels, through its H shaped hole, until it rests on the four brackets, then drive a small screw (B) up through each bracket into it.",
      add: ["P5"],
      fix: corners.map(({ sx, z }) => fx({ ...CT_SMALL, at: [[sx * (bx - 16), y5, z + Math.sign(z) * 16]], dir: [0, 1, 0], on: "P5" })),
      from: { P5: [0, 450, 0] },
      tools: ["screwdriver"],
    },
    {
      title: "Fit the top plate",
      detail: "Push two dowels (D) into the top edge of each side panel, set the top plate (2) on them and drive six screws (C) down through it: two into each side panel and two into the middle panel.",
      add: ["P2"],
      fix: [...top.dowels, ...top.screws],
      from: { P2: [0, 300, 0] },
      tools: ["screwdriver"],
    },
    {
      title: "Turn it over and fit the bottom plate",
      detail: "Flip it onto the top plate and fit the bottom plate (6) the same way: four dowels (D) and six screws (C).",
      add: ["P6"],
      fix: [...bottom.dowels, ...bottom.screws],
      from: { P6: [0, -300, 0] },
      tools: ["screwdriver"],
      pose: "-y",
    },
    {
      title: "Bolt the core to the top",
      detail: "Lay the top (1) face down on a rug and stand the core on it, top plate down. Turn the four bolts (A) through the top plate into the top with the hex key (F), reaching in between the panels.",
      add: ["T1"],
      fix: [fx({ ...CT_BOLT, at: ends.flatMap((sx) => [-50, 50].map((z): Vec3 => [sx * 45, y1, z])), dir: [0, 1, 0], on: "P2", mate: "T1" })],
      from: { T1: [0, 0, 700] },
      tools: ["allen"],
      pose: "-y",
      warnings: ["floor"],
    },
    {
      title: "Start the ribbed wrap",
      detail: "Find the hole marked START on the bottom plate's rim. Line the first rib of the wrap (7) up with it, drive a screw (C) through the hole into the rib and one through the rib at the other end into the top plate, then wrap it round the plates.",
      add: ["P7"],
      fix: [down(a0), through(a0, yP2, "P2")],
      from: { P7: [0, 0, 600] },
      tools: ["screwdriver"],
      pose: "-y",
    },
    {
      title: "Screw the wrap all round",
      detail: "Pull the wrap tight so the gaps between the ribs close up, then drive eight more screws (C): four through the bottom plate's rim, three through the ribs into the top plate and one into the middle disc.",
      fix: [
        ...[90, 180, 270, 340].map((d) => down(a0 + deg(d))),
        ...[120, 240, 345].map((d) => through(a0 + deg(d), yP2, "P2")),
        through(a0 + Math.PI, y5 + PT / 2, "P5"),
      ],
      tools: ["screwdriver"],
      pose: "-y",
    },
    {
      title: "Stick on the felt pads",
      detail: "Tighten every screw and bolt, then press the four felt pads (G) onto the bottom plate.",
      fix: [fx({ ...CT_PAD, at: [45, 135, 225, 315].map((d) => at(0, 120, deg(d), 0)), dir: [0, 1, 0], on: "P6" })],
      tools: ["screwdriver"],
      pose: "-y",
    },
    {
      title: "Turn it over",
      detail: "Stand it on its pads. The top takes up to 10 kg.",
      pose: "+y",
    },
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-ryan-ribbed-console-table") return consoleTable(s);
  if (s.slug === "kmart-ryan-ribbed-coffee-table") return coffeeTable(s);
  return null;
}

const family: Family = { names: ["KMART:RYAN"], recipe };
export default family;
