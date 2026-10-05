/**
 * End-to-end: pvkit modules compose into the same kWh as pvlib's manual chain.
 * Fixture: scripts/fixtures/pipeline.py. Each module stays independent — the
 * caller (this test) wires outputs to inputs, as a user would.
 */
import { expect, test } from "vitest";
import { absoluteAirmass } from "./models/atmosphere/absolute-airmass/index.ts";
import { alt2pres } from "./models/atmosphere/altitude-pressure/index.ts";
import { relativeAirmass } from "./models/atmosphere/relative-airmass/index.ts";
import { ineichen } from "./models/clearsky/ineichen/index.ts";
import { extraRadiation } from "./models/irradiance/extra-radiation/index.ts";
import { totalIrradiance } from "./models/irradiance/total-irradiance/index.ts";
import { energyKwh } from "./models/pvsystem/energy-kwh/index.ts";
import { pvwattsDc } from "./models/pvsystem/pvwatts-dc/index.ts";
import { pvwattsInverter } from "./models/pvsystem/pvwatts-inverter/index.ts";
import { spa } from "./models/solarposition/spa/index.ts";
import { SAPM_TEMPERATURE_PARAMETERS, sapmCell } from "./models/temperature/sapm/index.ts";
import fixture from "./pipeline-fixtures.json" with { type: "json" };

const p = fixture.params;

const step = (timeMs: number) => {
  const sun = spa({
    timeMs,
    latitude: p.latitude,
    longitude: p.longitude,
    altitude: p.altitude,
    deltaT: 67,
  });
  const airmassRel = relativeAirmass({ solarZenith: sun.apparentZenith });
  const airmassAbs = absoluteAirmass({
    airmassRelative: airmassRel,
    pressure: alt2pres({ altitude: p.altitude }),
  });
  const dniExtra = extraRadiation({ timeMs });
  const cs = ineichen({
    apparentZenith: sun.apparentZenith,
    airmassAbsolute: airmassAbs,
    linkeTurbidity: p.linkeTurbidity,
    altitude: p.altitude,
    dniExtra,
  });
  const poa = totalIrradiance({
    surfaceTilt: p.surfaceTilt,
    surfaceAzimuth: p.surfaceAzimuth,
    solarZenith: sun.apparentZenith,
    solarAzimuth: sun.azimuth,
    ...cs,
    albedo: p.albedo,
    model: "perez",
    dniExtra,
    airmassRelative: airmassRel,
  });
  const tempCell = sapmCell({
    poaGlobal: poa.poaGlobal,
    tempAir: p.tempAir,
    windSpeed: p.windSpeed,
    ...SAPM_TEMPERATURE_PARAMETERS.openRackGlassGlass,
  });
  const pdc = pvwattsDc({
    effectiveIrradiance: poa.poaGlobal,
    tempCell,
    pdc0: p.pdc0,
    gammaPdc: p.gammaPdc,
  });
  const pac = pvwattsInverter({ pdc, pdc0: p.inverterPdc0, etaInvNom: p.etaInvNom });
  return { poaGlobal: poa.poaGlobal, tempCell, pac };
};

test("sun position → POA → cell temp → AC matches pvlib at every step", () => {
  let worst = 0;
  for (const s of fixture.steps) {
    const got = step(s.timeMs);
    for (const k of ["poaGlobal", "tempCell", "pac"] as const) {
      worst = Math.max(worst, Math.abs(got[k] - s[k]) / Math.max(1, Math.abs(s[k])));
    }
  }
  // Chain of 1e-9…1e-12 per-module tolerances; observed ~4e-14.
  expect(worst).toBeLessThan(1e-9);
});

test("energy total matches pvlib", () => {
  const pac = fixture.steps.map((s) => step(s.timeMs).pac);
  expect(
    Math.abs(energyKwh({ power: pac, stepHours: p.stepMinutes / 60 }) - fixture.energyKwh),
  ).toBeLessThan(1e-9);
});
