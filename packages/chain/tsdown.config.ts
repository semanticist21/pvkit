import { defineConfig } from "tsdown";

// Mirrors packages/economics/tsdown.config.ts: public shape "@pvkit/chain/<method>".
export default defineConfig({
  entry: ["src/**/*.ts", "!src/**/*.test.ts"],
  format: ["esm"],
  dts: { sourcemap: false },
  clean: true,
  treeshake: true,
  hash: false,
  fixedExtension: false,
  outDir: "dist",
  exports: {
    devExports: true,
    customExports(exports) {
      const out = {};
      for (const [key, val] of Object.entries(exports)) {
        // keep ".", "./package.json" and each method folder's index; drop impl files
        if (key === "." || key === "./package.json" || /\/index\.\w+$/.test(val)) out[key] = val;
      }
      return out;
    },
  },
});
