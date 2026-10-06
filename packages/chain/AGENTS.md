# @pvkit/chain — agent notes

Package-only facts. Shared rules (fixtures, references, numerics, release) live in
`doc/conventions.md` and `doc/architecture.md`.

## Layout

- Same as `packages/economics`: `src/<method>/` with `index.ts`, `<method>.ts`,
  `<method>.md`, `<method>.test.ts`, `<method>-fixtures.json`; public subpath
  `@pvkit/chain/<method>`. `pnpm build` regenerates `package.json` exports — commit it.
- The one runtime dependency is `@pvkit/core` (`workspace:^`), imported only by
  per-method subpath so consumers' bundles keep core's tree-shaking. tsdown leaves it
  external.
- Fixtures: `scripts/fixtures/chain-model-chain.py` runs pvlib's real `ModelChain`.

## Decisions

- Scalar like core: one instant per call; series and energy are the caller's loop.
- One model set (pvlib `with_pvwatts`). Fixed tilt only; tracking, other DC/temperature
  models, spectral loss and Linke-turbidity lookup are out until asked for.
- Sun position refracts at the step's `tempAir`, matching ModelChain; the clear sky uses
  that same sun position.
