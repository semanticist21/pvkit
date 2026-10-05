import { clearnessIndex, spencerDniExtra } from "../clearness-index/clearness-index.ts";

const D2R = Math.PI / 180;

/** Inputs for {@link disc}. */
export interface DiscInput {
  /** Global horizontal irradiance, W/m². */
  ghi: number;
  /** True solar zenith, degrees. */
  solarZenith: number;
  /** Instant as UTC epoch ms (sets I0, Spencer with solar constant 1370 W/m²). */
  timeMs: number;
  /** Site pressure, Pa. Default 101325. `null` → relative (sea-level) air mass. */
  pressure?: number | null;
  /** Floor on cos(zenith) when computing kt. Default 0.065. */
  minCosZenith?: number;
  /** Above this zenith (degrees) DNI is set to 0. Default 87. */
  maxZenith?: number;
  /** Upper clip on air mass. Default 12. */
  maxAirmass?: number;
}

/** DISC output. */
export interface DiscResult {
  /** Direct normal irradiance, W/m². */
  dni: number;
  /** Clearness index (clipped to [0, 1]). */
  kt: number;
  /** Air mass used (absolute unless `pressure` is null, clipped to `maxAirmass`); NaN for zenith > 90°. */
  airmass: number;
}

/**
 * Maxwell (1987) DISC model: GHI → DNI via kt and air mass (pvlib `irradiance.disc`).
 *
 * @example
 * disc({ ghi: 800, solarZenith: 30, timeMs: Date.UTC(2024, 5, 10) });
 */
export const disc = (input: DiscInput): DiscResult => {
  const {
    ghi,
    solarZenith,
    timeMs,
    pressure = 101_325,
    minCosZenith = 0.065,
    maxZenith = 87,
    maxAirmass = 12,
  } = input;
  const i0 = spencerDniExtra(timeMs, 1370);
  const kt = clearnessIndex({ ghi, solarZenith, dniExtra: i0, minCosZenith, maxClearnessIndex: 1 });
  // Kasten (1966) relative air mass; NaN below the horizon (pvlib get_relative_airmass).
  const z = solarZenith > 90 ? Number.NaN : solarZenith;
  let am = 1 / (Math.cos(z * D2R) + 0.15 * (93.885 - z) ** -1.253);
  if (pressure !== null) am = (am * pressure) / 101_325;
  am = Math.min(am, maxAirmass);

  let a: number;
  let b: number;
  let c: number;
  if (kt <= 0.6) {
    a = 0.512 + kt * (-1.56 + kt * (2.286 - 2.222 * kt));
    b = 0.37 + 0.962 * kt;
    c = -0.28 + kt * (0.932 - 2.048 * kt);
  } else {
    a = -5.743 + kt * (21.77 + kt * (-27.49 + 11.56 * kt));
    b = 41.4 + kt * (-118.5 + kt * (66.05 + 31.9 * kt));
    c = -47.01 + kt * (184.2 + kt * (-222.0 + 73.81 * kt));
  }
  const knc = 0.866 + am * (-0.122 + am * (0.0121 + am * (-0.000653 + 1.4e-5 * am)));
  const dni = (knc - (a + b * Math.exp(c * am))) * i0;
  const bad = solarZenith > maxZenith || ghi < 0 || dni < 0;
  return { dni: bad ? 0 : dni, kt, airmass: am };
};
