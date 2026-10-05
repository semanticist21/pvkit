/**
 * PVsyst cell-temperature presets (PVsyst help, "Array thermal losses").
 * Generated from pvlib 0.16.1 `pvlib.temperature.TEMPERATURE_MODEL_PARAMETERS["pvsyst"]`
 * by `scripts/fixtures/temperature-pvsyst-cell.py`. Do not hand-edit.
 */
export const PVSYST_TEMPERATURE_PARAMETERS = {
  freestanding: { uC: 29.0, uV: 0.0 },
  insulated: { uC: 15.0, uV: 0.0 },
  semiIntegrated: { uC: 20.0, uV: 0.0 },
} as const;
