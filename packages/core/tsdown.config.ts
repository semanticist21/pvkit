import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/solarposition/index.ts",
    "src/irradiance/index.ts",
    "src/temperature/index.ts",
    "src/pvsystem/index.ts",
  ],
  format: ["esm"],
  dts: true,
  clean: true,
  treeshake: true,
  outDir: "dist",
});
