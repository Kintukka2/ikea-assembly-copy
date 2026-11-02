import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartMaterial, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's Charlie range, read from its assembly manuals. All of it is 15 mm board held with cam bolts and cam locks,
 * wooden dowels and screws, with slatted fronts:
 *
 * - 6 Drawer Chest: runners go on both sides and on both faces of the middle panel, then with the parts on their
 *   fronts the left side, the middle panel and the rails go together, and the right side. A plinth frame is built and
 *   screwed under the bottom, the lower back slides in from below and the bottom goes on. Standing, the upper back
 *   slides down, the top goes on, corner blocks hold the backs and two brackets go to the wall. Then the drawers:
 *   cam bolts in each front, the sides locked onto it, the bottom down the grooves, a brace and the back screwed on.
 * - 2 Drawer Bedside Table: the same build with one column of two drawers and a single back.
 * - Entertainment Unit: three bays behind three doors. The top takes the sides on its front edge, then upside down the
 *   two dividers and three backs go in, the plinth and bottom close it, the doors hang on cup hinges and a shelf sits on
 *   four supports in the middle bay.
 * - 2 Tier Shoe Cabinet: two sides joined by four rails and the top, then two flip down doors, each with a pair of
 *   pivot fittings and a shoe tray, pivot into the sides. It has no bottom and no back, and is fixed to the wall.
 *
 * Part numbers are Kmart's own, so the guide reads against the paper. Parts that are built away from the carcass
 * (sides with their runners, the plinth, drawers, doors) wait beside it until the step that joins them.
 */

const T = 15; // every panel
const BK = 3; // hardboard
const FT = 18; // the slatted fronts and doors

type Def = { kind: CustomFix["kind"]; len: number; dia: number; name?: string; included?: boolean };
const CAM_BOLT: Def = { kind: "camScrew", len: 35, dia: 6, name: "Cam bolt" };
const CAM: Def = { kind: "cam", len: 9, dia: 15, name: "Cam lock" };
const DOWEL: Def = { kind: "dowel", len: 30, dia: 6 };
const SCREW: Def = { kind: "screw", len: 35, dia: 4 };
const BLOCK: Def = { kind: "angle", len: 16, dia: 20, name: "Corner block" };
const BLOCK_SCREW: Def = { kind: "screw", len: 16, dia: 3, name: "Corner block screw" };
const WALL_BRACKET: Def = { kind: "angle", len: 30, dia: 20, name: "Wall bracket" };
const BRACKET_SCREW: Def = { kind: "screw", len: 12, dia: 3.5, name: "Bracket screw" };
const PLINTH_BRACKET: Def = { kind: "angle", len: 26, dia: 26, name: "Angle bracket" };
const PLINTH_SCREW: Def = { kind: "screw", len: 12, dia: 3.5, name: "Angle bracket screw" };
const RUNNER_SCREW: Def = { kind: "screw", len: 12, dia: 3.5, name: "Runner screw" };
const DOUBLE_BOLT: Def = { kind: "camScrew", len: 70, dia: 7, name: "Double cam bolt" };
const LONG_DOWEL: Def = { kind: "dowel", len: 50, dia: 6 };
const WALL_PLUG: Def = { kind: "plug", len: 30, dia: 6, included: true };
const runner = (len: number, name: string): Def => ({ kind: "runner", len, dia: 20, name });

/** Fittings at exact points: what, where, the way they go in, the part they sit in and the part their other end meets. */
const fx = (def: Def, at: Vec3[], dir: Vec3, on?: string, mate?: string, extra: Partial<CustomFix> = {}): CustomFix => ({
  ...def,
  count: at.length,
  at,
  dir,
  ...(on ? { on } : {}),
  ...(mate ? { mate } : {}),
  ...extra,
});

class Parts {
  list: CustomPart[] = [];
  add(id: string, label: string, name: string, size: Vec3, pos: Vec3, material: PartMaterial = "board", pieces?: PartPiece[]) {
    this.list.push({ id, label, name, size, pos, material, ...(pieces ? { pieces } : {}) });
    return id;
  }
}

/** A panel with a notch cut out of one corner: drawn as the boxes that are left, given in the product's frame. */
function notched(boxes: { min: Vec3; max: Vec3 }[]): { size: Vec3; pos: Vec3; pieces: PartPiece[] } {
  const lo: Vec3 = [0, 1, 2].map((k) => Math.min(...boxes.map((b) => b.min[k]))) as Vec3;
  const hi: Vec3 = [0, 1, 2].map((k) => Math.max(...boxes.map((b) => b.max[k]))) as Vec3;
  const pos: Vec3 = [0, 1, 2].map((k) => (lo[k] + hi[k]) / 2) as Vec3;
  const size: Vec3 = [0, 1, 2].map((k) => hi[k] - lo[k]) as Vec3;
  const pieces: PartPiece[] = boxes.map((b) => ({
    shape: "box",
    size: [0, 1, 2].map((k) => b.max[k] - b.min[k]) as Vec3,
    pos: [0, 1, 2].map((k) => (b.min[k] + b.max[k]) / 2 - pos[k]) as Vec3,
  }));
  return { size, pos, pieces };
}

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const num = (n: number, cap = false) => {
  const w = WORDS[n] ?? String(n);
  return cap ? w[0].toUpperCase() + w.slice(1) : w;
};
const offset = (ids: string[], v: Vec3) => Object.fromEntries(ids.map((id) => [id, v] as [string, Vec3]));
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/* ---------- chests: the 6 drawer chest and the 2 drawer bedside table ---------- */

/**
 * Both are built the same way: a carcass of two sides (and a middle panel for two columns) joined by a top front
 * rail, rails between the drawers and a back rail, on a plinth frame screwed under the bottom. The drawer fronts sit
 * inside the carcass, flush with the sides, and the rails stand behind them.
 */
interface ChestOpts {
  cols: 1 | 2;
  rows: number;
  plinth: number; // height of the plinth frame
  backRail: boolean; // the 6 drawer chest has a back rail across the middle and two backs; the bedside one back
  bottomLate?: boolean; // the drawer bottoms slide in with the backs (bedside), not with the sides (chest)
  N: Record<string, string>; // the manual's part numbers
}

function chest(s: ProductSpec, o: ChestOpts): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const { cols, rows, N } = o;
  const P = o.plinth;
  const xi = W / 2 - T; // inside faces of the sides
  const y0 = P + T, y1 = H - T; // top of the bottom, underside of the top
  const hr = (y1 - y0) / rows;
  const yb = (k: number) => y0 + k * hr; // where the drawer openings meet
  const RH = 50; // the front rails, standing on edge behind the fronts
  const zf = D / 2 - FT; // the rails' front faces and the drawer boxes' fronts
  const zk = -D / 2 + 18; // the back panels' outside face, in grooves 18 mm in from the back edge
  const zr = zk + BK; // back rail's back face (and the bedside's back of everything)
  const zdv = o.backRail ? zr + T : zr; // the middle panel's back edge, in front of the back rail
  const bay = cols === 2 ? xi - T / 2 : 2 * xi; // width of a drawer opening
  const cxs = cols === 2 ? [-(T / 2 + bay / 2), T / 2 + bay / 2] : [0];
  const xs = bay / 2 - 12.5 - T / 2; // drawer side centres from the opening's centre, clear of the runners
  const DD = 330 > zf - zdv - 6 ? Math.floor(zf - zdv - 6) : 330; // drawer box depth
  const zb = zf - DD; // drawer box backs
  const sh = Math.min(140, Math.round(hr - RH - 50)); // drawer side height
  const ybox = (i: number) => yb(i) + 40; // underside of a drawer box
  const RL = Math.min(300, Math.floor((DD - 30) / 10) * 10); // runner length
  const hrl = RL / 2;
  const zrun = (c: number) => zf - 5 - RL / 2 - (c === 1 ? 20 : 0); // cabinet runner centre (the right bay's sits further back)
  // the drawer runner's centre: halfway between the cabinet runner's centre and its next screw, behind or in front
  const zdr = (c: number) => (zrun(c) - 0.15 * (RL / 2) - RL / 2 >= zf - DD ? zrun(c) - 0.15 * (RL / 2) : zrun(c) + 0.15 * (RL / 2));
  const y8 = Math.round(y0 + 0.53 * (y1 - y0)); // back rail
  const PI = 25; // the plinth frame stands in this far from the edges

  const p = new Parts();
  p.add("T1", N.top, "Top", [W, T, D], [0, H - T / 2, 0]);
  p.add("B2", N.bottom, "Bottom", [W, T, D], [0, P + T / 2, 0]);
  p.add("SL", N.left, "Left side", [T, y1 - y0, D], [-(W / 2 - T / 2), (y0 + y1) / 2, 0]);
  p.add("SR", N.right, "Right side", [T, y1 - y0, D], [W / 2 - T / 2, (y0 + y1) / 2, 0]);
  if (cols === 2) {
    // the middle panel stops in front of the back rail and is notched at the top for the top front rail
    const m = notched([
      { min: [-T / 2, y0, zdv], max: [T / 2, y1 - RH, zf] },
      { min: [-T / 2, y1 - RH, zdv], max: [T / 2, y1, zf - T] },
    ]);
    p.add("MID", N.mid, "Middle panel", m.size, m.pos, "board", m.pieces);
  }
  p.add("R6", N.topRail, "Top front rail", [2 * xi, RH, T], [0, y1 - RH / 2, zf - T / 2]);
  const rails: { id: string; c: number; k: number }[] = [];
  for (let k = 1; k < rows; k++)
    cxs.forEach((cx, c) => {
      const id = `R7-${c}-${k}`;
      p.add(id, N.rail, "Front rail", [bay, RH, T], [cx, yb(k), zf - T / 2]);
      rails.push({ id, c, k });
    });
  if (o.backRail) {
    p.add("R8", N.backRail, "Back rail", [2 * xi, 60, T], [0, y8, zr + T / 2]);
    p.add("K9", N.lowBack, "Lower back panel", [2 * xi + 16, y8 - (y0 - 5), BK], [0, (y0 - 5 + y8) / 2, zk + BK / 2], "fiber");
    p.add("K20", N.upBack, "Upper back panel", [2 * xi + 16, y1 + 5 - y8, BK], [0, (y8 + y1 + 5) / 2, zk + BK / 2], "fiber");
  } else p.add("K9", N.back, "Back panel", [2 * xi + 16, y1 - y0 + 10, BK], [0, (y0 + y1) / 2, zk + BK / 2], "fiber");
  // the plinth: two long rails, two ends and, under the wide chest, two braces
  const px = W / 2 - PI, pz = D / 2 - PI;
  const pxi = px - T, pzi = pz - T; // its inside faces
  p.add("P10f", N.pRail, "Plinth rail", [2 * px, P, T], [0, P / 2, pz - T / 2]);
  p.add("P10b", N.pRail, "Plinth rail", [2 * px, P, T], [0, P / 2, -(pz - T / 2)]);
  p.add("P11l", N.pEnd, "Plinth end", [T, P, 2 * pzi], [-(px - T / 2), P / 2, 0]);
  p.add("P11r", N.pEnd, "Plinth end", [T, P, 2 * pzi], [px - T / 2, P / 2, 0]);
  const braces = cols === 2 ? [-W / 6, W / 6] : [];
  braces.forEach((x, i) => p.add(`P12-${i}`, N.pBrace, "Plinth brace", [T, P, 2 * pzi], [x, P / 2, 0]));
  const plinth = ["P10f", "P10b", "P11l", "P11r", ...braces.map((_, i) => `P12-${i}`)];

  // drawers
  interface Drawer {
    c: number;
    i: number;
    cx: number;
    y: number;
    front: string;
    sl: string;
    sr: string;
    back: string;
    brace?: string;
    bottom: string;
  }
  const drawers: Drawer[] = [];
  const fw = cols === 2 ? xi - 3 : 2 * xi - 3;
  for (let c = 0; c < cols; c++)
    for (let i = 0; i < rows; i++) {
      const cx = cxs[c], y = ybox(i), tag = `${c}${i}`;
      const fx0 = cols === 2 ? (c ? 1 : -1) * (xi / 2) : 0;
      const d: Drawer = {
        c,
        i,
        cx,
        y,
        front: p.add(`F${tag}`, cols === 2 ? (c ? N.frontR : N.frontL) : N.front, cols === 2 ? (c ? "Right drawer front" : "Left drawer front") : "Drawer front", [fw, hr - 3, FT], [fx0, yb(i) + hr / 2, D / 2 - FT / 2]),
        sl: p.add(`DL${tag}`, N.sideL, "Drawer side, left", [T, sh, DD], [cx - xs, y + sh / 2, zf - DD / 2]),
        sr: p.add(`DR${tag}`, N.sideR, "Drawer side, right", [T, sh, DD], [cx + xs, y + sh / 2, zf - DD / 2]),
        back: p.add(`DB${tag}`, N.dBack, "Drawer back", [2 * xs - T, sh, T], [cx, y + sh / 2, zb + T / 2]),
        bottom: p.add(`DT${tag}`, N.dBottom, "Drawer bottom", [2 * xs - T + 16, BK, DD - 8], [cx, y + 12, (zf - 1 + zb + 7) / 2], "fiber"),
      };
      if (N.brace) d.brace = p.add(`DC${tag}`, N.brace, "Drawer brace", [60, T, DD - T], [cx, y + 13.5 + T / 2, (zf + zb + T) / 2]);
      drawers.push(d);
    }

  /* fittings */
  const sides = [
    { id: "SL", sx: -1 },
    { id: "SR", sx: 1 },
  ];
  const sideOf = (c: number, g: number) => (cols === 1 ? (g < 0 ? "SL" : "SR") : c === 0 ? (g < 0 ? "SL" : "MID") : g < 0 ? "MID" : "SR");
  const faceX = (c: number, g: number) => (cols === 1 ? g * xi : c === 0 ? (g < 0 ? -xi : -T / 2) : g < 0 ? T / 2 : xi);
  const ycr = (i: number) => ybox(i) - 6;
  const yr7 = (k: number) => yb(k) + 12; // cam bolt into a front rail's end; its dowel 24 mm lower
  // cam bolts in a side for every rail that ends on it: the top front rail, the back rail and its column's front rails
  const sideBolts = (sx: number): Vec3[] => [
    [sx * xi, y1 - RH / 2, zf - T / 2],
    ...(o.backRail ? [[sx * xi, y8 - 15, zr + T / 2] as Vec3, [sx * xi, y8 + 15, zr + T / 2] as Vec3] : []),
    ...range(rows - 1).map((k): Vec3 => [sx * xi, yr7(k + 1), zf - T / 2]),
  ];
  // the cabinet runners and their screws, on the faces either side of a column
  const runScrewZ = (c: number) => [0.87, 0.3, -0.3, -0.87].map((k) => zrun(c) + Math.round(k * hrl));
  const cabRunners = (c: number, g: number): CustomFix[] => {
    const x = faceX(c, g), on = sideOf(c, g), dir: Vec3 = [g, 0, 0];
    return [
      fx(runner(RL, g < 0 ? "Cabinet runner, left" : "Cabinet runner, right"), range(rows).map((i): Vec3 => [x, ycr(i), zrun(c)]), dir, on),
      fx(RUNNER_SCREW, range(rows).flatMap((i) => runScrewZ(c).map((z): Vec3 => [x, ycr(i), z])), dir, on),
    ];
  };
  const railsAt = (c: number) => rails.filter((r) => r.c === c);
  // a rail's cam lock, in its back face 25 mm in from the end that meets a side
  const railCam = (id: string, x: number, y: number, z: number, dir: Vec3) => fx(CAM, [[x, y, z]], dir, id);

  const steps: CustomStep[] = [];
  const lie = "-z" as const;
  const sideOff: Record<string, Vec3> = { SL: [-300, 0, 0], SR: [300, 0, 0], MID: [-200, 0, 0] };
  const fromAbove = (ids: string[]) => offset(ids, [0, 0, -400]); // lying on its front, "above" is behind it

  steps.push({
    title: "Screw the runners and cam bolts onto the sides",
    detail: "Lay both sides inside face up. The left runners go on the left side and the right runners on the right side, wheel to the front, four screws each, then turn in the cam bolts by hand.",
    fix: [
      fx(CAM_BOLT, sideBolts(-1), [-1, 0, 0], "SL"),
      fx(CAM_BOLT, sideBolts(1), [1, 0, 0], "SR"),
      ...cabRunners(0, -1),
      ...cabRunners(cols - 1, 1),
    ],
    wait: ["SL", "SR"],
    from: { SL: sideOff.SL, SR: sideOff.SR },
    tools: ["screwdriver"],
    kind: "runners",
  });
  if (cols === 2)
    steps.push({
      title: "Screw runners onto both faces of the middle panel",
      detail: "Right runners on one face for the left column, then turn it over and screw the left runners on the other face.",
      fix: [...cabRunners(0, 1), ...cabRunners(1, -1)],
      wait: ["MID"],
      from: { MID: sideOff.MID },
      tools: ["screwdriver"],
      kind: "runners",
    });

  // the left side with the rails (and the middle panel)
  const leftRails = cols === 2 ? railsAt(0) : rails;
  const r7fix = (list: typeof rails, end: "L" | "R" | "mid"): CustomFix[] =>
    list.flatMap((r) => {
      const y = yr7(r.k);
      if (end === "mid")
        // through the middle panel: a long dowel and a double cam bolt into the left rail, a cam lock in its back
        return [
          fx(LONG_DOWEL, [[-T / 2, y - 24, zf - T / 2]], [1, 0, 0], "MID", r.id),
          fx(DOUBLE_BOLT, [[-T / 2, y, zf - T / 2]], [1, 0, 0], "MID", r.id),
          railCam(r.id, -(T / 2 + 25), y, zf - T, [0, 0, 1]),
        ];
      const sx = end === "L" ? -1 : 1;
      return [fx(DOWEL, [[sx * xi, y - 24, zf - T / 2]], [sx, 0, 0], end === "L" ? "SL" : "SR", r.id), railCam(r.id, sx * (xi - 25), y, zf - T, [0, 0, 1])];
    });
  const endCams = (sx: number): CustomFix[] => [
    railCam("R6", sx * (xi - 25), y1 - RH / 2, zf - T, [0, 0, 1]),
    ...(o.backRail ? [fx(CAM, [y8 - 15, y8 + 15].map((y): Vec3 => [sx * (xi - 30), y, zr + T]), [0, 0, -1], "R8")] : []),
  ];
  if (cols === 2) {
    steps.push({
      title: "Join the left side, the middle panel and the rails",
      detail: "With the parts on their front edges, push the top front rail, the back rail and two front rails onto the left side's cam bolts and lock them. The front rails take a dowel at the side and a long dowel and double cam bolt through the middle panel.",
      add: ["SL", "MID", "R6", "R8", ...leftRails.map((r) => r.id)],
      fix: [...r7fix(leftRails, "L"), ...r7fix(leftRails, "mid"), ...endCams(-1)],
      from: { ...fromAbove(["R6", "R8", ...leftRails.map((r) => r.id)]) },
      pose: lie,
      tools: ["screwdriver"],
      warnings: ["floor"],
    });
    const rightRails = railsAt(1);
    steps.push({
      title: "Fit the right side and the other two rails",
      detail: "Push the right front rails onto the double cam bolts and lock them, then press the right side onto the rails' ends and lock its cams. Two screws through the back rail hold the middle panel.",
      add: [...rightRails.map((r) => r.id), "SR"],
      fix: [
        ...rightRails.flatMap((r) => [railCam(r.id, T / 2 + 25, yr7(r.k), zf - T, [0, 0, 1])]),
        ...r7fix(rightRails, "R"),
        ...endCams(1),
        fx(SCREW, [y8 - 15, y8 + 15].map((y): Vec3 => [0, y, zr]), [0, 0, 1], "R8", "MID"),
      ],
      from: fromAbove(rightRails.map((r) => r.id)),
      pose: lie,
      tools: ["screwdriver"],
    });
  } else {
    steps.push({
      title: "Join the sides with the rails",
      detail: "With the sides on their front edges, push the top front rail and the middle rail onto the left side's cam bolts (the middle rail also sits on a dowel at each end), then press the right side on and lock all four cams.",
      add: ["SL", "R6", ...rails.map((r) => r.id), "SR"],
      fix: [...r7fix(rails, "L"), ...r7fix(rails, "R"), ...endCams(-1), ...endCams(1)],
      from: fromAbove(["R6", ...rails.map((r) => r.id)]),
      pose: lie,
      tools: ["screwdriver"],
      warnings: ["floor"],
    });
  }

  // the top: cam bolts into its underside over each side (and the middle panel), wall brackets at the back
  const uprights = cols === 2 ? [-(W / 2 - T / 2), 0, W / 2 - T / 2] : [-(W / 2 - T / 2), W / 2 - T / 2];
  const topBoltZ = [-(D / 2 - 95), D / 2 - 95];
  const topBolts = uprights.flatMap((x) => topBoltZ.map((z): Vec3 => [x, y1, z]));
  const wallX = cols === 2 ? [-(W / 2 - 300), W / 2 - 300] : [0];
  const zg = zk + 2; // wall brackets on the top's underside, the tab hanging down behind the back
  const topFix: CustomFix[] = [
    fx(CAM_BOLT, topBolts, [0, 1, 0], "T1"),
    fx(WALL_BRACKET, wallX.map((x): Vec3 => [x, y1, zg]), [0, 1, 0], "T1"),
    fx(BRACKET_SCREW, wallX.map((x): Vec3 => [x, y1, zg + 25]), [0, 1, 0], "T1"),
  ];
  const topStep = (stand: boolean): CustomStep => ({
    title: "Turn cam bolts into the top and fit the wall bracket" + (wallX.length > 1 ? "s" : ""),
    detail: `${num(topBolts.length, true)} cam bolts into the underside, then the wall bracket${wallX.length > 1 ? "s" : ""} at the back edge with a small screw.`,
    fix: topFix,
    wait: ["T1"],
    from: { T1: stand ? [0, 0, 400] : [W * 0.75, 0, 0] },
    tools: ["screwdriver"],
    ...(stand ? { pose: "+y" as const } : {}),
  });
  // cam locks for the top's bolts: in the sides' inside faces and one face of the middle panel
  const topCams: CustomFix[] = uprights.map((x) => {
    const id = x === 0 ? "MID" : x < 0 ? "SL" : "SR";
    const fxX = x === 0 ? -T / 2 : x < 0 ? -xi : xi;
    const dir: Vec3 = x === 0 ? [1, 0, 0] : [x < 0 ? -1 : 1, 0, 0];
    return fx(CAM, topBoltZ.map((z): Vec3 => [fxX, y1 - 25, z]), dir, id);
  });
  const topDowels: CustomFix[] = [
    ...uprights.map((x) => fx(DOWEL, [-1, 1].map((g): Vec3 => [x, y1, g * (D / 2 - 45) * (x === 0 ? 0.27 : 1)]), [0, -1, 0], x === 0 ? "MID" : x < 0 ? "SL" : "SR", "T1")),
    fx(DOWEL, [-W / 4, W / 4].map((x): Vec3 => [x, y1, zf - T / 2]), [0, -1, 0], "R6", "T1"),
  ];
  const railScrews = fx(SCREW, (cols === 2 ? [-W / 4 - 60, W / 4 + 60] : [-W / 4 + 20, W / 4 - 20]).map((x): Vec3 => [x, y1 - RH, zf - T / 2]), [0, 1, 0], "R6", "T1");

  if (cols === 1) {
    steps.push(topStep(false));
    steps.push({
      title: "Fix the top on",
      detail: "Dowels into the top edges of the sides and the top rail, then push the top onto them, lock the four cams and drive two screws up through the top rail.",
      add: ["T1"],
      fix: [...topDowels, ...topCams, railScrews],
      pose: lie,
      tools: ["screwdriver"],
    });
  }

  // the plinth frame, built beside the carcass, then screwed under the bottom
  const pOff: Vec3 = [(W + 150) / 1.6, 0, 0]; // the plinth waits this far to the right (it is drawn 1.6 times as far)
  const pIds = [...plinth, "B2"];
  const pY = 20; // cam bolts and cam locks low in the plinth, the corner brackets high
  const railBoltX = [-(px - T / 2), ...braces, px - T / 2];
  steps.push({
    title: "Turn cam bolts into the plinth rails",
    detail: `${num(railBoltX.length, true)} into the inside face of each long rail, by hand until they stop.`,
    fix: [fx(CAM_BOLT, railBoltX.map((x): Vec3 => [x, pY, pzi]), [0, 0, 1], "P10f"), fx(CAM_BOLT, railBoltX.map((x): Vec3 => [x, pY, -pzi]), [0, 0, -1], "P10b")],
    wait: ["P10f", "P10b"],
    from: offset(pIds, pOff),
    tools: ["screwdriver"],
  });
  const crossIds = ["P11l", "P11r", ...braces.map((_, i) => `P12-${i}`)];
  steps.push({
    title: "Join the plinth frame",
    detail: `Push the ends${braces.length ? " and the two braces" : ""} onto the cam bolts between the rails and lock the ${num(2 * crossIds.length)} cams.`,
    fix: [
      fx(CAM, [-1, 1].map((sz): Vec3 => [-pxi, pY, sz * (pzi - 25)]), [-1, 0, 0], "P11l"),
      fx(CAM, [-1, 1].map((sz): Vec3 => [pxi, pY, sz * (pzi - 25)]), [1, 0, 0], "P11r"),
      ...braces.map((x, i) => fx(CAM, [-1, 1].map((sz): Vec3 => [x - Math.sign(x) * (T / 2), pY, sz * (pzi - 25)]), [Math.sign(x), 0, 0], `P12-${i}`)),
    ],
    wait: crossIds,
    from: offset(pIds, pOff),
    tools: ["screwdriver"],
  });
  const corners: [number, number][] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  const pbY = P - 12;
  steps.push({
    title: "Screw a bracket into each corner of the plinth",
    detail: "Two small screws in each: one into the rail, one into the end.",
    fix: [
      ...corners.map(([sx, sz]) => fx(PLINTH_BRACKET, [[sx * pxi, pbY, sz * pzi]], [0, 0, sz], sz > 0 ? "P10f" : "P10b")),
      ...corners.map(([sx, sz]) => fx(PLINTH_SCREW, [[sx * (pxi - 25), pbY, sz * pzi]], [0, 0, sz], sz > 0 ? "P10f" : "P10b")),
      ...corners.map(([sx, sz]) => fx(PLINTH_SCREW, [[sx * pxi, pbY, sz * (pzi - 25)]], [sx, 0, 0], sx < 0 ? "P11l" : "P11r")),
    ],
    tools: ["screwdriver"],
  });
  // the plinth onto the bottom: dowels in its top edges, screws up through it (12 on the chest, 8 on the bedside)
  const longX = cols === 2 ? [-480, -160, 160, 480] : [-px * 0.55, px * 0.55];
  const ptPts = (y: number): { id: string; pts: Vec3[] }[] => [
    { id: "P10f", pts: longX.map((x): Vec3 => [x, y, pz - T / 2]) },
    { id: "P10b", pts: longX.map((x): Vec3 => [x, y, -(pz - T / 2)]) },
    { id: "P11l", pts: (cols === 2 ? [0] : [-pzi * 0.45, pzi * 0.45]).map((z): Vec3 => [-(px - T / 2), y, z]) },
    { id: "P11r", pts: (cols === 2 ? [0] : [-pzi * 0.45, pzi * 0.45]).map((z): Vec3 => [px - T / 2, y, z]) },
    ...braces.map((x, i) => ({ id: `P12-${i}`, pts: [[x, y, 0] as Vec3] })),
  ];
  steps.push({
    title: "Fix the plinth under the bottom",
    detail: "Lay the bottom upside down, push dowels into the plinth's top edges, set the plinth on it and drive the long screws through the plinth into the bottom.",
    fix: [...ptPts(P).map((q) => fx(DOWEL, q.pts, [0, -1, 0], q.id, "B2")), ...ptPts(0).map((q) => fx(SCREW, q.pts, [0, 1, 0], q.id, "B2"))],
    wait: ["B2"],
    from: offset(pIds, pOff),
    tools: ["screwdriver"],
  });
  // backs and bottom
  steps.push({
    title: o.backRail ? "Slide in the lower back panel" : "Slide in the back panel",
    detail: o.backRail ? "Smooth side in, along the grooves from the open bottom end until it reaches the back rail." : "Smooth side in, along the grooves from the open bottom end until it reaches the top.",
    add: ["K9"],
    from: { K9: [0, -600, 0] },
    pose: lie,
  });
  const botZ = [-(D / 2 - 60), D / 2 - 60];
  const botScrewZ = [-Math.round(D * 0.12), Math.round(D * 0.12)];
  steps.push({
    title: "Fix the bottom and plinth on",
    detail: `Dowels into the bottom edges of the sides${cols === 2 ? " and the middle panel" : ""}, then push the bottom on and screw through it into each of them.`,
    add: pIds,
    fix: [
      ...uprights.map((x) => fx(DOWEL, botZ.map((z): Vec3 => [x, y0, z]), [0, 1, 0], x === 0 ? "MID" : x < 0 ? "SL" : "SR", "B2")),
      ...uprights.map((x) => fx(SCREW, botScrewZ.map((z): Vec3 => [x, P, z]), [0, 1, 0], "B2", x === 0 ? "MID" : x < 0 ? "SL" : "SR")),
    ],
    from: offset(pIds, pOff),
    pose: lie,
    tools: ["screwdriver"],
  });
  if (cols === 2) {
    steps.push(topStep(true));
    steps.push({
      title: "Stand it up and slide in the upper back panel",
      detail: "Lower it down the grooves from the open top until it sits on the back rail.",
      add: ["K20"],
      from: { K20: [0, 600, 0] },
      pose: "+y",
    });
    steps.push({
      title: "Fix the top on",
      detail: "Dowels into the top edges of the sides, the middle panel and the top rail. Lower the top onto them, lock the six cams and drive two screws up through the top rail.",
      add: ["T1"],
      fix: [...topDowels, ...topCams, railScrews],
      tools: ["screwdriver"],
    });
  }
  // corner blocks behind the backs, screwed to the sides
  const backs = o.backRail
    ? [
        { id: "K9", ys: [y0 + 25, y8 - 45] },
        { id: "K20", ys: [y8 + 45, y1 - 30] },
      ]
    : [{ id: "K9", ys: [y0 + 25, y1 - 30] }];
  steps.push({
    title: "Hold the back" + (o.backRail ? "s" : "") + " in with the corner blocks",
    detail: `${cols === 1 ? "Stand it up and turn it round" : "Turn it round"}. Press a block into each corner behind the back${o.backRail ? " panels" : ""} and fix it to the side with a small screw.`,
    fix: [
      ...backs.flatMap((b) => [-1, 1].map((sx) => fx(BLOCK, b.ys.map((y): Vec3 => [sx * (xi - 11), y, zk]), [0, 0, 1], b.id))),
      ...backs.flatMap((b) => sides.map((sd) => fx(BLOCK_SCREW, b.ys.map((y, j): Vec3 => [sd.sx * xi, y + (j ? -22 : 22), zk - 9]), [sd.sx, 0, 0], sd.id))),
    ],
    pose: "+y",
    tools: ["screwdriver"],
  });
  const wy = y1 - 20;
  steps.push({
    title: "Fix it to the wall",
    detail: `Push it against the wall and mark through the bracket${wallX.length > 1 ? "s" : ""}, then drill, push in the plug${wallX.length > 1 ? "s" : ""} from the box and screw the bracket${wallX.length > 1 ? "s" : ""} to the wall. Check for pipes and cables first.`,
    fix: [fx(WALL_PLUG, wallX.map((x): Vec3 => [x, wy, -D / 2 - 25]), [0, 0, -1]), fx({ ...SCREW, included: true }, wallX.map((x): Vec3 => [x, wy, zg - 15]), [0, 0, -1], "T1")],
    tools: ["drill", "screwdriver", "pencil"],
    wall: true,
    warnings: ["wall", "tip"],
  });

  // the drawers, built in front of the carcass
  const dOff: Vec3 = [0, 0, 420];
  const idsOf = (d: Drawer) => [d.front, d.sl, d.sr, d.bottom, d.back, ...(d.brace ? [d.brace] : [])];
  const dFix = (list: Drawer[], what: "box" | "back" | "runners"): CustomFix[] =>
    list.flatMap((d) => {
      const ys = [d.y + 35, d.y + sh - 35];
      const per = (fn: (g: number, sd: string) => CustomFix[]) => [...fn(-1, d.sl), ...fn(1, d.sr)];
      if (what === "box")
        // cam bolts and a dowel in the front for each side (and a bolt for the brace), cam locks in the sides
        return [
          ...per((g, sd) => [fx(CAM_BOLT, ys.map((y): Vec3 => [d.cx + g * xs, y, zf]), [0, 0, 1], d.front, sd), fx(DOWEL, [[d.cx + g * xs, d.y + sh / 2, zf]], [0, 0, 1], d.front, sd)]),
          ...(d.brace ? [fx(CAM_BOLT, [[d.cx - 14, d.y + 21, zf]], [0, 0, 1], d.front, d.brace)] : []),
          ...per((g, sd) => [fx(CAM, ys.map((y): Vec3 => [d.cx + g * (xs - T / 2), y, zf - 25]), [g, 0, 0], sd)]),
        ];
      if (what === "back")
        return [
          ...(d.brace ? [fx(DOWEL, [[d.cx + 14, d.y + 21, zf]], [0, 0, 1], d.front, d.brace), fx(CAM, [[d.cx - 14, d.y + 13.5 + T, zf - 25]], [0, -1, 0], d.brace)] : []),
          ...per((g, sd) => [fx(SCREW, ys.map((y): Vec3 => [d.cx + g * (xs + T / 2), y, zb + T / 2]), [-g, 0, 0], sd, d.back)]),
          ...(d.brace ? [fx(SCREW, [-15, 15].map((x): Vec3 => [d.cx + x, d.y + 21, zb]), [0, 0, 1], d.back, d.brace)] : []),
        ];
      return per((g, sd) => [
        fx(runner(RL, g < 0 ? "Drawer runner, left" : "Drawer runner, right"), [[d.cx + g * xs, d.y, zdr(d.c)]], [0, 1, 0], sd),
        // three screws clear of the cabinet runner's, which sit right beside them when the drawer is in
        fx(RUNNER_SCREW, (zdr(d.c) < zrun(d.c) ? [0.65, 0.15, -0.6] : [0.6, -0.15, -0.65]).map((k): Vec3 => [d.cx + g * (xs + T / 2), d.y + 8, zrun(d.c) + Math.round(k * hrl)]), [-g, 0, 0], sd),
      ]);
    });
  const colName = (c: number) => (cols === 1 ? "" : c === 0 ? "left " : "right ");
  for (let c = 0; c < cols; c++) {
    const list = drawers.filter((d) => d.c === c);
    const n = list.length;
    const ids = list.flatMap(idsOf);
    const fronts = list.map((d) => d.front);
    steps.push({
      title: `Build the ${colName(c)}drawer boxes`,
      detail: `For each of the ${num(n)} ${cols === 2 ? `fronts marked ${c === 0 ? N.frontL : N.frontR}` : "fronts"}: lay it face down on a rug, turn in the cam bolts and push in the dowels, press the sides onto them and lock the cams${o.bottomLate ? "" : ", then slide the bottom down the grooves"}.`,
      fix: dFix(list, "box"),
      wait: [...fronts, ...list.flatMap((d) => [d.sl, d.sr, ...(o.bottomLate ? [] : [d.bottom])])],
      from: offset(ids, dOff),
      tools: ["screwdriver"],
      pose: "+y",
      kind: "drawer",
      warnings: ["floor"],
    });
    steps.push({
      title: N.brace ? "Fit the braces and backs" : "Slide in the bottoms and screw on the backs",
      detail: N.brace
        ? "Stand a brace on each front over the bottom, on its dowel and cam, then put the back on and drive six screws: two through each side and two through the back into the brace."
        : "Slide each bottom down the grooves to the front, put the back on between the sides and drive two screws through each side into it.",
      fix: dFix(list, "back"),
      wait: list.flatMap((d) => [d.back, ...(d.brace ? [d.brace] : []), ...(o.bottomLate ? [d.bottom] : [])]),
      from: offset(ids, dOff),
      tools: ["screwdriver"],
      kind: "drawer",
    });
    steps.push({
      title: "Screw the runners onto the drawers",
      detail: "Left runners on the left sides and right runners on the right, along the bottom edge with the wheel at the back, three screws each.",
      fix: dFix(list, "runners"),
      tools: ["screwdriver"],
      kind: "runners",
    });
  }
  steps.push({
    title: drawers.length > 2 ? `Slide all ${num(drawers.length)} drawers in` : "Slide both drawers in",
    detail: `${cols === 2 ? `Fronts marked ${N.frontL} go in the left column and ${N.frontR} in the right. ` : ""}Rest each drawer's runners on the ones in the ${cols === 2 ? "chest" : "table"} and push it home. Open only one drawer at a time.`,
    add: drawers.flatMap(idsOf),
    from: offset(drawers.flatMap(idsOf), dOff),
    kind: "drawer",
    warnings: ["tip"],
  });
  return { parts: p.list, steps };
}

/* ---------- the entertainment unit ---------- */

const HINGE: Def = { kind: "hinge", len: 50, dia: 35, name: "Hinge" };
const HALF_HINGE: Def = { kind: "hinge", len: 52, dia: 35, name: "Cranked hinge" };
const HINGE_SCREW: Def = { kind: "screw", len: 14, dia: 3.5, name: "Hinge screw" };
const SHELF_SUPPORT: Def = { kind: "pin", len: 16, dia: 5, name: "Shelf support" };

/**
 * Three bays behind three doors: two sides and two dividers between the top and the bottom, a top front rail, three
 * backs in grooves and a plinth frame under the bottom. The doors overlay the front and the top covers them.
 * The left door hangs on the left side; the middle one on the right divider (cranked hinges, as that divider is shared
 * with the right door's edge); the right one on the right side.
 */
function tvUnit(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const P = 60;
  const zfc = D / 2 - FT; // the carcass's front, behind the doors
  const zbk = -D / 2;
  const zc = (zfc + zbk) / 2;
  const Dc = zfc - zbk;
  const xi = W / 2 - T;
  const y0 = P + T, y1 = H - T;
  const RH = 50;
  const zk = zbk + 18; // backs' outside face
  const xd = W / 6; // divider centres
  const p = new Parts();
  p.add("T1", "1", "Top", [W, T, D], [0, H - T / 2, 0]);
  p.add("B2", "2", "Bottom", [W, T, Dc], [0, P + T / 2, zc]);
  p.add("SL", "3", "Left side", [T, y1 - y0, Dc], [-(W / 2 - T / 2), (y0 + y1) / 2, zc]);
  p.add("SR", "4", "Right side", [T, y1 - y0, Dc], [W / 2 - T / 2, (y0 + y1) / 2, zc]);
  [-1, 1].forEach((g, i) => {
    const m = notched([
      { min: [g * xd - T / 2, y0, zbk], max: [g * xd + T / 2, y1 - RH, zfc] },
      { min: [g * xd - T / 2, y1 - RH, zbk], max: [g * xd + T / 2, y1, zfc - T] },
    ]);
    p.add(i ? "V6" : "V5", i ? "6" : "5", i ? "Right divider" : "Left divider", m.size, m.pos, "board", m.pieces);
  });
  const shelfY = Math.round((y0 + y1 - RH) / 2);
  const shelfD = Dc - 18 - BK - 10;
  p.add("SH", "7", "Shelf", [2 * (xd - T / 2) - 2, T, shelfD], [0, shelfY, zfc - 5 - shelfD / 2]);
  p.add("R8", "8", "Top front rail", [2 * xi, RH, T], [0, y1 - RH / 2, zfc - T / 2]);
  // backs: one per bay, in grooves in the sides and the dividers
  const bays: [number, number][] = [
    [-xi, -xd - T / 2],
    [-xd + T / 2, xd - T / 2],
    [xd + T / 2, xi],
  ];
  const backIds = ["K9a", "K10", "K9b"];
  bays.forEach(([a, b], i) => p.add(backIds[i], i === 1 ? "10" : "9", i === 1 ? "Middle back panel" : "Back panel", [b - a + 16, y1 - y0 + 10, BK], [(a + b) / 2, (y0 + y1) / 2, zk + BK / 2], "fiber"));
  // plinth
  const PI = 25;
  const px = W / 2 - PI, pz = D / 2 - FT / 2 - PI; // (it sits under the carcass, which is shallower than the top)
  const pzc = zc;
  const pxi = px - T, pzi = pz - T;
  p.add("P11f", "11", "Plinth rail", [2 * px, P, T], [0, P / 2, pzc + pz - T / 2]);
  p.add("P11b", "11", "Plinth rail", [2 * px, P, T], [0, P / 2, pzc - pz + T / 2]);
  p.add("P12l", "12", "Plinth end", [T, P, 2 * pzi], [-(px - T / 2), P / 2, pzc]);
  p.add("P12r", "12", "Plinth end", [T, P, 2 * pzi], [px - T / 2, P / 2, pzc]);
  p.add("P13", "13", "Plinth brace", [T, P, 2 * pzi], [0, P / 2, pzc]);
  const plinth = ["P11f", "P11b", "P12l", "P12r", "P13"];
  // doors
  const dw = (W - 4) / 3, dh = y1 - 2 - (P + 2);
  const dx = [-(dw + 2), 0, dw + 2];
  const doorIds = ["D14", "D15", "D16"];
  const doorNames = ["Left door", "Middle door", "Right door"];
  doorIds.forEach((id, i) => p.add(id, String(14 + i), doorNames[i], [dw, dh, FT], [dx[i], P + 2 + dh / 2, D / 2 - FT / 2]));

  const ups = [
    { x: -(W / 2 - T / 2), id: "SL" },
    { x: -xd, id: "V5" },
    { x: xd, id: "V6" },
    { x: W / 2 - T / 2, id: "SR" },
  ];
  const zB = [zc - (Dc / 2 - 100), zc + (Dc / 2 - 100)]; // cam bolts along the top and bottom edges
  const zD = [zc - (Dc / 2 - 45), zc + (Dc / 2 - 45)]; // dowels
  const zS = [zc - Math.round(Dc * 0.12), zc + Math.round(Dc * 0.12)]; // screws through the bottom
  const camFace = (u: (typeof ups)[number]): { x: number; dir: Vec3 } =>
    u.id === "SL" ? { x: -xi, dir: [-1, 0, 0] } : u.id === "SR" ? { x: xi, dir: [1, 0, 0] } : { x: u.x - T / 2, dir: [1, 0, 0] };
  const yR8 = y1 - RH / 2;
  // the sides wait either side of the build, the top further right (staged parts are drawn 1.6 times their offset away)
  const sideOff: Record<string, Vec3> = { SL: [-250, 0, 0], SR: [250, 0, 0], T1: [(W - T + 250 * 1.6 + 120) / 1.6, 0, 0] };
  const wallX = [-(W / 2 - 200), W / 2 - 200];
  const zg = zk + 2;
  const steps: CustomStep[] = [];
  const lie = "-z" as const, flip = "-y" as const;
  steps.push({
    title: "Turn cam bolts into the top and sides and fit the wall straps",
    detail: "Eight cam bolts into the underside of the top and one into each side for the front rail, then screw the two wall straps onto the top's back edge.",
    fix: [
      fx(CAM_BOLT, ups.flatMap((u) => zB.map((z): Vec3 => [u.x, y1, z])), [0, 1, 0], "T1"),
      fx(CAM_BOLT, [[-xi, yR8, zfc - T / 2]], [-1, 0, 0], "SL", "R8"),
      fx(CAM_BOLT, [[xi, yR8, zfc - T / 2]], [1, 0, 0], "SR", "R8"),
      fx({ ...WALL_BRACKET, name: "Wall strap" }, wallX.map((x): Vec3 => [x, y1, zg]), [0, 1, 0], "T1"),
      fx(BRACKET_SCREW, wallX.map((x): Vec3 => [x, y1, zg + 25]), [0, 1, 0], "T1"),
    ],
    wait: ["T1", "SL", "SR"],
    from: sideOff,
    pose: lie,
    tools: ["screwdriver"],
  });
  steps.push({
    title: "Join the sides with the front rail",
    detail: "With the sides on their front edges, push the rail onto their cam bolts and lock a cam at each end.",
    add: ["SL", "SR", "R8"],
    fix: [-1, 1].map((g) => fx(CAM, [[g * (xi - 25), yR8, zfc - T]], [0, 0, 1], "R8")),
    from: { R8: [0, 0, -400] },
    pose: lie,
    tools: ["screwdriver"],
    warnings: ["floor"],
  });
  const sideUps = ups.filter((u) => u.id === "SL" || u.id === "SR");
  const divUps = ups.filter((u) => u.id === "V5" || u.id === "V6");
  steps.push({
    title: "Fix the top on",
    detail: "Dowels into the sides' top edges and the rail, then push the top onto them, lock the four cams and drive two screws through the rail into the top.",
    add: ["T1"],
    fix: [
      ...sideUps.map((u) => fx(DOWEL, zD.map((z): Vec3 => [u.x, y1, z]), [0, -1, 0], u.id, "T1")),
      fx(DOWEL, [-W / 4, W / 4].map((x): Vec3 => [x, y1, zfc - T / 2]), [0, -1, 0], "R8", "T1"),
      ...sideUps.map((u) => fx(CAM, zB.map((z): Vec3 => [camFace(u).x, y1 - 25, z]), camFace(u).dir, u.id)),
      fx(SCREW, [-W / 4 - 60, W / 4 + 60].map((x): Vec3 => [x, y1 - RH, zfc - T / 2]), [0, 1, 0], "R8", "T1"),
    ],
    pose: lie,
    tools: ["screwdriver"],
  });
  steps.push({
    title: "Turn it upside down and fit the dividers",
    detail: "Two dowels into the top edge of each divider, then stand them on the top over its cam bolts and lock two cams in each.",
    add: ["V5", "V6"],
    fix: [...divUps.map((u) => fx(DOWEL, zD.map((z): Vec3 => [u.x, y1, z]), [0, -1, 0], u.id, "T1")), ...divUps.map((u) => fx(CAM, zB.map((z): Vec3 => [camFace(u).x, y1 - 25, z]), camFace(u).dir, u.id))],
    from: { V5: [0, -400, 0], V6: [0, -400, 0] },
    pose: flip,
    tools: ["screwdriver"],
  });
  steps.push({
    title: "Slide in the three back panels",
    detail: "Smooth side in, down the grooves from the open bottom: the one with the cable hole in the middle.",
    add: backIds,
    from: offset(backIds, [0, -600, 0]),
    pose: flip,
  });
  // plinth, built beside it
  const pOff: Vec3 = [(W + 150) / 1.6, 0, 0];
  const pIds = [...plinth, "B2"];
  const pY = 20, pbY = P - 12;
  const rz = [pzc + pzi, pzc - pzi]; // inside faces of the plinth rails
  steps.push({
    title: "Turn cam bolts into the plinth rails",
    detail: "Three into the inside face of each long rail: one at each end and one in the middle.",
    fix: [
      fx(CAM_BOLT, [-(px - T / 2), 0, px - T / 2].map((x): Vec3 => [x, pY, rz[0]]), [0, 0, 1], "P11f"),
      fx(CAM_BOLT, [-(px - T / 2), 0, px - T / 2].map((x): Vec3 => [x, pY, rz[1]]), [0, 0, -1], "P11b"),
    ],
    wait: ["P11f", "P11b"],
    from: offset(pIds, pOff),
    pose: flip,
    tools: ["screwdriver"],
  });
  steps.push({
    title: "Join the plinth frame",
    detail: "Push the two ends and the middle brace onto the cam bolts between the rails and lock the six cams.",
    fix: [
      fx(CAM, [1, -1].map((g): Vec3 => [-pxi, pY, pzc + g * (pzi - 25)]), [-1, 0, 0], "P12l"),
      fx(CAM, [1, -1].map((g): Vec3 => [pxi, pY, pzc + g * (pzi - 25)]), [1, 0, 0], "P12r"),
      fx(CAM, [1, -1].map((g): Vec3 => [-T / 2, pY, pzc + g * (pzi - 25)]), [1, 0, 0], "P13"),
    ],
    wait: ["P12l", "P12r", "P13"],
    from: offset(pIds, pOff),
    pose: flip,
    tools: ["screwdriver"],
  });
  const corners: [number, number][] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  steps.push({
    title: "Screw a bracket into each corner of the plinth",
    detail: "Two small screws in each: one into the rail, one into the end.",
    fix: [
      ...corners.map(([sx, sz]) => fx(PLINTH_BRACKET, [[sx * pxi, pbY, pzc + sz * pzi]], [0, 0, sz], sz > 0 ? "P11f" : "P11b")),
      ...corners.map(([sx, sz]) => fx(PLINTH_SCREW, [[sx * (pxi - 25), pbY, pzc + sz * pzi]], [0, 0, sz], sz > 0 ? "P11f" : "P11b")),
      ...corners.map(([sx, sz]) => fx(PLINTH_SCREW, [[sx * pxi, pbY, pzc + sz * (pzi - 25)]], [sx, 0, 0], sx < 0 ? "P12l" : "P12r")),
    ],
    pose: flip,
    tools: ["screwdriver"],
  });
  // ten dowels and eleven screws: four of each in each rail, one of each in each end, and a screw in the brace
  const longX = [-400, -130, 130, 400];
  const pPts = (y: number, brace: boolean): { id: string; pts: Vec3[] }[] => [
    { id: "P11f", pts: longX.map((x): Vec3 => [x, y, pzc + pz - T / 2]) },
    { id: "P11b", pts: longX.map((x): Vec3 => [x, y, pzc - pz + T / 2]) },
    { id: "P12l", pts: [[-(px - T / 2), y, pzc]] },
    { id: "P12r", pts: [[px - T / 2, y, pzc]] },
    ...(brace ? [{ id: "P13", pts: [[0, y, pzc] as Vec3] }] : []),
  ];
  steps.push({
    title: "Fix the plinth under the bottom",
    detail: "Lay the bottom upside down, push ten dowels into the plinth's top edges, set the plinth on it and drive eleven screws through the plinth into the bottom.",
    fix: [...pPts(P, false).map((q) => fx(DOWEL, q.pts, [0, -1, 0], q.id, "B2")), ...pPts(0, true).map((q) => fx(SCREW, q.pts, [0, 1, 0], q.id, "B2"))],
    wait: ["B2"],
    from: offset(pIds, pOff),
    pose: flip,
    tools: ["screwdriver"],
  });
  steps.push({
    title: "Fix the bottom and plinth on",
    detail: "Two dowels into the bottom edge of each side and divider, then push the bottom on and drive two screws through it into each.",
    add: pIds,
    fix: [...ups.map((u) => fx(DOWEL, zD.map((z): Vec3 => [u.x, y0, z]), [0, 1, 0], u.id, "B2")), ...ups.map((u) => fx(SCREW, zS.map((z): Vec3 => [u.x, P, z]), [0, 1, 0], "B2", u.id))],
    from: offset(pIds, pOff),
    pose: flip,
    tools: ["screwdriver"],
  });
  // corner blocks: one at each corner of each back, screwed to the side or divider beside it
  const bfaces = bays.map(([a, b]) => [
    { x: a, dir: [-1, 0, 0] as Vec3, id: a === -xi ? "SL" : a === -xd + T / 2 ? "V5" : "V6" },
    { x: b, dir: [1, 0, 0] as Vec3, id: b === xi ? "SR" : b === -xd - T / 2 ? "V5" : "V6" },
  ]);
  const bys = [y0 + 25, y1 - 30];
  steps.push({
    title: "Hold the backs in with the corner blocks",
    detail: "Stand it up and turn it round. Press a block into each corner behind the three backs and fix it with a small screw.",
    fix: [
      // (the blocks either side of a divider are staggered, so their screws stay apart)
      ...bfaces.flatMap((fs, i) => fs.map((f) => fx(BLOCK, bys.map((y, j): Vec3 => [f.x - f.dir[0] * 11, y + (f.dir[0] < 0 ? (j ? -22 : 22) : 0), zk]), [0, 0, 1], backIds[i]))),
      ...bfaces.flatMap((fs) => fs.map((f) => fx(BLOCK_SCREW, bys.map((y, j): Vec3 => [f.x, y + (j ? -22 : 22) * (f.dir[0] < 0 ? 2 : 1), zk - 9]), f.dir, f.id))),
    ],
    pose: "+y",
    tools: ["screwdriver"],
  });
  // doors: hinge cups 80 mm from the top and bottom, 22 mm in from the hinge edge
  const hy = [P + 2 + 80, P + 2 + dh - 80];
  const doors = [
    { id: "D14", edge: dx[0] - dw / 2, g: 1, def: HINGE, face: -xi, fdir: [-1, 0, 0] as Vec3, on: "SL" },
    { id: "D15", edge: dx[1] + dw / 2, g: -1, def: HALF_HINGE, face: xd - T / 2, fdir: [1, 0, 0] as Vec3, on: "V6" },
    { id: "D16", edge: dx[2] + dw / 2, g: -1, def: HINGE, face: xi, fdir: [1, 0, 0] as Vec3, on: "SR" },
  ];
  const cupX = (d: (typeof doors)[number]) => d.edge + d.g * 22;
  const doorFix = (d: (typeof doors)[number]): CustomFix[] => [
    fx(d.def, hy.map((y): Vec3 => [cupX(d), y, zfc]), [0, 0, 1], d.id, undefined, d.g < 0 ? { twist: Math.PI } : {}),
    fx(HINGE_SCREW, hy.flatMap((y) => [-12, 12].map((k): Vec3 => [cupX(d) + d.g * 24, y + k, zfc])), [0, 0, 1], d.id),
  ];
  const dOff: Vec3 = [0, 0, 400];
  steps.push({
    title: "Screw the hinges onto the outer doors",
    detail: "Lay the left and right doors face down on a rug and press a hinge into each cup hole, two screws each. Use the straight hinges here.",
    fix: [...doorFix(doors[0]), ...doorFix(doors[2])],
    wait: ["D14", "D16"],
    from: offset(doorIds, dOff),
    pose: "+y",
    tools: ["screwdriver"],
    warnings: ["floor"],
  });
  steps.push({
    title: "Screw the cranked hinges onto the middle door",
    detail: "The two hinges with the bent arm go on the middle door, two screws each.",
    fix: doorFix(doors[1]),
    wait: ["D15"],
    from: offset(doorIds, dOff),
    tools: ["screwdriver"],
  });
  steps.push({
    title: "Hang the doors",
    detail: "Hold each door in place and screw its hinge plates to the side or divider, four screws each: the left door on the left side, the middle door on the right divider, the right door on the right side.",
    add: doorIds,
    fix: doors.map((d) => fx(HINGE_SCREW, hy.flatMap((y) => [-16, 16].flatMap((k) => [zfc - 20, zfc - 52].map((z): Vec3 => [d.face, y + k, z]))), d.fdir, d.on, d.id)),
    from: offset(doorIds, dOff),
    tools: ["screwdriver"],
  });
  const sz = [zfc - 5 - 50, zfc - 5 - shelfD + 50];
  steps.push({
    title: "Push in the shelf supports",
    detail: "Two in each divider inside the middle bay, at the height you want the shelf.",
    fix: [fx(SHELF_SUPPORT, sz.map((z): Vec3 => [-xd + T / 2, shelfY - T / 2 - 3, z]), [-1, 0, 0], "V5"), fx(SHELF_SUPPORT, sz.map((z): Vec3 => [xd - T / 2, shelfY - T / 2 - 3, z]), [1, 0, 0], "V6")],
  });
  steps.push({
    title: "Slide the shelf in",
    detail: "Rest it on the four supports in the middle bay.",
    add: ["SH"],
    from: { SH: [0, 0, 450] },
    kind: "shelves",
  });
  const wy = y1 - 20;
  steps.push({
    title: "Fix it to the wall",
    detail: "Push it against the wall and mark through the two straps, then drill, push in the plugs from the box and screw the straps to the wall. Check for pipes and cables first, and fix the TV to the wall too.",
    fix: [fx(WALL_PLUG, wallX.map((x): Vec3 => [x, wy, -D / 2 - 25]), [0, 0, -1]), fx({ ...SCREW, included: true }, wallX.map((x): Vec3 => [x, wy, zg - 15]), [0, 0, -1], "T1")],
    tools: ["drill", "screwdriver", "pencil"],
    wall: true,
    warnings: ["wall", "tip"],
  });
  return { parts: p.list, steps };
}

/* ---------- the 2 tier shoe cabinet ---------- */

const STOP_BLOCK: Def = { kind: "clip", len: 12, dia: 26, name: "Stop block" };
const BUSH: Def = { kind: "cap", len: 3, dia: 20, name: "Pivot bush" };
const PIVOT_CAP: Def = { kind: "washer", len: 2, dia: 18, name: "Pivot cap" };
const SMALL_SCREW: Def = { kind: "screw", len: 14, dia: 3.5 };
const TRAY_SCREW: Def = { kind: "screw", len: 18, dia: 4 };
const BLOCK_SCREW_M: Def = { kind: "screw", len: 16, dia: 3 };
const FLIP_L: Def = { kind: "connector", len: 160, dia: 120, name: "Flip fitting, left" };
const FLIP_R: Def = { kind: "connector", len: 160, dia: 120, name: "Flip fitting, right" };

/**
 * Two sides standing on the floor, joined by a top back rail, a middle and a bottom back rail and a kick rail at the
 * front, with the top on cam bolts. Each flip down door carries a pair of pivot fittings and a shoe tray, and pivots
 * on bushes in the sides. There is no bottom and no back: the top back rail is screwed to the wall.
 */
function shoeCabinet(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xi = W / 2 - T, y1 = H - T;
  const RH = 80;
  const zb = -D / 2 + T / 2, zfr = D / 2 - T / 2; // back rails, kick rail
  const p = new Parts();
  p.add("T1", "1", "Top", [W, T, D], [0, H - T / 2, 0]);
  p.add("S2", "2", "Left side", [T, y1, D], [-(W / 2 - T / 2), y1 / 2, 0]);
  p.add("S3", "3", "Right side", [T, y1, D], [W / 2 - T / 2, y1 / 2, 0]);
  const yMid = Math.round((RH + y1) / 2);
  const rails = [
    { id: "R4", label: "4", name: "Top back rail", y: y1 - RH / 2, z: zb },
    { id: "R5m", label: "5", name: "Rail", y: yMid, z: zb },
    { id: "R5b", label: "5", name: "Rail", y: RH / 2, z: zb },
    { id: "R5f", label: "5", name: "Rail", y: RH / 2, z: zfr },
  ];
  for (const r of rails) p.add(r.id, r.label, r.name, [2 * xi, RH, T], [0, r.y, r.z]);
  // the doors, inside the sides between the kick rail and the top, and what each carries
  const dh = (y1 - RH - 6) / 2;
  const doors = [0, 1].map((i) => {
    const yc = RH + 2 + dh / 2 + i * (dh + 2);
    return { i, yc, id: `D6-${i}`, t7: `T7a-${i}`, t8: `T8-${i}`, t7b: `T7b-${i}` };
  });
  const tl = 2 * xi - 16; // tray boards run between the fittings
  const zdb = D / 2 - T; // the doors' back face
  for (const d of doors) {
    p.add(d.id, "6", "Door", [2 * xi - 4, dh, T], [0, d.yc, D / 2 - T / 2]);
    p.add(d.t7, "7", "Tray panel", [tl, 100, 12], [0, d.yc + 80, 30]);
    p.add(d.t8, "8", "Tray strip", [tl, 12, 50], [0, d.yc - dh / 2 + 26, zdb - 25]);
    p.add(d.t7b, "7", "Tray panel", [tl, 100, 12], [0, d.yc - 40, -10]);
  }
  const sides = [
    { id: "S2", g: -1 },
    { id: "S3", g: 1 },
  ];
  const pivot = (d: (typeof doors)[number]) => ({ y: d.yc - 120, z: 65 });
  const stop = (d: (typeof doors)[number]) => ({ y: d.yc + 120, z: 80 });
  const topZ = [-(D / 2 - 50), D / 2 - 50];
  const railX = [-W / 6, W / 6];
  const steps: CustomStep[] = [];
  const lie = "-z" as const, onSide = "+x" as const;
  steps.push({
    title: "Turn in the cam bolts and fit the stop blocks and bushes",
    detail: "Lay the top and both sides inside face up. Six cam bolts go into the top and eight into each side, then screw two stop blocks onto each side and tap in the two round bushes.",
    fix: [
      fx(CAM_BOLT, [...[-1, 1].flatMap((g) => topZ.map((z): Vec3 => [g * (W / 2 - T / 2), y1, z])), ...railX.map((x): Vec3 => [x, y1, zb])], [0, 1, 0], "T1"),
      ...sides.map((sd) => fx(CAM_BOLT, rails.flatMap((r) => [-18, 18].map((k): Vec3 => [sd.g * xi, r.y + k, r.z])), [sd.g, 0, 0], sd.id)),
      ...sides.map((sd) => fx(STOP_BLOCK, doors.map((d): Vec3 => [sd.g * xi, stop(d).y, stop(d).z]), [sd.g, 0, 0], sd.id)),
      ...sides.map((sd) => fx(BLOCK_SCREW_M, doors.flatMap((d) => [-24, 24].map((k): Vec3 => [sd.g * xi, stop(d).y, stop(d).z + k])), [sd.g, 0, 0], sd.id)),
      ...sides.map((sd) => fx(BUSH, doors.map((d): Vec3 => [sd.g * xi, pivot(d).y, pivot(d).z]), [sd.g, 0, 0], sd.id)),
    ],
    wait: ["T1", "S2", "S3"],
    from: { S2: [-250, 0, 0], S3: [250, 0, 0], T1: [(W / 2 + W / 2 + 250 * 1.6 + 120) / 1.6, 0, 0] },
    pose: lie,
    tools: ["screwdriver", "hammer"],
    warnings: ["floor"],
  });
  steps.push({
    title: "Join the sides with the four rails",
    detail: "With the sides on their front edges, push the top back rail, the middle and bottom back rails and the kick rail onto the cam bolts, then lock the sixteen cams.",
    add: ["S2", "S3", ...rails.map((r) => r.id)],
    fix: rails.flatMap((r) => {
      const zf = r.z < 0 ? r.z + T / 2 : r.z - T / 2; // the face that looks into the cabinet
      return [-1, 1].map((g) => fx(CAM, [-18, 18].map((k): Vec3 => [g * (xi - 25), r.y + k, zf]), [0, 0, r.z < 0 ? -1 : 1], r.id));
    }),
    from: offset(rails.map((r) => r.id), [0, 0, -400]),
    pose: lie,
    tools: ["screwdriver"],
  });
  steps.push({
    title: "Fix the top on",
    detail: "Dowels into the top edges of the sides and the top back rail, then push the top onto them and lock its six cams.",
    add: ["T1"],
    fix: [
      ...sides.map((sd) => fx(DOWEL, [-20, 20].map((z): Vec3 => [sd.g * (W / 2 - T / 2), y1, z]), [0, -1, 0], sd.id, "T1")),
      fx(DOWEL, railX.map((x): Vec3 => [x + Math.sign(x) * 60, y1, zb]), [0, -1, 0], "R4", "T1"),
      ...sides.map((sd) => fx(CAM, topZ.map((z): Vec3 => [sd.g * xi, y1 - 25, z]), [sd.g, 0, 0], sd.id)),
      fx(CAM, railX.map((x): Vec3 => [x, y1 - 25, zb + T / 2]), [0, 0, -1], "R4"),
    ],
    pose: lie,
    tools: ["screwdriver"],
  });
  const dOff: Vec3 = [0, 0, 400];
  const dIds = doors.flatMap((d) => [d.id, d.t7, d.t8]);
  const fitX = xi - 6; // the fittings stand just inside the sides
  steps.push({
    title: "Screw the flip fittings onto the doors",
    detail: "Tip the cabinet onto its left side, ready for the doors. Lay each door face down on a rug: the left fitting goes at its left end and the right fitting at its right end, three screws each.",
    fix: doors.flatMap((d) => [
      fx(FLIP_L, [[-fitX, d.yc - 60, zdb - 60]], [-1, 0, 0], d.id),
      fx(FLIP_R, [[fitX, d.yc - 60, zdb - 60]], [1, 0, 0], d.id),
      fx(SMALL_SCREW, [-1, 1].flatMap((g) => [-50, 0, 50].map((k): Vec3 => [g * (xi - 12), d.yc - 60 + k, zdb])), [0, 0, 1], d.id),
    ]),
    wait: doors.map((d) => d.id),
    from: offset(dIds, dOff),
    pose: onSide,
    tools: ["screwdriver"],
    kind: "doors",
    warnings: ["floor"],
  });
  const ends = (id: string, y: number, z: number): CustomFix[] => [-1, 1].map((g) => fx(TRAY_SCREW, [[g * (tl / 2), y, z]], [-g, 0, 0], id));
  steps.push({
    title: "Screw a shoe tray onto each door",
    detail: "A tray panel across the top of the fittings and the strip across the bottom, one screw through the fitting into each end.",
    fix: doors.flatMap((d) => [...ends(d.t7, d.yc + 80, 30), ...ends(d.t8, d.yc - dh / 2 + 26, zdb - 25)]),
    wait: doors.flatMap((d) => [d.t7, d.t8]),
    from: offset(dIds, dOff),
    pose: onSide,
    tools: ["screwdriver"],
  });
  steps.push({
    title: "Fit the doors into the cabinet",
    detail: "Set each door's pivots against the round bushes in the sides, then fix each pivot with a cap and a screw.",
    add: dIds,
    kind: "doors",
    fix: [
      ...sides.map((sd) => fx(PIVOT_CAP, doors.map((d): Vec3 => [sd.g * xi, pivot(d).y, pivot(d).z]), [sd.g, 0, 0], sd.id)),
      ...sides.map((sd) => fx(SMALL_SCREW, doors.map((d): Vec3 => [sd.g * xi, pivot(d).y, pivot(d).z]), [sd.g, 0, 0], sd.id)),
    ],
    from: offset(dIds, dOff),
    pose: onSide,
    tools: ["screwdriver"],
  });
  const wallX = [-W / 4, W / 4];
  const wy = y1 - RH / 2;
  steps.push({
    title: "Stand it up and fix it to the wall",
    detail: "Push it against the wall and mark through the two holes in the top back rail, then drill, push in the plugs from the box and drive the two long screws through the rail. Check for pipes and cables first.",
    fix: [fx(WALL_PLUG, wallX.map((x): Vec3 => [x, wy, -D / 2 - 25]), [0, 0, -1]), fx({ kind: "screw", len: 40, dia: 4, name: "Wall screw", included: true }, wallX.map((x): Vec3 => [x, wy, zb + T / 2]), [0, 0, -1], "R4")],
    pose: "+y",
    tools: ["drill", "screwdriver", "pencil"],
    wall: true,
    warnings: ["wall", "tip"],
  });
  steps.push({
    title: "Screw in the second tray panels",
    detail: "Tip each door open and screw the other tray panel between its fittings, one screw at each end.",
    add: doors.map((d) => d.t7b),
    fix: doors.flatMap((d) => ends(d.t7b, d.yc - 40, -10)),
    from: offset(
      doors.map((d) => d.t7b),
      [0, 0, 300],
    ),
    tools: ["screwdriver"],
  });
  return { parts: p.list, steps };
}

const CHEST6 = {
  top: "1",
  bottom: "2",
  left: "3",
  right: "4",
  mid: "5",
  topRail: "6",
  rail: "7",
  backRail: "8",
  lowBack: "9",
  pRail: "10",
  pEnd: "11",
  pBrace: "12",
  frontL: "13",
  frontR: "14",
  sideR: "15",
  sideL: "16",
  dBack: "17",
  brace: "18",
  dBottom: "19",
  upBack: "20",
};

const BEDSIDE = {
  top: "1",
  bottom: "2",
  left: "3",
  right: "4",
  topRail: "5",
  rail: "6",
  back: "7",
  pRail: "8",
  pEnd: "9",
  front: "10",
  sideR: "11",
  sideL: "12",
  dBack: "13",
  dBottom: "14",
};

function recipe(s: ProductSpec): CustomParams | null {
  switch (s.slug) {
    case "kmart-charlie-6-drawer-chest":
      return chest(s, { cols: 2, rows: 3, plinth: 60, backRail: true, N: CHEST6 });
    case "kmart-charlie-2-drawer-bedside-table":
      return chest(s, { cols: 1, rows: 2, plinth: 60, backRail: false, bottomLate: true, N: BEDSIDE });
    case "kmart-charlie-entertainment-unit":
      return tvUnit(s);
    case "kmart-charlie-2-tier-shoe-cabinet":
      return shoeCabinet(s);
    default:
      // the side table and the 2 door storage cabinet: no manual read, so their kinds build them
      return null;
  }
}

const family: Family = { names: ["KMART:CHARLIE"], recipe };
export default family;
