import { compensatedSum } from "../../../sum.ts";

/** Inputs for {@link performanceRatio}. Series are per-interval values over the same period. */
export interface PerformanceRatioInput {
  /** Delivered energy per interval, kWh (a one-element total is fine). */
  energy: ArrayLike<number>;
  /** In-plane irradiation per interval, kWh/m² (a one-element total is fine). */
  poaIrradiation: ArrayLike<number>;
  /** Array STC (nameplate DC) power, kWp, > 0. */
  pdc0: number;
  /** Reference irradiance, W/m². Default 1000 (STC). */
  gRef?: number;
  /**
   * Temperature correction (Dierauf et al. 2013): cell temperature per interval, °C,
   * aligned with `poaIrradiation`. Requires `gammaPdc` and `cellTemperatureRef`.
   */
  cellTemperature?: ArrayLike<number>;
  /** Power temperature coefficient, 1/°C (e.g. -0.004). Required with `cellTemperature`. */
  gammaPdc?: number;
  /**
   * Reference cell temperature, °C. Required with `cellTemperature`. Dierauf: the
   * irradiance-weighted average over a typical year ({@link irradianceWeightedTemperature});
   * IEC 61724-1 STC-corrected PR: 25.
   */
  cellTemperatureRef?: number;
}

const positive = (name: string, v: number): void => {
  if (!(v > 0 && Number.isFinite(v)))
    throw new RangeError(`${name} must be finite and > 0, got ${v}`);
};

/** PR is undefined (NaN) when the reference yield is 0 — also for night tare (x/0 → ±Inf). */
const ratio = (num: number, den: number): number => (den === 0 ? Number.NaN : num / den);

/**
 * Performance ratio `PR = Y_f / Y_r` (IEC 61724-1): final yield `ΣE / P0` over reference
 * yield `ΣH / G_ref`. With `cellTemperature`, the temperature-corrected PR of Dierauf et
 * al. (2013): `ΣE / Σ[P0 · H_i/G_ref · (1 + γ (T_i − T_ref))]`.
 * Returns NaN when the reference yield is 0 (e.g. a night-only window, even with tare).
 *
 * @example
 * performanceRatio({ energy: [800], poaIrradiation: [2], pdc0: 500 }); // 0.8
 */
export const performanceRatio = (input: PerformanceRatioInput): number => {
  const { energy, poaIrradiation, pdc0, gRef = 1000 } = input;
  const { cellTemperature, gammaPdc, cellTemperatureRef } = input;
  positive("pdc0", pdc0);
  positive("gRef", gRef);
  const kwPerKwp = pdc0 / (gRef / 1000);
  if (cellTemperature === undefined && gammaPdc === undefined && cellTemperatureRef === undefined) {
    return ratio(compensatedSum(energy), compensatedSum(poaIrradiation) * kwPerKwp);
  }
  if (cellTemperature === undefined || gammaPdc === undefined || cellTemperatureRef === undefined) {
    throw new RangeError(
      "temperature correction needs cellTemperature, gammaPdc and cellTemperatureRef",
    );
  }
  if (cellTemperature.length !== poaIrradiation.length) {
    throw new RangeError(
      `cellTemperature length ${cellTemperature.length} != poaIrradiation length ${poaIrradiation.length}`,
    );
  }
  if (!Number.isFinite(gammaPdc)) throw new RangeError(`gammaPdc must be finite, got ${gammaPdc}`);
  if (!Number.isFinite(cellTemperatureRef)) {
    throw new RangeError(`cellTemperatureRef must be finite, got ${cellTemperatureRef}`);
  }
  const expected = new Float64Array(poaIrradiation.length);
  for (let i = 0; i < expected.length; i++) {
    const h = poaIrradiation[i] as number;
    const t = cellTemperature[i] as number;
    expected[i] = h * (1 + gammaPdc * (t - cellTemperatureRef));
  }
  return ratio(compensatedSum(energy), compensatedSum(expected) * kwPerKwp);
};

/**
 * Irradiance-weighted average cell temperature `Σ(H_i·T_i) / ΣH_i`, °C — Dierauf's
 * `T_cell_typ_avg`, computed from a typical-year simulation and passed as
 * `cellTemperatureRef`. (Using the test period's own average makes the correction cancel
 * exactly: corrected PR = uncorrected PR.) NaN when ΣH = 0.
 */
export const irradianceWeightedTemperature = (input: {
  /** In-plane irradiation (or irradiance) per interval, kWh/m² (any consistent unit). */
  poaIrradiation: ArrayLike<number>;
  /** Cell temperature per interval, °C. */
  cellTemperature: ArrayLike<number>;
}): number => {
  const { poaIrradiation, cellTemperature } = input;
  if (cellTemperature.length !== poaIrradiation.length) {
    throw new RangeError(
      `cellTemperature length ${cellTemperature.length} != poaIrradiation length ${poaIrradiation.length}`,
    );
  }
  const ht = new Float64Array(poaIrradiation.length);
  for (let i = 0; i < ht.length; i++) {
    ht[i] = (poaIrradiation[i] as number) * (cellTemperature[i] as number);
  }
  return compensatedSum(ht) / compensatedSum(poaIrradiation);
};
