import { defineConfig } from "tsdown";

export default defineConfig({
  // Glob entry: every module's `index.ts` (subpath entry) + every per-method file
  // (`src/models/<module>/<method>.ts`). Adding a new calculation-method file needs
  // NO wiring here — it is picked up automatically. Tests/benches are excluded so
  // they never ship to `dist`.
  entry: [
    "src/index.ts",
    "src/units.ts",
    "src/models/**/*.ts",
    "!src/models/**/*.test.ts",
    "!src/models/**/*.bench.ts",
  ],
  format: ["esm"],
  dts: true,
  clean: true,
  treeshake: true,
  // Stable entry filenames: don't hash. publishConfig.exports points at fixed
  // paths (dist/models/<m>/index.{js,d.ts}); hashing the .d.ts entries (tsdown's
  // default) breaks those `types` paths. A library wants deterministic names.
  hash: false,
  outDir: "dist",
});
