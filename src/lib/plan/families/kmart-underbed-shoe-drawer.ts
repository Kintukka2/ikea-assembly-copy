import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";
import { boxOf } from "../custom";

/**
 * Kmart's Underbed Shoe Drawer on Wheels, read from its assembly manual (K:43-632-671). A low frame of steel tube: two
 * end frames (1), six cross tubes (3) screwed between them, three at the top and three at the bottom, and a mesh cloth
 * (2) with sleeves that hangs in two pockets. Seen from the end, the cloth runs from the back top tube down round the
 * middle bottom tube, up to the middle top tube, down to the front bottom tube and up to the front top tube. Four tubes
 * go through the cloth's sleeves first, the first end frame is screwed on, the last two bottom tubes slide in (the cloth
 * goes round the middle one), the other end frame goes on, and the four castors screw in, tightened with the spanner.
 * The manual says to leave the screws loose until it is all together. Kmart's hardware: 12 screws (A), a spanner (B),
 * two castors (C) and two castors with brakes (D); a Phillips screwdriver is needed, not supplied.
 *
 * Readings the drawings leave open, and the ones chosen: the cross tubes run the long way (69.5 cm), the end frames
 * across (62 cm); the braked castors (D) go on the side where the cloth rises straight up to the top tube, as step 5
 * draws them, and that side is the front.
 *
 * Part numbers and hardware letters are Kmart's own, so the guide reads against the paper.
 */

type Fx = Omit<CustomFix, "count" | "at"> & { at: Vec3[] };
const fx = (f: Fx): CustomFix => ({ ...f, count: f.at.length });
const SX = [-1, 1] as const;

const TD = 16; // tube
const CH = 40; // castors, floor to the bottom of the end frames
const R = 40; // the bends at the top of an end frame
const SCREW_A = { kind: "screw", len: 15, dia: 5, name: "Screw" } as const;

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug !== "kmart-underbed-shoe-drawer-on-wheels") return null;
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const xe = W / 2 - TD / 2; // the end frames
  const ze = D / 2 - TD / 2; // their upright ends
  const yHi = H - TD / 2, yLo = CH + TD / 2; // the top and bottom tubes
  const zt = ze - R - 12; // the back and front cross tubes, on the straight part of the end frame's top
  const tl = 2 * (xe - TD / 2); // a cross tube, between the end frames

  // an end frame: a top tube bent down at both ends, the short uprights, and a bottom tube between them
  const bend = (sz: number): PartPiece[] =>
    [0, 1, 2].map((i) => {
      const a = ((i + 0.5) / 3) * (Math.PI / 2); // from the top tube round to the upright
      const half = Math.PI / 12;
      const r = R * Math.cos(half);
      const segment = 2 * R * Math.sin(half) + TD * 0.4;
      return { shape: "cyl", size: [TD, segment, TD], pos: [0, yHi - R + r * Math.cos(a), sz * (ze - R + r * Math.sin(a))], rot: [-sz * (Math.PI / 2 - a), 0, 0] } as PartPiece;
    });
  const endAbs: PartPiece[] = [
    { shape: "cyl", size: [TD, 2 * (ze - R), TD], pos: [0, yHi, 0], rot: [Math.PI / 2, 0, 0] },
    ...bend(-1),
    ...bend(1),
    ...SX.map((sz): PartPiece => ({ shape: "cyl", size: [TD, yHi - R - CH, TD], pos: [0, (yHi - R + CH) / 2, sz * ze] })),
    { shape: "cyl", size: [TD, 2 * ze - TD, TD], pos: [0, yLo, 0], rot: [Math.PI / 2, 0, 0] },
  ];
  const boxes = endAbs.map((p) => boxOf(p));
  const lo = [1, 2].map((k) => Math.min(...boxes.map((b) => b.min[k])));
  const hi = [1, 2].map((k) => Math.max(...boxes.map((b) => b.max[k])));
  const yc = (lo[0] + hi[0]) / 2, zc = (lo[1] + hi[1]) / 2;
  const endPieces = endAbs.map((p): PartPiece => ({ ...p, pos: [0, p.pos[1] - yc, p.pos[2] - zc] }));
  const endFrame = (id: string, x: number): CustomPart => ({ id, label: "1", name: "End frame", size: [TD, hi[0] - lo[0], hi[1] - lo[1]], pos: [x, yc, zc], material: "metal", pieces: endPieces });

  // the mesh cloth, seen from the end: back top tube down to the middle bottom one, up, down to the front bottom, up
  const drop = yHi - yLo, run = zt;
  const slope = Math.hypot(run, drop), ang = Math.atan2(drop, run);
  const cw = tl - 20;
  const cloth: PartPiece[] = [
    { shape: "box", size: [cw, 2, slope], pos: [0, 0, -zt / 2], rot: [ang, 0, 0] },
    { shape: "box", size: [cw, drop, 2], pos: [0, 0, 0] },
    { shape: "box", size: [cw, 2, slope], pos: [0, 0, zt / 2], rot: [ang, 0, 0] },
    { shape: "box", size: [cw, drop, 2], pos: [0, 0, zt] },
  ];
  const tube = (id: string, y: number, z: number): CustomPart => ({ id, label: "3", name: "Tube", size: [tl, TD, TD], pos: [0, y, z], shape: "cyl", material: "metal" });
  const parts: CustomPart[] = [
    { id: "M", label: "2", name: "Mesh cloth", size: [cw, drop, 2 * zt], pos: [0, (yHi + yLo) / 2, 0], material: "soft", pieces: cloth },
    tube("T4", yHi, -zt), // through the cloth's sleeves: back top, middle top, front top, front bottom
    tube("T3", yHi, 0),
    tube("T1", yHi, zt),
    tube("T2", yLo, zt),
    tube("TB", yLo, -zt), // slid in afterwards: back bottom, and middle bottom with the cloth round it
    tube("TM", yLo, 0),
    endFrame("ER", xe),
    endFrame("EL", -xe),
  ];

  const screws = (sx: -1 | 1, tubes: [number, number][]) => fx({ ...SCREW_A, at: tubes.map(([y, z]): Vec3 => [sx * (W / 2), y, z]), dir: [-sx, 0, 0], on: sx < 0 ? "EL" : "ER" });
  const sleeved: [number, number][] = [
    [yHi, -zt],
    [yHi, 0],
    [yHi, zt],
    [yLo, zt],
  ];
  const loose: [number, number][] = [
    [yLo, -zt],
    [yLo, 0],
  ];
  const castor = (name: string, sz: -1 | 1) =>
    SX.map((sx) => fx({ kind: "castor", name, len: CH, dia: 30, at: [[sx * xe, CH, sz * ze]], dir: [0, 1, 0], on: sx < 0 ? "EL" : "ER" }));

  const steps: CustomStep[] = [
    {
      title: "Thread four tubes through the mesh",
      detail: "Lay the mesh cloth (2) out and slide a tube (3) through each of its four sleeves: the back top edge, the middle top, the front top and the front bottom.",
      add: ["M", "T4", "T3", "T1", "T2"],
      from: { M: [0, 260, 0], T4: [420, 0, 0], T3: [420, 0, 0], T1: [420, 0, 0], T2: [420, 0, 0] },
    },
    {
      title: "Screw on the first end frame",
      detail: "Hold an end frame (1) against the ends of the four tubes and drive a screw (A) through it into each one. Leave them loose for now.",
      add: ["ER"],
      from: { ER: [380, 0, 0] },
      fix: [screws(1, sleeved)],
      tools: ["screwdriver"],
      warnings: ["loose"],
    },
    {
      title: "Slide in the last two tubes",
      detail: "Push one tube (3) in along the back bottom and one along the middle bottom, inside the fold of the mesh so the cloth goes round it. Screw each one to the end frame with a screw (A).",
      add: ["TB", "TM"],
      from: { TB: [-420, 0, 0], TM: [-420, 0, 0] },
      fix: [screws(1, loose)],
      tools: ["screwdriver"],
      warnings: ["loose"],
    },
    {
      title: "Screw on the other end frame",
      detail: "Fit the second end frame (1) over the free ends of all six tubes and drive a screw (A) into each one.",
      add: ["EL"],
      from: { EL: [-380, 0, 0] },
      fix: [screws(-1, [...sleeved, ...loose])],
      tools: ["screwdriver"],
      warnings: ["loose"],
    },
    {
      title: "Screw in the castors and tighten up",
      detail: "One under each corner of the end frames: the plain castors (C) at the back, the ones with brakes (D) at the front, where the mesh rises straight up. Tighten them with the spanner (B), then tighten all twelve screws.",
      fix: [...castor("Castor", -1), ...castor("Castor with brake", 1)],
      tools: ["wrench", "screwdriver"],
    },
  ];
  return { parts, steps };
}

const family: Family = { names: ["KMART:UNDERBED SHOE DRAWER"], recipe };
export default family;
