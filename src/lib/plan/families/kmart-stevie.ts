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

function recipe(s: ProductSpec): CustomParams | null {
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

const family: Family = { names: ["KMART:STEVIE"], recipe };
export default family;
