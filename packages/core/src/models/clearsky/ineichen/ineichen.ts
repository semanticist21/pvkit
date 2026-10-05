import { degrees, toRadians } from "../../../units.ts";

/** Inputs for {@link ineichen}. */
export interface IneichenInput {
  /** Refraction-corrected solar zenith angle, degrees. */
  apparentZenith: number;
  /** Pressure-corrected (absolute) air mass, unitless. NaN (e.g. sun below horizon) → zeros. */
  airmassAbsolute: number;
  /** Linke turbidity (air mass 2), unitless, > 0. */
  linkeTurbidity: number;
  /** Site altitude above sea level, metres. Default 0. */
  altitude?: number;
  /** Extraterrestrial normal irradiance, W/m² (sets the output unit). Default 1364. */
  dniExtra?: number;
  /** Apply the Perez et al. (2002) enhancement `exp(0.01·AM^1.8)` to GHI. Default false. */
  perezEnhancement?: boolean;
}

/** Clear-sky irradiance components, in the unit of `dniExtra` (W/m²). */
export interface ClearSkyIrradiance {
  /** Global horizontal irradiance. */
  ghi: number;
  /** Direct normal irradiance. */
  dni: number;
  /** Diffuse horizontal irradiance. */
  dhi: number;
}

/** numpy `fmax`: NaN in `a` yields `b`. */
const fmax = (a: number, b: number) => (Number.isNaN(a) ? b : Math.max(a, b));

/**
 * Ineichen–Perez (2002) clear-sky model: GHI and DNI from Linke turbidity and air mass,
 * `DHI = GHI − DNI·cos z`.
 *
 * @example
 * ineichen({ apparentZenith: 30, airmassAbsolute: 1.154, linkeTurbidity: 3 });
 */
export const ineichen = (input: IneichenInput): ClearSkyIrradiance => {
  const {
    apparentZenith,
    airmassAbsolute: am,
    linkeTurbidity: tl,
    altitude = 0,
    dniExtra = 1364,
    perezEnhancement = false,
  } = input;
  if (tl <= 0) throw new RangeError(`linkeTurbidity must be > 0, got ${tl}`);
  if (am < 0) throw new RangeError(`airmassAbsolute must be ≥ 0, got ${am}`);

  // Night → cos z = 0 → zeros; Math.max propagates a NaN zenith, as np.maximum.
  const cosZ = Math.max(Math.cos(toRadians(degrees(apparentZenith))), 0);
  const fh1 = Math.exp(-altitude / 8000);
  const fh2 = Math.exp(-altitude / 1250);
  const cg1 = 5.09e-5 * altitude + 0.868;
  const cg2 = 3.92e-5 * altitude + 0.0387;

  let g = Math.exp(-cg2 * am * (fh1 + fh2 * (tl - 1)));
  if (perezEnhancement) g *= Math.exp(0.01 * am ** 1.8);
  // fmax maps a NaN air mass to 0 output; `tl / tl` re-inserts a NaN Linke turbidity (pvlib).
  const ghi = ((cg1 * dniExtra * cosZ * tl) / tl) * fmax(g, 0);

  // b from Ineichen & Perez (2002); Perez et al. (2002) would give 0.664 + 0.16268/fh1.
  const b = 0.664 + 0.163 / fh1;
  const bnci = dniExtra * fmax(b * Math.exp(-0.09 * am * (tl - 1)), 0);
  // Empirical correction, capped at 1e20 so cos z = 0 gives 0·1e20 = 0 instead of NaN.
  const corr = (1 - (0.1 - 0.2 * Math.exp(-tl)) / (0.1 + 0.882 / fh1)) / cosZ;
  const bnci2 = ghi * Math.min(fmax(corr, 0), 1e20);
  const dni = Math.min(bnci, bnci2);
  return { ghi, dni, dhi: ghi - dni * cosZ };
};
