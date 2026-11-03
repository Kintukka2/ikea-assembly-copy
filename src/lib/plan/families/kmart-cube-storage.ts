import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's cube storage units (4 Cube and 8 Cube), read from their assembly manuals. Unlike a KALLAX, the panels are
 * all 15 mm board and it goes together with screws through the outside, wooden dowels and double-ended dowel screws:
 *
 * - 4 Cube: two dividers are screwed onto the middle shelf with dowel screws, the sides go on the shelf's ends with
 *   dowels and screws, then the bottom and the top, two hardboard backs are nailed on, caps hide the screw heads and a
 *   small bracket holds it to the wall. Built standing up.
 * - 8 Cube: the same thing twice, as two halves of four cubes, lying on their backs. The first half gets an end panel at
 *   one end and the middle board at the other; the second half gets the other end panel and goes onto the middle board
 *   with four cam bolts and cam locks. Then it turns face down for its four backs, and stands up.
 *
 * Part numbers are Kmart's own (the 8 Cube's are 1 to 9, the 4 Cube's 1 to 5), so the guide reads against the paper.
 */

const T = 15; // every panel
const BACK = 3; // hardboard
const SCREW = { kind: "screw", len: 35, dia: 4, name: "Screw" } as const;
const DOWEL = { kind: "dowel", len: 30, dia: 6 } as const;
const STUD = { kind: "stud", len: 50, dia: 6, name: "Dowel screw" } as const;
const NAIL = { kind: "nail", len: 16, dia: 2 } as const;
const CAP = { kind: "cap", len: 1, dia: 15, name: "Cover cap" } as const;

function recipe(s: ProductSpec): CustomParams | null {
  const rows = s.shelf?.rows ?? Math.round(s.size.h / 30);
  const cols = s.shelf?.cols ?? 2;
  if (cols !== 2 || (rows !== 2 && rows !== 4)) return null;
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const halves = rows / 2; // 1 for the 4 Cube, 2 for the 8 Cube
  const boards = 2 * halves + 1;
  const cell = (H - boards * T) / rows;
  const L = 2 * cell + T; // a half's side panel
  const base = (m: number) => T + m * (L + T); // where half m's sides start
  const xs = W / 2 - T / 2;
  const zs = D / 2 - 55; // fittings sit this far in from the front and back edges
  const eight = halves === 2;

  // the manual's numbers
  const N = eight
    ? { side: ["1", "2", "3", "4"], end: "5", shelf: "6", mid: "7", div: "8", back: "9" }
    : { side: ["1", "1"], end: "4", shelf: "2", mid: "", div: "3", back: "5" };
  const sideName = eight ? ["Left side, first half", "Right side, first half", "Left side, second half", "Right side, second half"] : ["Side panel", "Side panel"];

  const parts: CustomPart[] = [];
  const part = (id: string, label: string, name: string, size: Vec3, pos: Vec3, material: "board" | "fiber" = "board") => parts.push({ id, label, name, size, pos, material });
  part("E0", N.end, "End panel", [W, T, D], [0, T / 2, 0]);
  for (let m = 0; m < halves; m++) {
    const b = base(m);
    part(`S${m}L`, N.side[2 * m], sideName[2 * m], [T, L, D], [-xs, b + L / 2, 0]);
    part(`S${m}R`, N.side[2 * m + 1], sideName[2 * m + 1], [T, L, D], [xs, b + L / 2, 0]);
    part(`H${m}`, N.shelf, "Middle shelf", [W - 2 * T, T, D], [0, b + cell + T / 2, 0]);
    part(`V${m}a`, N.div, "Divider", [T, cell, D], [0, b + cell / 2, 0]);
    part(`V${m}b`, N.div, "Divider", [T, cell, D], [0, b + cell + T + cell / 2, 0]);
  }
  if (eight) part("M", N.mid, "Middle board", [W, T, D], [0, base(1) - T / 2, 0]);
  part("E1", N.end, "End panel", [W, T, D], [0, H - T / 2, 0]);
  // backs: one per row of two cubes, all the same size, each edge landing on a board
  const cuts = Array.from({ length: rows + 1 }, (_, r) => (r * H) / rows);
  for (let r = 0; r < rows; r++) part(`K${r}`, N.back, "Back panel", [W, cuts[r + 1] - cuts[r], BACK], [0, (cuts[r] + cuts[r + 1]) / 2, -D / 2 - BACK / 2], "fiber");

  const pair = (x: number, y: number): Vec3[] => [
    [x, y, -zs],
    [x, y, zs],
  ];
  const fx = (def: { kind: CustomFix["kind"]; len: number; dia: number; name?: string }, at: Vec3[], dir: Vec3, on: string, mate?: string, extra: Partial<CustomFix> = {}): CustomFix => ({
    ...def,
    count: at.length,
    at,
    dir,
    on,
    ...(mate ? { mate } : {}),
    ...extra,
  });
  const shelfY = (m: number) => base(m) + cell + T / 2;
  // dowel screws through the shelf into the dividers above and below it
  const studs = (m: number): CustomFix[] => [
    fx(STUD, pair(0, shelfY(m) + T / 2), [0, 1, 0], `V${m}b`, `H${m}`),
    ...(eight ? [fx(STUD, pair(0, shelfY(m) - T / 2), [0, -1, 0], `V${m}a`, `H${m}`)] : []),
  ];
  // dowels in the shelf's ends, screws through each side into them
  const shelfDowels = (m: number) => [fx(DOWEL, pair(-W / 2 + T, shelfY(m)), [-1, 0, 0], `H${m}`, `S${m}L`), fx(DOWEL, pair(W / 2 - T, shelfY(m)), [1, 0, 0], `H${m}`, `S${m}R`)];
  const sideScrews = (m: number) => [fx(SCREW, pair(-W / 2, shelfY(m)), [1, 0, 0], `S${m}L`, `H${m}`), fx(SCREW, pair(W / 2, shelfY(m)), [-1, 0, 0], `S${m}R`, `H${m}`)];
  // an end panel or the middle board on the ends of a half: dowels in the sides' and divider's edges, screws through it
  const endDowels = (m: number, y: number, dir: 1 | -1, panel: string) => [
    fx(DOWEL, pair(-xs, y), [0, dir, 0], `S${m}L`, panel),
    fx(DOWEL, pair(xs, y), [0, dir, 0], `S${m}R`, panel),
    fx(DOWEL, pair(0, y), [0, dir, 0], dir < 0 ? `V${m}a` : `V${m}b`, panel),
  ];
  const endScrews = (m: number, y: number, dir: 1 | -1, panel: string) => [fx(SCREW, pair(-xs, y), [0, dir, 0], panel, `S${m}L`), fx(SCREW, pair(xs, y), [0, dir, 0], panel, `S${m}R`)];
  const caps = (pts: Vec3[], dir: Vec3, on: string) => fx(CAP, pts, dir, on);

  const lie = eight ? ("+z" as const) : undefined;
  const steps: CustomStep[] = [];
  const shelfStep = (m: number): CustomStep => ({
    title: eight ? (m === 0 ? "Screw the dividers onto a middle shelf" : "Screw the other two dividers onto the second shelf") : "Screw the dividers onto the middle shelf",
    detail: eight
      ? "Turn the dowel screws into the shelf's holes by hand, then twist a divider onto them above the shelf and one below, lined up with the holes in the middle."
      : "Turn the two dowel screws into the middle of the shelf by hand, then twist a divider onto them from above and the other from below.",
    add: [`H${m}`, `V${m}a`, `V${m}b`],
    fix: studs(m),
    pose: lie,
  });
  const sideStep = (m: number): CustomStep => ({
    title: m === 0 ? "Fix the side panels to the shelf" : "Fix the other two side panels to the second shelf",
    detail: "Tap the dowels into the shelf's ends with the mallet, push a side onto each end, then drive two screws through each side into the shelf.",
    add: [`S${m}L`, `S${m}R`],
    fix: [...shelfDowels(m), ...sideScrews(m)],
    pose: lie,
  });
  if (eight) {
    steps.push(shelfStep(0), sideStep(0));
    steps.push({
      title: "Screw an end panel onto one end",
      detail: "Tap dowels into the edges of both sides and the divider, push the end panel on, and screw through it into each side.",
      add: ["E0"],
      fix: [...endDowels(0, T, -1, "E0"), ...endScrews(0, 0, 1, "E0")],
      pose: lie,
    });
    steps.push({
      title: "Screw the middle board onto the other end",
      detail: "Turn the two dowel screws into the divider's edge so half of each sticks out, press the middle board on, and screw through it into the sides. Then turn the four cam bolts into the board's outer face.",
      add: ["M"],
      fix: [
        fx(STUD, pair(0, base(1) - T), [0, 1, 0], "V0b", "M"),
        ...endScrews(0, base(1), -1, "M"),
        fx({ kind: "camScrew", len: 35, dia: 6, name: "Cam bolt" }, [...pair(-xs, base(1)), ...pair(xs, base(1))], [0, -1, 0], "M"),
      ],
      pose: lie,
    });
    steps.push(shelfStep(1), sideStep(1));
    steps.push({
      title: "Screw the other end panel onto the second half",
      detail: "Dowels into the sides' and divider's edges at the end without cam holes, then the end panel, screwed through into each side.",
      add: ["E1"],
      fix: [...endDowels(1, H - T, 1, "E1"), ...endScrews(1, H, -1, "E1")],
      pose: lie,
    });
    steps.push({
      title: "Join the two halves with the cam locks",
      detail: "Slide the second half onto the cam bolts in the middle board, the divider onto the dowel screws. Drop a cam lock into each hole in its sides, arrow towards the edge, and turn it clockwise until it pulls tight.",
      fix: [fx({ kind: "cam", len: 9.5, dia: 15, name: "Cam lock" }, [...pair(-xs, base(1) + 22).map(([, y, z]) => [-W / 2 + T, y, z] as Vec3)], [1, 0, 0], "S1L"), fx({ kind: "cam", len: 9.5, dia: 15, name: "Cam lock" }, pair(xs, base(1) + 22).map(([, y, z]) => [W / 2 - T, y, z] as Vec3), [-1, 0, 0], "S1R")],
      tools: ["screwdriver"],
      pose: lie,
      check: "square",
    });
  } else {
    steps.push(shelfStep(0), sideStep(0));
    steps.push({
      title: "Screw on the bottom panel",
      detail: "Tap dowels into the bottom edges of both sides and the lower divider, push the bottom panel on, and screw up through it into each side.",
      add: ["E0"],
      fix: [...endDowels(0, T, -1, "E0"), ...endScrews(0, 0, 1, "E0")],
    });
    steps.push({
      title: "Screw on the top panel",
      detail: "The same at the top: dowels into the edges, the top panel pressed down onto them, two screws into each side.",
      add: ["E1"],
      fix: [...endDowels(0, H - T, 1, "E1"), ...endScrews(0, H, -1, "E1")],
      check: "square",
    });
  }

  // the backs, nailed into every board behind them: the sides and the divider, and the boards along their edges
  // (the 8 Cube's manual counts 12 nails a back, the 4 Cube's 8)
  const nails: CustomFix[] = [];
  for (let r = 0; r < rows; r++) {
    const y0 = cuts[r], y1 = cuts[r + 1], hgt = y1 - y0;
    const z = -D / 2 - BACK;
    const pts: Vec3[] = [];
    for (const x of [-xs, 0, xs]) pts.push([x, y0 + hgt * 0.28, z], [x, y0 + hgt * 0.72, z]);
    if (eight) for (const y of [y0 + 7, y1 - 7]) pts.push([-W / 3, y, z], [0, y, z], [W / 3, y, z]);
    else pts.push([-W / 4, r === 0 ? 7 : H - 7, z], [W / 4, r === 0 ? 7 : H - 7, z]);
    nails.push(fx(NAIL, pts, [0, 0, 1], `K${r}`));
  }
  steps.push({
    title: eight ? "Turn it face down and nail on the backs" : "Nail on the backs",
    detail: eight
      ? "Roll it over onto its front on a rug. Lay a back over each row of two cubes, square it to the edges and tap in the small nails all round it."
      : "Lay it on its front (or turn its back to you), lay a back panel over each row of cubes, square it to the edges and tap the small nails in all round it.",
    add: Array.from({ length: rows }, (_, r) => `K${r}`),
    fix: nails,
    pose: "-z",
    warnings: ["floor"],
  });

  // caps over every screw head that shows: the sides' and the end panels'
  const capPts = {
    sides: Array.from({ length: halves }, (_, m) => [...pair(-W / 2, shelfY(m)), ...pair(W / 2, shelfY(m))]).flat(),
    top: [...pair(-xs, H), ...pair(xs, H)],
    bottom: [...pair(-xs, 0), ...pair(xs, 0)],
  };
  steps.push({
    title: eight ? "Stand it up and cap the screws" : "Press the caps onto the screw heads",
    detail: "Press a cover cap onto every screw head on the outside: the sides, the top and the bottom.",
    fix: [
      caps(capPts.sides.filter((p) => p[0] < 0), [1, 0, 0], "S0L"),
      caps(capPts.sides.filter((p) => p[0] > 0), [-1, 0, 0], "S0R"),
      caps(capPts.top, [0, -1, 0], "E1"),
      caps(capPts.bottom, [0, 1, 0], "E0"),
    ],
    pose: "+y",
  });
  steps.push({
    title: "Fix it to the wall",
    detail: "Screw the small bracket under the top at the back, then screw it to the wall with the plug and screw from the box. Check the wall for pipes and cables first.",
    fix: [
      { kind: "angle", count: 1, len: 28, dia: 28, name: "Wall bracket", at: [[0, H - T, -D / 2 + 14]], dir: [0, 1, 0], on: "E1" },
      { kind: "screw", count: 1, len: 12, dia: 4, name: "Bracket screw", at: [[0, H - T, -D / 2 + 20]], dir: [0, 1, 0], on: "E1" },
      { kind: "plug", count: 1, len: 30, dia: 6, included: true, at: [[0, H - T - 14, -D / 2 - BACK - 1]], dir: [0, 0, -1] },
      { kind: "screw", count: 1, len: 35, dia: 4, name: "Wall screw", included: true, at: [[0, H - T - 14, -D / 2 - BACK + 2]], dir: [0, 0, -1] },
    ],
    tools: ["drill", "screwdriver", "pencil"],
    wall: true,
    warnings: ["wall", "tip"],
  });
  return { parts, steps };
}

const family: Family = { names: ["KMART:CUBE STORAGE"], recipe };
export default family;
