import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's Miles line, read from its assembly manuals. Both have sides with a thick rounded front edge, a top with
 * rounded corners and a low plinth set in under the bottom, and both are for two people.
 *
 * Miles 6 Drawer Chest (keycodes 43709106 and 43709267). Built lying on its left side:
 * - three runners and six cam bolts in each side; the left side (2) on the floor, the two front rails (5) and the back
 *   rail (7) of the left column stand on it, then the bottom (6). The lower back panel (9) slides in between them.
 * - the middle panel (3) takes three runners on each face, lies on the rails and is screwed through the bottom; four
 *   double cam bolts and two long dowels through it hold the right column's rails, its back panel slides in, and the
 *   right side (4) goes on top.
 * - a plinth of four boards (10, 11) with corner brackets is screwed to the bottom; stood up, the top back panels (8)
 *   slide in and the top (1) goes on with dowels, cam bolts and cam locks, two wall brackets under it.
 * - each drawer: the front (12 on the left, 13 on the right) face down with five cam bolts, the sides (15, 14) on it,
 *   the bottom (17) slid in, a middle support (18) and the back (16) screwed on, then the runners. Sixteen clips hold
 *   the back panels and the two wall brackets are screwed to the wall.
 *
 * Part numbers are Kmart's own, so the guide reads against the paper. The 3 drawer chest and the bedside table share the
 * line but not this manual, so they keep the kind builders.
 */

const T = 16; // board
const TT = 18; // the top
const FT = 16; // drawer fronts
const LIP = 36; // the sides' rounded front edge
const PH = 50; // plinth

const DOWEL = { kind: "dowel", len: 30, dia: 6 } as const; // A
const CAM_BOLT = { kind: "camScrew", len: 35, dia: 6 } as const; // B
const CAM = { kind: "cam", len: 10, dia: 15 } as const; // C
const SCREW = { kind: "screw", len: 35, dia: 4 } as const; // D
const SMALL = { kind: "screw", len: 12, dia: 3 } as const; // E
const PLINTH_SCREW = { kind: "screw", len: 35, dia: 4, name: "Plinth screw" } as const; // F
const BRACKET_SCREW = { kind: "screw", len: 12, dia: 4 } as const; // G
const CLIP_SCREW = { kind: "screw", len: 15, dia: 3 } as const; // H

type Fx = Omit<CustomFix, "count" | "at"> & { at: Vec3[] };
const fx = (f: Fx): CustomFix => ({ ...f, count: f.at.length });
const SX = [-1, 1] as const;

/** A side: a board with a thick rounded front edge, the edge drawn as a round bar along it. */
function sidePieces(h: number, d: number): PartPiece[] {
  return [
    { shape: "box", size: [T, h, d], pos: [0, 0, 0] },
    { shape: "cyl", size: [LIP, h, LIP], pos: [0, 0, d / 2 - LIP / 2] },
  ];
}
/** A board seen from above, its corners rounded. */
const roundedTop = (w: number, d: number, t: number, r: number): PartPiece => ({
  shape: "slab",
  outline: [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [w / 2, d / 2],
    [-w / 2, d / 2],
  ],
  round: r,
  size: [w, t, d],
  pos: [0, 0, 0],
});

function chest(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xs = W / 2 - LIP / 2, xIn = xs - T / 2; // side boards' centres and inner faces
  const zB = -D / 2, zF = D / 2, zIn = zF - FT; // inner boards stop behind the fronts
  const yS0 = PH, yS1 = H - TT;
  const yBot = PH + T; // top of the bottom
  const colW = xIn - T / 2, colX = (sx: number) => sx * (T / 2 + colW / 2);
  const zInner = (zIn + zB) / 2, dInner = zIn - zB;
  // three fronts in each column, set in between the sides and the middle panel
  const fh = (yS1 - 2 - (PH + 2) - 8) / 3;
  const fy0 = (i: number) => PH + 2 + i * (fh + 4);
  const fw = xIn - LIP / 2 - T / 2 - 4, fx0 = (sx: number) => sx * (T / 2 + 2 + fw / 2);
  // rails: front ones behind the gaps between fronts, the back one half way up
  const yRail5 = (i: number) => fy0(i) - 2 - 25; // i = 1, 2
  const zRail5 = zIn - T / 2;
  const yRail7 = H / 2, zRail7 = zB + 2 + T / 2;
  const zBk = zRail7;
  // drawers
  const bw = colW - 25, dh = 150, dd = 315;
  const dz0 = zIn - dd, dzc = (zIn + dz0) / 2;
  const boxY = (i: number) => fy0(i) + 14;
  const yRun = (i: number) => boxY(i) + 30;
  const zRun = zIn - 8 - 150;
  // plinth
  const Wp = W - 80, zp0 = zB + 30, zp1 = zIn - 24, Dp = zp1 - zp0, zpc = (zp0 + zp1) / 2;

  const parts: CustomPart[] = [];
  const side = (id: string, label: string, name: string, sx: number): CustomPart => ({ id, label, name, size: [T, yS1 - yS0, D], pos: [sx * xs, (yS0 + yS1) / 2, 0], pieces: sidePieces(yS1 - yS0, D) });
  const col = (sx: number) => (sx < 0 ? "L" : "R");
  parts.push(side("S2", "2", "Left side", -1));
  for (const sx of SX) {
    const c = col(sx);
    // the left column's rails go in first, on the left side; the right column's later, on the middle panel
    parts.push(
      { id: `R5${c}1`, label: "5", name: "Front rail", size: [colW, 50, T], pos: [colX(sx), yRail5(1), zRail5] },
      { id: `R5${c}2`, label: "5", name: "Front rail", size: [colW, 50, T], pos: [colX(sx), yRail5(2), zRail5] },
      { id: `R7${c}`, label: "7", name: "Back rail", size: [colW, 60, T], pos: [colX(sx), yRail7, zRail7] },
    );
    if (sx < 0) parts.push({ id: "BOT", label: "6", name: "Bottom", size: [2 * xIn, T, dInner], pos: [0, PH + T / 2, zInner] });
    parts.push({ id: `K9${c}`, label: "9", name: "Lower back panel", size: [colW + 16, yRail7 - 30 - yBot + 10, 3], pos: [colX(sx), (yBot - 5 + yRail7 - 25) / 2, zBk], material: "fiber" });
    if (sx < 0) parts.push({ id: "P3", label: "3", name: "Middle panel", size: [T, yS1 - yBot, dInner], pos: [0, (yBot + yS1) / 2, zInner] });
  }
  parts.push(side("S4", "4", "Right side", 1));
  // plinth: two short ends (10) and two long rails (11)
  parts.push(
    ...SX.map((sx): CustomPart => ({ id: `PL10${col(sx)}`, label: "10", name: "Plinth end", size: [T, PH, Dp], pos: [sx * (Wp / 2 - T / 2), PH / 2, zpc] })),
    ...[zp0 + T / 2, zp1 - T / 2].map((z, k): CustomPart => ({ id: `PL11${k}`, label: "11", name: "Plinth rail", size: [Wp - 2 * T, PH, T], pos: [0, PH / 2, z] })),
  );
  const plinth = ["PL10L", "PL10R", "PL110", "PL111"];
  for (const sx of SX)
    parts.push({ id: `K8${col(sx)}`, label: "8", name: "Upper back panel", size: [colW + 16, yS1 + 5 - (yRail7 + 25), 3], pos: [colX(sx), (yS1 + 5 + yRail7 + 25) / 2, zBk], material: "fiber" });
  parts.push({ id: "TOP", label: "1", name: "Top", size: [W, TT, D], pos: [0, H - TT / 2, 0], pieces: [roundedTop(W, D, TT, 40)] });
  // the drawers, three in each column, bottom one first
  const dr = (sx: number, i: number) => {
    const c = col(sx);
    return { f: `F${c}${i}`, a: `A${c}${i}`, b: `B${c}${i}`, bt: `M${c}${i}`, st: `T${c}${i}`, bk: `K${c}${i}` };
  };
  const dx = (sx: number, k: -1 | 1) => colX(sx) + k * (bw / 2 - T / 2); // drawer sides' centres
  for (const sx of SX)
    for (let i = 0; i < 3; i++) {
      const k = dr(sx, i), y0 = boxY(i), yc = y0 + dh / 2;
      parts.push(
        sx < 0
          ? { id: k.f, label: "12", name: "Left drawer front", size: [fw, fh, FT], pos: [fx0(sx), fy0(i) + fh / 2, zF - FT / 2] }
          : { id: k.f, label: "13", name: "Right drawer front", size: [fw, fh, FT], pos: [fx0(sx), fy0(i) + fh / 2, zF - FT / 2] },
        { id: k.a, label: "15", name: "Left drawer side", size: [T, dh, dd], pos: [dx(sx, -1), yc, dzc] },
        { id: k.b, label: "14", name: "Right drawer side", size: [T, dh, dd], pos: [dx(sx, 1), yc, dzc] },
        { id: k.bt, label: "17", name: "Drawer bottom", size: [bw - 2 * T + 16, 3, dd - 10], pos: [colX(sx), y0 + T + 1.5, dzc + 5], material: "fiber" },
        { id: k.st, label: "18", name: "Drawer support", size: [60, T, dd], pos: [colX(sx), y0 + T / 2, dzc] },
        { id: k.bk, label: "16", name: "Drawer back", size: [bw, dh, T], pos: [colX(sx), yc, dz0 - T / 2] },
      );
    }
  const ids = (sx: number, i: number) => Object.values(dr(sx, i));
  const OUT = 520;
  const outFrom = (list: string[], v: Vec3 = [0, 0, OUT]) => Object.fromEntries(list.map((id) => [id, v]));

  /* ---- fittings ---- */
  const sideId = (sx: number) => (sx < 0 ? "S2" : "S4");
  const rail5 = (sx: number, i: number) => `R5${col(sx)}${i}`;
  const rail7 = (sx: number) => `R7${col(sx)}`;
  const y5Bolt = (i: number) => yRail5(i) + 12, y5Dowel = (i: number) => yRail5(i) - 12;
  const y7 = [yRail7 - 15, yRail7 + 15];
  const zBot = [zInner - 130, zInner + 130], zBotDowel = [zInner - 60, zInner + 60];
  // a side's runners and its six cam bolts
  const runnersOn = (on: string, x: number, into: number, name = "Drawer runner, cabinet part") => fx({ kind: "runner", name, len: 300, dia: 30, at: [0, 1, 2].map((i): Vec3 => [x, yRun(i), zRun]), dir: [into, 0, 0], on });
  const runScrewsOn = (on: string, x: number, into: number, dz: number[]) => fx({ ...SMALL, at: [0, 1, 2].flatMap((i) => dz.map((z): Vec3 => [x, yRun(i), zRun + z])), dir: [into, 0, 0], on });
  const sideBolts = (sx: number) =>
    fx({
      ...CAM_BOLT,
      at: [...[1, 2].map((i): Vec3 => [sx * xIn, y5Bolt(i), zRail5]), ...y7.map((y): Vec3 => [sx * xIn, y, zRail7]), ...zBot.map((z): Vec3 => [sx * xIn, PH + T / 2, z])],
      dir: [sx, 0, 0],
      on: sideId(sx),
    });
  // cam locks in a column's rails, at the end by x
  const railCams = (sx: number, x: number) => [
    ...[1, 2].map((i) => fx({ ...CAM, at: [[x, y5Bolt(i), zIn]], dir: [0, 0, -1], on: rail5(sx, i) })),
    fx({ ...CAM, at: y7.map((y): Vec3 => [x, y, zRail7 + T / 2]), dir: [0, 0, -1], on: rail7(sx) }),
  ];
  const railDowels = (sx: number, x: number, into: number, mate: string) => [1, 2].map((i) => fx({ ...DOWEL, at: [[x, y5Dowel(i), zRail5]], dir: [into, 0, 0], on: rail5(sx, i), mate }));
  const bottomDowels = (sx: number) => fx({ ...DOWEL, at: zBotDowel.map((z): Vec3 => [sx * xIn, PH + T / 2, z]), dir: [-sx, 0, 0], on: "BOT", mate: sideId(sx) });
  const bottomCams = (sx: number) => fx({ ...CAM, at: zBot.map((z): Vec3 => [sx * (xIn - 25), yBot, z]), dir: [0, -1, 0], on: "BOT" });
  // through the middle panel: a double cam bolt for each front rail and two for each back rail, a long dowel for each front rail
  const DOUBLE = { kind: "camScrew", name: "Double cam bolt", len: 50, dia: 6 } as const;
  const midBolts = [
    ...[1, 2].map((i) => fx({ ...DOUBLE, at: [[T / 2, y5Bolt(i), zRail5]], dir: [-1, 0, 0], on: "P3", mate: rail5(-1, i) })),
    fx({ ...DOUBLE, at: y7.map((y): Vec3 => [T / 2, y, zRail7]), dir: [-1, 0, 0], on: "P3", mate: rail7(-1) }),
  ];
  const midDowels = [1, 2].map((i) => fx({ kind: "dowel", len: 60, dia: 6, at: [[T / 2, y5Dowel(i), zRail5]], dir: [-1, 0, 0], on: "P3", mate: rail5(-1, i) }));
  // the top
  const xTop = [-xs, 0, xs], zTopBolt = [-130, 130], zTopDowel = [-60, 60];
  const topBolts = fx({ ...CAM_BOLT, at: xTop.flatMap((x) => zTopBolt.map((z): Vec3 => [x, yS1, z])), dir: [0, 1, 0], on: "TOP" });
  const topDowels = xTop.map((x, k) => fx({ ...DOWEL, at: zTopDowel.map((z): Vec3 => [x, yS1, z]), dir: [0, -1, 0], on: ["S2", "P3", "S4"][k], mate: "TOP" }));
  const topCams = [
    ...SX.map((sx) => fx({ ...CAM, at: zTopBolt.map((z): Vec3 => [sx * xIn, yS1 - 25, z]), dir: [sx, 0, 0], on: sideId(sx) })),
    fx({ ...CAM, at: zTopBolt.map((z): Vec3 => [-T / 2, yS1 - 25, z]), dir: [1, 0, 0], on: "P3" }),
  ];
  const xBr = [-W / 4, W / 4];
  // plinth
  // a corner bracket inside each corner of the plinth, a screw into the end and one into the rail
  const corners = SX.flatMap((sx) => [-1, 1].map((sz) => ({ sx, sz, x: sx * (Wp / 2 - T), z: sz < 0 ? zp0 + T : zp1 - T })));
  const plinthFix = [
    ...SX.map((sx) => fx({ kind: "angle", name: "Corner bracket", len: 24, dia: 20, at: corners.filter((c) => c.sx === sx).map((c): Vec3 => [c.x, PH / 2, c.z]), dir: [sx, 0, 0], on: `PL10${col(sx)}` })),
    ...SX.map((sx) => fx({ ...BRACKET_SCREW, at: corners.filter((c) => c.sx === sx).map((c): Vec3 => [c.x, PH / 2, c.z - c.sz * 24]), dir: [sx, 0, 0], on: `PL10${col(sx)}` })),
    ...[-1, 1].map((sz, k) => fx({ ...BRACKET_SCREW, at: corners.filter((c) => c.sz === sz).map((c): Vec3 => [c.x - c.sx * 24, PH / 2, c.z]), dir: [0, 0, sz], on: `PL11${k}` })),
  ];
  // the drawers
  const dys = (i: number) => [boxY(i) + dh / 2 - 40, boxY(i) + dh / 2 + 40];
  const ySup = (i: number) => boxY(i) + T / 2;
  const drawerFix = (sx: number, i: number) => {
    const k = dr(sx, i), xa = dx(sx, -1), xb = dx(sx, 1), xc = colX(sx);
    return {
      bolts: fx({ ...CAM_BOLT, at: [...[xa, xb].flatMap((x) => dys(i).map((y): Vec3 => [x, y, zIn])), [xc - 15, ySup(i), zIn]], dir: [0, 0, 1], on: k.f }),
      sideCams: [
        fx({ ...CAM, at: dys(i).map((y): Vec3 => [xa + T / 2, y, zIn - 25]), dir: [-1, 0, 0], on: k.a }),
        fx({ ...CAM, at: dys(i).map((y): Vec3 => [xb - T / 2, y, zIn - 25]), dir: [1, 0, 0], on: k.b }),
      ],
      support: [fx({ ...DOWEL, at: [[xc + 15, ySup(i), zIn]], dir: [0, 0, -1], on: k.st, mate: k.f }), fx({ ...CAM, at: [[xc - 15, boxY(i), zIn - 25]], dir: [0, 1, 0], on: k.st })],
      back: fx({ ...SCREW, at: [...[xa, xb].flatMap((x) => dys(i).map((y): Vec3 => [x, y, dz0 - T])), [xc - 15, ySup(i), dz0 - T], [xc + 15, ySup(i), dz0 - T]], dir: [0, 0, 1], on: k.bk }),
      runners: [
        fx({ kind: "runner", name: "Drawer runner, drawer part", len: 300, dia: 30, at: [[xa - T / 2, yRun(i), zRun]], dir: [1, 0, 0], on: k.a }),
        fx({ kind: "runner", name: "Drawer runner, drawer part", len: 300, dia: 30, at: [[xb + T / 2, yRun(i), zRun]], dir: [-1, 0, 0], on: k.b }),
      ],
      runScrews: [
        fx({ ...SMALL, at: [-110, 40, 110].map((z): Vec3 => [xa - T / 2, yRun(i), zRun + z]), dir: [1, 0, 0], on: k.a }),
        fx({ ...SMALL, at: [-110, 40, 110].map((z): Vec3 => [xb + T / 2, yRun(i), zRun + z]), dir: [-1, 0, 0], on: k.b }),
      ],
    };
  };
  const all = (f: ReturnType<typeof drawerFix>) => [f.bolts, ...f.sideCams, ...f.support, f.back, ...f.runners, ...f.runScrews];
  const boxFix = (f: ReturnType<typeof drawerFix>) => [f.bolts, ...f.sideCams, ...f.support, f.back];
  const runFix = (f: ReturnType<typeof drawerFix>) => [...f.runners, ...f.runScrews];
  // back panel clips: at the corners of each back panel, into the sides and the middle panel
  const clipPts = SX.flatMap((sx) =>
    [yBot + 40, yRail7 - 50, yRail7 + 50, yS1 - 40].flatMap((y) => [
      { at: [sx * (xIn - 2), y, zB] as Vec3, on: sideId(sx) },
      { at: [sx * 4, y, zB] as Vec3, on: "P3" },
    ]),
  );
  const clipsOn = (on: string) => clipPts.filter((p) => p.on === on).map((p) => p.at);

  const lie = "+x" as const;
  const t0 = dr(-1, 2); // the left top drawer, built step by step
  const steps: CustomStep[] = [
    {
      title: "Screw the runners and cam bolts into the left side",
      detail: "Lay the left side (2) flat on a rug, inside up. Three runners with four small screws each, wheel end to the front, then six cam bolts.",
      add: ["S2"],
      fix: [runnersOn("S2", -xIn, -1), runScrewsOn("S2", -xIn, -1, [-120, -40, 40, 120]), sideBolts(-1)],
      pose: lie,
      warnings: ["floor"],
    },
    {
      title: "Do the same on the right side",
      detail: "The right side (4) takes the other three runners and six cam bolts. Keep it for later.",
      fix: [runnersOn("S4", xIn, 1), runScrewsOn("S4", xIn, 1, [-120, -40, 40, 120]), sideBolts(1)],
      wait: ["S4"],
      from: { S4: [0, 0, OUT] },
    },
    {
      title: "Stand the left column's rails on the side",
      detail: "Two front rails (5) and a back rail (7). Push their cam locks in, a dowel in the end of each front rail, then press them onto the side's bolts and turn the locks.",
      add: ["R5L1", "R5L2", "R7L"],
      fix: [...railDowels(-1, -xIn, 1, "S2"), ...railCams(-1, -(xIn - 25))],
    },
    { title: "Fit the bottom", detail: "Two dowels and two cam locks at the end of the bottom (6). Stand it on the side at the bottom end and lock it.", add: ["BOT"], fix: [bottomDowels(-1), bottomCams(-1)], people: 2 },
    { title: "Slide in the left lower back panel", detail: "Down between the bottom and the back rail, in their grooves.", add: ["K9L"], from: { K9L: [320, 0, 0] } },
    {
      title: "Screw the runners onto the middle panel",
      detail: "Three on each face of the middle panel (3), two small screws each, wheel ends to the front.",
      fix: [runnersOn("P3", -T / 2, 1), runScrewsOn("P3", -T / 2, 1, [-110, 110]), runnersOn("P3", T / 2, -1), runScrewsOn("P3", T / 2, -1, [-100, 100])],
      wait: ["P3"],
      from: { P3: [0, 0, OUT] },
    },
    {
      title: "Lay the middle panel on the rails",
      detail: "Onto the ends of the left column's rails, then two screws through the bottom into its edge.",
      add: ["P3"],
      fix: [fx({ ...SCREW, at: zBot.map((z): Vec3 => [0, PH, z]), dir: [0, 1, 0], on: "BOT", mate: "P3" })],
      people: 2,
    },
    {
      title: "Lock the rails to the middle panel",
      detail: "Push four double cam bolts and two long dowels through the middle panel into the rails below, then turn the four cam locks in those rails.",
      fix: [...midBolts, ...midDowels, ...railCams(-1, -(T / 2 + 25))],
      people: 2,
    },
    {
      title: "Stand the right column's rails on",
      detail: "Two front rails and a back rail onto the bolts sticking up from the middle panel, then turn their four cam locks. Slide the right lower back panel (9) in behind them.",
      add: ["R5R1", "R5R2", "R7R", "K9R"],
      fix: railCams(1, T / 2 + 25),
      from: { K9R: [320, 0, 0] },
    },
    {
      title: "Lay the right side on",
      detail: "Two dowels in each front rail's end and in the bottom's end. Lower the side onto them and turn its six cam locks.",
      add: ["S4"],
      fix: [...railDowels(1, xIn, -1, "S4"), bottomDowels(1), ...railCams(1, xIn - 25), bottomCams(1)],
      people: 2,
      check: "square",
    },
    {
      title: "Put the plinth together",
      detail: "Two ends (10) and two rails (11) with a corner bracket inside each corner, two screws in each. Stick a felt pad under each corner.",
      fix: [
        ...plinthFix,
        ...SX.map((sx) => fx({ kind: "glide", name: "Felt pad", len: 3, dia: 25, at: [zp0 + 25, zp1 - 25].map((z): Vec3 => [sx * (Wp / 2 - T / 2), 0, z]), dir: [0, 1, 0], on: `PL10${col(sx)}` })),
      ],
      wait: plinth,
      from: outFrom(plinth),
    },
    {
      title: "Screw the plinth to the bottom",
      detail: "Four dowels in the plinth's top edges, press it onto the bottom and drive the twelve screws up through it.",
      add: plinth,
      fix: [
        fx({ ...DOWEL, at: [-300, 300].map((x): Vec3 => [x, PH, zp0 + T / 2]), dir: [0, -1, 0], on: "PL110", mate: "BOT" }),
        fx({ ...DOWEL, at: [-300, 300].map((x): Vec3 => [x, PH, zp1 - T / 2]), dir: [0, -1, 0], on: "PL111", mate: "BOT" }),
        fx({ ...PLINTH_SCREW, at: [-450, -150, 150, 450].map((x): Vec3 => [x, PH - 28, zp0 + T / 2]), dir: [0, 1, 0], on: "PL110", mate: "BOT" }),
        fx({ ...PLINTH_SCREW, at: [-450, -150, 150, 450].map((x): Vec3 => [x, PH - 28, zp1 - T / 2]), dir: [0, 1, 0], on: "PL111", mate: "BOT" }),
        ...SX.map((sx) => fx({ ...PLINTH_SCREW, at: [zpc - 80, zpc + 80].map((z): Vec3 => [sx * (Wp / 2 - T / 2), PH - 28, z]), dir: [0, 1, 0], on: `PL10${col(sx)}`, mate: "BOT" })),
      ],
    },
    {
      title: "Stand it up and prepare the top",
      detail: "Stand the chest up together. Lay the top (1) face down on a rug, turn in its six cam bolts and screw the two wall brackets on at the back edge.",
      fix: [
        topBolts,
        fx({ kind: "angle", name: "Wall bracket", len: 28, dia: 28, at: xBr.map((x): Vec3 => [x, yS1, zB + 14]), dir: [0, 1, 0], on: "TOP" }),
        fx({ kind: "screw", name: "Bracket screw", len: 12, dia: 4, at: xBr.map((x): Vec3 => [x, yS1, zB + 50]), dir: [0, 1, 0], on: "TOP" }),
      ],
      wait: ["TOP"],
      from: { TOP: [0, 0, OUT] },
      pose: "+y",
      people: 2,
    },
    {
      title: "Slide in the upper back panels and fit the top",
      detail: "The two upper back panels (8) go down the grooves onto the back rails. Push two dowels into the top of each side and the middle panel, lower the top on and turn its six cam locks.",
      add: ["K8L", "K8R", "TOP"],
      fix: [...topDowels, ...topCams],
      from: { K8L: [0, 340, 0], K8R: [0, 340, 0] },
    },
    // the left drawers: one step by step, then the other two
    {
      title: "Fix the sides onto a drawer front",
      detail: "Lay a left drawer front (12) face down. Turn in its five cam bolts, stand the two sides (15 and 14) on it and turn their four cam locks.",
      fix: [drawerFix(-1, 2).bolts, ...drawerFix(-1, 2).sideCams],
      wait: [t0.f, t0.a, t0.b],
      from: outFrom([t0.f, t0.a, t0.b]),
    },
    { title: "Slide in the drawer bottom", detail: "Along the grooves in the sides, all the way to the front.", wait: [t0.bt], from: outFrom([t0.bt]) },
    {
      title: "Fit the drawer support and back",
      detail: "Stand the support (18) in the middle on a dowel and turn its cam lock. Lay the back (16) on and drive six screws through it into the sides and the support.",
      fix: [...drawerFix(-1, 2).support, drawerFix(-1, 2).back],
      wait: [t0.st, t0.bk],
      from: outFrom([t0.st, t0.bk]),
    },
    { title: "Screw the runners onto the drawer", detail: "One along the bottom of each side, three small screws each.", fix: runFix(drawerFix(-1, 2)) },
    {
      title: "Build the other two left drawers",
      detail: "The same way, step by step.",
      fix: [0, 1].flatMap((i) => all(drawerFix(-1, i))),
      wait: [0, 1].flatMap((i) => ids(-1, i)),
      from: outFrom([0, 1].flatMap((i) => ids(-1, i))),
      repeat: 2,
    },
    {
      title: "Build the three right drawers",
      detail: "The same way with the right drawer fronts (13): cam bolts, sides, bottom, support and back.",
      fix: [0, 1, 2].flatMap((i) => boxFix(drawerFix(1, i))),
      wait: [0, 1, 2].flatMap((i) => ids(1, i)),
      from: outFrom([0, 1, 2].flatMap((i) => ids(1, i))),
      repeat: 3,
    },
    { title: "Screw the runners onto the right drawers", detail: "Two runners on each, three small screws each.", fix: [0, 1, 2].flatMap((i) => runFix(drawerFix(1, i))), repeat: 3 },
    {
      title: "Slide the drawers in",
      detail: "The 12 fronts on the left, the 13 fronts on the right. Rest each drawer's runners on the ones in the chest and push it home.",
      add: SX.flatMap((sx) => [2, 1, 0].flatMap((i) => ids(sx, i))),
      from: outFrom(
        SX.flatMap((sx) => [0, 1, 2].flatMap((i) => ids(sx, i))),
        [0, 0, 420],
      ),
    },
    {
      title: "Clip the back panels",
      detail: "Sixteen clips round the four back panels, each with a small screw into the side or the middle panel behind it.",
      fix: [
        ...["S2", "P3", "S4"].map((on) => fx({ kind: "clamp", name: "Back panel clip", len: 16, dia: 12, at: clipsOn(on), dir: [0, 0, 1], on })),
        ...["S2", "P3", "S4"].map((on) => fx({ ...CLIP_SCREW, at: clipsOn(on), dir: [0, 0, 1], on })),
      ],
    },
    {
      title: "Fix it to the wall",
      detail: "Mark through the two brackets, drill and plug the wall, then screw the brackets to it with the screws from the box. Check the wall for pipes and cables first.",
      fix: [
        fx({ kind: "plug", len: 30, dia: 6, included: true, at: xBr.map((x): Vec3 => [x, yS1 - 14, zB - 1]), dir: [0, 0, -1] }),
        fx({ kind: "screw", name: "Wall screw", len: 40, dia: 4, included: true, at: xBr.map((x): Vec3 => [x, yS1 - 14, zB + 32]), dir: [0, 0, -1] }),
      ],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

/** Points round an arc seen from above (angles from +x towards +z), both ends included. */
function arcXZ(cx: number, cz: number, r: number, a0: number, a1: number, n = 8): [number, number][] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + r * Math.cos(a), cz + r * Math.sin(a)] as [number, number];
  });
}

/** A part cut to an outline seen from above ([x, z] points in the finished unit), standing from y0 to y1. */
function planPart(id: string, label: string, name: string, outline: [number, number][], y0: number, y1: number, round = 0, rot?: Vec3): CustomPart {
  const xs = outline.map((p) => p[0]), zs = outline.map((p) => p[1]);
  const lo = [Math.min(...xs), Math.min(...zs)], hi = [Math.max(...xs), Math.max(...zs)];
  const c = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2];
  const size: Vec3 = [hi[0] - lo[0], y1 - y0, hi[1] - lo[1]];
  const piece: PartPiece = { shape: "slab", outline: outline.map(([x, z]) => [x - c[0], z - c[1]] as [number, number]), round, size, pos: [0, 0, 0] };
  return { id, label, name, size, pos: [c[0], (y0 + y1) / 2, c[1]], pieces: [piece], ...(rot ? { rot } : {}) };
}

/**
 * Miles Entertainment Unit (keycodes 43709281 and 43709137): a long low cupboard whose ends are rounded, the back
 * corners by the curved end panels (2, 4) and the front corners by two curved doors (10, 13), with two flat doors (11, 12)
 * between two partitions (3, 6). The plinth and the partitions with their shelves are put together first, then the
 * middle shelf (5) joins the partitions and it is turned upside down: the lower back panel (16) slides in, the bottom (9)
 * is screwed on, the end panels are cam-locked to it and screwed to the partitions and shelves, and the plinth is
 * screwed under it. Stood up, the upper back (8) slides in, the doors hang on their hinges, and the top goes on with its
 * two wall brackets.
 */
function tvUnit(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const R = 150; // the rounded ends
  const xp = W / 2 - 290; // partitions
  const zH = -10; // where each curved door meets its end panel, along the end
  const yB = PH, yB1 = PH + T, yT = H - T; // the bottom, the underside of the top
  const yS = (yB1 + yT) / 2; // shelves
  const side = (sx: number) => (sx < 0 ? Math.PI : 0);
  const back = -Math.PI / 2, front = Math.PI / 2;
  const cxE = (sx: number) => sx * (W / 2 - R);
  const endPanel = (sx: number): [number, number][] => [
    [sx * (xp - T / 2), -D / 2],
    ...arcXZ(cxE(sx), -(D / 2 - R), R, back, sx < 0 ? -Math.PI : 0),
    [sx * (W / 2), zH],
    [sx * (W / 2 - T), zH],
    ...arcXZ(cxE(sx), -(D / 2 - R), R - T, sx < 0 ? -Math.PI : 0, back),
    [sx * (xp - T / 2), -D / 2 + T],
  ];
  const curvedDoor = (sx: number): [number, number][] => [
    [sx * (xp + 1), D / 2],
    ...arcXZ(cxE(sx), D / 2 - R, R, front, side(sx)),
    [sx * (W / 2), zH + 2],
    [sx * (W / 2 - FT), zH + 2],
    ...arcXZ(cxE(sx), D / 2 - R, R - FT, side(sx), front),
    [sx * (xp + 1), D / 2 - FT],
  ];
  // an end shelf, the same both ends (the right one turned round): rounded at its outer corners
  const zs = D / 2 - FT - 2, rs = R - FT - 2;
  const endShelf: [number, number][] = [
    [-(xp + T / 2), -zs],
    ...arcXZ(-(W / 2 - R), -(zs - rs), rs, back, -Math.PI),
    ...arcXZ(-(W / 2 - R), zs - rs, rs, Math.PI, front),
    [-(xp + T / 2), zs],
  ];
  const zBk = -D / 2 + T + 4;
  const pw = 2 * (xp - T / 2); // between the partitions
  const Wp = W - 200, zp0 = -D / 2 + 50, zp1 = D / 2 - 70, Dp = zp1 - zp0, zpc = (zp0 + zp1) / 2;
  const doorY0 = PH + 2, doorY1 = yT - 2;

  const s7l = planPart("S7L", "7", "End shelf", endShelf, yS - T / 2, yS + T / 2);
  const parts: CustomPart[] = [
    ...[-1, 1].map((sx): CustomPart => ({ id: `PL14${sx < 0 ? "L" : "R"}`, label: "14", name: "Plinth end", size: [T, PH, Dp], pos: [sx * (Wp / 2 - T / 2), PH / 2, zpc] })),
    ...[zp0 + T / 2, zp1 - T / 2].map((z, k): CustomPart => ({ id: `PL15${k}`, label: "15", name: "Plinth rail", size: [Wp - 2 * T, PH, T], pos: [0, PH / 2, z] })),
    { id: "P3", label: "3", name: "Left partition", size: [T, yT - yB1, D - 2 * T], pos: [-xp, (yB1 + yT) / 2, 0] },
    { id: "P6", label: "6", name: "Right partition", size: [T, yT - yB1, D - 2 * T], pos: [xp, (yB1 + yT) / 2, 0] },
    s7l,
    { ...planPart("S7R", "7", "End shelf", endShelf, yS - T / 2, yS + T / 2), pos: [-s7l.pos[0], yS, -s7l.pos[2]], rot: [0, Math.PI, 0] },
    { id: "S5", label: "5", name: "Middle shelf", size: [pw, T, D - 2 * T - 8], pos: [0, yS, 4] },
    { id: "B16", label: "16", name: "Lower back panel", size: [pw + 12, yS - T / 2 - yB1, 3], pos: [0, (yB1 + yS - T / 2) / 2, zBk], material: "fiber" },
    planPart(
      "B9",
      "9",
      "Bottom",
      [
        [-(W / 2 - T), -D / 2 + T],
        [W / 2 - T, -D / 2 + T],
        [W / 2 - T, D / 2 - FT - 2],
        [-(W / 2 - T), D / 2 - FT - 2],
      ],
      yB,
      yB1,
      R - T - 2,
    ),
    planPart("E2", "2", "Left end panel", endPanel(-1), yB, yT),
    planPart("E4", "4", "Right end panel", endPanel(1), yB, yT),
    { id: "B8", label: "8", name: "Upper back panel", size: [pw + 12, yT - (yS + T / 2), T], pos: [0, (yS + T / 2 + yT) / 2, -D / 2 + T + T / 2] },
    planPart("D10", "10", "Left curved door", curvedDoor(-1), doorY0, doorY1),
    { id: "D11", label: "11", name: "Left door", size: [xp - 2, doorY1 - doorY0, FT], pos: [-xp / 2, (doorY0 + doorY1) / 2, D / 2 - FT / 2] },
    { id: "D12", label: "12", name: "Right door", size: [xp - 2, doorY1 - doorY0, FT], pos: [xp / 2, (doorY0 + doorY1) / 2, D / 2 - FT / 2] },
    planPart("D13", "13", "Right curved door", curvedDoor(1), doorY0, doorY1),
    planPart(
      "TOP",
      "1",
      "Top",
      [
        [-W / 2, -D / 2],
        [W / 2, -D / 2],
        [W / 2, D / 2],
        [-W / 2, D / 2],
      ],
      yT,
      H,
      R,
    ),
  ];
  const plinth = ["PL14L", "PL14R", "PL150", "PL151"];
  const OUT = 520;
  const outFrom = (list: string[], v: Vec3 = [0, 0, OUT]) => Object.fromEntries(list.map((id) => [id, v]));

  /* ---- fittings ---- */
  const part = (sx: number, l: string, r: string) => (sx < 0 ? l : r);
  const SMALL4 = { kind: "screw", len: 12, dia: 4 } as const; // E
  const corners = SX.flatMap((sx) => [-1, 1].map((sz) => ({ sx, sz, x: sx * (Wp / 2 - T), z: sz < 0 ? zp0 + T : zp1 - T })));
  const plinthFix = [
    ...SX.map((sx) => fx({ kind: "angle", name: "Corner bracket", len: 24, dia: 20, at: corners.filter((c) => c.sx === sx).map((c): Vec3 => [c.x, PH / 2, c.z]), dir: [sx, 0, 0], on: part(sx, "PL14L", "PL14R") })),
    ...SX.map((sx) => fx({ ...SMALL4, at: corners.filter((c) => c.sx === sx).map((c): Vec3 => [c.x, PH / 2, c.z - c.sz * 24]), dir: [sx, 0, 0], on: part(sx, "PL14L", "PL14R") })),
    ...[-1, 1].map((sz, k) => fx({ ...SMALL4, at: corners.filter((c) => c.sz === sz).map((c): Vec3 => [c.x - c.sx * 24, PH / 2, c.z]), dir: [0, 0, sz], on: `PL15${k}` })),
    ...SX.map((sx) => fx({ kind: "glide", name: "Felt pad", len: 3, dia: 25, at: [zp0 + 25, zp1 - 25].map((z): Vec3 => [sx * (Wp / 2 - T / 2), 0, z]), dir: [0, 1, 0], on: part(sx, "PL14L", "PL14R") })),
    ...[0, 1].map((k) => fx({ kind: "glide", name: "Felt pad", len: 3, dia: 25, at: [[0, 0, k === 0 ? zp0 + T / 2 : zp1 - T / 2]], dir: [0, 1, 0], on: `PL15${k}` })),
  ];
  const partition = (sx: number) => part(sx, "P3", "P6");
  const endShelfId = (sx: number) => part(sx, "S7L", "S7R");
  const endId = (sx: number) => part(sx, "E2", "E4");
  const shelfBolts = SX.map((sx) => fx({ ...CAM_BOLT, at: [-120, 120].map((z): Vec3 => [sx * (xp - T / 2), yS, z]), dir: [sx, 0, 0], on: partition(sx) }));
  const endShelfFix = (sx: number) => [
    fx({ kind: "dowel", len: 60, dia: 6, at: [-70, 70].map((z): Vec3 => [sx * (xp + T / 2), yS, z]), dir: [-sx, 0, 0], on: partition(sx), mate: endShelfId(sx) }),
    fx({ ...SCREW, at: [-150, 150].map((z): Vec3 => [sx * (xp - T / 2), yS, z]), dir: [sx, 0, 0], on: partition(sx), mate: endShelfId(sx) }),
  ];
  const shelfCams = fx({ ...CAM, at: SX.flatMap((sx) => [-120, 120].map((z): Vec3 => [sx * (xp - T / 2 - 25), yS + T / 2, z])), dir: [0, -1, 0], on: "S5" });
  const bottomFix = [
    ...SX.map((sx) => fx({ ...DOWEL, at: [-60, 60].map((z): Vec3 => [sx * xp, yB1, z]), dir: [0, 1, 0], on: partition(sx), mate: "B9" })),
    ...SX.map((sx) => fx({ ...SCREW, at: [-140, 140].map((z): Vec3 => [sx * xp, yB, z]), dir: [0, 1, 0], on: "B9", mate: partition(sx) })),
  ];
  // an end panel meets the bottom along its side and its back
  const xBack = (sx: number) => sx * (xp + 90);
  const endBolts = SX.map((sx) => fx({ ...CAM_BOLT, at: [[sx * (W / 2 - T), yB + T / 2, -30]], dir: [sx, 0, 0], on: endId(sx) }));
  const endBacks = SX.map((sx) => fx({ ...CAM_BOLT, at: [[xBack(sx), yB + T / 2, -D / 2 + T]], dir: [0, 0, -1], on: endId(sx) }));
  const endCams = SX.map((sx) =>
    fx({
      ...CAM,
      at: [
        [sx * (W / 2 - T - 25), yB1, -30],
        [xBack(sx), yB1, -D / 2 + T + 25],
      ],
      dir: [0, -1, 0],
      on: "B9",
    }),
  );
  const endDowels = SX.map((sx) => fx({ ...DOWEL, at: [[xBack(sx) - sx * 60, yB + T / 2, -D / 2 + T]], dir: [0, 0, 1], on: "B9", mate: endId(sx) }));
  const endScrews = SX.flatMap((sx) => [
    fx({ ...SCREW, at: [yB1 + 90, yT - 90].map((y): Vec3 => [sx * xp, y, -D / 2]), dir: [0, 0, 1], on: endId(sx), mate: partition(sx) }),
    fx({ ...SCREW, at: [-45, -18].map((z): Vec3 => [sx * (W / 2), yS, z]), dir: [-sx, 0, 0], on: endId(sx), mate: endShelfId(sx) }),
  ]);
  const shelfBrackets = SX.flatMap((sx) => [
    fx({ kind: "angle", name: "Corner bracket", len: 24, dia: 20, at: [[sx * (W / 2 - T - 12), yS - T / 2, -30]], dir: [0, 1, 0], on: endShelfId(sx) }),
    fx({ ...SMALL4, at: [[sx * (W / 2 - T - 36), yS - T / 2, -30]], dir: [0, 1, 0], on: endShelfId(sx) }),
    fx({ ...SMALL4, at: [[sx * (W / 2 - T), yS - T / 2 - 24, -30]], dir: [sx, 0, 0], on: endId(sx) }),
  ]);
  const plinthScrews = [
    ...[0, 1].map((k) => fx({ ...PLINTH_SCREW, at: [-300, 0, 300].map((x): Vec3 => [x, PH - 28, k === 0 ? zp0 + T / 2 : zp1 - T / 2]), dir: [0, 1, 0], on: `PL15${k}`, mate: "B9" })),
    ...SX.map((sx) => fx({ ...PLINTH_SCREW, at: [zpc - 50, zpc + 50].map((z): Vec3 => [sx * (Wp / 2 - T / 2), PH - 28, z]), dir: [0, 1, 0], on: part(sx, "PL14L", "PL14R"), mate: "B9" })),
    ...[0, 1].map((k) => fx({ ...DOWEL, at: [-150, 150].map((x): Vec3 => [x, PH, k === 0 ? zp0 + T / 2 : zp1 - T / 2]), dir: [0, -1, 0], on: `PL15${k}`, mate: "B9" })),
    ...SX.map((sx) => fx({ ...DOWEL, at: [zp0 + 40, zp1 - 40].map((z): Vec3 => [sx * (Wp / 2 - T / 2), PH, z]), dir: [0, -1, 0], on: part(sx, "PL14L", "PL14R"), mate: "B9" })),
  ];
  // hinges: the flat doors on the partitions, the curved ones on the end panels
  const yHinge = [doorY0 + 80, doorY1 - 80];
  const flatHinges = SX.flatMap((sx) => {
    const door = part(sx, "D11", "D12"), x = sx * (xp - 22);
    return [fx({ kind: "hinge", at: yHinge.map((y): Vec3 => [x, y, D / 2 - FT]), dir: [0, 0, 1], on: door }), fx({ ...SMALL4, at: yHinge.flatMap((y) => [-24, 24].map((dy): Vec3 => [x, y + dy, D / 2 - FT])), dir: [0, 0, 1], on: door })];
  });
  const curvedHinges = SX.flatMap((sx) => {
    const door = part(sx, "D10", "D13"), x = sx * (W / 2 - FT);
    return [
      fx({ kind: "hinge", name: "Cranked hinge", at: yHinge.map((y): Vec3 => [x, y, zH + 28]), dir: [sx, 0, 0], on: door }),
      fx({ ...SMALL4, at: yHinge.flatMap((y) => [-24, 24].map((dy): Vec3 => [x, y + dy, zH + 28])), dir: [sx, 0, 0], on: door }),
    ];
  });
  const hingePlates = SX.flatMap((sx) => [
    fx({ ...SMALL4, at: yHinge.flatMap((y) => [-24, 24].flatMap((dy) => [D / 2 - FT - 48, D / 2 - FT - 22].map((z): Vec3 => [sx * (xp - T / 2), y + dy, z]))), dir: [sx, 0, 0], on: partition(sx) }),
    fx({ ...SMALL4, at: yHinge.flatMap((y) => [-24, 24].flatMap((dy) => [-48, -22].map((z): Vec3 => [sx * (W / 2 - T), y + dy, z]))), dir: [sx, 0, 0], on: endId(sx) }),
  ]);
  // the top: two cam bolts over each end panel, partition and the upper back
  const topPts = SX.flatMap((sx) => [
    { on: endId(sx), bolt: [sx * (W / 2 - T / 2), -45] as const, dowel: [sx * (W / 2 - T / 2), -15] as const, cam: { at: [sx * (W / 2 - T), yT - 25, -45] as Vec3, dir: [sx, 0, 0] as Vec3 } },
    { on: endId(sx), bolt: [xBack(sx), -D / 2 + T / 2] as const, dowel: [xBack(sx) - sx * 50, -D / 2 + T / 2] as const, cam: { at: [xBack(sx), yT - 25, -D / 2 + T] as Vec3, dir: [0, 0, -1] as Vec3 } },
    ...[-120, 120].map((z) => ({ on: partition(sx), bolt: [sx * xp, z] as const, dowel: [sx * xp, z / 2.4] as const, cam: { at: [sx * (xp - T / 2), yT - 25, z] as Vec3, dir: [sx, 0, 0] as Vec3 } })),
  ]);
  const topBolts = fx({ ...CAM_BOLT, at: [...topPts.map((p): Vec3 => [p.bolt[0], yT, p.bolt[1]]), ...[-150, 150].map((x): Vec3 => [x, yT, -D / 2 + T + T / 2])], dir: [0, 1, 0], on: "TOP" });
  const topDowels = ["E2", "P3", "P6", "E4"].map((on) => fx({ ...DOWEL, at: topPts.filter((p) => p.on === on).map((p): Vec3 => [p.dowel[0], yT, p.dowel[1]]), dir: [0, -1, 0], on, mate: "TOP" }));
  const topCams = [
    ...["E2", "P3", "P6", "E4"].flatMap((on) => topPts.filter((p) => p.on === on).map((p) => fx({ ...CAM, at: [p.cam.at], dir: p.cam.dir, on }))),
    fx({ ...CAM, at: [-150, 150].map((x): Vec3 => [x, yT - 25, -D / 2 + 2 * T]), dir: [0, 0, -1], on: "B8" }),
  ];
  const xBr = [-(xp + 110), xp + 110];

  const steps: CustomStep[] = [
    {
      title: "Put the plinth together",
      detail: "Two ends (14) and two rails (15) with a bracket in each inside corner, two screws each. Stick the six felt pads underneath.",
      fix: plinthFix,
      wait: plinth,
      from: outFrom(plinth),
    },
    { title: "Turn the cam bolts into the partitions", detail: "Two into each partition (3 and 6), for the middle shelf.", fix: shelfBolts, wait: ["P3", "P6"], from: outFrom(["P3", "P6"]) },
    { title: "Fix an end shelf to the left partition", detail: "Two long dowels into the partition, push the end shelf (7) onto them and drive two screws through the partition into it.", fix: endShelfFix(-1), wait: ["S7L"], from: outFrom(["S7L"]) },
    { title: "Fix the other end shelf to the right partition", detail: "The same way, on the right partition (6).", fix: endShelfFix(1), wait: ["S7R"], from: outFrom(["S7R"]) },
    {
      title: "Join the partitions with the middle shelf",
      detail: "Stand the partitions up, push the middle shelf (5) onto their cam bolts and turn its four cam locks.",
      add: ["P3", "S7L", "P6", "S7R", "S5"],
      fix: [shelfCams],
      from: { P3: [-300, 0, 0], S7L: [-300, 0, 0], P6: [300, 0, 0], S7R: [300, 0, 0], S5: [0, 260, 0] },
    },
    {
      title: "Slide in the back panel and screw on the bottom",
      detail: "Turn it upside down. Slide the lower back panel (16) down the partitions' grooves to the middle shelf, push four dowels into the partitions, then lay the bottom (9) on and drive four screws through it.",
      add: ["B16", "B9"],
      fix: bottomFix,
      from: { B16: [0, -300, 0], B9: [0, -300, 0] },
      pose: "-y",
    },
    { title: "Turn the cam bolts into the end panels", detail: "Two into the bottom edge of each end panel (2 and 4).", fix: [...endBolts, ...endBacks], wait: ["E2", "E4"], from: { E2: [-OUT, 0, 0], E4: [OUT, 0, 0] } },
    { title: "Fit the end panels", detail: "A dowel at each end of the bottom. Push the end panels on and turn the four cam locks in the bottom.", add: ["E2", "E4"], fix: [...endDowels, ...endCams] },
    { title: "Screw the end panels on", detail: "Four screws through each end panel: two into the back of the partition, two into the end shelf.", fix: endScrews },
    { title: "Fix the shelves to the end panels", detail: "A small bracket under each end shelf, one screw into the shelf and one into the end panel.", fix: shelfBrackets },
    { title: "Screw the plinth to the bottom", detail: "Eight dowels in the plinth's top edges, press it onto the bottom and drive the ten screws up through it.", add: plinth, fix: plinthScrews, from: outFrom(plinth, [0, -300, 0]) },
    { title: "Fit the hinges to the flat doors", detail: "Two straight hinges (M) on each flat door (11 and 12), two screws each. Mind which edge: the doors open away from the middle.", fix: flatHinges, wait: ["D11", "D12"], from: outFrom(["D11", "D12"], [0, 0, -OUT]) },
    { title: "Fit the hinges to the curved doors", detail: "Two cranked hinges (L) inside the back edge of each curved door (10 and 13), two screws each.", fix: curvedHinges, wait: ["D10", "D13"], from: outFrom(["D10", "D13"], [0, 0, -OUT]) },
    {
      title: "Stand it up, slide in the upper back and hang the doors",
      detail: "Stand it the right way up and slide the upper back (8) down onto the middle shelf. Screw each hinge's plate on with four screws, the flat doors to the partitions and the curved doors to the end panels.",
      add: ["B8", "D10", "D11", "D12", "D13"],
      fix: hingePlates,
      from: { B8: [0, 300, 0], ...outFrom(["D10", "D11", "D12", "D13"], [0, 0, 400]) },
      pose: "+y",
    },
    {
      title: "Prepare the top",
      detail: "Lay the top (1) face down on a rug. Turn in its ten cam bolts and screw the two wall brackets on near the back.",
      fix: [
        topBolts,
        fx({ kind: "angle", name: "Wall bracket", len: 28, dia: 28, at: xBr.map((x): Vec3 => [x, yT, -D / 2 + 50]), dir: [0, 1, 0], on: "TOP" }),
        fx({ kind: "screw", name: "Bracket screw", len: 12, dia: 4, at: xBr.map((x): Vec3 => [x, yT, -D / 2 + 76]), dir: [0, 1, 0], on: "TOP" }),
      ],
      wait: ["TOP"],
      from: { TOP: [0, 0, OUT] },
    },
    { title: "Fit the top", detail: "Eight dowels into the top edges of the end panels and partitions, lower the top on and turn the ten cam locks.", add: ["TOP"], fix: [...topDowels, ...topCams], from: { TOP: [0, 300, 0] } },
    {
      title: "Fix it to the wall",
      detail: "Mark through the two brackets, drill and plug the wall, then screw through each bracket with the screws from the box. Check the wall for pipes and cables first.",
      fix: [
        fx({ kind: "plug", len: 30, dia: 6, included: true, at: xBr.map((x): Vec3 => [x, yT - 14, -D / 2 - 1]), dir: [0, 0, -1] }),
        fx({ kind: "screw", name: "Wall screw", len: 40, dia: 4, included: true, at: xBr.map((x): Vec3 => [x, yT - 14, -D / 2 + 22]), dir: [0, 0, -1] }),
      ],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-miles-6-drawer-chest") return chest(s);
  if (s.slug === "kmart-miles-entertainment-unit") return tvUnit(s);
  return null;
}

const family: Family = { names: ["KMART:MILES"], recipe };
export default family;
