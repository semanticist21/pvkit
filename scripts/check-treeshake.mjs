// Tree-shaking guard: every public method entry in dist/ must only reach JS inside its own
// module folder (dist/models/<module>/) or the shared foundation (units, sum, runtime).
// A hit means a cross-module import slipped in and per-method imports pull extra code.
// Run after `pnpm build`: node scripts/check-treeshake.mjs
import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const pkgDir = resolve(import.meta.dirname, "../packages/core");
const { publishConfig } = JSON.parse(readFileSync(resolve(pkgDir, "package.json"), "utf8"));
const IMPORT = /(?:import|export)\s[^"']*?from\s*["'](\.[^"']+)["']|import\s*["'](\.[^"']+)["']/g;
const FOUNDATION = /^dist\/(units|sum|rolldown-runtime)[^/]*\.js$/;

const reach = (file, seen = new Set()) => {
  if (seen.has(file)) return seen;
  seen.add(file);
  for (const m of readFileSync(file, "utf8").matchAll(IMPORT)) {
    reach(resolve(dirname(file), m[1] ?? m[2]), seen);
  }
  return seen;
};

let bad = 0;
for (const [key, target] of Object.entries(publishConfig.exports)) {
  const mod = key.match(/^\.\/([^/]+)\/[^/]+$/)?.[1]; // method entries only
  if (!mod) continue;
  for (const file of reach(resolve(pkgDir, target))) {
    const rel = relative(pkgDir, file);
    if (!rel.startsWith(`dist/models/${mod}/`) && !FOUNDATION.test(rel)) {
      console.error(`${key} → ${rel}`);
      bad++;
    }
  }
}
if (bad) {
  console.error(`tree-shaking guard: ${bad} cross-module reach(es)`);
  process.exit(1);
}
console.log("tree-shaking guard ok");
