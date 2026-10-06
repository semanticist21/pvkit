import { readFileSync } from "node:fs";
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/*/index.ts"],
  format: ["esm"],
  dts: { sourcemap: false },
  clean: true,
  treeshake: true,
  hash: false,
  fixedExtension: false,
  outDir: "dist",
  // Data tables ship as `JSON.parse("…")`: as compact as the JSON and faster to parse than the
  // pretty-printed object literal rolldown emits for a JSON import by default.
  plugins: [
    {
      name: "data-json-parse",
      load(id) {
        if (!id.endsWith("-data.json")) return null;
        const json = JSON.stringify(JSON.parse(readFileSync(id, "utf8")));
        return { code: `export default JSON.parse(${JSON.stringify(json)});`, moduleType: "js" };
      },
    },
  ],
  // tsdown owns the package.json `exports` map (same as pvkit): one subpath per library.
  exports: { devExports: true },
});
