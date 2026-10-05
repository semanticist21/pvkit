const D2R = Math.PI / 180;

/** Inputs for {@link completeIrradiance}: give exactly two of `ghi`, `dhi`, `dni`. */
export interface CompleteIrradianceInput {
  /** True solar zenith, degrees. */
  solarZenith: number;
  /** Global horizontal irradiance, W/m². */
  ghi?: number;
  /** Diffuse horizontal irradiance, W/m². */
  dhi?: number;
  /** Direct normal irradiance, W/m². */
  dni?: number;
  /** Clear-sky DNI, W/m²; only used when solving for `dni` (limits it near the horizon). */
  dniClear?: number;
}

/** All three components, W/m². */
export interface CompleteIrradianceResult {
  ghi: number;
  dhi: number;
  dni: number;
}

/**
 * Fill the missing component from the closure `GHI = DHI + DNI · cos z`
 * (pvlib `irradiance.complete_irradiance`, one instant).
 *
 * Solving for DNI follows pvlib `irradiance.dni`: negative DNI → NaN; non-zero DNI at
 * zenith ≥ 88° → NaN; with `dniClear`, DNI above `1.1 · dniClear` at zenith in [80°, 88°)
 * is clipped to that limit. Solving for GHI or DHI applies no guard.
 *
 * @throws RangeError unless exactly one of `ghi`, `dhi`, `dni` is omitted.
 */
export const completeIrradiance = (input: CompleteIrradianceInput): CompleteIrradianceResult => {
  const { solarZenith, ghi, dhi, dni, dniClear } = input;
  const cosZ = Math.cos(solarZenith * D2R);
  if (ghi !== undefined && dhi !== undefined && dni === undefined) {
    let d = (ghi - dhi) / cosZ;
    if (d < 0) d = Number.NaN;
    // d is exactly 0 iff ghi === dhi (inputs, not a computed float).
    if (solarZenith >= 88 && ghi !== dhi) d = Number.NaN;
    // `>` (not Math.min) so a NaN dniClear leaves d untouched, as pvlib's mask does.
    if (dniClear !== undefined && solarZenith >= 80 && solarZenith < 88 && d > dniClear * 1.1) {
      d = dniClear * 1.1;
    }
    return { ghi, dhi, dni: d };
  }
  if (dni !== undefined && dhi !== undefined && ghi === undefined) {
    return { ghi: dhi + dni * cosZ, dhi, dni };
  }
  if (dni !== undefined && ghi !== undefined && dhi === undefined) {
    return { ghi, dhi: ghi - dni * cosZ, dni };
  }
  throw new RangeError("exactly one of ghi, dhi, dni must be omitted");
};
