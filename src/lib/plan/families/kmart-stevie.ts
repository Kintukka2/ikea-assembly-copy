import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's Stevie 4 Drawer Chest, read from its assembly manual (keycode 43484201). A carcass of 15 mm board on an open
 * base frame, four drawers with fluted fronts and half-moon handles that meet in a circle between each pair:
 *
 * - lying on its left side: runners screwed inside both sides, cam bolts in them, then the two front rails (16) and
 *   the middle panel (5) stand on the left side with dowels and cam locks and the right side goes on top.
 * - the top back panel slides down its grooves from the top end and the top (1) goes on with dowels, cam bolts and cam
 *   locks; the bottom back panel slides in from the other end and the bottom (4) is screwed on with four long screws.
 * - the base frame: two end frames (14) and four rails (12, 13) bolted together, then bolted under the bottom with the
 *   chest upside down, and four felt pads under its feet.
 * - each drawer: sides (8, 9) screwed to the back (10), the bottom (11) slid in, the front (7 or 15) cam-locked on, the
 *   runners and the handle screwed on. Fronts 7 take their handle on the bottom edge, fronts 15 on the top edge, and they
 *   go in from the top as 7, 15, 7, 15.
 * - eight brackets hold the back panels, and two straps on the top fix it to the wall.
 *
 * Part numbers are Kmart's own (1 to 16), so the guide reads against the paper. Kmart's hardware list counts 24 cam
 * bolts (D) and 24 cam locks (E), but its steps use 28 of each (8 + 4 + 16): the guide follows the steps.
 *
 * The Entertainment Unit and the Bedside Table, each from its own manual, are further down. Both stand on a taller
 * frame than the chest's, and their doors and drawer fronts sit inside the openings, flush with the front.
 */

const T = 15; // board
const FT = 18; // drawer fronts
const BH = 110; // base frame height
const TB = 25; // base frame tube
const OUT = 500; // the base frame and the drawers are built this far in front of the chest

const DOWEL = { kind: "dowel", len: 30, dia: 6 } as const; // A
const LONG_SCREW = { kind: "screw", len: 50, dia: 7 } as const; // B
const BOX_SCREW = { kind: "screw", len: 30, dia: 4 } as const; // C
const CAM_BOLT = { kind: "camScrew", len: 35, dia: 6 } as const; // D
const CAM = { kind: "cam", len: 10, dia: 12 } as const; // E
const HANDLE_SCREW = { kind: "screw", len: 25, dia: 4 } as const; // F
const FRAME_BOLT = { kind: "bolt", len: 12, dia: 6 } as const; // G
const BASE_BOLT = { kind: "bolt", len: 25, dia: 6 } as const; // H
const SMALL = { kind: "screw", len: 12, dia: 3 } as const; // N
const WASHER = { kind: "washer", len: 1.5, dia: 12 } as const; // S

type Fx = Omit<CustomFix, "count" | "at"> & { at: Vec3[] };
const fx = (f: Fx): CustomFix => ({ ...f, count: f.at.length });
const SX = [-1, 1] as const;

function chest(s: ProductSpec): CustomParams | null {
  if (s.slug !== "kmart-stevie-4-drawer-chest") return null;
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xo = W / 2, xi = W / 2 - T;
  const zB = -D / 2, zF = D / 2 - FT, zc = (zB + zF) / 2, Dc = zF - zB;
  const ys0 = BH + T, ys1 = H - T; // the sides, between the bottom and the top
  const slot = (ys1 - ys0 - 3 * T) / 4;
  const slotBottom = (i: number) => ys0 + i * (slot + T); // drawer 0 at the bottom
  const yRail = [slotBottom(1) - T, slotBottom(3) - T], yMid = slotBottom(2) - T; // undersides of the rails and the middle panel
  const zRail = zF - 30, zBk = zB + 10;
  // base frame
  const xb = W / 2 - 10 - TB / 2, Db = Dc - 20, zbc = zB + 10 + Db / 2, zr = Db / 2 - TB / 2;
  // drawers
  const xd = xi - 12.5, dh = 130, dd = 340, dz0 = zF - dd, dzc = (zF + dz0) / 2;
  const fh = (H - BH - 9) / 4;
  const dy0 = (i: number) => slotBottom(i) + 15;
  const dyc = (i: number) => dy0(i) + dh / 2;
  const fy0 = (i: number) => BH + i * (fh + 3);
  const plainBottom = (i: number) => i % 2 === 1; // fronts 7 (handle on the bottom edge) are the top and third drawers
  const handleY = (i: number) => (plainBottom(i) ? fy0(i) + 30 : fy0(i) + fh - 30);

  const parts: CustomPart[] = [
    { id: "S2", label: "2", name: "Left side", size: [T, ys1 - ys0, Dc], pos: [-xo + T / 2, (ys0 + ys1) / 2, zc] },
    { id: "S3", label: "3", name: "Right side", size: [T, ys1 - ys0, Dc], pos: [xo - T / 2, (ys0 + ys1) / 2, zc] },
    { id: "RA", label: "16", name: "Front rail", size: [2 * xi, T, 60], pos: [0, yRail[0] + T / 2, zRail] },
    { id: "P5", label: "5", name: "Middle panel", size: [2 * xi, T, Dc], pos: [0, yMid + T / 2, zc] },
    { id: "RB", label: "16", name: "Front rail", size: [2 * xi, T, 60], pos: [0, yRail[1] + T / 2, zRail] },
    { id: "BKU", label: "6", name: "Back panel", size: [2 * xi + 16, ys1 - (yMid + T), 3], pos: [0, (yMid + T + ys1) / 2, zBk], material: "fiber" },
    { id: "TOP", label: "1", name: "Top", size: [W, T, Dc], pos: [0, H - T / 2, zc] },
    { id: "BKL", label: "6", name: "Back panel", size: [2 * xi + 16, yMid - ys0, 3], pos: [0, (ys0 + yMid) / 2, zBk], material: "fiber" },
    { id: "BOT", label: "4", name: "Bottom", size: [W, T, Dc], pos: [0, BH + T / 2, zc] },
  ];
  // the base: an end frame is a hoop of square tube; two rails along the front and two along the back
  const hoop: PartPiece[] = [
    { shape: "box", size: [TB, TB, Db], pos: [0, BH / 2 - TB / 2, 0] },
    { shape: "box", size: [TB, TB, Db], pos: [0, -BH / 2 + TB / 2, 0] },
    ...[-1, 1].map((sz): PartPiece => ({ shape: "box", size: [TB, BH - 2 * TB, TB], pos: [0, 0, sz * zr] })),
  ];
  const railLen = 2 * (xb - TB / 2);
  const base = { L: "B14L", R: "B14R", TF: "B13F", TK: "B13B", BF: "B12F", BK: "B12B" };
  parts.push(
    { id: base.L, label: "14", name: "End frame of the base", size: [TB, BH, Db], pos: [-xb, BH / 2, zbc], material: "metal", pieces: hoop },
    { id: base.R, label: "14", name: "End frame of the base", size: [TB, BH, Db], pos: [xb, BH / 2, zbc], material: "metal", pieces: hoop },
    { id: base.TF, label: "13", name: "Top rail of the base", size: [railLen, TB, TB], pos: [0, BH - TB / 2, zbc + zr], material: "metal" },
    { id: base.TK, label: "13", name: "Top rail of the base", size: [railLen, TB, TB], pos: [0, BH - TB / 2, zbc - zr], material: "metal" },
    { id: base.BF, label: "12", name: "Bottom rail of the base", size: [railLen, TB, TB], pos: [0, TB / 2, zbc + zr], material: "metal" },
    { id: base.BK, label: "12", name: "Bottom rail of the base", size: [railLen, TB, TB], pos: [0, TB / 2, zbc - zr], material: "metal" },
  );
  const baseIds = Object.values(base);
  const dr = (i: number) => ({ l: `L${i}`, r: `R${i}`, bk: `K${i}`, bt: `M${i}`, f: `F${i}` });
  for (let i = 0; i < 4; i++) {
    const k = dr(i);
    parts.push(
      { id: k.l, label: "8", name: "Left drawer side", size: [12, dh, dd], pos: [-xd + 6, dyc(i), dzc] },
      { id: k.r, label: "9", name: "Right drawer side", size: [12, dh, dd], pos: [xd - 6, dyc(i), dzc] },
      { id: k.bk, label: "10", name: "Drawer back", size: [2 * xd - 24, dh, 12], pos: [0, dyc(i), dz0 + 6] },
      { id: k.bt, label: "11", name: "Drawer bottom", size: [2 * xd - 14, 3, dd - 16], pos: [0, dy0(i) + 10, dzc + 2], material: "fiber" },
      plainBottom(i)
        ? { id: k.f, label: "7", name: "Drawer front, handle below", size: [W - 2, fh, FT], pos: [0, fy0(i) + fh / 2, zF + FT / 2] }
        : { id: k.f, label: "15", name: "Drawer front, handle above", size: [W - 2, fh, FT], pos: [0, fy0(i) + fh / 2, zF + FT / 2] },
    );
  }
  const ids = (i: number) => Object.values(dr(i));
  const outFrom = (list: string[], v: Vec3 = [0, 0, OUT]) => Object.fromEntries(list.map((id) => [id, v]));

  /* ---- fittings ---- */
  const side = (sx: number) => (sx < 0 ? "S2" : "S3");
  const zRun = zF - 175;
  const cabRunners = SX.map((sx) => fx({ kind: "runner", name: "Drawer runner, cabinet part", len: 350, dia: 30, at: [0, 1, 2, 3].map((i): Vec3 => [sx * xi, dy0(i) + 12, zRun]), dir: [sx, 0, 0], on: side(sx) }));
  const cabRunScrews = SX.map((sx) => fx({ ...SMALL, at: [0, 1, 2, 3].flatMap((i) => [-150, -60, 60, 150].map((dz): Vec3 => [sx * xi, dy0(i) + 12, zRun + dz])), dir: [sx, 0, 0], on: side(sx) }));
  const zMidBolt = [zc - 140, zc + 140], zMidDowel = [zc - 60, zc + 60];
  const sideBolts = SX.map((sx) =>
    fx({ ...CAM_BOLT, at: [[sx * xi, yRail[0] + T / 2, zRail + 15], ...zMidBolt.map((z): Vec3 => [sx * xi, yMid + T / 2, z]), [sx * xi, yRail[1] + T / 2, zRail + 15]], dir: [sx, 0, 0], on: side(sx) }),
  );
  const innerDowels = SX.flatMap((sx) => [
    fx({ ...DOWEL, at: [[sx * xi, yRail[0] + T / 2, zRail - 17]], dir: [-sx, 0, 0], on: "RA", mate: side(sx) }),
    fx({ ...DOWEL, at: zMidDowel.map((z): Vec3 => [sx * xi, yMid + T / 2, z]), dir: [-sx, 0, 0], on: "P5", mate: side(sx) }),
    fx({ ...DOWEL, at: [[sx * xi, yRail[1] + T / 2, zRail - 17]], dir: [-sx, 0, 0], on: "RB", mate: side(sx) }),
  ]);
  const innerCams = [
    fx({ ...CAM, at: SX.map((sx): Vec3 => [sx * (xi - 25), yRail[0] + T, zRail + 15]), dir: [0, -1, 0], on: "RA" }),
    fx({ ...CAM, at: SX.flatMap((sx) => zMidBolt.map((z): Vec3 => [sx * (xi - 25), yMid + T, z])), dir: [0, -1, 0], on: "P5" }),
    fx({ ...CAM, at: SX.map((sx): Vec3 => [sx * (xi - 25), yRail[1] + T, zRail + 15]), dir: [0, -1, 0], on: "RB" }),
  ];
  const topFix = [
    ...SX.map((sx) => fx({ ...DOWEL, at: zMidDowel.map((z): Vec3 => [sx * (xo - T / 2), ys1, z]), dir: [0, 1, 0], on: "TOP", mate: side(sx) })),
    ...SX.map((sx) => fx({ ...CAM_BOLT, at: zMidBolt.map((z): Vec3 => [sx * (xo - T / 2), ys1, z]), dir: [0, 1, 0], on: "TOP", mate: side(sx) })),
    ...SX.map((sx) => fx({ ...CAM, at: zMidBolt.map((z): Vec3 => [sx * xi, ys1 - 25, z]), dir: [sx, 0, 0], on: side(sx) })),
  ];
  const bottomFix = [
    ...SX.map((sx) => fx({ ...DOWEL, at: zMidDowel.map((z): Vec3 => [sx * (xo - T / 2), ys0, z]), dir: [0, 1, 0], on: side(sx), mate: "BOT" })),
    ...SX.map((sx) => fx({ ...LONG_SCREW, at: zMidBolt.map((z): Vec3 => [sx * (xo - T / 2), BH, z]), dir: [0, 1, 0], on: "BOT", mate: side(sx) })),
  ];
  // two bolts through an end frame's post into each rail end
  const frameBolts = SX.flatMap((sx) =>
    [
      [base.TF, BH - TB / 2, zr],
      [base.TK, BH - TB / 2, -zr],
      [base.BF, TB / 2, zr],
      [base.BK, TB / 2, -zr],
    ].map(([rail, y, z]) => fx({ ...FRAME_BOLT, at: [-6, 6].map((dy): Vec3 => [sx * (xb + TB / 2), (y as number) + dy, zbc + (z as number)]), dir: [-sx, 0, 0], on: sx < 0 ? base.L : base.R, mate: rail as string })),
  );
  const baseBolts = [
    ...[base.TF, base.TK].map((id, k) => fx({ ...BASE_BOLT, at: [-150, 150].map((x): Vec3 => [x, BH - TB, zbc + (k === 0 ? zr : -zr)]), dir: [0, 1, 0], on: id, mate: "BOT" })),
    ...SX.map((sx) => fx({ ...BASE_BOLT, at: [-90, 90].map((z): Vec3 => [sx * xb, BH - TB, zbc + z]), dir: [0, 1, 0], on: sx < 0 ? base.L : base.R, mate: "BOT" })),
  ];
  const pads = SX.map((sx) => fx({ kind: "glide", name: "Felt pad", len: 3, dia: 20, at: [-1, 1].map((sz): Vec3 => [sx * xb, 0, zbc + sz * (Db / 2 - 30)]), dir: [0, 1, 0], on: sx < 0 ? base.L : base.R }));

  const dys = (i: number) => [dyc(i) - 35, dyc(i) + 35];
  const drawerSide = (i: number, sx: number) => (sx < 0 ? dr(i).l : dr(i).r);
  const box = (i: number) => SX.map((sx) => fx({ ...BOX_SCREW, at: dys(i).map((y): Vec3 => [sx * xd, y, dz0 + 6]), dir: [-sx, 0, 0], on: drawerSide(i, sx), mate: dr(i).bk }));
  const frontBolts = (i: number) => fx({ ...CAM_BOLT, at: SX.flatMap((sx) => dys(i).map((y): Vec3 => [sx * (xd - 6), y, zF])), dir: [0, 0, 1], on: dr(i).f });
  const frontCams = (i: number) => SX.map((sx) => fx({ ...CAM, at: dys(i).map((y): Vec3 => [sx * (xd - 12), y, zF - 25]), dir: [sx, 0, 0], on: drawerSide(i, sx) }));
  const runners = (i: number) => SX.map((sx) => fx({ kind: "runner", name: "Drawer runner, drawer part", len: 340, dia: 30, at: [[sx * xd, dy0(i) + 12, dzc]], dir: [-sx, 0, 0], on: drawerSide(i, sx) }));
  const runScrews = (i: number) => SX.map((sx) => fx({ ...SMALL, at: [-140, 40, 140].map((dz): Vec3 => [sx * xd, dy0(i) + 12, dzc + dz]), dir: [-sx, 0, 0], on: drawerSide(i, sx) }));
  const handle = (i: number) => fx({ kind: "handle", name: "Half-moon handle", len: 96, dia: 12, at: [[0, handleY(i), D / 2]], dir: [0, 0, -1], on: dr(i).f });
  const handleScrews = (i: number) => fx({ ...HANDLE_SCREW, at: [-40, 40].map((x): Vec3 => [x, handleY(i), zF]), dir: [0, 0, 1], on: dr(i).f });

  // back panel brackets: at the corners of both back panels, screwed into the sides behind them
  const yBr = [ys1 - 15, yMid + T + 15, yMid - 15, ys0 + 15];
  const xStrap = [-W / 2 + 0.3 * W, W / 2 - 0.3 * W];

  const lie = "+x" as const;
  const top = 3; // the drawer built step by step: the top one
  const others = [0, 1, 2];
  const steps: CustomStep[] = [
    {
      title: "Screw the runners inside the sides",
      detail: "Lay both sides flat, inside up. Four runners on each, wheel end to the front, with four small screws each.",
      add: ["S2"],
      wait: ["S3"],
      from: { S3: [0, 0, OUT] },
      fix: [...cabRunners, ...cabRunScrews],
      pose: lie,
      warnings: ["floor"],
    },
    { title: "Turn the cam bolts into the sides", detail: "Four into each side, next to the runners, until they stop.", fix: sideBolts },
    {
      title: "Fit the rails and the middle panel",
      detail: "Lay the left side on a rug. Push the dowels in, press the cam locks into the two front rails (16) and the middle panel (5), stand them on the side, then lay the right side on top and turn all eight cam locks.",
      add: ["RA", "P5", "RB", "S3"],
      fix: [...innerDowels, ...innerCams],
      check: "square",
    },
    { title: "Slide in the top back panel", detail: "Down the grooves from the top end until it reaches the middle panel.", add: ["BKU"], from: { BKU: [0, 360, 0] } },
    { title: "Fix the top", detail: "Four dowels and four cam bolts in the top (1). Press it onto the sides and turn the four cam locks inside them.", add: ["TOP"], fix: topFix },
    { title: "Slide in the bottom back panel", detail: "Up the grooves from the other end, until it meets the middle panel.", add: ["BKL"], from: { BKL: [0, -360, 0] } },
    { title: "Screw on the bottom", detail: "Push four dowels into the ends of the sides, press the bottom (4) on and drive the four long screws through it.", add: ["BOT"], fix: bottomFix },
    {
      title: "Bolt the base frame together",
      detail: "Two end frames (14), the top rails (13) and the bottom rails (12): two bolts at every corner, done up with the hex key.",
      fix: frameBolts,
      wait: baseIds,
      from: outFrom(baseIds),
      tools: ["allen"],
    },
    {
      title: "Bolt the base onto the bottom",
      detail: "Turn the chest upside down on a rug. Set the frame on the bottom, fix it with eight bolts and stick a felt pad under each corner.",
      add: baseIds,
      fix: [...baseBolts, ...pads],
      tools: ["allen"],
      pose: "-y",
      warnings: ["floor"],
    },
    {
      title: "Screw a drawer box together",
      detail: "Stand the chest up. Two screws through each drawer side (8 and 9) into the ends of the drawer back (10), grooves facing in.",
      fix: box(top),
      wait: [dr(top).l, dr(top).r, dr(top).bk],
      from: outFrom([dr(top).l, dr(top).r, dr(top).bk]),
      pose: "+y",
    },
    { title: "Slide in the drawer bottom", detail: "The bottom (11) goes in from the open front, along the grooves.", wait: [dr(top).bt], from: outFrom([dr(top).bt]) },
    {
      title: "Fix the drawer front",
      detail: "Four cam bolts into the back of a front with a plain bottom edge (7). Push it onto the sides and turn the four cam locks.",
      fix: [frontBolts(top), ...frontCams(top)],
      wait: [dr(top).f],
      from: outFrom([dr(top).f]),
    },
    {
      title: "Build the other three drawers the same way",
      detail: "One more with a front 7, two with a front 15.",
      fix: others.flatMap((i) => [...box(i), frontBolts(i), ...frontCams(i)]),
      wait: others.flatMap(ids),
      from: outFrom(others.flatMap(ids)),
      repeat: 3,
    },
    {
      title: "Screw on the runners and handles",
      detail: "A runner under each side of every drawer, three screws each. Each handle takes two screws from behind: on the bottom edge of fronts 7, on the top edge of fronts 15.",
      fix: [0, 1, 2, 3].flatMap((i) => [...runners(i), ...runScrews(i), handle(i), handleScrews(i)]),
    },
    {
      title: "Slide the drawers in",
      detail: "From the top: 7, 15, 7, 15, so the handles meet in circles. Rest each drawer's runners on the ones in the chest and push it home.",
      add: [3, 2, 1, 0].flatMap(ids),
      from: outFrom([0, 1, 2, 3].flatMap(ids), [0, 0, 420]),
    },
    {
      title: "Fit the back brackets and the wall straps",
      detail: "Eight small brackets hold the back panels at their corners, one screw each. Screw the two straps to the top at the back, a washer under each screw.",
      fix: [
        ...SX.map((sx) => fx({ kind: "clamp", name: "Back panel bracket", len: 16, dia: 12, at: yBr.map((y): Vec3 => [sx * xi, y, zB + 4]), dir: [sx, 0, 0], on: side(sx) })),
        ...SX.map((sx) => fx({ kind: "screw", len: 14, dia: 3, at: yBr.map((y): Vec3 => [sx * xi, y, zB + 4]), dir: [sx, 0, 0], on: side(sx) })),
        fx({ kind: "strap", name: "Wall strap", len: 110, dia: 20, at: xStrap.map((x): Vec3 => [x, H, zB + 30]), dir: [0, -1, 0], on: "TOP" }),
        fx({ ...WASHER, at: xStrap.map((x): Vec3 => [x, H, zB + 60]), dir: [0, -1, 0], on: "TOP" }),
        fx({ ...SMALL, at: xStrap.map((x): Vec3 => [x, H + 1.5, zB + 60]), dir: [0, -1, 0], on: "TOP" }),
      ],
    },
    {
      title: "Fix it to the wall",
      detail: "Mark through the straps, drill and push in the wall plugs from the box, then screw each strap to the wall with a washer. Check the wall for pipes and cables first.",
      fix: [
        fx({ kind: "plug", len: 30, dia: 6, included: true, at: xStrap.map((x): Vec3 => [x, H - 25, zB - 1]), dir: [0, 0, -1] }),
        fx({ ...WASHER, at: xStrap.map((x): Vec3 => [x, H - 25, zB + 23]), dir: [0, 0, -1], on: "TOP" }),
        fx({ kind: "screw", len: 40, dia: 4, name: "Wall screw", included: true, at: xStrap.map((x): Vec3 => [x, H - 25, zB + 23]), dir: [0, 0, -1] }),
      ],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

/* ---------- the entertainment unit and the bedside table ---------- */

const UBH = 130; // their frames: taller than the chest's
const HALF_MOON = { kind: "handle", name: "Half-moon handle", len: 120, dia: 12 } as const;
const BACK_BRACKET = { kind: "clamp", name: "Back panel bracket", len: 16, dia: 12 } as const;
const STRAP = { kind: "strap", name: "Wall strap", len: 110, dia: 20 } as const;
const WALL_PLUG = { kind: "plug", len: 30, dia: 6, included: true } as const;
const WALL_SCREW = { kind: "screw", len: 40, dia: 4, name: "Wall screw", included: true } as const;

/** An end frame of square tube, a hoop like the chest's: two posts joined top and bottom. */
const hoopOf = (h: number, d: number): PartPiece[] => {
  const zr = d / 2 - TB / 2;
  return [
    { shape: "box", size: [TB, TB, d], pos: [0, h / 2 - TB / 2, 0] },
    { shape: "box", size: [TB, TB, d], pos: [0, -h / 2 + TB / 2, 0] },
    ...[-1, 1].map((sz): PartPiece => ({ shape: "box", size: [TB, h - 2 * TB, TB], pos: [0, 0, sz * zr] })),
  ];
};

/**
 * Stevie Entertainment Unit, read from its manual (keycodes 43504404 and 43504398: two printings of one manual, the
 * same parts and steps). A low cupboard of two bays, each behind a pair of fluted doors whose half-moon handles meet
 * in a circle, on a frame of square tube:
 *
 * - upside down on its top (1): dowels and cam bolts go into the top and two door catches are screwed under it; the two
 *   sides (2, 4) and the middle panel (3) stand on it and lock, the two back panels (5) slide down their grooves and the
 *   bottom (6) is screwed on with six long screws.
 * - the frame: two end frames (7), two top rails (8) and two bottom rails (9) are laid out, bolted together, then bolted
 *   onto the bottom through the top rails and the end frames, and four felt pads go under its feet.
 * - the doors (10 hinged on the left, 11 on the right, in the order 10, 11, 10, 11) take two hinges and a handle each
 *   face down, then hang on the sides and the middle panel. Brackets hold the backs, two straps under the top go to the
 *   wall.
 *
 * Kmart's hardware list: 12 dowels (A, 8 x 30), 6 cam bolts (B), 6 cam locks (C), 2 door catches (D), 12 small screws
 * (E, 3 x 14: four for the catches, eight for the back brackets), 6 long screws (F, 7 x 50) driven with the Allen key
 * (G), 16 frame bolts (H, 6 x 12), 10 bolts (I, 6 x 25), 8 hinges (J), 50 small screws (K, 3 x 12: 16 for the hinges,
 * 32 for their plates, 2 for the straps), 4 handles (L) on 8 screws (M, 4 x 25), 2 wall straps (N), 4 washers (O),
 * 2 wall plugs (P), 2 wall screws (Q), 4 felt pads (R) and 8 back panel brackets (S). Every step's count box adds up to
 * that list.
 */
function tvUnit(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const zB = -D / 2, zF = D / 2; // every panel runs the full depth; the doors sit in the openings
  const xo = W / 2, xi = W / 2 - T;
  const ys0 = UBH + T, ys1 = H - T; // the sides and the middle panel stand between the bottom and the top
  const bayW = xi - T / 2, bayX = (T / 2 + xi) / 2; // each bay, and its centre either side of the middle panel
  const ups = [
    { id: "S2", x: -xo + T / 2, cam: { x: -xi, dir: [-1, 0, 0] as Vec3 } },
    { id: "P3", x: 0, cam: { x: -T / 2, dir: [1, 0, 0] as Vec3 } },
    { id: "S4", x: xo - T / 2, cam: { x: xi, dir: [1, 0, 0] as Vec3 } },
  ];
  const zBolt = [-140, 140], zDowel = [-90, 90];
  const parts: CustomPart[] = [
    { id: "TOP", label: "1", name: "Top", size: [W, T, D], pos: [0, H - T / 2, 0] },
    { id: "S2", label: "2", name: "Left side", size: [T, ys1 - ys0, D], pos: [-xo + T / 2, (ys0 + ys1) / 2, 0] },
    { id: "P3", label: "3", name: "Middle panel", size: [T, ys1 - ys0, D], pos: [0, (ys0 + ys1) / 2, 0] },
    { id: "S4", label: "4", name: "Right side", size: [T, ys1 - ys0, D], pos: [xo - T / 2, (ys0 + ys1) / 2, 0] },
    ...SX.map((sx): CustomPart => ({ id: sx < 0 ? "K5L" : "K5R", label: "5", name: "Back panel", size: [bayW + 14, ys1 - ys0, 3], pos: [sx * bayX, (ys0 + ys1) / 2, zB + 10], material: "fiber" })),
    { id: "BOT", label: "6", name: "Bottom", size: [W, T, D], pos: [0, UBH + T / 2, 0] },
  ];
  // the frame: an end frame at each end, a top rail (8) and a bottom rail (9) along the front and the back
  const xb = W / 2 - 10 - TB / 2, Db = D - 20, zr = Db / 2 - TB / 2;
  const railLen = 2 * (xb - TB / 2);
  const base = { L: "B7L", R: "B7R", TF: "B8F", TK: "B8B", BF: "B9F", BK: "B9B" };
  const end = (sx: number) => (sx < 0 ? base.L : base.R);
  parts.push(
    ...SX.map((sx): CustomPart => ({ id: end(sx), label: "7", name: "End frame", size: [TB, UBH, Db], pos: [sx * xb, UBH / 2, 0], material: "metal", pieces: hoopOf(UBH, Db) })),
    { id: base.TF, label: "8", name: "Top rail", size: [railLen, TB, TB], pos: [0, UBH - TB / 2, zr], material: "metal" },
    { id: base.TK, label: "8", name: "Top rail", size: [railLen, TB, TB], pos: [0, UBH - TB / 2, -zr], material: "metal" },
    { id: base.BF, label: "9", name: "Bottom rail", size: [railLen, TB, TB], pos: [0, TB / 2, zr], material: "metal" },
    { id: base.BK, label: "9", name: "Bottom rail", size: [railLen, TB, TB], pos: [0, TB / 2, -zr], material: "metal" },
  );
  const baseIds = Object.values(base);
  // doors: two in each bay with a 2 mm gap round them; 10 hangs on its left edge, 11 on its right
  const dw = (bayW - 6) / 2, dy0 = ys0 + 2, dh = ys1 - ys0 - 4, ymid = dy0 + dh / 2;
  const doors = [
    { id: "D10L", label: "10", x0: -xi + 2, on: "S2", face: -xi, fdir: [-1, 0, 0] as Vec3 },
    { id: "D11L", label: "11", x0: -T / 2 - 2 - dw, on: "P3", face: -T / 2, fdir: [1, 0, 0] as Vec3 },
    { id: "D10R", label: "10", x0: T / 2 + 2, on: "P3", face: T / 2, fdir: [-1, 0, 0] as Vec3 },
    { id: "D11R", label: "11", x0: xi - 2 - dw, on: "S4", face: xi, fdir: [1, 0, 0] as Vec3 },
  ].map((d) => {
    const g = d.label === "10" ? 1 : -1; // from the hinge edge towards the door's middle
    return { ...d, g, hinge: g > 0 ? d.x0 : d.x0 + dw, free: g > 0 ? d.x0 + dw : d.x0 };
  });
  for (const d of doors)
    parts.push({ id: d.id, label: d.label, name: d.g > 0 ? "Door, hinged on the left" : "Door, hinged on the right", size: [dw, dh, FT], pos: [d.x0 + dw / 2, ymid, zF - FT / 2] });
  const doorIds = doors.map((d) => d.id);
  const outFrom = (list: string[], v: Vec3 = [0, 0, OUT]) => Object.fromEntries(list.map((id) => [id, v]));

  /* ---- fittings ---- */
  const DOWEL8 = { kind: "dowel", len: 30, dia: 8 } as const; // A
  const CAM15 = { kind: "cam", len: 10, dia: 15 } as const; // C
  const SCREW14 = { kind: "screw", len: 14, dia: 3 } as const; // E
  const zCatch = zF - FT - 12;
  const frameBolts = SX.flatMap((sx) =>
    [
      [base.TF, UBH - TB / 2, zr],
      [base.TK, UBH - TB / 2, -zr],
      [base.BF, TB / 2, zr],
      [base.BK, TB / 2, -zr],
    ].map(([rail, y, z]) => fx({ ...FRAME_BOLT, at: [-6, 6].map((dy): Vec3 => [sx * (xb + TB / 2), (y as number) + dy, z as number]), dir: [-sx, 0, 0], on: end(sx), mate: rail as string })),
  );
  // hinges 55 mm from the top and bottom of each door, their cups 22 mm in from the hinge edge
  const hy = [dy0 + 55, dy0 + dh - 55];
  const hinge = { kind: "hinge", name: "Hinge", len: 50, dia: 35 } as const;
  const doorFix = (d: (typeof doors)[number]): CustomFix[] => [
    fx({ ...hinge, at: hy.map((y): Vec3 => [d.hinge + d.g * 22, y, zF - FT]), dir: [0, 0, 1], on: d.id, ...(d.g < 0 ? { twist: Math.PI } : {}) }),
    fx({ ...SMALL, at: hy.flatMap((y) => [-12, 12].map((k): Vec3 => [d.hinge + d.g * 46, y + k, zF - FT])), dir: [0, 0, 1], on: d.id }),
    fx({ ...HALF_MOON, at: [[d.free - d.g * 25, ymid, zF]], dir: [0, 0, -1], on: d.id, twist: Math.PI / 2 }),
    fx({ ...HANDLE_SCREW, at: [-35, 35].map((k): Vec3 => [d.free - d.g * 25, ymid + k, zF - FT]), dir: [0, 0, 1], on: d.id }),
  ];
  // hinge plates, four screws each; the right bay's plates on the middle panel sit lower and higher, clear of the left's
  const plateFix = (d: (typeof doors)[number]) => {
    const ks = d.id === "D10R" ? [-40, 40] : [-16, 16];
    return fx({ ...SMALL, at: hy.flatMap((y) => ks.flatMap((k) => [zF - FT - 20, zF - FT - 52].map((z): Vec3 => [d.face, y + k, z]))), dir: d.fdir, on: d.on, mate: d.id });
  };
  // back brackets at the top and bottom of each panel beside a back; on the middle panel's right face, further in
  const brackets = [
    { on: "S2", x: -xi, dir: [-1, 0, 0] as Vec3, ys: [ys1 - 15, ys0 + 15] },
    { on: "P3", x: -T / 2, dir: [1, 0, 0] as Vec3, ys: [ys1 - 15, ys0 + 15] },
    { on: "P3", x: T / 2, dir: [-1, 0, 0] as Vec3, ys: [ys1 - 45, ys0 + 45] },
    { on: "S4", x: xi, dir: [1, 0, 0] as Vec3, ys: [ys1 - 15, ys0 + 15] },
  ];
  const xStrap = [-bayX, bayX];

  const flip = "-y" as const;
  const steps: CustomStep[] = [
    {
      title: "Fit the dowels, cam bolts and door catches to the top",
      detail: "Lay the top (1) face down on a rug. Six dowels (A) and six cam bolts (B), two of each where each side and the middle panel will stand, then screw a door catch (D) near the front of each half with two small screws (E).",
      add: ["TOP"],
      fix: [
        ...ups.map((u) => fx({ ...DOWEL8, at: zDowel.map((z): Vec3 => [u.x, ys1, z]), dir: [0, 1, 0], on: "TOP", mate: u.id })),
        ...ups.map((u) => fx({ ...CAM_BOLT, at: zBolt.map((z): Vec3 => [u.x, ys1, z]), dir: [0, 1, 0], on: "TOP", mate: u.id })),
        fx({ kind: "clip", name: "Door catch", len: 12, dia: 24, at: xStrap.map((x): Vec3 => [x, ys1, zCatch]), dir: [0, 1, 0], on: "TOP" }),
        fx({ ...SCREW14, at: xStrap.flatMap((x) => [-24, 24].map((k): Vec3 => [x + k, ys1, zCatch])), dir: [0, 1, 0], on: "TOP" }),
      ],
      pose: flip,
      warnings: ["floor"],
    },
    {
      title: "Stand the sides and the middle panel on the top",
      detail: "The left side (2), the middle panel (3) and the right side (4) go onto the top's dowels and bolts. Turn the six cam locks (C), two in each.",
      add: ["S2", "P3", "S4"],
      fix: ups.map((u) => fx({ ...CAM15, at: zBolt.map((z): Vec3 => [u.cam.x, ys1 - 25, z]), dir: u.cam.dir, on: u.id })),
      from: outFrom(["S2", "P3", "S4"], [0, -300, 0]),
      pose: flip,
    },
    {
      title: "Slide in the back panels",
      detail: "The two back panels (5) go down the grooves to the top, one in each half. Push two dowels (A) into the free end of each side and of the middle panel.",
      add: ["K5L", "K5R"],
      fix: ups.map((u) => fx({ ...DOWEL8, at: zDowel.map((z): Vec3 => [u.x, ys0, z]), dir: [0, 1, 0], on: u.id, mate: "BOT" })),
      from: outFrom(["K5L", "K5R"], [0, -300, 0]),
      pose: flip,
    },
    {
      title: "Screw on the bottom",
      detail: "Press the bottom (6) onto the dowels and drive six long screws (F) through it, two into each panel, with the Allen key (G).",
      add: ["BOT"],
      fix: ups.map((u) => fx({ ...LONG_SCREW, at: zBolt.map((z): Vec3 => [u.x, UBH, z]), dir: [0, 1, 0], on: "BOT", mate: u.id })),
      tools: ["allen"],
      pose: flip,
    },
    {
      title: "Lay out the frame",
      detail: "Set the two end frames (7) apart and push the ends of the two top rails (8) and the two bottom rails (9) onto their stubs.",
      wait: baseIds,
      from: outFrom(baseIds),
      pose: flip,
    },
    {
      title: "Bolt the frame together",
      detail: "Two bolts (H) through the end frame into each rail end, sixteen in all, done up with the Allen key (G).",
      fix: frameBolts,
      tools: ["allen"],
      pose: flip,
    },
    {
      title: "Bolt the frame onto the bottom",
      detail: "Set the frame on the bottom, its top rails against it, and fix it with ten bolts (I): three through each top rail, two through each end frame. Peel the four felt pads (R) and stick one on each corner of its feet.",
      add: baseIds,
      fix: [
        ...[base.TF, base.TK].map((id, k) => fx({ ...BASE_BOLT, at: [-400, 0, 400].map((x): Vec3 => [x, UBH - TB, k === 0 ? zr : -zr]), dir: [0, 1, 0], on: id, mate: "BOT" })),
        ...SX.map((sx) => fx({ ...BASE_BOLT, at: [-90, 90].map((z): Vec3 => [sx * xb, UBH - TB, z]), dir: [0, 1, 0], on: end(sx), mate: "BOT" })),
        ...SX.map((sx) => fx({ kind: "glide", name: "Felt pad", len: 3, dia: 20, at: [-1, 1].map((sz): Vec3 => [sx * xb, 0, sz * (Db / 2 - 30)]), dir: [0, 1, 0], on: end(sx) })),
      ],
      tools: ["allen"],
      pose: flip,
    },
    {
      title: "Fit the hinges and handles to the doors",
      detail: "Stand the unit on its frame. Lay the four doors face down on a rug: press two hinges (J) into each, two small screws (K) each, and screw a half-moon handle (L) to the other edge with two screws (M) from behind.",
      fix: doors.flatMap(doorFix),
      wait: doorIds,
      from: outFrom(doorIds),
      pose: "+y",
      warnings: ["floor"],
    },
    {
      title: "Hang the doors",
      detail: "From the left: 10, 11, 10, 11, so the handles meet in a circle in each half. Screw each hinge plate to the side or the middle panel with four small screws (K).",
      add: doorIds,
      fix: doors.map(plateFix),
      from: outFrom(doorIds, [0, 0, 400]),
    },
    {
      title: "Fit the back brackets and the wall straps",
      detail: "Eight brackets (S) hold the back panels at their corners, a small screw (E) each. Screw the two wall straps (N) under the top at the back, a washer (O) and a small screw (K) each.",
      fix: [
        ...brackets.map((b) => fx({ ...BACK_BRACKET, at: b.ys.map((y): Vec3 => [b.x, y, zB + 4]), dir: b.dir, on: b.on })),
        ...brackets.map((b) => fx({ ...SCREW14, at: b.ys.map((y): Vec3 => [b.x, y, zB + 4]), dir: b.dir, on: b.on })),
        fx({ ...STRAP, at: xStrap.map((x): Vec3 => [x, ys1, zB + 30]), dir: [0, 1, 0], on: "TOP" }),
        fx({ ...WASHER, at: xStrap.map((x): Vec3 => [x, ys1, zB + 60]), dir: [0, 1, 0], on: "TOP" }),
        fx({ ...SMALL, at: xStrap.map((x): Vec3 => [x, ys1 - 1.5, zB + 60]), dir: [0, 1, 0], on: "TOP" }),
      ],
      wall: false,
    },
    {
      title: "Fix it to the wall",
      detail: "Mark through the straps, drill and push in the wall plugs (P), then screw each strap to the wall with a wall screw (Q) and a washer (O). Check the wall for pipes and cables first.",
      fix: [
        fx({ ...WALL_PLUG, at: xStrap.map((x): Vec3 => [x, ys1 - 40, zB - 1]), dir: [0, 0, -1] }),
        fx({ ...WASHER, at: xStrap.map((x): Vec3 => [x, ys1 - 40, zB]), dir: [0, 0, -1], on: "TOP" }),
        fx({ ...WALL_SCREW, at: xStrap.map((x): Vec3 => [x, ys1 - 40, zB]), dir: [0, 0, -1] }),
      ],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

/**
 * Stevie Bedside Table, read from its manual (keycode 43515028). Two drawers with fluted fronts and half-moon handles
 * that meet in a circle, in a carcass on a frame of two U-shaped end frames and two rails:
 *
 * - the cabinet runners go on both sides (J on the left side 2, K on the right side 3), two cam bolts into each for the
 *   front rail (5); the rail stands on the left side and locks, then the right side goes onto its other end.
 * - on its front edges the top (1) goes on with dowels, cam bolts and cam locks, the back panel (4) slides in from the
 *   open end and the bottom (6) is screwed on with dowels and four long screws.
 * - the frame: two end frames (7) and two rails (8) bolted at each joint, then bolted under the bottom through the plates
 *   on top of its legs, with the table upside down, and a felt pad under each corner.
 * - each drawer: the runners on its sides (L on 11, M on 12), four cam bolts in the front (9 at the top, its handle on its
 *   bottom edge; 10 below, its handle on its top edge), the sides locked onto it, the bottom (14) slid in, the back (13)
 *   screwed over the ends of the sides and the handle screwed on. Brackets hold the back, one strap goes to the wall.
 *
 * Kmart's hardware list: 8 dowels (A), 4 long screws (B, 7 x 50), 8 screws (C, 4 x 30), 16 cam bolts (D), 16 cam locks
 * (E), 4 handle screws (F, 4 x 25), 12 bolts (G, 6 x 12: eight for the frame's joints, four through its plates) and the
 * Allen key (H), 2 handles (I), 2 cabinet runners each way (J, K), 2 drawer runners each way (L, M), 33 small screws
 * (N, 3 x 12), 4 felt pads (O), 4 back panel brackets (P), and the wall kit: a screw (Q), a plug (R), 2 washers (S) and a
 * strap (T). Every step's count box adds up to that list.
 */
function bedside(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xo = W / 2, xi = W / 2 - T;
  const zB = -D / 2, zF = D / 2 - FT; // the fronts sit in the openings, flush with the front
  const ys0 = UBH + T, ys1 = H - T;
  const yRail = ys0 + (ys1 - ys0 - T) / 2, zRail = zF - 30; // the front rail between the drawers: its underside
  const slotBottom = (i: number) => (i === 0 ? ys0 : yRail + T); // drawer 0 is the bottom one
  // drawers
  const xd = xi - 12.5, dh = 130, dd = 250, dz0 = zF - dd, dzc = (zF + dz0) / 2;
  const dy0 = (i: number) => slotBottom(i) + 15;
  const dyc = (i: number) => dy0(i) + dh / 2;
  const fh = (ys1 - ys0 - 7) / 2;
  const fy0 = (i: number) => ys0 + 2 + i * (fh + 3);
  const handleY = (i: number) => (i === 1 ? fy0(1) + 30 : fy0(0) + fh - 30); // they meet at the gap between the fronts
  const side = (sx: number) => (sx < 0 ? "S2" : "S3");

  const parts: CustomPart[] = [
    { id: "S2", label: "2", name: "Left side", size: [T, ys1 - ys0, D], pos: [-xo + T / 2, (ys0 + ys1) / 2, 0] },
    { id: "S3", label: "3", name: "Right side", size: [T, ys1 - ys0, D], pos: [xo - T / 2, (ys0 + ys1) / 2, 0] },
    { id: "P5", label: "5", name: "Front rail", size: [2 * xi, T, 60], pos: [0, yRail + T / 2, zRail] },
    { id: "TOP", label: "1", name: "Top", size: [W, T, D], pos: [0, H - T / 2, 0] },
    { id: "BK4", label: "4", name: "Back panel", size: [2 * xi + 14, ys1 - ys0, 3], pos: [0, (ys0 + ys1) / 2, zB + 10], material: "fiber" },
    { id: "BOT", label: "6", name: "Bottom", size: [W, T, D], pos: [0, UBH + T / 2, 0] },
  ];
  // the frame: a U-shaped end frame at each end (a floor bar, two legs, a plate on top of each leg), a rail front and back
  const xb = W / 2 - 10 - TB / 2, Db = D - 20, zr = Db / 2 - TB / 2;
  const PLATE = 4;
  const uFrame: PartPiece[] = [
    { shape: "box", size: [TB, TB, Db], pos: [0, -UBH / 2 + TB / 2, 0] },
    ...[-1, 1].flatMap((sz): PartPiece[] => [
      { shape: "box", size: [TB, UBH - TB - PLATE, TB], pos: [0, (TB - PLATE) / 2, sz * zr] },
      { shape: "cyl", size: [40, PLATE, 40], pos: [0, UBH / 2 - PLATE / 2, sz * zr] },
    ]),
  ];
  const base = { L: "B7L", R: "B7R", F: "B8F", K: "B8B" };
  const end = (sx: number) => (sx < 0 ? base.L : base.R);
  parts.push(
    ...SX.map((sx): CustomPart => ({ id: end(sx), label: "7", name: "End frame", size: [TB, UBH, Db], pos: [sx * xb, UBH / 2, 0], material: "metal", pieces: uFrame })),
    ...[base.F, base.K].map((id, k): CustomPart => ({ id, label: "8", name: "Rail", size: [2 * (xb - TB / 2), TB, TB], pos: [0, TB / 2, k === 0 ? zr : -zr], material: "metal" })),
  );
  const baseIds = Object.values(base);
  const dr = (i: number) => ({ l: `L${i}`, r: `R${i}`, bt: `M${i}`, f: `F${i}`, bk: `K${i}` });
  for (const i of [0, 1]) {
    const k = dr(i);
    parts.push(
      { id: k.l, label: "11", name: "Left drawer side", size: [12, dh, dd], pos: [-xd + 6, dyc(i), dzc] },
      { id: k.r, label: "12", name: "Right drawer side", size: [12, dh, dd], pos: [xd - 6, dyc(i), dzc] },
      { id: k.bt, label: "14", name: "Drawer bottom", size: [2 * xd - 14, 3, dd - 8], pos: [0, dy0(i) + 10, dzc], material: "fiber" },
      i === 1
        ? { id: k.f, label: "9", name: "Top drawer front", size: [2 * xi - 3, fh, FT], pos: [0, fy0(i) + fh / 2, zF + FT / 2] }
        : { id: k.f, label: "10", name: "Bottom drawer front", size: [2 * xi - 3, fh, FT], pos: [0, fy0(i) + fh / 2, zF + FT / 2] },
      { id: k.bk, label: "13", name: "Drawer back", size: [2 * xd, dh, 12], pos: [0, dyc(i), dz0 - 6] },
    );
  }
  const boxIds = (i: number) => [dr(i).l, dr(i).r, dr(i).bt, dr(i).f];
  const ids = (i: number) => Object.values(dr(i));
  const outFrom = (list: string[], v: Vec3 = [0, 0, OUT]) => Object.fromEntries(list.map((id) => [id, v]));

  /* ---- fittings ---- */
  const zRun = zF - dd / 2;
  const zBolt = [-100, 100], zDowel = [-55, 55];
  const cabRunners = SX.map((sx) => fx({ kind: "runner", name: sx < 0 ? "Cabinet runner, left" : "Cabinet runner, right", len: 250, dia: 30, at: [0, 1].map((i): Vec3 => [sx * xi, dy0(i) + 12, zRun]), dir: [sx, 0, 0], on: side(sx) }));
  const cabRunScrews = SX.map((sx) => fx({ ...SMALL, at: [0, 1].flatMap((i) => [-110, -40, 40, 110].map((dz): Vec3 => [sx * xi, dy0(i) + 12, zRun + dz])), dir: [sx, 0, 0], on: side(sx) }));
  const railCams = (sx: number) => fx({ ...CAM, at: [-15, 15].map((dz): Vec3 => [sx * (xi - 25), yRail + T, zRail + dz]), dir: [0, -1, 0], on: "P5" });
  const dys = (i: number) => [dyc(i) - 35, dyc(i) + 35];
  const drawerSide = (i: number, sx: number) => (sx < 0 ? dr(i).l : dr(i).r);
  const boxFix = (i: number) => [
    ...SX.map((sx) => fx({ kind: "runner", name: sx < 0 ? "Drawer runner, left" : "Drawer runner, right", len: 250, dia: 30, at: [[sx * xd, dy0(i) + 12, dzc]], dir: [-sx, 0, 0], on: drawerSide(i, sx) })),
    ...SX.map((sx) => fx({ ...SMALL, at: [-100, 30, 100].map((dz): Vec3 => [sx * xd, dy0(i) + 12, dzc + dz]), dir: [-sx, 0, 0], on: drawerSide(i, sx) })),
    fx({ ...CAM_BOLT, at: SX.flatMap((sx) => dys(i).map((y): Vec3 => [sx * (xd - 6), y, zF])), dir: [0, 0, 1], on: dr(i).f }),
    ...SX.map((sx) => fx({ ...CAM, at: dys(i).map((y): Vec3 => [sx * (xd - 12), y, zF - 25]), dir: [sx, 0, 0], on: drawerSide(i, sx) })),
  ];
  const backFix = (i: number) => [
    ...SX.map((sx) => fx({ ...BOX_SCREW, at: dys(i).map((y): Vec3 => [sx * (xd - 6), y, dz0 - 12]), dir: [0, 0, 1], on: dr(i).bk, mate: drawerSide(i, sx) })),
    fx({ ...HALF_MOON, at: [[0, handleY(i), zF + FT]], dir: [0, 0, -1], on: dr(i).f }),
    fx({ ...HANDLE_SCREW, at: [-40, 40].map((x): Vec3 => [x, handleY(i), zF]), dir: [0, 0, 1], on: dr(i).f }),
  ];
  const yBr = [ys1 - 15, ys0 + 15];

  const lie = "+x" as const, front = "-z" as const;
  const steps: CustomStep[] = [
    {
      title: "Screw the runners inside the sides",
      detail: "Lay both sides flat, inside up. Two runners on each, wheel end to the front, four small screws (N) each: J on the left side (2), K on the right side (3).",
      add: ["S2"],
      wait: ["S3"],
      from: { S3: [0, 0, OUT] },
      fix: [...cabRunners, ...cabRunScrews],
      pose: lie,
      warnings: ["floor"],
    },
    {
      title: "Turn the cam bolts into the sides",
      detail: "Two cam bolts (D) into each side, near the front, half way up: they hold the front rail.",
      fix: SX.map((sx) => fx({ ...CAM_BOLT, at: [-15, 15].map((dz): Vec3 => [sx * xi, yRail + T / 2, zRail + dz]), dir: [sx, 0, 0], on: side(sx) })),
      pose: lie,
    },
    {
      title: "Stand the front rail on the left side",
      detail: "Push the front rail (5) onto the left side's two bolts and turn its two cam locks (E).",
      add: ["P5"],
      fix: [railCams(-1)],
      from: { P5: [-300, 0, 0] },
      pose: lie,
    },
    {
      title: "Fit the right side",
      detail: "Stand it on its front edges. Push the right side (3) onto the rail's other end and turn the rail's last two cam locks (E).",
      add: ["S3"],
      fix: [railCams(1)],
      from: { S3: [300, 0, 0] },
      pose: front,
    },
    {
      title: "Fix the top",
      detail: "Four dowels (A) and four cam bolts (D) into the top (1), two of each at each end. Push it onto the sides and turn the four cam locks (E) inside them.",
      add: ["TOP"],
      fix: [
        ...SX.map((sx) => fx({ ...DOWEL, at: zDowel.map((z): Vec3 => [sx * (xo - T / 2), ys1, z]), dir: [0, 1, 0], on: "TOP", mate: side(sx) })),
        ...SX.map((sx) => fx({ ...CAM_BOLT, at: zBolt.map((z): Vec3 => [sx * (xo - T / 2), ys1, z]), dir: [0, 1, 0], on: "TOP", mate: side(sx) })),
        ...SX.map((sx) => fx({ ...CAM, at: zBolt.map((z): Vec3 => [sx * xi, ys1 - 25, z]), dir: [sx, 0, 0], on: side(sx) })),
      ],
      from: { TOP: [0, 300, 0] },
      pose: front,
    },
    { title: "Slide in the back panel", detail: "Up the grooves from the open end until it reaches the top.", add: ["BK4"], from: { BK4: [0, -300, 0] }, pose: front },
    {
      title: "Screw on the bottom",
      detail: "Push four dowels (A) into the ends of the sides, press the bottom (6) on and drive the four long screws (B) through it.",
      add: ["BOT"],
      fix: [
        ...SX.map((sx) => fx({ ...DOWEL, at: zDowel.map((z): Vec3 => [sx * (xo - T / 2), ys0, z]), dir: [0, 1, 0], on: side(sx), mate: "BOT" })),
        ...SX.map((sx) => fx({ ...LONG_SCREW, at: zBolt.map((z): Vec3 => [sx * (xo - T / 2), UBH, z]), dir: [0, 1, 0], on: "BOT", mate: side(sx) })),
      ],
      pose: front,
      check: "square",
    },
    {
      title: "Bolt the frame together",
      detail: "Stand the two end frames (7) on their plates and set the two rails (8) between the bars across their tops. Two bolts (G) at each joint, eight in all, with the Allen key (H).",
      fix: [base.F, base.K].flatMap((id, k) => SX.map((sx) => fx({ ...FRAME_BOLT, at: [14, 38].map((dx): Vec3 => [sx * (xb - TB / 2 - dx), 0, k === 0 ? zr : -zr]), dir: [0, 1, 0], on: id, mate: end(sx) }))),
      wait: baseIds,
      from: outFrom(baseIds),
      tools: ["allen"],
    },
    {
      title: "Bolt the frame under the bottom",
      detail: "Turn the table upside down on a rug. Set the frame on the bottom, plates down, and fix it with a bolt (G) through each plate. Stick a felt pad (O) under each corner of the frame.",
      add: baseIds,
      fix: [
        ...SX.map((sx) => fx({ ...FRAME_BOLT, at: [-1, 1].map((sz): Vec3 => [sx * xb, UBH - PLATE, sz * zr]), dir: [0, 1, 0], on: end(sx), mate: "BOT" })),
        ...SX.map((sx) => fx({ kind: "glide", name: "Felt pad", len: 3, dia: 20, at: [-1, 1].map((sz): Vec3 => [sx * xb, 0, sz * zr]), dir: [0, 1, 0], on: end(sx) })),
      ],
      tools: ["allen"],
      pose: "-y",
      warnings: ["floor"],
    },
    {
      title: "Build the two drawer boxes",
      detail: "Stand the table up. For each drawer: screw the runners along the sides, three small screws (N) each, L on the left side (11) and M on the right (12). Four cam bolts (D) into the back of the front, stand the sides on it, turn their four cam locks (E) and slide the bottom (14) along the grooves.",
      fix: [0, 1].flatMap(boxFix),
      wait: [0, 1].flatMap(boxIds),
      from: outFrom([0, 1].flatMap(boxIds)),
      pose: "+y",
      repeat: 2,
    },
    {
      title: "Screw on the backs and the handles",
      detail: "Lay the back (13) over the ends of the sides and drive four screws (C) through it, two into each side. Screw the handle (I) on from behind with two screws (F): on the bottom edge of the top front (9), on the top edge of the bottom front (10).",
      fix: [0, 1].flatMap(backFix),
      wait: [0, 1].map((i) => dr(i).bk),
      from: outFrom([0, 1].map((i) => dr(i).bk)),
      repeat: 2,
    },
    {
      title: "Fit the back brackets and the wall strap",
      detail: "Four brackets (P) hold the back panel at its corners, a small screw (N) each. Screw the wall strap (T) to the top at the back, a washer (S) under its small screw (N).",
      fix: [
        ...SX.map((sx) => fx({ ...BACK_BRACKET, at: yBr.map((y): Vec3 => [sx * xi, y, zB + 4]), dir: [sx, 0, 0], on: side(sx) })),
        ...SX.map((sx) => fx({ ...SMALL, at: yBr.map((y): Vec3 => [sx * xi, y, zB + 4]), dir: [sx, 0, 0], on: side(sx) })),
        fx({ ...STRAP, at: [[0, H, zB + 30]], dir: [0, -1, 0], on: "TOP" }),
        fx({ ...WASHER, at: [[0, H, zB + 60]], dir: [0, -1, 0], on: "TOP" }),
        fx({ ...SMALL, at: [[0, H + 1.5, zB + 60]], dir: [0, -1, 0], on: "TOP" }),
      ],
      wall: false,
    },
    {
      title: "Slide the drawers in",
      detail: "The top front (9) at the top, so the two handles meet in a circle. Rest each drawer's runners on the ones in the table and push it home.",
      add: [1, 0].flatMap(ids),
      from: outFrom([0, 1].flatMap(ids), [0, 0, 420]),
    },
    {
      title: "Fix it to the wall",
      detail: "Mark through the strap, drill and push in the wall plug (R), then screw the strap to the wall with the wall screw (Q) and the other washer (S). Check the wall for pipes and cables first.",
      fix: [
        fx({ ...WALL_PLUG, at: [[0, H - 25, zB - 1]], dir: [0, 0, -1] }),
        fx({ ...WASHER, at: [[0, H - 25, zB + 23]], dir: [0, 0, -1], on: "TOP" }),
        fx({ ...WALL_SCREW, at: [[0, H - 25, zB + 23]], dir: [0, 0, -1] }),
      ],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug === "kmart-stevie-entertainment-unit") return tvUnit(s);
  if (s.slug === "kmart-stevie-bedside-table") return bedside(s);
  return chest(s);
}

const family: Family = { names: ["KMART:STEVIE"], recipe };
export default family;
