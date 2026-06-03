import { defineConfig } from "tsdown";

export default defineConfig({
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
  hash: false,
  outDir: "dist",
  // tsdown owns the package.json `exports` map (generated from the entry glob on
  // every build). devExports → dev `exports` point at src, `publishConfig.exports`
  // mirror to dist. customExports normalizes the raw keys into the public surface:
  //   - pass through non-model entries (".", "./units", "./package.json")
  //   - keep ONLY each folder's `index` entry → impl files (e.g. spa/spa.ts) stay
  //     private and never become a public subpath
  //   - strip the internal `models/` prefix and collapse the trailing `/index`
  // Net public shape: "@pvkit/core/<module>" and "@pvkit/core/<module>/<method>".
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
        if (!key.endsWith("/index")) continue; // drop impl files (e.g. spa/spa)
        out[key.replace(/^\.\/models\//, "./").replace(/\/index$/, "")] = val;
      }
      return out;
    },
  },
});
