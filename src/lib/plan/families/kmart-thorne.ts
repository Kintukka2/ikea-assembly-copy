import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartMaterial, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's Thorne range (anko), read from its assembly manuals. All of it is 15 mm board held with cam bolts, cam locks,
 * wooden dowels and screws, and every piece stands on four round legs: the cabinets in a low frame screwed under the
 * bottom, the coffee table in the corners of its rails.
 *
 * - Bookshelf, Walnut, keycode 43683390 (its 11 page manual): with the bookshelf lying on its right side, two dividers
 *   are dowelled between the three shelves, the shelves go onto the right side (4) on cam bolts, the two middle back
 *   panels slide down their grooves and the left side (3) goes on. The top back panel slides in from the open top and
 *   the top (1) goes on with the third divider under it, then the bottom back panel slides in and the bottom (2) is
 *   dowelled and screwed on with the last divider. Lying on its back it takes the leg frame, the corner brackets and
 *   the legs; standing, 16 clips hold the four back panels and two brackets fix it to the wall. Hardware: 16 cam bolts
 *   6 x 35 (a), 16 cam locks (b), 44 dowels 6 x 30 (c), 4 screws 4 x 35 (d), 16 back panel clips with their screws (m),
 *   8 long screws 4 x 55 (f), 16 screws 4 x 25 (g), 8 leg screws 6 x 55 with two washers each (h), 2 wall brackets with
 *   a 4 x 12 screw (i), 2 wall plugs with a 4 x 35 screw (j).
 * - Bookshelf Storage, Standard, 43114627 (the bookshelf's other, 4 page manual): the same carcass, frame and legs
 *   (bookcaseCarcass() and legFrame() build both), but a different build. All four dividers are dowelled to the shelves
 *   first and both sides go on in one step, then the top and the bottom; lying on its back it takes the leg frame,
 *   brackets and legs, then on its front four back panels (8 at the top and the bottom, 13 between) are nailed over the
 *   back edges and pinned along the joins, and standing it takes the wall brackets. Hardware: the Walnut list without
 *   the clips (m), plus 20 nails (e) and 6 round-head pins (k). Its step 7 count box says 16 nails, but its drawing
 *   places 20 and the hardware list has 20: the guide drives 20.
 * - 4 Drawer Chest, Walnut, 43683406: the four drawers are built first (sides 16 and 17 and the brace 10 screwed to the
 *   back 9, the bottom 11 slid in, the front 8 on cam bolts and cam locks). Lying on its left side (3), the top rail (6),
 *   three front rails and the back rail (all 7) stand on it on cam bolts and dowels and the right side (4) goes on top.
 *   The two back panels (5) slide in from either end, the top (1) goes on (its front cam bolts lock into the top rail),
 *   then on its top the bottom (2) is screwed on and it takes the leg frame (12, 13), brackets (14) and legs (15).
 *   Standing, the drawers slide in, eight clips hold the back panels and two straps fix it to the wall. Hardware: 32 cam
 *   bolts (a), 32 cam locks (b), 30 dowels (c), 30 screws 4 x 35 (d), 16 screws 4 x 25 (f), 8 leg screws 6 x 55 with
 *   washers (g), 8 long screws 4 x 55 (h), 2 wall straps with a washer and screw (i), 2 wall plugs with a washer and
 *   screw (j), 8 back panel clips with screws (k). The runners come fitted to the sides (3, 4, 16, 17).
 * - Buffet Unit, 42942115: three drawers are built first (18 and 19 screwed to the back 20, the bottom 21 slid in, the
 *   front 17 cam-locked on). Lying on its back, the left side (3), the dividers (5, 6) and the right side (4) are
 *   dowelled to three top rails (8, long dowels through the dividers) and two drawer rails (7); the top (1) and then
 *   the bottom (2) go on. Upside down it takes the leg frame (13, 14), brackets (15) and legs (16); standing, two back
 *   panels (12) are nailed on, the doors hang on two hinges each with the shelf supports pushed in, the shelves (11) and
 *   drawers slide in and two straps fix it to the wall. Hardware: 20 cam bolts (a), 20 cam locks (b), 42 dowels (c), 26
 *   screws 4 x 35 (d), 2 wall straps with a washer and a 4 x 12 screw (e), 2 wall plugs with a washer and a 4 x 35 screw
 *   (f), 2 hinges (g), 2 cranked hinges (h), 24 hinge screws 4 x 14 (i), 8 shelf supports (j), 16 nails 2 x 16 (k), 12
 *   long screws 4 x 55 (l), 16 screws 4 x 25 (m), 8 leg screws 6 x 55 with washers (n), 4 long dowels 6 x 50 (o). The
 *   runners come fitted to the right side (4), the right divider (6) and the drawer sides.
 * - Coffee Table, Walnut, 43683369: upside down on its top (1), two long rails (3) and two short rails (4) go on with
 *   8 dowels (b) and 12 long screws 4 x 55 (a), a corner bracket (5) goes in each corner with 16 screws 4 x 25 (c), the
 *   legs (6) are screwed through the brackets with 8 leg screws 6 x 55 and their washers (d), and the shelf (2) sits on
 *   four brackets screwed to the legs (e: each a bracket with two screws). The last step turns it over.
 *
 * The leg frame is the same under all three cabinets: two rails and two ends dowelled under the bottom and screwed into
 * it with long screws, a corner bracket screwed across each inside corner, and a leg in each corner held by two screws
 * (each with a flat and a spring washer) through the bracket. legFrame() and legSteps() build it, drawer() builds a
 * drawer on its fitted runners, backClips() and wallStraps() the clips and straps at the back, so the Thorne bedside
 * table, entertainment unit and dining table can use them too. None of the manuals prints a size: the chest and the
 * bookshelf keep their earlier rows' sizes, the buffet and the coffee table take Kmart's listings, and panel sizes
 * come from those and the drawings (legs 140 mm under the bottom, a 45 mm frame).
 *
 * Readings: the bookshelf's step 11 count box repeats step 10's (16 screws g), but its drawing and the hardware list give
 * the legs 8 leg screws (h), two each: the guide follows those. The buffet's hinges g go on the left door, hung on the
 * left side, and the cranked hinges h on the right door, hung on the right divider whose edge the drawer fronts share.
 * The chest's step 1 builds all four drawers at once and does two jobs (the box, then the front), so it is two guide
 * steps; its step 10 clips the back panels and fixes it to the wall, so it is two as well. The coffee table's step 5
 * only shows it standing, but it is the step that turns the table over, so it stays a step.
 * Part numbers and hardware letters are Kmart's own, so the guide reads against the paper.
 */

const T = 15; // every board
const BK = 3; // back panels and drawer bottoms
const FT = 15; // doors and drawer fronts
const LEG = 140; // the cabinets' legs: the underside of the bottom stands this high
const FH = 45; // the leg frame under a cabinet
const FW = 15; // its rails' thickness
const FI = 30; // it stands in this far from the bottom's edges
const LD = 40; // leg diameter
const SPLAY = 0.09; // the cabinets' legs lean out this far (radians), the coffee table's less
const R2 = Math.SQRT1_2;

type Def = { kind: CustomFix["kind"]; len: number; dia: number; name?: string; included?: boolean };
const CAM_BOLT: Def = { kind: "camScrew", len: 35, dia: 6, name: "Cam bolt" };
const CAM: Def = { kind: "cam", len: 10, dia: 15, name: "Cam lock" };
const DOWEL: Def = { kind: "dowel", len: 30, dia: 6 };
const LONG_DOWEL: Def = { kind: "dowel", len: 50, dia: 6, name: "Long dowel" };
const SCREW: Def = { kind: "screw", len: 35, dia: 4 };
const LONG_SCREW: Def = { kind: "screw", len: 55, dia: 4, name: "Long screw" };
const BRACKET_SCREW: Def = { kind: "screw", len: 25, dia: 4, name: "Bracket screw" };
const LEG_SCREW: Def = { kind: "screw", len: 55, dia: 6, name: "Leg screw" };
const FLAT_WASHER: Def = { kind: "washer", len: 1.5, dia: 14, name: "Flat washer" };
const SPRING_WASHER: Def = { kind: "washer", len: 1.5, dia: 11, name: "Spring washer" };
const CLIP: Def = { kind: "clamp", len: 16, dia: 12, name: "Back panel clip" };
const CLIP_SCREW: Def = { kind: "screw", len: 12, dia: 3, name: "Clip screw" };
const STRAP: Def = { kind: "strap", len: 110, dia: 20, name: "Wall strap" };
const STRAP_SCREW: Def = { kind: "screw", len: 12, dia: 4, name: "Strap screw" };
const WASHER: Def = { kind: "washer", len: 1.5, dia: 12 };
const WALL_PLUG: Def = { kind: "plug", len: 30, dia: 6, included: true };
const WALL_SCREW: Def = { kind: "screw", len: 35, dia: 4, name: "Wall screw", included: true };
const WALL_BRACKET: Def = { kind: "angle", len: 50, dia: 20, name: "Wall bracket" };
const WALL_BRACKET_SCREW: Def = { kind: "screw", len: 12, dia: 4, name: "Wall bracket screw" };
const HINGE: Def = { kind: "hinge", len: 50, dia: 35, name: "Hinge" };
const CRANKED_HINGE: Def = { kind: "hinge", len: 52, dia: 35, name: "Cranked hinge" };
const HINGE_SCREW: Def = { kind: "screw", len: 14, dia: 4, name: "Hinge screw" };
const SHELF_SUPPORT: Def = { kind: "pin", len: 16, dia: 5, name: "Shelf support" };
const NAIL: Def = { kind: "nail", len: 16, dia: 2 };
const PANEL_PIN: Def = { kind: "nail", len: 20, dia: 2, name: "Round-head pin" };
const SHELF_BRACKET: Def = { kind: "angle", len: 30, dia: 16, name: "Shelf bracket" };
const SHELF_BRACKET_SCREW: Def = { kind: "screw", len: 12, dia: 3.5, name: "Shelf bracket screw" };

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

type Box = { min: Vec3; max: Vec3; material?: PartMaterial };

class Parts {
  list: CustomPart[] = [];
  add(id: string, label: string, name: string, size: Vec3, pos: Vec3, o: Partial<CustomPart> = {}) {
    this.list.push({ id, label, name, size, pos, material: "board", ...o });
    return id;
  }
  /** A part drawn as boxes given in the product's frame: a side with its runners already fitted. */
  boxes(id: string, label: string, name: string, boxes: Box[]) {
    const lo = [0, 1, 2].map((k) => Math.min(...boxes.map((b) => b.min[k]))) as Vec3;
    const hi = [0, 1, 2].map((k) => Math.max(...boxes.map((b) => b.max[k]))) as Vec3;
    const pos = [0, 1, 2].map((k) => (lo[k] + hi[k]) / 2) as Vec3;
    const pieces: PartPiece[] = boxes.map((b) => ({
      shape: "box",
      size: [0, 1, 2].map((k) => b.max[k] - b.min[k]) as Vec3,
      pos: [0, 1, 2].map((k) => (b.min[k] + b.max[k]) / 2 - pos[k]) as Vec3,
      ...(b.material ? { material: b.material } : {}),
    }));
    return this.add(id, label, name, [0, 1, 2].map((k) => hi[k] - lo[k]) as Vec3, pos, { pieces });
  }
}

const SX = [-1, 1] as const;
const CORNERS: [number, number][] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const offset = (ids: string[], v: Vec3) => Object.fromEntries(ids.map((id) => [id, v] as [string, Vec3]));
/** A runner fitted at the factory: a strip of steel along a side's inner face. */
const runnerBox = (x0: number, x1: number, y: number, zf: number, len = 300): Box => ({ min: [x0, y - 15, zf - 5 - len], max: [x1, y + 15, zf - 5], material: "metal" });

/* ---------- legs: the leg frame, corner brackets and legs ---------- */

/** A leg standing in a corner, its top at (xl, zl) and its foot leaning out by `a` both ways. */
function legAt(sx: number, sz: number, xl: number, zl: number, zc: number, len: number, a: number): Partial<CustomPart> {
  const out = (len / 2) * a;
  return { pos: [sx * (xl + out), len / 2, zc + sz * (zl + out)], ...(a ? { rot: [-sz * a, 0, sx * a] as Vec3 } : {}) };
}

interface Corner {
  sx: number;
  sz: number;
  xin: number; // |x| of the inner face of the rail that runs front to back
  zin: number; // |z| (from zc) of the inner face of the rail that runs across
  xl: number; // the leg's centre in the corner
  zl: number;
  r: number; // the leg's radius
  y: number; // the bracket's centre height and height
  h: number;
  zc: number;
  rail: string; // the rail across (along x)
  end: string; // the rail front to back (along z)
}

/**
 * A corner bracket across the inside corner of a frame: a plate set at 45 degrees just clear of the leg, its two
 * flanges screwed to the rails with two screws each, and two leg screws through its middle into the leg.
 */
function cornerBracket(c: Corner) {
  const k = c.xl + c.zl - (c.r + 4) / R2; // the plate's line, |x| + |z| = k
  const ax = k - c.zin, az = k - c.xin; // where it meets the rail across and the rail front to back
  const cx = (ax + c.xin) / 2, cz = (c.zin + az) / 2;
  const at = (x: number, y: number, z: number): Vec3 => [c.sx * x, y, c.zc + c.sz * z];
  const ys = [c.y - 12, c.y + 12];
  return {
    size: [(c.xin + c.zin - k) / R2, c.h, 3] as Vec3,
    pos: at(cx, c.y, cz),
    rot: [0, (c.sx * c.sz * Math.PI) / 4, 0] as Vec3,
    screws: [fx(BRACKET_SCREW, ys.map((y) => at(ax - 10, y, c.zin)), [0, 0, c.sz], c.rail), fx(BRACKET_SCREW, ys.map((y) => at(c.xin, y, az - 10)), [c.sx, 0, 0], c.end)],
    leg: (bracket: string, leg: string): CustomFix[] => {
      const pts = ys.map((y) => at(cx, y, cz));
      const dir: Vec3 = [c.sx * R2, 0, c.sz * R2];
      return [fx(FLAT_WASHER, pts, dir, bracket), fx(SPRING_WASHER, pts, dir, bracket), fx(LEG_SCREW, pts, dir, bracket, leg)];
    },
  };
}

interface FrameOpts {
  W: number; // the bottom it goes under, and its centre front to back
  D: number;
  zc: number;
  bottom: string;
  N: { rail: string; end: string; bracket: string; leg: string }; // the manual's part numbers
  railScrews: 2 | 4; // long screws through each rail (two through each end)
  splay: number;
}

/** The leg frame under a cabinet: rails across, ends between them, a bracket and a leg in each inside corner. */
function legFrame(p: Parts, o: FrameOpts) {
  const px = o.W / 2 - FI, pz = o.D / 2 - FI; // the frame's outer faces
  const xin = px - FW, zin = pz - FW; // and its inner faces
  const y = LEG - FH / 2;
  const rz = (sz: number) => o.zc + sz * (pz - FW / 2);
  const rails = SX.map((sz) => p.add(sz < 0 ? "FRb" : "FRf", o.N.rail, "Frame rail", [2 * px, FH, FW], [0, y, rz(sz)]));
  const ends = SX.map((sx) => p.add(sx < 0 ? "FEl" : "FEr", o.N.end, "Frame end", [FW, FH, 2 * zin], [sx * (px - FW / 2), y, o.zc]));
  // the legs' tops sit in the corners, in far enough that a leaning leg stays clear of the frame below them
  const lean = o.splay ? FH * o.splay + 2 : 0;
  const xl = xin - LD / 2 - lean, zl = zin - LD / 2 - lean;
  // dowels in the top edges, long screws up through the frame into the bottom, all clear of the brackets' screws
  const endScrew = (xl + zl - (LD / 2 + 4) / R2 - xin - 10 + zin) / 2; // between a bracket's screws and the rail
  const pieces = [
    ...SX.map((sz, i) => ({ id: rails[i], at: (u: number, h: number): Vec3 => [u, h, rz(sz)], dowels: (o.railScrews === 4 ? [-0.4, 0.4] : [-0.2, 0.2]).map((k) => k * px), screws: (o.railScrews === 4 ? [-0.6, -0.2, 0.2, 0.6] : [-0.45, 0.45]).map((k) => k * px) })),
    ...SX.map((sx, i) => ({ id: ends[i], at: (u: number, h: number): Vec3 => [sx * (px - FW / 2), h, o.zc + u], dowels: [-0.9 * zin, 0.9 * zin], screws: [-endScrew, endScrew] })),
  ];
  const fix = [
    ...pieces.map((q) => fx(DOWEL, q.dowels.map((u) => q.at(u, LEG)), [0, -1, 0], q.id, o.bottom)),
    ...pieces.map((q) => fx(LONG_SCREW, q.screws.map((u) => q.at(u, LEG - FH)), [0, 1, 0], q.id, o.bottom)),
  ];
  const brackets: string[] = [], legs: string[] = [], bracketFix: CustomFix[] = [], legFix: CustomFix[] = [];
  CORNERS.forEach(([sx, sz], i) => {
    const c = cornerBracket({ sx, sz, xin, zin, xl, zl, r: LD / 2, y, h: FH - 10, zc: o.zc, rail: rails[sz < 0 ? 0 : 1], end: ends[sx < 0 ? 0 : 1] });
    const b = p.add(`CB${i}`, o.N.bracket, "Corner bracket", c.size, c.pos, { material: "metal", rot: c.rot });
    const leg = p.add(`LG${i}`, o.N.leg, "Leg", [LD, LEG, LD], [0, 0, 0], { shape: "cyl", material: "wood", ...legAt(sx, sz, xl, zl, o.zc, LEG, o.splay) });
    brackets.push(b);
    legs.push(leg);
    bracketFix.push(...c.screws);
    legFix.push(...c.leg(b, leg));
  });
  return { frame: [...rails, ...ends], brackets, legs, fix, bracketFix, legFix };
}

/** The three leg steps, the same on every cabinet, in the pose the manual has it in. */
function legSteps(f: ReturnType<typeof legFrame>, n: { rail: string; end: string; bracket: string; leg: string; dowel: string; screw: string; bracketScrew: string; legScrew: string }, pose: CustomStep["pose"], first: string): CustomStep[] {
  return [
    {
      title: "Fix the leg frame under the bottom",
      detail: `${first}Push eight dowels (${n.dowel}) into the top edges of the frame rails (${n.rail}) and ends (${n.end}), set them on the bottom and drive the long screws (${n.screw}) through them into it.`,
      add: f.frame,
      fix: f.fix,
      from: offset(f.frame, [0, -300, 0]),
      pose,
      tools: ["screwdriver"],
    },
    {
      title: "Screw a corner bracket into each corner",
      detail: `A bracket (${n.bracket}) across each inside corner of the frame, two screws (${n.bracketScrew}) into each rail it meets.`,
      add: f.brackets,
      fix: f.bracketFix,
      from: offset(f.brackets, [0, -200, 0]),
      pose,
      tools: ["screwdriver"],
    },
    {
      title: "Screw the legs on",
      detail: `Stand a leg (${n.leg}) in each corner and drive two leg screws (${n.legScrew}) through the bracket into it, each with a spring washer and a flat washer.`,
      add: f.legs,
      fix: f.legFix,
      from: offset(f.legs, [0, -300, 0]),
      pose,
      tools: ["screwdriver"],
      kind: "legs",
    },
  ];
}

/* ---------- drawers ---------- */

interface DrawerOpts {
  tag: string;
  cx: number; // the opening's centre and width between the cabinet's runner faces
  bay: number;
  yb: number; // the underside of the box, its sides' height, the front's back face and the box's depth
  sh: number;
  zf: number;
  dd: number;
  front: { size: Vec3; pos: Vec3 };
  N: { front: string; sideL: string; sideR: string; back: string; bottom: string; brace?: string };
}

/**
 * A drawer: two sides (their runners fitted) screwed to the back, the bottom slid along their grooves, and the front
 * on four cam bolts with cam locks in the sides. Some have a brace under the bottom, screwed to the back and cam-locked
 * to the front as well.
 */
function drawer(p: Parts, o: DrawerOpts) {
  const DS = 12; // sides and back
  const xs = o.bay / 2 - 12.5 - DS / 2; // side centres from the middle, clear of the runners
  const zb = o.zf - o.dd;
  const inner = 2 * xs - DS;
  const yc = o.yb + o.sh / 2;
  const t = o.tag;
  const front = p.add(`F${t}`, o.N.front, "Drawer front", o.front.size, o.front.pos);
  const sl = p.add(`L${t}`, o.N.sideL, "Drawer side, left", [DS, o.sh, o.dd], [o.cx - xs, yc, o.zf - o.dd / 2]);
  const sr = p.add(`R${t}`, o.N.sideR, "Drawer side, right", [DS, o.sh, o.dd], [o.cx + xs, yc, o.zf - o.dd / 2]);
  const back = p.add(`K${t}`, o.N.back, "Drawer back", [inner, o.sh, DS], [o.cx, yc, zb + DS / 2]);
  const brace = o.N.brace ? p.add(`C${t}`, o.N.brace, "Drawer brace", [60, T, o.dd - DS], [o.cx, o.yb + T / 2, (zb + DS + o.zf) / 2]) : undefined;
  const yBot = o.yb + (brace ? T + 2 : 12);
  const bottom = p.add(`M${t}`, o.N.bottom, "Drawer bottom", [inner + 10, BK, o.zf - 1 - (zb + DS / 2)], [o.cx, yBot, (o.zf - 1 + zb + DS / 2) / 2], { material: "fiber" });
  const ys = [yc - 30, yc + 30];
  const yBr = o.yb + T / 2;
  const box: CustomFix[] = [
    fx(SCREW, ys.map((y): Vec3 => [o.cx - xs - DS / 2, y, zb + DS / 2]), [1, 0, 0], sl, back),
    fx(SCREW, ys.map((y): Vec3 => [o.cx + xs + DS / 2, y, zb + DS / 2]), [-1, 0, 0], sr, back),
    ...(brace ? [fx(SCREW, [-15, 15].map((x): Vec3 => [o.cx + x, yBr, zb]), [0, 0, 1], back, brace)] : []),
  ];
  const fronts: CustomFix[] = [
    fx(CAM_BOLT, [...SX.flatMap((g) => ys.map((y): Vec3 => [o.cx + g * xs, y, o.zf])), ...(brace ? [[o.cx, yBr, o.zf] as Vec3] : [])], [0, 0, 1], front),
    fx(CAM, ys.map((y): Vec3 => [o.cx - xs + DS / 2, y, o.zf - 25]), [-1, 0, 0], sl),
    fx(CAM, ys.map((y): Vec3 => [o.cx + xs - DS / 2, y, o.zf - 25]), [1, 0, 0], sr),
    ...(brace ? [fx(CAM, [[o.cx, o.yb, o.zf - 25]], [0, 1, 0], brace)] : []),
  ];
  return { front, box: [sl, sr, back, ...(brace ? [brace] : []), bottom], ids: [front, sl, sr, back, ...(brace ? [brace] : []), bottom], boxFix: box, frontFix: fronts };
}

/* ---------- back panels ---------- */

/** Clips holding back panels in their grooves: at the given heights on both sides, each screwed into the side behind the panel. */
function backClips(sides: [string, string], xi: number, ys: number[], zBack: number): CustomFix[] {
  return SX.flatMap((sx, i) => [CLIP, CLIP_SCREW].map((def) => fx(def, ys.map((y): Vec3 => [sx * xi, y, zBack + 4]), [sx, 0, 0], sides[i])));
}

/* ---------- the wall ---------- */

/** Two straps screwed (with a washer) to the top's back edge, standing up behind it; then a plug, washer and screw each into the wall. */
function wallStraps(top: string, xs: number[], H: number, zB: number) {
  const yScrew = H - T / 2, yWall = H + 50;
  return {
    straps: [fx(STRAP, xs.map((x): Vec3 => [x, H + 20, zB]), [0, 0, 1], top), fx(WASHER, xs.map((x): Vec3 => [x, yScrew, zB]), [0, 0, 1], top), fx(STRAP_SCREW, xs.map((x): Vec3 => [x, yScrew, zB]), [0, 0, 1], top)],
    wall: [fx(WALL_PLUG, xs.map((x): Vec3 => [x, yWall, zB - 25]), [0, 0, -1]), fx(WASHER, xs.map((x): Vec3 => [x, yWall, zB + 1]), [0, 0, -1]), fx(WALL_SCREW, xs.map((x): Vec3 => [x, yWall, zB + 1]), [0, 0, -1])],
  };
}

const WALL_STEP = { tools: ["drill", "screwdriver", "pencil"], wall: true, warnings: ["wall", "tip"] } satisfies Partial<CustomStep>;

/* ---------- the bookshelf ---------- */

/**
 * The bookshelf's carcass, the same in both its manuals: the top and the bottom over and under the sides, three
 * shelves between the sides on cam bolts and dowels, and four dividers dowelled between them, a third of the way across
 * and on alternate sides; then two wall brackets on the top. `zB` is the carcass's back edge, `zd` the dividers'.
 */
function bookcaseCarcass(p: Parts, s: ProductSpec, zB: number, zd: number) {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const zF = D / 2, zc = (zB + zF) / 2;
  const xo = W / 2 - T / 2, xi = W / 2 - T;
  const y0 = LEG + T, y1 = H - T; // the sides stand between the bottom and the top
  const rowH = (y1 - y0 - 3 * T) / 4;
  const rowY = (k: number) => y0 + k * (rowH + T); // the bottom of row k, counting from the bottom
  const shelfY = (k: number) => rowY(k + 1) - T / 2; // shelf k, from the bottom
  const dx = xi - T / 2 - (2 * xi - T) / 3; // dividers a third of the way across
  const dxOf = (k: number) => (k % 2 ? dx : -dx); // the bottom row's on the left, then right, left, right
  const side = (i: number) => (i ? "S4" : "S3");
  p.add("T1", "1", "Top", [W, T, zF - zB], [0, H - T / 2, zc]);
  p.add("B2", "2", "Bottom", [W, T, zF - zB], [0, LEG + T / 2, zc]);
  p.add("S3", "3", "Left side", [T, y1 - y0, zF - zB], [-xo, (y0 + y1) / 2, zc]);
  p.add("S4", "4", "Right side", [T, y1 - y0, zF - zB], [xo, (y0 + y1) / 2, zc]);
  const shelves = range(3).map((k) => p.add(`H${k}`, k === 1 ? "6" : "5", k === 1 ? "Middle shelf" : "Shelf", [2 * xi, T, zF - zB], [0, shelfY(k), zc]));
  const divs = range(4).map((k) => p.add(`V${k}`, "7", "Divider", [T, rowH, zF - zd], [dxOf(k), rowY(k) + rowH / 2, (zF + zd) / 2]));

  // two dowels at each end of a divider, into the shelf (or the top or bottom) below and above it
  const zdd = [zd + 50, zF - 50];
  const below = (k: number) => (k === 0 ? "B2" : shelves[k - 1]);
  const above = (k: number) => (k === 3 ? "T1" : shelves[k]);
  const divDowels = (k: number): [CustomFix, CustomFix] => [
    fx(DOWEL, zdd.map((z): Vec3 => [dxOf(k), rowY(k), z]), [0, 1, 0], divs[k], below(k)),
    fx(DOWEL, zdd.map((z): Vec3 => [dxOf(k), rowY(k) + rowH, z]), [0, -1, 0], divs[k], above(k)),
  ];
  // each shelf end: two cam bolts and two dowels in the side, two cam locks in the shelf's underside
  const zA = [zB + 40, zF - 40], zC = [zB + 100, zF - 100];
  const sideJoin = (i: number): CustomFix[] => {
    const sx = i ? 1 : -1;
    return [
      ...shelves.map((h, k) => fx(CAM_BOLT, zA.map((z): Vec3 => [sx * xi, shelfY(k), z]), [sx, 0, 0], side(i), h)),
      ...shelves.map((h, k) => fx(DOWEL, zC.map((z): Vec3 => [sx * xi, shelfY(k), z]), [sx, 0, 0], side(i), h)),
      ...shelves.map((h, k) => fx(CAM, zA.map((z): Vec3 => [sx * (xi - 25), shelfY(k) - T / 2, z]), [0, 1, 0], h)),
    ];
  };
  // the top: cam bolts in it, cam locks in the sides and dowels in their ends; the bottom: dowels and screws
  const topSides: CustomFix[] = [
    ...SX.map((sx, i) => fx(CAM_BOLT, zA.map((z): Vec3 => [sx * xo, y1, z]), [0, 1, 0], "T1", side(i))),
    ...SX.map((sx, i) => fx(CAM, zA.map((z): Vec3 => [sx * xi, y1 - 25, z]), [sx, 0, 0], side(i))),
    ...SX.map((sx, i) => fx(DOWEL, zC.map((z): Vec3 => [sx * xo, y1, z]), [0, -1, 0], side(i), "T1")),
  ];
  const bottomDowels = SX.map((sx, i) => fx(DOWEL, zC.map((z): Vec3 => [sx * xo, y0, z]), [0, 1, 0], side(i), "B2"));
  const bottomScrews = SX.map((sx, i) => fx(SCREW, zA.map((z): Vec3 => [sx * xo, LEG, z]), [0, 1, 0], "B2", side(i)));
  // two wall brackets screwed to the top at the back, then a plug and a screw each into the wall
  const wallX = [-(W / 2 - 120), W / 2 - 120];
  const wallBrackets = [fx(WALL_BRACKET, wallX.map((x): Vec3 => [x, H, -D / 2 + 26]), [0, -1, 0], "T1"), fx(WALL_BRACKET_SCREW, wallX.map((x): Vec3 => [x, H, -D / 2 + 49]), [0, -1, 0], "T1")];
  const wallFix = [fx(WALL_PLUG, wallX.map((x): Vec3 => [x, H + 30, -D / 2 - 25]), [0, 0, -1]), fx(WALL_SCREW, wallX.map((x): Vec3 => [x, H + 30, -D / 2 + 1]), [0, 0, -1])];
  return { W, H, D, zc, xo, xi, y0, y1, rowH, rowY, shelfY, side, shelves, divs, divDowels, sideJoin, topSides, bottomDowels, bottomScrews, wallBrackets, wallFix };
}

/** The Walnut manual (43683390): the back panels slide into grooves as the carcass goes together, and clips hold them. */
function bookshelf(s: ProductSpec): CustomParams {
  const D = s.size.d * 10;
  const zk = -D / 2 + 8; // the back panels' outside face, in grooves near the back edge
  const p = new Parts();
  const c = bookcaseCarcass(p, s, -D / 2, zk + BK); // the dividers stop in front of the back panels
  const { W, xi, rowH, rowY, side, shelves, divs, divDowels, sideJoin } = c;
  const backs = range(4).map((k) => p.add(`K${k}`, "8", "Back panel", [2 * xi + 16, rowH + 10, BK], [0, rowY(k) + rowH / 2, zk + BK / 2], { material: "fiber" }));
  const f = legFrame(p, { W, D, zc: 0, bottom: "B2", N: { rail: "9", end: "10", bracket: "11", leg: "12" }, railScrews: 2, splay: 0 });
  const topFix: CustomFix[] = [...c.topSides, ...divDowels(3)];
  const bottomFix: CustomFix[] = [...c.bottomDowels, ...divDowels(0), ...c.bottomScrews];
  // a clip at each corner of each back panel, screwed into the side behind it
  const clipY = range(4).flatMap((k) => [rowY(k) + 25, rowY(k) + rowH - 25]);
  const clips = backClips([side(0), side(1)], xi, clipY, -D / 2);

  const lie = "-x" as const; // on its right side, as the manual lays it
  const steps: CustomStep[] = [
    {
      title: "Dowel two dividers between the shelves",
      detail: "Push eight dowels (c) into the ends of two dividers (7) and join the shelves with them: shelf (5), divider, middle shelf (6), divider, shelf (5). In the finished bookshelf the lower divider sits on the right and the upper one on the left.",
      add: [shelves[0], divs[1], shelves[1], divs[2], shelves[2]],
      fix: [...divDowels(1), ...divDowels(2)],
      pose: lie,
      warnings: ["floor"],
    },
    {
      title: "Fix the shelves to the right side",
      detail: "Lay the right side (4) on a rug, inside face up. Turn six cam bolts (a) into it and push in six dowels (c), stand the shelves on them and lock six cam locks (b), two in each shelf.",
      add: ["S4"],
      fix: sideJoin(1),
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Slide in the two middle back panels",
      detail: "Down the grooves between the shelves until they reach the right side.",
      add: [backs[1], backs[2]],
      from: offset([backs[1], backs[2]], [-500, 0, 0]),
      pose: lie,
    },
    {
      title: "Fix the left side on",
      detail: "Turn six cam bolts (a) and push six dowels (c) into the left side (3), lower it onto the shelves and lock the six cam locks (b).",
      add: ["S3"],
      fix: sideJoin(0),
      from: { S3: [-400, 0, 0] },
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Slide in the top back panel",
      detail: "Along the grooves from the open top end, down to the top shelf.",
      add: [backs[3]],
      from: { [backs[3]]: [0, 500, 0] },
      pose: lie,
    },
    {
      title: "Fix the top on with the third divider",
      detail: "Dowel a divider (7) onto the top shelf, on the right. Turn four cam bolts (a) into the top (1) and push two dowels (c) into each side's end, press the top on and lock the four cam locks (b) in the sides.",
      add: [divs[3], "T1"],
      fix: topFix,
      from: { T1: [0, 400, 0] },
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Slide in the bottom back panel",
      detail: "Along the grooves from the open bottom end, up to the bottom shelf.",
      add: [backs[0]],
      from: { [backs[0]]: [0, -500, 0] },
      pose: lie,
    },
    {
      title: "Fix the bottom on with the last divider",
      detail: "Dowel the last divider (7) under the bottom shelf, on the left, and push two dowels (c) into each side's end. Press the bottom (2) on and drive two screws (d) through it into each side.",
      add: [divs[0], "B2"],
      fix: bottomFix,
      from: { B2: [0, -400, 0] },
      pose: lie,
      tools: ["screwdriver"],
    },
    ...legSteps(f, { rail: "9", end: "10", bracket: "11", leg: "12", dowel: "c", screw: "f", bracketScrew: "g", legScrew: "h" }, "+z", "Lay it on its back. "),
    {
      title: "Stand it up and clip the back panels",
      detail: "Turn it round. Sixteen clips (m) hold the four back panels, one at each corner of each panel, each screwed into the side.",
      fix: clips,
      pose: "+y",
      tools: ["screwdriver"],
    },
    {
      title: "Fix it to the wall",
      detail: "Screw the two wall brackets (i) to the back of the top. Push it against the wall, mark through the brackets, drill, push in the plugs and screw the brackets to the wall (j). Check for pipes and cables first.",
      fix: [...c.wallBrackets, ...c.wallFix],
      ...WALL_STEP,
    },
  ];
  return { parts: p.list, steps };
}

/**
 * The Standard manual (43114627), sold as the Thorne Bookshelf Storage: all four dividers are dowelled to the shelves
 * first, both sides go on together, then the top and the bottom. With the legs on it is turned onto its front and four
 * back panels (8 at the top and the bottom, 13 between them) are nailed over the back edges, with round-head pins
 * along the joins into the shelves.
 */
function bookshelfStorage(s: ProductSpec): CustomParams {
  const D = s.size.d * 10;
  const zB = -D / 2 + BK; // the back panels are nailed on behind the carcass, so it is that much shallower
  const p = new Parts();
  const c = bookcaseCarcass(p, s, zB, zB); // and the dividers reach right to its back edge
  const { W, H, xo, shelfY, shelves, divs, divDowels, sideJoin } = c;
  // the back panels cover the whole back, from under the bottom to the top of the top, and meet over each shelf
  const edges = [LEG, shelfY(0), shelfY(1), shelfY(2), H];
  const mid = (k: number) => k === 1 || k === 2;
  const backs = range(4).map((k) =>
    p.add(`K${k}`, mid(k) ? "13" : "8", mid(k) ? "Middle back panel" : "Back panel", [W, edges[k + 1] - edges[k], BK], [0, (edges[k] + edges[k + 1]) / 2, -D / 2 + BK / 2], { material: "fiber" }),
  );
  const f = legFrame(p, { W, D: D - BK, zc: c.zc, bottom: "B2", N: { rail: "9", end: "10", bracket: "11", leg: "12" }, railScrews: 2, splay: 0 });
  // twenty nails, as the manual draws them: four into the top, four into the bottom, and at each join one either side
  // of it into each side; then two pins along each join, into the shelf behind it
  const zn = -D / 2;
  const nx = [-(W / 2 - 20), -W / 6, W / 6, W / 2 - 20];
  const nails: CustomFix[] = [
    fx(NAIL, nx.map((x): Vec3 => [x, H - T / 2, zn]), [0, 0, 1], backs[3]),
    fx(NAIL, nx.map((x): Vec3 => [x, LEG + T / 2, zn]), [0, 0, 1], backs[0]),
    ...range(3).flatMap((k) => [fx(NAIL, SX.map((sx): Vec3 => [sx * xo, shelfY(k) + 20, zn]), [0, 0, 1], backs[k + 1]), fx(NAIL, SX.map((sx): Vec3 => [sx * xo, shelfY(k) - 20, zn]), [0, 0, 1], backs[k])]),
  ];
  const pins = range(3).map((k) => fx(PANEL_PIN, [-160, 160].map((x): Vec3 => [x, shelfY(k), zn]), [0, 0, 1], backs[k]));

  const lie = "+z" as const; // on its back
  const steps: CustomStep[] = [
    {
      title: "Dowel the four dividers to the shelves",
      detail: "Push twelve dowels (c) in and join the four dividers (7) to the shelves as the manual lays them out: divider, shelf (5), divider, middle shelf (6), divider, shelf (5), divider. In the finished bookshelf they sit right, left, right, left from the top.",
      add: [divs[3], shelves[2], divs[2], shelves[1], divs[1], shelves[0], divs[0]],
      fix: [...divDowels(1), ...divDowels(2), divDowels(3)[0], divDowels(0)[1]],
      pose: lie,
      warnings: ["floor"],
    },
    {
      title: "Fix both sides on",
      detail: "Lay the shelves on their back edges. Turn twelve cam bolts (a) and push twelve dowels (c) into the two sides (3, 4), press the sides onto the shelves' ends and lock the twelve cam locks (b), two at each end of each shelf.",
      add: ["S3", "S4"],
      fix: [...sideJoin(0), ...sideJoin(1)],
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Fix the top and the bottom on",
      detail: "Turn four cam bolts (a) into the top (1) and push in twelve dowels (c): two into each end of both sides and two into the free end of the top and bottom dividers. Press the top on and lock the four cam locks (b) in the sides, then press the bottom (2) on and drive two screws (d) through it into each side.",
      add: ["T1", "B2"],
      fix: [...c.topSides, divDowels(3)[1], ...c.bottomDowels, divDowels(0)[0], ...c.bottomScrews],
      from: { T1: [0, 400, 0], B2: [0, -400, 0] },
      pose: lie,
      tools: ["screwdriver"],
    },
    ...legSteps(f, { rail: "9", end: "10", bracket: "11", leg: "12", dowel: "c", screw: "f", bracketScrew: "g", legScrew: "h" }, lie, ""),
    {
      title: "Turn it over and nail on the back panels",
      detail: "Turn it onto its front. Lay the back panels on, 8 at the top and the bottom and the two 13 between, so they meet over the shelves. Nail them on with twenty nails (e): four along the top, four along the bottom and one either side of each join at both sides. Then drive six round-head pins (k) along the joins into the shelves, two in each.",
      add: backs,
      fix: [...nails, ...pins],
      from: offset(backs, [0, 0, -400]),
      pose: "-z",
      tools: ["hammer"],
    },
    {
      title: "Stand it up and screw on the wall brackets",
      detail: "Screw the two wall brackets (i) to the top at the back, one small screw each.",
      fix: c.wallBrackets,
      pose: "+y",
      tools: ["screwdriver"],
    },
    {
      title: "Fix it to the wall",
      detail: "Push it against the wall, mark through the brackets, drill, push in the plugs and screw the brackets to the wall (j). Check for pipes and cables first.",
      fix: c.wallFix,
      ...WALL_STEP,
    },
  ];
  return { parts: p.list, steps };
}

/* ---------- the 4 drawer chest ---------- */

function chest(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xo = W / 2 - T / 2, xi = W / 2 - T;
  const y0 = LEG + T, y1 = H - T;
  const row = (y1 - y0) / 4; // the drawer openings, from the bottom
  const rowY = (i: number) => y0 + i * row;
  const zf = D / 2 - FT; // the rails' and drawer boxes' front, behind the fronts
  const zr = zf - T / 2; // the front rails
  const zk = -D / 2 + 10; // the back panels' outside face
  const zbr = zk + BK + T / 2; // the back rail, in front of them
  const R6H = 50, R7H = 60;
  const yb = (i: number) => rowY(i) + 32; // the underside of drawer i's box
  const side = (i: number) => (i ? "S4" : "S3");
  const p = new Parts();
  p.add("T1", "1", "Top", [W, T, D], [0, H - T / 2, 0]);
  p.add("B2", "2", "Bottom", [W, T, D], [0, LEG + T / 2, 0]);
  SX.forEach((sx, i) =>
    p.boxes(side(i), i ? "4" : "3", i ? "Right side" : "Left side", [
      { min: [sx < 0 ? -W / 2 : xi, y0, -D / 2], max: [sx < 0 ? -xi : W / 2, y1, D / 2] },
      ...range(4).map((d) => runnerBox(sx < 0 ? -xi : xi - 12.5, sx < 0 ? -xi + 12.5 : xi, yb(d) + 20, zf)),
    ]),
  );
  p.add("R6", "6", "Top rail", [2 * xi, R6H, T], [0, y1 - R6H / 2, zr]);
  const frontRails = [1, 2, 3].map((k) => p.add(`R7-${k}`, "7", "Rail", [2 * xi, R7H, T], [0, rowY(k), zr]));
  const yBack = rowY(2);
  p.add("R7b", "7", "Rail", [2 * xi, R7H, T], [0, yBack, zbr]);
  const backs = [0, 1].map((k) => p.add(`K5-${k}`, "5", "Back panel", [2 * xi + 16, (y1 - y0) / 2, BK], [0, y0 + (y1 - y0) * (k ? 0.75 : 0.25), zk + BK / 2], { material: "fiber" }));
  const drawers = range(4).map((i) =>
    drawer(p, {
      tag: String(i),
      cx: 0,
      bay: 2 * xi,
      yb: yb(i),
      sh: 100,
      zf,
      dd: 350,
      front: { size: [2 * xi - 3, row - 3, FT], pos: [0, rowY(i) + row / 2, D / 2 - FT / 2] },
      N: { front: "8", sideL: "16", sideR: "17", back: "9", bottom: "11", brace: "10" },
    }),
  );
  const f = legFrame(p, { W, D, zc: 0, bottom: "B2", N: { rail: "12", end: "13", bracket: "14", leg: "15" }, railScrews: 2, splay: SPLAY });

  // each rail end: a cam bolt and a dowel in the side, a cam lock in the rail's inside face; the top rail is only dowelled
  const rails = [...frontRails.map((id, k) => ({ id, y: rowY(k + 1), z: zr, face: zr - T / 2, dir: 1 })), { id: "R7b", y: yBack, z: zbr, face: zbr + T / 2, dir: -1 }];
  const railFix: CustomFix[] = [
    ...SX.flatMap((sx, i) => rails.map((r) => fx(CAM_BOLT, [[sx * xi, r.y + 12, r.z]], [sx, 0, 0], side(i), r.id))),
    ...SX.flatMap((sx, i) => rails.map((r) => fx(DOWEL, [[sx * xi, r.y - 12, r.z]], [sx, 0, 0], side(i), r.id))),
    ...SX.map((sx, i) => fx(DOWEL, [-12, 12].map((dy): Vec3 => [sx * xi, y1 - R6H / 2 + dy, zr]), [sx, 0, 0], side(i), "R6")),
    ...rails.map((r) => fx(CAM, SX.map((sx): Vec3 => [sx * (xi - 25), r.y + 12, r.face]), [0, 0, r.dir], r.id)),
  ];
  // the top: two cam bolts lock into the top rail at the front, one into each side at the back
  const zTop = -(D / 2 - 60);
  const topFix: CustomFix[] = [
    fx(CAM_BOLT, SX.map((sx): Vec3 => [sx * (xi - 25), y1, zr]), [0, 1, 0], "T1", "R6"),
    ...SX.map((sx, i) => fx(CAM_BOLT, [[sx * xo, y1, zTop]], [0, 1, 0], "T1", side(i))),
    fx(CAM, SX.map((sx): Vec3 => [sx * (xi - 25), y1 - 25, zr - T / 2]), [0, 0, 1], "R6"),
    ...SX.map((sx, i) => fx(CAM, [[sx * xi, y1 - 25, zTop]], [sx, 0, 0], side(i))),
    ...SX.map((sx, i) => fx(DOWEL, [120, -60].map((z): Vec3 => [sx * xo, y1, z]), [0, -1, 0], side(i), "T1")),
    fx(DOWEL, [-130, 130].map((x): Vec3 => [x, y1, zr]), [0, -1, 0], "R6", "T1"),
    fx(SCREW, [-210, 210].map((x): Vec3 => [x, y1 - R6H, zr]), [0, 1, 0], "R6", "T1"),
  ];
  const bottomFix: CustomFix[] = [
    ...SX.map((sx, i) => fx(DOWEL, [-60, 60].map((z): Vec3 => [sx * xo, y0, z]), [0, 1, 0], side(i), "B2")),
    ...SX.map((sx, i) => fx(SCREW, [-140, 140].map((z): Vec3 => [sx * xo, LEG, z]), [0, 1, 0], "B2", side(i))),
  ];
  const clipY = [y0 + 25, yBack - 45, yBack + 45, y1 - 25];
  const clips = backClips([side(0), side(1)], xi, clipY, -D / 2);
  const wall = wallStraps("T1", [-(W / 2 - 120), W / 2 - 120], H, -D / 2);

  const OUT = 500; // the drawers are built this far in front of the chest
  const boxes = drawers.flatMap((d) => d.box);
  const all = drawers.flatMap((d) => d.ids);
  const lie = "+x" as const; // on its left side
  const steps: CustomStep[] = [
    {
      title: "Screw the four drawer boxes together",
      detail: "For each drawer: two screws (d) through each side (16 and 17) into the back (9) and two through the back into the brace (10), runners on the outside. Then slide the bottom (11) in from the front, along the grooves and over the brace.",
      fix: drawers.flatMap((d) => d.boxFix),
      wait: boxes,
      from: offset(all, [0, 0, OUT]),
      tools: ["screwdriver"],
      kind: "drawer",
      warnings: ["floor"],
    },
    {
      title: "Fix the fronts on the drawers",
      detail: "Turn five cam bolts (a) into the back of each front (8), push the sides and brace onto them and lock the five cam locks (b): two in each side, one in the brace.",
      fix: drawers.flatMap((d) => d.frontFix),
      wait: drawers.map((d) => d.front),
      from: offset(all, [0, 0, OUT]),
      tools: ["screwdriver"],
      kind: "drawer",
    },
    {
      title: "Join the sides with the rails",
      detail: "Lay the left side (3) on a rug, runners up. Turn eight cam bolts (a) and push twelve dowels (c) into the two sides, stand the top rail (6), the three front rails and the back rail (7) on the left side, lay the right side (4) on top and lock the eight cam locks (b) in the rails.",
      add: ["S3", "R6", ...frontRails, "R7b", "S4"],
      fix: railFix,
      from: { S4: [400, 0, 0], ...offset(["R6", ...frontRails, "R7b"], [300, 0, 0]) },
      pose: lie,
      tools: ["screwdriver"],
      warnings: ["floor"],
    },
    {
      title: "Slide in the back panels",
      detail: "One along the grooves from each open end, until they meet at the back rail.",
      add: backs,
      from: { [backs[0]]: [0, -500, 0], [backs[1]]: [0, 500, 0] },
      pose: lie,
    },
    {
      title: "Fix the top on",
      detail: "Turn four cam bolts (a) into the top (1), push two dowels (c) into each side's end and two into the top rail, and press the top on. Lock the two cam locks (b) in the top rail and one in each side, then drive two screws (d) through the top rail into the top.",
      add: ["T1"],
      fix: topFix,
      from: { T1: [0, 400, 0] },
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Stand it on its top and screw the bottom on",
      detail: "Push two dowels (c) into each side's end, set the bottom (2) on and drive two screws (d) through it into each side.",
      add: ["B2"],
      fix: bottomFix,
      from: { B2: [0, -400, 0] },
      pose: "-y",
      tools: ["screwdriver"],
      warnings: ["floor"],
    },
    ...legSteps(f, { rail: "12", end: "13", bracket: "14", leg: "15", dowel: "c", screw: "h", bracketScrew: "f", legScrew: "g" }, "-y", ""),
    {
      title: "Stand it up and slide the drawers in",
      detail: "Pull each runner in the chest forward, rest the drawer's runners on them and push the drawer home. Open only one drawer at a time.",
      add: all,
      from: offset(all, [0, 0, 420]),
      pose: "+y",
      kind: "drawer",
      warnings: ["tip"],
    },
    {
      title: "Clip the back panels in",
      detail: "Turn it round. Eight clips (k) hold the back panels, one at each corner of each panel, each screwed into the side.",
      fix: clips,
      tools: ["screwdriver"],
    },
    {
      title: "Fix it to the wall",
      detail: "Screw the two straps (i) to the back edge of the top, a washer under each screw. Push it against the wall, mark through the straps, drill, push in the plugs and screw the straps to the wall with a washer (j). Check for pipes and cables first.",
      fix: [...wall.straps, ...wall.wall],
      ...WALL_STEP,
    },
  ];
  return { parts: p.list, steps };
}

/* ---------- the buffet ---------- */

function buffet(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const zB = -D / 2 + BK, zF = D / 2; // the carcass's back (the back panels are nailed on behind it) and the front
  const zU = zF - FT; // the sides' and dividers' front edges: the doors and drawer fronts lie over them
  const zu = (zB + zU) / 2, Du = zU - zB; // the sides and dividers
  const zt = (zB + zF) / 2, Dt = zF - zB; // the top and the bottom reach over the doors
  const y0 = LEG + T, y1 = H - T;
  const bay = (W - 4 * T) / 3;
  const xu = [-(W / 2 - T / 2), -(W / 2 - T - bay - T / 2), W / 2 - T - bay - T / 2, W / 2 - T / 2]; // 3, 5, 6, 4
  const ups = ["S3", "D5", "D6", "S4"];
  const bayX = [-(bay + T), 0, bay + T];
  const zr = zU - T / 2; // the rails, behind the fronts
  const R8H = 40, R7H = 60;
  const fh = (y1 - y0 - 4 - 6) / 3; // drawer fronts, with gaps
  const fy = (i: number) => y0 + 2 + i * (fh + 3); // the bottom of drawer front i, from the bottom
  const seam = (i: number) => fy(i) + fh + 1.5;
  const yb = (i: number) => fy(i) + 30; // the underside of drawer i's box
  const p = new Parts();
  p.add("T1", "1", "Top", [W, T, Dt], [0, H - T / 2, zt]);
  p.add("B2", "2", "Bottom", [W, T, Dt], [0, LEG + T / 2, zt]);
  const upright = (i: number, runners: number) => {
    const x0 = xu[i] - T / 2, x1 = xu[i] + T / 2;
    const names = ["Left side", "Left divider", "Right divider", "Right side"];
    const labels = ["3", "5", "6", "4"];
    if (!runners) return p.add(ups[i], labels[i], names[i], [T, y1 - y0, Du], [xu[i], (y0 + y1) / 2, zu]);
    // the runners are fitted on the face toward the drawers: the right divider's right face, the right side's left one
    const rx = runners > 0 ? [x1, x1 + 12.5] : [x0 - 12.5, x0];
    return p.boxes(ups[i], labels[i], names[i], [{ min: [x0, y0, zB], max: [x1, y1, zU] }, ...range(3).map((d) => runnerBox(rx[0], rx[1], yb(d) + 20, zU))]);
  };
  upright(0, 0);
  upright(1, 0);
  upright(2, 1);
  upright(3, -1);
  const r8 = bayX.map((x, k) => p.add(`R8-${k}`, "8", "Top rail", [bay, R8H, T], [x, y1 - R8H / 2, zr]));
  const r7 = [0, 1].map((k) => p.add(`R7-${k}`, "7", "Drawer rail", [bay, R7H, T], [bayX[2], seam(k), zr]));
  const shelfY = Math.round((y0 + y1) / 2);
  const shelves = [0, 1].map((k) => p.add(`SH${k}`, "11", "Shelf", [bay - 2, T, Du - 20], [bayX[k], shelfY, zU - 10 - (Du - 20) / 2]));
  const backs = [0, 1].map((k) => p.add(`K12-${k}`, "12", "Back panel", [W, (H - LEG) / 2, BK], [0, LEG + ((H - LEG) * (k ? 3 : 1)) / 4, -D / 2 + BK / 2], { material: "fiber" }));
  // the doors lie over the left bay and the middle one, the drawer fronts over the right one
  const doorH = y1 - y0 - 4;
  const mid5 = xu[1], mid6 = xu[2];
  const door9 = { x0: -W / 2 + 1, x1: mid5 - 1.5 }, door10 = { x0: mid5 + 1.5, x1: mid6 - 1.5 };
  p.add("D9", "9", "Left door", [door9.x1 - door9.x0, doorH, FT], [(door9.x0 + door9.x1) / 2, y0 + 2 + doorH / 2, zF - FT / 2]);
  p.add("D10", "10", "Right door", [door10.x1 - door10.x0, doorH, FT], [(door10.x0 + door10.x1) / 2, y0 + 2 + doorH / 2, zF - FT / 2]);
  const fx0 = mid6 + 1.5, fx1 = W / 2 - 1;
  const drawers = range(3).map((i) =>
    drawer(p, {
      tag: String(i),
      cx: bayX[2],
      bay,
      yb: yb(i),
      sh: 100,
      zf: zU,
      dd: 330,
      front: { size: [fx1 - fx0, fh, FT], pos: [(fx0 + fx1) / 2, fy(i) + fh / 2, zF - FT / 2] },
      N: { front: "17", sideL: "18", sideR: "19", back: "20", bottom: "21" },
    }),
  );
  const f = legFrame(p, { W, D: Dt, zc: zt, bottom: "B2", N: { rail: "13", end: "14", bracket: "15", leg: "16" }, railScrews: 4, splay: SPLAY });

  // inside faces of the uprights, for cam locks and shelf supports: the face toward bay b
  const xIn = [-(W / 2 - T), xu[1] + T / 2, xu[2] - T / 2, W / 2 - T];
  const dirIn: Vec3[] = [
    [-1, 0, 0],
    [-1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],
  ];
  const yR8 = y1 - R8H / 2;
  const carcassFix: CustomFix[] = [
    fx(DOWEL, [-12, 12].map((dy): Vec3 => [xIn[0], yR8 + dy, zr]), [-1, 0, 0], "S3", r8[0]),
    fx(DOWEL, [-12, 12].map((dy): Vec3 => [xIn[3], yR8 + dy, zr]), [1, 0, 0], "S4", r8[2]),
    ...r7.flatMap((id, k) => [
      fx(DOWEL, [-15, 15].map((dy): Vec3 => [xIn[3], seam(k) + dy, zr]), [1, 0, 0], "S4", id),
      fx(DOWEL, [-15, 15].map((dy): Vec3 => [xu[2] + T / 2, seam(k) + dy, zr]), [-1, 0, 0], "D6", id),
    ]),
    // long dowels right through the dividers, joining the top rails either side
    fx(LONG_DOWEL, [-12, 12].map((dy): Vec3 => [xu[1] - T / 2, yR8 + dy, zr]), [1, 0, 0], "D5", r8[1]),
    fx(LONG_DOWEL, [-12, 12].map((dy): Vec3 => [xu[2] - T / 2, yR8 + dy, zr]), [1, 0, 0], "D6", r8[2]),
  ];
  const zA = [zu - 130, zu + 130], zC = [zu - 60, zu + 60];
  const topFix: CustomFix[] = [
    ...ups.map((id, i) => fx(CAM_BOLT, zA.map((z): Vec3 => [xu[i], y1, z]), [0, 1, 0], "T1", id)),
    ...ups.map((id, i) => fx(CAM, zA.map((z): Vec3 => [xIn[i], y1 - 25, z]), dirIn[i], id)),
    ...ups.map((id, i) => fx(DOWEL, zC.map((z): Vec3 => [xu[i], y1, z]), [0, -1, 0], id, "T1")),
    ...r8.map((id, k) => fx(DOWEL, [-90, 90].map((x): Vec3 => [bayX[k] + x, y1, zr]), [0, -1, 0], id, "T1")),
    ...r8.map((id, k) => fx(SCREW, [-150, 150].map((x): Vec3 => [bayX[k] + x, y1 - R8H, zr]), [0, 1, 0], id, "T1")),
  ];
  const bottomFix: CustomFix[] = [
    ...ups.map((id, i) => fx(DOWEL, zC.map((z): Vec3 => [xu[i], y0, z]), [0, 1, 0], id, "B2")),
    ...ups.map((id, i) => fx(SCREW, zA.map((z): Vec3 => [xu[i], LEG, z]), [0, 1, 0], "B2", id)),
  ];
  // sixteen nails: seven in the upper panel, nine in the lower one, as the manual draws them
  const zn = -D / 2;
  const [low, up] = backs;
  const yMid = LEG + (H - LEG) / 2;
  const nails: CustomFix[] = [
    fx(NAIL, [-480, -160, 160, 480].map((x): Vec3 => [x, H - T / 2, zn]), [0, 0, 1], up),
    fx(NAIL, [[-(W / 2 - T / 2), yMid + 150, zn]], [0, 0, 1], up),
    fx(NAIL, [yMid + 70, H - 80].map((y): Vec3 => [W / 2 - T / 2, y, zn]), [0, 0, 1], up),
    ...SX.map((sx) => fx(NAIL, [LEG + 90, yMid - 70].map((y): Vec3 => [sx * (W / 2 - T / 2), y, zn]), [0, 0, 1], low)),
    fx(NAIL, [-480, -240, 0, 240, 480].map((x): Vec3 => [x, LEG + T / 2, zn]), [0, 0, 1], low),
  ];
  // hinges 80 mm from the top and bottom of each door: the left door on the left side, the right door on the right divider
  const hy = [y0 + 2 + 80, y0 + 2 + doorH - 80];
  const hinge = (door: string, def: Def, cupX: number, g: number, plateX: number, plateDir: Vec3, on: string): CustomFix[] => [
    fx(def, hy.map((y): Vec3 => [cupX, y, zU]), [0, 0, 1], door, undefined, g < 0 ? { twist: Math.PI } : {}),
    fx(HINGE_SCREW, hy.flatMap((y) => [-12, 12].map((k): Vec3 => [cupX + g * 24, y + k, zU])), [0, 0, 1], door),
    fx(HINGE_SCREW, hy.flatMap((y) => [-16, 16].flatMap((k) => [zU - 20, zU - 52].map((z): Vec3 => [plateX, y + k, z]))), plateDir, on),
  ];
  const sY = shelfY - T / 2 - 3;
  const supports = (b: number, dz: number): CustomFix[] => {
    const zs = [zu - dz, zu + dz];
    const l = b === 0 ? 0 : 1, r = b === 0 ? 1 : 2; // the upright either side of the bay
    return [fx(SHELF_SUPPORT, zs.map((z): Vec3 => [b === 0 ? xIn[0] : xu[1] + T / 2, sY, z]), [-1, 0, 0], ups[l]), fx(SHELF_SUPPORT, zs.map((z): Vec3 => [b === 0 ? xu[1] - T / 2 : xu[2] - T / 2, sY, z]), [1, 0, 0], ups[r])];
  };
  const wall = wallStraps("T1", [-400, 400], H, -D / 2);

  const OUT = 500;
  const all = drawers.flatMap((d) => d.ids);
  const lie = "+z" as const; // on its back
  const steps: CustomStep[] = [
    {
      title: "Build the three drawers",
      detail: "For each drawer: two screws (d) through each side (18 and 19) into the back (20), runners on the outside, and slide the bottom (21) in from the front. Turn four cam bolts (a) into the front (17), push the sides onto them and lock the four cam locks (b).",
      fix: drawers.flatMap((d) => [...d.boxFix, ...d.frontFix]),
      wait: all,
      from: offset(all, [0, 0, OUT]),
      tools: ["screwdriver"],
      kind: "drawer",
      warnings: ["floor"],
    },
    {
      title: "Dowel the rails between the sides and dividers",
      detail: "Lay the left side (3), the two dividers (5, 6) and the right side (4) on their back edges. Join them along the top with the three top rails (8), on dowels (c) at the sides and long dowels (o) through the dividers, and fit the two drawer rails (7) between the right divider and the right side on dowels (c).",
      add: ["S3", r8[0], "D5", r8[1], "D6", r8[2], ...r7, "S4"],
      fix: carcassFix,
      pose: lie,
      warnings: ["floor"],
    },
    {
      title: "Fix the top on",
      detail: "Turn eight cam bolts (a) into the top (1) and push in fourteen dowels (c): two in the end of each side and divider, two in each top rail. Press the top on, lock the eight cam locks (b) and drive two screws (d) through each top rail into it.",
      add: ["T1"],
      fix: topFix,
      from: { T1: [0, 400, 0] },
      pose: lie,
      tools: ["screwdriver"],
    },
    {
      title: "Fix the bottom on",
      detail: "Push two dowels (c) into the end of each side and divider, press the bottom (2) on and drive two screws (d) through it into each of them.",
      add: ["B2"],
      fix: bottomFix,
      from: { B2: [0, -400, 0] },
      pose: lie,
      tools: ["screwdriver"],
    },
    ...legSteps(f, { rail: "13", end: "14", bracket: "15", leg: "16", dowel: "c", screw: "l", bracketScrew: "m", legScrew: "n" }, "-y", "Turn it upside down on a rug. "),
    {
      title: "Stand it up and nail on the back panels",
      detail: "Turn it round. Lay the two back panels (12) on the back, one above the other, and nail them to the top, the bottom and the sides with sixteen nails (k).",
      add: backs,
      fix: nails,
      from: offset(backs, [0, 0, -400]),
      pose: "+y",
      tools: ["hammer"],
    },
    {
      title: "Hang the doors and push in the shelf supports",
      detail: "Two hinges (g) on the left door (9) and two cranked hinges (h) on the right door (10), two screws (i) in each cup. Hang the left door on the left side and the right door on the right divider, four screws (i) in each hinge plate, then adjust the hinges until the gaps are even. Push the eight shelf supports (j) in, four in each bay behind the doors.",
      add: ["D9", "D10"],
      fix: [...hinge("D9", HINGE, door9.x0 + 22, 1, xIn[0], [-1, 0, 0], "S3"), ...hinge("D10", CRANKED_HINGE, door10.x1 - 22, -1, xu[2] - T / 2, [1, 0, 0], "D6"), ...supports(0, 130), ...supports(1, 100)],
      from: offset(["D9", "D10"], [0, 0, 400]),
      tools: ["screwdriver"],
      kind: "doors",
    },
    {
      title: "Slide the shelves in",
      detail: "Rest a shelf (11) on the four supports in each bay behind the doors.",
      add: shelves,
      from: offset(shelves, [0, 0, 450]),
      kind: "shelves",
    },
    {
      title: "Slide the drawers in",
      detail: "Pull each runner in the cabinet forward, rest the drawer's runners on them and push it home. Open only one drawer at a time.",
      add: all,
      from: offset(all, [0, 0, 420]),
      kind: "drawer",
      warnings: ["tip"],
    },
    {
      title: "Fix it to the wall",
      detail: "Screw the two straps (e) to the back edge of the top, a washer under each screw. Push it against the wall, mark through the straps, drill, push in the plugs and screw the straps to the wall with a washer (f). Check for pipes and cables first.",
      fix: [...wall.straps, ...wall.wall],
      ...WALL_STEP,
    },
  ];
  return { parts: p.list, steps };
}

/* ---------- the coffee table ---------- */

function coffeeTable(s: ProductSpec): CustomParams {
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const TT = 18, AH = 60, AT = 18, AI = 35, R = 22.5, ST = 15, LEAN = 0.045;
  const yT = H - TT; // the top's underside: the legs' and rails' tops
  const ox = W / 2 - AI, oz = D / 2 - AI; // the rails' outside faces
  const xl = ox - R, zl = oz - R; // the legs' tops, flush with them
  const yA = yT - AH / 2;
  const yS = 180; // the shelf
  const p = new Parts();
  p.add("TOP", "1", "Top", [W, TT, D], [0, H - TT / 2, 0], {
    pieces: [{ shape: "slab", size: [W, TT, D], pos: [0, 0, 0], round: 40, outline: [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]] }],
  });
  const long = SX.map((sz) => p.add(sz < 0 ? "R3b" : "R3f", "3", "Long rail", [2 * (xl - R), AH, AT], [0, yA, sz * (oz - AT / 2)]));
  const short = SX.map((sx) => p.add(sx < 0 ? "R4l" : "R4r", "4", "Short rail", [AT, AH, 2 * (zl - R)], [sx * (ox - AT / 2), yA, 0]));
  const brackets: string[] = [], legs: string[] = [], bracketFix: CustomFix[] = [], legFix: CustomFix[] = [];
  CORNERS.forEach(([sx, sz], i) => {
    const c = cornerBracket({ sx, sz, xin: ox - AT, zin: oz - AT, xl, zl, r: R, y: yA, h: AH - 10, zc: 0, rail: long[sz < 0 ? 0 : 1], end: short[sx < 0 ? 0 : 1] });
    const b = p.add(`CB${i}`, "5", "Corner bracket", c.size, c.pos, { material: "metal", rot: c.rot });
    const leg = p.add(`LG${i}`, "6", "Leg", [2 * R, yT, 2 * R], [0, 0, 0], { shape: "cyl", material: "wood", ...legAt(sx, sz, xl, zl, 0, yT, LEAN) });
    brackets.push(b);
    legs.push(leg);
    bracketFix.push(...c.screws);
    legFix.push(...c.leg(b, leg));
  });
  p.add("SH", "2", "Shelf", [2 * (xl - 17), ST, 2 * (zl - 17)], [0, yS, 0]);

  const railFix: CustomFix[] = [
    ...long.map((id, i) => fx(DOWEL, [-230, 230].map((x): Vec3 => [x, yT, (i ? 1 : -1) * (oz - AT / 2)]), [0, -1, 0], id, "TOP")),
    ...short.map((id, i) => fx(DOWEL, [-70, 70].map((z): Vec3 => [(i ? 1 : -1) * (ox - AT / 2), yT, z]), [0, -1, 0], id, "TOP")),
    ...long.map((id, i) => fx(LONG_SCREW, [-345, -115, 115, 345].map((x): Vec3 => [x, yT - AH, (i ? 1 : -1) * (oz - AT / 2)]), [0, 1, 0], id, "TOP")),
    ...short.map((id, i) => fx(LONG_SCREW, [-150, 150].map((z): Vec3 => [(i ? 1 : -1) * (ox - AT / 2), yT - AH, z]), [0, 1, 0], id, "TOP")),
  ];
  // the shelf brackets: on the inside of each leg under the shelf's corner, a screw into the leg and one up into the shelf
  const yU = yS - ST / 2;
  const shelfFix: CustomFix[] = CORNERS.flatMap(([sx, sz], i) => {
    const lean = (yT - yU) * LEAN;
    const sxl = xl + lean - R * R2, szl = zl + lean - R * R2; // the leg's surface toward the shelf
    return [
      fx(SHELF_BRACKET, [[sx * (sxl - 10), yU, sz * (szl - 10)]], [0, 1, 0], legs[i], undefined, { twist: Math.atan2(-sx, -sz) }),
      fx(SHELF_BRACKET_SCREW, [[sx * sxl, yU - 22, sz * szl]], [sx * R2, 0, sz * R2], legs[i]),
    ];
  });
  const shelfScrews = fx(
    SHELF_BRACKET_SCREW,
    CORNERS.map(([sx, sz]): Vec3 => {
      const lean = (yT - yU) * LEAN;
      return [sx * (xl + lean - R * R2 - 27), yU, sz * (zl + lean - R * R2 - 27)];
    }),
    [0, 1, 0],
    "SH",
  );

  const flip = "-y" as const;
  const steps: CustomStep[] = [
    {
      title: "Fix the rails under the top",
      detail: "Lay the top (1) face down on a rug. Push two dowels (b) into the top edge of each long rail (3) and short rail (4), set them on the top and drive the long screws (a) down through them: four through each long rail, two through each short one.",
      add: ["TOP", ...long, ...short],
      fix: railFix,
      from: offset([...long, ...short], [0, -300, 0]),
      pose: flip,
      tools: ["screwdriver"],
      warnings: ["floor"],
    },
    {
      title: "Screw a corner bracket into each corner",
      detail: "A bracket (5) across each inside corner where the rails meet, two screws (c) into each rail.",
      add: brackets,
      fix: bracketFix,
      from: offset(brackets, [0, -200, 0]),
      pose: flip,
      tools: ["screwdriver"],
    },
    {
      title: "Screw the legs on",
      detail: "Stand a leg (6) in each corner and drive two screws (d) through the bracket into it, each with a spring washer and a flat washer.",
      add: legs,
      fix: legFix,
      from: offset(legs, [0, -300, 0]),
      pose: flip,
      tools: ["screwdriver"],
      kind: "legs",
    },
    {
      title: "Fit the shelf",
      detail: "Screw a shelf bracket (e) to the inside of each leg first, then lay the shelf (2) on the four brackets and screw it to them.",
      add: ["SH"],
      fix: [...shelfFix, shelfScrews],
      from: { SH: [0, -300, 0] },
      pose: flip,
      tools: ["screwdriver"],
      kind: "shelves",
    },
    { title: "Turn it over and tighten everything", detail: "Turn the table onto its legs, then tighten every screw.", pose: "+y", tools: ["screwdriver"] },
  ];
  return { parts: p.list, steps };
}

function recipe(s: ProductSpec): CustomParams | null {
  switch (s.slug) {
    case "kmart-thorne-bookshelf":
      return bookshelf(s);
    case "kmart-thorne-bookshelf-storage":
      return bookshelfStorage(s);
    case "kmart-thorne-4-drawer-chest":
      return chest(s);
    case "kmart-thorne-buffet-unit":
      return buffet(s);
    case "kmart-thorne-coffee-table":
      return coffeeTable(s);
    default:
      return null;
  }
}

const family: Family = { names: ["KMART:THORNE"], recipe };
export default family;
