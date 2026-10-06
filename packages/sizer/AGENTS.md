# @pvkit/sizer — agent notes

Package-only facts. Shared rules: `doc/conventions.md`, `doc/architecture.md`.

- Methods sit one level under `src/` (`src/<method>/`, same file set as core methods); public
  shape `@pvkit/sizer/<method>`. Root entry exports types only.
- Methods never import each other: `stringSize` takes `vocMax`/`vmpMin` already corrected
  (from `voltageAtTemperature` or `necVoltageCorrection`), as core models take other
  modules' outputs as inputs.
- Input field names match `@pvkit/spec` (`vdcMax`, `mpptLow`, `idcMax`, `imp`, `betaOc` → `beta`)
  so records spread in; no runtime dependency on spec.
- No library implements string sizing (pvlib has none; SAM's sizing helper is UI code), so
  fixtures evaluate the NEC 690.7 formulas/table in Python (`scripts/fixtures/sizer.py`)
  plus cited worked examples (`source` cases, asserted by the generator).
- Not here yet: cold-day Vmp vs `mpptHigh`, NEC 690.8 current / conductor sizing, multi-MPPT
  inverters, DC/AC ratio — add when a caller asks.
