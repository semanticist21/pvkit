import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/units.ts",
    "src/models/**/*.ts",
    "!src/models/**/*.test.ts",
    "!src/models/**/*.bench.ts",
    "!src/models/**/testing.ts",
  ],
  format: ["esm"],
  dts: { sourcemap: false }, // no .d.ts.map: they point at src/, which is not published
  clean: true,
  treeshake: true,
  hash: false,
  fixedExtension: false, // keep .js/.d.ts (tsdown ≥0.15 defaults to .mjs on node)
  outDir: "dist",
  // tsdown owns the package.json `exports` map (generated from the entry glob on
  // every build). devExports → dev `exports` point at src, `publishConfig.exports`
  // mirror to dist. customExports normalizes the raw keys into the public surface:
  //   - pass through non-model entries (".", "./units", "./package.json")
  //   - keep ONLY entries whose target is a folder's `index` file → impl files
  //     (e.g. spa/spa.ts) stay private and never become a public subpath
  //   - strip the internal `models/` prefix (tsdown already collapses `/index`)
  // Net public shape: "pvkit-js/<module>" and "pvkit-js/<module>/<method>".
  // hash:false keeps the generated paths stable so package.json doesn't churn.
  exports: {
    devExports: true,
    customExports(exports) {
      const out = {};
      for (const [key, val] of Object.entries(exports)) {
        if (!key.startsWith("./models/")) {
          out[key] = val; // ., ./units, ./package.json
          continue;
        }
        if (!/\/index\.\w+$/.test(val)) continue; // drop impl files (e.g. spa/spa)
        out[key.replace(/^\.\/models\//, "./")] = val;
      }
      return out;
    },
  },
});
