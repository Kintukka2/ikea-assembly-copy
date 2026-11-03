import type { Family } from "./family";
import type { CustomFix, CustomParams, CustomPart, CustomStep, PartPiece, ProductSpec, Vec3 } from "../../types";

/**
 * Kmart's 4 Drawer Storage Unit on Wheels, read from its one-page manual (42873327_Manual.pdf on Kmart's manual portal;
 * the page itself prints no keycode). A plastic unit that pushes together with no hardware and no tools: four flat
 * frames stacked on sixteen legs, four to a frame, a top on the last four legs, and the four drawers slid in. A leg
 * cap goes under each corner of the bottom frame and a castor pushes into each cap. Each leg has one end that must
 * face up. Kmart's component list: Top x 1, Leg Cap x 4, Caster x 4, Leg x 16, Plastic Drawer x 4, Frame x 4.
 *
 * The manual has no numbered steps, only one exploded drawing from the castors up to the top. The guide takes that
 * stack in the order it goes together: the castors under the bottom frame, then each layer of four legs and the frame
 * on them, then the top, then the drawers (listed with the components, not drawn in the stack). The manual names the
 * parts but gives them no numbers, so the guide letters them itself.
 */

type Fx = Omit<CustomFix, "count" | "at"> & { at: Vec3[] };
const fx = (f: Fx): CustomFix => ({ ...f, count: f.at.length });
const SX = [-1, 1] as const;

const CH = 50; // castor, floor to the bottom of its leg cap
const CAP = 15; // leg cap
const FT = 20; // frame
const TT = 20; // top
const LEG = 25; // leg section
const RIM = 30; // the frame's rim

function recipe(s: ProductSpec): CustomParams | null {
  if (s.slug !== "kmart-4-drawer-storage-unit-on-wheels") return null;
  const W = s.size.w * 10, H = s.size.h * 10, D = s.size.d * 10;
  const L = (H - CH - CAP - 4 * FT - TT) / 4; // a leg, frame to frame
  const yF = [0, 1, 2, 3].map((i) => CH + CAP + i * (FT + L)); // bottom of each frame
  const yTop = yF[3] + FT + L; // bottom of the top
  const xl = W / 2 - LEG / 2, zl = D / 2 - LEG / 2; // the legs, in the corners
  const xc = W / 2 - 15, zc = D / 2 - 15; // the leg caps and castors

  const frame: PartPiece[] = [
    ...SX.map((sz): PartPiece => ({ shape: "box", size: [W, FT, RIM + 10], pos: [0, 0, sz * (D / 2 - (RIM + 10) / 2)] })),
    ...SX.map((sx): PartPiece => ({ shape: "box", size: [RIM, FT, D - 2 * (RIM + 10)], pos: [sx * (W / 2 - RIM / 2), 0, 0] })),
  ];
  // a plastic drawer: floor, sides and back, a front with a grip along its top edge
  const dw = W - 2 * LEG - 6, dh = L - 8, dd = D - 5;
  const box: PartPiece[] = [
    { shape: "box", size: [dw, 3, dd], pos: [0, -dh / 2 + 1.5, 0] },
    ...SX.map((sx): PartPiece => ({ shape: "box", size: [3, dh, dd - 6], pos: [sx * (dw / 2 - 1.5), 0, -1.5] })),
    { shape: "box", size: [dw, dh, 3], pos: [0, 0, -dd / 2 + 1.5] },
    { shape: "box", size: [dw, dh, 5], pos: [0, 0, dd / 2 - 2.5] },
    { shape: "box", size: [Math.round(dw * 0.4), 10, 8], pos: [0, dh / 2 - 12, dd / 2 + 4] },
  ];
  const corners = SX.flatMap((sx) => SX.map((sz) => [sx, sz] as const));
  const parts: CustomPart[] = [];
  yF.forEach((y, i) => parts.push({ id: `F${i}`, name: "Frame", size: [W, FT, D], pos: [0, y + FT / 2, 0], material: "board", pieces: frame }));
  corners.forEach(([sx, sz], k) => parts.push({ id: `C${k}`, name: "Leg cap", size: [30, CAP, 30], pos: [sx * xc, CH + CAP / 2, sz * zc], material: "board" }));
  yF.forEach((y, i) => corners.forEach(([sx, sz], k) => parts.push({ id: `L${i}${k}`, name: "Leg", size: [LEG, L, LEG], pos: [sx * xl, y + FT + L / 2, sz * zl], material: "board" })));
  parts.push({ id: "T", name: "Top", size: [W, TT, D], pos: [0, yTop + TT / 2, 0], material: "board" });
  yF.forEach((y, i) => parts.push({ id: `D${i}`, name: "Plastic drawer", size: [dw, dh, dd], pos: [0, y + FT + 2 + dh / 2, (D - dd) / 2], material: "glass", pieces: box }));

  const legs = (i: number) => corners.map((_, k) => `L${i}${k}`);
  const down = (ids: string[], dy = 260) => Object.fromEntries(ids.map((id) => [id, [0, dy, 0] as Vec3]));
  const castors = corners.map(([sx, sz], k) => fx({ kind: "castor", name: "Castor", len: CH, dia: 40, at: [[sx * xc, CH, sz * zc]], dir: [0, 1, 0], on: `C${k}` }));
  const drawers = yF.map((_, i) => `D${i}`);

  const steps: CustomStep[] = [
    {
      title: "Fit the castors under the bottom frame",
      detail: "Press a leg cap onto each corner under one frame and push a castor firmly into each cap.",
      add: ["F0", "C0", "C1", "C2", "C3"],
      from: { F0: [0, 260, 0], ...down(["C0", "C1", "C2", "C3"], -180) },
      fix: castors,
    },
    {
      title: "Push four legs into the frame",
      detail: "One into each corner. Each leg has an end that goes up: the end with the notched cap, so the narrow peg goes down into the frame.",
      add: legs(0),
      from: down(legs(0)),
    },
    {
      title: "Press on the second frame and four more legs",
      detail: "Lay the next frame on the legs and press it down over their tops at all four corners, then push four legs into it, notched ends up.",
      add: ["F1", ...legs(1)],
      from: down(["F1", ...legs(1)]),
    },
    {
      title: "Add the third frame and its legs",
      detail: "The same again: frame on, pressed down at every corner, and four legs in.",
      add: ["F2", ...legs(2)],
      from: down(["F2", ...legs(2)]),
    },
    {
      title: "Add the fourth frame and its legs",
      detail: "The last frame and the last four legs.",
      add: ["F3", ...legs(3)],
      from: down(["F3", ...legs(3)]),
    },
    {
      title: "Press the top on",
      detail: "Lay the top on the four top legs and press it down at each corner until it sits flat.",
      add: ["T"],
      from: down(["T"], 300),
    },
    {
      title: "Slide in the drawers",
      detail: "One drawer onto each frame, pushed in all the way.",
      add: drawers,
      from: Object.fromEntries(drawers.map((id) => [id, [0, 0, 380] as Vec3])),
    },
  ];
  return { parts, steps };
}

const family: Family = { names: ["KMART:STORAGE UNIT ON WHEELS"], recipe };
export default family;
