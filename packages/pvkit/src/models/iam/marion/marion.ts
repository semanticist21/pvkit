import { compensatedSum } from "../../../sum.ts";
import { degrees, radians, toDegrees, toRadians } from "../../../units.ts";

/** Diffuse region to integrate over (Marion 2017). */
export type MarionRegion = "sky" | "horizon" | "ground";

/** Inputs for {@link marionIntegrate}. */
export interface MarionIntegrateInput {
  /** IAM as a function of angle of incidence in degrees, e.g. `(aoi) => physical({ aoi })`. */
  iam: (aoi: number) => number;
  /** Surface tilt from horizontal, degrees (0 = facing up, 90 = vertical). */
  surfaceTilt: number;
  /**
   * `sky`: zenith ≤ 90°; `horizon`: 89.5° ≤ zenith ≤ 90°; `ground`: zenith ≥ 90°.
   */
  region: MarionRegion;
  /** Zenith increments over [0, π). Default 180 for sky/ground, 1800 for horizon. */
  num?: number;
}

/** Inputs for {@link marionDiffuse}. */
export type MarionDiffuseInput = Omit<MarionIntegrateInput, "region" | "num">;

/** Diffuse IAM per region, unitless. */
export interface MarionDiffuseResult {
  sky: number;
  horizon: number;
  ground: number;
}

const HALF_PI = Math.PI / 2;
const HORIZON_LO = (89.5 * Math.PI) / 180;

/**
 * Marion (2017) diffuse IAM for one region: the cos(aoi)·dA-weighted mean of `iam` over the
 * region's solid angle, on a `num × 2·num` zenith/azimuth grid with midpoint evaluation.
 * Patches with aoi ≥ 90° get zero weight; 0 when no patch faces the surface (e.g. ground at
 * tilt 0). Same grid, masks and evaluation order as pvlib (`iam` is called on every patch,
 * masked ones included, so a NaN from `iam` propagates as in pvlib).
 *
 * @throws RangeError if `num` is not a positive integer or `region` is unknown.
 * @example
 * marionIntegrate({ iam: (aoi) => ashrae({ aoi }), surfaceTilt: 20, region: "sky" }); // ≈ 0.95961
 */
export const marionIntegrate = ({
  iam,
  surfaceTilt,
  region,
  num,
}: MarionIntegrateInput): number => {
  const steps = num ?? (region === "horizon" ? 1800 : 180);
  if (!(Number.isInteger(steps) && steps > 0)) {
    throw new RangeError(`num must be a positive integer, got ${num}`);
  }
  if (region !== "sky" && region !== "horizon" && region !== "ground") {
    throw new RangeError(`unknown region: ${region}`);
  }
  const beta = toRadians(degrees(surfaceTilt));
  const cosBeta = Math.cos(beta);
  const sinBeta = Math.sin(beta);
  const ai = Math.PI / steps;

  const phis: number[] = [];
  for (let i = 0; i < steps; i++) {
    const phi = i * ai;
    const keep =
      region === "sky"
        ? phi + ai <= HALF_PI
        : region === "horizon"
          ? HORIZON_LO <= phi && phi + ai <= HALF_PI
          : phi >= HALF_PI;
    if (keep) phis.push(phi);
  }

  const numerator = new Float64Array(phis.length * 2 * steps);
  const denominator = new Float64Array(numerator.length);
  let passed = 0;
  let idx = 0;
  for (const phi1 of phis) {
    const phiAvg = phi1 + 0.5 * ai;
    const term1 = cosBeta * Math.cos(phiAvg);
    const sinPhi = sinBeta * Math.sin(phiAvg);
    // Patch solid angle (Eq. 8 with Δψ = ai).
    const dAs = ai * (Math.cos(phi1) - Math.cos(phi1 + ai));
    for (let j = 0; j < 2 * steps; j++) {
      const cosAoi = term1 + sinPhi * Math.cos(j * ai + 0.5 * ai);
      const aoi = Math.acos(cosAoi);
      const weight = aoi < HALF_PI ? cosAoi * dAs : 0;
      if (aoi < HALF_PI) passed++;
      numerator[idx] = iam(toDegrees(radians(aoi))) * weight;
      denominator[idx++] = weight;
    }
  }
  if (passed === 0 && Number.isFinite(beta)) return 0;
  return compensatedSum(numerator) / compensatedSum(denominator);
};

/**
 * Marion (2017) diffuse IAMs for sky, horizon band and ground, each via
 * {@link marionIntegrate} with its default `num`.
 *
 * @example
 * marionDiffuse({ iam: (aoi) => physical({ aoi }), surfaceTilt: 20 });
 * // ≈ { sky: 0.95392, horizon: 0.76527, ground: 0.63871 }
 */
export const marionDiffuse = ({ iam, surfaceTilt }: MarionDiffuseInput): MarionDiffuseResult => ({
  sky: marionIntegrate({ iam, surfaceTilt, region: "sky" }),
  horizon: marionIntegrate({ iam, surfaceTilt, region: "horizon" }),
  ground: marionIntegrate({ iam, surfaceTilt, region: "ground" }),
});
