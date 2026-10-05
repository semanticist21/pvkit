import { degrees, toRadians } from "../../../units.ts";

/** Inputs for {@link soilingHsu}: one timestep plus the mass returned by the previous call. */
export interface SoilingHsuInput {
  /**
   * Rainfall accumulated over the trailing window ending at this step, mm (pvlib
   * `rain_accum_period`, default 1 h; paper: 1–24 h). The caller owns the window sum.
   */
  rainfallAccumulated: number;
  /**
   * Duration of the step ending now, ms. pvlib assumes the interval before the first sample
   * equals the first interval — pass that on step 0.
   */
  timestepMs: number;
  /** Window rainfall that cleans the panels (greater or equal), mm. pvlib: required. */
  cleaningThreshold: number;
  /** Module tilt from horizontal, degrees. */
  surfaceTilt: number;
  /** PM2.5 concentration, g/m³. */
  pm25: number;
  /** PM10 concentration, g/m³ (coarse fraction `pm10 − pm25`, clamped at 0). */
  pm10: number;
  /** `accumulatedMass` returned by the previous step, g/m². Default 0 (clean at start). */
  prevAccumulatedMass?: number;
  /** PM2.5 deposition (settling) velocity, m/s. Default 0.0009. */
  depoVelocPm25?: number;
  /** PM10 deposition (settling) velocity, m/s. Default 0.004. */
  depoVelocPm10?: number;
}

/** One HSU step: the output plus the state to pass into the next call. */
export interface SoilingHsuResult {
  /** Soiling ratio = 1 − transmission loss, in (0.6563, 1]. */
  soilingRatio: number;
  /** Particulate mass on the module, g/m² — pass as `prevAccumulatedMass` next step. */
  accumulatedMass: number;
}

const TWO_OVER_SQRT_PI = 2 / Math.sqrt(Math.PI);

/**
 * erf(x) for x ≥ 0 via the all-positive series
 * erf(x) = 2/√π · e^(−x²) · Σ 2ⁿ x^(2n+1) / (1·3·…·(2n+1)) (A&S 7.1.6) — no cancellation,
 * a few ULP. erfc(6) ≈ 2e-17 < ε/2, so erf = 1 in float64 from there.
 */
const erf = (x: number): number => {
  if (x >= 6) return 1;
  const x2 = x * x;
  let term = x;
  let sum = x;
  for (let n = 1; term > sum * 1e-17; n++) {
    term *= (2 * x2) / (2 * n + 1);
    sum += term;
  }
  return TWO_OVER_SQRT_PI * Math.exp(-x2) * sum;
};

/**
 * HSU fixed-velocity soiling model (Coello & Boyle 2019), one timestep. Particulates settle
 * at a fixed velocity onto the tilted module; rain over the window at or above the threshold
 * washes the module clean; soiling ratio `SR = 1 − 0.3437·erf(0.17·m^0.8473)`.
 *
 * Iterate over a series, feeding the returned mass back:
 * @example
 * let m = 0;
 * for (const [i, rain1h] of window1h.entries()) {
 *   const r = soilingHsu({ rainfallAccumulated: rain1h, timestepMs: 3_600_000,
 *     cleaningThreshold: 1, surfaceTilt: 30, pm25: 35e-6, pm10: 80e-6, prevAccumulatedMass: m });
 *   m = r.accumulatedMass;
 *   ratio[i] = r.soilingRatio;
 * }
 */
export const soilingHsu = (input: SoilingHsuInput): SoilingHsuResult => {
  const {
    rainfallAccumulated,
    timestepMs,
    cleaningThreshold,
    surfaceTilt,
    pm25,
    pm10,
    prevAccumulatedMass = 0,
    depoVelocPm25 = 0.0009,
    depoVelocPm10 = 0.004,
  } = input;
  if (!(timestepMs >= 0 && Number.isFinite(timestepMs))) {
    throw new RangeError(`timestepMs must be finite and >= 0, got ${timestepMs}`);
  }
  // Negative mass would make m^0.8473 NaN downstream.
  if (!(pm25 >= 0 && pm10 >= 0)) throw new RangeError(`pm25/pm10 must be >= 0: ${pm25}, ${pm10}`);
  // cos(tilt) < 0 would make mass negative and poison the next step.
  if (!(surfaceTilt >= 0 && surfaceTilt <= 90)) {
    throw new RangeError(`surfaceTilt must be in [0, 90], got ${surfaceTilt}`);
  }
  if (!(prevAccumulatedMass >= 0)) {
    throw new RangeError(`prevAccumulatedMass must be >= 0, got ${prevAccumulatedMass}`);
  }

  // `!(>=)`: a NaN window sum does not clean, as in pvlib (`accum_rain >= threshold`).
  let accumulatedMass = 0;
  if (!(rainfallAccumulated >= cleaningThreshold)) {
    const horizontal =
      (pm25 * depoVelocPm25 + Math.max(pm10 - pm25, 0) * depoVelocPm10) * (timestepMs / 1000);
    accumulatedMass = prevAccumulatedMass + horizontal * Math.cos(toRadians(degrees(surfaceTilt)));
  }
  return {
    soilingRatio: 1 - 0.3437 * erf(0.17 * accumulatedMass ** 0.8473),
    accumulatedMass,
  };
};
