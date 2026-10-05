/**
 * SAPM temperature-model presets — King et al. (2004), SAND2004-3535, Table 1.
 * Generated from pvlib 0.16.1 `pvlib.temperature.TEMPERATURE_MODEL_PARAMETERS["sapm"]`
 * by `scripts/fixtures/temperature-sapm.py`. Do not hand-edit.
 */
export const SAPM_TEMPERATURE_PARAMETERS = {
  openRackGlassGlass: { a: -3.47, b: -0.0594, deltaT: 3 },
  closeMountGlassGlass: { a: -2.98, b: -0.0471, deltaT: 1 },
  openRackGlassPolymer: { a: -3.56, b: -0.075, deltaT: 3 },
  insulatedBackGlassPolymer: { a: -2.81, b: -0.0455, deltaT: 0 },
} as const;
