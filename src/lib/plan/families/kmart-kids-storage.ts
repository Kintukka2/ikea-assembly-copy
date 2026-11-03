import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's kids storage, read from the assembly manuals. Both go together with cam bolts, cam locks and wooden dowels,
 * built lying down and stood up at the end; the plastic tubs come made and just slide in.
 *
 * - Kids Bookcase with Storage (43517947): two arched end panels (1, 2) with three book pockets above a row of three
 *   tubs. The pockets step forward as they go down: a tall back board (3), then boards 4 and 5, each with a thin
 *   ledge (10) at its foot and a round rail (9) in front, and the shelf (6) with its front lip (12) as the lowest one.
 *   Below that the tubs sit on the bottom (7) behind a plinth (8), with a hardboard back (11). Built on end panel 1:
 *   the boards go on one by one with their dowels and cams, the ledges and back slide into grooves, the rails into
 *   their holes, then panel 2 goes on top. Stood up, four plastic blocks hold the back, and two brackets tie it to
 *   the wall.
 * - Kids Storage Unit with 6 Tubs (White 43109814 and Oak Look 43109838: the two manuals are the same but for the
 *   title): two end panels (B), two dividers (C), a bottom (F) on two plinth rails
 *   (D), six short top rails (E) at the front and back of the three bays and a top (A), with a pair of tub runners
 *   on every face inside a bay. Built on its back: rails onto the dividers, the bottom on, then stood on one end for
 *   the plinths and the first end panel, back on its back for the second, and upright for the top.
 *   Two of its count boxes disagree with their own drawings. Step 5's box says 8 cam locks, but it draws two rails
 *   with two cams each; step 17's box shows a cam lock and says 10, but it draws 8 cam bolts (a) going into the top.
 *   The guide uses 4 and 8, which is what the drawings show and what makes the bag's 48 cam bolts and 48 cam locks
 *   come out right. Its step 20 only shows the finished unit, so the guide has 19 steps.
 *
 * The 3 Tub unit has no manual here, so it keeps the kind builder. Part numbers and letters are Kmart's own.
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

/** An open plastic tub, drawn as its floor and four walls. */
const tub = (w: number, h: number, d: number): PartPiece[] => [
  { shape: "box", size: [w - 20, 3, d - 20], pos: [0, -h / 2 + 1.5, 0] },
  ...[-1, 1].map((s): PartPiece => ({ shape: "box", size: [w, h, 3], pos: [0, 0, s * (d / 2 - 1.5)] })),
  ...[-1, 1].map((s): PartPiece => ({ shape: "box", size: [3, h, d - 6], pos: [s * (w / 2 - 1.5), 0, 0] })),
];

/* ---------- Kids Bookcase with Storage ---------- */

const DOWEL_A = { kind: "dowel", len: 30, dia: 6 } as const; // a
const CAM_B = { kind: "cam", len: 13, dia: 15 } as const; // b
const BOLT_C = { kind: "camScrew", len: 34, dia: 7 } as const; // c
const WALL_D = { kind: "screw", len: 35, dia: 4, name: "Wall screw", included: true } as const; // d
const SCREW_E = { kind: "screw", len: 12, dia: 4, name: "Bracket screw" } as const; // e
const PLUG_F = { kind: "plug", len: 30, dia: 6, included: true } as const; // f
const BRACKET_G = { kind: "angle", len: 50, dia: 15, name: "Wall bracket" } as const; // g
const BLOCK_H = { kind: "cap", len: 2, dia: 22, name: "Corner block" } as const; // h
const SCREW_I = { kind: "screw", len: 14, dia: 3, name: "Block screw" } as const; // i

function bookcase(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const T = 15;
  const xi = W / 2 - T; // inner face of an end panel
  const xs = W / 2 - T / 2;
  const L = W - 2 * T; // everything between the end panels
  const R = 150; // the round at the front of the top
  const zB = -D / 2 + T / 2; // the back board
  // the pockets, top to bottom: each board's foot and top, and how far forward it stands
  const b3 = { y0: 552, y1: H, z: zB };
  const b4 = { y0: 435, y1: 602, z: -43.5 };
  const b5 = { y0: 305, y1: 483, z: 52.5 };
  const y6 = 290; // underside of the shelf
  const lip = { y0: y6, y1: y6 + 65, z: D / 2 - T / 2 };
  const y7 = 75; // underside of the bottom, the plinth's height
  const zBack = -130; // the hardboard back, in grooves this far from the back

  // an end panel with its round at the front of the top: an outline turned up on its edge
  const arc = Array.from({ length: 9 }, (_, i): [number, number] => {
    const t = (i / 8) * (Math.PI / 2);
    return [H / 2 - R + R * Math.sin(t), R * Math.cos(t)];
  });
  const outline: [number, number][] = [[-H / 2, -D / 2], [-H / 2, D / 2], ...arc, [H / 2, -D / 2]];
  const end: PartPiece[] = [{ shape: "slab", outline, size: [H, T, D], pos: [0, 0, 0], rot: [0, 0, Math.PI / 2] }];

  const parts: CustomPart[] = [
    { id: "S1", label: "1", name: "Left end panel", size: [T, H, D], pos: [-xs, H / 2, 0], pieces: end },
    { id: "S2", label: "2", name: "Right end panel", size: [T, H, D], pos: [xs, H / 2, 0], pieces: end },
    { id: "P3", label: "3", name: "Top back board", size: [L, b3.y1 - b3.y0, T], pos: [0, (b3.y0 + b3.y1) / 2, b3.z] },
    { id: "P4", label: "4", name: "Middle book board", size: [L, b4.y1 - b4.y0, T], pos: [0, (b4.y0 + b4.y1) / 2, b4.z] },
    { id: "P5", label: "5", name: "Lower book board", size: [L, b5.y1 - b5.y0, T], pos: [0, (b5.y0 + b5.y1) / 2, b5.z] },
    { id: "P6", label: "6", name: "Shelf", size: [L, T, D - T], pos: [0, y6 + T / 2, -T / 2] },
    { id: "P12", label: "12", name: "Front lip", size: [L, lip.y1 - lip.y0, T], pos: [0, (lip.y0 + lip.y1) / 2, lip.z] },
    { id: "P7", label: "7", name: "Bottom", size: [L, T, D], pos: [0, y7 + T / 2, 0] },
    { id: "P8", label: "8", name: "Plinth", size: [L, y7, T], pos: [0, y7 / 2, D / 2 - T / 2] },
    // the ledges at the foot of boards 3 and 4, reaching into the groove of the board in front
    { id: "L1", label: "10", name: "Ledge", size: [L, 5, 90], pos: [0, b3.y0 - 2.5, -D / 2 + T + 45] },
    { id: "L2", label: "10", name: "Ledge", size: [L, 5, 90], pos: [0, b4.y0 - 2.5, b4.z + T / 2 + 45] },
    { id: "P11", label: "11", name: "Back panel", size: [L, y6 - y7 - T + 10, 3], pos: [0, (y6 + y7 + T) / 2, zBack], material: "fiber" },
  ];
  const rails: [number, number][] = [
    [666, -70],
    [549, 20],
    [418, 110],
  ];
  rails.forEach(([y, z], i) => parts.push({ id: `R${i}`, label: "9", name: "Book rail", size: [L, 18, 18], pos: [0, y, z], shape: "cyl", material: "wood" }));
  const tubX = [-1, 0, 1].map((i) => Math.round((i * L) / 3));
  const tubD = D / 2 - zBack - 22;
  tubX.forEach((x, i) =>
    parts.push({ id: `TB${i}`, label: "13", name: "Tub", size: [180, 180, tubD], pos: [x, y7 + T + 92, D / 2 - 6 - tubD / 2], material: "glass", pieces: tub(180, 180, tubD), extra: true }),
  );

  // where each board meets an end panel: the cam bolts in the panel, dowels in the board's end, cams in its face
  const yz3 = { bolts: [590, 720], dowels: [565, 745] };
  const yz4 = { bolts: [518.5], dowels: [455, 582] };
  const yz5 = { bolts: [394], dowels: [325, 463] };
  const z6 = { bolts: [-90, 60], dowels: [-125, 105] };
  const z7 = { bolts: [-90, 90], dowels: [-125, 125] };
  const y8 = [12, 50];
  const yc6 = y6 + T / 2, yc7 = y7 + T / 2;
  const panelBolts = (sx: -1 | 1, on: string): CustomFix[] => [
    fx(BOLT_C, yz3.bolts.map((y): Vec3 => [sx * xi, y, b3.z]), [sx, 0, 0], on, "P3"),
    fx(BOLT_C, yz4.bolts.map((y): Vec3 => [sx * xi, y, b4.z]), [sx, 0, 0], on, "P4"),
    fx(BOLT_C, yz5.bolts.map((y): Vec3 => [sx * xi, y, b5.z]), [sx, 0, 0], on, "P5"),
    fx(BOLT_C, z6.bolts.map((z): Vec3 => [sx * xi, yc6, z]), [sx, 0, 0], on, "P6"),
    fx(BOLT_C, z7.bolts.map((z): Vec3 => [sx * xi, yc7, z]), [sx, 0, 0], on, "P7"),
    fx(BOLT_C, y8.map((y): Vec3 => [sx * xi, y, D / 2 - T / 2]), [sx, 0, 0], on, "P8"),
  ];
  const ce = (sx: -1 | 1) => sx * (xi - 28); // a cam sits this far in from the board's end
  const cams = {
    P3: (sx: -1 | 1) => fx(CAM_B, yz3.bolts.map((y): Vec3 => [ce(sx), y, -D / 2]), [0, 0, 1], "P3"),
    P4: (sx: -1 | 1) => fx(CAM_B, yz4.bolts.map((y): Vec3 => [ce(sx), y, b4.z - T / 2]), [0, 0, 1], "P4"),
    P5: (sx: -1 | 1) => fx(CAM_B, yz5.bolts.map((y): Vec3 => [ce(sx), y, b5.z - T / 2]), [0, 0, 1], "P5"),
    P6: (sx: -1 | 1) => fx(CAM_B, z6.bolts.map((z): Vec3 => [ce(sx), y6, z]), [0, 1, 0], "P6"),
    P7: (sx: -1 | 1) => fx(CAM_B, z7.bolts.map((z): Vec3 => [ce(sx), y7 + T, z]), [0, -1, 0], "P7"),
    P8: (sx: -1 | 1) => fx(CAM_B, y8.map((y): Vec3 => [ce(sx), y, D / 2 - T]), [0, 0, 1], "P8"),
  };
  const endDowels = (id: string, pts: (sx: -1 | 1) => Vec3[]) => [-1, 1].map((sx) => fx(DOWEL_A, pts(sx as -1 | 1), [-sx, 0, 0], id, sx < 0 ? "S1" : "S2"));
  const lipX = [-L / 4, L / 4].map(Math.round);
  const plinthX = [-L / 4, L / 4].map(Math.round);
  const yBr = H - 40; // the wall brackets, high on the back of each end panel
  const zBr = -D / 2 + 25;
  const blocks = [y7 + T + 30, y6 - 30];
  const up = [400, 0, 0] as Vec3; // lying on end panel 1, "up" is towards panel 2
  const aside = [0, 0, 480] as Vec3; // loose parts wait in front of it

  const steps: CustomStep[] = [
    {
      title: "Screw the cam bolts into end panel 1",
      detail: "Lay end panel 1 flat, holes up, and turn the ten cam bolts into it by hand until only the neck shows.",
      fix: panelBolts(-1, "S1"),
      tools: ["screwdriver"],
      pose: "+x",
    },
    { title: "Push dowels into board 3", detail: "Two into each end.", wait: ["P3"], from: { P3: aside }, fix: endDowels("P3", (sx) => yz3.dowels.map((y): Vec3 => [sx * xi, y, b3.z])), pose: "+x" },
    { title: "Push dowels into board 4", detail: "Two into each end, the same way.", wait: ["P4"], from: { P4: aside }, fix: endDowels("P4", (sx) => yz4.dowels.map((y): Vec3 => [sx * xi, y, b4.z])), pose: "+x" },
    { title: "Push dowels into board 5", detail: "Two into each end.", wait: ["P5"], from: { P5: aside }, fix: endDowels("P5", (sx) => yz5.dowels.map((y): Vec3 => [sx * xi, y, b5.z])), pose: "+x" },
    {
      title: "Fix boards 3, 4 and 5 to the end panel",
      detail: "Push each board down onto its dowels and cam bolts, grooves facing the right way. Drop a cam into each round hole, arrow to the edge, and turn it until it catches. Leave the full tightening for the end.",
      add: ["P5", "P4", "P3"],
      from: { P3: up, P4: up, P5: up },
      fix: [cams.P3(-1), cams.P4(-1), cams.P5(-1)],
      tools: ["screwdriver"],
      pose: "+x",
      warnings: ["loose"],
    },
    { title: "Push dowels into the shelf", detail: "Two into each end of shelf 6.", wait: ["P6"], from: { P6: aside }, fix: endDowels("P6", (sx) => z6.dowels.map((z): Vec3 => [sx * xi, yc6, z])), pose: "+x" },
    {
      title: "Fit dowels and cam bolts into the front lip",
      detail: "Two dowels into each end of lip 12, and two cam bolts into its back face.",
      wait: ["P12"],
      from: { P12: aside },
      fix: [...endDowels("P12", (sx) => [lip.y0 + 15, lip.y1 - 15].map((y): Vec3 => [sx * xi, y, lip.z])), fx(BOLT_C, lipX.map((x): Vec3 => [x, yc6, D / 2 - T]), [0, 0, 1], "P12", "P6")],
      tools: ["screwdriver"],
      pose: "+x",
    },
    {
      title: "Lock the lip onto the shelf",
      detail: "Fit the lip's cam bolts into the front edge of the shelf and lock them with two cams from the top.",
      fix: [fx(CAM_B, lipX.map((x): Vec3 => [x, y6 + T, D / 2 - T - 25]), [0, -1, 0], "P6")],
      tools: ["screwdriver"],
      pose: "+x",
    },
    {
      title: "Fix the shelf to the end panel",
      detail: "Lower the shelf and lip onto the end panel below board 5 and lock it with two cams underneath.",
      add: ["P6", "P12"],
      from: { P6: up, P12: up },
      fix: [cams.P6(-1)],
      tools: ["screwdriver"],
      pose: "+x",
    },
    { title: "Push dowels into the bottom", detail: "Two into each end of panel 7.", wait: ["P7"], from: { P7: aside }, fix: endDowels("P7", (sx) => z7.dowels.map((z): Vec3 => [sx * xi, yc7, z])), pose: "+x" },
    {
      title: "Push two dowels into the plinth",
      detail: "Into the long top edge of plinth 8.",
      wait: ["P8"],
      from: { P8: aside },
      fix: [fx(DOWEL_A, plinthX.map((x): Vec3 => [x, y7, D / 2 - T / 2]), [0, -1, 0], "P8", "P7")],
      pose: "+x",
    },
    {
      title: "Press the plinth onto the bottom",
      detail: "Push the plinth's dowels into the holes under the front edge of the bottom, then lower the pair onto the end panel.",
      add: ["P7", "P8"],
      from: { P7: up, P8: up },
      pose: "+x",
    },
    {
      title: "Lock the bottom and plinth to the end panel",
      detail: "Two cams in the bottom and two in the back of the plinth, each turned until it catches.",
      fix: [cams.P7(-1), cams.P8(-1)],
      tools: ["screwdriver"],
      pose: "+x",
    },
    {
      title: "Slide in the back and the ledges",
      detail: "Slide the hardboard back 11 down the grooves between the shelf and the bottom, and a ledge 10 into the groove at the foot of boards 3 and 4.",
      add: ["P11", "L1", "L2"],
      from: { P11: up, L1: up, L2: up },
      pose: "+x",
    },
    { title: "Screw the cam bolts into end panel 2", detail: "Ten, the same as panel 1.", wait: ["S2"], from: { S2: [0, 0, 560] }, fix: panelBolts(1, "S2"), tools: ["screwdriver"], pose: "+x" },
    {
      title: "Push in the book rails",
      detail: "Push the three round rails into their holes in end panel 1, one in front of each book board.",
      add: ["R0", "R1", "R2"],
      from: { R0: up, R1: up, R2: up },
      pose: "+x",
    },
    {
      title: "Fix end panel 2 on top",
      detail: "Lower panel 2 onto all the dowels, cam bolts and rail ends at once, then lock its ten cams.",
      add: ["S2"],
      from: { S2: up },
      fix: [cams.P3(1), cams.P4(1), cams.P5(1), cams.P6(1), cams.P7(1), cams.P8(1)],
      tools: ["screwdriver"],
      pose: "+x",
    },
    {
      title: "Stand it up and fit the corner blocks",
      detail: "Stand it on its plinth and turn it to see the back. Screw a corner block into each corner behind the hardboard back, two on each side.",
      fix: [-1, 1].flatMap((sx) => [fx(BLOCK_H, blocks.map((y): Vec3 => [sx * xi, y, zBack - 12]), [sx, 0, 0], sx < 0 ? "S1" : "S2"), fx(SCREW_I, blocks.map((y): Vec3 => [sx * xi, y, zBack - 12]), [sx, 0, 0], sx < 0 ? "S1" : "S2")]),
      tools: ["screwdriver"],
      pose: "+y",
    },
    {
      title: "Fit the wall brackets and slide in the tubs",
      detail: "Screw a bracket onto the outside of each end panel at the top of the back edge, its tab flush with the back. Then slide the three tubs in under the shelf.",
      add: ["TB0", "TB1", "TB2"],
      from: { TB0: [0, 0, 380], TB1: [0, 0, 380], TB2: [0, 0, 380] },
      fix: [-1, 1].flatMap((sx) => [fx(BRACKET_G, [[sx * (W / 2), yBr, zBr]], [-sx, 0, 0], sx < 0 ? "S1" : "S2"), fx(SCREW_E, [[sx * (W / 2), yBr, zBr + 23]], [-sx, 0, 0], sx < 0 ? "S1" : "S2")]),
      tools: ["screwdriver"],
    },
    {
      title: "Fix it to the wall",
      detail: "Mark through the two bracket tabs, drill, push in the plugs and screw the tabs to the wall. Check the wall for pipes and cables first, then tighten every cam.",
      fix: [
        fx(PLUG_F, [-1, 1].map((sx): Vec3 => [sx * (W / 2 + 25), yBr, -D / 2 - 30]), [0, 0, -1]),
        ...[-1, 1].map((sx) => fx(WALL_D, [[sx * (W / 2 + 25), yBr, -D / 2 + 2]], [0, 0, -1], sx < 0 ? "S1" : "S2")),
      ],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

/* ---------- Kids Storage Unit with 6 Tubs ---------- */

const BOLT_6A = { kind: "camScrew", len: 35, dia: 6 } as const; // a
const CAM_6B = { kind: "cam", len: 10, dia: 15 } as const; // b
const SCREW_6C = { kind: "screw", len: 12, dia: 3, name: "Runner screw" } as const; // c
const DOWEL_6D = { kind: "dowel", len: 30, dia: 8 } as const; // d
const RUNNER_6E = { kind: "runner", len: 400, dia: 20, name: "Tub runner" } as const; // e

function sixTubs(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const T = 15;
  const xo = W / 2 - T; // inner face of an end panel
  const L = W - 2 * T;
  const bay = (L - 2 * T) / 3;
  const xc = -L / 2 + bay + T / 2; // the left divider (the right one is at -xc)
  const yTop = H - T; // underside of the top
  const PL = 50; // plinth height
  const yF = PL + T; // top of the bottom
  const RH = 80; // top rail height
  const zr = D / 2 - T / 2; // the front and back rails
  const bayX = [-1, 0, 1].map((i) => i * (bay + T));
  const parts: CustomPart[] = [
    { id: "A", label: "A", name: "Top", size: [W, T, D], pos: [0, H - T / 2, 0] },
    { id: "BL", label: "B", name: "End panel", size: [T, yTop, D], pos: [-(W / 2 - T / 2), yTop / 2, 0] },
    { id: "BR", label: "B", name: "End panel", size: [T, yTop, D], pos: [W / 2 - T / 2, yTop / 2, 0] },
    { id: "C1", label: "C", name: "Divider", size: [T, yTop - yF, D], pos: [xc, (yTop + yF) / 2, 0] },
    { id: "C2", label: "C", name: "Divider", size: [T, yTop - yF, D], pos: [-xc, (yTop + yF) / 2, 0] },
    { id: "DF", label: "D", name: "Plinth", size: [L, PL, T], pos: [0, PL / 2, zr] },
    { id: "DB", label: "D", name: "Plinth", size: [L, PL, T], pos: [0, PL / 2, -zr] },
    { id: "F", label: "F", name: "Bottom", size: [L, T, D], pos: [0, PL + T / 2, 0] },
  ];
  bayX.forEach((x, i) => {
    parts.push({ id: `E${i}f`, label: "E", name: "Top rail", size: [bay, RH, T], pos: [x, yTop - RH / 2, zr], material: "board" });
    parts.push({ id: `E${i}b`, label: "E", name: "Top rail", size: [bay, RH, T], pos: [x, yTop - RH / 2, -zr], material: "board" });
  });
  const yRun = [yTop - RH - 22, yTop - RH - 170]; // the two runners in each bay, small tub above, big one below
  const tubW = bay - 14, tubD = D - 50;
  bayX.forEach((x, i) => {
    parts.push({ id: `G${i}`, label: "G", name: "Small tub", size: [tubW, 130, tubD], pos: [x, yRun[0] + 8 - 65, 5], material: "glass", pieces: tub(tubW, 130, tubD), extra: true });
    parts.push({ id: `H${i}`, label: "H", name: "Big tub", size: [tubW, 220, tubD], pos: [x, yRun[1] + 8 - 110, 5], material: "glass", pieces: tub(tubW, 220, tubD), extra: true });
  });

  // the faces that look into a bay, each with its pair of runners
  const panelX: Record<string, number> = { BL: -(W / 2 - T / 2), C1: xc, C2: -xc, BR: W / 2 - T / 2 };
  const faces = (id: string): { x: number; dir: Vec3 }[] => {
    const x = panelX[id];
    if (id === "BL") return [{ x: x + T / 2, dir: [-1, 0, 0] }];
    if (id === "BR") return [{ x: x - T / 2, dir: [1, 0, 0] }];
    return [
      { x: x - T / 2, dir: [1, 0, 0] },
      { x: x + T / 2, dir: [-1, 0, 0] },
    ];
  };
  // a divider's two faces are only 15 mm apart, so their runners and screws sit a little apart along it
  const runners = (ids: string[]): CustomFix[] =>
    ids.flatMap((id) =>
      faces(id).flatMap((f) => {
        const left = f.dir[0] > 0;
        return [
          fx(RUNNER_6E, yRun.map((y): Vec3 => [f.x, y, left ? 12 : -12]), f.dir, id),
          fx(SCREW_6C, yRun.flatMap((y) => (left ? [-150, 150] : [-125, 125]).map((z): Vec3 => [f.x, y, z])), f.dir, id),
        ];
      }),
    );

  // a top rail end on a panel face: two cam bolts in the panel, two cams in the rail's inner face; the bolts on a
  // panel's left face sit lower than those on its right, so the two sets never meet inside the board
  const railY = (face: -1 | 1) => (face < 0 ? [yTop - RH + 14, yTop - RH + 50] : [yTop - RH + 32, yTop - RH + 68]);
  const railBolts = (panel: string, side: -1 | 1, rails: string[]): CustomFix[] =>
    rails.map((r) => {
      const zz = r.endsWith("f") ? zr : -zr;
      return fx(BOLT_6A, railY(side).map((y): Vec3 => [panelX[panel] + side * (T / 2), y, zz]), [-side, 0, 0], panel, r);
    });
  const railCams = (rails: string[], xEnd: number, side: -1 | 1): CustomFix[] =>
    rails.map((r) => {
      const front = r.endsWith("f");
      return fx(CAM_6B, railY(side < 0 ? 1 : -1).map((y): Vec3 => [xEnd - side * 28, y, front ? zr - T / 2 : -zr + T / 2]), [0, 0, front ? 1 : -1], r);
    });
  const C1L = xc - T / 2, C1R = xc + T / 2, C2L = -xc - T / 2, C2R = -xc + T / 2;

  // the bottom: two cam bolts up into each divider, dowels from the dividers; at each end two dowels and two cams
  const fZ = [-60, 60];
  const dividerDowels = (id: string, x: number): CustomFix[] => [
    fx(DOWEL_6D, [-150, 150].map((z): Vec3 => [x, yF, z]), [0, 1, 0], id, "F"),
    fx(DOWEL_6D, [-150, 150].map((z): Vec3 => [x, yTop, z]), [0, -1, 0], id, "A"),
  ];
  const endBolts = (id: "BL" | "BR"): CustomFix[] => {
    const side = id === "BL" ? -1 : 1;
    const x = side * xo;
    return [
      fx(BOLT_6A, railY(side < 0 ? 1 : -1).map((y): Vec3 => [x, y, zr]), [side, 0, 0], id, `E${side < 0 ? 0 : 2}f`),
      fx(BOLT_6A, railY(side < 0 ? 1 : -1).map((y): Vec3 => [x, y, -zr]), [side, 0, 0], id, `E${side < 0 ? 0 : 2}b`),
      fx(BOLT_6A, [12, PL - 12].map((y): Vec3 => [x, y, zr]), [side, 0, 0], id, "DF"),
      fx(BOLT_6A, [12, PL - 12].map((y): Vec3 => [x, y, -zr]), [side, 0, 0], id, "DB"),
      fx(BOLT_6A, [-100, 100].map((z): Vec3 => [x, PL + T / 2, z]), [side, 0, 0], id, "F"),
      fx(DOWEL_6D, [-150, 150].map((z): Vec3 => [panelX[id], yTop, z]), [0, -1, 0], id, "A"),
    ];
  };
  const endCams = (side: -1 | 1): CustomFix[] => {
    const x = side * xo;
    return [
      ...railCams([`E${side < 0 ? 0 : 2}f`, `E${side < 0 ? 0 : 2}b`], x, side),
      fx(CAM_6B, [12, PL - 12].map((y): Vec3 => [x - side * 28, y, zr - T / 2]), [0, 0, 1], "DF"),
      fx(CAM_6B, [12, PL - 12].map((y): Vec3 => [x - side * 28, y, -zr + T / 2]), [0, 0, -1], "DB"),
      fx(CAM_6B, [-100, 100].map((z): Vec3 => [x - side * 28, yF, z]), [0, -1, 0], "F"),
    ];
  };
  const fEndDowels = (side: -1 | 1) => fx(DOWEL_6D, [-170, 170].map((z): Vec3 => [side * xo, PL + T / 2, z]), [-side, 0, 0], "F", side < 0 ? "BL" : "BR");
  const topBolts = ["BL", "C1", "C2", "BR"].map((id) => fx(BOLT_6A, fZ.map((z): Vec3 => [panelX[id], yTop, z]), [0, 1, 0], "A", id));
  const topCams = (["BL", "C1", "C2", "BR"] as const).map((id) => {
    const f = faces(id)[0];
    return fx(CAM_6B, fZ.map((z): Vec3 => [f.x, yTop - 28, z]), f.dir, id);
  });

  const steps: CustomStep[] = [
    {
      title: "Fit cam bolts and dowels into both dividers",
      detail: "Eight cam bolts into the faces of each divider near the top corners and four dowels into its edges. Turn the bolts in by hand until only the neck shows.",
      wait: ["C2"],
      from: { C2: [450, 0, 0] },
      fix: [
        ...railBolts("C1", -1, ["E0f", "E0b"]),
        ...railBolts("C1", 1, ["E1f", "E1b"]),
        ...dividerDowels("C1", xc),
        ...railBolts("C2", -1, ["E1f", "E1b"]),
        ...railBolts("C2", 1, ["E2f", "E2b"]),
        ...dividerDowels("C2", -xc),
      ],
      tools: ["screwdriver"],
      pose: "+z",
    },
    {
      title: "Screw the tub runners onto the dividers",
      detail: "Two runners on each face of both dividers, the lips facing up, each held by two small screws.",
      fix: runners(["C1", "C2"]),
      tools: ["screwdriver"],
      pose: "+z",
    },
    {
      title: "Fix four top rails to the first divider",
      detail: "Push a rail onto the cam bolts on each side of the divider, front and back, smooth sides out. Lock each one with two cams, not fully tight yet.",
      add: ["E0f", "E0b", "E1f", "E1b"],
      fix: [...railCams(["E0f", "E0b"], C1L, 1), ...railCams(["E1f", "E1b"], C1R, -1)],
      tools: ["screwdriver"],
      pose: "+z",
      warnings: ["loose"],
    },
    {
      title: "Fix the second divider on",
      detail: "Push the second divider onto the free ends of the middle rails and lock them with four cams.",
      add: ["C2"],
      fix: railCams(["E1f", "E1b"], C2L, 1),
      tools: ["screwdriver"],
      pose: "+z",
    },
    {
      title: "Fix the last two top rails",
      detail: "Onto the other side of the second divider, smooth sides out, with two cams each.",
      add: ["E2f", "E2b"],
      fix: railCams(["E2f", "E2b"], C2R, -1),
      tools: ["screwdriver"],
      pose: "+z",
    },
    {
      title: "Screw cam bolts into the bottom",
      detail: "Four, into the holes in the top face of the bottom panel F.",
      wait: ["F"],
      from: { F: [0, -450, 0] },
      fix: [fx(BOLT_6A, fZ.map((z): Vec3 => [xc, yF, z]), [0, -1, 0], "F", "C1"), fx(BOLT_6A, fZ.map((z): Vec3 => [-xc, yF, z]), [0, -1, 0], "F", "C2")],
      tools: ["screwdriver"],
      pose: "+z",
    },
    {
      title: "Fix the bottom to the dividers",
      detail: "Push the bottom onto the dividers' lower edges and lock its bolts with a cam in each divider.",
      add: ["F"],
      from: { F: [0, -400, 0] },
      fix: [fx(CAM_6B, fZ.map((z): Vec3 => [C1L, yF + 28, z]), [1, 0, 0], "C1"), fx(CAM_6B, fZ.map((z): Vec3 => [C2L, yF + 28, z]), [1, 0, 0], "C2")],
      tools: ["screwdriver"],
      pose: "+z",
    },
    {
      title: "Fit cam bolts and dowels into the end panels",
      detail: "Ten cam bolts into the inside face of each end panel and two dowels into its top edge.",
      wait: ["BL", "BR"],
      from: { BL: [-450, 0, 0], BR: [450, 0, 0] },
      fix: [...endBolts("BL"), ...endBolts("BR")],
      tools: ["screwdriver"],
      pose: "+z",
    },
    {
      title: "Screw the tub runners onto the end panels",
      detail: "Two on the inside face of each end panel, lined up with the ones on the dividers.",
      fix: runners(["BL", "BR"]),
      tools: ["screwdriver"],
      pose: "+z",
    },
    { title: "Stand it on its end", detail: "Turn it a quarter turn so it stands on the left ends of the rails and bottom.", pose: "+x" },
    { title: "Push two dowels into the bottom", detail: "Into the end of the bottom panel that now faces up.", fix: [fEndDowels(1)], pose: "+x" },
    {
      title: "Fit the plinth rails",
      detail: "Push a dowel into the underside of the bottom near each long edge and press a plinth rail onto it, smooth side out.",
      add: ["DF", "DB"],
      from: { DF: [0, -380, 0], DB: [0, -380, 0] },
      fix: [fx(DOWEL_6D, [[0, PL, zr]], [0, 1, 0], "F", "DF"), fx(DOWEL_6D, [[0, PL, -zr]], [0, 1, 0], "F", "DB")],
      pose: "+x",
    },
    {
      title: "Fix the first end panel on top",
      detail: "Lower an end panel onto the bolts and dowels at the top end and lock it with ten cams: in the two rails, the two plinths and the bottom.",
      add: ["BR"],
      from: { BR: [420, 0, 0] },
      fix: endCams(1),
      tools: ["screwdriver"],
      pose: "+x",
    },
    { title: "Lay it on its back", detail: "Turn it another quarter turn so it lies on its back.", pose: "+z" },
    { title: "Push two dowels into the bottom", detail: "Into the open end of the bottom panel.", fix: [fEndDowels(-1)], pose: "+z" },
    {
      title: "Fix the other end panel on",
      detail: "Push the second end panel onto the open end and lock its ten cams the same way.",
      add: ["BL"],
      from: { BL: [-420, 0, 0] },
      fix: endCams(-1),
      tools: ["screwdriver"],
      pose: "+z",
    },
    {
      title: "Screw cam bolts into the top",
      detail: "Eight, into the holes on the underside of the top.",
      wait: ["A"],
      from: { A: [0, 500, 0] },
      fix: topBolts,
      tools: ["screwdriver"],
      pose: "+z",
    },
    {
      title: "Stand it up and fix the top",
      detail: "Stand the unit upright, lower the top onto the dowels and lock it with two cams in each end panel and divider. Now tighten every cam.",
      add: ["A"],
      from: { A: [0, 400, 0] },
      fix: topCams,
      tools: ["screwdriver"],
      pose: "+y",
    },
    {
      title: "Slide in the tubs",
      detail: "Hang a small tub on the top runners and a big one on the lower runners of each bay, and push them in.",
      add: ["G0", "G1", "G2", "H0", "H1", "H2"],
      from: Object.fromEntries(["G0", "G1", "G2", "H0", "H1", "H2"].map((id) => [id, [0, 0, 420] as Vec3])),
    },
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-kids-bookcase-with-storage") return bookcase(s);
  if (s.slug === "kmart-kids-storage-unit-with-6-tubs") return sixTubs(s);
  return null; // the 3 Tub unit has no manual here
}

const family: Family = { names: ["KMART:KIDS STORAGE"], recipe };
export default family;
