import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's cube storage units, read from their assembly manuals. Unlike a KALLAX, the panels are all 15 mm board and
 * they go together with screws through the outside and wooden dowels, with long dowels pushed right through the
 * shelves into the dividers above and below.
 *
 * - 4 Cube Storage Unit (White 42633310, the keycode Kmart files the manual under). Built standing: two long dowels
 *   through the middle shelf (2) take a divider (3) above and below, the sides (1) go on the shelf's ends with dowels
 *   and screws, then the bottom and the top (both 4). Two backs (5) are nailed on, each covering one cube, then caps
 *   go over the screw heads and a bracket on the top holds it to the wall. Kmart's bag: A 12 screws 4 x 35, B 2 long
 *   dowels 6 x 50, C 16 dowels 6 x 30, D 12 caps, E 16 nails 2 x 16, F a bracket screw 4 x 12, G the bracket,
 *   H a wall screw and plug (one set, drawn as a screw and a plug). The manual's steps 1 to 3 are the lists and an
 *   exploded view, so the guide's 7 steps are its steps 4 to 10.
 *   The backs: each is about one cube square with one corner clipped, and only two cubes get one. The exploded view
 *   puts them behind the top right and bottom left cubes, the nailing drawing on the other diagonal. The nailing
 *   drawing is the one that shows them going on: it looks at the back with a side panel on its left, which from
 *   behind is the unit's right side, so its upper back is on the unit's left and its lower back on the right. The
 *   guide follows it: seen from the front, the top left and bottom right cubes are backed, the clipped corners
 *   meeting in the middle where the shelf crosses the dividers.
 * - 8 Cube Storage Unit (White 42633297, the same file as Oak 42633280; the newer Walnut Look edition 43707348 names
 *   all three on its title and builds it the same way). Built lying on its back as two halves of four cubes. Both
 *   shelves (6) get their dividers (8) on two long dowels each, then sides 1 and 2 go on one and 3 and 4 on the other.
 *   The first half gets an end panel (5) and the middle board (7), with six long dowels through 7 for the second
 *   half; the second half gets the other end panel and goes onto 7 with four cam bolts and cam locks. Turned face down
 *   for the four backs (9), stood up for the caps and the wall bracket. Kmart's bag: a 20 screws 4 x 35, b 20 dowels
 *   6 x 30, c 10 long dowels 6 x 50, d 4 cam bolts, e 4 cam locks, f the bracket, g its screw 4 x 12, h a wall plug,
 *   i a wall screw 4 x 35, j 16 caps, k 48 nails 2 x 16. Its step 11 presses on the caps and fixes the bracket to the
 *   wall: two jobs, so the guide splits it, 9 steps for its steps 4 to 11. The second half is built beside the first
 *   and slides on in step 6. The Walnut edition groups the steps by half, sticks six pads (L) under the bottom and
 *   caps the other 12 screws; the guide follows the White manual.
 * - 4 of the 8 Cube's 20 screws (through board 7 into the first half) end up between the halves, so its 16 caps go on
 *   the other 16. The manuals print no size; the rows are Kmart's listed sizes.
 *
 * Part numbers are Kmart's own labels; fittings have plain names and the manual's letters are in the step text.
 */

const T = 15; // every panel
const BACK = 3; // hardboard

type Def = { kind: CustomFix["kind"]; len: number; dia: number; name?: string; included?: boolean };
const fx = (def: Def, at: Vec3[], dir: Vec3, on?: string, mate?: string): CustomFix => ({
  ...def,
  count: at.length,
  at,
  dir,
  ...(on ? { on } : {}),
  ...(mate ? { mate } : {}),
});

const SCREW: Def = { kind: "screw", len: 35, dia: 4, name: "Screw" };
const DOWEL: Def = { kind: "dowel", len: 30, dia: 6 };
const LONG: Def = { kind: "dowel", len: 50, dia: 6, name: "Long dowel" };
const CAP: Def = { kind: "cap", len: 1, dia: 15 };
const NAIL: Def = { kind: "nail", len: 16, dia: 2 };
const BRACKET: Def = { kind: "angle", len: 28, dia: 28, name: "Wall bracket" };
const BRACKET_SCREW: Def = { kind: "screw", len: 12, dia: 4, name: "Bracket screw" };
const PLUG: Def = { kind: "plug", len: 30, dia: 6, included: true };
const WALL_SCREW: Def = { kind: "screw", len: 35, dia: 4, name: "Wall screw", included: true };
const CAM_BOLT: Def = { kind: "camScrew", len: 35, dia: 6 };
const CAM: Def = { kind: "cam", len: 9.5, dia: 15 };

const SX = [-1, 1] as const;

/** The frame every cube unit shares: sizes and where things sit, from the row's size. */
function frame(s: ProductSpec) {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const DC = D - BACK; // the boards stop at the back, which is nailed on behind them
  const zc = BACK / 2;
  const pm = (dz: number) => [zc - dz, zc + dz];
  return {
    W,
    H,
    D,
    DC,
    zc,
    zk: -D / 2 + BACK / 2, // the backs
    xs: W / 2 - T / 2, // middle of a side
    xi: W / 2 - T, // inner face of a side
    zA: pm(DC / 2 - 60), // two screws at every joint
    zB: pm(DC / 2 - 30), // and two dowels, nearer the edges
    zL: pm(70), // long dowels, near the middle
  };
}

/** The wall bracket on the top at the back, screwed down into it, its upright leg screwed to the wall. */
function wallStep(f: ReturnType<typeof frame>, top: string, letters: { bracket: string; screw: string; wall: string }): CustomStep {
  const zw = -f.D / 2, yW = f.H + 14;
  return {
    title: "Fix it to the wall",
    detail: `Screw the small bracket (${letters.bracket}) onto the top at the back with its short screw (${letters.screw}), the upright leg against the wall. Mark through it, drill, push in the plug and screw the leg to the wall (${letters.wall}). Check the wall for pipes and cables first.`,
    fix: [
      fx(BRACKET, [[0, f.H, zw + BACK + 14]], [0, -1, 0], top),
      fx(BRACKET_SCREW, [[0, f.H, zw + BACK + 22]], [0, -1, 0], top),
      fx(PLUG, [[0, yW, zw - 30]], [0, 0, -1]),
      fx(WALL_SCREW, [[0, yW, zw + 2]], [0, 0, -1]),
    ],
    tools: ["drill", "screwdriver", "pencil"],
    wall: true,
    warnings: ["wall", "tip"],
  };
}

/* ---------- 4 Cube Storage Unit ---------- */

function fourCube(s: ProductSpec): CustomParams {
  const f = frame(s);
  const { W, H, DC, zc, zk, xs, xi, zA, zB, zL } = f;
  const cell = (H - 3 * T) / 2;
  const yS = H / 2; // the middle shelf
  const L = H - 2 * T; // a side stands between the bottom and the top

  // a back covers one cube, its corner clipped where it meets the other back in the middle
  const bw = W / 2, bh = H / 2, CLIP = 25;
  const backPiece: PartPiece[] = [
    {
      shape: "slab",
      outline: [
        [-bw / 2, -bh / 2],
        [bw / 2 - CLIP, -bh / 2],
        [bw / 2, -bh / 2 + CLIP],
        [bw / 2, bh / 2],
        [-bw / 2, bh / 2],
      ],
      size: [bw, BACK, bh],
      pos: [0, 0, 0],
      rot: [-Math.PI / 2, 0, 0],
    },
  ];

  const parts: CustomPart[] = [
    { id: "SL", label: "1", name: "Side panel", size: [T, L, DC], pos: [-xs, H / 2, zc] },
    { id: "SR", label: "1", name: "Side panel", size: [T, L, DC], pos: [xs, H / 2, zc] },
    { id: "H", label: "2", name: "Middle shelf", size: [W - 2 * T, T, DC], pos: [0, yS, zc] },
    { id: "Va", label: "3", name: "Divider", size: [T, cell, DC], pos: [0, T + cell / 2, zc] },
    { id: "Vb", label: "3", name: "Divider", size: [T, cell, DC], pos: [0, yS + T / 2 + cell / 2, zc] },
    { id: "E0", label: "4", name: "End panel", size: [W, T, DC], pos: [0, T / 2, zc] },
    { id: "E1", label: "4", name: "End panel", size: [W, T, DC], pos: [0, H - T / 2, zc] },
    // seen from the front: behind the top left cube, and behind the bottom right one (the same back turned round)
    { id: "K0", label: "5", name: "Back panel", size: [bw, bh, BACK], pos: [-W / 4, (3 * H) / 4, zk], material: "fiber", pieces: backPiece },
    { id: "K1", label: "5", name: "Back panel", size: [bw, bh, BACK], pos: [W / 4, H / 4, zk], rot: [0, 0, Math.PI], material: "fiber", pieces: backPiece },
  ];
  const side = (sx: number) => (sx < 0 ? "SL" : "SR");

  // eight nails a back, two along each edge: the side, the top or bottom, the divider and the shelf
  const zn = -f.D / 2;
  const backNails = (sx: -1 | 1, yEdge: number, yMid: number, yc: number): Vec3[] => [
    ...[-70, 70].map((d): Vec3 => [sx * xs, yc + d, zn]),
    ...[-70, 70].map((d): Vec3 => [sx * (W / 4) + d, yEdge, zn]),
    ...[-70, 70].map((d): Vec3 => [sx * 4, yc + d, zn]),
    ...[-70, 70].map((d): Vec3 => [sx * (W / 4) + d, yMid, zn]),
  ];

  const steps: CustomStep[] = [
    {
      title: "Fit the dividers to the middle shelf",
      detail: "Push the two long dowels (B) through the holes in the middle of shelf 2 so they stick out both faces, then press a divider 3 onto them from above and the other from below.",
      add: ["H", "Va", "Vb"],
      from: { Va: [0, -300, 0], Vb: [0, 300, 0] },
      fix: [fx(LONG, zL.map((z): Vec3 => [0, yS + T / 2, z]), [0, 1, 0], "Vb", "H")],
    },
    {
      title: "Fix the side panels to the shelf",
      detail: "Two dowels (C) into each end of the shelf, push a side panel 1 onto each end, then drive two screws (A) through each side into the shelf.",
      add: ["SL", "SR"],
      from: { SL: [-360, 0, 0], SR: [360, 0, 0] },
      fix: [...SX.map((sx) => fx(DOWEL, zB.map((z): Vec3 => [sx * xi, yS, z]), [-sx, 0, 0], "H", side(sx))), ...SX.map((sx) => fx(SCREW, zA.map((z): Vec3 => [sx * (W / 2), yS, z]), [-sx, 0, 0], side(sx), "H"))],
    },
    {
      title: "Screw on the bottom panel",
      detail: "Two dowels (C) into the bottom edge of each side and of the lower divider, push an end panel 4 onto them and drive two screws (A) up through it into each side.",
      add: ["E0"],
      from: { E0: [0, -320, 0] },
      fix: [
        ...SX.map((sx) => fx(DOWEL, zB.map((z): Vec3 => [sx * xs, T, z]), [0, 1, 0], side(sx), "E0")),
        fx(DOWEL, zB.map((z): Vec3 => [0, T, z]), [0, 1, 0], "Va", "E0"),
        ...SX.map((sx) => fx(SCREW, zA.map((z): Vec3 => [sx * xs, 0, z]), [0, 1, 0], "E0", side(sx))),
      ],
    },
    {
      title: "Screw on the top panel",
      detail: "The same at the top: two dowels (C) into each side and the upper divider, the other end panel 4 pressed on, two screws (A) down into each side.",
      add: ["E1"],
      from: { E1: [0, 320, 0] },
      fix: [
        ...SX.map((sx) => fx(DOWEL, zB.map((z): Vec3 => [sx * xs, H - T, z]), [0, -1, 0], side(sx), "E1")),
        fx(DOWEL, zB.map((z): Vec3 => [0, H - T, z]), [0, -1, 0], "Vb", "E1"),
        ...SX.map((sx) => fx(SCREW, zA.map((z): Vec3 => [sx * xs, H, z]), [0, -1, 0], "E1", side(sx))),
      ],
      check: "square",
    },
    {
      title: "Nail on the two backs",
      detail: "Lay it on its front (or turn its back to you). One back 5 goes over the top left cube (as seen from the front) and the other over the bottom right one, clipped corners in the middle. Square each to the edges and tap in eight nails (E) round it, two along each edge.",
      add: ["K0", "K1"],
      from: { K0: [0, 0, -320], K1: [0, 0, -320] },
      fix: [fx(NAIL, backNails(-1, H - T / 2, yS + 4, (3 * H) / 4), [0, 0, 1], "K0"), fx(NAIL, backNails(1, T / 2, yS - 4, H / 4), [0, 0, 1], "K1")],
      pose: "-z",
      warnings: ["floor"],
    },
    {
      title: "Press the caps onto the screw heads",
      detail: "Stand it up and press a cap (D) onto every screw head on the outside: two on each side, four on the top and four underneath.",
      fix: [
        ...SX.map((sx) => fx(CAP, zA.map((z): Vec3 => [sx * (W / 2), yS, z]), [-sx, 0, 0], side(sx))),
        fx(CAP, SX.flatMap((sx) => zA.map((z): Vec3 => [sx * xs, H, z])), [0, -1, 0], "E1"),
        fx(CAP, SX.flatMap((sx) => zA.map((z): Vec3 => [sx * xs, 0, z])), [0, 1, 0], "E0"),
      ],
      pose: "+y",
    },
    wallStep(f, "E1", { bracket: "G", screw: "F", wall: "H" }),
  ];
  return { parts, steps };
}

/* ---------- 8 Cube Storage Unit ---------- */

function eightCube(s: ProductSpec): CustomParams {
  const f = frame(s);
  const { W, H, DC, zc, zk, xs, xi, zA, zB, zL } = f;
  const cell = (H - 5 * T) / 4;
  const L = 2 * cell + T; // a half's side panel
  const base = (m: number) => T + m * (L + T); // where half m's sides start
  const shelfY = (m: number) => base(m) + cell + T / 2;
  const yM = base(1) - T / 2; // the middle board
  const z7 = { dowel: [zc - 45, zc + 45], screw: [zc - 85, zc + 85], bolt: [zc - 118, zc + 118] }; // across board 7

  const parts: CustomPart[] = [];
  const part = (id: string, label: string, name: string, size: Vec3, pos: Vec3, material: "board" | "fiber" = "board") => parts.push({ id, label, name, size, pos, material });
  const sideName = ["Left side, first half", "Right side, first half", "Left side, second half", "Right side, second half"];
  part("E0", "5", "End panel", [W, T, DC], [0, T / 2, zc]);
  for (let m = 0; m < 2; m++) {
    const b = base(m);
    part(`S${m}L`, String(2 * m + 1), sideName[2 * m], [T, L, DC], [-xs, b + L / 2, zc]);
    part(`S${m}R`, String(2 * m + 2), sideName[2 * m + 1], [T, L, DC], [xs, b + L / 2, zc]);
    part(`H${m}`, "6", "Middle shelf", [W - 2 * T, T, DC], [0, shelfY(m), zc]);
    part(`V${m}a`, "8", "Divider", [T, cell, DC], [0, b + cell / 2, zc]);
    part(`V${m}b`, "8", "Divider", [T, cell, DC], [0, b + cell + T + cell / 2, zc]);
  }
  part("M", "7", "Middle board", [W, T, DC], [0, yM, zc]);
  part("E1", "5", "End panel", [W, T, DC], [0, H - T / 2, zc]);
  // backs: one per row of two cubes, all the same size, each edge landing on a board
  const cuts = Array.from({ length: 5 }, (_, r) => (r * H) / 4);
  for (let r = 0; r < 4; r++) part(`K${r}`, "9", "Back panel", [W, cuts[r + 1] - cuts[r], BACK], [0, (cuts[r] + cuts[r + 1]) / 2, zk], "fiber");
  const side = (m: number, sx: number) => `S${m}${sx < 0 ? "L" : "R"}`;

  // the second half is built beside the first, then slides onto board 7
  const AWAY: Vec3 = [W * 0.75, 0, 0];
  const second = ["H1", "V1a", "V1b", "S1L", "S1R", "E1"];
  const away = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, AWAY]));

  const longDowels = (m: number) => fx(LONG, zL.map((z): Vec3 => [0, shelfY(m) + T / 2, z]), [0, 1, 0], `V${m}b`, `H${m}`);
  const shelfDowels = (m: number) => SX.map((sx) => fx(DOWEL, zB.map((z): Vec3 => [sx * xi, shelfY(m), z]), [-sx, 0, 0], `H${m}`, side(m, sx)));
  const sideScrews = (m: number) => SX.map((sx) => fx(SCREW, zA.map((z): Vec3 => [sx * (W / 2), shelfY(m), z]), [-sx, 0, 0], side(m, sx), `H${m}`));
  // an end panel on a half: two dowels in each side's edge and the divider's, two screws through it into each side
  const endPanel = (m: number, y: number, dir: 1 | -1, panel: string, divider: string): CustomFix[] => [
    ...SX.map((sx) => fx(DOWEL, zB.map((z): Vec3 => [sx * xs, y, z]), [0, -dir, 0], side(m, sx), panel)),
    fx(DOWEL, zB.map((z): Vec3 => [0, y, z]), [0, -dir, 0], divider, panel),
    ...SX.map((sx) => fx(SCREW, zA.map((z): Vec3 => [sx * xs, y + dir * T, z]), [0, -dir, 0], panel, side(m, sx))),
  ];

  // nails: each back into the sides and the divider behind it, and along the boards at its edges
  const nails: CustomFix[] = [];
  for (let r = 0; r < 4; r++) {
    const y0 = cuts[r], y1 = cuts[r + 1], hgt = y1 - y0;
    const z = -f.D / 2;
    const pts: Vec3[] = [];
    for (const x of [-xs, 0, xs]) pts.push([x, y0 + hgt * 0.28, z], [x, y0 + hgt * 0.72, z]);
    for (const y of [y0 + 7, y1 - 7]) pts.push([-W / 3, y, z], [0, y, z], [W / 3, y, z]);
    nails.push(fx(NAIL, pts, [0, 0, 1], `K${r}`));
  }

  const lie = "+z" as const;
  const steps: CustomStep[] = [
    {
      title: "Fit the dividers to both shelves",
      detail: "Do this for both shelves 6: push two long dowels (c) through the holes in the middle so they stick out both faces, then press a divider 8 onto them on each side.",
      add: ["H0", "V0a", "V0b"],
      wait: ["H1", "V1a", "V1b"],
      from: { ...away(["H1", "V1a", "V1b"]), V0a: [0, -300, 0], V0b: [0, 300, 0] },
      fix: [longDowels(0), longDowels(1)],
      pose: lie,
    },
    {
      title: "Fix the sides to both shelves",
      detail: "Two dowels (b) into each end of each shelf. Push sides 1 and 2 onto one shelf and sides 3 and 4 onto the other, then drive two screws (a) through each side into its shelf.",
      add: ["S0L", "S0R"],
      wait: ["S1L", "S1R"],
      from: { ...away(["S1L", "S1R"]), S0L: [-360, 0, 0], S0R: [360, 0, 0] },
      fix: [...shelfDowels(0), ...shelfDowels(1), ...sideScrews(0), ...sideScrews(1)],
      pose: lie,
    },
    {
      title: "Screw an end panel onto the first half",
      detail: "On the half with sides 1 and 2: dowels (b) into the end of both sides and the divider, an end panel 5 pushed on, and two screws (a) through it into each side.",
      add: ["E0"],
      from: { E0: [0, -320, 0] },
      fix: endPanel(0, T, -1, "E0", "V0a"),
      pose: lie,
    },
    {
      title: "Screw the middle board onto its other end",
      detail: "Push two long dowels (c) into the open end of each side and of the divider, press middle board 7 over them so they come through, and drive two screws (a) through it into each side.",
      add: ["M"],
      from: { M: [0, 320, 0] },
      fix: [
        ...SX.map((sx) => fx(LONG, z7.dowel.map((z): Vec3 => [sx * xs, base(1) - T, z]), [0, -1, 0], side(0, sx), "M")),
        fx(LONG, z7.dowel.map((z): Vec3 => [0, base(1) - T, z]), [0, -1, 0], "V0b", "M"),
        ...SX.map((sx) => fx(SCREW, z7.screw.map((z): Vec3 => [sx * xs, base(1), z]), [0, -1, 0], "M", side(0, sx))),
      ],
      pose: lie,
    },
    {
      title: "Screw the other end panel onto the second half",
      detail: "On the half with sides 3 and 4: dowels (b) into the end of both sides and the divider, the other end panel 5 pushed on, two screws (a) into each side.",
      wait: ["E1"],
      from: away(["E1"]),
      fix: endPanel(1, H - T, 1, "E1", "V1b"),
      pose: lie,
    },
    {
      title: "Join the two halves",
      detail: "Turn four cam bolts (d) into the face of the middle board, by hand. Slide the second half onto them and the long dowels, drop a cam lock (e) into each round hole in sides 3 and 4, arrow towards the edge, and turn it until it pulls tight.",
      add: second,
      fix: [
        ...SX.map((sx) => fx(CAM_BOLT, z7.bolt.map((z): Vec3 => [sx * xs, base(1), z]), [0, -1, 0], "M", side(1, sx))),
        ...SX.map((sx) => fx(CAM, z7.bolt.map((z): Vec3 => [sx * xi, base(1) + 25, z]), [sx, 0, 0], side(1, sx))),
      ],
      tools: ["screwdriver"],
      pose: lie,
      check: "square",
    },
    {
      title: "Turn it face down and nail on the backs",
      detail: "Roll it over onto its front on a rug. Lay a back 9 over each row of two cubes, square it to the edges and tap in twelve nails (k) round and across it.",
      add: ["K0", "K1", "K2", "K3"],
      from: Object.fromEntries(["K0", "K1", "K2", "K3"].map((id) => [id, [0, 0, -320] as Vec3])),
      fix: nails,
      pose: "-z",
      warnings: ["floor"],
    },
    {
      title: "Stand it up and cap the screws",
      detail: "Press a cap (j) onto every screw head on the outside: four on each side, four on the top and four underneath.",
      fix: [
        ...[0, 1].flatMap((m) => SX.map((sx) => fx(CAP, zA.map((z): Vec3 => [sx * (W / 2), shelfY(m), z]), [-sx, 0, 0], side(m, sx)))),
        fx(CAP, SX.flatMap((sx) => zA.map((z): Vec3 => [sx * xs, H, z])), [0, -1, 0], "E1"),
        fx(CAP, SX.flatMap((sx) => zA.map((z): Vec3 => [sx * xs, 0, z])), [0, 1, 0], "E0"),
      ],
      pose: "+y",
    },
    wallStep(f, "E1", { bracket: "f", screw: "g", wall: "h, i" }),
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-4-cube-storage-unit") return fourCube(s);
  if (s.slug === "kmart-8-cube-storage-unit") return eightCube(s);
  return null;
}

const family: Family = { names: ["KMART:CUBE STORAGE"], recipe };
export default family;
