export interface RoofFitInput {
  /**
   * Usable roof rectangle: width along the eave and height up the slope, m (all lengths here
   * are metres — the `gap` default is 0.02 m).
   */
  roofWidth: number;
  roofHeight: number;
  /** Module long and short side, m. */
  moduleLength: number;
  moduleWidth: number;
  /** Clearance kept free along every roof edge (fire/wind setback), m. Default 0. */
  setback?: number;
  /** Gap between neighbouring modules (clamps), m. Default 0.02. */
  gap?: number;
  /** Default: whichever fits more modules (portrait on a tie). */
  orientation?: "portrait" | "landscape";
}

export interface RoofFit {
  orientation: "portrait" | "landscape";
  columns: number;
  rows: number;
  count: number;
  /**
   * Module rectangles, m from the roof's bottom-left corner (x along the eave, y up the
   * slope), row by row; the grid is centred in the usable area.
   */
  modules: { x: number; y: number; width: number; height: number }[];
}

// Tolerance so a run that fits exactly is not lost to float error (e.g. 3 × 1.1 m in 3.3 m).
const fits = (span: number, size: number, gap: number) =>
  span < size ? 0 : Math.floor((span + gap) / (size + gap) + 1e-9);

/**
 * Packs identical modules in a single-orientation grid on a rectangular roof plane.
 * Geometry only: no obstacles, no shading, no string limits (see `pvkit/sizer`).
 *
 * @example roofFit({ roofWidth: 10, roofHeight: 5, moduleLength: 1.7, moduleWidth: 1.1 }).count; // 20
 */
export const roofFit = (input: RoofFitInput): RoofFit => {
  const { roofWidth, roofHeight, moduleLength, moduleWidth, setback = 0, gap = 0.02 } = input;
  for (const [k, v] of Object.entries({ roofWidth, roofHeight, moduleLength, moduleWidth })) {
    if (!(v > 0 && Number.isFinite(v)))
      throw new RangeError(`${k} must be finite and > 0, got ${v}`);
  }
  if (!(setback >= 0 && gap >= 0 && Number.isFinite(setback) && Number.isFinite(gap)))
    throw new RangeError(`setback and gap must be finite and ≥ 0, got ${setback}, ${gap}`);
  const w = roofWidth - 2 * setback;
  const h = roofHeight - 2 * setback;
  const layout = (orientation: "portrait" | "landscape") => {
    const [mw, mh] =
      orientation === "portrait" ? [moduleWidth, moduleLength] : [moduleLength, moduleWidth];
    const columns = fits(w, mw, gap);
    const rows = fits(h, mh, gap);
    return { orientation, columns, rows, mw, mh };
  };
  const p = layout("portrait");
  const l = layout("landscape");
  const best =
    input.orientation === "landscape" ||
    (!input.orientation && l.columns * l.rows > p.columns * p.rows)
      ? l
      : p;
  const { orientation, columns, rows, mw, mh } = best;
  const x0 = setback + (w - (columns * (mw + gap) - gap)) / 2;
  const y0 = setback + (h - (rows * (mh + gap) - gap)) / 2;
  const modules = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      modules.push({ x: x0 + c * (mw + gap), y: y0 + r * (mh + gap), width: mw, height: mh });
    }
  }
  return { orientation, columns, rows, count: columns * rows, modules };
};
