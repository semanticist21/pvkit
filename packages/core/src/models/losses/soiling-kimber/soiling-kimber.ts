/** Inputs for {@link soilingKimber}: one timestep plus the state returned by the previous call. */
export interface SoilingKimberInput {
  /**
   * Rainfall accumulated over the trailing cleaning window ending at this step, mm
   * (pvlib `rain_accum_period`, Kimber: one day). The caller owns the window sum.
   */
  rainfallAccumulated: number;
  /**
   * Duration of the step ending now, ms. Pass `0` on the first sample so the series starts
   * at the initial soiling (pvlib convention).
   */
  timestepMs: number;
  /**
   * `accumulatedSoiling` returned by the previous step (unclipped fraction). On the first
   * step: the initial soiling (pvlib `initial_soiling`). Default 0.
   */
  prevAccumulatedSoiling?: number;
  /** `timeSinceRainMs` returned by the previous step. Default `Infinity` (no rain yet). */
  prevTimeSinceRainMs?: number;
  /** Panels washed manually at this step: soiling resets, no grace period. Default false. */
  manualWash?: boolean;
  /** Window rainfall that cleans the panels (strictly greater), mm. Default 6. */
  cleaningThreshold?: number;
  /** Fraction of energy lost per day of soiling. Default 0.0015. */
  soilingLossRate?: number;
  /** Days after a cleaning rain during which the ground is damp and no soiling builds. Default 14. */
  gracePeriod?: number;
  /** Maximum fraction of energy lost to soiling. Default 0.3. */
  maxSoiling?: number;
}

/** One Kimber step: the output plus the state to pass into the next call. */
export interface SoilingKimberResult {
  /** Fraction of energy lost to soiling at this step, clipped to `maxSoiling`. */
  soilingLoss: number;
  /** Unclipped accumulated soiling — pass as `prevAccumulatedSoiling` next step. */
  accumulatedSoiling: number;
  /** Time since the last cleaning rain, ms — pass as `prevTimeSinceRainMs` next step. */
  timeSinceRainMs: number;
}

const MS_PER_DAY = 86_400_000;

/**
 * Kimber soiling model (Kimber et al. 2006), one timestep. Soiling builds at a daily rate
 * until rainfall in the trailing window exceeds a threshold; the panels stay clean for a
 * grace period after such rain; manual washes reset soiling; loss is capped at `maxSoiling`.
 *
 * Iterate over a series, feeding the returned state back:
 * @example
 * let s = { accumulatedSoiling: initialSoiling, timeSinceRainMs: Infinity };
 * for (const [i, rain24h] of window24h.entries()) {
 *   s = soilingKimber({ rainfallAccumulated: rain24h, timestepMs: i === 0 ? 0 : stepMs,
 *     prevAccumulatedSoiling: s.accumulatedSoiling, prevTimeSinceRainMs: s.timeSinceRainMs });
 *   loss[i] = s.soilingLoss;
 * }
 */
export const soilingKimber = (input: SoilingKimberInput): SoilingKimberResult => {
  const {
    rainfallAccumulated,
    timestepMs,
    prevAccumulatedSoiling = 0,
    prevTimeSinceRainMs = Number.POSITIVE_INFINITY,
    manualWash = false,
    cleaningThreshold = 6,
    soilingLossRate = 0.0015,
    gracePeriod = 14,
    maxSoiling = 0.3,
  } = input;
  if (!(timestepMs >= 0 && Number.isFinite(timestepMs))) {
    throw new RangeError(`timestepMs must be finite and >= 0, got ${timestepMs}`);
  }
  if (!(prevTimeSinceRainMs >= 0)) {
    throw new RangeError(`prevTimeSinceRainMs must be >= 0, got ${prevTimeSinceRainMs}`);
  }

  // A cleaning rain restarts the grace clock; the grace window is (t − grace, t].
  const timeSinceRainMs =
    rainfallAccumulated > cleaningThreshold ? 0 : prevTimeSinceRainMs + timestepMs;
  const cleaned = manualWash || timeSinceRainMs < gracePeriod * MS_PER_DAY;
  const accumulatedSoiling = cleaned
    ? 0
    : prevAccumulatedSoiling + (soilingLossRate * timestepMs) / MS_PER_DAY;
  return {
    soilingLoss: accumulatedSoiling < maxSoiling ? accumulatedSoiling : maxSoiling,
    accumulatedSoiling,
    timeSinceRainMs,
  };
};
