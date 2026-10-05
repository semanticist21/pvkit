import { describe, expect, test } from "vitest";
import { sapmCell, sapmCellFromModule, sapmModule } from "./sapm.ts";
import fixtures from "./sapm-fixtures.json" with { type: "json" };
import { SAPM_TEMPERATURE_PARAMETERS } from "./sapm-parameters.ts";

/** °C. Justification in sapm.md → Reference. */
const TOLERANCE = 1e-12;

describe("sapm vs pvlib sapm_cell / sapm_module", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    expect(Math.abs(sapmCell(input) - expected.cell), "cell").toBeLessThan(TOLERANCE);
    expect(Math.abs(sapmModule(input) - expected.module), "module").toBeLessThan(TOLERANCE);
    const fromModule = sapmCellFromModule({ ...input, tempModule: expected.module });
    expect(Math.abs(fromModule - expected.cell), "cellFromModule").toBeLessThan(TOLERANCE);
  });
});

test("reproduces the pvlib docstring example (open rack glass/glass, 1000 W/m², 10 °C, calm)", () => {
  const params = SAPM_TEMPERATURE_PARAMETERS.openRackGlassGlass;
  const got = sapmCell({ poaGlobal: 1000, tempAir: 10, windSpeed: 0, ...params });
  expect(Math.abs(got - 44.11703066106086)).toBeLessThan(TOLERANCE);
});
