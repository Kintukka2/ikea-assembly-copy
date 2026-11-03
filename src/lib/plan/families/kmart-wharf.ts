import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's WHARF line, read from its assembly manuals: particle board on welded metal frames, bolted together
 * with an Allen key. Both manuals say to leave the bolts loose until the end and tighten them all at once.
 *
 * - 5 Tier Bookshelf (43635405): two ladder frames (3) with a rail under each shelf. Lying on its back, the five
 *   shelves (four 1 and the middle one 2, which has the wall holes) go between the frames, two bolts up through the
 *   rail into each shelf end, 20 in all, and a levelling foot into each post. Stood up, two angle brackets on the
 *   middle shelf hold it to the wall.
 * - Student Desk (43633050): upside down on its top (1), the back beam (4) goes on with three long bolts and the slim
 *   front bar (3) with three short ones; the two leg frames (2) bolt onto their ends, then down onto the top, the feet
 *   screw into the frames, and the cross brace (5) bolts across the back legs with screws and nuts.
 *
 * The 6 Drawer Chest has no manual here, so it keeps the kind builder.
 */

type Def = { kind: CustomFix["kind"]; len: number; dia: number; name?: string; included?: boolean };
const fx = (def: Def, at: Vec3[], dir: Vec3, on?: string, mate?: string): CustomFix => ({
  ...def,
  count: at.length,
  at,
  dir,
  ...(on ? { on } : {}),
  ...(mate ? { mate } : {}),
});

/* ---------- 5 Tier Bookshelf ---------- */

const BOLT_A = { kind: "bolt", len: 30, dia: 6 } as const; // A
const WALL_B = { kind: "screw", len: 35, dia: 4, name: "Wall screw", included: true } as const; // B
const PLUG_C = { kind: "plug", len: 30, dia: 6, included: true } as const; // C
const BRACKET_D = { kind: "angle", len: 50, dia: 20, name: "Wall bracket" } as const; // D
const SCREW_E = { kind: "screw", len: 12, dia: 4, name: "Bracket screw" } as const; // E
const FOOT_F = { kind: "foot", len: 10, dia: 22, name: "Levelling foot" } as const; // F

function bookshelf(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const T = 16; // shelf board
  const P = 30; // square post
  const RAIL = 20; // the rail under each shelf
  const FOOT = 10;
  const over = 80; // each shelf reaches past the frames this much
  const xf = W / 2 - over - P / 2; // middle of a frame
  const zp = D / 2 - P / 2; // middle of a post
  const sd = D - 2 * P; // a shelf fits between the posts
  const levels = 5;
  const topY = H - 20; // the top shelf sits just under the post tops
  const gap = (topY - 110) / (levels - 1);
  const shelfTop = Array.from({ length: levels }, (_, i) => Math.round(110 + i * gap));

  // a side frame: front and back post, a rail under every shelf
  const fy = (FOOT + H) / 2;
  const frame: PartPiece[] = [
    ...[-1, 1].map((sz): PartPiece => ({ shape: "box", size: [P, H - FOOT, P], pos: [0, 0, sz * zp] })),
    ...shelfTop.map((y): PartPiece => ({ shape: "box", size: [P, RAIL, sd], pos: [0, y - T - RAIL / 2 - fy, 0] })),
  ];
  const parts: CustomPart[] = [
    { id: "L", label: "3", name: "Side frame", size: [P, H - FOOT, D], pos: [-xf, fy, 0], material: "metal", pieces: frame },
    { id: "R", label: "3", name: "Side frame", size: [P, H - FOOT, D], pos: [xf, fy, 0], material: "metal", pieces: frame },
  ];
  const mid = Math.floor(levels / 2);
  shelfTop.forEach((y, i) => parts.push({ id: `S${i}`, label: i === mid ? "2" : "1", name: i === mid ? "Middle shelf" : "Shelf", size: [W, T, sd], pos: [0, y - T / 2, 0], material: "board" }));
  const shelves = shelfTop.map((_, i) => `S${i}`);

  // two bolts up through the rail into each end of each shelf, near the front and back posts
  const bolts = (sx: -1 | 1, on: string) => shelfTop.map((y, i) => fx(BOLT_A, [-1, 1].map((sz): Vec3 => [sx * xf, y - T - RAIL, sz * (sd / 2 - 40)]), [0, 1, 0], on, `S${i}`));
  const feet = (sx: -1 | 1, on: string) => fx(FOOT_F, [-1, 1].map((sz): Vec3 => [sx * xf, FOOT, sz * zp]), [0, 1, 0], on);

  const y2 = shelfTop[mid];
  const bx = [-xf + 120, xf - 120].map(Math.round);
  const zw = -D / 2; // the wall, against the back posts
  const steps: CustomStep[] = [
    {
      title: "Bolt the shelves to one frame",
      detail: "Lay a frame on its back edge, on a rug. Rest the five shelves on its rails, the one with the extra holes in the middle, and turn two bolts up through the rail into each shelf. Keep them loose for now.",
      add: ["L", ...shelves],
      fix: bolts(-1, "L"),
      tools: ["allen"],
      pose: "+z",
      warnings: ["floor", "loose"],
    },
    {
      title: "Bolt on the other frame",
      detail: "Set the second frame against the other ends of the shelves and turn two bolts up through each rail, still loose.",
      add: ["R"],
      fix: bolts(1, "R"),
      tools: ["allen"],
      pose: "+z",
      warnings: ["loose"],
    },
    {
      title: "Screw in the levelling feet",
      detail: "Turn a foot into the bottom of each of the four posts by hand.",
      fix: [feet(-1, "L"), feet(1, "R")],
      pose: "+z",
    },
    {
      title: "Stand it up and tighten every bolt",
      detail: "Lift it upright, check it stands square, then go round and tighten all twenty bolts with the Allen key. Turn the feet to stop it rocking.",
      pose: "+y",
      tools: ["allen"],
      check: "square",
    },
    {
      title: "Fix it to the wall",
      detail: "Screw the two brackets onto the middle shelf at the back, upright legs against the wall. Mark, drill, push in the plugs and screw through the brackets. Check the wall for pipes and cables first.",
      fix: [
        fx(BRACKET_D, bx.map((x): Vec3 => [x, y2, zw + 25]), [0, -1, 0], `S${mid}`),
        fx(SCREW_E, bx.map((x): Vec3 => [x, y2, zw + 48]), [0, -1, 0], `S${mid}`),
        fx(PLUG_C, bx.map((x): Vec3 => [x, y2 + 30, zw - 30]), [0, 0, -1]),
        fx(WALL_B, bx.map((x): Vec3 => [x, y2 + 30, zw + 2]), [0, 0, -1], `S${mid}`),
      ],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

/* ---------- Student Desk ---------- */

const BOLT_SA = { kind: "bolt", len: 30, dia: 6 } as const; // A
const BOLT_LB = { kind: "bolt", len: 60, dia: 6 } as const; // B
const SCREW_C = { kind: "screw", len: 22, dia: 4, name: "Brace screw" } as const; // C
const NUT_D = { kind: "nut", len: 3, dia: 4 } as const; // D
const FOOT_E = { kind: "foot", len: 10, dia: 22, name: "Levelling foot" } as const; // E

function desk(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const T = 18; // top
  const TU = 25; // square tube
  const FOOT = 10;
  const yT = H - T; // underside of the top
  const xf = W / 2 - 30 - TU / 2; // middle of a leg frame
  const fd = D - 40; // depth of a leg frame
  const zp = fd / 2 - TU / 2; // middle of its posts
  const fh = yT - FOOT;
  const fy = FOOT + fh / 2;
  const legFrame: PartPiece[] = [
    ...[-1, 1].map((sz): PartPiece => ({ shape: "box", size: [TU, fh, TU], pos: [0, 0, sz * zp] })),
    ...[-1, 1].map((sy): PartPiece => ({ shape: "box", size: [TU, TU, fd - 2 * TU], pos: [0, sy * (fh / 2 - TU / 2), 0] })),
  ];
  const span = 2 * (xf - TU / 2); // between the frames
  const BH = 50; // back beam height
  const yb = [yT - BH, yT]; // the back beam
  const yBar = yT - 10; // the front bar, 20 high
  // the cross brace: two flat bars from each back post's top to the other's bottom
  const yHi = Math.round(FOOT + fh * 0.78), yLo = Math.round(FOOT + fh * 0.28);
  const bdx = 2 * xf, bdy = yHi - yLo, blen = Math.hypot(bdx, bdy), ang = Math.atan2(bdx, bdy);
  const zBr = -fd / 2 - 4;
  const brace: PartPiece[] = [
    { shape: "cyl", size: [8, blen, 8], pos: [0, 0, 0], rot: [0, 0, ang], material: "metal" },
    { shape: "cyl", size: [8, blen, 8], pos: [0, 0, 0], rot: [0, 0, -ang], material: "metal" },
  ];
  const parts: CustomPart[] = [
    { id: "T", label: "1", name: "Desk top", size: [W, T, D], pos: [0, yT + T / 2, 0], material: "board" },
    { id: "FL", label: "2", name: "Leg frame", size: [TU, fh, fd], pos: [-xf, fy, 0], material: "metal", pieces: legFrame },
    { id: "FR", label: "2", name: "Leg frame", size: [TU, fh, fd], pos: [xf, fy, 0], material: "metal", pieces: legFrame },
    { id: "BAR", label: "3", name: "Front bar", size: [span, 20, 20], pos: [0, yBar, zp], material: "metal" },
    { id: "BEAM", label: "4", name: "Back beam", size: [span, BH, TU], pos: [0, (yb[0] + yb[1]) / 2, -zp], material: "metal" },
    { id: "X", label: "5", name: "Cross brace", size: [bdx, bdy, 8], pos: [0, (yHi + yLo) / 2, zBr], material: "metal", pieces: brace },
  ];
  const xr = [-span / 3, 0, span / 3].map(Math.round);
  const ends = [-1, 1] as const;
  const steps: CustomStep[] = [
    {
      title: "Bolt the beam and the bar to the top",
      detail: "Lay the top face down on a rug. Put the deep back beam along one long edge and the slim front bar along the other, then turn three long bolts through the beam and three short ones through the bar into the top. Leave them loose.",
      add: ["T", "BEAM", "BAR"],
      fix: [fx(BOLT_LB, xr.map((x): Vec3 => [x, yb[0], -zp]), [0, 1, 0], "BEAM", "T"), fx(BOLT_SA, xr.map((x): Vec3 => [x, yBar - 10, zp]), [0, 1, 0], "BAR", "T")],
      tools: ["allen"],
      pose: "-y",
      warnings: ["floor", "loose"],
    },
    {
      title: "Bolt the leg frames onto the ends",
      detail: "Stand a frame at each end, its top rail on the top, and turn three long bolts through it: two into the end of the beam and one into the end of the bar.",
      add: ["FL", "FR"],
      fix: ends.flatMap((sx) => [
        fx(BOLT_LB, [yT - 13, yT - 38].map((y): Vec3 => [sx * (xf + TU / 2), y, -zp]), [-sx, 0, 0], sx < 0 ? "FL" : "FR", "BEAM"),
        fx(BOLT_LB, [[sx * (xf + TU / 2), yBar, zp]], [-sx, 0, 0], sx < 0 ? "FL" : "FR", "BAR"),
      ]),
      tools: ["allen"],
      pose: "-y",
      warnings: ["loose"],
    },
    {
      title: "Bolt the frames to the top and fit the feet",
      detail: "Turn two short bolts through each frame's top rail into the top, then screw a levelling foot into each corner of the frames by hand.",
      fix: [
        ...ends.map((sx) => fx(BOLT_SA, [-1, 1].map((sz): Vec3 => [sx * xf, yT - TU, sz * (zp - 90)]), [0, 1, 0], sx < 0 ? "FL" : "FR", "T")),
        ...ends.map((sx) => fx(FOOT_E, [-1, 1].map((sz): Vec3 => [sx * xf, FOOT, sz * zp]), [0, 1, 0], sx < 0 ? "FL" : "FR")),
      ],
      tools: ["allen"],
      pose: "-y",
    },
    {
      title: "Bolt the cross brace across the back legs",
      detail: "Hold the brace against the back legs, the ends of one bar high on one side and low on the other. Put a screw through each end and the leg and tighten a nut on it with the spanner.",
      add: ["X"],
      fix: [
        fx(SCREW_C, [-1, 1].flatMap((sx) => [yHi, yLo].map((y): Vec3 => [sx * xf, y, zBr - 4])), [0, 0, 1], "X"),
        ...ends.map((sx) => fx(NUT_D, [yHi, yLo].map((y): Vec3 => [sx * xf, y, -zp + TU / 2]), [0, 0, -1], sx < 0 ? "FL" : "FR")),
      ],
      tools: ["screwdriver", "wrench"],
      pose: "-y",
    },
    {
      title: "Turn it over and tighten everything",
      detail: "Turn the desk onto its feet, check it stands square, then tighten every bolt and screw. Turn the feet to stop it rocking.",
      pose: "+y",
      tools: ["allen", "wrench"],
      check: "square",
    },
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-wharf-5-tier-bookshelf") return bookshelf(s);
  if (s.slug === "kmart-wharf-student-desk") return desk(s);
  return null; // the 6 Drawer Chest has no manual here
}

const family: Family = { names: ["KMART:WHARF"], recipe };
export default family;
