import { type DiscResult, disc } from "../disc/disc.ts";
import { DIRINT_COEFFS } from "./dirint-coefficients.ts";

/** A neighbouring sample (previous/next timestep) for the ΔKt' stability index. */
export interface DirintNeighbor {
  /** Global horizontal irradiance at that step, W/m². */
  ghi: number;
  /** True solar zenith at that step, degrees. */
  solarZenith: number;
  /** That step's instant, UTC epoch ms. */
  timeMs: number;
  /** That step's pressure, Pa (`null` → relative air mass). Default: the current step's. */
  pressure?: number | null;
}

/** Inputs for {@link dirint}. */
export interface DirintInput {
  /** Global horizontal irradiance, W/m². */
  ghi: number;
  /** True solar zenith, degrees. */
  solarZenith: number;
  /** Instant as UTC epoch ms. */
  timeMs: number;
  /** Site pressure, Pa. Default 101325. `null` → relative (sea-level) air mass. */
  pressure?: number | null;
  /** Use the ΔKt' stability index from `previous`/`next`. Default true. */
  useDeltaKtPrime?: boolean;
  /** Dew-point temperature, °C. Default: unknown (`null`/omitted). */
  tempDew?: number | null;
  /** Floor on cos(zenith) when computing kt. Default 0.065. */
  minCosZenith?: number;
  /** Above this zenith (degrees) DISC DNI is set to 0. Default 87. */
  maxZenith?: number;
  /** Previous timestep; omit at the start of a series. */
  previous?: DirintNeighbor | undefined;
  /** Next timestep; omit at the end of a series. */
  next?: DirintNeighbor | undefined;
}

/** Zenith-independent clearness index kt' (Perez 1990), clipped to [0, 1]. */
const ktPrime = ({ kt, airmass }: DiscResult): number => {
  const k = kt / (1.031 * Math.exp(-1.4 / (0.9 + 9.4 / airmass)) + 0.1);
  return Math.min(Math.max(k, 0), 1);
};

/** 0-based bin of `x` given ascending lower edges; -1 below the first edge, above `max`, or NaN. */
const bin = (x: number, edges: readonly number[], max = Number.POSITIVE_INFINITY): number => {
  if (!(x >= (edges[0] as number) && x <= max)) return -1;
  let i = 0;
  while (i + 1 < edges.length && x >= (edges[i + 1] as number)) i++;
  return i;
};

const KT_EDGES = [0, 0.24, 0.4, 0.56, 0.7, 0.8];
const ZENITH_EDGES = [0, 25, 40, 55, 70, 80];
const W_EDGES = [0, 1, 2, 3];
const DKT_EDGES = [0, 0.015, 0.035, 0.07, 0.15, 0.3];

/**
 * DIRINT (Perez et al. 1992): DISC DNI scaled by an empirical coefficient binned on kt',
 * zenith, the ΔKt' stability index and precipitable water from dew point
 * (pvlib `irradiance.dirint`, one instant).
 *
 * ΔKt' is the mean of |kt' − kt'(neighbour)| over the neighbours given (pandas skips NaN);
 * with no usable neighbour it is NaN and so is the result, as in pvlib. Returns NaN for
 * zenith > 90° (air mass undefined) and 0 for `maxZenith` < zenith ≤ 90°.
 *
 * @returns DNI, W/m².
 */
export const dirint = (input: DirintInput): number => {
  const {
    ghi,
    solarZenith,
    timeMs,
    pressure = 101_325,
    useDeltaKtPrime = true,
    tempDew = null,
    minCosZenith = 0.065,
    maxZenith = 87,
    previous,
    next,
  } = input;
  const d = disc({ ghi, solarZenith, timeMs, pressure, minCosZenith, maxZenith });
  const kp = ktPrime(d);

  let dktBin = 6; // stability unknown
  if (useDeltaKtPrime) {
    let sum = 0;
    let n = 0;
    for (const nb of [previous, next]) {
      if (nb === undefined) continue;
      const nbKp = ktPrime(
        disc({
          ghi: nb.ghi,
          solarZenith: nb.solarZenith,
          timeMs: nb.timeMs,
          pressure: nb.pressure === undefined ? pressure : nb.pressure,
          minCosZenith,
          maxZenith,
        }),
      );
      const diff = Math.abs(kp - nbKp);
      if (Number.isNaN(diff)) continue;
      sum += diff;
      n++;
    }
    dktBin = bin(n > 0 ? sum / n : Number.NaN, DKT_EDGES, 1);
  }
  const wBin = tempDew === null ? 4 : bin(Math.exp(0.07 * tempDew - 0.075), W_EDGES);
  const coeff =
    DIRINT_COEFFS[bin(kp, KT_EDGES, 1)]?.[bin(solarZenith, ZENITH_EDGES)]?.[dktBin]?.[wBin];
  return coeff === undefined ? Number.NaN : d.dni * coeff;
};
