import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/models/solarposition/index.ts",
    "src/models/clearsky/index.ts",
    "src/models/irradiance/index.ts",
    "src/models/temperature/index.ts",
    "src/models/pvsystem/index.ts",
  ],
  format: ["esm"],
  dts: true,
  clean: true,
  treeshake: true,
  outDir: "dist",
});
