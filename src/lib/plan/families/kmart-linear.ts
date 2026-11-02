import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's Linear 1 Drawer Bedside Table, read from its assembly manual (keycode 43410002). The top (1) is one bent
 * board that curls down at both ends onto the sides, a fluted frame (9) runs round the front like an arch, and the one
 * drawer has a fluted front. It goes together with cam bolts (a), cam locks (b) and dowels (c), lying on its left side:
 *
 * - a strip (4) is screwed inside the top of the left side (2) and the drawer runner onto it; then four cam bolts and
 *   two dowels. The shelf (10), the front rail (7) and the back rail (5) stand on the side, each locked with cam locks.
 * - the right side (3) gets its strip (6), runner, bolts and dowels the same way and is laid on top; the curved back
 *   panel (8) slides down its grooves onto the back rail.
 * - the top goes on the top end, then six dowels and six cam bolts hold the front frame on.
 * - stood up, two small blocks keep the back panel in; the drawer is screwed together, its front cam-locked on, the
 *   runners screwed under it, and it slides in. Two caps cover the lowest cam locks.
 *
 * Part numbers are Kmart's own (1 to 15), so the guide reads against the paper.
 */

const T = 15; // board
const FT = 18; // front frame and drawer front
const FW = 30; // width of the front frame's tube of board
const RO = 55; // outer radius of the top's curl
const FOOT = 10; // the top's thick ends, over the side and its strip

const CAM_BOLT = { kind: "camScrew", len: 30, dia: 6 } as const;
const CAM = { kind: "cam", len: 12, dia: 15 } as const;
const DOWEL = { kind: "dowel", len: 30, dia: 6 } as const;
const SMALL = { kind: "screw", len: 12, dia: 3 } as const; // d, runners
const DRAWER_SCREW = { kind: "screw", len: 30, dia: 4 } as const; // e
const STRIP_SCREW = { kind: "screw", len: 25, dia: 4 } as const; // f
const OUT = 560; // the drawer is built this far in front of the table

type Fx = Omit<CustomFix, "count" | "at"> & { at: Vec3[] };
const fx = (f: Fx): CustomFix => ({ ...f, count: f.at.length });

/** Points round an arc (centre, radius, from and to angles from +x towards +y), both ends included. */
function arc(cx: number, cy: number, r: number, a0: number, a1: number, n = 8): [number, number][] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
  });
}

/** A board standing in the x/y plane, cut to an outline of [x, y] points (from its centre), `t` thick front to back. */
const upright = (outline: [number, number][], t: number, material?: PartPiece["material"]): PartPiece => ({ shape: "slab", outline, size: [0, t, 0], pos: [0, 0, 0], rot: [-Math.PI / 2, 0, 0], ...(material ? { material } : {}) });

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug !== "kmart-linear-1-drawer-bedside-table") return null;
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xi = W / 2 - T; // sides' inner faces
  const xr = W / 2 - 2 * T; // runner strips' inner faces
  const zB = -D / 2, zF = D / 2 - FT; // the carcass, front frame in front of it
  const zc = (zB + zF) / 2, Dc = zF - zB;
  const yS = H - RO - FOOT; // tops of the sides and the strips
  const Dr = Dc - 25; // strips stop short of the back panel's grooves
  const zr = zF - Dr / 2;
  const yShelf = 60; // the shelf's underside
  const yRail = [300, 345]; // front and back rails under the drawer
  const zBk = zB + 12; // back panel and back rail
  const yRun = yS - 45; // runners
  // the drawer
  const xd = xr - 12.5; // its sides' outer faces, leaving room for the runners
  const dh = 95, dy0 = yS - 57, dyc = dy0 + dh / 2;
  const dd = 230, dz0 = zF - dd, dzc = (zF + dz0) / 2;
  const fy0 = yRail[1] + 7, fy1 = H - FW - 3, fyc = (fy0 + fy1) / 2;

  // the top: an upside down U of bent board, thick feet at its ends
  const ty = (yS + H) / 2;
  const topProfile: [number, number][] = [
    [-W / 2, yS + FOOT],
    ...arc(-W / 2 + RO, H - RO, RO, Math.PI, Math.PI / 2),
    ...arc(W / 2 - RO, H - RO, RO, Math.PI / 2, 0),
    [W / 2, yS + FOOT],
    [W / 2 - T, yS + FOOT],
    ...arc(W / 2 - RO, H - RO, RO - T, 0, Math.PI / 2),
    ...arc(-W / 2 + RO, H - RO, RO - T, Math.PI / 2, Math.PI),
    [-W / 2 + T, yS + FOOT],
  ].map(([x, y]) => [x, y - ty] as [number, number]);
  const topPieces: PartPiece[] = [
    { ...upright(topProfile, Dc), pos: [0, 0, 0] },
    ...[-1, 1].map((sx): PartPiece => ({ shape: "box", size: [2 * T, FOOT, Dr], pos: [sx * (W / 2 - T), yS + FOOT / 2 - ty, zr - zc] })),
  ];
  // the front frame: an arch round the front, its legs to the floor
  const fyMid = H / 2;
  const frame: [number, number][] = [
    [-W / 2, 0],
    ...arc(-W / 2 + RO, H - RO, RO, Math.PI, Math.PI / 2),
    ...arc(W / 2 - RO, H - RO, RO, Math.PI / 2, 0),
    [W / 2, 0],
    [W / 2 - FW, 0],
    ...arc(W / 2 - RO, H - RO, RO - FW, 0, Math.PI / 2),
    ...arc(-W / 2 + RO, H - RO, RO - FW, Math.PI / 2, Math.PI),
    [-W / 2 + FW, 0],
  ].map(([x, y]) => [x, y - fyMid] as [number, number]);
  // the back panel: from the back rail up into the curl of the top
  const by0 = yRail[1], by1 = H - T - 1, byc = (by0 + by1) / 2;
  const back: [number, number][] = [
    [-xi - 6, by0],
    [xi + 6, by0],
    [xi + 6, yS],
    [xi - 1, yS],
    ...arc(W / 2 - RO, H - RO, RO - T - 1, 0, Math.PI / 2),
    ...arc(-W / 2 + RO, H - RO, RO - T - 1, Math.PI / 2, Math.PI),
    [-xi + 1, yS],
    [-xi - 6, yS],
  ].map(([x, y]) => [x, y - byc] as [number, number]);

  const parts: CustomPart[] = [
    { id: "S2", label: "2", name: "Left side", size: [T, yS, Dc], pos: [-W / 2 + T / 2, yS / 2, zc] },
    { id: "R4", label: "4", name: "Left runner strip", size: [T, 60, Dr], pos: [-xi + T / 2, yS - 30, zr] },
    { id: "SH", label: "10", name: "Shelf", size: [2 * xi, T, Dc], pos: [0, yShelf + T / 2, zc] },
    { id: "R7", label: "7", name: "Front rail", size: [2 * xi, yRail[1] - yRail[0], T], pos: [0, (yRail[0] + yRail[1]) / 2, zF - T / 2] },
    { id: "R5", label: "5", name: "Back rail", size: [2 * xi, yRail[1] - yRail[0], T], pos: [0, (yRail[0] + yRail[1]) / 2, zBk] },
    { id: "S3", label: "3", name: "Right side", size: [T, yS, Dc], pos: [W / 2 - T / 2, yS / 2, zc] },
    { id: "R6", label: "6", name: "Right runner strip", size: [T, 60, Dr], pos: [xi - T / 2, yS - 30, zr] },
    { id: "BK", label: "8", name: "Back panel", size: [2 * xi + 12, by1 - by0, 8], pos: [0, byc, zBk], pieces: [upright(back, 8)] },
    { id: "TOP", label: "1", name: "Top", size: [W, H - yS, Dc], pos: [0, ty, zc], pieces: topPieces },
    { id: "F9", label: "9", name: "Front frame", size: [W, H, FT], pos: [0, fyMid, D / 2 - FT / 2], pieces: [upright(frame, FT)] },
    // the drawer
    { id: "D11", label: "11", name: "Left drawer side", size: [12, dh, dd], pos: [-xd + 6, dyc, dzc] },
    { id: "D13", label: "13", name: "Right drawer side", size: [12, dh, dd], pos: [xd - 6, dyc, dzc] },
    { id: "D12", label: "12", name: "Drawer back", size: [2 * xd - 24, dh, 12], pos: [0, dyc, dz0 + 6] },
    { id: "D15", label: "15", name: "Drawer bottom", size: [2 * xd - 14, 3, dd - 16], pos: [0, dy0 + 10, dzc + 2], material: "fiber" },
    { id: "D14", label: "14", name: "Drawer front", size: [W - 2 * FW - 6, fy1 - fy0, FT], pos: [0, fyc, D / 2 - FT / 2] },
  ];
  const drawer = ["D11", "D13", "D12", "D15", "D14"];
  const outFrom = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, [0, 0, OUT] as Vec3]));

  /* ---- fittings ---- */
  const SX = [-1, 1] as const;
  const side = (sx: number) => (sx < 0 ? "S2" : "S3");
  const strip = (sx: number) => (sx < 0 ? "R4" : "R6");
  const zStrip = [zr - 50, zr + 50];
  const stripScrews = (sx: number) => fx({ ...STRIP_SCREW, at: zStrip.map((z): Vec3 => [sx * xr, yS - 30, z]), dir: [sx, 0, 0], on: strip(sx), mate: side(sx) });
  const zRun = zF - 130;
  const runner = (sx: number) => fx({ kind: "runner", name: "Drawer runner, cabinet part", len: 250, dia: 30, at: [[sx * xr, yRun, zRun]], dir: [sx, 0, 0], on: strip(sx) });
  const runnerScrews = (sx: number) => fx({ ...SMALL, at: [-100, 35, 100].map((dz): Vec3 => [sx * xr, yRun, zRun + dz]), dir: [sx, 0, 0], on: strip(sx) });
  const zTopDowel = [zF - 40, zF - Dr + 40], zTopBolt = [zF - 100, zF - Dr + 100];
  const topDowels = (sx: number) => fx({ ...DOWEL, at: zTopDowel.map((z): Vec3 => [sx * (xi - T / 2), yS, z]), dir: [0, -1, 0], on: strip(sx), mate: "TOP" });
  // cam bolts in a side: two for the shelf, one for each rail
  const zShelf = [zc - 90, zc + 90];
  const yBolt = yRail[0] + 36, yDowel = yRail[0] + 8;
  const sideBolts = (sx: number) =>
    fx({
      ...CAM_BOLT,
      at: [...zShelf.map((z): Vec3 => [sx * xi, yShelf + T / 2, z]), [sx * xi, yBolt, zF - T / 2], [sx * xi, yBolt, zBk]],
      dir: [sx, 0, 0],
      on: side(sx),
    });
  const shelfDowels = SX.map((sx) => fx({ ...DOWEL, at: [zc - 40, zc + 40].map((z): Vec3 => [sx * xi, yShelf + T / 2, z]), dir: [-sx, 0, 0], on: "SH", mate: side(sx) }));
  const shelfCams = (sx: number) => fx({ ...CAM, at: zShelf.map((z): Vec3 => [sx * (xi - 28), yShelf, z]), dir: [0, 1, 0], on: "SH" });
  const railDowels = (id: "R7" | "R5", z: number) => SX.map((sx) => fx({ ...DOWEL, at: [[sx * xi, yDowel, z]], dir: [-sx, 0, 0], on: id, mate: side(sx) }));
  const railCam = (id: "R7" | "R5", sx: number) =>
    id === "R7" ? fx({ ...CAM, at: [[sx * (xi - 28), yBolt, zF - T]], dir: [0, 0, 1], on: "R7" }) : fx({ ...CAM, at: [[sx * (xi - 28), yBolt, zBk + T / 2]], dir: [0, 0, -1], on: "R5" });
  const topBolts = SX.map((sx) => fx({ ...CAM_BOLT, at: zTopBolt.map((z): Vec3 => [sx * (xi - T / 2), yS, z]), dir: [0, 1, 0], on: "TOP", mate: strip(sx) }));
  const topCams = SX.map((sx) => fx({ ...CAM, at: zTopBolt.map((z): Vec3 => [sx * xr, yS - 28, z]), dir: [sx, 0, 0], on: strip(sx) }));
  // the front frame: two joints across the top, two down each side
  const xFT = [-50, 50], yLeg = [yS - 85, yShelf + 50], yLegDowel = [yS - 45, yShelf + 90];
  const frontDowels = [
    fx({ ...DOWEL, at: [-100, 100].map((x): Vec3 => [x, H - T / 2, zF]), dir: [0, 0, -1], on: "TOP", mate: "F9" }),
    ...SX.map((sx) => fx({ ...DOWEL, at: yLegDowel.map((y): Vec3 => [sx * (W / 2 - T / 2), y, zF]), dir: [0, 0, -1], on: side(sx), mate: "F9" })),
  ];
  const frameBolts = fx({ ...CAM_BOLT, at: [...xFT.map((x): Vec3 => [x, H - T / 2, zF]), ...SX.flatMap((sx) => yLeg.map((y): Vec3 => [sx * (W / 2 - T / 2), y, zF]))], dir: [0, 0, 1], on: "F9" });
  const frameCams = [
    fx({ ...CAM, at: xFT.map((x): Vec3 => [x, H - T, zF - 28]), dir: [0, 1, 0], on: "TOP" }),
    ...SX.map((sx) => fx({ ...CAM, at: yLeg.map((y): Vec3 => [sx * xi, y, zF - 28]), dir: [sx, 0, 0], on: side(sx) })),
  ];
  const caps = SX.map((sx) => fx({ kind: "cap", name: "Cover cap", len: 1, dia: 15, at: [[sx * xi, yLeg[1], zF - 28]], dir: [sx, 0, 0], on: side(sx) }));
  // the drawer
  const dSide = (sx: number) => (sx < 0 ? "D11" : "D13");
  const dys = [dyc - 25, dyc + 25];
  const drawerScrews = SX.map((sx) => fx({ ...DRAWER_SCREW, at: dys.map((y): Vec3 => [sx * xd, y, dz0 + 6]), dir: [-sx, 0, 0], on: dSide(sx), mate: "D12" }));
  const frontBolts = fx({ ...CAM_BOLT, at: SX.flatMap((sx) => dys.map((y): Vec3 => [sx * (xd - 6), y, zF])), dir: [0, 0, 1], on: "D14" });
  const handle = fx({ kind: "handle", len: 128, dia: 12, at: [[0, fyc, D / 2]], dir: [0, 0, -1], on: "D14" });
  const handleScrews = fx({ kind: "screw", len: 16, dia: 4, name: "Handle screw", at: [-64, 64].map((x): Vec3 => [x, fyc, zF]), dir: [0, 0, 1], on: "D14" });
  const frontCams = SX.map((sx) => fx({ ...CAM, at: dys.map((y): Vec3 => [sx * (xd - 12), y, zF - 28]), dir: [sx, 0, 0], on: dSide(sx) }));
  const dRun = SX.map((sx) => fx({ kind: "runner", name: "Drawer runner, drawer part", len: 250, dia: 30, at: [[sx * xd, yRun, zRun]], dir: [-sx, 0, 0], on: dSide(sx) }));
  const dRunScrews = SX.map((sx) => fx({ ...SMALL, at: [-90, 90].map((dz): Vec3 => [sx * xd, yRun, zRun + dz]), dir: [-sx, 0, 0], on: dSide(sx) }));

  const lie = "+x" as const;
  const steps: CustomStep[] = [
    {
      title: "Screw the strip inside the left side",
      detail: "Lay the left side (2) flat, inside up. Push the strip (4) flush with its top edge and drive in two screws.",
      add: ["S2", "R4"],
      fix: [stripScrews(-1)],
      pose: lie,
      warnings: ["floor"],
    },
    {
      title: "Fit the runner, bolts and dowels",
      detail: "Screw the runner onto the strip, wheel to the front, with three small screws. Push two dowels into the top edge and turn the four cam bolts into the side until they stop.",
      fix: [runner(-1), runnerScrews(-1), topDowels(-1), sideBolts(-1)],
    },
    { title: "Push dowels into the shelf", detail: "Two into each end of the shelf (10).", fix: shelfDowels, wait: ["SH"], from: { SH: [0, 0, OUT] } },
    { title: "Stand the shelf on the side", detail: "Push it onto the dowels and bolts near the bottom of the side, then turn its two cam locks to pull it tight.", add: ["SH"], fix: [shelfCams(-1)] },
    { title: "Push dowels into the front rail", detail: "One into each end of the front rail (7).", fix: railDowels("R7", zF - T / 2), wait: ["R7"], from: { R7: [0, 0, OUT] } },
    { title: "Stand the front rail on the side", detail: "At the front, under the runner. Turn its cam lock.", add: ["R7"], fix: [railCam("R7", -1)] },
    { title: "Push dowels into the back rail", detail: "One into each end of the back rail (5).", fix: railDowels("R5", zBk), wait: ["R5"], from: { R5: [0, 0, OUT] } },
    { title: "Stand the back rail on the side", detail: "At the back, level with the front rail, its groove facing the top. Turn its cam lock.", add: ["R5"], fix: [railCam("R5", -1)] },
    {
      title: "Screw the strip inside the right side",
      detail: "Lay the right side (3) flat, inside up, and screw its strip (6) flush with the top edge.",
      fix: [stripScrews(1)],
      wait: ["S3", "R6"],
      from: { S3: [0, 0, OUT], R6: [0, 0, OUT] },
    },
    { title: "Fit its runner, bolts and dowels", detail: "The same as the left side: the runner with three screws, two dowels in the top edge, four cam bolts.", fix: [runner(1), runnerScrews(1), topDowels(1), sideBolts(1)] },
    {
      title: "Lay the right side on",
      detail: "Lower it onto the shelf and the rails so every dowel and bolt finds its hole, then turn the four cam locks.",
      add: ["S3", "R6"],
      fix: [shelfCams(1), railCam("R7", 1), railCam("R5", 1)],
      check: "square",
    },
    { title: "Slide in the back panel", detail: "Into the grooves at the back of the sides, curved end last, until it sits in the back rail.", add: ["BK"], from: { BK: [0, 320, 0] } },
    { title: "Screw the cam bolts into the top", detail: "Two into the end of each curl of the top (1).", fix: topBolts, wait: ["TOP"], from: { TOP: [0, 0, OUT] } },
    { title: "Fit the top", detail: "Push it onto the top ends of the sides, over the dowels and bolts, and turn the four cam locks in the strips.", add: ["TOP"], fix: topCams },
    { title: "Push dowels into the front edges", detail: "Two into the front edge of the top and two into each side.", fix: frontDowels },
    { title: "Screw the cam bolts into the front frame", detail: "Six into the back of the front frame (9): two across the top and two down each leg.", fix: [frameBolts], wait: ["F9"], from: { F9: [0, 0, OUT] } },
    { title: "Fit the front frame", detail: "Press it onto the front edges, over the dowels and bolts, and turn the six cam locks.", add: ["F9"], fix: frameCams },
    {
      title: "Stand it up and fit the corner blocks",
      detail: "Push a small block into each top corner behind the back panel and fix it with a screw.",
      fix: [
        ...SX.map((sx) => fx({ kind: "clamp", name: "Corner block", len: 16, dia: 12, at: [[sx * xi, yS - 15, zB + 4]], dir: [sx, 0, 0], on: side(sx) })),
        ...SX.map((sx) => fx({ kind: "screw", len: 14, dia: 3, at: [[sx * xi, yS - 15, zB + 4]], dir: [sx, 0, 0], on: side(sx) })),
      ],
      pose: "+y",
    },
    { title: "Screw the drawer sides to the back", detail: "Two screws through each side (11 and 13) into the ends of the drawer back (12), grooves facing in.", fix: drawerScrews, wait: ["D11", "D13", "D12"], from: outFrom(["D11", "D13", "D12"]) },
    { title: "Slide in the drawer bottom", detail: "Stand the drawer on its back and slide the bottom (15) down the grooves.", wait: ["D15"], from: outFrom(["D15"]) },
    {
      title: "Prepare the drawer front",
      detail: "Turn four cam bolts into the back of the drawer front (14), then fix the handle with its two screws from behind.",
      fix: [frontBolts, handle, handleScrews],
      wait: ["D14"],
      from: outFrom(["D14"]),
    },
    { title: "Fix the front onto the drawer", detail: "Push it onto the front ends of the sides and turn the four cam locks.", fix: frontCams },
    { title: "Screw the runners onto the drawer", detail: "One along the bottom of each side, with two small screws each.", fix: [...dRun, ...dRunScrews] },
    {
      title: "Slide the drawer in and cap the cam locks",
      detail: "Rest the drawer's runners on the ones in the table and push it home. Press the two caps over the cam locks just above the shelf.",
      add: drawer,
      fix: caps,
    },
  ];
  return { parts, steps };
}

const family: Family = { names: ["KMART:LINEAR"], recipe };
export default family;
