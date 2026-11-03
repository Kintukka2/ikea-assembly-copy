import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's 6 Drawer Dresser, read from its assembly manual (keycode 42941941). Two columns of three drawers between two
 * sides (2, 3) and a middle panel (4) that come with their runners already on; rails join them, the top (1) sits on
 * them and two backs (8) are nailed on. There is no bottom panel. The drawers come first:
 *
 * - each drawer box: the sides (11 with its runner on the left, 12 on the right) screwed to the back (13) with screws
 *   (d), and two more through the back into the bottom support (14 under the fronts 9, 7 under the fronts 10); the
 *   bottom (15) slides in from the front; the front locks on with five cam bolts (a), five cam locks (b) and three
 *   dowels (c).
 * - lying on its front: the left column's six rails go onto the middle panel on five double cam bolts (e) and seven long
 *   dowels (f) that pass through it, with five cam locks; the right column's rails take the other ends of the same bolts
 *   and dowels. The left and right sides go on with five cam bolts, five cam locks and seven dowels each.
 * - stood up, the top goes on with six cam bolts and locks, ten dowels and four screws up through the top front rails;
 *   the two backs are nailed on with eighteen nails (g), the drawers slide in (fronts 9 on the left, 10 on the right),
 *   two brackets (h) are screwed to the back of the top and fixed to the wall with plugs and screws (i).
 *
 * Kmart's hardware list: 46 cam bolts (a, 6 x 35 mm), 56 cam locks (b, 15 x 9.5 mm), 42 dowels (c, 6 x 30 mm), 40 screws
 * (d, 4 x 30 mm), 5 double cam bolts (e, 6 x 50 mm), 7 long dowels (f, 6 x 50 mm), 18 nails (g), 2 wall brackets with a
 * washer and a 4 x 12 mm screw each (h) and 2 wall plugs with a washer and a 4 x 35 mm screw each (i). Every count box
 * agrees with the list. Each column has six rails: five (6) with a cam joint at each end and one narrow one (5) held by
 * dowels only, which is how the counts come out (five cams and seven dowels at each end of a column). The drawings
 * don't show plainly which rail sits where, so the guide puts them where the top, the drawers and the backs need them:
 * the top front rail lying flat under the top (it takes the four screws and four of the top's dowels), two rails on
 * edge behind the gaps between the fronts, one on edge low at the front and one low at the back, and the narrow rail
 * under the top at the back, where the backs' top nails go.
 *
 * The manual's step 1 builds all six drawers in three pictures (the box, the bottom, then the front, drawn once for the
 * fronts 9 and once for the fronts 10); the guide gives each its own step, four in all. Part numbers and letters are
 * Kmart's own.
 */

const T = 15; // board
const FT = 18; // drawer fronts
const BK = 3; // backs
const KICK = 40; // the fronts stop this far above the floor
const RL = 300; // runner length
const OUT = 560; // drawers built away from the dresser wait this far in front of it

type Def = { kind: CustomFix["kind"]; len: number; dia: number; name: string; included?: boolean };
const Aa: Def = { kind: "camScrew", len: 35, dia: 6, name: "Cam bolt" };
const Bb: Def = { kind: "cam", len: 9.5, dia: 15, name: "Cam lock" };
const Cc: Def = { kind: "dowel", len: 30, dia: 6, name: "Dowel" };
const Dd: Def = { kind: "screw", len: 30, dia: 4, name: "Screw" };
const Ee: Def = { kind: "camScrew", len: 50, dia: 6, name: "Double cam bolt" };
const Ff: Def = { kind: "dowel", len: 50, dia: 6, name: "Long dowel" };
const Gg: Def = { kind: "nail", len: 25, dia: 2, name: "Nail" };
const BRACKET: Def = { kind: "angle", len: 60, dia: 20, name: "Wall bracket" }; // h
const BRACKET_SCREW: Def = { kind: "screw", len: 12, dia: 4, name: "Bracket screw" }; // h
const BRACKET_WASHER: Def = { kind: "washer", len: 1, dia: 10, name: "Washer" }; // h
const PLUG: Def = { kind: "plug", len: 30, dia: 6, name: "Wall plug", included: true }; // i
const WALL_WASHER: Def = { kind: "washer", len: 1, dia: 12, name: "Washer" }; // i
const WALL_SCREW: Def = { kind: "screw", len: 35, dia: 4, name: "Wall screw", included: true }; // i

const fx = (def: Def, at: Vec3[], dir: Vec3, on?: string, mate?: string): CustomFix => ({ ...def, count: at.length, at, dir, ...(on ? { on } : {}), ...(mate ? { mate } : {}) });
const SX = [-1, 1] as const;
const offset = (ids: string[], v: Vec3) => Object.fromEntries(ids.map((id) => [id, v] as [string, Vec3]));
const box = (size: Vec3, pos: Vec3, material?: PartPiece["material"]): PartPiece => ({ shape: "box", size, pos, ...(material ? { material } : {}) });

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug !== "kmart-6-drawer-dresser") return null;
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const PH = H - T; // sides and middle panel, floor to the top
  const xin = W / 2 - T; // the sides' inside faces
  const BW = xin - T / 2; // a column's width
  const cxs = [-(xin + T / 2) / 2, (xin + T / 2) / 2]; // column centres
  const zB = -D / 2 + BK, zF = D / 2, Dc = zF - zB, zc = (zB + zF) / 2; // the carcass, its fronts flush with the edges
  const zf = zF - FT; // fronts' inside face
  const zfr = zf - T / 2; // rails on edge behind the fronts
  const zbr = zB + T / 2; // rails on edge at the back
  const zt = zf - 35; // the top front rail, lying flat
  const fh = (PH - 3 - KICK - 6) / 3;
  const fy0 = (i: number) => KICK + i * (fh + 3);
  const gap = (k: number) => fy0(k) - 1.5; // between fronts k - 1 and k
  // the drawers
  const DD = 340, zb = zf - DD;
  const sh = 120;
  const ybox = [100, 320, 555];
  const dsx = BW / 2 - 12.5 - T / 2; // drawer side centres from the column's centre
  const zrun = zf - 5 - RL / 2;
  const yrun = (i: number) => ybox[i] + 20;

  // panels with their runners already on: a 7 mm runner on each face that has one, at each drawer
  const runnerPieces = (x: number, py: number, pz: number) => [0, 1, 2].map((i) => box([7, 40, RL], [x, yrun(i) - py, zrun - pz], "metal"));
  const sideW = T + 7;
  const sidePart = (sx: number): CustomPart => {
    const x = sx * (W / 2 - sideW / 2);
    return {
      id: sx < 0 ? "S2" : "S3",
      label: sx < 0 ? "2" : "3",
      name: sx < 0 ? "Left side" : "Right side",
      size: [sideW, PH, Dc],
      pos: [x, PH / 2, zc],
      pieces: [box([T, PH, Dc], [sx * (W / 2 - T / 2) - x, 0, 0]), ...runnerPieces(sx * (xin - 3.5) - x, PH / 2, zc)],
    };
  };
  const mid: CustomPart = {
    id: "M4",
    label: "4",
    name: "Middle panel",
    size: [T + 14, PH, Dc],
    pos: [0, PH / 2, zc],
    pieces: [box([T, PH, Dc], [0, 0, 0]), ...runnerPieces(-(T / 2 + 3.5), PH / 2, zc), ...runnerPieces(T / 2 + 3.5, PH / 2, zc)],
  };

  // a column's rails: where each sits and where its joints are (the cam joint and the dowel beside it)
  const turn: Vec3 = [Math.PI / 2, 0, 0]; // a rail on edge
  interface Rail {
    key: string;
    label: string;
    name: string;
    pos: (cx: number) => Vec3;
    rot?: Vec3;
    size: Vec3;
    cam?: [number, number]; // y, z of the cam joint
    dowels: [number, number][];
    lock?: { y: number; z: number; dir: Vec3 }; // where its cam lock goes in, near each end
  }
  const RAIL: Vec3 = [BW, T, 70];
  const rails: Rail[] = [
    { key: "top", label: "6", name: "Rail", size: RAIL, pos: (cx) => [cx, PH - T / 2, zt], cam: [PH - T / 2, zt + 15], dowels: [[PH - T / 2, zt - 15]], lock: { y: PH - T, z: zt + 15, dir: [0, 1, 0] } },
    ...[1, 2].map((k): Rail => ({ key: `m${k}`, label: "6", name: "Rail", size: RAIL, rot: turn, pos: (cx) => [cx, gap(k), zfr], cam: [gap(k) + 15, zfr], dowels: [[gap(k) - 15, zfr]], lock: { y: gap(k) + 15, z: zf - T, dir: [0, 0, 1] } })),
    { key: "bf", label: "6", name: "Rail", size: RAIL, rot: turn, pos: (cx) => [cx, 55, zfr], cam: [70, zfr], dowels: [[40, zfr]], lock: { y: 70, z: zf - T, dir: [0, 0, 1] } },
    { key: "bb", label: "6", name: "Rail", size: RAIL, rot: turn, pos: (cx) => [cx, 55, zbr], cam: [70, zbr], dowels: [[40, zbr]], lock: { y: 70, z: zB + T, dir: [0, 0, -1] } },
    { key: "tb", label: "5", name: "Narrow back rail", size: [BW, T, 50], rot: turn, pos: (cx) => [cx, PH - 25, zbr], dowels: [[PH - 37, zbr], [PH - 13, zbr]] },
  ];
  const rid = (c: number, r: Rail) => `R${c}${r.key}`;

  const parts: CustomPart[] = [mid];
  [0, 1].forEach((c) => rails.forEach((r) => parts.push({ id: rid(c, r), label: r.label, name: r.name, size: r.size, pos: r.pos(cxs[c]), ...(r.rot ? { rot: r.rot } : {}) })));
  parts.push(sidePart(-1), sidePart(1), { id: "T1", label: "1", name: "Top", size: [W, T, D], pos: [0, H - T / 2, 0] });
  const ySeam = (PH + T) / 2;
  parts.push(
    { id: "K8u", label: "8", name: "Back panel", size: [W - 4, PH - ySeam, BK], pos: [0, (ySeam + PH) / 2, -D / 2 + BK / 2], material: "fiber" },
    { id: "K8l", label: "8", name: "Back panel", size: [W - 4, PH - ySeam, BK], pos: [0, (T + ySeam) / 2, -D / 2 + BK / 2], material: "fiber" },
  );
  // drawers: c is the column, i the drawer from the bottom
  const dr = (c: number, i: number) => ({ f: `F${c}${i}`, l: `L${c}${i}`, r: `R${c}${i}`, bk: `B${c}${i}`, bt: `T${c}${i}`, sp: `S${c}${i}` });
  const sidePieces = (sx: number): PartPiece[] => [box([T, sh, DD], [-sx * 2.75, 0, 0]), box([5.5, 30, RL - 20], [sx * 7.5, 20 - sh / 2, zrun - (zb + DD / 2)], "metal")];
  for (let c = 0; c < 2; c++)
    for (let i = 0; i < 3; i++) {
      const k = dr(c, i), cx = cxs[c], y = ybox[i];
      parts.push(
        { id: k.f, label: c ? "10" : "9", name: c ? "Right drawer front" : "Left drawer front", size: [BW - 4, fh, FT], pos: [cx, fy0(i) + fh / 2, zF - FT / 2] },
        // a drawer side with its runner on the outside: the board and the runner beside it
        { id: k.l, label: "11", name: "Left drawer side", size: [T + 5.5, sh, DD], pos: [cx - dsx - 2.75, y + sh / 2, zb + DD / 2], pieces: sidePieces(-1) },
        { id: k.r, label: "12", name: "Right drawer side", size: [T + 5.5, sh, DD], pos: [cx + dsx + 2.75, y + sh / 2, zb + DD / 2], pieces: sidePieces(1) },
        { id: k.bk, label: "13", name: "Drawer back", size: [2 * dsx - T, sh, T], pos: [cx, y + sh / 2, zb + T / 2] },
        { id: k.sp, label: c ? "7" : "14", name: c ? "Right bottom support" : "Left bottom support", size: [60, T, DD - T], pos: [cx, y + T / 2, (zb + T + zf) / 2] },
        { id: k.bt, label: "15", name: "Drawer bottom", size: [2 * dsx - T + 16, BK, DD + 1], pos: [cx, y + 18, (zb + 7 + zf + 8) / 2], material: "fiber" },
      );
    }
  const cols = [0, 1], rows = [0, 1, 2];
  const allDr = cols.flatMap((c) => rows.map((i) => ({ c, i })));
  const idsOf = (c: number, i: number) => Object.values(dr(c, i));
  const drawerIds = allDr.flatMap((d) => idsOf(d.c, d.i));
  const out = (list: string[]) => offset(list, [0, 0, OUT]);

  /* ---- fittings ---- */
  const dys = (i: number) => [ybox[i] + 30, ybox[i] + sh - 30];
  const boxScrews = ({ c, i }: { c: number; i: number }) => [
    ...SX.map((sx) => fx(Dd, dys(i).map((y): Vec3 => [cxs[c] + sx * (dsx + T / 2), y, zb + T / 2]), [-sx, 0, 0], sx < 0 ? dr(c, i).l : dr(c, i).r, dr(c, i).bk)),
    fx(Dd, [-15, 15].map((x): Vec3 => [cxs[c] + x, ybox[i] + T / 2, zb]), [0, 0, 1], dr(c, i).bk, dr(c, i).sp),
  ];
  const frontFix = ({ c, i }: { c: number; i: number }) => {
    const cx = cxs[c], k = dr(c, i), y0 = ybox[i];
    return [
      fx(Aa, [...SX.flatMap((sx) => dys(i).map((y): Vec3 => [cx + sx * dsx, y, zf])), [cx - 15, y0 + T / 2, zf]], [0, 0, 1], k.f),
      fx(Cc, [...SX.map((sx): Vec3 => [cx + sx * dsx, y0 + sh / 2, zf]), [cx + 15, y0 + T / 2, zf]], [0, 0, 1], k.f),
      ...SX.map((sx) => fx(Bb, dys(i).map((y): Vec3 => [cx + sx * (dsx - T / 2), y, zf - 25]), [sx, 0, 0], sx < 0 ? k.l : k.r)),
      fx(Bb, [[cx - 15, y0, zf - 25]], [0, 1, 0], k.sp),
    ];
  };
  // a column's rails at one end: x is the face they meet, g the way into that panel
  const railEnds = (c: number, x: number, g: number, at: "mid" | "side") => {
    const cam = rails.filter((r) => r.cam);
    const lockX = x - g * 25;
    const panel = at === "mid" ? "M4" : g < 0 ? "S2" : "S3";
    const bolts = at === "mid" ? Ee : Aa;
    const dowel = at === "mid" ? Ff : Cc;
    return {
      bolts: fx(bolts, cam.map((r): Vec3 => [x, r.cam![0], r.cam![1]]), [g, 0, 0], panel),
      dowels: rails.flatMap((r) => r.dowels.map((p): Vec3 => [x, p[0], p[1]])),
      dowelDef: dowel,
      panel,
      locks: cam.map((r) => fx(Bb, [[lockX, r.lock!.y, r.lock!.z]], r.lock!.dir, rid(c, r))),
    };
  };
  const midL = railEnds(0, -T / 2, 1, "mid"); // the double bolts and long dowels go in from the left face, through the panel
  const midR = railEnds(1, T / 2, -1, "mid");
  const sideL = railEnds(0, -xin, -1, "side");
  const sideR = railEnds(1, xin, 1, "side");
  const topZ = [zc - 130, zc + 130];
  const panelsX: [string, number][] = [
    ["S2", -(W / 2 - T / 2)],
    ["M4", 0],
    ["S3", W / 2 - T / 2],
  ];
  const topFix = [
    fx(Aa, panelsX.flatMap(([, x]) => topZ.map((z): Vec3 => [x, PH, z])), [0, 1, 0], "T1"),
    fx(Bb, topZ.map((z): Vec3 => [-xin, PH - 25, z]), [-1, 0, 0], "S2"),
    fx(Bb, topZ.map((z): Vec3 => [T / 2, PH - 25, z]), [-1, 0, 0], "M4"),
    fx(Bb, topZ.map((z): Vec3 => [xin, PH - 25, z]), [1, 0, 0], "S3"),
    ...panelsX.map(([id, x]) => fx(Cc, [zc - 60, zc + 60].map((z): Vec3 => [x, PH, z]), [0, -1, 0], id, "T1")),
    ...cols.map((c) => fx(Cc, [-180, 180].map((dx): Vec3 => [cxs[c] + dx, PH, zt]), [0, -1, 0], rid(c, rails[0]), "T1")),
    ...cols.map((c) => fx(Dd, [-240, 240].map((dx): Vec3 => [cxs[c] + dx, PH - T, zt]), [0, 1, 0], rid(c, rails[0]), "T1")),
  ];
  // nails: down both sides of each back, and along the top and the bottom into the rails and the middle panel
  const zn = -D / 2;
  const nailX = [cxs[0], 0, cxs[1]];
  const nails = [
    fx(Gg, [...nailX.map((x): Vec3 => [x, PH - 25, zn]), ...SX.flatMap((sx) => [PH - 25, 560, ySeam + 25].map((y): Vec3 => [sx * (W / 2 - T / 2), y, zn]))], [0, 0, 1], "K8u"),
    fx(Gg, [...nailX.map((x): Vec3 => [x, 55, zn]), ...SX.flatMap((sx) => [ySeam - 25, 200, T + 25].map((y): Vec3 => [sx * (W / 2 - T / 2), y, zn]))], [0, 0, 1], "K8l"),
  ];
  const wallX = [-(W / 2 - 60), W / 2 - 60];

  const lie = "-z" as const; // on its front edges
  const colRails = (c: number) => rails.map((r) => rid(c, r));
  const steps: CustomStep[] = [
    {
      title: "Screw the drawer boxes together",
      detail: "For all six drawers: two screws (d) through each side (11 and 12) into the ends of the back (13), and two through the back into the bottom support (14 or 7). Runners on the outside.",
      fix: allDr.flatMap(boxScrews),
      wait: allDr.flatMap(({ c, i }) => [dr(c, i).l, dr(c, i).r, dr(c, i).bk, dr(c, i).sp]),
      from: out(drawerIds),
      kind: "drawer",
      warnings: ["floor"],
    },
    { title: "Slide in the drawer bottoms", detail: "Each bottom (15) goes in from the open front, along the grooves, over the support.", wait: allDr.map(({ c, i }) => dr(c, i).bt), from: out(drawerIds), kind: "drawer" },
    ...cols.map(
      (c): CustomStep => ({
        title: c ? "Fix the fronts 10 onto three drawers" : "Fix the fronts 9 onto three drawers",
        detail: `Five cam bolts (a) and three dowels (c) into the back of each front ${c ? "10" : "9"}, then press it onto a box with a ${c ? "7" : "14"} support and turn the five cam locks (b): two in each side, one in the support.`,
        fix: rows.flatMap((i) => frontFix({ c, i })),
        wait: rows.map((i) => dr(c, i).f),
        from: out(drawerIds),
        kind: "drawer",
      }),
    ),
    {
      title: "Fit the left column's rails to the middle panel",
      detail: "Lay the middle panel (4) on its front edge. Push the five double cam bolts (e) and seven long dowels (f) through it, set the left column's six rails (five 6 and the narrow 5) on them and turn five cam locks (b).",
      add: ["M4", ...colRails(0)],
      fix: [midL.bolts, fx(midL.dowelDef, midL.dowels, [1, 0, 0], "M4"), ...midL.locks],
      pose: lie,
      warnings: ["floor"],
    },
    {
      title: "Fit the right column's rails",
      detail: "Push the other six rails onto the ends of the same bolts and dowels on the other face, and turn their five cam locks (b).",
      add: colRails(1),
      fix: midR.locks,
    },
    {
      title: "Fit the left side",
      detail: "Five cam bolts (a) and seven dowels (c) into the left side (2), then press it onto the left rails and turn their five cam locks (b).",
      add: ["S2"],
      fix: [sideL.bolts, fx(Cc, sideL.dowels, [-1, 0, 0], "S2"), ...sideL.locks],
    },
    {
      title: "Fit the right side",
      detail: "The same on the right side (3): five cam bolts (a), seven dowels (c), then five cam locks (b) in the rails.",
      add: ["S3"],
      fix: [sideR.bolts, fx(Cc, sideR.dowels, [1, 0, 0], "S3"), ...sideR.locks],
      check: "square",
    },
    {
      title: "Stand it up and fix the top",
      detail: "Six cam bolts (a) into the top (1) and ten dowels (c) into the top edges. Lower the top on, turn the six cam locks (b) and drive four screws (d) up through the top front rails.",
      add: ["T1"],
      fix: topFix,
      pose: "+y",
    },
    {
      title: "Nail on the backs",
      detail: "Turn it round. Lay the two backs (8) on, one above the other, square the dresser, and drive eighteen nails (g) round their edges into the sides, the rails and the middle panel.",
      add: ["K8u", "K8l"],
      from: offset(["K8u", "K8l"], [0, 0, -500]),
      fix: nails,
      tools: ["hammer"],
      kind: "nails",
    },
    {
      title: "Slide the drawers in",
      detail: "Fronts 9 in the left column and 10 in the right. Pull each pair of runners forward, line the drawer's runners up with them and push it home. Open only one drawer at a time.",
      add: allDr.flatMap(({ c, i }) => idsOf(c, i)),
      from: offset(drawerIds, [0, 0, 420]),
      kind: "drawer",
      warnings: ["tip"],
    },
    {
      title: "Screw the wall brackets on",
      detail: "At both back corners of the top, a bracket (h) standing up behind it, fixed with a washer and a small screw.",
      fix: [
        fx(BRACKET, wallX.map((x): Vec3 => [x, H + 25, zn]), [0, 0, 1], "T1"),
        fx(BRACKET_WASHER, wallX.map((x): Vec3 => [x, H - T / 2, zn]), [0, 0, 1], "T1"),
        fx(BRACKET_SCREW, wallX.map((x): Vec3 => [x, H - T / 2, zn]), [0, 0, 1], "T1"),
      ],
      tools: ["screwdriver"],
    },
    {
      title: "Fix it to the wall",
      detail: "Push it against the wall and mark through the brackets, drill, push in the plugs (i) and screw each bracket to the wall with a washer and a screw. Check for pipes and cables first.",
      fix: [fx(PLUG, wallX.map((x): Vec3 => [x, H + 35, zn - 30]), [0, 0, -1]), fx(WALL_WASHER, wallX.map((x): Vec3 => [x, H + 35, zn - 2]), [0, 0, -1], "T1"), fx(WALL_SCREW, wallX.map((x): Vec3 => [x, H + 35, zn - 2]), [0, 0, -1], "T1")],
      tools: ["drill", "screwdriver", "pencil"],
      wall: true,
      warnings: ["wall", "tip"],
    },
  ];
  return { parts, steps };
}

const family: Family = { names: ["KMART:DRESSER"], recipe };
export default family;
